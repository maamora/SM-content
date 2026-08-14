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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private BrandSettings brand;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Format format;

    @Column(nullable = false)
    private String htmlPath;

    private String thumbnailUrl;
}
