package com.maamora.studio.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class UserProfileResponse {
    private String id;
    private String name;
    private String email;
    private String brandId;
    private String role;
    private Instant createdAt;
}
