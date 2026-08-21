package com.maamora.studio.controller;

import com.maamora.studio.dto.request.CreateCreativeJobRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.CreativeJobResponse;
import com.maamora.studio.service.CreativeJobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/creative/jobs")
@RequiredArgsConstructor
public class CreativeJobController {

    private final CreativeJobService creativeJobService;

    @PostMapping
    public ApiResponse<CreativeJobResponse> create(@Valid @RequestBody CreateCreativeJobRequest request) {
        return ApiResponse.ok(creativeJobService.create(request));
    }

    @GetMapping
    public ApiResponse<List<CreativeJobResponse>> list() {
        return ApiResponse.ok(creativeJobService.list());
    }

    @GetMapping("/{id}")
    public ApiResponse<CreativeJobResponse> get(@PathVariable String id) {
        return ApiResponse.ok(creativeJobService.get(id));
    }
}
