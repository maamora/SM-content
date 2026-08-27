package com.maamora.studio.service;

import com.maamora.studio.dto.request.ChangePasswordRequest;
import com.maamora.studio.dto.request.CompleteOnboardingRequest;
import com.maamora.studio.dto.request.UpdateProfileRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BrandSettingsService brandSettingsService;
    private final PasswordEncoder passwordEncoder;

    public User getById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    public User updateProfile(String userId, UpdateProfileRequest request) {
        User user = getById(userId);
        if (!request.getEmail().equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new UnauthorizedException("An account with this email already exists.");
        }
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        return userRepository.save(user);
    }

    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = getById(userId);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /** Everyone else sharing the current user's brand — the "coworkers" list on the Settings page. */
    public List<User> listCoworkers(String userId) {
        String brandId = brandSettingsService.getForUser(userId).getId();
        return userRepository.findByBrand_IdOrderByCreatedAtAsc(brandId);
    }

    /**
     * One-time setup for an account that authenticated without ever choosing
     * personal/create/join — currently only Google sign-up reaches this state
     * (see AuthService.loginOrCreateGoogle). Same three-way branch and
     * validation as RegisterRequest; the only difference is there's no new
     * User row to create, just a brand to attach to the existing one.
     */
    @Transactional
    public User completeOnboarding(String userId, CompleteOnboardingRequest request) {
        User user = getById(userId);
        if (user.getBrand() != null) {
            throw new UnauthorizedException("This account already has a workspace configured.");
        }

        boolean joining = request.getJoinCode() != null && !request.getJoinCode().isBlank();
        if (!request.isPersonal() && !joining && (request.getBrandName() == null || request.getBrandName().isBlank())) {
            throw new UnauthorizedException("Enter a brand name, choose a personal account, or enter a workspace code to join an existing brand.");
        }

        BrandSettings brand = request.isPersonal()
                ? brandSettingsService.createPersonalWorkspace(user.getName())
                : joining
                        ? brandSettingsService.joinExisting(request.getJoinCode())
                        : brandSettingsService.createForNewUser(request.getBrandName(), request.getLogoUrl());

        user.setBrand(brand);
        return userRepository.save(user);
    }
}
