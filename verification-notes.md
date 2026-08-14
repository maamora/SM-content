# STUDIO integration verification

## Current findings

- PostgreSQL 16 is accepting connections on `127.0.0.1:5432`.
- Database `maamora_studio` exists and is owned by role `maamora`.
- Spring Boot starts on port `8080`, applies the JPA schema, seeds one admin, one brand, five products, and two templates, and reconnects successfully after restart.
- Direct authenticated API calls for login, products, brand, posts, templates, and pending products returned successful JSON envelopes.
- CORS preflight from `http://localhost:3001` returned `Access-Control-Allow-Origin: http://localhost:3001` and credentials enabled.
- The Next.js login page renders on `http://127.0.0.1:3001/login`; browser submission did not navigate, so frontend login behavior still needs diagnosis.
- The failed browser submission is explained by origin mismatch: backend CORS allowed `http://localhost:3001` but the first browser URL used `http://127.0.0.1:3001`, whose preflight returned HTTP 403.
- The login page also renders through `http://localhost:3001/login`, which matches the currently configured CORS origin; the admin form is filled and ready for a second submission check.
- Through `http://localhost:3001`, the admin login succeeded and redirected to `/dashboard`; the overview rendered five live products, zero posts, and a 100% approval rate.
- After the browser session became unavailable and the products route was reopened directly, the products page showed `Request failed with status 403`; this is consistent with the session token not being present in the new browser context, not with loss of PostgreSQL data.
- A fresh browser context is now on the localhost login page with the seeded admin credentials filled; the next submission should verify the products API from the browser.
- After re-authentication, the browser Products route rendered all five PostgreSQL-backed records with their names, prices, approval states, and image URLs; no 403 or unavailable state remained.
- The authenticated Brand workspace loaded `Maamora` and primary color `#f97316` from the live brand endpoint after the backend restart, confirming persisted settings reach the frontend.
- After updating the checked-in CORS defaults, the loopback-origin login page at `http://127.0.0.1:3001` is populated with the admin credentials and ready for submission; the backend preflight now returns HTTP 200 for this origin.
- The loopback-origin login submission still returned to `/login?` instead of navigating; the browser console showed no explicit error, so the next diagnostic is the captured network request log.
- Next.js was updated with `allowedDevOrigins: ["127.0.0.1"]` and restarted. The loopback login page now shows the devtools client marker and has the admin credentials filled, indicating the client is hydrated for a new submission.
- The loopback-origin login now navigates to `/dashboard`, and `/dashboard/products` renders all five persisted product records, confirming browser-to-Next.js-to-Spring-Boot-to-PostgreSQL integration on both localhost and loopback origins.
