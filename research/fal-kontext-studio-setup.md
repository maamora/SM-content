# fal.ai FLUX.1 Kontext Pro setup for STUDIO

## Official setup facts

fal.ai requires an API key for model API calls. Keys are created from https://fal.ai/dashboard/keys, are shown only once, and can use API scope for model inference. The official SDKs read the key from the `FAL_KEY` environment variable. Source: https://fal.ai/docs/documentation/setting-up/authentication

fal.ai recommends keeping the key server-side. Production applications should call fal.ai from their own backend or a server-side proxy rather than exposing the key in browser code. Source: https://fal.ai/docs/documentation/model-apis/inference/server-side

The official FLUX.1 Kontext Pro endpoint is `fal-ai/flux-pro/kontext`. Its documented core input is a required `prompt` plus a required `image_url`. It supports `num_images`, `output_format`, `safety_tolerance`, `aspect_ratio`, `seed`, `guidance_scale`, and prompt enhancement. The output contains generated image URLs and metadata. Source: https://fal.ai/models/fal-ai/flux-pro/kontext/api

## STUDIO configuration

Use a backend-only variable. To follow fal.ai’s convention, the recommended name is `FAL_KEY`; if the existing STUDIO adapter uses `FAL_API_KEY`, either rename the adapter variable or map `FAL_API_KEY` to `FAL_KEY` in the backend configuration. Never add the key to `NEXT_PUBLIC_*` variables and never place it in frontend source code.

Recommended backend values:

```env
FAL_KEY=replace_with_the_key_created_at_fal_dashboard
FAL_IMAGE_MODEL=fal-ai/flux-pro/kontext
```

The model accepts one `image_url` in its base contract. For a product-plus-model shoot, STUDIO should either create a controlled composite reference before the request or run a two-stage workflow; it should not claim that the base endpoint accepts two independent image URLs until a live test confirms that behavior.

For a direct smoke test, use a publicly reachable image URL and the official authorization format:

```powershell
$env:FAL_KEY = "your_key_here"
$body = @{
  prompt = "Create a premium editorial fashion campaign image. Preserve the product shape, color, material, and logo exactly. Place it in a clean studio scene with soft directional light and a natural luxury pose."
  image_url = "https://example.com/product-reference.jpg"
  aspect_ratio = "4:5"
  num_images = 1
  output_format = "jpeg"
  safety_tolerance = "2"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method Post `
  -Uri "https://fal.run/fal-ai/flux-pro/kontext" `
  -Headers @{ Authorization = "Key $env:FAL_KEY"; Accept = "application/json" } `
  -ContentType "application/json" `
  -Body $body
```

In STUDIO, uploaded files must first be accessible by URL to fal.ai. The backend should either use the existing Cloudinary public URL or upload the file to fal.ai storage, then pass the resulting URL as `image_url`. The returned fal.ai image URL should be copied into STUDIO-controlled storage before long-term persistence because provider-hosted output URLs should not be treated as the application’s permanent storage boundary.

## Error handling

Map HTTP 401/403 to invalid key or access restrictions, 422 to invalid model input, 429 to quota or rate limiting, and 5xx responses to a retryable provider failure. Do not retry malformed requests or invalid credentials automatically. Keep the provider capability endpoint explicit when `FAL_KEY` is missing.
