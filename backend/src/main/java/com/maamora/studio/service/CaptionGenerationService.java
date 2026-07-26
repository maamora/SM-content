package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Post;
import com.maamora.studio.model.Product;
import com.maamora.studio.exception.CaptionGenerationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
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

    public String generateCaption(Post post, BrandSettings brand, String language) {
        String prompt = buildPrompt(post, brand, language);

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))));

        String rawResponse = client().post()
                .uri("/models/{model}:generateContent", model)
                .body(body)
                .retrieve()
                .body(String.class);

        return extractText(rawResponse);
    }

    private String buildPrompt(Post post, BrandSettings brand, String language) {
        Product product = post.getProduct();
        String languageInstruction = switch (language) {
            case "en" -> "Write in English.";
            case "ar" -> "Write in Modern Standard Arabic.";
            case "darija" ->
                """
                        Write in Moroccan Darija using Arabic script — never a literal translation from French or \
                        Modern Standard Arabic. It must read like a real Moroccan social media manager wrote it. \
                        Match the tone and phrasing of these examples (use them just for review/reference of the tone):

                        "باغي تجري بلا ما تضرك رجلك؟ هاد الصباط خفيف ومريح، كيعاونك تزيد القدام. جودة عالية وتوصيل فابور 📦"
                        "ملّيتي من الطابي القديمة لي كتزلق؟ هاد وحدة ما كتخلّيكش تطيح، وغليظة باش تحمي مفاصلك. كوموندي دابا ✨"
                        "عييتي من السماعات لي كيطيحو فالجري؟ هادو ما كيطيحوش، والباتري كيدوز حتى لـ32 ساعة. الكمية محدودة 🚀"

                        Short sentences, a question up front, everyday words rather than formal Arabic vocabulary, \
                        light emoji use, a sense of urgency near the end.
                        """;
            default -> "Write in French.";
        };

        return """
                You are an expert social media copywriter and brand strategist.
                Write a highly engaging, professional, and perfectly designed social media caption
                (for Instagram/Facebook/WhatsApp) for a Moroccan brand.

                Brand: %s
                Brand tone: %s

                Product Details:
                - Name: %s
                - Description: %s
                - Key Selling Point: %s
                - Price: %s
                - Promo: %s
                - Badge Box: %s

                Instructions & Formatting:
                - Craft a compelling hook that immediately grabs the reader's attention.
                - Highlight the value proposition elegantly.
                - Use structured paragraphs for easy readability (with line breaks).
                - End with a strong and clear Call to Action (CTA).
                - Select 3 to 5 highly relevant hashtags.
                - Integrate emojis naturally, enhancing the visual flow without being overwhelming.

                %s

                Important: Return ONLY the final caption text. Do not include any preamble, commentary, or markdown blocks around the text.
                """
                .formatted(
                        brand.getName(),
                        brand.getToneGuidelines() != null ? brand.getToneGuidelines() : "friendly, energetic, on-brand",
                        product.getName(),
                        product.getDescription(),
                        product.getSellingPoint() != null ? product.getSellingPoint() : "-",
                        product.getPrice() != null ? product.getPrice() + " MAD" : "-",
                        post.getPromoText() != null ? post.getPromoText() : "-",
                        post.getBadgeText() != null ? post.getBadgeText() : "-",
                        languageInstruction);
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
