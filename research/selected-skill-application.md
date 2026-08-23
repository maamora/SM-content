# Selected skill application — STUDIO

## Applied now

The selected frontend, UI, and UX guidance is now applied through the Signal Press system rather than by adding unrelated libraries. The authenticated product has semantic material tokens, shared responsive rules, a visible keyboard focus treatment, readable input placeholders, disabled-control behavior, and a reduced-motion fallback. These changes strengthen every current workflow—product upload, Brand configuration, Studio composition, captions, approval, export, and delivery—without changing backend contracts.

| Skill guidance | Applied outcome | Scope |
|---|---|---|
| Frontend Developer | Shared keyboard focus, responsive verification, production builds, and an explicit quality baseline. | Current authenticated React surfaces. |
| UI Designer | Signal Press material/state tokens, reusable panel/button behaviors, and a design QA record. | Shared inner-product visual system. |
| UX Architect | A documented information hierarchy: index rail → proof field → active hand-off; consistent responsive collapse. | Overview, Products, Brand, Studio. |

## Backlog shaped by selected skills

| Priority | Work item | Skill basis |
|---:|---|---|
| 1 | Add automated keyboard-flow and accessible-name checks for login, product creation, Studio composition, caption editing, approval, export, and social scheduling. | Frontend Developer / UI Designer |
| 2 | Refactor remaining authenticated-route CSS into semantic Signal Press component tokens to reduce legacy override debt. | UI Designer / UX Architect |
| 3 | Audit Spring Boot API validation, ownership enforcement, authorization boundaries, error codes, and graceful-degradation messages for products, posts, captions, brand, export, social jobs, and email delivery. | Backend Architect |
| 4 | Before extending scheduled delivery, validate OAuth/webhook capabilities for each provider and run durable delivery deterministically on the server rather than in a browser session. | automation-and-scheduling |

## Not activated

No connector, scheduling, hosting, persistent server, database schema, or new third-party service is introduced merely because a related skill exists. Those changes require a concrete user request and a separate architecture decision.
