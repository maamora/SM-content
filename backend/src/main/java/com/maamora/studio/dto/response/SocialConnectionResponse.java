package com.maamora.studio.dto.response;

import com.maamora.studio.model.SocialConnection;

import java.time.Instant;

public record SocialConnectionResponse(
        String id,
        String provider,
        String accountName,
        String status,
        Instant expiresAt
) {
    public static SocialConnectionResponse from(SocialConnection connection) {
        return new SocialConnectionResponse(
                connection.getId(), connection.getProvider().name(), connection.getAccountName(),
                connection.getStatus().name(), connection.getExpiresAt()
        );
    }
}
