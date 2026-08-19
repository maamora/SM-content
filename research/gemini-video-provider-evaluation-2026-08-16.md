# Gemini/Veo video provider evaluation

## Official findings

Google's Gemini API video documentation states that the API offers Gemini Omni Flash and Veo. The documentation recommends Gemini Omni Flash as the default video-generation model for video coherence, multi-input reasoning, character consistency, and multi-turn conversational editing. It describes Veo 3.1 as supporting native audio, video extension, frame-specific generation, and image-based direction through `generateContent`.

The official pricing page states that the Gemini API has a free tier with limited access to certain models and a paid tier for production access. The page lists Veo 3.1 and Veo 3 in the pricing catalog; video-generation pricing is paid rather than an unlimited free tier. Therefore, Gemini/Veo is practical for development only within account/model limits, not a guaranteed free production provider.

## Sources

- https://ai.google.dev/gemini-api/docs/video
- https://ai.google.dev/gemini-api/docs/pricing

## STUDIO decision

Use Gemini/Veo only behind a dedicated `VideoGenerationProvider` interface. Do not set `videoGeneration=true` from environment variables alone. The adapter must support asynchronous operation polling, image input, output download, timeout handling, and explicit provider errors. Keep the capability false unless a valid video model and API key are configured and provider-contract tests pass.

Recommended initial model configuration should be verified against the user's Google AI Studio model list rather than assumed. Candidate configuration names should be treated as placeholders until the account confirms availability.


## Veo 3.1 documentation verification

Google's dedicated Veo page currently states that Veo 3.1 generates 8-second videos at 720p, 1080p, or 4K with natively generated audio. It lists portrait video support, video extension, frame-specific generation, and image-based direction with up to three reference images. The page currently notes that this feature is available only with the `generateContent` API. This is important: the adapter must target the current generateContent/Interactions-compatible contract rather than assuming the older Vertex-style `predictLongRunning` endpoint.

Source: https://ai.google.dev/gemini-api/docs/veo


## Official pricing and REST contract verification

Google's current Gemini Developer API pricing page has a general free tier for limited models, but the Veo pricing rows list free-tier access as not available and paid per-second pricing for Veo 3.1. Therefore Veo is not a free API choice for production; a billing-enabled paid tier is required for actual video generation.

The official Veo REST example uses:
- Base URL: `https://generativelanguage.googleapis.com/v1beta`
- POST: `/models/veo-3.1-generate-preview:predictLongRunning`
- Header: `x-goog-api-key`
- Request body: `{ "instances": [{ "prompt": "..." }] }`
- Poll: `GET /{operation_name}` with the same `x-goog-api-key` header
- Completed output URI: `.response.generateVideoResponse.generatedSamples[0].video.uri`
- Download the URI with the API key and follow redirects.

The page also provides the official Java GenAI SDK path using `Client.models.generateVideos`, polling with `client.operations.getVideosOperation`, and downloading the generated `Video`. It states Veo 3.1 supports 8-second 720p/1080p/4K video with generated audio, portrait 9:16, video extension, first/last-frame generation, and up to three reference images. The current documentation banner says the feature is currently available through the `generateContent` API; the page's REST example remains the verified `predictLongRunning` contract and should be treated as the integration reference pending SDK/endpoint compatibility testing.

Sources:
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/veo
