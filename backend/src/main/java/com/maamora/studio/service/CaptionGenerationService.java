package com.maamora.studio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Post;
import com.maamora.studio.model.Product;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Semaphore;

@Slf4j
@Service
public class CaptionGenerationService {

    private static final int MAX_ATTEMPTS = 4;

    /**
     * Batch mode can have up to 3 products processing at once (see
     * BatchJobService's MAX_CONCURRENT), each firing 4 sequential Gemini
     * calls — a burst of up to 12 near-simultaneous requests was enough to
     * trip Gemini's per-minute free-tier rate limit for whichever products
     * weren't first in line, even with retries (429s from a per-minute quota
     * need real seconds to clear, and retrying into the same burst doesn't
     * help). This serializes every Gemini call across the whole app — batch
     * or not — into a single queue so it's never bursty in the first place.
     * Slower than firing everything at once, but reliable, and caption
     * requests are quick enough that this doesn't meaningfully slow batches
     * down for the size this app deals with.
     */
    private final Semaphore geminiThrottle = new Semaphore(1);

    @Value("${app.gemini.caption-api-key:}")
    private String apiKey;

    @Value("${app.gemini.model}")
    private String model;

    @Value("${app.gemini.base-url}")
    private String baseUrl;

    @Value("${app.caption.provider:gemini}")
    private String captionProvider;

    @Value("${app.groq.api-key:}")
    private String groqApiKey;

    @Value("${app.groq.model:llama-3.3-70b-versatile}")
    private String groqModel;

    @Value("${app.groq.base-url:https://api.groq.com/openai/v1}")
    private String groqBaseUrl;

    @Value("${app.openrouter.api-key:}")
    private String openRouterApiKey;

    @Value("${app.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.openai.text-model:gpt-4o-mini}")
    private String openAiTextModel;

    @Value("${app.openai.base-url:https://api.openai.com/v1}")
    private String openAiBaseUrl;

    @Value("${app.openrouter.models:}")
    private String openRouterModels;

    @Value("${app.openrouter.base-url:https://openrouter.ai/api/v1}")
    private String openRouterBaseUrl;

    @Value("${app.openrouter.max-attempts:2}")
    private int openRouterMaxAttempts;

    @Value("${app.ollama.enabled:false}")
    private boolean ollamaEnabled;

    @Value("${app.ollama.model:qwen2.5:7b}")
    private String ollamaModel;

    @Value("${app.ollama.base-url:http://localhost:11434/api}")
    private String ollamaBaseUrl;

    private final Semaphore ollamaThrottle = new Semaphore(1);

    private final ObjectMapper objectMapper = new ObjectMapper();

    private RestClient client() {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("x-goog-api-key", apiKey)
                .defaultHeader("content-type", "application/json")
                .build();
    }

    /**
     * Batch mode can have several products in flight at once, each making
     * several Gemini calls back to back — enough to trip Gemini's per-minute
     * rate limit (429) or occasionally hit a transient 5xx / empty-candidates
     * response. Both are transient, so retry a few times with backoff before
     * giving up; PostService still catches per-language so one language that
     * exhausts its retries doesn't cost the other languages their captions.
     */
    public String generateCaption(Post post, BrandSettings brand, String language) {
        return generateDeterministicCaption(post, brand, language);
    }

    private String generateDeterministicCaption(Post post, BrandSettings brand, String language) {
        CaptionBrief brief = captionBrief(post, brand);
        return switch (language == null ? "fr" : language.toLowerCase()) {
            case "en" -> englishCaption(brief);
            case "ar" -> arabicCaption(brief);
            case "darija" -> darijaCaption(brief);
            default -> frenchCaption(brief);
        };
    }

    private CaptionBrief captionBrief(Post post, BrandSettings brand) {
        Product product = post.getProduct();
        String productName = clean(product == null ? null : product.getName());
        String description = clean(product == null ? null : product.getDescription());
        String sellingPoint = clean(product == null ? null : product.getSellingPoint());
        String brandName = textOr(clean(brand == null ? null : brand.getName()), "STUDIO");
        String headline = textOr(clean(post.getHeadline()), productName);
        String supporting = clean(post.getSupportingText());
        String promo = clean(post.getPromoText());
        String badge = clean(post.getBadgeText());
        String cta = clean(post.getCtaText());
        String price = product != null && product.getPrice() != null ? trimPrice(product.getPrice()) + " MAD" : "";
        return new CaptionBrief(textOr(productName, "Produit"), description, sellingPoint, brandName, headline, supporting, promo, badge, cta, price);
    }

    private String frenchCaption(CaptionBrief brief) {
        return caption(
                campaignLead(brief),
                brief.productName() + " · " + brief.brandName(),
                productFacts(brief),
                campaignMessage(brief),
                labeled(brief.promo(), "Offre"),
                labeled(brief.price(), "Prix"),
                textOr(brief.cta(), "Découvrez-le aujourd’hui"),
                tags(brief));
    }

    private String englishCaption(CaptionBrief brief) {
        return caption(
                campaignLead(brief),
                brief.productName() + " · " + brief.brandName(),
                productFacts(brief),
                campaignMessage(brief),
                labeled(brief.promo(), "Offer"),
                labeled(brief.price(), "Price"),
                textOr(brief.cta(), "Discover it today"),
                tags(brief));
    }

    private String arabicCaption(CaptionBrief brief) {
        return caption(
                campaignLead(brief),
                brief.productName() + " من " + brief.brandName(),
                productFacts(brief),
                campaignMessage(brief),
                labeled(brief.promo(), "العرض"),
                labeled(brief.price(), "السعر"),
                textOr(brief.cta(), "اكتشفه اليوم"),
                tags(brief));
    }

    private String darijaCaption(CaptionBrief brief) {
        return caption(
                campaignLead(brief),
                brief.productName() + " من " + brief.brandName(),
                productFacts(brief),
                campaignMessage(brief),
                labeled(brief.promo(), "العرض"),
                labeled(brief.price(), "الثمن"),
                textOr(brief.cta(), "اكتشفو دابا"),
                tags(brief));
    }

    private String caption(String... blocks) {
        return Arrays.stream(blocks).map(this::clean).filter(value -> !value.isBlank()).collect(java.util.stream.Collectors.joining("\n\n"));
    }

    private String campaignLead(CaptionBrief brief) {
        return brief.badge().isBlank() ? brief.headline() : brief.badge() + " · " + brief.headline();
    }

    private String productFacts(CaptionBrief brief) {
        return distinctSentence(brief.description(), brief.sellingPoint());
    }

    private String campaignMessage(CaptionBrief brief) {
        return isDuplicate(brief.supporting(), brief.description()) || isDuplicate(brief.supporting(), brief.sellingPoint()) ? "" : brief.supporting();
    }

    private String distinctSentence(String first, String second) {
        if (first.isBlank()) return second;
        if (second.isBlank() || isDuplicate(first, second)) return first;
        return first + " · " + second;
    }

    private String labeled(String value, String label) { return value.isBlank() ? "" : label + " : " + value; }
    private boolean isDuplicate(String first, String second) { return !first.isBlank() && first.equalsIgnoreCase(second); }
    private String trimPrice(Double price) { return Math.rint(price) == price ? String.valueOf(price.longValue()) : String.format(java.util.Locale.ROOT, "%.2f", price); }
    private String tags(CaptionBrief brief) {
        return List.of(tag(brief.productName()), tag(brief.brandName()), tag(brief.badge())).stream()
                .filter(value -> !value.isBlank()).map(value -> "#" + value).distinct().collect(java.util.stream.Collectors.joining(" "));
    }
    private record CaptionBrief(String productName, String description, String sellingPoint, String brandName,
                                String headline, String supporting, String promo, String badge, String cta, String price) { }

    private String textOr(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String clean(String value) {
        if (value == null) return "";
        return value.replaceAll("\\s+", " ").replaceAll("[.。]{2,}", ".").trim();
    }

    private String tag(String value) {
        return value.replaceAll("[^\\p{L}\\p{N}]", "");
    }

    private String generateWithGroq(Post post, BrandSettings brand, String language) {
        if (!configured(groqApiKey)) {
            throw new IllegalStateException("Caption generation is unavailable: configure GROQ_API_KEY.");
        }
        Map<String, Object> body = Map.of(
                "model", groqModel,
                "messages", List.of(Map.of("role", "user", "content", buildPrompt(post, brand, language))),
                "temperature", 0.8,
                "max_tokens", 1200);
        try {
            String rawResponse = RestClient.builder()
                    .baseUrl(groqBaseUrl)
                    .defaultHeader("Authorization", "Bearer " + groqApiKey)
                    .defaultHeader("content-type", "application/json")
                    .build()
                    .post()
                    .uri("/chat/completions")
                    .body(body)
                    .retrieve()
                    .body(String.class);
            return extractCompatibleText(rawResponse, "Groq");
        } catch (HttpStatusCodeException e) {
            throw new IllegalStateException("Groq caption generation failed with HTTP "
                    + e.getStatusCode().value() + ": " + compactProviderBody(e.getResponseBodyAsString()), e);
        }
    }

    private String generateWithOpenAi(Post post, BrandSettings brand, String language) {
        if (!configured(openAiApiKey)) {
            throw new IllegalStateException("Caption generation is unavailable: configure OPENAI_API_KEY.");
        }
        Map<String, Object> body = Map.of(
                "model", openAiTextModel,
                "messages", List.of(Map.of("role", "user", "content", buildPrompt(post, brand, language))),
                "temperature", 0.8,
                "max_completion_tokens", 1200);
        try {
            String rawResponse = RestClient.builder()
                    .baseUrl(openAiBaseUrl)
                    .defaultHeader("Authorization", "Bearer " + openAiApiKey)
                    .defaultHeader("content-type", "application/json")
                    .build()
                    .post()
                    .uri("/chat/completions")
                    .body(body)
                    .retrieve()
                    .body(String.class);
            return extractCompatibleText(rawResponse, "OpenAI");
        } catch (HttpStatusCodeException e) {
            throw new IllegalStateException("OpenAI caption generation failed with HTTP "
                    + e.getStatusCode().value() + ": " + compactProviderBody(e.getResponseBodyAsString()), e);
        }
    }

    private String generateWithOpenRouter(Post post, BrandSettings brand, String language) {
        if (!configured(openRouterApiKey)) {
            throw new IllegalStateException("Caption generation is unavailable: configure OPENROUTER_API_KEY.");
        }

        Set<String> models = new LinkedHashSet<>();
        if (openRouterModels != null) {
            Arrays.stream(openRouterModels.split(","))
                    .map(String::trim)
                    .filter(this::configured)
                    .forEach(models::add);
        }
        if (models.isEmpty()) {
            throw new IllegalStateException("Caption generation is unavailable: configure OPENROUTER_MODELS as an ordered comma-separated model list.");
        }

        String prompt = buildPrompt(post, brand, language);
        Map<String, Object> bodyBase = Map.of(
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "temperature", 0.8,
                "max_tokens", 1200);
        List<String> attempted = new ArrayList<>();
        RuntimeException lastError = null;
        int maxModels = Math.max(1, Math.min(openRouterMaxAttempts, models.size()));

        for (String modelId : models.stream().limit(maxModels).toList()) {
            attempted.add(modelId);
            Map<String, Object> body = new java.util.HashMap<>(bodyBase);
            body.put("model", modelId);
            try {
                String rawResponse = RestClient.builder()
                        .baseUrl(openRouterBaseUrl)
                        .defaultHeader("Authorization", "Bearer " + openRouterApiKey)
                        .defaultHeader("HTTP-Referer", "http://localhost:3000")
                        .defaultHeader("X-Title", "STUDIO")
                        .defaultHeader("content-type", "application/json")
                        .build()
                        .post()
                        .uri("/chat/completions")
                        .body(body)
                        .retrieve()
                        .body(String.class);
                return extractCompatibleText(rawResponse, "OpenRouter");
            } catch (HttpStatusCodeException e) {
                lastError = new RuntimeException("OpenRouter model " + modelId + " failed ("
                        + e.getStatusCode().value() + "): " + compactProviderBody(e.getResponseBodyAsString()), e);
                if (!isOpenRouterFallbackError(e) || attempted.size() >= maxModels) {
                    throw lastError;
                }
                log.warn("OpenRouter model fallback {}/{} for lang {} after {}: {}",
                        attempted.size(), maxModels, language, e.getStatusCode(), modelId);
            } catch (EmptyCaptionException e) {
                lastError = e;
                if (attempted.size() >= maxModels) {
                    throw e;
                }
                log.warn("OpenRouter model fallback {}/{} for lang {} after empty response: {}",
                        attempted.size(), maxModels, language, modelId);
            }
        }

        throw new IllegalStateException("OpenRouter caption generation failed for models " + attempted, lastError);
    }

    private boolean isOpenRouterFallbackError(HttpStatusCodeException e) {
        int status = e.getStatusCode().value();
        return status == 400 || status == 404 || status == 408 || status == 409
                || status == 413 || status == 429 || e.getStatusCode().is5xxServerError();
    }

    private String compactProviderBody(String body) {
        if (body == null || body.isBlank()) {
            return "no provider details";
        }
        return body.replaceAll("\\s+", " ").substring(0, Math.min(body.length(), 500));
    }

    private String generateWithGemini(Post post, BrandSettings brand, String language) {
        String prompt = buildPrompt(post, brand, language);

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))));

        try {
            geminiThrottle.acquire();
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while waiting for Gemini rate-limit slot", ie);
        }
        try {
            RuntimeException lastError = null;
            for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                try {
                    String rawResponse = client().post()
                            .uri("/models/{model}:generateContent", model)
                            .body(body)
                            .retrieve()
                            .body(String.class);
                    return extractText(rawResponse);
                } catch (HttpStatusCodeException e) {
                    boolean retryable = e.getStatusCode().value() == 429 || e.getStatusCode().is5xxServerError();
                    lastError = new RuntimeException(
                            "Gemini request failed (" + e.getStatusCode() + "): " + e.getResponseBodyAsString(), e);
                    if (!retryable || attempt == MAX_ATTEMPTS) {
                        throw lastError;
                    }
                    log.warn("Gemini call retry {}/{} for lang {} after {}: {}",
                            attempt, MAX_ATTEMPTS, language, e.getStatusCode(), e.getMessage());
                    backoff(attempt);
                } catch (EmptyCaptionException e) {
                    lastError = e;
                    if (attempt == MAX_ATTEMPTS) {
                        throw e;
                    }
                    log.warn("Gemini call retry {}/{} for lang {} after empty/blocked response: {}",
                            attempt, MAX_ATTEMPTS, language, e.getMessage());
                    backoff(attempt);
                }
            }
            throw lastError;
        } finally {
            geminiThrottle.release();
        }
    }

    private String generateWithOllama(Post post, BrandSettings brand, String language) {
        String prompt = buildPrompt(post, brand, language);
        Map<String, Object> body = Map.of(
                "model", ollamaModel,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "stream", false,
                "options", Map.of("temperature", 0.8));

        try {
            ollamaThrottle.acquire();
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for local Ollama caption generation.", ie);
        }

        try {
            String rawResponse = RestClient.builder()
                    .baseUrl(ollamaBaseUrl)
                    .defaultHeader("content-type", "application/json")
                    .build()
                    .post()
                    .uri("chat")
                    .body(body)
                    .retrieve()
                    .body(String.class);
            return extractOllamaText(rawResponse);
        } catch (HttpStatusCodeException e) {
            throw new IllegalStateException("Ollama caption request failed with HTTP "
                    + e.getStatusCode().value() + ". Is Ollama running and is the model installed?", e);
        } finally {
            ollamaThrottle.release();
        }
    }

    private void backoff(int attempt) {
        try {
            // A 429 from a per-minute quota needs real seconds to clear, not
            // milliseconds — short backoff just retries into the same window.
            Thread.sleep(3000L * attempt);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
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
                - Campaign headline: %s
                - Campaign supporting line: %s
                - Campaign CTA: %s
                - Layout direction: %s / product focus: %s / text alignment: %s

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
                        post.getHeadline() != null ? post.getHeadline() : "-",
                        post.getSupportingText() != null ? post.getSupportingText() : "-",
                        post.getCtaText() != null ? post.getCtaText() : "-",
                        post.getLayoutStyle() != null ? post.getLayoutStyle() : "-",
                        post.getProductFocus() != null ? post.getProductFocus() : "-",
                        post.getTextAlignment() != null ? post.getTextAlignment() : "-",
                        languageInstruction);
    }

    private String extractText(String rawJson) {
        JsonNode root;
        try {
            root = objectMapper.readTree(rawJson);
        } catch (Exception e) {
            throw new RuntimeException("Could not parse Gemini response: " + rawJson, e);
        }

        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            // No candidates usually means Gemini's safety filter blocked the
            // prompt (promptFeedback.blockReason) rather than an actual error.
            String blockReason = root.path("promptFeedback").path("blockReason").asText(null);
            throw new EmptyCaptionException(blockReason != null
                    ? "Gemini blocked the prompt (reason: " + blockReason + ")"
                    : "Gemini returned no candidates: " + rawJson);
        }

        JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
        if (!textNode.isTextual() || textNode.asText().isBlank()) {
            String finishReason = candidates.get(0).path("finishReason").asText(null);
            throw new EmptyCaptionException(finishReason != null
                    ? "Gemini returned no text (finishReason: " + finishReason + ")"
                    : "Gemini returned no text: " + rawJson);
        }

        return textNode.asText().trim();
    }

    private String extractCompatibleText(String rawJson, String providerName) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                throw new EmptyCaptionException(providerName + " returned no choices: " + compactProviderBody(rawJson));
            }
            JsonNode message = choices.get(0).path("message");
            String text = extractContentParts(message.path("content"));
            if (text.isBlank()) {
                String refusal = message.path("refusal").asText("");
                throw new EmptyCaptionException(providerName + " returned no caption text"
                        + (refusal.isBlank() ? "." : " (refusal: " + refusal + ")"));
            }
            return text.trim();
        } catch (EmptyCaptionException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Could not parse " + providerName + " response.", e);
        }
    }

    private String extractContentParts(JsonNode content) {
        if (content == null || content.isMissingNode() || content.isNull()) {
            return "";
        }
        if (content.isTextual()) {
            return content.asText().trim();
        }
        if (content.isArray()) {
            StringBuilder result = new StringBuilder();
            for (JsonNode part : content) {
                JsonNode text = part.path("text");
                if (text.isTextual() && !text.asText().isBlank()) {
                    if (result.length() > 0) result.append('\n');
                    result.append(text.asText().trim());
                }
            }
            return result.toString().trim();
        }
        return "";
    }

    private String extractOllamaText(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            JsonNode textNode = root.path("message").path("content");
            if (!textNode.isTextual() || textNode.asText().isBlank()) {
                throw new EmptyCaptionException("Ollama returned no caption text.");
            }
            return textNode.asText().trim();
        } catch (EmptyCaptionException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Could not parse Ollama response.", e);
        }
    }

    private boolean configured(String value) {
        return value != null && !value.isBlank()
                && !value.equalsIgnoreCase("placeholder")
                && !value.equalsIgnoreCase("changeme");
    }

    /** Thrown when Gemini or Ollama responds successfully but with no usable caption text. */
    private static class EmptyCaptionException extends RuntimeException {
        EmptyCaptionException(String message) {
            super(message);
        }
    }
}
