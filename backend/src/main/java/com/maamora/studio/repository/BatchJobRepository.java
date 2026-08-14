package com.maamora.studio.repository;

import com.maamora.studio.model.BatchJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BatchJobRepository extends JpaRepository<BatchJob, String> {
    List<BatchJob> findByBrandId(String brandId);
    Optional<BatchJob> findByIdAndBrandId(String id, String brandId);
}
