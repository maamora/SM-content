package com.maamora.studio.repository;

import com.maamora.studio.model.BrandMembership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BrandMembershipRepository extends JpaRepository<BrandMembership, String> {
    List<BrandMembership> findByUser_IdOrderByCreatedAtAsc(String userId);

    List<BrandMembership> findByBrand_Id(String brandId);

    Optional<BrandMembership> findByUser_IdAndBrand_Id(String userId, String brandId);

    boolean existsByUser_IdAndBrand_Id(String userId, String brandId);

    void deleteByUser_IdAndBrand_Id(String userId, String brandId);
}
