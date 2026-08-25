# Landing-palette-only inner-page validation

## Closed token set

The authenticated interface now uses only color values already present in the public landing stylesheet:

| Semantic role | Landing token |
|---|---|
| Primary ink | `#11130f` |
| Panel charcoal | `#1a1c19` |
| Deep rule | `#343832` |
| Warm paper | `#faf9f4` |
| Stock paper | `#f4f3ed` |
| Fine rule | `#c5c4bb` |
| Muted utility text | `#777870` |
| Olive | `#5f762a` |
| Signal lime | `#b9dd45` |
| Dock utility gray | `#85857e` |

## Representative browser review

| Route | Result | Notes |
|---|---|---|
| `/dashboard` | Passed | The Workboard uses the landing’s charcoal dock, paper fields, olive marks, lime signal, and rule colors. Its analysis-only and unavailable-data behavior remain unchanged. |
| `/admin` | Passed | The governance-only Admin structure remains separate from the member workstation. Its rail, paper field, active navigation, cards, and grid now use the same closed landing palette. |
| `/dashboard/brand` | Passed | The Brand fields, default color values, optional logo surface, action controls, dark Studio rule panel, and guardrails use the closed landing palette while preserving the upload and optional-placement workflow. |
| `/` | Passed | The existing public charcoal-and-lime landing canvas remains unchanged; no public selector or layout was modified. |

At a 390 × 844 viewport, the Assets route retains its compact charcoal dock, lime current-route indicator, warm-paper header and controls, searchable library field, truthful unavailable-data notice, and source-material action. The palette remains readable without introducing an additional interface color.

The current browser cannot reach the local backend, so existing unavailable-data states were retained rather than replaced with fabricated records.
