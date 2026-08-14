import React, { useState, useEffect } from "react";
/* STUDIO editorial refresh: batch work is presented as a quiet production board with lime controls. */
import { Layers, Loader2, CheckCircle, Download, AlertCircle } from "lucide-react";
import { type Product } from "@/lib/api/products";
import { listTemplates, type Template } from "@/lib/api/templates";
import { createBatch, getBatch, exportBatch, type BatchJob } from "@/lib/api/batches";

interface BatchStudioProps {
    products: Product[];
    onBatchChange?: () => void;
}

export default function BatchStudio({ products, onBatchChange }: BatchStudioProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<"SQUARE_POST" | "STORY">("SQUARE_POST");
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

    const [isStartingBatch, setIsStartingBatch] = useState(false);
    const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
    const [activeBatch, setActiveBatch] = useState<BatchJob | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const approvedProducts = products
        .filter(p => p.status === "APPROVED")
        .sort((a, b) => a.name.localeCompare(b.name));

    useEffect(() => {
        listTemplates()
            .then(setTemplates)
            .catch(err => setErrorMsg(err instanceof Error ? err.message : "Failed to load templates"));
    }, []);

    const templatesForFormat = templates.filter(t => t.format === selectedFormat);

    useEffect(() => {
        if (templatesForFormat.length > 0 && !templatesForFormat.some(t => t.id === selectedTemplateId)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Keep the selected template valid when a format changes.
            setSelectedTemplateId(templatesForFormat[0].id);
        }
    }, [templatesForFormat, selectedTemplateId]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeBatchId) {
            interval = setInterval(async () => {
                try {
                    const batch = await getBatch(activeBatchId);
                    setActiveBatch(batch);
                    if (batch.status === "DONE" || batch.status === "FAILED") {
                        clearInterval(interval);
                        onBatchChange?.();
                    }
                } catch (err) {
                    console.error(err);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [activeBatchId, onBatchChange]);

    const toggleProduct = (id: string) => {
        const newSet = new Set(selectedProducts);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedProducts(newSet);
    };

    const handleStartBatch = async () => {
        if (selectedProducts.size === 0 || !selectedTemplateId) return;
        setIsStartingBatch(true);
        setErrorMsg(null);
        try {
            const batch = await createBatch({
                productIds: Array.from(selectedProducts),
                templateId: selectedTemplateId
            });
            setActiveBatchId(batch.id);
            setActiveBatch(batch);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to start batch");
        } finally {
            setIsStartingBatch(false);
        }
    };

    const handleExport = async () => {
        if (!activeBatch) return;
        setIsExporting(true);
        setErrorMsg(null);
        try {
            const blob = await exportBatch(activeBatch.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `batch-${activeBatch.id}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to export batch");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8 select-none">
            <div>
                <h2 className="flex items-center gap-2 font-serif text-2xl font-normal tracking-tight text-[var(--studio-ink)]">
                    <Layers className="h-5 w-5 text-[#5f762a]" />
                    Génération en Lot (Batch)
                </h2>
                <p className="mt-1 text-xs font-medium text-[#777870]">
                    Générez des visuels et légendes multilingues pour plusieurs produits en même temps.
                </p>
            </div>

            {errorMsg && (
                <div className="studio-form-error">
                    {errorMsg}
                </div>
            )}

            {!activeBatchId ? (
                <div className="studio-live-columns">
                    <div className="studio-creative-card p-6">
                        <h3 className="mb-4 block text-sm font-black text-[var(--studio-ink)]">Produits à inclure</h3>
                        <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
                            {approvedProducts.map(p => (
                                <label key={p.id} className="flex cursor-pointer items-center gap-3 border border-[#deddd5] p-3 transition-colors hover:border-[var(--studio-ink)]">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.has(p.id)}
                                        onChange={() => toggleProduct(p.id)}
                                        className="h-4 w-4 accent-[var(--studio-lime)]"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-[var(--studio-ink)]">{p.name}</p>
                                        {p.price && <p className="text-[10px] font-mono text-[#91918b]">{p.price} MAD</p>}
                                    </div>
                                </label>
                            ))}
                            {approvedProducts.length === 0 && (
                                <p className="py-4 text-center text-xs font-medium text-[#91918b]">Aucun produit approuvé disponible.</p>
                            )}
                        </div>
                    </div>

                    <div className="studio-creative-card space-y-6 p-6">
                        <div className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Format d&apos;export</span>
                            <div className="flex gap-2">
                                {[
                                    { id: "SQUARE_POST" as const, name: "SQUARE" },
                                    { id: "STORY" as const, name: "STORY" },
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setSelectedFormat(f.id)}
                                        className={`border px-4 py-2 text-xs font-bold transition-all ${selectedFormat === f.id ? "border-[#8aa65a] bg-[rgba(185,255,67,.14)] text-[#5f762a]" : "border-[#c5c4bb] text-[#777870] hover:border-[var(--studio-ink)]"
                                            }`}
                                    >
                                        {f.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="block text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Modèle</span>
                            {/* Each format currently maps to exactly one design template, so this
                                renders as buttons (like the Atelier Créatif tab) rather than a
                                dropdown — a dropdown implies there's more than one option to pick
                                between, which isn't the case yet. Scales automatically if more
                                templates get added per format later. */}
                            {templatesForFormat.length === 0 ? (
                                <p className="text-[11px] font-medium text-[#91918b]">Aucun modèle disponible pour ce format.</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {templatesForFormat.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setSelectedTemplateId(t.id)}
                                            className={`border px-3 py-2.5 text-left text-xs font-bold transition-all ${selectedTemplateId === t.id
                                                ? "border-[#8aa65a] bg-[rgba(185,255,67,.14)] text-[#5f762a]"
                                                : "border-[#c5c4bb] bg-[#faf9f4] text-[#777870] hover:border-[var(--studio-ink)]"
                                                }`}
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleStartBatch}
                            disabled={isStartingBatch || selectedProducts.size === 0 || !selectedTemplateId}
                            className="studio-button studio-button--lime studio-button--large w-full disabled:opacity-50"
                        >
                            {isStartingBatch && <Loader2 className="h-4 w-4 animate-spin" />}
                            Lancer le traitement ({selectedProducts.size} éléments)
                        </button>
                    </div>
                </div>
            ) : (
                <div className="studio-creative-card mx-auto max-w-2xl space-y-6 p-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        {activeBatch?.status === "DONE" ? (
                            <div className="flex h-16 w-16 items-center justify-center border border-[#8aa65a] bg-[rgba(185,255,67,.14)] text-[#5f762a]">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                        ) : activeBatch?.status === "FAILED" ? (
                            <div className="flex h-16 w-16 items-center justify-center border border-[#c99b9b] bg-[#fff2f2] text-[#944949]">
                                <AlertCircle className="h-8 w-8" />
                            </div>
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center border border-[#8aa65a] bg-[rgba(185,255,67,.14)] text-[#5f762a]">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        )}

                        <h3 className="font-serif text-2xl font-normal text-[var(--studio-ink)]">
                            {activeBatch?.status === "DONE" ? "Traitement terminé" :
                                activeBatch?.status === "FAILED" ? "Traitement échoué" :
                                    "Génération en cours..."}
                        </h3>

                        {activeBatch && activeBatch.posts && (
                            <p className="text-sm font-medium text-[#777870]">
                                {activeBatch.posts.length} visuels générés jusqu&apos;à présent.
                            </p>
                        )}
                    </div>

                    {activeBatch?.status === "DONE" && (
                        <div className="flex justify-center border-t border-[#deddd5] pt-4">
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="studio-button studio-button--lime studio-button--large disabled:opacity-50"
                            >
                                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Exporter le lot (.ZIP)
                            </button>
                        </div>
                    )}

                    <div className="flex justify-center pt-4">
                        <button
                            onClick={() => { setActiveBatchId(null); setActiveBatch(null); }}
                            className="studio-text-button"
                        >
                            Retourner et créer un nouveau lot
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
