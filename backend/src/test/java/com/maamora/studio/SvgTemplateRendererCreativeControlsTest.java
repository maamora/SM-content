package com.maamora.studio;

import com.maamora.studio.model.Product;
import com.maamora.studio.service.SvgTemplateRenderer;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Base64;

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

    @Test
    void rendersStandardRasterAndSvgAssetFormatsWithSvg11ImageReferences() throws Exception {
        String png = rasterDataUrl("png", new Color(51, 102, 204));
        String jpeg = rasterDataUrl("jpeg", new Color(214, 112, 73));
        String gif = rasterDataUrl("gif", new Color(62, 150, 105));
        String svg = "data:image/svg+xml;base64," + Base64.getEncoder().encodeToString("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\"><rect width=\"16\" height=\"16\" fill=\"#D9FF4A\"/></svg>".getBytes());
        String webp = webpDataUrl();

        for (String asset : new String[] {png, jpeg, gif, svg, webp}) {
            for (int[] format : new int[][] {{1080, 1080}, {768, 1344}}) {
                Product product = Product.builder().name("Format asset").imageUrl(asset).build();
                byte[] output = renderer.render(product, format[0], format[1], "FORMAT", "Standard asset", "#D9FF4A", "moss",
                        "Format brand", asset, true, "TOP_RIGHT", "Format test", "Raster and vector input", "DISCOVER", "BOLD", "CENTER", "LEFT");
                assertThat(output).startsWith((byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47);
            }
        }
    }

    private String rasterDataUrl(String format, Color color) throws Exception {
        BufferedImage image = new BufferedImage(16, 16, BufferedImage.TYPE_INT_RGB);
        for (int x = 0; x < image.getWidth(); x++) {
            for (int y = 0; y < image.getHeight(); y++) image.setRGB(x, y, color.getRGB());
        }
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        assertThat(ImageIO.write(image, format, bytes)).isTrue();
        return "data:image/" + format + ";base64," + Base64.getEncoder().encodeToString(bytes.toByteArray());
    }

    private String webpDataUrl() throws Exception {
        try (InputStream stream = getClass().getResourceAsStream("/fixtures/renderer-sample.webp")) {
            assertThat(stream).isNotNull();
            return "data:image/webp;base64," + Base64.getEncoder().encodeToString(stream.readAllBytes());
        }
    }
}
