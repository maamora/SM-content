package com.maamora.studio.repository;

import com.maamora.studio.model.BrandBan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BrandBanRepository extends JpaRepository<BrandBan, String> {
    List<BrandBan> findByBrand_IdOrderByCreatedAtDesc(String brandId);
    boolean existsByBrand_IdAndBannedEmailIgnoreCase(String brandId, String email);
    Optional<BrandBan> findByIdAndBrand_Id(String id, String brandId);
    List<BrandBan> findByBrand_Id(String brandId);
}
