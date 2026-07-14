/**
 * @file auth.api.test.ts
 * @description Mock API tests for the NextAuth route handler.
 *
 * Strategy:
 *   - Mock the `@/auth` module to return controlled handlers.
 *   - Import the route handler and verify GET / POST are correctly exported.
 *   - Simulate authenticated and unauthenticated requests using
 *     the Web Request/Response API (available in Node 18+).
 *   - Handlers are typed as `any` in tests because NextRequest requires
 *     the full Next.js runtime not available in Jest/Node.
 *
 * Covers:
 *   - Route correctly re-exports GET and POST handlers from @/auth
 *   - GET handler is called with the incoming request
 *   - POST handler is called with sign-in requests
 *   - 401 is propagated for invalid session tokens
 *   - 302 redirect is propagated for magic-link callbacks
 */

// ─── Module Mocks ─────────────────────────────────────────────────────────────

const mockGetHandler = jest.fn();
const mockPostHandler = jest.fn();

jest.mock("@/auth", () => ({
    handlers: {
        GET: mockGetHandler,
        POST: mockPostHandler,
    },
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { GET, POST } from "@/app/api/auth/[...nextauth]/route";

// ─── Helper: create a minimal request compatible with our mock handler ─────────
// We cast to `any` to avoid the NextRequest vs Request type mismatch in test env.
function makeRequest(url: string, method: "GET" | "POST" = "GET", body?: object): any {
    return new Request(url, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: body ? { "Content-Type": "application/json" } : undefined,
    }) as any;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Auth API Route – Mock API Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── Route Export Integrity ─────────────────────────────────────────────────
    describe("route export integrity", () => {
        it("exports a GET handler", () => {
            expect(GET).toBeDefined();
            expect(typeof GET).toBe("function");
        });

        it("exports a POST handler", () => {
            expect(POST).toBeDefined();
            expect(typeof POST).toBe("function");
        });

        it("GET is the handler re-exported from @/auth", () => {
            expect(GET).toBe(mockGetHandler);
        });

        it("POST is the handler re-exported from @/auth", () => {
            expect(POST).toBe(mockPostHandler);
        });
    });

    // ── GET request handling ───────────────────────────────────────────────────
    describe("GET /api/auth/[...nextauth]", () => {
        it("calls the GET handler with the incoming request", async () => {
            const request = makeRequest("http://localhost/api/auth/signin");
            const mockResponse = new Response(JSON.stringify({ url: "/api/auth/signin" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
            mockGetHandler.mockResolvedValueOnce(mockResponse);

            const response = await GET(request);

            expect(mockGetHandler).toHaveBeenCalledWith(request);
            expect(response.status).toBe(200);
        });

        it("propagates a 401 response for an invalid session token", async () => {
            const request = makeRequest("http://localhost/api/auth/session");
            mockGetHandler.mockResolvedValueOnce(new Response(null, { status: 401 }));

            const response = await GET(request);

            expect(response.status).toBe(401);
        });

        it("propagates a 302 redirect for magic-link sign-in callback", async () => {
            const request = makeRequest(
                "http://localhost/api/auth/callback/nodemailer?token=abc"
            );
            mockGetHandler.mockResolvedValueOnce(
                new Response(null, { status: 302, headers: { Location: "/" } })
            );

            const response = await GET(request);

            expect(response.status).toBe(302);
            expect(response.headers.get("Location")).toBe("/");
        });

        it("uses the GET handler (not POST) for sign-in page render", async () => {
            const request = makeRequest("http://localhost/api/auth/signin");
            mockGetHandler.mockResolvedValueOnce(
                new Response("<html>Sign In</html>", {
                    status: 200,
                    headers: { "Content-Type": "text/html" },
                })
            );

            await GET(request);

            expect(mockGetHandler).toHaveBeenCalledTimes(1);
            expect(mockPostHandler).not.toHaveBeenCalled();
        });
    });

    // ── POST request handling ──────────────────────────────────────────────────
    describe("POST /api/auth/[...nextauth]", () => {
        it("calls the POST handler when a sign-in request is made", async () => {
            const request = makeRequest("http://localhost/api/auth/signin/nodemailer", "POST", {
                email: "user@example.com",
                csrfToken: "csrf-abc",
            });
            mockPostHandler.mockResolvedValueOnce(new Response(null, { status: 200 }));

            const response = await POST(request);

            expect(mockPostHandler).toHaveBeenCalledWith(request);
            expect(response.status).toBe(200);
        });

        it("returns a 200 with session JSON for a valid session request", async () => {
            const request = makeRequest("http://localhost/api/auth/session", "POST");
            const sessionPayload = {
                user: { id: "uid-001", email: "user@example.com" },
                expires: new Date(Date.now() + 86400000).toISOString(),
            };
            mockPostHandler.mockResolvedValueOnce(
                new Response(JSON.stringify(sessionPayload), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                })
            );

            const response = await POST(request);
            const body = await response.json();

            expect(response.status).toBe(200);
            expect(body.user.email).toBe("user@example.com");
        });

        it("uses the POST handler (not GET) for sign-in submission", async () => {
            const request = makeRequest("http://localhost/api/auth/signin/nodemailer", "POST", {
                email: "test@test.com",
                csrfToken: "token",
            });
            mockPostHandler.mockResolvedValueOnce(new Response(null, { status: 200 }));

            await POST(request);

            expect(mockPostHandler).toHaveBeenCalledTimes(1);
            expect(mockGetHandler).not.toHaveBeenCalled();
        });

        it("propagates a sign-out 200 response from POST", async () => {
            const request = makeRequest("http://localhost/api/auth/signout", "POST");
            mockPostHandler.mockResolvedValueOnce(new Response(null, { status: 200 }));

            const response = await POST(request);

            expect(response.status).toBe(200);
        });
    });
});
