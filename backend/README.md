# Maamora Studio — Backend (Spring Boot)

REST API for the Content Automation tool. Java 17, Spring Boot 3, PostgreSQL, JPA/Hibernate, Spring Security (JWT), Playwright (HTML/CSS → PNG rendering), Claude API for captions.

## Layout

```
src/main/java/com/maamora/studio/
  model/          JPA entities (User, BrandSettings, Product, Template, Post, BatchJob) + enums
  repository/     Spring Data JPA repositories
  service/        Business logic (image rendering, caption generation, storage, export, batch)
  controller/     REST controllers (thin — validate input, call a service, wrap the response)
  dto/            request/ (input payloads) and response/ (what the API returns — never expose entities directly)
  security/       JWT generation/validation, Spring Security config, the auth filter
  exception/      Custom exceptions + a global @RestControllerAdvice handler
src/main/resources/
  application.yml           config (reads everything from env vars, see .env.example)
  creative-templates/*.html HTML/CSS templates rendered to PNG by ImageRenderService
```

Note on "MVC": this is a REST API, not a server-rendered app, so there's no "View" layer in the
classic Spring MVC sense (no Thymeleaf/JSP). The DTOs in `dto/response/` play that role — they're
what the client (the Next.js frontend) actually receives as JSON.

## Prerequisites

- Java 17+
- Maven 3.9+
- Docker (for the local PostgreSQL, see docker-compose.yml at the repo root)

## First-time setup

```bash
# 1. Start Postgres
docker compose up -d postgres        # from the repo root

# 2. Copy env vars and fill in the Claude API key
cp backend/.env.example backend/.env
# export them, or configure your IDE run config to load backend/.env

# 3. Install the Playwright browser (one-time, downloads headless Chromium)
cd backend
mvn compile
mvn exec:java -e -Dexec.mainClass=com.microsoft.playwright.CLI -Dexec.args="install chromium"

# 4. Run
mvn spring-boot:run
```

API comes up on http://localhost:8080. Try `POST /api/auth/register` first to create an account
and a BrandSettings row — everything else is scoped to the authenticated brand.

## Adding a new template

Drop an HTML/CSS file in `src/main/resources/creative-templates/`, using `{{productName}}`,
`{{productImage}}`, `{{price}}`, `{{badgeText}}`, `{{promoText}}`, `{{accentColor}}` as
placeholders (see `bold.html` for a working example — it's a plain structural placeholder, not
final Maamora branding). Then register it via `POST /api/templates`.

## Known simplifications (fine for the internship scope, flag if this grows)

- `ddl-auto: update` instead of real migrations (Flyway/Liquibase) — okay for 2 devs on one DB, revisit before anything resembling production.
- `LocalDiskStorageService` writes to a local folder — swap for S3/Cloudinary by implementing `StorageService` and swapping the Spring bean, nothing else changes.
- Batch concurrency is capped in-process (`BatchJobService.MAX_CONCURRENT`); if batch sizes grow a lot, look at Anthropic's Message Batches API instead.
