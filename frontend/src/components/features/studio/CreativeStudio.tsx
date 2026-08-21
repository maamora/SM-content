"use client";

/* STUDIO POST ARTBOARD: dark editorial control room; every persisted visual, copy, brand, caption, and delivery control stays visible without a form-first layout. */
import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlignLeft, Check, CheckCircle2, Copy, Download, Eye, FileUp, Frame,
    ImagePlus, Layers3, Loader2, Palette, Search, Sparkles, Stamp, UploadCloud,
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

const brandLogoPlacements: { id: BrandLogoPlacement; label: string; grid: string }[] = [
    { id: "TOP_LEFT", label: "HG", grid: "haut gauche" }, { id: "TOP_RIGHT", label: "HD", grid: "haut droit" },
    { id: "BOTTOM_LEFT", label: "BG", grid: "bas gauche" }, { id: "BOTTOM_RIGHT", label: "BD", grid: "bas droit" },
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

function Label({ children }: { children: React.ReactNode }) {
    return <span className="text-[10px] font-black uppercase tracking-[.14em] text-[#92958b]">{children}</span>;
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
    const selectedTemplate = activeTemplates.find((template) => template.id === templateId) ?? null;
    const matchingProducts = useMemo(
        () => approvedProducts.filter((product) => product.name.toLowerCase().includes(productQuery.toLowerCase())),
        [approvedProducts, productQuery],
    );
    const previewImage = post?.imageUrl ?? (mode === "upload" ? uploadPreview : null);
    const configuredBrandName = brand?.configured && brand.name.trim() ? brand.name.trim() : null;
    const canAddBrandMark = Boolean(brand?.configured && (brand.logoUrl || configuredBrandName));
    const previewBrandFrame = logoFrame(brandLogoPlacement);
    const isStory = format === "STORY";

    useEffect(() => {
        void Promise.all([listTemplates(), getBrand()])
            .then(([nextTemplates, nextBrand]) => { setTemplates(nextTemplates); setBrand(nextBrand); })
            .catch(() => {
                // The parent workspace already owns backend readiness messaging. Keep this artboard usable as a neutral local preview while it reconnects.
            });
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
    const resetDirection = () => {
        setMoodId("sunset"); setPromoText("OFFRE ÉDITION LIMITÉE"); setBadgeText("NOUVEAU");
        setAccentColor("#B9FF43"); setIncludeBrandLogo(false); setBrandLogoPlacement("TOP_RIGHT"); clearWorkingPost();
    };
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
        try { const result = await createBrowserVisualPost({ productId: selectedProduct.id, templateId, image: uploadedFile, promoText, badgeText }); setPost(result); onPostChange?.(); }
        catch (err) { setError(err instanceof Error ? err.message : "Impossible d’ajouter ce visuel à la bibliothèque."); }
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

    const canCreate = Boolean(selectedProduct && templateId && (mode === "template" || uploadedFile));

    return (
        <div className="studio-artboard-shell">
            <header className="studio-artboard-header">
                <div>
                    <div className="flex items-center gap-2"><span className="studio-artboard-pulse" /><span className="text-[10px] font-black uppercase tracking-[.19em] text-[#c6ff5e]">Post control room / 01</span></div>
                    <h2>Shape the post,<br /><em>not just the output.</em></h2>
                    <p>Construisez chaque détail — source, composition, marque, légende et validation — puis envoyez le post vers la planification.</p>
                </div>
                <div className="studio-artboard-header__meta">
                    <span>{format === "SQUARE_POST" ? "1080 × 1080" : "1080 × 1920"}</span>
                    <span>LOCAL SVG</span>
                    <button type="button" onClick={resetDirection} className="studio-artboard-reset">Réinitialiser la direction</button>
                </div>
            </header>

            {error && <div className="studio-artboard-error" role="alert">{error}</div>}

            <div className="studio-artboard-workspace">
                <aside className="studio-artboard-inspector" aria-label="Contrôles de composition">
                    <div className="studio-artboard-inspector__title"><div><Layers3 className="h-4 w-4" /><span>Composition</span></div><span>01—04</span></div>

                    <section className="studio-artboard-section">
                        <Label>Source du post</Label>
                        <div className="studio-artboard-segmented" role="tablist">
                            <button type="button" role="tab" aria-selected={mode === "template"} onClick={() => { setMode("template"); clearWorkingPost(); }}><Sparkles className="h-3.5 w-3.5" />Composer</button>
                            <button type="button" role="tab" aria-selected={mode === "upload"} onClick={() => { setMode("upload"); clearWorkingPost(); }}><UploadCloud className="h-3.5 w-3.5" />Importer</button>
                        </div>
                        <p className="studio-artboard-hint">{mode === "template" ? "Une composition locale issue de votre produit approuvé." : "Votre visuel final entre dans le même cycle de légende, validation et diffusion."}</p>
                    </section>

                    <section className="studio-artboard-section" ref={pickerRef}>
                        <div className="flex items-center justify-between"><Label>Produit</Label><span className="text-[10px] text-[#96998d]">obligatoire</span></div>
                        <div className="studio-artboard-product-search">
                            <Search className="h-4 w-4" />
                            <input value={productQuery} onFocus={() => setProductPickerOpen(true)} onChange={(event) => { setProductQuery(event.target.value); setProductPickerOpen(true); }} placeholder="Rechercher un produit" />
                        </div>
                        {productPickerOpen && <div className="studio-artboard-product-menu">{matchingProducts.map((product) => <button key={product.id} type="button" onMouseDown={(event) => { event.preventDefault(); setProductId(product.id); setProductQuery(product.name); setProductPickerOpen(false); clearWorkingPost(); }}><span>{product.name}</span><small>{product.price != null ? `${product.price.toFixed(2)} MAD` : "produit"}</small></button>)}{!matchingProducts.length && <p>Aucun produit approuvé.</p>}</div>}
                    </section>

                    <section className="studio-artboard-section">
                        <div className="grid grid-cols-2 gap-2"><div><Label>Format</Label><div className="studio-artboard-choice-row mt-2"><button type="button" aria-pressed={format === "SQUARE_POST"} onClick={() => { setFormat("SQUARE_POST"); clearWorkingPost(); }}>1:1</button><button type="button" aria-pressed={format === "STORY"} onClick={() => { setFormat("STORY"); clearWorkingPost(); }}>9:16</button></div></div><div><Label>Template</Label><div className="studio-artboard-template-value mt-2"><Frame className="h-3.5 w-3.5" />{selectedTemplate?.name ?? "Direction locale"}</div></div></div>
                        <div className="mt-3 grid grid-cols-2 gap-2">{activeTemplates.map((template) => <button key={template.id} type="button" onClick={() => { setTemplateId(template.id); clearWorkingPost(); }} className="studio-artboard-template-tile" aria-pressed={templateId === template.id}><span className="absolute inset-0 opacity-20" style={template.thumbnailUrl ? { backgroundImage: `url(${template.thumbnailUrl})`, backgroundSize: "cover" } : undefined} /><span>{template.name}</span></button>)}</div>
                    </section>

                    {mode === "template" ? <>
                        <section className="studio-artboard-section">
                            <Label>Atmosphère & couleur</Label>
                            <div className="studio-artboard-moods">{moods.map((mood) => <button key={mood.id} type="button" aria-pressed={moodId === mood.id} onClick={() => { setMoodId(mood.id); clearWorkingPost(); }} title={mood.label} style={{ "--mood": mood.color } as React.CSSProperties}><span>{mood.label}</span></button>)}</div>
                            <div className="mt-3 flex items-center justify-between border-t border-[#2e302a] pt-3"><span className="text-xs font-semibold text-[#d9dbd1]">Signal couleur</span><label className="flex items-center gap-2 text-[10px] font-mono uppercase text-[#9c9f94]"><span>{accentColor}</span><input type="color" value={accentColor} onChange={(event) => { setAccentColor(event.target.value); clearWorkingPost(); }} /></label></div>
                        </section>
                        <section className="studio-artboard-section">
                            <Label>Texte dans le visuel</Label>
                            <label className="studio-artboard-field">Badge<input value={badgeText} maxLength={32} onChange={(event) => { setBadgeText(event.target.value.toUpperCase()); clearWorkingPost(); }} /></label>
                            <label className="studio-artboard-field">Message<input value={promoText} maxLength={80} onChange={(event) => { setPromoText(event.target.value.toUpperCase()); clearWorkingPost(); }} /></label>
                        </section>
                    </> : <section className="studio-artboard-section">
                        <Label>Votre visuel</Label>
                        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="studio-artboard-upload"><UploadCloud className="h-5 w-5" /><span>{uploadedFile ? uploadedFile.name : "Choisir un fichier"}</span><small>PNG, JPG, WebP ou SVG · 15 Mo</small></button>
                    </section>}
                </aside>

                <main className="studio-artboard-stage">
                    <div className="studio-artboard-stage__toolbar"><div><Eye className="h-3.5 w-3.5" /><span>ARTBOARD / {isStory ? "STORY" : "POST"}</span></div><div><span className="studio-artboard-status-dot" />{post ? "Sauvegardé" : "Brouillon vivant"}</div></div>
                    <div className={`studio-artboard-canvas ${isStory ? "studio-artboard-canvas--story" : ""}`}>
                        <div className="studio-artboard-canvas__ruler studio-artboard-canvas__ruler--top" /><div className="studio-artboard-canvas__ruler studio-artboard-canvas__ruler--side" />
                        <div className="studio-artboard-canvas__paper">
                            {previewImage ? <img src={previewImage} alt="Aperçu du post" /> : <svg viewBox="0 0 1000 1000" role="img" aria-label="Aperçu SVG du post"><rect width="1000" height="1000" fill={selectedMood.id === "eclipse" ? "#141512" : "#F4F1E8"} /><circle cx="790" cy="220" r="270" fill={selectedMood.color} opacity=".55" /><rect x="56" y="62" width="310" height="75" fill={accentColor} /><text x="80" y="110" fill="#10110f" fontSize="30" fontWeight="800" letterSpacing="4">{badgeText || "NOUVEAU"}</text>{includeBrandLogo && canAddBrandMark ? <g><rect x={previewBrandFrame.x} y={previewBrandFrame.y} width={previewBrandFrame.width} height={previewBrandFrame.height} rx="16" fill="#F5F1E8" opacity=".9" />{brand?.logoUrl ? <image href={brand.logoUrl} x={previewBrandFrame.x + previewBrandFrame.padding} y={previewBrandFrame.y + previewBrandFrame.padding} width={previewBrandFrame.width - previewBrandFrame.padding * 2} height={previewBrandFrame.height - previewBrandFrame.padding * 2} preserveAspectRatio="xMidYMid meet" /> : configuredBrandName ? <text x={previewBrandFrame.x + previewBrandFrame.width / 2} y={previewBrandFrame.y + 53} textAnchor="middle" fill="#11120f" fontSize="22" fontWeight="700" letterSpacing="2">{configuredBrandName}</text> : null}</g> : null}{selectedProduct?.imageUrl ? <image href={selectedProduct.imageUrl} x="180" y="175" width="640" height="460" preserveAspectRatio="xMidYMid meet" /> : <rect x="260" y="220" width="480" height="360" rx="40" fill="#c9c7bb" opacity=".55" />}<rect x="0" y="700" width="1000" height="300" fill="#11120f" opacity=".92" /><text x="70" y="800" fill="#F5F1E8" fontSize="62" fontWeight="800">{selectedProduct?.name || "VOTRE PRODUIT"}</text><text x="70" y="865" fill={accentColor} fontSize="30" fontWeight="700">{promoText || "Votre prochaine direction"}</text><text x="70" y="940" fill="#bdbdb4" fontSize="19" letterSpacing="3">LOCAL SVG TEMPLATE COMPOSITION</text></svg>}
                        </div>
                    </div>
                    <div className="studio-artboard-renderbar"><div><span className="studio-artboard-renderbar__index">{mode === "template" ? "01" : "IMP"}</span><p><strong>{mode === "template" ? "Le rendu suivra cette direction." : uploadedFile ? "Le fichier est prêt à rejoindre la bibliothèque." : "Importez votre post final."}</strong><span>{mode === "template" ? "Les réglages de la colonne gauche s’appliquent au PNG local." : "Aucune retouche n’est appliquée à votre fichier."}</span></p></div><button type="button" disabled={!canCreate || busy !== null} onClick={() => void (mode === "template" ? renderTemplate() : saveUploadedPost())}>{busy === "render" || busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "template" ? <Sparkles className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}{busy === "render" ? "Rendu…" : busy === "upload" ? "Ajout…" : mode === "template" ? "Rendre le post" : "Ajouter au studio"}</button></div>
                </main>

                <aside className="studio-artboard-publish" aria-label="Contrôles de marque et publication">
                    <div className="studio-artboard-inspector__title"><div><AlignLeft className="h-4 w-4" /><span>Finition</span></div><span>04—04</span></div>
                    <section className="studio-artboard-section">
                        <div className="flex items-start justify-between gap-4"><div><Label>Marque</Label><p className="mt-1 text-xs leading-relaxed text-[#aeb0a7]">{canAddBrandMark ? "Ajoutez le logo enregistré dans Brand à cette direction." : "Aucune marque configurée. Le post restera neutre."}</p></div><Stamp className="mt-1 h-4 w-4 shrink-0 text-[#c6ff5e]" /></div>
                        {canAddBrandMark ? <><label className="studio-artboard-brand-toggle"><span><strong>{brand?.logoUrl ? "Inclure le logo" : "Inclure la signature"}</strong><small>{configuredBrandName}</small></span><input type="checkbox" checked={includeBrandLogo} onChange={(event) => { setIncludeBrandLogo(event.target.checked); clearWorkingPost(); }} /></label>{includeBrandLogo && <div className="mt-3"><Label>Placement du logo</Label><div className="studio-artboard-logo-grid">{brandLogoPlacements.map((placement) => <button key={placement.id} type="button" title={placement.grid} aria-pressed={brandLogoPlacement === placement.id} onClick={() => { setBrandLogoPlacement(placement.id); clearWorkingPost(); }}><span className={`studio-artboard-logo-grid__marker studio-artboard-logo-grid__marker--${placement.id.toLowerCase().replace("_", "-")}`} />{placement.label}</button>)}</div></div>}</> : <div className="studio-artboard-empty-brand"><Stamp className="h-4 w-4" /><span>Configurer dans Brand</span></div>}
                    </section>

                    <section className="studio-artboard-section">
                        <div className="flex items-center justify-between"><Label>Légende</Label><span className="text-[10px] font-mono text-[#9c9f94]">{captionDraft.length} car.</span></div>
                        <div className="studio-artboard-language-tabs" role="tablist">{languages.map((language) => <button key={language.id} type="button" role="tab" aria-selected={captionLanguage === language.id} onClick={() => setCaptionLanguage(language.id)}>{language.label}</button>)}</div>
                        <textarea value={captionDraft} onChange={(event) => setCaptionDraft(event.target.value)} onBlur={() => void saveCaption()} disabled={!post} placeholder={post ? "Rédigez la légende de ce post." : "Rendez ou importez le post pour écrire sa légende."} />
                        <div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => void createCaptions()} disabled={!post || busy !== null} className="studio-artboard-secondary">{busy === "captions" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Générer</button><button type="button" onClick={() => void copyCaption()} disabled={!captionDraft} className="studio-artboard-secondary">{copied ? <Check className="h-3.5 w-3.5 text-[#c6ff5e]" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copié" : "Copier"}</button></div>
                    </section>

                    <section className="studio-artboard-delivery">
                        <div className="studio-artboard-delivery__status"><span><CheckCircle2 className="h-4 w-4" /></span><div><Label>Prêt pour diffusion</Label><strong>{post ? `Statut : ${post.status}` : "En préparation"}</strong></div></div>
                        <p>Validez l’image et la légende. Le post pourra ensuite rejoindre Social pour choisir un canal et une heure de diffusion.</p>
                        <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => void approve()} disabled={!post || post.status !== "DRAFT" || busy !== null} className="studio-artboard-secondary">{busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}Valider</button><button type="button" onClick={() => void exportPostFile()} disabled={!post || busy !== null} className="studio-artboard-export">{busy === "export" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}Exporter</button></div>
                    </section>
                </aside>
            </div>

            {!approvedProducts.length && <div className="studio-artboard-empty"><ImagePlus className="h-5 w-5" /><div><strong>Ajoutez puis approuvez un produit.</strong><p>Le produit relie la composition, le contenu, l’export et la diffusion programmée.</p></div></div>}
        </div>
    );
}
