package com.maamora.studio.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String name;

    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    /**
     * Required only for the "create a new brand" path — not when joining an
     * existing brand via joinCode, and not for a personal account. See
     * AuthService.register for the three-way branching. Not annotated
     * @NotBlank here because that validation is conditional, not universal.
     */
    private String brandName;

    /** Optional — uploaded separately via POST /api/uploads/logo before this call. */
    private String logoUrl;

    /**
     * If provided, attaches this account to an existing brand's workspace
     * instead of creating a new one — brandName/logoUrl are ignored when
     * this is set. See BrandSettingsService.joinExisting.
     */
    private String joinCode;

    /**
     * Register a personal profile instead of a business brand — for someone
     * who just wants to post their own content, not represent a company.
     * When true, brandName/logoUrl/joinCode are all ignored: the account
     * gets a lightweight auto-named workspace instead (see
     * BrandSettingsService.createPersonalWorkspace).
     */
    private boolean personal;

    /**
     * Honeypot — a real user never sees or fills this field (hidden off-screen
     * on the form); a bot's autofill usually does. Any non-blank value here
     * means "reject silently," without telling the caller why, so bots don't
     * learn to leave it empty.
     */
    private String website;
}
