# Higgsfield API contract findings

Date: 2026-08-15

## Official sources

1. Official Node/TypeScript SDK: https://github.com/higgsfield-ai/higgsfield-js
2. Official Python SDK: https://github.com/higgsfield-ai/higgsfield-client

## Verified contract details

The official Node SDK v2 documents server-side authentication using either a single `KEY_ID:KEY_SECRET` credential or separate key and secret fields. It constructs the HTTP header as `Authorization: Key KEY_ID:KEY_SECRET` and recommends the base URL `https://platform.higgsfield.ai`.

The documented v2 image subscription endpoint uses a model path such as `flux-pro/kontext/max/text-to-image`, with a JSON request body containing an `input` object. The documented input includes `prompt`, `aspect_ratio`, and `safety_tolerance`; image-to-image examples use `input_images` where supported. The SDK documents polling through `/requests/{request_id}/status` and completed results under `images[].url`.

STUDIO’s HiggsfieldImageService matches the documented authorization, base URL, model path, polling, and result extraction. Before this repair, however, it wrapped the request body as `{input:{prompt,aspect_ratio,safety_tolerance,input_images}}`, while the official SDK sends the input fields directly at the top level. STUDIO has now been corrected to send the direct-input body for image and video requests.

## Live STUDIO evidence

The safe runtime diagnostics response confirms the running backend has both credentials loaded, no whitespace or colon corruption, the expected base URL, and the configured text-to-image and reference models. The live generation request nevertheless returns HTTP 401 Unauthorized. This makes a local `.env` loading defect unlikely; remaining possibilities are provider-side credential/account authorization, a provider account that does not have access to the selected model, or an unobserved endpoint/account contract difference.
