package com.maamora.studio.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCreativeJobRequest {

    @NotBlank
    @Size(max = 4000)
    private String prompt;

    @NotBlank
    private String type;

    @Size(max = 32)
    private String aspectRatio = "16:9";

    @Size(max = 2048)
    @JsonProperty("productImageUrl")
    private String productImageUrl;

    @Size(max = 2048)
    @JsonProperty("modelImageUrl")
    private String modelImageUrl;

    private boolean generateVideo;
}
