# React Bits selection for Quiet Studio

## Assessment

The registry was reviewed through the configured shadcn MCP before any code was installed. React Bits includes visually striking but unsuitable options for STUDIO’s current product direction: cursor-following spotlights, animated star borders, chroma grids, and background effects would compete with the production workflow and introduce unnecessary visual motion. Both `FadeContent` and `AnimatedContent` depend on GSAP; only one motion wrapper is warranted.

| Candidate | Decision | Reason |
|---|---|---|
| `FadeContent-TS-TW` | Selected | A small entrance wrapper can make the active work sequence easier to scan when restrained to short opacity/translate transitions. |
| `AnimatedContent-TS-TW` | Rejected | Overlaps with FadeContent’s purpose; adding both would make motion feel accidental rather than meaningful. |
| `SpotlightCard`, `StarBorder`, `ChromaGrid` | Rejected | Cursor-driven or continuous decoration conflicts with the calm, eye-resting Quiet Studio system. |
| Backgrounds and text effects | Rejected | They do not improve a real authenticated workflow and risk changing the product into a visual demo. |

## Planned use

`FadeContent` will be installed as a dependency-managed React Bits component, then adapted to honor `prefers-reduced-motion`. It will wrap only the key live work areas on the authenticated Overview and Products routes. It will never wrap high-frequency controls, the public landing page, or a mock data state. The layout remains useful without animation.

## Integration result

`FadeContent-TS-TW` was installed through the shadcn registry command and adapted for STUDIO. It uses short low-distance reveal transitions on selected desktop work regions only, completes immediately for reduced-motion preferences, and is explicitly disabled on narrow screens where instant access is more important than staging. It did not alter API calls, data ownership, uploads, Brand behavior, captions, approval, export, scheduling, or the public landing page.
