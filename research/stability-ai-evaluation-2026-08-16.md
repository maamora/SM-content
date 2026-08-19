# Stability AI evaluation for STUDIO — 2026-08-16

## Official findings

Stability AI's current REST v2beta API supports Stable Image Ultra, Stable Image Core, Stable Diffusion 3.5, image editing, control, and asynchronous result fetching. The official API documentation states that generation endpoints accept a prompt and may optionally accept one `image` input with a required `strength` parameter. The documented input is a single image field, not a two-image reference list.

The official getting-started documentation requires an API key and credits. It says Google sign-in grants 25 free credits and that additional credits are purchased through the billing dashboard. Therefore Stability AI is not a permanently free or unlimited provider.

The official Stable Image documentation positions the platform for image generation, editing, and control workflows. The current Stable Image REST API uses multipart/form-data and returns image bytes or JSON/base64 depending on the Accept header. The documented image-to-image material confirms that an initial image can be transformed with a prompt, but it does not establish native two-reference identity conditioning.

## STUDIO implications

Stability AI is technically suitable as a managed fallback for product-only image generation and single-reference image editing. It is not, based on the reviewed official documentation, a direct solution for passing both a product image and a model image as separate references. STUDIO would still need either a composite reference board or a product-only prompt fallback for that workflow.

Stability AI also requires credits, so it does not solve the account-funding issue in principle; it provides a different managed provider and potentially different pricing/access terms. The safest architecture is a provider adapter with explicit capability reporting, no silent fallback to fabricated output, actionable errors for insufficient credits or moderation rejection, and a selectable `IMAGE_PROVIDER=stability` mode only when `STABILITY_API_KEY` is configured.

## Sources

1. https://platform.stability.ai/docs/api-reference
2. https://platform.stability.ai/docs/getting-started
3. https://platform.stability.ai/docs/getting-started/stable-image
4. https://platform.stability.ai/docs/legacy/grpc-api/features/image-to-image

## Current v2beta contract checked during provider migration

Official API reference: https://platform.stability.ai/docs/api-reference

The current Stability Platform API identifies REST v2beta as the primary REST service. Stable Image Ultra and Core generation use POST `/v2beta/stable-image/generate/{model}` with `Authorization: Bearer <API_KEY>`, multipart/form-data, and `Accept: image/*` for direct image bytes. The request requires `prompt`; optional fields include `image`, `strength` when an image is supplied, `aspect_ratio`, `negative_prompt`, `output_format`, and `style_preset`. The documented endpoint supports one starting image, not separate product and model inputs. The reference also documents 403 moderation responses, 413 oversized payloads, 422 rejected requests, and 429 rate limits. The implementation should map these into explicit STUDIO errors and must not retry non-transient account, moderation, or validation failures.
