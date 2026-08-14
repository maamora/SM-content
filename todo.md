# STUDIO persistent database setup

- [x] Inspect entities, repositories, seeders, and current PostgreSQL configuration.
- [x] Provision the `maamora_studio` database and `maamora` application role without destructive resets.
- [x] Start PostgreSQL and verify the application can connect.
- [x] Start Spring Boot with persistent database settings and allow JPA schema updates/seeders to run.
- [x] Register or use a test account, create/read records through the API, restart the backend, and confirm the records remain.
- [x] Verify the authenticated Next.js frontend reads the persisted product and brand data.
- [x] Document the database connection settings, local persistence location, and production secret requirements in `backend/PERSISTENCE.md`.
- [x] Re-run the backend, database, frontend, and authenticated browser integration checks.
- [x] Compare `manus/studio-frontend` with `main` and merge without discarding the completed STUDIO implementation.
- [x] Verify the merged `main` branch and push it to GitHub.
- [x] Write and commit a complete local launch guide covering PostgreSQL, Spring Boot, Next.js, environment variables, and troubleshooting.
- [x] Inspect the custom error boundary and Next.js/React versions causing the production build failure.
- [x] Reproduce the `/_global-error` failure with a focused production-build log.
- [x] Apply the smallest compatible fix without changing the STUDIO visual system.
- [x] Re-run TypeScript, lint, and production build, then commit the verified fix to main.
- [x] Write a copy-paste production-local runbook from cloning `main` through installing dependencies and provisioning PostgreSQL.
- [x] Include Spring Boot environment setup, backend startup, Next.js production build/start, and all functional smoke tests.
- [x] Validate the runbook against the merged repository commands and document unavailable backend feature areas.
