package com.maamora.studio.model;

import com.maamora.studio.model.enums.Format;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "creative_template")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Template {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // Nullable brand: null = global/default template available to every brand
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private BrandSettings brand;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Format format;

    // Filename under src/main/resources/creative-templates/, e.g. "bold.html"
    @Column(nullable = false)
    private String htmlPath;

    private String thumbnailUrl;
}
