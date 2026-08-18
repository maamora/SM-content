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


## SMTP configuration and validation
- [ ] Inspect the current STUDIO SMTP environment contract and delivery endpoints.
- [ ] Document provider-specific SMTP settings for Windows local development.
- [ ] Verify SMTP configuration fails explicitly when incomplete and succeeds only with a configured provider.
- [ ] Document non-destructive SMTP verification and troubleshooting steps.


## SMTP capability mismatch troubleshooting
- [ ] Verify the Windows backend process is loading the MailerSend SMTP variables without exposing secrets.
- [ ] Resolve any SMTP variable-name, sender-address, or restart mismatch causing `smtpEmail=false`.
- [ ] Recheck capabilities and perform one controlled delivery test after correction.


## Social publishing and video integration setup
- [ ] Inventory Meta, TikTok, LinkedIn, X, and video provider environment variables and callback routes.
- [ ] Document current provider account, OAuth, verification, and approval prerequisites.
- [ ] Configure available provider credentials without exposing secrets or committing them.
- [ ] Validate capability reporting, OAuth entry points, publishing errors, and explicit unavailable states.


## Gemini/Veo video generation
- [ ] Inspect the existing STUDIO video-generation contract and Gemini configuration.
- [ ] Verify current Veo image-to-video support, model names, pricing, and free-tier limits.
- [ ] Add or prepare a server-side video provider adapter without exposing the Gemini key.
- [ ] Add provider-contract tests and keep `videoGeneration` false until a working adapter is configured.


## Gemini/Veo and loading-performance pass
- [ ] Inspect the current video-generation contract, Gemini configuration, and frontend loading bottlenecks.
- [ ] Implement the server-side Gemini/Veo provider with operation polling and durable video storage.
- [ ] Add provider-contract tests and keep capability reporting honest for missing billing, model access, or credentials.
- [ ] Profile and fix slow initial loading, route transitions, and oversized frontend work.
- [ ] Run full backend/frontend/browser regression checks and create a pull-ready commit.

## Features page interactive scroll revision
- [x] Inspect the current Features route and shared STUDIO motion/design primitives.
- [x] Define a scroll-linked narrative and feature-level interactions for desktop and mobile.
- [x] Implement the interactive Features page without introducing fabricated product claims or testimonials.
- [x] Verify the route at desktop and mobile breakpoints, including reduced-motion behavior.
- [ ] Save a checkpoint and deliver the revised Features page.

## Push interactive Features revision to GitHub
- [x] Inspect the repository and identify the verified Features-page revision.
- [x] Synchronize the verified active-project changes into the Git checkout.
- [x] Run focused validation and create a descriptive commit.
- [x] Push the commit to origin/main and provide safe Windows pull commands.

## Separate Gemini caption and video credentials
- [x] Inspect caption and video services and current Gemini environment names.
- [x] Add separate caption/video key variables with backward-compatible fallback behavior.
- [x] Update environment templates, handoff documentation, and capability reporting.
- [x] Run backend/frontend validation and deterministic provider tests.
- [x] Commit and push the fix, then provide Windows pull and configuration steps.

## Fix fal.ai visual and caption workflow
- [x] Trace product-plus-model image generation and caption requests end to end.
- [x] Define a supported two-stage or composite-reference workflow for fal.ai.
- [x] Fix backend generation/caption errors and preserve explicit unavailable states.
- [x] Verify frontend progress, success, and failure states with backend validation.
- [x] Commit and deliver the workflow fix.

## Handle fal.ai account lock and top-up errors
- [x] Trace fal.ai 403 account-lock propagation and any retry behavior.
- [x] Add an actionable provider-specific error state without fabricating output.
- [x] Verify backend and frontend display the account-lock guidance clearly.
- [x] Commit and deliver the handling update.

## Provider-aware product-only photo-shoot fallback
- [x] Inspect provider capabilities and creative-job fallback paths.
- [x] Implement product-only generation with explicit model-description prompting when multi-reference input is unavailable.
- [x] Expose fallback mode clearly and validate creative workflow states.
- [ ] Commit and deliver the provider-aware fallback.

## Evaluate Stability AI as an image provider
- [ ] Review current STUDIO image-provider requirements and official Stability API capabilities.
- [ ] Compare Stability AI with fal.ai for product-reference and product-only workflows.
- [ ] Recommend or implement the compatible provider path without fabricating output.
- [ ] Validate the decision and document required configuration.

## Evaluate zero-cost unlimited image generation
- [ ] Research hosted free tiers and self-hosted/open-model cost constraints.
- [ ] Compare options with STUDIO's product-reference workflow and no-self-hosting preference.
- [ ] Deliver an honest recommendation and configuration path.

## Switch image generation to Stability AI
- [x] Inspect the official Stability API contract and STUDIO provider interfaces.
- [x] Implement the Stability adapter and environment configuration.
- [x] Preserve product-only/composite reference strategies and add quota errors.
- [x] Run backend/frontend validation and deterministic provider tests.
- [x] Commit, push, and document the Stability setup.

## Evaluate OpenRouter for STUDIO
- [ ] Review current OpenRouter model routing, multimodal support, pricing, and policy limits.
- [ ] Compare OpenRouter with STUDIO's caption, image, video, and reference-image requirements.
- [ ] Deliver an architecture recommendation and configuration path without claiming it is an unlimited provider.

## Add OpenRouter model fallback routing
- [x] Inspect current caption provider and request retry architecture.
- [x] Implement ordered OpenRouter model fallback with bounded retries for token, rate, and provider failures.
- [x] Add environment configuration, capability reporting, and safe observability without logging secrets.
- [x] Validate fallback routing with deterministic tests and deliver the implementation.

## OpenRouter-only test mode
- [x] Inspect current provider-selection and capability defaults.
- [x] Configure OpenRouter as the only active test provider without deleting other adapters.
- [x] Validate provider isolation and capability reporting.
- [ ] Commit and deliver the OpenRouter-only test setup.

## Fix duplicate IMAGE_PROVIDER startup error
- [ ] Identify all duplicate IMAGE_PROVIDER entries and local override sources.
- [ ] Remove duplicate entries while preserving OpenRouter-only test settings.
- [ ] Restart and verify backend capability reporting.

## Groq captions and OpenRouter images
- [ ] Inspect provider selectors and current environment mappings.
- [ ] Route caption generation through Groq and image generation through OpenRouter.
- [ ] Update environment templates and capability reporting.
- [ ] Validate provider isolation and deliver the corrected configuration.


## Duplicate environment-variable startup failure
- [ ] Inspect backend/.env for duplicate IMAGE_PROVIDER, GEMINI_API_KEY, and other repeated keys.
- [ ] Remove duplicate environment entries and align IMAGE_PROVIDER/CAPTION_PROVIDER with the verified provider configuration.
- [ ] Add or verify a startup-safe environment validation path that reports duplicate keys clearly without exposing secrets.
- [ ] Re-run Spring Boot startup and backend tests on the Linux checkout, then document Windows recovery commands.


## Windows database connection failure after environment cleanup
- [ ] Inspect the full JDBC connection exception and effective DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, and DB_SSL_MODE shape without exposing DB_PASSWORD.
- [ ] Verify Windows network reachability to the configured PostgreSQL/Supabase host and port.
- [ ] Confirm the Supabase pooler username, current database password, TLS mode, and JDBC URL construction.
- [ ] Re-run Spring Boot startup and confirm JPA initialization without changing or deleting database data.


## OpenRouter image model endpoint failure
- [ ] Verify the current OpenRouter image-output model identifier and endpoint support from official model documentation.
- [ ] Replace the unavailable default image model and update the OpenRouter image adapter if its response contract differs.
- [ ] Update application configuration, environment templates, and setup documentation with the supported model.
- [ ] Run backend tests and a non-secret provider-contract validation before pushing the correction.


## OpenAI image provider and caption response failure
- [ ] Inspect current image-provider selection, OpenAI-compatible configuration, and caption response parsing.
- [ ] Implement a dedicated OpenAI Images API adapter with reference-image support where available.
- [ ] Fix caption extraction, empty-response handling, and provider fallback behavior.
- [ ] Update environment and local-run documentation for OpenAI image and caption credentials.
- [ ] Run backend tests and provider-contract checks before pushing the migration.


## DeAPI image generation and Gemini captions
- [ ] Verify the current DeAPI endpoint, authentication header, model identifier, request format, and asynchronous response behavior from official documentation.
- [ ] Inspect the existing Gemini caption adapter and separate caption/video key configuration.
- [ ] Implement DeAPI image generation with reference-image support or an explicit product-only fallback when the selected DeAPI model cannot accept multiple images.
- [ ] Set Gemini as the caption provider and ensure empty or malformed Gemini responses produce explicit errors.
- [ ] Run backend tests and capability checks, then document the required environment variables without exposing secrets.


## Cloudflare image integration evaluation
- [ ] Inspect existing Cloudflare connector/API configuration before creating or enabling anything.
- [ ] Verify official Cloudflare MCP, Workers AI image-generation, and Images API capabilities and authentication.
- [ ] Determine whether the option supports product-plus-model references, image editing, asynchronous jobs, and STUDIO’s raw-byte image contract.
- [ ] Decide whether Cloudflare can replace DeAPI or should be used only for storage/transformation, then document exact setup and limits.


## Cloudflare Workers AI environment setup guide
- [ ] Document where to obtain the Cloudflare Account ID and how to create the least-privilege Workers AI API token.
- [ ] Map Cloudflare dashboard values to backend/.env without exposing the token.
- [ ] Document safe API verification, duplicate-key checks, and backend restart steps.


## Cloudflare provider implementation blocker
- [ ] Inspect the current ManagedImageService contract, provider selector, application properties, and provider tests.
- [ ] Implement Cloudflare Workers AI image generation and reference-image handling.
- [ ] Register the cloudflare provider and update capability reporting and supported-provider messages.
- [ ] Add configuration documentation and tests, then compile, test, commit, and push the implementation.


## Cloudflare temporary capacity errors
- [ ] Inspect current Cloudflare HTTP error handling and provider fallback behavior.
- [ ] Add bounded exponential backoff for HTTP 429/code 3040 capacity responses.
- [ ] Add a configurable retry count and retry delay without creating unbounded request loops.
- [ ] Preserve product-only fallback behavior and return a clear retryable error after capacity is exhausted.
- [ ] Add automated tests and document Cloudflare capacity-limit operations.


## Studio workflow functional repair
- [ ] Trace Studio frontend controls and map each action to its backend endpoint and request payload.
- [ ] Verify image-generation and image-editing controllers, authentication, multipart uploads, provider selection, and output persistence.
- [ ] Verify prompt propagation and validation from the editor textarea through provider requests.
- [ ] Verify caption-generation request construction, Gemini response extraction, persistence, and frontend rendering.
- [ ] Exercise multiple configured and unavailable provider paths in the sandbox without fabricating provider success.
- [ ] Fix confirmed defects, run backend/frontend production checks, and document any external quota or credential constraint.


## Replicate API-key configuration verification
- [ ] Verify the current Replicate API token creation flow and Bearer authentication requirements.
- [ ] Verify the selected FLUX.2 prediction endpoint, input_images field, output response, and polling lifecycle.
- [ ] Compare the official contract with ReplicateImageService and correct any model or URL mismatch.
- [ ] Add a safe PowerShell token diagnostic and document token scope, billing, and common HTTP errors.
- [ ] Re-run backend tests and commit any required adapter correction.


## Duplicate CAPTION_PROVIDER startup failure
- [ ] Inspect backend/.env for repeated CAPTION_PROVIDER entries and related duplicate Gemini variables.
- [ ] Keep exactly one active caption provider, with Gemini selected for the current configuration.
- [ ] Run the Windows preflight and Spring Boot startup after cleanup.
- [ ] Confirm the capabilities endpoint reports caption configuration without exposing secrets.


## Remove Cloudflare from active image generation
- [ ] Set Replicate as the sole active image provider in local and documented configuration.
- [ ] Remove Cloudflare from the active fallback chain while retaining optional provider code for later use.
- [ ] Verify no duplicate IMAGE_PROVIDER or IMAGE_FALLBACK_PROVIDER entries remain.
- [ ] Run backend/frontend checks and confirm capability reporting uses Replicate without Cloudflare requests.


## DeepAI provider migration
- [ ] Verify DeepAI’s current API key format, image-generation endpoint, model options, and image-edit/reference support from official documentation.
- [ ] Remove Replicate from the active provider configuration without deleting optional adapter code until DeepAI is validated.
- [ ] Implement or adapt a DeepAI image service for prompt generation and reference-image editing if the official contract supports both.
- [ ] Run backend/frontend tests and validate capability reporting and error handling.
- [ ] Document exact DeepAI environment variables, billing/limits, and any unsupported Studio workflow constraints.


## ApiFrame provider evaluation
- [x] Verify ApiFrame API-key format, image-generation endpoint, supported models, and response lifecycle from official documentation.
- [x] Verify ApiFrame image-editing/reference-image support for product-plus-model workflows.
- [x] Compare ApiFrame request and response schemas with STUDIO’s ManagedImageService contract.
- [x] Integrate ApiFrame because the documented API supports prompt generation, editing, and multi-reference workflows.
- [x] Run backend/frontend validation and document limits, billing, and required environment variables.

### ApiFrame research notes — 2026-08-17
ApiFrame’s official documentation states that requests use https://api.apiframe.ai/v2, authenticate with an X-API-Key header, submit image jobs to POST /v2/images/generate, and return 202 Accepted with a jobId and queued status. Completed jobs are polled through GET /v2/jobs/:id or received through webhooks; image results are CDN URLs and are retained for 90 days. The docs list flux-2-pro, seedream-4, seedream-4.5, seedream-5-pro, qwen-image variants, wan-image variants, and grok-image variants as supporting editing or reference-image use cases. The image product page claims reference-image generation and editing, but the common request body only documents prompt, model, webhookUrl, and webhookEvents; model-specific reference-image fields must be verified on individual model pages. ApiFrame advertises 500 authenticated requests per minute, with errors including 401 for invalid keys, 402 for insufficient credits, 429 for rate limits, and 503 for temporary unavailability. Pricing is described as pay-as-you-go with free credits to start, not unlimited free usage.


## Remove stale Replicate active references
- [x] Trace all Replicate references and classify active configuration versus historical research or optional adapter code.
- [x] Make ApiFrame the intended active image provider and remove stale Replicate fallback/configuration guidance where appropriate.
- [x] Validate backend tests, frontend checks, and final diff; save a corrected checkpoint.


## Push ApiFrame provider cleanup to GitHub
- [ ] Inspect current branch, remotes, and diff before committing.
- [ ] Commit the verified removal of Replicate and ApiFrame activation.
- [ ] Push the commit to the linked repository main branch and provide exact Windows pull steps.


## Align inner pages with STUDIO landing page
- [x] Inspect authenticated routes, shared layouts, and landing-page tokens.
- [x] Define a shared inner-page shell with the landing page’s editorial canvas, type, color, border, and motion language.
- [x] Redesign Studio, dashboard, onboarding, auth, and admin surfaces consistently.
- [x] Verify representative desktop/mobile routes, interactions, and production build; save a checkpoint.


## A4F image provider evaluation
- [ ] Verify A4F’s official authentication, endpoints, image models, request schema, response lifecycle, and usage limits.
- [ ] Verify A4F image editing and multi-reference support for STUDIO product-plus-model workflows.
- [ ] Compare A4F with the existing ManagedImageService contract and ApiFrame integration.
- [ ] Recommend integration, fallback, or rejection with exact environment configuration guidance.


### A4F initial research notes — 2026-08-18
A4F’s official docs describe an OpenAI-compatible API at `https://api.a4f.co/v1`, authenticated with `Authorization: Bearer <A4F_API_KEY>`. Image generation uses `POST /v1/images/generations` with required `model` and `prompt`, optional `n`, `size`, `quality`, `response_format`, `style`, and `user`, and returns a synchronous OpenAI-style `200` response containing temporary image URLs or base64 data. The documented image model ID must include an A4F provider prefix, and the model catalogue must be checked for actual image availability. The official usage endpoint exposes RPM/RPD limits, plan, whitelist, and model-specific usage. A4F’s free plan advertises 5 RPM and 300 RPD with limited model access; paid plans advertise higher model access and limits. A4F is therefore not an unlimited free provider, and its generated URLs are explicitly temporary.


### A4F editing and routing findings — 2026-08-18
A4F documents `POST /v1/images/edits` as a multipart/form-data endpoint requiring exactly one `image` file, one `prompt`, and a provider-prefixed editing model such as the example `provider-3/flux-kontext-pro`. The input file must be PNG, JPEG, GIF, or WEBP and under 4 MB. The documentation does not describe multiple image fields or a native two-reference product-plus-model edit request. A4F’s multimodal chat content can carry image URLs, but that is a different chat-completion workflow and is not documented as image synthesis/edit output. Image generation and edit results are synchronous OpenAI-style responses with temporary URLs or base64. A4F requires the application to choose provider prefixes explicitly and does not automatically fail over between providers; custom fallback must be implemented by STUDIO. A4F’s free tier is limited to 5 RPM and 300 RPD, while paid plans provide higher access but are not unlimited-free.


## Integrate A4F product visual generation
- [ ] Inspect the current managed image-service contract, provider selector, configuration, and product generation flow.
- [ ] Implement A4F text-to-image generation with Bearer authentication, OpenAI-compatible response parsing, temporary URL download, and clear errors.
- [ ] Add A4F configuration and product-generation documentation while preserving ApiFrame fallback behavior.
- [ ] Add deterministic A4F adapter tests and run backend/frontend validation.
- [ ] Commit and push the verified integration with exact Windows environment and pull steps.


## Hosted free-tier image-provider alternatives
- [ ] Research current hosted alternatives to A4F with real free-tier access and official limits.
- [ ] Verify generation, single-reference editing, and multi-reference support for product visuals.
- [ ] Compare reliability, temporary-output behavior, integration effort, and production suitability.
- [ ] Recommend a primary/fallback strategy without self-hosting.


### Hugging Face Inference Providers findings — 2026-08-18
Hugging Face officially documents Inference Providers as a hosted API covering image generation and other modalities, with a free tier for experimentation. Its official image-editor guide demonstrates image-to-image editing through Qwen Image Edit and Black Forest Labs Flux Kontext, accepting an uploaded image plus a natural-language editing prompt. This makes Hugging Face a stronger functional match than A4F for single-reference product editing. The official pricing documentation must be used for the current exact credit amount because free credits can change; the page currently advertises a small monthly free allowance, not unlimited production usage. Multi-reference product-plus-model support is not established by the image-editor guide and should not be assumed without model-specific verification.


Official sources for follow-up comparison:
- https://huggingface.co/docs/inference-providers/pricing — official monthly free-credit and pay-as-you-go terms.
- https://huggingface.co/docs/inference-providers/en/guides/image-editor — official hosted image-editor guide using Qwen Image Edit and Flux Kontext.
- https://huggingface.co/models?pipeline_tag=image-to-image — official model catalogue filtered for image-to-image models, including FLUX.1-Kontext-dev and related models.
- https://huggingface.co/models?other=diffusers%3AQwenImageEditPipeline — official catalogue filtered for Qwen Image Edit pipeline models.


## Together AI provider evaluation
- [ ] Verify Together AI image models, API schema, billing, limits, and current free-access status.
- [ ] Verify image editing and reference-image support for product visuals.
- [ ] Compare Together AI with STUDIO’s managed image-service contract.
- [ ] Recommend integration or document why it should not be used for this workflow.


## Puter.js provider evaluation
- [ ] Verify Puter.js official image-generation API, supported models, execution model, and free-use terms.
- [ ] Verify image editing, reference-image inputs, output storage, and browser/backend constraints.
- [ ] Compare Puter.js with STUDIO’s backend-managed provider contract and security model.
- [ ] Recommend safe use, limited demo use, or rejection for production product visuals.


### Puter.js initial findings — 2026-08-18
Puter’s official image-generation page presents Puter.js as a browser-oriented JavaScript API that exposes many image models without the application developer supplying provider API keys or running a server. The page explicitly promotes a **User-Pays model**, where users cover their own AI costs through Puter, rather than a conventional developer-owned free API quota. Official docs advertise access to multiple image models and no infrastructure setup, but this does not equal unlimited provider capacity or guaranteed free production usage. The current research still needs to verify image editing/reference-image inputs, user authentication requirements, output retention, commercial terms, and whether server-side use is supported before STUDIO could safely adopt it.

Official sources:
- https://developer.puter.com/image-generation/
- https://docs.puter.com/AI/txt2img/
- https://developer.puter.com/tutorials/free-unlimited-image-generation-api/
- https://docs.puter.com/


### Puter.js image-editing and security findings — 2026-08-18
Puter’s official `puter.ai.txt2img()` documentation supports image-to-image through `input_images`, where inputs can be public URLs, data URIs, or raw base64. It documents multiple-image support for OpenAI, Gemini, and some xAI/Replicate models, but explicitly says Together supports only one input image and returns 400 for more than one. Puter’s output resolves to an HTMLImageElement whose `src` is a data URL, and it can optionally save files to the user’s Puter filesystem with `puter_output_path`.

Puter websites must authenticate each user with a Puter.com account before using cloud services. The official security docs say browser apps get a per-user sandboxed app directory, key-value store, and AI access; centralized cross-user data requires a Puter Serverless Worker. This means Puter.js is not a drop-in backend provider for STUDIO’s existing Spring-managed jobs and Supabase persistence. It introduces a second user/account system and user-controlled storage boundary. Its User-Pays model may be attractive for a browser demo, but STUDIO cannot guarantee generation availability to users who have not authenticated with Puter or whose Puter usage is exhausted.


## Isolated Puter.js browser experiment
- [ ] Inspect the Studio frontend surface and existing asset/generation states.
- [ ] Define explicit Puter sign-in, quota, generating, success, failure, and save-to-STUDIO states.
- [ ] Add an optional browser-side product visual experiment without changing the backend provider path.
- [ ] Validate build and responsive behavior, then push the isolated experiment with setup notes.


## Expand Puter experimental visual layer
- [ ] Trace every image-generation, editing, photo-shoot, variation, and creative-workflow entry point in the frontend.
- [ ] Define one experimental Puter mode with explicit provider, sign-in, quota, unsupported-capability, loading, success, and failure states.
- [ ] Wire Puter generation/editing into all appropriate visual workflow controls without changing the production backend route.
- [ ] Validate the expanded workflow, responsive layout, and production build; commit and push the update.


## Full Studio Puter experimental integration
- [ ] Inventory all Studio visual-generation, editing, variation, batch, and export entry points and classify current coverage.
- [ ] Create shared Puter browser utilities and explicit experimental capability states.
- [ ] Wire Puter into every appropriate visual surface while preserving server-backed production actions.
- [ ] Validate the full Studio UI, build, and backend isolation, then commit and push the integration.


## Unified Puter Studio workflow
- [ ] Remove visible Puter experiment, Studio Server, Optional Browser Experiment, and ApiFrame engine labels/selectors from Studio surfaces.
- [ ] Make Puter.js the sole visible visual-generation path for direct generation, Photo Shoot, Edit Image, and batch visuals.
- [ ] Preserve only necessary internal compatibility code and explicit Puter sign-in/quota/error states.
- [ ] Validate all affected routes and production build, then commit and push.


## No-balance visual generation fallback
- [ ] Verify whether WebLLM supports image generation/editing or only browser-local text inference.
- [ ] Compare browser-local and hosted alternatives that do not require Puter balance for STUDIO visuals.
- [ ] Map a practical fallback for captions, product visuals, Photo Shoot, and Edit Image without misleading availability states.
- [ ] Decide whether to implement a fallback or keep Puter as an explicitly balance-dependent option.


### No-balance research notes — 2026-08-18
WebLLM’s official site and repository describe it as an in-browser **language-model** inference engine using WebGPU; it provides OpenAI-compatible text/chat APIs and does not provide image-generation or image-editing models. It cannot replace Puter for STUDIO’s visual workflow. The closest browser-local direction is WebSD or other WebGPU diffusion projects, but these require downloading large model weights to each user’s browser, depend heavily on GPU/browser support, and are not a stable production path for product-plus-model imagery. Transformers.js can run supported models in-browser, but it is a runtime rather than a free hosted image API and does not guarantee that a suitable diffusion/editing model is available at acceptable performance.

Hugging Face Inference Providers remains the most practical no-Puter-balance hosted experiment because its official platform offers monthly free credits and image generation/editing providers, but those credits are limited and can change. It is not unlimited and still requires a Hugging Face token for backend use.


## No-balance WebLLM + Hugging Face fallback
- [ ] Inspect current caption, prompt, and image-provider integration points.
- [ ] Add WebLLM browser-local caption and prompt assistance with loading and WebGPU-unavailable states.
- [ ] Add Hugging Face image generation and single-reference editing fallback without exposing tokens in the frontend.
- [ ] Validate quota/unavailable states and production build, then commit and push.


## Website error recovery
- [ ] Inspect the attached error file, repository state, frontend build/runtime logs, and backend validation output.
- [ ] Reproduce and isolate all current frontend, backend, dependency, and integration failures.
- [ ] Apply targeted fixes without regressing the Studio visual workflows.
- [ ] Run full frontend/backend validation and representative route checks.
- [ ] Commit and push the corrected project with recovery steps.


## Latest website error report recovery
- [ ] Read the second attachment and inspect current repository/runtime state.
- [ ] Reproduce and isolate every reported frontend/backend failure.
- [ ] Apply targeted fixes while preserving existing Studio generation workflows.
- [ ] Run frontend/backend validation and representative route checks.
- [ ] Commit and push the corrected version with local recovery steps.


### Latest website error report diagnosis — 2026-08-18
The second attachment does not show an application compile or route error. `pnpm install --frozen-lockfile` completed, WebLLM resolved, and `pnpm build` compiled TypeScript and generated all 18 routes successfully. The failure occurred because a Next.js dev server with PID 15424 was already listening on port 3000; starting `pnpm dev` or `npm run dev` launched a second server, which exited with `Another next dev server is already running`. The `nm run dev` line was a PowerShell typo and should be `npm run dev` or `pnpm dev`. Recovery is to stop PID 15424, then start exactly one dev server.

## Revert latest startup-warning commit
- [ ] Confirm commit `1512123` is the latest published commit and `cdb34fc` is its parent.
- [ ] Create and push a reversible revert commit for `1512123` without rewriting Git history.
- [ ] Provide safe Windows pull steps for the restored state.

## Revert WebLLM and Hugging Face fallback
- [ ] Confirm commit `31bf433` is the next requested rollback target.
- [ ] Create and push a reversible revert commit for `31bf433` without rewriting Git history.
- [ ] Provide safe Windows pull steps for the restored state.

## Fully free creative-generation architecture
- [ ] Verify a no-paid-API architecture for captions, image generation, Photo Shoot, and image editing.
- [ ] Evaluate browser-local and user-run open models against GPU, storage, browser, quality, and multi-reference requirements.
- [ ] Distinguish fully free software from hosted services with limited free credits or user-paid balances.
- [ ] Select and implement only a technically honest free path with explicit device-capability states.

## RapidAPI caption-generation evaluation
- [x] Verify RapidAPI pricing, free-plan quotas, and viable caption-generation API listings.
- [x] Compare a selected RapidAPI caption endpoint with Gemini, Groq, and browser-local captions for STUDIO.
- [x] Document exact RapidAPI account, subscription, key, environment-variable, and backend-adapter steps.
- [ ] Implement a RapidAPI adapter only after selecting a specific caption or text-generation listing and verifying its contract, quota, privacy policy, and pricing.

## Groq caption-provider activation
- [x] Set Groq as the documented active caption provider without committing an API key.
- [x] Verify configuration binding, error handling, and the Groq generation request through backend tests.
- [x] Document secure Windows activation and a non-secret capability validation command.

## Generated-caption selection interaction
- [x] Trace the generated-caption click handler, selected-caption state, and post-composer binding.
- [x] Make caption selection visibly apply the text to the active workflow and preserve selection state.
- [ ] Perform one authenticated, live browser verification after a visual provider can generate a result.
