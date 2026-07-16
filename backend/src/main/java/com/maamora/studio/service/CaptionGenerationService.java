package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Product;
import com.maamora.studio.exception.CaptionGenerationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Calls the Claude API to draft social captions in French, Arabic, and Darija.
 * Server-side only — the API key must never reach the frontend.
 */
@Service
@Slf4j
public class CaptionGenerationService {

    @Value("${app.anthropic.api-key}")
    private String apiKey;

    @Value("${app.anthropic.model}")
    private String model;

    @Value("${app.anthropic.base-url}")
    private String baseUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private RestClient client() {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("x-api-key", apiKey)
                .defaultHeader("anthropic-version", "2023-06-01")
                .defaultHeader("content-type", "application/json")
                .build();
    }

    /**
     * Generates one caption for a single language. Called up to 3x per post
     * (fr, ar, darija) — see BatchJobService for how batches cap concurrency
     * so this doesn't blow through the Claude API rate limit.
     */
    public String generateCaption(Product product, BrandSettings brand, String language) {
        String prompt = buildPrompt(product, brand, language);

        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", 400,
                "messages", new Object[] {
                        Map.of("role", "user", "content", prompt)
                });

        String rawResponse = client().post()
                .body(body)
                .retrieve()
                .body(String.class);

        return extractText(rawResponse);
    }

    private String buildPrompt(Product product, BrandSettings brand, String language) {
        String languageInstruction = switch (language) {
            case "ar" -> "Write in Modern Standard Arabic.";
            case "darija" -> "Write in Moroccan Darija, using Arabic script, the way a real Moroccan social "
                    + "media manager would write it — never a literal translation from French/MSA. It must "
                    + "sound natural and local, not machine-translated.";
            default -> "Write in French.";
        };

        return """
                You are writing a short social media caption (Instagram/Facebook/WhatsApp) for a Moroccan brand.

                Brand: %s
                Brand tone: %s

                Product: %s
                Description: %s
                Key selling point: %s
                Price: %s

                %s

                Keep it punchy, include relevant emojis sparingly, end with 2-3 relevant hashtags.
                Return ONLY the caption text, no preamble, no explanation.
                """.formatted(
                brand.getName(),
                brand.getToneGuidelines() != null ? brand.getToneGuidelines() : "friendly, energetic, on-brand",
                product.getName(),
                product.getDescription(),
                product.getSellingPoint() != null ? product.getSellingPoint() : "-",
                product.getPrice() != null ? product.getPrice() + " MAD" : "-",
                languageInstruction);
    }

    private String extractText(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            return root.path("content").get(0).path("text").asText().trim();
        } catch (Exception e) {
            log.error("Caption generation failed. JSON response: {}", rawJson, e);
            throw new CaptionGenerationException("Could not parse Claude response", e);
        }
    }
}
