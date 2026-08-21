# Editable composer and scheduling setup visual review

Reviewed on 2026-08-21 against the local Next.js preview at `/dashboard/studio` and `/dashboard/social` while the API service was intentionally unavailable.

| Surface | Verified result |
|---|---|
| Product-post composer | The old product-plus-model flow is absent. The workspace exposes Composer and Importer modes, editable offer/badge/accent controls, a local SVG preview, caption tabs, and review/export actions. |
| Direct-upload path | The Importer mode is present as an explicit composer action. Its runtime upload action requires an authenticated, reachable backend. |
| Social connection setup | The screen renders a three-step Connect → Choose → Schedule progression, with channel-level connection controls and a time selector for persisted future delivery. |
| Unavailable states | The application reports the missing backend directly and preserves disabled/empty workflow states rather than suggesting that a post, connection, or delivery occurred. |

The browser review was performed without a live backend, so provider OAuth redirects, authenticated media upload, and external channel delivery require the configured Spring API and each channel’s credentials to exercise end-to-end.
