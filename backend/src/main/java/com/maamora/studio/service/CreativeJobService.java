package com.maamora.studio.service;

import com.maamora.studio.dto.request.CreateCreativeJobRequest;
import com.maamora.studio.dto.response.CreativeJobResponse;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.CreativeJob;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.CreativeJobType;
import com.maamora.studio.repository.CreativeJobRepository;
import com.maamora.studio.repository.UserRepository;
import com.maamora.studio.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CreativeJobService {

    private final CreativeJobRepository creativeJobRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;
    private final CreativeJobProcessor creativeJobProcessor;

    @Transactional
    public CreativeJobResponse create(CreateCreativeJobRequest request) {
        String userId = requireUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user was not found."));

        CreativeJobType type = parseType(request.getType());
        String productImageUrl = trimToNull(request.getProductImageUrl());
        String modelImageUrl = trimToNull(request.getModelImageUrl());
        if (type == CreativeJobType.EDIT_IMAGE && productImageUrl == null && modelImageUrl == null) {
            throw new IllegalArgumentException("An image reference is required for image editing.");
        }
        if (type == CreativeJobType.PHOTO_SHOOT && (productImageUrl == null || modelImageUrl == null)) {
            throw new IllegalArgumentException("A product image and a model image are required for a photo shoot.");
        }

        CreativeJob job = CreativeJob.builder()
                .user(user)
                .type(request.isGenerateVideo() && type == CreativeJobType.PHOTO_SHOOT
                        ? CreativeJobType.PHOTO_SHOOT_VIDEO
                        : type)
                .prompt(request.getPrompt().trim())
                .aspectRatio(defaultAspectRatio(request.getAspectRatio()))
                .productImageUrl(productImageUrl)
                .modelImageUrl(modelImageUrl)
                .build();
        CreativeJob saved = creativeJobRepository.save(job);
        creativeJobProcessor.processAsync(saved.getId());
        return CreativeJobResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<CreativeJobResponse> list() {
        return creativeJobRepository.findTop20ByUserIdOrderByCreatedAtDesc(requireUserId())
                .stream()
                .map(CreativeJobResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CreativeJobResponse get(String id) {
        return creativeJobRepository.findByIdAndUserId(id, requireUserId())
                .map(CreativeJobResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Creative job was not found."));
    }

    private CreativeJobType parseType(String rawType) {
        try {
            return CreativeJobType.valueOf(rawType.trim().toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Creative job type must be EDIT_IMAGE or PHOTO_SHOOT.");
        }
    }

    private String requireUserId() {
        String userId = currentUserProvider.getCurrentUserId();
        if (userId == null || userId.isBlank()) {
            throw new IllegalStateException("Authentication is required for creative jobs.");
        }
        return userId;
    }

    private String defaultAspectRatio(String aspectRatio) {
        return aspectRatio == null || aspectRatio.isBlank() ? "16:9" : aspectRatio.trim();
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }
}
