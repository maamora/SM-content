package com.maamora.studio.model;

import com.maamora.studio.model.enums.SocialPlatform;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A brand's link to a social platform — scoped to the BRAND, not the
 * individual user, since every coworker generating content for a brand
 * should see and use the same connected accounts, not a separate set each.
 *
 * This is a manually-entered handle, not a real OAuth connection — there's
 * no Instagram/Facebook/TikTok API integration behind it yet (that needs
 * app review + API credentials per platform, well beyond what a "connect"
 * button can do on its own). It's honestly presented as such in the UI
 * rather than implying automatic sync that doesn't exist yet.
 */
@Entity
@Table(name = "social_account", uniqueConstraints = @UniqueConstraint(columnNames = { "brand_id", "platform" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private BrandSettings brand;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SocialPlatform platform;

    @Column(nullable = false)
    private String handle;

    @Column(nullable = false, updatable = false)
    private Instant connectedAt;

    @PrePersist
    void onCreate() {
        connectedAt = Instant.now();
    }
}
