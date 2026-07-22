package com.maamora.studio.controller;

import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.UploadResponse;
import com.maamora.studio.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final StorageService storageService;

    @PostMapping("/image")
    public ApiResponse<UploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ApiResponse.error("No file provided.");
        }

        try {
            String extension = extensionOf(file.getOriginalFilename());
            String path = "products/" + UUID.randomUUID() + extension;
            String url = storageService.upload(file.getBytes(), path, file.getContentType());
            return ApiResponse.ok(new UploadResponse(url));
        } catch (IOException e) {
            return ApiResponse.error("Failed to read uploaded file.");
        }
    }

    private String extensionOf(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot == -1 ? ".jpg" : filename.substring(dot);
    }
}
