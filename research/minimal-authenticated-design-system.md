# Minimal authenticated STUDIO design system

## Workflow insight

STUDIO is a creative-operations tool, not a gallery or a generic dashboard. The research supports a product hierarchy that makes current work, ownership, hand-off, and next action immediately legible: creative operations coordinate workflows, collaboration, and output through a repeatable system rather than a collection of disconnected screens.[1] Design-operations practice likewise emphasizes clear pipelines, visible deliverables, and an accessible living design system.[2]

## Directions considered

| Direction | Brief | Probability |
|---|---|---:|
| **Gallery Ledger** | A neutral white gallery with thin black records and sparse sage metadata. | 0.07 |
| **Quiet Studio** | A calm editorial workspace: soft warm-gray canvas, white working sheets, a narrow charcoal rail, muted sage states, and one warm lime action. | 0.05 |
| **Soft Grid** | A lightweight productivity field with rounded modules, fine graph paper, and dark olive utility bars. | 0.08 |

## Selected direction: Quiet Studio

> **STUDIO is a calm operating desk for making, reviewing, and releasing considered product content.**

Quiet Studio replaces the current visual density with a disciplined product interface. It keeps the existing landing palette’s charcoal, warm paper, sage, and lime heritage, but lowers saturation and confines lime to the one action that advances a workflow. It deliberately removes the proof-sheet motifs, oversized display typography on every route, patterned rails, heavy shadows, and ornamental geometry.

### Core principles

1. **Quiet hierarchy.** One route title, one primary action, one active work area. Secondary records are intentionally softer.
2. **Functional surfaces.** White cards exist only when they group a real workflow; dividers and spacing replace ornamental containers.
3. **Calm material contrast.** Warm gray canvas, white work sheets, charcoal navigation, muted sage status, and warm lime commitment signal.
4. **Workflow first.** The screen leads from state → current task → next hand-off. It never replaces a live control with a decorative mockup.

### Layout model

A 232 px charcoal rail holds simple grouped navigation. The content canvas begins with a compact route header and then uses a 12-column fluid layout. Overview foregrounds a single `Now` work block; Products foregrounds the live source grid and puts add-source controls in a clearly bounded adjacent sheet; Studio retains the three functional authoring areas but gives them white/pale-gray control surfaces around one quiet charcoal preview.

### Interaction and type

Transitions are limited to 140–180 ms opacity, color, and 2 px transform changes. The interface uses a clean sans-serif system for most UI and reserves a restrained serif only for a single route title or artboard headline. Controls retain their concrete, existing labels. Empty and unavailable states explain what is missing and offer the next useful route.

### Accessibility and responsive behavior

All controls retain visible focus, text contrast against their actual surface, sufficient touch targets, disabled explanations, and reduced-motion fallbacks. On narrow widths, the rail becomes a compact top navigation, the route header keeps its primary action, and multicolumn work areas stack in workflow order rather than simply shrinking.

## References

[1]: https://www.atlassian.com/agile/design/creative-operations "What is Creative Operations? How to Successfully Implement"
[2]: https://think.design/blog/rise-of-design-operations-creative-process-meet-business-efficiency/ "The Rise of Design Ops: Creative Processes Meet Business Efficiency"
