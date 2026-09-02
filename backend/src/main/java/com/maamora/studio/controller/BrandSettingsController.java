package com.maamora.studio.controller;

import com.maamora.studio.dto.request.BrandSettingsRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.BrandSettingsResponse;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.BrandSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    /**
     * Stores and persists the optional logo in one authenticated operation.
     * The client receives the saved Brand state, so Studio can use the mark
     * immediately without a second request racing the file upload.
     */
    @PostMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<BrandSettingsResponse> uploadLogo(@RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(new BrandSettingsResponse(
                brandSettingsService.uploadLogo(currentUser.getCurrentUserId(), file)));
    }
}
