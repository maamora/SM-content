# STUDIO authenticated redesign: reference lock

## Scope and evidence

This redesign is confined to the authenticated workspace and admin control room. The public landing page remains unchanged. The retained workflow boundary is the product-to-delivery path already defined in [the feature inventory](./authenticated-feature-inventory.md): product source, optional Brand, SVG composition or direct import, independently editable FR/EN/AR/Darija captions, approval and export, then connected-channel delivery.

The user-provided Refero HTTP MCP connector was created and reached successfully on 23 August 2026. Its server advertised eight read-only screen, flow, and style tools. A non-mutating style search was then rejected by Refero with `NO_SUBSCRIPTION` because the subscription attached to the provided credential was not active. No token was written to the repository, and no paid request was retried. The design research therefore combines the available project-local UI skills with public interface references while the Refero subscription is resolved.

| Reference | What was observed | Decision for STUDIO |
|---|---|---|
| Attio workspace navigation [1] | A calm light workspace gives dense records room through a quiet left index, hairline dividers, compact iconography, and one transient floating control. | Use a light, structural navigation index and thin rules; avoid a permanently heavy dark rail and avoid turning every section into a floating card. |
| Linear workspace list [2] | High-information work is readable when the navigation, list header, status row, and display controls form deliberate horizontal bands. Utility controls are compact and visually subordinate to the active work. | Give every STUDIO route a clear operational band—route name, live state, and one committed action—then let source lists and editors become the visual center. |
| Local frontend-design and UI/UX skills | Real workflows and honest fallback states must remain; controls need visible focus, concise motion, and a strong first action. | Preserve component semantics and all state branches. Mobile becomes a resequenced workflow rather than a squeezed desktop shell. |

## Chosen direction: **Edition Desk**

**Edition Desk** treats STUDIO as a precise creative-production desk rather than a decorative creator dashboard. It borrows the calm structural discipline of a modern record workspace and the sectional rhythm of an editorial proof. The visual identity is not a clone of either reference: it uses an off-white paper field, a cool blue technical rule, near-black type, and a restrained vermilion delivery signal. The existing Quiet Studio system’s sage, lime, charcoal rail, soft cards, and rounded “wellness” feel are explicitly retired from authenticated routes.

| System area | Locked decision |
|---|---|
| North star | A modern editorial proofing desk: intentional, light, dense enough for actual work, and never embellished just to look creative. |
| Canvas and surfaces | Cool paper canvas with white work sheets. The page is organized by durable hairlines and wide margins rather than stacks of soft shadowed cards. |
| Color discipline | **Edition blue** is the structural and interactive colour: active navigation, focus rings, links, selected controls, and line details. Near-black carries text. **Vermilion** is reserved for delivery, destructive actions, and attention states; it is never a decorative gradient. |
| Shell composition | A slim white index column, a narrow top operational strip, then an asymmetrical work canvas. The active route title aligns with the left edge of its actual work rather than sitting in a generic central hero. |
| Surface treatment | Square-to-slightly-rounded sheets, continuous rule lines, pinned labels, grouped table rows, and thin column dividers. Shadows appear only for transient layers such as dialogs, menus, and hover elevation. |
| Typography | A compact grotesk UI face for controls and data with a confident high-contrast editorial face only for the single route thesis. Labels are uppercase with deliberate tracking; metrics use tabular numerals where available. |
| Route rhythm | Overview becomes an active production docket. Products and Assets read as contact sheets. Studio remains the composition table. Brand and Settings become configurable briefs. Delivery pages use status-led run lists. |
| Motion | 140–180 ms opacity/translate responses only for hover, sheet entry, menu layers, and state confirmation. No scroll spectacle, glowing backgrounds, or animation that competes with creation. Reduced-motion users receive static content. |
| Explicit rejects | No bento-dashboard default, no charcoal navigation slab, no lime CTA, no pill-heavy UI, no pervasive 12 px rounding, no glass panels, no decorative mock charts, and no fabricated data in unavailable states. |

## Implementation contract

The final visual layer will be scoped to `.studio-app` and imported after `quiet-studio.css`; it will not target the marketing shell. Structural selectors will maintain the existing component hierarchy, form semantics, loading/error branches, and API integration. The `Studio` authoring surface will keep its established direction → canvas → finishing sequence, but will be restyled as a three-column proofing table with blue rules and a clearly delineated delivery column.

## References

[1]: https://attio.com/help/reference/navigating-your-workspace "Attio Help Center — Navigating your workspace"

[2]: https://www.morgen.so/blog/linear-guide "Morgen — Linear guide and workspace screenshots"
