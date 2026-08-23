# Landing-color inner-page validation

## Scope

The public landing palette was mapped into authenticated-only `press-bench.css`. The implementation uses the landing's charcoal `#11130f` / `#1a1c19`, warm paper `#faf9f4` / `#f4f3ed`, olive `#5f762a`, signal lime `#b9dd45`, and neutral rule `#c5c4bb` values. Public marketing selectors were not changed.

## Representative browser review

| Route | Result | Notes |
|---|---|---|
| `/dashboard` | Passed | The Press Bench Workboard uses warm-paper panels, charcoal tool dock, olive analytical marks, lime active state, and retained its analysis-only / live-data-unavailable behavior. |
| `/admin` | Passed | The Control Room retains its separate governance rail and page structure while using the same charcoal, paper, olive, lime, and neutral-rule family as the public landing. Its unavailable-backend state remains truthful. |
| `/dashboard/assets` | Passed | The Assets empty state remains real when the backend is unavailable; no placeholder media or carousel cards are created. The work surface, dock, control bar, and action states use the landing palette. |
| `/` | Passed | The public landing remains the existing dark charcoal-and-lime creative canvas; no public selector or layout was changed by the inner-page stylesheet. |

## Validation contract

At a 390 × 844 viewport, `/dashboard/assets` retains the compact horizontal dock, a visible current-route signal, search control, compact creation control, readable warm-paper work surface, and the existing truthful unavailable-data state. No color update conceals its operational controls or recovery message.

The member and Admin layouts, controls, route semantics, keyboard behavior, reduced-motion rule, and no-fabrication fallback behavior were not changed by this palette-only pass. The remaining check is final source-control verification before committing.
