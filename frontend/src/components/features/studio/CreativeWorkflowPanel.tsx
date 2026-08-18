/* STUDIO creative workflow: graphite workbench, signal lime actions, and media-first states. */
"use client";

/* Dynamic Cloudinary or local-storage URLs are intentionally rendered as raw media in this authenticated workflow. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { Film, ImagePlus, Loader2, Sparkles, Upload, WandSparkles } from "lucide-react";
import {
    createCreativeJob,
    getCreativeJob,
    uploadCreativeReference,
    type CreativeJob,
    type CreativeJobType,
} from "@/lib/api/creative";

type CreativeWorkflowPanelProps = {
    compact?: boolean;
};

type CreativeEngine = "puter" | "server";

declare global {
    interface Window {
        puter?: {
            ai?: {
                txt2img: (prompt: string, options?: Record<string, unknown>) => Promise<HTMLImageElement>;
            };
            auth?: {
                isSignedIn?: () => boolean;
                signIn?: () => Promise<unknown>;
            };
        };
    }
}

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the reference image."));
        reader.readAsDataURL(file);
    });
}

const PROMPTS = {
    EDIT_IMAGE: "Keep the product exactly recognizable. Change the background to a warm daylight studio with soft editorial shadows and a quiet cream palette.",
    PHOTO_SHOOT: "Create a running campaign frame with the model in motion, the product clearly visible, a muted olive set, directional daylight, and a premium sports-fashion editorial finish.",
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

export function CreativeWorkflowPanel({ compact = false }: CreativeWorkflowPanelProps) {
    const [type, setType] = useState<CreativeJobType>("PHOTO_SHOOT");
    const [prompt, setPrompt] = useState(PROMPTS.PHOTO_SHOOT);
    const [productFile, setProductFile] = useState<File | null>(null);
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [productUrl, setProductUrl] = useState<string | null>(null);
    const [modelUrl, setModelUrl] = useState<string | null>(null);
    const [job, setJob] = useState<CreativeJob | null>(null);
    const [puterImageUrl, setPuterImageUrl] = useState<string | null>(null);
    const [engine, setEngine] = useState<CreativeEngine>("puter");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isPhotoShoot = type === "PHOTO_SHOOT";
    const hasRequiredReferences = Boolean(isPhotoShoot ? productFile && modelFile : productFile || modelFile);
    const activeImageUrl = puterImageUrl ?? job?.resultImageUrl ?? productUrl ?? null;

    useEffect(() => {
        if (!job || !["QUEUED", "PROCESSING"].includes(job.status)) return;
        const timer = window.setInterval(async () => {
            try {
                setJob(await getCreativeJob(job.id));
            } catch (pollError) {
                setError(pollError instanceof Error ? pollError.message : "Could not refresh creative job.");
            }
        }, 2500);
        return () => window.clearInterval(timer);
    }, [job]);

    const statusLabel = useMemo(() => {
        if (puterImageUrl) return "Browser experiment ready";
        if (!job) return engine === "puter" ? "Puter experiment armed" : "Ready for a direction";
        if (job.status === "QUEUED") return "Queued for the model";
        if (job.status === "PROCESSING") return "Model running";
        if (job.status === "FAILED") return "Generation unavailable";
        return job.resultVideoUrl ? "Motion ready" : "Image ready";
    }, [job, engine, puterImageUrl]);

    async function handleGenerate() {
        if (!hasRequiredReferences) {
            setError(isPhotoShoot ? "Add both a product image and a model image." : "Add at least one reference image.");
            return;
        }
        setBusy(true);
        setError(null);
        setPuterImageUrl(null);
        try {
            if (engine === "puter") {
                if (!window.puter?.ai?.txt2img) {
                    throw new Error("The Puter experimental layer is not loaded. Refresh the page and try again.");
                }
                if (window.puter.auth?.isSignedIn && !window.puter.auth.isSignedIn()) {
                    if (window.puter.auth.signIn) await window.puter.auth.signIn();
                }
                const references = await Promise.all(
                    [productFile, isPhotoShoot ? modelFile : null]
                        .filter((file): file is File => Boolean(file))
                        .map(fileToDataUrl)
                );
                const image = await window.puter.ai.txt2img(prompt.trim(), {
                    provider: "gemini",
                    model: "gemini-3.1-flash-image-preview",
                    input_images: references,
                    quality: "1K",
                    ratio: { w: 16, h: 9 },
                });
                setPuterImageUrl(image.src);
                setJob(null);
                return;
            }

            let nextProductUrl = productUrl;
            let nextModelUrl = modelUrl;
            if (productFile && !nextProductUrl) {
                const result = await uploadCreativeReference(productFile);
                nextProductUrl = result.url;
                setProductUrl(nextProductUrl);
            }
            if (modelFile && !nextModelUrl) {
                const result = await uploadCreativeReference(modelFile);
                nextModelUrl = result.url;
                setModelUrl(nextModelUrl);
            }
            const created = await createCreativeJob({
                type,
                prompt,
                aspectRatio: "16:9",
                productImageUrl: nextProductUrl ?? undefined,
                modelImageUrl: nextModelUrl ?? undefined,
                generateVideo: isPhotoShoot,
            });
            setJob(created);
        } catch (generateError) {
            setError(generateError instanceof Error ? generateError.message : "Creative generation failed.");
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
                <button type="button" className={engine === "puter" ? "is-active" : ""} onClick={() => { setEngine("puter"); setJob(null); setPuterImageUrl(null); setError(null); }}><Sparkles size={15} /> Puter experiment</button>
                <button type="button" className={engine === "server" ? "is-active" : ""} onClick={() => { setEngine("server"); setPuterImageUrl(null); setError(null); }}><Film size={15} /> STUDIO server
                </button>
                <button type="button" className={type === "PHOTO_SHOOT" ? "is-active" : ""} onClick={() => { setType("PHOTO_SHOOT"); setPrompt(PROMPTS.PHOTO_SHOOT); setJob(null); setPuterImageUrl(null); setError(null); }}><WandSparkles size={15} /> Photo shoot</button>
                <button type="button" className={type === "EDIT_IMAGE" ? "is-active" : ""} onClick={() => { setType("EDIT_IMAGE"); setPrompt(PROMPTS.EDIT_IMAGE); setJob(null); setError(null); }}><ImagePlus size={15} /> Edit an image</button>
            </div>

            <div className="creative-workflow__grid">
                <div className="creative-workflow__inputs">
                    <div className="creative-workflow__references">
                        <ReferenceTile label="01 / PRODUCT" file={productFile} url={productUrl} onChange={(file) => { setProductFile(file); setProductUrl(null); }} />
                        {isPhotoShoot && <ReferenceTile label="02 / MODEL" file={modelFile} url={modelUrl} onChange={(file) => { setModelFile(file); setModelUrl(null); }} />}
                    </div>
                    <label className="creative-workflow__prompt">
                        <span>SCENARIO / PROMPT</span>
                        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} placeholder="Describe the scene, motion, lighting, and what must stay true..." />
                    </label>
                    <div className="creative-workflow__actions">
                        <button type="button" className="studio-button studio-button--dark" onClick={handleGenerate} disabled={busy || Boolean(job && ["QUEUED", "PROCESSING"].includes(job.status))}>
                            {busy || (job && ["QUEUED", "PROCESSING"].includes(job.status)) ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {engine === "puter" ? (isPhotoShoot ? "Experiment photo shoot" : "Experiment edit") : (isPhotoShoot ? "Generate photo shoot" : "Apply edit")}
                        </button>
                        <span>                            {engine === "puter" ? "Browser experiment / image output" : isPhotoShoot ? "Image + motion output" : "Reference-aware image output"}</span>
                    </div>
                    {error && <p className="studio-form-error">{error}</p>}
                </div>

                <div className="creative-workflow__result">
                    {job?.resultVideoUrl ? (
                        <video src={job.resultVideoUrl} controls playsInline className="creative-workflow__media" />
                    ) : activeImageUrl ? (
                        <img src={activeImageUrl} alt="Generated creative result" className="creative-workflow__media" />
                    ) : (
                        <div className="creative-workflow__empty"><Film size={24} /><span>Your result lands here.</span><small>Reference → model → scene → motion</small></div>
                    )}
                    {engine === "puter" && puterImageUrl && <div className="creative-workflow__result-meta"><span><span className="studio-dot studio-dot--lime" /> PUTER / EXPERIMENTAL</span><span>Browser-only result</span></div>}
                    {job?.status === "FAILED" && <div className="creative-workflow__result-error">{job.errorMessage ?? "The configured provider could not complete this generation."}</div>}
                    {job?.resultVideoUrl && <div className="creative-workflow__result-meta"><span><span className="studio-dot studio-dot--lime" /> MP4 / READY</span><span>Photo shoot / 01</span></div>}
                </div>
            </div>
        </section>
    );
}
