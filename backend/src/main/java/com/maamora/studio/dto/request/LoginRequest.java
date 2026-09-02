package com.maamora.studio.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    private String password;

    // Optional — matched against the account's brand name OR its join code
    // (either one is enough, per the product ask). Left blank, login behaves
    // exactly as before; provided, it must match the account's actual brand
    // or the login is rejected. See AuthService.login().
    private String brandIdentifier;
}
