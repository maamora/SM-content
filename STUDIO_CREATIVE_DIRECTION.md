# STUDIO Creative Direction

## Reference brief

The supplied reference establishes the new product language: STUDIO should feel like an **active visual operating system**, not a collection of conventional dashboard pages. The dominant surface is a dark, nearly infinite canvas with visible relationships between prompts, images, video, palettes, and generated outputs. The interface should communicate that creative work is assembled through movement and connection rather than through a linear form wizard.

The reference is a directional specification rather than a pixel-for-pixel clone. STUDIO keeps its own graphite, paper, and acid-lime identity while adopting the reference's strongest ideas: a node canvas, floating media cards, an inspector rail, a minimap, a command tray, and small motion cues that make the system feel alive.

## Chosen movement: Editorial Creative OS

STUDIO combines **Swiss editorial structure**, **creative-tool canvas behavior**, and **botanical material language**. The result should feel precise enough for a production team and expressive enough for an art director. The product is not a generic SaaS dashboard and should avoid equal-weight cards, repeated rounded containers, and dead utility pages.

### Core principles

1. **The canvas is the primary metaphor.** Every meaningful object is a node, a card, a route, or a visible connection. Pages should explain what is moving rather than only list what exists.
2. **Context stays attached to the asset.** Prompts, source products, captions, palettes, status, and approvals appear near the visual object they describe.
3. **Editorial restraint creates room for signal.** Graphite surfaces, paper panels, thin rules, serif display type, and acid-lime moments provide hierarchy without decorative noise.
4. **Motion communicates state.** Lines draw between related objects, nodes drift gently, active jobs pulse, and transitions use short directional movement rather than generic fades.

### Color philosophy

Graphite is the working field, paper is the considered output, and lime is the signal that something is ready to move. Lime is reserved for active connections, generation, approval, live state, and decisive calls to action. Muted olive, sage, smoke, and warm gray can describe media and secondary states, but the UI should never fall back to orange, generic purple gradients, or rainbow status systems.

### Layout paradigm

Use **asymmetric compositions** instead of centered page grids. The canvas owns the center, a narrow rail owns navigation and orientation, and an inspector or context rail owns the next decision. On small screens, the canvas becomes a vertical thread with the inspector becoming a bottom sheet-like sequence of controls.

### Signature elements

- **Thread lines:** thin lime-to-olive paths that connect inputs, prompts, and outputs.
- **Specimen cards:** media cards with compact metadata, status markers, and one decisive action.
- **The command tray:** a bottom action strip for Prompt, Image, Video, Add, and Export; it should feel like a physical control surface.

### Interaction philosophy

Interactions should expose relationships. Selecting a node highlights its thread, hovering a card raises it from the canvas, and actions should update the nearby status rather than send the user to a disconnected success page. Empty states should invite the next creative move with an actionable prompt, not only explain that data is missing.

### Animation guidelines

Use short, confident transitions for controls, 400–700ms reveals for canvas sections, and slow ambient movement only for non-interactive background elements. Connections may draw on entry; media cards may rise by 4–8px on hover; active generation uses a restrained lime pulse. Respect reduced-motion preferences by removing drift and path drawing while keeping state and hierarchy clear.

### Typography system

Display headings use Georgia or another high-contrast serif with tight tracking. Body and controls use Arial/Helvetica or the existing sans stack. Labels are uppercase, compact, and tracked. Metadata should look like instrumentation: small, muted, and often monospaced.

### Brand essence

**STUDIO is the visual operating system for creative teams that want more output without losing the point of view.** It is **observant, kinetic, and exacting**.

### Brand voice

Headlines should be direct and spatial: “Keep the signal attached.” CTAs should name the move: “Open the canvas”, “Generate a branch”, “Send to approval”. Microcopy should be concise and useful: “Three outputs are ready for a decision.” Avoid generic filler such as “Welcome to our website” or “Get started today.”

### Wordmark and mark

The existing four-petal mark remains the brand anchor, but it should be treated as a small navigation beacon rather than a decorative logo. In the workspace it sits beside an operational label such as `WORKSPACE / LIVE`; in the marketing shell it pairs with the STUDIO wordmark and a short system status.

## Route expansion intent

Marketing pages should become stories about the creative system, not repeated text cards. Authentication should feel like entering the canvas. Dashboard routes should expose movement, relationships, and next actions. Studio and batch routes should become the most expressive surfaces, with real products, templates, posts, and brand settings connected to the visual model. Admin pages should use the same control-room language while remaining denser and more legible.

Backend gaps remain explicit. Where the current Spring Boot API does not provide social publishing, notifications, analytics, or workspace administration, STUDIO should show an intentional “route ready / backend boundary” state that still demonstrates the future interaction model without inventing persisted records.
