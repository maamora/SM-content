package com.maamora.studio.controller;

import com.maamora.studio.dto.request.ChangePasswordRequest;
import com.maamora.studio.dto.request.CompleteOnboardingRequest;
import com.maamora.studio.dto.request.UpdateProfileRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.UserSummaryResponse;
import com.maamora.studio.model.User;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CurrentUserProvider currentUser;

    @GetMapping("/me")
    public ApiResponse<UserSummaryResponse> me() {
        return ApiResponse.ok(new UserSummaryResponse(userService.getById(currentUser.getCurrentUserId())));
    }

    @PutMapping("/me")
    public ApiResponse<UserSummaryResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok(new UserSummaryResponse(userService.updateProfile(currentUser.getCurrentUserId(), request)));
    }

    @PutMapping("/me/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(currentUser.getCurrentUserId(), request);
        return ApiResponse.ok(null);
    }

    /** Everyone sharing the caller's brand — powers the "Coworkers" section of the Settings page. */
    @GetMapping("/coworkers")
    public ApiResponse<List<UserSummaryResponse>> coworkers() {
        List<UserSummaryResponse> result = userService.listCoworkers(currentUser.getCurrentUserId())
                .stream().map(UserSummaryResponse::new).toList();
        return ApiResponse.ok(result);
    }

    /**
     * One-time setup for an account with no brand yet (currently only reached
     * via Google sign-up — see AuthService.loginOrCreateGoogle). The JWT
     * doesn't encode brandId, so no new token is needed after this; the
     * frontend just re-fetches /api/users/me.
     */
    @PostMapping("/me/onboarding")
    public ApiResponse<UserSummaryResponse> completeOnboarding(@RequestBody CompleteOnboardingRequest request) {
        User user = userService.completeOnboarding(currentUser.getCurrentUserId(), request);
        return ApiResponse.ok(new UserSummaryResponse(user));
    }
}
