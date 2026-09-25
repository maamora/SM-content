package com.maamora.studio.service;

import com.maamora.studio.dto.request.DeleteBrandRequest;
import com.maamora.studio.exception.ForbiddenException;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.model.BrandBan;
import com.maamora.studio.model.BrandInvitation;
import com.maamora.studio.model.BrandMembership;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.BrandRole;
import com.maamora.studio.repository.BatchJobRepository;
import com.maamora.studio.repository.BrandBanRepository;
import com.maamora.studio.repository.BrandInvitationRepository;
import com.maamora.studio.repository.BrandMembershipRepository;
import com.maamora.studio.repository.BrandSettingsRepository;
import com.maamora.studio.repository.SocialAccountRepository;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Brand-scoped member management: kick, ban, promote/demote, and the brand's
 * own delete. Distinct from CoworkersSection's read-only "who's on my team"
 * list — everything here is a moderation action gated on the caller's
 * BrandRole (OWNER/ADMIN can moderate; only OWNER can delete the brand or
 * promote/demote another ADMIN).
 */
@Service
@RequiredArgsConstructor
public class BrandMembershipService {

    private final UserRepository userRepository;
    private final BrandSettingsService brandSettingsService;
    private final BrandSettingsRepository brandSettingsRepository;
    private final BrandBanRepository brandBanRepository;
    private final SocialAccountRepository socialAccountRepository;
    private final BatchJobRepository batchJobRepository;
    private final BrandInvitationRepository brandInvitationRepository;
    private final BrandMembershipRepository brandMembershipRepository;

    public List<User> listMembers(String callerId) {
        BrandSettings brand = brandSettingsService.getForUser(callerId);
        return userRepository.findByBrand_IdOrderByCreatedAtAsc(brand.getId());
    }

    public List<BrandBan> listBans(String callerId) {
        User caller = requireUser(callerId);
        requireModerator(caller);
        return brandBanRepository.findByBrand_IdOrderByCreatedAtDesc(caller.getBrand().getId());
    }

    @Transactional
    public void kick(String callerId, String targetUserId) {
        removeMember(callerId, targetUserId, false);
    }

    @Transactional
    public void ban(String callerId, String targetUserId) {
        removeMember(callerId, targetUserId, true);
    }

    private void removeMember(String callerId, String targetUserId, boolean alsoBan) {
        User caller = requireUser(callerId);
        requireModerator(caller);
        User target = requireUser(targetUserId);

        if (target.getBrand() == null || !target.getBrand().getId().equals(caller.getBrand().getId())) {
            throw new ResourceNotFoundException("That person isn't part of your workspace.");
        }
        if (target.getId().equals(caller.getId())) {
            throw new ForbiddenException("You can't remove yourself this way — use Delete account instead.");
        }
        if (target.getBrandRole() == BrandRole.OWNER) {
            throw new ForbiddenException("The workspace owner can't be removed.");
        }
        // Only the OWNER can remove another ADMIN — one admin shouldn't be
        // able to knock out another admin the owner promoted.
        if (target.getBrandRole() == BrandRole.ADMIN && caller.getBrandRole() != BrandRole.OWNER) {
            throw new ForbiddenException("Only the workspace owner can remove another admin.");
        }

        if (alsoBan) {
            BrandSettings brand = caller.getBrand();
            if (!brandBanRepository.existsByBrand_IdAndBannedEmailIgnoreCase(brand.getId(), target.getEmail())) {
                brandBanRepository.save(BrandBan.builder()
                        .brand(brand)
                        .bannedEmail(target.getEmail())
                        .bannedName(target.getName())
                        .build());
            }
        }

        // Drop their membership row for the brand they're being removed
        // from — an account can belong to several brands now, and losing
        // this one shouldn't touch any of the others.
        brandMembershipRepository.deleteByUser_IdAndBrand_Id(target.getId(), caller.getBrand().getId());
        brandSettingsService.reassignToFreshPersonalWorkspace(target);
    }

    @Transactional
    public void unban(String callerId, String banId) {
        User caller = requireUser(callerId);
        requireModerator(caller);
        BrandBan ban = brandBanRepository.findByIdAndBrand_Id(banId, caller.getBrand().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Ban record not found."));
        brandBanRepository.delete(ban);
    }

    /** Toggles a MEMBER to ADMIN or an ADMIN back down to MEMBER. Owner-only. */
    @Transactional
    public void setAdmin(String callerId, String targetUserId, boolean makeAdmin) {
        User caller = requireUser(callerId);
        if (caller.getBrandRole() != BrandRole.OWNER) {
            throw new ForbiddenException("Only the workspace owner can change admin access.");
        }
        User target = requireUser(targetUserId);
        if (target.getBrand() == null || !target.getBrand().getId().equals(caller.getBrand().getId())) {
            throw new ResourceNotFoundException("That person isn't part of your workspace.");
        }
        if (target.getBrandRole() == BrandRole.OWNER) {
            throw new ForbiddenException("The workspace owner's role can't be changed.");
        }
        BrandRole newRole = makeAdmin ? BrandRole.ADMIN : BrandRole.MEMBER;
        target.setBrandRole(newRole);
        userRepository.save(target);

        // Keep the roster row for this specific membership in sync too —
        // target.brandRole above is only "their role in whichever brand is
        // currently active for their session," which may not even be this
        // one if they're logged into a different one of their brands right
        // now. Without this, the promotion would silently revert the next
        // time they log back into this brand.
        Optional<BrandMembership> membership = brandMembershipRepository.findByUser_IdAndBrand_Id(target.getId(), caller.getBrand().getId());
        membership.ifPresent(m -> {
            m.setBrandRole(newRole);
            brandMembershipRepository.save(m);
        });
    }

    /**
     * Permanently deletes the brand itself. Owner-only, and requires the
     * exact current brand name as confirmation — same pattern as
     * UserService.deleteAccount(). Every other member keeps their account
     * but loses this workspace: each gets a fresh, empty personal workspace
     * of their own (see BrandSettingsService.reassignToFreshPersonalWorkspace),
     * same treatment a kicked member gets. The caller (owner) also gets a
     * fresh personal workspace afterward, since their account isn't being
     * deleted here — only the brand is.
     */
    @Transactional
    public void deleteBrand(String callerId, DeleteBrandRequest request) {
        User caller = requireUser(callerId);
        if (caller.getBrandRole() != BrandRole.OWNER) {
            throw new ForbiddenException("Only the workspace owner can delete the brand.");
        }
        BrandSettings brand = caller.getBrand();
        if (brand == null) {
            throw new ResourceNotFoundException("No workspace to delete.");
        }
        String expected = brand.getName() == null ? "" : brand.getName().trim();
        String typed = request.getConfirmName() == null ? "" : request.getConfirmName().trim();
        if (expected.isEmpty() || !expected.equalsIgnoreCase(typed)) {
            throw new ForbiddenException("Type the workspace name exactly as shown to confirm deletion.");
        }

        deleteBrandCascade(brand, caller.getId());

        // The owner's account survives; give it somewhere to land.
        brandSettingsService.reassignToFreshPersonalWorkspace(caller);
    }

    /**
     * Shared cascade used both by deleteBrand() (owner keeps their account)
     * and UserService.deleteAccount() when the deleting user happens to be a
     * brand owner (their whole brand goes with them — see that method).
     * excludeUserId is skipped when reassigning members since the caller
     * handles that account separately (given a fresh workspace, or deleted
     * outright).
     */
    @Transactional
    public void deleteBrandCascade(BrandSettings brand, String excludeUserId) {
        // The true roster is BrandMembership now, not just whoever's active
        // pointer (user.brand) happens to be this brand — a multi-brand
        // account could be a real member here while currently logged into a
        // different one of its brands, and still needs to lose this
        // membership (and, if this IS their active brand right now, get
        // reassigned somewhere to land).
        List<BrandMembership> memberships = brandMembershipRepository.findByBrand_Id(brand.getId());
        for (BrandMembership membership : memberships) {
            User member = membership.getUser();
            if (member.getId().equals(excludeUserId)) continue;
            boolean isActiveHere = member.getBrand() != null && member.getBrand().getId().equals(brand.getId());
            if (isActiveHere) {
                brandSettingsService.reassignToFreshPersonalWorkspace(member);
            }
        }
        // Legacy safety net: a user.brand pointer with no matching
        // BrandMembership row (shouldn't exist post-backfill, but don't
        // strand anyone over a missed migration row).
        for (User member : userRepository.findByBrand_IdOrderByCreatedAtAsc(brand.getId())) {
            if (member.getId().equals(excludeUserId)) continue;
            boolean alreadyHandled = memberships.stream().anyMatch(m -> m.getUser().getId().equals(member.getId()));
            if (!alreadyHandled) {
                brandSettingsService.reassignToFreshPersonalWorkspace(member);
            }
        }

        brandMembershipRepository.deleteAll(brandMembershipRepository.findByBrand_Id(brand.getId()));
        socialAccountRepository.deleteAll(socialAccountRepository.findByBrand_Id(brand.getId()));
        List<BrandInvitation> invitations = brandInvitationRepository.findByBrand_IdOrderByCreatedAtDesc(brand.getId());
        brandInvitationRepository.deleteAll(invitations);
        brandBanRepository.deleteAll(brandBanRepository.findByBrand_Id(brand.getId()));

        // Products (and their Posts, cascaded) and Templates are removed
        // automatically by BrandSettings' own @OneToMany(cascade = ALL)
        // mappings once the brand row itself is deleted.
        brandSettingsRepository.delete(brand);

        // BatchJob rows reference brand_id directly (not cascaded from
        // BrandSettings) and any Post that referenced one is already gone
        // via the Product cascade above, so these are safe to remove now.
        batchJobRepository.deleteAll(batchJobRepository.findByBrandId(brand.getId()));
    }

    private User requireUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account was not found."));
    }

    private void requireModerator(User caller) {
        if (caller.getBrand() == null) {
            throw new ResourceNotFoundException("No workspace found for this account.");
        }
        BrandRole role = caller.getBrandRole();
        if (role != BrandRole.OWNER && role != BrandRole.ADMIN) {
            throw new ForbiddenException("Only the workspace owner or an admin can manage members.");
        }
    }
}
