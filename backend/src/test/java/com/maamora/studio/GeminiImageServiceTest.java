package com.maamora.studio;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maamora.studio.service.GeminiImageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
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

class GeminiImageServiceTest {

    private GeminiImageService service;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        service = new GeminiImageService(
                new RestTemplateBuilder(),
                new ObjectMapper(),
                "test-gemini-key",
                "gemini-3.1-flash-image",
                "https://generativelanguage.googleapis.com/v1beta",
                30_000L);
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(service, "restTemplate");
        server = MockRestServiceServer.bindTo(restTemplate).build();
    }

    @Test
    void rejectsGenerationWhenGeminiKeyIsMissing() {
        ReflectionTestUtils.setField(service, "apiKey", "");

        assertThatThrownBy(() -> service.generateImage("editorial product visual", "1:1", List.of()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Set GEMINI_API_KEY");
    }

    @Test
    void sendsTextAndReferenceThenNormalizesGeminiJpegOutputToPng() throws IOException {
        byte[] reference = pngBytes();
        byte[] generatedJpeg = jpegBytes();

        server.expect(requestTo("https://assets.test/product.png"))
                .andExpect(method(GET))
                .andRespond(withSuccess(reference, org.springframework.http.MediaType.IMAGE_PNG));
        server.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/interactions"))
                .andExpect(method(POST))
                .andExpect(header("x-goog-api-key", "test-gemini-key"))
                .andExpect(jsonPath("$.model").value("gemini-3.1-flash-image"))
                .andExpect(jsonPath("$.input[0].type").value("text"))
                .andExpect(jsonPath("$.input[0].text").value("editorial product visual"))
                .andExpect(jsonPath("$.input[1].type").value("image"))
                .andExpect(jsonPath("$.input[1].mime_type").value("image/png"))
                .andExpect(jsonPath("$.response_format.aspect_ratio").value("4:5"))
                .andExpect(jsonPath("$.response_format.mime_type").value("image/jpeg"))
                .andRespond(withSuccess(
                        "{\"output_image\":{\"data\":\"" + Base64.getEncoder().encodeToString(generatedJpeg) + "\",\"mime_type\":\"image/jpeg\"}}",
                        org.springframework.http.MediaType.APPLICATION_JSON));

        byte[] actual = service.generateImage(
                "editorial product visual", "4:5", List.of("https://assets.test/product.png"));

        assertThat(actual).startsWith((byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47);
        assertThat(ImageIO.read(new java.io.ByteArrayInputStream(actual))).isNotNull();
        server.verify();
    }

    private byte[] pngBytes() throws IOException {
        return imageBytes("png");
    }

    private byte[] jpegBytes() throws IOException {
        return imageBytes("jpg");
    }

    private byte[] imageBytes(String format) throws IOException {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, Color.ORANGE.getRGB());
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            ImageIO.write(image, format, output);
            return output.toByteArray();
        }
    }
}
