"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Sparkles,
    Copy,
    Check,
    Download,
    Layers,
    RefreshCw,
    Languages,
    FileText,
    Sliders,
    CheckCircle,
    Eye
} from "lucide-react";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number | null;
    imageUrl: string | null;
}

interface CreativeStudioProps {
    products: Product[];
}

const CAPTION_TEMPLATES: Record<string, { fr: string; ar: string; darija: string }> = {
    shoes: {
        fr: "👟 Prêt à booster vos entraînements ? \n\nDécouvrez nos nouvelles chaussures conçues pour offrir un confort ultime et des performances durables sur toutes les distances.\n\n✨ Matière ultra-respirante\n🔒 Maintien renforcé\n🚀 Semelle ultra-réactive\n\nCommandez dès maintenant via le lien en bio ! #Maamora #RunningMorocco #SportLife",
        ar: "👟 مستعد تحقق أهدافك الرياضية الجديدة؟\n\nحذاء الجري الاحترافي كيوفر ليك الراحة الكاملة والمرونة اللي كتحتاجها في كل خطوة لمسافات طويلة.\n\n✨ نسيج مهوى ومريح\n🔒 ثبات ودعم متكامل\n🚀 نعل رياضي مضاد للصدمات\n\nاطلبوه دابا بالضغط على الرابط في البايو! #مغاربة #رياضة",
        darija: "👟 بغيتي تجري بلا عيا وبلا ما تضرك رجلك؟\n\nهاد الصباط مصاوب ليك كثر من داكشي كتخيل! خفيف، صحيح وكيعاونك تزيد القدام في لونطريContinuous ديالك.\n\n✅ مريح بزاف ورطب\n✅ كيشد الرجل مزيان وسيرتو فالجري\n✅ جودة عالية ودوم ليك بزاف\n\nخلي ميساج دابا باش يوصلك حتى لباب الدار! التوصيل فابور 📦 #المغرب #سبور #مغربي"
    },
    mat: {
        fr: "🧘‍♀️ Trouvez votre équilibre intérieur.\n\nNotre tapis de yoga premium de 6mm vous garantit un confort et une adhérence inégalés pour toutes vos postures de yoga, fitness et Pilates.\n\n🍃 Matériau antidérapant et écologique\n📏 Guide d'alignement corporel intégré\n🎒 Sangle de transport incluse\n\nVisitez notre site pour commander le vôtre ! #YogaMaroc #Pilates #FitnessMorocco",
        ar: "🧘‍♀️ توازنك الداخلي كيبدا من الأدوات ديالك.\n\nسجادة اليوغا المتميزة بسمك 6 مم كتضمن ليك ثبات كامل وراحة مفاصل مثالية أثناء الحركات والتأمل.\n\n🍃 مادة مضادة للانزلاق وصديقة للبيئة\n📏 خطوط توجيهية مدمجة لضبط الحركات\n🎒 حبل حمل عملي هدية\n\nالطلب متوفر الآن! الرابط في البايو. #يوغا #المغرب #صحة",
        darija: "🧘‍♀️ باغا تديري اليوغا ولا سبور فالدار وكتزلقي فالطابي القديمة؟\n\nنساي كاع هاد المشاكل مع هاد الطابي البروفيسيونال! لاصقة فالأرض ما تخلّيكش تطيحي، وغليظة شوية باش تحمي مفاصل ديالك.\n\n✅ ما كتشربش العرق وسهلة فالغسيل\n✅ فيها خطوط باش تقادي الوقفة ديالك مزيان\n✅ كتجي معاها صمطة فابور باش تهزيها فين ما مشيتي\n\nكوموندي ديالك دابا وخلي حصتك الجاية تكون مريحة كثر! ✨ #المغرب #رياضة_نسائية #صحة"
    },
    earbuds: {
        fr: "🎵 Votre musique, sans compromis.\n\nPlongez au cœur du son avec ces écouteurs sport étanches IPX5. Réduction active du bruit et autonomie record de 32 heures avec le boîtier de charge.\n\n🔊 Basses profondes HD\n🔋 Autonomie de 32 heures\n💦 Résistant à la sueur et à la pluie\n\nStock limité disponible ! Commandez le vôtre immédiatement. #Musique #HighTechMaroc #RunningGear",
        ar: "🎵 الموسيقى ديالك كترافقك في كل لحْضة وبدون تشويش.\n\nسماعات رياضية مقاومة للماء والتعرق مع بطارية تدوم حتى لـ 32 ساعة ونظام عزل صوت خارجي متقدم.\n\n🔊 صوت نقي بتقنية HD باس\n🔋 32 ساعة من التشغيل المتواصل\n💦 مقاومة كاملة للرطوبة والمطر\n\nالتوصيل سريع لكافة المدن المغربية 🇲🇦 اطلب الآن! #تكنولوجيا #سماعات",
        darija: "🎵 عييتي من خيط السماعات فاش كتكون كتجري؟ ولا كيطفو ليك دغيا؟\n\nهاد ليزيكوتور صاوبناهم للناس لي كيموتو على السبور! كيصبرو للما والعرق، وفيهم باف قوي يخليك ناشط فالترينينغ، والباتري كيدوز حتى لـ 32 ساعة والشارور معاهم.\n\n✅ عزل تام للصداع ديال الزنقة\n✅ ما كيطيحوش وخا تبقا تنقز\n✅ شارج سريع بزاف\n\nالكمية محدودة بزاف! صيفط دابا فالميساج وستافد من العرض. 🚀 #المغرب #كازا #رياضة"
    },
    generic: {
        fr: "✨ Découvrez notre nouveauté exclusive !\n\nConçu avec passion pour répondre à vos exigences de qualité et améliorer votre quotidien.\n\n💎 Qualité premium certifiée\n👌 Design moderne et ergonomique\n🚚 Livraison sécurisée partout au Maroc\n\nCommandez directement en ligne ! #MaamoraBrand #PremiumQuality #Maroc",
        ar: "✨ الجديد الحصري متوفر الآن في متجرنا!\n\nمنتج ممتاز تم تصميمه بعناية فائقة لتلبية كافة احتياجاتكم اليومية بجودة لا تضاهى.\n\n💎 جودة مضمونة\n👌 تصميم مريح للمستخدم\n🚚 توصيل آمن وسريع لجميع المدن\n\nاطلبوا الآن ولا تفوتوا الفرصة! #المغرب #تسوق",
        darija: "✨ جبتو ليكم اليوم هاد الهمزة لي مغاديش تندمو عليها !\n\nحاجة دوريجين وشي حاجة لي غادي تسهل عليكم حياتكم اليومية وجربناها حنا اللولين.\n\n✅ كاليتي واعرة بزاف\n✅ تصميم واعر وساهل فالخدمة\n✅ التوصيل حتى لباب الدار عاد خلص\n\nإلا بغيتي تستافد من تخفيض اليوم كوموندي دابا قبل ما تيسالي السوك! 🚀 #المغرب #المغاربة #جودة"
    }
};

export default function CreativeStudio({ products }: CreativeStudioProps) {
    const [selectedProductId, setSelectedProductId] = useState<string>("");
    const [selectedFormat, setSelectedFormat] = useState<string>("instagram");
    const [selectedTemplate, setSelectedTemplate] = useState<string>("bold");
    const [currentPostId, setCurrentPostId] = useState<string | null>(null);
    const [promoText, setPromoText] = useState<string>("OFFRE SPÉCIALE !");
    const [accentColor, setAccentColor] = useState<string>("#f97316"); // default orange
    const [badgeText, setBadgeText] = useState<string>("-20% TODAY");

    // Custom caption tabs and edit state
    const [activeCaptionLang, setActiveCaptionLang] = useState<"fr" | "ar" | "darija">("darija");
    const [isGeneratingCaptions, setIsGeneratingCaptions] = useState<boolean>(false);
    const [captionOutput, setCaptionOutput] = useState<{ fr: string; ar: string; darija: string }>({
        fr: "",
        ar: "",
        darija: ""
    });
    const [copiedLang, setCopiedLang] = useState<string | null>(null);

    // Selected product helper
    const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

    useEffect(() => {
        if (products.length > 0 && !selectedProductId) {
            setSelectedProductId(products[0].id);
        }
    }, [products, selectedProductId]);

    // Load default template copy based on selected product keys
    useEffect(() => {
        if (!selectedProduct) return;
        let templateKey = "generic";
        if (selectedProduct.name.toLowerCase().includes("sho") || selectedProduct.name.toLowerCase().includes("run")) {
            templateKey = "shoes";
        } else if (selectedProduct.name.toLowerCase().includes("mat") || selectedProduct.name.toLowerCase().includes("yoga")) {
            templateKey = "mat";
        } else if (selectedProduct.name.toLowerCase().includes("bud") || selectedProduct.name.toLowerCase().includes("ear")) {
            templateKey = "earbuds";
        }
        setCaptionOutput(CAPTION_TEMPLATES[templateKey]);
    }, [selectedProduct]);

    const handleCopyCaption = (lang: "fr" | "ar" | "darija") => {
        navigator.clipboard.writeText(captionOutput[lang]);
        setCopiedLang(lang);
        setTimeout(() => setCopiedLang(null), 2000);
    };

    const handleSimulateCaptionGeneration = async () => {
        setIsGeneratingCaptions(true);
        try {
            // First step: get an actual Post ID from the backend by triggering generateImage
            const imgRes = await fetch("http://localhost:8080/api/posts/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProductId,
                    templateId: selectedTemplate,
                    badgeText,
                    promoText,
                    accentColor,
                })
            });
            const imgData = await imgRes.json();
            const postId = imgData.data?.id;
            setCurrentPostId(postId);

            if (postId) {
                // Second step: generate captions using the new Post ID
                const capRes = await fetch("http://localhost:8080/api/posts/generate-captions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ postId, languages: ["fr", "ar", "darija"] })
                });
                const capData = await capRes.json();
                const post = capData.data;

                if (post) {
                    setCaptionOutput({
                        fr: post.captionFr || "",
                        ar: post.captionAr || "",
                        darija: post.captionDarija || ""
                    });
                }
            }
        } catch (error) {
            console.error("Backend generation error:", error);
            alert("Ensure backend is running on :8080");
        } finally {
            setIsGeneratingCaptions(false);
        }
    };

    const handleSimulateDownload = () => {
        if (!currentPostId) {
            alert("Couln't find an active generation. Please Generate first!");
            return;
        }
        window.location.href = `http://localhost:8080/api/posts/${currentPostId}/export`;
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
                        Automating templates, logo placement, layout bounds, and linguistic localized captions in one click.
                    </p>
                </div>
            </div>

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
                            {/* Product selector */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-400" htmlFor="product-select">Select Target Product</Label>
                                <select
                                    id="product-select"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    className="flex w-full rounded-md border border-zinc-900 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                                >
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Format selection */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-400">Export Aspect Ratio</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: "instagram", name: "Instagram Post", desc: "1:1 Square" },
                                        { id: "story", name: "Story / Status", desc: "9:16 Vertical" },
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

                            {/* Template Theme selection */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-zinc-400">Design Template</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: "bold", name: "Accent Header" },
                                        { id: "minimalist", name: "Elegant Outline" },
                                        { id: "warm", name: "Clean Corner" },
                                        { id: "stripe", name: "Full Overlay" }
                                    ].map(theme => (
                                        <button
                                            key={theme.id}
                                            onClick={() => setSelectedTemplate(theme.id)}
                                            className={`px-3 py-2.5 rounded-md border text-xs text-left transition-all ${selectedTemplate === theme.id
                                                ? "border-orange-500/30 bg-orange-500/10 text-orange-400 font-semibold"
                                                : "border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200"
                                                }`}
                                        >
                                            {theme.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Separator className="bg-zinc-900 my-2" />

                            {/* Custom branding text details */}
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
                        </CardContent>
                    </Card>
                </div>

                {/* Right column: Interactive Preview and Copywriter */}
                <div className="space-y-8 min-w-0">

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,360px)] gap-6">

                        {/* Design canvas wrapper */}
                        <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-900 bg-zinc-950/10 min-h-[460px]">
                            <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-600 mb-4 flex items-center gap-1.5">
                                <Eye className="h-3 w-3 text-orange-500" />
                                Live Brand Canvas (WYSIWYG Overlay)
                            </p>

                            {/* Dynamic simulated canvas */}
                            {selectedProduct ? (
                                <div
                                    className={`relative border border-zinc-800 shadow-[0_4px_30px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300 ${selectedFormat === "instagram" ? "w-[300px] h-[300px] rounded-lg" : "w-[240px] h-[400px] rounded-xl"
                                        }`}
                                    style={{ backgroundColor: "#060608" }}
                                >
                                    {/* Underlay background pattern / accent circle */}
                                    <div
                                        className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-20 filter blur-3xl pointer-events-none transition-all duration-500"
                                        style={{ backgroundColor: accentColor }}
                                    />
                                    <div
                                        className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full opacity-10 filter blur-3xl pointer-events-none transition-all duration-500"
                                        style={{ backgroundColor: accentColor }}
                                    />

                                    {/* Render Product Image */}
                                    <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none p-4">
                                        {selectedProduct.imageUrl ? (
                                            <div className="relative w-full h-full rounded-md overflow-hidden">
                                                <Image
                                                    src={selectedProduct.imageUrl}
                                                    alt="Product render preview"
                                                    fill
                                                    className="object-cover opacity-80 filter contrast-[1.05]"
                                                    sizes="300px"
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-zinc-700 font-mono text-[9px] uppercase font-bold">IMAGE NOT LOADED</div>
                                        )}
                                    </div>

                                    {/* Theme structures overlays direct */}
                                    {selectedTemplate === "bold" && (
                                        <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-t from-black via-black/30 to-black/80">
                                            {/* Logo header */}
                                            <div className="flex items-center justify-between">
                                                <div className="bg-white/95 rounded px-2.5 py-1 flex items-center shadow-md">
                                                    <Image src="/maamora-logo.jpg" alt="Logo" width={56} height={14} className="object-contain" />
                                                </div>
                                                {badgeText && (
                                                    <div className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded text-white" style={{ backgroundColor: accentColor }}>
                                                        {badgeText}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Footer product details */}
                                            <div>
                                                {promoText && (
                                                    <span className="text-[10px] font-bold tracking-widest block" style={{ color: accentColor }}>
                                                        {promoText}
                                                    </span>
                                                )}
                                                <h4 className="text-sm font-bold text-white tracking-tight mt-0.5 leading-none">{selectedProduct.name}</h4>
                                                {selectedProduct.price && (
                                                    <p className="text-xs font-mono font-bold text-zinc-100 mt-1.5 bg-white/10 px-2 py-0.5 rounded w-max">
                                                        {selectedProduct.price} USD
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {selectedTemplate === "minimalist" && (
                                        <div className="absolute inset-0 flex flex-col justify-between p-4 bg-black/60 border-2" style={{ borderColor: accentColor + "22" }}>
                                            {/* Top row */}
                                            <div className="flex items-start justify-between">
                                                <div className="bg-white p-1.5 rounded shadow">
                                                    <Image src="/maamora-logo.jpg" alt="Logo" width={48} height={12} className="object-contain" />
                                                </div>
                                                <div className="text-[8px] font-mono tracking-widest text-zinc-400 bg-black/40 border border-zinc-800 px-1.5 py-0.5 rounded">
                                                    MAAMORA EXCLUSIVE
                                                </div>
                                            </div>

                                            {/* Center Content block */}
                                            <div className="text-center py-2 bg-black/80 border border-zinc-900/50 backdrop-blur-sm rounded-lg px-2 my-auto">
                                                <h4 className="text-xs font-bold tracking-wide text-zinc-200">{selectedProduct.name}</h4>
                                                {badgeText && (
                                                    <span className="text-[9px] font-bold block mt-1 uppercase" style={{ color: accentColor }}>
                                                        {badgeText}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Footer accent strip */}
                                            <div className="flex items-center justify-between pt-2 border-t border-zinc-900/40">
                                                {promoText && <span className="text-[9px] tracking-wide text-zinc-400">{promoText}</span>}
                                                {selectedProduct.price && (
                                                    <span className="text-xs font-bold font-mono" style={{ color: accentColor }}>
                                                        ${selectedProduct.price}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {selectedTemplate === "warm" && (
                                        <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black via-black/40 to-transparent">
                                            {/* Logo placed separately */}
                                            <div className="absolute top-4 left-4 bg-white/95 px-2 py-1 rounded shadow">
                                                <Image src="/maamora-logo.jpg" alt="Logo" width={48} height={12} className="object-contain" />
                                            </div>

                                            {/* Accent corner tag */}
                                            {badgeText && (
                                                <div className="absolute top-4 right-4 bg-zinc-950/90 border border-zinc-800 rounded px-2 py-1 flex items-center shadow-lg">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                                                    <span className="text-[9px] font-black text-zinc-200 tracking-wider font-mono">{badgeText}</span>
                                                </div>
                                            )}

                                            {/* Product Content info panel */}
                                            <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-900 p-3 rounded-lg">
                                                <p className="text-[8px] font-mono tracking-widest text-zinc-500 uppercase">{promoText || "MAAMORA SELECT"}</p>
                                                <h4 className="text-xs font-bold text-zinc-200 truncate mt-0.5">{selectedProduct.name}</h4>
                                                {selectedProduct.price && (
                                                    <p className="text-xs font-mono font-black mt-1" style={{ color: accentColor }}>
                                                        ${selectedProduct.price}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {selectedTemplate === "stripe" && (
                                        <div className="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-tr from-black via-transparent to-black/70">
                                            {/* Diagonal layout style placeholder */}
                                            <div className="flex justify-between items-center">
                                                <div className="bg-white px-2 py-1 rounded">
                                                    <Image src="/maamora-logo.jpg" alt="Logo" width={48} height={12} className="object-contain" />
                                                </div>
                                                {selectedProduct.price && (
                                                    <span className="text-xs font-bold bg-zinc-950 border border-zinc-860 px-2 py-0.5 rounded text-white" style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}>
                                                        ${selectedProduct.price}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Lower stripe banner block */}
                                            <div className="w-full py-2 px-3 rounded-md text-white shadow-xl flex items-center justify-between border" style={{ backgroundColor: accentColor + "f0", borderColor: accentColor }}>
                                                <div>
                                                    <h4 className="text-xs font-black tracking-tight leading-tight uppercase text-zinc-950">{selectedProduct.name}</h4>
                                                    <span className="text-[9px] font-semibold text-white/90 block leading-none mt-0.5">{promoText || "EXCLUSIVE"}</span>
                                                </div>
                                                {badgeText && (
                                                    <span className="text-xs font-bold bg-zinc-950 text-white leading-none px-2 py-1 rounded font-mono">
                                                        {badgeText}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <div className="text-xs text-zinc-500 font-mono">No target selected.</div>
                            )}
                        </div>

                        {/* AI Copywriter panel */}
                        <div className="space-y-4">
                            <Card className="border-zinc-900 bg-zinc-950/20">
                                <CardHeader className="pb-2.5 px-4 pt-4">
                                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                                        <Languages className="h-4 w-4 text-orange-400" />
                                        Linguistic Copywriter
                                    </CardTitle>
                                    <CardDescription className="text-[11px] text-zinc-500">
                                        Natural translation filters bypassing literal AI outputs
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 px-4 pb-4">
                                    {/* Language switch bar */}
                                    <div className="flex rounded-lg border border-zinc-900 bg-zinc-950 p-1">
                                        {[
                                            { id: "darija", label: "Moroccan Darija" },
                                            { id: "fr", label: "French" },
                                            { id: "ar", label: "Arabic" }
                                        ].map(lang => (
                                            <button
                                                key={lang.id}
                                                onClick={() => setActiveCaptionLang(lang.id as any)}
                                                className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-semibold transition-all ${activeCaptionLang === lang.id
                                                    ? "bg-zinc-900 text-orange-400"
                                                    : "text-zinc-500 hover:text-zinc-300"
                                                    }`}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Outputs window */}
                                    <div className="relative">
                                        <Textarea
                                            aria-label="Copywriter content text"
                                            value={captionOutput[activeCaptionLang]}
                                            onChange={(e) => setCaptionOutput(prev => ({ ...prev, [activeCaptionLang]: e.target.value }))}
                                            className="min-h-[190px] text-xs font-sans tracking-wide bg-zinc-950 border-zinc-900 text-zinc-200 outline-none leading-relaxed resize-none p-3.5 focus-visible:ring-1 focus-visible:ring-orange-500/20"
                                        />

                                        {/* Copy/Feedback button overlay */}
                                        <div className="absolute bottom-2.5 right-2.5">
                                            <Button
                                                size="sm"
                                                onClick={() => handleCopyCaption(activeCaptionLang)}
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
                                                        Copy Copywriter text
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Regenerate copywriting */}
                                    <Button
                                        onClick={handleSimulateCaptionGeneration}
                                        disabled={isGeneratingCaptions}
                                        className="w-full h-8 text-[11px] border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 hover:text-zinc-100 text-zinc-400 transition-colors"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isGeneratingCaptions ? "animate-spin" : ""}`} />
                                        {isGeneratingCaptions ? "Refreshing Dialects..." : "Repopulate Translations"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                    </div>

                    {/* Handshake actions block */}
                    <div className="flex flex-col sm:flex-row items-center justify-between p-5 border border-zinc-900 bg-zinc-950/20 rounded-xl gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-orange-600/10 border border-orange-500/20 rounded-lg flex items-center justify-center text-orange-400">
                                <CheckCircle className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <span className="text-xs font-semibold text-zinc-300 block">Pending Handshake Status</span>
                                <span className="text-[10px] text-zinc-500">Human approval is required before download</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleSimulateDownload}
                            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs h-9 px-6 shadow-lg shadow-orange-700/20 flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download Generation Package (.ZIP)
                        </Button>
                    </div>

                </div>

            </div>
        </div>
    );
}
