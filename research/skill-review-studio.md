# STUDIO high-value skill review

## Selection criteria

A skill is included only when it can improve STUDIO without changing the product’s technology stack, duplicating existing working behavior, or adding speculative infrastructure. Current priorities are the authored Signal Press system, accessible responsive React implementation, reliable creative workflow state, and social/email delivery readiness.

| Skill | Concrete value for STUDIO | Decision |
|---|---|---|
| **Frontend Developer** | Supplies a quality bar for responsive React architecture, performance, accessible semantics, keyboard behavior, proper feedback states, and testable critical workflows. | **Select.** Apply to the inner-product quality backlog. |
| **UI Designer** | Provides the design-system discipline needed to turn Signal Press from an override stylesheet into documented reusable tokens, component states, and accessible interaction patterns. | **Select.** Apply to codify visual states and design QA. |
| **UX Architect** | Adds scalable CSS architecture, component boundaries, responsive structure, and flow/interaction specifications. The default theme-toggle advice does not fit Signal Press and will not be adopted. | **Select, selectively.** Use for tokens, documentation, and information architecture—not its generic visual defaults. |
| **automation-and-scheduling** | Provides the correct decision framework for the existing social publishing and SMTP delivery paths: durable deterministic delivery should be server-side, event/schedule driven, and not dependent on a browser or agent session. | **Select, conditionally.** Apply before extending schedules, webhooks, or social delivery workers; no new automation is activated in this review. |
| **Backend Architect** | Strengthens API contracts, persisted workflow state, authorization, validation, graceful failure behavior, security, and instrumentation for products, posts, captions, approvals, exports, and delivery jobs. | **Select, selectively.** Apply a production-readiness audit to existing Spring Boot routes before adding scale-oriented patterns. |
| **persistent-computing** | Clarifies that a durable background delivery worker should remain in a managed web runtime when possible; a separate persistent VM is justified only for concrete runtime or resource limits. | **Reference only.** No hosting or deployment change is needed in this task. |

## Excluded skills

Skills for slides, music, text-to-speech, generic image editing, finance, and data backup do not improve the active STUDIO application. `game-dev` does not fit the product. `manus-config` is only needed when a connector or scheduled task must be changed. Presentation and document skills remain available for future project collateral, not product implementation.
