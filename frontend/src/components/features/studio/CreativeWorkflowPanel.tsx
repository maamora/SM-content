"use client";

/* STUDIO editorial workflow: one quiet visual desk for image edits and photo-shoot frames, with honest capability states. */
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { ImagePlus, Loader2, Sparkles, Upload, WandSparkles } from "lucide-react";
import { createCreativeJob, getCreativeJob, uploadCreativeReference } from "@/lib/api/creative";

type CreativeWorkflowPanelProps = {
    compact?: boolean;
    imageGenerationAvailable?: boolean;
};

type CreativeType = "PHOTO_SHOOT" | "EDIT_IMAGE";

const PROMPTS = {
    EDIT_IMAGE: "Keep the product exactly recognizable. Change the background to a warm daylight studio with soft editorial shadows and a quiet cream palette. Preserve the packaging, label, materials, and colors.",
    PHOTO_SHOOT: "Create a premium campaign frame with the model and product in the same scene. Keep the product clearly visible and recognizable, preserve the model's identity, use a muted olive set, directional daylight, realistic editorial texture, and a refined commercial finish.",
};

function ReferenceTile({
    label,
    file,
    url,
    onChange,
}: {
    label: string;
    file: File | null;
    url: string | null;
    onChange: (file: File) => void;
}) {
    return (
        <label className="creative-reference-tile">
            <span className="creative-reference-tile__label">{label}</span>
            {url ? <img src={url} alt={`${label} reference`} /> : <span className="creative-reference-tile__empty"><Upload size={17} /> Drop an image</span>}
            {file && <span className="creative-reference-tile__file">{file.name}</span>}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
                const next = event.target.files?.[0];
                if (next) onChange(next);
            }} />
        </label>
    );
}

export function CreativeWorkflowPanel({ compact = false, imageGenerationAvailable = true }: CreativeWorkflowPanelProps) {
    const [type, setType] = useState<CreativeType>("PHOTO_SHOOT");
    const [prompt, setPrompt] = useState(PROMPTS.PHOTO_SHOOT);
    const [productFile, setProductFile] = useState<File | null>(null);
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [productUrl, setProductUrl] = useState<string | null>(null);
    const [modelUrl, setModelUrl] = useState<string | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isPhotoShoot = type === "PHOTO_SHOOT";
    const hasRequiredReferences = Boolean(isPhotoShoot ? productFile && modelFile : productFile);
    const activeImageUrl = resultImageUrl ?? productUrl ?? null;
    const statusLabel = useMemo(() => {
        if (resultImageUrl) return isPhotoShoot ? "Photo shoot ready" : "Edit ready";
        return isPhotoShoot ? "Ready for a photo shoot direction" : "Ready for an image edit";
    }, [isPhotoShoot, resultImageUrl]);

    async function waitForCreativeJob(jobId: string) {
        for (let attempt = 0; attempt < 72; attempt += 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 2500));
            const job = await getCreativeJob(jobId);
            if (job.status === "COMPLETED") {
                if (!job.resultImageUrl) throw new Error("Gemini completed without an image result.");
                return job.resultImageUrl;
            }
            if (job.status === "FAILED") throw new Error(job.errorMessage || "Gemini could not generate this visual.");
        }
        throw new Error("Visual generation timed out. Please try again.");
    }

    async function handleGenerate() {
        if (!imageGenerationAvailable) {
            setError("La génération d’images n’est pas configurée. Ajoutez une clé Gemini valide au backend pour activer les photo shoots et les retouches.");
            return;
        }
        if (!hasRequiredReferences) {
            setError(isPhotoShoot ? "Add both a product image and a model image." : "Add a product image to edit.");
            return;
        }
        setBusy(true);
        setError(null);
        setResultImageUrl(null);
        try {
            const product = await uploadCreativeReference(productFile!);
            const model = isPhotoShoot && modelFile ? await uploadCreativeReference(modelFile) : null;
            const job = await createCreativeJob({
                type,
                prompt: prompt.trim(),
                aspectRatio: isPhotoShoot ? "16:9" : "1:1",
                productImageUrl: product.url,
                modelImageUrl: model?.url,
            });
            setResultImageUrl(await waitForCreativeJob(job.id));
        } catch (generateError) {
            setError(generateError instanceof Error ? generateError.message : "Visual generation failed.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className={`creative-workflow ${compact ? "creative-workflow--compact" : ""}`}>
            <div className="creative-workflow__head">
                <div>
                    <p className="studio-kicker studio-kicker--dark"><span className="studio-pulse" /> CREATIVE WORKFLOW / 02</p>
                    <h2>Give the image<br /><em>another life.</em></h2>
                    <p>Bring a product and a model into the same frame, then steer the shoot with a sentence.</p>
                </div>
                <span className="creative-workflow__status"><span className="studio-dot studio-dot--lime" /> {statusLabel}</span>
            </div>

            <div className="creative-workflow__modebar">
                <button type="button" className={type === "PHOTO_SHOOT" ? "is-active" : ""} onClick={() => { setType("PHOTO_SHOOT"); setPrompt(PROMPTS.PHOTO_SHOOT); setResultImageUrl(null); setError(null); }}><WandSparkles size={15} /> Photo shoot</button>
                <button type="button" className={type === "EDIT_IMAGE" ? "is-active" : ""} onClick={() => { setType("EDIT_IMAGE"); setPrompt(PROMPTS.EDIT_IMAGE); setResultImageUrl(null); setError(null); }}><ImagePlus size={15} /> Edit an image</button>
            </div>

            <div className="creative-workflow__grid">
                <div className="creative-workflow__inputs">
                    <div className="creative-workflow__references">
                        <ReferenceTile label="01 / PRODUCT" file={productFile} url={productUrl} onChange={(file) => { setProductFile(file); setProductUrl(URL.createObjectURL(file)); setResultImageUrl(null); }} />
                        {isPhotoShoot && <ReferenceTile label="02 / MODEL" file={modelFile} url={modelUrl} onChange={(file) => { setModelFile(file); setModelUrl(URL.createObjectURL(file)); setResultImageUrl(null); }} />}
                    </div>
                    <label className="creative-workflow__prompt">
                        <span>SCENARIO / PROMPT</span>
                        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} placeholder="Describe the scene, motion, lighting, and what must stay true..." />
                    </label>
                    <div className="creative-workflow__actions">
                        <button type="button" className="studio-button studio-button--dark" onClick={handleGenerate} disabled={busy || !imageGenerationAvailable}>
                            {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {busy ? "Generating visual..." : !imageGenerationAvailable ? "Visual generation unavailable" : isPhotoShoot ? "Generate photo shoot" : "Apply image edit"}
                        </button>
                        <span>{imageGenerationAvailable ? "Image output is ready when you are." : "Configure image generation to activate this workflow."}</span>
                    </div>
                    {error && <p className="studio-form-error">{error}</p>}
                </div>

                <div className="creative-workflow__result">
                    {activeImageUrl ? (
                        <img src={activeImageUrl} alt="Generated creative result" className="creative-workflow__media" />
                    ) : (
                        <div className="creative-workflow__empty"><Sparkles size={24} /><span>Your result lands here.</span><small>Reference → direction → visual</small></div>
                    )}
                    {resultImageUrl && <div className="creative-workflow__result-meta"><span><span className="studio-dot studio-dot--lime" /> VISUAL READY</span><span>{isPhotoShoot ? "Photo shoot frame" : "Edited image"}</span></div>}
                </div>
            </div>
        </section>
    );
}
