package com.maamora.studio.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

@RestController
public class FileServeController {

    @Value("${app.storage.local-path}")
    private String localPath;

    @GetMapping("/files/**")
    public ResponseEntity<Resource> serve(HttpServletRequest request) {
        String requestedPath = request.getRequestURI().replaceFirst("^/files/", "");
        Path root = Path.of(localPath).toAbsolutePath().normalize();
        Path file = root.resolve(requestedPath).normalize();
        if (!file.startsWith(root) || !Files.isRegularFile(file)) {
            return ResponseEntity.notFound().build();
        }
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok().contentType(mediaTypeFor(file)).body(resource);
    }

    private MediaType mediaTypeFor(Path file) {
        try {
            String detected = Files.probeContentType(file);
            if (detected != null) return MediaType.parseMediaType(detected);
        } catch (IOException | IllegalArgumentException ignored) {
            // Fall through to extension mapping for local development environments without MIME probing.
        }
        String name = file.getFileName().toString().toLowerCase(Locale.ROOT);
        if (name.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (name.endsWith(".gif")) return MediaType.IMAGE_GIF;
        if (name.endsWith(".svg")) return MediaType.valueOf("image/svg+xml");
        if (name.endsWith(".webp")) return MediaType.valueOf("image/webp");
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
