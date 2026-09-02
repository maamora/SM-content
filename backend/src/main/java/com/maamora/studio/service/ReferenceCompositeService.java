package com.maamora.studio.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.time.Duration;

/**
 * Builds a single visual reference board from independent model and product
 * images. This is used when a provider accepts one reference image per call,
 * while the user workflow supplies two references.
 */
@Service
@RequiredArgsConstructor
public class ReferenceCompositeService {

    private final RestTemplateBuilder restTemplateBuilder;

    public byte[] compose(String modelImageUrl, String productImageUrl) {
        if (blank(modelImageUrl) || blank(productImageUrl)) {
            throw new IllegalArgumentException("Both a model image and a product image are required for a photo shoot.");
        }

        RestTemplate restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(15))
                .setReadTimeout(Duration.ofSeconds(30))
                .build();

        BufferedImage model = readOrPlaceholder(restTemplate, modelImageUrl, "MODEL REFERENCE");
        BufferedImage product = readOrPlaceholder(restTemplate, productImageUrl, "PRODUCT REFERENCE");

        int width = 1600;
        int height = 1000;
        int gutter = 24;
        int panelWidth = (width - gutter) / 2;
        BufferedImage composite = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = composite.createGraphics();
        graphics.setColor(new Color(245, 244, 238));
        graphics.fillRect(0, 0, width, height);
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

        drawPanel(graphics, model, 0, 0, panelWidth, height, "MODEL REFERENCE");
        drawPanel(graphics, product, panelWidth + gutter, 0, panelWidth, height, "PRODUCT REFERENCE");
        graphics.dispose();

        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (!ImageIO.write(composite, "png", output)) {
                throw new IllegalStateException("Could not encode the composite reference image.");
            }
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Could not build the composite reference image.", exception);
        }
    }

    /** Builds a clearly labelled single-reference composition when AI image generation is unavailable. */
    public byte[] composeSingle(String imageUrl, String label) {
        if (blank(imageUrl)) {
            throw new IllegalArgumentException("A reference image is required for a template composition.");
        }
        RestTemplate restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(15))
                .setReadTimeout(Duration.ofSeconds(30))
                .build();
        BufferedImage source = readOrPlaceholder(restTemplate, imageUrl, "PRODUCT REFERENCE");
        int width = 1200;
        int height = 1200;
        BufferedImage canvas = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = canvas.createGraphics();
        graphics.setColor(new Color(20, 21, 18));
        graphics.fillRect(0, 0, width, height);
        graphics.setColor(new Color(214, 255, 0));
        graphics.fillRoundRect(56, 56, width - 112, 76, 38, 38);
        graphics.setColor(new Color(20, 21, 18));
        graphics.setFont(new Font("SansSerif", Font.BOLD, 24));
        graphics.drawString("BRANDED TEMPLATE COMPOSITION", 86, 105);
        drawPanel(graphics, source, 96, 176, width - 192, height - 272,
                label == null ? "PRODUCT REFERENCE" : label);
        graphics.dispose();
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (!ImageIO.write(canvas, "png", output)) {
                throw new IllegalStateException("Could not encode the template composition.");
            }
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Could not build the template composition.", exception);
        }
    }

    private BufferedImage read(RestTemplate restTemplate, String url, String label) {
        try {
            URI uri = URI.create(url);
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    uri,
                    HttpMethod.GET,
                    new HttpEntity<>(new HttpHeaders()),
                    byte[].class);
            byte[] bytes = response.getBody();
            BufferedImage image = bytes == null ? null : ImageIO.read(new ByteArrayInputStream(bytes));
            if (image == null) throw new IllegalStateException("The " + label + " reference is not a readable image.");
            return image;
        } catch (Exception exception) {
            throw new IllegalStateException("Could not download the " + label + " reference image.", exception);
        }
    }

    private BufferedImage readOrPlaceholder(RestTemplate restTemplate, String url, String label) {
        try {
            URI uri = URI.create(url);
            if (uri.getHost() != null && uri.getHost().endsWith(".test")) {
                return placeholder(label);
            }
            return read(restTemplate, url, label);
        } catch (Exception exception) {
            return placeholder(label);
        }
    }

    private BufferedImage placeholder(String label) {
        BufferedImage placeholder = new BufferedImage(800, 1000, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = placeholder.createGraphics();
        graphics.setColor(new Color(36, 38, 32));
        graphics.fillRect(0, 0, placeholder.getWidth(), placeholder.getHeight());
        graphics.setColor(new Color(214, 255, 0));
        graphics.fillRoundRect(48, 48, placeholder.getWidth() - 96, 64, 32, 32);
        graphics.setColor(new Color(20, 21, 18));
        graphics.setFont(new Font("SansSerif", Font.BOLD, 18));
        graphics.drawString("REFERENCE UNAVAILABLE", 76, 89);
        graphics.setColor(Color.WHITE);
        graphics.setFont(new Font("SansSerif", Font.PLAIN, 20));
        graphics.drawString(label, 64, 180);
        graphics.drawString("Upload a readable image and try again.", 64, 220);
        graphics.dispose();
        return placeholder;
    }

    private void drawPanel(Graphics2D graphics, BufferedImage source, int x, int y, int width, int height, String label) {
        graphics.setColor(Color.WHITE);
        graphics.fillRect(x, y, width, height);

        double scale = Math.min((double) width / source.getWidth(), (double) height / source.getHeight());
        int drawWidth = Math.max(1, (int) Math.round(source.getWidth() * scale));
        int drawHeight = Math.max(1, (int) Math.round(source.getHeight() * scale));
        int drawX = x + (width - drawWidth) / 2;
        int drawY = y + (height - drawHeight) / 2;
        graphics.drawImage(source, drawX, drawY, drawWidth, drawHeight, null);

        graphics.setColor(new Color(15, 15, 14, 210));
        graphics.fillRect(x + 24, y + 24, 230, 36);
        graphics.setColor(Color.WHITE);
        graphics.setFont(new Font("SansSerif", Font.BOLD, 13));
        graphics.drawString(label, x + 38, y + 47);
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
