package com.maamora.studio;

import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Post;
import com.maamora.studio.model.Product;
import com.maamora.studio.service.CaptionGenerationService;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class GroqCaptionServiceTest {

    private HttpServer server;
    private CaptionGenerationService service;
    private final AtomicReference<String> authorization = new AtomicReference<>();
    private final AtomicReference<String> requestBody = new AtomicReference<>();

    @BeforeEach
    void setUp() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/chat/completions", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] response = "{\"choices\":[{\"message\":{\"content\":\"A clean launch caption. #studio\"}}]}"
                    .getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        service = new CaptionGenerationService();
        ReflectionTestUtils.setField(service, "captionProvider", "groq");
        ReflectionTestUtils.setField(service, "groqApiKey", "test-groq-key");
        ReflectionTestUtils.setField(service, "groqModel", "llama-3.3-70b-versatile");
        ReflectionTestUtils.setField(service, "groqBaseUrl", "http://127.0.0.1:" + server.getAddress().getPort());
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
    }

    @Test
    void returnsALocalTemplateCaptionWithoutCallingGroq() {
        BrandSettings brand = BrandSettings.builder()
                .name("STUDIO")
                .toneGuidelines("warm, concise, editorial")
                .build();
        Product product = Product.builder()
                .name("Cedar Eau de Parfum")
                .description("A woody fragrance for evenings")
                .sellingPoint("Long-lasting")
                .price(320.0)
                .build();
        Post post = Post.builder().id("post-caption-context")
                .product(product).promoText("Free delivery").badgeText("New")
                .headline("Night, distilled").supportingText("A confident scent that stays with you.")
                .ctaText("Shop the scent").build();

        String caption = service.generateCaption(post, brand, "en");

        assertThat(caption)
                .contains("Cedar Eau de Parfum")
                .contains("A woody fragrance for evenings")
                .contains("Long-lasting")
                .contains("320 MAD")
                .contains("Free delivery")
                .contains("Night, distilled")
                .contains("A confident scent that stays with you.")
                .contains("Shop the scent")
                .contains("#CedarEaudeParfum");
        assertThat(caption).doesNotContain("Long-lasting Long-lasting").doesNotContain("..")
                .doesNotContain("A confident scent that stays with you. A confident scent that stays with you.");
        assertThat(authorization.get()).isNull();
        assertThat(requestBody.get()).isNull();
    }

    @Test
    void carriesProductAndCampaignFactsAcrossAllSupportedLanguages() {
        BrandSettings brand = BrandSettings.builder().name("ATELIER").build();
        Product product = Product.builder().name("Arc Runner").description("Breathable daily trainers")
                .sellingPoint("Responsive foam cushioning").price(890.0).build();
        Post post = Post.builder().id("caption-all-languages").product(product).badgeText("NEW")
                .promoText("Free delivery this week").headline("Run lighter")
                .supportingText("Designed for the last kilometre").ctaText("Explore the collection").build();

        java.util.Map<String, String> captions = new java.util.LinkedHashMap<>();
        for (String language : new String[]{"fr", "ar", "darija", "en"}) {
            String caption = service.generateCaption(post, brand, language);
            captions.put(language, caption);
            assertThat(caption)
                    .contains("Arc Runner")
                    .contains("Breathable daily trainers")
                    .contains("Responsive foam cushioning")
                    .contains("890 MAD")
                    .contains("Run lighter")
                    .contains("Designed for the last kilometre")
                    .contains("Explore the collection");
            assertThat(caption).doesNotContain("..")
                    .doesNotContain("Responsive foam cushioning Responsive foam cushioning");
        }
        assertThat(captions.get("fr")).contains("Découvrez").contains("L’essentiel");
        assertThat(captions.get("en")).contains("Meet").contains("Why it stands out");
        assertThat(captions.get("ar")).contains("اكتشف").contains("تفاصيل المنتج");
        assertThat(captions.get("darija")).contains("تعرّف").contains("شنو فيه");
        assertThat(captions.values()).doesNotHaveDuplicates();
    }

    @Test
    void omitsMissingProductFactsInsteadOfInventingGenericClaims() {
        Product product = Product.builder().name("Mono Mug").build();
        Post post = Post.builder().id("caption-missing-facts").product(product).headline("Quiet ritual").build();

        String caption = service.generateCaption(post, BrandSettings.builder().name("ATELIER").build(), "fr");

        assertThat(caption).contains("Quiet ritual").contains("Mono Mug").doesNotContain("considered release").doesNotContain("Made for");
    }
}
