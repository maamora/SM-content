package com.maamora.studio.model;

import com.maamora.studio.model.enums.Format;
import com.maamora.studio.model.enums.GenerationMode;
import com.maamora.studio.model.enums.PostStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "post")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private Template template;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_job_id")
    private BatchJob batchJob;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Format format;

    private String imageUrl;

    @Column(length = 2000)
    private String captionEn;

    @Column(length = 2000)
    private String captionFr;

    @Column(length = 2000)
    private String captionAr;

    @Column(length = 2000)
    private String captionDarija;

    private String badgeText;
    private String promoText;

    @Column(length = 160)
    private String headline;

    @Column(length = 360)
    private String supportingText;

    @Column(length = 120)
    private String ctaText;

    @Column(length = 32)
    private String layoutStyle;

    @Column(length = 32)
    private String productFocus;

    @Column(length = 16)
    private String textAlignment;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    @Builder.Default
    private GenerationMode generationMode = GenerationMode.AI_GENERATED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PostStatus status = PostStatus.DRAFT;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

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
