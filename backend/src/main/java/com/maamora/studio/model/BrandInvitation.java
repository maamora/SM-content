package com.maamora.studio.model;

import com.maamora.studio.model.enums.InvitationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A pending "join my brand" invite sent to an email address. Deliberately
 * keyed on email rather than a User row — the invited person may not have an
 * account yet — and only takes effect (moves the recipient's User.brand) once
 * they explicitly accept it from their Notifications page. See
 * BrandInvitationService for the accept/decline logic.
 */
@Entity
@Table(name = "brand_invitation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrandInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private BrandSettings brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_id")
    private User invitedBy;

    @Column(nullable = false)
    private String invitedEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private InvitationStatus status = InvitationStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant respondedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
