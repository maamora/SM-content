import { apiFetch, setToken, setRole, clearToken } from "./client";

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

export function logout() {
    clearToken();
}

export const getCurrentUser = () => apiFetch<UserProfile>('/api/auth/me');
