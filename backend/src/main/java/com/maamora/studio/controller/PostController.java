package com.maamora.studio.controller;

import com.maamora.studio.dto.request.EditCaptionRequest;
import com.maamora.studio.dto.request.GenerateCaptionsRequest;
import com.maamora.studio.dto.request.GenerateImageRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.PostResponse;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.ExportService;
import com.maamora.studio.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final ExportService exportService;
    private final CurrentUserProvider currentUser;

    @PostMapping("/generate-image")
    public ApiResponse<PostResponse> generateImage(@Valid @RequestBody GenerateImageRequest request) {
        var post = postService.generateImage(currentUser.getCurrentUserId(), request);
        return ApiResponse.ok(new PostResponse(post));
    }

    @PostMapping("/generate-captions")
    public ApiResponse<PostResponse> generateCaptions(@Valid @RequestBody GenerateCaptionsRequest request) {
        var post = postService.generateCaptions(currentUser.getCurrentUserId(), request);
        return ApiResponse.ok(new PostResponse(post));
    }

    @PatchMapping("/{id}/caption")
    public ApiResponse<PostResponse> editCaption(@PathVariable String id, @Valid @RequestBody EditCaptionRequest request) {
        var post = postService.editCaption(currentUser.getCurrentUserId(), id, request.getLanguage(), request.getText());
        return ApiResponse.ok(new PostResponse(post));
    }

    @PostMapping("/{id}/approve")
    public ApiResponse<PostResponse> approve(@PathVariable String id) {
        var post = postService.approve(currentUser.getCurrentUserId(), id);
        return ApiResponse.ok(new PostResponse(post));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportOne(@PathVariable String id) {
        var post = postService.getOwned(currentUser.getCurrentUserId(), id);
        byte[] zip = exportService.buildZip(List.of(post));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"post-" + id + ".zip\"")
                .body(zip);
    }
}
