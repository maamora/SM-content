/* STUDIO visual layer: browser-local language assistance for captions and creative direction. */

import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm";

export const DEFAULT_WEBLLM_MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

let enginePromise: Promise<MLCEngine> | null = null;

function browserSupportsWebGPU() {
    return typeof navigator !== "undefined" && "gpu" in navigator;
}

export function isWebLLMAvailable() {
    return typeof window !== "undefined" && browserSupportsWebGPU();
}

export async function loadWebLLM(
    model = DEFAULT_WEBLLM_MODEL,
    onProgress?: (progress: number, text: string) => void,
) {
    if (typeof window === "undefined") throw new Error("Browser-local language assistance is only available in the Studio browser.");
    if (!browserSupportsWebGPU()) throw new Error("WebGPU is unavailable in this browser. Use a recent Chrome or Edge browser, or keep server captions enabled.");

    if (!enginePromise) {
        enginePromise = CreateMLCEngine(model, {
            initProgressCallback: (report) => onProgress?.(report.progress, report.text),
        }).catch((error) => {
            enginePromise = null;
            throw error;
        });
    }

    return enginePromise;
}

export async function generateLocalText(
    prompt: string,
    options?: {
        system?: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
        onProgress?: (progress: number, text: string) => void;
    },
) {
    const engine = await loadWebLLM(options?.model, options?.onProgress);
    const response = await engine.chat.completions.create({
        messages: [
            {
                role: "system",
                content: options?.system ?? "You are STUDIO, a concise creative assistant for premium brand content.",
            },
            { role: "user", content: prompt },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 320,
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") throw new Error("WebLLM returned no text output.");
    return content.trim();
}

export async function generateLocalCaption(
    productName: string,
    productDescription: string,
    language: string,
    visualDirection: string,
) {
    return generateLocalText(
        `Write one polished social caption in ${language} for this product: ${productName}. Product description: ${productDescription || "not provided"}. Visual direction: ${visualDirection || "premium editorial product visual"}. Keep it concise, natural, campaign-ready, and do not invent claims, prices, reviews, or product facts. Return only the caption.`,
        { maxTokens: 180, temperature: 0.8 },
    );
}

export async function generateLocalCreativeDirection(
    productName: string,
    productDescription: string,
    intent: string,
) {
    return generateLocalText(
        `Create a concise visual direction for ${productName}. Product description: ${productDescription || "not provided"}. Creative intent: ${intent}. Include subject, setting, lighting, composition, material fidelity, and mood in one paragraph. Preserve the real product identity and avoid invented claims.`,
        { maxTokens: 220, temperature: 0.75 },
    );
}
