package com.maamora.studio.service;

import com.maamora.studio.dto.request.ChangePasswordRequest;
import com.maamora.studio.dto.request.CompleteOnboardingRequest;
import com.maamora.studio.dto.request.DeleteAccountRequest;
import com.maamora.studio.dto.request.UpdateProfileRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.BrandInvitation;
import com.maamora.studio.model.BrandMembership;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.Product;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.BrandRole;
import com.maamora.studio.repository.BrandInvitationRepository;
import com.maamora.studio.repository.BrandMembershipRepository;
import com.maamora.studio.repository.CreativeJobRepository;
import com.maamora.studio.repository.EmailDeliveryRepository;
import com.maamora.studio.repository.PasswordResetTokenRepository;
import com.maamora.studio.repository.ProductRepository;
import com.maamora.studio.repository.PublishJobRepository;
import com.maamora.studio.repository.SocialConnectionRepository;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BrandSettingsService brandSettingsService;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SocialConnectionRepository socialConnectionRepository;
    private final CreativeJobRepository creativeJobRepository;
    private final PublishJobRepository publishJobRepository;
    private final EmailDeliveryRepository emailDeliveryRepository;
    private final BrandInvitationRepository brandInvitationRepository;
    private final ProductRepository productRepository;
    private final BrandMembershipService brandMembershipService;
    private final BrandMembershipRepository brandMembershipRepository;

    public User getById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    public User updateProfile(String userId, UpdateProfileRequest request) {
        User user = getById(userId);
        if (!request.getEmail().equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new UnauthorizedException("An account with this email already exists.");
        }
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        return userRepository.save(user);
    }

    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = getById(userId);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /** Everyone else sharing the current user's brand — the "coworkers" list on the Settings page. */
    public List<User> listCoworkers(String userId) {
        String brandId = brandSettingsService.getForUser(userId).getId();
        return userRepository.findByBrand_IdOrderByCreatedAtAsc(brandId);
    }

    /**
     * Permanently deletes the caller's account. Requires the caller to retype
     * their exact current display name as a confirmation step — this is the
     * only guard against an accidental irreversible delete, since there's no
     * "restore" for this action.
     *
     * Brand-shared data (products, posts) is preserved for the rest of the
     * team: product authorship is cleared rather than the product being
     * deleted, and any invitations this person sent keep their record with
     * the sender reference cleared. Everything that is purely personal to
     * this account (OAuth connections, generation jobs, publish jobs, email
     * history, pending password-reset tokens) is deleted along with the row.
     *
     * Exception: if this account is the OWNER of its brand, the brand itself
     * doesn't survive them — the whole workspace (every other member, its
     * products/posts/templates, social accounts, invitations, bans) is torn
     * down first via BrandMembershipService's shared cascade, same as an
     * explicit "Delete brand" action.
     */
    @Transactional
    public void deleteAccount(String userId, DeleteAccountRequest request) {
        User user = getById(userId);
        String expected = user.getName() == null ? "" : user.getName().trim();
        String typed = request.getConfirmName() == null ? "" : request.getConfirmName().trim();
        if (expected.isEmpty() || !expected.equals(typed)) {
            throw new UnauthorizedException("Type your name exactly as shown to confirm account deletion.");
        }

        if (user.getBrand() != null && user.getBrandRole() == BrandRole.OWNER) {
            BrandSettings ownedBrand = user.getBrand();
            // Detach the owner from the brand row first so its own brand_id
            // FK isn't left pointing at a row the cascade is about to delete
            // (the owner's User row itself is deleted a few lines down).
            user.setBrand(null);
            userRepository.save(user);
            brandMembershipService.deleteBrandCascade(ownedBrand, user.getId());
        }

        passwordResetTokenRepository.deleteAll(passwordResetTokenRepository.findAllByUserIdAndUsedAtIsNull(userId));
        socialConnectionRepository.deleteAll(socialConnectionRepository.findAllByUserIdOrderByUpdatedAtDesc(userId));
        creativeJobRepository.deleteAll(creativeJobRepository.findAllByUserId(userId));
        publishJobRepository.deleteAll(publishJobRepository.findAllByUserIdOrderByCreatedAtDesc(userId));
        emailDeliveryRepository.deleteAll(emailDeliveryRepository.findAllByUserIdOrderByCreatedAtDesc(userId));

        List<BrandInvitation> sentInvitations = brandInvitationRepository.findByInvitedById(userId);
        sentInvitations.forEach(invitation -> invitation.setInvitedBy(null));
        brandInvitationRepository.saveAll(sentInvitations);

        List<Product> ownedProducts = productRepository.findByCreatedById(userId);
        ownedProducts.forEach(product -> product.setCreatedBy(null));
        productRepository.saveAll(ownedProducts);

        // Wipes every (user, brand) roster row this account had — including
        // brands it was only ever a plain member of, not just the one it
        // owned (that one's already gone via deleteBrandCascade above).
        brandMembershipRepository.deleteAll(brandMembershipRepository.findByUser_IdOrderByCreatedAtAsc(userId));

        userRepository.delete(user);
    }

    /**
     * One-time setup for an account that authenticated without ever choosing
     * personal/create/join — currently only Google sign-up reaches this state
     * (see AuthService.loginOrCreateGoogle). Same three-way branch and
     * validation as RegisterRequest; the only difference is there's no new
     * User row to create, just a brand to attach to the existing one.
     */
    @Transactional
    public User completeOnboarding(String userId, CompleteOnboardingRequest request) {
        User user = getById(userId);
        if (user.getBrand() != null) {
            throw new UnauthorizedException("This account already has a workspace configured.");
        }

        boolean joining = request.getJoinCode() != null && !request.getJoinCode().isBlank();
        if (!request.isPersonal() && !joining && (request.getBrandName() == null || request.getBrandName().isBlank())) {
            throw new UnauthorizedException("Enter a brand name, choose a personal account, or enter a workspace code to join an existing brand.");
        }

        BrandSettings brand = request.isPersonal()
                ? brandSettingsService.createPersonalWorkspace(user.getName())
                : joining
                        ? brandSettingsService.joinExisting(request.getJoinCode(), user.getEmail())
                        : brandSettingsService.createForNewUser(request.getBrandName(), request.getLogoUrl());

        BrandRole brandRole = joining ? BrandRole.MEMBER : BrandRole.OWNER;
        user.setBrand(brand);
        user.setBrandRole(brandRole);
        User saved = userRepository.save(user);
        brandMembershipRepository.save(BrandMembership.builder().user(saved).brand(brand).brandRole(brandRole).build());
        return saved;
    }
}
