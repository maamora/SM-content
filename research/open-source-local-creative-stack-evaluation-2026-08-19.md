# Open-source local creative stack evaluation — 2026-08-19

## Scope

This note evaluates no-paid-API candidates for STUDIO text-to-image, image editing, product-plus-model composition, and caption generation. A solution is only considered fully local when model inference runs on hardware controlled by the application operator or end user. Public demos, hosted APIs, and account-limited free tiers are excluded from that classification.

## Verified visual-generation candidates

| Candidate | Verified capabilities | License / operating model | STUDIO relevance |
|---|---|---|---|
| [Hugging Face Diffusers](https://github.com/huggingface/diffusers) | Modular PyTorch inference library with text-to-image, image-to-image, ControlNet, InstructPix2Pix, inpainting, variation, and upscaling pipelines. The official img2img guide takes a prompt plus an initial image. | Apache-2.0 library; models are separate downloads with separate licenses. Requires a Python/PyTorch inference runtime and model weights. | A robust open-source implementation foundation, but cannot execute inside a pure Java Spring Boot process without a separate runtime/service or an equivalent native/JVM model backend. |
| [ComfyUI](https://github.com/comfy-org/ComfyUI) | Local graph-based engine with an API, model workflows, offline execution, reference conditioning, masks, compositing, inpainting, and queues. Supports text-to-image and several image-editing model families. | GPL-3.0; runs as a local Python process / server and needs downloaded models plus user hardware. | Covers STUDIO’s workflows most broadly, but is self-hosting and cannot be embedded in an autoscaled Java backend without operating an additional local/persistent service. |
| [Qwen-Image](https://github.com/QwenLM/Qwen-Image) / Qwen-Image-Edit | Official repo documents text-to-image and an editing pipeline that accepts a list of images. The base model is a 20B MMDiT; the edit release is intended for multiple image inputs and consistency. | Apache-2.0 repository/model project; official quick start uses Python Diffusers and explicitly moves pipelines to CUDA. | Strongest single open model candidate for product-plus-model composition and editing, but model size and CUDA-based local inference rule it out for a Java-only, no-GPU, no-self-hosting deployment. |

## Evidence excerpts

> “Diffusers is the go-to library for state-of-the-art pretrained diffusion models ... designed with a focus on usability ... and customizability.” — [Diffusers README](https://github.com/huggingface/diffusers)

> “ComfyUI ... integrates seamlessly into production pipelines with our API endpoints” and “runs fully offline” when optional paid API nodes are disabled. — [ComfyUI README](https://github.com/comfy-org/ComfyUI)

> “Qwen-Image is a 20B MMDiT image foundation model” and its Qwen-Image-Edit example uses a `QwenImageEditPlusPipeline` with `image: [image1]` and `.to('cuda')`. — [Qwen-Image README](https://github.com/QwenLM/Qwen-Image)

## Initial conclusion

The open-source ecosystem can cover every requested visual workflow, but it does so through local GPU inference. The code and weights may be no-cost, yet they require either (1) an end user’s compatible machine to run the model, or (2) an operator-managed GPU runtime such as ComfyUI/Diffusers. Neither is equivalent to “no API or configuration” inside the existing Java/Spring Boot web deployment.

## Verified local-caption candidates

| Candidate | Verified capabilities | Operating boundary | STUDIO relevance |
|---|---|---|---|
| [Ollama](https://github.com/ollama/ollama) | Local open-model runner with a REST API. Its official documentation serves the API at `http://localhost:11434/api` after installation. | Requires installing Ollama and downloading a model; a local process must remain available. | Compatible with STUDIO’s existing optional local caption path, but contradicts the request for no setup/configuration and becomes a local service dependency. |
| [llama.cpp](https://github.com/ggml-org/llama.cpp) | MIT-licensed C/C++ inference runtime with quantization, wide hardware backends, and an OpenAI-compatible `llama serve` HTTP server. | Requires a native binary, a downloaded GGUF model, and an active local process (or process orchestration). | Viable as a user-run local caption backend, but not embeddable in Java without distributing and supervising a native process. |
| [WebLLM](https://github.com/mlc-ai/web-llm) | Apache-2.0 browser LLM runtime. Runs entirely in-browser through WebGPU, with no server support and OpenAI-style completion API. | Requires WebGPU and first-run model download/cache; capability and performance vary by device/browser. | The only caption-only option that avoids an API key and a backend service, but cannot generate or edit images and must offer device-unsupported states. |

> “Everything runs inside the browser with no server support and is accelerated with WebGPU.” — [WebLLM README](https://github.com/mlc-ai/web-llm)

> Ollama’s official API documentation states that its local API is served at `http://localhost:11434/api` after installation. — [Ollama API introduction](https://docs.ollama.com/api/introduction)

> llama.cpp’s quick start launches an OpenAI-compatible API server with `llama serve`, and its supported backends include CPU, CUDA, Metal, Vulkan, WebGPU and others. — [llama.cpp README](https://github.com/ggml-org/llama.cpp)

## JVM-native visual-inference candidates

| Candidate | Verified capabilities | Blocking production boundary | Suitability for STUDIO |
|---|---|---|---|
| [Oracle SD4J](https://github.com/oracle/sd4j) | Java + ONNX Runtime Stable Diffusion pipeline supporting text-to-image with SD 1.5, SD 2, and SDXL-style ONNX models. | Its own README explicitly says it is a code sample with unstable APIs; it does **not** implement image-to-image, upscaling, or inpainting. It requires separately downloaded ONNX weights and reports roughly five seconds per diffusion step on a 2019 6-core CPU. | Could support low-quality local text-to-image only. It cannot meet STUDIO Photo Shoot or Edit Image requirements. |
| [DJL Stable Diffusion example](https://docs.djl.ai/master/examples/docs/stable_diffusion.html) | Basic Java reimplementation using PyTorch engine and Stable Diffusion components. | The official guide recommends GPU because CPU generation is slow; model conversion uses Python/PyTorch and the example is limited rather than a complete compositional editing product. | Technically embeddable but inappropriate for an autoscaled production backend and insufficient for robust photo/edit workflows. |
| [ONNX Runtime Java](https://onnxruntime.ai/docs/get-started/with-java.html) | Java bindings for executing exported ONNX models, CPU and CUDA distributions on Maven Central. | A runtime only: STUDIO would still need exported weights, a diffusion scheduler/pipeline, storage, memory controls, and suitable GPU or very slow CPU execution. | Foundation technology, not an application-level image-generation solution. |

> SD4J says it is “intended to be a demonstration,” that APIs should not be considered stable, and that it “doesn't currently implement img2img, upscaling or inpainting.” — [SD4J README](https://github.com/oracle/sd4j)

> DJL’s Stable Diffusion example says: “We recommend running the model on GPU devices because CPU generation is slow.” — [DJL Stable Diffusion guide](https://docs.djl.ai/master/examples/docs/stable_diffusion.html)

> ONNX Runtime’s Java artifacts provide CPU support for Windows/Linux/macOS x64 and a separate CUDA GPU artifact, but application code must load a local model into an `OrtSession`. — [ONNX Runtime Java guide](https://onnxruntime.ai/docs/get-started/with-java.html)

## Open-weight editing and composition candidates

| Candidate | Verified capability | Deployment / license boundary | Assessment for STUDIO |
|---|---|---|---|
| [Qwen-Image / Qwen-Image-Edit](https://github.com/QwenLM/Qwen-Image) | Apache-2.0 project; Qwen-Image is a 20B MMDiT model, and Qwen-Image-Edit-2511 provides multi-image editing through `QwenImageEditPlusPipeline`. | The official quick start is Python, PyTorch, Diffusers, and CUDA; its own example sends a list of images into a CUDA pipeline. Model weights need downloading and resident GPU memory. | Strongest open candidate in terms of image editing and multi-reference product-plus-model composition, but it must be self-hosted on a GPU machine or consume a hosted API. It cannot run inside the current managed Java deployment without such infrastructure. |
| [HunyuanImage-3.0-Instruct](https://github.com/Tencent-Hunyuan/HunyuanImage-3.0) | Supports image-to-image editing and multi-image fusion; the documented example passes two local images to `generate_image`. Distilled version recommends eight steps. | 80B total-parameter MoE (13B activated); required local environment is Python 3.12+, PyTorch CUDA 12.8, model download, and optional compiled GPU kernels. | Has the closest technical match for Product + Model → AI Shoot, but requires an extremely capable self-hosted GPU system, not a no-configuration backend. |
| [FLUX.1 Kontext dev](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev) | 12B open-weight model for instruction-based image editing and reference consistency, with official Diffusers usage. | Its files require agreeing to share contact information and its model card is under a **non-commercial license**; the official reference setup uses Python/Diffusers/CUDA, and commercial use requires licensing/reporting. | Not legally appropriate as a free production STUDIO image-edit provider. |

> Qwen’s official repository calls Qwen-Image a “20B MMDiT image foundation model,” and its Edit-2511 example runs `QwenImageEditPlusPipeline` on `cuda` with a list of input images. — [Qwen-Image README](https://github.com/QwenLM/Qwen-Image)

> HunyuanImage-3.0 describes itself as an 80B-parameter MoE model with 13B activated parameters; its official setup requires Python 3.12+, CUDA 12.8, PyTorch, model download, and for multi-image editing accepts an image list. — [HunyuanImage-3.0 README](https://github.com/Tencent-Hunyuan/HunyuanImage-3.0)

> FLUX.1 Kontext dev is tagged `flux-1-dev-non-commercial-license` and the card says access requires agreeing to share contact information; its official local example uses Diffusers on CUDA. — [FLUX.1 Kontext dev model card](https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev)

## Concrete local-serving boundary

The maintained [vLLM-Omni Qwen-Image recipe](https://docs.vllm.ai/projects/recipes/en/stable/Qwen/Qwen-Image.html) provides a practical local stack: clone and install `vllm-omni`, then invoke Python image-generation or image-edit scripts with a downloaded `Qwen/Qwen-Image*` model. The recipe documents multi-image editing specifically for `Qwen/Qwen-Image-Edit-2509` and `Qwen/Qwen-Image-Edit-2511`, passing multiple PNG/JPG source images on the command line. It also exposes CPU and layerwise offload options for out-of-memory conditions; those options make the model **slower**, not configuration-free.

The Qwen Image Edit community hardware discussion is not a formal support guarantee, but it provides useful empirical context: contributors report 17+ GB VRAM after 4-bit quantization and CPU offloading, with about 36 seconds on an RTX 3090 for an eight-step sample; other reported paths use 22–24 GB. STUDIO should not use those community numbers as a supported minimum. It should set a conservative local-GPU prerequisite and make the local provider unavailable otherwise. [Qwen Image Edit hardware discussion](https://huggingface.co/Qwen/Qwen-Image-Edit/discussions/6)

> vLLM-Omni’s official recipe states that `Qwen-Image-Edit-2509` and later accept multiple input image paths, while the feature matrix distinguishes text-to-image, single-image editing, and multiple-image editing models. — [vLLM Qwen-Image recipe](https://docs.vllm.ai/projects/recipes/en/stable/Qwen/Qwen-Image.html)

This confirms the central constraint: the best compatible free-open-weight option is a **locally hosted GPU inference service**—typically Python + CUDA + downloaded weights—that Spring Boot would call over HTTP or process invocation. It does not need a third-party API key, but it is still a self-hosted runtime with large model files, drivers, and an always-available GPU for production use.

## Sources

1. https://github.com/huggingface/diffusers
2. https://huggingface.co/docs/diffusers/en/using-diffusers/img2img
3. https://github.com/comfy-org/ComfyUI
4. https://github.com/QwenLM/Qwen-Image
5. https://github.com/ollama/ollama
6. https://docs.ollama.com/api/introduction
7. https://github.com/ggml-org/llama.cpp
8. https://github.com/mlc-ai/web-llm
9. https://github.com/oracle/sd4j
10. https://docs.djl.ai/master/examples/docs/stable_diffusion.html
11. https://onnxruntime.ai/docs/get-started/with-java.html
12. https://github.com/deepjavalibrary/djl
13. https://github.com/QwenLM/Qwen-Image
14. https://github.com/Tencent-Hunyuan/HunyuanImage-3.0
15. https://github.com/black-forest-labs/flux
16. https://huggingface.co/black-forest-labs/FLUX.1-Kontext-dev
17. https://docs.vllm.ai/projects/recipes/en/stable/Qwen/Qwen-Image.html
18. https://huggingface.co/Qwen/Qwen-Image-Edit/discussions/6
