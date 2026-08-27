package com.maamora.studio.dto.response;

import com.maamora.studio.model.BrandInvitation;
import lombok.Getter;

import java.time.Instant;

/**
 * Serves both directions with one shape: a brand's "sent invites" list (Team
 * tab) cares about invitedEmail/status, a recipient's "invites for me" list
 * (Notifications) cares about brandName/brandLogoUrl/invitedByName. Simpler
 * than two near-identical DTOs for what's still a small, single-purpose
 * feature.
 */
@Getter
public class BrandInvitationResponse {
    private final String id;
    private final String brandId;
    private final String brandName;
    private final String brandLogoUrl;
    private final String invitedEmail;
    private final String invitedByName;
    private final String status;
    private final Instant createdAt;

    public BrandInvitationResponse(BrandInvitation invitation) {
        this.id = invitation.getId();
        this.brandId = invitation.getBrand().getId();
        this.brandName = invitation.getBrand().getName();
        this.brandLogoUrl = invitation.getBrand().getLogoUrl();
        this.invitedEmail = invitation.getInvitedEmail();
        this.invitedByName = invitation.getInvitedBy() == null ? null : invitation.getInvitedBy().getName();
        this.status = invitation.getStatus().name();
        this.createdAt = invitation.getCreatedAt();
    }
}
