package com.maamora.studio.dto.request;

import lombok.Data;

/**
 * Same three-way shape as RegisterRequest's brand fields, reused for an
 * already-authenticated account that has no brand yet — the post-Google
 * onboarding chooser. Exactly one of personal / joinCode / brandName should
 * be provided, same rule as registration.
 */
@Data
public class CompleteOnboardingRequest {
    private boolean personal;
    private String joinCode;
    private String brandName;
    private String logoUrl;
}
