import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductForm } from "@/components/features/products/ProductForm";
import ProductList from "@/components/features/products/ProductList";
import CreativeStudio from "@/components/features/studio/CreativeStudio";
import prisma from "@/lib/prisma";
import {
  LayoutDashboard,
  Package,
  Palette,
  Sparkles,
  Calendar,
  BarChart3,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  Download,
  Info,
  CheckCircle,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Settings,
  HelpCircle,
  Check
} from "lucide-react";

// ─── Demo brand ID ────────────────────────────────────────────────────────────
const DEMO_BRAND_ID = "demo-brand-001";

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-zinc-900 bg-zinc-950"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="h-44 w-full bg-zinc-900 animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 bg-zinc-900 rounded" />
            <div className="h-3 w-1/3 bg-zinc-900 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DB error fallback ────────────────────────────────────────────────────────

async function ProductListWithFallback({ brandId }: { brandId: string }) {
  try {
    return <ProductList workspaceBrandId={brandId} />;
  } catch {
    return (
      <div className="flex h-56 w-full flex-col items-center justify-center gap-3.5 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/5 p-6">
        <div className="flex h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 items-center justify-center text-zinc-400 text-sm font-mono font-bold">
          !
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-zinc-200">Database connection offline</p>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            Please check that your configuration and environment local drivers are running correctly.
          </p>
        </div>
      </div>
    );
  }
}

// ─── Navigation Layout ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", tab: "dashboard" },
  { icon: Package, label: "Products", tab: "products" },
  { icon: Palette, label: "Brand Kit", tab: "brand-kit" },
  { icon: Sparkles, label: "Content Studio", tab: "content-studio" },
  { icon: Calendar, label: "Schedule", tab: "schedule" },
  { icon: BarChart3, label: "Analytics", tab: "analytics" },
];

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentTab = params.tab || "dashboard";

  // Pull telemetry metrics from DB
  const products = await prisma.product.findMany({
    where: { brandId: DEMO_BRAND_ID },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const productCount = products.length;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50 font-sans antialiased text-sm">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-zinc-900 bg-zinc-950 shrink-0 select-none">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-zinc-900 flex flex-col items-center">
          <div className="relative w-full h-12 bg-white rounded-lg p-3 border border-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
            <img
              src="/maamora-logo.jpg"
              alt="Maamora Logo"
              className="h-full object-contain"
            />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-3 font-semibold font-mono">WORKSPACE PLATFORM</span>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.tab;
            return (
              <Link
                key={item.tab}
                href={`/?tab=${item.tab}`}
                className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 transition-all duration-200 ${isActive
                  ? "bg-gradient-to-r from-orange-950/20 to-transparent border-l-2 border-orange-500 text-orange-400 font-medium pl-3"
                  : "text-zinc-400 border-l-2 border-transparent hover:text-zinc-200 hover:bg-zinc-900/30"
                  }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-orange-450" : "text-zinc-500"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Workspace Account badge */}
        <div className="m-4 rounded-xl border border-zinc-900 bg-zinc-950 p-4">
          <p className="text-[9px] uppercase tracking-widest text-zinc-500 mb-2 font-mono">Current Account</p>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400 uppercase">
              DB
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-300">Demo Brand</p>
              <p className="text-[10px] text-zinc-500">Premium Sync Enabled</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* ── Header ────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/90 px-8 py-4 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-bold text-zinc-100 tracking-tight leading-tight uppercase font-mono">
              {currentTab === "dashboard" && "Dashboard Workspace"}
              {currentTab === "products" && "Product Catalogue"}
              {currentTab === "brand-kit" && "Brand Settings"}
              {currentTab === "content-studio" && "Creative Content Studio"}
              {currentTab === "schedule" && "Approved Creative Calendar"}
              {currentTab === "analytics" && "Workspace Analytics"}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {currentTab === "dashboard" && "Overview of active workspace creations and catalogue state."}
              {currentTab === "products" && "Manage product specifications inside the campaign database."}
              {currentTab === "brand-kit" && "Adjust brand assets, specific hex colors, and custom voices."}
              {currentTab === "content-studio" && "Generate promotional cards, Darija captions, and exports."}
              {currentTab === "schedule" && "Timeline tracking of campaign assets approved for distribution."}
              {currentTab === "analytics" && "Review performance charts and download conversion metrics."}
            </p>
          </div>

          <div className="flex items-center gap-4 select-none">
            {/* Environment Indicator */}
            <span className="hidden sm:flex items-center gap-2 rounded-md border border-zinc-900 bg-zinc-900/30 px-3 py-1.5 text-xs font-mono font-semibold text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              DEMO-WORKSPACE
            </span>

            {/* Avatar Profile */}
            <div className="h-8.5 w-8.5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
              SM
            </div>
          </div>
        </header>

        {/* ── Dynamic Views Switcher ────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-8 py-8">

          {/* TAB 1: DASHBOARD */}
          {currentTab === "dashboard" && (
            <div className="space-y-8 fade-in">
              {/* Top stats block */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Indexed Products", value: String(productCount), desc: "Registered items" },
                  { label: "Total Generations", value: "24", desc: "Templates compiled" },
                  { label: "Queued Posts", value: "3", desc: "Approved in timeline" },
                  { label: "Workspace Members", value: "1 Active", desc: "Team workspace tier" }
                ].map((stat, i) => (
                  <div key={i} className="rounded-xl border border-zinc-900 bg-zinc-950 p-5 hover:border-zinc-800 transition-colors">
                    <span className="text-xs text-zinc-500 font-semibold block">{stat.label}</span>
                    <span className="text-2xl font-bold font-mono text-zinc-100 block mt-1 tracking-tight">{stat.value}</span>
                    <span className="text-[10px] text-zinc-400 mt-1 block font-mono">{stat.desc}</span>
                  </div>
                ))}
              </div>

              {/* Grid content split */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">

                {/* Recent creation activity log */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-tight text-zinc-300 uppercase font-mono">Recent Creations</h3>
                    <Link href="/?tab=content-studio" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                      New Creative
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 overflow-hidden">
                    <div className="p-4 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400">Campaign Output</span>
                      <span className="text-xs text-zinc-500 font-mono">Format</span>
                    </div>

                    <div className="divide-y divide-zinc-900">
                      {[
                        { title: "Classic Running Shoes Promo", date: "2 hours ago", lang: "Darija + French", ratio: "Instagram (1:1)" },
                        { title: "Yoga Performance Mat Launch", date: "Yesterday", lang: "Moroccan Darija", ratio: "Story (9:16)" },
                        { title: "Wireless Sport Earbuds Audio", date: "3 days ago", lang: "French", ratio: "WhatsApp Story" },
                      ].map((item, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-zinc-900/10 transition-colors">
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-zinc-300 block">{item.title}</span>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                              <span>{item.date}</span>
                              <span>·</span>
                              <span>{item.lang}</span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
                            {item.ratio}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick actions panel */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold tracking-tight text-zinc-300 uppercase font-mono">Actions</h3>

                  <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-5 space-y-4">
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      Start generating content instantly. Products indexed here can be formatted into custom creatives matching your brand templates.
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      <Link href="/?tab=content-studio" className="w-full flex items-center justify-between text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-md py-2.5 px-4 shadow shadow-orange-700/20 text-center">
                        Launch Content Studio
                        <Sparkles className="h-3.5 w-3.5" />
                      </Link>

                      <Link href="/?tab=products" className="w-full text-center text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold rounded-md py-2.5 px-4 transition-colors block">
                        Manage Product Catalog
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {currentTab === "products" && (
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[380px_1fr] fade-in">
              <div>
                <ProductForm workspaceBrandId={DEMO_BRAND_ID} />
              </div>

              <div className="min-w-0">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Product Inventory</span>
                    <div className="h-px bg-zinc-900 w-16" />
                  </div>
                  <span className="text-xs font-mono text-zinc-600">LIMIT: 24 SHOWN</span>
                </div>

                <Suspense fallback={<ProductListSkeleton />}>
                  <ProductListWithFallback brandId={DEMO_BRAND_ID} />
                </Suspense>
              </div>
            </div>
          )}

          {/* TAB 3: BRAND KIT */}
          {currentTab === "brand-kit" && (
            <div className="max-w-xl mx-auto space-y-8 fade-in">
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-300 uppercase font-mono">Brand Visual Assets</h3>
                  <p className="text-xs text-zinc-500">Configure visual themes and brand parameters.</p>
                </div>
                <div className="space-y-6">
                  {/* Brand logo display */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400">Current Logo Asset</label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-44 bg-white rounded-lg border border-zinc-800 p-3.5 flex items-center justify-center overflow-hidden shrink-0">
                        <img src="/maamora-logo.jpg" alt="Brand Logo" className="h-full object-contain" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-zinc-200 block">maamora-logo.jpg</span>
                        <span className="text-[10px] text-zinc-500 font-mono">18.8 KB · JPEG</span>
                      </div>
                    </div>
                  </div>

                  {/* Brand Voice select */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400">Linguistic Copywriting Direction</label>
                    <select className="flex w-full rounded-md border border-zinc-900 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-orange-500/50">
                      <option>Casual Moroccan Darija + Professional French (Default)</option>
                      <option>Formal Standard Arabic Only</option>
                      <option>Linguistic Hybrid - Bold Local Focus</option>
                    </select>
                  </div>

                  {/* Palette selectors */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-zinc-400 block">Workspace Colors</label>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="h-8 w-8 rounded-full bg-orange-500 border border-orange-600 shadow" />
                        <span className="text-[10px] font-mono text-zinc-500">Primary</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="h-8 w-8 rounded-full bg-white border border-zinc-300 shadow" />
                        <span className="text-[10px] font-mono text-zinc-500">Secondary</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="h-8 w-8 rounded-full bg-zinc-950 border border-zinc-900 shadow" />
                        <span className="text-[10px] font-mono text-zinc-500">Accent</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-zinc-900">
                    <button className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-md shadow shadow-orange-700/20">
                      Save Brand Configuration
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTENT STUDIO */}
          {currentTab === "content-studio" && (
            <div className="fade-in">
              {products.length > 0 ? (
                <CreativeStudio products={products} />
              ) : (
                <div className="flex h-64 w-full flex-col items-center justify-center gap-3.5 rounded-xl border border-dashed border-zinc-900 bg-zinc-900/5 p-6">
                  <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-zinc-200">Catalogue Workspace Empty</p>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                      Please seed or add products via the Catalogue page before using the Creative Content Studio.
                    </p>
                    <div className="pt-3">
                      <Link href="/?tab=products" className="text-xs text-orange-400 font-semibold hover:underline">
                        Add product now &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SCHEDULE */}
          {currentTab === "schedule" && (
            <div className="max-w-xl mx-auto space-y-6 fade-in">
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-300 uppercase font-mono flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Approval Calendar Timeline
                  </h3>
                  <p className="text-xs text-zinc-500">Track asset queues. Human approval is required before distribution.</p>
                </div>
                <div className="space-y-4">
                  {[
                    { title: "Yoga Performance Mat - Promo Launch", platform: "WhatsApp Story", status: "Approved", date: "July 12, 10:00 AM", variant: "bg-emerald-950/10 text-emerald-400 border border-emerald-950/40" },
                    { title: "Classic Running Shoes - Performance Post", platform: "Instagram Square", status: "Review", date: "July 15, 04:00 PM", variant: "bg-orange-950/10 text-orange-400 border border-orange-950/40" },
                    { title: "Wireless Sport Earbuds - Audio Deal", platform: "Facebook Post", status: "Draft", date: "July 20, 11:30 AM", variant: "bg-zinc-900 text-zinc-500 border border-zinc-800" },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border border-zinc-900 rounded-lg flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-zinc-200 block">{item.title}</span>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                          <span>{item.platform}</span>
                          <span>·</span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${item.variant}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ANALYTICS */}
          {currentTab === "analytics" && (
            <div className="space-y-6 fade-in max-w-xl mx-auto">
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-300 uppercase font-mono flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    Marketing Analytics Summary
                  </h3>
                  <p className="text-xs text-zinc-500">Track and review package downloads.</p>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900">
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase block leading-none">Total Downloads</span>
                      <span className="text-2xl font-bold font-mono text-orange-400 block mt-2">142</span>
                    </div>
                    <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-900">
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase block leading-none">Average Copy Rate</span>
                      <span className="text-2xl font-bold font-mono text-zinc-250 block mt-2">87%</span>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <span className="text-xs font-semibold text-zinc-400 block">Export Format Distribution</span>
                    {[
                      { label: "Instagram Square (1:1)", value: 68 },
                      { label: "Story / Status (9:16)", value: 45 },
                      { label: "Facebook Post (4:5)", value: 29 },
                    ].map((row, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                          <span>{row.label}</span>
                          <span>{row.value} exports</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded overflow-hidden">
                          <div className="h-full bg-orange-650 rounded animate-pulse" style={{ width: `${(row.value / 142) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <footer className="border-t border-zinc-900 px-8 py-4 flex items-center justify-between">
          <p className="text-xs font-mono font-medium text-zinc-500 select-none">
            MAAMORA PLATFORM ENGINE <span className="mx-1.5 text-zinc-700">·</span> v0.1.0
          </p>
          <p className="text-xs text-zinc-650 font-mono select-none">
            NEXT.JS · PRISMA · SQLITE
          </p>
        </footer>
      </div>
    </div>
  );
}


