package com.maamora.studio.controller;

import com.maamora.studio.dto.request.SocialAccountRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.SocialAccountResponse;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.SocialAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/brand/social")
@RequiredArgsConstructor
public class SocialAccountController {

    private final SocialAccountService socialAccountService;
    private final CurrentUserProvider currentUser;

    @GetMapping
    public ApiResponse<List<SocialAccountResponse>> list() {
        List<SocialAccountResponse> result = socialAccountService.listForUser(currentUser.getCurrentUserId())
                .stream().map(SocialAccountResponse::new).toList();
        return ApiResponse.ok(result);
    }

    @PostMapping
    public ApiResponse<SocialAccountResponse> connect(@Valid @RequestBody SocialAccountRequest request) {
        return ApiResponse.ok(new SocialAccountResponse(socialAccountService.connect(currentUser.getCurrentUserId(), request)));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> disconnect(@PathVariable String id) {
        socialAccountService.disconnect(currentUser.getCurrentUserId(), id);
        return ApiResponse.ok(null);
    }
}
