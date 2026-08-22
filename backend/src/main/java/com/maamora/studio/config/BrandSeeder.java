package com.maamora.studio.config;

import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.repository.BrandSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Preserves the bootstrap ordering of historical deployments. New workspaces
 * are now created per account by AuthService and AdminSeeder, so this runner
 * intentionally does not introduce a default brand identity.
 */
@Component
@RequiredArgsConstructor
@Order(1)
public class BrandSeeder implements ApplicationRunner {

    private final BrandSettingsRepository brandSettingsRepository;

    @Override
    public void run(ApplicationArguments args) {
        // Existing brands remain untouched. New accounts receive their own neutral row.
    }
}
