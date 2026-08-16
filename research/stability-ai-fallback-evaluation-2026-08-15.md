# Stability AI managed fallback evaluation

## Sources reviewed

1. Stability AI REST API reference: https://platform.stability.ai/docs/api-reference
2. Stable Image overview: https://platform.stability.ai/docs/getting-started/stable-image
3. API pricing update: https://stability.ai/api-pricing-update-25
4. Stability AI FAQ: https://platform.stability.ai/faq

## Verified findings

Stability AI’s current managed REST service is REST v2beta. The official documentation lists Stable Image Ultra, Stable Image Core, and Stable Diffusion 3.5 generation services, plus edit and control services including inpaint, outpaint, search-and-replace, background operations, sketch, structure, style guide, and style transfer.

The documented authentication mechanism is one Stability API key in the Authorization header. The official request sample uses a Bearer token, and the current Stable Image Ultra endpoint is `https://api.stability.ai/v2beta/stable-image/generate/ultra`. Requests use multipart/form-data; the client should generate the boundary automatically. The API can return image bytes directly with `Accept: image/*` or JSON with a base64-encoded image using `Accept: application/json`.

Stable Image Ultra accepts a prompt and optionally an input image, strength, aspect ratio, negative prompt, seed, output format, and style preset. The documentation says the image input requires strength and supports JPEG, PNG, and WebP within documented dimension and size limits. Stable Image Core is positioned as the faster and more affordable generation service. The documentation describes the services as managed APIs and says the REST v2beta service is the primary API for new features.

The current API is credit-based rather than free/unlimited. The official API pricing update states that API usage is based on credits, and the official FAQ says users should confirm sufficient credits in the billing page when an API key is not working. The API documentation states a rate limit of 150 requests per 10 seconds. The API pricing update also states that the Stable Video API was discontinued in July 2025, so Stability AI should not be selected for STUDIO’s video-generation requirement.

Stable Image Ultra documentation states that the service uses 8 credits per successful result. Other model and edit-service credit costs should be read from the live pricing page before implementation; they are not assumed here.

## Implication for STUDIO

Stability AI is a credible managed image fallback for text-to-image and single-reference image-to-image/editing, but it does not satisfy STUDIO’s requirement for a free, unlimited provider. The documented image input is a single starting image; the sources reviewed do not establish a first-party two-independent-reference product-plus-model composition workflow equivalent to the current STUDIO photo-shoot contract. A fallback would therefore need either a product-image-first generation flow with the model image used as a later edit/control input, or an explicit limitation in the UI.

Any future adapter should be server-side, accept the one API key through an environment variable, send multipart requests to the REST v2beta endpoint, persist returned image bytes through the existing Cloudinary/local storage boundary, and map provider errors such as 401, 403 moderation, 413 size, 422 validation, 429 rate limit, and 500 provider errors to explicit capability states. It should not silently replace Higgsfield until a live credential test confirms quality and request compatibility.

## Broader replacement research

### FLUX.1 Kontext through fal.ai or Replicate

Black Forest Labs describes FLUX.1 Kontext as an in-context image generation and editing family with character consistency, local editing, style references, and text-plus-image input. The official model page positions Kontext Max as the premium variant and Kontext Pro as the faster iterative editing model. Source: https://bfl.ai/models/flux-kontext

fal.ai exposes `fal-ai/flux-pro/kontext` as a managed commercial API. Its current model page accepts a prompt and image URL, supports iterative editing, and lists a displayed cost of $0.04 per image. Source: https://fal.ai/models/fal-ai/flux-pro/kontext

Replicate exposes `black-forest-labs/flux-kontext-pro` and documents commercial use of outputs. Replicate also showcases a multi-image Kontext application that combines two images, but this is presented as a separate hosted application/workflow rather than proof that the base API contract accepts STUDIO’s two references directly. Source: https://replicate.com/blog/flux-kontext

### Google Gemini Nano Banana

Google’s current image-generation documentation describes Nano Banana as Gemini’s native image generation and editing capability. It lists Gemini 3.1 Flash Image (Nano Banana 2) as the general-purpose workhorse that excels at multiple reference image processing and consistency, and Gemini 3 Pro Image (Nano Banana Pro) as the premium model for complex visual tasks and brand consistency. The same documentation explicitly describes using text plus multiple images and says the newer Gemini 3 image models support up to 14 reference images. All generated images include a SynthID watermark. Source: https://ai.google.dev/gemini-api/docs/image-generation

Google Cloud’s official launch material for Gemini 2.5 Flash Image explicitly described multi-image fusion, character consistency, and conversational editing for marketing and advertising workflows. Source: https://cloud.google.com/blog/products/ai-machine-learning/gemini-2-5-flash-image-on-vertex-ai

Google’s current Gemini API pricing page says image output is token-priced and provides free access with limited model access for developers, followed by paid production tiers with higher limits. The exact model and resolution price should be read from the live pricing table immediately before deployment. Source: https://ai.google.dev/gemini-api/docs/pricing

## Preliminary conclusion

For STUDIO’s core product-plus-model photo-shoot workflow, Google Gemini Nano Banana 2 is the strongest functional match because the official documentation explicitly supports multiple reference images and consistency. FLUX.1 Kontext Pro through fal.ai is the strongest straightforward managed fallback for high-quality single-reference editing and may be cheaper per image, but its base API contract should not be assumed to support two independent references without a real integration test. Replicate is flexible and commercially usable, but it is an orchestration platform whose final cost and reliability depend on the chosen model and queue behavior.
