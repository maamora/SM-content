# Replicate FLUX.2 provider evaluation

## Decision
Use Replicate as a hosted alternative to Cloudflare for STUDIO image generation and editing. It supports FLUX.2 [dev] image generation and editing, including multiple reference images, and provides a documented asynchronous prediction API. This avoids self-hosting and avoids Cloudflare's current capacity/safety errors.

## Sources reviewed
- https://replicate.com/black-forest-labs/flux-2-dev/api
- https://replicate.com/black-forest-labs/flux-2-dev/readme
- https://replicate.com/collections/flux
- https://github.com/replicate/kontext-realtime

## Integration notes
- Use Replicate's predictions API from the Spring Boot backend; do not expose the token in the frontend.
- Use the official FLUX.2 dev model identifier `black-forest-labs/flux-2-dev`.
- Preserve the existing ManagedImageService byte[] contract by polling the prediction until completion, downloading the returned output URL, and returning the image bytes.
- Pass the STUDIO prompt and reference images through the model's documented input schema. Enforce the model's reference-image limit in the adapter and retain product-only fallback for unsupported multi-reference combinations.
- Replicate is a paid hosted service with account-based usage limits; it is not unlimited or guaranteed free. Live inference requires a Replicate API token and account access.
