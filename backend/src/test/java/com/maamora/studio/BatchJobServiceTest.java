package com.maamora.studio;

import com.maamora.studio.dto.request.BatchCreateRequest;
import com.maamora.studio.dto.request.GenerateCaptionsRequest;
import com.maamora.studio.dto.request.GenerateImageRequest;
import com.maamora.studio.model.BatchJob;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Post;
import com.maamora.studio.model.enums.BatchStatus;
import com.maamora.studio.repository.BatchJobRepository;
import com.maamora.studio.service.BatchJobService;
import com.maamora.studio.service.BrandSettingsService;
import com.maamora.studio.service.PostService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.concurrent.Executor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BatchJobServiceTest {

    @org.mockito.Mock
    private BatchJobRepository batchJobRepository;

    @org.mockito.Mock
    private BrandSettingsService brandSettingsService;

    @org.mockito.Mock
    private PostService postService;

    @Test
    void createsVisualsAndCaptionsForEveryProductInTheServerBatch() {
        Executor directExecutor = Runnable::run;
        BatchJobService service = new BatchJobService(
                batchJobRepository, brandSettingsService, postService, directExecutor);
        BrandSettings brand = BrandSettings.builder().id("brand-1").name("STUDIO Test").build();
        BatchJob persistedJob = BatchJob.builder().id("batch-1").brand(brand).status(BatchStatus.PROCESSING).build();
        Post firstPost = Post.builder().id("post-1").build();
        Post secondPost = Post.builder().id("post-2").build();

        when(brandSettingsService.getForUser("user-1")).thenReturn(brand);
        when(batchJobRepository.save(any(BatchJob.class))).thenReturn(persistedJob);
        when(postService.generateImage(eq("user-1"), any(GenerateImageRequest.class), eq(persistedJob)))
                .thenReturn(firstPost, secondPost);

        BatchCreateRequest request = new BatchCreateRequest();
        request.setProductIds(List.of("product-1", "product-2"));
        request.setTemplateId("template-square");

        BatchJob result = service.create("user-1", request);

        ArgumentCaptor<GenerateImageRequest> imageRequests = ArgumentCaptor.forClass(GenerateImageRequest.class);
        ArgumentCaptor<GenerateCaptionsRequest> captionRequests = ArgumentCaptor.forClass(GenerateCaptionsRequest.class);
        verify(postService, times(2)).generateImage(eq("user-1"), imageRequests.capture(), eq(persistedJob));
        verify(postService, times(2)).generateCaptions(eq("user-1"), captionRequests.capture());

        assertThat(result).isSameAs(persistedJob);
        assertThat(persistedJob.getStatus()).isEqualTo(BatchStatus.DONE);
        assertThat(imageRequests.getAllValues())
                .extracting(GenerateImageRequest::getProductId)
                .containsExactlyInAnyOrder("product-1", "product-2");
        assertThat(imageRequests.getAllValues())
                .extracting(GenerateImageRequest::getTemplateId)
                .containsOnly("template-square");
        assertThat(captionRequests.getAllValues())
                .extracting(GenerateCaptionsRequest::getPostId)
                .containsExactlyInAnyOrder("post-1", "post-2");
    }
}
