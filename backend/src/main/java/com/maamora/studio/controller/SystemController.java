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

    @Value("${app.ollama.enabled:false}")
    private boolean ollamaEnabled;

    @Value("${app.cloudinary.cloud-name:}")
    private String cloudinaryCloudName;

    @Value("${app.cloudinary.api-key:}")
    private String cloudinaryApiKey;

    @GetMapping("/capabilities")
    public ApiResponse<SystemCapabilitiesResponse> capabilities() {
        boolean captionGeneration = configured(geminiApiKey) || ollamaEnabled;
        boolean imageGeneration = configured(stabilityApiKey)
                || configured(higgsfieldApiKeyId) && configured(higgsfieldApiKeySecret);
        boolean cloudStorage = configured(cloudinaryCloudName)
                && configured(cloudinaryApiKey);

        return ApiResponse.ok(new SystemCapabilitiesResponse(
                captionGeneration,
                imageGeneration,
                cloudStorage,
                true,
                false,
                false
        ));
    }

    private boolean configured(String value) {
        return value != null
                && !value.isBlank()
                && !value.equalsIgnoreCase("placeholder")
                && !value.equalsIgnoreCase("changeme");
    }
}
