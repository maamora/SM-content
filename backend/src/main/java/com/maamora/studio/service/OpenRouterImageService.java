package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** OpenRouter image-output adapter for models that support modalities=[text,image]. */
@Slf4j
@Service
public class OpenRouterImageService implements ManagedImageService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.openrouter.api-key:}")
    private String apiKey;

    @Value("${app.openrouter.image-model:google/gemini-2.5-flash-image-preview}")
    private String model;

    @Value("${app.openrouter.base-url:https://openrouter.ai/api/v1}")
    private String baseUrl;

    @Value("${app.openrouter.image-timeout-ms:180000}")
    private int timeoutMs;

    @Override
    public boolean isConfigured() {
        return configured(apiKey) && configured(model);
    }

    @Override
    public byte[] generateImage(String prompt, String aspectRatio, List<String> references) {
        if (!isConfigured()) {
            throw new IllegalStateException("OpenRouter image generation is unavailable: configure OPENROUTER_API_KEY and OPENROUTER_IMAGE_MODEL.");
        }

        List<Map<String, Object>> content = new ArrayList<>();
        content.add(Map.of("type", "text", "text", buildPrompt(prompt, aspectRatio)));
        if (references != null) {
            references.stream()
                    .filter(this::configured)
                    .limit(2)
                    .forEach(reference -> content.add(Map.of(
                            "type", "image_url",
                            "image_url", Map.of("url", reference))));
        }

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", List.of(Map.of("role", "user", "content", content)));
        body.put("modalities", List.of("text", "image"));

        try {
            String raw = RestClient.builder()
                    .baseUrl(baseUrl)
                    .defaultHeader("Authorization", "Bearer " + apiKey)
                    .defaultHeader("HTTP-Referer", "http://localhost:3000")
                    .defaultHeader("X-Title", "STUDIO")
                    .defaultHeader("content-type", MediaType.APPLICATION_JSON_VALUE)
                    .build()
                    .post()
                    .uri("/chat/completions")
                    .body(body)
                    .retrieve()
                    .body(String.class);
            return extractImage(raw);
        } catch (HttpStatusCodeException e) {
            throw new IllegalStateException("OpenRouter image generation failed with HTTP "
                    + e.getStatusCode().value() + ": " + compact(e.getResponseBodyAsString()), e);
        } catch (Exception e) {
            throw new IllegalStateException("OpenRouter image generation failed: " + e.getMessage(), e);
        }
    }

    private byte[] extractImage(String raw) {
        try {
            JsonNode root = objectMapper.readTree(raw);
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                throw new IllegalStateException("OpenRouter returned no image choices.");
            }
            JsonNode message = choices.get(0).path("message");
            JsonNode images = message.path("images");
            if (images.isArray() && !images.isEmpty()) {
                JsonNode image = images.get(0);
                String data = image.path("image_url").path("url").asText("");
                if (data.isBlank()) {
                    data = image.path("url").asText("");
                }
                if (!data.isBlank()) {
                    return decodeOrDownload(data);
                }
            }
            String content = message.path("content").asText("");
            if (content.startsWith("data:image/")) {
                return decodeOrDownload(content);
            }
            throw new IllegalStateException("OpenRouter returned text but no image output. Verify that OPENROUTER_IMAGE_MODEL supports image output.");
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Could not decode OpenRouter image response.", e);
        }
    }

    private byte[] decodeOrDownload(String value) {
        if (value.startsWith("data:")) {
            int comma = value.indexOf(',');
            if (comma < 0) {
                throw new IllegalStateException("OpenRouter returned an invalid image data URL.");
            }
            return Base64.getDecoder().decode(value.substring(comma + 1));
        }
        return RestClient.create().get().uri(URI.create(value)).retrieve().body(byte[].class);
    }

    private String buildPrompt(String prompt, String aspectRatio) {
        return "Generate a production-ready commercial product image. Aspect ratio: "
                + (configured(aspectRatio) ? aspectRatio : "1:1")
                + ". Preserve the referenced product accurately, keep branding and product text legible, and follow this creative direction: "
                + prompt;
    }

    private String compact(String body) {
        if (body == null || body.isBlank()) return "no provider details";
        return body.replaceAll("\\s+", " ").substring(0, Math.min(body.length(), 500));
    }

    private boolean configured(String value) {
        return value != null && !value.isBlank();
    }
}
