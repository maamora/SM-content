"use client";

import React, { useState } from "react";
import { DownloadGenerator } from "@/lib/social/downloadGenerator";
import { Loader2, Download, Sparkles, Copy, Check } from "lucide-react";
import { type SocialParams } from "@/lib/social/promptBuilder";

export default function SocialGenerator() {
    const [params, setParams] = useState<SocialParams>({
        businessName: "",
        industry: "",
        productService: "",
        campaignObjective: "",
        targetAudience: "",
        platform: "Instagram",
        toneOfVoice: "",
        offerCta: "",
        keywords: "",
        brandValues: "",
        additionalInstructions: "",
        language: "Français",
        desiredLength: "Moyen",
    });

    const [generatedText, setGeneratedText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setParams({ ...params, [e.target.name]: e.target.value });
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setGeneratedText("");
        setErrorMsg(null);
        setCopied(false);

        try {
            const res = await fetch("/api/social/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate post");
            }

            setGeneratedText(data.result);
        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!generatedText) return;
        DownloadGenerator.downloadFile(generatedText, params.platform);
    };

    const handleCopy = () => {
        if (!generatedText) return;
        navigator.clipboard.writeText(generatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const inputCls = "w-full rounded-xl border-2 border-stone-900 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:ring-2 focus-visible:ring-[#F47315] focus-visible:outline-none transition-all font-medium";
    const labelCls = "text-[10px] font-black uppercase tracking-wider text-stone-500 block mb-1.5";

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Form Left Side */}
            <div className="bg-white border-3 border-stone-900 rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-xl font-black text-stone-900 font-serif flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#F47315]" />
                        Générateur Multicritères
                    </h2>
                    <p className="text-xs text-stone-500 mt-1 font-medium">
                        Remplissez les informations ci-dessous pour générer un texte adapté et original.
                    </p>
                </div>

                <form onSubmit={handleGenerate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Business Name</label>
                            <input name="businessName" value={params.businessName} onChange={handleChange} className={inputCls} placeholder="Ex: Maamora" />
                        </div>
                        <div>
                            <label className={labelCls}>Industry</label>
                            <input name="industry" value={params.industry} onChange={handleChange} className={inputCls} placeholder="Ex: Cosmetics" />
                        </div>
                        <div>
                            <label className={labelCls}>Product or Service</label>
                            <input name="productService" value={params.productService} onChange={handleChange} className={inputCls} placeholder="Ex: Huile d'Argan" />
                        </div>
                        <div>
                            <label className={labelCls}>Campaign Objective</label>
                            <input name="campaignObjective" value={params.campaignObjective} onChange={handleChange} className={inputCls} placeholder="Ex: Notoriété, Ventes" />
                        </div>
                        <div>
                            <label className={labelCls}>Target Audience</label>
                            <input name="targetAudience" value={params.targetAudience} onChange={handleChange} className={inputCls} placeholder="Ex: Femmes 25-45 ans" />
                        </div>
                        <div>
                            <label className={labelCls}>Platform</label>
                            <select name="platform" value={params.platform} onChange={handleChange} className={inputCls}>
                                <option value="Instagram">Instagram</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Facebook">Facebook</option>
                                <option value="X">X (Twitter)</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Tone of Voice</label>
                            <input name="toneOfVoice" value={params.toneOfVoice} onChange={handleChange} className={inputCls} placeholder="Ex: Professionnel, Amical" />
                        </div>
                        <div>
                            <label className={labelCls}>Offer or CTA</label>
                            <input name="offerCta" value={params.offerCta} onChange={handleChange} className={inputCls} placeholder="Ex: -15% avec le code PROMO" />
                        </div>
                        <div>
                            <label className={labelCls}>Keywords</label>
                            <input name="keywords" value={params.keywords} onChange={handleChange} className={inputCls} placeholder="Ex: naturel, bio, maroc" />
                        </div>
                        <div>
                            <label className={labelCls}>Brand Values</label>
                            <input name="brandValues" value={params.brandValues} onChange={handleChange} className={inputCls} placeholder="Ex: Authenticité, Qualité" />
                        </div>
                        <div>
                            <label className={labelCls}>Language</label>
                            <input name="language" value={params.language} onChange={handleChange} className={inputCls} placeholder="Ex: Français, Darija" />
                        </div>
                        <div>
                            <label className={labelCls}>Desired Length</label>
                            <input name="desiredLength" value={params.desiredLength} onChange={handleChange} className={inputCls} placeholder="Ex: Court, Moyen, Long" />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Additional Instructions</label>
                        <textarea name="additionalInstructions" value={params.additionalInstructions} onChange={handleChange} className={inputCls} rows={2} placeholder="Ex: Ne pas mentionner le prix" />
                    </div>

                    <button
                        type="submit"
                        disabled={isGenerating}
                        className="w-full mt-4 h-12 text-sm font-extrabold rounded-xl bg-[#F47315] hover:bg-[#ff852e] text-white border-b-2 border-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,1)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                        {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                        {isGenerating ? "Génération..." : "Générer le post"}
                    </button>
                </form>
            </div>

            {/* Result Right Side */}
            <div className="flex flex-col h-full bg-[#fcfaf8] border-3 border-stone-900 rounded-3xl p-6 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]">
                <h3 className="text-sm font-black uppercase tracking-widest text-stone-700 flex items-center gap-1.5 mb-4">
                    <Sparkles className="h-4 w-4 text-[#F47315]" />
                    Résultat
                </h3>

                {errorMsg && (
                    <div className="mb-4 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-xs text-red-700 font-bold">
                        {errorMsg}
                    </div>
                )}

                <div className="relative flex-1 flex flex-col mb-4">
                    <textarea
                        aria-label="Generated social media post"
                        value={generatedText}
                        onChange={(e) => setGeneratedText(e.target.value)}
                        disabled={!generatedText && !isGenerating}
                        placeholder={isGenerating ? "" : "Le post généré par l'IA apparaîtra ici."}
                        className="w-full flex-1 flex-grow text-sm font-sans tracking-wide bg-white border-2 border-stone-900 rounded-xl text-stone-800 outline-none leading-relaxed resize-none p-4 focus-visible:ring-2 focus-visible:ring-[#F47315] disabled:opacity-60 min-h-[300px]"
                    />
                    {isGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
                            <Loader2 className="h-8 w-8 text-[#F47315] animate-spin" />
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleCopy}
                        disabled={!generatedText}
                        className="flex-1 h-11 text-xs font-extrabold rounded-xl border-2 border-stone-900 bg-white hover:bg-stone-50 text-stone-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copié !" : "Copier le texte"}
                    </button>

                    <button
                        onClick={handleDownload}
                        disabled={!generatedText}
                        className="flex-1 h-11 text-xs font-extrabold rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-[3px_3px_0px_0px_rgba(244,115,21,1)] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Télécharger (.TXT)
                    </button>
                </div>
            </div>
        </div>
    );
}
