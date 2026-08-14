# STUDIO backend API inventory

The linked backend is a Spring application under `backend/` with controllers rooted at `/api`.

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

## Workspace APIs

- Products: `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}`
- Brand: `GET/PUT /api/brand`
- Posts: `GET /api/posts`, `POST /api/posts/generate-image`, `POST /api/posts/generate-captions`, `PATCH /api/posts/{id}/caption`, `POST /api/posts/{id}/approve`, `DELETE /api/posts/{id}`, `GET /api/posts/{id}/export`
- Batches: `POST /api/batches`, `GET /api/batches/{id}`, `GET /api/batches/{id}/export`
- Templates: `GET /api/templates`, admin-only `POST /api/templates`
- Uploads: `POST /api/uploads/image`, `DELETE /api/uploads/image`
- Files: `GET /files/**`

## Admin APIs

- Admin-only pending product review: `GET /api/products/pending`, `POST /api/products/{id}/approve`, `POST /api/products/{id}/reject`

## Integration boundary

The current backend exposes auth, products, brand settings, posts, batches, templates, uploads, and file serving. There are no controller routes yet for social accounts, publishing, calendar, notifications, analytics, audit logs, or admin user/workspace management. Those frontend areas must remain explicit unavailable states until corresponding backend routes are added.

## STUDIO frontend wiring status

The Next.js frontend on `manus/studio-frontend` now consumes the live Spring Boot APIs for products, product moderation, posts, post export, brand settings, templates, uploads through the existing feature components, and batch generation through the existing batch component. The workspace and admin shells load real records with loading, error, empty, refresh, save, delete, and export states rather than seeded placeholder records.

| Frontend area | Current behavior | Backend dependency |
| --- | --- | --- |
| Dashboard overview | Live product/post counts and recent post activity | `/api/products`, `/api/posts` |
| Products | List, create, delete, and moderation queue | `/api/products`, `/api/products/pending`, product approval routes |
| Brand | Load and save editable brand kit fields | `/api/brand` |
| Studio and Batch | Reuses the existing functional generation workflows | `/api/posts/*`, `/api/batches/*`, `/api/templates` |
| Posts and Assets | List, export, delete, and derive visual asset library | `/api/posts`, `/api/posts/{id}/export`, product image URLs |
| Calendar, Social, Notifications, Settings | Explicit unavailable notices; no fake persistence | No corresponding controller routes yet |
| Admin users, workspaces, audit logs, settings | Explicit unavailable notices; admin products/content/templates/analytics use live available APIs | No corresponding controller routes yet |

The Next.js production build still reaches the pre-existing `/_global-error` prerender failure involving `useContext` in the baseline Next.js/React setup. This is an upstream compatibility issue rather than a failure in the STUDIO workspace integration; development-server route smoke tests and TypeScript/ESLint checks pass.
