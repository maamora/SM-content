import { apiFetch, clearToken, getUserId, isAuthenticated, setRole, setToken } from "./client";

describe("STUDIO API client", () => {
    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
        globalThis.fetch = jest.fn();
        jest.restoreAllMocks();
    });

    it("stores session state and decodes the JWT subject without trusting it for authorization", () => {
        const payload = btoa(JSON.stringify({ sub: "user-123", role: "USER" }));
        setToken(`header.${payload}.signature`);
        setRole("USER");

        expect(isAuthenticated()).toBe(true);
        expect(getUserId()).toBe("user-123");

        clearToken();
        expect(isAuthenticated()).toBe(false);
        expect(sessionStorage.getItem("maamora_role")).toBeNull();
    });

    it("sends the bearer token and returns the backend envelope data", async () => {
        setToken("test-token");
        const fetchMock = globalThis.fetch as jest.Mock;
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
            headers: { get: () => "application/json" },
            text: async () => JSON.stringify({ success: true, data: { ok: true }, error: null }),
        } as unknown as Response);

        await expect(apiFetch<{ ok: boolean }>("/api/system/capabilities")).resolves.toEqual({ ok: true });
        expect(fetchMock).toHaveBeenCalledWith(
            expect.stringContaining("/api/system/capabilities"),
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
            }),
        );
    });

    it("turns a network failure into the actionable backend message used by the UI", async () => {
        (globalThis.fetch as jest.Mock).mockRejectedValue(new TypeError("network down"));

        await expect(apiFetch("/api/products")).rejects.toThrow(
            "Could not reach the backend at http://localhost:8080. Is it running?",
        );
    });
});
