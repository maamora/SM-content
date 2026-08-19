package com.maamora.studio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:groq-caption-readiness;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.jwt.secret=groq-caption-readiness-test-secret-that-is-long-enough",
        "app.caption.provider=groq",
        "app.groq.api-key=non-secret-test-key",
        "app.image.provider=disabled",
        "app.ollama.enabled=false",
        "spring.mail.host=",
        "TOKEN_CIPHER_KEY=groq-caption-readiness-key-32byt"
})
@AutoConfigureMockMvc
class GroqCaptionConfigurationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void configuredGroqProviderReportsCaptionGenerationAsReady() throws Exception {
        mockMvc.perform(get("/api/system/capabilities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.captionGeneration").value(true));
    }
}
