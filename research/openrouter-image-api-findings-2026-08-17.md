# OpenRouter image API findings (2026-08-17)

## Verified sources

1. OpenRouter Image Generation documentation: https://openrouter.ai/docs/guides/overview/multimodal/image-generation
2. OpenRouter model API reference: https://openrouter.ai/docs/api/api-reference/models/list-all-models-and-their-properties
3. OpenRouter Unified Image API announcement: https://openrouter.ai/blog/announcements/image-api/

## Findings

OpenRouter now provides a dedicated image API at `POST https://openrouter.ai/api/v1/images` and model discovery at `GET https://openrouter.ai/api/v1/images/models`. The image-generation documentation demonstrates `bytedance-seed/seedream-4.5` and the dedicated endpoint returning `data[].b64_json` plus `media_type`. The docs also describe normalized `resolution`, `aspect_ratio`, `n`, and reference-image capabilities.

The existing STUDIO adapter calls `/chat/completions` with `modalities=[text,image]` and expects `choices[0].message.images`. The reported `404 No endpoints found for google/gemini-2.5-flash-image-preview` confirms that this identifier is not available for the current OpenRouter chat-completions image route. The official announcement states that existing chat-completions image models may continue to work, but new image models are added exclusively through the dedicated Image API. Therefore, the adapter should migrate to `/images` rather than only swapping the model slug.

The official documentation's example supported model is `bytedance-seed/seedream-4.5`, with text and image input support in the model discovery example. The code must decode `data[].b64_json` and preserve the returned media type if the storage layer needs it. Reference-image support and exact accepted parameters should be checked using the model's endpoint metadata before sending multiple references.
