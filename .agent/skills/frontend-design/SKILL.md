---
name: STUDIO Frontend Design
description: Use when creating or materially reshaping STUDIO user interfaces. Preserve the Signal Press design direction, make one clear visual thesis per surface, avoid templated dashboard patterns, and validate responsive, accessible implementation before delivery.
---

# STUDIO Frontend Design

## Purpose

Apply an intentional visual point of view to STUDIO screens. Treat an interface as an editorial production tool, not a collection of generic application cards. Build with real product content and controls; do not replace working workflows with static mockups.

## Required approach

1. Name the route’s primary job and the user’s next committed action before changing layout.
2. Use the **Signal Press** system: ink for active production, warm paper for records and finishing, sage for context, and acid lime only for a committed next action or meaningful status.
3. Spend visual boldness on one memorable composition or hand-off per screen. Keep adjacent surfaces quiet and disciplined.
4. Preserve existing source upload, local composition, Brand, captions, approval, export, and delivery behavior. Do not simulate a backend response or call local output AI-generated photography.
5. Write controls in direct user language. Keep an action’s wording consistent from button through resulting state.
6. Treat empty and failure states as a clear next action, not decorative filler.

## Guardrails

- Do not introduce generic bento dashboards, uniform rounded cards, glassmorphism, neon-purple gradients, decorative charts, fake controls, or chatbot/prompt layouts.
- Do not repeat oversized display type on every surface; use it once where it carries the route’s thesis.
- Do not add motion merely to make a screen feel modern. Use short transform/opacity transitions only where they clarify state; honor `prefers-reduced-motion`.
- Keep keyboard focus visible, preserve semantic controls, and verify contrast against the rendered—not assumed—background.

## Review before delivery

Review desktop and narrow viewport captures. Confirm that one action reads first, text remains readable at 200% zoom, all essential controls are keyboard reachable, and the build succeeds. Record deviations and corrections in `validation/`.

## Source acknowledgement

Adapted for STUDIO from the public Anthropic frontend-design guidance: https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design
