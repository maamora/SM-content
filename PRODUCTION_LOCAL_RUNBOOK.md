# STUDIO production-local runbook

This runbook starts the merged `main` branch locally in a production-like mode: PostgreSQL provides durable storage, Spring Boot serves the API on port `8080`, and Next.js serves the compiled frontend on port `3001`. It is written for Ubuntu or WSL with minor notes for macOS. Keep three terminals available: one for PostgreSQL commands, one for Spring Boot, and one for the Next.js process and checks.

> **Scope:** The commands below test the backend and frontend functionality that is implemented and wired today. The final section lists UI areas whose backend route families are not implemented yet; those screens intentionally display unavailable states.

## 1. Install prerequisites

Install the following before cloning:

| Requirement | Recommended baseline | Check |
| --- | --- | --- |
| Git | Current version | `git --version` |
| Java | JDK 17 or newer | `java -version` |
| Node.js | Node 20 or newer | `node --version` |
| pnpm | Current version | `pnpm --version` |
| PostgreSQL | PostgreSQL 16 | `psql --version` |
| curl | Current version | `curl --version` |

On Ubuntu, the system packages can be installed with:

```bash
sudo apt update
sudo apt install -y git curl ca-certificates openjdk-17-jdk postgresql postgresql-client
corepack enable
corepack prepare pnpm@latest --activate
```

The backend includes a Maven wrapper, so a separate Maven installation is not required. The wrapper may not be executable in a fresh checkout; use `bash mvnw` exactly as shown below.

## 2. Clone the merged repository

Clone `main`, not the old feature branch:

```bash
git clone https://github.com/joki12/STUDIO.git
cd STUDIO
git checkout main
git pull --ff-only origin main
git log -1 --oneline
```

The expected layout is:

```text
STUDIO/
├── backend/       Spring Boot API, persistence, uploads, and security
├── frontend/      Next.js App Router frontend
├── LOCAL_DEVELOPMENT.md
├── PRODUCTION_LOCAL_RUNBOOK.md
└── backend-api-inventory.md
```

## 3. Provision PostgreSQL without deleting existing data

Start PostgreSQL and confirm that it is accepting connections:

```bash
sudo systemctl enable --now postgresql
pg_isready -h 127.0.0.1 -p 5432
```

On macOS with Homebrew, the equivalent is usually:

```bash
brew services start postgresql@16
pg_isready -h 127.0.0.1 -p 5432
```

Create the application role and database once. This block is deliberately non-destructive: it creates missing objects but does not drop the database, tables, or rows.

```bash
sudo -u postgres psql <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles WHERE rolname = 'maamora'
  ) THEN
    CREATE ROLE maamora LOGIN PASSWORD 'maamora';
  END IF;
END
$$;

SELECT 'CREATE DATABASE maamora_studio OWNER maamora'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'maamora_studio'
)\gexec

ALTER ROLE maamora SET client_encoding TO 'UTF8';
SQL
```

Verify the database and role:

```bash
sudo -u postgres psql -d maamora_studio -c '\dt'
sudo -u postgres psql -d maamora_studio -c "SELECT current_database(), current_user;"
```

The default local connection is `maamora` / `maamora` on database `maamora_studio`. These credentials are for local development only. Never reuse them in a shared or production environment.

## 4. Configure the Spring Boot backend

Copy the checked-in environment template. The `.env` file is ignored and must never be committed:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and use values equivalent to these. Replace the JWT value with a random secret; the AI placeholders are sufficient for startup and for flows that do not call external providers.

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maamora_studio
DB_USERNAME=maamora
DB_PASSWORD=maamora
DB_SSL_MODE=disable

JWT_SECRET=replace-with-a-long-random-string-at-least-32-characters
JWT_EXPIRATION_MS=86400000

ANTHROPIC_API_KEY=local-only-placeholder
ANTHROPIC_MODEL=claude-sonnet-4-5
GEMINI_API_KEY=local-only-placeholder

STORAGE_LOCAL_PATH=./uploads
STORAGE_PUBLIC_BASE_URL=http://localhost:8080/files

CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001

ADMIN_EMAIL=admin@maamora.com
ADMIN_PASSWORD=admin123
```

A random JWT secret can be generated with Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Replace `JWT_SECRET` with the generated output. The backend uses `spring-dotenv` to load `.env`, and `application.yml` maps the values to PostgreSQL, JWT, CORS, storage, and provider configuration. JPA is configured with `ddl-auto: update`; it preserves existing rows while applying missing schema changes. Do not change it to `create` or `create-drop` for a database that contains data.

Start the backend in **Terminal 1**:

```bash
cd STUDIO/backend
bash mvnw spring-boot:run
```

Leave this terminal open. The first startup downloads Maven dependencies, creates or updates the JPA tables, and seeds the configured admin account and templates. The API should listen on `http://localhost:8080`.

In another shell, verify PostgreSQL and the API:

```bash
pg_isready -h 127.0.0.1 -p 5432
curl -i -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@maamora.com","password":"admin123"}'
```

The login response should be HTTP 200 and contain a JWT token. A browser `GET` request to `/api/auth/login` is not a health check because the endpoint accepts `POST` only.

## 5. Configure and build the Next.js frontend

In **Terminal 2**, install the locked dependency set:

```bash
cd STUDIO/frontend
pnpm install --frozen-lockfile
```

Create the public frontend environment file:

```bash
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
EOF
```

Build the production frontend:

```bash
pnpm build
```

The `build` script forces `NODE_ENV=production` through `frontend/scripts/build.mjs`. This is intentional: if the parent shell exports `NODE_ENV=development`, a direct `next build` can produce a misleading `useContext` failure while prerendering `/_global-error` or `/_not-found`.

Start the compiled frontend on port `3001`:

```bash
pnpm exec next start --hostname 0.0.0.0 --port 3001
```

Open [http://localhost:3001](http://localhost:3001). The equivalent loopback URL is [http://127.0.0.1:3001](http://127.0.0.1:3001). The backend CORS defaults and Next.js development-origin allowance include both forms.

## 6. Run automated checks

Run these checks from `STUDIO/frontend` in a third terminal or after stopping the frontend server:

```bash
npx tsc --noEmit
pnpm lint
pnpm test
pnpm build
```

Run backend tests from `STUDIO/backend`:

```bash
bash mvnw test
```

The production build should finish with all routes generated. `pnpm lint` may print non-blocking warnings about React Hook Form memoization, unused imports in `BatchStudio`, or image optimization; errors should not be present.

## 7. Test the authenticated API surface

The following shell block logs in, extracts the JWT, and reads all currently implemented protected collections. It does not create or delete test data:

```bash
cd STUDIO

LOGIN_JSON=$(curl -fsS -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@maamora.com","password":"admin123"}')

TOKEN=$(printf '%s' "$LOGIN_JSON" | python3 -c \
  'import json,sys; print(json.load(sys.stdin)["token"])')

AUTH=(-H "Authorization: Bearer $TOKEN")

curl -fsS "http://localhost:8080/api/products" "${AUTH[@]}" | python3 -m json.tool
curl -fsS "http://localhost:8080/api/products/pending" "${AUTH[@]}" | python3 -m json.tool
curl -fsS "http://localhost:8080/api/brand" "${AUTH[@]}" | python3 -m json.tool
curl -fsS "http://localhost:8080/api/posts" "${AUTH[@]}" | python3 -m json.tool
curl -fsS "http://localhost:8080/api/templates" "${AUTH[@]}" | python3 -m json.tool
```

The expected local data after the verified seed process is approximately one admin user, one brand record, five products, two templates, zero posts, and zero batch jobs. Exact counts can differ if you have already used the application.

Verify CORS from the browser origin:

```bash
curl -i -X OPTIONS http://localhost:8080/api/products \
  -H 'Origin: http://localhost:3001' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: authorization,content-type'
```

The response should include an allowed origin and an allowed method/header set.

## 8. Test the application in the browser

Use the seeded local account on `/login`:

```text
Email:    admin@maamora.com
Password: admin123
```

After signing in, test the following sequence. Refreshing the same tab keeps the session; opening a new browser context requires another login because the current client stores the token in `sessionStorage`.

| Browser action | Expected result |
| --- | --- |
| Open `/` | STUDIO marketing landing page renders. |
| Open `/login` and submit the seeded account | Redirects to `/dashboard`. |
| Open `/dashboard/products` | PostgreSQL-backed products render through Spring Boot. |
| Open `/dashboard/brand` | Persisted brand settings load. Change a field, save it, refresh, and confirm the value remains. |
| Open `/dashboard/studio` | Live products, templates, brand settings, and post workflow data load. |
| Open `/dashboard/posts` | Posts list and available export/delete actions render. |
| Open `/dashboard/assets` | Available local/upload-derived assets render; upload requires a valid multipart file. |
| Open `/admin/dashboard` | Admin surface loads according to the authenticated account. |
| Log out or clear session storage | Protected API calls redirect back to `/login`. |

For a persistence round-trip, update a non-critical brand field, save it, stop Spring Boot with `Ctrl+C`, start it again with `bash mvnw spring-boot:run`, log in again, and confirm the brand value is still present. This proves the data is in PostgreSQL rather than only in browser state or process memory.

## 9. Optional write-flow tests

Perform write tests only against disposable local data or after taking a backup. The implemented API supports the following workflows:

| Workflow | What to test |
| --- | --- |
| Products | Create a disposable product, edit it, submit it for approval/rejection as supported by the UI, then delete it. |
| Brand | Update a brand field, reload it, and confirm the PostgreSQL-backed value persists across a backend restart. |
| Posts | Create a disposable post, update it, export it, list it, and delete it. |
| Uploads | Upload a small local image or file through the supported UI, confirm the returned storage reference, and remove disposable files afterward. |
| Registration | Use a unique disposable email address, register, log in, and verify the account is stored; do not use a real customer email for a local smoke test. |

Do not use production customer data or customer reviews as test fixtures, and do not seed fabricated testimonials or ratings.

## 10. Current functionality boundary

The following areas are live and backed by the current Spring Boot API: registration and login, product CRUD, product approval/rejection and pending lists, brand settings, post CRUD and export, templates, local uploads, file serving, PostgreSQL persistence, JWT authorization, and the frontend workspace surfaces that consume those APIs.

The following product-brief areas have UI shells or explicit unavailable states but do not currently have complete backend route families: `/api/auth/me`, calendar persistence, social OAuth connections, publishing integrations, notifications, analytics, audit logs, admin user/workspace management, and advanced background generation monitoring. Do not interpret an unavailable notice as a failed database connection; it means the corresponding controller/API contract has not been implemented yet. See [`backend-api-inventory.md`](backend-api-inventory.md) for the exact endpoint boundary.

## 11. Troubleshooting

### PostgreSQL connection refused

Run `pg_isready -h 127.0.0.1 -p 5432`. If it fails, start PostgreSQL with `sudo systemctl enable --now postgresql`. Confirm that `maamora_studio` exists and that the `maamora` role can connect. Do not drop the database as a first troubleshooting step.

### Spring Boot fails because a variable is missing

Confirm `backend/.env` exists and contains `JWT_SECRET`, `ANTHROPIC_API_KEY`, and `GEMINI_API_KEY` in addition to the database values. Provider placeholders allow basic local startup, but real AI operations require real provider credentials.

### Browser login returns 401 or 403

Confirm Spring Boot is listening on port `8080`, the frontend was built after creating `.env.local`, and `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`. Check that the browser origin appears in `CORS_ALLOWED_ORIGINS`. Re-authenticate after opening a new browser context because the token is stored in `sessionStorage`.

### `pnpm build` reports `/_global-error` and `useContext`

Use the committed wrapper with `pnpm build`; do not run a raw `next build` while `NODE_ENV=development` is exported. To make the environment explicit, run `NODE_ENV=production pnpm exec next build`. The corrected build wrapper and context-independent error pages are already on `main`.

### Frontend starts but images or uploads fail

Basic authentication and CRUD checks do not prove that Cloudinary or AI providers are configured. Configure the relevant backend secrets, check the Spring Boot logs, and confirm that local upload paths are writable. Never put provider secrets in `NEXT_PUBLIC_*` variables.

### Protected pages show 403 after restarting the browser

Sign in again. The current frontend intentionally uses `sessionStorage`, so a new browser context has no token. This is separate from PostgreSQL persistence.

## 12. Shutdown and production cautions

Stop the Next.js and Spring Boot processes with `Ctrl+C` in their terminals. PostgreSQL can remain enabled as a service. Do not delete `maamora_studio` to reset the application unless you explicitly intend to destroy local data.

For a real deployment, use a managed PostgreSQL service with TLS, a long random JWT secret, production-specific CORS origins, real provider credentials in a secret manager, database backups, and persistent file storage. The local `maamora` password and seeded admin password must not be used outside a disposable development environment.

## References

1. [`LOCAL_DEVELOPMENT.md`](LOCAL_DEVELOPMENT.md), the repository’s concise local-development guide.
2. [`backend/PERSISTENCE.md`](backend/PERSISTENCE.md), the verified PostgreSQL persistence setup and restart round-trip.
3. [`backend-api-inventory.md`](backend-api-inventory.md), the implemented backend endpoint inventory and unavailable feature boundary.
