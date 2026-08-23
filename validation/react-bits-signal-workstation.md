# Selective React Bits validation — 23 August 2026

## Selected adaptations

| Adaptation | Live STUDIO surface | Real data boundary |
|---|---|---|
| Motion-compatible `SourceStack` | Studio source inspector | Uses only the selected product’s persisted `imageUrl`, `imageUrl2`, and `imageUrl3`; it is not rendered when fewer than two real source images exist. |
| Motion-compatible `TiltedMedia` | Product contact-sheet media tile | Wraps the existing persisted product image and preserves the product detail link, status pill, and delete control. |

## Verification

`pnpm build` completed successfully after the integrations. Studio and Products were reviewed at `http://localhost:3001` with the sandbox backend unavailable. The shared workstation shell, Product source search/filter controls, Studio artboard, command trigger, Product intake form, and truthful **Live data unavailable** banner remained available and readable.

The two selected components have no new dependency: both use the existing `motion/react` package. Pointer tilt is disabled for coarse pointers and reduced motion; the source stack receives an explicit zero-duration motion transition when reduced motion is requested. The components are keyboard-operable where interactive, and no public landing or Admin control-room selector was changed.

## Deferred rendering note

The sandbox had no live source records, so the visual review correctly did not fabricate a product image merely to make the source stack or tilt effect appear. The components compile and are gated on real source image availability; validate their populated presentation after starting the backend and loading or creating a product with at least two source images.
