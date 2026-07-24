"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { RequireAuth } from "@/components/features/auth/RequireAuth";
import { LogoutButton } from "@/components/features/auth/LogoutButton";
import { ProductForm } from "@/components/features/products/ProductForm";
import ProductList from "@/components/features/products/ProductList";
import ApprovalsQueue from "@/components/features/products/ApprovalsQueue";
import CreativeStudio from "@/components/features/studio/CreativeStudio";
import { listProducts, type Product } from "@/lib/api/products";
import { listPosts, type Post } from "@/lib/api/posts";
import { isAdmin } from "@/lib/api/client";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  ShieldCheck,
  PenTool,
  TrendingUp,
  Languages,
  ChevronRight,
} from "lucide-react";

function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border-3 border-stone-900 bg-white"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="h-44 w-full bg-stone-100 animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 bg-stone-100 rounded" />
            <div className="h-3 w-1/3 bg-stone-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", tab: "dashboard" },
  { icon: Package, label: "Produits", tab: "products" },
  { icon: Sparkles, label: "Atelier Créatif", tab: "studio" },
];

const ADMIN_NAV_ITEM = { icon: ShieldCheck, label: "Revue Admin", tab: "admin" };

const FORMAT_LABELS: Record<string, string> = {
  SQUARE_POST: "Post carré",
  STORY: "Story",
  WHATSAPP_STATUS: "WhatsApp",
};

const CHART_COLORS = ["#F47315", "#2D5A41", "#1B5E4F", "#9A3412"];

function DashboardPageInner() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";

  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAdminUser] = useState(() => isAdmin());
  const navItems = isAdminUser ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  const refetchProducts = useCallback(() => {
    setLoading(true);
    Promise.all([listProducts(), listPosts()])
      .then(([p, po]) => {
        setProducts(p);
        setPosts(po);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load workspace data"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial workspace data fetch on mount
    refetchProducts();
  }, [refetchProducts]);

  const productCount = products.length;
  const pendingCount = products.filter((p) => p.status === "PENDING").length;
  const approvedPostsCount = posts.filter((p) => p.status === "APPROVED" || p.status === "EXPORTED").length;
  const draftPostsCount = posts.filter((p) => p.status === "DRAFT").length;

  const barChartData = [
    { name: "Brouillons", count: draftPostsCount, fill: "#F47315" },
    { name: "Approuvés", count: posts.filter((p) => p.status === "APPROVED").length, fill: "#2D5A41" },
    { name: "Exportés", count: posts.filter((p) => p.status === "EXPORTED").length, fill: "#1B5E4F" },
  ];

  const formatCounts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.format] = (acc[p.format] || 0) + 1;
    return acc;
  }, {});
  const formatStatsData = Object.entries(formatCounts).map(([format, value]) => ({
    name: FORMAT_LABELS[format] || format,
    value,
  }));

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] text-stone-900 font-sans antialiased text-sm">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 border-r-3 border-stone-900 bg-white shrink-0 select-none">
        <div className="px-6 py-7 border-b-3 border-stone-900 flex flex-col items-center">
          <div className="relative w-full h-24 bg-white rounded-lg flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/maamora-logo.png" alt="Maamora Logo" className="h-full w-full object-contain" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-3 font-black">WORKSPACE</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.tab;
            return (
              <Link
                key={item.tab}
                href={`/?tab=${item.tab}`}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-150 font-bold text-xs ${isActive
                  ? "bg-[#F47315] text-white border-2 border-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,1)]"
                  : "text-stone-500 border-2 border-transparent hover:text-stone-900 hover:bg-stone-100"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="m-4 rounded-2xl border-2 border-stone-900 bg-stone-50 p-4">
          <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-2 font-black">Compte actuel</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#F47315]/10 border border-[#F47315]/30 flex items-center justify-center text-xs font-black text-[#F47315] uppercase">
                {isAdminUser ? "AD" : "SM"}
              </div>
              <div>
                <p className="text-xs font-bold text-stone-800">Maamora</p>
                <p className="text-[10px] text-stone-400">{isAdminUser ? "Admin" : "Membre équipe"}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        <header className="sticky top-0 z-30 flex items-center justify-between border-b-3 border-stone-900 bg-white/90 px-8 py-4 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-black text-stone-900 tracking-tight leading-tight font-serif">
              {currentTab === "dashboard" && "Console d'activité"}
              {currentTab === "products" && "Catalogue Produits"}
              {currentTab === "studio" && "Atelier de Composition"}
              {currentTab === "admin" && "Revue Admin"}
            </h1>
            <p className="text-xs text-stone-400 mt-0.5 font-medium">
              {currentTab === "dashboard" && "Données et statistiques d'automatisation sociale."}
              {currentTab === "products" && "Gérez les fiches produits partagées par toute l'équipe."}
              {currentTab === "studio" && "Composez un visuel, générez les légendes, exportez."}
              {currentTab === "admin" && "Approuvez les produits soumis avant qu'ils ne soient utilisables."}
            </p>
          </div>

          <div className="flex items-center gap-4 select-none">
            <span className="hidden sm:flex items-center gap-2 rounded-full border-2 border-stone-900 bg-white px-3 py-1.5 text-xs font-black text-stone-700">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F47315]" />
              MAAMORA
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">

          {/* Tabs stay mounted once visited (hidden via CSS, not removed from
              the tree) instead of unmounting on switch. Studio in particular
              needs this: an in-flight caption/image generation is a plain
              awaited fetch with no AbortController, so it always completes
              server-side — but unmounting the component used to throw away
              the local `post` state that shows the result, making it look
              like navigating away "stopped" the work. */}

          {/* TAB: DASHBOARD */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={currentTab === "dashboard" ? "space-y-8" : "hidden"}
          >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black font-serif text-stone-900">Bienvenue sur Maamora Studio</h2>
                  <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mt-1">Vue d&apos;ensemble du workspace partagé</p>
                </div>
                <Link
                  href="/?tab=studio"
                  className="bg-[#F47315] hover:bg-[#ff852e] text-white font-extrabold px-5 py-2.5 rounded-xl border-b-2 border-stone-900 shadow-[3px_3px_0px_0px_rgba(28,25,23,1)] flex items-center gap-2 cursor-pointer select-none text-xs"
                >
                  <PenTool className="w-4 h-4" />
                  Créer un Post
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border-3 border-stone-900 p-6 rounded-2xl shadow-[5px_5px_0px_0px_rgba(28,25,23,1)] flex items-center justify-between">
                  <div>
                    <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider block">PRODUITS REGISTRÉS</span>
                    <span className="text-3xl font-black text-stone-900 mt-1 block">{productCount}</span>
                  </div>
                </div>

                <div className="bg-white border-3 border-stone-900 p-6 rounded-2xl shadow-[5px_5px_0px_0px_rgba(244,115,21,0.9)] flex items-center justify-between">
                  <div>
                    <span className="text-[#F47315] text-[10px] font-black uppercase tracking-wider block">EN ATTENTE D&apos;APPROBATION</span>
                    <span className="text-3xl font-black text-[#F47315] mt-1 block">{pendingCount}</span>
                  </div>
                </div>

                <div className="bg-white border-3 border-stone-900 p-6 rounded-2xl shadow-[5px_5px_0px_0px_rgba(16,185,129,0.9)] flex items-center justify-between">
                  <div>
                    <span className="text-emerald-600 text-[10px] font-black uppercase tracking-wider block">POSTS APPROUVÉS</span>
                    <span className="text-3xl font-black text-emerald-600 mt-1 block">{approvedPostsCount}</span>
                  </div>
                </div>

                <div className="bg-white border-3 border-stone-900 p-6 rounded-2xl shadow-[5px_5px_0px_0px_rgba(28,25,23,0.6)] flex items-center justify-between">
                  <div>
                    <span className="text-stone-500 text-[10px] font-black uppercase tracking-wider block">BROUILLONS EN COURS</span>
                    <span className="text-3xl font-black text-stone-700 mt-1 block">{draftPostsCount}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border-3 border-stone-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]">
                  <h3 className="font-extrabold text-stone-800 text-lg mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#F47315]" />
                    Répartition des posts par statut
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fill: "#78716c", fontSize: 11, fontWeight: "bold" }} />
                        <YAxis tick={{ fill: "#78716c", fontSize: 11 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#1c1917", color: "#fff", borderRadius: "12px", border: "none" }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {barChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border-3 border-stone-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-stone-800 text-lg mb-4">Formats les plus utilisés</h3>
                    {formatStatsData.length > 0 ? (
                      <div className="h-44 flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={formatStatsData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value">
                              {formatStatsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xl font-black text-stone-800">{posts.length}</span>
                          <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Posts Totaux</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-400 text-center py-10">Aucun post généré pour l&apos;instant.</p>
                    )}
                  </div>
                  <div className="space-y-1.5 pt-4 border-t border-stone-100">
                    {formatStatsData.map((entry, index) => (
                      <div key={entry.name} className="flex justify-between text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                          <span className="text-stone-600">{entry.name}</span>
                        </div>
                        <span className="text-stone-800 font-bold">{entry.value} posts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-stone-900 text-stone-100 rounded-3xl p-8 border-2 border-stone-900 shadow-[6px_6px_0px_0px_rgba(244,115,21,1)] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-lg md:text-xl font-black flex items-center justify-center md:justify-start gap-2">
                    <Languages className="w-5 h-5 text-amber-400" />
                    Légendes Darija Naturelles
                  </h3>
                  <p className="text-stone-400 text-xs font-medium max-w-xl">
                    Générées avec des expressions culturelles marocaines authentiques, pour des posts qui sonnent vrais.
                  </p>
                </div>
                <Link
                  href="/?tab=studio"
                  className="bg-white text-stone-900 hover:bg-stone-100 font-extrabold px-6 py-3 rounded-xl border-b-2 border-stone-950 flex items-center gap-2 cursor-pointer transition-all select-none text-xs"
                >
                  Ouvrir l&apos;Atelier
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
          </motion.div>

          {/* TAB: PRODUCTS */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={currentTab === "products" ? "grid grid-cols-1 gap-8 xl:grid-cols-[380px_1fr]" : "hidden"}
          >
              <div>
                <ProductForm onCreated={refetchProducts} />
              </div>

              <div className="min-w-0">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-stone-500">Catalogue de l&apos;équipe</span>
                </div>

                {loading ? (
                  <ProductListSkeleton />
                ) : loadError ? (
                  <div className="flex h-56 w-full flex-col items-center justify-center gap-3.5 rounded-2xl border-2 border-dashed border-stone-300 bg-white p-6">
                    <div className="flex h-10 w-10 rounded-lg bg-stone-100 border border-stone-300 items-center justify-center text-stone-500 text-sm font-black">!</div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold text-stone-800">Impossible de contacter le serveur</p>
                      <p className="text-xs text-stone-400 max-w-xs mx-auto">{loadError}</p>
                    </div>
                  </div>
                ) : (
                  <ProductList products={products} />
                )}
              </div>
          </motion.div>

          {/* TAB: STUDIO */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={currentTab === "studio" ? "" : "hidden"}
          >
              {products.length > 0 ? (
                <CreativeStudio products={products} onPostChange={refetchProducts} />
              ) : (
                <div className="flex h-64 w-full flex-col items-center justify-center gap-3.5 rounded-2xl border-2 border-dashed border-stone-300 bg-white p-6">
                  <div className="h-9 w-9 rounded-lg bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-500">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-stone-800">Aucun produit disponible</p>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto">
                      Ajoutez un produit dans le Catalogue avant d&apos;utiliser l&apos;Atelier Créatif.
                    </p>
                    <div className="pt-3">
                      <Link href="/?tab=products" className="text-xs text-[#F47315] font-bold hover:underline">
                        Ajouter un produit &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              )}
          </motion.div>

          {/* TAB: ADMIN (approvals, admin only) */}
          {isAdminUser && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={currentTab === "admin" ? "max-w-2xl mx-auto space-y-6" : "hidden"}
            >
              <ApprovalsQueue onChange={refetchProducts} />
            </motion.div>
          )}

        </main>

        <footer className="border-t-3 border-stone-900 px-8 py-4 flex items-center justify-between bg-white">
          <p className="text-xs font-black text-stone-400 select-none">
            MAAMORA STUDIO <span className="mx-1.5 text-stone-300">·</span> v0.2.0
          </p>
          <p className="text-xs text-stone-300 font-bold select-none">
            NEXT.JS · SPRING BOOT · POSTGRESQL
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <DashboardPageInner />
      </Suspense>
    </RequireAuth>
  );
}
