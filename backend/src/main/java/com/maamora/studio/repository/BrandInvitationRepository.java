package com.maamora.studio.repository;

import com.maamora.studio.model.BrandInvitation;
import com.maamora.studio.model.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BrandInvitationRepository extends JpaRepository<BrandInvitation, String> {
    List<BrandInvitation> findByBrand_IdOrderByCreatedAtDesc(String brandId);

    List<BrandInvitation> findByInvitedEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(String email, InvitationStatus status);

    Optional<BrandInvitation> findByIdAndInvitedEmailIgnoreCase(String id, String email);

    boolean existsByBrand_IdAndInvitedEmailIgnoreCaseAndStatus(String brandId, String email, InvitationStatus status);
}
