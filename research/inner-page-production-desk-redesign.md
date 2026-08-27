# STUDIO inner-page production-desk redesign

## Reference lock

The redesign adapts **interaction patterns**, not brand styling or screenshots, from the researched products. The primary foundation is an editorial production desk that belongs to STUDIO: the public landing’s charcoal, warm paper, olive, lime, and fine-rule language carries into functional inner pages. Competitor patterns only inform where controls, review states, and records should sit.

| Reference pattern | Adaptation in STUDIO | Explicit boundary |
|---|---|---|
| Frontify / Brandfolder: contact sheet, asset context, controlled curation | The product and asset library become a legible contact-sheet workspace with a persistent contextual Brand kit and deliberate upload entry. | No copied visual identity, sample records, asset metadata, or synthetic library content. |
| Canva / Adobe Express: visible creative canvas, inspector, editor-to-schedule continuity | Studio retains the three-part production workspace: source controls, local artboard, and finishing/review panel; actions and status remain close to the content they change. | The local SVG composer, independent captions, optional logo, approval, and export contracts are retained. |
| Later / Sprout / Hootsuite: calendar, connection, receipt, and analysis clarity | Social, calendar, activity, and Workboard surfaces display records as understandable operational lanes with visible state, timing, and next valid actions. | Workboard remains analysis-only. OAuth and queued-publish operations remain entirely server-backed and are never implied to work if not configured. |
| Predis.ai: concise creative-to-delivery sequence | Route headers and contextual status describe each item’s current job in the workflow, not generic marketing copy. | No fabricated AI generation, performance data, reviews, or claims of autonomous delivery. |

## Direction exploration

| Direction | Intent | Probability |
|---|---|---:|
| Gallery ledger | Warm-paper contact sheets and archival records with black index strips. | 0.07 |
| Campaign switchboard | A compact black production rail framing an editable paper workfield. | 0.04 |
| Social operations console | A tighter scheduling and analytics desk with delivery lanes. | 0.09 |

## Selected direction: Campaign switchboard

**Design movement.** Contemporary editorial utility design: the landing’s creative canvas translated into a practical workstation, with an asymmetric charcoal tool rail, paper records, and a single lime signal reserved for selections and completed operational states.

**Core principles.** First, every panel is a functional record or control—not a decorative card. Second, source material, creative decisions, and delivery states are connected by visible linear sequence. Third, density rises only where repeated records benefit from scanning. Fourth, a dark surface means “production control,” while paper means “work that can be inspected and edited.”

**Closed color system.** Interface-only color is restricted to the landing palette: `#11130f` ink, `#1a1c19` panel charcoal, `#343832` dark rule, `#faf9f4` warm paper, `#f4f3ed` stock paper, `#c5c4bb` rule, `#777870` quiet text, `#5f762a` olive, `#b9dd45` lime, and `#85857e` dock utility. User-supplied brand colors and user-created artwork remain unchanged.

**Layout paradigm.** A fixed tool dock establishes the workspace; every route starts with a job strip and turns into one dominant functional field. Product and asset routes use a contact-sheet plus context sidebar; Studio uses its existing inspector → canvas → finishing sequence; social routes use setup → choice → receipt lanes; Workboard remains a record-analysis spread. Admin stays a separate governance plane with a wider text rail and no member-creation controls.

**Signature elements.** The design uses a lime index stroke for active work, hairline production-grid paper behind workfields, and dark “control islands” only for high-attention actions, selected items, or progress states.

**Interaction and motion.** Controls are immediate. Hover creates a 2–4px paper-offset or thin lime index, never an autonomous animation. Section entrance motion remains an existing optional 220–320ms opacity/translate reveal and is removed for reduced-motion users. Keyboard focus keeps a visible olive outline. No autoplay or non-functional animated dashboards are introduced.

## Route plan

| Route group | Functional redesign |
|---|---|
| Workboard | Hootsuite/Sprout-inspired record analysis panels with a distinct operational status island; no creation or onboarding action is added. |
| Products and Assets | Frontify/Brandfolder-inspired contact-sheet hierarchy: precise filters, scanning grid, compact record metadata, clear source depth, Brand context, and an isolated upload bay. |
| Brand | A Brand-kit control sheet with persisted logo, tokens, type, tone, placement readiness, and no forced logo usage. |
| Studio and Batch | Adobe Express/Canva-inspired worktable: source, editable local proof, and review/delivery framing. All existing actions and independent language fields remain. |
| Posts and Calendar | A review ledger and dated-record lane; dates remain accurately labeled as persisted record dates until the backend exposes scheduled-job data to this route. |
| Social, Activity, Settings | Later/Sprout-inspired operational sequence: connections, valid delivery choice, receipts, activity, and readiness are grouped into state-specific, scannable fields. |
| Admin | A wider governance rail and high-density tables/status fields distinct from the member production workspace. |

## Audit observations

The current member Products page exposes the live API error visibly, preserves filtering and all three source-image fields, and separates the Brand-kit context from the source upload form. The Studio page retains its most important functional structure: template/import selection, product source picker, local SVG proof, separate FR/EN/AR/Darija caption fields, optional logo placement, review, approval, and export. The redesign must not collapse these controls into a generic single form.

The paid interface-reference service could not be accessed because its subscription was inactive. The redesign therefore relies on the first-party product research already preserved in `research/creative-operations-competitive-scan.md`, current STUDIO routes, and the public landing system—without attempting to copy inaccessible screen references.
