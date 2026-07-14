package com.maamora.studio.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Default storage implementation: writes files to a local folder and serves them
 * back via FileServeController (/files/**). Good enough for local dev / the demo.
 * Swap this for an S3/Cloudinary implementation later without touching any caller,
 * since everything depends on the StorageService interface, not this class.
 */
@Service
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
}
