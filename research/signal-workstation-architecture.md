# Signal Workstation architecture

## Visual objective

Signal Workstation gives authenticated STUDIO pages the same dark creative-system energy as the public landing while making them operate like a professional graphics application. The system uses the existing public colors exactly by role: **studio ink** for the application frame, **warm paper** for reviewable records and canvas sheets, **acid lime** for active tools and committed actions, and muted sage/gray for passive context. It is not a copy of Photoshop’s interface; it uses familiar workstation patterns to make STUDIO’s real source-to-delivery workflow feel more capable and coherent.

## Shared workstation frame

| Region | Role | Existing workflow boundary |
|---|---|---|
| Tool shelf | Dark left navigation grouped by Create, Library, and Delivery. Active route receives a lime edge and retained text label. | Existing dashboard and admin links remain unchanged and keyboard reachable. |
| Command strip | Thin dark top strip exposes the active workspace and route state. | It is context-only; it must not pretend a save, backend connection, or render completed. |
| Work field | Dotted charcoal field, derived from the landing’s star grid. Route masthead lives in this field and leads one task. | The route’s actual errors, loading state, and primary action remain first. |
| Canvas sheets | Warm-paper or charcoal panels with technical labels, crop marks, and thin contrast rules. | Products, settings, posts, receipts, and form fields are all actual persisted/app state surfaces. |
| Inspector panels | Narrow dark or paper sidecars that show the next committed action, metadata, brand setting, or delivery configuration. | Inspector controls always use the existing components and API state; no fake layers, fake generation, or fabricated metrics. |

## Route transformations

| Route | Workstation composition |
|---|---|
| Overview | A dark dashboard field with a row of warm-paper metric plates, a large creative-thread canvas, and a lime-instrumented next-action inspector. |
| Products and Brand | A product contact-sheet canvas with warm-paper source tiles, a dark Brand inspector, and an intake panel that reads like an import drawer. |
| Studio | The primary artboard: dark tool shelf, deep canvas stage, inspector controls, local-SVG preview, layer-like ordered progress, and finishing/delivery inspector. |
| Batch | A production console: selected sources, format/template parameters, run state, and completed outputs are segmented as queue modules. |
| Assets, Posts, Calendar | A library/workboard: filter strip, warm-paper records, dark context inspector, and clear handoff into Studio. |
| Social | A delivery control board: channel dock, schedule inspector, and receipt ledger. Lime indicates selected/ready state; no channel is portrayed as connected unless the live API says so. |
| Notifications, Settings, Admin | A control-room interface with capability rows, direct account/system panels, and clear unavailable or read-only rules. |

## Interaction and responsive lock

Lime is never decorative: it communicates an active tool, selected work, confirmed readiness, or committed next step. Hover effects remain short opacity/transform responses. On mobile, the shelf becomes a horizontally scrollable tool strip, command metadata condenses, and panels stack in task order: action context, main work surface, then inspector. Keyboard focus stays lime on the dark frame and ink on warm-paper sheets.
