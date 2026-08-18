/* STUDIO visual layer: one browser-only Puter contract shared by product, workflow, and batch generation. */

export type PuterImageResult = HTMLImageElement;

export type PuterVisualOptions = {
    model?: string;
    provider?: string;
    inputImages?: string[];
    quality?: string;
    ratio?: { w: number; h: number };
};

type PuterAI = {
    txt2img: (prompt: string, options?: Record<string, unknown>) => Promise<PuterImageResult>;
};

type PuterAuth = {
    isSignedIn?: () => boolean;
    signIn?: () => Promise<unknown>;
};

declare global {
    interface Window {
        puter?: {
            ai?: PuterAI;
            auth?: PuterAuth;
        };
    }
}

export function isPuterReady() {
    return typeof window !== "undefined" && Boolean(window.puter?.ai?.txt2img);
}

export async function ensurePuterSignedIn() {
    if (!window.puter?.auth?.isSignedIn) return;
    if (window.puter.auth.isSignedIn()) return;
    if (!window.puter.auth.signIn) throw new Error("Puter sign-in is required to generate visuals.");
    await window.puter.auth.signIn();
}

export async function generatePuterVisual(prompt: string, options: PuterVisualOptions = {}) {
    if (!isPuterReady()) throw new Error("Puter.js is not loaded. Reload the page and try again.");
    await ensurePuterSignedIn();

    const inputImages = options.inputImages?.filter(Boolean) ?? [];
    const result = await window.puter!.ai!.txt2img(prompt, {
        provider: options.provider ?? "gemini",
        model: options.model ?? "gemini-3.1-flash-image-preview",
        ...(inputImages.length === 1 ? { input_image: inputImages[0] } : {}),
        ...(inputImages.length > 1 ? { input_images: inputImages } : {}),
        quality: options.quality ?? "1K",
        ratio: options.ratio ?? { w: 1, h: 1 },
    });

    if (!result?.src) throw new Error("Puter returned no image output.");
    return result.src;
}
