package com.maamora.studio.service;

import com.maamora.studio.dto.request.BrandSettingsRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.repository.BrandSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BrandSettingsService {

    private final BrandSettingsRepository brandSettingsRepository;

    public BrandSettings getForUser(String userId) {
        return brandSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No brand found for this user."));
    }

    public BrandSettings update(String userId, BrandSettingsRequest request) {
        BrandSettings brand = getForUser(userId);
        if (request.getName() != null) brand.setName(request.getName());
        if (request.getLogoUrl() != null) brand.setLogoUrl(request.getLogoUrl());
        if (request.getPrimaryColor() != null) brand.setPrimaryColor(request.getPrimaryColor());
        if (request.getSecondaryColor() != null) brand.setSecondaryColor(request.getSecondaryColor());
        if (request.getFontFamily() != null) brand.setFontFamily(request.getFontFamily());
        if (request.getToneGuidelines() != null) brand.setToneGuidelines(request.getToneGuidelines());
        return brandSettingsRepository.save(brand);
    }
}
