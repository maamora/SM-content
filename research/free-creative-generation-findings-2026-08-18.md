# STUDIO fully free creative-generation research notes

## Pollinations.ai: rejected as a fully no-balance default

As of 2026-08-18, the official API documentation states that all generation requests require an API key. It describes its Bring Your Own Pollen flow as authorising the application to spend a user’s own Pollen balance. The default approval budget is five Pollen, and users may adjust the budget. Therefore, Pollinations is capable of hosted generation and image editing, but it is not a genuinely free, no-balance architecture for STUDIO.

The official repository states that Pollinations supports image generation and image editing, but its current operating model includes community-hosted models, automatic fallback routing, and pay-as-you-go Pollen credits. It may remain an explicitly optional user-funded integration, but must not be presented as STUDIO’s zero-cost default.

## Sources

1. Pollinations API documentation: https://gen.pollinations.ai/docs
2. Pollinations repository: https://github.com/pollinations/pollinations

## Browser-local inference: viable only with capability-gated workflows

WebLLM is a browser-local LLM runtime. Its official documentation describes in-browser language-model inference, WebGPU acceleration, worker support, privacy from avoiding server-side processing, and an OpenAI-compatible chat-completions API. It can therefore support local caption and prompt generation, but it is a text runtime rather than an image generator.

Microsoft documents that ONNX Runtime Web can run models entirely client-side and that its WebGPU backend can execute Stable Diffusion Turbo in-browser. The same source also warns that large generative models require considerably more compute and memory than standard browser ML workloads. Its one-second Stable Diffusion Turbo example uses an RTX 4090; it must not be represented as a performance guarantee for typical customer devices.

The MLC Web Stable Diffusion repository demonstrates the no-server approach, but its latest displayed project commit is from March 2024. The project supports browser-local text-to-image work but is not an adequate production-grade foundation for STUDIO’s Photo Shoot and image-editing workflows by itself, and it does not demonstrate separate product-plus-model conditioning.

The more recent `web-txt2img` library is a browser-only TypeScript library released in September 2025. Its documented SD-Turbo adapter uses ONNX Runtime Web with WebGPU, downloads and locally caches model artifacts, and offers progress and cancellation. It presently exposes only 512×512 text-to-image generation. Its documentation explicitly says the WASM fallback is experimental/untested, so it cannot safely be treated as a cross-device solution and does not cover editing or two-reference Photo Shoot generation.

Stability AI’s SD-Turbo model card documents an image-to-image pipeline in addition to text-to-image. This makes it a technically plausible browser-local editing core only if STUDIO implements and maintains the full browser ONNX image-to-image pipeline itself; neither the MLC demo nor web-txt2img supplies that complete workflow. Its model card further directs commercial users to Stability AI’s membership/licence information, so legal review is required before STUDIO uses it commercially.

## Additional sources

3. WebLLM documentation: https://webllm.mlc.ai/docs/
4. Microsoft, ONNX Runtime Web and WebGPU: https://opensource.microsoft.com/blog/2024/02/29/onnx-runtime-web-unleashes-generative-ai-in-the-browser-using-webgpu/
5. MLC Web Stable Diffusion repository: https://github.com/mlc-ai/web-stable-diffusion
6. web-txt2img repository: https://github.com/lacerbi/web-txt2img
7. SD-Turbo model card: https://huggingface.co/stabilityai/sd-turbo

## Feasibility comparison

| Architecture | Paid API balance required | Text-to-image | Image edit | Product + model Photo Shoot | Captions | Honest production assessment |
| --- | --- | --- | --- | --- | --- | --- |
| Puter.js | Yes, once balance is exhausted | Yes | Provider-dependent | Provider-dependent | No | Rejected: the present product error is a balance failure. |
| Pollinations hosted API | Yes, user Pollen balance/authorisation | Yes | Documented | Documented | No | Rejected as a zero-cost default. |
| Groq or Gemini hosted captions | No payment required for some tiers, but quota/API account required | No | No | No | Yes | Appropriate only as an optional limited free tier, not fully free/unlimited. |
| WebLLM + browser SD-Turbo text-to-image | No | Yes, on supported WebGPU devices | Not supplied by the current maintained browser library | Not supplied by the current maintained browser library | Yes | The only no-paid-API, no-server path. It is capability-gated and has model download, VRAM, quality, licence, and device constraints. |
| Native/local diffusion application | No API balance | Yes | Yes | Possible with custom composition/control models | Yes | Technically strongest zero-cost route, but the user explicitly excluded self-hosting/user-run local application setup. |
| Own GPU inference service | No third-party API balance, but infrastructure cost | Yes | Yes | Yes | Yes | Excluded: it is self-hosting and not financially free. |

The conclusion is structural rather than vendor-specific. A hosted service must fund GPU inference, which appears as account credits, a quota, a rate limit, a subscription, or advertising. A fully free and unlimited result therefore requires compute supplied by the user’s own device. Browser-local inference is not self-hosting because STUDIO does not operate a server, but it is not universally available and cannot promise cloud-grade visual quality on every device.

## Recommended boundary

The only defensible all-free configuration is **a local-first browser mode with explicit capability checks**. It should be represented accurately as follows:

| Workflow | Free local implementation | Availability behaviour |
| --- | --- | --- |
| Captions and prompt rewrites | WebLLM, loaded lazily in a web worker on a WebGPU-capable browser | Display an actionable local-model download state, then generate captions entirely in-browser. |
| Product visual generation | Browser WebGPU SD-Turbo using a dynamically loaded open-weights package | Allow only after WebGPU and model-cache readiness are confirmed; use a 512×512 generation ceiling and disclose that output is locally generated. |
| Edit image | A custom browser ONNX SD-Turbo image-to-image implementation | This is feasible in principle but requires building and validating a pipeline that the candidate package does not provide. Mark unavailable until the complete pipeline is delivered and commercial model rights are confirmed. |
| Photo Shoot | Compose product and model references client-side, then pass the composite into the same local image-to-image pipeline | This needs the edit pipeline plus client-side composition/segmentation; it is not equivalent to two-reference native model conditioning and must not be claimed otherwise. |

> **Decision:** No currently verified option can meet all four STUDIO workflows as unlimited, high-quality, hosted, no-balance generation while also avoiding self-hosting. The safe implementation is either a capability-gated local-first product with staged delivery, or an optional user-funded/limited hosted provider for the two visual workflows that cannot yet run locally.
