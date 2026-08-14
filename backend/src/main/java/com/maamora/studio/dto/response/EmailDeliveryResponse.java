package com.maamora.studio.dto.response;

import com.maamora.studio.model.EmailDelivery;

import java.time.Instant;

public record EmailDeliveryResponse(
        String id,
        String toAddress,
        String subject,
        String status,
        String errorMessage,
        Instant createdAt,
        Instant updatedAt,
        Instant sentAt
) {
    public static EmailDeliveryResponse from(EmailDelivery delivery) {
        return new EmailDeliveryResponse(
                delivery.getId(), delivery.getToAddress(), delivery.getSubject(), delivery.getStatus().name(),
                delivery.getErrorMessage(), delivery.getCreatedAt(), delivery.getUpdatedAt(), delivery.getSentAt()
        );
    }
}
