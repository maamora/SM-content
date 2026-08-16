# STUDIO production handoff

**Author:** Manus AI  
**Date:** 2026-08-16

## Executive status

The current `main` checkout is a verified baseline for the implemented STUDIO application surface. The Spring Boot backend uses PostgreSQL, JWT authentication, managed image-generation providers, local or Cloudinary-backed storage, and SMTP delivery. The Next.js frontend has a production build that completes successfully, and the backend test suite now includes deterministic fal.ai and Gemini/Veo adapter coverage without making external provider calls.

The application deliberately reports provider-dependent features as unavailable when credentials or provider access are missing. This is preferable to presenting fabricated output or silently falling back to an unreliable provider. Social OAuth and publishing remain configuration- and route-boundary work rather than features that should be treated as complete merely because client credentials exist.

## Provider configuration

Use `backend/.env.example` as the variable-name source of truth. Copy it to `backend/.env`; never commit the resulting file and never place provider secrets in `NEXT_PUBLIC_*` variables.

| Capability | Recommended variables | Behavior when absent |
| --- | --- | --- |
| Image generation | `IMAGE_PROVIDER=fal`, `FAL_KEY`, `FAL_IMAGE_MODEL=fal-ai/flux-pro/kontext` | Image generation and editing report unavailable. |
| Captions | `GEMINI_API_KEY`, `GEMINI_MODEL` | Caption generation reports unavailable unless the optional Ollama path is intentionally enabled. |
| Video | `GEMINI_API_KEY`, `GEMINI_VIDEO_MODEL=veo-3.1-generate-preview` | Video generation reports unavailable. Veo access and billing/model enablement are controlled by Google. |
| SMTP | `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`, `APP_MAIL_FROM` | Email delivery records fail explicitly instead of claiming delivery. |
| Cloud storage | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Local storage remains available; cloud-storage capability reports false. |

The fal.ai adapter uses the FLUX.1 Kontext endpoint and accepts at most one reference image per request. A product image and a model image cannot be passed as two independent references to the current adapter; use a composite reference or treat the two-stage product-plus-model workflow as a future provider enhancement. The backend intentionally returns an explicit error for more than one reference rather than dropping one of the inputs.

The Gemini/Veo adapter submits a long-running operation, polls until completion or timeout, then downloads the returned video. The automated test suite mocks each of these phases. A passing test proves the adapter contract and lifecycle; it does not prove that a particular Google account has Veo access.

## MailerSend SMTP

For MailerSend’s SMTP relay, use the SMTP host and port shown in the MailerSend SMTP setup screen. In the common MailerSend configuration, the host is `smtp.mailersend.net` and the port is `587`; use the SMTP username and SMTP password/token generated for SMTP, not an unrelated REST API token unless MailerSend explicitly identifies it as an SMTP credential. Set `APP_MAIL_FROM` to a sender address that MailerSend permits for the account. A custom domain is recommended for production deliverability, but the sender must still satisfy MailerSend’s verification rules.

After restarting Spring Boot, check:

```powershell
Invoke-RestMethod http://localhost:8080/api/system/capabilities | ConvertTo-Json -Depth 10
```

The expected fields are `smtpEmail: true`, `emailDelivery: true`, and `imageGeneration: true` only when the corresponding provider credentials are valid and the application can establish the required configuration. Capability flags are configuration indicators; the real SMTP smoke test is sending a message to a controlled mailbox and confirming receipt.

## Windows production-like launch

Open PowerShell in the repository root and pull the latest committed version:

```powershell
git fetch origin
git switch -C main origin/main
```

If PowerShell says that a local file would be overwritten, move that file outside the repository or delete it only if it is disposable. Do not use `git reset --hard` on a working directory containing user work.

Create the backend environment file and fill in the real values:

```powershell
Copy-Item .\backend\.env.example .\backend\.env
notepad .\backend\.env
```

Start the backend. PowerShell requires the explicit relative path for the Maven wrapper:

```powershell
cd .\backend
.\mvnw.cmd spring-boot:run
```

In a second PowerShell window, install and build the frontend:

```powershell
cd D:\School\Stage\STUDIO\frontend
pnpm install --frozen-lockfile
Set-Content .env.local 'NEXT_PUBLIC_API_BASE_URL=http://localhost:8080'
pnpm build
pnpm exec next start --hostname 0.0.0.0 --port 3001
```

Open `http://localhost:3001`. The frontend should use `http://localhost:8080` for API calls. In production, replace the local CORS and frontend URLs with the exact deployed origins.

## Automated validation

Run the backend checks from `backend`:

```powershell
.\mvnw.cmd test
```

The current backend suite covers three fal.ai adapter cases, two deterministic Gemini/Veo adapter cases, and four Spring Boot readiness tests. The Gemini tests use mocked operation polling and therefore do not consume provider quota or wait for a real API key.

Run the frontend checks from `frontend`:

```powershell
pnpm exec tsc --noEmit
pnpm run lint
pnpm exec jest --runInBand
pnpm build
```

ESLint may report non-blocking warnings for native image elements and React Hook Form’s `watch()` API. These are warnings, not build failures. The production build must finish with all expected routes generated.

## OAuth callback registration

Use the exact callback URLs below in the respective developer portals. OAuth providers commonly require exact redirect-URI matching, including scheme, hostname, port, path, and sometimes trailing slash. Meta’s documentation also recommends a `state` value for CSRF protection and keeping app secrets server-side [1]. Instagram’s authorization documentation requires an exact valid OAuth URI and the `code` response type [2]. TikTok’s Login Kit documentation is the provider reference for its web redirect registration [3]. LinkedIn’s current OIDC flow uses `openid`, `profile`, and `email` scopes and may require enabling the Sign In with LinkedIn using OpenID Connect product [4].

| Provider | Local callback | Environment variables |
| --- | --- | --- |
| Meta / Instagram / Facebook Pages | `http://localhost:8080/api/social/callback/meta` | `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` |
| TikTok | `http://localhost:8080/api/social/callback/tiktok` | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` |
| LinkedIn | `http://localhost:8080/api/social/callback/linkedin` | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` |
| X | `http://localhost:8080/api/social/callback/x` | `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI` |

For Meta, create or open the app in Meta for Developers, add the relevant Facebook Login or Instagram product, and register the callback under the product’s OAuth settings. Request only the permissions justified by the specific publishing workflow and complete Meta review where required. For TikTok, create a web Login Kit application, register the callback, and request the scopes required by the approved Content Posting API workflow. For LinkedIn, request the appropriate product and register the callback in the Auth tab; use the OIDC scopes only for identity and add publishing products/scopes separately if the account is approved for them. For X, create the application in the X Developer Portal, select OAuth 2.0 where supported by the intended API, and register the callback exactly as configured.

Set `TOKEN_CIPHER_KEY` to a strong random value with the length required by the backend before enabling social connections. Do not reuse the JWT secret. Restart Spring Boot after changing any provider variables, then inspect `/api/system/capabilities`. A `true` OAuth capability means the client credentials are present; it is not a substitute for completing provider review, verifying a real account connection, or confirming a real publishing request.

## Implemented boundary

The verified backend surface includes registration and login, product persistence, brand settings, posts, templates, uploads, JWT authorization, managed-provider adapters, SMTP delivery state tracking, and the corresponding frontend workspace surfaces. The broader product brief still includes areas that require additional backend work or provider approval, including complete social connection/publishing flows, calendar persistence, notifications, analytics, audit logs, advanced generation monitoring, and administrative user/workspace management. Those surfaces must remain visibly unavailable until their API contracts and authorization behavior are implemented.

Do not use fabricated reviews, ratings, testimonials, or engagement metrics as placeholders. Use empty states that explain what is unavailable and why.

## References

[1]: https://developers.facebook.com/documentation/facebook-login/guides/advanced/manual-flow "Meta for Developers — Manually Build a Login Flow"

[2]: https://developers.facebook.com/documentation/instagram-platform/reference/oauth-authorize "Meta for Developers — Instagram OAuth Authorize"

[3]: https://developers.tiktok.com/doc/login-kit-web/ "TikTok for Developers — Login Kit for Web"

[4]: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2 "Microsoft Learn — Sign In with LinkedIn using OpenID Connect"
