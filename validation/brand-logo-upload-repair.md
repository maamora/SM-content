# Brand logo upload repair — 23 August 2026

## Corrected flow

The Brand form now uploads a selected image to the authenticated `POST /api/uploads/brand-logo` route, receives its public storage URL, and immediately persists that URL through the existing authenticated Brand `PUT /api/brand` request. The form updates its saved Brand state from that response and reports **“Logo uploaded and saved.”** A separate save click is no longer required solely to make an uploaded logo available to Studio.

| Boundary | Verification |
|---|---|
| Frontend multipart request | `uploadBrandLogo` uses the dedicated authenticated Brand-logo endpoint and continues to send the required `file` multipart field. |
| Server upload route | `UploadController` stores valid logo uploads under `brand/logos`, retaining the existing 15 MB and image-only validation. |
| Brand persistence | The existing Brand update service persists the returned `logoUrl`; no automatic placement setting is enabled. |
| Local fallback serving | `/files/**` returns proper image MIME types, including PNG, JPEG, GIF, WebP, and SVG, so a locally stored logo can render in the Brand preview and local-SVG post composition. |
| Storage safety | File serving resolves paths under the configured upload root and rejects traversal outside it. |

## Automated checks

`bash mvnw test` completed with **38 passing tests**, including new coverage that confirms a locally stored Brand PNG is served as `image/png` and an outside-root request is rejected. `pnpm build` also completed successfully after the immediate-save frontend change.

## Scope boundary

The logo remains optional. Uploading a logo saves it for later use but does not turn on logo placement in a composition; that remains the explicit Studio toggle.
