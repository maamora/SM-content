package com.maamora.studio.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateImageRequest {
    @NotBlank
    private String productId;

    @NotBlank
    private String templateId;

    private String badgeText;
    private String promoText;
    private String accentColor;
    private Boolean includeBrandLogo;

    /**
     * Mood / ambiance preset chosen by the user in the studio UI.
     * Examples: "sunset", "moss", "ochre", "mint", "eclipse"
     * Used to enrich the Stability AI prompt with atmosphere cues.
     */
    private String mood;
}
