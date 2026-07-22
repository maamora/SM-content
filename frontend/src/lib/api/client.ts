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
    window.localStorage.removeItem("maamora_role");
}

export function getRole(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("maamora_role");
}

export function setRole(role: string) {
    window.localStorage.setItem("maamora_role", role);
}

export function isAdmin(): boolean {
    return getRole() === "ADMIN";
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

// Multipart upload — deliberately skipped by apiFetch's JSON body handling.
// The browser sets its own Content-Type (with the multipart boundary), so we
// must not override it here the way apiFetch does for JSON requests.
export async function apiUpload<T>(path: string, file: File): Promise<T> {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    const body: ApiEnvelope<T> = await res.json();

    if (!res.ok || !body.success) {
        throw new Error(body.error ?? `Upload failed: ${res.status}`);
    }

    return body.data as T;
}
