package com.maamora.studio.repository;

import com.maamora.studio.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    long countByBrand_Id(String brandId);
    List<User> findByBrand_IdOrderByCreatedAtAsc(String brandId);
}
