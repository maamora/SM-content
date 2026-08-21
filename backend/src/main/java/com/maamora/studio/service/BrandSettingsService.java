package com.maamora.studio.service;

import com.maamora.studio.dto.request.BrandSettingsRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.repository.BrandSettingsRepository;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BrandSettingsService {

    private final BrandSettingsRepository brandSettingsRepository;
    private final UserRepository userRepository;

    /** Every user belongs to the same shared Maamora workspace. */
    public BrandSettings getForUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (user.getBrand() == null) {
            throw new ResourceNotFoundException("No brand configured for this account.");
        }
        return user.getBrand();
    }

    /**
     * Used by AuthService (new user registration) and the startup seeders.
     * There's supposed to be only one row, but historical data issues have
     * left duplicate "Maamora" rows in some databases — picking one via an
     * unordered findFirst() risked silently assigning new users to a "ghost"
     * brand that no one else's data lives on (their products would never show
     * up for anyone else, including admin approval counts). Instead, pick the
     * row that's actually in use — the one with the most users attached —
     * and break ties by id so every call agrees on the same row.
     */
    public BrandSettings getSharedBrand() {
        List<BrandSettings> brands = brandSettingsRepository.findAll();
        if (brands.isEmpty()) {
            throw new IllegalStateException(
                    "No brand has been seeded yet. Restart the backend so BrandSeeder can create one.");
        }
        if (brands.size() == 1) {
            return brands.get(0);
        }
        return brands.stream()
                .max(Comparator
                        .comparingLong((BrandSettings b) -> userRepository.countByBrand_Id(b.getId()))
                        .thenComparing(BrandSettings::getId))
                .orElseThrow();
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
