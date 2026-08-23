# Edition Desk authenticated-page design targets

## Purpose

This set is a **visual implementation contract** for the authenticated STUDIO product. The images are design targets for the existing live React routes; they do not introduce fake product capabilities, placeholder social proof, or alternative landing-page styling. The public marketing surface remains out of scope.

| Target | Image | Existing route and implementation boundary |
|---|---|---|
| Production docket | `/manus-storage/studio-edition-desk-overview_8adca674.png` | `/dashboard` / `Overview`: live product and post counts, refresh, next action, creative thread, readiness. |
| Source library | `/manus-storage/studio-edition-desk-products_1356e468.png` | `/dashboard/products` / `ProductsSurface`: catalog, deletion, create form, three image slots, test catalog, optional Brand panel. |
| Post composer | `/manus-storage/studio-edition-desk-composer_e8118eaf.png` | `/dashboard/studio` / `CreativeStudio`: template and direct-import modes, product selection, format, templates, mood and detail controls, local SVG preview, optional saved Brand logo, four independent captions, approval, ZIP export, delivery hand-off. |
| Delivery desk | `/dashboard/social` / `SocialSurface`: OAuth connection state, approved-post and connection selectors, immediate or scheduled server publish, and receipt history. |

## Shared implementation lock

The images use the existing **Edition Desk** vocabulary: an off-white paper field, white sheets divided by durable hairlines, a slim white index rail, edition blue for active/structural interaction, and vermilion only for irreversible or delivery-related action. Headings use an editorial serif; data, labels, form fields, and controls retain a compact grotesk voice. No route should become a generic bento dashboard, pill-heavy control board, dark rail, glass surface, neon canvas, or decorative data visualization.

| Primitive | Exact implementation rule |
|---|---|
| Index rail | Reuse `.studio-workspace-sidebar`, `workspaceNavSections`, and existing `Link` destinations. Do not remove any authenticated route. |
| Route thesis | Reuse the real `workspaceData` or worktable masthead. One serif thesis can lead a page; supporting controls remain compact and operational. |
| Work sheets | Reuse `.studio-workspace-panel`, `.studio-source-library`, `.studio-data-stack`, and form components. White sheets have thin borders and 3–4 px corners, rather than stacked soft cards. |
| Source records | Product and Asset visual cells remain actual image records; source image 1, image 2, and image 3 are separate persisted slots. |
| Composer | Keep direction → artboard → finishing columns. The center is a local-SVG artboard, not an AI photo generator. Every label must retain that truth. |
| Captions | Preserve separate `FR`, `EN`, `AR`, and `DJ` caption editors, individual save-on-blur, copy actions, and right-to-left Arabic field behavior. |
| Delivery | Reuse actual active connection state, selected approved post, selected connection, server-side schedule time, and receipt history. Empty and unavailable states must remain explicit. |
| Accessibility | Keep native buttons, form controls, keyboard-visible blue focus outlines, readable contrast, and reduced-motion fallbacks. |

## Asset note

The four PNG URLs above are generated visual references. They are **not** product assets to render inside the application. They should guide the next code pass only after the user selects or confirms the preferred target pages.
