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

    @Value("${app.image.provider:higgsfield}")
    private String provider;

    public String activeProvider() {
        return provider == null || provider.isBlank() ? "higgsfield" : provider.trim().toLowerCase();
    }

    public boolean isConfigured() {
        return service().isConfigured();
    }

    public boolean isVideoConfigured() {
        return service().isVideoConfigured();
    }

    public boolean supportsPhotoShoot() {
        return "higgsfield".equals(activeProvider()) && isConfigured();
    }

    public byte[] generateImage(String prompt, String aspectRatio, List<String> references) {
        return service().generateImage(prompt, aspectRatio, references);
    }

    public byte[] generateVideo(String imageUrl, String prompt, String aspectRatio) {
        if (!"higgsfield".equals(activeProvider())) {
            throw new IllegalStateException("Video generation is unavailable for the selected image provider.");
        }
        return higgsfieldImageService.generateVideo(imageUrl, prompt, aspectRatio);
    }

    private ManagedImageService service() {
        return switch (activeProvider()) {
            case "fal", "fal.ai" -> falImageService;
            case "higgsfield" -> higgsfieldImageService;
            default -> throw new IllegalStateException(
                    "Unsupported image provider: " + activeProvider() + ". Use higgsfield or fal.");
        };
    }
}
