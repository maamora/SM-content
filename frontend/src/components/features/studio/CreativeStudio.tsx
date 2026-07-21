"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { listTemplates, type Template } from "@/lib/api/templates";
import { generateImage, generateCaptions, editCaption, approvePost, exportPost, type Post } from "@/lib/api/posts";

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
}

type CaptionLang = "fr" | "ar" | "darija" | "en";

export default function CreativeStudio({ products }: CreativeStudioProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [selectedFormat, setSelectedFormat] = useState<"SQUARE_POST" | "STORY">("SQUARE_POST");
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [promoText, setPromoText] = useState<string>("OFFRE SPÉCIALE !");
    const [accentColor, setAccentColor] = useState<string>("#f97316");
    const [badgeText, setBadgeText] = useState<string>("-20% TODAY");

    const [post, setPost] = useState<Post | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [activeCaptionLang, setActiveCaptionLang] = useState<CaptionLang>("darija");
    const [draftCaption, setDraftCaption] = useState<string>("");
    const [copiedLang, setCopiedLang] = useState<string | null>(null);

    const approvedProducts = useMemo(() => products.filter((p) => p.status === "APPROVED"), [products]);
    const pendingCount = products.length - approvedProducts.length;

    const selectedProduct = approvedProducts.find((p) => p.id === selectedProductId) || approvedProducts[0];

    useEffect(() => {
        listTemplates()
            .then(setTemplates)
            .catch((err) => setErrorMsg(err instanceof Error ? err.message : "Failed to load templates"));
    }, []);

    useEffect(() => {
        if (approvedProducts.length > 0 && !approvedProducts.some((p) => p.id === selectedProductId)) {
            setSelectedProductId(approvedProducts[0].id);
        }
    }, [approvedProducts, selectedProductId]);

    const templatesForFormat = useMemo(
        () => templates.filter((t) => t.format === selectedFormat),
        [templates, selectedFormat]
    );

    useEffect(() => {
        if (templatesForFormat.length === 0) return;
        if (!templatesForFormat.some((t) => t.id === selectedTemplateId)) {
            setSelectedTemplateId(templatesForFormat[0].id);
        }
    }, [templatesForFormat, selectedTemplateId]);

    // Reset the working post whenever the underlying inputs change — an existing
    // post no longer reflects the current parameters once they're edited.
    useEffect(() => {
        setPost(null);
    }, [selectedProductId, selectedTemplateId, promoText, accentColor, badgeText]);

    useEffect(() => {
        setDraftCaption(post ? captionFor(post, activeCaptionLang) ?? "" : "");
    }, [post, activeCaptionLang]);

    function captionFor(p: Post, lang: CaptionLang): string | null {
        if (lang === "fr") return p.captionFr;
        if (lang === "ar") return p.captionAr;
        if (lang === "en") return p.captionEn;
        return p.captionDarija;
    }

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

    return (
        <div className="space-y-8 select-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-orange-500 fill-orange-500/20" />
                        Content Generator Workspace
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1">
                        Render a branded creative, generate multilingual captions, then approve and export.
                    </p>
                </div>
            </div>

            {errorMsg && (
                <div className="rounded-lg border border-red-950/50 bg-red-950/10 px-4 py-2.5 text-xs text-red-400">
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8">

                {/* left column config panel */}
                <div className="space-y-6">
                    <Card className="border-zinc-900 bg-zinc-950/20">
                        <CardHeader className="pb-3 px-5 pt-5">
                            <CardTitle className="text-sm font-semibold tracking-tight text-zinc-300 flex items-center gap-2">
                                <Sliders className="h-4 w-4 text-orange-400" />
                                Parameters
                            </CardTitle>
                            <CardDescription className="text-xs text-zinc-500">
                                Setup elements for branding canvas placement
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 px-5 pb-5">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-400" htmlFor="product-select">Select Target Product</Label>
                                <select
                                    id="product-select"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    className="flex w-full rounded-md border border-zinc-900 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                >
                                    {approvedProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                {pendingCount > 0 && (
                                    <p className="text-[10px] text-zinc-500">
                                        {pendingCount} product{pendingCount > 1 ? "s" : ""} awaiting admin approval, hidden from this list.
                                    </p>
                                )}
                                {approvedProducts.length === 0 && (
                                    <p className="text-[11px] text-orange-400">
                                        No approved products yet — an admin needs to approve at least one before you can generate content.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-400">Export Aspect Ratio</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: "SQUARE_POST" as const, name: "Instagram Post", desc: "1:1 Square" },
                                        { id: "STORY" as const, name: "Story / Status", desc: "9:16 Vertical" },
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedFormat(f.id)}
                                            className={`flex flex-col text-left p-3 rounded-lg border-2 text-xs transition-all relative ${selectedFormat === f.id
                                                ? "border-orange-500/80 bg-orange-950/10 text-zinc-100"
                                                : "border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:border-zinc-800"
                                                }`}
                                        >
                                            <span className="font-semibold block">{f.name}</span>
                                            <span className="text-[10px] text-zinc-500 mt-0.5">{f.desc}</span>
                                            {selectedFormat === f.id && (
                                                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-400">Design Template</Label>
                                {templatesForFormat.length === 0 ? (
                                    <p className="text-[11px] text-zinc-600">No templates available for this format yet.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {templatesForFormat.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setSelectedTemplateId(t.id)}
                                                className={`px-3 py-2.5 rounded-md border text-xs text-left transition-all ${selectedTemplateId === t.id
                                                    ? "border-orange-500/30 bg-orange-500/10 text-orange-400 font-semibold"
                                                    : "border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200"
                                                    }`}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Separator className="bg-zinc-900 my-2" />

                            <div className="space-y-3.5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="promo-title" className="text-xs font-semibold text-zinc-400">Offer Title</Label>
                                    <Input
                                        id="promo-title"
                                        value={promoText}
                                        onChange={e => setPromoText(e.target.value.toUpperCase())}
                                        className="h-9 text-xs bg-zinc-950 border-zinc-900 text-zinc-200"
                                        placeholder="e.g. OFFRE SPÉCIALE"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="badge-text" className="text-xs font-semibold text-zinc-400">Badge Text</Label>
                                    <Input
                                        id="badge-text"
                                        value={badgeText}
                                        onChange={e => setBadgeText(e.target.value.toUpperCase())}
                                        className="h-9 text-xs bg-zinc-950 border-zinc-900 text-zinc-200"
                                        placeholder="e.g. -20% TODAY"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-zinc-400">Accent Tone Match</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="color"
                                            value={accentColor}
                                            onChange={e => setAccentColor(e.target.value)}
                                            className="w-12 h-9 p-1 bg-zinc-950 border-zinc-900 rounded-md cursor-pointer"
                                        />
                                        <span className="text-xs font-mono text-zinc-500 uppercase">{accentColor}</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerateImage}
                                disabled={isGeneratingImage || !selectedProduct || !selectedTemplateId}
                                className="w-full h-9 text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow shadow-orange-700/20"
                            >
                                {isGeneratingImage ? (
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                {isGeneratingImage ? "Rendering Creative..." : post ? "Regenerate Creative" : "Generate Creative"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right column: Preview and Copywriter */}
                <div className="space-y-8 min-w-0">

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,360px)] gap-6">

                        {/* Preview */}
                        <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-900 bg-zinc-950/10 min-h-[460px]">
                            <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-600 mb-4 flex items-center gap-1.5">
                                <Eye className="h-3 w-3 text-orange-500" />
                                Rendered Creative
                            </p>

                            {post?.imageUrl ? (
                                <img
                                    src={post.imageUrl}
                                    alt={selectedProduct ? `${selectedProduct.name} creative` : "Generated creative"}
                                    className={`border border-zinc-800 shadow-[0_4px_30px_rgba(0,0,0,0.4)] object-cover rounded-lg ${selectedFormat === "SQUARE_POST" ? "w-[300px] h-[300px]" : "w-[240px] h-[400px]"
                                        }`}
                                />
                            ) : (
                                <div className="text-xs text-zinc-500 font-mono text-center max-w-[220px]">
                                    {isGeneratingImage
                                        ? "Rendering your creative..."
                                        : "Set your parameters and click Generate Creative to render the image."}
                                </div>
                            )}
                        </div>

                        {/* Copywriter panel */}
                        <div className="space-y-4">
                            <Card className="border-zinc-900 bg-zinc-950/20">
                                <CardHeader className="pb-2.5 px-4 pt-4">
                                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                        <Languages className="h-4 w-4 text-orange-400" />
                                        Linguistic Copywriter
                                    </CardTitle>
                                    <CardDescription className="text-[11px] text-zinc-500">
                                        Generated by Claude, editable before export
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 px-4 pb-4">
                                    <div className="flex rounded-lg border border-zinc-900 bg-zinc-950 p-1">
                                        {[
                                            { id: "darija" as const, label: "Moroccan Darija" },
                                            { id: "fr" as const, label: "French" },
                                            { id: "ar" as const, label: "Arabic" },
                                            { id: "en" as const, label: "English" }
                                        ].map(lang => (
                                            <button
                                                key={lang.id}
                                                onClick={() => setActiveCaptionLang(lang.id)}
                                                className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-semibold transition-all ${activeCaptionLang === lang.id
                                                    ? "bg-zinc-900 text-orange-400"
                                                    : "text-zinc-500 hover:text-zinc-300"
                                                    }`}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="relative">
                                        <Textarea
                                            aria-label="Copywriter content text"
                                            value={draftCaption}
                                            onChange={(e) => setDraftCaption(e.target.value)}
                                            onBlur={handleSaveCaption}
                                            disabled={!post}
                                            placeholder={post ? "No caption generated for this language yet." : "Generate a creative first."}
                                            className="min-h-[190px] text-xs font-sans tracking-wide bg-zinc-950 border-zinc-900 text-zinc-200 outline-none leading-relaxed resize-none p-3.5 focus-visible:ring-1 focus-visible:ring-orange-500/20"
                                        />

                                        <div className="absolute bottom-2.5 right-2.5">
                                            <Button
                                                size="sm"
                                                onClick={handleCopyCaption}
                                                disabled={!draftCaption}
                                                className="h-8 text-[11px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 shadow-lg px-2.5 py-1"
                                            >
                                                {copiedLang === activeCaptionLang ? (
                                                    <>
                                                        <Check className="h-3 w-3 text-emerald-400 mr-1.5" />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-3 w-3 text-zinc-500 mr-1.5" />
                                                        Copy text
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleGenerateCaptions}
                                        disabled={isGeneratingCaptions || !post}
                                        className="w-full h-8 text-[11px] border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-100 text-zinc-400 transition-colors"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isGeneratingCaptions ? "animate-spin" : ""}`} />
                                        {isGeneratingCaptions ? "Generating Captions..." : "Generate All Captions"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                    </div>

                    {/* Approve / export actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between p-5 border border-zinc-900 bg-zinc-950/20 rounded-xl gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-orange-600/10 border border-orange-500/20 rounded-lg flex items-center justify-center text-orange-400">
                                <CheckCircle className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <span className="text-xs font-semibold text-zinc-300 block">
                                    {post ? `Status: ${post.status}` : "No creative yet"}
                                </span>
                                <span className="text-[10px] text-zinc-500">Approve before handing off for distribution</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                onClick={handleApprove}
                                disabled={!post || post.status !== "DRAFT" || isApproving}
                                className="flex-1 sm:flex-none bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-xs h-9 px-5"
                            >
                                {isApproving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                                {post?.status === "APPROVED" ? "Approved" : "Approve"}
                            </Button>

                            <Button
                                onClick={handleDownload}
                                disabled={!post || isExporting}
                                className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs h-9 px-6 shadow-lg shadow-orange-700/20 flex items-center gap-2"
                            >
                                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                Download (.ZIP)
                            </Button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
