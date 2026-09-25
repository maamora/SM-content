package com.maamora.studio.dto.request;

import lombok.Data;

@Data
public class SetAdminRequest {
    /** true to promote the target to ADMIN, false to demote back to MEMBER. */
    private boolean admin;
}
