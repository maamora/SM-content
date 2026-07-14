package com.maamora.studio.dto.response;

import com.maamora.studio.model.Post;
import lombok.Getter;

@Getter
public class PostResponse {
    private final String id;
    private final String productId;
    private final String templateId;
    private final String format;
    private final String imageUrl;
    private final String captionFr;
    private final String captionAr;
    private final String captionDarija;
    private final String status;

    public PostResponse(Post post) {
        this.id = post.getId();
        this.productId = post.getProduct().getId();
        this.templateId = post.getTemplate().getId();
        this.format = post.getFormat().name();
        this.imageUrl = post.getImageUrl();
        this.captionFr = post.getCaptionFr();
        this.captionAr = post.getCaptionAr();
        this.captionDarija = post.getCaptionDarija();
        this.status = post.getStatus().name();
    }
}
