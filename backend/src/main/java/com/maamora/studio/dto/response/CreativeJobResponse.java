package com.maamora.studio.dto.response;

import com.maamora.studio.model.CreativeJob;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class CreativeJobResponse {
    private String id;
    private String type;
    private String status;
    private String prompt;
    private String aspectRatio;
    private String productImageUrl;
    private String modelImageUrl;
    private String resultImageUrl;
    private String resultVideoUrl;
    private String errorMessage;
    private String outputMode;
    private String recoveryMessage;
    private Instant createdAt;
    private Instant updatedAt;

    public static CreativeJobResponse from(CreativeJob job) {
        return new CreativeJobResponse(
                job.getId(),
                job.getType().name(),
                job.getStatus().name(),
                job.getPrompt(),
                job.getAspectRatio(),
                job.getProductImageUrl(),
                job.getModelImageUrl(),
                job.getResultImageUrl(),
                job.getResultVideoUrl(),
                job.getErrorMessage(),
                job.getOutputMode() == null ? null : job.getOutputMode().name(),
                job.getRecoveryMessage(),
                job.getCreatedAt(),
                job.getUpdatedAt());
    }
}
