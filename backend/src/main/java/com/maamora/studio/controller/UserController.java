package com.maamora.studio.controller;

import com.maamora.studio.dto.request.ChangePasswordRequest;
import com.maamora.studio.dto.request.UpdateProfileRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.UserSummaryResponse;
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
}
