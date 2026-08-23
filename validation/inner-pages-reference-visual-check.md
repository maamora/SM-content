# Inner-page reference visual check

## Desktop verification — 2026-08-23

The authenticated Overview and Products routes were inspected against the local frontend running at `http://localhost:3001`. The sandbox has no backend process at `http://localhost:8080`; therefore, the visible retry notice is the expected existing live-data fallback rather than a design or client failure.

| Route | Reference implementation observed | Functional surface retained |
|---|---|---|
| `/dashboard` | Editorial serif masthead, live metric ledger, charcoal source-to-delivery thread, and acid-lime next-move column. | Retry and refresh controls; data-derived empty thread; links to real product and Studio routes. |
| `/dashboard/products` | Warm-paper source-library/contact-sheet composition, dark Brand-kit rail, and editorial upload section. | Live product list/delete component, create/upload form, testing catalog action, and actual Brand-kit status rather than mock configuration. |

The configured Brand drawer now reads the persisted Brand endpoint independently. It shows a neutral state when no kit is configured and exposes the saved logo/name state when one exists, preserving the rule that no logo is added to posts by default.

## Studio verification — 2026-08-23

The `/dashboard/studio` control room was inspected in the same frontend-only fallback environment. It retains the supplied three-pane composition: an input rail for source, direction and local template controls; a central dark gridded artboard; and a right rail for the optional Brand mark, separated caption editors, validation, and export. The existing controls remain exposed and reachable by keyboard: compose/import mode, product lookup, format, atmosphere, structure, composition settings, campaign copy, local render, four independent language caption editors with copy actions, approval, and ZIP export.

The visible empty-product messaging is intentionally data-derived. It tells the user to add a product before rendering rather than pretending that a product or generated result exists.

## Narrow viewport verification — 390 px

Initial 390 px captures of Overview and Products exposed a horizontal authenticated-shell overflow: the compact navigation was visible but the page canvas started outside the viewport. This was corrected by stacking the compact navigation above the workspace canvas below 620 px, without changing the desktop reference composition.

Follow-up Overview and Products captures confirm the editorial masthead, actions, search control, and loading/fallback area now remain within the mobile viewport. Headless screenshots capture the loading state before the unavailable local backend request settles; the desktop interactive inspection confirmed the existing retry notice follows afterward.

The settled mobile Studio view also keeps its data-unavailable notice, large editorial heading, and the first control-room pane within the viewport. The three desktop control-room columns appropriately continue as a vertical authoring sequence on narrow screens, so no unsupported horizontal scroll is required to reach source, artboard, or captions.

Final narrow-screen captures also confirm that the unavailable-data notice and Products source-library headings meet the warm-paper contrast requirement. The final frontend production build completed successfully after these adjustments.
