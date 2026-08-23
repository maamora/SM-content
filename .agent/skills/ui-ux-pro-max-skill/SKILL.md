---
name: STUDIO UI/UX System
description: Use when establishing or reviewing STUDIO design-system decisions, component states, information hierarchy, responsive behavior, and interface quality. Apply the Signal Press direction rather than generic style catalogs.
---

# STUDIO UI/UX System

## Purpose

Use a structured UI/UX review before changing STUDIO’s authenticated product. The goal is a coherent creative-operations interface whose visual language makes the workflow easier to understand.

## Design-system protocol

1. Start from the existing semantic Signal Press tokens in `frontend/src/app/signal-press.css`; extend tokens before adding one-off colors or shadows.
2. Give every component a complete set of states: default, hover, focus-visible, active, disabled, loading, error, and empty where relevant.
3. Preserve the information hierarchy: index rail → route thesis → active work area → finishing or hand-off. Do not make every surface equally loud.
4. Use material contrast deliberately. Ink means work in progress; warm paper means review, record, or finishing; sage means context; lime means commitment.
5. Check mobile as a re-sequenced workflow, not a squeezed desktop layout. Keep the next action and current state visible before secondary tools.

## Interaction quality

- Keep interaction feedback short and interruptible. Prefer opacity and transform transitions.
- Make focus visible and touch targets comfortable. Do not use color as the only state indicator.
- Keep labels concrete: describe the action a user controls and the result it creates.
- Let empty states describe what is missing and how to proceed; do not fabricate activity or social proof.

## Design QA

For a meaningful visual change, verify one desktop and one 390 px capture, a keyboard path through the primary task, a reduced-motion state, readable unavailable-data behavior, and a production build. Write the result to `validation/`.

## Source acknowledgement

Adapted for STUDIO from the MIT-licensed UI/UX Pro Max project: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
