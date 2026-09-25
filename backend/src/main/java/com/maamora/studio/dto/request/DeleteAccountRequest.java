package com.maamora.studio.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeleteAccountRequest {
    /** Must exactly match the account's current display name — the confirmation step for a permanent delete. */
    @NotBlank
    private String confirmName;
}
