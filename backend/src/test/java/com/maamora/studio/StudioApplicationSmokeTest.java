package com.maamora.studio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:studio-readiness;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.jwt.secret=studio-readiness-test-secret-that-is-long-enough",
        "app.gemini.caption-api-key=",
        "app.gemini.video-api-key=",
        "app.image.provider=disabled",
        "app.caption.provider=openai",
        "app.openai.api-key=",
        "app.higgsfield.api-key-id=",
        "app.higgsfield.api-key-secret=",
        "app.higgsfield.video-model=",
        "app.ollama.enabled=false",
        "app.cloudinary.cloud-name=placeholder",
        "app.cloudinary.api-key=placeholder",
        "app.cloudinary.api-secret=placeholder",
        "app.storage.local-path=target/test-uploads",
        "app.storage.public-base-url=http://localhost:8080/files",
        "spring.mail.host=",
        "STABILITY_API_KEY=",
        "META_APP_ID=",
        "META_APP_SECRET=",
        "TIKTOK_CLIENT_KEY=",
        "TIKTOK_CLIENT_SECRET=",
        "LINKEDIN_CLIENT_ID=",
        "LINKEDIN_CLIENT_SECRET=",
        "X_CLIENT_ID=",
        "X_CLIENT_SECRET=",
        "TOKEN_CIPHER_KEY=studio-readiness-test-key-32-bytes!"
})
@AutoConfigureMockMvc
class StudioApplicationSmokeTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void publicCapabilitiesReportUnconfiguredProvidersWithoutFailing() throws Exception {
        mockMvc.perform(get("/api/system/capabilities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.captionGeneration").value(false))
                .andExpect(jsonPath("$.data.imageGeneration").value(false))
                .andExpect(jsonPath("$.data.socialPublishing").value(false))
                .andExpect(jsonPath("$.data.smtpEmail").value(false));
    }

    @Test
    void protectedOperationalEndpointsRejectAnonymousAccess() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().is4xxClientError());
        mockMvc.perform(get("/api/social/connections")).andExpect(status().is4xxClientError());
        mockMvc.perform(get("/api/social/jobs")).andExpect(status().is4xxClientError());
        mockMvc.perform(get("/api/email/deliveries")).andExpect(status().is4xxClientError());
        mockMvc.perform(get("/api/creative/jobs")).andExpect(status().is4xxClientError());
    }

    @Test
    void registrationLoginAndAuthenticatedWorkspaceListsWorkAgainstDatabase() throws Exception {
        String email = "readiness-" + UUID.randomUUID() + "@studio.test";
        String password = "ReadinessPass123!";
        MvcResult registration = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Readiness User","email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        String registeredToken = tokenFrom(registration);
        assertThat(registeredToken).isNotBlank();

        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        String token = tokenFrom(login);
        String bearer = "Bearer " + token;
        mockMvc.perform(get("/api/auth/me").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(email));
        mockMvc.perform(get("/api/products").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        mockMvc.perform(get("/api/social/connections").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
        mockMvc.perform(get("/api/social/jobs").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
        mockMvc.perform(get("/api/email/deliveries").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
        mockMvc.perform(get("/api/creative/jobs").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void unavailableProvidersCreateTemplateCompositionsAndPersistTerminalJobStates() throws Exception {
        String bearer = "Bearer " + registerAndGetToken();

        mockMvc.perform(get("/api/social/connect/meta").header("Authorization", bearer))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(org.hamcrest.Matchers.containsString("not configured")));

        MvcResult creativeResult = mockMvc.perform(post("/api/creative/jobs")
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "type":"PHOTO_SHOOT",
                                  "prompt":"A controlled provider-unavailable smoke test",
                                  "aspectRatio":"1:1",
                                  "productImageUrl":"https://example.test/product.jpg",
                                  "modelImageUrl":"https://example.test/model.jpg",
                                  "generateVideo":false
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        String creativeId = objectMapper.readTree(creativeResult.getResponse().getContentAsString())
                .path("data").path("id").asText();
        waitForStatus("/api/creative/jobs/" + creativeId, bearer, "COMPLETED");
        mockMvc.perform(get("/api/creative/jobs/" + creativeId).header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.outputMode").value("TEMPLATE_COMPOSED"))
                .andExpect(jsonPath("$.data.recoveryMessage").isNotEmpty());

        MvcResult emailResult = mockMvc.perform(post("/api/email/send")
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "toAddress":"delivery-smoke@studio.test",
                                  "subject":"STUDIO delivery smoke test",
                                  "body":"No SMTP configuration is present in this test profile."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        String deliveryId = objectMapper.readTree(emailResult.getResponse().getContentAsString())
                .path("data").path("id").asText();
        waitForStatus("/api/email/deliveries", bearer, deliveryId, "FAILED");
    }

    private String registerAndGetToken() throws Exception {
        String email = "provider-" + UUID.randomUUID() + "@studio.test";
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Provider Test","email":"%s","password":"ProviderPass123!"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        return tokenFrom(result);
    }

    private void waitForStatus(String path, String bearer, String expectedStatus) throws Exception {
        Instant deadline = Instant.now().plus(Duration.ofSeconds(10));
        while (Instant.now().isBefore(deadline)) {
            MvcResult result = mockMvc.perform(get(path).header("Authorization", bearer)).andReturn();
            String status = objectMapper.readTree(result.getResponse().getContentAsString())
                    .path("data").path("status").asText();
            if (expectedStatus.equals(status)) return;
            Thread.sleep(50);
        }
        throw new AssertionError("Timed out waiting for " + expectedStatus + " at " + path);
    }

    private void waitForStatus(String path, String bearer, String id, String expectedStatus) throws Exception {
        Instant deadline = Instant.now().plus(Duration.ofSeconds(10));
        while (Instant.now().isBefore(deadline)) {
            MvcResult result = mockMvc.perform(get(path).header("Authorization", bearer)).andReturn();
            JsonNode deliveries = objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
            for (JsonNode delivery : deliveries) {
                if (id.equals(delivery.path("id").asText()) && expectedStatus.equals(delivery.path("status").asText())) {
                    return;
                }
            }
            Thread.sleep(50);
        }
        throw new AssertionError("Timed out waiting for " + expectedStatus + " delivery " + id);
    }

    private String tokenFrom(MvcResult result) throws Exception {
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.path("data").path("token").asText();
    }
}
