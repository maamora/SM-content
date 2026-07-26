package com.maamora.studio.service;

import com.maamora.studio.model.Product;
import com.maamora.studio.model.Template;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class ImageRenderService {

    @Value("${STABILITY_API_KEY:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public byte[] renderToPng(Template template, Product product, String badgeText, String promoText,
            String accentColor) {
        if (apiKey == null || apiKey.isEmpty()) {
            throw new RuntimeException("STABILITY_API_KEY not configured in backend");
        }

        String prompt = String.format(
                "Create a high-quality professional marketing image for a luxury Moroccan brand called 'Maamora'. " +
                        "Product: %s. Description: %s. Key point: %s. " +
                        "Additional text: %s. Promo: %s. Use brand accent color %s.",
                product.getName(), product.getDescription(), product.getSellingPoint(),
                badgeText != null ? badgeText : "",
                promoText != null ? promoText : "",
                accentColor != null ? accentColor : "#f97316");

        String url = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);
        headers.set("Accept", "application/json");

        Map<String, Object> requestBody = Map.of(
                "text_prompts", List.of(Map.of("text", prompt, "weight", 1)),
                "cfg_scale", 7,
                "height", 1024,
                "width", 1024,
                "steps", 30,
                "samples", 1);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> artifacts = (List<Map<String, Object>>) response.getBody().get("artifacts");
                if (artifacts != null && !artifacts.isEmpty()) {
                    String base64Data = (String) artifacts.get(0).get("base64");
                    return Base64.getDecoder().decode(base64Data);
                }
            }
            throw new RuntimeException(
                    "Failed to generate image with Stability API, status: " + response.getStatusCode());
        } catch (Exception e) {
            throw new RuntimeException("Error communicating with Stability AI", e);
        }
    }
}
