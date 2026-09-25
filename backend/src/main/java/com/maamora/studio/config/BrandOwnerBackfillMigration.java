package com.maamora.studio.config;

import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.BrandRole;
import com.maamora.studio.repository.BrandSettingsRepository;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * One-time backfill for brands whose owner role never got set.
 *
 * The `brandRole` column was added after brands already existed, and every
 * User row defaults to MEMBER (see User.brandRole's default). That default
 * silently applied to everyone already in the database when the column
 * landed — including whoever originally created each brand — so every brand
 * ended up with zero OWNERs and a workspace full of "members" with no one
 * able to promote/kick/ban/delete the brand.
 *
 * We can't recover who literally clicked "create brand," because that fact
 * was never stored anywhere. But it doesn't need to be guessed: joining a
 * brand (via its join code) is only possible once that brand already exists,
 * so the earliest-registered account in each brand is always the one that
 * created it. This promotes that person to OWNER on every boot, but only for
 * brands that currently have no OWNER at all — a brand that already has one
 * (set correctly, e.g. by BrandSettingsService going forward, or already
 * fixed by a previous run of this migration) is left untouched.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(1)
public class BrandOwnerBackfillMigration implements ApplicationRunner {

    private final BrandSettingsRepository brandSettingsRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<BrandSettings> brands = brandSettingsRepository.findAll();
        int fixed = 0;

        for (BrandSettings brand : brands) {
            List<User> members = userRepository.findByBrand_IdOrderByCreatedAtAsc(brand.getId());
            if (members.isEmpty()) {
                continue;
            }
            boolean hasOwner = members.stream().anyMatch(m -> m.getBrandRole() == BrandRole.OWNER);
            if (hasOwner) {
                continue;
            }
            User original = members.get(0);
            original.setBrandRole(BrandRole.OWNER);
            userRepository.save(original);
            fixed++;
            log.info("Backfilled missing owner for brand '{}': set {} ({}) as OWNER.",
                    brand.getName(), original.getName(), original.getEmail());
        }

        if (fixed > 0) {
            log.info("Brand-owner backfill complete: {} brand(s) fixed.", fixed);
        }
    }
}
