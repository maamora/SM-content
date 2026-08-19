package com.maamora.studio.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
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
import java.util.Set;

/**
 * Managed Stability AI adapter for Stable Image Ultra/Core.
 *
 * The current v2beta generation contract accepts text plus at most one starting
 * image. Product-plus-model jobs must therefore use the processor's product-only
 * fallback or a pre-composed reference board; this adapter never silently drops
 * a second reference.
 */
@Slf4j
@Service
public class StabilityImageService implements ManagedImageService {

    private static final long MAX_INPUT_BYTES = 10L * 1024L * 1024L;
    private static final long MAX_OUTPUT_BYTES = 25L * 1024L * 1024L;
    private static final Set<String> ASPECT_RATIOS = Set.of(
            "16:9", "1:1", "21:9", "2:3", "3:2", "4:5", "5:4", "9:16", "9:21");

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public StabilityImageService(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${app.stability.api-key:}") String apiKey,
            @Value("${app.stability.model:ultra}") String model,
            @Value("${app.stability.base-url:https://api.stability.ai}") String baseUrl,
            @Value("${app.stability.timeout-ms:180000}") long timeoutMs) {
        this.apiKey = apiKey;
        this.model = normalizeModel(model);
        this.baseUrl = normalizeBaseUrl(baseUrl);
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(15))
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
            throw new IllegalStateException("Stability AI image generation is not configured. Set STABILITY_API_KEY.");
        }
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException("An image prompt is required.");
        }

        List<String> references = referenceImages == null ? List.of() : referenceImages.stream()
                .filter(value -> value != null && !value.isBlank())
                .toList();
        if (references.size() > 1) {
            throw new IllegalStateException(
                    "Stability AI accepts one starting image per request; use product-only mode or a composite reference for product-plus-model shoots.");
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("prompt", prompt);
        body.add("negative_prompt", "text, watermark, logo distortion, duplicate product, malformed hands, low resolution");
        body.add("aspect_ratio", normalizeAspectRatio(aspectRatio));
        body.add("output_format", "png");
        body.add("style_preset", "photographic");

        if (!references.isEmpty()) {
            byte[] input = downloadReference(references.get(0));
            if (input.length > MAX_INPUT_BYTES) {
                throw new IllegalStateException("The reference image exceeds Stability AI's 10 MB input limit.");
            }
            body.add("image", new ByteArrayResource(input) {
                @Override
                public String getFilename() {
                    return "reference.png";
                }
            });
            body.add("strength", "0.45");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setAccept(List.of(MediaType.IMAGE_PNG, MediaType.IMAGE_JPEG, MediaType.parseMediaType("image/webp")));
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    endpoint(), HttpMethod.POST, request, byte[].class);
            byte[] output = response.getBody();
            if (output == null || output.length == 0) {
                throw new IllegalStateException("Stability AI completed without an image.");
            }
            if (output.length > MAX_OUTPUT_BYTES) {
                throw new IllegalStateException("Stability AI image exceeds the configured output limit.");
            }
            return output;
        } catch (HttpStatusCodeException e) {
            int status = e.getStatusCode().value();
            String detail = truncate(e.getResponseBodyAsString());
            throw new IllegalStateException(providerErrorMessage(status, detail), e);
        }
    }

    private byte[] downloadReference(String referenceUrl) {
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    referenceUrl, HttpMethod.GET, new HttpEntity<>(new HttpHeaders()), byte[].class);
            byte[] bytes = response.getBody();
            if (bytes == null || bytes.length == 0) {
                throw new IllegalStateException("The reference image URL returned an empty response.");
            }
            return bytes;
        } catch (HttpStatusCodeException e) {
            throw new IllegalStateException("Could not download the reference image for Stability AI.", e);
        }
    }

    private String providerErrorMessage(int status, String detail) {
        String normalized = detail == null ? "" : detail.toUpperCase(Locale.ROOT);
        if (status == 401) {
            return "Stability AI rejected the request because the API key is invalid or missing. Check STABILITY_API_KEY.";
        }
        if (status == 403 && (normalized.contains("CREDIT") || normalized.contains("BALANCE")
                || normalized.contains("TOP_UP") || normalized.contains("QUOTA"))) {
            return "Stability AI rejected image generation because the account has no available credits or quota. Add credits or choose another provider, then retry.";
        }
        if (status == 403) {
            return "Stability AI rejected the request, possibly because of content moderation. Review the prompt and reference image.";
        }
        if (status == 413) {
            return "Stability AI rejected the request because the image payload is too large. Use an image under 10 MB.";
        }
        if (status == 429) {
            return "Stability AI rate-limited the request. Wait briefly and retry.";
        }
        if (status == 422 || status == 400) {
            return "Stability AI rejected the image request parameters"
                    + (detail == null || detail.isBlank() ? "." : ": " + detail);
        }
        return "Stability AI image generation failed with HTTP " + status
                + (detail == null || detail.isBlank() ? "." : ": " + detail);
    }

    private String endpoint() {
        return baseUrl + "/v2beta/stable-image/generate/" + model;
    }

    private String normalizeModel(String value) {
        String normalized = value == null || value.isBlank() ? "ultra" : value.trim().toLowerCase(Locale.ROOT);
        return normalized.equals("core") ? "core" : "ultra";
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) return "https://api.stability.ai";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String normalizeAspectRatio(String value) {
        return value != null && ASPECT_RATIOS.contains(value.trim()) ? value.trim() : "1:1";
    }

    private boolean configured(String value) {
        return value != null && !value.isBlank()
                && !value.equalsIgnoreCase("placeholder")
                && !value.equalsIgnoreCase("changeme");
    }

    private String truncate(String value) {
        if (value == null || value.isBlank()) return "";
        return value.length() > 600 ? value.substring(0, 600) : value;
    }
}
