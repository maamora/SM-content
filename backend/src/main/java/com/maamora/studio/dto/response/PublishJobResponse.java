package com.maamora.studio.dto.response;

import com.maamora.studio.model.PublishJob;

import java.time.Instant;

public record PublishJobResponse(
        String id,
        String postId,
        String connectionId,
        String provider,
        String status,
        String externalPostId,
        String errorMessage,
        Instant createdAt,
        Instant updatedAt,
        Instant scheduledFor,
        Instant publishedAt
) {
    public static PublishJobResponse from(PublishJob job) {
        return new PublishJobResponse(
                job.getId(), job.getPost().getId(), job.getConnection().getId(), job.getProvider().name(),
                job.getStatus().name(), job.getExternalPostId(), job.getErrorMessage(), job.getCreatedAt(),
                job.getUpdatedAt(), job.getScheduledFor(), job.getPublishedAt()
        );
    }
}
