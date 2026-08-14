package com.maamora.studio.controller;

import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.UploadResponse;
import com.maamora.studio.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
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
        return upload(file, "products");
    }

    @PostMapping("/creative-reference")
    public ApiResponse<UploadResponse> uploadCreativeReference(@RequestParam("file") MultipartFile file) {
        return upload(file, "creative/references");
    }

    @DeleteMapping("/image")
    public ApiResponse<Void> deleteImage(@RequestParam("url") String url) {
        storageService.delete(url);
        return ApiResponse.ok(null);
    }

    private String extensionOf(String filename) {
        if (filename == null) return ".jpg";
        int dot = filename.lastIndexOf('.');
        return dot == -1 ? ".jpg" : filename.substring(dot);
    }

    private ApiResponse<UploadResponse> upload(MultipartFile file, String folder) {
        if (file.isEmpty()) {
            return ApiResponse.error("No file provided.");
        }
        if (file.getSize() > 15L * 1024L * 1024L) {
            return ApiResponse.error("Image exceeds the 15 MB upload limit.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            return ApiResponse.error("Only image files are supported.");
        }

        try {
            String extension = extensionOf(file.getOriginalFilename());
            String path = folder + "/" + UUID.randomUUID() + extension;
            String url = storageService.upload(file.getBytes(), path, contentType);
            return ApiResponse.ok(new UploadResponse(url));
        } catch (IOException e) {
            return ApiResponse.error("Failed to read uploaded file.");
        } catch (Exception e) {
            return ApiResponse.error("Image upload failed.");
        }
    }
}
