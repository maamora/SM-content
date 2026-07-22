package com.maamora.studio.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Uploads generated files to Cloudinary instead of local disk, so the
 * returned URL is a real public HTTPS address that works regardless of where
 * the backend happens to be running.
 */
@Service
public class CloudinaryStorageService implements StorageService {

    @Value("${app.cloudinary.cloud-name}")
    private String cloudName;

    @Value("${app.cloudinary.api-key}")
    private String apiKey;

    @Value("${app.cloudinary.api-secret}")
    private String apiSecret;

    private Cloudinary cloudinary;

    private Cloudinary client() {
        if (cloudinary == null) {
            cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));
        }
        return cloudinary;
    }

    @Override
    public String upload(byte[] content, String relativePath, String contentType) {
        try {
            String publicId = stripExtension(relativePath);

            @SuppressWarnings("unchecked")
            Map<String, Object> result = client().uploader().upload(content, ObjectUtils.asMap(
                    "public_id", publicId,
                    "resource_type", "image",
                    "overwrite", true
            ));

            return (String) result.get("secure_url");
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file to Cloudinary: " + relativePath, e);
        }
    }

    private String stripExtension(String path) {
        int dot = path.lastIndexOf('.');
        return dot == -1 ? path : path.substring(0, dot);
    }
}
