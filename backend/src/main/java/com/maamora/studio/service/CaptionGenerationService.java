package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Product;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class CaptionGenerationService {

    @Value("${app.gemini.api-key}")
    private String apiKey;

    @Value("${app.gemini.model}")
    private String model;

    @Value("${app.gemini.base-url}")
    private String baseUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private RestClient client() {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("x-goog-api-key", apiKey)
                .defaultHeader("content-type", "application/json")
                .build();
    }

    public String generateCaption(Product product, BrandSettings brand, String language) {
        String prompt = buildPrompt(product, brand, language);

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                )
        );

        String rawResponse = client().post()
                .uri("/models/{model}:generateContent", model)
                .body(body)
                .retrieve()
                .body(String.class);

        return extractText(rawResponse);
    }

    private String buildPrompt(Product product, BrandSettings brand, String language) {
        String languageInstruction = switch (language) {
            case "en" -> "Write in English.";
            case "ar" -> "Write in Modern Standard Arabic.";
            case "darija" -> """
                    Write in Moroccan Darija using Arabic script — never a literal translation from French or \
                    Modern Standard Arabic. It must read like a real Moroccan social media manager wrote it. \
                    Match the tone and phrasing of these examples:

                    "باغي تجري بلا ما تضرك رجلك؟ هاد الصباط خفيف ومريح، كيعاونك تزيد القدام. جودة عالية وتوصيل فابور 📦"
                    "ملّيتي من الطابي القديمة لي كتزلق؟ هاد وحدة ما كتخلّيكش تطيح، وغليظة باش تحمي مفاصلك. كوموندي دابا ✨"
                    "عييتي من السماعات لي كيطيحو فالجري؟ هادو ما كيطيحوش، والباتري كيدوز حتى لـ32 ساعة. الكمية محدودة 🚀"

                    Short sentences, a question up front, everyday words rather than formal Arabic vocabulary, \
                    light emoji use, a sense of urgency near the end.
                    """;
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
                languageInstruction
        );
    }

    private String extractText(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText().trim();
        } catch (Exception e) {
            throw new RuntimeException("Could not parse Gemini response: " + rawJson, e);
        }
    }
}
