# GitHub image-generation candidates for STUDIO — 2026-08-19

## Evaluation standard

Each candidate must be assessed for a deployed, authenticated STUDIO workflow: text-to-image, product-plus-model composition, image editing, realistic operating requirements, and a truthful fit with the stated no-self-hosting preference.

## Supplied sources reviewed

| Source | Relevant finding | STUDIO assessment |
| --- | --- | --- |
| [Python image-generator topic](https://github.com/topics/image-generator?l=python&o=desc&s=stars) | The highest-ranked entries are mostly prompt collections, HTML-to-image/PDF tools, image-quote tools, or applications backed by third-party APIs. The listed Gemini image web app explicitly uses Gemini API and credit billing. | No no-key runtime found in the representative list. Reusable UI patterns do not replace the required image model/provider. |
| [Image-Generation-CoT](https://github.com/ziyuguo99/image-generation-cot) | CVPR research code requiring a Python/Conda environment, PyTorch/TorchVision, mmdetection, LLaVA, Hugging Face checkpoints/datasets, and multi-process `torchrun` evaluation. | Research/training code, not an embeddable browser or serverless production image API. It requires an operator-controlled model runtime and substantial GPU resources. |
| [4K image-generator topic](https://github.com/topics/4k-image-generator) | One relevant project is a CLI for image generation through self-hosted OpenAI-compatible endpoints. | Explicitly depends on a self-hosted upstream and therefore conflicts with the project constraint. |
| [imagegeneration topic](https://github.com/topics/imagegeneration) | Representative projects are either Gemini API applications, ComfyUI systems, Replicate-backed UIs, Cloudflare-worker/API examples, or research implementations. | These are integration examples, not a free independent inference service. The closest UI/model pattern is already represented by STUDIO's Gemini provider boundary. |
| [HTML image-generation-AI topic](https://github.com/topics/image-generation-ai?l=html) | The listed projects advertise Pollinations, OpenAI, Cloudflare Workers AI, Hugging Face, Azure, or local neural-cluster integrations. | Topic labels and “free/unlimited” claims do not establish an operator-free inference backend. Individual candidates must be checked against their upstream provider rules. |
| [NanoBananaEditor](https://github.com/markfulton/NanoBananaEditor) | A browser editor with up to two image references and mask-aware editing. Its README requires a Google AI Studio key, calls Gemini directly from the browser, reports provider rate limits, and recommends a backend proxy for production. Its license is AGPL-3.0. | Feature inspiration only. STUDIO already has the safer server-side Gemini boundary; copying AGPL code would impose reciprocal network-source obligations and still would not remove Gemini quotas. |
| [StableCanvas](https://github.com/StableCanvas/StableCanvas) | The repository states it is not fully open source and documents AUTOMATIC1111/WebUI or ComfyUI as its backend. | Not suitable as a library. It requires a separate model-serving backend, violating the no-self-hosting preference. |
| [gbmomo/gemini-image-webapp](https://github.com/gbmomo/gemini-image-webapp) | Flask application built around a Gemini API key, credits, user accounts, storage, and a production server. License is CC BY-NC-SA 4.0. | Not reusable for a commercial STUDIO deployment; it also confirms the same hosted-provider and billing constraints already present in the current architecture. |
| [ZAYUVALYA/IMAGEN](https://github.com/ZAYUVALYA/IMAGEN) | MIT-licensed static page that delegates all generation to Pollinations AI. It makes no model available in the repository. | A frontend wrapper, not an image-generation runtime. It can be reconsidered only if Pollinations’ current service terms, capacity, reference-image support, and reliability satisfy STUDIO requirements; it cannot be described as self-contained or guaranteed unlimited. |
| [farukhetro/Image-Generation](https://github.com/farukhetro/Image-Generation) | Cloudflare Worker wrapper around Workers AI. Its own README requires a Cloudflare account, AI binding, an API key, and notes that free-tier availability/limits can change. | Not a solution to the no-provider/no-limit requirement. It is a repackaging of the Workers AI architecture previously tested in STUDIO, which experienced capacity and safety rejections. |
| [udara885/text-to-image](https://github.com/udara885/text-to-image) | Minimal Hugging Face JavaScript client whose README directs the operator to create a Hugging Face token. | Requires an external account/token; no evidence of multi-image compositing or editing support. |
| [Pollinations official site](https://pollinations.ai/) | The platform states that it handles hosted models/infrastructure and that users sign in and spend from their own wallet. Its current product language refers to Pollen, rewards, spending caps, and app keys. | Pollinations is now a user-wallet / provider-service option rather than an unmetered public inference API. It may fit only if STUDIO accepts per-user authentication and wallet usage; it does not meet the unlimited-free requirement. |

## Interim conclusion

The reviewed GitHub sources are useful as examples of product interfaces, prompts, model orchestration, and research approaches. None is an independent, no-key, no-GPU-hosting production runtime that can be dropped into STUDIO to generate unrestricted visual output. Source code does not include the necessary inference hardware or third-party model service.

The only source that appears initially attractive as a zero-infrastructure frontend wrapper, `ZAYUVALYA/IMAGEN`, delegates to Pollinations. Pollinations’ current official site describes user sign-in and wallet spending rather than an unrestricted anonymous free service, so the repository’s June 2025 “free and unlimited” claim is not an appropriate production assumption.

## Workflow-fit matrix

| Candidate | Generate Visual | Product + Model Photo Shoot | Edit Image | Deployment reality | Decision |
| --- | --- | --- | --- | --- | --- |
| Current STUDIO Gemini adapter | Yes, provider-backed | Yes, supports reference-image composition through the existing server adapter | Yes, provider-backed | Requires a project Gemini key and model access | **Keep as the only current production path.** |
| `ZAYUVALYA/IMAGEN` / Pollinations wrapper | Text-only generation shown | No multi-reference workflow is implemented by the repository | No edit workflow is implemented by the repository | Hosted Pollinations service with current user-wallet/provider terms | Reject as a drop-in replacement. Consider only as a separately approved user-wallet integration. |
| `NanoBananaEditor` | Yes | Up to two references | Yes, including masks | Gemini API key and rate limits; AGPL-3.0 source obligations | Do not copy. Its relevant model capability is already covered more safely by STUDIO’s server-side Gemini adapter. |
| `StableCanvas` | Via external backend | Possible only through configured WebUI/ComfyUI workflows | Yes, via configured backend | Requires a self-hosted AUTOMATIC1111 or ComfyUI server | Reject under the no-self-hosting constraint. |
| `Image-Generation-CoT` | Research evaluation only | Not a packaged application flow | Not documented as a production editing flow | Python/PyTorch/LLaVA/checkpoints and multi-process GPU execution | Reject as research code, not a runtime service. |
| Cloudflare Worker wrapper | Text-to-image shown | Not implemented in supplied wrapper | Not implemented in supplied wrapper | Requires Cloudflare account, Worker, AI binding, API key, changing allowance/capacity | Reject as a replacement; previously unreliable capacity behavior remains relevant. |
| Hugging Face JS sample | Text-to-image only | Not established | Not established | Requires Hugging Face account/token and a supported hosted model | Reject as a complete STUDIO workflow. |

## Decision criteria

An authenticated STUDIO visual action must have a stable image inference service, preserve access control around user assets, accept at least two references for the Photo Shoot flow, return a durable image that can be stored under the user’s account, and expose failure reasons without faking successful output. The reviewed repositories provide interface code, integrations, and research scripts; they do not remove one of these required backend/model-service responsibilities.
