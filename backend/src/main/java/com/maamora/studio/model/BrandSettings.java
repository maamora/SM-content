package com.maamora.studio.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "brand_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrandSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    private String logoUrl;
    private String primaryColor;
    private String secondaryColor;
    private String fontFamily;

    @Column(length = 2000)
    private String toneGuidelines;

    @OneToMany(mappedBy = "brand", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Product> products = new ArrayList<>();

    @OneToMany(mappedBy = "brand", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Template> templates = new ArrayList<>();
}
