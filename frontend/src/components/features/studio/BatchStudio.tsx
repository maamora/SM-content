import React, { useState, useEffect, useRef } from "react";
import { Layers, Loader2, CheckCircle, Download, Check, AlertCircle } from "lucide-react";
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

    const approvedProducts = products.filter(p => p.status === "APPROVED");

    useEffect(() => {
        listTemplates()
            .then(setTemplates)
            .catch(err => setErrorMsg(err instanceof Error ? err.message : "Failed to load templates"));
    }, []);

    const templatesForFormat = templates.filter(t => t.format === selectedFormat);

    useEffect(() => {
        if (templatesForFormat.length > 0 && !templatesForFormat.some(t => t.id === selectedTemplateId)) {
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
                <h2 className="text-xl font-black tracking-tight text-stone-900 font-serif flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[#F47315]" />
                    Génération en Lot (Batch)
                </h2>
                <p className="text-xs text-stone-400 mt-1 font-medium">
                    Générez des visuels et légendes multilingues pour plusieurs produits en même temps.
                </p>
            </div>

            {errorMsg && (
                <div className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-2.5 text-xs text-red-700 font-bold">
                    {errorMsg}
                </div>
            )}

            {!activeBatchId ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white border-3 border-stone-900 rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]">
                        <h3 className="font-extrabold text-stone-900 mb-4 block text-sm">Produits à inclure</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {approvedProducts.map(p => (
                                <label key={p.id} className="flex items-center gap-3 p-3 border-2 border-stone-200 rounded-xl cursor-pointer hover:border-stone-900 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.has(p.id)}
                                        onChange={() => toggleProduct(p.id)}
                                        className="h-4 w-4 rounded text-[#F47315] focus:ring-[#F47315]"
                                    />
                                    <div>
                                        <p className="text-sm font-bold text-stone-800">{p.name}</p>
                                        {p.price && <p className="text-[10px] text-stone-400 font-mono">{p.price} MAD</p>}
                                    </div>
                                </label>
                            ))}
                            {approvedProducts.length === 0 && (
                                <p className="text-xs text-stone-500 font-medium py-4 text-center">Aucun produit approuvé disponible.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border-3 border-stone-900 rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] space-y-6">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">Format d&apos;export</span>
                            <div className="flex gap-2">
                                {[
                                    { id: "SQUARE_POST" as const, name: "SQUARE" },
                                    { id: "STORY" as const, name: "STORY" },
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setSelectedFormat(f.id)}
                                        className={`px-4 py-2 text-xs font-bold rounded-xl border-2 transition-all ${selectedFormat === f.id ? "bg-orange-50 border-[#F47315] text-[#F47315]" : "border-stone-200 text-stone-500 hover:border-stone-400"
                                            }`}
                                    >
                                        {f.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">Modèle</span>
                            <select
                                value={selectedTemplateId}
                                onChange={e => setSelectedTemplateId(e.target.value)}
                                className="w-full text-xs font-bold border-2 border-stone-900 rounded-xl p-3 outline-none"
                            >
                                {templatesForFormat.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleStartBatch}
                            disabled={isStartingBatch || selectedProducts.size === 0 || !selectedTemplateId}
                            className="w-full h-11 text-xs font-extrabold rounded-xl bg-[#F47315] hover:bg-[#ff852e] text-white border-b-2 border-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,1)] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isStartingBatch && <Loader2 className="h-4 w-4 animate-spin" />}
                            Lancer le traitement ({selectedProducts.size} éléments)
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white border-3 border-stone-900 rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] max-w-2xl mx-auto space-y-6">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        {activeBatch?.status === "DONE" ? (
                            <div className="h-16 w-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center border-2 border-green-200">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                        ) : activeBatch?.status === "FAILED" ? (
                            <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center border-2 border-red-200">
                                <AlertCircle className="h-8 w-8" />
                            </div>
                        ) : (
                            <div className="h-16 w-16 bg-orange-50 text-[#F47315] rounded-full flex items-center justify-center border-2 border-orange-200">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        )}

                        <h3 className="font-extrabold text-stone-900 text-lg">
                            {activeBatch?.status === "DONE" ? "Traitement terminé" :
                                activeBatch?.status === "FAILED" ? "Traitement échoué" :
                                    "Génération en cours..."}
                        </h3>

                        {activeBatch && activeBatch.posts && (
                            <p className="text-sm font-medium text-stone-500">
                                {activeBatch.posts.length} visuels générés jusqu&apos;à présent.
                            </p>
                        )}
                    </div>

                    {activeBatch?.status === "DONE" && (
                        <div className="flex justify-center pt-4 border-t-2 border-stone-100">
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="h-11 px-8 text-xs font-extrabold rounded-xl bg-[#F47315] hover:bg-[#ff852e] text-white border-b-2 border-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,1)] disabled:opacity-50 flex items-center gap-2"
                            >
                                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Exporter le lot (.ZIP)
                            </button>
                        </div>
                    )}

                    <div className="flex justify-center pt-4">
                        <button
                            onClick={() => { setActiveBatchId(null); setActiveBatch(null); }}
                            className="text-[11px] font-bold text-stone-400 hover:text-stone-900 underline underline-offset-4"
                        >
                            Retourner et créer un nouveau lot
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
