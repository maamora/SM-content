package com.maamora.studio.repository;

import com.maamora.studio.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, String> {
    List<Post> findByBatchJobId(String batchJobId);
    Optional<Post> findByIdAndProduct_Brand_Id(String id, String brandId);
}
