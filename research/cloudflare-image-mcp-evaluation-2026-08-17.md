# Cloudflare Image MCP and Workers AI Evaluation

## Conclusion

Cloudflare can replace DeAPI for STUDIO image generation through Workers AI, but the safer integration is a direct server-side Workers AI REST API adapter, not an unofficial image MCP. Cloudflare’s official MCP offering is primarily an MCP server for managing Cloudflare API resources; it is not documented as a dedicated image-generation MCP. A community image MCP may wrap Workers AI, but it introduces an additional unverified dependency and should not be the production boundary for STUDIO.

## Verified official capabilities

Cloudflare’s Workers AI model catalog lists `@cf/black-forest-labs/flux-2-dev` with multi-reference support. It also lists `@cf/black-forest-labs/flux-2-klein-4b` and `@cf/black-forest-labs/flux-2-klein-9b` as fast image generation/editing models. The older `@cf/runwayml/stable-diffusion-v1-5-img2img` model supports an input image or base64 image, but is marked beta and has lower expected editorial quality.

Cloudflare’s Images product is for hosting, resizing, optimization, and transformation. It is not an image-generation model and cannot replace DeAPI or Workers AI for the AI shoot itself.

Workers AI REST calls use the account endpoint `/client/v4/accounts/{ACCOUNT_ID}/ai/run/{MODEL}` with `Authorization: Bearer {API_TOKEN}`. Cloudflare documents creating a Workers AI API token from the Workers AI dashboard; a custom token needs Workers AI Read and Workers AI Edit permissions.

## STUDIO fit

Workers AI is a reasonable replacement for DeAPI because `flux-2-dev` is explicitly documented with multi-reference support, matching the product-plus-model workflow. The adapter should call the REST endpoint, send the prompt and model-specific image inputs, decode the model result, and return the same stored image contract used by `ManagedImageService`. It should not use an MCP call inside the Spring Boot request path.

Cloudflare Images can optionally be used later for asset hosting, variants, and delivery optimization. It should remain separate from generation and should not be described as an AI image generator.

## Official sources

- https://developers.cloudflare.com/workers-ai/models/
- https://developers.cloudflare.com/workers-ai/models/flux-2-dev/
- https://developers.cloudflare.com/workers-ai/models/stable-diffusion-v1-5-img2img/
- https://developers.cloudflare.com/workers-ai/get-started/rest-api/
- https://developers.cloudflare.com/images/
- https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/
