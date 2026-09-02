package com.maamora.studio.model;

import com.maamora.studio.model.enums.CreativeJobStatus;
import com.maamora.studio.model.enums.CreativeJobType;
import com.maamora.studio.model.enums.GenerationMode;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "creative_job", indexes = {
        @Index(name = "idx_creative_job_user_created", columnList = "user_id,created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreativeJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CreativeJobType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private CreativeJobStatus status = CreativeJobStatus.QUEUED;

    @Column(nullable = false, length = 4000)
    private String prompt;

    @Column(length = 32)
    private String aspectRatio;

    @Column(length = 2048)
    private String productImageUrl;

    @Column(length = 2048)
    private String modelImageUrl;

    @Column(length = 2048)
    private String resultImageUrl;

    @Column(length = 2048)
    private String resultVideoUrl;

    @Column(length = 1200)
    private String errorMessage;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private GenerationMode outputMode;

    @Column(length = 1200)
    private String recoveryMessage;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
