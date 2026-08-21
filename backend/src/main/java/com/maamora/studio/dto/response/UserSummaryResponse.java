package com.maamora.studio.dto.response;

import com.maamora.studio.model.User;
import lombok.Getter;

import java.time.Instant;

/** Never includes passwordHash — this is what a coworker (or the user themselves) is allowed to see. */
@Getter
public class UserSummaryResponse {
    private final String id;
    private final String name;
    private final String email;
    private final String role;
    private final Instant createdAt;

    public UserSummaryResponse(User u) {
        this.id = u.getId();
        this.name = u.getName();
        this.email = u.getEmail();
        this.role = u.getRole().name();
        this.createdAt = u.getCreatedAt();
    }
}
