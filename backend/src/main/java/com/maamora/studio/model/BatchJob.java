package com.maamora.studio.model;

import com.maamora.studio.model.enums.BatchStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "batch_job")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatchJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private BrandSettings brand;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BatchStatus status = BatchStatus.PENDING;

    @OneToMany(mappedBy = "batchJob", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Post> posts = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
