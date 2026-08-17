package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Hosted Replicate adapter for Black Forest Labs FLUX.2 [dev].
 * Replicate predictions are asynchronous: create a prediction, poll it, then download the output.
 */
@Slf4j
@Service
public class ReplicateImageService implements ManagedImageService {

    private static final long MAX_OUTPUT_BYTES = 30L * 1024L * 1024L;
    private static final Set<String> ASPECT_RATIOS = Set.of(
            "16:9", "1:1", "2:3", "3:2", "4:5", "5:4", "9:16");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiToken;
    private final String model;
    private final String baseUrl;
    private final long pollIntervalMs;
    private final long timeoutMs;
    private final int maxReferences;

    public ReplicateImageService(
            RestTemplateBuilder builder,
            @Value("${app.replicate.api-token:}") String apiToken,
            @Value("${app.replicate.model:black-forest-labs/flux-2-dev}") String model,
            @Value("${app.replicate.base-url:https://api.replicate.com/v1}") String baseUrl,
            @Value("${app.replicate.poll-interval-ms:3000}") long pollIntervalMs,
            @Value("${app.replicate.timeout-ms:180000}") long timeoutMs,
            @Value("${app.replicate.max-references:10}") int maxReferences) {
        this.apiToken = apiToken;
        this.model = valueOrDefault(model, "black-forest-labs/flux-2-dev");
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.pollIntervalMs = Math.max(500, pollIntervalMs);
        this.timeoutMs = Math.max(30_000, timeoutMs);
        this.maxReferences = Math.max(1, Math.min(maxReferences, 10));
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(20))
                .setReadTimeout(Duration.ofMillis(this.timeoutMs))
                .build();
    }

    @Override
    public boolean isConfigured() {
        return configured(apiToken);
    }

    @Override
    public byte[] generateImage(String prompt, String aspectRatio, List<String> references) {
        if (!isConfigured()) {
            throw new IllegalStateException("Replicate image generation is not configured. Set REPLICATE_API_TOKEN.");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("An image prompt is required.");
        }

        List<String> cleanReferences = references == null ? List.of() : references.stream()
                .filter(value -> value != null && !value.isBlank())
                .limit(maxReferences)
                .toList();
        try {
            String predictionId = submitPrediction(prompt, aspectRatio, cleanReferences);
            String outputUrl = awaitPrediction(predictionId);
            return downloadOutput(outputUrl);
        } catch (HttpStatusCodeException e) {
            throw providerError(e);
        }
    }

    private String submitPrediction(String prompt, String aspectRatio, List<String> references) {
        Map<String, Object> input = new HashMap<>();
        input.put("prompt", prompt.trim());
        input.put("aspect_ratio", normalizeAspectRatio(aspectRatio));
        input.put("output_format", "png");
        if (!references.isEmpty()) {
            input.put("input_images", references);
        }

        Map<String, Object> body = Map.of("input", input);
        JsonNode response = restTemplate.postForObject(
                baseUrl + "/models/" + model + "/predictions",
                new HttpEntity<>(body, jsonHeaders()),
                JsonNode.class);
        String id = response == null ? "" : response.path("id").asText("");
        if (id.isBlank()) {
            throw new IllegalStateException("Replicate returned no prediction ID: " + compact(response));
        }
        return id;
    }

    private String awaitPrediction(String predictionId) {
        long deadline = System.currentTimeMillis() + timeoutMs;
        String lastStatus = "unknown";
        while (System.currentTimeMillis() < deadline) {
            ResponseEntity<JsonNode> responseEntity = restTemplate.exchange(
                    baseUrl + "/predictions/" + predictionId,
                    HttpMethod.GET,
                    new HttpEntity<>(jsonHeaders()),
                    JsonNode.class);
            JsonNode response = responseEntity.getBody();
            lastStatus = response == null ? "unknown" : response.path("status").asText("unknown");
            if ("succeeded".equalsIgnoreCase(lastStatus)) {
                String output = outputUrl(response);
                if (output.isBlank()) {
                    throw new IllegalStateException("Replicate completed without an output image: " + compact(response));
                }
                return output;
            }
            if ("failed".equalsIgnoreCase(lastStatus) || "canceled".equalsIgnoreCase(lastStatus)) {
                throw new IllegalStateException("Replicate image generation " + lastStatus + ": "
                        + compactText(response == null ? "" : response.path("error").asText("no provider details")));
            }
            sleep(pollIntervalMs);
        }
        throw new IllegalStateException("Replicate image generation timed out after " + timeoutMs
                + " ms; last status was " + lastStatus + ".");
    }

    private String outputUrl(JsonNode response) {
        JsonNode output = response == null ? null : response.path("output");
        if (output == null || output.isMissingNode() || output.isNull()) return "";
        if (output.isTextual()) return output.asText("");
        if (output.isArray() && !output.isEmpty()) return output.get(0).asText("");
        return "";
    }

    private byte[] downloadOutput(String url) {
        if (url == null || url.isBlank() || !(url.startsWith("https://") || url.startsWith("http://"))) {
            throw new IllegalStateException("Replicate returned an invalid output URL.");
        }
        ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity.EMPTY, byte[].class);
        byte[] bytes = response.getBody();
        if (bytes == null || bytes.length == 0 || bytes.length > MAX_OUTPUT_BYTES) {
            throw new IllegalStateException("Replicate returned an empty or oversized image.");
        }
        return bytes;
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private String normalizeAspectRatio(String value) {
        String normalized = value == null ? "1:1" : value.trim();
        return ASPECT_RATIOS.contains(normalized) ? normalized : "1:1";
    }

    private void sleep(long delayMs) {
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Replicate image polling was interrupted.", e);
        }
    }

    private IllegalStateException providerError(HttpStatusCodeException e) {
        return new IllegalStateException("Replicate image generation failed with HTTP "
                + e.getStatusCode().value() + ": " + compactText(e.getResponseBodyAsString()), e);
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) return "https://api.replicate.com/v1";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
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

    private String compact(JsonNode node) {
        return node == null ? "empty response" : compactText(node.toString());
    }

    private String compactText(String value) {
        if (value == null || value.isBlank()) return "no provider details";
        String compact = value.replaceAll("\\s+", " ");
        return compact.substring(0, Math.min(compact.length(), 700));
    }
}
