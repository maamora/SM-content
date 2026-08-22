package com.maamora.studio;

import com.maamora.studio.model.Product;
import com.maamora.studio.service.SvgTemplateRenderer;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SvgTemplateRendererCreativeControlsTest {

    private final SvgTemplateRenderer renderer = new SvgTemplateRenderer();

    @Test
    void producesDistinctLocalCompositionsForCreativeAdvertisingControls() {
        Product product = Product.builder()
                .name("Arc Runner")
                .sellingPoint("Engineered for the final kilometre")
                .build();

        byte[] impact = renderer.render(product, 512, 512, "NEW", "MOVE WITH PURPOSE", "#C6FF5E", "moss",
                "ARC", null, true, "TOP_RIGHT", "ARC RUNNER", "Lightweight support for everyday distance.",
                "SHOP THE DROP", "BOLD", "CENTER", "LEFT");
        byte[] catalogue = renderer.render(product, 512, 512, "NEW", "MOVE WITH PURPOSE", "#C6FF5E", "moss",
                "ARC", null, true, "BOTTOM_LEFT", "ARC RUNNER", "Lightweight support for everyday distance.",
                "SHOP THE DROP", "CATALOG", "FLOATING", "CENTER");

        assertThat(impact).startsWith((byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47);
        assertThat(catalogue).startsWith((byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47);
        assertThat(catalogue).isNotEqualTo(impact);
    }

    @Test
    void fallsBackToADeterministicCompositionWhenAProductOrBrandAssetCannotBeLoaded() {
        Product product = Product.builder()
                .name("Offline-ready pack")
                .imageUrl("http://127.0.0.1:1/unavailable-product.png")
                .build();

        byte[] square = renderer.render(product, 1080, 1080, "TEST", "An offline-safe visual", "#C6FF5E", "moss",
                "Testing brand", "http://127.0.0.1:1/unavailable-brand.png", true, "TOP_RIGHT",
                "Campaign headline", "Supporting message", "DISCOVER", "POSTER", "CLOSE_UP", "LEFT");
        byte[] story = renderer.render(product, 768, 1344, "TEST", "An offline-safe visual", "#C6FF5E", "moss",
                "Testing brand", "http://127.0.0.1:1/unavailable-brand.png", true, "BOTTOM_LEFT",
                "Campaign headline", "Supporting message", "DISCOVER", "CATALOG", "WIDE", "CENTER");

        assertThat(square).startsWith((byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47);
        assertThat(story).startsWith((byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47);
        assertThat(story).isNotEqualTo(square);
    }
}
