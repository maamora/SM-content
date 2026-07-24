"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Sparkles,
    Copy,
    Check,
    Download,
    RefreshCw,
    Languages,
    Sliders,
    CheckCircle,
    Eye,
    Loader2,
    Search,
} from "lucide-react";
import { listTemplates, type Template } from "@/lib/api/templates";
import { generateImage, generateCaptions, editCaption, approvePost, exportPost, type Post } from "@/lib/api/posts";
import { Product3DModel } from "@/components/features/products/Product3DModel";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number | null;
    imageUrl: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
}

interface CreativeStudioProps {
    products: Product[];
    /** Called after generate/approve/export succeeds, so the parent can
     * refresh workspace-wide stats (e.g. the Dashboard's post counts) even
     * though this component stays mounted in the background on other tabs. */
    onPostChange?: () => void;
}

type CaptionLang = "fr" | "ar" | "darija" | "en";

// Purely cosmetic mood swatches for the live preview panel while a real,
// backend-rendered creative doesn't exist yet. These never get sent to the
// server — the actual output is always the Playwright-rendered image from
// /api/posts/generate-image.
const MOOD_PRESETS = [
    { id: "sunset", name: "Maamora Sunset", bg: "from-[#FFFDF9] via-[#FFF3E8] to-[#FFE5D3]", accent: "#F47315" },
    { id: "moss", name: "Atlas Moss", bg: "from-[#FBFDFB] via-[#EAF2ED] to-[#D4E6DC]", accent: "#2D5A41" },
    { id: "ochre", name: "Ochre Medina", bg: "from-[#FAF6F0] via-[#F6ECE2] to-[#EBD5C2]", accent: "#9A3412" },
    { id: "mint", name: "Royal Mint", bg: "from-[#F7FCFA] via-[#ECF7F3] to-[#D1EDE3]", accent: "#1B5E4F" },
    { id: "eclipse", name: "Majorelle Eclipse", bg: "from-[#0F172A] via-[#1E1B4B] to-[#311042]", accent: "#F47315" },
] as const;

const LANGS: { id: CaptionLang; label: string }[] = [
    { id: "darija", label: "Darija" },
    { id: "fr", label: "Français" },
    { id: "ar", label: "العربية" },
    { id: "en", label: "English" },
];

export default function CreativeStudio({ products, onPostChange }: CreativeStudioProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [selectedFormat, setSelectedFormat] = useState<"SQUARE_POST" | "STORY">("SQUARE_POST");
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [promoText, setPromoText] = useState<string>("OFFRE SPÉCIALE !");
    const [accentColor, setAccentColor] = useState<string>("#f97316");
    const [badgeText, setBadgeText] = useState<string>("-20% TODAY");
    const [mood, setMood] = useState<(typeof MOOD_PRESETS)[number]>(MOOD_PRESETS[0]);

    const [post, setPost] = useState<Post | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [activeCaptionLang, setActiveCaptionLang] = useState<CaptionLang>("darija");
    const [draftCaption, setDraftCaption] = useState<string>("");
    const [copiedLang, setCopiedLang] = useState<string | null>(null);

    const [productQuery, setProductQuery] = useState("");
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const productSearchRef = useRef<HTMLDivElement>(null);

    const approvedProducts = useMemo(() => products.filter((p) => p.status === "APPROVED"), [products]);
    const pendingCount = products.length - approvedProducts.length;

    const selectedProduct = approvedProducts.find((p) => p.id === selectedProductId) || approvedProducts[0];

    const matchingProducts = useMemo(
        () => approvedProducts
            .filter((p) => p.name.toLowerCase().includes(productQuery.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name)),
        [approvedProducts, productQuery]
    );

    // Keep the search box text in sync with whichever product is actually
    // selected (initial default pick, or after choosing one from the list).
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the search box display text with the selected product
        setProductQuery(selectedProduct?.name ?? "");
        // Only re-run when the *selected id* changes, not on every render —
        // selectedProduct is a fresh object from .find() each time and would
        // otherwise re-trigger this and fight with in-progress typing.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProduct?.id]);

    // Close the dropdown on outside click.
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
                setIsProductDropdownOpen(false);
                setProductQuery(selectedProduct?.name ?? "");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedProduct]);

    useEffect(() => {
        listTemplates()
            .then(setTemplates)
            .catch((err) => setErrorMsg(err instanceof Error ? err.message : "Failed to load templates"));
    }, []);

    useEffect(() => {
        if (approvedProducts.length > 0 && !approvedProducts.some((p) => p.id === selectedProductId)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- default-select the first approved product
            setSelectedProductId(approvedProducts[0].id);
        }
    }, [approvedProducts, selectedProductId]);

    const templatesForFormat = useMemo(
        () => templates.filter((t) => t.format === selectedFormat),
        [templates, selectedFormat]
    );

    function captionFor(p: Post, lang: CaptionLang): string | null {
        if (lang === "fr") return p.captionFr;
        if (lang === "ar") return p.captionAr;
        if (lang === "en") return p.captionEn;
        return p.captionDarija;
    }

    useEffect(() => {
        if (templatesForFormat.length === 0) return;
        if (!templatesForFormat.some((t) => t.id === selectedTemplateId)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- default-select the first template for the chosen format
            setSelectedTemplateId(templatesForFormat[0].id);
        }
    }, [templatesForFormat, selectedTemplateId]);

    // Reset the working post whenever the underlying inputs change — an existing
    // post no longer reflects the current parameters once they're edited.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- stale post must be cleared when its inputs change
        setPost(null);
    }, [selectedProductId, selectedTemplateId, promoText, accentColor, badgeText]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the editable draft from the loaded post/language
        setDraftCaption(post ? captionFor(post, activeCaptionLang) ?? "" : "");
    }, [post, activeCaptionLang]);

    const handleGenerateImage = async () => {
        if (!selectedProduct || !selectedTemplateId) return;
        setErrorMsg(null);
        setIsGeneratingImage(true);
        try {
            const result = await generateImage({
                productId: selectedProduct.id,
                templateId: selectedTemplateId,
                badgeText,
                promoText,
                accentColor,
            });
            setPost(result);
            onPostChange?.();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to generate image");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleGenerateCaptions = async () => {
        if (!post) return;
        setErrorMsg(null);
        setIsGeneratingCaptions(true);
        try {
            const result = await generateCaptions(post.id);
            setPost(result);
            onPostChange?.();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to generate captions");
        } finally {
            setIsGeneratingCaptions(false);
        }
    };

    const handleSaveCaption = async () => {
        if (!post) return;
        setErrorMsg(null);
        try {
            const result = await editCaption(post.id, activeCaptionLang, draftCaption);
            setPost(result);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to save caption");
        }
    };

    const handleApprove = async () => {
        if (!post) return;
        setErrorMsg(null);
        setIsApproving(true);
        try {
            const result = await approvePost(post.id);
            setPost(result);
            onPostChange?.();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to approve post");
        } finally {
            setIsApproving(false);
        }
    };

    const handleDownload = async () => {
        if (!post) return;
        setErrorMsg(null);
        setIsExporting(true);
        try {
            const blob = await exportPost(post.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `post-${post.id}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            setPost((prev) => (prev ? { ...prev, status: "EXPORTED" } : prev));
            onPostChange?.();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to export post");
        } finally {
            setIsExporting(false);
        }
    };

    const handleCopyCaption = () => {
        navigator.clipboard.writeText(draftCaption);
        setCopiedLang(activeCaptionLang);
        setTimeout(() => setCopiedLang(null), 2000);
    };

    const inputCls = "flex w-full rounded-xl border-2 border-stone-900 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:ring-2 focus-visible:ring-[#F47315] focus-visible:outline-none transition-all font-medium h-10";

    return (
        <div className="space-y-8 select-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black tracking-tight text-stone-900 font-serif flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#F47315]" />
                        Atelier de Composition
                    </h2>
                    <p className="text-xs text-stone-400 mt-1 font-medium">
                        Composez un visuel de marque, générez les légendes, approuvez, puis exportez.
                    </p>
                </div>
            </div>

            {errorMsg && (
                <div className="rounded-xl border-2 border-red-500 bg-red-50 px-4 py-2.5 text-xs text-red-700 font-bold">
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8">

                {/* left column config panel */}
                <div className="space-y-6">
                    <div className="bg-white border-3 border-stone-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]">
                        <div className="px-5 pt-5 pb-3">
                            <h3 className="text-sm font-black tracking-tight text-stone-900 flex items-center gap-2">
                                <Sliders className="h-4 w-4 text-[#F47315]" />
                                Paramètres
                            </h3>
                            <p className="text-[11px] text-stone-400 mt-0.5 font-medium">Configuration du visuel de marque</p>
                        </div>
                        <div className="space-y-5 px-5 pb-5">
                            <div className="space-y-1.5" ref={productSearchRef}>
                                <label className="text-[10px] font-black uppercase tracking-wider text-stone-500" htmlFor="product-search">Produit ciblé</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                                    <input
                                        id="product-search"
                                        type="text"
                                        autoComplete="off"
                                        value={productQuery}
                                        onFocus={() => setIsProductDropdownOpen(true)}
                                        onChange={(e) => {
                                            setProductQuery(e.target.value);
                                            setIsProductDropdownOpen(true);
                                        }}
                                        placeholder="Tapez pour rechercher un produit..."
                                        className="flex w-full h-10 rounded-xl border-2 border-stone-900 bg-white pl-9 pr-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:ring-2 focus-visible:ring-[#F47315] focus-visible:outline-none transition-all font-medium"
                                    />

                                    {isProductDropdownOpen && (
                                        <div className="absolute z-20 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl border-2 border-stone-900 bg-white shadow-[3px_3px_0px_0px_rgba(28,25,23,1)]">
                                            {matchingProducts.length === 0 ? (
                                                <p className="px-3.5 py-2.5 text-xs text-stone-400 font-medium">Aucun produit ne correspond.</p>
                                            ) : (
                                                matchingProducts.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setSelectedProductId(p.id);
                                                            setProductQuery(p.name);
                                                            setIsProductDropdownOpen(false);
                                                        }}
                                                        className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs font-bold border-b border-stone-100 last:border-b-0 transition-colors ${p.id === selectedProductId
                                                            ? "bg-orange-50 text-[#F47315]"
                                                            : "text-stone-700 hover:bg-stone-50"
                                                            }`}
                                                    >
                                                        {p.name}
                                                        {p.price != null && (
                                                            <span className="text-[10px] font-mono text-stone-400">{p.price.toFixed(2)} MAD</span>
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                {pendingCount > 0 && (
                                    <p className="text-[10px] text-stone-400 font-medium">
                                        {pendingCount} produit{pendingCount > 1 ? "s" : ""} en attente d&apos;approbation, masqué{pendingCount > 1 ? "s" : ""} ici.
                                    </p>
                                )}
                                {approvedProducts.length === 0 && (
                                    <p className="text-[11px] text-[#F47315] font-bold">
                                        Aucun produit approuvé — un admin doit en approuver un avant de pouvoir générer du contenu.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">Format d&apos;export</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: "SQUARE_POST" as const, name: "Post Instagram", desc: "1:1 Carré" },
                                        { id: "STORY" as const, name: "Story / Statut", desc: "9:16 Vertical" },
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedFormat(f.id)}
                                            className={`flex flex-col text-left p-3 rounded-xl border-2 text-xs transition-all relative ${selectedFormat === f.id
                                                ? "border-[#F47315] bg-orange-50 text-stone-900"
                                                : "border-stone-200 bg-white text-stone-500 hover:border-stone-400"
                                                }`}
                                        >
                                            <span className="font-extrabold block">{f.name}</span>
                                            <span className="text-[10px] text-stone-400 mt-0.5 font-medium">{f.desc}</span>
                                            {selectedFormat === f.id && (
                                                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#F47315]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">Modèle de design</span>
                                {templatesForFormat.length === 0 ? (
                                    <p className="text-[11px] text-stone-400 font-medium">Aucun modèle disponible pour ce format.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {templatesForFormat.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setSelectedTemplateId(t.id)}
                                                className={`px-3 py-2.5 rounded-xl border-2 text-xs text-left transition-all font-bold ${selectedTemplateId === t.id
                                                    ? "border-[#F47315] bg-orange-50 text-[#F47315]"
                                                    : "border-stone-200 bg-white text-stone-500 hover:border-stone-400"
                                                    }`}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">Ambiance de l&apos;aperçu</span>
                                <div className="flex flex-wrap gap-2">
                                    {MOOD_PRESETS.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setMood(m)}
                                            title={m.name}
                                            className={`h-8 w-8 rounded-full bg-gradient-to-br ${m.bg} border-2 transition-all ${mood.id === m.id ? "border-stone-900 scale-110" : "border-stone-300"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-[10px] text-stone-400 font-medium">Purement visuel — n&apos;affecte pas le rendu final.</p>
                            </div>

                            <div className="h-px bg-stone-100" />

                            <div className="space-y-3.5">
                                <div className="space-y-1.5">
                                    <label htmlFor="promo-title" className="text-[10px] font-black uppercase tracking-wider text-stone-500">Titre de l&apos;offre</label>
                                    <input
                                        id="promo-title"
                                        value={promoText}
                                        onChange={e => setPromoText(e.target.value.toUpperCase())}
                                        className={inputCls}
                                        placeholder="ex. OFFRE SPÉCIALE"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="badge-text" className="text-[10px] font-black uppercase tracking-wider text-stone-500">Texte du badge</label>
                                    <input
                                        id="badge-text"
                                        value={badgeText}
                                        onChange={e => setBadgeText(e.target.value.toUpperCase())}
                                        className={inputCls}
                                        placeholder="ex. -20% AUJOURD'HUI"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">Couleur d&apos;accent</span>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={accentColor}
                                            onChange={e => setAccentColor(e.target.value)}
                                            className="w-11 h-10 p-1 bg-white border-2 border-stone-900 rounded-xl cursor-pointer"
                                        />
                                        <span className="text-xs font-mono text-stone-500 uppercase font-bold">{accentColor}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage || !selectedProduct || !selectedTemplateId}
                                className="w-full h-11 text-xs font-extrabold rounded-xl bg-[#F47315] hover:bg-[#ff852e] text-white border-b-2 border-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isGeneratingImage ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3.5 w-3.5" />
                                )}
                                {isGeneratingImage ? "Rendu en cours..." : post ? "Régénérer le visuel" : "Générer le visuel"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right column: Preview and Copywriter */}
                <div className="space-y-8 min-w-0">

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,360px)] gap-6">

                        {/* Preview */}
                        <div
                            className={`flex flex-col items-center justify-center p-6 rounded-3xl border-3 border-stone-900 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] min-h-[460px] overflow-hidden relative bg-gradient-to-br ${mood.bg}`}
                        >
                            <p className="absolute top-4 left-4 text-[10px] uppercase font-mono tracking-widest text-stone-500 flex items-center gap-1.5 z-10">
                                <Eye className="h-3 w-3" style={{ color: mood.accent }} />
                                {post?.imageUrl ? "Visuel Rendu" : "Aperçu en direct"}
                            </p>

                            {post?.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={post.imageUrl}
                                    alt={selectedProduct ? `${selectedProduct.name} creative` : "Generated creative"}
                                    className={`border-3 border-stone-900 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] object-cover rounded-xl ${selectedFormat === "SQUARE_POST" ? "w-[300px] h-[300px]" : "w-[240px] h-[400px]"
                                        }`}
                                />
                            ) : selectedProduct ? (
                                <div className="flex flex-col items-center gap-4">
                                    <Product3DModel
                                        type={selectedProduct.imageUrl || "argan-bottle"}
                                        size="lg"
                                        isFloating={!isGeneratingImage}
                                    />
                                    <div className="text-center space-y-1 max-w-[240px]">
                                        {badgeText && (
                                            <span
                                                className="inline-block text-[10px] font-black text-white px-2.5 py-1 rounded-full"
                                                style={{ backgroundColor: mood.accent }}
                                            >
                                                {badgeText}
                                            </span>
                                        )}
                                        <p className="text-xs font-mono text-stone-500 mt-2">
                                            {isGeneratingImage ? "Rendu du visuel en cours..." : `${promoText || "Aperçu"} — cliquez sur Générer pour le rendu final.`}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-stone-500 font-mono text-center max-w-[220px]">
                                    Sélectionnez un produit approuvé pour commencer.
                                </div>
                            )}
                        </div>

                        {/* Copywriter panel */}
                        <div className="space-y-4">
                            <div className="bg-white border-3 border-stone-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]">
                                <div className="px-4 pt-4 pb-2.5">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-stone-700 flex items-center gap-1.5">
                                        <Languages className="h-4 w-4 text-[#F47315]" />
                                        Rédaction Multilingue
                                    </h3>
                                    <p className="text-[11px] text-stone-400 mt-0.5 font-medium">
                                        Généré par IA, modifiable avant export
                                    </p>
                                </div>
                                <div className="space-y-4 px-4 pb-4">
                                    <div className="flex rounded-xl border-2 border-stone-900 bg-stone-50 p-1">
                                        {LANGS.map(lang => (
                                            <button
                                                key={lang.id}
                                                onClick={() => setActiveCaptionLang(lang.id)}
                                                className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-extrabold transition-all ${activeCaptionLang === lang.id
                                                    ? "bg-white text-[#F47315] shadow-sm border border-stone-900"
                                                    : "text-stone-400 hover:text-stone-700"
                                                    }`}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="relative">
                                        <textarea
                                            aria-label="Copywriter content text"
                                            value={draftCaption}
                                            onChange={(e) => setDraftCaption(e.target.value)}
                                            onBlur={handleSaveCaption}
                                            disabled={!post}
                                            placeholder={post ? "Aucune légende générée pour cette langue." : "Générez d'abord un visuel."}
                                            className="min-h-[190px] w-full text-xs font-sans tracking-wide bg-white border-2 border-stone-900 rounded-xl text-stone-800 outline-none leading-relaxed resize-none p-3.5 focus-visible:ring-2 focus-visible:ring-[#F47315] disabled:opacity-50"
                                        />

                                        <div className="absolute bottom-2.5 right-2.5">
                                            <button
                                                onClick={handleCopyCaption}
                                                disabled={!draftCaption}
                                                className="h-8 text-[11px] rounded-lg bg-stone-900 hover:bg-stone-800 text-white shadow-md px-2.5 py-1 flex items-center font-bold disabled:opacity-40"
                                            >
                                                {copiedLang === activeCaptionLang ? (
                                                    <>
                                                        <Check className="h-3 w-3 text-emerald-400 mr-1.5" />
                                                        Copié !
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3 text-stone-300 mr-1.5" />
                                                        Copier
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerateCaptions}
                                        disabled={isGeneratingCaptions || !post}
                                        className="w-full h-9 text-[11px] font-extrabold rounded-xl border-2 border-stone-900 bg-white hover:bg-stone-50 text-stone-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingCaptions ? "animate-spin" : ""}`} />
                                        {isGeneratingCaptions ? "Génération..." : "Générer toutes les légendes"}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Approve / export actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between p-5 border-3 border-stone-900 bg-white rounded-3xl shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-orange-50 border-2 border-[#F47315]/30 rounded-xl flex items-center justify-center text-[#F47315]">
                                <CheckCircle className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <span className="text-xs font-extrabold text-stone-800 block">
                                    {post ? `Statut : ${post.status}` : "Aucun visuel pour l'instant"}
                                </span>
                                <span className="text-[10px] text-stone-400 font-medium">Approuvez avant de transmettre pour diffusion</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleApprove}
                                disabled={!post || post.status !== "DRAFT" || isApproving}
                                className="flex-1 sm:flex-none rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-xs h-10 px-5 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                            >
                                {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                {post?.status === "APPROVED" || post?.status === "EXPORTED" ? "Approuvé" : "Approuver"}
                            </button>

                            <button
                                onClick={handleDownload}
                                disabled={!post || isExporting}
                                className="flex-1 sm:flex-none rounded-xl bg-[#F47315] hover:bg-[#ff852e] text-white font-extrabold text-xs h-10 px-6 border-b-2 border-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,1)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Télécharger (.ZIP)
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
