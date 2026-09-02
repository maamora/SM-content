import { apiFetch, apiUpload, setToken, setRole, clearToken } from "./client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export interface AuthResponse {
    token: string;
    email: string;
    brandId: string;
    role: string;
}

export interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    brandId: string | null;
    role: string;
    createdAt: string | null;
}

// Public endpoint (no auth token exists yet at this point) — see
// SecurityConfig's permitAll for /api/uploads/logo. Uploaded up front on the
// register form, same "upload now, submit the URL later" pattern as product
// photos, so the account is created with the logo already attached.
export const uploadBrandLogo = (file: File) =>
    apiUpload<{ url: string }>("/api/uploads/logo", file);

export async function register(input: {
    name: string;
    email: string;
    password: string;
    // Exactly one signup path applies: brandName (+ optional logoUrl) to
    // create a new brand, joinCode to attach to an existing one, or
    // personal=true for an individual profile with no brand identity at
    // all. See AuthPage's three-way toggle.
    brandName?: string;
    logoUrl?: string;
    joinCode?: string;
    personal?: boolean;
    // Honeypot — always left empty by the real form (see AuthPage). Never
    // shown to or filled by a real user; a non-empty value here is a bot.
    website?: string;
}) {
    const res = await apiFetch<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
    });
    setToken(res.token);
    setRole(res.role);
    return res;
}

export async function login(input: { email: string; password: string; brandIdentifier?: string }) {
    const res = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
    });
    setToken(res.token);
    setRole(res.role);
    return res;
}

export const requestPasswordRecovery = (email: string) => apiFetch<string>("/api/auth/password-recovery", {
    method: "POST",
    body: JSON.stringify({ email }),
});

export const resetPassword = (token: string, password: string) => apiFetch<string>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
});

export function startGoogleAuth() {
    window.location.assign(`${API_BASE_URL}/api/auth/google/start`);
}

export function logout() {
    clearToken();
}

export const getCurrentUser = () => apiFetch<UserProfile>('/api/auth/me');
