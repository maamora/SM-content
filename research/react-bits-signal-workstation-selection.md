# React Bits selection for Signal Workstation

## Decision

The supplied components are being used **selectively**. STUDIO is an authenticated production tool, so animations must clarify real sources and selections rather than create a decorative landing-page layer.

| Supplied component | Decision | Reason |
|---|---|---|
| `Stack` | **Adopt** | Its card ordering interaction maps directly to a selected product’s actual first, second, and third source images in Studio. |
| `TiltedCard` | **Adopt** | A restrained pointer tilt is useful for the real image preview on product source cards; it preserves the existing product detail link and delete action. |
| `MaskedHeading` | Do not adopt | It requires GSAP, needs a decorative image/video asset, and would compete with the concise operational copy requested for inner pages. |
| `ScrollExpand` | Do not adopt | A pinned scroll narrative is inappropriate inside a dense editor and risks trapping workspace scroll behavior. |
| `SwarmCursor` | Do not adopt | It requires OGL/WebGL and would degrade clarity and workstation performance. |
| `DepthCarousel` | Do not adopt | It requires GSAP and would make individual source records harder to scan and access. |
| `DriftWall` | Do not adopt | Repeating real product images as ambient decoration would obscure the source-library workflow. |
| `PillNav` | Do not adopt | It is designed for `react-router-dom`, requires GSAP, and duplicates STUDIO’s workspace rail. |
| `StaggeredMenu` | Do not adopt | It requires GSAP and conflicts with the existing accessible command palette and responsive route navigation. |

## Adaptation contract

Both selected components are implemented with STUDIO’s existing `motion/react` dependency rather than adding GSAP. They use real image URLs only, honor reduced-motion preference, retain native link and button behavior, and do not change the public landing page or the Admin control room.
