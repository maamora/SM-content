package com.maamora.studio.service;

import com.maamora.studio.model.Product;
import org.apache.batik.transcoder.TranscoderInput;
import org.apache.batik.transcoder.TranscoderOutput;
import org.apache.batik.transcoder.image.PNGTranscoder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Local, deterministic product visual renderer. It creates an SVG campaign template
 * and rasterises it to PNG for the existing storage and export paths. No model or
 * external generation API is invoked.
 */
@Service
public class SvgTemplateRenderer {

    public byte[] render(Product product, int width, int height, String badge, String promo, String accent, String mood) {
        String safeAccent = color(accent, "#D9FF4A");
        String background = switch (mood == null ? "" : mood.toLowerCase()) {
            case "moss" -> "#183D33";
            case "ochre" -> "#5A2E1F";
            case "mint" -> "#153B38";
            case "eclipse" -> "#101018";
            default -> "#171A18";
        };
        String productName = text(product == null ? null : product.getName(), "Your product");
        String sellingPoint = text(product == null ? null : product.getSellingPoint(), "Made for your next campaign");
        String image = product == null ? "" : value(product.getImageUrl());
        String visual = image.isBlank()
                ? "<rect x=\"" + (width * .15) + "\" y=\"" + (height * .25) + "\" width=\"" + (width * .70) + "\" height=\"" + (height * .42) + "\" rx=\"36\" fill=\"#F5F1E8\" opacity=\".16\"/>"
                : "<image href=\"" + xml(image) + "\" x=\"" + (width * .15) + "\" y=\"" + (height * .21) + "\" width=\"" + (width * .70) + "\" height=\"" + (height * .48) + "\" preserveAspectRatio=\"xMidYMid meet\"/>";
        String svg = """
                <svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">
                  <rect width="100%%" height="100%%" fill="%s"/>
                  <circle cx="%d" cy="%d" r="%d" fill="%s" opacity=".16"/>
                  <rect x="%d" y="%d" width="%d" height="%d" rx="22" fill="%s"/>
                  <text x="%d" y="%d" fill="#111" font-family="Arial,sans-serif" font-size="%d" font-weight="700" letter-spacing="2">%s</text>
                  %s
                  <rect x="%d" y="%d" width="%d" height="%d" fill="#111" opacity=".76"/>
                  <text x="%d" y="%d" fill="#fff" font-family="Arial,sans-serif" font-size="%d" font-weight="700">%s</text>
                  <text x="%d" y="%d" fill="#E8E4DB" font-family="Arial,sans-serif" font-size="%d">%s</text>
                  <text x="%d" y="%d" fill="%s" font-family="Arial,sans-serif" font-size="%d" font-weight="700">%s</text>
                  <text x="%d" y="%d" fill="#E8E4DB" font-family="Arial,sans-serif" font-size="%d" letter-spacing="3">STUDIO / TEMPLATE COMPOSITION</text>
                </svg>
                """.formatted(width, height, width, height, background, width * 3 / 4, height / 4, width / 3, safeAccent,
                width / 12, height / 12, width / 3, height / 13, safeAccent,
                width / 12 + 24, height / 12 + height / 21, Math.max(18, width / 42), xml(text(badge, "PRODUCT VISUAL")),
                visual,
                0, (int) (height * .70), width, (int) (height * .30),
                width / 12, (int) (height * .78), Math.max(26, width / 21), xml(productName),
                width / 12, (int) (height * .84), Math.max(16, width / 47), xml(text(promo, sellingPoint)),
                width / 12, (int) (height * .90), safeAccent, Math.max(15, width / 53), xml(sellingPoint),
                width / 12, (int) (height * .96), Math.max(11, width / 75));
        try {
            PNGTranscoder transcoder = new PNGTranscoder();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            transcoder.transcode(new TranscoderInput(new ByteArrayInputStream(svg.getBytes(StandardCharsets.UTF_8))), new TranscoderOutput(out));
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Local SVG template rendering failed", e);
        }
    }

    private String text(String value, String fallback) { return value == null || value.isBlank() ? fallback : value.trim(); }
    private String value(String value) { return value == null ? "" : value.trim(); }
    private String color(String value, String fallback) { return value != null && value.matches("#[0-9a-fA-F]{6}") ? value : fallback; }
    private String xml(String value) { return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;"); }
}
