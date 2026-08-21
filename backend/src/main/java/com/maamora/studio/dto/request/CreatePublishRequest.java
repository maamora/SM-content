package com.maamora.studio.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public record CreatePublishRequest(
        @NotBlank String postId,
        @NotBlank String connectionId,
        Instant scheduledFor
) {}
