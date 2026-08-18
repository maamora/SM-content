package com.maamora.studio;

import com.maamora.studio.service.A4fImageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class A4fImageServiceTest {

    private A4fImageService service;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        service = new A4fImageService(
                new RestTemplateBuilder(),
                "test-a4f-key",
                "provider-2/flux.1-schnell",
                "provider-3/flux-kontext-pro",
                "https://api.a4f.co/v1",
                "b64_json",
                30_000L);
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        server = MockRestServiceServer.bindTo(restTemplate).build();
    }

    @Test
    void rejectsGenerationWhenKeyIsMissing() {
        ReflectionTestUtils.setField(service, "apiKey", "");

        assertThatThrownBy(() -> service.generateImage("editorial product visual", "1:1", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Set A4F_API_KEY");
    }

    @Test
    void generatesProductVisualFromPromptAndParsesBase64Response() {
        byte[] expected = "a4f-generated-product".getBytes(StandardCharsets.UTF_8);
        String encoded = Base64.getEncoder().encodeToString(expected);
        server.expect(requestTo("https://api.a4f.co/v1/images/generations"))
                .andExpect(method(POST))
                .andExpect(header("Authorization", "Bearer test-a4f-key"))
                .andRespond(withSuccess(
                        "{\"created\":1710000000,\"data\":[{\"b64_json\":\"" + encoded + "\"}]}\n",
                        MediaType.APPLICATION_JSON));

        byte[] actual = service.generateImage(
                "premium product still life, clean studio light", "4:5", List.of());

        assertThat(actual).isEqualTo(expected);
        server.verify();
    }

    @Test
    void editsOneProductReferenceThroughA4fMultipartEndpoint() {
        byte[] product = "product-reference".getBytes(StandardCharsets.UTF_8);
        byte[] expected = "a4f-edited-product".getBytes(StandardCharsets.UTF_8);
        String encoded = Base64.getEncoder().encodeToString(expected);

        server.expect(requestTo("https://product.test/product.jpg"))
                .andExpect(method(GET))
                .andRespond(withSuccess(product, MediaType.IMAGE_JPEG));
        server.expect(requestTo("https://api.a4f.co/v1/images/edits"))
                .andExpect(method(POST))
                .andExpect(header("Authorization", "Bearer test-a4f-key"))
                .andRespond(withSuccess(
                        "{\"created\":1710000000,\"data\":[{\"b64_json\":\"" + encoded + "\"}]}\n",
                        MediaType.APPLICATION_JSON));

        byte[] actual = service.generateImage(
                "place the product in a premium editorial studio scene", "1:1",
                List.of("https://product.test/product.jpg"));

        assertThat(actual).isEqualTo(expected);
        server.verify();
    }
}
