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
        Post post = Post.builder().product(product).promoText("Free delivery").badgeText("New").build();

        String caption = service.generateCaption(post, brand, "en");

        assertThat(caption)
                .contains("Cedar Eau de Parfum")
                .contains("Free delivery")
                .contains("#CedarEaudeParfum");
        assertThat(authorization.get()).isNull();
        assertThat(requestBody.get()).isNull();
    }
}
