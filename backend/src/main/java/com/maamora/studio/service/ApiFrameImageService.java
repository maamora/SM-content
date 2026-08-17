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
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Hosted ApiFrame adapter. ApiFrame accepts one key for multiple image models,
 * creates an asynchronous job, and returns CDN-hosted output URLs.
 */
@Slf4j
@Service
public class ApiFrameImageService implements ManagedImageService {

    private static final long MAX_OUTPUT_BYTES = 30L * 1024L * 1024L;
    private static final Set<String> ASPECT_RATIOS = Set.of(
            "16:9", "1:1", "2:3", "3:2", "4:5", "5:4", "9:16", "21:9");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final long pollIntervalMs;
    private final long timeoutMs;
    private final String outputFormat;

    public ApiFrameImageService(
            RestTemplateBuilder builder,
            @Value("${app.apiframe.api-key:}") String apiKey,
            @Value("${app.apiframe.model:flux-2-pro}") String model,
            @Value("${app.apiframe.base-url:https://api.apiframe.ai/v2}") String baseUrl,
            @Value("${app.apiframe.poll-interval-ms:3000}") long pollIntervalMs,
            @Value("${app.apiframe.timeout-ms:180000}") long timeoutMs,
            @Value("${app.apiframe.output-format:png}") String outputFormat) {
        this.apiKey = apiKey;
        this.model = valueOrDefault(model, "flux-2-pro");
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.pollIntervalMs = Math.max(500, pollIntervalMs);
        this.timeoutMs = Math.max(30_000, timeoutMs);
        this.outputFormat = valueOrDefault(outputFormat, "png");
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
            throw new IllegalStateException("ApiFrame image generation is not configured. Set APIFRAME_API_KEY.");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("An image prompt is required.");
        }

        List<String> cleanReferences = references == null ? List.of() : references.stream()
                .filter(value -> value != null && !value.isBlank())
                .limit(maxReferences())
                .toList();
        try {
            String jobId = submit(prompt.trim(), normalizeAspectRatio(aspectRatio), cleanReferences);
            String resultUrl = awaitResult(jobId);
            return downloadResult(resultUrl);
        } catch (HttpStatusCodeException e) {
            throw providerError(e);
        }
    }

    private String submit(String prompt, String aspectRatio, List<String> references) {
        Map<String, Object> body = new HashMap<>();
        body.put("prompt", prompt);
        body.put("model", model);
        Map.Entry<String, Object> parameters = modelParams(aspectRatio, references);
        body.put(parameters.getKey(), parameters.getValue());

        JsonNode response = restTemplate.postForObject(
                baseUrl + "/images/generate",
                new HttpEntity<>(body, jsonHeaders()),
                JsonNode.class);
        String jobId = response == null ? "" : response.path("jobId").asText("");
        if (jobId.isBlank()) {
            throw new IllegalStateException("ApiFrame returned no jobId: " + compact(response));
        }
        return jobId;
    }

    private Map.Entry<String, Object> modelParams(String aspectRatio, List<String> references) {
        Map<String, Object> params = new HashMap<>();
        String lower = model.toLowerCase(Locale.ROOT);
        params.put("aspect_ratio", references.isEmpty() ? aspectRatio : "match_input_image");
        if (lower.startsWith("flux-2")) {
            params.put("output_format", outputFormat);
            if (!references.isEmpty()) params.put("input_images", references);
        } else if (lower.equals("seedream-4")) {
            params.put("size", "2K");
            if (!references.isEmpty()) params.put("image_input", references);
        } else if (lower.startsWith("seedream-5")) {
            params.put("output_format", outputFormat);
            if (!references.isEmpty()) params.put("image_input", references);
        } else if (lower.startsWith("nano-banana")) {
            params.put("output_format", outputFormat);
            if (!references.isEmpty()) params.put("image_input", references);
        }


        String key;
        if (lower.startsWith("flux-2")) key = "fluxParams";
        else if (lower.startsWith("seedream")) key = "seedreamParams";
        else if (lower.startsWith("nano-banana")) key = "nanoBananaParams";
        else if (lower.startsWith("grok")) key = "grokParams";
        else key = "imageParams";
        return Map.entry(key, params);
    }

    private String awaitResult(String jobId) {
        long deadline = System.currentTimeMillis() + timeoutMs;
        String lastStatus = "unknown";
        while (System.currentTimeMillis() < deadline) {
            try {
                JsonNode response = restTemplate.exchange(
                        baseUrl + "/jobs/" + jobId,
                        HttpMethod.GET,
                        new HttpEntity<>(jsonHeaders()),
                        JsonNode.class).getBody();
                lastStatus = response == null ? "unknown" : response.path("status").asText("unknown");
                String normalized = lastStatus.toLowerCase(Locale.ROOT);
                if (normalized.equals("completed") || normalized.equals("succeeded") || normalized.equals("done")) {
                    String resultUrl = firstImageUrl(response == null ? null : response.path("result"));
                    if (resultUrl.isBlank()) {
                        throw new IllegalStateException("ApiFrame completed without an output image: " + compact(response));
                    }
                    return resultUrl;
                }
                if (normalized.equals("failed") || normalized.equals("error") || normalized.equals("canceled")) {
                    throw new IllegalStateException("ApiFrame image job " + normalized + ": " + compact(response));
                }
                sleep();
            } catch (HttpStatusCodeException e) {
                throw providerError(e);
            }
        }
        throw new IllegalStateException("ApiFrame image generation timed out after " + timeoutMs
                + " ms; last status was " + lastStatus + ".");
    }

    private String firstImageUrl(JsonNode result) {
        if (result == null || result.isMissingNode() || result.isNull()) return "";
        JsonNode images = result.path("images");
        if (images.isArray() && !images.isEmpty()) return images.get(0).asText("");
        return result.path("imageUrl").asText("");
    }

    private byte[] downloadResult(String url) {
        if (url == null || url.isBlank() || !(url.startsWith("https://") || url.startsWith("http://"))) {
            throw new IllegalStateException("ApiFrame returned an invalid output URL.");
        }
        ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, HttpEntity.EMPTY, byte[].class);
        byte[] bytes = response.getBody();
        if (bytes == null || bytes.length == 0 || bytes.length > MAX_OUTPUT_BYTES) {
            throw new IllegalStateException("ApiFrame returned an empty or oversized image.");
        }
        return bytes;
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-Key", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private IllegalStateException providerError(HttpStatusCodeException e) {
        int status = e.getStatusCode().value();
        String details = compactText(e.getResponseBodyAsString());
        String suffix = status == 402
                ? " Add credits or choose another configured provider."
                : "";
        return new IllegalStateException("ApiFrame image generation failed with HTTP " + status + ": " + details + suffix, e);
    }

    private int maxReferences() {
        String lower = model.toLowerCase(Locale.ROOT);
        if (lower.equals("nano-banana")) return 14;
        if (lower.startsWith("seedream-5")) return 10;
        if (lower.startsWith("seedream")) return 10;
        if (lower.startsWith("flux-2")) return 8;
        return 4;
    }

    private String normalizeAspectRatio(String value) {
        String normalized = value == null ? "1:1" : value.trim();
        return ASPECT_RATIOS.contains(normalized) ? normalized : "1:1";
    }

    private void sleep() {
        try {
            Thread.sleep(pollIntervalMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("ApiFrame image polling was interrupted.", e);
        }
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) return "https://api.apiframe.ai/v2";
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

    private String compact(JsonNode node) {
        return node == null ? "empty response" : compactText(node.toString());
    }

    private String compactText(String value) {
        if (value == null || value.isBlank()) return "no provider details";
        String compact = value.replaceAll("\\s+", " ");
        return compact.substring(0, Math.min(compact.length(), 700));
    }
}
