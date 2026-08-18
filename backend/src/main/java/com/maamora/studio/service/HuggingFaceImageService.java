package com.maamora.studio.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Hugging Face Inference Providers image adapter.
 *
 * The token stays on the backend. The hosted inference route returns image
 * bytes directly for text-to-image requests. Reference-image editing is kept
 * explicit until a configured provider/model exposes a verified image-to-image
 * contract through the selected Hugging Face route.
 */
@Slf4j
@Service
public class HuggingFaceImageService implements ManagedImageService {

    private static final long MAX_OUTPUT_BYTES = 30L * 1024L * 1024L;

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final long timeoutMs;

    public HuggingFaceImageService(
            RestTemplateBuilder builder,
            @org.springframework.beans.factory.annotation.Value("${app.huggingface.api-key:}") String apiKey,
            @org.springframework.beans.factory.annotation.Value("${app.huggingface.image-model:black-forest-labs/FLUX.1-schnell}") String model,
            @org.springframework.beans.factory.annotation.Value("${app.huggingface.base-url:https://router.huggingface.co/hf-inference/models}") String baseUrl,
            @org.springframework.beans.factory.annotation.Value("${app.huggingface.timeout-ms:180000}") long timeoutMs) {
        this.apiKey = apiKey;
        this.model = valueOrDefault(model, "black-forest-labs/FLUX.1-schnell");
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.timeoutMs = Math.max(30_000, timeoutMs);
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(20))
                .setReadTimeout(Duration.ofMillis(this.timeoutMs))
                .build();
    }

    @Override
    public boolean isConfigured() {
        return configured(apiKey);
    }

    @Override
    public byte[] generateImage(String prompt, String aspectRatio, List<String> references) {
        if (!isConfigured()) {
            throw new IllegalStateException("Hugging Face image generation is not configured. Set HUGGINGFACE_API_KEY.");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("An image prompt is required.");
        }
        List<String> cleanReferences = references == null ? List.of() : references.stream()
                .filter(value -> value != null && !value.isBlank())
                .toList();
        if (!cleanReferences.isEmpty()) {
            throw new IllegalStateException("Hugging Face image editing is unavailable for the selected route. Use text generation or configure a verified image-edit provider.");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("inputs", prompt.trim());
        body.put("parameters", Map.of("width", width(aspectRatio), "height", height(aspectRatio)));

        try {
            ResponseEntity<byte[]> response = restTemplate.postForEntity(
                    baseUrl + "/" + model,
                    new HttpEntity<>(body, jsonHeaders()),
                    byte[].class);
            byte[] bytes = response.getBody();
            validateOutput(bytes);
            return bytes;
        } catch (HttpStatusCodeException e) {
            throw providerError(e);
        }
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.IMAGE_PNG, MediaType.IMAGE_JPEG, MediaType.APPLICATION_OCTET_STREAM, MediaType.APPLICATION_JSON));
        return headers;
    }

    private IllegalStateException providerError(HttpStatusCodeException e) {
        int status = e.getStatusCode().value();
        String details = e.getResponseBodyAsString();
        if (details == null || details.isBlank()) details = "no provider details";
        details = details.replaceAll("\\s+", " ");
        details = details.substring(0, Math.min(details.length(), 700));
        String suffix = status == 401 ? " Check HUGGINGFACE_API_KEY."
                : status == 402 ? " Hugging Face credits or provider access are unavailable."
                : status == 429 ? " Hugging Face rate limits or free credits may be exhausted."
                : status == 503 ? " The selected model is loading or temporarily unavailable; retry shortly."
                : "";
        return new IllegalStateException("Hugging Face image generation failed with HTTP " + status + ": " + details + suffix, e);
    }

    private int width(String aspectRatio) {
        return switch (normalizeAspect(aspectRatio)) {
            case "16:9", "21:9" -> 1024;
            case "9:16", "2:3" -> 768;
            default -> 1024;
        };
    }

    private int height(String aspectRatio) {
        return switch (normalizeAspect(aspectRatio)) {
            case "16:9", "21:9" -> 576;
            case "9:16", "2:3" -> 1024;
            default -> 1024;
        };
    }

    private String normalizeAspect(String value) {
        return value == null || value.isBlank() ? "1:1" : value.trim();
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) return "https://router.huggingface.co/hf-inference/models";
        String normalized = value.trim();
        return normalized.endsWith("/") ? normalized.substring(0, normalized.length() - 1) : normalized;
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private boolean configured(String value) {
        return value != null && !value.isBlank()
                && !value.equalsIgnoreCase("placeholder")
                && !value.equalsIgnoreCase("changeme")
                && !value.startsWith("your-");
    }

    private void validateOutput(byte[] bytes) {
        if (bytes == null || bytes.length == 0 || bytes.length > MAX_OUTPUT_BYTES) {
            throw new IllegalStateException("Hugging Face returned an empty or oversized image.");
        }
    }
}
