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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * xAI (Grok Imagine) image-generation adapter.
 *
 * Text-only jobs call POST /v1/images/generations (OpenAI-compatible body).
 * Jobs with a product/reference image call POST /v1/images/edits instead,
 * since xAI's edit endpoint takes a single "image" field rather than an
 * array — only the first reference is used for that call; STUDIO's normal
 * multi-reference "Photo Shoot" flow should stay on a provider that supports
 * more than one source image (Gemini, OpenAI) until xAI's multi-image-edit
 * endpoint is wired in separately.
 */
@Slf4j
@Service
public class XaiImageService implements ManagedImageService {

    private static final Set<String> ASPECT_RATIOS = Set.of(
            "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "2:1", "1:2", "21:9", "auto");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public XaiImageService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.xai.api-key:}") String apiKey,
            @Value("${app.xai.image-model:grok-imagine-image-2.0}") String model,
            @Value("${app.xai.base-url:https://api.x.ai/v1}") String baseUrl,
            @Value("${app.xai.image-timeout-ms:180000}") long timeoutMs) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model == null || model.isBlank() ? "grok-imagine-image-2.0" : model.trim();
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
            throw new IllegalStateException("xAI image generation is not configured. Set XAI_API_KEY.");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("An image prompt is required.");
        }

        List<String> cleanReferences = references == null ? List.of() : references.stream()
                .filter(value -> value != null && !value.isBlank())
                .toList();

        try {
            String rawResponse = cleanReferences.isEmpty()
                    ? generateFromPrompt(prompt, aspectRatio)
                    : editFromReference(prompt, cleanReferences.get(0));
            if (cleanReferences.size() > 1) {
                log.warn("xAI image edit only accepts a single reference image; {} extra reference(s) were ignored.",
                        cleanReferences.size() - 1);
            }
            return decodeImage(rawResponse);
        } catch (HttpStatusCodeException e) {
            int status = e.getStatusCode().value();
            String detail = truncate(e.getResponseBodyAsString());
            throw new IllegalStateException("xAI image generation failed with HTTP " + status
                    + (detail.isBlank() ? "." : ": " + detail), e);
        }
    }

    private String generateFromPrompt(String prompt, String aspectRatio) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("prompt", prompt.trim());
        body.put("aspect_ratio", normalizeAspectRatio(aspectRatio));
        body.put("response_format", "b64_json");
        return restTemplate.postForObject(
                baseUrl + "/images/generations",
                new HttpEntity<>(body, jsonHeaders()),
                String.class);
    }

    private String editFromReference(String prompt, String referenceUrl) {
        Map<String, Object> image = new LinkedHashMap<>();
        image.put("url", referenceUrl);
        image.put("type", "image_url");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("prompt", prompt.trim());
        body.put("image", image);
        body.put("response_format", "b64_json");

        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl + "/images/edits", HttpMethod.POST, new HttpEntity<>(body, jsonHeaders()), String.class);
        return response.getBody();
    }

    private byte[] decodeImage(String rawResponse) {
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode data = root.path("data");
            if (!data.isArray() || data.isEmpty()) {
                throw new IllegalStateException("xAI completed without an image: " + truncate(rawResponse));
            }
            JsonNode first = data.get(0);
            String encoded = first.path("b64_json").asText("");
            if (!encoded.isBlank()) {
                byte[] output = Base64.getDecoder().decode(encoded);
                if (output.length == 0) throw new IllegalStateException("xAI returned an empty image payload.");
                return output;
            }
            String url = first.path("url").asText("");
            if (url.isBlank()) {
                throw new IllegalStateException("xAI completed without base64 or URL image data.");
            }
            return downloadReference(url);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Could not parse the xAI image response.", e);
        }
    }

    private byte[] downloadReference(String url) {
        ResponseEntity<byte[]> response = restTemplate.exchange(
                url, HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), byte[].class);
        byte[] bytes = response.getBody();
        if (bytes == null || bytes.length == 0) {
            throw new IllegalStateException("xAI's returned image URL responded with an empty body.");
        }
        return bytes;
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private String normalizeAspectRatio(String value) {
        String normalized = value == null || value.isBlank() ? "auto" : value.trim();
        if (ASPECT_RATIOS.contains(normalized)) return normalized;
        // STUDIO's other providers also accept 4:5 / 5:4 (portrait/landscape product
        // crops); xAI's closest supported equivalents are 3:4 / 4:3.
        return switch (normalized) {
            case "4:5" -> "3:4";
            case "5:4" -> "4:3";
            case "9:21" -> "9:19.5";
            default -> "auto";
        };
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) return "https://api.x.ai/v1";
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
