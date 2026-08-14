package com.maamora.studio.controller;

import com.maamora.studio.dto.request.BrandSettingsRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.BrandSettingsResponse;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.BrandSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/brand")
@RequiredArgsConstructor
public class BrandSettingsController {

    private final BrandSettingsService brandSettingsService;
    private final CurrentUserProvider currentUser;

    @GetMapping
    public ApiResponse<BrandSettingsResponse> get() {
        return ApiResponse.ok(new BrandSettingsResponse(brandSettingsService.getForUser(currentUser.getCurrentUserId())));
    }

    @PutMapping
    public ApiResponse<BrandSettingsResponse> update(@RequestBody BrandSettingsRequest request) {
        return ApiResponse.ok(new BrandSettingsResponse(brandSettingsService.update(currentUser.getCurrentUserId(), request)));
    }
}
