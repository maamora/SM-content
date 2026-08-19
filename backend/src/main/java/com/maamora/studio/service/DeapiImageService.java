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
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

/**
 * deAPI native v2 image adapter. Requests are asynchronous: submit a job,
 * poll its status, then download the completed result URL.
 */
@Slf4j
@Service
public class DeapiImageService implements ManagedImageService {

    private static final long MAX_INPUT_BYTES = 10L * 1024L * 1024L;
    private static final long MAX_OUTPUT_BYTES = 30L * 1024L * 1024L;
    private static final Set<String> ASPECT_RATIOS = Set.of(
            "16:9", "1:1", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String generationModel;
    private final String editModel;
    private final String baseUrl;
    private final int steps;
    private final double guidance;
    private final long pollIntervalMs;
    private final long timeoutMs;
    private final Random random = new Random();

    public DeapiImageService(
            RestTemplateBuilder builder,
            @Value("${app.deapi.api-key:}") String apiKey,
            @Value("${app.deapi.image-model:Flux1schnell}") String generationModel,
            @Value("${app.deapi.edit-model:QwenImageEdit_Plus_NF4}") String editModel,
            @Value("${app.deapi.base-url:https://api.deapi.ai}") String baseUrl,
            @Value("${app.deapi.steps:4}") int steps,
            @Value("${app.deapi.guidance:7.5}") double guidance,
            @Value("${app.deapi.poll-interval-ms:3000}") long pollIntervalMs,
            @Value("${app.deapi.timeout-ms:180000}") long timeoutMs) {
        this.apiKey = apiKey;
        this.generationModel = valueOrDefault(generationModel, "Flux1schnell");
        this.editModel = valueOrDefault(editModel, "QwenImageEdit_Plus_NF4");
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.steps = Math.max(1, steps);
        this.guidance = guidance > 0 ? guidance : 7.5;
        this.pollIntervalMs = Math.max(500, pollIntervalMs);
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
            throw new IllegalStateException("deAPI image generation is not configured. Set DEAPI_API_KEY.");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("An image prompt is required.");
        }
        List<String> cleanReferences = references == null ? List.of() : references.stream()
                .filter(value -> value != null && !value.isBlank())
                .limit(4)
                .toList();
        try {
            String requestId = cleanReferences.isEmpty()
                    ? submitGeneration(prompt, aspectRatio)
                    : submitEdit(prompt, aspectRatio, cleanReferences);
            return awaitResult(requestId);
        } catch (HttpStatusCodeException e) {
            throw providerError(e);
        }
    }

    private String submitGeneration(String prompt, String aspectRatio) {
        Dimensions dimensions = dimensions(aspectRatio);
        Map<String, Object> body = Map.of(
                "prompt", prompt,
                "model", generationModel,
                "width", dimensions.width(),
                "height", dimensions.height(),
                "guidance", guidance,
                "steps", steps,
                "seed", random.nextInt(Integer.MAX_VALUE));
        JsonNode response = restTemplate.postForObject(
                baseUrl + "/api/v2/images/generations",
                new HttpEntity<>(body, jsonHeaders()),
                JsonNode.class);
        return requestId(response);
    }

    private String submitEdit(String prompt, String aspectRatio, List<String> references) {
        Dimensions dimensions = dimensions(aspectRatio);
        try {
            return submitEditAttempt(prompt, dimensions, references);
        } catch (HttpStatusCodeException e) {
            if (references.size() > 1 && e.getStatusCode().value() == 422) {
                log.warn("deAPI edit model rejected multiple references; retrying product-only with one reference");
                return submitEditAttempt(prompt, dimensions, references.subList(0, 1));
            }
            throw e;
        }
    }

    private String submitEditAttempt(String prompt, Dimensions dimensions, List<String> references) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("prompt", prompt);
        body.add("model", editModel);
        body.add("width", dimensions.width());
        body.add("height", dimensions.height());
        body.add("guidance", guidance);
        body.add("steps", steps);
        body.add("seed", random.nextInt(Integer.MAX_VALUE));
        for (int index = 0; index < references.size(); index++) {
            byte[] bytes = downloadReference(references.get(index));
            if (bytes.length > MAX_INPUT_BYTES) {
                throw new IllegalStateException("Reference image exceeds deAPI's 10 MB input limit.");
            }
            int current = index;
            body.add("images[]", new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return "reference-" + current + ".png";
                }
            });
        }
        HttpHeaders headers = authHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        JsonNode response = restTemplate.postForObject(
                baseUrl + "/api/v2/images/edits",
                new HttpEntity<>(body, headers),
                JsonNode.class);
        return requestId(response);
    }

    private byte[] awaitResult(String requestId) {
        long deadline = System.currentTimeMillis() + timeoutMs;
        while (System.currentTimeMillis() < deadline) {
            try {
                JsonNode response = restTemplate.exchange(
                        baseUrl + "/api/v2/jobs/" + requestId,
                        org.springframework.http.HttpMethod.GET,
                        new HttpEntity<>(authHeaders()),
                        JsonNode.class).getBody();
                JsonNode data = response == null ? null : response.path("data");
                String status = data == null ? "" : data.path("status").asText("");
                if ("done".equalsIgnoreCase(status)) {
                    String resultUrl = data.path("result_url").asText("");
                    if (resultUrl.isBlank()) {
                        throw new IllegalStateException("deAPI completed without a result URL.");
                    }
                    return downloadResult(resultUrl);
                }
                if ("error".equalsIgnoreCase(status)) {
                    throw new IllegalStateException("deAPI image job failed: " + compact(response));
                }
                sleep();
            } catch (HttpStatusCodeException e) {
                throw providerError(e);
            }
        }
        throw new IllegalStateException("deAPI image generation timed out after " + timeoutMs + " ms.");
    }

    private byte[] downloadReference(String url) {
        byte[] bytes = restTemplate.getForObject(url, byte[].class);
        if (bytes == null || bytes.length == 0) {
            throw new IllegalStateException("Reference image URL returned an empty response.");
        }
        return bytes;
    }

    private byte[] downloadResult(String url) {
        byte[] bytes = restTemplate.getForObject(url, byte[].class);
        if (bytes == null || bytes.length == 0 || bytes.length > MAX_OUTPUT_BYTES) {
            throw new IllegalStateException("deAPI returned an invalid image result.");
        }
        return bytes;
    }

    private String requestId(JsonNode response) {
        String requestId = response == null ? "" : response.path("data").path("request_id").asText("");
        if (requestId.isBlank()) {
            throw new IllegalStateException("deAPI did not return a request_id: " + compact(response));
        }
        return requestId;
    }

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = authHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private void sleep() {
        try {
            Thread.sleep(pollIntervalMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for deAPI image generation.", e);
        }
    }

    private IllegalStateException providerError(HttpStatusCodeException e) {
        return new IllegalStateException("deAPI image generation failed with HTTP "
                + e.getStatusCode().value() + ": " + compactText(e.getResponseBodyAsString()), e);
    }

    private String compact(JsonNode node) {
        return node == null ? "empty response" : compactText(node.toString());
    }

    private String compactText(String value) {
        if (value == null || value.isBlank()) return "no provider details";
        String compact = value.replaceAll("\\s+", " ");
        return compact.substring(0, Math.min(compact.length(), 700));
    }

    private Dimensions dimensions(String aspectRatio) {
        String normalized = aspectRatio == null ? "1:1" : aspectRatio.trim();
        if (!ASPECT_RATIOS.contains(normalized)) normalized = "1:1";
        return switch (normalized) {
            case "9:16", "2:3" -> new Dimensions(512, 768);
            case "16:9", "3:2", "21:9", "5:4", "4:5" -> new Dimensions(768, 512);
            default -> new Dimensions(512, 512);
        };
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) return "https://api.deapi.ai";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private boolean configured(String value) {
        return value != null && !value.isBlank()
                && !value.equalsIgnoreCase("placeholder")
                && !value.equalsIgnoreCase("changeme");
    }

    private record Dimensions(int width, int height) {}
}
