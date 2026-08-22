package com.maamora.studio.service;

import com.maamora.studio.dto.request.CreateEmailDeliveryRequest;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.PasswordResetToken;
import com.maamora.studio.model.User;
import com.maamora.studio.repository.PasswordResetTokenRepository;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PasswordRecoveryService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmtpDeliveryService smtpDeliveryService;

    @Value("${app.google.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    /**
     * Always completes with the same response to avoid disclosing whether an
     * account exists. For existing accounts, only the most recent recovery link
     * remains usable and it expires after 30 minutes.
     */
    @Transactional
    public void requestReset(String rawEmail) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase(Locale.ROOT);
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            tokenRepository.findAllByUserIdAndUsedAtIsNull(user.getId())
                    .forEach(previous -> previous.setUsedAt(Instant.now()));

            String rawToken = newToken();
            tokenRepository.save(PasswordResetToken.builder()
                    .user(user)
                    .tokenHash(hash(rawToken))
                    .expiresAt(Instant.now().plus(30, ChronoUnit.MINUTES))
                    .build());

            String resetUrl = frontendUrl.replaceAll("/+$", "") + "/reset-password?token=" + rawToken;
            String body = "A password reset was requested for your STUDIO workspace.\n\n"
                    + "Set a new password within 30 minutes:\n" + resetUrl + "\n\n"
                    + "If you did not request this, you can safely ignore this email.";
            smtpDeliveryService.queue(user.getId(), new CreateEmailDeliveryRequest(
                    user.getEmail(), "STUDIO / Reset your password", body, null));
        });
    }

    @Transactional
    public void resetPassword(String rawToken, String password) {
        PasswordResetToken token = tokenRepository.findByTokenHashAndUsedAtIsNull(hash(rawToken))
                .orElseThrow(() -> new UnauthorizedException("This reset link is invalid or has already been used."));
        if (!token.getExpiresAt().isAfter(Instant.now())) {
            token.setUsedAt(Instant.now());
            tokenRepository.save(token);
            throw new UnauthorizedException("This reset link has expired. Request a new one to continue." );
        }
        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(password));
        userRepository.save(user);
        token.setUsedAt(Instant.now());
        tokenRepository.save(token);
    }

    private String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String value) {
        try {
            return Base64.getUrlEncoder().withoutPadding().encodeToString(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Password recovery could not securely process the reset token.", exception);
        }
    }
}
