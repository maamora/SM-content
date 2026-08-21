package com.maamora.studio.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Creates a caption-ready STUDIO post after the browser has generated a visual
 * and uploaded it through the authenticated media endpoint.
 */
@Data
public class CreateBrowserVisualPostRequest {

    @NotBlank
    private String productId;

    @NotBlank
    private String templateId;

    @NotBlank
    @Pattern(regexp = "https?://.+", message = "imageUrl must be an HTTP(S) media URL.")
    private String imageUrl;

    private String badgeText;
    private String promoText;
    private String headline;
    private String supportingText;
    private String ctaText;
    private String layoutStyle;
    private String productFocus;
    private String textAlignment;
}
