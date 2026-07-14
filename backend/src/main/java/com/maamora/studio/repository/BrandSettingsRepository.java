package com.maamora.studio.repository;

import com.maamora.studio.model.BrandSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BrandSettingsRepository extends JpaRepository<BrandSettings, String> {
    Optional<BrandSettings> findByUserId(String userId);
}
