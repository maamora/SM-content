package com.maamora.studio.repository;

import com.maamora.studio.model.SocialAccount;
import com.maamora.studio.model.enums.SocialPlatform;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, String> {
    List<SocialAccount> findByBrand_Id(String brandId);
    Optional<SocialAccount> findByBrand_IdAndPlatform(String brandId, SocialPlatform platform);
}
