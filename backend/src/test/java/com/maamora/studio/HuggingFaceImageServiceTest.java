package com.maamora.studio;

import com.maamora.studio.service.HuggingFaceImageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class HuggingFaceImageServiceTest {

    private HuggingFaceImageService service;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        service = new HuggingFaceImageService(
                new RestTemplateBuilder(),
                "test-hf-key",
                "black-forest-labs/FLUX.1-schnell",
                "https://router.huggingface.co/hf-inference/models",
                30_000L);
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        server = MockRestServiceServer.bindTo(restTemplate).build();
    }

    @Test
    void rejectsGenerationWhenKeyIsMissing() {
        ReflectionTestUtils.setField(service, "apiKey", "");

        assertThatThrownBy(() -> service.generateImage("editorial product visual", "1:1", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Set HUGGINGFACE_API_KEY");
    }

    @Test
    void generatesProductVisualFromPromptAndReturnsImageBytes() {
        byte[] expected = "hf-generated-product".getBytes(StandardCharsets.UTF_8);
        server.expect(requestTo("https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"))
                .andExpect(method(POST))
                .andExpect(header("Authorization", "Bearer test-hf-key"))
                .andRespond(withSuccess(expected, MediaType.IMAGE_PNG));

        byte[] actual = service.generateImage(
                "premium product still life, clean studio light", "4:5", List.of());

        assertThat(actual).isEqualTo(expected);
        server.verify();
    }

    @Test
    void keepsReferenceEditingExplicitlyUnavailable() {
        assertThatThrownBy(() -> service.generateImage(
                "edit this product into an editorial scene", "1:1", List.of("https://product.test/product.jpg")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("editing is unavailable");
    }
}
