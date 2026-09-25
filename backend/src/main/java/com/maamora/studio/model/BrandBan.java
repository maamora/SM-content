package com.maamora.studio.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A ban keyed on email (not user id) so it still blocks a re-registration
 * attempt even though the banned person's old User row is gone (kicking/
 * banning detaches them into their own fresh personal workspace rather than
 * deleting their account — see BrandMembershipService). Checked whenever
 * someone tries to join this brand via join code or accepts an invite to it.
 */
@Entity
@Table(name = "brand_ban")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrandBan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private BrandSettings brand;

    @Column(nullable = false)
    private String bannedEmail;

    private String bannedName;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
