package com.maamora.studio;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maamora.studio.service.GeminiVideoService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class GeminiVideoServiceTest {

    @Test
    void submitsPollsAndDownloadsVideoWithoutCallingGemini() {
        GeminiVideoService service = new GeminiVideoService(new RestTemplateBuilder(), new ObjectMapper());
        ReflectionTestUtils.setField(service, "apiKey", "test-gemini-key");
        ReflectionTestUtils.setField(service, "model", "veo-3.1-generate-preview");
        ReflectionTestUtils.setField(service, "baseUrl", "https://gemini.test/v1beta");
        ReflectionTestUtils.setField(service, "timeoutMs", 2_000L);
        ReflectionTestUtils.setField(service, "pollIntervalMs", 1L);

        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).ignoreExpectOrder(true).build();
        byte[] expectedVideo = "fake-video-bytes".getBytes(StandardCharsets.UTF_8);

        server.expect(requestTo("https://assets.test/model.png"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(new byte[]{1, 2, 3}, MediaType.IMAGE_PNG));
        server.expect(requestTo("https://gemini.test/v1beta/models/veo-3.1-generate-preview:predictLongRunning"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{\"name\":\"operations/studio-test-1\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://gemini.test/v1beta/operations/studio-test-1"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("{\"done\":false}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://gemini.test/v1beta/operations/studio-test-1"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("{\"done\":true,\"response\":{\"generateVideoResponse\":{\"generatedSamples\":[{\"video\":{\"uri\":\"https://assets.test/result.mp4\"}}]}}}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://assets.test/result.mp4"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(expectedVideo, MediaType.valueOf("video/mp4")));

        byte[] actualVideo = service.generateVideo("https://assets.test/model.png", "A slow editorial camera move", "9:16");

        assertThat(actualVideo).isEqualTo(expectedVideo);
        server.verify();
    }

    @Test
    void rejectsUnavailableConfigurationBeforeAnyNetworkRequest() {
        GeminiVideoService service = new GeminiVideoService(new RestTemplateBuilder(), new ObjectMapper());
        ReflectionTestUtils.setField(service, "apiKey", "");
        ReflectionTestUtils.setField(service, "model", "veo-3.1-generate-preview");

        assertThat(service.isConfigured()).isFalse();
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.generateVideo(
                        "https://assets.test/model.png", "A camera move", "16:9"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not configured");
    }
}

