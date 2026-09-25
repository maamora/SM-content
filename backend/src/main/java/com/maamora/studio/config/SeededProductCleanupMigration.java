package com.maamora.studio.config;

import com.maamora.studio.model.Product;
import com.maamora.studio.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * One-time cleanup for the demo catalogue ProductSeeder used to drop into
 * every new brand (see ProductSeeder — now gutted so this can't happen
 * again). Every seeded product's image came from the same picsum.photos
 * "maamora-<slug>" seed URLs (shoes/mat/earbuds/bottle/backpack), which no
 * real product a person actually adds could ever coincidentally match — so
 * matching on that image URL prefix is a safe, precise way to remove exactly
 * the placeholder rows and nothing a real user uploaded, across every brand
 * this ever happened to, not just the one open when this shipped.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(3)
public class SeededProductCleanupMigration implements ApplicationRunner {

    private static final String SEED_IMAGE_PREFIX = "https://picsum.photos/seed/maamora-";

    private final ProductRepository productRepository;

    @Override
    public void run(ApplicationArguments args) {
        List<Product> seeded = productRepository.findByImageUrlStartingWith(SEED_IMAGE_PREFIX);
        if (seeded.isEmpty()) {
            return;
        }
        productRepository.deleteAll(seeded);
        log.info("Removed {} leftover demo product(s) seeded into brand catalogues before this was disabled.", seeded.size());
    }
}
