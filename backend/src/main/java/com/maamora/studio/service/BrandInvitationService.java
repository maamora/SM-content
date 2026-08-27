package com.maamora.studio.service;

import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.BrandInvitation;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.InvitationStatus;
import com.maamora.studio.repository.BrandInvitationRepository;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class BrandInvitationService {

    private final BrandInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final BrandSettingsService brandSettingsService;

    @Transactional
    public BrandInvitation invite(String inviterId, String rawEmail) {
        BrandSettings brand = brandSettingsService.getForUser(inviterId);
        User inviter = userRepository.findById(inviterId)
                .orElseThrow(() -> new ResourceNotFoundException("Inviter account was not found."));
        String email = normalize(rawEmail);

        userRepository.findByEmailIgnoreCase(email).ifPresent(existing -> {
            if (existing.getBrand() != null && existing.getBrand().getId().equals(brand.getId())) {
                throw new UnauthorizedException(email + " is already part of this workspace.");
            }
        });

        if (invitationRepository.existsByBrand_IdAndInvitedEmailIgnoreCaseAndStatus(brand.getId(), email, InvitationStatus.PENDING)) {
            throw new UnauthorizedException(email + " already has a pending invite to this workspace.");
        }

        BrandInvitation invitation = BrandInvitation.builder()
                .brand(brand)
                .invitedBy(inviter)
                .invitedEmail(email)
                .status(InvitationStatus.PENDING)
                .build();
        return invitationRepository.save(invitation);
    }

    @Transactional(readOnly = true)
    public List<BrandInvitation> listSent(String userId) {
        BrandSettings brand = brandSettingsService.getForUser(userId);
        return invitationRepository.findByBrand_IdOrderByCreatedAtDesc(brand.getId());
    }

    @Transactional(readOnly = true)
    public List<BrandInvitation> listReceived(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account was not found."));
        return invitationRepository.findByInvitedEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(user.getEmail(), InvitationStatus.PENDING);
    }

    @Transactional
    public BrandInvitation respond(String userId, String invitationId, boolean accept) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Account was not found."));

        // Scoped to the caller's own email on purpose — this is the only
        // thing that proves the invite was actually meant for them, since
        // invitations aren't tied to a User row until accepted.
        BrandInvitation invitation = invitationRepository.findByIdAndInvitedEmailIgnoreCase(invitationId, user.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Invitation was not found."));

        if (invitation.getStatus() != InvitationStatus.PENDING) {
            throw new UnauthorizedException("This invite has already been responded to.");
        }

        if (accept) {
            user.setBrand(invitation.getBrand());
            userRepository.save(user);
            invitation.setStatus(InvitationStatus.ACCEPTED);
        } else {
            invitation.setStatus(InvitationStatus.DECLINED);
        }
        invitation.setRespondedAt(Instant.now());
        return invitationRepository.save(invitation);
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
