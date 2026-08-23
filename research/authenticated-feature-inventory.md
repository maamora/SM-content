# STUDIO authenticated feature inventory

## Scope boundary

This inventory covers only routes reached after authentication under `/dashboard/*`, plus the separate `/admin/*` control room. The public landing, marketing shell, and public-page assets are explicitly out of scope for the redesign.

## Workspace navigation and core flow

The authenticated product has three functional groups: **Create** (`Overview`, `Products`, `Brand`, `Studio`, `Batch`), **Library** (`Assets`, `Posts`, `Calendar`), and **Delivery** (`Social`, `Notifications`, `Settings`). The primary product flow is: create or upload a product source → optionally configure Brand → compose or import a post → generate and edit separate captions → approve/export → connect a social channel and queue immediate or scheduled delivery.

| Route | Real feature set that must remain intact | Primary dependency |
|---|---|---|
| Overview | Live product/post counts, current creative-thread status, readiness steps, refresh, and context-sensitive first action. | Product, post, Brand APIs. |
| Products | Product list, status visibility, product delete, product create/edit, three image slots, product image uploads, and opt-in testing catalog. | Product API and storage. |
| Brand | Brand name, colors, font family, tone guidance, direct logo upload or URL, validation, save status, neutral-default behavior. | Brand API and storage. |
| Studio | Template/local SVG composition, imported visual workflow, product search/selection, post format, template, mood, direction controls, local preview, optional configured logo and placement, four independent caption drafts, per-language save/copy, approval, ZIP export, and delivery hand-off. | Product, template, Brand, post APIs. |
| Batch | Select approved products, choose format/template, server batch start, progress polling, error handling, completed output review, individual downloads, and reset/new-batch state. | Product, template, batch APIs. |
| Assets | Combined product-image and post-image library, open original asset in a new tab, empty guidance. | Product and post records. |
| Posts | Persisted post list, status/format/caption readiness, individual ZIP export, deletion, and Studio hand-off. | Post API. |
| Calendar | Persisted post timeline based on creation dates and post hand-off. | Post records. |
| Social | Provider connect/disconnect, active-connection status, approved-post selection, immediate or scheduled server-side publish job, validation, and delivery receipt history. | Social OAuth and publish-job APIs. |
| Notifications | Product-approval/draft-post signals plus SMTP delivery history, errors, and empty states. | Product, post, email APIs. |
| Settings | Current account and workspace state, plus live system capability/readiness display. | Auth and system APIs. |

## Cross-route behavior that is not design decoration

Every route contains loading, error, unavailable-data, empty, disabled, and live-update states. The redesign must retain those states rather than hiding them behind visual placeholders. Product and post data are owner-scoped; pending products can be used by their creator in Studio for testing. Brand is neutral until a user saves settings, and its configured logo is optional per post. Local SVG template composition and deterministic multilingual captions must be described honestly, not presented as AI photography or external-provider output.

## Admin control room boundary

The `/admin/*` routes expose system summaries, product approvals, content/template records, connection readiness, and intentionally disabled directory/audit actions where audited backend routes do not exist. The new inner-product system may provide shared visual primitives to admin, but it must not manufacture admin mutations, audit logs, or controllers that the backend does not expose.

## Design preservation contract

The new design may reorganize surfaces, reduce visual noise, collapse secondary controls, improve information hierarchy, and strengthen responsive sequencing. It may not remove APIs, import/export workflows, field validation, direct uploads, language independence, approval gating, delivery scheduling, or the clear unavailable-data fallback.
