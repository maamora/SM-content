package com.maamora.studio.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class GenerateCaptionsRequest {
    @NotBlank
    private String postId;

    // Languages to (re)generate: "fr", "ar", "darija". Defaults to all three.
    private List<String> languages = List.of("fr", "ar", "darija");
}
