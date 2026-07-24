import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PenTool,
  Palette,
  Languages,
  Plus,
  LayoutDashboard,
  Box,
  Image,
  CheckSquare,
  ChevronRight,
  TrendingUp,
  Share2,
  Download,
  Upload,
  User,
  LogOut,
  RefreshCw,
  Eye,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Info,
  ExternalLink,
  MessageSquare,
  Grid,
  Zap,
  Tag,
  CheckCircle,
  Clock
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";

import { Product, SocialMediaPost, UserRole, UserProfile, PostFormat } from "./types";
import { PRODUCT_PRESETS, IMAGE_TEMPLATES } from "./data/presets";
import { Product3DModel } from "./components/Product3DModel";
import { SocialPostCanvas } from "./components/SocialPostCanvas";

// Mock user profiles
const PROFILES: UserProfile[] = [
  {
    id: "user-smm",
    name: "Ayoub",
    email: "ayoub@maamora.ma",
    role: "social_media_manager",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: "user-admin",
    name: "Mouad (Admin)",
    email: "mouad@maamora.ma",
    role: "admin",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80"
  },
  {
    id: "user-guest",
    name: "Visiteur",
    email: "mouadebra@gmail.com",
    role: "visitor",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80"
  }
];

export default function App() {
  // Persistence states
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("maamora_products");
    return saved ? JSON.parse(saved) : PRODUCT_PRESETS;
  });

  const [posts, setPosts] = useState<SocialMediaPost[]>(() => {
    const saved = localStorage.getItem("maamora_posts");
    if (saved) return JSON.parse(saved);

    // Default mock posts
    return [
      {
        id: "post-1",
        productId: "prod-argan",
        productName: "Argan Elixir Pur",
        productPhoto: "argan-bottle",
        productPrice: "180",
        format: "square",
        templateId: "temp-sunset",
        captionArabic: "✨ اكتشفوا الفخامة الطبيعية المطلقة مع زيت الأركان البكر الممتاز من مأمورة! 🌿\n\nزيت نقي 100٪، معصور على البارد من خيرات جبال الأطلس المغربية. يغذي بشرتكم بعمق ويعيد الحيوية واللمعان لشعركم بفضل غناه بالفيتامين E ومضادات الأكسدة.\n\n✅ طبيعي وعضوي 100%\n💰 180 درهم فقط!\n\n🛍️ للطلب والاستفسار، تواصلوا معنا على الخاص أو عبر موقعنا. التوصيل متوفر لجميع المدن المغربية! 🇲🇦",
        captionFrench: "✨ Découvrez l'excellence du soin naturel avec l'Élixir d'Argan Pur de Maamora ! 🌿\n\nNotre huile d'argan 100% bio est pressée à la main dans le plus grand respect des traditions marocaines. Un véritable trésor antioxydant qui revitalise votre visage et fortifie vos cheveux en un clin d'œil.\n\n💰 Prix : 180 DH seulement.\n🚀 Commandes en DM. Livraison rapide dans tout le Maroc !",
        captionDarija: "✨ تهلاي فراسك مع السحر الحقيقي د زيت الأركان الحر من مأمورة! 🌿\n\nهاد الزيت معصورة على اليد وطبيعية 100٪، كتخلي البشرة رطبة بحال الحرير وكتعطي لمعان خطير للشعر. مغاتندميش عليها!\n\n💸 الثمن: غير بـ 180 درهم !\n🚀 صيفطي لينا ميساج دابا ف الخاص وتقداي ديالك، التوصيل واجد تال باب الدار ف جميع المدن! ❤️🇲🇦",
        status: "approved",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        approvedAt: new Date(Date.now() - 86400000 * 1.8).toISOString()
      },
      {
        id: "post-2",
        productId: "prod-honey",
        productName: "Miel d'Euphorbe Rare",
        productPhoto: "honey-jar",
        productPrice: "260",
        format: "story",
        templateId: "temp-ochre",
        captionArabic: "✨ عسل الدغموس الحر والنادر من مأمورة: جودة علاجية وصحة لا تقدر بثمن! 🍯\n\nمستخلص طبيعي من قلب منطقة سوس، يتميز بنكهته الفريدة الدافئة وفوائده الصحية الكبيرة لتقوية المناعة ومقاومة البرد.\n\n✅ عسل نقي وغير مصفى\n💰 260 درهم فقط\n\n🛍️ اطلبوا الآن عبر رسائل الصفحة لضمان الحصول على عسلكم الأصلي! 🇲🇦",
        captionFrench: "✨ Renforcez votre corps avec le Miel d'Euphorbe Rare (Daghmous) de Maamora ! 🍯\n\nUn miel médicinal authentique récolté de manière traditionnelle dans la région du Souss. Reconnu pour sa sensation de chaleur unique en gorge et ses propriétés tonifiantes exceptionnelles.\n\n💰 Prix : 260 DH.\n🚀 Commandez en un clic par DM !",
        captionDarija: "✨ جرب عسل الدغموس الوجدي والحر من عند مأمورة، صحي ودواء حقيقي! 🍯\n\nهاد العسل نقي وكيجي نيشان من المناحل التقليدية ف سوس. كيعطي واحد الدفء رائع وممتاز بزاف للمناعة والبرد.\n\n💸 الثمن: 260 درهم فقط\n🚀 صيفط لينا ميساج دابا نوجدو ليك الطلبية ديالك تال باب الدار! 🇲🇦❤️",
        status: "pending",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: "post-3",
        productId: "prod-savon",
        productName: "Savon Noir Premium",
        productPhoto: "savon-jar",
        productPrice: "85",
        format: "square",
        templateId: "temp-moss",
        captionArabic: "✨ طقوس الحمام المغربي التقليدي الفاخر في منزلك مع الصابون الأسود من مأمورة! 🌿\n\nصابون طبيعي غني بزيت الأركان ومستخلصات الأوكالبتوس المنعشة. ينظف البشرة بعمق، يزيل الخلايا الميتة، ويمنح جسمك شعوراً فريداً بالاسترخاء والنعومة.\n\n💰 السعر: 85 درهم فقط\n🛍️ اطلبوا مجموعتكم اليوم واستمتعوا بتجربة ديتوكس حقيقية!",
        captionFrench: "✨ Vivez l'expérience authentique du hammam chez vous avec le Savon Noir Premium de Maamora ! 🌿\n\nÉlaboré avec de l'huile d'olive de première pression et enrichi à l'eucalyptus frais. Il exfolie la peau en douceur pour la laisser incroyablement douce, lisse et détoxifiée.\n\n💰 Prix de l'évasion : 85 DH.\n🚀 DM pour commander !",
        captionDarija: "✨ حمام بلدي دايزو الكلام ف دارك مع الصابون البلدي بالرائحة د الكاليبتوس والأركان! 🌿\n\nصابون طبيعي 100% كيصفي اللحم ويحيد الخلايا الميتة وكيخلي ريحة غزال وفياقة فالذات.\n\n💸 الثمن: غير 85 درهم\n🚀 صيفط لينا ميساج دابا وحيد عليك العجز!",
        status: "rejected",
        adminFeedback: "La version Darija est un peu trop courte, pourriez-vous rajouter des termes qui font référence au Hammam marocain traditionnel ?",
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ];
  });

  // Active state handlers
  const [currentUser, setCurrentUser] = useState<UserProfile>(PROFILES[0]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "studio" | "admin" | "landing">("landing");
  const [showToast, setShowToast] = useState<string | null>(null);

  // New product form states
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdSellingPoint, setNewProdSellingPoint] = useState("");
  const [newProdCategory, setNewProdCategory] = useState<Product["category"]>("oil");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdPhoto, setNewProdPhoto] = useState("argan-bottle");
  const [customPhotoBase64, setCustomPhotoBase64] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Studio generator states
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0] || PRODUCT_PRESETS[0]);
  const [selectedFormat, setSelectedFormat] = useState<PostFormat>("square");
  const [selectedTemplate, setSelectedTemplate] = useState(IMAGE_TEMPLATES[0]);
  const [promoText, setPromoText] = useState("Nouveau • جديد");
  const [badgeStyle, setBadgeStyle] = useState<'classic' | 'badge-3d'>('badge-3d');
  
  // Generated copy state
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [genArabic, setGenArabic] = useState("");
  const [genFrench, setGenFrench] = useState("");
  const [genDarija, setGenDarija] = useState("");
  const [studioFeedback, setStudioFeedback] = useState<string | null>(null);

  // Admin interactive feedback state
  const [adminFeedbackText, setAdminFeedbackText] = useState("");

  // Toast notifier helper
  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 4000);
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("maamora_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("maamora_posts", JSON.stringify(posts));
  }, [posts]);

  // Handle product registration
  const handleRegisterProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) {
      triggerToast("⚠️ Veuillez remplir le nom et le prix.");
      return;
    }

    setIsRegistering(true);

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: newProdName,
      price: newProdPrice,
      sellingPoint: newProdSellingPoint || "Premium Naturel Marocain",
      photo: customPhotoBase64 || newProdPhoto,
      description: newProdDesc,
      category: newProdCategory,
      createdAt: new Date().toISOString()
    };

    setTimeout(() => {
      setProducts(prev => [newProduct, ...prev]);
      // Set as currently active in studio too
      setSelectedProduct(newProduct);
      setIsRegistering(false);
      triggerToast(`🎉 Produit "${newProdName}" enregistré avec succès !`);
      
      // Reset fields
      setNewProdName("");
      setNewProdPrice("");
      setNewProdSellingPoint("");
      setNewProdDesc("");
      setCustomPhotoBase64(null);
      
      // Move SMM to studio or product list
      setActiveTab("products");
    }, 800);
  };

  // Handle custom image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomPhotoBase64(reader.result as string);
        triggerToast("📸 Image du produit chargée avec succès !");
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger server-side AI Caption generation using local endpoint
  const handleGenerateAICopy = async () => {
    setIsGeneratingCopy(true);
    setGenerationStep(1);

    // Simulated progressive steps for delightful UX
    const steps = [
      "Analyse des caractéristiques du produit...",
      "Extraction des expressions culturelles marocaines...",
      "Rédaction de la copie formelle en Arabe...",
      "Composition du Français de prestige...",
      "Génération du Darija naturel marocain authentique...",
      "Finalisation du ton de la marque Maamora..."
    ];

    let currentStep = 1;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setGenerationStep(currentStep + 1);
        currentStep++;
      }
    }, 900);

    try {
      const response = await fetch("/api/gemini/generate-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedProduct.name,
          price: selectedProduct.price,
          sellingPoint: selectedProduct.sellingPoint,
          format: selectedFormat
        })
      });

      const data = await response.json();
      clearInterval(interval);

      if (data.error) {
        throw new Error(data.error);
      }

      setGenArabic(data.arabic);
      setGenFrench(data.french);
      setGenDarija(data.darija);
      setStudioFeedback(data._error || null);
      triggerToast("✨ Légendes rédigées avec succès !");
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      triggerToast("❌ Erreur de génération. Légendes de secours rédigées.");
      
      // Fallback
      setGenArabic(`🌿 ${selectedProduct.name} - Excellence Pure 🌿\n\n💰 Prix: ${selectedProduct.price} DH\n✨ ${selectedProduct.sellingPoint}\n\n🛒 Commandez en DM ! #Maamora`);
      setGenFrench(`🌿 ${selectedProduct.name} - Soin Précieux 🌿\n\n💰 Prix: ${selectedProduct.price} DH\n✨ ${selectedProduct.sellingPoint}\n\n🛒 DM pour commander ! #Maamora`);
      setGenDarija(`🌿 تهلا ف راسك مع ${selectedProduct.name} الحر! 🌿\n\n💰 غير ب ${selectedProduct.price} درهم\n✨ ${selectedProduct.sellingPoint}\n\n🛒 صيفط لينا ميساج دابا تال باب الدار ! #Maamora`);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  // Submit generated post for admin review
  const handleSubmitPostForApproval = () => {
    if (!genArabic || !genFrench || !genDarija) {
      triggerToast("⚠️ Veuillez d'abord rédiger les légendes de la publication.");
      return;
    }

    const newPost: SocialMediaPost = {
      id: `post-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productPhoto: selectedProduct.photo,
      productPrice: selectedProduct.price,
      format: selectedFormat,
      templateId: selectedTemplate.id,
      captionArabic: genArabic,
      captionFrench: genFrench,
      captionDarija: genDarija,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    setPosts(prev => [newPost, ...prev]);
    triggerToast("📨 Post envoyé pour révision auprès de l'administrateur !");
    
    // Clear studio draft
    setGenArabic("");
    setGenFrench("");
    setGenDarija("");
  };

  // SMM re-submitting a rejected post after adjustment
  const handleResubmitPost = (post: SocialMediaPost) => {
    const updated = posts.map(p => {
      if (p.id === post.id) {
        return { ...p, status: "pending" as const, adminFeedback: undefined };
      }
      return p;
    });
    setPosts(updated);
    triggerToast("🔄 Post corrigé et ré-envoyé pour approbation !");
  };

  // Admin Actions
  const handleApprovePost = (postId: string) => {
    const updated = posts.map(p => {
      if (p.id === postId) {
        return { ...p, status: "approved" as const, approvedAt: new Date().toISOString() };
      }
      return p;
    });
    setPosts(updated);
    triggerToast("✅ Post approuvé ! Il est désormais disponible au téléchargement.");
  };

  const handleRejectPost = (postId: string) => {
    if (!adminFeedbackText) {
      triggerToast("⚠️ Veuillez fournir des commentaires de révision pour le rejet.");
      return;
    }

    const updated = posts.map(p => {
      if (p.id === postId) {
        return { ...p, status: "rejected" as const, adminFeedback: adminFeedbackText };
      }
      return p;
    });
    setPosts(updated);
    setAdminFeedbackText("");
    triggerToast("❌ Post renvoyé pour corrections.");
  };

  // Profile switcher handler
  const handleProfileChange = (role: UserRole) => {
    const matchedProfile = PROFILES.find(p => p.role === role) || PROFILES[0];
    setCurrentUser(matchedProfile);
    
    // Auto shift view based on logical roles
    if (role === "admin") {
      setActiveTab("admin");
    } else if (role === "visitor") {
      setActiveTab("landing");
    } else {
      setActiveTab("dashboard");
    }

    triggerToast(`👤 Mode basculé en : ${matchedProfile.name} (${role === "admin" ? "Administrateur" : role === "social_media_manager" ? "SMM" : "Visiteur"})`);
  };

  // Analytics Math for Recharts
  const pendingCount = posts.filter(p => p.status === "pending").length;
  const approvedCount = posts.filter(p => p.status === "approved").length;
  const rejectedCount = posts.filter(p => p.status === "rejected").length;

  const barChartData = [
    { name: "Total Produits", count: products.length, fill: "#F47315" },
    { name: "Approuvés", count: approvedCount, fill: "#10B981" },
    { name: "En attente", count: pendingCount, fill: "#F59E0B" },
    { name: "Rejetés", count: rejectedCount, fill: "#EF4444" }
  ];

  const formatStatsData = [
    { name: "Post Carré", value: posts.filter(p => p.format === "square").length },
    { name: "Story", value: posts.filter(p => p.format === "story").length },
    { name: "WhatsApp", value: posts.filter(p => p.format === "whatsapp").length }
  ];

  const categoryData = [
    { name: "Huiles", value: products.filter(p => p.category === "oil").length },
    { name: "Miels", value: products.filter(p => p.category === "honey").length },
    { name: "Cosmétiques", value: products.filter(p => p.category === "cosmetics").length },
    { name: "Bien-être", value: products.filter(p => p.category === "wellness").length },
    { name: "Autres", value: products.filter(p => p.category === "other").length }
  ];

  const COLORS = ["#F47315", "#3B82F6", "#10B981", "#EC4899", "#8B5CF6"];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 font-sans flex flex-col selection:bg-[#F47315] selection:text-white">
      
      {/* 3D-styled Top Notification Banner */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 border-2 border-stone-900 text-stone-100 px-6 py-3.5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(244,115,21,1)] flex items-center gap-3 max-w-md"
          >
            <Info className="w-5 h-5 text-[#F47315]" />
            <span className="text-sm font-bold tracking-wide">{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Luxury Header */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b-3 border-stone-900 px-6 py-4 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setActiveTab("landing")}
            className="flex flex-col items-center cursor-pointer select-none group"
          >
            {/* Maamora Curved Arch Logo from Screenshot */}
            <svg className="w-16 h-3 text-[#F47315] transition-transform group-hover:scale-105" viewBox="0 0 100 20">
              <path d="M10,20 Q50,0 90,20" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            </svg>
            <span className="text-lg font-extrabold tracking-tight mt-[-3px] text-stone-900 group-hover:text-[#F47315] transition-colors">
              maamora <span className="text-xs font-medium text-stone-500 uppercase tracking-widest pl-1">Studio</span>
            </span>
          </div>

          {/* Inline Profile Role Switcher (Highly requested for testability) */}
          <div className="hidden md:flex items-center gap-1.5 ml-6 bg-stone-100 p-1.5 rounded-xl border-2 border-stone-300">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2">RÔLE :</span>
            {(["social_media_manager", "admin", "visitor"] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => handleProfileChange(role)}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  currentUser.role === role
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-500 hover:text-stone-800 hover:bg-stone-200"
                }`}
              >
                {role === "social_media_manager" ? "SMM" : role === "admin" ? "Admin" : "Visiteur"}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Navigation Link Tabs */}
        <nav className="flex items-center gap-2">
          {currentUser.role !== "visitor" && (
            <>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-[#F47315] text-white border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Tableau
              </button>

              <button
                onClick={() => setActiveTab("products")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === "products"
                    ? "bg-[#F47315] text-white border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <Box className="w-4 h-4" />
                Produits ({products.length})
              </button>

              <button
                onClick={() => setActiveTab("studio")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold transition-all cursor-pointer ${
                  activeTab === "studio"
                    ? "bg-[#F47315] text-white border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,1)]"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <PenTool className="w-4 h-4 text-[#F47315]" />
                Studio Créatif
              </button>
            </>
          )}

          {currentUser.role === "admin" && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold relative transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-stone-900 text-white border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(244,115,21,1)]"
                  : "text-rose-600 hover:bg-rose-50"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Revue Admin
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black animate-bounce border border-white">
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          {/* User profile dropdown/button */}
          <div className="flex items-center gap-2 pl-4 border-l border-stone-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-stone-800 leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-stone-400 capitalize mt-0.5">{currentUser.role.replace(/_/g, ' ')}</p>
            </div>
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full border-2 border-stone-900 object-cover"
            />
          </div>
        </nav>
      </header>

      {/* Responsive mobile banner role selector */}
      <div className="block md:hidden bg-stone-100 p-2 border-b border-stone-200 text-center">
        <span className="text-[10px] font-bold text-stone-500 mr-2 uppercase tracking-widest">Rôle mobile :</span>
        <select
          value={currentUser.role}
          onChange={(e) => handleProfileChange(e.target.value as UserRole)}
          className="text-xs bg-white border border-stone-300 rounded px-2 py-1 font-bold"
        >
          <option value="social_media_manager">SMM (Ayoub)</option>
          <option value="admin">Administrateur (Mouad)</option>
          <option value="visitor">Visiteur (Client)</option>
        </select>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {/* ==================== 1. LANDING PAGE ==================== */}
          {activeTab === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-16 py-6"
            >
              {/* Premium 3D-inspired Hero Banner */}
              <div className="relative rounded-[3rem] bg-gradient-to-br from-[#FFFDF9] via-[#FAF6EE] to-[#FFEEDB] border-4 border-stone-900 p-8 md:p-14 shadow-[12px_12px_0px_0px_rgba(28,25,23,0.9)] overflow-hidden flex flex-col lg:flex-row items-center gap-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
                
                {/* Accent lights */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#F47315]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="space-y-6 lg:w-3/5 z-10 text-center lg:text-left">
                  <span className="inline-flex items-center gap-2 bg-[#F47315]/10 text-[#F47315] font-black uppercase text-xs tracking-[0.25em] px-4 py-1.5 rounded-full border border-[#F47315]/20 shadow-sm">
                    ✨ PLATEFORME PROFESSIONNELLE MAAMORA
                  </span>
                  
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight text-stone-900 leading-[1.05] font-serif">
                    Créez des publications de <span className="text-[#F47315] relative inline-block">Prestige<span className="absolute bottom-1 left-0 w-full h-3 bg-amber-200 -z-10 rounded-full" /></span> pour vos réseaux sociaux.
                  </h1>

                  <p className="text-stone-500 text-md md:text-lg max-w-xl font-medium leading-relaxed">
                    L'excellence de la rédaction rencontre la chaleur du design marocain. Maamora Studio orchestre votre présence digitale en combinant des compositions visuelles haut de gamme et des légendes authentiques en <span className="font-bold text-stone-800">Darija, Arabe et Français</span>.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                    <button
                      onClick={() => handleProfileChange("social_media_manager")}
                      className="w-full sm:w-auto bg-[#F47315] hover:bg-[#ff852e] active:translate-y-0.5 text-white font-extrabold text-md py-4 px-8 rounded-2xl border-b-4 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PenTool className="w-5 h-5 text-white" />
                      Commencer l'expérience
                    </button>
                    
                    <button
                      onClick={() => {
                        handleProfileChange("admin");
                        setActiveTab("admin");
                      }}
                      className="w-full sm:w-auto bg-white hover:bg-stone-50 active:translate-y-0.5 text-stone-800 font-extrabold text-md py-4 px-8 rounded-2xl border-2 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <User className="w-5 h-5 text-stone-500" />
                      Accéder au Panel Admin
                    </button>
                  </div>

                  {/* Trust indicator */}
                  <div className="flex items-center justify-center lg:justify-start gap-6 pt-6 border-t border-stone-200">
                    <div>
                      <p className="text-2xl font-black text-stone-800">100%</p>
                      <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Darija Marocaine</p>
                    </div>
                    <div className="h-8 w-px bg-stone-200" />
                    <div>
                      <p className="text-2xl font-black text-stone-800">5+</p>
                      <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Gabarits 3D Pro</p>
                    </div>
                    <div className="h-8 w-px bg-stone-200" />
                    <div>
                      <p className="text-2xl font-black text-stone-800">0.8s</p>
                      <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Rendu Instantané</p>
                    </div>
                  </div>
                </div>

                {/* Floating 3D Device Showcase (Inspired by sofihealth.com) */}
                <div className="lg:w-2/5 flex items-center justify-center relative py-6">
                  <div className="absolute w-72 h-72 bg-gradient-to-tr from-amber-400/20 to-[#F47315]/30 rounded-full blur-2xl animate-pulse" />
                  
                  {/* Floating container */}
                  <motion.div
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative bg-white border-3 border-stone-900 rounded-[2rem] p-6 shadow-[8px_8px_0px_0px_rgba(244,115,21,1)] w-80"
                  >
                    <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#FFF3E3] to-[#FFEEDB] border-2 border-stone-900 p-4 flex flex-col justify-between overflow-hidden relative">
                      <div className="flex justify-between items-center text-[10px] font-bold text-stone-500">
                        <span>maamora</span>
                        <span>100% BIO</span>
                      </div>
                      
                      {/* Floating model */}
                      <Product3DModel type="argan-bottle" size="md" className="mx-auto transform scale-110" />
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs font-black text-stone-800 leading-none">Argan Elixir Pur</p>
                          <p className="text-[8px] text-stone-400 italic">Pressé à froid</p>
                        </div>
                        <div className="bg-[#F47315] text-white text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-stone-900">
                          180 DH
                        </div>
                      </div>
                    </div>

                    {/* Captions mockup below image */}
                    <div className="mt-4 space-y-2 border-t border-stone-100 pt-3 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Darija Légende</span>
                      </div>
                      <p className="text-[11px] font-semibold text-stone-500 leading-tight">
                        "جربي السحر الحقيقي مع زيت الأركان الحر من مأمورة! طبيعية 100٪ كتخلي البشرة..."
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Workflow stage description grids */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-black tracking-tight text-stone-800 font-serif">
                    Comment fonctionne l'automatisation ?
                  </h2>
                  <p className="text-stone-400 text-sm font-semibold max-w-md mx-auto mt-1">
                    Suivez les étapes simples intégrées pour produire vos posts à grande échelle.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Step 1 */}
                  <div className="bg-white border-3 border-stone-900 p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] space-y-3 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#F47315]/10 rounded-full flex items-center justify-center font-black text-lg text-[#F47315]">
                      1
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#F47315] font-bold">
                      📦
                    </div>
                    <h3 className="font-extrabold text-stone-800 text-lg">Enregistrer les produits</h3>
                    <p className="text-stone-400 text-xs font-semibold leading-relaxed">
                      Saisissez le nom, le prix, l'argument de vente et chargez votre photo. Choisissez des modèles 3D pré-conçus.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-white border-3 border-stone-900 p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] space-y-3 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#F47315]/10 rounded-full flex items-center justify-center font-black text-lg text-[#F47315]">
                      2
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500 font-bold">
                      ✍️
                    </div>
                    <h3 className="font-extrabold text-stone-800 text-lg">Atelier de Rédaction (Studio)</h3>
                    <p className="text-stone-400 text-xs font-semibold leading-relaxed">
                      Notre studio rédige trois variations de légendes (Arabe, Français, Darija) et assemble le visuel de prestige en direct.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-white border-3 border-stone-900 p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] space-y-3 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#F47315]/10 rounded-full flex items-center justify-center font-black text-lg text-[#F47315]">
                      3
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-500 font-bold">
                      ⚖️
                    </div>
                    <h3 className="font-extrabold text-stone-800 text-lg">Vérification & Export</h3>
                    <p className="text-stone-400 text-xs font-semibold leading-relaxed">
                      L'administrateur valide la fidélité, commente, et le SMM télécharge le visuel PNG et copie les légendes prêtes à publier.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== 2. DASHBOARD TABLEAU ==================== */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* High level visual greetings */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-black font-serif text-stone-900">Console d'activité Maamora</h1>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mt-1">Données et statistiques d'automatisation sociale</p>
                </div>
                <button
                  onClick={() => setActiveTab("studio")}
                  className="bg-[#F47315] hover:bg-[#ff852e] text-white font-extrabold px-5 py-2.5 rounded-xl border-b-2 border-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,1)] flex items-center gap-2 cursor-pointer select-none text-xs"
                >
                  <PenTool className="w-4 h-4 text-white" />
                  Créer un Post
                </button>
              </div>

              {/* Premium 3D Metric cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Metric 1 */}
                <div className="bg-white border-3 border-stone-900 p-6 rounded-2xl shadow-[5px_5px_0px_0px_rgba(28,25,23,1)] flex items-center justify-between">
                  <div>
                    <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider block">PRODUITS REGISTRÉS</span>
                    <span className="text-3xl font-black text-stone-900 mt-1 block">{products.length}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-100 border border-[#F47315]/20 flex items-center justify-center text-xl shadow-sm">
                    📦
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white border-3 border-stone-900 p-6 rounded-2xl shadow-[5px_5px_0px_0px_rgba(244,115,21,0.9)] flex items-center justify-between">
                  <div>
                    <span className="text-[#F47315] text-[10px] font-black uppercase tracking-wider block">EN ATTENTE D'APPROBATION</span>
                    <span className="text-3xl font-black text-[#F47315] mt-1 block">{pendingCount}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-500/20 flex items-center justify-center text-xl shadow-sm animate-pulse">
                    ⏳
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white border-3 border-stone-900 p-6 rounded-2xl shadow-[5px_5px_0px_0px_rgba(16,185,129,0.9)] flex items-center justify-between">
                  <div>
                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-wider block">POSTS PRÊTS / EXPORTÉS</span>
                    <span className="text-3xl font-black text-emerald-600 mt-1 block">{approvedCount}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-500/20 flex items-center justify-center text-xl shadow-sm">
                    ✅
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white border-3 border-stone-900 p-6 rounded-2xl shadow-[5px_5px_0px_0px_rgba(239,68,68,0.9)] flex items-center justify-between">
                  <div>
                    <span className="text-red-500 text-[10px] font-black uppercase tracking-wider block">RÉVISIONS DEMANDÉES</span>
                    <span className="text-3xl font-black text-red-500 mt-1 block">{rejectedCount}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-500/20 flex items-center justify-center text-xl shadow-sm">
                    ✍️
                  </div>
                </div>

              </div>

              {/* Analytics chart panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Recharts Area chart */}
                <div className="lg:col-span-2 bg-white border-3 border-stone-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]">
                  <h3 className="font-extrabold text-stone-800 text-lg mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#F47315]" />
                    Répartition des métriques de contenu
                  </h3>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fill: '#78716c', fontSize: 11, fontWeight: 'bold' }} />
                        <YAxis tick={{ fill: '#78716c', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1c1917', color: '#fff', borderRadius: '12px' }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Breakdown by post format / Pie chart */}
                <div className="bg-white border-3 border-stone-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-stone-800 text-lg mb-4">
                      Formats les plus utilisés
                    </h3>
                    <div className="h-44 flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={formatStatsData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {formatStatsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Label centered */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-black text-stone-800">{posts.length}</span>
                        <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Posts Totaux</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-4 border-t border-stone-100">
                    {formatStatsData.map((entry, index) => (
                      <div key={entry.name} className="flex justify-between text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-stone-600">{entry.name}</span>
                        </div>
                        <span className="text-stone-800 font-bold">{entry.value} posts</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Quick-links for product preview */}
              <div className="bg-stone-900 text-stone-100 rounded-3xl p-8 border-2 border-stone-900 shadow-[6px_6px_0px_0px_rgba(244,115,21,1)] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-black flex items-center justify-center md:justify-start gap-2">
                    <Languages className="w-5 h-5 text-amber-400" />
                    Légendes Darija Naturelles Optimisées
                  </h3>
                  <p className="text-stone-400 text-xs font-medium max-w-xl">
                    Notre studio d'écriture a été pensé avec des expressions culturelles marocaines de l'Atlas et du Souss pour que vos posts sonnent frais et proches des clients.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("studio")}
                  className="bg-white text-stone-900 hover:bg-stone-100 font-extrabold px-6 py-3 rounded-xl border-b-2 border-stone-950 flex items-center gap-2 cursor-pointer transition-all select-none text-xs"
                >
                  Ouvrir l'Atelier Créatif
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================== 3. MES PRODUITS PAGE ==================== */}
          {activeTab === "products" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-10"
            >
              {/* Product grid heading */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-black font-serif text-stone-900">Catalogue Maamora</h1>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mt-1">Gérez et enregistrez vos produits à promouvoir</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* Left Side: Register Product Form */}
                <div className="lg:col-span-1 bg-white border-3 border-stone-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] h-fit">
                  <h3 className="font-extrabold text-stone-800 text-lg mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#F47315]" />
                    Nouveau Produit
                  </h3>

                  <form onSubmit={handleRegisterProduct} className="space-y-4">
                    {/* Nom */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-stone-600 uppercase tracking-wide">Nom du Produit *</label>
                      <input
                        type="text"
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="Ex: Élixir d'Argan Pur"
                        className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Prix */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-stone-600 uppercase tracking-wide">Prix (DH) *</label>
                      <input
                        type="number"
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value)}
                        placeholder="Ex: 180"
                        className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Argument Clé de Vente */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-stone-600 uppercase tracking-wide">Argument de Vente (Slogan)</label>
                      <input
                        type="text"
                        value={newProdSellingPoint}
                        onChange={(e) => setNewProdSellingPoint(e.target.value)}
                        placeholder="Ex: 100% biologique d'Atlas"
                        className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all"
                      />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-stone-600 uppercase tracking-wide">Catégorie</label>
                      <select
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value as Product["category"])}
                        className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all cursor-pointer"
                      >
                        <option value="oil">🧴 Huiles Précieuses</option>
                        <option value="honey">🍯 Miels Fins</option>
                        <option value="cosmetics">🌸 Cosmétique de luxe</option>
                        <option value="wellness">🛀 Bain & Hammam</option>
                        <option value="other">📦 Autre produit</option>
                      </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <label className="text-xs font-black text-stone-600 uppercase tracking-wide">Description courte</label>
                      <textarea
                        value={newProdDesc}
                        onChange={(e) => setNewProdDesc(e.target.value)}
                        placeholder="Description du produit bio..."
                        rows={3}
                        className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all"
                      />
                    </div>

                    {/* Selection of 3D Models Mockups */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-stone-600 uppercase tracking-wide block">Aspect 3D pré-conçu</label>
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { key: "argan-bottle", label: "🧴" },
                          { key: "honey-jar", label: "🍯" },
                          { key: "rose-serum", label: "🌸" },
                          { key: "savon-jar", label: "🧼" },
                          { key: "figue-dropper", label: "💎" }
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              setNewProdPhoto(item.key);
                              setCustomPhotoBase64(null);
                            }}
                            className={`p-2 rounded-xl border-2 text-lg flex items-center justify-center transition-all cursor-pointer ${
                              newProdPhoto === item.key && !customPhotoBase64
                                ? "border-stone-900 bg-amber-50 shadow-sm"
                                : "border-stone-200 hover:bg-stone-50"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom image upload option */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-black text-stone-600 uppercase tracking-wide block">Ou charger une photo réelle</label>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 text-xs px-4 py-2 rounded-xl cursor-pointer select-none font-bold">
                          <Upload className="w-4 h-4" />
                          Choisir un fichier
                          <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" />
                        </label>
                        {customPhotoBase64 && (
                          <span className="text-[10px] text-green-600 font-bold uppercase">Image chargée ✓</span>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isRegistering}
                      className="w-full bg-[#F47315] hover:bg-[#ff852e] text-white font-extrabold py-3 px-6 rounded-2xl border-b-4 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] active:translate-y-0.5 transition-all cursor-pointer text-sm"
                    >
                      {isRegistering ? "Enregistrement..." : "ENREGISTRER LE PRODUIT"}
                    </button>
                  </form>
                </div>

                {/* Right Side: Registered Products Catalog Grid */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-stone-800 text-lg flex items-center gap-2">
                      <Grid className="w-5 h-5 text-[#F47315]" />
                      Produits Enregistrés ({products.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white border-3 border-stone-900 rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(28,25,23,0.95)] hover:shadow-[10px_10px_0px_0px_rgba(244,115,21,1)] transition-all flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start">
                          <span className="bg-stone-100 text-stone-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-stone-200">
                            {p.category === "oil" ? "Huile Bio" : p.category === "honey" ? "Miel Pur" : p.category === "cosmetics" ? "Cosmétique" : p.category === "wellness" ? "Hammam" : "Général"}
                          </span>
                          <span className="text-[#F47315] text-sm font-extrabold">{p.price} DH</span>
                        </div>

                        {/* Interactive floating model inside catalog */}
                        <div className="h-40 my-4 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#FAF8F5] to-orange-50/20 border-2 border-dashed border-stone-200 rounded-2xl">
                          <Product3DModel type={p.photo} size="md" />
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-extrabold text-stone-950 text-md">{p.name}</h4>
                          <p className="text-stone-400 text-xs font-semibold leading-relaxed line-clamp-2">{p.description}</p>
                          <p className="text-[10px] text-stone-500 font-bold bg-amber-50 border border-amber-500/10 px-2 py-1 rounded">
                            ✨ Slogan : "{p.sellingPoint}"
                          </p>
                        </div>

                        {/* action to feed directly into studio */}
                        <div className="mt-4 pt-4 border-t border-stone-100">
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setActiveTab("studio");
                            }}
                            className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold py-2 rounded-xl border border-stone-300 hover:text-stone-900 transition-all cursor-pointer flex items-center justify-center gap-1"
                          >
                            <PenTool className="w-3.5 h-3.5 text-[#F47315]" />
                            Créer une publication pour ce produit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ==================== 4. LE STUDIO IA PAGE ==================== */}
          {activeTab === "studio" && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-black font-serif text-stone-900 flex items-center gap-2">
                    <Palette className="w-8 h-8 text-[#F47315]" />
                    Atelier de Composition
                  </h1>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mt-1">Concevez des créations graphiques et des légendes de prestige en un clic</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* Visual Canvas Composer - Left/Center Column (Takes 5 cols) */}
                <div className="lg:col-span-5 space-y-6 flex flex-col items-center">
                  <h3 className="font-extrabold text-stone-800 text-md flex items-center gap-2 self-start">
                    <Image className="w-5 h-5 text-[#F47315]" />
                    Visuel Créatif Généré
                  </h3>
                  
                  {/* Canvas component with live export capability */}
                  <SocialPostCanvas
                    product={selectedProduct}
                    template={selectedTemplate}
                    format={selectedFormat}
                    promoText={promoText}
                    badgeStyle="badge-3d"
                  />
                </div>

                {/* Configuration Controls - Right Column (Takes 7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Selectors card */}
                  <div className="bg-white border-3 border-stone-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] space-y-6">
                    <h3 className="font-extrabold text-stone-800 text-md border-b border-stone-100 pb-3">
                      ⚙️ Configuration de la Campagne
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Product Selector */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-stone-600 uppercase tracking-wide block">Choisir un Produit</label>
                        <select
                          value={selectedProduct.id}
                          onChange={(e) => {
                            const p = products.find(prod => prod.id === e.target.value);
                            if (p) setSelectedProduct(p);
                          }}
                          className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all cursor-pointer"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.price} DH)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Format Selector */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-stone-600 uppercase tracking-wide block">Format Social</label>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            { key: "square", label: "Post (1:1)" },
                            { key: "story", label: "Story (9:16)" },
                            { key: "whatsapp", label: "WhatsApp" }
                          ] as const).map(item => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setSelectedFormat(item.key)}
                              className={`text-xs py-2 rounded-xl font-extrabold border-2 cursor-pointer transition-all ${
                                selectedFormat === item.key
                                  ? "border-stone-900 bg-stone-900 text-white"
                                  : "border-stone-200 hover:bg-stone-50 text-stone-600"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Slogan Overlay & Template themes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Custom promo band text */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-stone-600 uppercase tracking-wide block">Surslogan Promotionnel</label>
                        <input
                          type="text"
                          value={promoText}
                          onChange={(e) => setPromoText(e.target.value)}
                          placeholder="Ex: LIVRAISON GRATUITE"
                          className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all"
                        />
                      </div>

                      {/* Theme Selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-black text-stone-600 uppercase tracking-wide block">Gabarit Visuel (Axe design)</label>
                        <div className="flex gap-2">
                          {IMAGE_TEMPLATES.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setSelectedTemplate(t)}
                              title={t.name}
                              className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                                selectedTemplate.id === t.id ? "border-stone-900 scale-110 shadow-sm ring-2 ring-[#F47315]/30" : "border-stone-300"
                              } bg-gradient-to-br ${t.bgGradient}`}
                            >
                              {selectedTemplate.id === t.id && (
                                <span className="absolute inset-0 flex items-center justify-center text-[10px]">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                        <span className="text-[10px] text-stone-400 font-bold block pt-1">Thème actuel: {selectedTemplate.name}</span>
                      </div>

                    </div>

                    {/* Trigger Caption AI Generation */}
                    <div className="pt-2">
                      <button
                        onClick={handleGenerateAICopy}
                        disabled={isGeneratingCopy}
                        className="w-full bg-stone-900 hover:bg-stone-850 text-white font-black py-4 px-6 rounded-2xl border-b-4 border-stone-950 shadow-[4px_4px_0px_0px_rgba(244,115,21,1)] flex items-center justify-center gap-3 cursor-pointer transition-all select-none text-sm"
                      >
                        {isGeneratingCopy ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            RÉDACTION DES LÉGENDES ({generationStep}/6)...
                          </>
                        ) : (
                          <>
                            <Languages className="w-5 h-5 text-amber-400" />
                            RÉDIGER LES LÉGENDES (AR/FR/DARIJA)
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Copywriting Output Panel */}
                  <div className="bg-white border-3 border-stone-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] space-y-4">
                    <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                      <h3 className="font-extrabold text-stone-800 text-md flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-amber-500" />
                        Légendes Rédigées par le Studio
                      </h3>
                      {studioFeedback && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Mode Hors-Ligne
                        </span>
                      )}
                    </div>

                    {isGeneratingCopy ? (
                      /* Delightful Loader with Moroccan cultural quotes */
                      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-[#F47315] animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">🇲🇦</div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-stone-800">Processus de création en cours...</p>
                          <p className="text-xs text-stone-400 italic">
                            {generationStep === 1 && "“Analyse de l'argument de vente...”"}
                            {generationStep === 2 && "“Adaptation des métaphores en Darija...”"}
                            {generationStep === 3 && "“Peaufinage de la grammaire arabe...”"}
                            {generationStep === 4 && "“Modernisation de la structure française...”"}
                            {generationStep === 5 && "“Alignement du ton haut de gamme marocain...”"}
                            {generationStep >= 6 && "“Génération de la composition finale...”"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Actual language tabs edit area */
                      <div className="space-y-4">
                        {(!genArabic && !genFrench && !genDarija) ? (
                          <div className="py-10 text-center text-stone-400 space-y-2">
                            <Info className="w-8 h-8 mx-auto opacity-50" />
                            <p className="text-sm font-bold">Aucune légende rédigée pour le moment.</p>
                            <p className="text-xs">Veuillez cliquer sur le bouton ci-dessus pour composer les textes de la publication.</p>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            
                            {/* Darija Tab */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-black text-[#F47315]">
                                <span>1. DARIJA MAROCAINE (Authentique 🇲🇦)</span>
                                <span className="bg-orange-50 px-2 py-0.5 rounded border border-orange-200/50">Haute Fidélité</span>
                              </div>
                              <textarea
                                value={genDarija}
                                onChange={(e) => setGenDarija(e.target.value)}
                                rows={4}
                                className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 rounded-xl p-3 text-sm font-semibold outline-none transition-all leading-relaxed"
                              />
                            </div>

                            {/* French Tab */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-black text-blue-600">
                                <span>2. FRANÇAIS PREMIUM (Prestige ✨)</span>
                              </div>
                              <textarea
                                value={genFrench}
                                onChange={(e) => setGenFrench(e.target.value)}
                                rows={4}
                                className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 rounded-xl p-3 text-sm font-semibold outline-none transition-all leading-relaxed"
                              />
                            </div>

                            {/* Arabic Tab */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-black text-emerald-600">
                                <span>3. ARABE FORMEL (Littéraire 🌿)</span>
                              </div>
                              <textarea
                                value={genArabic}
                                onChange={(e) => setGenArabic(e.target.value)}
                                rows={4}
                                className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 rounded-xl p-3 text-sm font-semibold outline-none transition-all leading-relaxed"
                              />
                            </div>

                            {/* Submit for review */}
                            <div className="pt-2 border-t border-stone-100 flex justify-between items-center">
                              <span className="text-[10px] text-stone-400 font-bold uppercase">
                                Prêt à être envoyé à Mouad (Admin)
                              </span>
                              
                              <button
                                onClick={handleSubmitPostForApproval}
                                className="bg-[#10B981] hover:bg-emerald-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl border-b-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] flex items-center gap-1.5 cursor-pointer select-none"
                              >
                                <CheckSquare className="w-4 h-4" />
                                ENVOYER POUR APPROBATION
                              </button>
                            </div>

                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* ==================== 5. ADMIN PANEL PAGE ==================== */}
          {activeTab === "admin" && currentUser.role === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-black font-serif text-stone-900">Portail de Révision Administrateur</h1>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mt-1">Approuvez, rejetez et peaufinez le calendrier éditorial Maamora</p>
                </div>
              </div>

              {posts.filter(p => p.status === "pending").length === 0 ? (
                /* No pending reviews */
                <div className="bg-white border-3 border-stone-900 rounded-3xl p-12 text-center shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto border border-emerald-200">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-stone-800">Tout est en ordre !</h3>
                    <p className="text-stone-400 text-xs font-medium max-w-md mx-auto">
                      Il n'y a aucun post social media en attente de validation de la part de l'équipe SMM.
                    </p>
                  </div>
                </div>
              ) : (
                /* Interactive reviews list */
                <div className="space-y-8">
                  {posts.filter(p => p.status === "pending").map((post) => {
                    // Match corresponding registered product
                    const matchedProd = products.find(prod => prod.id === post.productId) || PRODUCT_PRESETS[0];
                    const matchedTemp = IMAGE_TEMPLATES.find(t => t.id === post.templateId) || IMAGE_TEMPLATES[0];

                    return (
                      <div
                        key={post.id}
                        className="bg-white border-3 border-stone-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                      >
                        {/* Column 1: Graphic Visuel Preview (Takes 4 cols) */}
                        <div className="lg:col-span-4 flex flex-col items-center gap-4">
                          <span className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 self-start">
                            ⏳ EN ATTENTE DE RELECTURE
                          </span>

                          <SocialPostCanvas
                            product={matchedProd}
                            template={matchedTemp}
                            format={post.format}
                            promoText="Nouveau • جديد"
                            badgeStyle="badge-3d"
                          />
                        </div>

                        {/* Column 2: Legends and comments check (Takes 8 cols) */}
                        <div className="lg:col-span-8 space-y-6">
                          <div>
                            <h4 className="text-xl font-bold font-serif text-stone-950">{post.productName}</h4>
                            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">
                              Post soumis par {PROFILES[0].name} le {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="space-y-4">
                            {/* Darija check */}
                            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                              <span className="text-[10px] font-black text-stone-400 block uppercase mb-1">Légende Darija :</span>
                              <p className="text-sm font-semibold text-stone-800 leading-relaxed whitespace-pre-wrap">{post.captionDarija}</p>
                            </div>

                            {/* French check */}
                            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                              <span className="text-[10px] font-black text-stone-400 block uppercase mb-1">Légende Française :</span>
                              <p className="text-sm font-semibold text-stone-800 leading-relaxed whitespace-pre-wrap">{post.captionFrench}</p>
                            </div>

                            {/* Arabic check */}
                            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                              <span className="text-[10px] font-black text-stone-400 block uppercase mb-1">Légende Arabe :</span>
                              <p className="text-sm font-semibold text-stone-800 leading-relaxed whitespace-pre-wrap">{post.captionArabic}</p>
                            </div>
                          </div>

                          {/* Action Feedback Area */}
                          <div className="pt-4 border-t border-stone-100 space-y-4">
                            <div className="space-y-1">
                              <label className="text-xs font-black text-stone-600 uppercase tracking-wide">Commentaire / Instructions de révision (obligatoire si rejet)</label>
                              <input
                                type="text"
                                value={adminFeedbackText}
                                onChange={(e) => setAdminFeedbackText(e.target.value)}
                                placeholder="Saisir des remarques de relecture, ex: Rendre la partie Darija plus accrocheuse..."
                                className="w-full bg-stone-50 border-2 border-stone-200 focus:border-stone-900 rounded-xl px-4 py-2 text-sm font-semibold outline-none transition-all"
                              />
                            </div>

                            <div className="flex gap-4">
                              <button
                                onClick={() => handleApprovePost(post.id)}
                                className="flex-1 bg-[#10B981] hover:bg-emerald-600 text-white font-extrabold py-3 px-6 rounded-xl border-b-2 border-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,1)] flex items-center justify-center gap-1.5 cursor-pointer transition-all select-none text-xs"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                APPROUVER ET AUTORISER L'EXPORT
                              </button>

                              <button
                                onClick={() => handleRejectPost(post.id)}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-extrabold py-3 px-6 rounded-xl border-b-2 border-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,1)] flex items-center justify-center gap-1.5 cursor-pointer transition-all select-none text-xs"
                              >
                                <ThumbsDown className="w-4 h-4" />
                                REFUSER ET DEMANDER RELECTURE
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* General schedule overview of ALL approved posts */}
              <div className="space-y-4">
                <h3 className="text-lg font-extrabold text-stone-800">
                  🗓️ File d'attente de publication approuvée ({posts.filter(p => p.status === "approved").length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.filter(p => p.status === "approved").map((post) => (
                    <div key={post.id} className="bg-stone-50 border-2 border-stone-200 p-4 rounded-2xl flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-xl">
                        ✓
                      </div>
                      <div className="flex-grow">
                        <p className="font-extrabold text-stone-800 text-sm leading-none">{post.productName}</p>
                        <p className="text-[10px] text-stone-400 capitalize font-semibold mt-1">Format: {post.format}</p>
                      </div>
                      <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded border border-green-200">
                        Prêt
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== 6. SOCIAL MEDIA POSTS STATUS TRACKER (Visible on MES PRODUITS / Dashboard) ==================== */}
          {currentUser.role === "social_media_manager" && (activeTab === "products" || activeTab === "dashboard") && (
            <div className="mt-14 space-y-6">
              <h3 className="text-xl font-extrabold text-stone-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#F47315]" />
                Suivi de mes publications soumises
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className={`bg-white border-3 border-stone-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] flex flex-col justify-between ${
                      post.status === "rejected" ? "ring-2 ring-red-500/20" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black text-stone-800 leading-none">{post.productName}</span>
                      {post.status === "approved" ? (
                        <span className="bg-green-100 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded border border-green-200 uppercase">
                          Approuvé ✓
                        </span>
                      ) : post.status === "rejected" ? (
                        <span className="bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded border border-red-200 uppercase">
                          Correction ✖
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-200 uppercase animate-pulse">
                          En relecture ⏳
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      <p className="text-stone-400 font-bold uppercase text-[9px]">Format: {post.format}</p>
                      
                      {post.adminFeedback && (
                        <div className="bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-100/80">
                          <p className="font-extrabold text-[10px] uppercase">Remarque Admin :</p>
                          <p className="text-[11px] font-semibold mt-0.5 leading-normal">"{post.adminFeedback}"</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-stone-100 flex gap-2">
                      {post.status === "approved" ? (
                        <button
                          onClick={() => {
                            // Copy all captions to clipboard
                            const fullCopy = `[ARABE]\n${post.captionArabic}\n\n[FRANÇAIS]\n${post.captionFrench}\n\n[DARIJA]\n${post.captionDarija}`;
                            navigator.clipboard.writeText(fullCopy);
                            triggerToast("📋 Légendes copiées dans le presse-papier !");
                          }}
                          className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-extrabold text-[10px] py-2 rounded-lg text-center cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          COPIER LES TEXTES
                        </button>
                      ) : post.status === "rejected" ? (
                        <button
                          onClick={() => {
                            // Auto populate studio draft
                            setGenArabic(post.captionArabic);
                            setGenFrench(post.captionFrench);
                            setGenDarija(post.captionDarija);
                            setSelectedProduct(products.find(pr => pr.id === post.productId) || products[0]);
                            setSelectedFormat(post.format);
                            setActiveTab("studio");
                            triggerToast("✍️ Brouillon chargé dans le Studio pour correction.");
                          }}
                          className="flex-1 bg-[#F47315] hover:bg-[#ff852e] text-white font-extrabold text-[10px] py-2 rounded-lg text-center cursor-pointer"
                        >
                          AJUSTER ET RENVOYER
                        </button>
                      ) : (
                        <span className="text-[10px] text-stone-400 text-center font-bold block w-full py-2 bg-stone-50 rounded">
                          Attente de révision
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </AnimatePresence>
      </main>

      {/* Luxury Footer (Inspired by sofihealth.com footer in screenshots) */}
      <footer className="bg-stone-900 text-stone-100 border-t-3 border-stone-950 px-8 py-12 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4 col-span-1 md:col-span-2">
            <div className="flex flex-col items-start select-none">
              <svg className="w-16 h-3 text-[#F47315]" viewBox="0 0 100 20">
                <path d="M10,20 Q50,0 90,20" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              </svg>
              <span className="text-lg font-black tracking-tight mt-[-3px] text-white">
                maamora <span className="text-xs font-medium text-stone-400 uppercase tracking-widest pl-1">Studio</span>
              </span>
            </div>
            <p className="text-stone-400 text-xs max-w-sm leading-relaxed">
              La plateforme d'écriture moderne dédiée aux coopératives agricoles et marques locales marocaines. Valorisons le terroir avec éclat.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-stone-300 uppercase tracking-wider">Liens Utiles</h4>
            <ul className="space-y-1.5 text-xs text-stone-400">
              <li><button onClick={() => setActiveTab("landing")} className="hover:text-white transition-colors cursor-pointer text-left">Accueil</button></li>
              <li><button onClick={() => setActiveTab("dashboard")} className="hover:text-white transition-colors cursor-pointer text-left">Statistiques</button></li>
              <li><button onClick={() => setActiveTab("products")} className="hover:text-white transition-colors cursor-pointer text-left">Catalogue Produits</button></li>
              <li><button onClick={() => setActiveTab("studio")} className="hover:text-white transition-colors cursor-pointer text-left">Atelier Studio</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-stone-300 uppercase tracking-wider">Sécurité & API</h4>
            <p className="text-[10px] text-stone-400 leading-relaxed">
              Intégration d'écriture et d'édition moderne. Les clés d'API sont cryptées et gérées de manière sécurisée côté serveur.
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-stone-800/80 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] text-stone-500 font-bold uppercase tracking-wider gap-4">
          <span>© 2026 MAAMORA STUDIO. TOUS DROITS RÉSERVÉS.</span>
          <div className="flex gap-4">
            <span className="hover:text-stone-300 cursor-pointer">Confidentialité</span>
            <span className="hover:text-stone-300 cursor-pointer">Conditions d'Utilisation</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
