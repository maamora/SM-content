# MAI-Image-2.5 initial evaluation

**Research date:** 14 August 2026

## Official findings

Microsoft documents MAI-Image-2.5 as a **preview** Microsoft Foundry model supporting text-to-image and image-to-image editing. Its model card describes image input for editing workflows, with product, branding, commercial design, photorealistic imagery, and portraits among its stated use cases. [Microsoft model card](https://microsoft.ai/pdf/MAI-Image-2.5-Model-Card.PDF)

The official Foundry edit API accepts a singular `image` multipart field in JPEG or PNG format. Its published request-parameter table lists one `image` input, rather than a product image plus a separate model image. Therefore, the public documentation does **not** establish native two-reference composition support for the STUDIO product-plus-model workflow. [Microsoft Foundry documentation](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/use-foundry-models-mai-image)

MAI-Image-2.5 is not a free unlimited production API. Microsoft requires an Azure subscription with a valid payment method, lists the offering as preview with no SLA recommendation for production workloads, and shows tier-0 free quota as **0 RPM**. Global Standard tier 1 lists MAI-Image-2.5 at 2 RPM. The documented output limit is 1,048,576 total pixels; outputs are PNG.

## Preliminary assessment for STUDIO

MAI-Image-2.5 is a credible **single-image edit** candidate for later provider diversification and may be useful for polishing a generated campaign frame, replacing a product, or changing attributes within a composition. It is not suitable as the only production provider for STUDIO today because it is preview-only, not free/unlimited, and its documented API does not accept separate product and model reference images in a single request.

## Multi-reference alternatives: verified findings

**Qwen-Image-Edit** is the strongest open-weight candidate for the exact requested flow. Qwen explicitly documents multi-image editing and calls out **person + product** as a supported input combination, with optimal results from one to three images. Its official Hugging Face card provides a `QwenImageEditPlusPipeline` example whose `image` parameter is a list of input images, and lists the model under the Apache-2.0 license. The Qwen repository now points to `Qwen-Image-Edit-2511` as its latest image-edit model and includes a multiple-image support example. This makes the family structurally aligned with the STUDIO workflow of uploading a model photo, a product photo, and a scenario prompt. Its practical trade-off is deployment: the 20B model requires compatible GPU infrastructure and ongoing local operations; hosted providers are not inherently free or unlimited. [Qwen release note](https://qwen.ai/blog?id=7a90090115ee193ce6a7f619522771dd9696dd93&from=research.latest-advancements-list) [Official model card](https://huggingface.co/Qwen/Qwen-Image-Edit-2509) [Official repository](https://github.com/QwenLM/Qwen-Image)

**Gemini image models** can accept text plus images, and Google’s current documentation states that Gemini 3 image models support up to 14 reference images. Google describes Gemini 3.1 Flash Image as its general image workhorse for multiple-reference processing and consistency. It is therefore a strong managed-service option for a product photo plus model photo, but not a free/unlimited production choice: Google describes free access as limited, and positions paid access for production applications with higher volumes and advanced features. [Gemini image-generation documentation](https://ai.google.dev/gemini-api/docs/image-generation) [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)

## Recommendation for STUDIO

Use **Qwen-Image-Edit-2511** as STUDIO’s optional self-hosted multi-reference still-image engine. The request contract should pass the product image, model image, and scenario prompt as separate inputs, with optional pose/depth conditioning only when the user explicitly supplies it. This supports the intended photo-shoot composition route without claiming that a hosted provider offers unlimited free generation.

Keep the existing **Higgsfield** integration as the managed creative/video route, because it is already integrated for image and video jobs. MAI-Image-2.5 should not replace either engine: evaluate it later only as an optional Azure-based one-image post-edit provider. A managed-service fallback may use Gemini 3.1 Flash Image, but it must surface the provider cost/limit state rather than be described as free or unlimited.

The integration should be behind a provider configuration flag and an explicit capability response. When Qwen is not running locally, STUDIO must return an unavailable state instructing the operator to start the local image service; it must not silently fall back or fabricate generated output. A self-hosted model removes per-request vendor fees but does not remove hardware, electricity, maintenance, or queue-capacity costs.

## Sources

1. Microsoft Learn, [Deploy and use MAI image models in Microsoft Foundry](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/how-to/use-foundry-models-mai-image), accessed 14 August 2026.
2. Microsoft AI, [MAI-Image-2.5 Model Card](https://microsoft.ai/pdf/MAI-Image-2.5-Model-Card.PDF), dated 2 June 2026.
3. Qwen, [Qwen-Image-Edit-2509: Multi-Image Support, Improved Consistency](https://qwen.ai/blog?id=7a90090115ee193ce6a7f619522771dd9696dd93&from=research.latest-advancements-list), dated 22 September 2025.
4. Google, [Nano Banana image generation](https://ai.google.dev/gemini-api/docs/image-generation), accessed 14 August 2026.
5. Google, [Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing), accessed 14 August 2026.
6. Qwen, [Qwen-Image-Edit-2509 model card](https://huggingface.co/Qwen/Qwen-Image-Edit-2509), accessed 14 August 2026.
7. Qwen, [Qwen-Image repository](https://github.com/QwenLM/Qwen-Image), accessed 14 August 2026.
