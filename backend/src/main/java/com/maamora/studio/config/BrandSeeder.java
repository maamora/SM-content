package com.maamora.studio.config;

import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.repository.BrandSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Ensures the single, shared Maamora workspace exists before anything else
 * runs. Every registered user (USER or ADMIN) joins this one brand — there is
 * no per-user workspace anymore, so the whole team shares one product
 * catalogue and one set of templates. Runs first (@Order(1)) so
 * TemplateSeeder and ProductSeeder always have a brand to attach to.
 */
@Component
@RequiredArgsConstructor
@Order(1)
public class BrandSeeder implements ApplicationRunner {

    private final BrandSettingsRepository brandSettingsRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (!brandSettingsRepository.findAll().isEmpty()) return;

        brandSettingsRepository.save(BrandSettings.builder()
                .name("Maamora")
                .primaryColor("#f97316")
                .build());
    }
}
