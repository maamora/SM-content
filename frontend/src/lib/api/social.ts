import { apiFetch } from "./client";

<<<<<<< HEAD
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
=======
export type SocialProvider = "META" | "TIKTOK" | "LINKEDIN" | "X";

export interface SocialConnection {
    id: string;
    provider: SocialProvider;
    accountName: string | null;
    status: "ACTIVE" | "EXPIRED" | "REVOKED" | "ERROR" | "DISCONNECTED";
    expiresAt: string | null;
}

export interface PublishJob {
    id: string;
    postId: string;
    connectionId: string;
    provider: SocialProvider;
    status: "QUEUED" | "PROCESSING" | "SENT" | "FAILED";
    externalPostId: string | null;
    errorMessage: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    publishedAt: string | null;
}

export const getSocialConnectUrl = async (provider: SocialProvider) => {
    const response = await apiFetch<{ authorizationUrl: string }>(`/api/social/connect/${provider.toLowerCase()}`);
    return response.authorizationUrl;
};

export const listSocialConnections = () => apiFetch<SocialConnection[]>("/api/social/connections");

export const disconnectSocialConnection = (id: string) =>
    apiFetch<void>(`/api/social/connections/${id}`, { method: "DELETE" });

export const queueSocialPublish = (input: { postId: string; connectionId: string }) =>
    apiFetch<PublishJob>("/api/social/publish", { method: "POST", body: JSON.stringify(input) });

export const listPublishJobs = () => apiFetch<PublishJob[]>("/api/social/jobs");
>>>>>>> 0aaa1cfa406c946d0887dbeaa5c9c2676e5da0aa
