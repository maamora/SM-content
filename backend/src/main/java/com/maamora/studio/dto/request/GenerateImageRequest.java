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
}
