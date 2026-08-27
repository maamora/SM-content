import { apiFetch } from "./client";

export interface BrandInvitation {
    id: string;
    brandId: string;
    brandName: string;
    brandLogoUrl: string | null;
    invitedEmail: string;
    invitedByName: string | null;
    status: "PENDING" | "ACCEPTED" | "DECLINED";
    createdAt: string;
}

// Send an invite from your own brand — Settings → Team.
export const inviteToBrand = (email: string) =>
    apiFetch<BrandInvitation>("/api/brand/invitations", {
        method: "POST",
        body: JSON.stringify({ email }),
    });

// Invites your brand has sent out, most recent first — Settings → Team.
export const listSentInvitations = () => apiFetch<BrandInvitation[]>("/api/brand/invitations");

// Pending invites addressed to you — Notifications page.
export const listMyInvitations = () => apiFetch<BrandInvitation[]>("/api/invitations/mine");

export const acceptInvitation = (id: string) =>
    apiFetch<BrandInvitation>(`/api/invitations/${id}/accept`, { method: "POST" });

export const declineInvitation = (id: string) =>
    apiFetch<BrandInvitation>(`/api/invitations/${id}/decline`, { method: "POST" });
