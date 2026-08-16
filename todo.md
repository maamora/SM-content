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
- [x] Inspect the current JPA entities, enums, indexes, constraints, and seed data for Supabase compatibility.
- [x] Create an idempotent Supabase migration without service credentials or fabricated application data.
- [x] Validate the migration structure and document how to apply it with Supabase SQL Editor or CLI.
- [x] Document the required Supabase connection variables and safe handling of `service_role` credentials.
- [x] Audit legacy frontend components still using the old visual language and map their routes.
- [x] Define the component-level STUDIO design refresh using the existing tokens and interaction patterns.
- [x] Implement the visual refresh across legacy product, studio, batch, approval, and shared shell surfaces without changing API contracts.
- [x] Verify the refreshed routes, production build, TypeScript, lint, and responsive presentation.
- [x] Commit the design refresh to `main` and document the changed surfaces.
- [x] Diagnose the local frontend message that cannot reach the Spring Boot backend at `http://localhost:8080`.
- [x] Diagnose why the local preview landing page does not match the restored GitHub STUDIO version.
- [x] Synchronize the separate `flora-marketing-site` preview landing with the restored GitHub STUDIO landing direction.
- [x] Audit the supplied production product brief against the current frontend, backend, database, and route inventory.
- [x] Define which missing capabilities can be implemented with the existing stack and which require external providers or user configuration.
- [x] Implement missing production-critical behavior with server-side validation, authorization, persistence, and honest failure states.
- [x] Complete frontend behavior for the supported product, approval, studio, batch, asset, post, and admin workflows.
- [x] Verify end-to-end functionality, production build, security boundaries, and local configuration guidance.
- [x] Audit the user-provided Higgsfield API configuration against the official asynchronous API contract.
- [x] Implement Higgsfield image generation behind the existing Spring Boot image-provider boundary with bounded polling, existing post/batch persistence, and storage handoff.
- [x] Research caption-generation alternatives using official pricing, quota, and API documentation; reject any provider that cannot honestly meet the free/unlimited requirement.
- [x] Implement the selected caption provider fallback with server-side configuration, retry behavior, and explicit unavailable states.
- [x] Verify Higgsfield image generation, caption generation, batch jobs, capability reporting, frontend build, backend tests, and documentation before pushing.
- [ ] Install Ollama on Windows, verify its PATH and local service, pull the caption model, and connect it to STUDIO.
- [ ] Complete the Ollama Windows installer or Winget installation after confirming the executable is currently absent.
- [x] Evaluate and document a hosted free-tier caption API alternative, including quotas, secret configuration, and STUDIO adapter requirements.
- [ ] Add a Groq hosted caption adapter behind the existing caption-provider boundary if the user chooses to replace Ollama.
- [x] Audit Higgsfield image/video support and the current STUDIO upload and generation contracts.
- [x] Add prompt-based image editing and product-plus-model photo-shoot generation with explicit provider and unavailable states.
- [x] Add provider-aware video generation and output handling for the photo-shoot result.
- [x] Add the interactive Flora-inspired creative workflow section to the STUDIO landing page.
- [x] Verify the new creative flow across backend, frontend, uploads, provider capabilities, and production builds.
- [ ] Audit automation routes, schedules, batch jobs, notifications, and page-level placeholders against the current backend API.
- [ ] Implement supported automation flows with persisted state, ownership checks, retry/failure handling, and honest provider boundaries.
- [ ] Wire dashboard, workspace, and admin pages to real backend data and actions where APIs exist.
- [ ] Replace unsupported page actions with explicit unavailable or configuration-required states.
- [ ] Verify automation and page flows across backend tests, frontend checks, route builds, and documented local setup.
- [x] Audit the requested social networks and email provider requirements against the current STUDIO API and configuration.
- [x] Implement provider-backed email delivery with persisted queue state, retries, and explicit configuration errors.
- [x] Implement provider-backed social publishing with OAuth authorization, publish status persistence, retries, and ownership checks.
- [x] Wire social, email, notifications, and settings pages to live provider states and actions.
- [x] Verify social/email flows and document the required provider credentials and setup steps.
- [x] Implement Meta OAuth and publishing for Instagram Business and Facebook Pages, subject to Meta permissions and app review.
- [x] Implement TikTok OAuth and publishing with provider-required media and approval states.
- [x] Implement LinkedIn OAuth and publishing for supported person or organization targets, with media boundaries explicit.
- [x] Implement X OAuth and publishing with current API credential and media-upload boundaries.
- [x] Implement SMTP email delivery and wire delivery status into notifications and settings.
- [x] Refresh the landing creative workflow with tangible product and model reference assets.
- [x] Add distinct campaign image variations as the explicit non-video result state for the landing demonstration.
- [x] Verify the revised creative workflow presentation and commit the GitHub update.
- [x] Replace external creative-workflow image delivery with portable project-owned assets.
- [x] Upgrade the landing creative canvas with stronger interactive product, model, prompt, and variation controls.
- [x] Verify the corrected imagery in a local production build and push the fix.
- [x] Evaluate MAI-Image-2.5 availability, pricing, licensing, and suitability for STUDIO image generation.
- [x] Identify a maintained image-generation option that accepts separate product and model photos as reference inputs.
- [x] Recommend the safest practical model-integration path for the STUDIO creative workflow.
- [x] Audit the active local configuration and safely identify which external providers can be exercised in this validation run.
- [x] Run backend tests, frontend type/lint/production builds, and authenticated database-backed smoke checks.
- [x] Validate creative generation, caption generation, social publishing, and SMTP flows against real configured providers or explicit unavailable states.
- [x] Fix verified full-system defects, repeat focused regression tests, and document the production-readiness result.
- [ ] Securely inspect the supplied local environment configuration and identify safely testable live providers.
- [ ] Start STUDIO against the supplied database and validate real authenticated API health.
- [ ] Run non-destructive live checks for configured image and caption generation providers.
- [ ] Report real provider outcomes and obtain confirmation before social publishing or external email delivery.
- [ ] Correct the local Supabase pooler password for the configured PostgreSQL user and confirm Spring Boot can initialize JPA.
- [ ] Reconfirm the local capability response after backend startup.
- [ ] Run the Windows live smoke script and assess the real upload, caption, Higgsfield image, and photo-shoot job outcomes.
- [ ] Repair the Windows live smoke-test image fixture and .NET HTTP client prerequisites, then repeat the test.
- [ ] Diagnose and repair the HTTP 500 returned by live disposable-account registration during the smoke test.
- [x] Add non-sensitive JWT signing-key validation and generic API-error logging for live registration diagnostics.
- [x] Strengthen the committed backend environment template and Windows startup guidance without adding real credentials.


## Website functionality validation
- [ ] Confirm local frontend and backend service health.
- [ ] Test public marketing, authentication, onboarding, dashboard, workspace, and admin navigation.
- [ ] Test authenticated uploads, captions, image generation, and photo-shoot actions.
- [ ] Verify social, email, and video unavailable states without external side effects.
- [ ] Fix verified website defects and rerun affected checks.
- [ ] Deliver the final website functionality test report and remaining configuration actions.
- [ ] Re-run disposable registration after the JWT_SECRET update and preserve only non-sensitive output.


## Sandbox-local website verification
- [x] Run frontend typecheck, lint, and production build from the GitHub checkout.
- [x] Start the local frontend and inspect representative marketing and app routes.
- [x] Capture desktop and mobile route screenshots for visual verification.
- [x] Exercise route navigation and explicit unavailable states locally.
- [ ] Compare frontend API contracts against the locally validated backend capabilities.
- [x] Record sandbox-local results separately from Windows live-provider results.


## Google OAuth authentication
- [ ] Inspect the existing STUDIO auth controller, service, user model, JWT session flow, and auth UI.
- [ ] Add server-side Google OAuth configuration, state/nonce protection, callback handling, identity mapping, and JWT session issuance.
- [ ] Add Google login and sign-up actions to the login and registration pages.
- [ ] Add Google OAuth environment documentation and redirect-URI setup guidance without committing credentials.
- [ ] Validate configured and unavailable OAuth states, backend tests, frontend checks, and production build.
- [ ] Deliver the Google OAuth setup guide and test results.


## Live caption and image generation validation
- [ ] Confirm the updated backend is running with the corrected JWT_SECRET and provider capabilities.
- [ ] Execute a disposable authenticated caption-generation request using Gemini.
- [ ] Execute a disposable authenticated image-generation request using Higgsfield.
- [ ] Verify generated output URLs, storage persistence, job polling, and safe provider failures.
- [ ] Fix any verified generation defect and rerun the affected request.
- [ ] Deliver the live caption and image-generation test report.


## Higgsfield authorization diagnosis
- [ ] Inspect the Higgsfield request configuration and backend logs for the HTTP 401 response without exposing credentials.
- [ ] Correct the Higgsfield authentication or model configuration if the defect is in STUDIO.
- [ ] Rerun the live image-generation request, then continue with caption-generation validation.


## Higgsfield repeated-401 diagnostics
- [ ] Add a non-secret runtime diagnostics response for Higgsfield configuration presence, base URL, and selected model.
- [ ] Confirm the effective backend configuration is the regenerated local key pair and not an overridden environment value.
- [ ] Compare the live request against the current official Higgsfield contract and correct STUDIO if evidence requires it.
- [ ] Rerun image generation and then caption generation after the 401 diagnosis.


## Higgsfield diagnostics access
- [ ] Make the non-secret Higgsfield diagnostics reachable through the intended safe system access path.
- [ ] Verify the effective credential metadata and model configuration after access is corrected.
- [ ] Rerun image generation and caption generation after the 401 diagnosis.


## Higgsfield authorization contract
- [ ] Inspect the effective Higgsfield header, endpoint, model payload, and provider error handling after runtime configuration passed diagnostics.
- [ ] Compare STUDIO’s request against the current official Higgsfield API contract.
- [ ] Correct the request or document an external credential/account restriction, then rerun image and caption validation.


## Higgsfield endpoint-path diagnosis
- [ ] Verify the SDK’s exact base-path construction after the direct request returned HTTP 404.
- [ ] Correct STUDIO’s endpoint path or document the provider route requirement.
- [ ] Rerun image generation, then caption generation, after the endpoint correction.


## Stability AI fallback evaluation
- [x] Research current Stability AI managed image APIs, models, authentication, and usage limits.
- [x] Compare Stability AI reference-image support and editorial quality with STUDIO’s workflow.
- [x] Determine the safest provider fallback architecture and required environment variables.
- [x] Decide whether to implement Stability AI as a fallback without disabling Higgsfield.


## fal.ai FLUX.1 Kontext Pro image-generation configuration
- [ ] Create or verify a fal.ai account and API key with image-inference access. (Requires a real provider credential outside the sandbox.)
- [x] Add server-side FAL_API_KEY and model configuration to the backend environment template.
- [x] Wire the existing STUDIO image-provider boundary to fal.ai without exposing the key in the frontend.
- [x] Run a safe single-reference provider-contract test and explicit product-plus-model limitation test. (Live provider execution requires a real fal.ai key.)
- [x] Document fal.ai quota, billing, error handling, and Windows startup commands.
