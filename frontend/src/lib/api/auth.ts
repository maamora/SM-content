import { apiFetch, apiUpload, setToken, setRole, clearToken } from "./client";

export interface AuthResponse {
    token: string;
    email: string;
    brandId: string;
    role: string;
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

export async function login(input: { email: string; password: string }) {
    const res = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
    });
    setToken(res.token);
    setRole(res.role);
    return res;
}

export function logout() {
    clearToken();
}
