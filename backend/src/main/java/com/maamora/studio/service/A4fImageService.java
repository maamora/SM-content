package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * A4F OpenAI-compatible image adapter. It uses image generation for prompts
 * without references and the documented single-image edit endpoint when a
 * product reference is supplied.
 */
@Slf4j
@Service
public class A4fImageService implements ManagedImageService {

    private static final long MAX_REFERENCE_BYTES = 4L * 1024L * 1024L;
    private static final long MAX_OUTPUT_BYTES = 30L * 1024L * 1024L;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String imageModel;
    private final String editModel;
    private final String baseUrl;
    private final String responseFormat;
    private final long timeoutMs;

    public A4fImageService(
            RestTemplateBuilder builder,
            @org.springframework.beans.factory.annotation.Value("${app.a4f.api-key:}") String apiKey,
            @org.springframework.beans.factory.annotation.Value("${app.a4f.image-model:provider-2/flux.1-schnell}") String imageModel,
            @org.springframework.beans.factory.annotation.Value("${app.a4f.edit-model:provider-3/flux-kontext-pro}") String editModel,
            @org.springframework.beans.factory.annotation.Value("${app.a4f.base-url:https://api.a4f.co/v1}") String baseUrl,
            @org.springframework.beans.factory.annotation.Value("${app.a4f.response-format:b64_json}") String responseFormat,
            @org.springframework.beans.factory.annotation.Value("${app.a4f.timeout-ms:120000}") long timeoutMs) {
        this.apiKey = apiKey;
        this.imageModel = valueOrDefault(imageModel, "provider-2/flux.1-schnell");
        this.editModel = valueOrDefault(editModel, "provider-3/flux-kontext-pro");
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.responseFormat = responseFormat.equalsIgnoreCase("url") ? "url" : "b64_json";
        this.timeoutMs = Math.max(20_000, timeoutMs);
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(15))
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
            throw new IllegalStateException("A4F image generation is not configured. Set A4F_API_KEY.");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("An image prompt is required.");
        }

        List<String> cleanReferences = references == null ? List.of() : references.stream()
                .filter(value -> value != null && !value.isBlank())
                .limit(1)
                .toList();
        try {
            JsonNode response = cleanReferences.isEmpty()
                    ? generate(prompt.trim(), normalizeSize(aspectRatio))
                    : edit(prompt.trim(), cleanReferences.get(0));
            return extractImage(response);
        } catch (HttpStatusCodeException e) {
            throw providerError(e);
        }
    }

    private JsonNode generate(String prompt, String size) {
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("model", imageModel);
        body.put("prompt", prompt);
        body.put("n", 1);
        body.put("size", size);
        body.put("response_format", responseFormat);
        return restTemplate.postForObject(
                baseUrl + "/images/generations",
                new HttpEntity<>(body, jsonHeaders()),
                JsonNode.class);
    }

    private JsonNode edit(String prompt, String reference) {
        byte[] referenceBytes = downloadReference(reference);
        if (referenceBytes.length == 0 || referenceBytes.length > MAX_REFERENCE_BYTES) {
            throw new IllegalStateException("A4F product reference must be a non-empty image under 4 MB.");
        }

        HttpHeaders partHeaders = new HttpHeaders();
        partHeaders.setContentType(MediaType.IMAGE_JPEG);
        ByteArrayResource resource = new ByteArrayResource(referenceBytes) {
            @Override
            public String getFilename() {
                return "product-reference.jpg";
            }
        };
        HttpEntity<ByteArrayResource> imagePart = new HttpEntity<>(resource, partHeaders);

        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("model", editModel);
        form.add("prompt", prompt);
        form.add("response_format", responseFormat);
        form.add("image", imagePart);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return restTemplate.postForObject(
                baseUrl + "/images/edits",
                new HttpEntity<>(form, headers),
                JsonNode.class);
    }

    private byte[] extractImage(JsonNode response) {
        JsonNode first = response == null ? null : response.path("data").isArray()
                && !response.path("data").isEmpty() ? response.path("data").get(0) : null;
        if (first == null || first.isMissingNode()) {
            throw new IllegalStateException("A4F returned no image data: " + compact(response));
        }
        String base64 = first.path("b64_json").asText("");
        if (!base64.isBlank()) {
            try {
                byte[] bytes = java.util.Base64.getDecoder().decode(base64);
                validateOutput(bytes);
                return bytes;
            } catch (IllegalArgumentException e) {
                throw new IllegalStateException("A4F returned invalid base64 image data.", e);
            }
        }
        String url = first.path("url").asText("");
        if (url.isBlank()) {
            throw new IllegalStateException("A4F returned neither image data nor an output URL.");
        }
        byte[] bytes = restTemplate.getForObject(url, byte[].class);
        validateOutput(bytes);
        return bytes;
    }

    private byte[] downloadReference(String value) {
        if (!(value.startsWith("https://") || value.startsWith("http://"))) {
            throw new IllegalArgumentException("A4F product editing requires a publicly reachable reference image URL.");
        }
        byte[] bytes = restTemplate.getForObject(value, byte[].class);
        if (bytes == null || bytes.length == 0 || bytes.length > MAX_REFERENCE_BYTES) {
            throw new IllegalStateException("A4F product reference must be a non-empty image under 4 MB.");
        }
        return bytes;
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private IllegalStateException providerError(HttpStatusCodeException e) {
        int status = e.getStatusCode().value();
        String details = compactText(e.getResponseBodyAsString());
        String suffix = status == 401 ? " Check A4F_API_KEY and keep it backend-only."
                : status == 402 ? " Add A4F credits or choose another configured provider."
                : status == 429 ? " A4F rate limits apply; try again or use the configured fallback."
                : "";
        return new IllegalStateException("A4F image generation failed with HTTP " + status + ": " + details + suffix, e);
    }

    private String normalizeSize(String aspectRatio) {
        String normalized = aspectRatio == null ? "1:1" : aspectRatio.trim();
        return switch (normalized) {
            case "16:9", "21:9" -> "1792x1024";
            case "9:16", "2:3" -> "1024x1792";
            default -> "1024x1024";
        };
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) return "https://api.a4f.co/v1";
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
            throw new IllegalStateException("A4F returned an empty or oversized image.");
        }
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
