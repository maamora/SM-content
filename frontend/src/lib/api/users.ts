import { apiFetch } from "./client";

export interface UserSummary {
    id: string;
    name: string;
    email: string;
    role: string;
    // Per-brand standing — OWNER / ADMIN / MEMBER. Unrelated to `role`, which
    // is the platform-wide staff/customer flag.
    brandRole: "OWNER" | "ADMIN" | "MEMBER";
    createdAt: string;
}

export const getMe = () => apiFetch<UserSummary>("/api/users/me");

export const updateProfile = (input: { name: string; email: string }) =>
    apiFetch<UserSummary>("/api/users/me", {
        method: "PUT",
        body: JSON.stringify(input),
    });

export const changePassword = (input: { currentPassword: string; newPassword: string }) =>
    apiFetch<void>("/api/users/me/password", {
        method: "PUT",
        body: JSON.stringify(input),
    });

// Permanent — the backend rejects this unless confirmName exactly matches the account's current name.
export const deleteAccount = (input: { confirmName: string }) =>
    apiFetch<void>("/api/users/me", {
        method: "DELETE",
        body: JSON.stringify(input),
    });

// Everyone else sharing your brand — powers the "Coworkers" list on the Settings page.
export const listCoworkers = () => apiFetch<UserSummary[]>("/api/users/coworkers");

// One-time setup for an account with no brand yet (Google sign-up lands here
// instead of the dashboard) — same three-way shape as registration.
export const completeOnboarding = (input: {
    personal?: boolean;
    joinCode?: string;
    brandName?: string;
    logoUrl?: string;
}) => apiFetch<UserSummary>("/api/users/me/onboarding", {
    method: "POST",
    body: JSON.stringify(input),
});
