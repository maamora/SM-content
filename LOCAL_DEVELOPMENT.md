# STUDIO local development guide

This guide explains how to run the merged STUDIO application locally. The repository contains a **Next.js 16 frontend**, a **Spring Boot 3.3 backend**, and a **PostgreSQL database**. The browser talks to Spring Boot over HTTP; Spring Boot owns authentication, authorization, persistence, product workflows, brand settings, posts, templates, uploads, and the integration boundary for future AI and publishing providers.

> **Important scope note:** The current branch has been verified for the implemented backend surface and the live frontend integration. The larger product brief also describes future workspace membership, Higgsfield generation, social OAuth/publishing, notifications, background jobs, analytics, and audit-log features. Those route families are not all present in the current Spring Boot API, so the corresponding screens show explicit unavailable states rather than fabricating persisted data.

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

# Required by the current configuration at startup; placeholders are enough
# for local UI/API smoke tests that do not call the providers.
ANTHROPIC_API_KEY=local-only-placeholder
GEMINI_API_KEY=local-only-placeholder

STORAGE_LOCAL_PATH=./uploads
STORAGE_PUBLIC_BASE_URL=http://localhost:8080/files

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001

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

Start Next.js on port 3001, which is already allowed by the backend's local CORS defaults:

```bash
pnpm exec next dev --hostname 0.0.0.0 --port 3001
```

Open [http://localhost:3001](http://localhost:3001). The Next.js configuration also allows the development loopback origin `http://127.0.0.1:3001`, so either localhost spelling can be used locally. Keep the frontend and backend terminals running at the same time.

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
| `/api/auth/me` | Not implemented in the current Spring Boot controller; the frontend does not depend on it |
| Calendar, social connections, notifications | Frontend states exist, but backend controllers are not currently available |
| Publishing integrations, analytics, audit logs | Not currently backed by implemented backend route families |
| Admin users/workspaces and advanced generation monitoring | Not currently backed by implemented backend route families |

The complete endpoint inventory and availability boundary is documented in `backend-api-inventory.md`. The screens for unavailable areas are intentionally explicit; they do not pretend that missing backend records are persisted.

## 8. Troubleshooting

### Backend cannot connect to PostgreSQL

Run `pg_isready -h 127.0.0.1 -p 5432`, confirm the PostgreSQL service is running, and verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD` in `backend/.env`. If the role or database was not created, rerun the non-destructive provisioning commands in section 3.

### Frontend reports that the backend cannot be reached

Confirm Spring Boot is listening on port 8080 and that `NEXT_PUBLIC_API_BASE_URL` points to `http://localhost:8080`. Restart Next.js after changing `frontend/.env.local`, because public Next.js environment variables are read when the dev server starts.

### Browser login returns 403 from one local origin

Use `http://localhost:3001` or `http://127.0.0.1:3001` and keep the matching origin in `CORS_ALLOWED_ORIGINS`. If you change the backend environment file, restart Spring Boot. If you change `next.config.ts`, restart Next.js.

### The dashboard shows 403 after reopening the page

The current client session is intentionally stored in `sessionStorage`. A new browser context has no token, so sign in again. This is expected behavior, not evidence that PostgreSQL data disappeared.

### AI or upload operations fail while basic pages work

Basic authentication, products, brand, posts, and templates do not prove that external AI providers or Cloudinary are configured. Supply real provider credentials, verify network access, and check the Spring Boot logs. Never put provider secrets in `NEXT_PUBLIC_*` variables.

### Production build fails at `/_global-error`

Use the committed `pnpm build` script, which forces `NODE_ENV=production` before invoking Next.js. A parent shell exporting `NODE_ENV=development` can cause a misleading null `useContext` failure during error-route prerendering. If needed, run `NODE_ENV=production pnpm exec next build` explicitly. See [`PRODUCTION_LOCAL_RUNBOOK.md`](PRODUCTION_LOCAL_RUNBOOK.md) for the full production-local workflow.

## 9. Safe shutdown and reset guidance

Stop the frontend and backend with `Ctrl+C` in their respective terminals. PostgreSQL can remain enabled as a system service. Do not delete the database to “reset” the application unless you have a backup and explicitly intend to destroy all local data. For a clean disposable environment, create a separate database name and role rather than dropping `maamora_studio`.

## 10. Production checklist

Before production use, replace local credentials and placeholders, use managed PostgreSQL with TLS, configure a long random JWT secret, set the deployed frontend origin in `CORS_ALLOWED_ORIGINS`, configure real AI/storage/social provider integrations, add database backups, resolve the Next.js production build blocker, and complete the unimplemented workspace, generation, publishing, notification, analytics, and audit-log route families described in the product brief.
