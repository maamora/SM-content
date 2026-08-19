package com.maamora.studio.model.enums;

/**
 * What kind of workspace a BrandSettings row represents. BUSINESS is a
 * brand someone registered with a name (+ optional logo) — the default,
 * original flow. PERSONAL is an individual posting to their own profile
 * rather than representing a company; it reuses the exact same
 * product/post/generation pipeline as a business brand (same table, same
 * services), just auto-created from the user's own name with no brand
 * name/logo step at signup, and the frontend can use this flag to soften
 * "brand kit" language for that kind of account.
 */
public enum AccountType {
    BUSINESS,
    PERSONAL
}
