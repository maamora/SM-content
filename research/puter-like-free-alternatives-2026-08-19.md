# Puter-like free alternatives for STUDIO — 2026-08-19

## Evaluation standard

A candidate is only "free" for this assessment when it has no mandatory paid account, balance, or API key. This still does not mean it has no deployment or device cost: browser-local candidates require the visitor to download model weights and supply compatible GPU memory, while local server candidates require the application owner to run the model runtime.

## Verified browser-local candidates

### web-txt2img

`lacerbi/web-txt2img` is an MIT-licensed TypeScript library created in 2025 that runs text-to-image models in-browser through WebGPU. Its documented models are SD-Turbo and Janus-Pro-1B. SD-Turbo is exposed as **text-to-image only**, operates at 512×512, and the documentation calls its WASM fallback experimental and not recommended for production. The library is worker-first, exposes model-download and generation progress plus abort support, and caches artifacts locally. It requires a modern WebGPU browser; it does not document multi-reference product-plus-model composition, image-to-image editing, inpainting, or a post-generation backend API.

Source: https://github.com/lacerbi/web-txt2img

### MLC Web Stable Diffusion

`mlc-ai/web-stable-diffusion` is Apache-2.0 and confirms browser-only Stable Diffusion inference. The repository documents a Python/TVM model-build process and its public demo describes itself as research-only. Its site states it was tested on Apple Silicon Chrome Canary and did not work on Windows at the time of that guidance. The source describes model preparation and WebGPU deployment as a toolchain requiring Python, Emscripten, Rust, wasm-pack, and custom model compilation. It is therefore not a maintained plug-in for a cross-platform production STUDIO path.

Sources: https://github.com/mlc-ai/web-stable-diffusion and https://websd.mlc.ai/

### ONNX Runtime Web

Microsoft’s `onnxruntime-web` supports in-browser ONNX inference on WebGPU, WebGL, WebNN, and WASM. It is an inference runtime rather than an image-generator product: STUDIO would still need an appropriate exported model plus browser preprocessing/postprocessing. Microsoft notes that client inference requires models small enough to run efficiently on client hardware and that only a subset of operators is supported by GPU/browser execution providers.

Source: https://onnxruntime.ai/docs/tutorials/web/

## Preliminary conclusion

`web-txt2img` is the strongest current **Puter-like visual library** because it is browser-only, offers an installable TypeScript API, progress, abort support, and no provider balance. However, it offers only lower-fidelity 512×512 text-to-image today. It cannot honestly replace STUDIO’s requested Photo Shoot (product + model composition) or Edit Image workflows. WebLLM remains the appropriate browser-local caption component, with model-download and WebGPU requirements.

## Verified downloaded-platform alternatives

### ComfyUI

ComfyUI is an actively maintained GPL-3.0 local creation engine with a local API and workflow support for open image models, reference conditioning, compositing, inpainting, outpainting, and current image-editing models. Its README lists Qwen Image and Qwen Image Edit among its supported image-generation/editing workflows. It can run fully offline if optional API nodes are disabled.

It is **not** a browser library or a hosted-free replacement. ComfyUI requires the application owner or end user to download a desktop/portable/manual install, model weights, and run its local server/API. This makes it a strong implementation for an accepted local/self-hosted deployment, but disqualifies it under STUDIO’s current no-self-hosting choice. Its GPL-3.0 license also requires a separate distribution/compliance assessment before embedding it into STUDIO.

Source: https://github.com/comfy-org/ComfyUI

### InvokeAI

InvokeAI is an actively maintained Apache-2.0 local image platform that supports SD, Flux, Qwen Image, and Qwen Image Edit; it includes image refinement, canvas/inpainting workflows, and download/install guidance. Its own documentation states that it runs a **locally hosted web server and React UI**. It is consequently not a drop-in external API for STUDIO and still requires compatible hardware, downloaded weights, and a user-run service.

Source: https://github.com/invoke-ai/InvokeAI

### Pollinations

Pollinations’ current documentation declares authentication required, provides `pk_`/`sk_` API keys, and describes a BYOP flow that authorizes use of user Pollen balances. It is therefore not a zero-key, zero-balance alternative to Puter.

Source: https://gen.pollinations.ai/docs

## Updated conclusion

There is no free cloud-equivalent library that provides STUDIO’s complete visual workflow without either a balance/key or local inference runtime. The realistic choices are:

1. **Browser-local partial route:** `web-txt2img` for supported-device 512×512 text-to-image plus WebLLM for captions. No account or backend inference, but no credible Photo Shoot/Edit support.
2. **Local full-workflow route:** ComfyUI plus Qwen Image/Edit and a local caption runtime. No provider balance, but explicitly self-hosted and GPU-dependent.
3. **Hosted full-workflow route:** Gemini/Groq or another API provider. Simplest technical implementation, but quota/key/billing dependent.

## Sources

1. https://github.com/lacerbi/web-txt2img
2. https://github.com/mlc-ai/web-stable-diffusion
3. https://websd.mlc.ai/
4. https://onnxruntime.ai/docs/tutorials/web/
