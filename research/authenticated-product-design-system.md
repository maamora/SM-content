# Authenticated STUDIO Product Design System

## Intent

The authenticated product should feel like a calm creative operations tool rather than a decorative AI demo. The landing page remains unchanged. Every redesign decision applies only to the logged-in workspace, Studio, products, brand, delivery, settings, and admin surfaces.

## Reference Principles

ReactBits documents modular, individually adopted interaction components and explicitly advises limiting a page to two or three animated elements; STUDIO will follow that discipline through subtle state transitions and hover depth rather than visual spectacle.[1] The same guidance recommends mobile-specific treatment for heavier effects, so the inner product uses responsive static fallbacks instead of scroll-bound animation.[1]

| Element | Product decision |
| --- | --- |
| Navigation | Dark, persistent rail with explicit **Create**, **Library**, and **Delivery** groups rather than a flat application menu. |
| Surfaces | Quiet paper/graphite system with a single acid-lime signal color. Primary panels are differentiated by hierarchy, not by unrelated card treatments. |
| Typography | Editorial serif only for key page statements; compact sans-serif for labels, records, controls, and metadata. |
| Motion | 160–220 ms transform/opacity transitions for hover, selection, loading, and stage changes. No continuous decorative motion in operational views. |
| Depth | Sparse 3D perspective on primary panels and image cards to establish hierarchy; never used on form controls or dense lists. |
| Responsive behavior | The sidebar becomes an overflowed product dock. Statistics, forms, cards, and tables stack without hiding workflows. |

## References

[1] [React Bits — Introduction](https://reactbits.dev/get-started/introduction)
