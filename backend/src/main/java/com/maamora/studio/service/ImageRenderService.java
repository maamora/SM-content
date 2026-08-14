package com.maamora.studio.service;

import com.maamora.studio.model.Product;
import com.maamora.studio.model.Template;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Renders a branded marketing creative for a given product.
 *
 * Pipeline:
 * 1. If the product has an imageUrl, fetch it and call Stability AI img2img
 * so the AI output is visually grounded in the real product photo.
 * Otherwise fall back to text-to-image.
 * 2. Overlay the Maamoura logo (bottom-right corner).
 * 3. Overlay the promo banner and badge text using Java Graphics2D.
 */
@Slf4j
@Service
public class ImageRenderService {

    @Value("${STABILITY_API_KEY:}")
    private String apiKey;

    private final HiggsfieldImageService higgsfieldImageService;

    // Logo loaded from the classpath (placed in
    // src/main/resources/static/maamora-logo.png)
    private static final String LOGO_RESOURCE = "/static/maamora-logo.png";

    private final RestTemplate restTemplate = new RestTemplate();

    public ImageRenderService(HiggsfieldImageService higgsfieldImageService) {
        this.higgsfieldImageService = higgsfieldImageService;
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    public byte[] renderToPng(Template template, Product product,
            String badgeText, String promoText,
            String accentColor) {
        return renderToPng(template, product, badgeText, promoText, accentColor, null);
    }

    public byte[] renderToPng(Template template, Product product,
            String badgeText, String promoText,
            String accentColor, String mood) {
        boolean isSquare = template.getFormat() != null
                && template.getFormat().name().equals("SQUARE_POST");
        // SDXL only accepts a fixed set of width/height pairs; anything else is
        // rejected with a 400 "invalid_sdxl_v1_dimensions". 1024x1024 for square
        // posts, 768x1344 (closest allowed pair to a 9:16 story ratio) otherwise.
        int width = isSquare ? 1024 : 768;
        int height = isSquare ? 1024 : 1344;

        // Higgsfield provides the higher-end editorial generation path. For
        // products with a supplied photo, keep Stability img2img first when it
        // is available because the currently implemented Higgsfield payload is
        // text-only and must not silently replace a real product with an
        // invented look. Its API is asynchronous, but the adapter polls to
        // preserve STUDIO's existing synchronous endpoint.
        boolean hasProductImage = product.getImageUrl() != null && !product.getImageUrl().isBlank();
        boolean stabilityConfigured = apiKey != null && !apiKey.isBlank();
        if (higgsfieldImageService.isConfigured() && (!hasProductImage || !stabilityConfigured)) {
            try {
                String prompt = buildPrompt(product.getName(), product.getDescription(), product.getSellingPoint(),
                        badgeText, promoText, accentColor, mood);
                byte[] aiPng = higgsfieldImageService.generateImage(prompt, isSquare ? "1:1" : "9:16");
                return compositeOverlays(aiPng, badgeText, promoText, accentColor, mood);
            } catch (Exception e) {
                log.warn("Higgsfield image generation failed; falling back to Stability/local rendering: {}",
                        e.getMessage());
            }
        }

        // No Stability AI key configured: skip the paid AI generation step
        // entirely and composite the same logo/text overlays directly onto
        // the product's own photo (or a plain brand-colour canvas if it has
        // none). This keeps image generation fully functional without
        // requiring a paid third-party API key.
        if (apiKey == null || apiKey.isEmpty()) {
            byte[] plainBase = buildPlainBase(product.getImageUrl(), width, height);
            return compositeOverlays(plainBase, badgeText, promoText, accentColor, mood);
        }

        // 1. Generate the AI image (img2img or text-to-image)
        byte[] aiPng = product.getImageUrl() != null && !product.getImageUrl().isBlank()
                ? generateImg2Img(product, badgeText, promoText, accentColor, mood, width, height)
                : generateText2Img(product, badgeText, promoText, accentColor, mood, width, height);

        // 2. Composite logo and text overlays
        return compositeOverlays(aiPng, badgeText, promoText, accentColor, mood);
    }

    /**
     * Fallback base image used when no STABILITY_API_KEY is configured:
     * the product's own photo if it has one, otherwise a solid Maamora
     * orange canvas at the target dimensions. Either way, compositeOverlays
     * still adds the vignette, promo/badge text and logo on top.
     */
    private byte[] buildPlainBase(String imageUrl, int width, int height) {
        if (imageUrl != null && !imageUrl.isBlank()) {
            try {
                return downloadBytes(imageUrl);
            } catch (Exception e) {
                // Fall through to the solid-colour canvas below.
            }
        }
        BufferedImage canvas = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = canvas.createGraphics();
        g.setColor(new Color(0xF4, 0x73, 0x15));
        g.fillRect(0, 0, width, height);
        g.dispose();
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(canvas, "PNG", out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to build placeholder canvas", e);
        }
    }

    // -----------------------------------------------------------------------
    // Stability AI img2img (grounded in the real product photo)
    // -----------------------------------------------------------------------

    private byte[] generateImg2Img(Product product, String badgeText, String promoText,
            String accentColor, String mood, int width, int height) {
        byte[] initImage;
        try {
            initImage = downloadBytes(product.getImageUrl());
        } catch (Exception e) {
            // If we cannot fetch the product image, fall back gracefully
            return generateText2Img(product, badgeText, promoText, accentColor, mood, width, height);
        }

        String prompt = buildPrompt(product.getName(), product.getDescription(), product.getSellingPoint(),
                badgeText, promoText, accentColor, mood);
        String engine = "stable-diffusion-xl-1024-v1-0";
        String url = "https://api.stability.ai/v1/generation/" + engine + "/image-to-image";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("Authorization", "Bearer " + apiKey);
        headers.set("Accept", "application/json");

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("init_image", new org.springframework.core.io.ByteArrayResource(initImage) {
            @Override
            public String getFilename() {
                return "product.png";
            }
        });
        body.add("init_image_mode", "IMAGE_STRENGTH");
        body.add("image_strength", "0.40"); // 40% — product stays clearly recognisable, AI adds premium styling
        body.add("text_prompts[0][text]", prompt);
        body.add("text_prompts[0][weight]", "1");
        body.add("text_prompts[1][text]", buildNegativePrompt());
        body.add("text_prompts[1][weight]", "-1");
        body.add("cfg_scale", "10"); // higher adherence to prompt
        body.add("steps", "50"); // more diffusion steps → sharper, richer details
        body.add("samples", "1");
        body.add("style_preset", "photographic"); // enforce photorealistic output

        HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity,
                    new org.springframework.core.ParameterizedTypeReference<>() {
                    });
            return extractBase64Png(response);
        } catch (Exception e) {
            // Fall back to text-to-image if img2img fails
            return generateText2Img(product, badgeText, promoText, accentColor, mood, width, height);
        }
    }

    // -----------------------------------------------------------------------
    // Stability AI text-to-image fallback
    // -----------------------------------------------------------------------

    private byte[] generateText2Img(Product product, String badgeText, String promoText,
            String accentColor, String mood, int width, int height) {
        String prompt = buildPrompt(product.getName(), product.getDescription(), product.getSellingPoint(),
                badgeText, promoText, accentColor, mood);
        return callStabilityText2Img(prompt, width, height);
    }

    private byte[] callStabilityText2Img(String prompt, int width, int height) {
        String engine = "stable-diffusion-xl-1024-v1-0";
        String url = "https://api.stability.ai/v1/generation/" + engine + "/text-to-image";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);
        headers.set("Accept", "application/json");

        Map<String, Object> requestBody = Map.of(
                "text_prompts", List.of(
                        Map.of("text", prompt, "weight", 1),
                        Map.of("text", buildNegativePrompt(), "weight", -1)),
                "cfg_scale", 10,
                "height", height,
                "width", width,
                "steps", 50,
                "samples", 1,
                "style_preset", "photographic");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, entity,
                new org.springframework.core.ParameterizedTypeReference<>() {
                });
        return extractBase64Png(response);
    }

    // -----------------------------------------------------------------------
    // Prompt builder — engineered for premium, paid-tier social media creatives
    // -----------------------------------------------------------------------

    private String buildPrompt(String productName, String productDescription, String productSellingPoint,
            String badgeText, String promoText, String accentColor, String mood) {

        // ── Mood → full scene direction ──────────────────────────────────────
        record MoodScene(String lighting, String bg, String props, String feel) {
        }
        MoodScene scene = switch (mood != null ? mood.toLowerCase() : "") {
            case "moss" -> new MoodScene(
                    "dappled natural forest light, soft green rim light, subtle fog fill",
                    "lush Atlas cedar forest floor, deep emerald moss and fern bokeh",
                    "raw marble slab, dried sage sprigs, hammered copper vessel",
                    "grounded, organic, luxury apothecary, earthy wellness brand");
            case "ochre" -> new MoodScene(
                    "warm golden-hour side light, deep terracotta shadows, Rembrandt lighting ratio",
                    "ancient Moroccan riad wall, hand-carved zellige tile, blurred souk spice market",
                    "aged brass tray, saffron fabric drape, hand-painted ceramic bowl",
                    "warm artisan craft, heritage luxury, medina couture aesthetic");
            case "mint" -> new MoodScene(
                    "clean bright directional studio light, crisp white fill, airy Scandinavian lighting",
                    "minimal ivory linen backdrop, delicate glass and sage leaf arrangement",
                    "cool white marble surface, pressed botanicals, pale sage eucalyptus stems",
                    "clean spa luxury, premium wellness, aspirational minimalism");
            case "eclipse" -> new MoodScene(
                    "dramatic single-point neon accent light, deep moody underexposure, cinematic noir",
                    "dark midnight Majorelle garden, deep indigo and violet shadows, city luxury after dark",
                    "black obsidian surface, geometric brass objects, sheer iridescent fabric",
                    "ultra-luxury editorial, high-fashion night mood, exclusive collector's edition");
            default -> new MoodScene(
                    "warm golden-hour back light, soft amber rim, professional 3-point studio setup",
                    "Maamora Atlantic coastline at dusk, soft orange horizon bokeh",
                    "bleached driftwood surface, dried sea lavender, antique hammered silver dish",
                    "coastal Moroccan luxury, premium lifestyle brand, aspirational warmth");
        };

        String accentDesc = accentColorDescription(accentColor);
        String promoLine = truncate(buildPromoDesc(promoText, badgeText), 200);
        // Product descriptions can be up to 1000 chars (DB column limit) and the
        // rest of this template is already ~1000+ chars of fixed style/lighting/
        // technical direction — uncapped, a long description alone can push the
        // final prompt past Stability's hard 2000-char limit on text_prompts[0],
        // which fails with a 400 "length must be between 1 and 2000" error.
        String description = truncate(nvl(productDescription, "premium Moroccan natural product"), 300);
        String sellingPt = truncate(nvl(productSellingPoint, "100 percent authentic, handcrafted in Morocco"), 150);

        String prompt = String.format(
                // ── Hero subject ────────────────────────────────────────────────
                "HERO PRODUCT SHOT: %s — %s. Key USP: %s. " +
                        "Campaign message: %s. " +
                        // ── Visual style directive ───────────────────────────────────────
                        "VISUAL STYLE: Paid luxury brand social media creative, " +
                        "level of quality sold by top-tier agencies for 2000+ USD per post. " +
                        "Think Apple Product Photography meets Chanel campaign, " +
                        "combined with a high-end Moroccan heritage brand identity. " +
                        // ── Lighting ────────────────────────────────────────────────────
                        "LIGHTING: %s. " +
                        "Micro-details fully illuminated, specular highlights on product surface create depth and desirability. "
                        +
                        // ── Set & props ─────────────────────────────────────────────────
                        "SET: %s. PROPS: %s. " +
                        "Considered negative space, law of thirds composition. " +
                        // ── Colour art direction ─────────────────────────────────────────
                        "COLOR DIRECTION: dominant palette built around %s accent, " +
                        "harmonious analogous tones, intentional colour grading applied in post. " +
                        // ── Brand mood ───────────────────────────────────────────────────
                        "BRAND FEEL: %s. " +
                        // ── Technical specs ──────────────────────────────────────────────
                        "TECHNICAL: 50mm f/1.4 lens, razor-sharp product focus, silky background bokeh, " +
                        "Phase One IQ4 medium-format camera quality, shot tethered in controlled studio, " +
                        "Hasselblad skin-tone rendering, commercial retouching, " +
                        "ultra-high resolution 8K, award-winning advertising photography, " +
                        "featured in Vogue Arabia and Monocle magazine.",
                productName, description, sellingPt,
                promoLine,
                scene.lighting(),
                scene.bg(), scene.props(),
                accentDesc,
                scene.feel());

        // Safety net regardless of where the length came from — Stability
        // rejects anything over 2000 chars (and, in principle, anything empty).
        return truncate(prompt, 2000);
    }

    private static String truncate(String s, int maxLength) {
        if (s == null) return "";
        String trimmed = s.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength).trim();
    }

    /**
     * Exhaustive negative prompt — eliminates every common Stability AI failure
     * mode
     * that makes images look cheap or AI-generated.
     */
    private String buildNegativePrompt() {
        return // composition / quality failures
        "ugly, blurry, soft focus, out of focus, noisy, grainy, pixelated, jpeg artifacts, " +
                "low resolution, low quality, worst quality, bad quality, normal quality, " +
                "oversaturated, washed out, overexposed, underexposed, flat lighting, " +
                // AI hallucination artifacts
                "duplicate, cloned objects, extra limbs, fused objects, disfigured, deformed, " +
                "distorted, malformed, mutation, twisted, anatomy errors, " +
                // text and branding contamination
                "text, watermark, signature, username, logo overlay, copyright mark, " +
                "letters, numbers, fonts, typography errors, gibberish writing, " +
                // unwanted stylistic modes
                "cartoon, anime, illustration, painting, sketch, drawing, 3d render, cgi, " +
                "clip art, stock photo look, template, generic, corporate clipart, " +
                // composition clutter
                "cluttered, busy background, messy, unprofessional, amateur photographer, " +
                "bad composition, wrong perspective, tilted horizon, " +
                // cheap/dated look
                "cheap, tacky, kitsch, dated, old fashioned, retro bad, " +
                "Instagram filter, heavy vignette, HDR halo, lens flare bad";
    }

    private String buildPromoDesc(String promoText, String badgeText) {
        StringBuilder sb = new StringBuilder();
        if (promoText != null && !promoText.isBlank())
            sb.append(promoText.trim());
        if (badgeText != null && !badgeText.isBlank()) {
            if (!sb.isEmpty())
                sb.append(", ");
            sb.append(badgeText.trim());
        }
        return sb.isEmpty() ? "brand lifestyle showcase" : sb.toString();
    }

    private String accentColorDescription(String hex) {
        if (hex == null || hex.length() < 7)
            return "warm orange";
        try {
            int r = Integer.parseInt(hex.substring(1, 3), 16);
            int g = Integer.parseInt(hex.substring(3, 5), 16);
            int b = Integer.parseInt(hex.substring(5, 7), 16);
            if (r > 200 && g < 100 && b < 100)
                return "bold red";
            if (r > 200 && g > 100 && b < 100)
                return "warm orange";
            if (r > 200 && g > 200 && b < 100)
                return "golden yellow";
            if (r < 100 && g > 150 && b < 100)
                return "forest green";
            if (r < 100 && g < 100 && b > 200)
                return "deep blue";
            if (r > 150 && g < 100 && b > 150)
                return "royal purple";
            if (r < 60 && g < 60 && b < 60)
                return "charcoal black";
        } catch (NumberFormatException ignored) {
        }
        return "warm orange";
    }

    // -----------------------------------------------------------------------
    // Java Graphics2D — logo + text compositing
    // -----------------------------------------------------------------------

    private byte[] compositeOverlays(byte[] aiPng, String badgeText, String promoText,
            String accentColor, String mood) {
        try {
            BufferedImage base = ImageIO.read(new ByteArrayInputStream(aiPng));
            if (base == null)
                throw new RuntimeException("Cannot decode AI-generated PNG");

            int W = base.getWidth();
            int H = base.getHeight();

            BufferedImage canvas = new BufferedImage(W, H, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g = canvas.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);

            // Draw AI base image
            g.drawImage(base, 0, 0, null);

            // Parse accent colour (fall back to Maamora orange)
            Color accent = parseHex(accentColor, new Color(0xF4, 0x73, 0x15));

            // ── Gradient vignette at bottom (reserved for text) ──────────────
            int vigH = H / 3;
            GradientPaint vigGrad = new GradientPaint(
                    0, H - vigH, new Color(0, 0, 0, 0),
                    0, H, new Color(0, 0, 0, 180));
            g.setPaint(vigGrad);
            g.fillRect(0, H - vigH, W, vigH);

            // ── Promo text ───────────────────────────────────────────────────
            if (promoText != null && !promoText.isBlank()) {
                int fontSize = Math.max(24, W / 18);
                g.setFont(new Font("SansSerif", Font.BOLD, fontSize));
                FontMetrics fm = g.getFontMetrics();
                String text = promoText.toUpperCase();
                int tx = (W - fm.stringWidth(text)) / 2;
                int ty = H - (int) (H * 0.12);

                // Text shadow
                g.setColor(new Color(0, 0, 0, 160));
                g.drawString(text, tx + 2, ty + 2);
                // Text itself
                g.setColor(Color.WHITE);
                g.drawString(text, tx, ty);
            }

            // ── Badge pill (badge text) ──────────────────────────────────────
            if (badgeText != null && !badgeText.isBlank()) {
                int bPad = W / 40;
                int bFont = Math.max(14, W / 28);
                g.setFont(new Font("SansSerif", Font.BOLD, bFont));
                FontMetrics fm = g.getFontMetrics();
                String badge = badgeText.toUpperCase();
                int bw = fm.stringWidth(badge) + bPad * 4;
                int bh = fm.getHeight() + bPad * 2;
                int bx = W - bw - (W / 30);
                int by = W / 30;

                // Pill background with accent colour
                g.setColor(accent);
                g.fill(new RoundRectangle2D.Float(bx, by, bw, bh, bh, bh));

                // Badge text (dark for readability)
                g.setColor(isBright(accent) ? new Color(30, 20, 10) : Color.WHITE);
                g.drawString(badge, bx + bPad * 2, by + fm.getAscent() + bPad);
            }

            // ── Maamora logo (bottom-right) ──────────────────────────────────
            drawLogoOverlay(g, W, H, accent);

            g.dispose();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(canvas, "PNG", out);
            return out.toByteArray();

        } catch (IOException e) {
            // If compositing fails, return the raw AI image
            return aiPng;
        }
    }

    /**
     * Draws the Maamora logo from the classpath resource into the bottom-right
     * corner.
     * If the PNG file cannot be loaded a text-based fallback is drawn instead.
     */
    private void drawLogoOverlay(Graphics2D g, int W, int H, Color accent) {
        // Try loading the PNG logo from classpath
        BufferedImage logo = null;
        try (InputStream is = getClass().getResourceAsStream(LOGO_RESOURCE)) {
            if (is != null)
                logo = ImageIO.read(is);
        } catch (IOException ignored) {
        }

        int margin = W / 30;
        int logoMaxW = W / 5; // logo occupies at most 20% of image width
        int logoMaxH = H / 10;

        if (logo != null) {
            // Scale logo to fit within the reserved area, preserving aspect ratio
            double scale = Math.min((double) logoMaxW / logo.getWidth(),
                    (double) logoMaxH / logo.getHeight());
            int lw = (int) (logo.getWidth() * scale);
            int lh = (int) (logo.getHeight() * scale);
            int lx = W - lw - margin;
            int ly = H - lh - margin;

            // Semi-transparent background pill for contrast
            g.setColor(new Color(255, 255, 255, 60));
            g.fillRoundRect(lx - 6, ly - 4, lw + 12, lh + 8, 12, 12);

            g.drawImage(logo, lx, ly, lw, lh, null);
        } else {
            // Elegant text fallback: "MAAMORA" in brand orange
            int fSize = Math.max(12, W / 40);
            g.setFont(new Font("SansSerif", Font.BOLD, fSize));
            FontMetrics fm = g.getFontMetrics();
            String brand = "MAAMORA";
            int tw = fm.stringWidth(brand);
            int tx = W - tw - margin;
            int ty = H - margin;

            // Backing pill
            g.setColor(new Color(0, 0, 0, 120));
            g.fillRoundRect(tx - 8, ty - fm.getAscent() - 4, tw + 16, fm.getHeight() + 8, 10, 10);

            g.setColor(accent);
            g.drawString(brand, tx, ty);
        }
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private byte[] extractBase64Png(ResponseEntity<Map<String, Object>> response) {
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Stability AI returned status: " + response.getStatusCode());
        }
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> artifacts = (List<Map<String, Object>>) response.getBody().get("artifacts");
        if (artifacts == null || artifacts.isEmpty()) {
            throw new RuntimeException("Stability AI returned no artifacts");
        }
        String base64Data = (String) artifacts.get(0).get("base64");
        if (base64Data == null || base64Data.isBlank()) {
            throw new RuntimeException("Stability AI artifact has no base64 data");
        }
        return Base64.getDecoder().decode(base64Data);
    }

    private byte[] downloadBytes(String urlStr) throws IOException {
        URL url = URI.create(urlStr).toURL();
        try (InputStream in = url.openStream();
                ByteArrayOutputStream buf = new ByteArrayOutputStream()) {
            byte[] chunk = new byte[8192];
            int n;
            while ((n = in.read(chunk)) != -1)
                buf.write(chunk, 0, n);
            return buf.toByteArray();
        }
    }

    private static Color parseHex(String hex, Color fallback) {
        if (hex == null || hex.length() < 7)
            return fallback;
        try {
            int r = Integer.parseInt(hex.substring(1, 3), 16);
            int g = Integer.parseInt(hex.substring(3, 5), 16);
            int b = Integer.parseInt(hex.substring(5, 7), 16);
            return new Color(r, g, b);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    /** Returns true for colours that need dark text (high perceived brightness). */
    private static boolean isBright(Color c) {
        double luminance = 0.299 * c.getRed() + 0.587 * c.getGreen() + 0.114 * c.getBlue();
        return luminance > 160;
    }

    private static String nvl(String s, String fallback) {
        return (s != null && !s.isBlank()) ? s : fallback;
    }
}
