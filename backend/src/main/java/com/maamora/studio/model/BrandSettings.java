package com.maamora.studio.model;

import com.maamora.studio.model.enums.AccountType;
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

    // Not unique at the DB level on purpose — display names are NOT exclusive
    // (two unrelated brands can both be called "Amazon" with zero conflict,
    // same as Slack/Discord workspace names). The join code below is the
    // actual unique identity teammates use to reach a specific workspace.
    @Column(unique = true)
    private String joinCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AccountType accountType = AccountType.BUSINESS;

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
