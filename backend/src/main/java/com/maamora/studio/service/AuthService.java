package com.maamora.studio.service;

import com.maamora.studio.dto.request.LoginRequest;
import com.maamora.studio.dto.request.RegisterRequest;
import com.maamora.studio.dto.response.AuthResponse;
import com.maamora.studio.dto.response.UserProfileResponse;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.Role;
import com.maamora.studio.repository.UserRepository;
import com.maamora.studio.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BrandSettingsService brandSettingsService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Every new account does exactly one of three things: creates its own
     * business brand (name + logo set at signup), joins an existing brand
     * via that brand's join code, or registers a personal profile with no
     * brand identity at all. See BrandSettingsService for why brand names
     * themselves aren't unique/reserved.
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
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new UnauthorizedException("An account with this email already exists.");
        }

        boolean joining = request.getJoinCode() != null && !request.getJoinCode().isBlank();
        if (!request.isPersonal() && !joining && (request.getBrandName() == null || request.getBrandName().isBlank())) {
            throw new UnauthorizedException("Enter a brand name, choose a personal account, or enter a workspace code to join an existing brand.");
        }

        BrandSettings brand = request.isPersonal()
                ? brandSettingsService.createPersonalWorkspace(request.getName())
                : joining
                        ? brandSettingsService.joinExisting(request.getJoinCode())
                        : brandSettingsService.createForNewUser(request.getBrandName(), request.getLogoUrl());

        User user = User.builder()
                .name(request.getName())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .brand(brand)
                .build();
        userRepository.save(user);

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

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        // Regular accounts always have a brand (own workspace, joined
        // workspace, or personal profile — see register()). ADMIN is the one
        // deliberate exception: the platform admin isn't a member of any
        // customer's workspace, so it has no brand at all rather than being
        // forced to squat inside a real brand's data (see AdminSeeder).
        if (user.getBrand() == null && user.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("No brand configured for this account.");
        }

        // Optional third field on the login form: a brand name or join code.
        // It doesn't pick between brands (this account only ever has one at
        // a time — see BrandInvitationService for how switching works), it's
        // a sanity check that you're signing into the workspace you think
        // you are. Left blank, this is skipped entirely and login behaves as
        // it always has.
        if (StringUtils.hasText(request.getBrandIdentifier())) {
            if (user.getBrand() == null) {
                throw new UnauthorizedException("This account isn't part of any brand yet — leave the brand field blank.");
            }
            String identifier = request.getBrandIdentifier().trim();
            boolean matchesName = identifier.equalsIgnoreCase(user.getBrand().getName());
            boolean matchesCode = identifier.equalsIgnoreCase(user.getBrand().getJoinCode());
            if (!matchesName && !matchesCode) {
                throw new UnauthorizedException("That brand name or code doesn't match this account's workspace.");
            }
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        String brandId = user.getBrand() == null ? null : user.getBrand().getId();
        return new AuthResponse(token, user.getEmail(), brandId, user.getRole().name());
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
