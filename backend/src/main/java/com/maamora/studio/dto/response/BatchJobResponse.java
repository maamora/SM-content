package com.maamora.studio.dto.response;

import com.maamora.studio.model.BatchJob;
import lombok.Getter;

import java.util.List;

@Getter
public class BatchJobResponse {
    private final String id;
    private final String status;
    private final List<PostResponse> posts;

    public BatchJobResponse(BatchJob job) {
        this.id = job.getId();
        this.status = job.getStatus().name();
        this.posts = job.getPosts().stream().map(PostResponse::new).toList();
    }
}
