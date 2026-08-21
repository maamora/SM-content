package com.maamora.studio.service;

import com.maamora.studio.dto.request.SocialAccountRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.SocialAccount;
import com.maamora.studio.repository.SocialAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SocialAccountService {

    private final SocialAccountRepository socialAccountRepository;
    private final BrandSettingsService brandSettingsService;

    public List<SocialAccount> listForUser(String userId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return socialAccountRepository.findByBrand_Id(brand.getId());
    }

    /** One handle per platform per brand — connecting again on a platform that's already linked replaces the handle. */
    public SocialAccount connect(String userId, SocialAccountRequest request) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        SocialAccount account = socialAccountRepository.findByBrand_IdAndPlatform(brand.getId(), request.getPlatform())
                .orElseGet(() -> SocialAccount.builder().brand(brand).platform(request.getPlatform()).build());
        account.setHandle(request.getHandle());
        return socialAccountRepository.save(account);
    }

    public void disconnect(String userId, String accountId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        SocialAccount account = socialAccountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Linked account not found."));
        if (!account.getBrand().getId().equals(brand.getId())) {
            throw new UnauthorizedException("This linked account doesn't belong to your workspace.");
        }
        socialAccountRepository.delete(account);
    }
}
