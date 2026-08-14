package com.maamora.studio.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateEmailDeliveryRequest(
        @NotBlank @Email String toAddress,
        @NotBlank @Size(max = 300) String subject,
        @NotBlank @Size(max = 10000) String body,
        String postId
) {}
