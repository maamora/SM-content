package com.maamora.studio.service;

import com.maamora.studio.dto.request.BrandSettingsRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.repository.BrandSettingsRepository;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BrandSettingsService {

    private final BrandSettingsRepository brandSettingsRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    /**
     * Every account owns a dedicated neutral workspace. Historical accounts without
     * a brand are repaired lazily rather than being silently attached to another
     * user's workspace.
     */
    public BrandSettings getForUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (user.getBrand() == null) {
            BrandSettings neutralBrand = createNeutralBrand();
            user.setBrand(neutralBrand);
            userRepository.save(user);
        }
        return user.getBrand();
    }

    /** Creates an intentionally anonymous workspace. Saving Brand settings is the opt-in identity event. */
    public BrandSettings createNeutralBrand() {
        return brandSettingsRepository.save(BrandSettings.builder()
                .name("")
                .configured(false)
                .build());
    }

    public BrandSettings update(String userId, BrandSettingsRequest request) {
        BrandSettings brand = getForUser(userId);
        if (request.getName() != null) brand.setName(request.getName());
        if (request.getLogoUrl() != null) brand.setLogoUrl(request.getLogoUrl());
        if (request.getPrimaryColor() != null) brand.setPrimaryColor(request.getPrimaryColor());
        if (request.getSecondaryColor() != null) brand.setSecondaryColor(request.getSecondaryColor());
        if (request.getFontFamily() != null) brand.setFontFamily(request.getFontFamily());
        if (request.getToneGuidelines() != null) brand.setToneGuidelines(request.getToneGuidelines());
        brand.setConfigured(true);
        return brandSettingsRepository.save(brand);
    }

    /**
     * Keeps the file and its Brand record in a single server-side operation.
     * A logo is intentionally optional: this path changes no Studio placement
     * preference and neutral compositions remain available.
     */
    public BrandSettings uploadLogo(String userId, MultipartFile file) {
        validateLogo(file);
        BrandSettings brand = getForUser(userId);

        try {
            String contentType = file.getContentType();
            String path = "brand/logos/" + UUID.randomUUID() + extensionOf(file.getOriginalFilename());
            String logoUrl = storageService.upload(file.getBytes(), path, contentType);
            if (logoUrl == null || logoUrl.isBlank()) {
                throw new IllegalStateException("The logo storage provider did not return a usable URL.");
            }
            brand.setLogoUrl(logoUrl);
            brand.setConfigured(true);
            return brandSettingsRepository.save(brand);
        } catch (IOException exception) {
            throw new IllegalArgumentException("The selected logo could not be read.", exception);
        } catch (RuntimeException exception) {
            throw new IllegalStateException("The logo could not be stored. Check storage configuration and try again.", exception);
        }
    }

    private void validateLogo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose a logo image to upload.");
        }
        if (file.getSize() > 15L * 1024L * 1024L) {
            throw new IllegalArgumentException("The logo must be 15 MB or smaller.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new IllegalArgumentException("Choose a PNG, JPG, WebP, or SVG logo.");
        }
    }

    private String extensionOf(String filename) {
        if (filename == null) return ".png";
        int dot = filename.lastIndexOf('.');
        return dot == -1 ? ".png" : filename.substring(dot);
    }
}
