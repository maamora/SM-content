import { apiFetch, setToken, setRole, clearToken } from "./client";

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

export async function register(input: { name: string; email: string; password: string }) {
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
