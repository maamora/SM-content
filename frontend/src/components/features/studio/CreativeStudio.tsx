"use client";

/* STUDIO editorial refresh: a graphite-and-paper composition desk with lime signal accents and capability-honest creative controls. */
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
import { CreativeWorkflowPanel } from "./CreativeWorkflowPanel";
import { getSystemCapabilities, type SystemCapabilities } from "@/lib/api/system";
import { generateLocalCaption } from "@/lib/local-caption";

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
    { id: "sunset", name: "Maamora Sunset", bg: "from-[#f7f8ef] via-[#e8f3c8] to-[#d7ff97]", accent: "#5f762a" },
    { id: "moss", name: "Atlas Moss", bg: "from-[#fbfdfb] via-[#eaf2ed] to-[#d4e6dc]", accent: "#2d5a41" },
    { id: "ochre", name: "Ochre Medina", bg: "from-[#faf6f0] via-[#f1efe5] to-[#dfded6]", accent: "#6b6d5f" },
    { id: "mint", name: "Royal Mint", bg: "from-[#f7fcfa] via-[#ecf7f3] to-[#d1ede3]", accent: "#1b5e4f" },
    { id: "eclipse", name: "Graphite Eclipse", bg: "from-[#0a0a0a] via-[#141414] to-[#25251f]", accent: "#b9ff43" },
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
    const [accentColor, setAccentColor] = useState<string>("#b9ff43");
    const [badgeText, setBadgeText] = useState<string>("-20% TODAY");
    const [mood, setMood] = useState<(typeof MOOD_PRESETS)[number]>(MOOD_PRESETS[0]);
    const [generatedImageSrc, setGeneratedImageSrc] = useState<string | null>(null);

    const [post, setPost] = useState<Post | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);

    const [activeCaptionLang, setActiveCaptionLang] = useState<CaptionLang>("darija");
    const [draftCaption, setDraftCaption] = useState<string>("");
    const [copiedLang, setCopiedLang] = useState<string | null>(null);
    const [localCaptions, setLocalCaptions] = useState<Partial<Record<CaptionLang, string>>>({});
    const [isGeneratingLocalCaption, setIsGeneratingLocalCaption] = useState(false);
    const [localCaptionProgress, setLocalCaptionProgress] = useState<{ progress: number; detail: string } | null>(null);

    const [productQuery, setProductQuery] = useState("");
    const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
    const productSearchRef = useRef<HTMLDivElement>(null);

    const approvedProducts = useMemo(() => products.filter((p) => p.status === "APPROVED"), [products]);
    const pendingCount = products.length - approvedProducts.length;
    const imageGenerationUnavailable = capabilities !== null && !capabilities.imageGeneration;
    const serverCaptionGenerationUnavailable = capabilities !== null && !capabilities.captionGeneration;

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
            .catch((err: unknown) => setErrorMsg(err instanceof Error ? err.message : "Failed to load templates"));
    }, []);

    useEffect(() => {
        getSystemCapabilities().then(setCapabilities).catch(() => {
            // Do not block a healthy server workflow merely because this
            // informational capability check is temporarily unavailable.
            setCapabilities(null);
        });
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
        setGeneratedImageSrc(null);
        setLocalCaptions({});
    }, [selectedProductId, selectedTemplateId, promoText, accentColor, badgeText]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync the editable draft from the loaded post/language
        setDraftCaption(post ? captionFor(post, activeCaptionLang) ?? localCaptions[activeCaptionLang] ?? "" : localCaptions[activeCaptionLang] ?? "");
    }, [post, activeCaptionLang, localCaptions]);

    const handleGenerateImage = async () => {
        if (!selectedProduct || !selectedTemplateId) return;
        if (imageGenerationUnavailable) {
            setErrorMsg("La génération d’images n’est pas configurée. Ajoutez une clé Gemini valide au backend pour activer les visuels, les photo shoots et les retouches.");
            return;
        }
        setErrorMsg(null);
        setIsGeneratingImage(true);
        try {
            const result = await generateImage({
                productId: selectedProduct.id,
                templateId: selectedTemplateId,
                badgeText,
                promoText,
                accentColor,
                mood: mood.name,
            });
            setPost(result);
            setGeneratedImageSrc(result.imageUrl);
            onPostChange?.();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to generate image");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleSelectCaptionLanguage = (lang: CaptionLang) => {
        setActiveCaptionLang(lang);
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

    const handleGenerateLocalCaption = async () => {
        if (!selectedProduct) {
            setErrorMsg("Sélectionnez un produit approuvé avant de rédiger une légende.");
            return;
        }

        setErrorMsg(null);
        setIsGeneratingLocalCaption(true);
        setLocalCaptionProgress({ progress: 0, detail: "Préparation de la rédaction locale…" });
        try {
            const caption = await generateLocalCaption({
                productName: selectedProduct.name,
                productDescription: selectedProduct.description,
                offer: promoText,
                badge: badgeText,
                language: activeCaptionLang,
                onProgress: (progress, detail) => setLocalCaptionProgress({ progress, detail }),
            });
            setLocalCaptions((current) => ({ ...current, [activeCaptionLang]: caption }));
            setDraftCaption(caption);
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Impossible de générer une légende locale.");
        } finally {
            setIsGeneratingLocalCaption(false);
            setLocalCaptionProgress(null);
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

    const handleDownloadGeneratedVisual = () => {
        if (!generatedImageSrc) return;
        const link = document.createElement("a");
        link.href = generatedImageSrc;
        link.download = `studio-visual-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
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

    const inputCls = "w-full border border-[#bdbdb4] bg-[#faf9f4] px-3 py-2 text-sm text-[var(--studio-ink)] placeholder:text-[#91918b] outline-none transition-colors focus:border-[var(--studio-lime)] font-medium h-10";

    return (
        <div className="space-y-8 select-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                        <h2 className="flex items-center gap-2 font-serif text-2xl font-normal tracking-tight text-[var(--studio-ink)]">
                            <Sparkles className="h-5 w-5 text-[#5f762a]" />
                        Atelier de Composition
                    </h2>
                    <p className="mt-1 text-xs font-medium text-[#777870]">
                        Composez un visuel de marque, générez les légendes, approuvez, puis exportez.
                    </p>
                </div>
            </div>

            {errorMsg && (
                <div className="studio-form-error">
                    {errorMsg}
                </div>
            )}

            <CreativeWorkflowPanel imageGenerationAvailable={!imageGenerationUnavailable} />

            <div className="studio-creative-grid">

                {/* left column config panel */}
                <div className="space-y-6">
                    <div className="studio-creative-card">
                        <div className="studio-creative-card__head">
                            <h3 className="flex items-center gap-2 text-sm font-black tracking-tight text-[var(--studio-ink)]">
                                <Sliders className="h-4 w-4 text-[#5f762a]" />
                                Paramètres
                            </h3>
                            <p className="mt-0.5 text-[11px] font-medium text-[#777870]">Configuration du visuel de marque</p>
                        </div>
                        <div className="studio-creative-card__body">
                            <div className="space-y-1.5" ref={productSearchRef}>
                                <label className="block text-[10px] font-black uppercase tracking-wider text-[#6f7068]" htmlFor="product-search">Produit ciblé</label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91918b]" />
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
                                        className="w-full border border-[#bdbdb4] bg-[#faf9f4] py-2 pl-9 pr-3 text-sm font-medium text-[var(--studio-ink)] placeholder:text-[#91918b] outline-none transition-colors focus:border-[var(--studio-lime)]"
                                    />

                                    {isProductDropdownOpen && (
                                        <div className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto border border-[var(--studio-ink)] bg-[var(--studio-paper)] shadow-[6px_6px_0px_rgba(17,17,15,.12)]">
                                            {matchingProducts.length === 0 ? (
                                                <p className="px-3.5 py-2.5 text-xs font-medium text-[#91918b]">Aucun produit ne correspond.</p>
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
                                                        className={`flex w-full items-center justify-between gap-2 border-b border-[#deddd5] px-3.5 py-2.5 text-left text-xs font-bold transition-colors last:border-b-0 ${p.id === selectedProductId
                                                            ? "bg-[rgba(185,255,67,.16)] text-[#5f762a]"
                                                            : "text-[#4f504a] hover:bg-[#e9e8e0]"
                                                            }`}
                                                    >
                                                        {p.name}
                                                        {p.price != null && (
                                                            <span className="text-[10px] font-mono text-[#91918b]">{p.price.toFixed(2)} MAD</span>
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                {pendingCount > 0 && (
                                    <p className="text-[10px] font-medium text-[#91918b]">
                                        {pendingCount} produit{pendingCount > 1 ? "s" : ""} en attente d&apos;approbation, masqué{pendingCount > 1 ? "s" : ""} ici.
                                    </p>
                                )}
                                {approvedProducts.length === 0 && (
                                    <p className="text-[11px] font-bold text-[#5f762a]">
                                        Aucun produit approuvé — un admin doit en approuver un avant de pouvoir générer du contenu.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <span className="block text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Format d&apos;export</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: "SQUARE_POST" as const, name: "Post Instagram", desc: "1:1 Carré" },
                                        { id: "STORY" as const, name: "Story / Statut", desc: "9:16 Vertical" },
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedFormat(f.id)}
                                            className={`relative flex flex-col border p-3 text-left text-xs transition-all ${selectedFormat === f.id
                                                ? "border-[#8aa65a] bg-[rgba(185,255,67,.14)] text-[var(--studio-ink)]"
                                                : "border-[#c5c4bb] bg-[#faf9f4] text-[#777870] hover:border-[var(--studio-ink)]"
                                                }`}
                                        >
                                            <span className="font-extrabold block">{f.name}</span>
                                            <span className="mt-0.5 text-[10px] font-medium text-[#91918b]">{f.desc}</span>
                                            {selectedFormat === f.id && (
                                                <span className="studio-status-dot studio-status-dot--lime absolute right-2 top-2" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <span className="block text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Modèle de design</span>
                                {templatesForFormat.length === 0 ? (
                                    <p className="text-[11px] font-medium text-[#91918b]">Aucun modèle disponible pour ce format.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {templatesForFormat.map(t => (
                                            <button
                                                key={t.id}
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

                            <div className="space-y-1.5">
                                <span className="block text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Ambiance de l&apos;aperçu</span>
                                <div className="flex flex-wrap gap-2">
                                    {MOOD_PRESETS.map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setMood(m)}
                                            title={m.name}
                                            className={`h-8 w-8 border bg-gradient-to-br ${m.bg} transition-all ${mood.id === m.id ? "scale-110 border-[var(--studio-ink)]" : "border-[#c5c4bb]"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-[10px] font-medium text-[#91918b]">Purement visuel — n&apos;affecte pas le rendu final.</p>
                            </div>

                            <div className="h-px bg-[#deddd5]" />

                            <div className="space-y-3.5">
                                <div className="space-y-1.5">
                                    <label htmlFor="promo-title" className="text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Titre de l&apos;offre</label>
                                    <input
                                        id="promo-title"
                                        value={promoText}
                                        onChange={e => setPromoText(e.target.value.toUpperCase())}
                                        className={inputCls}
                                        placeholder="ex. OFFRE SPÉCIALE"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="badge-text" className="text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Texte du badge</label>
                                    <input
                                        id="badge-text"
                                        value={badgeText}
                                        onChange={e => setBadgeText(e.target.value.toUpperCase())}
                                        className={inputCls}
                                        placeholder="ex. -20% AUJOURD'HUI"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <span className="block text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Couleur d&apos;accent</span>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={accentColor}
                                            onChange={e => setAccentColor(e.target.value)}
                                            className="h-10 w-11 cursor-pointer border border-[var(--studio-ink)] bg-[#faf9f4] p-1"
                                        />
                                        <span className="text-xs font-mono font-bold uppercase text-[#777870]">{accentColor}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage || !selectedProduct || !selectedTemplateId || imageGenerationUnavailable}
                                className="studio-button studio-button--lime studio-button--large w-full disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isGeneratingImage ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3.5 w-3.5" />
                                )}
                                {isGeneratingImage ? "Rendu du visuel en cours..." : imageGenerationUnavailable ? "Génération visuelle indisponible" : generatedImageSrc ? "Régénérer le visuel" : "Générer le visuel"}
                            </button>
                            {imageGenerationUnavailable && (
                                <p className="text-[10px] font-medium leading-relaxed text-[#777870]">
                                    Ajoutez une clé Gemini valide au backend pour activer la création d’images, les photo shoots et les retouches. Aucun package navigateur ne peut remplacer cette étape sans télécharger un très grand modèle sur l’appareil.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column: Preview and Copywriter */}
                <div className="space-y-8 min-w-0">

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,360px)] gap-6">

                        {/* Preview */}
                        <div className={`studio-creative-preview bg-gradient-to-br ${mood.bg}`}>
                            <p className="absolute left-4 top-4 z-10 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#777870]">
                                <Eye className="h-3 w-3" style={{ color: mood.accent }} />
                                {generatedImageSrc ? "Visuel généré" : post?.imageUrl ? "Visuel rendu" : "Aperçu en direct"}
                            </p>

                            {generatedImageSrc ? (
                                <div className="flex flex-col items-center gap-3">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={generatedImageSrc} alt="Generated creative visual" className={`object-cover ${selectedFormat === "SQUARE_POST" ? "h-[300px] w-[300px]" : "h-[400px] w-[240px]"}`} />
                                    <button type="button" onClick={handleDownloadGeneratedVisual} className="studio-button studio-button--dark"><Download className="h-3.5 w-3.5" /> Download PNG</button>
                                </div>
                            ) : post?.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={post.imageUrl}
                                    alt={selectedProduct ? `${selectedProduct.name} creative` : "Generated creative"}
                                    className={`object-cover ${selectedFormat === "SQUARE_POST" ? "h-[300px] w-[300px]" : "h-[400px] w-[240px]"
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
                                                className="inline-block border border-[var(--studio-ink)] px-2.5 py-1 text-[10px] font-black text-[var(--studio-ink)]"
                                                style={{ backgroundColor: mood.accent }}
                                            >
                                                {badgeText}
                                            </span>
                                        )}
                                        <p className="mt-2 text-xs font-mono text-[#777870]">
                                            {isGeneratingImage ? "Rendu du visuel en cours..." : `${promoText || "Aperçu"} — cliquez sur Générer pour le rendu final.`}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-[220px] text-center text-xs font-mono text-[#777870]">
                                    Sélectionnez un produit approuvé pour commencer.
                                </div>
                            )}
                        </div>

                        {/* Copywriter panel */}
                        <div className="space-y-4">
                            <div className="studio-creative-card">
                                <div className="studio-creative-card__head">
                                    <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#4f504a]">
                                        <Languages className="h-4 w-4 text-[#5f762a]" />
                                        Rédaction Multilingue
                                    </h3>
                                    <p className="mt-0.5 text-[11px] font-medium text-[#777870]">
                                        Généré par IA, modifiable avant export
                                    </p>
                                </div>
                                <div className="studio-creative-card__body">
                                    <div className="studio-caption-tabs">
                                        {LANGS.map(lang => (
                                            <button
                                                key={lang.id}
                                                type="button"
                                                aria-selected={activeCaptionLang === lang.id}
                                                onClick={() => handleSelectCaptionLanguage(lang.id)}
                                                className={`studio-caption-tab ${activeCaptionLang === lang.id
                                                    ? "studio-caption-tab--active"
                                                    : "hover:text-[var(--studio-ink)]"
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
                                            disabled={!post && !localCaptions[activeCaptionLang]}
                                            placeholder={post ? "Aucune légende générée pour cette langue." : "Rédigez une légende locale ou créez d’abord un visuel."}
                                            className="min-h-[190px] w-full resize-none border border-[#bdbdb4] bg-[#faf9f4] p-3.5 text-xs font-sans leading-relaxed tracking-wide text-[var(--studio-ink)] outline-none focus:border-[var(--studio-lime)] disabled:opacity-50"
                                        />

                                        <div className="absolute bottom-2.5 right-2.5">
                                            <button
                                                onClick={handleCopyCaption}
                                                disabled={!draftCaption}
                                                className="studio-button studio-button--dark h-8 px-2.5 py-1 text-[11px] disabled:opacity-40"
                                            >
                                                {copiedLang === activeCaptionLang ? (
                                                    <>
                                                        <Check className="mr-1.5 h-3 w-3 text-[var(--studio-lime)]" />
                                                        Copié !
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="mr-1.5 h-3 w-3 text-[#c5c4bb]" />
                                                        Copier
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <p className="mt-2 text-[10px] font-medium text-[#777870]" aria-live="polite">
                                        {post
                                            ? `Langue sélectionnée : ${LANGS.find((lang) => lang.id === activeCaptionLang)?.label}. Cliquez sur une langue pour appliquer sa légende générée dans l’éditeur.`
                                            : localCaptions[activeCaptionLang]
                                                ? "Brouillon rédigé sur cet appareil. Relisez-le avant publication."
                                                : "Rédigez une légende à partir du produit sélectionné, sans clé API."}
                                    </p>

                                    <button
                                        onClick={handleGenerateCaptions}
                                        disabled={isGeneratingCaptions || !post}
                                        className="studio-button studio-button--paper h-9 w-full text-[11px] disabled:opacity-40"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingCaptions ? "animate-spin" : ""}`} />
                                        {isGeneratingCaptions ? "Génération..." : "Générer toutes les légendes"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleGenerateLocalCaption}
                                        disabled={isGeneratingLocalCaption || !selectedProduct}
                                        className="studio-button studio-button--paper mt-2 h-9 w-full text-[11px] disabled:opacity-40"
                                    >
                                        <Sparkles className={`h-3.5 w-3.5 ${isGeneratingLocalCaption ? "animate-pulse" : ""}`} />
                                        {isGeneratingLocalCaption
                                            ? localCaptionProgress ? `${localCaptionProgress.progress}% · ${localCaptionProgress.detail}` : "Préparation…"
                                            : "Rédiger la légende sur cet appareil"}
                                    </button>
                                    {serverCaptionGenerationUnavailable && (
                                        <p className="mt-2 text-[10px] font-medium leading-relaxed text-[#777870]">
                                            La génération de toutes les langues n’est pas configurée. La rédaction locale reste disponible pour la langue sélectionnée.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Approve / export actions */}
                    <div className="studio-creative-actions flex-col sm:flex-row">
                        <div className="studio-creative-status">
                            <div className="studio-creative-status__icon">
                                <CheckCircle className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <span className="block text-xs font-extrabold text-[var(--studio-ink)]">
                                    {post ? `Statut : ${post.status}` : "Aucun visuel pour l'instant"}
                                </span>
                                <span className="text-[10px] font-medium text-[#777870]">Approuvez avant de transmettre pour diffusion</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleApprove}
                                disabled={!post || post.status !== "DRAFT" || isApproving}
                                className="studio-button studio-button--dark flex-1 text-xs disabled:opacity-50 sm:flex-none"
                            >
                                {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                {post?.status === "APPROVED" || post?.status === "EXPORTED" ? "Approuvé" : "Approuver"}
                            </button>

                            <button
                                onClick={handleDownload}
                                disabled={!post || isExporting}
                                className="studio-button studio-button--lime flex-1 text-xs disabled:opacity-50 sm:flex-none"
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
