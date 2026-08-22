package com.maamora.studio.service;

import com.maamora.studio.model.Product;
import org.apache.batik.transcoder.TranscoderInput;
import org.apache.batik.transcoder.TranscoderOutput;
import org.apache.batik.transcoder.image.PNGTranscoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Local, deterministic product visual renderer. Every studio control maps to a
 * visible SVG treatment; no external model or image-generation API is called.
 */
@Service
public class SvgTemplateRenderer {

    private static final Logger log = LoggerFactory.getLogger(SvgTemplateRenderer.class);
    private static final int MAX_EMBEDDED_IMAGE_BYTES = 5 * 1024 * 1024;

    public byte[] render(Product product, int width, int height, String badge, String promo, String accent, String mood) {
        return render(product, width, height, badge, promo, accent, mood, null, null, false);
    }

    public byte[] render(Product product, int width, int height, String badge, String promo, String accent, String mood,
                         String brandName, String logoUrl, boolean includeBrandLogo) {
        return render(product, width, height, badge, promo, accent, mood, brandName, logoUrl, includeBrandLogo, "TOP_RIGHT");
    }

    public byte[] render(Product product, int width, int height, String badge, String promo, String accent, String mood,
                         String brandName, String logoUrl, boolean includeBrandLogo, String brandLogoPlacement) {
        return render(product, width, height, badge, promo, accent, mood, brandName, logoUrl, includeBrandLogo,
                brandLogoPlacement, null, null, null, "BOLD", "CENTER", "LEFT");
    }

    public byte[] render(Product product, int width, int height, String badge, String promo, String accent, String mood,
                         String brandName, String logoUrl, boolean includeBrandLogo, String brandLogoPlacement,
                         String headline, String supportingText, String ctaText, String layoutStyle,
                         String productFocus, String textAlignment) {
        String safeAccent = color(accent, "#D9FF4A");
        String layout = choice(layoutStyle, "BOLD", "BOLD", "MINIMAL", "CATALOG", "POSTER");
        String focus = choice(productFocus, "CENTER", "CENTER", "CLOSE_UP", "FLOATING", "WIDE");
        String alignment = choice(textAlignment, "LEFT", "LEFT", "CENTER");
        String moodBackground = switch (mood == null ? "" : mood.toLowerCase()) {
            case "moss" -> "#183D33";
            case "ochre" -> "#5A2E1F";
            case "mint" -> "#153B38";
            case "eclipse" -> "#101018";
            default -> "#171A18";
        };
        String background = "MINIMAL".equals(layout) ? "#F5F1E8" : "CATALOG".equals(layout) ? "#DDE5D7" : moodBackground;
        String primaryInk = "MINIMAL".equals(layout) || "CATALOG".equals(layout) ? "#10110F" : "#FFFFFF";
        String secondaryInk = "MINIMAL".equals(layout) || "CATALOG".equals(layout) ? "#4A4D45" : "#E8E4DB";
        String panelFill = "MINIMAL".equals(layout) ? "#F5F1E8" : "CATALOG".equals(layout) ? "#EAF0E6" : "#11120F";
        String panelOpacity = "MINIMAL".equals(layout) ? ".96" : "CATALOG".equals(layout) ? ".94" : ".82";
        String productName = compact(product == null ? null : product.getName(), "Your product", 46);
        String sellingPoint = compact(product == null ? null : product.getSellingPoint(), "Made for your next campaign", 72);
        String visualHeadline = compact(headline, productName, 46);
        String visualPromo = compact(promo, sellingPoint, 72);
        String visualSupporting = compact(supportingText, sellingPoint, 86);
        String visualCta = compact(ctaText, "", 28);
        String image = product == null ? "" : value(product.getImageUrl());
        String embeddedProductImage = inlineImage(image, "product");
        ImageFrame imageFrame = imageFrame(focus, width, height);
        String visual = embeddedProductImage.isBlank()
                ? "<g><rect x=\"" + imageFrame.x() + "\" y=\"" + imageFrame.y() + "\" width=\"" + imageFrame.width() + "\" height=\"" + imageFrame.height() + "\" rx=\"36\" fill=\"#F5F1E8\" opacity=\".16\"/><text x=\"" + (imageFrame.x() + imageFrame.width() / 2) + "\" y=\"" + (imageFrame.y() + imageFrame.height() / 2) + "\" text-anchor=\"middle\" fill=\"#F5F1E8\" opacity=\".84\" font-family=\"Arial,sans-serif\" font-size=\"" + Math.max(14, width / 46) + "\" font-weight=\"700\" letter-spacing=\"2\">PRODUCT ASSET</text></g>"
                : imageElement(embeddedProductImage, imageFrame.x(), imageFrame.y(), imageFrame.width(), imageFrame.height(), imageFrame.preserveAspectRatio());
        String visualFrame = "FLOATING".equals(focus)
                ? "<rect x=\"" + (imageFrame.x() - width / 50) + "\" y=\"" + (imageFrame.y() - height / 65) + "\" width=\"" + (imageFrame.width() + width / 25) + "\" height=\"" + (imageFrame.height() + height / 32) + "\" rx=\"42\" fill=\"#F5F1E8\" opacity=\".14\"/>"
                : "";
        String backgroundArt = switch (layout) {
            case "MINIMAL" -> "<path d=\"M0 " + (height * .12) + " L" + width + " " + (height * .04) + " L" + width + " " + (height * .17) + " L0 " + (height * .25) + " Z\" fill=\"" + safeAccent + "\" opacity=\".45\"/>";
            case "CATALOG" -> "<rect x=\"" + (width / 20) + "\" y=\"" + (height / 20) + "\" width=\"" + (width * 9 / 10) + "\" height=\"" + (height * 9 / 10) + "\" rx=\"32\" fill=\"none\" stroke=\"#10110F\" stroke-opacity=\".18\" stroke-width=\"3\"/>";
            case "POSTER" -> "<path d=\"M0 0 H" + width + " V" + (height * .14) + " L0 " + (height * .34) + " Z\" fill=\"" + safeAccent + "\" opacity=\".18\"/>";
            default -> "<circle cx=\"" + (width * 3 / 4) + "\" cy=\"" + (height / 4) + "\" r=\"" + (width / 3) + "\" fill=\"" + safeAccent + "\" opacity=\".16\"/>";
        };
        BrandFrame brandFrame = brandFrame(brandLogoPlacement, width, height);
        String embeddedBrandLogo = inlineImage(value(logoUrl), "brand logo");
        String brandMark = !includeBrandLogo ? "" : !embeddedBrandLogo.isBlank()
                ? "<g><rect x=\"" + brandFrame.x() + "\" y=\"" + brandFrame.y() + "\" width=\"" + brandFrame.width() + "\" height=\"" + brandFrame.height() + "\" rx=\"16\" fill=\"#F5F1E8\" opacity=\".90\"/>" + imageElement(embeddedBrandLogo, brandFrame.x() + brandFrame.padding(), brandFrame.y() + brandFrame.padding(), brandFrame.width() - brandFrame.padding() * 2, brandFrame.height() - brandFrame.padding() * 2, "xMidYMid meet") + "</g>"
                : value(brandName).isBlank() ? ""
                : "<g><rect x=\"" + brandFrame.x() + "\" y=\"" + brandFrame.y() + "\" width=\"" + brandFrame.width() + "\" height=\"" + brandFrame.height() + "\" rx=\"16\" fill=\"#F5F1E8\" opacity=\".90\"/><text x=\"" + (brandFrame.x() + brandFrame.width() / 2) + "\" y=\"" + (brandFrame.y() + brandFrame.height() / 2 + Math.max(12, width / 90)) + "\" text-anchor=\"middle\" fill=\"#11120F\" font-family=\"Arial,sans-serif\" font-size=\"" + Math.max(12, width / 65) + "\" font-weight=\"700\" letter-spacing=\"2\">" + xml(brandName.trim()) + "</text></g>";
        int margin = width / 12;
        int copyX = "CENTER".equals(alignment) ? width / 2 : margin;
        String textAnchor = "CENTER".equals(alignment) ? "middle" : "start";
        int ctaWidth = Math.max(150, width / 4);
        int ctaHeight = Math.max(42, height / 22);
        int ctaX = "CENTER".equals(alignment) ? (width - ctaWidth) / 2 : margin;
        int ctaY = (int) (height * .905);
        String cta = visualCta.isBlank() ? "" : "<g><rect x=\"" + ctaX + "\" y=\"" + ctaY + "\" width=\"" + ctaWidth + "\" height=\"" + ctaHeight + "\" rx=\"" + (ctaHeight / 2) + "\" fill=\"" + safeAccent + "\"/><text x=\"" + (ctaX + ctaWidth / 2) + "\" y=\"" + (ctaY + ctaHeight / 2 + Math.max(7, width / 110)) + "\" text-anchor=\"middle\" fill=\"#10110F\" font-family=\"Arial,sans-serif\" font-size=\"" + Math.max(12, width / 70) + "\" font-weight=\"700\" letter-spacing=\"1\">" + xml(visualCta) + "</text></g>";
        String svg = """
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="%d" height="%d" viewBox="0 0 %d %d">
                  <rect width="100%%" height="100%%" fill="%s"/>
                  %s
                  <rect x="%d" y="%d" width="%d" height="%d" rx="22" fill="%s"/>
                  <text x="%d" y="%d" fill="#111" font-family="Arial,sans-serif" font-size="%d" font-weight="700" letter-spacing="2">%s</text>
                  %s
                  %s
                  %s
                  <rect x="0" y="%d" width="%d" height="%d" fill="%s" opacity="%s"/>
                  <text x="%d" y="%d" text-anchor="%s" fill="%s" font-family="Arial,sans-serif" font-size="%d" font-weight="700">%s</text>
                  <text x="%d" y="%d" text-anchor="%s" fill="%s" font-family="Arial,sans-serif" font-size="%d">%s</text>
                  <text x="%d" y="%d" text-anchor="%s" fill="%s" font-family="Arial,sans-serif" font-size="%d">%s</text>
                  %s
                  <text x="%d" y="%d" text-anchor="%s" fill="%s" font-family="Arial,sans-serif" font-size="%d" letter-spacing="3">LOCAL TEMPLATE COMPOSITION</text>
                </svg>
                """.formatted(width, height, width, height, background, backgroundArt,
                margin, height / 12, width / 3, height / 13, safeAccent,
                margin + 24, height / 12 + height / 21, Math.max(18, width / 42), xml(compact(badge, "PRODUCT VISUAL", 32)),
                visualFrame, visual, brandMark,
                (int) (height * .68), width, (int) (height * .32), panelFill, panelOpacity,
                copyX, (int) (height * .755), textAnchor, primaryInk, Math.max(26, width / 21), xml(visualHeadline),
                copyX, (int) (height * .815), textAnchor, primaryInk, Math.max(16, width / 47), xml(visualPromo),
                copyX, (int) (height * .862), textAnchor, secondaryInk, Math.max(14, width / 58), xml(visualSupporting),
                cta,
                copyX, (int) (height * .975), textAnchor, secondaryInk, Math.max(10, width / 82));
        try {
            PNGTranscoder transcoder = new PNGTranscoder();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            transcoder.transcode(new TranscoderInput(new ByteArrayInputStream(svg.getBytes(StandardCharsets.UTF_8))), new TranscoderOutput(out));
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Local SVG template rendering failed: " + rootMessage(e), e);
        }
    }

    private String compact(String value, String fallback, int maxLength) {
        String candidate = text(value, fallback);
        return candidate.length() <= maxLength ? candidate : candidate.substring(0, Math.max(1, maxLength - 1)).trim() + "…";
    }

    private String text(String value, String fallback) { return value == null || value.isBlank() ? fallback : value.trim(); }
    private String value(String value) { return value == null ? "" : value.trim(); }
    private String color(String value, String fallback) { return value != null && value.matches("#[0-9a-fA-F]{6}") ? value : fallback; }
    private String choice(String value, String fallback, String... options) {
        String candidate = value == null ? "" : value.trim().toUpperCase();
        for (String option : options) if (option.equals(candidate)) return candidate;
        return fallback;
    }
    private String inlineImage(String source, String label) {
        if (source == null || source.isBlank()) return "";
        String trimmed = source.trim();
        if (trimmed.startsWith("data:image/")) return supportedImageData(trimmed, label);
        if (!trimmed.matches("https?://.+")) return "";

        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) URI.create(trimmed).toURL().openConnection();
            connection.setConnectTimeout(3000);
            connection.setReadTimeout(5000);
            connection.setInstanceFollowRedirects(true);
            connection.setRequestProperty("User-Agent", "STUDIO-LocalRenderer/1.0");
            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) {
                log.warn("Skipping unavailable {} image during local composition (HTTP {})", label, status);
                return "";
            }
            String contentType = connection.getContentType();
            if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
                log.warn("Skipping non-image {} asset during local composition", label);
                return "";
            }
            try (InputStream stream = connection.getInputStream()) {
                byte[] bytes = stream.readNBytes(MAX_EMBEDDED_IMAGE_BYTES + 1);
                if (bytes.length == 0 || bytes.length > MAX_EMBEDDED_IMAGE_BYTES) {
                    log.warn("Skipping {} image outside the supported local composition size", label);
                    return "";
                }
                String mimeType = contentType.split(";", 2)[0].trim();
                return supportedImageData("data:" + mimeType + ";base64," + Base64.getEncoder().encodeToString(bytes), label);
            }
        } catch (Exception exception) {
            log.warn("Skipping unavailable {} image during local composition: {}", label, rootMessage(exception));
            return "";
        } finally {
            if (connection != null) connection.disconnect();
        }
    }

    private String supportedImageData(String dataUrl, String label) {
        String lowerCase = dataUrl.toLowerCase();
        if (lowerCase.startsWith("data:image/svg+xml;")) return dataUrl;
        int separator = dataUrl.indexOf(",");
        if (separator < 0 || !lowerCase.substring(0, separator).contains(";base64")) {
            log.warn("Skipping unsupported {} image encoding during local composition", label);
            return "";
        }
        try {
            ImageIO.scanForPlugins();
            byte[] sourceBytes = Base64.getDecoder().decode(dataUrl.substring(separator + 1));
            BufferedImage source = ImageIO.read(new ByteArrayInputStream(sourceBytes));
            if (source == null) {
                log.warn("Skipping unsupported {} image format during local composition", label);
                return "";
            }
            ByteArrayOutputStream png = new ByteArrayOutputStream();
            if (!ImageIO.write(source, "png", png)) {
                log.warn("Skipping {} image because it could not be converted for local composition", label);
                return "";
            }
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(png.toByteArray());
        } catch (Exception exception) {
            log.warn("Skipping unsupported {} image format during local composition: {}", label, rootMessage(exception));
            return "";
        }
    }

    private String imageElement(String imageData, int x, int y, int width, int height, String preserveAspectRatio) {
        String escapedImageData = xml(imageData);
        return "<image xlink:href=\"" + escapedImageData + "\" href=\"" + escapedImageData + "\" x=\"" + x + "\" y=\"" + y + "\" width=\"" + width + "\" height=\"" + height + "\" preserveAspectRatio=\"" + preserveAspectRatio + "\"/>";
    }

    private String rootMessage(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null) current = current.getCause();
        return current.getMessage() == null ? current.getClass().getSimpleName() : current.getMessage();
    }
    private String xml(String value) { return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;"); }

    private ImageFrame imageFrame(String focus, int width, int height) {
        return switch (focus) {
            case "CLOSE_UP" -> new ImageFrame((int) (width * .08), (int) (height * .17), (int) (width * .84), (int) (height * .53), "xMidYMid slice");
            case "FLOATING" -> new ImageFrame((int) (width * .22), (int) (height * .18), (int) (width * .56), (int) (height * .47), "xMidYMid meet");
            case "WIDE" -> new ImageFrame((int) (width * .08), (int) (height * .25), (int) (width * .84), (int) (height * .39), "xMidYMid meet");
            default -> new ImageFrame((int) (width * .15), (int) (height * .21), (int) (width * .70), (int) (height * .48), "xMidYMid meet");
        };
    }

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
    private record ImageFrame(int x, int y, int width, int height, String preserveAspectRatio) { }
}
