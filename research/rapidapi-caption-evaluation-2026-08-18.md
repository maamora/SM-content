# RapidAPI caption-generation evaluation

## Finding

RapidAPI is an API marketplace and gateway, not a caption-generation model or a single caption API. A RapidAPI account and API key are required to test and integrate a selected listing. Where a listing has a pricing tab, the developer must subscribe to a plan before calling it. RapidAPI explains that many listings expose a free BASIC plan for testing, but the API provider sets the quota; overage usage can be charged, and the developer is responsible for monitoring the quota in the dashboard or response headers.

RapidAPI is therefore **not** an unlimited, fully free replacement for STUDIO captions. It can be an optional hosted fallback only when the user selects a specific, reputable caption or text-generation listing with a suitable free quota and accepts that the provider, quota, quality, uptime, data handling, and price can change.

## Fit with the current STUDIO backend

The existing `CaptionGenerationService` supports Gemini, Groq, OpenAI-compatible endpoints, OpenRouter, and local Ollama. It does not currently include a generic RapidAPI adapter. Adding one requires the exact listing’s host, request path, request schema, response schema, language capability, quota, privacy terms, and error responses. A generic `RAPIDAPI_KEY` alone is not enough to produce captions because different listings use different routes and payloads.

## Safe configuration pattern after a listing is selected

Store the RapidAPI key only in `backend/.env`; never use it in the Next.js frontend. The backend adapter should send `X-RapidAPI-Key: ${RAPIDAPI_KEY}` and `X-RapidAPI-Host: ${RAPIDAPI_HOST}`, plus the listing-specific JSON request. It should surface 401/403 configuration errors, 429 quota errors, and malformed-provider-response errors as explicit unavailable states rather than silently falling back to an unrelated service.

## Sources

1. RapidAPI consumer quick-start guide: https://docs.rapidapi.com/docs/consumer-quick-start-guide
2. RapidAPI FAQ: https://docs.rapidapi.com/docs/faqs
