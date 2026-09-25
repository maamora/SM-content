package com.maamora.studio.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeleteBrandRequest {
    /** Must exactly match the brand's current name — the confirmation step for a permanent delete. */
    @NotBlank
    private String confirmName;
}
