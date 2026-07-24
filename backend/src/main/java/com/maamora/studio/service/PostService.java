package com.maamora.studio.service;

import com.maamora.studio.dto.request.GenerateCaptionsRequest;
import com.maamora.studio.dto.request.GenerateImageRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.*;
import com.maamora.studio.model.enums.PostStatus;
import com.maamora.studio.model.enums.ProductStatus;
import com.maamora.studio.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final ProductService productService;
    private final TemplateService templateService;
    private final BrandSettingsService brandSettingsService;
    private final ImageRenderService imageRenderService;
    private final CaptionGenerationService captionGenerationService;
    private final StorageService storageService;

    /** Every post in the shared workspace — powers the dashboard's real stats. */
    public List<Post> listForUser(String userId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return postRepository.findByProduct_Brand_IdOrderByCreatedAtDesc(brand.getId());
    }

    /** Step 4 of the pipeline: renders the image and creates the Post. */
    public Post generateImage(String userId, GenerateImageRequest request) {
        return generateImage(userId, request, null);
    }

    /** Same as above, but attaches the Post to a BatchJob (used by BatchJobService). */
    public Post generateImage(String userId, GenerateImageRequest request, BatchJob batchJob) {
        Product product = productService.getOwned(userId, request.getProductId());
        if (product.getStatus() != ProductStatus.APPROVED) {
            throw new UnauthorizedException("Product is pending admin approval and cannot be used yet.");
        }
        Template template = templateService.getById(request.getTemplateId());

        byte[] png = imageRenderService.renderToPng(
                template, product, request.getBadgeText(), request.getPromoText(), request.getAccentColor());

        String path = "posts/" + UUID.randomUUID() + ".png";
        String imageUrl = storageService.upload(png, path, "image/png");

        Post post = Post.builder()
                .product(product)
                .template(template)
                .batchJob(batchJob)
                .format(template.getFormat())
                .imageUrl(imageUrl)
                .badgeText(request.getBadgeText())
                .promoText(request.getPromoText())
                .status(PostStatus.DRAFT)
                .build();

        return postRepository.save(post);
    }

    /** Step 5: fills in the requested caption languages on an existing Post. */
    public Post generateCaptions(String userId, GenerateCaptionsRequest request) {
        Post post = getOwned(userId, request.getPostId());
        BrandSettings brand = brandSettingsService.getForUser(userId);

        for (String lang : request.getLanguages()) {
            String caption = captionGenerationService.generateCaption(post.getProduct(), brand, lang);
            switch (lang) {
                case "en" -> post.setCaptionEn(caption);
                case "ar" -> post.setCaptionAr(caption);
                case "darija" -> post.setCaptionDarija(caption);
                default -> post.setCaptionFr(caption);
            }
        }

        return postRepository.save(post);
    }

    public Post editCaption(String userId, String postId, String language, String text) {
        Post post = getOwned(userId, postId);
        switch (language) {
            case "en" -> post.setCaptionEn(text);
            case "ar" -> post.setCaptionAr(text);
            case "darija" -> post.setCaptionDarija(text);
            case "fr" -> post.setCaptionFr(text);
            default -> throw new IllegalArgumentException("Unknown language: " + language);
        }
        return postRepository.save(post);
    }

    public Post approve(String userId, String postId) {
        Post post = getOwned(userId, postId);
        post.setStatus(PostStatus.APPROVED);
        return postRepository.save(post);
    }

    /** Marks a post EXPORTED once its ZIP has actually been downloaded. */
    public Post markExported(String userId, String postId) {
        Post post = getOwned(userId, postId);
        post.setStatus(PostStatus.EXPORTED);
        return postRepository.save(post);
    }

    /** Loads a Post and verifies it belongs to the authenticated user's brand (IDOR guard). */
    public Post getOwned(String userId, String postId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return postRepository.findByIdAndProduct_Brand_Id(postId, brand.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Post not found."));
    }
}
