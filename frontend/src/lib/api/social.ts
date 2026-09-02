import { apiFetch } from "./client";

// --- Manual social accounts (brand-scoped handle entry) -------------------
// Brand-scoped (not per-user) — every coworker sees and uses the same
// connected accounts. Manually-entered handles, not real OAuth — powers the
// "Linked accounts" section on the Settings page today.
export type SocialPlatform = "INSTAGRAM" | "FACEBOOK" | "TIKTOK" | "WHATSAPP";

export interface SocialAccount {
    id: string;
    platform: SocialPlatform;
    handle: string;
    connectedAt: string;
}

export const listSocialAccounts = () => apiFetch<SocialAccount[]>("/api/brand/social");

export const connectSocialAccount = (input: { platform: SocialPlatform; handle: string }) =>
    apiFetch<SocialAccount>("/api/brand/social", {
        method: "POST",
        body: JSON.stringify(input),
    });

export const disconnectSocialAccount = (id: string) =>
    apiFetch<void>(`/api/brand/social/${id}`, { method: "DELETE" });

// --- OAuth social connections + publish pipeline ---------------------------
// Real provider OAuth (Meta/TikTok/LinkedIn/X) with encrypted token storage
// and a job queue for actually publishing a post out to the connected
// account. Backend is live (SocialController, OAuthStateService,
// SecretCipher) but no UI calls these yet — next step is a "Connect via
// OAuth" flow to replace/augment the manual entry above.
export type SocialProvider = "META" | "TIKTOK" | "LINKEDIN" | "X";

export interface SocialConnection {
    id: string;
    provider: SocialProvider;
    accountName: string | null;
    status: "ACTIVE" | "EXPIRED" | "REVOKED" | "ERROR" | "DISCONNECTED";
    expiresAt: string | null;
    // Only meaningful for META — whether this connection's Facebook Page has
    // an Instagram professional account linked, so "post to Instagram" can
    // only be offered when it's actually possible.
    hasInstagram: boolean;
}

export type MetaTarget = "FACEBOOK_PAGE" | "INSTAGRAM";

export interface PublishJob {
    id: string;
    postId: string;
    connectionId: string;
    provider: SocialProvider;
    metaTarget: MetaTarget | null;
    status: "QUEUED" | "PROCESSING" | "SENT" | "FAILED";
    externalPostId: string | null;
    errorMessage: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    scheduledFor: string | null;
    publishedAt: string | null;
}

export const getSocialConnectUrl = async (provider: SocialProvider) => {
    const response = await apiFetch<{ authorizationUrl: string }>(`/api/social/connect/${provider.toLowerCase()}`);
    return response.authorizationUrl;
};

export const listSocialConnections = () => apiFetch<SocialConnection[]>("/api/social/connections");

export const disconnectSocialConnection = (id: string) =>
    apiFetch<void>(`/api/social/connections/${id}`, { method: "DELETE" });

export const queueSocialPublish = (input: { postId: string; connectionId: string; metaTarget?: MetaTarget }) =>
    apiFetch<PublishJob>("/api/social/publish", { method: "POST", body: JSON.stringify(input) });

export const listPublishJobs = () => apiFetch<PublishJob[]>("/api/social/jobs");
