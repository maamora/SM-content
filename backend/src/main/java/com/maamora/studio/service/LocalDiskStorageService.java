package com.maamora.studio.service;

import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Stores files on the server's local disk. Kept as a fallback/reference
 * implementation — not registered as a bean since CloudinaryStorageService is
 * now the active StorageService. Re-add @Service (and remove it from
 * CloudinaryStorageService) to switch back to local disk storage.
 */
public class LocalDiskStorageService implements StorageService {

    @Value("${app.storage.local-path}")
    private String localPath;

    @Value("${app.storage.public-base-url}")
    private String publicBaseUrl;

    @Override
    public String upload(byte[] content, String relativePath, String contentType) {
        try {
            Path target = Path.of(localPath, relativePath);
            Files.createDirectories(target.getParent());
            Files.write(target, content);
            return publicBaseUrl + "/" + relativePath;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + relativePath, e);
        }
    }

    @Override
    public void delete(String url) {
        if (url == null || !url.startsWith(publicBaseUrl)) return;
        try {
            String relativePath = url.substring(publicBaseUrl.length()).replaceFirst("^/", "");
            Files.deleteIfExists(Path.of(localPath, relativePath));
        } catch (IOException ignored) {
            // Best-effort cleanup — not worth failing the caller's request over.
        }
    }
}
