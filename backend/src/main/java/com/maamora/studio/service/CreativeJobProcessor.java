package com.maamora.studio.service;

import com.maamora.studio.model.CreativeJob;
import com.maamora.studio.model.enums.CreativeJobStatus;
import com.maamora.studio.model.enums.CreativeJobType;
import com.maamora.studio.repository.CreativeJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreativeJobProcessor {

    private final CreativeJobRepository creativeJobRepository;
    private final ImageGenerationProvider imageGenerationProvider;
    private final VideoGenerationService videoGenerationService;
    private final StorageService storageService;
    private final ReferenceCompositeService referenceCompositeService;

    @Value("${app.image.fal-reference-mode:product-only}")
    private String falReferenceMode;

    @Async("creativeTaskExecutor")
    public void processAsync(String jobId) {
        CreativeJob job = creativeJobRepository.findById(jobId).orElse(null);
        if (job == null) return;

        job.setStatus(CreativeJobStatus.PROCESSING);
        creativeJobRepository.save(job);

        try {
            List<String> references = new ArrayList<>();
            if (job.getProductImageUrl() != null) references.add(job.getProductImageUrl());
            if (job.getModelImageUrl() != null) references.add(job.getModelImageUrl());

            String prompt = buildPrompt(job);
            if ("fal".equals(imageGenerationProvider.activeProvider())
                    || "fal.ai".equals(imageGenerationProvider.activeProvider())) {
                if (references.size() > 1) {
                    if ("product-only".equalsIgnoreCase(falReferenceMode)
                            || "single-reference".equalsIgnoreCase(falReferenceMode)) {
                        references = List.of(job.getProductImageUrl());
                        prompt += " Use the supplied product reference as the only image input. "
                                + "The uploaded model reference is intentionally not used because this provider accepts one reference image. "
                                + "Create a natural, commercially appropriate human fashion model with realistic anatomy and styling that complements the product; "
                                + "do not claim to reproduce the uploaded model's identity.";
                    } else {
                        byte[] referenceBoard = referenceCompositeService.compose(
                                job.getModelImageUrl(), job.getProductImageUrl());
                        String referenceBoardUrl = storageService.upload(
                                referenceBoard, "creative/" + job.getId() + "-reference-board.png", "image/png");
                        references = List.of(referenceBoardUrl);
                        prompt += " The supplied reference board contains two labeled panels: use the model panel for identity and anatomy, and the product panel for exact product shape, color, material, and branding.";
                    }
                }
            }

            byte[] image = imageGenerationProvider.generateImage(prompt, job.getAspectRatio(), references);
            String imageUrl = storageService.upload(image, "creative/" + job.getId() + ".png", "image/png");
            job.setResultImageUrl(imageUrl);

            if (job.getType() == CreativeJobType.PHOTO_SHOOT_VIDEO) {
                if (!videoGenerationService.isConfigured()) {
                    throw new IllegalStateException(
                            "Video generation is unavailable. Configure Gemini/Veo with billing and model access.");
                }
                byte[] video = videoGenerationService.generateVideo(imageUrl, prompt, job.getAspectRatio());
                String videoUrl = storageService.upload(video, "creative/" + job.getId() + ".mp4", "video/mp4");
                job.setResultVideoUrl(videoUrl);
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

    private String buildPrompt(CreativeJob job) {
        if (job.getType() == CreativeJobType.EDIT_IMAGE) {
            return "Edit the provided reference image according to this instruction: " + job.getPrompt()
                    + ". Preserve the original subject identity, product shape, labels, materials, proportions,"
                    + " camera perspective, and non-target elements unless the instruction explicitly changes them."
                    + " Produce a polished photorealistic commercial image.";
        }
        return "Create a premium commercial fashion photo shoot using the provided product and model reference images. "
                + "Keep the product recognisable, preserve its shape, color, materials, and visible branding, and keep"
                + " the model identity and natural anatomy consistent. Use realistic studio or location lighting,"
                + " editorial composition, believable contact shadows, and a polished campaign finish. User scenario: "
                + job.getPrompt();
    }

    private String safeMessage(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) return "Creative generation failed.";
        return message.length() > 1100 ? message.substring(0, 1100) : message;
    }
}
