package com.maamora.studio.service;

import com.maamora.studio.dto.request.ChangePasswordRequest;
import com.maamora.studio.dto.request.UpdateProfileRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.User;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
}
