# STUDIO persistent database setup

- [x] Inspect entities, repositories, seeders, and current PostgreSQL configuration.
- [x] Provision the `maamora_studio` database and `maamora` application role without destructive resets.
- [x] Start PostgreSQL and verify the application can connect.
- [x] Start Spring Boot with persistent database settings and allow JPA schema updates/seeders to run.
- [x] Register or use a test account, create/read records through the API, restart the backend, and confirm the records remain.
- [x] Verify the authenticated Next.js frontend reads the persisted product and brand data.
- [x] Document the database connection settings, local persistence location, and production secret requirements in `backend/PERSISTENCE.md`.
- [ ] Re-run the backend, database, frontend, and authenticated browser integration checks.
- [ ] Compare `manus/studio-frontend` with `main` and merge without discarding the completed STUDIO implementation.
- [ ] Verify the merged `main` branch and push it to GitHub.
- [ ] Write and commit a complete local launch guide covering PostgreSQL, Spring Boot, Next.js, environment variables, and troubleshooting.
