package com.maamora.studio.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;

@RestController
public class FileServeController {

    @Value("${app.storage.local-path}")
    private String localPath;

    @GetMapping("/files/**")
    public ResponseEntity<Resource> serve(HttpServletRequest request) {
        String path = request.getRequestURI().replaceFirst("^/files/", "");
        Resource resource = new FileSystemResource(Path.of(localPath, path));
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM).body(resource);
    }
}
