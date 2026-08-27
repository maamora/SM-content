# Inner-page production-desk redesign validation

## Scope

This validation covers the redesign that adapts information hierarchy and functional interaction patterns from researched creative, asset, and social operations products. It does not copy competitor branding or present fabricated product, publish, analytics, or backend data.

| Route | Result | Verified behavior |
|---|---|---|
| `/dashboard/products` | Passed | The redesigned contact-sheet field retains status filters, live API retry, the Brand-kit context, all three product-image inputs, product fields, and the real testing-catalog control. With the backend unavailable, no fake source records render. |
| `/dashboard/studio` | Passed | The dominant artboard retains composer/import switching, product search, format and template selection, local SVG preview, safe-area toggle, zoom, optional Brand placement, four independent caption tabs, review, approval, and export controls. With no backend records, the existing truthful starting state remains visible. |
| `/dashboard/social` | Passed | The redesigned delivery path keeps the three genuine stages visible: server-side provider connection, approved post/channel selection, and persisted delivery receipt. Unconfigured provider controls remain available but make no claim that OAuth is live; unavailable backend data is shown directly. |
| `/dashboard/calendar` | Passed | The redesigned date lane is deliberately labeled as persisted post creation dates. It does not misrepresent a post’s creation timestamp as scheduled delivery. The empty state links to the real Studio entry point. |
| `/dashboard` | Passed | Workboard remains an analysis-only record spread: source, proof, approval, depth, coverage, delivery readiness, and recent-record information are shown without an onboarding or creation workflow. The sole mutation-adjacent control remains the existing data refresh. |
| `/admin` | Passed | Admin remains a distinct wider-rail governance plane with separate Monitor, Review, and System navigation. Its current records and unavailable-data state are visible, and no member composer, brand, or delivery action has been introduced. |
| `/dashboard/brand` | Passed | The Brand control sheet retains its optional logo upload action, URL alternative, saved palette/type/tone fields, save control, and explicit rule that each Studio composition chooses whether to use the stored logo. |
| `/dashboard/batch` | Passed | The redesigned batch run retains approved-source selection, format choice, template selection, disabled-state protection, real queue invocation, progress polling, and completed-output review paths. With no backend data, it correctly makes no batch output or ready source claim. |

## Responsive review

At a 390px-wide viewport, the Studio tool dock becomes a compact horizontal icon strip while retaining an immediately visible Composer/Importer switch, source search, format control, template indicator, and mood controls. The artboard’s production sequence therefore remains one column rather than compressing its controls into unreadable panels.

At the same width, Admin remains a separate governance shell: a horizontally scrollable Monitor/Review/System navigation strip sits above the control-plane header and refresh action. The rail does not expose member creative controls, and the loading/unavailable state remains explicit.

## Public landing isolation

The public landing at `/` retains its existing dark creative-canvas narrative, image references, interactive layout specimen, marketing navigation, and public calls to action. The redesign uses selectors scoped to `.studio-app--press-bench` and `.studio-admin-app`; no public landing page component or public stylesheet was changed.

## Build baseline

`pnpm build` passed after the member and Admin production-desk implementation changes.
