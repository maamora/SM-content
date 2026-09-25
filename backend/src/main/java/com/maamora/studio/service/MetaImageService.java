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
import java.util.Map;
import java.util.Set;

/**
 * Meta Model API (Muse Image) adapter.
 *
 * Both text-only and reference-grounded jobs go through the OpenAI-compatible
 * single-shot endpoints: POST /images/generations for a plain prompt, POST
 * /images/edits for one or more reference images. Unlike xAI's /images/edits
 * (single "image" field only), Meta's edit endpoint accepts an "images" array
 * over raw HTTP, so this adapter can pass every reference STUDIO has instead
 * of dropping extras.
 */
@Service
public class MetaImageService implements ManagedImageService {

    private static final long MAX_OUTPUT_BYTES = 30L * 1024L * 1024L;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public MetaImageService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.meta.api-key:}") String apiKey,
            @Value("${app.meta.image-model:muse-image-1.0}") String model,
            @Value("${app.meta.base-url:https://api.meta.ai/v1}") String baseUrl,
            @Value("${app.meta.image-timeout-ms:180000}") long timeoutMs) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model == null || model.isBlank() ? "muse-image-1.0" : model.trim();
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(20))
                .setReadTimeout(Duration.ofMillis(Math.max(timeoutMs, 30_000L)))
                .build();
    }

    @Override
    public boolean isConfigured() {
        return configured(apiKey);
    }

    @Override
    public byte[] generateImage(String prompt, String aspectRatio, List<String> references) {
        if (!isConfigured()) {
            throw new IllegalStateException("Meta image generation is not configured. Set MODEL_API_KEY.");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("An image prompt is required.");
        }

        List<String> cleanReferences = references == null ? List.of() : references.stream()
                .filter(value -> value != null && !value.isBlank())
                .limit(10)
                .toList();

        try {
            String rawResponse = cleanReferences.isEmpty()
                    ? generateFromPrompt(prompt, aspectRatio)
                    : editFromReferences(prompt, cleanReferences);
            return decodeImage(rawResponse);
        } catch (HttpStatusCodeException e) {
            int status = e.getStatusCode().value();
            String detail = truncate(e.getResponseBodyAsString());
            throw new IllegalStateException("Meta image generation failed with HTTP " + status
                    + (detail.isBlank() ? "." : ": " + detail), e);
        }
    }

    private String generateFromPrompt(String prompt, String aspectRatio) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("prompt", prompt.trim());
        body.put("size", normalizeSize(aspectRatio));
        body.put("response_format", "b64_json");
        body.put("output_format", "png");
        body.put("n", 1);
        return restTemplate.postForObject(
                baseUrl + "/images/generations",
                new HttpEntity<>(body, jsonHeaders()),
                String.class);
    }

    private String editFromReferences(String prompt, List<String> references) {
        List<Map<String, Object>> images = new ArrayList<>();
        for (String reference : references) {
            images.add(Map.of("image_url", reference));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("prompt", prompt.trim());
        body.put("images", images);
        body.put("response_format", "b64_json");
        body.put("output_format", "png");
        body.put("n", 1);

        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl + "/images/edits", HttpMethod.POST, new HttpEntity<>(body, jsonHeaders()), String.class);
        return response.getBody();
    }

    private byte[] decodeImage(String rawResponse) {
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode data = root.path("data");
            if (!data.isArray() || data.isEmpty()) {
                throw new IllegalStateException("Meta completed without an image: " + truncate(rawResponse));
            }
            String encoded = data.get(0).path("b64_json").asText("");
            if (encoded.isBlank()) {
                throw new IllegalStateException("Meta completed without base64 image data.");
            }
            byte[] output = Base64.getDecoder().decode(encoded);
            if (output.length == 0 || output.length > MAX_OUTPUT_BYTES) {
                throw new IllegalStateException("Meta returned an invalid image payload.");
            }
            return output;
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Could not parse the Meta image response.", e);
        }
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private static final Set<String> KNOWN_RATIOS = Set.of("1:1", "9:16", "16:9", "2:3", "3:2", "4:5", "5:4", "21:9", "9:21");

    private String normalizeSize(String aspectRatio) {
        String normalized = aspectRatio == null || !KNOWN_RATIOS.contains(aspectRatio.trim()) ? "1:1" : aspectRatio.trim();
        // "size" only hints the aspect ratio to Muse Image — the model renders at
        // its own native resolution — so any reasonable WxH pair for the ratio works.
        return switch (normalized) {
            case "9:16", "2:3", "9:21" -> "1024x1536";
            case "16:9", "3:2", "21:9", "5:4", "4:5" -> "1536x1024";
            default -> "1024x1024";
        };
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) return "https://api.meta.ai/v1";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private boolean configured(String value) {
        return value != null && !value.isBlank()
                && !value.equalsIgnoreCase("placeholder")
                && !value.equalsIgnoreCase("changeme");
    }

    private String truncate(String value) {
        if (value == null || value.isBlank()) return "";
        String compact = value.replaceAll("\\s+", " ");
        return compact.substring(0, Math.min(compact.length(), 700));
    }
}
