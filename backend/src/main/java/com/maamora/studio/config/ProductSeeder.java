package com.maamora.studio.config;

import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Product;
import com.maamora.studio.model.enums.ProductStatus;
import com.maamora.studio.repository.BrandSettingsRepository;
import com.maamora.studio.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Drops a handful of ready-to-use demo products into any brand that doesn't
 * have any yet, so the Content Studio has something to work with immediately
 * after registering — no manual data entry required. Runs once at startup for
 * existing brands, and is also called directly from AuthService right after a
 * new brand is created so future signups get the same head start.
 */
@Component
@RequiredArgsConstructor
public class ProductSeeder implements ApplicationRunner {

    private final BrandSettingsRepository brandSettingsRepository;
    private final ProductRepository productRepository;

    private record SampleProduct(String name, String description, String sellingPoint, double price, String imageUrl) {}

    private static final List<SampleProduct> SAMPLES = List.of(
            new SampleProduct(
                    "Classic Running Shoes",
                    "Lightweight running shoes built for daily training, with a breathable mesh upper and a responsive cushioned sole.",
                    "Ultra-breathable mesh, reinforced heel support",
                    349.0,
                    "https://picsum.photos/seed/maamora-shoes/800/800"
            ),
            new SampleProduct(
                    "Performance Yoga Mat",
                    "A 6mm non-slip yoga mat with printed alignment guides, ideal for yoga, Pilates, and home workouts.",
                    "Non-slip, eco-friendly material with carry strap",
                    199.0,
                    "https://picsum.photos/seed/maamora-mat/800/800"
            ),
            new SampleProduct(
                    "Wireless Sport Earbuds",
                    "Sweat and splash resistant wireless earbuds with deep bass and up to 32 hours of battery life with the charging case.",
                    "32-hour battery life, IPX5 water resistance",
                    449.0,
                    "https://picsum.photos/seed/maamora-earbuds/800/800"
            ),
            new SampleProduct(
                    "Insulated Water Bottle",
                    "Double-wall stainless steel bottle that keeps drinks cold for 24 hours or hot for 12, perfect for daily workouts.",
                    "Keeps drinks cold 24h / hot 12h",
                    129.0,
                    "https://picsum.photos/seed/maamora-bottle/800/800"
            ),
            new SampleProduct(
                    "Everyday Sport Backpack",
                    "A durable, water-resistant backpack with a padded laptop sleeve and a dedicated shoe compartment.",
                    "Water-resistant, padded laptop compartment",
                    299.0,
                    "https://picsum.photos/seed/maamora-backpack/800/800"
            )
    );

    @Override
    public void run(ApplicationArguments args) {
        brandSettingsRepository.findAll().forEach(this::seedFor);
    }

    /** Adds the sample catalogue to a brand, but only if it has no products yet. */
    public void seedFor(BrandSettings brand) {
        if (!productRepository.findByBrandId(brand.getId()).isEmpty()) return;

        for (SampleProduct sample : SAMPLES) {
            productRepository.save(Product.builder()
                    .brand(brand)
                    .name(sample.name())
                    .description(sample.description())
                    .sellingPoint(sample.sellingPoint())
                    .price(sample.price())
                    .imageUrl(sample.imageUrl())
                    .status(ProductStatus.APPROVED)
                    .build());
        }
    }
}
