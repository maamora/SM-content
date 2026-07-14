package com.maamora.studio.dto.request;

import lombok.Data;

@Data
public class BrandSettingsRequest {
    private String name;
    private String logoUrl;
    private String primaryColor;
    private String secondaryColor;
    private String fontFamily;
    private String toneGuidelines;
}
