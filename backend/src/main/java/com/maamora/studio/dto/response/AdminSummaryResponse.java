package com.maamora.studio.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AdminSummaryResponse {
    private long users;
    private long workspaces;
    private long products;
    private long posts;
    private long templates;
    private long pendingProducts;
}
