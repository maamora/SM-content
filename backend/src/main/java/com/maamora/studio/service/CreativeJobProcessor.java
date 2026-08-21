package com.maamora.studio.service;

import com.maamora.studio.model.CreativeJob;
import com.maamora.studio.model.enums.CreativeJobStatus;
import com.maamora.studio.model.enums.CreativeJobType;
import com.maamora.studio.model.enums.GenerationMode;
import com.maamora.studio.repository.CreativeJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreativeJobProcessor {

    private final CreativeJobRepository creativeJobRepository;
    private final StorageService storageService;
    private final ReferenceCompositeService referenceCompositeService;

    @Async("creativeTaskExecutor")
    public void processAsync(String jobId) {
        CreativeJob job = creativeJobRepository.findById(jobId).orElse(null);
        if (job == null) return;

        job.setStatus(CreativeJobStatus.PROCESSING);
        creativeJobRepository.save(job);

        try {
            boolean hasProductAndModel = job.getProductImageUrl() != null && !job.getProductImageUrl().isBlank()
                    && job.getModelImageUrl() != null && !job.getModelImageUrl().isBlank();
            byte[] image = job.getType() == CreativeJobType.EDIT_IMAGE
                    ? referenceCompositeService.composeSingle(job.getProductImageUrl(), "BRANDED EDIT TEMPLATE")
                    : hasProductAndModel
                            ? referenceCompositeService.compose(job.getModelImageUrl(), job.getProductImageUrl())
                            : referenceCompositeService.composeSingle(job.getProductImageUrl(), "BRANDED PHOTO SHOOT TEMPLATE");
            job.setOutputMode(GenerationMode.TEMPLATE_COMPOSED);
            job.setRecoveryMessage("Created locally from the selected template and supplied reference images. This is a deterministic composition, not an AI photoshoot or pixel edit.");
            String imageUrl = storageService.upload(image, "creative/" + job.getId() + ".png", "image/png");
            job.setResultImageUrl(imageUrl);

            if (job.getType() == CreativeJobType.PHOTO_SHOOT_VIDEO) {
                job.setRecoveryMessage("A local template composition was created. Video generation is unavailable because the Studio visual workflow does not use AI providers.");
            }

            job.setStatus(CreativeJobStatus.COMPLETED);
            job.setErrorMessage(null);
            creativeJobRepository.save(job);
        } catch (Exception e) {
            log.warn("Creative job {} failed: {}", jobId, e.getMessage());
            job.setStatus(CreativeJobStatus.FAILED);
            job.setErrorMessage(safeMessage(e));
            creativeJobRepository.save(job);
        }
    }

    private String safeMessage(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) return "Creative generation failed.";
        return message.length() > 1100 ? message.substring(0, 1100) : message;
    }
}
