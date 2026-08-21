import { apiFetch } from "./client";

export type SocialPlatform = "INSTAGRAM" | "FACEBOOK" | "TIKTOK" | "WHATSAPP";

export interface SocialAccount {
    id: string;
    platform: SocialPlatform;
    handle: string;
    connectedAt: string;
}

// Brand-scoped (not per-user) — every coworker sees and uses the same
// connected accounts. Manually-entered handles, not real OAuth — there's no
// Instagram/Facebook/TikTok API integration behind this yet.
export const listSocialAccounts = () => apiFetch<SocialAccount[]>("/api/brand/social");

export const connectSocialAccount = (input: { platform: SocialPlatform; handle: string }) =>
    apiFetch<SocialAccount>("/api/brand/social", {
        method: "POST",
        body: JSON.stringify(input),
    });

export const disconnectSocialAccount = (id: string) =>
    apiFetch<void>(`/api/brand/social/${id}`, { method: "DELETE" });
