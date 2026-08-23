# STUDIO project-local agent skill registry

This directory contains the project-local skills used when changing STUDIO. The previous checkout recorded three Git links without a `.gitmodules` source map, so those links could not be initialized. The verified skills below are restored as concise STUDIO adapters rather than copied blindly from external repositories.

| Directory | Status | Upstream source | Intended use |
|---|---|---|---|
| `frontend-design` | Imported adapter | https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design | Any new or materially redesigned STUDIO interface. |
| `ui-ux-pro-max-skill` | Imported adapter | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | Interface direction, component states, responsive design QA, and visual-system decisions. |
| `tmp_emilkowalski` | Not activated | Unknown | Preserved as an unresolved placeholder; do not infer or execute a source without provenance. |

The active product direction is **Signal Press**. These skills guide design judgment and quality checks; they do not override the repository’s working product behavior, accessibility commitments, or source-of-truth design documents under `research/`.
