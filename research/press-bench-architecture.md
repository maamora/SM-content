# Press Bench — replacement architecture for authenticated STUDIO

## Product thesis

**Press Bench** is a production board for a creative operator moving a product source through proof, approval, and dispatch. It is not a dashboard. The interface is shaped like a printing and retouching bench: a compact tool dock, a job strip, one dominant work field, and an optional secondary bay that only appears when the task needs it.

The audience is a brand or creative-operations operator working with real products, source images, local-SVG compositions, multilingual captions, and scheduled publishing. The primary action is always visible: add a source, compose a proof, approve it, or dispatch it.

## Visual system

| Token | Value | Meaning |
|---|---:|---|
| Bench ink | `#11110f` | Tool dock, active production surface, editors, and equipment. |
| Stock paper | `#eceae2` | Review sheets, lists, intake forms, and records. |
| Calibration sage | `#9dad88` | Context, saved configuration, neutral readiness. |
| Commit lime | `#c6ff5e` | Exactly one committed action, active tool, or verified completion. |
| Registration red | `#ef7f61` | Destructive actions and blocked delivery only. |
| Lead | `#373833` | Rules, utility text, and secondary controls. |

The display face remains a restrained editorial serif for one route thesis at a time. Interface and data use the existing compact grotesk and monospace utility voice. Corners are 2–4 px, elevation is expressed through offset rules rather than soft shadows, and dense text is reduced to direct labels.

## Shared route grammar

```text
┌ tool dock ┐ ┌──────────────── job strip ───────────────┐
│  icons    │ │ context / saved state / primary action    │
│  + label  │ ├──────────────── work field ──────────────┤
│           │ │ single task composition                   │
│           │ │ [optional secondary bay]                  │
└───────────┘ └──────────────────────────────────────────┘
```

The dock is 68 px on desktop and becomes a horizontal tool strip on mobile. The job strip replaces oversized repeated mastheads and contains the live route state, short route label, current record, and only the route’s primary action. Work fields are route-specific rather than a shared card grid.

## Route architecture

| Route | Primary work field | Secondary bay | Committed action |
|---|---|---|---|
| Overview | Job queue with next records ordered by source → proof → approval → dispatch | Small readiness tally | Open next record |
| Products | Contact sheet with real source completeness and filter rail | Sticky intake sheet | Add source |
| Brand | Calibration sheet with palette, mark, and tone inputs | Live mark/placement preview | Save Brand |
| Studio | Source tray → artboard → inspector | Finishing/caption tray | Render or import post |
| Batch | Batch manifest with selected source records | Job status and download results | Start batch |
| Assets / Posts | Proof list and media records | Selected record detail | Open / export |
| Calendar / Social | Dispatch strip and actual connection/schedule state | Channel requirements and receipt history | Schedule or publish |
| Settings | Configuration ledger | Capability or account status | Save settings |
| Admin | Separate signal-monitor control plane | Governance details | Refresh / moderate |

## Signature element

Every member page uses a **job strip**: a thin, tactile horizontal register at the top of the work field that shows the actual object being worked on, saved or unavailable state, and its next irreversible action. It visually connects Sources, Studio, Review, and Delivery without creating fake process data.

## Interaction and motion

Motion is limited to 140–220 ms opacity and transform transitions for opening panels, reordering source images, and clear active-tool changes. Dragging, hover depth, and React Bits effects only appear on real source records. Reduced-motion mode resolves these changes immediately. Command palette and keyboard interactions remain instant.
