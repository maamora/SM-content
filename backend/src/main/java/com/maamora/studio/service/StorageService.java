package com.maamora.studio.service;

public interface StorageService {
    String upload(byte[] content, String relativePath, String contentType);
}
