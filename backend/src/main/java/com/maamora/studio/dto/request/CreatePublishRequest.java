package com.maamora.studio.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreatePublishRequest(
        @NotBlank String postId,
        @NotBlank String connectionId
) {}
