package com.maamora.studio.repository;

import com.maamora.studio.model.CreativeJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CreativeJobRepository extends JpaRepository<CreativeJob, String> {
    List<CreativeJob> findTop20ByUserIdOrderByCreatedAtDesc(String userId);

    Optional<CreativeJob> findByIdAndUserId(String id, String userId);
}
