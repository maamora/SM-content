package com.maamora.studio.controller;

import com.maamora.studio.dto.request.BatchCreateRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.BatchJobResponse;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.BatchJobService;
import com.maamora.studio.service.ExportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/batches")
@RequiredArgsConstructor
public class BatchJobController {

    private final BatchJobService batchJobService;
    private final ExportService exportService;
    private final CurrentUserProvider currentUser;

    @PostMapping
    public ApiResponse<BatchJobResponse> create(@Valid @RequestBody BatchCreateRequest request) {
        var job = batchJobService.create(currentUser.getCurrentUserId(), request);
        return ApiResponse.ok(new BatchJobResponse(job));
    }

    @GetMapping("/{id}")
    public ApiResponse<BatchJobResponse> get(@PathVariable String id) {
        var job = batchJobService.getOwned(currentUser.getCurrentUserId(), id);
        return ApiResponse.ok(new BatchJobResponse(job));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> export(@PathVariable String id) {
        var job = batchJobService.getOwned(currentUser.getCurrentUserId(), id);
        byte[] zip = exportService.buildZip(job.getPosts());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"batch-" + id + ".zip\"")
                .body(zip);
    }
}
