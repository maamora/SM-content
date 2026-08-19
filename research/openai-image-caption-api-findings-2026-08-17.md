# OpenAI image and caption API findings (2026-08-17)

## Verified sources

1. Image generation guide: https://developers.openai.com/api/docs/guides/image-generation
2. Images and vision guide: https://developers.openai.com/api/docs/guides/images-vision
3. Create image edit reference: https://developers.openai.com/api/reference/resources/images/methods/edit
4. GPT Image 1 model reference: https://developers.openai.com/api/docs/models/gpt-image-1

## Findings

OpenAI documents `gpt-image-1` as a multimodal image model that accepts text and image inputs and supports both `v1/images/generations` and `v1/images/edits`. The edit endpoint accepts one or more source images, including up to 16 images for GPT Image models, through multipart `image[]` fields. It returns generated images as `data[].b64_json`.

For text captions, OpenAI-compatible chat-completions responses should be parsed from `choices[0].message.content`, but production parsing must also tolerate structured content arrays where text is nested in content parts. Empty or missing content should be treated as a provider failure and trigger an explicit error or configured fallback, rather than returning an empty string.

The STUDIO image provider interface accepts reference URLs and returns raw bytes. The OpenAI adapter can download reference URLs, send them as multipart `image[]` parts to `/v1/images/edits`, and decode `data[].b64_json`. Text-only generation can use `/v1/images/generations`, but product-plus-model workflows should use the edits endpoint.
