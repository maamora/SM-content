package com.maamora.studio;

import com.maamora.studio.controller.FileServeController;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class FileServeControllerTest {

    @TempDir
    Path uploads;

    @Test
    void servesStoredBrandLogoWithImageMediaType() throws Exception {
        Path logo = uploads.resolve("brand/logos/mark.png");
        Files.createDirectories(logo.getParent());
        Files.write(logo, new byte[]{(byte) 0x89, 'P', 'N', 'G'});

        FileServeController controller = controllerForUploads();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/files/brand/logos/mark.png");

        var response = controller.serve(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.IMAGE_PNG);
        assertThat(response.getBody()).isNotNull();
    }

    @Test
    void rejectsPathsOutsideTheUploadRoot() {
        FileServeController controller = controllerForUploads();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/files/../application.yml");

        var response = controller.serve(request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    private FileServeController controllerForUploads() {
        FileServeController controller = new FileServeController();
        ReflectionTestUtils.setField(controller, "localPath", uploads.toString());
        return controller;
    }
}
