package com.maamora.studio.config;

import com.maamora.studio.service.BrandSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Ensures the original "Maamora" brand exists before anything else runs.
 * Regular users now create their own brand at registration (see
 * AuthService.register), but the seeded ADMIN account (AdminSeeder) still
 * needs a brand to attach to, and TemplateSeeder/ProductSeeder need
 * somewhere to attach their starter data. Runs first (@Order(1)) so those
 * seeders always have a brand to attach to.
 *
 * Also backfills a join code onto any brand row that predates join codes
 * (ensureSeedBrand handles this) — without it, a database that already had
 * a "Maamora" row before this feature shipped would be stuck with a
 * code-less, permanently unjoinable brand.
 */
@Component
@RequiredArgsConstructor
@Order(1)
public class BrandSeeder implements ApplicationRunner {

    private final BrandSettingsService brandSettingsService;

    @Override
    public void run(ApplicationArguments args) {
        brandSettingsService.ensureSeedBrand("Maamora", "#f97316");
    }
}
