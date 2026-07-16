/**
 * Thin fetch wrapper around the Spring Boot backend.
 *
 * The backend now owns auth, the database, image rendering, and Claude calls
 * (see backend/README.md). This frontend is a pure API client: it never talks
 * to Prisma or a database directly anymore.
 *
 * JWT is kept in localStorage for now (simplest thing that works for a 2-person
 * internal tool). If you want to harden this later, move to an httpOnly cookie
 * set by a Next.js route handler that proxies to the backend, so the token
 * never touches client-side JS.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("maamora_token");
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
