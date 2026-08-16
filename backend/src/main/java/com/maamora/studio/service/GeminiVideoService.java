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
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class GeminiVideoService implements VideoGenerationService {

    private static final long MAX_INPUT_BYTES = 15L * 1024L * 1024L;
    private static final long MAX_OUTPUT_BYTES = 120L * 1024L * 1024L;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.gemini.video-api-key:}")
    private String apiKey;

    @Value("${app.gemini.video-model:veo-3.1-generate-preview}")
    private String model;

    @Value("${app.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}")
    private String baseUrl;

    @Value("${app.gemini.video-timeout-ms:600000}")
    private long timeoutMs;

    @Value("${app.gemini.video-poll-interval-ms:5000}")
    private long pollIntervalMs;

    public GeminiVideoService(RestTemplateBuilder restTemplateBuilder, ObjectMapper objectMapper) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(15))
                .setReadTimeout(Duration.ofSeconds(60))
                .build();
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean isConfigured() {
        return configured(apiKey) && configured(model) && model.toLowerCase().startsWith("veo-");
    }

    @Override
    public byte[] generateVideo(String imageUrl, String prompt, String aspectRatio) {
        if (!isConfigured()) {
            throw new IllegalStateException("Gemini video generation is not configured or billing/model access is unavailable.");
        }
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new IllegalArgumentException("A generated image URL is required for Gemini video generation.");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("A video prompt is required for Gemini video generation.");
        }

        ImagePayload source = downloadInputImage(imageUrl);
        Map<String, Object> image = new HashMap<>();
        image.put("bytesBase64Encoded", Base64.getEncoder().encodeToString(source.bytes()));
        image.put("mimeType", source.mimeType());

        Map<String, Object> instance = new HashMap<>();
        instance.put("prompt", prompt);
        instance.put("image", image);

        Map<String, Object> parameters = new HashMap<>();
        parameters.put("aspectRatio", normalizeAspectRatio(aspectRatio));
        parameters.put("durationSeconds", 8);
        parameters.put("generateAudio", true);

        Map<String, Object> request = new HashMap<>();
        request.put("instances", List.of(instance));
        request.put("parameters", parameters);

        JsonNode operation = submit(request);
        String operationName = operation.path("name").asText(null);
        if (operationName == null || operationName.isBlank()) {
            throw new IllegalStateException("Gemini returned no video operation name.");
        }

        JsonNode completed = poll(operationName);
        String videoUri = findVideoUri(completed);
        if (videoUri == null) {
            throw new IllegalStateException("Gemini completed without a video URI.");
        }
        return downloadVideo(videoUri);
    }

    private JsonNode submit(Map<String, Object> request) {
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint("/models/" + model + ":predictLongRunning"),
                    HttpMethod.POST,
                    new HttpEntity<>(request, headers()),
                    String.class);
            return parse(response.getBody(), "Gemini video submission response");
        } catch (HttpStatusCodeException e) {
            throw providerError("Gemini video submission failed", e);
        }
    }

    private JsonNode poll(String operationName) {
        long deadline = System.currentTimeMillis() + Math.max(timeoutMs, 30_000L);
        while (System.currentTimeMillis() < deadline) {
            try {
                ResponseEntity<String> response = restTemplate.exchange(
                        endpoint("/" + operationName),
                        HttpMethod.GET,
                        new HttpEntity<>(headers()),
                        String.class);
                JsonNode current = parse(response.getBody(), "Gemini video operation response");
                if (current.path("done").asBoolean(false)) {
                    JsonNode error = current.path("error");
                    if (!error.isMissingNode() && !error.isNull()) {
                        throw new IllegalStateException("Gemini video operation failed: " + error.toString());
                    }
                    return current;
                }
            } catch (HttpStatusCodeException e) {
                if (!e.getStatusCode().is5xxServerError() && e.getStatusCode().value() != 429) {
                    throw providerError("Gemini video polling failed", e);
                }
                log.warn("Retryable Gemini video polling response: HTTP {}", e.getStatusCode().value());
            }
            sleep(Math.max(pollIntervalMs, 1000L));
        }
        throw new IllegalStateException("Gemini video operation did not complete within " + timeoutMs + " ms.");
    }

    private ImagePayload downloadInputImage(String imageUrl) {
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    imageUrl,
                    HttpMethod.GET,
                    new HttpEntity<>(new HttpHeaders()),
                    byte[].class);
            byte[] bytes = response.getBody();
            if (bytes == null || bytes.length == 0) {
                throw new IllegalStateException("The source image is empty.");
            }
            if (bytes.length > MAX_INPUT_BYTES) {
                throw new IllegalStateException("The source image exceeds the configured input limit.");
            }
            MediaType contentType = response.getHeaders().getContentType();
            String mimeType = contentType == null ? "image/png" : contentType.toString();
            if (!mimeType.startsWith("image/")) {
                throw new IllegalStateException("The source URL did not return an image.");
            }
            return new ImagePayload(bytes, mimeType);
        } catch (HttpStatusCodeException e) {
            throw providerError("Gemini could not download the source image", e);
        }
    }

    private byte[] downloadVideo(String videoUri) {
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    videoUri,
                    HttpMethod.GET,
                    new HttpEntity<>(headers()),
                    byte[].class);
            byte[] bytes = response.getBody();
            if (bytes == null || bytes.length == 0) {
                throw new IllegalStateException("Gemini returned an empty video.");
            }
            if (bytes.length > MAX_OUTPUT_BYTES) {
                throw new IllegalStateException("Gemini video exceeds the configured output limit.");
            }
            return bytes;
        } catch (HttpStatusCodeException e) {
            throw providerError("Gemini video download failed", e);
        }
    }

    private String findVideoUri(JsonNode operation) {
        JsonNode response = operation.path("response");
        JsonNode samples = response.path("generateVideoResponse").path("generatedSamples");
        if (samples.isArray()) {
            for (JsonNode sample : samples) {
                String uri = sample.path("video").path("uri").asText(null);
                if (configured(uri)) return uri;
            }
        }
        return findUriRecursively(response);
    }

    private String findUriRecursively(JsonNode node) {
        if (node == null || node.isMissingNode()) return null;
        if (node.isObject()) {
            JsonNode uri = node.get("uri");
            if (uri != null && uri.isTextual() && uri.asText().startsWith("http")) return uri.asText();
            var fields = node.fields();
            while (fields.hasNext()) {
                String found = findUriRecursively(fields.next().getValue());
                if (found != null) return found;
            }
        } else if (node.isArray()) {
            for (JsonNode item : node) {
                String found = findUriRecursively(item);
                if (found != null) return found;
            }
        }
        return null;
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set("x-goog-api-key", apiKey);
        return headers;
    }

    private String endpoint(String path) {
        String normalized = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        return normalized + (path.startsWith("/") ? path : "/" + path);
    }

    private JsonNode parse(String raw, String context) {
        try {
            return objectMapper.readTree(raw == null ? "{}" : raw);
        } catch (Exception e) {
            throw new IllegalStateException("Could not parse " + context + ".", e);
        }
    }

    private RuntimeException providerError(String message, HttpStatusCodeException e) {
        return new IllegalStateException(message + " with HTTP " + e.getStatusCode().value() + ".", e);
    }

    private String normalizeAspectRatio(String aspectRatio) {
        return "9:16".equals(aspectRatio) ? "9:16" : "16:9";
    }

    private boolean configured(String value) {
        return value != null && !value.isBlank() && !value.equalsIgnoreCase("placeholder")
                && !value.equalsIgnoreCase("changeme");
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for Gemini video.", e);
        }
    }

    private record ImagePayload(byte[] bytes, String mimeType) { }
}
