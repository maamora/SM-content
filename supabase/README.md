# Supabase hosting for STUDIO

The SQL migration in `supabase/migrations/20260814000000_studio_schema.sql` creates the PostgreSQL schema used by the Spring Boot backend. It does not insert sample users, products, templates, or brand records. Those are created by the existing Spring Boot seeders when the application starts against an empty database.

## Important credential distinction

The migration does **not** require a Supabase `service_role` key. It can be applied through the Supabase SQL Editor or Supabase CLI. The Spring Boot application connects to the hosted PostgreSQL database over JDBC using the database connection credentials from the Supabase **Connect** panel.

Never commit or paste a `service_role` key into the repository, frontend environment variables, migration files, GitHub issues, or chat. A `service_role` key bypasses Supabase Row Level Security and is only appropriate for trusted server-side code. The current STUDIO backend does not need one for PostgreSQL access.

## Option A: Apply with Supabase SQL Editor

Create a Supabase project, open **SQL Editor**, create a new query, paste the contents of `supabase/migrations/20260814000000_studio_schema.sql`, and run it. Confirm that the following tables appear under **Table Editor**:

```text
app_user
batch_job
brand_settings
creative_template
post
product
```

This is the simplest first deployment path. The migration is schema-only; start Spring Boot afterward so its seeders can create the initial brand, admin account, products, and templates.

## Option B: Apply with Supabase CLI

Install the Supabase CLI, authenticate it locally, and link the repository to the project. The CLI authentication is separate from committing an API key:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Review the planned migration before confirming it. Do not use a destructive reset command against a database that contains data.

## Configure Spring Boot for Supabase PostgreSQL

Open the Supabase project’s **Connect** panel and choose a direct or session-pooled PostgreSQL connection suitable for a long-lived Spring Boot service. Copy the host, port, database, username, and password into the backend environment. Use TLS:

```dotenv
DB_HOST=your-supabase-db-host
DB_PORT=5432
DB_NAME=postgres
DB_USERNAME=postgres
DB_PASSWORD=your-database-password
DB_SSL_MODE=require

JWT_SECRET=generate-a-long-random-application-secret
JWT_EXPIRATION_MS=86400000

CORS_ALLOWED_ORIGINS=https://your-frontend-domain.example

STORAGE_LOCAL_PATH=./uploads
STORAGE_PUBLIC_BASE_URL=https://your-backend-domain.example/files
```

If the Supabase Connect panel provides a pooler connection, use the exact host, port, database, and username shown there. Do not guess the pooler username or port. For Hibernate/JPA, prefer a direct or session-pooled connection rather than a transaction-pooled connection unless the provider explicitly documents compatibility with the application’s prepared statements and session behavior.

The database URL assembled by Spring Boot is:

```text
jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=${DB_SSL_MODE}
```

## Start the backend against Supabase

From the repository root:

```bash
cd backend
cp .env.example .env
# Edit .env with the Supabase values and real server-side secrets.
bash mvnw spring-boot:run
```

On first startup, check the Spring Boot log for successful PostgreSQL connection and schema validation/update messages. The seeders use `ADMIN_EMAIL` and `ADMIN_PASSWORD`; set those before first startup if you do not want the local defaults. The application manages its own `app_user` table and JWTs; it does not use Supabase Auth for login.

## Verify the hosted database

Authenticate through the backend, not directly through the frontend:

```bash
LOGIN_JSON=$(curl -fsS -X POST https://your-backend-domain.example/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@your-domain.example","password":"your-admin-password"}')

TOKEN=$(printf '%s' "$LOGIN_JSON" | python3 -c \
  'import json,sys; print(json.load(sys.stdin)["token"])')

curl -fsS https://your-backend-domain.example/api/products \
  -H "Authorization: Bearer $TOKEN"

curl -fsS https://your-backend-domain.example/api/brand \
  -H "Authorization: Bearer $TOKEN"
```

Then update a non-critical brand field through the frontend, restart the backend, and read it again. The value should remain because it is stored in Supabase PostgreSQL rather than process memory.

## Files and uploads

Supabase PostgreSQL stores relational application data, not the local filesystem used by `STORAGE_LOCAL_PATH`. A hosted Spring Boot process may not have durable local disk. Configure Cloudinary or another persistent object-storage service for production uploads, set `STORAGE_PUBLIC_BASE_URL` accordingly, and keep those provider credentials server-side.

## Security checklist

Use a long random `JWT_SECRET`, a separate production admin password, `DB_SSL_MODE=require`, and a narrowly scoped `CORS_ALLOWED_ORIGINS` value. Keep `DB_PASSWORD`, `JWT_SECRET`, AI provider keys, storage credentials, and any Supabase `service_role` key in the hosting platform’s secret manager. Never put them in `NEXT_PUBLIC_*` variables or commit them to Git.
