package com.maamora.studio.dto.request;

import com.maamora.studio.model.enums.Format;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TemplateRequest {
    @NotBlank
    private String name;

    @NotNull
    private Format format;

    @NotBlank
    private String htmlPath;

    private String thumbnailUrl;
}
