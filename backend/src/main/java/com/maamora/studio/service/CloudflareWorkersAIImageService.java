package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Set;

/**
 * Cloudflare Workers AI FLUX.2 image adapter.
 * The model accepts multipart/form-data and up to four input_image_N references.
 */
@Slf4j
@Service
public class CloudflareWorkersAIImageService implements ManagedImageService {

    private static final long MAX_INPUT_BYTES = 10L * 1024L * 1024L;
    private static final long MAX_OUTPUT_BYTES = 30L * 1024L * 1024L;
    private static final Set<String> ASPECT_RATIOS = Set.of(
            "16:9", "1:1", "2:3", "3:2", "4:5", "5:4", "9:16");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String accountId;
    private final String apiToken;
    private final String baseUrl;
    private final String model;
    private final long timeoutMs;
    private final int steps;
    private final double guidance;
    private final int retryAttempts;
    private final long retryBackoffMs;

    public CloudflareWorkersAIImageService(
            RestTemplateBuilder builder,
            @Value("${app.cloudflare.account-id:}") String accountId,
            @Value("${app.cloudflare.api-token:}") String apiToken,
            @Value("${app.cloudflare.base-url:https://api.cloudflare.com/client/v4}") String baseUrl,
            @Value("${app.cloudflare.image-model:@cf/black-forest-labs/flux-2-dev}") String model,
            @Value("${app.cloudflare.timeout-ms:180000}") long timeoutMs,
            @Value("${app.cloudflare.steps:25}") int steps,
            @Value("${app.cloudflare.guidance:4.0}") double guidance,
            @Value("${app.cloudflare.retry-attempts:3}") int retryAttempts,
            @Value("${app.cloudflare.retry-backoff-ms:1500}") long retryBackoffMs) {
        this.accountId = valueOrDefault(accountId, "");
        this.apiToken = valueOrDefault(apiToken, "");
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.model = valueOrDefault(model, "@cf/black-forest-labs/flux-2-dev");
        this.timeoutMs = Math.max(30_000, timeoutMs);
        this.steps = Math.max(1, steps);
        this.guidance = guidance > 0 ? guidance : 4.0;
        this.retryAttempts = Math.min(5, Math.max(1, retryAttempts));
        this.retryBackoffMs = Math.min(10_000, Math.max(250, retryBackoffMs));
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(20))
                .setReadTimeout(Duration.ofMillis(this.timeoutMs))
                .build();
    }

    @Override
    public boolean isConfigured() {
        return configured(accountId) && configured(apiToken) && configured(model);
    }

    @Override
    public byte[] generateImage(String prompt, String aspectRatio, List<String> references) {
        if (!isConfigured()) {
            throw new IllegalStateException("Cloudflare Workers AI is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("An image prompt is required.");
        }

        Dimensions dimensions = dimensions(aspectRatio);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("prompt", prompt.trim());
        body.add("steps", Integer.toString(steps));
        body.add("guidance", Double.toString(guidance));
        body.add("width", Integer.toString(dimensions.width()));
        body.add("height", Integer.toString(dimensions.height()));

        List<String> cleanReferences = references == null ? List.of() : references.stream()
                .filter(value -> value != null && !value.isBlank())
                .limit(4)
                .toList();
        for (int index = 0; index < cleanReferences.size(); index++) {
            byte[] reference = prepareReference(cleanReferences.get(index));
            int current = index;
            body.add("input_image_" + index, new ByteArrayResource(reference) {
                @Override
                public String getFilename() {
                    return "reference-" + current + ".png";
                }
            });
        }

        HttpStatusCodeException lastCapacityError = null;
        for (int attempt = 1; attempt <= retryAttempts; attempt++) {
            try {
                JsonNode response = restTemplate.postForObject(
                        endpoint(),
                        new HttpEntity<>(body, headers()),
                        JsonNode.class);
                return decodeImage(response);
            } catch (HttpStatusCodeException e) {
                if (!isCapacityError(e)) {
                    throw providerError(e);
                }
                lastCapacityError = e;
                if (attempt == retryAttempts) break;
                long delay = Math.min(30_000L, retryBackoffMs * (1L << Math.min(attempt - 1, 4)));
                log.warn("Cloudflare Workers AI capacity unavailable (attempt {}/{}); retrying in {} ms", attempt, retryAttempts, delay);
                sleepBeforeRetry(delay);
            }
        }
        throw capacityError(lastCapacityError);
    }

    private byte[] prepareReference(String referenceUrl) {
        byte[] source = download(referenceUrl);
        if (source.length > MAX_INPUT_BYTES) {
            throw new IllegalStateException("Reference image exceeds the 10 MB Cloudflare input limit.");
        }
        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(source));
            if (original == null) {
                throw new IllegalStateException("Reference image is not a readable image.");
            }
            int longest = Math.max(original.getWidth(), original.getHeight());
            if (longest <= 512) {
                return source;
            }
            double scale = 512.0 / longest;
            int width = Math.max(1, (int) Math.round(original.getWidth() * scale));
            int height = Math.max(1, (int) Math.round(original.getHeight() * scale));
            BufferedImage resized = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = resized.createGraphics();
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.drawImage(original, 0, 0, width, height, null);
            graphics.dispose();
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(resized, "png", output);
            return output.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Unable to prepare Cloudflare reference image.", e);
        }
    }

    private byte[] download(String url) {
        try {
            URI.create(url);
            byte[] bytes = restTemplate.getForObject(url, byte[].class);
            if (bytes == null || bytes.length == 0) {
                throw new IllegalStateException("Reference image URL returned an empty response.");
            }
            return bytes;
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Reference image must be an absolute URL.", e);
        }
    }

    private byte[] decodeImage(JsonNode response) {
        JsonNode result = response == null ? null : response.path("result");
        String encoded = result.path("image").asText("");
        if (encoded.isBlank()) encoded = result.asText("");
        if (encoded.isBlank() && response != null) encoded = response.path("image").asText("");
        if (encoded.isBlank()) {
            throw new IllegalStateException("Cloudflare returned no image data: " + compact(response));
        }
        if (encoded.startsWith("data:")) {
            int comma = encoded.indexOf(',');
            if (comma >= 0) encoded = encoded.substring(comma + 1);
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(encoded);
            if (bytes.length == 0 || bytes.length > MAX_OUTPUT_BYTES) {
                throw new IllegalStateException("Cloudflare returned an invalid image result.");
            }
            return bytes;
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Cloudflare returned malformed base64 image data.", e);
        }
    }

    private String endpoint() {
        return baseUrl + "/accounts/" + accountId + "/ai/run/" + model;
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiToken);
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private boolean isCapacityError(HttpStatusCodeException e) {
        return e.getStatusCode().value() == 429
                || e.getResponseBodyAsString().contains("3040")
                || e.getResponseBodyAsString().toLowerCase().contains("capacity temporarily exceeded");
    }

    private void sleepBeforeRetry(long delayMs) {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Cloudflare image generation retry was interrupted.", interrupted);
        }
    }

    private IllegalStateException capacityError(HttpStatusCodeException e) {
        String details = e == null ? "temporary provider capacity limit" : compactText(e.getResponseBodyAsString());
        return new IllegalStateException("Cloudflare image generation is temporarily unavailable after "
                + retryAttempts + " attempts. Please retry shortly. Provider response: " + details, e);
    }

    private IllegalStateException providerError(HttpStatusCodeException e) {
        return new IllegalStateException("Cloudflare image generation failed with HTTP "
                + e.getStatusCode().value() + ": " + compactText(e.getResponseBodyAsString()), e);
    }

    private Dimensions dimensions(String aspectRatio) {
        String normalized = aspectRatio == null ? "1:1" : aspectRatio.trim();
        if (!ASPECT_RATIOS.contains(normalized)) normalized = "1:1";
        return switch (normalized) {
            case "9:16", "2:3" -> new Dimensions(768, 1152);
            case "16:9", "3:2", "5:4" -> new Dimensions(1152, 768);
            case "4:5" -> new Dimensions(896, 1120);
            default -> new Dimensions(1024, 1024);
        };
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) return "https://api.cloudflare.com/client/v4";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null ? fallback : value.trim();
    }

    private boolean configured(String value) {
        return value != null && !value.isBlank()
                && !value.equalsIgnoreCase("placeholder")
                && !value.equalsIgnoreCase("changeme")
                && !value.startsWith("your-");
    }

    private String compact(JsonNode node) {
        return node == null ? "empty response" : compactText(node.toString());
    }

    private String compactText(String value) {
        if (value == null || value.isBlank()) return "no provider details";
        String compact = value.replaceAll("\\s+", " ");
        return compact.substring(0, Math.min(compact.length(), 700));
    }

    private record Dimensions(int width, int height) {}
}
