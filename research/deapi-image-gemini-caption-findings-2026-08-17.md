# DeAPI image and Gemini caption findings (2026-08-17)

## Official DeAPI sources

1. https://docs.deapi.ai/api/v2/overview
2. https://docs.deapi.ai/openai-compatibility
3. https://docs.deapi.ai/models
4. https://docs.deapi.ai/limits-and-quotas

## Verified DeAPI contract

DeAPI's native API uses `https://api.deapi.ai` with `Authorization: Bearer <raw API key>`. Its OpenAI-compatible image surface uses `https://oai.deapi.ai/v1` and a DeAPI key with the `dpn-sk-` prefix. The OpenAI-compatible surface supports `/v1/images/generations` and `/v1/images/edits`, but it does not support `/v1/chat/completions`; therefore it cannot be used for captions.

The native v2 image endpoints are `POST /api/v2/images/generations` and `POST /api/v2/images/edits`. These submit asynchronous jobs and return a `data.request_id`. The client must poll `GET /api/v2/jobs/{request_id}` until `data.status` is `done`, then download `data.result_url`.

The authoritative model list is `GET /api/v2/models`, which is paginated. Model slugs must be taken from the `slug` field, not the display name. Models expose `inference_types`; `txt2img` is text-to-image and `img2img` is image-to-image. The docs list current basic-account image-generation models including `Flux1schnell`, `ZImageTurbo_INT8`, and `Flux_2_Klein_4B_BF16`, while image-edit models include `Flux_2_Klein_4B_BF16` and `QwenImageEdit_Plus_NF4`. The integration should keep the model configurable and should not assume a stale slug without checking the live model endpoint.

DeAPI's documented OpenAI-compatible example uses `Flux1schnell`, JSON input with `model`, `prompt`, `size`, and `n`, and returns an image URL. For STUDIO reference workflows, the edit route and model capability must be selected only when the model supports `img2img`. If the active model does not support multiple references, STUDIO should preserve its existing product-only fallback and report that limitation explicitly.

Basic accounts have rate limits, not unlimited free usage. The docs state that new accounts may receive a $5 bonus without a credit card, with conservative limits; Premium requires any payment and provides 300 RPM with unlimited daily requests. This must be described honestly in project documentation.

## Gemini caption direction

Gemini remains suitable for captions through the existing Gemini text adapter. Caption and video keys should remain separate: `GEMINI_CAPTION_API_KEY` for captions, `GEMINI_VIDEO_API_KEY` for video, with `GEMINI_API_KEY` as a backward-compatible fallback only where the existing code supports it. Gemini responses must be checked for non-empty text and malformed response structures before persistence or returning the caption to the frontend.


## Official Gemini model and response findings

Sources:

- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/api/generate-content
- https://ai.google.dev/gemini-api/docs/text-generation

The current Gemini model catalogue identifies `gemini-2.5-flash` as a stable price-performance text model and identifies older Gemini 2.0 models as shut down. The caption default has therefore been updated from the stale `gemini-1.5-pro` to `gemini-2.5-flash`.

The REST GenerateContent endpoint is `POST https://generativelanguage.googleapis.com/v1beta/{model=models/*}:generateContent` with the `x-goog-api-key` header. Standard text responses contain `candidates[].content.parts[].text`; the caption extractor must reject empty candidates, blocked responses, and missing text instead of returning an empty string.
