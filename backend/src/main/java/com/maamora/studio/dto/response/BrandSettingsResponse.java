package com.maamora.studio.dto.response;

import com.maamora.studio.model.BrandSettings;
import lombok.Getter;

@Getter
public class BrandSettingsResponse {
    private final String id;
    private final String name;
    // Shown in the Brand kit page so an existing member can share it with a
    // teammate to invite them into this same workspace (see
    // BrandSettingsService.joinExisting). Anyone already in the brand can see
    // it today since there's no owner-vs-member distinction yet — only
    // ADMIN vs regular USER globally — worth revisiting if that role model
    // gets more granular later.
    private final String joinCode;
    // "BUSINESS" or "PERSONAL" — lets the frontend soften "brand kit"
    // language for a personal profile. Rows created before this field
    // existed have a null accountType in the DB; treated as BUSINESS here
    // rather than requiring a data migration.
    private final String accountType;
    private final String logoUrl;
    private final String primaryColor;
    private final String secondaryColor;
    private final String fontFamily;
    private final String toneGuidelines;

    public BrandSettingsResponse(BrandSettings b) {
        this.id = b.getId();
        this.name = b.getName();
        this.joinCode = b.getJoinCode();
        this.accountType = b.getAccountType() != null ? b.getAccountType().name() : "BUSINESS";
        this.logoUrl = b.getLogoUrl();
        this.primaryColor = b.getPrimaryColor();
        this.secondaryColor = b.getSecondaryColor();
        this.fontFamily = b.getFontFamily();
        this.toneGuidelines = b.getToneGuidelines();
    }
}
