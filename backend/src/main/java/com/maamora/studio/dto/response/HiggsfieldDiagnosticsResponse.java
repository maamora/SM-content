package com.maamora.studio.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class HiggsfieldDiagnosticsResponse {
    private boolean apiKeyIdConfigured;
    private boolean apiKeySecretConfigured;
    private int apiKeyIdLength;
    private int apiKeySecretLength;
    private boolean apiKeyIdContainsWhitespace;
    private boolean apiKeySecretContainsWhitespace;
    private boolean apiKeyIdContainsColon;
    private boolean apiKeySecretContainsColon;
    private String baseUrl;
    private String model;
    private String referenceModel;
    private String authorizationScheme;
}
