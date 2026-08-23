# Supplied React Bits selection for Press Bench

## Evaluation

| Supplied pattern | Decision | Reason |
|---|---|---|
| `DepthCarousel` | **Adapt for Assets** | A manual, reduced-motion-aware depth carousel can browse real uploaded source and saved-post media without changing records or requiring a new backend API. |
| `MaskedHeading` | Do not use | It is a marketing hero treatment and requires a decorative image/video source; it would distract from operational page headings. |
| `ScrollExpand` | Do not use | Full-scroll media expansion is unsuitable for dense product work and conflicts with the persistent Press Bench tool dock. |
| `DriftWall` | Do not use | Continuous animated decorative media has no operational purpose and should not be invented when records are unavailable. |
| `PillNav` | Do not use | It duplicates the Press Bench dock and would fragment the existing authenticated navigation hierarchy. |
| `StaggeredMenu` | Do not use | It duplicates command palette/dock navigation, introduces a full-screen interruption, and would be unsuitable for the Admin control room. |

## Integration contract

The Assets route is the only selected location. The adapted component consumes existing product source URLs and saved post image URLs. It has explicit previous/next controls, keyboard arrow support, descriptive labels, no autoplay, no external placeholder media, and a no-animation reduced-motion branch. The standard asset grid remains available below it as the complete browseable record list.
