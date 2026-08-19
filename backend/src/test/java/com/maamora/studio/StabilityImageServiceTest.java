package com.maamora.studio;

import com.maamora.studio.service.StabilityImageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class StabilityImageServiceTest {

    private StabilityImageService service;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        service = new StabilityImageService(
                new RestTemplateBuilder(),
                "test-stability-key",
                "core",
                "https://api.stability.ai",
                30_000L);
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        server = MockRestServiceServer.bindTo(restTemplate).build();
    }

    @Test
    void rejectsGenerationWhenKeyIsMissing() {
        StabilityImageService missingKey = new StabilityImageService(
                new RestTemplateBuilder(), "", "ultra", "https://api.stability.ai", 30_000L);

        assertThatThrownBy(() -> missingKey.generateImage("editorial product image", "1:1", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Set STABILITY_API_KEY");
    }

    @Test
    void rejectsMultipleReferencesInsteadOfSilentlyDroppingOne() {
        assertThatThrownBy(() -> service.generateImage(
                "product and model shoot", "4:5",
                List.of("https://product.test/a.png", "https://model.test/b.png")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("one starting image per request");
    }

    @Test
    void returnsDirectImageBytesForTextGeneration() {
        byte[] expected = "generated-stability-image".getBytes(StandardCharsets.UTF_8);
        server.expect(requestTo("https://api.stability.ai/v2beta/stable-image/generate/core"))
                .andExpect(method(POST))
                .andExpect(header("Authorization", "Bearer test-stability-key"))
                .andRespond(withSuccess(expected, MediaType.IMAGE_PNG));

        byte[] actual = service.generateImage("editorial product image", "4:5", List.of());

        assertThat(actual).isEqualTo(expected);
        server.verify();
    }

    @Test
    void downloadsProductReferenceBeforeSendingImageEdit() {
        byte[] reference = "product-reference".getBytes(StandardCharsets.UTF_8);
        byte[] expected = "generated-reference-image".getBytes(StandardCharsets.UTF_8);
        server.expect(requestTo("https://product.test/product.png"))
                .andExpect(method(GET))
                .andRespond(withSuccess(reference, MediaType.IMAGE_PNG));
        server.expect(requestTo("https://api.stability.ai/v2beta/stable-image/generate/core"))
                .andExpect(method(POST))
                .andRespond(withSuccess(expected, MediaType.IMAGE_PNG));

        byte[] actual = service.generateImage(
                "premium product still life", "1:1", List.of("https://product.test/product.png"));

        assertThat(actual).isEqualTo(expected);
        server.verify();
    }

    @Test
    void explainsCreditExhaustionWithoutRetrying() {
        server.expect(requestTo("https://api.stability.ai/v2beta/stable-image/generate/core"))
                .andExpect(method(POST))
                .andRespond(withStatus(HttpStatus.FORBIDDEN)
                        .body("{\"errors\":[\"insufficient credits\"]}")
                        .contentType(MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.generateImage("editorial product image", "1:1", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no available credits or quota");
        server.verify();
    }
}
