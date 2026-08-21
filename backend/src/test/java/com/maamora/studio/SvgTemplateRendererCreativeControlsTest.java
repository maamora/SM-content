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
}
