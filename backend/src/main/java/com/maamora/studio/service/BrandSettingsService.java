package com.maamora.studio.service;

import com.maamora.studio.dto.request.BrandSettingsRequest;
import com.maamora.studio.exception.ResourceNotFoundException;
import com.maamora.studio.exception.UnauthorizedException;
import com.maamora.studio.model.BrandSettings;
import com.maamora.studio.model.User;
import com.maamora.studio.model.enums.AccountType;
import com.maamora.studio.repository.BrandSettingsRepository;
import com.maamora.studio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BrandSettingsService {

    private final BrandSettingsRepository brandSettingsRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    // Excludes 0/O/1/I/L on purpose — those are the characters people most
    // often misread when a code is read aloud, handwritten, or typed from a
    // screenshot. 8 chars over this 32-character alphabet is ~1.1 trillion
    // possible codes, which combined with rate limiting on the register
    // endpoint (see RateLimiterService) makes brute-forcing someone else's
    // code impractical.
    private static final String JOIN_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    private static final int JOIN_CODE_LENGTH = 8;
    private final SecureRandom random = new SecureRandom();

    /** Every user belongs to their own brand's workspace now (see createForNewUser / joinExisting). */
    public BrandSettings getForUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (user.getBrand() == null) {
            BrandSettings neutralBrand = createNeutralBrand();
            user.setBrand(neutralBrand);
            userRepository.save(user);
        }
        return user.getBrand();
    }

    /**
     * Creates a brand-new, isolated workspace for a just-registered user —
     * every account gets its own brand (name + optional logo) instead of
     * joining one shared workspace, unless they registered with an existing
     * brand's join code (see joinExisting). Primary color defaults to
     * Maamora orange so cards/charts still have a sensible accent before the
     * user visits their brand settings to change it.
     *
     * Brand names are deliberately NOT unique or reserved — anyone can
     * register a brand called "Amazon" without conflict, the same way two
     * unrelated Slack workspaces can share a display name. What's actually
     * exclusive is the generated join code, which is how a real team proves
     * they belong together, and (eventually) a verification badge is what
     * distinguishes an authentic brand from a look-alike — not a name lock,
     * which would just let whoever registers first permanently squat a name
     * they may have no real connection to.
     */
    public BrandSettings createForNewUser(String name, String logoUrl) {
        return brandSettingsRepository.save(BrandSettings.builder()
                .name(name)
                .logoUrl(logoUrl)
                .primaryColor("#F47315")
                .joinCode(generateUniqueJoinCode())
                .build());
    }

    /**
     * Creates a lightweight personal workspace for someone who just wants to
     * post to their own profile, not represent a company — no brand name
     * prompt, no logo step at signup. Reuses the exact same BrandSettings
     * table/pipeline as a real brand (products, posts, generation all work
     * identically) so nothing downstream needs special-casing; it's only
     * tagged AccountType.PERSONAL so the frontend can soften "brand kit"
     * language for it, and named after the person rather than a company.
     */
    public BrandSettings createPersonalWorkspace(String ownerName) {
        return brandSettingsRepository.save(BrandSettings.builder()
                .name(ownerName)
                .accountType(AccountType.PERSONAL)
                .primaryColor("#F47315")
                .joinCode(generateUniqueJoinCode())
                .build());
    }

    /**
     * Attaches a just-registered user to an existing brand instead of
     * creating a new one — this is the "join my team's workspace" path on
     * the register form. The code is the only thing that grants access;
     * knowing (or guessing) a brand's display name gets you nothing.
     */
    public BrandSettings joinExisting(String joinCode) {
        return brandSettingsRepository.findByJoinCode(normalizeCode(joinCode))
                .orElseThrow(() -> new UnauthorizedException("That workspace code doesn't match any brand. Double-check it with your teammate."));
    }

    /**
     * Used by BrandSeeder: creates the initial seeded brand if none exists
     * yet, and backfills a join code onto any brand row left over from
     * before join codes existed (so a pre-existing dev database's "Maamora"
     * brand becomes joinable too, instead of being permanently code-less).
     */
    public BrandSettings ensureSeedBrand(String name, String primaryColor) {
        List<BrandSettings> all = brandSettingsRepository.findAll();
        for (BrandSettings brand : all) {
            if (brand.getJoinCode() == null || brand.getJoinCode().isBlank()) {
                brand.setJoinCode(generateUniqueJoinCode());
                brandSettingsRepository.save(brand);
            }
        }
        if (!all.isEmpty()) {
            return all.get(0);
        }
        return brandSettingsRepository.save(BrandSettings.builder()
                .name(name)
                .primaryColor(primaryColor)
                .joinCode(generateUniqueJoinCode())
                .build());
    }

    private String normalizeCode(String joinCode) {
        return joinCode == null ? "" : joinCode.trim().toUpperCase();
    }

    private String generateUniqueJoinCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder(JOIN_CODE_LENGTH);
            for (int i = 0; i < JOIN_CODE_LENGTH; i++) {
                sb.append(JOIN_CODE_ALPHABET.charAt(random.nextInt(JOIN_CODE_ALPHABET.length())));
            }
            String candidate = sb.toString();
            if (!brandSettingsRepository.existsByJoinCode(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not generate a unique brand join code — this should be virtually impossible; check JOIN_CODE_ALPHABET/LENGTH.");
    }

    /**
     * Used only by AdminSeeder now — the one admin account still lives on the
     * original seeded "Maamora" brand. There's supposed to be only one row
     * from that seeder, but historical data issues have left duplicate
     * "Maamora" rows in some databases — picking one via an unordered
     * findFirst() risked silently assigning the admin to a "ghost" brand that
     * no one else's data lives on. Instead, pick the row that's actually in
     * use — the one with the most users attached — and break ties by id so
     * every call agrees on the same row.
     */
    public BrandSettings getSharedBrand() {
        List<BrandSettings> brands = brandSettingsRepository.findAll();
        if (brands.isEmpty()) {
            throw new IllegalStateException(
                    "No brand has been seeded yet. Restart the backend so BrandSeeder can create one.");
        }
        if (brands.size() == 1) {
            return brands.get(0);
        }
        return brands.stream()
                .max(Comparator
                        .comparingLong((BrandSettings b) -> userRepository.countByBrand_Id(b.getId()))
                        .thenComparing(BrandSettings::getId))
                .orElseThrow();
    }

    public BrandSettings update(String userId, BrandSettingsRequest request) {
        BrandSettings brand = getForUser(userId);
        if (request.getName() != null) brand.setName(request.getName());
        if (request.getLogoUrl() != null) brand.setLogoUrl(request.getLogoUrl());
        if (request.getPrimaryColor() != null) brand.setPrimaryColor(request.getPrimaryColor());
        if (request.getSecondaryColor() != null) brand.setSecondaryColor(request.getSecondaryColor());
        if (request.getFontFamily() != null) brand.setFontFamily(request.getFontFamily());
        if (request.getToneGuidelines() != null) brand.setToneGuidelines(request.getToneGuidelines());
        brand.setConfigured(true);
        return brandSettingsRepository.save(brand);
    }

    /**
     * Keeps the file and its Brand record in a single server-side operation.
     * A logo is intentionally optional: this path changes no Studio placement
     * preference and neutral compositions remain available.
     */
    public BrandSettings uploadLogo(String userId, MultipartFile file) {
        validateLogo(file);
        BrandSettings brand = getForUser(userId);

        try {
            String contentType = file.getContentType();
            String path = "brand/logos/" + UUID.randomUUID() + extensionOf(file.getOriginalFilename());
            String logoUrl = storageService.upload(file.getBytes(), path, contentType);
            if (logoUrl == null || logoUrl.isBlank()) {
                throw new IllegalStateException("The logo storage provider did not return a usable URL.");
            }
            brand.setLogoUrl(logoUrl);
            brand.setConfigured(true);
            return brandSettingsRepository.save(brand);
        } catch (IOException exception) {
            throw new IllegalArgumentException("The selected logo could not be read.", exception);
        } catch (RuntimeException exception) {
            throw new IllegalStateException("The logo could not be stored. Check storage configuration and try again.", exception);
        }
    }

    private void validateLogo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose a logo image to upload.");
        }
        if (file.getSize() > 15L * 1024L * 1024L) {
            throw new IllegalArgumentException("The logo must be 15 MB or smaller.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new IllegalArgumentException("Choose a PNG, JPG, WebP, or SVG logo.");
        }
    }

    private String extensionOf(String filename) {
        if (filename == null) return ".png";
        int dot = filename.lastIndexOf('.');
        return dot == -1 ? ".png" : filename.substring(dot);
    }
}
