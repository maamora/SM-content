package com.maamora.studio.service;

import com.maamora.studio.dto.request.BatchCreateRequest;
import com.maamora.studio.dto.request.GenerateCaptionsRequest;
import com.maamora.studio.dto.request.GenerateImageRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.BatchJob;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Post;
import com.maamora.studio.model.enums.BatchStatus;
import com.maamora.studio.repository.BatchJobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

/**
 * Runs the image + caption pipeline for several products at once (brief's
 * "batch mode").
 *
 * Concurrency is deliberately capped at MAX_CONCURRENT instead of firing every
 * product in parallel: uncapped concurrency would (a) hammer the Claude API
 * rate limit — 3 calls per product, fr/ar/darija — and (b) spin up too many
 * headless Chromium pages at once. Each Post is persisted as soon as it's
 * done, so the frontend can poll batch progress and one failing product
 * doesn't force restarting the whole batch (see processOneProduct's catch).
 */
@Service
@RequiredArgsConstructor
public class BatchJobService {

    private static final int MAX_CONCURRENT = 3;

    private final BatchJobRepository batchJobRepository;
    private final BrandSettingsService brandSettingsService;
    private final PostService postService;
    private final Executor executor = Executors.newFixedThreadPool(MAX_CONCURRENT);

    public BatchJob create(String userId, BatchCreateRequest request) {
        BrandSettings brand = brandSettingsService.getForUser(userId);

        BatchJob job = BatchJob.builder()
                .brand(brand)
                .status(BatchStatus.PROCESSING)
                .build();
        job = batchJobRepository.save(job);

        runAsync(userId, job, request);
        return job;
    }

    private void runAsync(String userId, BatchJob job, BatchCreateRequest request) {
        Semaphore semaphore = new Semaphore(MAX_CONCURRENT);

        List<CompletableFuture<Void>> futures = request.getProductIds().stream()
                .map(productId -> CompletableFuture.runAsync(() -> {
                    try {
                        semaphore.acquire();
                        processOneProduct(userId, job, productId, request.getTemplateId());
                    } catch (Exception e) {
                        // Logged and skipped: one failing product must not sink the whole batch.
                        System.err.println("Batch item failed for product " + productId + ": " + e.getMessage());
                    } finally {
                        semaphore.release();
                    }
                }, executor))
                .toList();

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
                .thenRun(() -> {
                    job.setStatus(BatchStatus.DONE);
                    batchJobRepository.save(job);
                });
    }

    private void processOneProduct(String userId, BatchJob job, String productId, String templateId) {
        GenerateImageRequest imageRequest = new GenerateImageRequest();
        imageRequest.setProductId(productId);
        imageRequest.setTemplateId(templateId);
        Post post = postService.generateImage(userId, imageRequest, job);

        GenerateCaptionsRequest captionRequest = new GenerateCaptionsRequest();
        captionRequest.setPostId(post.getId());
        postService.generateCaptions(userId, captionRequest);
    }

    public BatchJob getOwned(String userId, String batchJobId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return batchJobRepository.findByIdAndBrandId(batchJobId, brand.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Batch job not found."));
    }
}
