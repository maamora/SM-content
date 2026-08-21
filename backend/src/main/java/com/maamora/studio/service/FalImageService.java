package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Managed fal.ai adapter for FLUX.1 Kontext Pro.
 *
 * The documented Kontext endpoint accepts one reference image URL. This adapter
 * therefore supports text-to-image and single-reference editing and rejects
 * multi-reference requests explicitly instead of silently dropping a model or
 * product image.
 */
@Slf4j
@Service
public class FalImageService implements ManagedImageService {

    private static final long MAX_OUTPUT_BYTES = 25L * 1024L * 1024L;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.fal.key:}")
    private String apiKey;

    @Value("${app.fal.model:fal-ai/flux-pro/kontext}")
    private String model;

    @Value("${app.fal.base-url:https://fal.run}")
    private String baseUrl;

    private final long timeoutMs;

    public FalImageService(
            RestTemplateBuilder restTemplateBuilder,
            ObjectMapper objectMapper,
            @Value("${app.fal.timeout-ms:180000}") long timeoutMs) {
        this.timeoutMs = Math.max(timeoutMs, 30_000L);
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(15))
                .setReadTimeout(Duration.ofMillis(this.timeoutMs))
                .build();
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return configured(apiKey);
    }

    public boolean isVideoConfigured() {
        return false;
    }

    public byte[] generateImage(String prompt, String aspectRatio) {
        return generateImage(prompt, aspectRatio, List.of());
    }

    public byte[] generateImage(String prompt, String aspectRatio, List<String> referenceImages) {
        if (!isConfigured()) {
            throw new IllegalStateException("fal.ai image generation is not configured. Set FAL_KEY.");
        }
        List<String> references = referenceImages == null ? List.of() : referenceImages.stream()
                .filter(value -> value != null && !value.isBlank())
                .toList();
        if (references.size() > 1) {
            throw new IllegalStateException(
                    "fal.ai FLUX Kontext currently supports one reference image per request; "
                            + "a product-plus-model photo shoot requires a two-stage workflow or a composite reference.");
        }

        Map<String, Object> body = new HashMap<>();
        body.put("prompt", prompt);
        if (aspectRatio != null && !aspectRatio.isBlank()) {
            body.put("aspect_ratio", aspectRatio);
        }
        body.put("num_images", 1);
        body.put("output_format", "png");
        if (!references.isEmpty()) {
            body.put("image_url", references.get(0));
        }

        JsonNode response = submit(body);
        String imageUrl = findImageUrl(response);
        if (imageUrl == null) {
            throw new IllegalStateException("fal.ai completed without an image URL.");
        }
        return downloadMedia(imageUrl);
    }

    private JsonNode submit(Map<String, Object> body) {
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint(),
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers()),
                    String.class);
            return parse(response.getBody(), "fal.ai response");
        } catch (HttpStatusCodeException e) {
            int status = e.getStatusCode().value();
            String detail = e.getResponseBodyAsString();
            if (detail != null && detail.length() > 500) detail = detail.substring(0, 500);
            throw new IllegalStateException(providerErrorMessage(status, detail), e);
        }
    }

    private String providerErrorMessage(int status, String detail) {
        String normalized = detail == null ? "" : detail.toUpperCase(Locale.ROOT);
        if (status == 403 && (normalized.contains("TOP_UP") || normalized.contains("USER IS LOCKED"))) {
            return "fal.ai rejected image generation because this account is locked pending a top-up. "
                    + "Add balance or configure another image provider, then retry.";
        }
        return "fal.ai image generation failed with HTTP " + status
                + (detail == null || detail.isBlank() ? "." : ": " + detail);
    }

    private byte[] downloadMedia(String mediaUrl) {
        ResponseEntity<byte[]> response = restTemplate.exchange(
                mediaUrl,
                HttpMethod.GET,
                new HttpEntity<>(new HttpHeaders()),
                byte[].class);
        byte[] bytes = response.getBody();
        if (bytes == null || bytes.length == 0) {
            throw new IllegalStateException("fal.ai returned an empty image.");
        }
        if (bytes.length > MAX_OUTPUT_BYTES) {
            throw new IllegalStateException("fal.ai image exceeds the configured output limit.");
        }
        return bytes;
    }

    private JsonNode parse(String rawJson, String context) {
        try {
            return objectMapper.readTree(rawJson == null ? "{}" : rawJson);
        } catch (Exception e) {
            throw new IllegalStateException("Could not parse " + context + ".", e);
        }
    }

    private String findImageUrl(JsonNode response) {
        JsonNode images = response.path("images");
        if (images.isArray()) {
            for (JsonNode image : images) {
                String url = image.path("url").asText(null);
                if (url != null && (url.startsWith("https://") || url.startsWith("http://"))) return url;
            }
        }
        String url = response.path("image_url").asText(null);
        return url != null && (url.startsWith("https://") || url.startsWith("http://")) ? url : null;
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("Authorization", "Key " + apiKey);
        return headers;
    }

    private String endpoint() {
        String normalizedBase = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        return normalizedBase + "/" + model;
    }

    private boolean configured(String value) {
        return value != null && !value.isBlank()
                && !value.equalsIgnoreCase("placeholder")
                && !value.equalsIgnoreCase("changeme");
    }
}
