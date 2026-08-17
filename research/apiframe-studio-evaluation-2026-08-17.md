# ApiFrame Evaluation for STUDIO

**Author:** Manus AI
**Date:** 17 August 2026
**Decision:** Viable hosted provider for STUDIO image generation, editing, and product-plus-model reference workflows, subject to paid-credit availability and provider limits.

## Executive conclusion

ApiFrame is a technically suitable primary provider for the current STUDIO configuration. Its official API uses an API key in the `X-API-Key` header, exposes a single asynchronous image-generation endpoint, and supports model-specific reference-image fields. In particular, Flux 2 Pro accepts up to eight input images, Seedream 4 accepts up to ten, Seedream 5.0 Pro accepts up to ten, and Nano Banana accepts up to fourteen [1] [2] [3] [4]. This directly satisfies STUDIO’s core photo-shoot requirement: a prompt can combine a product reference and a model reference in one request.

ApiFrame is **not an unlimited-free solution**. The documentation lists credit costs per model or resolution and describes a pay-as-you-go system with starter credits. A production configuration must therefore retain explicit credit and provider-unavailable states rather than promising unlimited generation.

## Official contract

| Concern | ApiFrame contract | STUDIO mapping |
|---|---|---|
| Base URL | `https://api.apiframe.ai/v2` | `APIFRAME_BASE_URL` |
| Authentication | `X-API-Key: afk_...` | Server-side `APIFRAME_API_KEY`; never exposed to the frontend |
| Submit | `POST /images/generate` | `submit()` in `ApiFrameImageService` |
| Initial result | `202 Accepted`, containing `jobId` and queued status | Job ID is passed to bounded polling |
| Poll | `GET /jobs/:id` | `awaitResult()` |
| Completion | `status=COMPLETED` and `result.images[]` | First image URL is selected |
| Output | HTTPS CDN URL | Downloaded into STUDIO’s configured storage as `byte[]` |
| Editing | Same generation endpoint with model-specific reference-image array | `ManagedImageService.generateImage(prompt, aspectRatio, references)` |
| Auth failure | HTTP 401 | Provider error with compact upstream details |
| Credits | HTTP 402 when credits are insufficient | Explicit “add credits or choose another provider” error |
| Rate/capacity | HTTP 429 or temporary 503 | Existing provider fallback can classify retryable failures |

## Reference-image support

The model-specific documentation is important because the common endpoint alone does not define a universal reference-image field. STUDIO’s adapter selects the field according to `APIFRAME_IMAGE_MODEL`.

| Model family | Payload field | Reference limit | STUDIO use |
|---|---|---:|---|
| `flux-2-pro` and other `flux-2-*` | `fluxParams.input_images` | 8 | Product + model editorial shoots |
| `seedream-4` | `seedreamParams.image_input` | 10 | Multi-reference editing and shoots |
| `seedream-5-pro` | `seedreamParams.image_input` | 10 | Highest-reference editorial workflow |
| `nano-banana` | `nanoBananaParams.image_input` | 14 | Broad multi-reference experimentation |

For reference requests, STUDIO sends `aspect_ratio: "match_input_image"` so the output follows the first input image’s geometry. The user prompt remains responsible for defining the composition, for example: “Place the product from image 1 on the model from image 2 in a premium studio campaign, preserve the product silhouette and match the lighting.”

## Async behavior and reliability

The adapter follows the same submit–poll–download pattern already used by STUDIO’s other managed image integrations. Polling is bounded by `APIFRAME_TIMEOUT_MS`, uses `APIFRAME_POLL_INTERVAL_MS`, recognizes completed, failed, error, and canceled statuses, rejects missing result URLs, and rejects empty or oversized downloaded output. The adapter does not store ApiFrame CDN URLs as permanent assets because the official documentation states that result URLs are retained for a limited period; STUDIO downloads the output into its configured storage before returning from the managed provider boundary.

The provider is therefore suitable for production use only when the deployment has a valid ApiFrame key, sufficient credits, configured persistent storage, and a fallback or explicit unavailable state. It should not silently degrade a two-reference shoot into a product-only request.

## Environment configuration

```dotenv
IMAGE_PROVIDER=apiframe
APIFRAME_API_KEY=afk_your_api_key
APIFRAME_IMAGE_MODEL=flux-2-pro
APIFRAME_BASE_URL=https://api.apiframe.ai/v2
APIFRAME_POLL_INTERVAL_MS=3000
APIFRAME_TIMEOUT_MS=180000
APIFRAME_OUTPUT_FORMAT=png
```

`seedream-5-pro` is the alternative recommended for multi-reference quality testing; `flux-2-pro` is the default because its documentation explicitly presents high-quality generation and editing with multi-reference support. ApiFrame credits and account status must be checked in the provider console; they cannot be inferred from local configuration alone.

## Implementation status

STUDIO now includes `ApiFrameImageService`, registers `apiframe` and `api-frame` aliases in `ImageGenerationProvider`, exposes the configuration through `application.yml` and `.env.example`, and includes deterministic MockRestServiceServer coverage for authentication, multi-reference JSON mapping, asynchronous polling, and output download. No live request was made because a real provider key and credit balance are required, and live generation consumes paid or starter credits.

## References

[1]: https://apiframe.ai/docs/images/flux/flux-2-pro "ApiFrame Docs — Flux 2 Pro"

[2]: https://apiframe.ai/docs/images/seedream/seedream-4 "ApiFrame Docs — Seedream 4"

[3]: https://apiframe.ai/docs/images/seedream/seedream-5-pro "ApiFrame Docs — Seedream 5.0 Pro"

[4]: https://apiframe.ai/docs/images/nano-banana/nano-banana "ApiFrame Docs — Nano Banana"

[5]: https://apiframe.ai/docs/images "ApiFrame Docs — Image Generation Overview"
