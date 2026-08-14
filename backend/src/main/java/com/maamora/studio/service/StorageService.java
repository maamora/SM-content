package com.maamora.studio.service;

public interface StorageService {
    String upload(byte[] content, String relativePath, String contentType);

    /**
     * Removes a previously uploaded file, given the public URL that {@link
     * #upload} returned for it. Used when a photo is replaced or removed in
     * the product form so the old asset doesn't linger and eat up storage.
     * Implementations should treat "not found" as a no-op, not an error.
     */
    void delete(String url);
}
