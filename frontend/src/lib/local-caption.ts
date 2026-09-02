/* STUDIO editorial system: quiet, human-review-first assistance that stays out of the visual canvas. */

export type LocalCaptionLanguage = "fr" | "ar" | "darija" | "en";

type LocalCaptionRequest = {
    productName: string;
    productDescription?: string | null;
    offer?: string;
    badge?: string;
    language: LocalCaptionLanguage;
    onProgress?: (progress: number, detail: string) => void;
};

const LOCAL_CAPTION_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

let enginePromise: Promise<import("@mlc-ai/web-llm").MLCEngine> | null = null;

function languageInstruction(language: LocalCaptionLanguage) {
    switch (language) {
        case "fr":
            return "French";
        case "ar":
            return "Modern Standard Arabic";
        case "darija":
            return "Moroccan Darija written in Latin characters";
        default:
            return "English";
    }
}

async function getLocalCaptionEngine(onProgress?: LocalCaptionRequest["onProgress"]) {
    if (typeof window === "undefined" || !("gpu" in navigator)) {
        throw new Error("La génération locale nécessite un navigateur récent compatible WebGPU, comme Chrome ou Edge.");
    }

    if (!enginePromise) {
        enginePromise = import("@mlc-ai/web-llm").then(({ CreateMLCEngine }) =>
            CreateMLCEngine(LOCAL_CAPTION_MODEL, {
                initProgressCallback: (report) => {
                    onProgress?.(Math.round(report.progress * 100), report.text || "Préparation de la génération locale…");
                },
            })
        );
    }

    return enginePromise;
}

export async function generateLocalCaption({
    productName,
    productDescription,
    offer,
    badge,
    language,
    onProgress,
}: LocalCaptionRequest) {
    onProgress?.(0, "Chargement du modèle de rédaction sur cet appareil…");
    const engine = await getLocalCaptionEngine(onProgress);
    onProgress?.(100, "Rédaction de la légende…");

    const response = await engine.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a restrained social copywriter for a premium design studio. Write one concise social caption only. Do not add a title, labels, explanations, quotation marks, or emojis. Mention the product naturally, keep the tone specific and editorial, and end with two to four relevant hashtags.",
            },
            {
                role: "user",
                content: [
                    `Write the caption in ${languageInstruction(language)}.`,
                    `Product: ${productName}.`,
                    productDescription ? `Product description: ${productDescription}.` : "",
                    offer ? `Campaign message: ${offer}.` : "",
                    badge ? `Offer badge: ${badge}.` : "",
                ].filter(Boolean).join("\n"),
            },
        ],
        temperature: 0.7,
        max_tokens: 160,
    });

    const caption = response.choices[0]?.message?.content?.trim();
    if (!caption) {
        throw new Error("La génération locale n’a pas renvoyé de légende. Réessayez dans quelques instants.");
    }

    return caption.replace(/^(caption|légende)\s*:\s*/i, "");
}
