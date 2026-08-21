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
<<<<<<< HEAD
        // Honeypot: a real user never fills this in. Reject with the exact
        // same error a bot would get from a plausible-looking failure
        // elsewhere, so there's no observable difference that would teach it
        // to leave the field alone next time.
        if (request.getWebsite() != null && !request.getWebsite().isBlank()) {
            throw new UnauthorizedException("Registration failed. Please try again.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
=======
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(email)) {
>>>>>>> 0aaa1cfa406c946d0887dbeaa5c9c2676e5da0aa
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
            BrandSettings brand = brandSettingsService.getSharedBrand();
            User created = User.builder()
                    .name(name == null || name.isBlank() ? normalizedEmail : name)
                    .email(normalizedEmail)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.USER)
                    .brand(brand)
                    .build();
            return userRepository.save(created);
        });

        if (user.getBrand() == null) user.setBrand(brandSettingsService.getSharedBrand());
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getBrand().getId(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (user.getBrand() == null) {
            throw new UnauthorizedException("No brand configured for this account.");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getBrand().getId(), user.getRole().name());
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
