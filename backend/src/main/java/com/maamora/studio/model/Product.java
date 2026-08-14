package com.maamora.studio.model;

import com.maamora.studio.model.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private BrandSettings brand;

    /** Who submitted this product — used to scope PENDING visibility to its own submitter. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000, nullable = false)
    private String description;

    private String sellingPoint;

    private Double price;

    private String imageUrl;

    /** Optional 2nd and 3rd product photos, shown on the product detail page. */
    private String imageUrl2;

    private String imageUrl3;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProductStatus status = ProductStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    /**
     * Deleting a product with existing generated posts used to fail outright
     * (FK constraint violation on post.product_id) since nothing told
     * Hibernate to clean up the posts first. Cascading here makes "delete
     * product" also remove whatever was generated for it, same pattern
     * BrandSettings already uses for its products/templates.
     */
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Post> posts = new ArrayList<>();

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
