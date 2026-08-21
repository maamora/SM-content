package com.maamora.studio.model;

import com.maamora.studio.model.enums.SocialConnectionStatus;
import com.maamora.studio.model.enums.SocialProvider;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "social_connection", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "provider", "external_account_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialConnection {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SocialProvider provider;

    @Column(nullable = false)
    private String externalAccountId;

    @Column(nullable = false)
    private String accountName;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String accessTokenEncrypted;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String refreshTokenEncrypted;

    private Instant expiresAt;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String metadataJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SocialConnectionStatus status = SocialConnectionStatus.ACTIVE;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
