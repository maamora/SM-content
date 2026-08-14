package com.maamora.studio.controller;

import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.SystemCapabilitiesResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${STABILITY_API_KEY:}")
    private String stabilityApiKey;

    @Value("${app.higgsfield.api-key-id:}")
    private String higgsfieldApiKeyId;

    @Value("${app.higgsfield.api-key-secret:}")
    private String higgsfieldApiKeySecret;

    @Value("${app.higgsfield.video-model:}")
    private String higgsfieldVideoModel;

    @Value("${app.ollama.enabled:false}")
    private boolean ollamaEnabled;

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

    @GetMapping("/capabilities")
    public ApiResponse<SystemCapabilitiesResponse> capabilities() {
        boolean captionGeneration = configured(geminiApiKey) || ollamaEnabled;
        boolean imageGeneration = configured(stabilityApiKey)
                || configured(higgsfieldApiKeyId) && configured(higgsfieldApiKeySecret);
        boolean creativeEditing = configured(higgsfieldApiKeyId)
                && configured(higgsfieldApiKeySecret);
        boolean photoShootGeneration = creativeEditing;
        boolean videoGeneration = creativeEditing && configured(higgsfieldVideoModel);
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

    private boolean configured(String value) {
        return value != null
                && !value.isBlank()
                && !value.equalsIgnoreCase("placeholder")
                && !value.equalsIgnoreCase("changeme");
    }
}
