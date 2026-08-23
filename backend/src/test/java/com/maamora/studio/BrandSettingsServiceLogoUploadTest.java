package com.maamora.studio;

import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.repository.BrandSettingsRepository;
import com.maamora.studio.repository.UserRepository;
import com.maamora.studio.service.BrandSettingsService;
import com.maamora.studio.service.StorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BrandSettingsServiceLogoUploadTest {

    @Mock
    private BrandSettingsRepository brandSettingsRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageService storageService;

    @Test
    void uploadsAndPersistsAnOptionalBrandLogoInOneOperation() {
        BrandSettings brand = BrandSettings.builder().id("brand-1").name("Aster").configured(false).build();
        User user = User.builder().id("user-1").email("owner@example.test").brand(brand).build();
        MockMultipartFile logo = new MockMultipartFile("file", "aster-mark.png", "image/png", new byte[]{1, 2, 3});
        when(userRepository.findById("user-1")).thenReturn(Optional.of(user));
        when(storageService.upload(any(byte[].class), any(String.class), eq("image/png")))
                .thenReturn("https://media.example.test/brand/logos/aster-mark.png");
        when(brandSettingsRepository.save(any(BrandSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BrandSettingsService service = new BrandSettingsService(brandSettingsRepository, userRepository, storageService);
        BrandSettings saved = service.uploadLogo("user-1", logo);

        assertThat(saved.getLogoUrl()).isEqualTo("https://media.example.test/brand/logos/aster-mark.png");
        assertThat(saved.isConfigured()).isTrue();
        ArgumentCaptor<String> path = ArgumentCaptor.forClass(String.class);
        verify(storageService).upload(any(byte[].class), path.capture(), eq("image/png"));
        assertThat(path.getValue()).startsWith("brand/logos/").endsWith(".png");
        verify(brandSettingsRepository).save(brand);
    }

    @Test
    void rejectsNonImageFilesBeforeStorageOrPersistence() {
        MockMultipartFile document = new MockMultipartFile("file", "notes.txt", "text/plain", new byte[]{1});
        BrandSettingsService service = new BrandSettingsService(brandSettingsRepository, userRepository, storageService);

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> service.uploadLogo("user-1", document));

        assertThat(error.getMessage()).isEqualTo("Choose a PNG, JPG, WebP, or SVG logo.");
        verify(storageService, never()).upload(any(byte[].class), any(String.class), any(String.class));
        verify(brandSettingsRepository, never()).save(any());
    }
}
