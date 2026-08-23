# STUDIO workstation improvement contract

## Purpose

This document records the completed product-workstation improvements and their implementation boundaries. The improvements make existing creative operations easier to navigate, review, and hand off; they do not replace the local-SVG renderer with an AI image service or fabricate delivery, account, or backend history.

| Improvement | User-facing behavior | Source of truth |
|---|---|---|
| Command palette | Opens with `⌘/Ctrl + K`, searches real authenticated routes, and navigates to the selected workspace. | Client-side route list; no background action is simulated. |
| Contextual onboarding | Shows Brand, Product, and Studio setup steps only while those live records are incomplete. A dismissal preference is remembered locally. | Brand/product/post API state plus local browser dismissal preference. |
| Continue-work queue | Presents missing source, composition, draft review, or delivery hand-off only when the corresponding live record state requires it. | Live product/post records. |
| Studio tooling | Provides zoom, visual safe-area guides, source-image completeness, keyboard render guidance, and review readiness. | Existing local-SVG Studio state and persisted post/caption state. |
| Source library | Filters existing product records client-side and reveals status and image-count completeness. | Existing product API response; three persisted source slots. |
| Brand guardrails | Summarizes saved logo, color pair, and tone guidance while keeping logo placement optional on each post. | Existing Brand API fields. |
| Delivery context | Shows the device timezone beside the actual scheduler step. | Browser timezone; selected datetime is still converted to ISO before the existing server queue call. |
| System readiness | Continues to report capability and unavailable states rather than claiming that unconfigured providers are connected. | Existing capabilities and error responses. |

## Explicit non-goals

The improvement pass does not add a fake undo history, mock channel connection, false delivery receipt, artificial analytics chart, destructive admin control, or invented review note. These functions require audited persistence endpoints and should only be added with corresponding backend routes and tests.
