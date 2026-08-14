# STUDIO local development guide

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

Create the backend environment file from the checked-in template:

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

# Optional provider credentials. Leave them blank for local UI/API smoke tests
# that do not call external providers. Gemini is preferred when configured;
# Ollama is the local fallback for captions.
ANTHROPIC_API_KEY=
GEMINI_API_KEY=

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

ADMIN_EMAIL=admin@maamora.com
ADMIN_PASSWORD=admin123
```

Do not commit `backend/.env`, real API keys, database passwords, or JWT secrets. For production, use the hosting platform's secret manager and set `DB_SSL_MODE=require` when the database provider requires TLS. Cloudinary values are optional for local flows that do not upload to Cloudinary; the backend also supports its configured local upload path.

Start the backend in a terminal that remains open:

```bash
cd backend
bash mvnw spring-boot:run
```

The API should become available at `http://localhost:8080`. The backend applies missing JPA schema objects with `ddl-auto: update`; this preserves existing rows while adding schema changes. Never use `create` or `create-drop` against a database containing real data.

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
HIGGSFIELD_TIMEOUT_MS=180000
HIGGSFIELD_POLL_INTERVAL_MS=3000
```

The STUDIO backend keeps these credentials off the browser, submits the asynchronous Higgsfield request, polls its returned status URL, downloads the completed image, and then passes the bytes through STUDIO’s normal storage and branded overlay pipeline. The existing Stability path and deterministic local renderer remain fallback paths when Higgsfield is unavailable. Higgsfield requests consume account credits, so test with a low resolution and confirm the estimated cost in your account before batch generation.

Verify configured capability state with:

```powershell
Invoke-RestMethod http://localhost:8080/api/system/capabilities
```

`imageGeneration` is `true` when either Higgsfield credentials or `STABILITY_API_KEY` are configured. `captionGeneration` is `true` when Gemini is configured or local Ollama is enabled. These flags indicate configured integration paths; they do not guarantee that a remote provider account has remaining credits or that a local model is currently running.

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
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM` | Email verification or password reset is enabled | No email is silently simulated when these are missing. |
| Social-network OAuth/API variables | Social publishing is enabled | Configure each network separately and complete its app review; export remains the fallback. |

After changing backend variables, restart Spring Boot. After changing `NEXT_PUBLIC_API_BASE_URL`, restart Next.js because public variables are read at startup.
