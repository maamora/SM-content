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
        return render(product, width, height, badge, promo, accent, mood, null, null, false);
    }

    public byte[] render(Product product, int width, int height, String badge, String promo, String accent, String mood,
                         String brandName, String logoUrl, boolean includeBrandLogo) {
        return render(product, width, height, badge, promo, accent, mood, brandName, logoUrl, includeBrandLogo, "TOP_RIGHT");
    }

    public byte[] render(Product product, int width, int height, String badge, String promo, String accent, String mood,
                         String brandName, String logoUrl, boolean includeBrandLogo, String brandLogoPlacement) {
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
        BrandFrame brandFrame = brandFrame(brandLogoPlacement, width, height);
        String brandMark = !includeBrandLogo ? "" : hasHttpUrl(logoUrl)
                ? "<g><rect x=\"" + brandFrame.x() + "\" y=\"" + brandFrame.y() + "\" width=\"" + brandFrame.width() + "\" height=\"" + brandFrame.height() + "\" rx=\"16\" fill=\"#F5F1E8\" opacity=\".90\"/><image href=\"" + xml(logoUrl.trim()) + "\" x=\"" + (brandFrame.x() + brandFrame.padding()) + "\" y=\"" + (brandFrame.y() + brandFrame.padding()) + "\" width=\"" + (brandFrame.width() - brandFrame.padding() * 2) + "\" height=\"" + (brandFrame.height() - brandFrame.padding() * 2) + "\" preserveAspectRatio=\"xMidYMid meet\"/></g>"
                : value(brandName).isBlank() ? ""
                : "<g><rect x=\"" + brandFrame.x() + "\" y=\"" + brandFrame.y() + "\" width=\"" + brandFrame.width() + "\" height=\"" + brandFrame.height() + "\" rx=\"16\" fill=\"#F5F1E8\" opacity=\".90\"/><text x=\"" + (brandFrame.x() + brandFrame.width() / 2) + "\" y=\"" + (brandFrame.y() + brandFrame.height() / 2 + Math.max(12, width / 90)) + "\" text-anchor=\"middle\" fill=\"#11120F\" font-family=\"Arial,sans-serif\" font-size=\"" + Math.max(12, width / 65) + "\" font-weight=\"700\" letter-spacing=\"2\">" + xml(brandName.trim()) + "</text></g>";
        String svg = """
                <svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">
                  <rect width="100%%" height="100%%" fill="%s"/>
                  <circle cx="%d" cy="%d" r="%d" fill="%s" opacity=".16"/>
                  <rect x="%d" y="%d" width="%d" height="%d" rx="22" fill="%s"/>
                  <text x="%d" y="%d" fill="#111" font-family="Arial,sans-serif" font-size="%d" font-weight="700" letter-spacing="2">%s</text>
                  %s
                  %s
                  <rect x="%d" y="%d" width="%d" height="%d" fill="#111" opacity=".76"/>
                  <text x="%d" y="%d" fill="#fff" font-family="Arial,sans-serif" font-size="%d" font-weight="700">%s</text>
                  <text x="%d" y="%d" fill="#E8E4DB" font-family="Arial,sans-serif" font-size="%d">%s</text>
                  <text x="%d" y="%d" fill="%s" font-family="Arial,sans-serif" font-size="%d" font-weight="700">%s</text>
                  <text x="%d" y="%d" fill="#E8E4DB" font-family="Arial,sans-serif" font-size="%d" letter-spacing="3">LOCAL TEMPLATE COMPOSITION</text>
                </svg>
                """.formatted(width, height, width, height, background, width * 3 / 4, height / 4, width / 3, safeAccent,
                width / 12, height / 12, width / 3, height / 13, safeAccent,
                width / 12 + 24, height / 12 + height / 21, Math.max(18, width / 42), xml(text(badge, "PRODUCT VISUAL")),
                brandMark,
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
    private boolean hasHttpUrl(String value) { return value != null && value.trim().matches("https?://.+"); }
    private String xml(String value) { return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;"); }

    private BrandFrame brandFrame(String placement, int width, int height) {
        int frameWidth = Math.max(150, (int) (width * .19));
        int frameHeight = Math.max(56, (int) (height * .09));
        int padding = Math.max(8, width / 100);
        int margin = Math.max(28, width / 18);
        int top = Math.max(28, height / 20);
        int lower = (int) (height * .58);
        return switch (placement == null ? "TOP_RIGHT" : placement.trim().toUpperCase()) {
            case "TOP_LEFT" -> new BrandFrame(margin, Math.max((int) (height * .17), top), frameWidth, frameHeight, padding);
            case "BOTTOM_LEFT" -> new BrandFrame(margin, lower, frameWidth, frameHeight, padding);
            case "BOTTOM_RIGHT" -> new BrandFrame(width - margin - frameWidth, lower, frameWidth, frameHeight, padding);
            default -> new BrandFrame(width - margin - frameWidth, top, frameWidth, frameHeight, padding);
        };
    }

    private record BrandFrame(int x, int y, int width, int height, int padding) { }
}
