package com.maamora.studio.service;

import com.maamora.studio.dto.request.GenerateCaptionsRequest;
import com.maamora.studio.dto.request.GenerateImageRequest;
import com.maamora.studio.dto.request.CreateBrowserVisualPostRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.*;
import com.maamora.studio.model.enums.GenerationMode;
import com.maamora.studio.model.enums.PostStatus;
import com.maamora.studio.model.enums.ProductStatus;
import com.maamora.studio.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
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

    /**
     * Same as above, but attaches the Post to a BatchJob (used by BatchJobService).
     */
    public Post generateImage(String userId, GenerateImageRequest request, BatchJob batchJob) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        Product product = productService.getOwned(userId, request.getProductId());
        assertCanCreatePrivateDraft(userId, product);
        Template template = templateService.getById(request.getTemplateId());

        ImageRenderService.RenderedVisual renderedVisual = imageRenderService.render(
                template, product, request.getBadgeText(), request.getPromoText(),
                request.getAccentColor(), request.getMood(), brand, Boolean.TRUE.equals(request.getIncludeBrandLogo()),
                request.getBrandLogoPlacement(), request.getHeadline(), request.getSupportingText(), request.getCtaText(),
                request.getLayoutStyle(), request.getProductFocus(), request.getTextAlignment());

        String path = "posts/" + UUID.randomUUID() + ".png";
        String imageUrl = storageService.upload(renderedVisual.png(), path, "image/png");

        Post post = Post.builder()
                .product(product)
                .template(template)
                .batchJob(batchJob)
                .format(template.getFormat())
                .imageUrl(imageUrl)
                .badgeText(request.getBadgeText())
                .promoText(request.getPromoText())
                .generationMode(renderedVisual.generationMode())
                .status(PostStatus.DRAFT)
                .build();

        return postRepository.save(post);
    }

    /**
     * Turns a browser-generated visual that has already passed through the
     * authenticated upload endpoint into a normal draft post. This keeps the
     * caption editor and every downstream post action connected to the visual.
     */
    public Post createFromBrowserVisual(String userId, CreateBrowserVisualPostRequest request) {
        Product product = productService.getOwned(userId, request.getProductId());
        assertCanCreatePrivateDraft(userId, product);
        Template template = templateService.getById(request.getTemplateId());

        Post post = Post.builder()
                .product(product)
                .template(template)
                .format(template.getFormat())
                .imageUrl(request.getImageUrl())
                .badgeText(request.getBadgeText())
                .promoText(request.getPromoText())
                .generationMode(GenerationMode.BROWSER_GENERATED)
                .status(PostStatus.DRAFT)
                .build();

        return postRepository.save(post);
    }

    /**
     * Shared products still require approval. A pending product may be used only
     * by its own creator to make private draft output for testing or iteration;
     * it remains invisible to teammates until an administrator approves it.
     */
    private void assertCanCreatePrivateDraft(String userId, Product product) {
        if (product.getStatus() == ProductStatus.APPROVED) {
            return;
        }
        boolean creatorOwnsPendingProduct = product.getStatus() == ProductStatus.PENDING
                && product.getCreatedBy() != null
                && userId.equals(product.getCreatedBy().getId());
        if (!creatorOwnsPendingProduct) {
            throw new UnauthorizedException("Only the creator can use a pending product for a private draft. Approve it before sharing it with the workspace.");
        }
    }

    /**
     * Step 5: fills in the requested caption languages on an existing Post.
     *
     * Each language is generated independently: if one call fails (Gemini
     * rate-limit, transient network error, etc.) the rest still run and
     * whatever succeeded is saved, instead of one failure discarding every
     * caption for the post (which is what made batch-generated posts end up
     * with an image but no text at all).
     */
    public Post generateCaptions(String userId, GenerateCaptionsRequest request) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        // Eagerly loads post.product in the same query (JOIN FETCH) instead of
        // as a lazy proxy — CaptionGenerationService reads product fields
        // directly, and on batch's background thread there's no open DB
        // session for a lazy proxy to fall back on. See PostRepository for
        // the full explanation.
        Post post = postRepository.findByIdAndProduct_Brand_IdFetchProduct(request.getPostId(), brand.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Post not found."));

        int generatedCount = 0;
        String lastError = null;
        for (String lang : request.getLanguages()) {
            try {
                String caption = captionGenerationService.generateCaption(post, brand, lang);
                generatedCount++;
                switch (lang) {
                    case "en" -> post.setCaptionEn(caption);
                    case "ar" -> post.setCaptionAr(caption);
                    case "darija" -> post.setCaptionDarija(caption);
                    default -> post.setCaptionFr(caption);
                }
            } catch (Exception e) {
                lastError = e.getMessage();
                log.error("Caption generation failed for post {} lang {}: {}", post.getId(), lang, e.getMessage(), e);
            }
        }

        if (generatedCount == 0) {
            throw new IllegalStateException("Caption generation failed for every requested language. "
                    + (lastError == null || lastError.isBlank() ? "Check the configured caption provider." : lastError));
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

    /** Deletes a post outright. Brand-scoped like every other post action. */
    public void delete(String userId, String postId) {
        Post post = getOwned(userId, postId);
        postRepository.delete(post);
    }

    /**
     * Loads a Post and verifies it belongs to the authenticated user's brand (IDOR
     * guard).
     */
    public Post getOwned(String userId, String postId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return postRepository.findByIdAndProduct_Brand_Id(postId, brand.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Post not found."));
    }
}
