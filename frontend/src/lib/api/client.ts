const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("maamora_token");
}

export function isAuthenticated(): boolean {
    return getToken() !== null;
}

export function setToken(token: string) {
    window.localStorage.setItem("maamora_token", token);
}

export function clearToken() {
    window.localStorage.removeItem("maamora_token");
}

export interface ApiEnvelope<T> {
    success: boolean;
    data: T | null;
    error: string | null;
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    // Binary responses (zip exports) bypass the JSON envelope
    if (res.headers.get("content-type")?.includes("application/octet-stream") ||
        res.headers.get("content-type")?.includes("application/zip")) {
        return (await res.blob()) as unknown as T;
    }

    const body: ApiEnvelope<T> = await res.json();

    if (!res.ok || !body.success) {
        throw new Error(body.error ?? `Request failed: ${res.status}`);
    }

    return body.data as T;
}
