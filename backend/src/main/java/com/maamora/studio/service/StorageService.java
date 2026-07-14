package com.maamora.studio.service;

public interface StorageService {
    /** Uploads the given bytes under the given relative path and returns a publicly reachable URL. */
    String upload(byte[] content, String relativePath, String contentType);
}
