"use client";

/* STUDIO editorial refresh: optional browser-side AI lab with the same graphite, paper, and lime signal language. */
import { useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, ImagePlus, Loader2, LockKeyhole, Sparkles } from "lucide-react";

interface ProductVisualProduct {
    name: string;
    imageUrl: string | null;
}

type PuterImage = HTMLImageElement;

type PuterAI = {
    txt2img: (prompt: string, options?: Record<string, unknown>) => Promise<PuterImage>;
};

declare global {
    interface Window {
        puter?: {
            ai?: PuterAI;
            auth?: {
                isSignedIn?: () => boolean;
                signIn?: () => Promise<unknown>;
            };
        };
    }
}

interface PuterProductVisualLabProps {
    product: ProductVisualProduct | undefined;
}

export function PuterProductVisualLab({ product }: PuterProductVisualLabProps) {
    const [prompt, setPrompt] = useState(
        "Create a premium editorial product visual. Preserve the exact product shape, label, material, and colors. Place it on a warm graphite studio set with soft directional light, subtle shadow, and high-end campaign art direction."
    );
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [status, setStatus] = useState<"idle" | "sign-in" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState<string | null>(null);

    const canGenerate = useMemo(() => Boolean(product?.imageUrl && prompt.trim()), [product?.imageUrl, prompt]);

    const handleGenerate = async () => {
        if (!product?.imageUrl || !prompt.trim()) {
            setStatus("error");
            setMessage("Sélectionnez un produit approuvé avec une image avant de lancer le test.");
            return;
        }

        if (!window.puter?.ai?.txt2img) {
            setStatus("error");
            setMessage("Le laboratoire Puter.js n’est pas chargé. Rechargez la page puis réessayez.");
            return;
        }

        try {
            setMessage(null);
            if (window.puter.auth?.isSignedIn && !window.puter.auth.isSignedIn()) {
                setStatus("sign-in");
                if (window.puter.auth.signIn) await window.puter.auth.signIn();
            }

            setStatus("loading");
            const image = await window.puter.ai.txt2img(prompt.trim(), {
                provider: "gemini",
                model: "gemini-3.1-flash-image-preview",
                input_image: product.imageUrl,
                quality: "1K",
                ratio: { w: 1, h: 1 },
            });
            setImageSrc(image.src);
            setStatus("success");
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Puter n’a pas pu générer ce visuel.");
        }
    };

    return (
        <section className="studio-puter-lab" aria-labelledby="puter-lab-title">
            <div className="studio-puter-lab__head">
                <div>
                    <p className="studio-eyebrow">OPTIONAL BROWSER EXPERIMENT / PUTER.JS</p>
                    <h3 id="puter-lab-title" className="studio-puter-lab__title">
                        Product visual lab
                    </h3>
                    <p className="studio-puter-lab__lede">
                        Testez une variation produit directement dans le navigateur. Ce laboratoire ne remplace pas le rendu Studio serveur.
                    </p>
                </div>
                <span className="studio-puter-lab__badge"><Sparkles className="h-3 w-3" /> EXPERIMENTAL</span>
            </div>

            <div className="studio-puter-lab__grid">
                <div className="studio-puter-lab__source">
                    <div className="studio-puter-lab__label"><ImagePlus className="h-3.5 w-3.5" /> SOURCE / {product?.name ?? "NO PRODUCT"}</div>
                    {product?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrl} alt={`Source produit ${product.name}`} className="studio-puter-lab__source-image" />
                    ) : (
                        <div className="studio-puter-lab__empty">Aucune image produit approuvée.</div>
                    )}
                </div>

                <div className="studio-puter-lab__controls">
                    <label className="studio-puter-lab__label" htmlFor="puter-product-prompt">DIRECTION / PROMPT</label>
                    <textarea
                        id="puter-product-prompt"
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        className="studio-puter-lab__textarea"
                        rows={7}
                    />
                    <button type="button" onClick={handleGenerate} disabled={!canGenerate || status === "loading" || status === "sign-in"} className="studio-button studio-button--lime w-full disabled:cursor-not-allowed disabled:opacity-50">
                        {status === "loading" || status === "sign-in" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                        {status === "sign-in" ? "Connexion Puter..." : status === "loading" ? "Génération en cours..." : "Tester le visuel produit"}
                    </button>
                    <p className="studio-puter-lab__note"><LockKeyhole className="h-3 w-3" /> Puter peut demander une connexion utilisateur et applique ses propres quotas.</p>
                    {message && <p className="studio-puter-lab__message studio-puter-lab__message--error">{message}</p>}
                </div>

                <div className="studio-puter-lab__result">
                    <div className="studio-puter-lab__label">OUTPUT / PUTER IMAGE</div>
                    {imageSrc ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageSrc} alt="Variation produit générée par Puter" className="studio-puter-lab__result-image" />
                            <div className="studio-puter-lab__success"><CheckCircle2 className="h-3.5 w-3.5" /> Résultat disponible dans le navigateur <ArrowUpRight className="ml-auto h-3.5 w-3.5" /></div>
                        </>
                    ) : (
                        <div className="studio-puter-lab__empty">Votre variation générée apparaîtra ici.</div>
                    )}
                </div>
            </div>
        </section>
    );
}
