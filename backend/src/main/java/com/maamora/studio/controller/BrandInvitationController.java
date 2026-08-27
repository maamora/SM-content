package com.maamora.studio.controller;

import com.maamora.studio.dto.request.InviteToBrandRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.BrandInvitationResponse;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.BrandInvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class BrandInvitationController {

    private final BrandInvitationService invitationService;
    private final CurrentUserProvider currentUser;

    /** Send an invite from the caller's own brand — Settings → Team. */
    @PostMapping("/api/brand/invitations")
    public ApiResponse<BrandInvitationResponse> invite(@Valid @RequestBody InviteToBrandRequest request) {
        var invitation = invitationService.invite(currentUser.getCurrentUserId(), request.getEmail());
        return ApiResponse.ok(new BrandInvitationResponse(invitation));
    }

    /** Invites sent out by the caller's brand, most recent first — Settings → Team. */
    @GetMapping("/api/brand/invitations")
    public ApiResponse<List<BrandInvitationResponse>> sent() {
        var invitations = invitationService.listSent(currentUser.getCurrentUserId())
                .stream().map(BrandInvitationResponse::new).toList();
        return ApiResponse.ok(invitations);
    }

    /** Pending invites addressed to the caller's own email — Notifications page. */
    @GetMapping("/api/invitations/mine")
    public ApiResponse<List<BrandInvitationResponse>> received() {
        var invitations = invitationService.listReceived(currentUser.getCurrentUserId())
                .stream().map(BrandInvitationResponse::new).toList();
        return ApiResponse.ok(invitations);
    }

    @PostMapping("/api/invitations/{id}/accept")
    public ApiResponse<BrandInvitationResponse> accept(@PathVariable String id) {
        var invitation = invitationService.respond(currentUser.getCurrentUserId(), id, true);
        return ApiResponse.ok(new BrandInvitationResponse(invitation));
    }

    @PostMapping("/api/invitations/{id}/decline")
    public ApiResponse<BrandInvitationResponse> decline(@PathVariable String id) {
        var invitation = invitationService.respond(currentUser.getCurrentUserId(), id, false);
        return ApiResponse.ok(new BrandInvitationResponse(invitation));
    }
}
