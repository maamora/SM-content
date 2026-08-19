# Gemini image-provider contract — 2026-08-18

## Official source

- [Google Gemini API: Nano Banana image generation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Google Gemini API: Imagen migration guidance](https://ai.google.dev/gemini-api/docs/imagen)

## Verified integration findings

Google now describes **Nano Banana** as Gemini's native image-generation capability. The current API supports text-to-image generation and text-and-image-to-image editing using an Interactions API request with a server-side `x-goog-api-key` header. Image input is supplied as base64 bytes with a MIME type; output is returned as base64 image data, which STUDIO can persist through its existing storage service.

The official documentation identifies `gemini-3.1-flash-image` as the general-purpose image model. It supports multiple reference-image processing and image consistency. This makes it suitable for the STUDIO product-plus-model Photo Shoot workflow, provided that the backend downloads both user-owned reference images, passes them with accurate MIME types, and stores the returned generated output.

`gemini-3.1-flash-lite-image` is designed for low cost and speed but is not optimized for multiple reference inputs or multi-turn editing. `gemini-3-pro-image` is positioned for the most complex visual control. For STUDIO's single configured provider path, use `gemini-3.1-flash-image` by default, and treat the model as a server-side environment value rather than a frontend choice.

The same official documentation lists up to 14 reference images for Gemini 3 image models. Its Interactions API accepts `response_format` with `type: image`, a MIME type, and a supported `aspect_ratio` such as `1:1`, `16:9`, or `9:16`. STUDIO will request PNG output and map the existing Studio aspect-ratio selections to that field.

## Request shape

```http
POST https://generativelanguage.googleapis.com/v1beta/interactions
x-goog-api-key: ${GEMINI_API_KEY}
Content-Type: application/json

{
  "model": "gemini-3.1-flash-image",
  "input": [
    {"type": "text", "text": "...creative direction..."},
    {"type": "image", "mime_type": "image/jpeg", "data": "<base64>"}
  ]
}
```

STUDIO must take `interaction.output_image.data`, decode it, and pass the resulting bytes to `StorageService`. The client must never call Gemini or receive the API key.

## Migration implications

Puter.js is not viable as STUDIO's active visual path because it requires a funded end-user Puter account. The replacement must be the backend-owned Gemini adapter.

The Imagen API documentation currently states that Imagen has been deprecated and that image generation should migrate to Nano Banana. STUDIO should therefore not introduce or retain an Imagen path for this migration.
