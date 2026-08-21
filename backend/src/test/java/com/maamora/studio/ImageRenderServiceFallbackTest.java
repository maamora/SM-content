package com.maamora.studio;

import com.maamora.studio.model.Product;
import com.maamora.studio.model.Template;
import com.maamora.studio.model.enums.GenerationMode;
import com.maamora.studio.service.ImageGenerationProvider;
import com.maamora.studio.service.ImageRenderService;
import com.maamora.studio.service.SvgTemplateRenderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
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
}
