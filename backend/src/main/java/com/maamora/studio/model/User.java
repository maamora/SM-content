package com.maamora.studio.model;

import com.maamora.studio.model.enums.BrandRole;
import com.maamora.studio.model.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private BrandSettings brand;

    // Standing within `brand` above — not the platform Role. Not
    // "nullable = false" for the same ddl-auto=update reason as
    // BrandSettings.joinCode/configured: existing rows predate this column.
    // A null value is treated as MEMBER everywhere it's read.
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BrandRole brandRole = BrandRole.MEMBER;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
