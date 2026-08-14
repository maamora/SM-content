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
import java.util.Map;

/**
 * Higgsfield's image API is asynchronous, while STUDIO's current post endpoint
 * intentionally remains synchronous. This adapter bridges the two contracts by
 * submitting one request, polling the server-provided status URL, downloading
 * the completed image, and returning bytes to the existing overlay pipeline.
 */
@Slf4j
@Service
public class HiggsfieldImageService {

    private static final int MAX_SUBMIT_ATTEMPTS = 3;
    private static final long MAX_OUTPUT_BYTES = 25L * 1024L * 1024L;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.higgsfield.api-key-id:}")
    private String apiKeyId;

    @Value("${app.higgsfield.api-key-secret:}")
    private String apiKeySecret;

    @Value("${app.higgsfield.model:flux-pro/kontext/max/text-to-image}")
    private String model;

    @Value("${app.higgsfield.reference-model:flux-pro/kontext/max/image-to-image}")
    private String referenceModel;

    @Value("${app.higgsfield.video-model:}")
    private String videoModel;

    @Value("${app.higgsfield.base-url:https://platform.higgsfield.ai}")
    private String baseUrl;

    @Value("${app.higgsfield.timeout-ms:180000}")
    private long timeoutMs;

    @Value("${app.higgsfield.poll-interval-ms:3000}")
    private long pollIntervalMs;

    public HiggsfieldImageService(RestTemplateBuilder restTemplateBuilder, ObjectMapper objectMapper) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(15))
                .setReadTimeout(Duration.ofSeconds(45))
                .build();
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return configured(apiKeyId) && configured(apiKeySecret);
    }

    public boolean isVideoConfigured() {
        return isConfigured() && configured(videoModel);
    }

    public byte[] generateImage(String prompt, String aspectRatio) {
        return generateImage(prompt, aspectRatio, List.of());
    }

    public byte[] generateImage(String prompt, String aspectRatio, List<String> referenceImages) {
        if (!isConfigured()) {
            throw new IllegalStateException("Higgsfield image generation is not configured.");
        }

        Map<String, Object> input = new HashMap<>();
        input.put("prompt", prompt);
        input.put("aspect_ratio", aspectRatio);
        input.put("safety_tolerance", 2);
        if (referenceImages != null && !referenceImages.isEmpty()) {
            input.put("input_images", referenceImages);
        }
        Map<String, Object> body = Map.of("input", input);

        String targetModel = referenceImages != null && !referenceImages.isEmpty() && configured(referenceModel)
                ? referenceModel
                : model;
        JsonNode initialResponse = submit("/" + targetModel, body);
        String statusUrl = text(initialResponse, "status_url");
        String requestId = text(initialResponse, "request_id");
        if (statusUrl == null || requestId == null) {
            throw new IllegalStateException("Higgsfield returned no request status URL.");
        }

        JsonNode completed = poll(statusUrl, requestId);
        String imageUrl = findImageUrl(completed);
        if (imageUrl == null) {
            throw new IllegalStateException("Higgsfield completed without an image URL.");
        }

        return downloadMedia(imageUrl, "image");
    }

    public byte[] generateVideo(String imageUrl, String prompt, String aspectRatio) {
        if (!isVideoConfigured()) {
            throw new IllegalStateException("Higgsfield video generation is not configured.");
        }
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IllegalArgumentException("A public generated image URL is required for video generation.");
        }

        Map<String, Object> input = new HashMap<>();
        input.put("prompt", prompt);
        input.put("input_images", List.of(imageUrl));
        input.put("aspect_ratio", aspectRatio);
        input.put("duration", 5);

        JsonNode initialResponse = submit("/" + videoModel, Map.of("input", input));
        String statusUrl = text(initialResponse, "status_url");
        String requestId = text(initialResponse, "request_id");
        if (statusUrl == null || requestId == null) {
            throw new IllegalStateException("Higgsfield returned no video request status URL.");
        }

        JsonNode completed = poll(statusUrl, requestId);
        String videoUrl = findVideoUrl(completed);
        if (videoUrl == null) {
            throw new IllegalStateException("Higgsfield completed without a video URL.");
        }
        return downloadMedia(videoUrl, "video");
    }

    private JsonNode submit(String targetModel, Map<String, Object> body) {
        RuntimeException lastError = null;
        for (int attempt = 1; attempt <= MAX_SUBMIT_ATTEMPTS; attempt++) {
            try {
                ResponseEntity<String> response = restTemplate.exchange(
                        endpoint(targetModel),
                        HttpMethod.POST,
                        new HttpEntity<>(body, headers()),
                        String.class);
                return parse(response.getBody(), "Higgsfield submission response");
            } catch (HttpStatusCodeException e) {
                lastError = new RuntimeException(
                        "Higgsfield submission failed with HTTP " + e.getStatusCode().value(), e);
                boolean retryable = e.getStatusCode().value() == 429 || e.getStatusCode().is5xxServerError();
                if (!retryable || attempt == MAX_SUBMIT_ATTEMPTS) {
                    throw lastError;
                }
                log.warn("Higgsfield submission retry {}/{} after HTTP {}", attempt, MAX_SUBMIT_ATTEMPTS,
                        e.getStatusCode().value());
                sleep(2000L * attempt);
            }
        }
        throw lastError != null ? lastError : new IllegalStateException("Higgsfield submission failed.");
    }

    private JsonNode poll(String statusUrl, String requestId) {
        long deadline = System.currentTimeMillis() + Math.max(timeoutMs, 10_000L);
        while (System.currentTimeMillis() < deadline) {
            ResponseEntity<String> response;
            try {
                response = restTemplate.exchange(
                        absoluteOrRelative(statusUrl),
                        HttpMethod.GET,
                        new HttpEntity<>(headers()),
                        String.class);
            } catch (HttpStatusCodeException e) {
                if (e.getStatusCode().value() == 429 || e.getStatusCode().is5xxServerError()) {
                    sleep(Math.max(pollIntervalMs, 3000L));
                    continue;
                }
                throw new RuntimeException("Higgsfield status request failed with HTTP "
                        + e.getStatusCode().value(), e);
            }

            JsonNode current = parse(response.getBody(), "Higgsfield status response");
            String status = current.path("status").asText("").toLowerCase();
            if ("completed".equals(status)) {
                return current;
            }
            if (List.of("failed", "nsfw", "canceled").contains(status)) {
                String error = current.path("error").asText("no additional details");
                throw new IllegalStateException("Higgsfield request " + requestId
                        + " ended with status " + status + ": " + error);
            }
            sleep(Math.max(pollIntervalMs, 500L));
        }
        throw new IllegalStateException("Higgsfield request " + requestId
                + " did not complete within " + timeoutMs + " ms.");
    }

    private byte[] downloadMedia(String mediaUrl, String mediaType) {
        ResponseEntity<byte[]> response = restTemplate.exchange(
                absoluteOrRelative(mediaUrl),
                HttpMethod.GET,
                new HttpEntity<>(new HttpHeaders()),
                byte[].class);
        byte[] bytes = response.getBody();
        if (bytes == null || bytes.length == 0) {
            throw new IllegalStateException("Higgsfield returned an empty " + mediaType + ".");
        }
        if (bytes.length > MAX_OUTPUT_BYTES) {
            throw new IllegalStateException("Higgsfield " + mediaType + " exceeds the configured output limit.");
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
                String url = text(image, "url");
                if (url != null && (url.startsWith("https://") || url.startsWith("http://"))) {
                    return url;
                }
            }
        }
        return null;
    }

    private String findVideoUrl(JsonNode response) {
        JsonNode videos = response.path("videos");
        if (videos.isArray()) {
            for (JsonNode video : videos) {
                String url = text(video, "url");
                if (url != null && (url.startsWith("https://") || url.startsWith("http://"))) {
                    return url;
                }
            }
        }
        return text(response, "video_url");
    }

    private String text(JsonNode node, String field) {
        String value = node.path(field).asText(null);
        return value == null || value.isBlank() ? null : value;
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("Authorization", "Key " + apiKeyId + ":" + apiKeySecret);
        return headers;
    }

    private String endpoint(String path) {
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        String normalizedBase = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        return normalizedBase + (path.startsWith("/") ? path : "/" + path);
    }

    private String absoluteOrRelative(String path) {
        return endpoint(path);
    }

    private boolean configured(String value) {
        return value != null && !value.isBlank()
                && !value.equalsIgnoreCase("placeholder")
                && !value.equalsIgnoreCase("changeme");
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for Higgsfield.", e);
        }
    }
}
