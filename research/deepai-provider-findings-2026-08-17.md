# DeepAI provider findings — 2026-08-17

## Official sources

- https://deepai.org/apis
- https://deepai.org/docs
- https://deepai.org/machine-learning-model/text2img
- https://deepai.org/machine-learning-model/image-editor

## Verified API contract

DeepAI documents a REST API using `POST https://api.deepai.org/api/<model>` with `multipart/form-data` inputs and the API key in the `api-key` HTTP header. The text-to-image example uses `POST https://api.deepai.org/api/text2img`, form field `text`, and returns JSON containing `output_url` and an `id`.

The official API overview lists image generation, image editing/inpainting, super resolution, background removal, and colorization. The official AI Photo Editor page states that users can upload up to three images and describe edits. The developer API docs need to be consulted for the exact image-editor model identifier and field name before implementation; do not guess the field name.

## Authentication and access

The official API overview says the API key is obtained from the DeepAI dashboard and API access is included with DeepAI Pro. The documented header is `api-key: YOUR_API_KEY`, not `Authorization: Bearer`.

## Response and errors

The official docs state successful image requests return HTTP 200 with a JSON body containing `output_url` and a job/file `id`. Documented error classes include 401 for missing/invalid API key or usage quota exceeded, 410 for a removed model, and 500 for unknown model or processing failure.

## Pricing/limits

The official docs state API access requires DeepAI Pro and usage is drawn from monthly allowances or a prepaid wallet. The docs list 500 standard AI image generator calls per month under Pro, with additional usage charged from wallet balance; therefore DeepAI is not free/unlimited.

## STUDIO implications

DeepAI is a plausible hosted provider for prompt generation and may support multi-image editing, but the exact public API image-editor model/field contract must be confirmed before writing an adapter. The implementation should use server-side `api-key`, multipart form uploads, download the returned `output_url`, and return bytes through `ManagedImageService`. It should preserve explicit 401/quota, 410, and 500 error states.

The official docs confirm up to three uploaded images in the web editor, but this does not automatically prove the API accepts three references; that distinction must be validated against the model-specific API docs.
