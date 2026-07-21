package com.maamora.studio.service;

import com.maamora.studio.config.ProductSeeder;
import com.maamora.studio.dto.request.LoginRequest;
import com.maamora.studio.dto.request.RegisterRequest;
import com.maamora.studio.dto.response.AuthResponse;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.Role;
import com.maamora.studio.repository.BrandSettingsRepository;
import com.maamora.studio.repository.UserRepository;
import com.maamora.studio.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BrandSettingsRepository brandSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ProductSeeder productSeeder;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UnauthorizedException("An account with this email already exists.");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();
        userRepository.save(user);

        BrandSettings brand = BrandSettings.builder()
                .user(user)
                .name(request.getBrandName())
                .build();
        brandSettingsRepository.save(brand);
        productSeeder.seedFor(brand);

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getEmail(), brand.getId(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        BrandSettings brand = brandSettingsRepository.findByUserId(user.getId())
                .orElseThrow(() -> new UnauthorizedException("No brand configured for this account."));

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(token, user.getEmail(), brand.getId(), user.getRole().name());
    }
}
