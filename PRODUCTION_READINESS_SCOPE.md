# STUDIO Production Readiness Scope

This document defines the production boundary for the current STUDIO application. The application uses the existing Next.js frontend, Spring Boot API, PostgreSQL database, and provider-optional rendering/caption services. The goal is to make every supported flow reliable and explicit rather than presenting placeholder screens as if an external capability were already operational.

## Provider policy

STUDIO does not add a paid MCP, connector, or hosted AI service by default. There is no third-party AI, social-network, email, or storage provider that can honestly be guaranteed to be both free and unlimited while also providing production-grade quality and availability. The implementation therefore keeps provider integrations optional and configuration-driven.

| Capability | Default behavior | Production configuration |
| --- | --- | --- |
| Image rendering | Deterministic Java2D fallback using the uploaded product image and brand overlays | Optional Stability-compatible image provider through `STABILITY_API_KEY`; the fallback remains available for local and no-key environments. |
| Caption generation | Provider-backed generation when configured; explicit error when the provider is unavailable | `GEMINI_API_KEY` and model settings. A user-owned key is subject to that provider's quota and terms. |
| File storage | Cloudinary implementation when configured | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`; local disk can be enabled for development. |
| Social publishing | No fabricated external publishing | Requires real per-network OAuth/API credentials and platform review. Until configured, the UI must show a clear unavailable state and offer export. |
| Email verification and password reset | Not silently simulated | Requires an SMTP or transactional email provider configured by the operator. |
| Background jobs | Spring asynchronous processing with persisted status | Production deployments should run one or more durable application instances with PostgreSQL; external queues are optional, not assumed. |

## Supported production flows

The supported baseline includes registration, login, JWT-protected API access, product CRUD, product approval/rejection, brand settings, template listing, image upload, creative generation, multilingual caption generation, post approval, post export, post deletion, batch generation, and live workspace data loading. These flows must preserve workspace scoping, input validation, safe error responses, and observable processing states.

## Explicitly configuration-limited flows

External social publishing, transactional email, third-party OAuth, and provider-specific AI generation cannot be made fully operational without credentials belonging to the operator. STUDIO should not claim that these are live when the required credentials are absent. The application must expose their configuration state, provide a useful setup message, and preserve a local export path.

## Acceptance criteria

1. Protected endpoints return `401 Unauthorized` for missing or invalid credentials and do not expose exception details.
2. Admin-only actions enforce the `ADMIN` role server-side.
3. Request bodies and multipart uploads are validated before persistence or provider calls.
4. All supported product, post, brand, upload, batch, and export flows return stable JSON envelopes and actionable errors.
5. Batch jobs persist terminal failure state and cannot remain indefinitely in `PROCESSING` after an unhandled failure.
6. The frontend shows provider-unavailable and backend-unavailable states without fabricated records.
7. PostgreSQL migrations and local setup documentation remain compatible with Supabase PostgreSQL.
8. TypeScript, lint, backend tests, production builds, and route smoke checks pass before release.
