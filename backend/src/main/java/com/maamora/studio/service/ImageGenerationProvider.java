package com.maamora.studio.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

/** Selects the configured managed image provider without exposing provider details to controllers. */
@Service
@RequiredArgsConstructor
public class ImageGenerationProvider {

    private final HiggsfieldImageService higgsfieldImageService;
    private final FalImageService falImageService;
    private final StabilityImageService stabilityImageService;

    @Value("${app.image.provider:stability}")
    private String provider;

    public String activeProvider() {
        return provider == null || provider.isBlank() ? "stability" : provider.trim().toLowerCase();
    }

    public boolean isConfigured() {
        return service().isConfigured();
    }

    public boolean supportsPhotoShoot() {
        String active = activeProvider();
        return ("higgsfield".equals(active) || "fal".equals(active) || "fal.ai".equals(active)
                || "stability".equals(active) || "stability.ai".equals(active))
                && isConfigured();
    }

    public byte[] generateImage(String prompt, String aspectRatio, List<String> references) {
        return service().generateImage(prompt, aspectRatio, references);
    }

    private ManagedImageService service() {
        return switch (activeProvider()) {
            case "fal", "fal.ai" -> falImageService;
            case "higgsfield" -> higgsfieldImageService;
            case "stability", "stability.ai" -> stabilityImageService;
            default -> throw new IllegalStateException(
                    "Unsupported image provider: " + activeProvider() + ". Use stability, fal, or higgsfield.");
        };
    }
}
