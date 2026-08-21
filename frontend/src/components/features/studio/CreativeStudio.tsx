"use client";

/* STUDIO POST COMPOSER: editorial pasteboard, visible source controls, paper previews, lime signal accents, and no model-workflow language. */
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Check, CheckCircle2, Copy, Download, Eye, FileUp, ImagePlus, Layers3,
    Loader2, Palette, Search, Sparkles, Stamp, UploadCloud,
} from "lucide-react";
import { getBrand, type BrandSettings } from "@/lib/api/brand";
import { createBrowserVisualPost, editCaption, exportPost, generateCaptions, generateImage, approvePost, type Post } from "@/lib/api/posts";
import { listTemplates, type Template } from "@/lib/api/templates";

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
    onPostChange?: () => void;
}

type CaptionLang = "fr" | "ar" | "darija" | "en";
type ComposerMode = "template" | "upload";
type BrandLogoPlacement = "TOP_RIGHT" | "TOP_LEFT" | "BOTTOM_RIGHT" | "BOTTOM_LEFT";

const moods = [
    { id: "sunset", label: "Sauge", color: "#D7FF97", ink: "#55712E" },
    { id: "moss", label: "Atlas", color: "#B9D9B0", ink: "#244B37" },
    { id: "ochre", label: "Terre", color: "#E5CBB7", ink: "#6E412B" },
    { id: "mint", label: "Menthe", color: "#BDE8D8", ink: "#1B5E4F" },
    { id: "eclipse", label: "Nuit", color: "#191A18", ink: "#B9FF43" },
] as const;

const languages: { id: CaptionLang; label: string }[] = [
    { id: "darija", label: "Darija" }, { id: "fr", label: "Français" },
    { id: "ar", label: "العربية" }, { id: "en", label: "English" },
];

const brandLogoPlacements: { id: BrandLogoPlacement; label: string }[] = [
    { id: "TOP_RIGHT", label: "Haut droit" }, { id: "TOP_LEFT", label: "Haut gauche" },
    { id: "BOTTOM_RIGHT", label: "Bas droit" }, { id: "BOTTOM_LEFT", label: "Bas gauche" },
];

function logoFrame(position: BrandLogoPlacement) {
    const frames: Record<BrandLogoPlacement, { x: number; y: number }> = {
        TOP_RIGHT: { x: 755, y: 50 }, TOP_LEFT: { x: 55, y: 165 },
        BOTTOM_RIGHT: { x: 755, y: 580 }, BOTTOM_LEFT: { x: 55, y: 580 },
    };
    return { ...frames[position], width: 190, height: 90, padding: 12 };
}

function captionFor(post: Post, language: CaptionLang) {
    if (language === "fr") return post.captionFr;
    if (language === "ar") return post.captionAr;
    if (language === "en") return post.captionEn;
    return post.captionDarija;
}

export default function CreativeStudio({ products, onPostChange }: CreativeStudioProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [brand, setBrand] = useState<BrandSettings | null>(null);
    const [mode, setMode] = useState<ComposerMode>("template");
    const [format, setFormat] = useState<"SQUARE_POST" | "STORY">("SQUARE_POST");
    const [productId, setProductId] = useState("");
    const [templateId, setTemplateId] = useState("");
    const [moodId, setMoodId] = useState<(typeof moods)[number]["id"]>("sunset");
    const [promoText, setPromoText] = useState("OFFRE ÉDITION LIMITÉE");
    const [badgeText, setBadgeText] = useState("NOUVEAU");
    const [accentColor, setAccentColor] = useState("#B9FF43");
    const [includeBrandLogo, setIncludeBrandLogo] = useState(false);
    const [brandLogoPlacement, setBrandLogoPlacement] = useState<BrandLogoPlacement>("TOP_RIGHT");
    const [productQuery, setProductQuery] = useState("");
    const [productPickerOpen, setProductPickerOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [post, setPost] = useState<Post | null>(null);
    const [captionLanguage, setCaptionLanguage] = useState<CaptionLang>("darija");
    const [captionDraft, setCaptionDraft] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState<"render" | "upload" | "captions" | "approve" | "export" | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const approvedProducts = useMemo(() => products.filter((product) => product.status === "APPROVED"), [products]);
    const selectedProduct = approvedProducts.find((product) => product.id === productId) ?? approvedProducts[0] ?? null;
    const selectedMood = moods.find((mood) => mood.id === moodId) ?? moods[0];
    const activeTemplates = useMemo(() => templates.filter((template) => template.format === format), [templates, format]);
    const matchingProducts = useMemo(
        () => approvedProducts.filter((product) => product.name.toLowerCase().includes(productQuery.toLowerCase())),
        [approvedProducts, productQuery],
    );
    const previewImage = post?.imageUrl ?? (mode === "upload" ? uploadPreview : null);
    const configuredBrandName = brand?.configured && brand.name.trim() ? brand.name.trim() : null;
    const canAddBrandMark = Boolean(brand?.configured && (brand.logoUrl || configuredBrandName));
    const previewBrandFrame = logoFrame(brandLogoPlacement);

    useEffect(() => {
        void Promise.all([listTemplates(), getBrand()])
            .then(([nextTemplates, nextBrand]) => { setTemplates(nextTemplates); setBrand(nextBrand); })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : "Impossible de charger le poste de composition."));
    }, []);

    useEffect(() => {
        if (approvedProducts.length && !approvedProducts.some((product) => product.id === productId)) setProductId(approvedProducts[0].id);
    }, [approvedProducts, productId]);

    useEffect(() => {
        if (activeTemplates.length && !activeTemplates.some((template) => template.id === templateId)) setTemplateId(activeTemplates[0].id);
    }, [activeTemplates, templateId]);

    useEffect(() => { setProductQuery(selectedProduct?.name ?? ""); }, [selectedProduct?.id]);
    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (!pickerRef.current?.contains(event.target as Node)) { setProductPickerOpen(false); setProductQuery(selectedProduct?.name ?? ""); }
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [selectedProduct?.name]);
    useEffect(() => () => { if (uploadPreview) URL.revokeObjectURL(uploadPreview); }, [uploadPreview]);
    useEffect(() => { setCaptionDraft(post ? captionFor(post, captionLanguage) ?? "" : ""); }, [post, captionLanguage]);

    const clearWorkingPost = () => { setPost(null); setError(null); };
    const chooseFile = (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) { setError("Ajoutez une image PNG, JPG, WebP ou SVG."); return; }
        if (file.size > 15 * 1024 * 1024) { setError("L’image dépasse la limite de 15 Mo."); return; }
        if (uploadPreview) URL.revokeObjectURL(uploadPreview);
        setUploadedFile(file); setUploadPreview(URL.createObjectURL(file)); clearWorkingPost();
    };

    const renderTemplate = async () => {
        if (!selectedProduct || !templateId) return;
        setBusy("render"); setError(null);
        try {
            const result = await generateImage({ productId: selectedProduct.id, templateId, promoText, badgeText, accentColor, mood: moodId, includeBrandLogo: includeBrandLogo && canAddBrandMark, brandLogoPlacement });
            setPost(result); onPostChange?.();
        } catch (err) { setError(err instanceof Error ? err.message : "Le rendu local n’a pas abouti."); }
        finally { setBusy(null); }
    };

    const saveUploadedPost = async () => {
        if (!selectedProduct || !templateId || !uploadedFile) return;
        setBusy("upload"); setError(null);
        try {
            const result = await createBrowserVisualPost({ productId: selectedProduct.id, templateId, image: uploadedFile, promoText, badgeText });
            setPost(result); onPostChange?.();
        } catch (err) { setError(err instanceof Error ? err.message : "Impossible d’ajouter ce visuel à la bibliothèque."); }
        finally { setBusy(null); }
    };

    const createCaptions = async () => {
        if (!post) return;
        setBusy("captions"); setError(null);
        try { const result = await generateCaptions(post.id); setPost(result); onPostChange?.(); }
        catch (err) { setError(err instanceof Error ? err.message : "Impossible de rédiger les légendes."); }
        finally { setBusy(null); }
    };

    const saveCaption = async () => {
        if (!post) return;
        try { setPost(await editCaption(post.id, captionLanguage, captionDraft)); }
        catch (err) { setError(err instanceof Error ? err.message : "Impossible d’enregistrer cette légende."); }
    };

    const approve = async () => {
        if (!post) return;
        setBusy("approve"); setError(null);
        try { setPost(await approvePost(post.id)); onPostChange?.(); }
        catch (err) { setError(err instanceof Error ? err.message : "Impossible d’approuver ce post."); }
        finally { setBusy(null); }
    };

    const exportPostFile = async () => {
        if (!post) return;
        setBusy("export"); setError(null);
        try {
            const file = await exportPost(post.id); const url = URL.createObjectURL(file); const link = document.createElement("a");
            link.href = url; link.download = `studio-post-${post.id}.zip`; link.click(); URL.revokeObjectURL(url);
            setPost((current) => current ? { ...current, status: "EXPORTED" } : current); onPostChange?.();
        } catch (err) { setError(err instanceof Error ? err.message : "Impossible d’exporter ce post."); }
        finally { setBusy(null); }
    };

    const copyCaption = async () => {
        if (!captionDraft) return;
        await navigator.clipboard.writeText(captionDraft); setCopied(true); window.setTimeout(() => setCopied(false), 1800);
    };

    const ratioClass = format === "SQUARE_POST" ? "aspect-square" : "aspect-[9/16] max-h-[570px]";
    const canCreate = Boolean(selectedProduct && templateId && (mode === "template" || uploadedFile));

    return (
        <div className="space-y-7">
            <header className="flex flex-col gap-3 border-b border-[#d6d5cc] pb-5 md:flex-row md:items-end md:justify-between">
                <div><span className="studio-kicker studio-kicker--dark">POST COMPOSER / LOCAL</span><h2 className="mt-2 font-serif text-3xl tracking-tight text-[var(--studio-ink)]">Un produit. Un post. Votre contrôle.</h2><p className="mt-2 max-w-2xl text-sm text-[#6f7068]">Composez une mise en page SVG à partir du produit, ou ajoutez un visuel terminé. Chaque post reste éditable avant sa diffusion.</p></div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#68705d]"><span className="studio-status-dot studio-status-dot--lime" /> rendu local · sans clé API</div>
            </header>

            {error && <div className="studio-form-error" role="alert">{error}</div>}

            <div className="grid gap-7 xl:grid-cols-[minmax(280px,.78fr)_minmax(420px,1.2fr)_minmax(280px,.76fr)]">
                <section className="studio-creative-card h-fit">
                    <div className="studio-creative-card__head"><div className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-[#5f762a]" /><h3 className="text-sm font-black">La direction</h3></div><p>Choisissez les ingrédients, pas une boîte noire.</p></div>
                    <div className="studio-creative-card__body space-y-5">
                        <div className="grid grid-cols-2 gap-2 rounded-sm border border-[#d6d5cc] bg-[#f2f1eb] p-1">
                            <button type="button" onClick={() => { setMode("template"); clearWorkingPost(); }} className={`px-3 py-2 text-xs font-bold transition-colors ${mode === "template" ? "bg-[var(--studio-ink)] text-white" : "text-[#6f7068]"}`}>Composer</button>
                            <button type="button" onClick={() => { setMode("upload"); clearWorkingPost(); }} className={`px-3 py-2 text-xs font-bold transition-colors ${mode === "upload" ? "bg-[var(--studio-ink)] text-white" : "text-[#6f7068]"}`}>Importer</button>
                        </div>

                        <div ref={pickerRef} className="relative space-y-1.5"><label className="text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Produit approuvé</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91918b]" /><input value={productQuery} onFocus={() => setProductPickerOpen(true)} onChange={(event) => { setProductQuery(event.target.value); setProductPickerOpen(true); }} placeholder="Rechercher un produit" className="w-full border border-[#bdbdb4] bg-[#faf9f4] py-2 pl-9 pr-3 text-sm font-medium outline-none focus:border-[var(--studio-lime)]" /></div>{productPickerOpen && <div className="absolute z-20 mt-1 max-h-52 w-full overflow-auto border border-[var(--studio-ink)] bg-[var(--studio-paper)] shadow-[6px_6px_0_rgba(17,17,15,.12)]">{matchingProducts.map((product) => <button key={product.id} type="button" onMouseDown={(event) => { event.preventDefault(); setProductId(product.id); setProductQuery(product.name); setProductPickerOpen(false); clearWorkingPost(); }} className={`flex w-full items-center justify-between border-b border-[#e3e2da] px-3 py-2.5 text-left text-xs font-bold hover:bg-[#f1f0e9] ${product.id === selectedProduct?.id ? "bg-[#edf7d4] text-[#426421]" : ""}`}><span>{product.name}</span>{product.price != null && <small>{product.price.toFixed(2)} MAD</small>}</button>)}{!matchingProducts.length && <p className="px-3 py-3 text-xs text-[#777870]">Aucun produit approuvé.</p>}</div>}</div>

                        <div><span className="text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Format</span><div className="mt-2 grid grid-cols-2 gap-2">{([ ["SQUARE_POST", "Post 1:1"], ["STORY", "Story 9:16"] ] as const).map(([value, label]) => <button key={value} type="button" onClick={() => { setFormat(value); clearWorkingPost(); }} className={`border px-3 py-2 text-left text-xs font-bold ${format === value ? "border-[#7c9b4d] bg-[#eef7da] text-[#426421]" : "border-[#c5c4bb] bg-[#faf9f4] text-[#777870]"}`}>{label}</button>)}</div></div>

                        <div><span className="text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Template</span><div className="mt-2 grid grid-cols-2 gap-2">{activeTemplates.map((template) => <button key={template.id} type="button" onClick={() => { setTemplateId(template.id); clearWorkingPost(); }} className={`group relative min-h-20 overflow-hidden border p-2 text-left text-xs font-bold ${templateId === template.id ? "border-[#7c9b4d] bg-[#eef7da] text-[#426421]" : "border-[#c5c4bb] bg-[#faf9f4] text-[#777870]"}`}>{template.thumbnailUrl && <img src={template.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 group-hover:opacity-30" />}<span className="relative">{template.name}</span></button>)}</div>{!activeTemplates.length && <p className="mt-2 text-xs text-[#777870]">Aucun template pour ce format.</p>}</div>

                        {mode === "template" ? <>
                            <div><span className="text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Atmosphère</span><div className="mt-2 flex flex-wrap gap-2">{moods.map((mood) => <button key={mood.id} type="button" onClick={() => { setMoodId(mood.id); clearWorkingPost(); }} title={mood.label} className={`h-8 w-8 border transition-transform ${moodId === mood.id ? "scale-110 border-[var(--studio-ink)]" : "border-[#c5c4bb]"}`} style={{ backgroundColor: mood.color }} />)}</div></div>
                            <div className="space-y-3 border-t border-[#deddd5] pt-4"><label className="block text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Titre de l’offre<input value={promoText} onChange={(event) => { setPromoText(event.target.value.toUpperCase()); clearWorkingPost(); }} className="mt-1.5 w-full border border-[#bdbdb4] bg-[#faf9f4] px-3 py-2 text-sm font-medium outline-none focus:border-[var(--studio-lime)]" /></label><label className="block text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Badge<input value={badgeText} onChange={(event) => { setBadgeText(event.target.value.toUpperCase()); clearWorkingPost(); }} className="mt-1.5 w-full border border-[#bdbdb4] bg-[#faf9f4] px-3 py-2 text-sm font-medium outline-none focus:border-[var(--studio-lime)]" /></label><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Accent</span><input type="color" value={accentColor} onChange={(event) => { setAccentColor(event.target.value); clearWorkingPost(); }} className="h-8 w-10 cursor-pointer border border-[var(--studio-ink)] bg-[#faf9f4] p-0.5" /></div>{canAddBrandMark ? <div className="space-y-3 border-t border-[#deddd5] pt-3"><label className="flex cursor-pointer items-center justify-between gap-3 text-xs font-semibold text-[#4f504a]"><span className="flex items-center gap-2"><Stamp className="h-3.5 w-3.5 text-[#5f762a]" />Ajouter {brand?.logoUrl ? "le logo" : "la signature"} de {configuredBrandName}</span><input type="checkbox" checked={includeBrandLogo} onChange={(event) => { setIncludeBrandLogo(event.target.checked); clearWorkingPost(); }} className="accent-[#5f762a]" /></label>{includeBrandLogo && <div><span className="text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Placement du logo</span><div className="mt-2 grid grid-cols-2 gap-1.5">{brandLogoPlacements.map((placement) => <button key={placement.id} type="button" onClick={() => { setBrandLogoPlacement(placement.id); clearWorkingPost(); }} className={`border px-2 py-1.5 text-[10px] font-bold transition-colors ${brandLogoPlacement === placement.id ? "border-[#7c9b4d] bg-[#eef7da] text-[#426421]" : "border-[#c5c4bb] bg-[#faf9f4] text-[#777870]"}`}>{placement.label}</button>)}</div><p className="mt-2 text-[10px] leading-relaxed text-[#777870]">Le logo est posé sur un cartouche doux pour préserver sa lisibilité.</p></div>}</div> : <p className="border-t border-[#deddd5] pt-3 text-[11px] leading-relaxed text-[#777870]">Ajoutez votre logo dans Brand avant de l’intégrer à un post.</p>}</div>
                        </> : <div className="space-y-3 border-t border-[#deddd5] pt-4"><input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} /><button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center gap-2 border border-dashed border-[#7c9b4d] bg-[#f4fae8] px-5 py-7 text-center transition-colors hover:bg-[#ecf7d4]"><UploadCloud className="h-5 w-5 text-[#547e2e]" /><span className="text-xs font-black text-[#426421]">{uploadedFile ? uploadedFile.name : "Choisir votre visuel final"}</span><span className="text-[10px] text-[#6f7068]">PNG, JPG, WebP ou SVG · 15 Mo maximum</span></button><p className="text-[11px] leading-relaxed text-[#777870]">Le visuel reste le vôtre. STUDIO l’associe au produit choisi pour conserver les légendes, l’approbation, l’export et la planification au même endroit.</p></div>}
                    </div>
                </section>

                <section className="space-y-4"><div className={`relative mx-auto flex w-full max-w-[560px] items-center justify-center overflow-hidden border border-[var(--studio-ink)] bg-[#1a1b18] p-3 shadow-[10px_10px_0_rgba(17,17,15,.14)] ${ratioClass}`}><div className="absolute left-5 top-5 z-10 flex items-center gap-2 bg-[#faf9f4]/90 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-[#5f6258]"><Eye className="h-3 w-3" />{previewImage ? (post?.generationMode === "BROWSER_GENERATED" ? "visuel importé" : "rendu enregistré") : "aperçu SVG"}</div>{previewImage ? <img src={previewImage} alt="Aperçu du post" className="h-full w-full object-contain" /> : <svg viewBox="0 0 1000 1000" className="h-full w-full" role="img" aria-label="Aperçu SVG du post"><rect width="1000" height="1000" fill={selectedMood.id === "eclipse" ? "#141512" : "#F4F1E8"} /><circle cx="790" cy="220" r="270" fill={selectedMood.color} opacity=".55" /><rect x="56" y="62" width="310" height="75" fill={accentColor} /><text x="80" y="110" fill="#10110f" fontSize="30" fontWeight="800" letterSpacing="4">{badgeText || "NOUVEAU"}</text>{includeBrandLogo && canAddBrandMark ? <g><rect x={previewBrandFrame.x} y={previewBrandFrame.y} width={previewBrandFrame.width} height={previewBrandFrame.height} rx="16" fill="#F5F1E8" opacity=".9" />{brand?.logoUrl ? <image href={brand.logoUrl} x={previewBrandFrame.x + previewBrandFrame.padding} y={previewBrandFrame.y + previewBrandFrame.padding} width={previewBrandFrame.width - previewBrandFrame.padding * 2} height={previewBrandFrame.height - previewBrandFrame.padding * 2} preserveAspectRatio="xMidYMid meet" /> : configuredBrandName ? <text x={previewBrandFrame.x + previewBrandFrame.width / 2} y={previewBrandFrame.y + 53} textAnchor="middle" fill="#11120f" fontSize="22" fontWeight="700" letterSpacing="2">{configuredBrandName}</text> : null}</g> : null}{selectedProduct?.imageUrl ? <image href={selectedProduct.imageUrl} x="180" y="175" width="640" height="460" preserveAspectRatio="xMidYMid meet" /> : <rect x="260" y="220" width="480" height="360" rx="40" fill="#c9c7bb" opacity=".55" />}<rect x="0" y="700" width="1000" height="300" fill="#11120f" opacity=".92" /><text x="70" y="800" fill="#F5F1E8" fontSize="62" fontWeight="800">{selectedProduct?.name || "VOTRE PRODUIT"}</text><text x="70" y="865" fill={accentColor} fontSize="30" fontWeight="700">{promoText || "Votre prochaine direction"}</text><text x="70" y="940" fill="#bdbdb4" fontSize="19" letterSpacing="3">LOCAL SVG TEMPLATE COMPOSITION</text></svg>}</div><div className="flex flex-col justify-between gap-3 border border-[#d6d5cc] bg-[#f5f4ee] p-4 sm:flex-row sm:items-center"><div><p className="text-xs font-black text-[var(--studio-ink)]">{mode === "template" ? "Mise en page locale prête à rendre" : uploadedFile ? "Visuel prêt à intégrer" : "Ajoutez le fichier final"}</p><p className="mt-1 text-[11px] text-[#777870]">{mode === "template" ? "Le PNG est rendu localement à partir de cette direction." : "Aucune retouche n’est appliquée à votre fichier."}</p></div><button type="button" disabled={!canCreate || busy !== null} onClick={() => void (mode === "template" ? renderTemplate() : saveUploadedPost())} className="studio-button studio-button--lime whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50">{busy === "render" || busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "template" ? <Sparkles className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}{busy === "render" ? "Rendu…" : busy === "upload" ? "Ajout…" : mode === "template" ? "Rendre le post" : "Ajouter au studio"}</button></div></section>

                <section className="space-y-5"><div className="studio-creative-card"><div className="studio-creative-card__head"><div className="flex items-center gap-2"><Palette className="h-4 w-4 text-[#5f762a]" /><h3 className="text-sm font-black">Légende</h3></div><p>Un texte par langue, toujours modifiable.</p></div><div className="studio-creative-card__body"><div className="mb-3 flex flex-wrap gap-1" role="tablist">{languages.map((language) => <button key={language.id} type="button" role="tab" aria-selected={captionLanguage === language.id} onClick={() => setCaptionLanguage(language.id)} className={`px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide ${captionLanguage === language.id ? "bg-[var(--studio-ink)] text-white" : "bg-[#eeede6] text-[#777870]"}`}>{language.label}</button>)}</div><textarea value={captionDraft} onChange={(event) => setCaptionDraft(event.target.value)} onBlur={() => void saveCaption()} disabled={!post} placeholder={post ? "La légende apparaîtra ici." : "Créez ou importez d’abord un post."} className="min-h-48 w-full resize-none border border-[#bdbdb4] bg-[#faf9f4] p-3 text-sm leading-relaxed outline-none focus:border-[var(--studio-lime)] disabled:opacity-50" /><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => void createCaptions()} disabled={!post || busy !== null} className="studio-button studio-button--paper justify-center text-[11px] disabled:opacity-50">{busy === "captions" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Générer</button><button type="button" onClick={() => void copyCaption()} disabled={!captionDraft} className="studio-button studio-button--paper justify-center text-[11px] disabled:opacity-50">{copied ? <Check className="h-3.5 w-3.5 text-[#5f762a]" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copié" : "Copier"}</button></div></div></div><div className="border border-[#d6d5cc] bg-[#1a1b18] p-4 text-[#f5f1e8]"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center bg-[var(--studio-lime)] text-[#11120f]"><CheckCircle2 className="h-4 w-4" /></span><div><p className="text-xs font-black">{post ? `Statut : ${post.status}` : "Post en préparation"}</p><p className="mt-1 text-[11px] leading-relaxed text-[#c4c4bd]">Approuvez une fois le visuel et la légende relus. Il apparaîtra ensuite dans l’espace Social pour choisir un canal et une heure de diffusion.</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => void approve()} disabled={!post || post.status !== "DRAFT" || busy !== null} className="studio-button studio-button--paper justify-center text-[11px] disabled:opacity-40">{busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}Approuver</button><button type="button" onClick={() => void exportPostFile()} disabled={!post || busy !== null} className="studio-button studio-button--lime justify-center text-[11px] disabled:opacity-40">{busy === "export" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}Exporter</button></div></div></section>
            </div>

            {!approvedProducts.length && <div className="studio-unavailable"><span className="studio-kicker studio-kicker--dark">SOURCE REQUIRED</span><h3>Ajoutez puis approuvez un produit.</h3><p>Le produit crée le lien entre votre visuel, votre copywriting, votre export et sa diffusion programmée.</p></div>}
        </div>
    );
}
