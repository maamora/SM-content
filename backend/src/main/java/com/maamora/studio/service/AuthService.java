package com.maamora.studio.service;

import com.maamora.studio.dto.request.LoginRequest;
import com.maamora.studio.dto.request.RegisterRequest;
import com.maamora.studio.dto.response.AuthResponse;
import com.maamora.studio.dto.response.UserProfileResponse;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.Role;
import com.maamora.studio.config.ProductSeeder;
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
    private final ProductSeeder productSeeder;

    /** Each account begins with its own neutral workspace and starter test catalogue. */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new UnauthorizedException("An account with this email already exists.");
        }

        BrandSettings brand = brandSettingsService.createNeutralBrand();

        User user = User.builder()
                .name(request.getName())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .brand(brand)
                .build();
        userRepository.save(user);
        productSeeder.seedFor(brand);

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getEmail(), brand.getId(), user.getRole().name());
    }

    @Transactional
    public AuthResponse loginOrCreateGoogle(String email, String name) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail).orElseGet(() -> {
            BrandSettings brand = brandSettingsService.createNeutralBrand();
            User created = User.builder()
                    .name(name == null || name.isBlank() ? normalizedEmail : name)
                    .email(normalizedEmail)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.USER)
                    .brand(brand)
                    .build();
            User saved = userRepository.save(created);
            productSeeder.seedFor(brand);
            return saved;
        });

        if (user.getBrand() == null) {
            user.setBrand(brandSettingsService.createNeutralBrand());
            userRepository.save(user);
        }
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
            user.setBrand(brandSettingsService.createNeutralBrand());
            userRepository.save(user);
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
