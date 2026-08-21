package com.maamora.studio.dto.response;

import com.maamora.studio.model.SocialAccount;
import lombok.Getter;

import java.time.Instant;

@Getter
public class SocialAccountResponse {
    private final String id;
    private final String platform;
    private final String handle;
    private final Instant connectedAt;

    public SocialAccountResponse(SocialAccount a) {
        this.id = a.getId();
        this.platform = a.getPlatform().name();
        this.handle = a.getHandle();
        this.connectedAt = a.getConnectedAt();
    }
}
