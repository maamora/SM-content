package com.maamora.studio.dto.response;

import com.maamora.studio.model.BrandBan;
import lombok.Getter;

import java.time.Instant;

@Getter
public class BrandBanResponse {
    private final String id;
    private final String bannedEmail;
    private final String bannedName;
    private final Instant createdAt;

    public BrandBanResponse(BrandBan b) {
        this.id = b.getId();
        this.bannedEmail = b.getBannedEmail();
        this.bannedName = b.getBannedName();
        this.createdAt = b.getCreatedAt();
    }
}
