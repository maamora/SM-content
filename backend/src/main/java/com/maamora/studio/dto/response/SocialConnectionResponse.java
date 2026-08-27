package com.maamora.studio.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maamora.studio.model.SocialConnection;

import java.time.Instant;

public record SocialConnectionResponse(
        String id,
        String provider,
        String accountName,
        String status,
        Instant expiresAt,
        // Only meaningful for META: whether exchangeMeta found an Instagram
        // professional account linked to the connected Facebook Page. Lets
        // the frontend only offer "post to Instagram" when it's actually
        // possible for this specific connection.
        boolean hasInstagram
) {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static SocialConnectionResponse from(SocialConnection connection) {
        return new SocialConnectionResponse(
                connection.getId(), connection.getProvider().name(), connection.getAccountName(),
                connection.getStatus().name(), connection.getExpiresAt(), hasInstagram(connection.getMetadataJson())
        );
    }

    private static boolean hasInstagram(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) return false;
        try {
            JsonNode node = MAPPER.readTree(metadataJson);
            String value = node.path("instagramBusinessAccountId").asText("");
            return !value.isBlank();
        } catch (Exception exception) {
            return false;
        }
    }
}
