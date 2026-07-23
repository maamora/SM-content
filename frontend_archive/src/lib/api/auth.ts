import { apiFetch, setToken, clearToken } from "./client";

export interface AuthResponse {
    token: string;
    email: string;
    brandId: string;
}

export async function register(input: { name: string; email: string; password: string; brandName: string }) {
    const res = await apiFetch<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
    });
    setToken(res.token);
    return res;
}

export async function login(input: { email: string; password: string }) {
    const res = await apiFetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
    });
    setToken(res.token);
    return res;
}

export function logout() {
    clearToken();
}
