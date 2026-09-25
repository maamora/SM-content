import { apiFetch, apiUpload } from "./client";
import type { UserSummary } from "./users";

export interface BrandSettings {
    id: string;
    name: string;
    // Server-generated at brand creation, not editable — share it with a
    // teammate so they can join this same workspace at registration instead
    // of creating their own separate brand.
    joinCode: string | null;
    // "BUSINESS" (default) or "PERSONAL" — set once at registration, not
    // editable here. Use this to soften "brand kit" language for a personal
    // profile if needed.
    accountType: "BUSINESS" | "PERSONAL";
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    fontFamily: string | null;
    toneGuidelines: string | null;
    // True once the brand has actually filled in its own name/logo/colors
    // beyond the placeholder shell created at signup — see BrandSettings.java
    // for how this gates whether the brand's identity gets applied to
    // generated captions/images.
    configured: boolean;
}

export type BrandSettingsInput = Omit<BrandSettings, "id" | "joinCode" | "accountType" | "configured">;

export const getBrand = () => apiFetch<BrandSettings>("/api/brand");
export const updateBrand = (input: BrandSettingsInput) => apiFetch<BrandSettings>("/api/brand", {
    method: "PUT",
    body: JSON.stringify(input),
});

/**
 * Stores an optional logo and persists its URL in the current Brand workspace
 * in one authenticated operation. This avoids a second client-side save racing
 * a completed multipart request.
 */
export const uploadBrandLogo = (file: File) => apiUpload<BrandSettings>("/api/brand/logo", file);

export interface BrandBan {
    id: string;
    bannedEmail: string;
    bannedName: string | null;
    createdAt: string;
}

// Everyone in the current brand, each with their OWNER/ADMIN/MEMBER standing —
// powers the Settings "Members" section (distinct from listCoworkers, which
// has no moderation actions attached).
export const listMembers = () => apiFetch<UserSummary[]>("/api/brand/members");

export const listBrandBans = () => apiFetch<BrandBan[]>("/api/brand/members/bans");

// Removes a member from the brand; they land on a fresh empty personal
// workspace of their own (their account isn't deleted).
export const kickMember = (userId: string) =>
    apiFetch<void>(`/api/brand/members/${userId}/kick`, { method: "POST" });

// Same as kick, plus the email is blocked from rejoining via join code.
export const banMember = (userId: string) =>
    apiFetch<void>(`/api/brand/members/${userId}/ban`, { method: "POST" });

export const unbanMember = (banId: string) =>
    apiFetch<void>(`/api/brand/members/bans/${banId}`, { method: "DELETE" });

// Owner-only: toggles a member between ADMIN and MEMBER.
export const setMemberAdmin = (userId: string, admin: boolean) =>
    apiFetch<void>(`/api/brand/members/${userId}/admin`, {
        method: "POST",
        body: JSON.stringify({ admin }),
    });

// Permanent — the backend rejects this unless confirmName exactly matches the
// brand's current name, and only the OWNER may call it. Every other member is
// moved to a fresh personal workspace; the owner keeps their account.
export const deleteBrand = (input: { confirmName: string }) =>
    apiFetch<void>("/api/brand/members/delete-brand", {
        method: "POST",
        body: JSON.stringify(input),
    });
