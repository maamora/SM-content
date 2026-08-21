package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Gemini image-generation adapter for STUDIO's server-backed visual workflow.
 *
 * Gemini accepts text and inline image inputs in one interaction. That allows
 * a product visual, Photo Shoot, and supported image-edit job to use the same
 * provider without exposing the API key to the browser.
 */
@Service
public class GeminiImageService implements ManagedImageService {

    private static final int MAX_REFERENCES = 14;
    private static final long MAX_REFERENCE_BYTES = 12L * 1024L * 1024L;
    private static final Set<String> ASPECT_RATIOS = Set.of(
            "1:1", "9:16", "16:9", "2:3", "3:2", "4:5", "5:4");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public GeminiImageService(
            RestTemplateBuilder builder,
            ObjectMapper objectMapper,
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.image-model:gemini-3.1-flash-image}") String model,
            @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
            @Value("${app.gemini.image-timeout-ms:180000}") long timeoutMs) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model == null || model.isBlank() ? "gemini-3.1-flash-image" : model.trim();
        this.baseUrl = stripTrailingSlash(baseUrl);
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(20))
                .setReadTimeout(Duration.ofMillis(Math.max(30_000, timeoutMs)))
                .build();
    }

    @Override
    public boolean isConfigured() {
        return !apiKey.isBlank() && !model.isBlank();
    }

    @Override
    public byte[] generateImage(String prompt, String aspectRatio, List<String> references) {
        if (!isConfigured()) {
            throw new IllegalStateException("Gemini image generation is not configured. Set GEMINI_API_KEY.");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("An image prompt is required.");
        }

        try {
            List<Map<String, Object>> input = new ArrayList<>();
            input.add(Map.of("type", "text", "text", prompt.trim()));
            for (String reference : cleanReferences(references)) {
                input.add(inlineImage(reference));
            }

            Map<String, Object> responseFormat = new LinkedHashMap<>();
            responseFormat.put("type", "image");
            responseFormat.put("mime_type", "image/png");
            responseFormat.put("aspect_ratio", normalizeAspectRatio(aspectRatio));
            responseFormat.put("image_size", "1K");

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", model);
            body.put("input", input);
            body.put("response_format", responseFormat);

            JsonNode response = restTemplate.postForObject(
                    baseUrl + "/interactions",
                    new HttpEntity<>(body, jsonHeaders()),
                    JsonNode.class);
            String imageData = response == null ? "" : response.path("output_image").path("data").asText("");
            if (imageData.isBlank()) {
                throw new IllegalStateException("Gemini completed without an image output.");
            }
            try {
                byte[] image = Base64.getDecoder().decode(stripDataPrefix(imageData));
                if (image.length == 0) throw new IllegalStateException("Gemini returned an empty image output.");
                return image;
            } catch (IllegalArgumentException invalidBase64) {
                throw new IllegalStateException("Gemini returned an invalid image output.", invalidBase64);
            }
        } catch (HttpStatusCodeException error) {
            throw providerError(error);
        }
    }

    private Map<String, Object> inlineImage(String url) {
        ResponseEntity<byte[]> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(imageHeaders()),
                byte[].class);
        byte[] bytes = response.getBody();
        if (bytes == null || bytes.length == 0 || bytes.length > MAX_REFERENCE_BYTES) {
            throw new IllegalStateException("A reference image is empty or exceeds the 12 MB limit.");
        }
        MediaType contentType = response.getHeaders().getContentType();
        String mimeType = contentType != null && "image".equalsIgnoreCase(contentType.getType())
                ? contentType.toString()
                : mimeTypeFor(url);
        return Map.of(
                "type", "image",
                "mime_type", mimeType,
                "data", Base64.getEncoder().encodeToString(bytes));
    }

    private List<String> cleanReferences(List<String> references) {
        if (references == null) return List.of();
        return references.stream()
                .filter(value -> value != null && !value.isBlank())
                .limit(MAX_REFERENCES)
                .toList();
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-goog-api-key", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private HttpHeaders imageHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.IMAGE_PNG, MediaType.IMAGE_JPEG, MediaType.valueOf("image/webp")));
        return headers;
    }

    private IllegalStateException providerError(HttpStatusCodeException error) {
        int status = error.getStatusCode().value();
        String details = error.getResponseBodyAsString();
        String compact = details == null ? "" : details.replaceAll("\\s+", " ").trim();
        if (compact.length() > 360) compact = compact.substring(0, 360);
        return new IllegalStateException("Gemini image generation failed with HTTP " + status
                + (compact.isBlank() ? "." : ": " + compact), error);
    }

    private String normalizeAspectRatio(String value) {
        String normalized = value == null ? "1:1" : value.trim();
        return ASPECT_RATIOS.contains(normalized) ? normalized : "1:1";
    }

    private String mimeTypeFor(String url) {
        String lower = url.toLowerCase(Locale.ROOT);
        if (lower.contains(".jpg") || lower.contains(".jpeg")) return "image/jpeg";
        if (lower.contains(".webp")) return "image/webp";
        return "image/png";
    }

    private String stripDataPrefix(String value) {
        int comma = value.indexOf(',');
        return value.startsWith("data:") && comma >= 0 ? value.substring(comma + 1) : value;
    }

    private String stripTrailingSlash(String value) {
        String normalized = value == null || value.isBlank()
                ? "https://generativelanguage.googleapis.com/v1beta"
                : value.trim();
        return normalized.endsWith("/") ? normalized.substring(0, normalized.length() - 1) : normalized;
    }
}
