package com.maamora.studio.controller;

import com.maamora.studio.dto.request.DeleteBrandRequest;
import com.maamora.studio.dto.request.SetAdminRequest;
import com.maamora.studio.dto.response.ApiResponse;
import com.maamora.studio.dto.response.BrandBanResponse;
import com.maamora.studio.dto.response.UserSummaryResponse;
import com.maamora.studio.security.CurrentUserProvider;
import com.maamora.studio.service.BrandMembershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Brand-level moderation: members list, kick, ban, unban, promote/demote to
 * admin, and permanently deleting the brand. Distinct from
 * BrandSettingsController (brand profile fields/logo) and
 * BrandInvitationController (invite-by-email flow) — this one is about who
 * belongs to the workspace and who's in charge.
 */
@RestController
@RequestMapping("/api/brand/members")
@RequiredArgsConstructor
public class BrandMembershipController {

    private final BrandMembershipService membershipService;
    private final CurrentUserProvider currentUser;

    @GetMapping
    public ApiResponse<List<UserSummaryResponse>> list() {
        List<UserSummaryResponse> members = membershipService.listMembers(currentUser.getCurrentUserId())
                .stream().map(UserSummaryResponse::new).toList();
        return ApiResponse.ok(members);
    }

    @GetMapping("/bans")
    public ApiResponse<List<BrandBanResponse>> bans() {
        List<BrandBanResponse> bans = membershipService.listBans(currentUser.getCurrentUserId())
                .stream().map(BrandBanResponse::new).toList();
        return ApiResponse.ok(bans);
    }

    @PostMapping("/{userId}/kick")
    public ApiResponse<Void> kick(@PathVariable String userId) {
        membershipService.kick(currentUser.getCurrentUserId(), userId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{userId}/ban")
    public ApiResponse<Void> ban(@PathVariable String userId) {
        membershipService.ban(currentUser.getCurrentUserId(), userId);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/bans/{banId}")
    public ApiResponse<Void> unban(@PathVariable String banId) {
        membershipService.unban(currentUser.getCurrentUserId(), banId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{userId}/admin")
    public ApiResponse<Void> setAdmin(@PathVariable String userId, @RequestBody SetAdminRequest request) {
        membershipService.setAdmin(currentUser.getCurrentUserId(), userId, request.isAdmin());
        return ApiResponse.ok(null);
    }

    @PostMapping("/delete-brand")
    public ApiResponse<Void> deleteBrand(@Valid @RequestBody DeleteBrandRequest request) {
        membershipService.deleteBrand(currentUser.getCurrentUserId(), request);
        return ApiResponse.ok(null);
    }
}
