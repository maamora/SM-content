# STUDIO persistence

STUDIO now runs against PostgreSQL instead of an in-memory store. The local verification database is `maamora_studio`, owned by the `maamora` role, on `localhost:5432`. PostgreSQL is configured as a system service, so the database files remain on the sandbox disk across Spring Boot restarts.

## Local configuration

The backend reads its connection settings from environment variables. The checked-in defaults in `src/main/resources/application.yml` are suitable for the local database created during verification:

```text
DB_HOST=localhost
DB_PORT=5432
DB_NAME=maamora_studio
DB_USERNAME=maamora
DB_PASSWORD=maamora
DB_SSL_MODE=disable
```

The JPA setting is `ddl-auto: update`, so existing tables and rows are preserved while the application adds missing schema objects. Do not change this to `create`, `create-drop`, or run destructive SQL against an environment containing real data.

## Start the backend locally

Use a real random JWT secret and real provider keys for normal development. The placeholder values below are only for local API smoke tests:

```bash
cd backend
JWT_SECRET='replace-with-a-long-random-string-at-least-32-characters' \
ANTHROPIC_API_KEY='local-only-placeholder' \
GEMINI_API_KEY='local-only-placeholder' \
bash mvnw spring-boot:run
```

To use another PostgreSQL provider, copy `.env.example` to an ignored `.env` or export the variables in the shell. Set `DB_SSL_MODE=require` for hosted PostgreSQL services that require TLS, and never commit passwords, JWT secrets, or provider API keys.

## Verified persistence

The verification run registered the existing seeded admin account, authenticated through the API, read products and brand settings, updated/read the brand settings, stopped and restarted Spring Boot, and read the same records again. The post-restart database counts were:

| Table | Rows |
| --- | ---: |
| `app_user` | 1 |
| `brand_settings` | 1 |
| `product` | 5 |
| `creative_template` | 2 |
| `post` | 0 |
| `batch_job` | 0 |

The Next.js frontend successfully authenticated through the localhost origin and rendered the five persisted products and the persisted `Maamora` brand kit. The backend CORS defaults now include `localhost` and `127.0.0.1` on ports 3000 and 3001; production deployments should override `CORS_ALLOWED_ORIGINS` with the deployed frontend origin only.

## Production requirement

The database created here is local to this development environment. For a deployed website, configure a managed or persistent PostgreSQL instance and provide its connection values through the hosting platform's secret manager. Do not rely on an ephemeral application filesystem for production database storage, uploaded files, or backups.
