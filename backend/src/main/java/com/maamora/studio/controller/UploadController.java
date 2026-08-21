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
<<<<<<< HEAD
        return uploadTo(file, "products/");
    }

    @DeleteMapping("/image")
    public ApiResponse<Void> deleteImage(@RequestParam("url") String url) {
        storageService.delete(url);
        return ApiResponse.ok(null);
    }

    /**
     * Public (permitAll — see SecurityConfig) logo upload used on the
     * registration form: a brand new user has no JWT yet, so this can't sit
     * behind the same auth as {@link #uploadImage}. Scoped to its own
     * "logos/" folder and its own endpoint rather than opening up
     * /api/uploads/image entirely, to keep the unauthenticated surface as
     * small as possible.
     */
    @PostMapping("/logo")
    public ApiResponse<UploadResponse> uploadLogo(@RequestParam("file") MultipartFile file) {
        return uploadTo(file, "logos/");
    }

    private ApiResponse<UploadResponse> uploadTo(MultipartFile file, String folder) {
        if (file.isEmpty()) {
            return ApiResponse.error("No file provided.");
        }

        try {
            String extension = extensionOf(file.getOriginalFilename());
            String path = folder + UUID.randomUUID() + extension;
            String url = storageService.upload(file.getBytes(), path, file.getContentType());
            return ApiResponse.ok(new UploadResponse(url));
        } catch (IOException e) {
            return ApiResponse.error("Failed to read uploaded file.");
        } catch (Exception e) {
            // Catches Cloudinary/storage failures (bad credentials, network
            // issues, etc.) so the client always gets a JSON error instead of
            // an unhandled exception that GlobalExceptionHandler would still
            // wrap, but with a less specific message than we can give here.
            return ApiResponse.error("Image upload failed: " + e.getMessage());
        }
=======
        return upload(file, "products");
    }

    @PostMapping("/creative-reference")
    public ApiResponse<UploadResponse> uploadCreativeReference(@RequestParam("file") MultipartFile file) {
        return upload(file, "creative/references");
    }

    @PostMapping("/creative-output")
    public ApiResponse<UploadResponse> uploadCreativeOutput(@RequestParam("file") MultipartFile file) {
        return upload(file, "creative/outputs");
>>>>>>> 0aaa1cfa406c946d0887dbeaa5c9c2676e5da0aa
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
