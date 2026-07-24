const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// sessionStorage (not localStorage) is deliberate: the session should only
// last as long as the browser tab/window stays open. Closing the browser (or
// restarting the machine) clears it, so the next visit always has to go
// through /login again — page refreshes within the same tab still keep you
// signed in.
export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem("maamora_token");
}

export function isAuthenticated(): boolean {
    return getToken() !== null;
}

export function setToken(token: string) {
    window.sessionStorage.setItem("maamora_token", token);
}

export function clearToken() {
    window.sessionStorage.removeItem("maamora_token");
    window.sessionStorage.removeItem("maamora_role");
    // Also clear any token persisted by an older build that used
    // localStorage, so a stale session can't silently linger.
    window.localStorage.removeItem("maamora_token");
    window.localStorage.removeItem("maamora_role");
}

export function getRole(): string | null {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem("maamora_role");
}

export function setRole(role: string) {
    window.sessionStorage.setItem("maamora_role", role);
}

export function isAdmin(): boolean {
    return getRole() === "ADMIN";
}

// The JWT's payload isn't encrypted, only signed — decoding it client-side to
// read the subject (user id) is safe and avoids a round trip. We never trust
// this for authorization; the backend independently re-verifies the token
// and enforces every permission check server-side.
export function getUserId(): string | null {
    const token = getToken();
    if (!token) return null;
    try {
        const payload = token.split(".")[1];
        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(json).sub ?? null;
    } catch {
        return null;
    }
}

export interface ApiEnvelope<T> {
    success: boolean;
    data: T | null;
    error: string | null;
}

// The backend always replies with our { success, data, error } envelope on
// purpose — but if a request never reaches our code (network drop, backend
// crashed/not started, a proxy/Tomcat error page, an empty 401/403 from
// Spring Security's default handlers, etc.) the body may be empty or plain
// HTML instead of JSON. Calling res.json() directly on that throws a cryptic
// "Unexpected end of JSON input" with no indication of what actually went
// wrong. Read as text first and parse defensively so every caller gets a
// readable error message instead.
async function parseEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
    const text = await res.text();

    if (!text) {
        throw new Error(
            res.ok
                ? "Empty response from server."
                : `Request failed with status ${res.status} ${res.statusText || ""}`.trim()
        );
    }

    try {
        return JSON.parse(text) as ApiEnvelope<T>;
    } catch {
        throw new Error(
            `Server returned an unexpected (non-JSON) response — status ${res.status}. ` +
            `Is the backend running and reachable at ${API_BASE_URL}?`
        );
    }
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });
    } catch {
        throw new Error(`Could not reach the backend at ${API_BASE_URL}. Is it running?`);
    }

    // Binary responses (zip exports) bypass the JSON envelope
    if (res.headers.get("content-type")?.includes("application/octet-stream") ||
        res.headers.get("content-type")?.includes("application/zip")) {
        if (!res.ok) {
            throw new Error(`Request failed: ${res.status}`);
        }
        return (await res.blob()) as unknown as T;
    }

    const body = await parseEnvelope<T>(res);

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

    let res: Response;
    try {
        res = await fetch(`${API_BASE_URL}${path}`, {
            method: "POST",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        });
    } catch {
        throw new Error(`Could not reach the backend at ${API_BASE_URL}. Is it running?`);
    }

    const body = await parseEnvelope<T>(res);

    if (!res.ok || !body.success) {
        throw new Error(body.error ?? `Upload failed: ${res.status}`);
    }

    return body.data as T;
}
