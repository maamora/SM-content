# STUDIO local development guide

> Studio workflow note: the authenticated Studio page submits the selected product, template, prompt, and references through the managed image provider. After a visual is created, it automatically requests captions and keeps the visual visible if Gemini is temporarily unavailable. Configure a real fallback provider before expecting failover from Cloudflare capacity errors.


This guide explains how to run the merged STUDIO application locally. The repository contains a **Next.js 16 frontend**, a **Spring Boot 3.3 backend**, and a **PostgreSQL database**. The browser talks to Spring Boot over HTTP; Spring Boot owns authentication, authorization, persistence, product workflows, brand settings, posts, templates, uploads, and the integration boundary for future AI and publishing providers.

> **Important scope note:** The current branch has been hardened for the implemented backend surface and the live frontend integration. Some provider-dependent capabilities still require operator credentials, and audit-log persistence plus destructive user/workspace administration are intentionally not exposed until their dedicated schema and authorization workflows exist.

## 1. Prerequisites

Install the following tools before starting:

| Tool | Supported local baseline | Purpose |
| --- | --- | --- |
| Java | JDK 17 or newer | Compiling and running Spring Boot |
| PostgreSQL | PostgreSQL 16 recommended | Persistent application data |
| Node.js | Node 20 or newer | Running Next.js and TypeScript tooling |
| pnpm | Current pnpm version | Installing frontend dependencies |
| Git | Current version | Cloning and switching branches |

The backend Maven wrapper is present, but this checkout may not mark it executable. Use `bash mvnw ...` when in doubt. Verify the toolchain with:

```bash
java -version
node --version
pnpm --version
psql --version
```

## 2. Clone the repository and select main

```bash
git clone https://github.com/joki12/STUDIO.git
cd STUDIO
git checkout main
git pull --ff-only origin main
```

The merged application lives in `frontend/` and `backend/`:

```text
STUDIO/
├── backend/     Spring Boot API and PostgreSQL persistence
├── frontend/    Next.js App Router application
├── backend-api-inventory.md
├── backend/PERSISTENCE.md
└── LOCAL_DEVELOPMENT.md
```

## 3. Create the local PostgreSQL database

Start PostgreSQL first. On Ubuntu with PostgreSQL 16:

```bash
sudo systemctl enable --now postgresql
pg_isready -h 127.0.0.1 -p 5432
```

Create the application role and database once. These commands do not drop or reset existing data:

```bash
sudo -u postgres psql <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'maamora') THEN
    CREATE ROLE maamora LOGIN PASSWORD 'maamora';
  END IF;
END
$$;

SELECT 'CREATE DATABASE maamora_studio OWNER maamora'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'maamora_studio')\gexec

ALTER ROLE maamora SET client_encoding TO 'UTF8';
SQL
```

The local defaults are:

| Setting | Value |
| --- | --- |
| Host | `localhost` |
| Port | `5432` |
| Database | `maamora_studio` |
| Role | `maamora` |
| Password | `maamora` for local development only |
| TLS | Disabled locally; use `require` for hosted PostgreSQL when needed |

The PostgreSQL data directory is managed by the PostgreSQL service, not by the Next.js or Spring Boot process. Stopping and restarting Spring Boot does not remove rows. Back up production data using the managed PostgreSQL provider's backup tooling; do not rely on this local development database as a production backup.

## 4. Configure and launch Spring Boot

Create the backend environment file from the checked-in template. The real `.env`
is ignored by Git and stays on your computer:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set at least a long random JWT secret and the provider keys needed by the features you intend to use. The local database values can remain as shown below:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maamora_studio
DB_USERNAME=maamora
DB_PASSWORD=maamora
DB_SSL_MODE=disable

# Use a long random value in every non-throwaway environment.
JWT_SECRET=replace-this-with-a-long-random-secret-at-least-32-characters
JWT_EXPIRATION_MS=86400000

# Cloudflare Workers AI FLUX.2 [dev] is the active image provider.
# Keep the token server-side and never commit backend/.env.
IMAGE_PROVIDER=cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_AI_BASE_URL=https://api.cloudflare.com/client/v4
CLOUDFLARE_AI_MODEL=@cf/black-forest-labs/flux-2-dev
CLOUDFLARE_AI_STEPS=25
CLOUDFLARE_AI_GUIDANCE=4.0
CLOUDFLARE_AI_POLL_INTERVAL_MS=3000
CLOUDFLARE_AI_RETRY_ATTEMPTS=3
CLOUDFLARE_AI_RETRY_BACKOFF_MS=1500
CLOUDFLARE_AI_TIMEOUT_MS=180000

# Cloudflare HTTP 429/code 3040 responses indicate temporary capacity exhaustion.
# STUDIO retries with bounded exponential backoff, then returns a retryable error.
# Optional configured fallback after a retryable Cloudflare failure:
# IMAGE_FALLBACK_PROVIDER=deapi
# DEAPI_API_KEY=

# Optional DeAPI alternative. To use it, replace IMAGE_PROVIDER=cloudflare with
# IMAGE_PROVIDER=deapi and configure the variables below.
# DEAPI_API_KEY=
# DEAPI_BASE_URL=https://api.deapi.ai
# DEAPI_IMAGE_MODEL=Flux1schnell
# DEAPI_EDIT_MODEL=QwenImageEdit_Plus_NF4
# DEAPI_STEPS=4
# DEAPI_GUIDANCE=7.5
# DEAPI_POLL_INTERVAL_MS=3000
# DEAPI_TIMEOUT_MS=180000

# Gemini is the active caption provider. Keep caption and video keys separate.
CAPTION_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_CAPTION_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
# Optional video-only settings:
# GEMINI_VIDEO_API_KEY=
# GEMINI_VIDEO_MODEL=veo-3.1-generate-preview

# Optional provider alternatives.
ANTHROPIC_API_KEY=

# Local caption fallback. Install Ollama and pull the model before enabling it.
OLLAMA_ENABLED=false
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_BASE_URL=http://localhost:11434/api

# Higgsfield image generation. Keep both credentials server-side.
# HIGGSFIELD_API_KEY_ID=
# HIGGSFIELD_API_KEY_SECRET=
# HIGGSFIELD_MODEL=flux-pro/kontext/max/text-to-image
# HIGGSFIELD_TIMEOUT_MS=180000
# HIGGSFIELD_POLL_INTERVAL_MS=3000

STORAGE_LOCAL_PATH=./uploads
STORAGE_PUBLIC_BASE_URL=http://localhost:8080/files

# Any local Next.js port is allowed; use explicit deployed origins in production.
CORS_ALLOWED_ORIGINS=http://localhost:*,http://127.0.0.1:*
FRONTEND_URL=http://localhost:3001

ADMIN_EMAIL=admin@maamora.com
ADMIN_PASSWORD=admin123
```

Do not commit `backend/.env`, real API keys, database passwords, or JWT secrets. For production, use the hosting platform's secret manager and set `DB_SSL_MODE=require` when the database provider requires TLS. Cloudinary values are optional for local flows that do not upload to Cloudinary; the backend also supports its configured local upload path.

Start the backend in a terminal that remains open:

```bash
cd backend
bash mvnw spring-boot:run
```

In Windows PowerShell, run the wrapper from the current directory using the
explicit command below; PowerShell does not execute files from the current
directory when they are invoked by name alone:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

If startup stops with `Duplicate key IMAGE_PROVIDER`, the backend `.env`
contains that key more than once. Dotenv refuses to merge duplicate keys, so open `backend/.env`, keep exactly one `IMAGE_PROVIDER` line, and remove obsolete provider entries. For the current configuration, keep:

```dotenv
IMAGE_PROVIDER=cloudflare
CAPTION_PROVIDER=gemini
CLOUDFLARE_AI_MODEL=@cf/black-forest-labs/flux-2-dev
GEMINI_MODEL=gemini-2.5-flash

```


You can locate all provider entries without displaying secret values with:

```powershell
Select-String -Path .\.env -Pattern '^(IMAGE_PROVIDER|CAPTION_PROVIDER|GEMINI_API_KEY|GEMINI_CAPTION_API_KEY|GEMINI_VIDEO_API_KEY|OPENROUTER_IMAGE_MODEL|GROQ_MODEL)='
```

Alternatively, use the committed Windows helper. It performs a local preflight without printing secret values, detects duplicate keys such as
`HIGGSFIELD_MODEL`, rejects accidental `SPRING_DATASOURCE_*` overrides, and
checks the Supabase pooler username format before starting Spring Boot:

```powershell
cd backend
Set-ExecutionPolicy -Scope Process Bypass
.\Start-StudioBackend.ps1
```

### Supabase Session pooler configuration

For an IPv4 local Windows development machine, use the **Session pooler**
connection string from Supabase Dashboard → **Connect**. Its host ends in
`.pooler.supabase.com`, its port is `5432`, and its username includes the
project reference in the form `postgres.[project-ref]`. The password is the
current database password, not a Supabase publishable, secret, anon, or service
API key. Use this shape, substituting your provider’s actual values locally:

```dotenv
DB_HOST=aws-[region].pooler.supabase.com
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres.[project-ref]
DB_PASSWORD=your-current-supabase-database-password
DB_SSL_MODE=require
```

Do not add `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, or
`SPRING_DATASOURCE_PASSWORD`; STUDIO already derives its datasource from the
six `DB_*` variables. Keep exactly one entry for every key, including
`IMAGE_PROVIDER`, `CAPTION_PROVIDER`, and the Cloudflare/Gemini provider
variables. Duplicate keys are rejected before Spring Boot initializes.

The API should become available at `http://localhost:8080`. Cloudflare Workers AI FLUX.2 [dev] uses a multipart inference request and supports up to four `input_image_N` references, each resized below 512px before submission. Product-plus-model shoots send the product and model references together. Gemini captions use the GenerateContent endpoint and validate `candidates[].content.parts[].text`; blocked, malformed, or empty responses are treated as provider failures rather than returned to the frontend as blank captions.

The backend applies missing JPA schema objects with `ddl-auto: update`; this preserves existing rows while adding schema changes. Never use `create` or `create-drop` against a database containing real data.

Useful backend checks:

```bash
pg_isready -h 127.0.0.1 -p 5432
curl -i http://localhost:8080/api/auth/login
bash mvnw test
```

The login endpoint is a `POST` endpoint, so a browser visit or a `GET` request may return a method error; that does not mean the service is down. A valid local login request is:

```bash
curl -sS -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@maamora.com","password":"admin123"}'
```

## 5. Configure and launch Next.js

Open a second terminal from the repository root:

```bash
cd frontend
pnpm install
```

The client defaults to `http://localhost:8080`. To make that explicit, create `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Start Next.js on port 3001. The backend's local CORS defaults accept localhost and
127.0.0.1 on any port, so Next.js may also move to another local port if 3001 is busy:

```bash
pnpm exec next dev --hostname 0.0.0.0 --port 3001
```

Open [http://localhost:3001](http://localhost:3001), or the port shown by the Next.js terminal. The Next.js configuration also allows the loopback origin spelling `127.0.0.1`. Keep the frontend and backend terminals running at the same time.

Frontend checks:

```bash
npx tsc --noEmit
pnpm lint
pnpm test
pnpm build
```

The build script explicitly sets `NODE_ENV=production` before invoking Next.js. This matters in development environments that export `NODE_ENV=development`; leaving that non-standard value in place can make Next.js prerender the error routes with the wrong runtime mode and produce `Cannot read properties of null (reading 'useContext')` for `/_global-error` or `/_not-found`. The custom error pages are also intentionally self-contained: `global-error.tsx` is a client component and both utility pages use plain anchors rather than relying on App Router context.

## 6. First-use flow

Start at `/login`. The seeded local admin account is `admin@maamora.com` with password `admin123`, unless you override `ADMIN_EMAIL` and `ADMIN_PASSWORD` before the first backend startup. Change or replace this credential before sharing the environment.

After login, the frontend stores the signed session token in `sessionStorage`, which means a refresh within the same tab retains the session, while closing the tab or browser requires signing in again. The backend remains the source of truth for authorization; the client-side role value is only used to shape navigation and never replaces server-side permission checks.

The main verified live flow is:

```text
Login
  → Dashboard
  → Products: read the PostgreSQL-backed catalogue
  → Brand: read and update persisted brand settings
  → Studio: use approved products, templates, brand data, and post APIs
  → Posts: review/export/delete available post records
```

The backend enforces protected resource access with the JWT sent in the `Authorization: Bearer <token>` header. The frontend API wrapper automatically attaches that header to authenticated requests and redirects to `/login` when a protected request returns 401 or 403.

## 7. What is currently live versus unavailable

The following backend-backed areas were rechecked after the merge preparation:

| Area | Current state |
| --- | --- |
| Registration and login | Live; login was verified against PostgreSQL |
| Product list/create/update/delete | Live API surface and frontend integration |
| Product approvals and pending products | Live API surface and frontend integration |
| Brand settings | Live read/update flow; persisted across backend restart |
| Posts | Live list/create/update/delete/export API surface |
| Templates | Live list API surface |
| Upload endpoint | Present; requires valid multipart files and storage configuration |
| `/api/auth/me` | Live; returns the authenticated profile from the JWT identity |
| Calendar and notifications | Live derived views from persisted post/product status; no fabricated records are created |
| Capability readiness | Live at `/api/system/capabilities`; reports configured image, caption, storage, social, and email boundaries without exposing secrets |
| Admin summary | Live at `/api/admin/summary`; admin-only persisted counts for users, workspaces, products, posts, templates, and pending review |
| Publishing integrations | Provider-dependent; export remains available, while social publishing reports `SETUP` until real credentials are configured |
| Audit logs | Explicitly not enabled; the UI does not invent audit entries or expose compliance controls without append-only persistence |
| Admin users/workspaces | Read-only live counts are available; mutation and role-management routes are intentionally absent until audited workflows are added |

The complete endpoint inventory and availability boundary is documented in `backend-api-inventory.md`. The screens for unavailable areas are intentionally explicit; they do not pretend that missing backend records are persisted.

## 8. Troubleshooting

### Backend cannot connect to PostgreSQL

Run `pg_isready -h 127.0.0.1 -p 5432`, confirm the PostgreSQL service is running, and verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD` in `backend/.env`. If the role or database was not created, rerun the non-destructive provisioning commands in section 3.

### Frontend reports that the backend cannot be reached

The message is produced by the browser `fetch` layer when the request is blocked before the frontend receives a normal HTTP response. The Spring Boot log showing `Tomcat started on port 8080` confirms that the backend process itself is running. First confirm that `http://localhost:8080/actuator/health` responds, then check the browser's actual frontend URL and the browser console for a CORS or mixed-content message.

The backend now uses Spring's origin-pattern support and accepts local origins such as `http://localhost:3000`, `http://localhost:3001`, `http://localhost:3002`, and their `127.0.0.1` equivalents by default. If `CORS_ALLOWED_ORIGINS` is set explicitly in the PowerShell session or `backend/.env`, use:

```powershell
$env:CORS_ALLOWED_ORIGINS = "http://localhost:*,http://127.0.0.1:*"
```

Restart Spring Boot after changing that variable. Also confirm that `frontend/.env.local` contains `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`, then restart Next.js because public environment variables are read when the dev server starts. If the frontend and backend run on different machines, replace `localhost` with the backend machine's LAN address and add the frontend's exact origin to `CORS_ALLOWED_ORIGINS` instead of using the local wildcard.

### Browser login returns 403 from one local origin

Use the exact URL printed by Next.js. For local development, `http://localhost:<port>` and `http://127.0.0.1:<port>` are accepted by the default wildcard configuration. If you change the backend environment file, restart Spring Boot. If you change `next.config.ts`, restart Next.js.

### The dashboard shows 403 after reopening the page

The current client session is intentionally stored in `sessionStorage`. A new browser context has no token, so sign in again. This is expected behavior, not evidence that PostgreSQL data disappeared.

### AI or upload operations fail while basic pages work

Basic authentication, products, brand, posts, and templates do not prove that external AI providers or Cloudinary are configured. Supply real provider credentials, verify network access, and check the Spring Boot logs. Never put provider secrets in `NEXT_PUBLIC_*` variables.

### Configure local Ollama captions

Ollama is the selected free and unlimited caption alternative because inference runs on your own machine. It has no hosted request quota, but its practical speed and capacity are limited by your local CPU, memory, and GPU. Hosted free tiers such as Groq and OpenRouter have explicit request or token limits and are therefore not unlimited.

Install Ollama from [ollama.com](https://ollama.com/download), then pull the caption model:

```powershell
ollama pull qwen2.5:7b
ollama run qwen2.5:7b
```

In a second terminal, verify the local API and enable it in `backend/.env`:

```powershell
Invoke-RestMethod http://localhost:11434/api/tags
```

```dotenv
OLLAMA_ENABLED=true
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_BASE_URL=http://localhost:11434/api
```

Restart Spring Boot after changing these values. When `GEMINI_API_KEY` is present, Gemini remains the primary caption provider. When it is absent and `OLLAMA_ENABLED=true`, STUDIO sends a non-streaming chat request to Ollama. If neither provider is available, the caption request fails explicitly rather than fabricating copy.

### Configure Higgsfield image generation

Higgsfield uses two server-side credentials, an API key ID and an API key secret. Add them to `backend/.env` without quotes or the `Key` prefix:

```dotenv
HIGGSFIELD_API_KEY_ID=your-higgsfield-key-id
HIGGSFIELD_API_KEY_SECRET=your-higgsfield-key-secret
HIGGSFIELD_MODEL=flux-pro/kontext/max/text-to-image
HIGGSFIELD_REFERENCE_MODEL=flux-pro/kontext/max/image-to-image
HIGGSFIELD_VIDEO_MODEL=your-enabled-higgsfield-video-model
HIGGSFIELD_TIMEOUT_MS=180000
HIGGSFIELD_POLL_INTERVAL_MS=3000
```

The STUDIO backend keeps these credentials off the browser, submits the asynchronous Higgsfield request, polls its returned status URL, downloads the completed image, and then passes the bytes through STUDIO’s normal storage and branded overlay pipeline. The existing Stability path and deterministic local renderer remain fallback paths when Higgsfield is unavailable. Higgsfield requests consume account credits, so test with a low resolution and confirm the estimated cost in your account before batch generation.

The authenticated Studio workspace now exposes two creative modes. **Edit an image** accepts one product or model reference plus a natural-language instruction such as “replace the background with a warm daylight studio while preserving the product shape, label, and materials.” **Photo shoot** accepts both a product image and a model image plus a scenario prompt such as “create a running campaign frame with directional daylight and believable contact shadows.” The UI uploads references through `POST /api/uploads/creative-reference`, creates a job through `POST /api/creative/jobs`, and polls `GET /api/creative/jobs/{id}` until the image or video is ready.

For a real MP4 result, configure an enabled Higgsfield video model and Cloudinary storage. The generated still image must first be stored at a public HTTPS URL so Higgsfield can use it as the video input; a local-only storage URL cannot be used for this provider-backed video stage. If `HIGGSFIELD_VIDEO_MODEL` is absent, the job returns an explicit unavailable state instead of pretending to have produced a video. The landing-page showcase accepts an optional `NEXT_PUBLIC_STUDIO_DEMO_VIDEO_URL` for a real demo MP4; without it, the showcase remains interactive but labels the output as provider-ready rather than displaying fabricated media.

Verify configured capability state with:

```powershell
Invoke-RestMethod http://localhost:8080/api/system/capabilities
```

`imageGeneration` is `true` when either Higgsfield credentials or `STABILITY_API_KEY` are configured. `creativeEditing` and `photoShootGeneration` require Higgsfield credentials. `videoGeneration` additionally requires `HIGGSFIELD_VIDEO_MODEL`. `captionGeneration` is `true` when Gemini is configured or local Ollama is enabled. These flags indicate configured integration paths; they do not guarantee that a remote provider account has remaining credits, that Cloudinary is reachable, or that a local model is currently running.

### Configure social publishing and SMTP email

Social publishing is server-side and persisted. The browser never receives provider client secrets or OAuth access tokens. A connected account is stored as an encrypted `SocialConnection`, and each publish request creates a persisted `PublishJob` that moves through `QUEUED`, `PROCESSING`, `SENT`, or `FAILED`. The UI only presents a successful provider receipt when the backend receives one; it never fabricates a published result.

Set a separate random cipher key before using OAuth in any shared or production environment. `TOKEN_CIPHER_KEY` must be exactly 32 characters because STUDIO uses AES-256 for stored provider credentials. A PowerShell example is:

```powershell
$bytes = [byte[]]::new(32)
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$env:TOKEN_CIPHER_KEY = [Convert]::ToBase64String($bytes).Substring(0, 32)
```

For Linux or macOS, use a local secret generator and copy exactly 32 characters into `backend/.env`:

```bash
openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | cut -c1-32
```

The callback URLs below must be registered exactly as shown for local development. Replace `localhost` with the deployed backend origin in a deployed environment, and use HTTPS there:

| Provider | Callback URL | Main requested scopes or API boundary |
| --- | --- | --- |
| Meta | `http://localhost:8080/api/social/callback/meta` | Pages plus Instagram Business scopes: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish` |
| TikTok | `http://localhost:8080/api/social/callback/tiktok` | `user.info.basic`, `video.upload`, `video.publish`; Direct Post access and app review remain provider-controlled |
| LinkedIn | `http://localhost:8080/api/social/callback/linkedin` | `openid`, `profile`, `w_member_social`; image publishing may require additional asset-upload permissions or registration |
| X | `http://localhost:8080/api/social/callback/x` | `tweet.read`, `tweet.write`, `users.read`, `offline.access`; media upload is a separate adapter boundary and text publishing is the supported path |

#### Meta Developer App

Create an application in the [Meta for Developers](https://developers.facebook.com/) dashboard, add the Facebook Login product, and configure the valid OAuth redirect URI above. Add the Instagram Graph API and the required Facebook Page permissions to the app. During development, add the Facebook account, Page, and Instagram Business account as test assets. Production publishing requires the permissions and app-review approvals that Meta assigns to the application; an environment with only client credentials is not treated as ready until the OAuth flow returns a usable connection.

#### TikTok Developer App

Create an application in the [TikTok for Developers](https://developers.tiktok.com/) portal, enable the Content Posting API and Login Kit products available to the app, and register the callback URL. Request the scopes shown in the table. TikTok Direct Post access is approval-controlled, so a successful client registration does not guarantee that video publishing is enabled. STUDIO will retain the explicit provider error in the publish job when TikTok rejects an operation.

#### LinkedIn App

Create an application in the [LinkedIn Developer Portal](https://www.linkedin.com/developers/) and add the callback URL under Auth. Request the `w_member_social` product or permission required by LinkedIn for posting. Text publishing can be available before image asset-upload registration; the backend preserves the provider response instead of presenting unsupported media as published.

#### X Developer App

Create an application and OAuth 2.0 client in the [X Developer Portal](https://developer.x.com/) and register the callback URL. Enable the write permission required for `tweet.write`. STUDIO uses the OAuth 2.0 state flow and includes the provider's PKCE challenge parameters. Text posts are the supported baseline; image publishing needs a separate media-upload integration and is not claimed as available by the current UI.

#### SMTP provider

Configure the standard Spring mail variables in `backend/.env`:

```dotenv
SPRING_MAIL_HOST=smtp.example.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your-smtp-user
SPRING_MAIL_PASSWORD=your-smtp-password
SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH=true
SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE=true
APP_MAIL_FROM=studio@example.com
```

For Gmail, enable two-step verification and create an app password; do not use the normal account password. For a no-cost testing option, a provider such as [Brevo](https://www.brevo.com/) can supply SMTP credentials subject to its current account limits, sender verification, anti-abuse controls, and terms. Free plans are not unlimited, so the production checklist must account for the provider's actual quota. STUDIO queues `POST /api/email/send`, stores the delivery record, sends asynchronously, and persists `SENT` or `FAILED`; missing SMTP configuration is shown as an explicit failure rather than a simulated email.

After changing any backend variable, restart Spring Boot. Use the authenticated frontend at `/dashboard/social` to connect providers and queue approved posts, and `/dashboard/notifications` to inspect persisted email delivery history. The public capability endpoint exposes `socialPublishing`, `smtpEmail`, and the per-provider OAuth readiness flags without exposing secrets.

### Production build fails at `/_global-error`

Use the committed `pnpm build` script, which forces `NODE_ENV=production` before invoking Next.js. A parent shell exporting `NODE_ENV=development` can cause a misleading null `useContext` failure during error-route prerendering. If needed, run `NODE_ENV=production pnpm exec next build` explicitly. See [`PRODUCTION_LOCAL_RUNBOOK.md`](PRODUCTION_LOCAL_RUNBOOK.md) for the full production-local workflow.

## 9. Safe shutdown and reset guidance

Stop the frontend and backend with `Ctrl+C` in their respective terminals. PostgreSQL can remain enabled as a system service. Do not delete the database to “reset” the application unless you have a backup and explicitly intend to destroy all local data. For a clean disposable environment, create a separate database name and role rather than dropping `maamora_studio`.

## 10. Production checklist

Before production use, replace local credentials and placeholders, use managed PostgreSQL with TLS, configure a long random JWT secret, set the deployed frontend origin in `CORS_ALLOWED_ORIGINS`, configure real AI/storage/social provider integrations, add database backups, and verify the capability endpoint reports the expected readiness. The remaining product work is explicit: add append-only audit persistence before enabling audit controls, and add audited user/workspace mutation workflows before exposing destructive admin actions.

### Provider environment variables

The application does not include an MCP or paid connector by default. There is no honest way to guarantee a third-party AI, social, email, or storage service as both unlimited and production-grade for free. Configure only the providers you own and accept their quotas and terms:

| Environment variable | Required when | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | Hosted caption generation is enabled | Keep server-side; never use a `NEXT_PUBLIC_` name. Preferred over Ollama when configured. |
| `OLLAMA_ENABLED`, `OLLAMA_MODEL`, `OLLAMA_BASE_URL` | Local free caption generation is enabled | Requires Ollama installed locally and the selected model pulled. No hosted quota, but local hardware limits throughput. |
| `HIGGSFIELD_API_KEY_ID`, `HIGGSFIELD_API_KEY_SECRET` | Higgsfield image generation is enabled | Keep both server-side; requests consume Higgsfield credits and complete asynchronously. |
| `HIGGSFIELD_MODEL`, `HIGGSFIELD_TIMEOUT_MS`, `HIGGSFIELD_POLL_INTERVAL_MS` | Higgsfield behavior is customized | Defaults target the official v2 `flux-pro/kontext/max/text-to-image` endpoint. |
| `STABILITY_API_KEY` | Stability-backed image generation is enabled | Used as fallback when Higgsfield is unavailable; deterministic rendering remains available when this is absent. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary storage is enabled | Local disk storage remains the development fallback. |
| `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`, `APP_MAIL_FROM` | SMTP email delivery is enabled | `SMTP_*` aliases remain accepted; no email is silently simulated when these are missing. |
| `META_*`, `TIKTOK_*`, `LINKEDIN_*`, `X_*`, `TOKEN_CIPHER_KEY` | Social publishing is enabled | Configure each network separately, register the exact callback URL, and complete the provider's app review; export remains the fallback. |

After changing backend variables, restart Spring Boot. After changing `NEXT_PUBLIC_API_BASE_URL`, restart Next.js because public variables are read at startup.


## Google login and sign-up

STUDIO supports Google login and account creation through the same backend-issued JWT session used by email/password authentication. The Google OAuth client secret remains server-side; it must never be placed in the frontend environment or committed to Git.

In Google Cloud Console, create or select a project, configure the OAuth consent screen, and create an OAuth client with application type **Web application**. For local development, add this exact authorized redirect URI:

```text
http://localhost:8080/api/auth/google/callback
```

Add the resulting values to `backend/.env`:

```dotenv
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-web-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
FRONTEND_URL=http://localhost:3001
```

`FRONTEND_URL` must match the browser origin serving the frontend. If the frontend runs on port 3000, use `http://localhost:3000`; if it runs on port 3001, use `http://localhost:3001`. Restart the backend after changing these values. When Google OAuth variables are absent, the **Continue with Google** action redirects back to the login page with an explicit unavailable message rather than pretending that authentication succeeded.

The callback validates a signed, expiring state value, exchanges the authorization code with Google, requires a verified Google email, links an existing STUDIO account by email when present, and creates a new account otherwise. The resulting STUDIO JWT is returned in the OAuth callback URL fragment so it is not sent in the callback request or server access logs; the frontend stores it and redirects to `/dashboard`.
