# React Bits Depth Carousel validation — 23 August 2026

## Selected integration

The supplied `DepthCarousel` pattern was adapted as `AssetDepthCarousel` for the member **Assets** route. It only renders when at least two persisted STUDIO assets exist. Its input is the existing product source URL set (`imageUrl`, `imageUrl2`, `imageUrl3`) plus existing saved post `imageUrl` values; it does not create placeholders, generated visuals, or new storage data.

| Requirement | Validation |
|---|---|
| Manual control | Previous/next buttons and asset-card selection update the active real asset. No autoplay is used. |
| Keyboard access | The carousel stage accepts arrow-left and arrow-right keys; control buttons remain native keyboard buttons. |
| Reduced motion | `useReducedMotion` resolves transform and transition motion immediately. |
| Mobile | The media stage and card width shrink under the Press Bench mobile breakpoint. |
| Existing library | The regular complete asset grid stays below the carousel and remains the canonical direct-open record list. |
| Empty state | With the sandbox backend unavailable and zero saved assets, Assets correctly shows the existing truthful empty state instead of a fabricated carousel. |

`pnpm build` completed successfully after the new component and integration. The browser review confirmed that the Assets route still exposes the unavailable-data banner and zero-file empty state without a client rendering error.
