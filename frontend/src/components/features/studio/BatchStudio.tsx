import React, { useState, useEffect } from "react";
/* STUDIO editorial refresh: batch work is presented as a quiet production board with lime controls. */
import { Layers, Loader2 } from "lucide-react";
import { type Product } from "@/lib/api/products";
import { listTemplates, type Template } from "@/lib/api/templates";
import { generateImage, type Post } from "@/lib/api/posts";

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
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [generatedPosts, setGeneratedPosts] = useState<Array<Post>>([]);

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
        setGeneratedPosts([]);
        try {
            const chosen = approvedProducts.filter((product) => selectedProducts.has(product.id));
            const outputs: Post[] = [];
            for (const product of chosen) {
                const post = await generateImage({
                    productId: product.id,
                    templateId: selectedTemplateId,
                    mood: "Cohesive premium campaign with refined editorial lighting and commercial texture.",
                });
                outputs.push(post);
                setGeneratedPosts([...outputs]);
                onBatchChange?.();
            }
            setErrorMsg("Batch visuals are ready. Generate captions from each post in the Atelier Creative workflow.");
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to start batch");
        } finally {
            setIsStartingBatch(false);
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
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-[#777870]">Visual batch workspace</p>
            </div>

            {errorMsg && (
                <div className="studio-form-error">
                    {errorMsg}
                </div>
            )}

            {generatedPosts.length > 0 ? (
                <div className="studio-creative-card space-y-6 p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="studio-kicker">VISUELS GÉNÉRÉS</p>
                            <h3 className="font-serif text-2xl font-normal text-[var(--studio-ink)]">Batch visuel</h3>
                        </div>
                        <button type="button" className="studio-text-button" onClick={() => setGeneratedPosts([])}>Nouveau lot</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {generatedPosts.map((output) => (
                            <div key={output.id} className="border border-[#deddd5] bg-[#faf9f4] p-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={output.imageUrl || ""} alt={`${output.productName} generated visual`} className={`w-full object-cover ${selectedFormat === "SQUARE_POST" ? "aspect-square" : "aspect-[9/16]"}`} />
                                <div className="mt-3 flex items-center justify-between gap-2">
                                    <span className="truncate text-xs font-bold text-[var(--studio-ink)]">{output.productName}</span>
                                    {output.imageUrl && <a className="studio-text-button shrink-0" href={output.imageUrl} download={`studio-${output.productName}.png`}>Download</a>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
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
            )}
        </div>
    );
}
