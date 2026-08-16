package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * OpenAI GPT Image adapter. Text-only jobs use /images/generations; jobs with
 * product/model references use /images/edits so multiple source images are
 * preserved instead of silently discarded.
 */
@Slf4j
@Service
public class OpenAIImageService implements ManagedImageService {

    private static final long MAX_INPUT_BYTES = 20L * 1024L * 1024L;
    private static final long MAX_OUTPUT_BYTES = 30L * 1024L * 1024L;
    private static final Set<String> ASPECT_RATIOS = Set.of(
            "16:9", "1:1", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21");

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final String quality;

    public OpenAIImageService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.openai.api-key:}") String apiKey,
            @Value("${app.openai.image-model:gpt-image-1}") String model,
            @Value("${app.openai.base-url:https://api.openai.com/v1}") String baseUrl,
            @Value("${app.openai.image-quality:medium}") String quality,
            @Value("${app.openai.image-timeout-ms:180000}") long timeoutMs) {
        this.apiKey = apiKey;
        this.model = model == null || model.isBlank() ? "gpt-image-1" : model.trim();
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.quality = quality == null || quality.isBlank() ? "medium" : quality.trim().toLowerCase();
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
    public byte[] generateImage(String prompt, String aspectRatio, List<String> referenceImages) {
        if (!isConfigured()) {
            throw new IllegalStateException("OpenAI image generation is not configured. Set OPENAI_API_KEY.");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("An image prompt is required.");
        }

        List<String> references = referenceImages == null ? List.of() : referenceImages.stream()
                .filter(value -> value != null && !value.isBlank())
                .limit(16)
                .toList();

        try {
            String rawResponse = references.isEmpty()
                    ? generateFromPrompt(prompt, aspectRatio)
                    : editFromReferences(prompt, aspectRatio, references);
            return decodeImage(rawResponse);
        } catch (HttpStatusCodeException e) {
            int status = e.getStatusCode().value();
            String detail = truncate(e.getResponseBodyAsString());
            throw new IllegalStateException("OpenAI image generation failed with HTTP " + status
                    + (detail.isBlank() ? "." : ": " + detail), e);
        }
    }

    private String generateFromPrompt(String prompt, String aspectRatio) {
        Map<String, Object> body = Map.of(
                "model", model,
                "prompt", prompt,
                "size", normalizeSize(aspectRatio),
                "quality", quality,
                "output_format", "png",
                "n", 1);
        return restTemplate.postForObject(
                baseUrl + "/images/generations",
                new HttpEntity<>(body, jsonHeaders()),
                String.class);
    }

    private String editFromReferences(String prompt, String aspectRatio, List<String> references) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("model", model);
        body.add("prompt", prompt);
        body.add("size", normalizeSize(aspectRatio));
        body.add("quality", quality);
        body.add("output_format", "png");
        body.add("input_fidelity", "high");
        for (int index = 0; index < references.size(); index++) {
            byte[] bytes = downloadReference(references.get(index));
            if (bytes.length > MAX_INPUT_BYTES) {
                throw new IllegalStateException("Reference image exceeds OpenAI's 20 MB input limit.");
            }
            int current = index;
            body.add("image[]", new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return "reference-" + current + ".png";
                }
            });
        }
        HttpHeaders headers = jsonHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl + "/images/edits", HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
        return response.getBody();
    }

    private byte[] downloadReference(String referenceUrl) {
        ResponseEntity<byte[]> response = restTemplate.exchange(
                referenceUrl, HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), byte[].class);
        byte[] bytes = response.getBody();
        if (bytes == null || bytes.length == 0) {
            throw new IllegalStateException("Reference image URL returned an empty response.");
        }
        return bytes;
    }

    private byte[] decodeImage(String rawResponse) {
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode data = root.path("data");
            if (!data.isArray() || data.isEmpty()) {
                throw new IllegalStateException("OpenAI completed without an image: " + truncate(rawResponse));
            }
            String encoded = data.get(0).path("b64_json").asText("");
            if (encoded.isBlank()) {
                throw new IllegalStateException("OpenAI completed without base64 image data.");
            }
            byte[] output = Base64.getDecoder().decode(encoded);
            if (output.length == 0 || output.length > MAX_OUTPUT_BYTES) {
                throw new IllegalStateException("OpenAI returned an invalid image payload.");
            }
            return output;
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Could not parse the OpenAI image response.", e);
        }
    }

    private HttpHeaders jsonHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private String normalizeSize(String aspectRatio) {
        String normalized = aspectRatio == null ? "1:1" : aspectRatio.trim();
        if (!ASPECT_RATIOS.contains(normalized)) normalized = "1:1";
        return switch (normalized) {
            case "9:16", "2:3" -> "1024x1536";
            case "16:9", "3:2", "21:9", "5:4", "4:5" -> "1536x1024";
            default -> "1024x1024";
        };
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) return "https://api.openai.com/v1";
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
