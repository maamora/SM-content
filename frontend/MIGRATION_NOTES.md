# Migration notes — switch to Spring Boot backend

This folder was copied from the old `studio/` (Next.js + Prisma + NextAuth, everything
in one app) to `frontend/`, now that the backend is a separate Spring Boot + PostgreSQL
API (see `../backend`). This file lists what's now obsolete so nobody wastes time
debugging dead code.

## Safe to delete once the new backend is wired up

- `prisma/` (schema, seed, dev.db) — replaced by `backend/src/main/java/.../model` + PostgreSQL.
- `src/auth.ts` — replaced by `backend`'s Spring Security + JWT (see `backend/src/main/java/.../security`).
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth route, no longer used.
- `src/lib/prisma.ts` — no Prisma client on the frontend anymore.
- `src/server/actions/product.actions.ts` — this logic now lives in `backend`'s `ProductService` +
  `ProductController`. The security pattern in this file (verify the resource belongs to the
  caller's brand before touching it) was good — it's exactly what `ProductService.getOwned()`
  and the equivalents in `PostService`/`BatchJobService` do now, just in Java.
- `src/schemas/product.ts` (Zod) — validation now happens on the backend (`@Valid` + Bean
  Validation annotations on `ProductRequest`). Keep a lightweight client-side check for UX if
  you want instant form feedback, but the backend is the source of truth.
- `package.json` dependencies no longer needed: `@auth/prisma-adapter`, `@prisma/adapter-better-sqlite3`,
  `@prisma/client`, `better-sqlite3`, `next-auth`, `prisma` (devDependency `ts-node`/seed script too,
  if nothing else uses it).

## New, already in place

- `src/lib/api/` — typed fetch client for the Spring Boot API (`client.ts`, `auth.ts`, `products.ts`,
  `templates.ts`, `posts.ts`, `batches.ts`). Import from these instead of calling `fetch` directly.
- `.env.local.example` — copy to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` (defaults to
  `http://localhost:8080`, matching the backend's default port).

## Not deleted automatically

Nothing above was deleted for you — this is a scaffold, not a migration script. Delete these
once `ProductForm`/`ProductList`/`CreativeStudio` are actually calling `src/lib/api/*` instead of
the old server actions, so you're never without a working product CRUD screen mid-migration.
