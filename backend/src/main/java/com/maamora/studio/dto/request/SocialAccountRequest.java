package com.maamora.studio.dto.request;

import com.maamora.studio.model.enums.SocialPlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SocialAccountRequest {
    @NotNull
    private SocialPlatform platform;

    @NotBlank
    private String handle;
}
