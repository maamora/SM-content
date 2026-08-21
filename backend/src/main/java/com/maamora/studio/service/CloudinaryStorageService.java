package com.maamora.studio.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Uploads generated files to Cloudinary instead of local disk, so the
 * returned URL is a real public HTTPS address that works regardless of where
 * the backend happens to be running.
 */
@Slf4j
@Service
public class CloudinaryStorageService implements StorageService {

    @Value("${app.cloudinary.cloud-name}")
    private String cloudName;

    @Value("${app.cloudinary.api-key}")
    private String apiKey;

    @Value("${app.cloudinary.api-secret}")
    private String apiSecret;

    @Value("${app.storage.local-path}")
    private String localPath;

    @Value("${app.storage.public-base-url}")
    private String publicBaseUrl;

    private Cloudinary cloudinary;

    // Matches ".../upload/[v<version>/]<public_id>.<ext>" so we can recover
    // the public_id from a secure_url when deleting an asset.
    private static final Pattern PUBLIC_ID_PATTERN =
            Pattern.compile("/upload/(?:v\\d+/)?(.+)\\.[a-zA-Z0-9]+$");

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
        if (!isCloudinaryConfigured()) {
            return storeLocally(content, relativePath);
        }
        try {
            // The public_id is derived from the content's hash, not a random
            // UUID: uploading the exact same bytes twice (e.g. the user picks
            // the same photo again after removing it) resolves to the same
            // Cloudinary asset instead of creating a new copy every time.
            String folder = folderOf(relativePath);
            String publicId = folder + sha256Hex(content);

            @SuppressWarnings("unchecked")
            Map<String, Object> result = client().uploader().upload(content, ObjectUtils.asMap(
                    "public_id", publicId,
                    "resource_type", resourceTypeOf(contentType, relativePath),
                    "overwrite", true
            ));

            return (String) result.get("secure_url");
        } catch (Exception e) {
            log.warn("Cloudinary upload unavailable for {}; storing generated output locally instead: {}", relativePath, e.getMessage());
            return storeLocally(content, relativePath);
        }
    }

    @Override
    public void delete(String url) {
        if (url == null || url.isBlank()) return;
        Matcher matcher = PUBLIC_ID_PATTERN.matcher(url);
        if (!matcher.find()) return; // not a Cloudinary URL we recognize — nothing to clean up

        String publicId = matcher.group(1);
        try {
            client().uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceTypeOfUrl(url)));
        } catch (Exception e) {
            // Best-effort cleanup: a failed delete shouldn't block the user's
            // actual request (saving/removing the image client-side already
            // succeeded from their point of view).
        }
    }

    private String folderOf(String relativePath) {
        int slash = relativePath.lastIndexOf('/');
        return slash == -1 ? "" : relativePath.substring(0, slash + 1);
    }

    private String sha256Hex(byte[] content) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(content);
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String resourceTypeOf(String contentType, String relativePath) {
        if (contentType != null && contentType.toLowerCase().startsWith("video/")) {
            return "video";
        }
        return relativePath != null && relativePath.toLowerCase().matches(".*\\.(mp4|webm|mov|m4v)$")
                ? "video"
                : "image";
    }

    private String resourceTypeOfUrl(String url) {
        return url.contains("/video/upload/") ? "video" : "image";
    }

    private boolean isCloudinaryConfigured() {
        return configuredValue(cloudName) && configuredValue(apiKey) && configuredValue(apiSecret);
    }

    private boolean configuredValue(String value) {
        return value != null && !value.isBlank() && !"placeholder".equalsIgnoreCase(value.trim());
    }

    private String storeLocally(byte[] content, String relativePath) {
        try {
            Path target = Path.of(localPath, relativePath);
            Files.createDirectories(target.getParent());
            Files.write(target, content);
            return publicBaseUrl + "/" + relativePath;
        } catch (IOException exception) {
            throw new RuntimeException("Failed to store generated output locally: " + relativePath, exception);
        }
    }
}
