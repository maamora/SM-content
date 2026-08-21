import { apiFetch } from "./client";

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

export const queueSocialPublish = (input: { postId: string; connectionId: string; scheduledFor?: string | null }) =>
    apiFetch<PublishJob>("/api/social/publish", { method: "POST", body: JSON.stringify(input) });

export const listPublishJobs = () => apiFetch<PublishJob[]>("/api/social/jobs");
