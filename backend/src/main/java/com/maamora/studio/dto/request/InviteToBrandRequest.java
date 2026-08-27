package com.maamora.studio.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InviteToBrandRequest {
    @NotBlank @Email
    private String email;
}
