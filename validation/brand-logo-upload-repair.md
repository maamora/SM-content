# Brand logo upload regression repair — 23 August 2026

## Corrected flow

The Brand form now sends a selected image to the authenticated `POST /api/brand/logo` route. The server validates the optional image, stores it under `brand/logos`, persists its URL on the current user’s Brand record, and returns the saved Brand state in the same operation. The form uses that saved response for its preview and reports **“Logo uploaded and saved.”** A separate save click is not required solely to make an uploaded logo available to Studio.

| Boundary | Verification |
|---|---|
| Frontend multipart request | `uploadBrandLogo` submits the required `file` field to `POST /api/brand/logo`; choosing the same file again is supported because the picker is reset after each selection. |
| Server upload route | `BrandSettingsController` delegates the authenticated request to `BrandSettingsService`, which validates the 15 MB image limit, stores the file under `brand/logos`, requires a usable storage URL, and persists the current user’s Brand record before responding. |
| Brand persistence | The client receives the saved `BrandSettings` response directly; it no longer relies on a second browser request racing the completed multipart upload. No automatic placement setting is enabled. |
| Local fallback serving | `/files/**` returns proper image MIME types, including PNG, JPEG, GIF, WebP, and SVG, so a locally stored logo can render in the Brand preview and local-SVG post composition. |
| Storage safety | File serving resolves paths under the configured upload root and rejects traversal outside it. |

## Automated checks

`bash mvnw test` completed with **40 passing tests**. The focused `BrandSettingsServiceLogoUploadTest` also passes with two checks: an image upload stores and persists the URL in one operation, and a non-image is rejected before storage or persistence. `pnpm build` completed successfully after the frontend change.

## Scope boundary

The logo remains optional. Uploading a logo saves it for later use but does not turn on logo placement in a composition; that remains the explicit Studio toggle.
