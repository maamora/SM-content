package com.maamora.studio;

import com.maamora.studio.dto.request.GenerateImageRequest;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Product;
import com.maamora.studio.model.Template;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.Format;
import com.maamora.studio.model.enums.GenerationMode;
import com.maamora.studio.model.enums.ProductStatus;
import com.maamora.studio.repository.PostRepository;
import com.maamora.studio.service.BrandSettingsService;
import com.maamora.studio.service.CaptionGenerationService;
import com.maamora.studio.service.ImageRenderService;
import com.maamora.studio.service.PostService;
import com.maamora.studio.service.ProductService;
import com.maamora.studio.service.StorageService;
import com.maamora.studio.service.TemplateService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PostServicePrivateDraftTest {

    @Test
    void letsTheCreatorRenderTheirOwnPendingProductAsAPrivateDraft() {
        Fixture fixture = new Fixture("creator-1", ProductStatus.PENDING, "creator-1");

        var post = fixture.service.generateImage("creator-1", fixture.request);

        assertThat(post.getProduct()).isSameAs(fixture.product);
        verify(fixture.renderService).render(eq(fixture.template), eq(fixture.product), any(), any(), any(), any(), eq(fixture.brand), eq(false), any());
    }

    @Test
    void blocksSomeoneElsesPendingProductUntilAnAdministratorApprovesIt() {
        Fixture fixture = new Fixture("teammate-2", ProductStatus.PENDING, "creator-1");

        assertThatThrownBy(() -> fixture.service.generateImage("teammate-2", fixture.request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("Only the creator");
    }

    private static final class Fixture {
        private final BrandSettings brand = BrandSettings.builder().id("brand-1").name("Testing brand").build();
        private final Product product;
        private final Template template = Template.builder().id("template-1").name("Test template").format(Format.SQUARE_POST).build();
        private final ImageRenderService renderService = mock(ImageRenderService.class);
        private final PostService service;
        private final GenerateImageRequest request = new GenerateImageRequest();

        private Fixture(String callerId, ProductStatus status, String ownerId) {
            ProductService productService = mock(ProductService.class);
            TemplateService templateService = mock(TemplateService.class);
            BrandSettingsService brandService = mock(BrandSettingsService.class);
            StorageService storageService = mock(StorageService.class);
            PostRepository postRepository = mock(PostRepository.class);
            CaptionGenerationService captionService = mock(CaptionGenerationService.class);

            User owner = User.builder().id(ownerId).email("creator@example.test").passwordHash("not-used").build();
            product = Product.builder().id("product-1").brand(brand).createdBy(owner).name("TEST · Arc Runner sneaker").description("Private testing product").status(status).build();
            request.setProductId(product.getId());
            request.setTemplateId(template.getId());

            when(brandService.getForUser(callerId)).thenReturn(brand);
            when(productService.getOwned(callerId, product.getId())).thenReturn(product);
            when(templateService.getById(template.getId())).thenReturn(template);
            when(renderService.render(eq(template), eq(product), any(), any(), any(), any(), eq(brand), eq(false), any()))
                    .thenReturn(new ImageRenderService.RenderedVisual(new byte[] {1, 2, 3}, GenerationMode.TEMPLATE_COMPOSED, "test"));
            when(storageService.upload(any(), any(), eq("image/png"))).thenReturn("https://assets.example.test/post.png");
            when(postRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

            service = new PostService(postRepository, productService, templateService, brandService, renderService, captionService, storageService);
        }
    }
}
