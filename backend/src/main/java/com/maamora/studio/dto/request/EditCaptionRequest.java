package com.maamora.studio.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EditCaptionRequest {
    @NotBlank
    private String language; // "fr" | "ar" | "darija"

    @NotBlank
    private String text;
}
