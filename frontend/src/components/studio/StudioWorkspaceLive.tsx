"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
    ArrowUpRight, Bell, CalendarDays, Check, ChevronRight, CircleHelp, Clock3,
    Download, FileImage, FolderOpen, Layers3, LayoutDashboard, Loader2,
    Package, Palette, Plus, RefreshCw, Search, Settings2, ShieldCheck,
    Sparkles, Store, UploadCloud, Users2,
} from "lucide-react";
import { StudioMark } from "./StudioShell";
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
    dashboard: ["Overview", "Your creative operating system", "A live read on what is moving, waiting, and ready to ship.", LayoutDashboard],
    products: ["Products", "Keep the source material close", "Organize product references, campaign inputs, and approved visual directions.", Package],
    brand: ["Brand kit", "Make consistency feel expressive", "Your colors, voice, and rules—available before the next draft begins.", Palette],
    studio: ["Studio", "Compose the next direction", "Bring a prompt, a product, or an unfinished thought. Leave with a visual thread.", Sparkles],
    batch: ["Batch", "More outputs, same point of view", "Create a considered family of assets without starting from scratch each time.", Layers3],
    assets: ["Assets", "A library with memory", "Find the approved crop, caption, and campaign state in fewer clicks.", FolderOpen],
    posts: ["Posts", "Keep the publishing thread intact", "Move from draft to approval with the original creative context attached.", FileImage],
    calendar: ["Calendar", "See the next move", "Map campaigns, channels, and handoffs before they become urgent.", CalendarDays],
    social: ["Social", "Publish with intent", "Bring channel constraints into the same creative conversation.", Store],
    notifications: ["Notifications", "Signals, not noise", "Stay close to the moments that need your point of view.", Bell],
    settings: ["Settings", "Shape your workspace", "Tune permissions, defaults, integrations, and the way your team moves.", Settings2],
} as const;
type WorkspaceMode = keyof typeof workspaceData;
const workspaceNav: [WorkspaceMode, string, typeof LayoutDashboard][] = [
    ["dashboard", "Overview", LayoutDashboard], ["products", "Products", Package], ["brand", "Brand", Palette],
    ["studio", "Studio", Sparkles], ["batch", "Batch", Layers3], ["assets", "Assets", FolderOpen],
    ["posts", "Posts", FileImage], ["calendar", "Calendar", CalendarDays], ["social", "Social", Store],
    ["notifications", "Notifications", Bell], ["settings", "Settings", Settings2],
];

const adminData = {
    dashboard: ["Admin overview", "Keep the system healthy", ShieldCheck], users: ["Users", "The people moving the work", Users2],
    workspaces: ["Workspaces", "Where the work lives", Layers3], products: ["Products", "Source material review", Package],
    content: ["Content", "Editorial control room", FileImage], templates: ["Templates", "Reusable creative scaffolds", Sparkles],
    generations: ["Generations", "Model activity", Sparkles], publishing: ["Publishing", "What is moving out", ArrowUpRight],
    analytics: ["Analytics", "Read the motion", LayoutDashboard], "audit-logs": ["Audit logs", "A clear paper trail", CircleHelp],
    settings: ["Admin settings", "System controls", Settings2],
} as const;
type AdminMode = keyof typeof adminData;

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

    return <div className="mt-6 border border-dashed border-[#93a66d] bg-[#f6f8ee] p-4"><span className="studio-kicker studio-kicker--dark">QUICK TESTING CATALOG</span><h3 className="mt-2 font-serif text-xl text-[var(--studio-ink)]">Start with three disposable references.</h3><p className="mt-2 text-xs leading-5 text-[#5e605a]">Adds clearly labeled test products to your own workspace through the live product API. Their image references are bundled with STUDIO; no provider, account, or external asset is used.</p><button type="button" className="studio-button studio-button--dark mt-4" disabled={importing} onClick={() => void importCatalog()}>{importing ? <Loader2 className="studio-spin" size={14} /> : <Package size={14} />}{importing ? "Adding catalog…" : "Add testing catalog"}</button><p className="mt-3 text-[11px] leading-4 text-[#6f7068]">Test records are marked as pending, remain visible only to their creator until approved, and can be deleted from the product list after verification.</p>{status && <p role="status" className="studio-inline-notice mt-3">{status}</p>}</div>;
}

function WorkspaceSidebar({ active }: { active: WorkspaceMode }) {
    return <aside className="studio-workspace-sidebar"><div className="studio-workspace-sidebar__brand"><StudioMark compact /><span>WORKSPACE / LIVE</span></div><nav>{workspaceNav.map(([key, label, Icon]) => <Link key={key} href={`/dashboard/${key}`} className={active === key ? "is-active" : ""}><Icon size={16} />{label}</Link>)}</nav><div className="studio-workspace-sidebar__bottom"><Link href="/contact"><CircleHelp size={15} />Need a hand?</Link><Link href="/">← Back to site</Link></div></aside>;
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
    return <div className="studio-stat-grid"><div><span>PRODUCTS</span><strong>{products.length}</strong><small>{approved} approved</small></div><div><span>POSTS</span><strong>{posts.length}</strong><small>{ready} ready to ship</small></div><div><span>APPROVAL RATE</span><strong>{products.length ? `${Math.round(approved / products.length * 100)}%` : "—"}</strong><small>Current source material</small></div><div><span>LAST MOVEMENT</span><strong>{posts.length ? "LIVE" : "—"}</strong><small>{last}</small></div></div>;
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
    const recent = posts.slice(0, 5);
    return <><Stats products={products} posts={posts} /><WorkspaceReadiness products={products} posts={posts} /><div className="studio-workspace-grid"><section className="studio-workspace-panel studio-workspace-panel--wide"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">LIVE BOARD</span><h2>Real workspace movement</h2></div><button className="studio-text-button" onClick={refresh}><RefreshCw size={14} /> Refresh</button></div>{recent.length ? <div className="studio-data-stack">{recent.map((post) => <Link className="studio-data-row" key={post.id} href="/dashboard/posts"><span className="studio-status-dot" /><div><strong>{post.productName}</strong><small>{post.status} · {post.format}</small></div><span className="studio-data-value">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "New"}</span><ChevronRight size={14} /></Link>)}</div> : <Notice title="Your live board is waiting." detail="Create a product, then open Studio to generate the first real post." action={<Link className="studio-button studio-button--dark" href="/dashboard/products"><Plus size={14} /> Add product</Link>} />}</section><section className="studio-workspace-panel studio-workspace-panel--accent"><span className="studio-kicker studio-kicker--dark">NEXT MOVE</span><h2>Turn one approved product into a full campaign.</h2><p>Use the real product and template APIs to generate, caption, approve, and export.</p><Link href="/dashboard/studio" className="studio-button studio-button--dark">Open studio <ArrowUpRight size={15} /></Link></section></div></>;
}

function BrandSurface() {
    const [brand, setBrand] = useState<BrandSettings | null>(null);
    const [draft, setDraft] = useState<BrandSettingsInput>({ name: "", logoUrl: "", primaryColor: "#B9FF43", secondaryColor: "#11110F", fontFamily: "Space Grotesk", toneGuidelines: "" });
    const [status, setStatus] = useState("Loading brand kit…"); const [saving, setSaving] = useState(false); const [uploadingLogo, setUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { getBrand().then((value) => { setBrand(value); setDraft(value.configured ? { name: value.name ?? "", logoUrl: value.logoUrl ?? "", primaryColor: value.primaryColor ?? "", secondaryColor: value.secondaryColor ?? "", fontFamily: value.fontFamily ?? "", toneGuidelines: value.toneGuidelines ?? "" } : { name: "", logoUrl: "", primaryColor: "#B9FF43", secondaryColor: "#11110F", fontFamily: "Space Grotesk", toneGuidelines: "" }); setStatus(""); }).catch((err) => setStatus(err instanceof Error ? err.message : "Unable to load brand kit")); }, []);
    const save = async () => { setSaving(true); setStatus(""); try { const value = await updateBrand(draft); setBrand(value); setStatus("Brand settings saved."); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to save brand kit"); } finally { setSaving(false); } };
    const chooseLogo = async (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) { setStatus("Choose a PNG, JPG, WebP, or SVG logo."); return; }
        if (file.size > 15 * 1024 * 1024) { setStatus("The logo must be 15 MB or smaller."); return; }
        setUploadingLogo(true); setStatus("");
        try { const logoUrl = await uploadBrandLogo(file); setDraft((current) => ({ ...current, logoUrl })); setStatus("Logo uploaded. Save the brand kit to use it in Studio."); }
        catch (err) { setStatus(err instanceof Error ? err.message : "Unable to upload logo"); }
        finally { setUploadingLogo(false); }
    };
    if (!brand && status === "Loading brand kit…") return <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> {status}</div>;
    return <div className="studio-live-columns"><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">BRAND SETTINGS</span><h2>{brand?.configured && brand.name ? brand.name : "Set up your brand"}</h2></div><span className="studio-chip">LIVE API</span></div><div className="studio-form-grid">{([["name", "Brand name"], ["primaryColor", "Primary color"], ["secondaryColor", "Secondary color"], ["fontFamily", "Font family"]] as const).map(([key, label]) => <label key={key}>{label}<input value={draft[key] ?? ""} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}<div className="studio-form-grid__wide space-y-3"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wide text-[#6f7068]">Brand logo</span>{draft.logoUrl && <span className="studio-chip">Ready</span>}</div><input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => void chooseLogo(event.target.files?.[0])} /><div className="flex flex-col gap-3 border border-dashed border-[#93a66d] bg-[#f6f8ee] p-3 sm:flex-row sm:items-center">{draft.logoUrl ? <img src={draft.logoUrl} alt="Brand logo preview" className="h-14 w-28 rounded-sm border border-[#d6d5cc] bg-white object-contain p-2" /> : <div className="flex h-14 w-28 items-center justify-center border border-[#d6d5cc] bg-[#faf9f4] text-[10px] font-bold uppercase tracking-wide text-[#8b8b83]">No logo</div>}<div className="min-w-0 flex-1"><p className="text-xs font-bold text-[var(--studio-ink)]">Upload a transparent logo for the cleanest post placement.</p><p className="mt-1 text-[11px] text-[#6f7068]">PNG, JPG, WebP, or SVG · max 15 MB</p></div><button type="button" className="studio-button studio-button--paper whitespace-nowrap" disabled={uploadingLogo} onClick={() => logoInputRef.current?.click()}>{uploadingLogo ? <Loader2 className="studio-spin" size={14} /> : <UploadCloud size={14} />}{uploadingLogo ? "Uploading…" : "Upload logo"}</button></div><label>Logo URL<input value={draft.logoUrl ?? ""} onChange={(event) => setDraft({ ...draft, logoUrl: event.target.value })} placeholder="Or paste a hosted image URL" /></label></div><label className="studio-form-grid__wide">Tone guidelines<textarea rows={5} value={draft.toneGuidelines ?? ""} onChange={(event) => setDraft({ ...draft, toneGuidelines: event.target.value })} /></label></div>{status && <p className="studio-inline-notice">{status}</p>}<button className="studio-button studio-button--dark" disabled={saving || uploadingLogo} onClick={() => void save()}>{saving ? <Loader2 className="studio-spin" size={15} /> : <Check size={15} />} Save brand kit</button></section><section className="studio-workspace-panel studio-workspace-panel--accent"><span className="studio-kicker studio-kicker--dark">STUDIO RULE</span><h2>{brand?.configured ? "Keep the source of truth close." : "Your posts start neutral."}</h2><p>{brand?.configured ? "This saved logo can be added in Studio, then placed where it supports the layout best." : "Upload a logo or save a brand name here, then choose whether to add it to each post in Studio."}</p><div className="studio-color-pair"><span style={{ background: draft.primaryColor || "#B9FF43" }} /><span style={{ background: draft.secondaryColor || "#11110F" }} /></div></section></div>;
}

function PostsSurface({ posts, refresh }: { posts: Post[]; refresh: () => void }) {
    const [busy, setBusy] = useState<string | null>(null);
    const exportOne = async (id: string) => { setBusy(id); try { const blob = await exportPost(id); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `studio-post-${id}.zip`; link.click(); URL.revokeObjectURL(url); } catch (err) { window.alert(err instanceof Error ? err.message : "Unable to export post"); } finally { setBusy(null); } };
    const remove = async (id: string) => { setBusy(id); try { await deletePost(id); refresh(); } catch (err) { window.alert(err instanceof Error ? err.message : "Unable to delete post"); } finally { setBusy(null); } };
    return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">CONTENT PIPELINE</span><h2>Posts</h2></div><Link className="studio-button studio-button--dark" href="/dashboard/studio"><Plus size={14} /> New post</Link></div>{posts.length ? <div className="studio-data-stack">{posts.map((post) => <div className="studio-data-row studio-data-row--post" key={post.id}>{post.imageUrl ? <img src={post.imageUrl} alt="" /> : <span className="studio-file-thumb studio-file-thumb--1" />}<div><strong>{post.productName}</strong><small>{post.status} · {post.format} · {post.captionEn ? "Captions ready" : "Captions pending"}</small></div><span className="studio-data-actions"><button disabled={busy === post.id} onClick={() => void exportOne(post.id)}><Download size={14} /></button><button disabled={busy === post.id} onClick={() => void remove(post.id)}>×</button></span></div>)}</div> : <Notice title="No posts yet." detail="Open Studio to generate the first image from an approved product." action={<Link className="studio-button studio-button--dark" href="/dashboard/studio">Open Studio <Sparkles size={14} /></Link>} />}</section>;
}

function AssetsSurface({ products, posts }: { products: Product[]; posts: Post[] }) {
    const assets = [...products.flatMap((product) => [product.imageUrl, product.imageUrl2, product.imageUrl3].filter(Boolean).map((url) => ({ url: url as string, label: product.name, kind: "Product" }))), ...posts.filter((post) => post.imageUrl).map((post) => ({ url: post.imageUrl as string, label: post.productName, kind: "Generated post" }))];
    return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">ASSET MEMORY</span><h2>Approved visual sources</h2></div><span className="studio-chip">{assets.length} files</span></div>{assets.length ? <div className="studio-asset-grid">{assets.map((asset, index) => <a className="studio-asset-card" key={`${asset.url}-${index}`} href={asset.url} target="_blank" rel="noreferrer"><img src={asset.url} alt={asset.label} /><div><strong>{asset.label}</strong><small>{asset.kind}</small></div></a>)}</div> : <Notice title="No assets have landed yet." detail="Upload a product reference to start building the library." action={<Link className="studio-button studio-button--dark" href="/dashboard/products">Add source material <Plus size={14} /></Link>} />}</section>;
}

function CalendarSurface({ posts }: { posts: Post[] }) {
    const scheduled = [...posts].filter((post) => post.createdAt).sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
    return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">CONTENT TIMELINE</span><h2>Calendar from live posts</h2></div><span className="studio-chip">{scheduled.length} dated</span></div>{scheduled.length ? <div className="studio-data-stack">{scheduled.map((post) => <Link className="studio-data-row" key={post.id} href="/dashboard/posts"><span className="studio-status-dot" /><div><strong>{post.productName}</strong><small>{post.status} · {post.format}</small></div><span className="studio-data-value">{new Date(post.createdAt as string).toLocaleDateString()}</span><ChevronRight size={14} /></Link>)}</div> : <Notice title="The calendar is waiting for a dated post." detail="Create a post in Studio and its persisted creation date will appear here." action={<Link className="studio-button studio-button--dark" href="/dashboard/studio"><Plus size={14} /> Create a post</Link>} />}</section>;
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
    const providers: SocialProvider[] = ["META", "TIKTOK", "LINKEDIN", "X"];
    const providerLabels: Record<SocialProvider, string> = { META: "Meta / Instagram + Facebook", TIKTOK: "TikTok", LINKEDIN: "LinkedIn", X: "X" };
    const reload = useCallback(async () => { try { const [nextConnections, nextJobs] = await Promise.all([listSocialConnections(), listPublishJobs()]); setConnections(nextConnections); setJobs(nextJobs); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to load social publishing data"); } }, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch intentionally hydrates this client surface.
    useEffect(() => { void reload(); }, [reload]);
    const connect = async (provider: SocialProvider) => { setBusy(true); setStatus(""); try { window.location.assign(await getSocialConnectUrl(provider)); } catch (err) { setStatus(err instanceof Error ? err.message : "Provider OAuth is not configured"); } finally { setBusy(false); } };
    const disconnect = async (id: string) => { setBusy(true); try { await disconnectSocialConnection(id); await reload(); setStatus("Connection marked disconnected."); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to disconnect provider"); } finally { setBusy(false); } };
    const publish = async () => { if (!selectedPost || !selectedConnection) { setStatus("Choose an approved post and an active channel first."); return; } setBusy(true); setStatus(""); try { await queueSocialPublish({ postId: selectedPost, connectionId: selectedConnection, scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null }); setStatus(scheduledFor ? "Scheduled delivery saved. STUDIO will hand it to the connected channel at the selected time." : "Publish job queued. The provider response will determine its final state."); setSelectedPost(""); setScheduledFor(""); await reload(); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to queue publish job"); } finally { setBusy(false); } };
    const approvedPosts = posts.filter((post) => post.status === "APPROVED");
    const activeConnections = connections.filter((connection) => connection.status === "ACTIVE");
    const steps = [
        { number: "01", title: "Connect", detail: activeConnections.length ? `${activeConnections.length} active channel${activeConnections.length === 1 ? "" : "s"}` : "Choose a channel below", ready: activeConnections.length > 0 },
        { number: "02", title: "Choose", detail: selectedPost ? "Approved post selected" : "Select an approved post", ready: Boolean(selectedPost) },
        { number: "03", title: "Schedule", detail: scheduledFor ? new Date(scheduledFor).toLocaleString() : "Now or a future time", ready: Boolean(selectedConnection) },
    ];
    return <div className="space-y-5"><section className="studio-workspace-panel studio-publish-stepper"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">AUTOMATION SETUP</span><h2>Connect once. Schedule with intent.</h2><p>STUDIO stores the delivery time on the server; it is not a browser reminder.</p></div><span className="studio-chip">{activeConnections.length} live</span></div><ol>{steps.map((step, index) => <li className={step.ready ? "is-ready" : ""} key={step.number}><span>{step.ready ? <Check size={14} /> : step.number}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div>{index < steps.length - 1 && <i />}</li>)}</ol></section><div className="studio-live-columns"><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">STEP 01 / CONNECTIONS</span><h2>Choose your channels</h2></div><span className="studio-chip">OAuth</span></div><div className="studio-data-stack">{providers.map((provider) => { const connection = connections.find((item) => item.provider === provider && item.status === "ACTIVE"); return <div className="studio-data-row" key={provider}><span className={`studio-status-dot ${connection ? "studio-status-dot--lime" : ""}`} /><div><strong>{providerLabels[provider]}</strong><small>{connection ? `${connection.accountName || "Connected account"} · ready to schedule` : "Connect to enable scheduled delivery"}</small></div>{connection ? <button className="studio-text-button" disabled={busy} onClick={() => void disconnect(connection.id)}>Disconnect</button> : <button className="studio-text-button" disabled={busy} onClick={() => void connect(provider)}>Connect</button>}</div>; })}</div>{status && <p className="studio-inline-notice">{status}</p>}</section><section className="studio-workspace-panel studio-workspace-panel--accent"><span className="studio-kicker studio-kicker--dark">STEPS 02–03 / DELIVERY</span><h2>Pick the post, then pick the moment.</h2><p>An approved post is required. A blank time publishes immediately; a future time is persisted and picked up by the delivery scheduler.</p><div className="studio-form-grid"><label>Approved post<select value={selectedPost} onChange={(event) => setSelectedPost(event.target.value)}><option value="">Choose a post</option>{approvedPosts.map((post) => <option key={post.id} value={post.id}>{post.productName} · {post.format}</option>)}</select></label><label>Connected channel<select value={selectedConnection} onChange={(event) => setSelectedConnection(event.target.value)}><option value="">Choose a channel</option>{activeConnections.map((connection) => <option key={connection.id} value={connection.id}>{providerLabels[connection.provider]} · {connection.accountName || "Account"}</option>)}</select></label><label className="studio-form-grid__wide">Schedule for <span className="studio-field-hint">Leave blank to publish now.</span><div className="studio-schedule-input"><Clock3 size={15} /><input type="datetime-local" value={scheduledFor} min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} onChange={(event) => setScheduledFor(event.target.value)} /></div></label></div><button className="studio-button studio-button--dark" disabled={busy || !approvedPosts.length || !activeConnections.length || !selectedPost || !selectedConnection} onClick={() => void publish()}><ArrowUpRight size={14} /> {scheduledFor ? "Schedule delivery" : "Queue publish"}</button>{!approvedPosts.length && <p className="studio-inline-notice">No approved posts are available yet.</p>}</section></div><section className="studio-workspace-panel studio-workspace-panel--wide"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">DELIVERY RECEIPTS</span><h2>Publish jobs</h2></div><span className="studio-chip">{jobs.length} jobs</span></div>{jobs.length ? <div className="studio-data-stack">{jobs.slice(0, 10).map((job) => <div className="studio-data-row" key={job.id}><span className={`studio-status-dot ${job.status === "SENT" ? "studio-status-dot--lime" : ""}`} /><div><strong>{providerLabels[job.provider]} · {job.status}</strong><small>{job.scheduledFor && job.status === "QUEUED" ? `Scheduled for ${new Date(job.scheduledFor).toLocaleString()}` : job.externalPostId ? `Provider id ${job.externalPostId}` : job.errorMessage || "Awaiting provider response"}</small></div><span className="studio-data-value">{job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Queued"}</span></div>)}</div> : <Notice title="No publish jobs yet." detail="Connect a provider, choose an approved post, then save a delivery time." />}</section></div>;
}

function SettingsSurface() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => { Promise.all([getCurrentUser(), getSystemCapabilities()]).then(([nextProfile, nextCapabilities]) => { setProfile(nextProfile); setCapabilities(nextCapabilities); }).catch((err) => setError(err instanceof Error ? err.message : "Unable to load workspace settings")); }, []);
    if (error) return <Notice title="Settings unavailable." detail={error} action={<Link className="studio-button studio-button--dark" href="/dashboard">Return to overview</Link>} />;
    if (!profile || !capabilities) return <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading workspace settings…</div>;
    const capabilityRows: [string, boolean, string][] = [["Caption templates", capabilities.captionGeneration, "Local multilingual copy"], ["Visual composition", capabilities.imageGeneration, "Local SVG renderer"], ["Cloud storage", capabilities.cloudStorage, "Media persistence"], ["Local storage", capabilities.localStorage, "Fallback persistence"], ["Social publishing", capabilities.socialPublishing, "Connected channels"], ["SMTP email", capabilities.smtpEmail, "Outbound delivery"], ["Meta OAuth", capabilities.metaOAuth, "Account connection"], ["TikTok OAuth", capabilities.tiktokOAuth, "Account connection"], ["LinkedIn OAuth", capabilities.linkedinOAuth, "Account connection"], ["X OAuth", capabilities.xOAuth, "Account connection"]];
    return <div className="studio-live-columns"><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">ACCOUNT</span><h2>{profile.name || profile.email}</h2></div><span className="studio-chip">{profile.role}</span></div><div className="studio-data-stack"><div className="studio-data-row"><div><strong>Email</strong><small>{profile.email}</small></div></div><div className="studio-data-row"><div><strong>Workspace</strong><small>{profile.brandId ? "Brand workspace connected" : "No brand workspace yet"}</small></div></div><div className="studio-data-row"><div><strong>Member since</strong><small>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Not available"}</small></div></div></div></section><section className="studio-workspace-panel studio-workspace-panel--accent"><span className="studio-kicker studio-kicker--dark">WORKSPACE READINESS</span><h2>Creation runs locally; connections only affect delivery.</h2><div className="studio-data-stack">{capabilityRows.map(([label, ready, detail]) => <div className="studio-data-row" key={label}><span className={`studio-status-dot ${ready ? "studio-status-dot--lime" : ""}`} /><div><strong>{label}</strong><small>{ready ? detail : "Not connected"}</small></div></div>)}</div></section></div>;
}

function Unavailable({ label, reason }: { label: string; reason: string }) { return <Notice title={`${label} is ready for its backend route.`} detail={reason} action={<Link className="studio-button studio-button--dark" href="/contact">Talk to the team <ArrowUpRight size={14} /></Link>} />; }

function Surface({ mode, products, posts, refresh, onStudioPostChange }: { mode: WorkspaceMode; products: Product[]; posts: Post[]; refresh: () => void; onStudioPostChange: () => void }) {
    if (mode === "dashboard") return <Overview products={products} posts={posts} refresh={refresh} />;
    if (mode === "products") return <div className="studio-live-columns"><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">SOURCE MATERIAL</span><h2>Products</h2></div><span className="studio-chip">{products.length} total</span></div><ProductList products={products} onProductDeleted={refresh} /></section><section className="studio-workspace-panel studio-workspace-panel--accent"><span className="studio-kicker studio-kicker--dark">NEW INPUT</span><h2>Add a product reference.</h2><p>Upload source material that powers your creative directions.</p><ProductForm onCreated={refresh} /><TestingCatalog products={products} onCreated={refresh} /></section></div>;
    if (mode === "brand") return <BrandSurface />;
    if (mode === "studio") return <section className="studio-workspace-panel studio-workspace-panel--wide"><CreativeStudio products={products} onPostChange={onStudioPostChange} /></section>;
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
    const { products, posts, loading, error, reload } = useLiveWorkspace();
    const searchRef = useRef<HTMLInputElement>(null);
    return <main className="studio-app"><WorkspaceSidebar active={mode} /><div className="studio-workspace-main"><header className="studio-workspace-topbar"><div><span className="studio-kicker studio-kicker--dark">WORKSPACE / {label.toUpperCase()}</span><h1>{title}</h1><p>{description}</p></div><div className="studio-workspace-actions"><button className="studio-icon-button" aria-label={`Focus ${label.toLowerCase()} search`} onClick={() => searchRef.current?.focus()}><Search size={17} /></button><Link href="/dashboard/studio" className="studio-button studio-button--dark"><Plus size={15} /> New direction</Link></div></header><section className="studio-workspace-content"><div className="studio-command-row"><div className="studio-route-title"><Icon size={20} /><span>{label}</span></div><label className="studio-search"><Search size={15} /><input ref={searchRef} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label.toLowerCase()}`} /></label></div>{error && <div className="studio-form-error"><strong>Live data unavailable.</strong> {error} <button onClick={() => void reload()}>Retry</button></div>}{loading ? <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading live workspace data…</div> : <Surface mode={mode} products={products} posts={posts} refresh={() => void reload()} onStudioPostChange={() => void reload({ background: true })} />}</section></div></main>;
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
    const adminNav: [AdminMode, string, typeof ShieldCheck][] = Object.entries(adminData).map(([key, value]) => [key as AdminMode, value[0], value[2] as typeof ShieldCheck]);
    return <main className="studio-app studio-admin"><aside className="studio-workspace-sidebar"><div className="studio-workspace-sidebar__brand"><StudioMark compact /><span>ADMIN / CONTROL ROOM</span></div><nav>{adminNav.map(([key, item, NavIcon]) => <Link key={key} href={`/admin/${key}`} className={mode === key ? "is-active" : ""}><NavIcon size={16} />{item}</Link>)}</nav><div className="studio-workspace-sidebar__bottom"><Link href="/dashboard"><LayoutDashboard size={15} />Workspace</Link><Link href="/">← Back to site</Link></div></aside><div className="studio-workspace-main"><header className="studio-workspace-topbar"><div><span className="studio-kicker studio-kicker--dark">CONTROL ROOM / {label.toUpperCase()}</span><h1>{title}</h1><p>Operations, governance, and the signals behind the creative system.</p></div><div className="studio-admin-status"><span className="studio-dot studio-dot--lime" /> Live backend</div></header><section className="studio-workspace-content"><div className="studio-command-row"><div className="studio-route-title"><Icon size={20} /><span>{label}</span></div><button className="studio-text-button" onClick={() => void reload()}><RefreshCw size={14} /> Refresh data</button></div>{error && <div className="studio-form-error"><strong>Admin data unavailable.</strong> {error}</div>}{loading ? <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading admin data…</div> : <AdminSurface mode={mode} products={products} posts={posts} templates={templates} summary={summary} capabilities={capabilities} />}</section></div></main>;
}
