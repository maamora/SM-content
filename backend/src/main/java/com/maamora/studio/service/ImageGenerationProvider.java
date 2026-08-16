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
    private final OpenRouterImageService openRouterImageService;
    private final OpenAIImageService openAIImageService;
    private final DeapiImageService deapiImageService;

    @Value("${app.image.provider:disabled}")
    private String provider;

    public String activeProvider() {
        return provider == null || provider.isBlank() ? "disabled" : provider.trim().toLowerCase();
    }

    public boolean isConfigured() {
        return !isDisabled() && service().isConfigured();
    }

    public boolean supportsPhotoShoot() {
        String active = activeProvider();
        return ("higgsfield".equals(active) || "fal".equals(active) || "fal.ai".equals(active)
                || "stability".equals(active) || "stability.ai".equals(active)
                || "openrouter".equals(active) || "open-router".equals(active)
                || "openai".equals(active) || "deapi".equals(active))
                && isConfigured();
    }

    public byte[] generateImage(String prompt, String aspectRatio, List<String> references) {
        if (isDisabled()) {
            throw new IllegalStateException("Image generation is disabled in OpenRouter-only test mode.");
        }
        return service().generateImage(prompt, aspectRatio, references);
    }

    private boolean isDisabled() {
        return "disabled".equals(activeProvider()) || "none".equals(activeProvider());
    }

    private ManagedImageService service() {
        return switch (activeProvider()) {
            case "fal", "fal.ai" -> falImageService;
            case "higgsfield" -> higgsfieldImageService;
            case "stability", "stability.ai" -> stabilityImageService;
            case "openrouter", "open-router" -> openRouterImageService;
            case "openai" -> openAIImageService;
            case "deapi", "de-api" -> deapiImageService;
            case "disabled", "none" -> throw new IllegalStateException(
                    "Image generation is disabled. Configure IMAGE_PROVIDER=deapi, openai, stability, fal, higgsfield, or disabled.");
            default -> throw new IllegalStateException(
                    "Unsupported image provider: " + activeProvider() + ". Use deapi, openai, stability, fal, higgsfield, or disabled.");
        };
    }
}
