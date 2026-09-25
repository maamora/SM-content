package com.maamora.studio.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/** Selects the configured managed image provider and applies a bounded fallback for transient failures. */
@Service
@RequiredArgsConstructor
@Slf4j
public class ImageGenerationProvider {

    private final StabilityImageService stabilityImageService;
    private final GeminiImageService geminiImageService;
    private final XaiImageService xaiImageService;
    private final MetaImageService metaImageService;

    @Value("${app.image.provider:disabled}")
    private String provider;

    @Value("${app.image.fallback-provider:disabled}")
    private String fallbackProvider;

    /**
     * Tracks the active provider being out of quota/credit/access so the
     * frontend can show a "temporarily unavailable" notice instead of a
     * confusing per-post error. cooldownUntil is set for time-based limits
     * (rate limiting) and left null for balance/access issues that need a
     * manual fix (top up credits, fix API access) rather than a timer.
     */
    private volatile Instant cooldownUntil;
    private volatile String cooldownReason;

    public record ImageProviderStatus(boolean available, String provider, boolean configured, String reason, String retryAt) {}

    public ImageProviderStatus status() {
        String active = activeProvider();
        Instant until = cooldownUntil;
        if (until != null && Instant.now().isAfter(until)) {
            clearOutage();
            until = null;
        }
        boolean configuredNow = !isDisabled(active) && serviceFor(active).isConfigured();
        boolean available = cooldownReason == null;
        return new ImageProviderStatus(available, active, configuredNow, cooldownReason, until == null ? null : until.toString());
    }

    private void recordOutageIfApplicable(RuntimeException failure) {
        String message = failure.getMessage();
        if (message == null) return;
        String normalized = message.toLowerCase();
        boolean exhausted = normalized.contains("credit") || normalized.contains("balance")
                || normalized.contains("insufficient") || normalized.contains("quota")
                || normalized.contains("payment required") || normalized.contains(" 402")
                || normalized.contains("denied access") || normalized.contains("permission_denied");
        boolean rateLimited = !exhausted && (normalized.contains("429") || normalized.contains("rate-limit")
                || normalized.contains("rate limited") || normalized.contains("too many requests"));
        if (exhausted) {
            cooldownReason = compact(message);
            cooldownUntil = null;
        } else if (rateLimited) {
            cooldownReason = compact(message);
            cooldownUntil = Instant.now().plus(Duration.ofMinutes(5));
        }
    }

    private void clearOutage() {
        cooldownUntil = null;
        cooldownReason = null;
    }

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
            throw new IllegalStateException("Image generation is disabled. Configure IMAGE_PROVIDER=gemini or disabled.");
        }
        try {
            byte[] result = service().generateImage(prompt, aspectRatio, references);
            clearOutage();
            return result;
        } catch (RuntimeException primaryFailure) {
            recordOutageIfApplicable(primaryFailure);
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
            case "gemini", "stability", "stability.ai", "xai", "x.ai", "grok", "meta", "llama", "muse" -> true;
            default -> false;
        };
    }

    private boolean isTransient(RuntimeException failure) {
        String message = failure.getMessage();
        if (message == null) return false;
        String normalized = message.toLowerCase();
        return normalized.contains("429") || normalized.contains("temporarily unavailable")
                || normalized.contains("capacity") || normalized.contains("timed out")
                || normalized.contains("timeout") || normalized.contains("http 5")
                || normalized.contains("3030") || normalized.contains("output has been flagged")
                || normalized.contains("prompt / input image combination");
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
            case "gemini" -> geminiImageService;
            case "xai", "x.ai", "grok" -> xaiImageService;
            case "meta", "llama", "muse" -> metaImageService;
            case "stability", "stability.ai" -> stabilityImageService;
            case "disabled", "none" -> throw new IllegalStateException(
                    "Image generation is disabled. Configure IMAGE_PROVIDER=gemini or disabled.");
            default -> throw new IllegalStateException(
                    "Unsupported image provider: " + activeProvider() + ". Use gemini or disabled.");
        };
    }
}
