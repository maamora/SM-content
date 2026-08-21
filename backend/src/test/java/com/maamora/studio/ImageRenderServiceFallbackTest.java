package com.maamora.studio;

import com.maamora.studio.model.Product;
import com.maamora.studio.model.Template;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.enums.GenerationMode;
import com.maamora.studio.service.ImageGenerationProvider;
import com.maamora.studio.service.ImageRenderService;
import com.maamora.studio.service.SvgTemplateRenderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImageRenderServiceFallbackTest {

    @Mock
    private ImageGenerationProvider imageGenerationProvider;

    @Test
    void createsTemplateCompositionWithoutCallingAProvider() {
        ImageRenderService service = new ImageRenderService(imageGenerationProvider, new SvgTemplateRenderer());
        Product product = Product.builder()
                .id("product-quota")
                .name("Atlas Botanical Oil")
                .description("Cold-pressed botanical oil")
                .sellingPoint("A considered daily ritual")
                .build();

        ImageRenderService.RenderedVisual result = service.render(
                Template.builder().id("template-quota").build(),
                product,
                "NEW",
                "A considered daily ritual",
                "#E6B87A",
                "mint");

        assertThat(result.generationMode()).isEqualTo(GenerationMode.TEMPLATE_COMPOSED);
        assertThat(result.recoveryMessage()).contains("No AI provider");
        assertThat(result.png()).startsWith((byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47);
    }

    @Test
    void doesNotPassASeededButUnconfiguredBrandToTheSvgMark() {
        SvgTemplateRenderer renderer = org.mockito.Mockito.mock(SvgTemplateRenderer.class);
        when(renderer.render(any(), anyInt(), anyInt(), anyString(), anyString(), anyString(), anyString(), anyString(), isNull(), anyBoolean(), anyString()))
                .thenReturn(new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47});
        ImageRenderService service = new ImageRenderService(imageGenerationProvider, renderer);
        BrandSettings seededBrand = BrandSettings.builder().name("STUDIO").configured(false).build();
        Product product = Product.builder().name("Neutral product").build();

        service.render(Template.builder().build(), product, "NEW", "A neutral post", "#D9FF4A", "mint", seededBrand, true);

        ArgumentCaptor<Boolean> includeBrandMark = ArgumentCaptor.forClass(Boolean.class);
        verify(renderer).render(eq(product), eq(768), eq(1344), eq("NEW"), eq("A neutral post"), eq("#D9FF4A"), eq("mint"),
                eq("STUDIO"), isNull(), includeBrandMark.capture(), eq("TOP_RIGHT"));
        assertThat(includeBrandMark.getValue()).isFalse();
    }

    @Test
    void rendersAConfiguredBrandSignatureAtTheSelectedPlacement() {
        ImageRenderService service = new ImageRenderService(imageGenerationProvider, new SvgTemplateRenderer());
        BrandSettings configuredBrand = BrandSettings.builder().name("NOUR STUDIO").configured(true).build();
        Product product = Product.builder().name("Signature product").build();

        ImageRenderService.RenderedVisual result = service.render(
                Template.builder().build(), product, "NEW", "Placed identity", "#D9FF4A", "moss",
                configuredBrand, true, "BOTTOM_LEFT");

        assertThat(result.generationMode()).isEqualTo(GenerationMode.TEMPLATE_COMPOSED);
        assertThat(result.png()).startsWith((byte) 0x89, (byte) 0x50, (byte) 0x4E, (byte) 0x47);
    }
}
