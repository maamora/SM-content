"use client";

/* STUDIO editorial workflow: one quiet visual desk for image edits and photo-shoot frames, with honest capability states. */
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { ImagePlus, Loader2, Sparkles, Upload, WandSparkles } from "lucide-react";
import { createCreativeJob, getCreativeJob, uploadCreativeReference, type CreativeJob } from "@/lib/api/creative";

type CreativeWorkflowPanelProps = {
    compact?: boolean;
    imageGenerationAvailable?: boolean;
};

type CreativeType = "PHOTO_SHOOT" | "EDIT_IMAGE";

const PROMPTS = {
    EDIT_IMAGE: "Keep the product exactly recognizable. Change the background to a warm daylight studio with soft editorial shadows and a quiet cream palette. Preserve the packaging, label, materials, and colors.",
    PHOTO_SHOOT: "Arrange the product and model reference in a premium campaign composition. Keep both references clearly labelled, use a muted olive set, directional light shapes, and a refined editorial hierarchy.",
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
    const [type, setType] = useState<CreativeType>("PHOTO_SHOOT");
    const [prompt, setPrompt] = useState(PROMPTS.PHOTO_SHOOT);
    const [productFile, setProductFile] = useState<File | null>(null);
    const [modelFile, setModelFile] = useState<File | null>(null);
    const [productUrl, setProductUrl] = useState<string | null>(null);
    const [modelUrl, setModelUrl] = useState<string | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const [resultMode, setResultMode] = useState<CreativeJob["outputMode"]>(null);
    const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isPhotoShoot = type === "PHOTO_SHOOT";
    const hasRequiredReferences = Boolean(isPhotoShoot ? productFile && modelFile : productFile);
    const activeImageUrl = resultImageUrl ?? productUrl ?? null;
    const statusLabel = useMemo(() => {
        if (resultImageUrl && resultMode === "TEMPLATE_COMPOSED") return "Composition prête";
        if (resultImageUrl) return "Visuel prêt";
        return isPhotoShoot ? "Prêt pour une composition à deux références" : "Prêt pour une composition produit";
    }, [isPhotoShoot, resultImageUrl, resultMode]);

    async function waitForCreativeJob(jobId: string): Promise<CreativeJob> {
        for (let attempt = 0; attempt < 72; attempt += 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 2500));
            const job = await getCreativeJob(jobId);
            if (job.status === "COMPLETED") {
                if (!job.resultImageUrl) throw new Error("Le flux de composition s’est terminé sans visuel.");
                return job;
            }
            if (job.status === "FAILED") throw new Error(job.errorMessage || "Le flux de composition n’a pas pu produire ce visuel.");
        }
        throw new Error("Le rendu de composition a expiré. Réessayez.");
    }

    async function handleGenerate() {
        if (!hasRequiredReferences) {
            setError(isPhotoShoot ? "Ajoutez une image produit et une image modèle." : "Ajoutez une image produit à composer.");
            return;
        }
        setBusy(true);
        setError(null);
        setResultImageUrl(null);
        setResultMode(null);
        setRecoveryMessage(null);
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
            const completedJob = await waitForCreativeJob(job.id);
            setResultImageUrl(completedJob.resultImageUrl);
            setResultMode(completedJob.outputMode);
            setRecoveryMessage(completedJob.recoveryMessage);
        } catch (generateError) {
            setError(generateError instanceof Error ? generateError.message : "Le rendu de composition a échoué.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className={`creative-workflow ${compact ? "creative-workflow--compact" : ""}`}>
            <div className="creative-workflow__head">
                <div>
                    <p className="studio-kicker studio-kicker--dark"><span className="studio-pulse" /> CREATIVE WORKFLOW / 02</p>
                    <h2>Composez une image<br /><em>qui vous ressemble.</em></h2>
                    <p>Placez un produit et un modèle dans la même composition, puis pilotez la direction graphique avec une phrase.</p>
                </div>
                <span className="creative-workflow__status"><span className="studio-dot studio-dot--lime" /> {statusLabel}</span>
            </div>

            <div className="creative-workflow__modebar">
                <button type="button" className={type === "PHOTO_SHOOT" ? "is-active" : ""} onClick={() => { setType("PHOTO_SHOOT"); setPrompt(PROMPTS.PHOTO_SHOOT); setResultImageUrl(null); setError(null); }}><WandSparkles size={15} /> Produit + modèle</button>
                <button type="button" className={type === "EDIT_IMAGE" ? "is-active" : ""} onClick={() => { setType("EDIT_IMAGE"); setPrompt(PROMPTS.EDIT_IMAGE); setResultImageUrl(null); setError(null); }}><ImagePlus size={15} /> Composer un produit</button>
            </div>

            <div className="creative-workflow__grid">
                <div className="creative-workflow__inputs">
                    <div className="creative-workflow__references">
                        <ReferenceTile label="01 / PRODUCT" file={productFile} url={productUrl} onChange={(file) => { setProductFile(file); setProductUrl(URL.createObjectURL(file)); setResultImageUrl(null); }} />
                        {isPhotoShoot && <ReferenceTile label="02 / MODEL" file={modelFile} url={modelUrl} onChange={(file) => { setModelFile(file); setModelUrl(URL.createObjectURL(file)); setResultImageUrl(null); }} />}
                    </div>
                    <label className="creative-workflow__prompt">
                        <span>DIRECTION DE COMPOSITION</span>
                        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} placeholder="Décrivez la palette, la hiérarchie, la lumière graphique et ce qui doit rester fidèle…" />
                    </label>
                    <div className="creative-workflow__actions">
                        <button type="button" className="studio-button studio-button--dark" onClick={handleGenerate} disabled={busy}>
                            {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            {busy ? "Rendu en cours..." : isPhotoShoot ? "Créer la composition" : "Appliquer la composition"}
                        </button>
                        <span>Un visuel de composition de marque est créé localement à partir de vos références.</span>
                    </div>
                    {error && <p className="studio-form-error">{error}</p>}
                </div>

                <div className="creative-workflow__result">
                    {activeImageUrl ? (
                        <img src={activeImageUrl} alt="Résultat de composition de marque" className="creative-workflow__media" />
                    ) : (
                        <div className="creative-workflow__empty"><Sparkles size={24} /><span>Votre composition arrive ici.</span><small>Références → direction → composition</small></div>
                    )}
                    {resultImageUrl && <div className="creative-workflow__result-meta"><span><span className="studio-dot studio-dot--lime" /> {resultMode === "TEMPLATE_COMPOSED" ? "COMPOSITION DE MODÈLE" : "VISUEL PRÊT"}</span><span>{resultMode === "TEMPLATE_COMPOSED" ? "Composition à partir des références" : isPhotoShoot ? "Cadre de campagne" : "Composition produit"}</span></div>}
                    {recoveryMessage && <p className="studio-form-error">{recoveryMessage}</p>}
                </div>
            </div>
        </section>
    );
}
