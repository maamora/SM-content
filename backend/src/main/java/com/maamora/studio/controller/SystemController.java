package com.maamora.studio.controller;

import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.HiggsfieldDiagnosticsResponse;
import com.maamora.studio.dto.response.SystemCapabilitiesResponse;
import org.springframework.beans.factory.annotation.Value;
import com.maamora.studio.service.VideoGenerationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final VideoGenerationService videoGenerationService;

    public SystemController(VideoGenerationService videoGenerationService) {
        this.videoGenerationService = videoGenerationService;
    }

    @Value("${app.higgsfield.api-key-id:}")
    private String higgsfieldApiKeyId;

    @Value("${app.higgsfield.api-key-secret:}")
    private String higgsfieldApiKeySecret;

    @Value("${app.higgsfield.video-model:}")
    private String higgsfieldVideoModel;

    @Value("${app.higgsfield.base-url:https://platform.higgsfield.ai}")
    private String higgsfieldBaseUrl;

    @Value("${app.higgsfield.model:flux-pro/kontext/max/text-to-image}")
    private String higgsfieldModel;

    @Value("${app.higgsfield.reference-model:flux-pro/kontext/max/image-to-image}")
    private String higgsfieldReferenceModel;

    @Value("${app.cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @Value("${app.cloudinary.api-key:}")
    private String cloudinaryApiKey;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    @Value("${app.social.meta.app-id:}")
    private String metaAppId;

    @Value("${META_APP_SECRET:}")
    private String metaAppSecret;

    @Value("${app.social.tiktok.client-key:}")
    private String tiktokClientKey;

    @Value("${TIKTOK_CLIENT_SECRET:}")
    private String tiktokClientSecret;

    @Value("${app.social.linkedin.client-id:}")
    private String linkedinClientId;

    @Value("${LINKEDIN_CLIENT_SECRET:}")
    private String linkedinClientSecret;

    @Value("${app.social.x.client-id:}")
    private String xClientId;

    @Value("${X_CLIENT_SECRET:}")
    private String xClientSecret;

    @GetMapping("/higgsfield")
    public ApiResponse<HiggsfieldDiagnosticsResponse> higgsfieldDiagnostics() {
        return ApiResponse.ok(new HiggsfieldDiagnosticsResponse(
                configured(higgsfieldApiKeyId),
                configured(higgsfieldApiKeySecret),
                length(higgsfieldApiKeyId),
                length(higgsfieldApiKeySecret),
                containsWhitespace(higgsfieldApiKeyId),
                containsWhitespace(higgsfieldApiKeySecret),
                contains(higgsfieldApiKeyId, ':'),
                contains(higgsfieldApiKeySecret, ':'),
                higgsfieldBaseUrl,
                higgsfieldModel,
                higgsfieldReferenceModel,
                "Key"
        ));
    }

    @GetMapping("/capabilities")
    public ApiResponse<SystemCapabilitiesResponse> capabilities() {
        boolean captionGeneration = true;
        boolean imageGeneration = true;
        boolean creativeEditing = true;
        boolean photoShootGeneration = true;
        boolean videoGeneration = videoGenerationService.isConfigured();
        boolean cloudStorage = configured(cloudinaryCloudName)
                && configured(cloudinaryApiKey);
        boolean smtpEmail = configured(smtpHost);
        boolean metaOAuth = configured(metaAppId) && configured(metaAppSecret);
        boolean tiktokOAuth = configured(tiktokClientKey) && configured(tiktokClientSecret);
        boolean linkedinOAuth = configured(linkedinClientId) && configured(linkedinClientSecret);
        boolean xOAuth = configured(xClientId) && configured(xClientSecret);
        boolean socialPublishing = metaOAuth || tiktokOAuth || linkedinOAuth || xOAuth;

        return ApiResponse.ok(new SystemCapabilitiesResponse(
                captionGeneration,
                imageGeneration,
                cloudStorage,
                true,
                socialPublishing,
                smtpEmail,
                creativeEditing,
                photoShootGeneration,
                videoGeneration,
                smtpEmail,
                metaOAuth,
                tiktokOAuth,
                linkedinOAuth,
                xOAuth
        ));
    }

    private int length(String value) {
        return value == null ? 0 : value.length();
    }

    private boolean containsWhitespace(String value) {
        return value != null && value.chars().anyMatch(Character::isWhitespace);
    }

    private boolean contains(String value, char character) {
        return value != null && value.indexOf(character) >= 0;
    }

    private boolean configured(String value) {
        return value != null
                && !value.isBlank()
                && !value.equalsIgnoreCase("placeholder")
                && !value.equalsIgnoreCase("changeme");
    }
}
