# OpenRouter evaluation for STUDIO — 2026-08-16

## Verified official findings

OpenRouter provides a dedicated image API at `POST https://openrouter.ai/api/v1/images`, with model discovery at `GET https://openrouter.ai/api/v1/images/models`. Image models can support text and optional image inputs, but capabilities are model- and endpoint-specific; the per-endpoint records are authoritative for accepted parameters and pricing.

Image-generation responses return base64-encoded image bytes in `data[].b64_json`, with `media_type` where identifiable and usage/cost metadata when available. This differs from STUDIO's existing provider adapters, which generally download or receive an image URL and hand it to storage.

OpenRouter's multimodal API supports image inputs through URLs or base64 data URLs for compatible vision models. Multiple modalities can be combined, but the number of images and reference behavior varies by model and provider; OpenRouter does not guarantee a universal two-reference product-plus-model contract.

OpenRouter also documents an asynchronous video-generation API, but video generation remains model/provider-specific and is not equivalent to a single universal managed video model. STUDIO should not assume that every OpenRouter image model or video model accepts the same parameters.

OpenRouter supports provider routing and failover. Relevant routing options include provider order, allow_fallbacks, require_parameters, data-collection controls, sorting by price/throughput/latency, and maximum price. This can improve availability but introduces provider-dependent output, data-policy, and capability variation.

OpenRouter's free model limits are not unlimited. The official limits page documents 20 requests per minute for free models; daily limits are 50 requests for users without purchased credits and 1,000 requests for users who have purchased at least 10 credits. Credit exhaustion may return HTTP 402; rate limiting may return HTTP 429.

## Architecture implication for STUDIO

OpenRouter is a strong candidate for caption generation, visual analysis, prompt assistance, and optional image generation through a dedicated adapter. It is not a perfect drop-in replacement for Stability AI because image-output models have different request contracts and their actual costs/capabilities are endpoint-specific. It should be added as an optional provider behind the existing `ImageGenerationProvider` interface, not replace the current Stability adapter without deterministic contract tests.

For product-only generation, OpenRouter can be suitable when the selected model endpoint supports image input and output. For product-plus-model shoots, STUDIO should retain its explicit product-only fallback or composite-reference strategy and inspect the selected endpoint's capabilities before sending two references.

## Sources

1. https://openrouter.ai/docs/guides/overview/multimodal/image-generation
2. https://openrouter.ai/docs/guides/overview/multimodal/overview
3. https://openrouter.ai/docs/api_reference/limits
4. https://openrouter.ai/docs/guides/routing/provider-selection
5. https://openrouter.ai/models?output_modalities=image
6. https://openrouter.ai/pricing
