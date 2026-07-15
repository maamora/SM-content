package com.maamora.studio.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

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
