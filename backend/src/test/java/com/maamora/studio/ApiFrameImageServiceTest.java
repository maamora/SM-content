package com.maamora.studio;

import com.maamora.studio.service.ApiFrameImageService;
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
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withAccepted;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ApiFrameImageServiceTest {

    private ApiFrameImageService service;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        service = new ApiFrameImageService(
                new RestTemplateBuilder(),
                "test-api-frame-key",
                "flux-2-pro",
                "https://api.apiframe.ai/v2",
                500L,
                30_000L,
                "png");
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        server = MockRestServiceServer.bindTo(restTemplate).build();
    }

    @Test
    void rejectsGenerationWhenKeyIsMissing() {
        ReflectionTestUtils.setField(service, "apiKey", "");

        assertThatThrownBy(() -> service.generateImage("editorial product image", "1:1", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Set APIFRAME_API_KEY");
    }

    @Test
    void submitsMultiReferenceFluxRequestPollsAndDownloadsImage() {
        byte[] expected = "generated-image".getBytes(StandardCharsets.UTF_8);
        server.expect(requestTo("https://api.apiframe.ai/v2/images/generate"))
                .andExpect(method(POST))
                .andExpect(header("X-API-Key", "test-api-frame-key"))
                .andExpect(jsonPath("$.model").value("flux-2-pro"))
                .andExpect(jsonPath("$.prompt").value("place the product on the model"))
                .andExpect(jsonPath("$.fluxParams.input_images[0]").value("https://product.test/product.png"))
                .andExpect(jsonPath("$.fluxParams.input_images[1]").value("https://model.test/model.png"))
                .andExpect(jsonPath("$.fluxParams.aspect_ratio").value("match_input_image"))
                .andRespond(withAccepted()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"jobId\":\"job-1\",\"status\":\"queued\"}"));
        server.expect(requestTo("https://api.apiframe.ai/v2/jobs/job-1"))
                .andExpect(method(GET))
                .andExpect(header("X-API-Key", "test-api-frame-key"))
                .andRespond(withSuccess(
                        "{\"jobId\":\"job-1\",\"status\":\"completed\",\"result\":{\"images\":[\"https://cdn.test/generated.png\"]}}",
                        MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://cdn.test/generated.png"))
                .andExpect(method(GET))
                .andRespond(withSuccess(expected, MediaType.IMAGE_PNG));

        byte[] actual = service.generateImage(
                "place the product on the model", "4:5",
                List.of("https://product.test/product.png", "https://model.test/model.png"));

        assertThat(actual).isEqualTo(expected);
        server.verify();
    }
}
