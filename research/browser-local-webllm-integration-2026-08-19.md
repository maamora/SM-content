# Browser-local caption integration record — 2026-08-19

## Verified source

WebLLM 0.2.84 is an Apache-2.0 browser-local language-model engine. Its official documentation states that inference runs in the browser without server support and uses WebGPU acceleration. Models are supplied through the project’s prebuilt model list, downloaded asynchronously on their first load, and loaded with `CreateMLCEngine` or `MLCEngine.reload`. The runtime exposes OpenAI-style chat completions and model-load progress through `initProgressCallback`.

The model cache is browser-owned. The documented default cache backend is the Cache API, with IndexedDB and OPFS as available alternatives. Thus, STUDIO must treat the initial download, local storage use, and compatible WebGPU browser/device as user-visible requirements rather than hiding them behind a server capability claim.

## STUDIO implementation decision

Use a dynamic client-only import of `@mlc-ai/web-llm`, verify `navigator.gpu` before any loading, expose progress text from `initProgressCallback`, and keep generated captions in client-side editor state. Do not send a browser-local model or a caption prompt to STUDIO’s backend. The user must be able to use the existing manual caption editor if WebGPU is unavailable or model initialization fails.

## Sources

1. https://webllm.mlc.ai/docs/user/basic_usage.html
2. https://github.com/mlc-ai/web-llm
