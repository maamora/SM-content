# Maamora Content Automation — project scaffold

This adds two things to the repo, on top of what already existed:

- `backend/` — new. Spring Boot 3 (Java 17) + PostgreSQL REST API. See `backend/README.md` to run it.
- `frontend/` — a copy of the existing `studio/` app, plus a typed API client (`src/lib/api/`) that
  talks to the new backend, plus `MIGRATION_NOTES.md` listing what's now obsolete in that copy
  (Prisma, NextAuth, the old server actions).

`studio/` itself is untouched — nothing was deleted. Once you've confirmed `frontend/` works,
delete `studio/` to avoid keeping two copies of the same code around.

## Architecture

Decoupled now, instead of one full-stack Next.js app:

```
frontend/ (Next.js, React)  --HTTP/JSON-->  backend/ (Spring Boot REST API)  -->  PostgreSQL
                                                    |
                                                    +--> Playwright (headless Chromium): HTML/CSS template -> PNG
                                                    +--> Claude API: captions in FR / AR / Darija
                                                    +--> local disk (dev) / cloud storage (later): serves generated PNGs
```

## Running everything locally

```bash
# 1. Database
docker compose up -d postgres

# 2. Backend (see backend/README.md for full first-time setup, incl. Playwright browser install)
cd backend
cp .env.example .env   # fill in ANTHROPIC_API_KEY at minimum
mvn spring-boot:run

# 3. Frontend
cd ../frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Backend on :8080, frontend on :3000.

## Where things stand vs. the 8-week brief

See `Maamora-Logique-Architecture-Taches.md` for the full pipeline logic, class diagram, and the
backend/frontend task split — updated for this Spring Boot + PostgreSQL stack.
