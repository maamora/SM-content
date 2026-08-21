package com.maamora.studio.repository;

import com.maamora.studio.model.EmailDelivery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailDeliveryRepository extends JpaRepository<EmailDelivery, String> {
    List<EmailDelivery> findAllByUserIdOrderByCreatedAtDesc(String userId);
    Optional<EmailDelivery> findByIdAndUserId(String id, String userId);
}
