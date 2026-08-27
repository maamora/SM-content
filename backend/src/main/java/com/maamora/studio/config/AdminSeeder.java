package com.maamora.studio.config;

import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.Role;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates a default ADMIN account on every startup if the email doesn't
 * already exist. With H2 in-memory the DB is wiped on each restart, so
 * this runs every time — giving a predictable admin login without any
 * manual registration step.
 *
 * Runs at @Order(2), after BrandSeeder (@Order(1)) has ensured the shared
 * brand workspace already exists.
 *
 * The admin account is deliberately created with NO brand attached. It used
 * to be attached to whatever BrandSettingsService.getSharedBrand() resolved
 * to — in practice, one real customer's workspace — which meant the platform
 * admin quietly showed up as a "coworker" inside that brand's Settings →
 * Team list, and any brand cleanup (deleting/merging a brand) could drag the
 * admin account along with it. AuthService.login()/currentUser() both treat
 * a null brand as expected for ADMIN specifically, so this is safe.
 */
@Component
@RequiredArgsConstructor
@Order(2)
public class AdminSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@maamora.com}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(adminEmail)) {
            System.out.println("ℹ️  Admin account already exists: " + adminEmail);
            return;
        }

        User admin = User.builder()
                .name("Admin")
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .brand(null)
                .build();

        userRepository.save(admin);
        System.out.println("✅ Admin account created  →  email: " + adminEmail + "  password: " + adminPassword);
    }
}
