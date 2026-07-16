package com.maamora.studio.controller;

import com.maamora.studio.dto.request.TemplateRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.TemplateResponse;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.TemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final TemplateService templateService;
    private final CurrentUserProvider currentUser;

    @GetMapping
    public ApiResponse<List<TemplateResponse>> list() {
        var templates = templateService.listForUser(currentUser.getCurrentUserId())
                .stream().map(TemplateResponse::new).toList();
        return ApiResponse.ok(templates);
    }

    @PostMapping
    public ApiResponse<TemplateResponse> create(@Valid @RequestBody TemplateRequest request) {
        var template = templateService.create(currentUser.getCurrentUserId(), request);
        return ApiResponse.ok(new TemplateResponse(template));
    }
}
