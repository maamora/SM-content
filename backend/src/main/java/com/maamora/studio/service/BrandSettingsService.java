package com.maamora.studio.service;

import com.maamora.studio.dto.request.BrandSettingsRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.repository.BrandSettingsRepository;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BrandSettingsService {

    private final BrandSettingsRepository brandSettingsRepository;
    private final UserRepository userRepository;

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
}
