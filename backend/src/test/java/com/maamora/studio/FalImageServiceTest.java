package com.maamora.studio;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maamora.studio.service.FalImageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
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
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.http.HttpStatus.FORBIDDEN;

class FalImageServiceTest {

    private FalImageService service;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        service = new FalImageService(new RestTemplateBuilder(), new ObjectMapper(), 30_000L);
        ReflectionTestUtils.setField(service, "apiKey", "test-fal-key");
        ReflectionTestUtils.setField(service, "baseUrl", "https://fal.run");
        ReflectionTestUtils.setField(service, "model", "fal-ai/flux-pro/kontext");
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        server = MockRestServiceServer.bindTo(restTemplate).build();
    }

    @Test
    void rejectsGenerationWhenKeyIsMissing() {
        ReflectionTestUtils.setField(service, "apiKey", "");

        assertThatThrownBy(() -> service.generateImage("test prompt", "1:1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Set FAL_KEY");
    }

    @Test
    void rejectsMultipleReferencesInsteadOfDroppingOne() {
        assertThatThrownBy(() -> service.generateImage(
                "test prompt", "4:5", List.of("https://product.test/a.png", "https://model.test/b.png")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("one reference image per request");
    }

    @Test
    void explainsAccountLockWhenFalRequiresTopUp() {
        server.expect(requestTo("https://fal.run/fal-ai/flux-pro/kontext"))
                .andExpect(method(POST))
                .andRespond(withStatus(FORBIDDEN)
                        .body("{\"detail\":\"User is locked.Reason:TOP_UP.\"}")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.generateImage("editorial product image", "1:1"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("account is locked pending a top-up")
                .hasMessageContaining("configure another image provider");
        server.verify();
    }

    @Test
    void sendsKontextRequestAndDownloadsReturnedImage() {
        byte[] expected = "generated-image".getBytes(StandardCharsets.UTF_8);
        server.expect(requestTo("https://fal.run/fal-ai/flux-pro/kontext"))
                .andExpect(method(POST))
                .andExpect(header("Authorization", "Key test-fal-key"))
                .andExpect(jsonPath("$.prompt").value("editorial product image"))
                .andExpect(jsonPath("$.aspect_ratio").value("4:5"))
                .andExpect(jsonPath("$.image_url").value("https://product.test/product.png"))
                .andRespond(withSuccess(
                        "{\"images\":[{\"url\":\"https://cdn.test/generated.png\"}]}",
                        org.springframework.http.MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://cdn.test/generated.png"))
                .andExpect(method(GET))
                .andRespond(withSuccess(expected, org.springframework.http.MediaType.IMAGE_PNG));

        byte[] actual = service.generateImage(
                "editorial product image", "4:5", List.of("https://product.test/product.png"));

        assertThat(actual).isEqualTo(expected);
        server.verify();
    }
}
