package com.maamora.studio.model;

import com.maamora.studio.model.enums.BrandRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * The real, permanent record that an account belongs to a brand — one row
 * per (user, brand) pair. This is what makes it possible for the same
 * account to be a member of several brands at once (its own workspace, plus
 * any it was invited to or joined by code), each with its own independent
 * BrandRole.
 *
 * User.brand / User.brandRole are deliberately left in place alongside this
 * table — they're not the source of truth anymore, they're just "which one
 * of this account's memberships is active for the current login session."
 * Every existing piece of the app that reads user.getBrand()/getBrandRole()
 * (products, posts, brand settings, member management, etc.) keeps working
 * unchanged; login() is what decides which membership to point those fields
 * at, using the optional "brand name or code" field when the account has
 * more than one.
 */
@Entity
@Table(name = "brand_membership", uniqueConstraints = @UniqueConstraint(name = "uk_brand_membership_user_brand", columnNames = { "user_id", "brand_id" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrandMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private BrandSettings brand;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BrandRole brandRole = BrandRole.MEMBER;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
