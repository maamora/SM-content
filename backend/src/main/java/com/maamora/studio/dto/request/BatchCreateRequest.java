package com.maamora.studio.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BatchCreateRequest {
    @NotEmpty
    private List<String> productIds;

    @NotBlank
    private String templateId;
}
