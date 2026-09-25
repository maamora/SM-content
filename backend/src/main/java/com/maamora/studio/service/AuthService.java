package com.maamora.studio.service;

import com.maamora.studio.dto.request.LoginRequest;
import com.maamora.studio.dto.request.RegisterRequest;
import com.maamora.studio.dto.response.AuthResponse;
import com.maamora.studio.dto.response.UserProfileResponse;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.BrandMembership;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.BrandRole;
import com.maamora.studio.model.enums.Role;
import com.maamora.studio.repository.BrandMembershipRepository;
import com.maamora.studio.repository.UserRepository;
import com.maamora.studio.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BrandSettingsService brandSettingsService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final BrandMembershipRepository brandMembershipRepository;

    /**
     * Every registration does exactly one of three things: creates a new
     * business brand (name + logo set at signup), joins an existing brand
     * via that brand's join code, or registers a personal profile with no
     * brand identity at all. See BrandSettingsService for why brand names
     * themselves aren't unique/reserved.
     *
     * An account can belong to more than one brand (see BrandMembership) —
     * so registering with an email that already has an account doesn't
     * reject outright anymore. If the password given matches that existing
     * account, this attaches the new/joined brand as an additional
     * membership on it instead of failing with "account already exists";
     * that's what makes "add a new brand to an account you already use
     * elsewhere" possible. A wrong password still fails, since that's the
     * only thing proving it's really the same person.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Honeypot: a real user never fills this in. Reject with the exact
        // same error a bot would get from a plausible-looking failure
        // elsewhere, so there's no observable difference that would teach it
        // to leave the field alone next time.
        if (request.getWebsite() != null && !request.getWebsite().isBlank()) {
            throw new UnauthorizedException("Registration failed. Please try again.");
        }

        String email = normalizeEmail(request.getEmail());
        boolean joining = request.getJoinCode() != null && !request.getJoinCode().isBlank();
        if (!request.isPersonal() && !joining && (request.getBrandName() == null || request.getBrandName().isBlank())) {
            throw new UnauthorizedException("Enter a brand name, choose a personal account, or enter a workspace code to join an existing brand.");
        }

        Optional<User> existingOpt = userRepository.findByEmailIgnoreCase(email);
        User existing = existingOpt.orElse(null);
        if (existing != null && !passwordEncoder.matches(request.getPassword(), existing.getPasswordHash())) {
            throw new UnauthorizedException(
                    "An account with this email already exists. Enter its password to add a new workspace to it.");
        }

        BrandSettings brand = request.isPersonal()
                ? brandSettingsService.createPersonalWorkspace(request.getName())
                : joining
                        ? brandSettingsService.joinExisting(request.getJoinCode(), email)
                        : brandSettingsService.createForNewUser(request.getBrandName(), request.getLogoUrl());

        // Creating your own brand (or a personal workspace) makes you its
        // OWNER; joining an existing one via code makes you a plain MEMBER.
        BrandRole brandRole = joining ? BrandRole.MEMBER : BrandRole.OWNER;

        User user;
        if (existing != null) {
            if (brandMembershipRepository.existsByUser_IdAndBrand_Id(existing.getId(), brand.getId())) {
                throw new UnauthorizedException("You're already part of that workspace — log in and switch to it instead.");
            }
            user = existing;
            // The brand/workspace just created or joined becomes this
            // session's active one, same as a brand-new account.
            user.setBrand(brand);
            user.setBrandRole(brandRole);
            userRepository.save(user);
        } else {
            user = User.builder()
                    .name(request.getName())
                    .email(email)
                    .passwordHash(passwordEncoder.encode(request.getPassword()))
                    .role(Role.USER)
                    .brand(brand)
                    .brandRole(brandRole)
                    .build();
            userRepository.save(user);
        }

        brandMembershipRepository.save(BrandMembership.builder().user(user).brand(brand).brandRole(brandRole).build());

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getEmail(), brand.getId(), user.getRole().name());
    }

    @Transactional
    public AuthResponse loginOrCreateGoogle(String email, String name) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail).orElseGet(() -> {
            // Deliberately no brand yet — a brand-new Google sign-up has never
            // chosen personal/create/join, so dropping them into an existing
            // customer's workspace (this used to call getSharedBrand(), which
            // resolves to whichever real brand has the most users — Labubu in
            // practice) would hand a total stranger real customer data. The
            // frontend checks for brandId == null after Google login and
            // routes to the onboarding chooser instead of the dashboard.
            User created = User.builder()
                    .name(name == null || name.isBlank() ? normalizedEmail : name)
                    .email(normalizedEmail)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.USER)
                    .brand(null)
                    .build();
            return userRepository.save(created);
        });

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        String brandId = user.getBrand() == null ? null : user.getBrand().getId();
        return new AuthResponse(token, user.getEmail(), brandId, user.getRole().name());
    }

    /**
     * An account can belong to several brands (BrandMembership is the real
     * roster now). The optional "brand name or code" field on the login form
     * is how a multi-brand account picks which one to open this session:
     *  - Zero or one membership: nothing to choose, that membership (if any)
     *    becomes active automatically — the field can be left blank.
     *  - Two or more memberships: the field becomes mandatory, and must
     *    match one of THIS account's own brands by name or join code.
     * The matched membership's brand/role gets written onto user.brand /
     * user.brandRole, which is what the rest of the app (products, brand
     * settings, member management, etc.) already reads as "the current
     * workspace" — none of that had to change.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        // ADMIN is the one deliberate exception: the platform admin isn't a
        // member of any customer's workspace, so it has no brand membership
        // at all rather than being forced to squat inside a real brand's
        // data (see AdminSeeder).
        if (user.getRole() != Role.ADMIN) {
            List<BrandMembership> memberships = brandMembershipRepository.findByUser_IdOrderByCreatedAtAsc(user.getId());

            if (memberships.isEmpty()) {
                // Legacy safety net — shouldn't happen once every account has
                // been backfilled (see BrandMembershipBackfillMigration), but
                // fall back to whatever user.brand already points at rather
                // than locking someone out over a missed backfill row.
                if (user.getBrand() == null) {
                    throw new UnauthorizedException("No brand configured for this account.");
                }
            } else if (memberships.size() == 1) {
                applyMembership(user, memberships.get(0));
                if (StringUtils.hasText(request.getBrandIdentifier())
                        && !matchesIdentifier(memberships.get(0), request.getBrandIdentifier())) {
                    throw new UnauthorizedException("That brand name or code doesn't match this account's workspace.");
                }
            } else {
                if (!StringUtils.hasText(request.getBrandIdentifier())) {
                    throw new UnauthorizedException(
                            "This account belongs to more than one workspace — enter the brand name or code of the one you want to open.");
                }
                BrandMembership match = memberships.stream()
                        .filter(m -> matchesIdentifier(m, request.getBrandIdentifier()))
                        .findFirst()
                        .orElseThrow(() -> new UnauthorizedException(
                                "That brand name or code doesn't match any workspace this account belongs to."));
                applyMembership(user, match);
            }
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        String brandId = user.getBrand() == null ? null : user.getBrand().getId();
        return new AuthResponse(token, user.getEmail(), brandId, user.getRole().name());
    }

    private boolean matchesIdentifier(BrandMembership membership, String rawIdentifier) {
        String identifier = rawIdentifier.trim();
        return identifier.equalsIgnoreCase(membership.getBrand().getName())
                || identifier.equalsIgnoreCase(membership.getBrand().getJoinCode());
    }

    private void applyMembership(User user, BrandMembership membership) {
        user.setBrand(membership.getBrand());
        user.setBrandRole(membership.getBrandRole());
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse currentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated account was not found."));
        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getBrand() == null ? null : user.getBrand().getId(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
