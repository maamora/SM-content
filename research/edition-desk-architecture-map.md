# Edition Desk authenticated page-architecture map

## Objective

The new architecture replaces the current mix of route-local mastheads, generic panels, and container-only surfaces with a **shared production-desk composition**. It is a frontend/page-architecture change only: current API calls, backend state, ownership boundaries, and client-side workflow behavior remain intact. The public marketing shell is not part of this architecture.

## Reusable route composition

Every authenticated page will use the same outer hierarchy, with a route-specific work surface in the final slot.

| Layer | Responsibility | Existing implementation source |
|---|---|---|
| `StudioAppShell` | Index rail, responsive mobile route strip, main work field, keyboard-safe navigation. | `WorkspaceSidebar`, admin sidebar, `.studio-app`. |
| `RouteMasthead` | Kicker, single editorial route thesis, supporting copy, route metadata, and one primary action. | Existing `workspaceData`, `adminData`, worktable mastheads, and workspace topbar. |
| `RouteControlBar` | Context label, search or refresh utility, filtered/count status, and optional secondary route action. | Existing command row, counts, and refresh controls. |
| `OperationNotice` | Visible loading, empty, backend-unavailable, validation, or configuration state with an honest next action. | `Notice`, `.studio-form-error`, `.studio-loading`, and existing API state. |
| `WorkSheet` | A durable bordered task surface with title, metadata, body, and optional footer. | Existing `.studio-workspace-panel`, `.studio-panel-heading`, `.studio-data-stack`. |
| `Worktable` | Deliberate multi-column task layout for a route; it never converts live operations into decorative cards. | Overview, Products, Brand, Studio, Social, Batch layouts. |

## Route architecture

| Route group | Page structure to implement | Required real workflow content |
|---|---|---|
| Overview | Masthead → metric ledger → creative-thread worktable → dark next-move handoff → readiness strip. | Counts, refresh, product/post state, source-to-delivery links, Brand/Product/Studio readiness. |
| Products | Masthead → contact-sheet WorkSheet + dark Brand sidecar → full-width source intake WorkSheet. | Live list/delete, exactly three upload slots, product form validation, testing catalog, optional brand direction. |
| Brand | Masthead → editable brand brief WorkSheet + live rule/placement sidecar. | Save state, colors, font, tone, optional logo upload or URL, neutral-default explanation. |
| Studio | Masthead → three-zone composition table: direction inspector, local SVG artboard, finishing/delivery column. | Template/import modes, source selection, all composition controls, optional logo placement, four language editors, approve/export/hand-off. |
| Batch | Masthead → production-run brief → approved source selection → configuration → progress/output review. | Batch start, polling, failures, downloads, reset/new run. |
| Assets / Posts / Calendar | Standard masthead → control bar → library/list/timeline WorkSheet. | Actual product/post images, opens/downloads/deletes, status, captions, persisted dates, Studio hand-off. |
| Social | Masthead → three-step delivery ledger → connection WorkSheet + dark delivery WorkSheet → receipt ledger. | OAuth connect/disconnect, active status, approved post/channel selects, immediate/scheduled server publish, receipts. |
| Notifications / Settings | Masthead → two operational WorkSheets. | Real approval/draft signals, SMTP history/errors, account, capabilities, no fabricated readiness. |
| Admin | Same shell/masthead/control bar → route WorkSheet. | Existing summaries, approval queue, templates, capability status, and intentionally disabled unavailable routes. |

## Component boundary rules

The replacement must extract shared layout primitives into `frontend/src/components/studio/` and make `WorkspacePage` / `AdminPage` compose them. Each real route surface keeps ownership of its existing data loading and actions. The new primitives must be presentational and typed; they do not perform data fetching, mutate API state, or hide errors. This keeps the architecture legible and prevents a redesign from becoming a behavior regression.

| New component | Inputs | Exclusions |
|---|---|---|
| `StudioAppShell` | navigation definition, active key, admin/workspace label, children | Does not fetch data or decide route content. |
| `RouteMasthead` | kicker, title, description, actions, optional route metadata | Does not decide which action is valid. |
| `RouteControlBar` | route icon/label, utility controls, count/status | Does not implement search filtering unless a route supplies it. |
| `WorkSheet` | heading/kicker/meta, tone (`paper` or `ink`), children, className | Does not imitate data or replace a specific workflow component. |
| `MetricLedger` | real metric items | Does not display a metric until the existing page supplies it. |

## Responsive behavior lock

Desktop retains the index rail and can use two or three task columns. At tablet width, a route collapses secondary handoff panels beneath primary work. On mobile, the navigation becomes a horizontal route strip, masthead actions appear beneath the thesis, and the Studio columns stack in the user’s actual task order: source/direction, artboard, finishing. No critical action may be hidden in a hover-only or off-canvas treatment.
