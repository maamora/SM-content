package com.maamora.studio.dto.response;

import com.maamora.studio.model.BrandSettings;
import lombok.Getter;

@Getter
public class BrandSettingsResponse {
    private final String id;
    private final String name;
    private final String logoUrl;
    private final String primaryColor;
    private final String secondaryColor;
    private final String fontFamily;
    private final String toneGuidelines;

    public BrandSettingsResponse(BrandSettings b) {
        this.id = b.getId();
        this.name = b.getName();
        this.logoUrl = b.getLogoUrl();
        this.primaryColor = b.getPrimaryColor();
        this.secondaryColor = b.getSecondaryColor();
        this.fontFamily = b.getFontFamily();
        this.toneGuidelines = b.getToneGuidelines();
    }
}
