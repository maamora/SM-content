# STUDIO website validation notes

## Sandbox local frontend

The GitHub checkout frontend started successfully with Next.js 16.2.10 on `http://localhost:3001` when launched directly with the installed Next binary. The package wrapper attempted a frozen dependency install and exited because pnpm reported ignored build scripts; this did not prevent the installed Next frontend from running directly.

The root marketing route rendered the STUDIO wordmark, public navigation, editorial hero, workflow narrative, creative canvas, interactive reference controls, prompt textarea, stage-direction button, campaign stills, CTA links, and footer. The root page title was `STUDIO | Creative operations in motion` and no visible runtime error appeared.

The `/features` route rendered successfully with the same navigation and footer. It contained the generative canvas, language system, publishing control, and an Explore STUDIO CTA. No visible route or rendering error appeared.

## Build checks

TypeScript passed. ESLint passed with four existing warnings and zero errors. The production build passed and generated 17 routes, including marketing, auth, dashboard, admin, and product routes.

## Authentication routes

The local `/login` route rendered the STUDIO sign-in form with email and password fields, an Enter STUDIO action, Forgot password link, and Create an account link. The local `/register` route rendered name, email, and password fields with a Create workspace action and Sign in link. No route or rendering errors appeared. No real account was submitted from the sandbox browser.

## Application shell routes

The local `/dashboard` route rendered the workspace sidebar with Overview, Products, Brand, Studio, Batch, Assets, Posts, Calendar, Social, Notifications, and Settings links. Because the sandbox frontend was not connected to the user’s Windows backend, it correctly displayed `Live data unavailable` instead of fabricating records, with Retry and Refresh actions. The `/admin` route rendered the control-room sidebar with Users, Workspaces, Products, Content, Templates, Generations, Publishing, Analytics, Audit logs, and Admin settings. It likewise displayed `Admin data unavailable` and a record-fallback state rather than fabricated live data.

## Creative and publishing routes

The local `/dashboard/studio` route rendered the creative workspace with Photo shoot and Edit an image modes, product and model image drop zones, scenario prompt, Generate photo shoot action, product/format/design controls, multilingual caption controls, approval, and ZIP download actions. Because the sandbox frontend was not connected to the user’s backend, it correctly displayed backend-unavailable messaging and did not submit a generation job.

The local `/dashboard/social` route rendered Meta/Instagram + Facebook, TikTok, LinkedIn, and X connection rows, each marked not connected with provider credentials/review guidance. The publish queue required an approved post and active connection, and showed no publish jobs. No external publishing was attempted.

## Settings and delivery routes

The local `/dashboard/settings` route rendered workspace settings with an explicit Settings unavailable state when the backend was unreachable and a Return to overview link. The local `/dashboard/notifications` route rendered real-record notification and SMTP email-history sections, with no send action exposed in the unavailable state and clear backend-unavailable messaging. No notification or email side effect was attempted.

## Recovery routes

The local `/forgot-password` route rendered explanatory copy and a Send reset link button but exposed no email input in the browser’s interactive elements. The local `/reset-password` route rendered explanatory copy and a Set new password button but exposed no password or confirmation inputs. These are functional UI defects, not backend-unavailable states, because the routes cannot collect the values required to perform their stated actions.

## Recovery defect repair

The recovery routes were repaired locally. `/forgot-password` now exposes a required email input and reports that password recovery is not configured on this backend when submitted, rather than claiming a reset link was sent. `/reset-password` now exposes required new-password and confirmation inputs and reports that password reset is not configured on this backend when submitted. Frontend TypeScript and ESLint pass after the repair; ESLint reports four existing warnings and zero errors.
