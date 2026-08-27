"use client";
/* CAMPAIGN SWITCHBOARD / AUTHENTICATED WORKSPACE: a landing-color production desk with charcoal controls, warm-paper records, lime active states, and real source → proof → delivery workflows. */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
    ArrowUpRight, Bell, CalendarDays, Check, ChevronRight, CircleHelp, Clock3,
    Download, FileImage, FolderOpen, Layers3, LayoutDashboard, Loader2,
    Package, Palette, Plus, RefreshCw, Search, Settings2, ShieldCheck,
    Sparkles, Store, UploadCloud, Users2,
} from "lucide-react";
import { StudioMark } from "./StudioShell";
import { EditionDeskShell, MetricLedger, RouteControlBar, RouteMasthead } from "./EditionDeskPrimitives";
import { StudioCommandPalette } from "./StudioCommandPalette";
import { AdminControlRoom, type AdminControlNavSection } from "./AdminControlRoom";
import { AssetDepthCarousel } from "./AssetDepthCarousel";
import FadeContent from "@/components/FadeContent";
import CreativeStudio from "@/components/features/studio/CreativeStudio";
import BatchStudio from "@/components/features/studio/BatchStudio";
import ProductList from "@/components/features/products/ProductList";
import { ProductForm } from "@/components/features/products/ProductForm";
import ApprovalsQueue from "@/components/features/products/ApprovalsQueue";
import { createProduct, listProducts, type Product, type ProductInput } from "@/lib/api/products";
import { deletePost, exportPost, listPosts, type Post } from "@/lib/api/posts";
import { getBrand, updateBrand, uploadBrandLogo, type BrandSettings, type BrandSettingsInput } from "@/lib/api/brand";
import { listTemplates, type Template } from "@/lib/api/templates";
import { getCurrentUser, type UserProfile } from "@/lib/api/auth";
import { getSystemCapabilities, type SystemCapabilities } from "@/lib/api/system";
import { getAdminSummary, type AdminSummary } from "@/lib/api/admin";
import { disconnectSocialConnection, getSocialConnectUrl, listPublishJobs, listSocialConnections, queueSocialPublish, type PublishJob, type SocialConnection, type SocialProvider } from "@/lib/api/social";
import { listEmailDeliveries, type EmailDelivery } from "@/lib/api/email";

const workspaceData = {
    dashboard: ["Overview", "Workboard", "Sources, drafts, approvals, delivery.", LayoutDashboard],
    products: ["Products", "Source library", "Products, images, and status.", Package],
    brand: ["Brand kit", "Brand kit", "Logo, color, type, and tone.", Palette],
    studio: ["Studio", "Post editor", "Compose, caption, approve, export.", Sparkles],
    batch: ["Batch", "Batch composer", "Create a post set from approved sources.", Layers3],
    assets: ["Assets", "Assets", "Source and post files.", FolderOpen],
    posts: ["Posts", "Posts", "Drafts, approvals, and exports.", FileImage],
    calendar: ["Calendar", "Calendar", "Post dates and delivery timing.", CalendarDays],
    social: ["Social", "Delivery", "Channels, schedule, and receipts.", Store],
    notifications: ["Notifications", "Activity", "Approvals and email delivery.", Bell],
    settings: ["Settings", "Settings", "Account, capabilities, and connections.", Settings2],
} as const;
type WorkspaceMode = keyof typeof workspaceData;
const workspaceNav: [WorkspaceMode, string, typeof LayoutDashboard][] = [
    ["dashboard", "Overview", LayoutDashboard], ["products", "Products", Package], ["brand", "Brand", Palette],
    ["studio", "Studio", Sparkles], ["batch", "Batch", Layers3], ["assets", "Assets", FolderOpen],
    ["posts", "Posts", FileImage], ["calendar", "Calendar", CalendarDays], ["social", "Social", Store],
    ["notifications", "Notifications", Bell], ["settings", "Settings", Settings2],
];

const workspaceNavSections: { label: string; keys: WorkspaceMode[] }[] = [
    { label: "Create", keys: ["dashboard", "products", "brand", "studio", "batch"] },
    { label: "Library", keys: ["assets", "posts", "calendar"] },
    { label: "Delivery", keys: ["social", "notifications", "settings"] },
];

const workspaceEditionNavigation = workspaceNavSections.map((section) => ({
    label: section.label,
    items: section.keys.map((key) => {
        const [itemKey, label, icon] = workspaceNav.find(([candidate]) => candidate === key)!;
        return { key: itemKey, label, href: `/dashboard/${itemKey}`, icon };
    }),
}));

const adminData = {
    dashboard: ["Admin overview", "Keep the system healthy", ShieldCheck], users: ["Users", "The people moving the work", Users2],
    workspaces: ["Workspaces", "Where the work lives", Layers3], products: ["Products", "Source material review", Package],
    content: ["Content", "Editorial control room", FileImage], templates: ["Templates", "Reusable creative scaffolds", Sparkles],
    generations: ["Generations", "Model activity", Sparkles], publishing: ["Publishing", "What is moving out", ArrowUpRight],
    analytics: ["Analytics", "Read the motion", LayoutDashboard], "audit-logs": ["Audit logs", "A clear paper trail", CircleHelp],
    settings: ["Admin settings", "System controls", Settings2],
} as const;
type AdminMode = keyof typeof adminData;

const adminEditionNavigation = Object.entries(adminData).map(([key, value]) => ({
    key,
    label: value[0],
    href: `/admin/${key}`,
    icon: value[2] as typeof ShieldCheck,
}));

const adminControlNavigation: AdminControlNavSection[] = [
    { label: "MONITOR", items: adminEditionNavigation.filter((item) => ["dashboard", "analytics"].includes(item.key)) },
    { label: "REVIEW", items: adminEditionNavigation.filter((item) => ["products", "content", "templates", "generations", "publishing"].includes(item.key)) },
    { label: "SYSTEM", items: adminEditionNavigation.filter((item) => ["users", "workspaces", "audit-logs", "settings"].includes(item.key)) },
];

const testingCatalog: ReadonlyArray<ProductInput & { assetPath: string }> = [
    {
        name: "TEST · Arc Runner sneaker",
        description: "A STUDIO testing reference for validating the local template composition, captions, approvals, export, and scheduling workflow.",
        sellingPoint: "Testing source material — delete when your live product catalog is ready.",
        price: 0,
        assetPath: "/studio/creative/arc-runner-product.jpg",
    },
    {
        name: "TEST · Campaign detail",
        description: "A close editorial product reference for checking crop behavior, headline hierarchy, and alternative visual directions in STUDIO.",
        sellingPoint: "Testing source material — created only in your current workspace.",
        price: 0,
        assetPath: "/studio/creative/campaign-detail.jpg",
    },
    {
        name: "TEST · Campaign wide frame",
        description: "A wide campaign reference for testing social crops, caption variants, approval states, and scheduled delivery without using a live catalog item.",
        sellingPoint: "Testing source material — remove after verification.",
        price: 0,
        assetPath: "/studio/creative/campaign-wide.jpg",
    },
];

function Notice({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
    return <div className="studio-unavailable"><span className="studio-kicker studio-kicker--dark">BACKEND SIGNAL</span><h3>{title}</h3><p>{detail}</p>{action}</div>;
}

function TestingCatalog({ products, onCreated }: { products: Product[]; onCreated: () => void }) {
    const [importing, setImporting] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const importCatalog = async () => {
        const existingNames = new Set(products.map((product) => product.name.trim().toLocaleLowerCase()));
        const missing = testingCatalog.filter((product) => !existingNames.has(product.name.toLocaleLowerCase()));
        if (!missing.length) { setStatus("The testing catalog is already available in this workspace."); return; }

        setImporting(true); setStatus(null);
        try {
            const origin = window.location.origin;
            const results = await Promise.allSettled(missing.map(({ assetPath, ...product }) => createProduct({ ...product, imageUrl: new URL(assetPath, origin).toString() })));
            const created = results.filter((result) => result.status === "fulfilled").length;
            const failed = results.length - created;
            onCreated();
            setStatus(failed ? `${created} testing product${created === 1 ? "" : "s"} added; ${failed} could not be created. Try again to complete the catalog.` : `${created} testing products added to your workspace.`);
        } catch (error) {
            setStatus(error instanceof Error ? error.message : "Unable to add the testing catalog.");
        } finally { setImporting(false); }
    };

    return <div className="mt-6 border border-dashed border-[#c5c4bb] bg-[#f4f3ed] p-4"><span className="studio-kicker studio-kicker--dark">QUICK TESTING CATALOG</span><h3 className="mt-2 font-serif text-xl text-[#11130f]">Start with three disposable references.</h3><p className="mt-2 text-xs leading-5 text-[#777870]">Adds clearly labeled test products to your own workspace through the live product API. Their image references are bundled with STUDIO; no provider, account, or external asset is used.</p><button type="button" className="studio-button studio-button--dark mt-4" disabled={importing} onClick={() => void importCatalog()}>{importing ? <Loader2 className="studio-spin" size={14} /> : <Package size={14} />}{importing ? "Adding catalog…" : "Add testing catalog"}</button><p className="mt-3 text-[11px] leading-4 text-[#777870]">Test records are marked as pending, remain visible only to their creator until approved, and can be deleted from the product list after verification.</p>{status && <p role="status" className="studio-inline-notice mt-3">{status}</p>}</div>;
}

function useLiveWorkspace() {
    const [products, setProducts] = useState<Product[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const reload = useCallback(async ({ background = false }: { background?: boolean } = {}) => {
        if (!background) setLoading(true);
        setError(null);
        try { const [nextProducts, nextPosts] = await Promise.all([listProducts(), listPosts()]); setProducts(nextProducts); setPosts(nextPosts); }
        catch (err) { setError(err instanceof Error ? err.message : "Unable to load workspace data"); }
        finally { if (!background) setLoading(false); }
    }, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch intentionally hydrates this client surface.
    useEffect(() => { void reload(); }, [reload]);
    return { products, posts, loading, error, reload };
}

function Stats({ products, posts }: { products: Product[]; posts: Post[] }) {
    const approved = products.filter((product) => product.status === "APPROVED").length;
    const ready = posts.filter((post) => post.status !== "DRAFT").length;
    const last = posts[0]?.createdAt ? new Date(posts[0].createdAt).toLocaleDateString() : "No activity";
    return <MetricLedger className="studio-overview-stats" items={[
        { label: "PRODUCTS", value: products.length, detail: `${approved} approved` },
        { label: "POSTS", value: posts.length, detail: `${ready} ready to ship` },
        { label: "READY", value: ready, detail: ready ? "Ready to review" : "Awaiting first post", accent: "ink" },
        { label: "RECENT ACTIVITY", value: posts.length ? "LIVE" : "—", detail: last, accent: "vermilion" },
    ]} />;
}

function WorkspaceReadiness({ products, posts }: { products: Product[]; posts: Post[] }) {
    const [brand, setBrand] = useState<BrandSettings | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => { getBrand().then(setBrand).catch(() => setFailed(true)); }, []);
    const hasBrand = Boolean(brand?.configured);
    const hasProduct = products.length > 0;
    const hasPost = posts.length > 0;
    const steps = [
        { label: "Direction", detail: hasBrand ? brand?.name || "Brand ready" : "Keep it neutral or set a point of view", href: "/dashboard/brand", ready: hasBrand },
        { label: "Source", detail: hasProduct ? `${products.length} product${products.length === 1 ? "" : "s"} in the workspace` : "Add the first product reference", href: "/dashboard/products", ready: hasProduct },
        { label: "Composition", detail: hasPost ? `${posts.length} saved post${posts.length === 1 ? "" : "s"}` : "Create the first visual direction", href: "/dashboard/studio", ready: hasPost },
    ];
    if (failed) return null;
    return <section className="studio-workspace-readiness" aria-label="Workspace readiness">
        <div className="studio-workspace-readiness__lead"><span className="studio-kicker studio-kicker--dark">WORKSPACE THREAD</span><p>{brand === null ? "Reading your workspace…" : hasBrand ? "Your brand direction is configured. Keep the next hand-off visible." : "STUDIO stays brand-neutral until you choose otherwise."}</p></div>
        <ol>{steps.map((step, index) => <li className={step.ready ? "is-ready" : ""} key={step.label}><span>{step.ready ? <Check size={12} /> : `0${index + 1}`}</span><div><strong>{step.label}</strong><small>{step.detail}</small></div><Link href={step.href} aria-label={`Open ${step.label}`}><ChevronRight size={15} /></Link></li>)}</ol>
    </section>;
}

function Overview({ products, posts, refresh }: { products: Product[]; posts: Post[]; refresh: () => void }) {
    const approvedSources = products.filter((product) => product.status === "APPROVED").length;
    const pendingSources = products.filter((product) => product.status === "PENDING").length;
    const rejectedSources = products.filter((product) => product.status === "REJECTED").length;
    const multiImageSources = products.filter((product) => Boolean(product.imageUrl && product.imageUrl2)).length;
    const draftPosts = posts.filter((post) => post.status === "DRAFT").length;
    const approvedPosts = posts.filter((post) => post.status === "APPROVED").length;
    const recentPosts = posts.slice(0, 6);
    const funnel = [
        { label: "Sources", value: products.length, detail: `${approvedSources} approved` },
        { label: "Proofs", value: posts.length, detail: `${draftPosts} draft` },
        { label: "Approved", value: approvedPosts, detail: "Ready for delivery" },
        { label: "Source depth", value: `${multiImageSources}/${products.length}`, detail: "2+ images" },
    ];
    return <div className="studio-worktable studio-worktable--overview studio-analysis-dashboard">
        <RouteMasthead kicker="WORKBOARD / ANALYSIS" title="Workboard" description="Live source, post, approval, and delivery signals." actions={<button className="studio-text-button" onClick={refresh}><RefreshCw size={14} /> Refresh</button>} />
        <FadeContent duration={220} distance={6} threshold={0.08} className="studio-quiet-reveal"><Stats products={products} posts={posts} /></FadeContent>
        <div className="studio-analysis-dashboard__grid">
            <section className="studio-analysis-panel studio-analysis-panel--funnel"><div className="studio-analysis-panel__heading"><div><span className="studio-kicker">PIPELINE</span><h2>Record flow</h2></div><span>LIVE</span></div><div className="studio-analysis-funnel">{funnel.map((item, index) => <div key={item.label}><span>0{index + 1}</span><strong>{item.value}</strong><b>{item.label}</b><small>{item.detail}</small></div>)}</div></section>
            <section className="studio-analysis-panel studio-analysis-panel--quality"><div className="studio-analysis-panel__heading"><div><span className="studio-kicker">SOURCE QUALITY</span><h2>Coverage</h2></div></div><dl><div><dt>Approved source ratio</dt><dd>{products.length ? `${Math.round((approvedSources / products.length) * 100)}%` : "—"}</dd></div><div><dt>Multi-image sources</dt><dd>{multiImageSources}</dd></div><div><dt>Pending review</dt><dd>{pendingSources}</dd></div><div><dt>Rejected source</dt><dd>{rejectedSources}</dd></div></dl></section>
            <section className="studio-analysis-panel studio-analysis-panel--status"><div className="studio-analysis-panel__heading"><div><span className="studio-kicker">DELIVERY READINESS</span><h2>Current state</h2></div></div><div className="studio-analysis-status"><div><span className={approvedPosts ? "is-positive" : ""} /> <strong>{approvedPosts ? "Approved posts available" : "No approved post"}</strong><small>{approvedPosts ? `${approvedPosts} post${approvedPosts === 1 ? "" : "s"} can enter delivery.` : "Approval is reflected here when a saved post changes state."}</small></div><div><span className={draftPosts ? "is-warn" : ""} /> <strong>{draftPosts ? "Draft review pending" : "No drafts pending"}</strong><small>{draftPosts ? `${draftPosts} draft${draftPosts === 1 ? "" : "s"} in the current record set.` : "No draft review signal in the current record set."}</small></div></div></section>
        </div>
        <section className="studio-analysis-panel studio-analysis-panel--activity"><div className="studio-analysis-panel__heading"><div><span className="studio-kicker">RECENT RECORDS</span><h2>Post activity</h2></div><span>{recentPosts.length} records</span></div>{recentPosts.length ? <div className="studio-analysis-table" role="table" aria-label="Recent post activity"><div role="row" className="studio-analysis-table__head"><span role="columnheader">Product</span><span role="columnheader">Format</span><span role="columnheader">State</span><span role="columnheader">Recorded</span></div>{recentPosts.map((post) => <div role="row" key={post.id}><strong role="cell">{post.productName || "Untitled post"}</strong><span role="cell">{post.format || "—"}</span><span role="cell" className={`studio-analysis-status-tag studio-analysis-status-tag--${post.status.toLowerCase()}`}>{post.status}</span><time role="cell">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "—"}</time></div>)}</div> : <div className="studio-analysis-empty"><strong>No post records</strong><span>Analysis will populate from saved records.</span></div>}</section>
    </div>;
}

function BrandGuardrails({ draft }: { draft: BrandSettingsInput }) {
    const hasLogo = Boolean(draft.logoUrl);
    const hasTone = Boolean(draft.toneGuidelines?.trim());
    return <div className="studio-brand-guardrails"><span className="studio-kicker">CREATIVE GUARDRAILS</span><ul><li className={hasLogo ? "is-ready" : ""}><span>{hasLogo ? <Check size={12} /> : "01"}</span><div><strong>Logo safe placement</strong><small>{hasLogo ? "Saved mark can be selectively placed in Studio." : "Optional until a saved logo is available."}</small></div></li><li className="is-ready"><span><Check size={12} /></span><div><strong>Color pair</strong><small>Primary and secondary tokens are saved with this kit.</small></div></li><li className={hasTone ? "is-ready" : ""}><span>{hasTone ? <Check size={12} /> : "03"}</span><div><strong>Voice guidance</strong><small>{hasTone ? "Tone direction is available to the creative team." : "Add optional tone guidance for consistent review."}</small></div></li></ul><div className="studio-color-pair"><span style={{ background: draft.primaryColor || "#B9DD45" }} /><span style={{ background: draft.secondaryColor || "#11130F" }} /></div><p>Brand placement remains an explicit choice for each local composition; neutral posts stay available.</p></div>;
}

function BrandSurface() {
    const [brand, setBrand] = useState<BrandSettings | null>(null);
    const [draft, setDraft] = useState<BrandSettingsInput>({ name: "", logoUrl: "", primaryColor: "#B9DD45", secondaryColor: "#11130F", fontFamily: "Space Grotesk", toneGuidelines: "" });
    const [status, setStatus] = useState("Loading brand kit…"); const [saving, setSaving] = useState(false); const [uploadingLogo, setUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { getBrand().then((value) => { setBrand(value); setDraft(value.configured ? { name: value.name ?? "", logoUrl: value.logoUrl ?? "", primaryColor: value.primaryColor ?? "", secondaryColor: value.secondaryColor ?? "", fontFamily: value.fontFamily ?? "", toneGuidelines: value.toneGuidelines ?? "" } : { name: "", logoUrl: "", primaryColor: "#B9DD45", secondaryColor: "#11130F", fontFamily: "Space Grotesk", toneGuidelines: "" }); setStatus(""); }).catch((err) => setStatus(err instanceof Error ? err.message : "Unable to load brand kit")); }, []);
    const save = async () => { setSaving(true); setStatus(""); try { const value = await updateBrand(draft); setBrand(value); setStatus("Brand settings saved."); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to save brand kit"); } finally { setSaving(false); } };
    const chooseLogo = async (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) { setStatus("Choose a PNG, JPG, WebP, or SVG logo."); return; }
        if (file.size > 15 * 1024 * 1024) { setStatus("The logo must be 15 MB or smaller."); return; }
        setUploadingLogo(true); setStatus("");
        try {
            const value = await uploadBrandLogo(file);
            setDraft((current) => ({ ...current, logoUrl: value.logoUrl ?? "" }));
            setBrand(value);
            setStatus("Logo uploaded and saved.");
        }
        catch (err) { setStatus(err instanceof Error ? err.message : "Unable to upload and save logo"); }
        finally { setUploadingLogo(false); }
    };
    if (!brand && status === "Loading brand kit…") return <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> {status}</div>;
    return <div className="studio-live-columns"><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">BRAND SETTINGS</span><h2>{brand?.configured && brand.name ? brand.name : "Set up your brand"}</h2></div><span className="studio-chip">LIVE API</span></div><div className="studio-form-grid">{([["name", "Brand name"], ["primaryColor", "Primary color"], ["secondaryColor", "Secondary color"], ["fontFamily", "Font family"]] as const).map(([key, label]) => <label key={key}>{label}<input value={draft[key] ?? ""} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}<div className="studio-form-grid__wide space-y-3"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wide text-[#6f7068]">Brand logo</span>{draft.logoUrl && <span className="studio-chip">Ready</span>}</div><input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void chooseLogo(file); }} /><div className="flex flex-col gap-3 border border-dashed border-[#93a66d] bg-[#f6f8ee] p-3 sm:flex-row sm:items-center">{draft.logoUrl ? <img src={draft.logoUrl} alt="Brand logo preview" className="h-14 w-28 rounded-sm border border-[#d6d5cc] bg-white object-contain p-2" /> : <div className="flex h-14 w-28 items-center justify-center border border-[#d6d5cc] bg-[#faf9f4] text-[10px] font-bold uppercase tracking-wide text-[#8b8b83]">No logo</div>}<div className="min-w-0 flex-1"><p className="text-xs font-bold text-[var(--studio-ink)]">Upload a transparent logo for the cleanest post placement.</p><p className="mt-1 text-[11px] text-[#6f7068]">PNG, JPG, WebP, or SVG · max 15 MB</p></div><button type="button" className="studio-button studio-button--paper whitespace-nowrap" disabled={uploadingLogo} onClick={() => logoInputRef.current?.click()}>{uploadingLogo ? <Loader2 className="studio-spin" size={14} /> : <UploadCloud size={14} />}{uploadingLogo ? "Uploading…" : "Upload logo"}</button></div><label>Logo URL<input value={draft.logoUrl ?? ""} onChange={(event) => setDraft({ ...draft, logoUrl: event.target.value })} placeholder="Or paste a hosted image URL" /></label></div><label className="studio-form-grid__wide">Tone guidelines<textarea rows={5} value={draft.toneGuidelines ?? ""} onChange={(event) => setDraft({ ...draft, toneGuidelines: event.target.value })} /></label></div>{status && <p className="studio-inline-notice">{status}</p>}<button className="studio-button studio-button--dark" disabled={saving || uploadingLogo} onClick={() => void save()}>{saving ? <Loader2 className="studio-spin" size={15} /> : <Check size={15} />} Save brand kit</button></section><section className="studio-workspace-panel studio-workspace-panel--accent"><span className="studio-kicker studio-kicker--dark">STUDIO RULE</span><h2>{brand?.configured ? "Keep the source of truth close." : "Your posts start neutral."}</h2><p>{brand?.configured ? "This saved logo can be added in Studio, then placed where it supports the layout best." : "Upload a logo or save a brand name here, then choose whether to add it to each post in Studio."}</p><BrandGuardrails draft={draft} /></section></div>;
}

function BrandLibraryPanel() {
    const [brand, setBrand] = useState<BrandSettings | null>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => { getBrand().then(setBrand).catch(() => setFailed(true)); }, []);
    const configured = Boolean(brand?.configured);
    return <aside className="studio-source-library__brand"><span className="studio-kicker">BRAND KIT</span><h2>{configured ? brand?.name || "Your brand rules" : "Keep the rules close."}</h2><p>{configured ? "This kit can be selectively placed on a post from Studio. It never overwrites a neutral workspace by default." : "Set the mark, color, typography, and tone once. Studio lets you decide when those rules belong on a post."}</p><div className="studio-source-library__brand-preview">{brand === null && !failed ? <><span>BRAND STATE</span><strong>Reading kit…</strong><small>Checking the saved workspace settings.</small></> : configured ? <>{brand?.logoUrl ? <img src={brand.logoUrl} alt="Configured brand logo" /> : <span>NO LOGO FILE</span>}<strong>{brand?.logoUrl ? "Logo ready for placement" : "Brand name configured"}</strong><small>{brand?.logoUrl ? "Choose placement in Studio for each post." : "Upload a logo from Brand to use it in posts."}</small></> : <><span>LOGO PLACEMENT</span><strong>No brand mark configured</strong><small>Configure your brand kit to preview post placement.</small></>}</div><Link href="/dashboard/brand" className="studio-button studio-button--lime">Open Brand kit <ArrowUpRight size={15} /></Link></aside>;
}

function ProductsSurface({ products, refresh }: { products: Product[]; refresh: () => void }) {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | Product["status"]>("ALL");
    const filteredProducts = products.filter((product) => (statusFilter === "ALL" || product.status === statusFilter) && `${product.name} ${product.description}`.toLowerCase().includes(query.trim().toLowerCase()));
    const completeSources = products.filter((product) => [product.imageUrl, product.imageUrl2, product.imageUrl3].filter(Boolean).length >= 2).length;
    return <div className="studio-worktable studio-worktable--source-library"><RouteMasthead kicker="SOURCE LIBRARY / 02" title="Keep the material close." description="Organize references, inspect source completeness, and move the selected material into Studio." actions={<><span className="studio-worktable__count">{products.length} source record{products.length === 1 ? "" : "s"}</span><Link href="/dashboard/studio" className="studio-button studio-button--dark">Open Studio <ArrowUpRight size={15} /></Link></>} /><div className="studio-source-library"><section className="studio-source-library__catalog"><FadeContent duration={280} distance={8} threshold={0.1} className="studio-quiet-reveal"><div className="studio-source-library__section-head"><span>PRODUCT CONTACT SHEET</span><p>{completeSources}/{products.length} source records include two or more images.</p></div><div className="studio-source-controls"><label><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter source records" aria-label="Filter product sources" /></label><div role="group" aria-label="Filter products by status">{(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((status) => <button type="button" key={status} aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)}>{status === "ALL" ? "All" : status[0] + status.slice(1).toLowerCase()}</button>)}</div></div><ProductList products={filteredProducts} onProductDeleted={refresh} /></FadeContent></section><FadeContent duration={300} delay={35} distance={8} threshold={0.1} className="studio-quiet-reveal"><BrandLibraryPanel /></FadeContent><section className="studio-source-library__upload"><FadeContent duration={320} delay={65} distance={8} threshold={0.1} className="studio-quiet-reveal"><div><span className="studio-kicker studio-kicker--dark">ADD SOURCE</span><h2>Bring in the next material.</h2><p>Use all three image slots when different angles or crops matter to the next direction.</p></div><ProductForm onCreated={refresh} /><TestingCatalog products={products} onCreated={refresh} /></FadeContent></section></div></div>;
}

function BrandWorktable() {
    return <div className="studio-worktable studio-worktable--brand"><RouteMasthead kicker="BRAND / 03" title="Brand kit" description="Logo, color, type, tone." actions={<Link href="/dashboard/studio" className="studio-button studio-button--dark">Open Studio <ArrowUpRight size={15} /></Link>} /><BrandSurface /></div>;
}

function PostsSurface({ posts, refresh }: { posts: Post[]; refresh: () => void }) {
    const [busy, setBusy] = useState<string | null>(null);
    const exportOne = async (id: string) => { setBusy(id); try { const blob = await exportPost(id); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `studio-post-${id}.zip`; link.click(); URL.revokeObjectURL(url); } catch (err) { window.alert(err instanceof Error ? err.message : "Unable to export post"); } finally { setBusy(null); } };
    const remove = async (id: string) => { setBusy(id); try { await deletePost(id); refresh(); } catch (err) { window.alert(err instanceof Error ? err.message : "Unable to delete post"); } finally { setBusy(null); } };
    return <section className="studio-workspace-panel studio-review-ledger"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">CONTENT PIPELINE</span><h2>Posts</h2><p className="studio-panel-caption">A review ledger for saved local compositions and their export state.</p></div><Link className="studio-button studio-button--dark" href="/dashboard/studio"><Plus size={14} /> New post</Link></div>{posts.length ? <div className="studio-data-stack studio-review-ledger__rows">{posts.map((post, index) => <div className="studio-data-row studio-data-row--post" key={post.id}><span className="studio-record-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{post.imageUrl ? <img src={post.imageUrl} alt="" /> : <span className="studio-file-thumb studio-file-thumb--1" />}<div><strong>{post.productName}</strong><small>{post.format || "Post"} · {post.captionEn ? "Captions ready" : "Captions pending"}</small></div><span className={`studio-review-state studio-review-state--${post.status.toLowerCase()}`}>{post.status}</span><span className="studio-data-actions"><button type="button" title="Export post" aria-label={`Export ${post.productName}`} disabled={busy === post.id} onClick={() => void exportOne(post.id)}><Download size={14} /></button><button type="button" title="Delete post" aria-label={`Delete ${post.productName}`} disabled={busy === post.id} onClick={() => void remove(post.id)}>×</button></span></div>)}</div> : <Notice title="No posts yet." detail="Open Studio to compose the first image from an approved product." action={<Link className="studio-button studio-button--dark" href="/dashboard/studio">Open Studio <Sparkles size={14} /></Link>} />}</section>;
}

function AssetsSurface({ products, posts }: { products: Product[]; posts: Post[] }) {
    const assets = [...products.flatMap((product) => [product.imageUrl, product.imageUrl2, product.imageUrl3].filter(Boolean).map((url) => ({ url: url as string, label: product.name, kind: "Product" }))), ...posts.filter((post) => post.imageUrl).map((post) => ({ url: post.imageUrl as string, label: post.productName, kind: "Generated post" }))];
    return <section className="studio-workspace-panel studio-assets-library"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">ASSET MEMORY</span><h2>Approved visual sources</h2><p className="studio-panel-caption">Product references and saved post files, held in one inspectable contact sheet.</p></div><span className="studio-chip">{assets.length} files</span></div>{assets.length ? <><AssetDepthCarousel items={assets.map((asset, index) => ({ ...asset, id: `${asset.url}-${index}` }))} /><div className="studio-asset-grid">{assets.map((asset, index) => <a className="studio-asset-card" key={`${asset.url}-${index}`} href={asset.url} target="_blank" rel="noreferrer"><img src={asset.url} alt={asset.label} /><div><strong>{asset.label}</strong><small>{asset.kind}</small></div></a>)}</div></> : <Notice title="No assets have landed yet." detail="Upload a product reference to start building the library." action={<Link className="studio-button studio-button--dark" href="/dashboard/products">Add source material <Plus size={14} /></Link>} />}</section>;
}

function CalendarSurface({ posts }: { posts: Post[] }) {
    const scheduled = [...posts].filter((post) => post.createdAt).sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
    return <section className="studio-workspace-panel studio-calendar-ledger"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">CONTENT TIMELINE</span><h2>Recorded post dates</h2><p className="studio-panel-caption">This lane reflects persisted creation dates. Scheduled delivery times live in Social receipts.</p></div><span className="studio-chip">{scheduled.length} dated</span></div>{scheduled.length ? <div className="studio-calendar-ledger__rows">{scheduled.map((post) => { const recordedAt = new Date(post.createdAt as string); return <Link className="studio-calendar-row" key={post.id} href="/dashboard/posts"><time dateTime={post.createdAt as string}><b>{String(recordedAt.getDate()).padStart(2, "0")}</b><small>{recordedAt.toLocaleDateString(undefined, { month: "short" })}</small></time><span className="studio-calendar-row__track" aria-hidden="true"><i /></span><div><strong>{post.productName}</strong><small>{post.status} · {post.format || "Post"}</small></div><span className={`studio-review-state studio-review-state--${post.status.toLowerCase()}`}>{post.status}</span><ChevronRight size={14} /></Link>; })}</div> : <Notice title="The date lane is waiting for a saved post." detail="Create a post in Studio and its persisted creation date will appear here." action={<Link className="studio-button studio-button--dark" href="/dashboard/studio"><Plus size={14} /> Create a post</Link>} />}</section>;
}

function NotificationsSurface({ products, posts }: { products: Product[]; posts: Post[] }) {
    const [deliveries, setDeliveries] = useState<EmailDelivery[]>([]);
    const [deliveryError, setDeliveryError] = useState<string | null>(null);
    useEffect(() => { listEmailDeliveries().then(setDeliveries).catch((err) => setDeliveryError(err instanceof Error ? err.message : "Unable to load email delivery history")); }, []);
    const notices = [
        ...products.filter((product) => product.status === "PENDING").map((product) => ({ id: `product-${product.id}`, title: `${product.name} needs approval`, detail: "Product source is waiting in the moderation queue.", href: "/dashboard/products" })),
        ...posts.filter((post) => post.status === "DRAFT").map((post) => ({ id: `post-${post.id}`, title: `${post.productName} is still a draft`, detail: "Review captions or export the post from the content pipeline.", href: "/dashboard/posts" })),
    ];
    return <div className="studio-live-columns"><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">LIVE SIGNALS</span><h2>Notifications from real records</h2></div><span className="studio-chip">{notices.length} open</span></div>{notices.length ? <div className="studio-data-stack">{notices.map((notice) => <Link className="studio-data-row" key={notice.id} href={notice.href}><span className="studio-status-dot studio-status-dot--lime" /><div><strong>{notice.title}</strong><small>{notice.detail}</small></div><ChevronRight size={14} /></Link>)}</div> : <Notice title="Nothing needs your attention." detail="Approval and draft events will appear here as your workspace changes." />}</section><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">SMTP DELIVERY</span><h2>Email history</h2></div><span className="studio-chip">{deliveries.length} records</span></div>{deliveryError ? <Notice title="Email history unavailable." detail={deliveryError} /> : deliveries.length ? <div className="studio-data-stack">{deliveries.slice(0, 8).map((delivery) => <div className="studio-data-row" key={delivery.id}><span className={`studio-status-dot ${delivery.status === "SENT" ? "studio-status-dot--lime" : ""}`} /><div><strong>{delivery.subject}</strong><small>{delivery.toAddress} · {delivery.status}{delivery.errorMessage ? ` · ${delivery.errorMessage}` : ""}</small></div><span className="studio-data-value">{delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString() : "Queued"}</span></div>)}</div> : <Notice title="No email deliveries yet." detail="SMTP delivery records will appear here after an authenticated send request is queued." />}</section></div>;
}

function SocialSurface({ posts }: { posts: Post[] }) {
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [jobs, setJobs] = useState<PublishJob[]>([]);
    const [selectedPost, setSelectedPost] = useState("");
    const [selectedConnection, setSelectedConnection] = useState("");
    const [scheduledFor, setScheduledFor] = useState("");
    const [status, setStatus] = useState("");
    const [busy, setBusy] = useState(false);
    const [timezone, setTimezone] = useState("your device timezone");
    const providers: SocialProvider[] = ["META", "TIKTOK", "LINKEDIN", "X"];
    const providerLabels: Record<SocialProvider, string> = { META: "Meta / Instagram + Facebook", TIKTOK: "TikTok", LINKEDIN: "LinkedIn", X: "X" };
    const reload = useCallback(async () => { try { const [nextConnections, nextJobs] = await Promise.all([listSocialConnections(), listPublishJobs()]); setConnections(nextConnections); setJobs(nextJobs); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to load social publishing data"); } }, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch intentionally hydrates this client surface.
    useEffect(() => { void reload(); }, [reload]);
    useEffect(() => { setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "your device timezone"); }, []);
    const connect = async (provider: SocialProvider) => {
        setBusy(true); setStatus("");
        try {
            const capabilities = await getSystemCapabilities();
            const configured = provider === "META" ? capabilities.metaOAuth : provider === "TIKTOK" ? capabilities.tiktokOAuth : provider === "LINKEDIN" ? capabilities.linkedinOAuth : capabilities.xOAuth;
            if (!configured) throw new Error(`${providerLabels[provider]} needs server configuration before it can connect.`);
            window.location.assign(await getSocialConnectUrl(provider));
        } catch (err) { setStatus(err instanceof Error ? err.message : "Provider OAuth is not configured"); }
        finally { setBusy(false); }
    };
    const disconnect = async (id: string) => { setBusy(true); try { await disconnectSocialConnection(id); await reload(); setStatus("Connection marked disconnected."); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to disconnect provider"); } finally { setBusy(false); } };
    const publish = async () => { if (!selectedPost || !selectedConnection) { setStatus("Choose an approved post and an active channel first."); return; } setBusy(true); setStatus(""); try { await queueSocialPublish({ postId: selectedPost, connectionId: selectedConnection, scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null }); setStatus(scheduledFor ? "Scheduled delivery saved. STUDIO will hand it to the connected channel at the selected time." : "Publish job queued. The provider response will determine its final state."); setSelectedPost(""); setScheduledFor(""); await reload(); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to queue publish job"); } finally { setBusy(false); } };
    const approvedPosts = posts.filter((post) => post.status === "APPROVED");
    const activeConnections = connections.filter((connection) => connection.status === "ACTIVE");
    const steps = [
        { number: "01", title: "Connect", detail: activeConnections.length ? `${activeConnections.length} active channel${activeConnections.length === 1 ? "" : "s"}` : "Choose a channel below", ready: activeConnections.length > 0 },
        { number: "02", title: "Choose", detail: selectedPost ? "Approved post selected" : "Select an approved post", ready: Boolean(selectedPost) },
        { number: "03", title: "Schedule", detail: scheduledFor ? `${new Date(scheduledFor).toLocaleString()} (${timezone})` : `Now or a future time · ${timezone}`, ready: Boolean(selectedConnection) },
    ];
    return <div className="studio-delivery-board space-y-5"><section className="studio-workspace-panel studio-publish-stepper studio-delivery-path"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">AUTOMATION SETUP</span><h2>Connect once. Schedule with intent.</h2><p>STUDIO stores the delivery time on the server; it is not a browser reminder.</p></div><span className="studio-chip">{activeConnections.length} live</span></div><ol>{steps.map((step, index) => <li className={step.ready ? "is-ready" : ""} key={step.number}><span>{step.ready ? <Check size={14} /> : step.number}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div>{index < steps.length - 1 && <i />}</li>)}</ol></section><div className="studio-live-columns"><section className="studio-workspace-panel studio-channel-board"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">STEP 01 / CONNECTIONS</span><h2>Choose your channels</h2><p className="studio-panel-caption">A connection becomes available only after its server-side OAuth configuration is ready.</p></div><span className="studio-chip">OAuth</span></div><div className="studio-data-stack">{providers.map((provider) => { const connection = connections.find((item) => item.provider === provider && item.status === "ACTIVE"); return <div className="studio-data-row" key={provider}><span className={`studio-status-dot ${connection ? "studio-status-dot--lime" : ""}`} /><div><strong>{providerLabels[provider]}</strong><small>{connection ? `${connection.accountName || "Connected account"} · ready to schedule` : "Connect to enable scheduled delivery"}</small></div>{connection ? <button type="button" className="studio-text-button" disabled={busy} onClick={() => void disconnect(connection.id)}>Disconnect</button> : <button type="button" className="studio-text-button" disabled={busy} onClick={() => void connect(provider)}>Connect</button>}</div>; })}</div>{status && <p className="studio-inline-notice" role="status">{status}</p>}</section><section className="studio-workspace-panel studio-workspace-panel--accent studio-delivery-picker"><span className="studio-kicker studio-kicker--dark">STEPS 02–03 / DELIVERY</span><h2>Pick the post, then pick the moment.</h2><p>An approved post is required. A blank time publishes immediately; a future time is persisted and picked up by the delivery scheduler.</p><div className="studio-form-grid"><label>Approved post<select value={selectedPost} onChange={(event) => setSelectedPost(event.target.value)}><option value="">Choose a post</option>{approvedPosts.map((post) => <option key={post.id} value={post.id}>{post.productName} · {post.format}</option>)}</select></label><label>Connected channel<select value={selectedConnection} onChange={(event) => setSelectedConnection(event.target.value)}><option value="">Choose a channel</option>{activeConnections.map((connection) => <option key={connection.id} value={connection.id}>{providerLabels[connection.provider]} · {connection.accountName || "Account"}</option>)}</select></label><label className="studio-form-grid__wide">Schedule for <span className="studio-field-hint">Leave blank to publish now.</span><div className="studio-schedule-input"><Clock3 size={15} /><input type="datetime-local" value={scheduledFor} min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} onChange={(event) => setScheduledFor(event.target.value)} /></div></label></div><button type="button" className="studio-button studio-button--dark" disabled={busy || !approvedPosts.length || !activeConnections.length || !selectedPost || !selectedConnection} onClick={() => void publish()}><ArrowUpRight size={14} /> {scheduledFor ? "Schedule delivery" : "Queue publish"}</button>{!approvedPosts.length && <p className="studio-inline-notice">No approved posts are available yet.</p>}</section></div><section className="studio-workspace-panel studio-workspace-panel--wide studio-delivery-receipts"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">DELIVERY RECEIPTS</span><h2>Publish jobs</h2><p className="studio-panel-caption">Server-recorded delivery outcomes, not a simulated posting feed.</p></div><span className="studio-chip">{jobs.length} jobs</span></div>{jobs.length ? <div className="studio-data-stack">{jobs.slice(0, 10).map((job) => <div className="studio-data-row" key={job.id}><span className={`studio-status-dot ${job.status === "SENT" ? "studio-status-dot--lime" : ""}`} /><div><strong>{providerLabels[job.provider]} · {job.status}</strong><small>{job.scheduledFor && job.status === "QUEUED" ? `Scheduled for ${new Date(job.scheduledFor).toLocaleString()}` : job.externalPostId ? `Provider id ${job.externalPostId}` : job.errorMessage || "Awaiting provider response"}</small></div><span className="studio-data-value">{job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Queued"}</span></div>)}</div> : <Notice title="No publish jobs yet." detail="Connect a provider, choose an approved post, then save a delivery time." />}</section></div>;
}

function SettingsSurface() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => { Promise.all([getCurrentUser(), getSystemCapabilities()]).then(([nextProfile, nextCapabilities]) => { setProfile(nextProfile); setCapabilities(nextCapabilities); }).catch((err) => setError(err instanceof Error ? err.message : "Unable to load workspace settings")); }, []);
    if (error) return <Notice title="Settings unavailable." detail={error} action={<Link className="studio-button studio-button--dark" href="/dashboard">Return to overview</Link>} />;
    if (!profile || !capabilities) return <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading workspace settings…</div>;
    const capabilityRows: [string, boolean, string][] = [["Caption templates", capabilities.captionGeneration, "Local multilingual copy"], ["Visual composition", capabilities.imageGeneration, "Local SVG renderer"], ["Cloud storage", capabilities.cloudStorage, "Media persistence"], ["Local storage", capabilities.localStorage, "Fallback persistence"], ["Social publishing", capabilities.socialPublishing, "Connected channels"], ["SMTP email", capabilities.smtpEmail, "Outbound delivery"], ["Meta OAuth", capabilities.metaOAuth, "Account connection"], ["TikTok OAuth", capabilities.tiktokOAuth, "Account connection"], ["LinkedIn OAuth", capabilities.linkedinOAuth, "Account connection"], ["X OAuth", capabilities.xOAuth, "Account connection"]];
    return <div className="studio-live-columns studio-settings-board"><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">ACCOUNT</span><h2>{profile.name || profile.email}</h2><p className="studio-panel-caption">The authenticated account currently holding this workspace.</p></div><span className="studio-chip">{profile.role}</span></div><div className="studio-data-stack"><div className="studio-data-row"><div><strong>Email</strong><small>{profile.email}</small></div></div><div className="studio-data-row"><div><strong>Workspace</strong><small>{profile.brandId ? "Brand workspace connected" : "No brand workspace yet"}</small></div></div><div className="studio-data-row"><div><strong>Member since</strong><small>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Not available"}</small></div></div></div></section><section className="studio-workspace-panel studio-workspace-panel--accent studio-readiness-board"><span className="studio-kicker studio-kicker--dark">WORKSPACE READINESS</span><h2>Creation runs locally; connections only affect delivery.</h2><div className="studio-data-stack">{capabilityRows.map(([label, ready, detail]) => <div className="studio-data-row" key={label}><span className={`studio-status-dot ${ready ? "studio-status-dot--lime" : ""}`} /><div><strong>{label}</strong><small>{ready ? detail : "Not connected"}</small></div></div>)}</div></section></div>;
}

function Unavailable({ label, reason }: { label: string; reason: string }) { return <Notice title={`${label} is ready for its backend route.`} detail={reason} action={<Link className="studio-button studio-button--dark" href="/contact">Talk to the team <ArrowUpRight size={14} /></Link>} />; }

function Surface({ mode, products, posts, refresh, onStudioPostChange }: { mode: WorkspaceMode; products: Product[]; posts: Post[]; refresh: () => void; onStudioPostChange: () => void }) {
    if (mode === "dashboard") return <Overview products={products} posts={posts} refresh={refresh} />;
    if (mode === "products") return <ProductsSurface products={products} refresh={refresh} />;
    if (mode === "brand") return <BrandWorktable />;
    if (mode === "studio") return <section className="studio-workspace-panel studio-workspace-panel--wide studio-workspace-panel--studio"><CreativeStudio products={products} onPostChange={onStudioPostChange} /></section>;
    if (mode === "batch") return <section className="studio-workspace-panel studio-workspace-panel--wide"><BatchStudio products={products} onBatchChange={refresh} /></section>;
    if (mode === "posts") return <PostsSurface posts={posts} refresh={refresh} />;
    if (mode === "assets") return <AssetsSurface products={products} posts={posts} />;
    if (mode === "calendar") return <CalendarSurface posts={posts} />;
    if (mode === "social") return <SocialSurface posts={posts} />;
    if (mode === "notifications") return <NotificationsSurface products={products} posts={posts} />;
    return <SettingsSurface />;
}

export function WorkspacePage({ mode }: { mode: WorkspaceMode }) {
    const [label, title, description, Icon] = workspaceData[mode];
    const isStudioRoute = mode === "studio";
    const isWorktableRoute = mode === "dashboard" || mode === "products" || mode === "brand";
    const { products, posts, loading, error, reload } = useLiveWorkspace();
    const searchRef = useRef<HTMLInputElement>(null);
    return <EditionDeskShell activeKey={mode} contextLabel="CREATIVE OPERATIONS" navigation={workspaceEditionNavigation}><StudioCommandPalette /><div className={`${isStudioRoute ? "studio-app--studio" : ""} studio-edition-route studio-edition-route--${mode}`}>{!isStudioRoute && !isWorktableRoute && <div className="studio-workspace-topbar"><RouteMasthead kicker={`WORKSPACE / ${label.toUpperCase()}`} title={title} description={description} actions={<><button className="studio-icon-button" aria-label={`Focus ${label.toLowerCase()} search`} onClick={() => searchRef.current?.focus()}><Search size={17} /></button><Link href="/dashboard/studio" className="studio-button studio-button--dark"><Plus size={15} /> New direction</Link></>} /></div>}<section className={`studio-workspace-content ${isWorktableRoute ? "studio-workspace-content--worktable" : ""}`}>{!isStudioRoute && !isWorktableRoute && <RouteControlBar icon={Icon} label={label}><label className="studio-search"><Search size={15} /><input ref={searchRef} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label.toLowerCase()}`} /></label></RouteControlBar>}{error && <div className="studio-form-error"><strong>Live data unavailable.</strong> {error} <button onClick={() => void reload()}>Retry</button></div>}{loading ? <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading live workspace data…</div> : <Surface mode={mode} products={products} posts={posts} refresh={() => void reload({ background: true })} onStudioPostChange={() => void reload({ background: true })} />}</section></div></EditionDeskShell>;
}

function AdminSurface({ mode, products, posts, templates, summary, capabilities }: { mode: AdminMode; products: Product[]; posts: Post[]; templates: Template[]; summary: AdminSummary | null; capabilities: SystemCapabilities | null }) {
    if (mode === "products") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">MODERATION QUEUE</span><h2>Pending products</h2></div><span className="studio-chip">ADMIN API</span></div><ApprovalsQueue /></section>;
    if (["content", "generations", "publishing"].includes(mode)) return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">LIVE RECORDS</span><h2>{mode === "publishing" ? "Publishing records" : mode === "generations" ? "Composition records" : "Content records"}</h2></div><span className="studio-chip">{posts.length} posts</span></div><div className="studio-data-stack">{posts.length ? posts.map((post) => <div className="studio-data-row" key={post.id}><span className="studio-status-dot" /><div><strong>{post.productName}</strong><small>{post.status} · {post.format}</small></div><span className="studio-data-value">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "New"}</span><ChevronRight size={14} /></div>) : <Notice title="No content records." detail="Composed posts will appear here once a workspace creates them." />}</div></section>;
    if (mode === "templates") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">TEMPLATE LIBRARY</span><h2>Reusable scaffolds</h2></div><span className="studio-chip">{templates.length} loaded</span></div><div className="studio-data-stack">{templates.length ? templates.map((template) => <div className="studio-data-row" key={template.id}><span className="studio-status-dot studio-status-dot--lime" /><div><strong>{template.name}</strong><small>{template.format}</small></div><span className="studio-data-value">{template.thumbnailUrl ? "Preview ready" : "No thumbnail"}</span><ChevronRight size={14} /></div>) : <Notice title="No templates returned." detail="Templates are loaded from `/api/templates`." />}</div></section>;
    if (mode === "dashboard" || mode === "analytics") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">BACKEND SIGNAL</span><h2>{mode === "analytics" ? "Observed workspace motion" : "System overview"}</h2></div><span className="studio-chip">{summary ? "LIVE SUMMARY" : "RECORD FALLBACK"}</span></div><div className="studio-stat-grid studio-stat-grid--admin"><div><span>USERS</span><strong>{summary?.users ?? "—"}</strong><small>Registered accounts</small></div><div><span>WORKSPACES</span><strong>{summary?.workspaces ?? "—"}</strong><small>Configured brand workspaces</small></div><div><span>PRODUCTS</span><strong>{summary?.products ?? products.length}</strong><small>Admin-visible source material</small></div><div><span>POSTS</span><strong>{summary?.posts ?? posts.length}</strong><small>Generated content records</small></div><div><span>TEMPLATES</span><strong>{summary?.templates ?? templates.length}</strong><small>Reusable creative scaffolds</small></div><div><span>PENDING</span><strong>{summary?.pendingProducts ?? "—"}</strong><small>Products awaiting review</small></div></div></section>;
    if (mode === "users" || mode === "workspaces") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">LIVE DIRECTORY</span><h2>{mode === "users" ? "Account directory" : "Workspace directory"}</h2></div><span className="studio-chip">READ ONLY</span></div><div className="studio-stat-grid studio-stat-grid--admin"><div><span>{mode === "users" ? "USERS" : "WORKSPACES"}</span><strong>{mode === "users" ? summary?.users ?? "—" : summary?.workspaces ?? "—"}</strong><small>Derived from persisted records</small></div><div><span>PRODUCTS</span><strong>{summary?.products ?? products.length}</strong><small>Source material in scope</small></div><div><span>POSTS</span><strong>{summary?.posts ?? posts.length}</strong><small>Content records in scope</small></div></div><Notice title="Directory mutations are intentionally disabled." detail="The current API exposes safe counts but not user deletion, workspace reassignment, or role-management endpoints. No destructive control is presented without an audited backend route." /></section>;
    if (mode === "publishing" || mode === "settings") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">SYSTEM READINESS</span><h2>{mode === "publishing" ? "Delivery readiness" : "Admin settings"}</h2></div><span className="studio-chip">LIVE STATUS</span></div><div className="studio-data-stack">{[["Caption templates", capabilities?.captionGeneration, "Local"], ["Visual composition", capabilities?.imageGeneration, "Local"], ["Cloud storage", capabilities?.cloudStorage, "Connected"], ["Local storage", capabilities?.localStorage, "Available"], ["Social publishing", capabilities?.socialPublishing, "Connected"], ["Email delivery", capabilities?.emailDelivery, "Connected"]].map(([label, ready, readyLabel]) => <div className="studio-data-row" key={String(label)}><span className={`studio-status-dot ${ready ? "studio-status-dot--lime" : ""}`} /><div><strong>{label}</strong><small>{ready ? readyLabel : "Not connected"}</small></div><span className="studio-data-value">{ready ? "READY" : "SETUP"}</span></div>)}</div><Notice title="Local creation is always self-contained." detail="Visual compositions and multilingual caption templates run inside STUDIO without image-generation or caption API keys. Connect channel credentials only when you are ready to deliver content by email or social publishing." /></section>;
    if (mode === "audit-logs") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">GOVERNANCE</span><h2>Audit log readiness</h2></div><span className="studio-chip">NOT ENABLED</span></div><Notice title="Audit persistence is not yet exposed by the current schema." detail="The control room does not invent audit entries. Add an audit-event table and append-only controller before enabling this route for compliance workflows." action={<Link className="studio-button studio-button--outline" href="/contact"><CircleHelp size={14} /> Request audit module</Link>} /></section>;
    return <Unavailable label={adminData[mode][0]} reason={`The current backend has no ${adminData[mode][0].toLowerCase()} controller.`} />;
}

export function AdminPage({ mode }: { mode: AdminMode }) {
    const [label, title, Icon] = adminData[mode];
    const [products, setProducts] = useState<Product[]>([]); const [posts, setPosts] = useState<Post[]>([]); const [templates, setTemplates] = useState<Template[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<AdminSummary | null>(null); const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
    const reload = useCallback(async () => { setLoading(true); setError(null); try { const [nextProducts, nextPosts, nextTemplates, nextSummary, nextCapabilities] = await Promise.all([listProducts(), listPosts(), listTemplates(), getAdminSummary(), getSystemCapabilities()]); setProducts(nextProducts); setPosts(nextPosts); setTemplates(nextTemplates); setSummary(nextSummary); setCapabilities(nextCapabilities); } catch (err) { setError(err instanceof Error ? err.message : "Unable to load admin data"); } finally { setLoading(false); } }, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch intentionally hydrates this admin surface.
    useEffect(() => { void reload(); }, [reload]);
    return <AdminControlRoom activeKey={mode} sections={adminControlNavigation} kicker={`CONTROL ROOM / ${label.toUpperCase()}`} title={label} utility={<button type="button" className="studio-admin-refresh" onClick={() => void reload()}><RefreshCw size={14} /> Refresh</button>}><div className={`studio-admin-route studio-admin-route--${mode}`}>{error && <div className="studio-form-error"><strong>Admin data unavailable.</strong> {error}</div>}{loading ? <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading admin data…</div> : <AdminSurface mode={mode} products={products} posts={posts} templates={templates} summary={summary} capabilities={capabilities} />}</div></AdminControlRoom>;
}
