package com.maamora.studio.repository;

import com.maamora.studio.model.PublishJob;
import com.maamora.studio.model.enums.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PublishJobRepository extends JpaRepository<PublishJob, String> {
    List<PublishJob> findAllByUserIdOrderByCreatedAtDesc(String userId);
    Optional<PublishJob> findByIdAndUserId(String id, String userId);
    List<PublishJob> findTop50ByStatusAndScheduledForLessThanEqualOrderByScheduledForAsc(DeliveryStatus status, Instant dueAt);
}
