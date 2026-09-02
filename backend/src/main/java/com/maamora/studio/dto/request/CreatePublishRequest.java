package com.maamora.studio.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public record CreatePublishRequest(
        @NotBlank String postId,
        @NotBlank String connectionId,
        // Only relevant when the connection's provider is META: "FACEBOOK_PAGE"
        // or "INSTAGRAM". Optional — SocialPublishService picks a sensible
        // default (Instagram if this connection has one linked, otherwise the
        // Facebook Page) when omitted. Ignored for every other provider.
        String metaTarget
) {}
