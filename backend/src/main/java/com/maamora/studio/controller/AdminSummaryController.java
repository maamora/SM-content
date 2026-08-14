package com.maamora.studio.controller;

import com.maamora.studio.dto.response.AdminSummaryResponse;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.model.enums.ProductStatus;
import com.maamora.studio.repository.BrandSettingsRepository;
import com.maamora.studio.repository.PostRepository;
import com.maamora.studio.repository.ProductRepository;
import com.maamora.studio.repository.TemplateRepository;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminSummaryController {

    private final UserRepository userRepository;
    private final BrandSettingsRepository brandSettingsRepository;
    private final ProductRepository productRepository;
    private final PostRepository postRepository;
    private final TemplateRepository templateRepository;

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminSummaryResponse> summary() {
        return ApiResponse.ok(new AdminSummaryResponse(
                userRepository.count(),
                brandSettingsRepository.count(),
                productRepository.count(),
                postRepository.count(),
                templateRepository.count(),
                productRepository.countByStatus(ProductStatus.PENDING)
        ));
    }
}
