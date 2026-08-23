# Edition Desk visual review

## Initial desktop pass — 23 August 2026

The local frontend was reviewed with the backend intentionally unavailable at `http://localhost:8080`. The unavailable banner and retry controls remain visible and readable; no sample data is substituted for live records.

| Route | Observed result | Design and workflow finding |
|---|---|---|
| `/dashboard` | The overview uses a light index rail, editorial route thesis, blue-led metric ledger, source-thread sheet, and dark next-action panel. | The page now reads as a production docket rather than a generic bento dashboard. The first action remains “New direction,” while the empty source state directs the user to add a real product. |
| `/dashboard/social` | The live unavailable state, OAuth connection choices, delivery stepper, real selects, scheduling field, queue action, and receipts state render together. | The operational flow stays understandable even when server data is absent. The primary delivery form is visually distinct without hiding the backend failure. |

The redesign keeps all existing navigation targets, semantic buttons, selects, and retry behavior. Next validation will cover the Studio composer, narrow-screen sequencing, and the production build.

## Studio and source-library desktop pass — 23 August 2026

| Route | Observed result | Design and workflow finding |
|---|---|---|
| `/dashboard/studio` | The existing direction → artboard → finishing sequence renders as paper control sheets around a calibrated navy canvas. The neutral-brand explanation, local-SVG labels, four language tabs, per-language editor, approval, export, and empty product guidance all remain exposed. | The most complex workflow has a clearly distinct visual centre without misrepresenting the local template composition as a generated photograph. Disabled actions accurately explain their prerequisites. |
| `/dashboard/products` | The contact sheet, neutral brand panel, product form, all three image-slot labels, and opt-in testing catalog remain in the functional source-library route. | The new treatment retains the real form rather than replacing it with a decorative upload card. The brand panel directs users to a configured, optional logo source. |

The next pass will verify narrow layouts and keyboard-visible focus treatment. The production build already completes successfully after the Edition Desk import.

## Narrow Studio pass — 390 × 844, 23 August 2026

The first raw headless capture stopped before client hydration and showed the existing loading state only. A second capture with a five-second virtual-time budget reached the actual unavailable-data fallback and Studio surface. At the narrow breakpoint, the navigation becomes a horizontal route strip, the artboard thesis precedes the control sheet, and the composer/importer, product source, format, and template controls stack at a readable width. The three-column desktop authoring area is intentionally resequenced into stacked sheets rather than compressed.

The visible unavailable-data notice remains at the top of the mobile work area. Its retry control is preserved, and the page does not invent a product or a generated post to fill the state.

## Scope boundary and admin pass — 23 August 2026

| Surface | Result |
|---|---|
| Public landing `/` | The existing dark botanical marketing composition, green signal color, media board, calls to action, and page hierarchy remain intact. The new stylesheet is restricted to `.studio-app` and does not alter the public shell. |
| Admin `/admin` | The control room inherits the same light index, editorial masthead, hairline record sheet, and visible backend-unavailable notice. Its fallback exposes real zero/unknown record values rather than fabricated administration data. |

No public landing selectors were changed. The authenticated stylesheet contains the final Edition Desk rules; the prior inner-page layers remain loaded only as compatibility sources that this final layer overrides.

## Keyboard focus check — 23 August 2026

From `/dashboard`, pressing `Tab` moves focus to the STUDIO home link in the index rail. The target receives a visible two-pixel edition-blue outline with an offset, and the page remains stable rather than using an animated focus treatment. The shared `:focus-visible` rule also applies to authenticated links, buttons, inputs, selects, and textareas.

## Page-architecture replacement pass — 23 August 2026

The shared authenticated route composition now resolves through `EditionDeskShell`, `RouteMasthead`, and `RouteControlBar`, while page-local surfaces retain ownership of live data and actions. Desktop checks of Overview and Social confirm that the index rail remains persistent, every route has one clear thesis and one primary action, and the actual backend-unavailable notice remains visible above the work surface.

The Social route retains its real connection rows, OAuth actions, post/channel selectors, schedule field, queue action, and receipt ledger. The new masthead and control bar reorganize those controls without hiding delivery prerequisites or simulating connections.

The Admin control room now uses the same shell, masthead, and refresh control bar. Its system overview continues to expose backend-unavailable and fallback values rather than inventing administrative records. The Studio route intentionally remains its own three-zone authoring table inside the new shell; its source selection, local-SVG canvas, Brand placement, four independent caption fields, approval, and export controls remain visible in their existing task order.

At 390 px, the replaced shell continues to transform the index into a horizontal route strip. The Studio route retains the visible unavailable-data notice, then sequences the route thesis, reset action, Composer/Importer control, product search, and format/template controls vertically before the artboard. This confirms that the new shared architecture does not compress the authoring workflow into an unreadable desktop grid.
