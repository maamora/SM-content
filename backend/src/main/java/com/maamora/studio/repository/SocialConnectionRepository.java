package com.maamora.studio.repository;

import com.maamora.studio.model.SocialConnection;
import com.maamora.studio.model.enums.SocialProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SocialConnectionRepository extends JpaRepository<SocialConnection, String> {
    List<SocialConnection> findAllByUserIdOrderByUpdatedAtDesc(String userId);
    Optional<SocialConnection> findByIdAndUserId(String id, String userId);
    Optional<SocialConnection> findByUserIdAndProviderAndExternalAccountId(String userId, SocialProvider provider, String externalAccountId);
}
