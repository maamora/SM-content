package com.maamora.studio.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

/** Selects the configured managed image provider and applies a bounded fallback for transient failures. */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImageGenerationProvider {

    private final HiggsfieldImageService higgsfieldImageService;
    private final FalImageService falImageService;
    private final StabilityImageService stabilityImageService;
    private final OpenRouterImageService openRouterImageService;
    private final OpenAIImageService openAIImageService;
    private final DeapiImageService deapiImageService;
    private final CloudflareWorkersAIImageService cloudflareWorkersAIImageService;

    @Value("${app.image.provider:disabled}")
    private String provider;

    @Value("${app.image.fallback-provider:disabled}")
    private String fallbackProvider;

    public String activeProvider() {
        return normalize(provider);
    }

    public String configuredFallbackProvider() {
        return normalize(fallbackProvider);
    }

    public boolean isConfigured() {
        return !isDisabled(activeProvider()) && service().isConfigured();
    }

    public boolean supportsPhotoShoot() {
        String active = activeProvider();
        return supportsReferences(active) && isConfigured();
    }

    public byte[] generateImage(String prompt, String aspectRatio, List<String> references) {
        String active = activeProvider();
        if (isDisabled(active)) {
            throw new IllegalStateException("Image generation is disabled. Configure IMAGE_PROVIDER=cloudflare, deapi, openai, stability, fal, higgsfield, or disabled.");
        }
        try {
            return service().generateImage(prompt, aspectRatio, references);
        } catch (RuntimeException primaryFailure) {
            String fallback = configuredFallbackProvider();
            if (!shouldFallback(primaryFailure, active, fallback)) {
                throw primaryFailure;
            }
            log.warn("Primary image provider {} failed with a retryable error; trying fallback provider {}: {}",
                    active, fallback, compact(primaryFailure.getMessage()));
            try {
                return serviceFor(fallback).generateImage(prompt, aspectRatio, references);
            } catch (RuntimeException fallbackFailure) {
                fallbackFailure.addSuppressed(primaryFailure);
                throw new IllegalStateException("Image generation failed with both " + active
                        + " and fallback provider " + fallback + ". " + compact(fallbackFailure.getMessage()), fallbackFailure);
            }
        }
    }

    private boolean shouldFallback(RuntimeException failure, String active, String fallback) {
        return !isDisabled(fallback)
                && !active.equals(fallback)
                && serviceFor(fallback).isConfigured()
                && isTransient(failure);
    }

    private boolean supportsReferences(String selectedProvider) {
        return switch (selectedProvider) {
            case "higgsfield", "fal", "fal.ai", "stability", "stability.ai", "openrouter", "open-router",
                    "openai", "deapi", "de-api", "cloudflare", "cloudflare-ai", "workers-ai" -> true;
            default -> false;
        };
    }

    private boolean isTransient(RuntimeException failure) {
        String message = failure.getMessage();
        if (message == null) return false;
        String normalized = message.toLowerCase();
        return normalized.contains("429") || normalized.contains("temporarily unavailable")
                || normalized.contains("capacity") || normalized.contains("timed out")
                || normalized.contains("timeout") || normalized.contains("http 5");
    }

    private boolean isDisabled(String selectedProvider) {
        return "disabled".equals(selectedProvider) || "none".equals(selectedProvider);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? "disabled" : value.trim().toLowerCase();
    }

    private String compact(String value) {
        if (value == null || value.isBlank()) return "no provider details";
        return value.length() > 280 ? value.substring(0, 280) : value;
    }

    private ManagedImageService service() {
        return serviceFor(activeProvider());
    }

    private ManagedImageService serviceFor(String selectedProvider) {
        return switch (selectedProvider) {
            case "fal", "fal.ai" -> falImageService;
            case "higgsfield" -> higgsfieldImageService;
            case "stability", "stability.ai" -> stabilityImageService;
            case "openrouter", "open-router" -> openRouterImageService;
            case "openai" -> openAIImageService;
            case "deapi", "de-api" -> deapiImageService;
            case "cloudflare", "cloudflare-ai", "workers-ai" -> cloudflareWorkersAIImageService;
            case "disabled", "none" -> throw new IllegalStateException(
                    "Image generation is disabled. Configure IMAGE_PROVIDER=cloudflare, deapi, openai, stability, fal, higgsfield, or disabled.");
            default -> throw new IllegalStateException(
                    "Unsupported image provider: " + activeProvider() + ". Use cloudflare, deapi, openai, stability, fal, higgsfield, or disabled.");
        };
    }
}
