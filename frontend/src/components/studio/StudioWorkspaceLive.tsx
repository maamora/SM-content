"use client";
/* CAMPAIGN SWITCHBOARD / AUTHENTICATED WORKSPACE: a landing-color production desk with charcoal controls, warm-paper records, lime active states, and real source → proof → delivery workflows. */

import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ArrowUpRight, Ban, Bell, Camera, Check, ChevronRight, CircleHelp, Clock3,
    FileImage, FolderOpen, ImagePlus, Layers3, LayoutDashboard, Loader2,
    LogOut, MessageCircle, Music2, Package, Palette, Plus, RefreshCw, Search, Settings2, ShieldCheck,
    ShieldMinus, ShieldPlus, Sparkles, Store, ThumbsUp, Trash2, UserMinus, Users2, X,
} from "lucide-react";
import { StudioMark } from "./StudioShell";
import { EditionDeskShell, MetricLedger, RouteControlBar, RouteMasthead } from "./EditionDeskPrimitives";
import { StudioCommandPalette } from "./StudioCommandPalette";
import { AdminControlRoom, type AdminControlNavSection } from "./AdminControlRoom";
import { AssetDepthCarousel } from "./AssetDepthCarousel";
import ConnectTutorial from "./ConnectTutorial";
import FadeContent from "@/components/FadeContent";
import CreativeStudio from "@/components/features/studio/CreativeStudio";
import BatchPublishStudio from "@/components/features/studio/BatchPublishStudio";
import ProductList from "@/components/features/products/ProductList";
import { ProductForm } from "@/components/features/products/ProductForm";
import { listProducts, type Product, type ProductInput } from "@/lib/api/products";
import { listPosts, type Post } from "@/lib/api/posts";
import {
    getBrand, updateBrand, uploadBrandLogo, listMembers, listBrandBans, kickMember, banMember,
    unbanMember, setMemberAdmin, deleteBrand,
    type BrandSettings, type BrandSettingsInput, type BrandBan,
} from "@/lib/api/brand";
import { listTemplates, type Template } from "@/lib/api/templates";
import { logout } from "@/lib/api/auth";
import { isAuthenticated, isAdmin } from "@/lib/api/client";
import { getMe, updateProfile, changePassword, deleteAccount, type UserSummary } from "@/lib/api/users";
import { getSystemCapabilities, type SystemCapabilities } from "@/lib/api/system";
import { getAdminSummary, type AdminSummary } from "@/lib/api/admin";
import { connectSocialAccount, disconnectSocialAccount, disconnectSocialConnection, getSocialConnectUrl, listPublishJobs, listSocialAccounts, listSocialConnections, queueSocialPublish, type MetaTarget, type PublishJob, type SocialAccount, type SocialConnection, type SocialPlatform, type SocialProvider } from "@/lib/api/social";
import { acceptInvitation, declineInvitation, inviteToBrand, listMyInvitations, listSentInvitations, type BrandInvitation } from "@/lib/api/invitations";

const workspaceData = {
    dashboard: ["Overview", "Workboard", "Sources, drafts, approvals, delivery.", LayoutDashboard],
    products: ["Products", "Source library", "Products, images, and status.", Package],
    studio: ["Studio", "Post editor", "Compose, caption, approve, export.", Sparkles],
    batch: ["Batch", "Batch composer", "Create a post set from approved sources.", Layers3],
    assets: ["Assets", "Assets", "Source and post files.", FolderOpen],
    social: ["Social", "Delivery", "Channels, schedule, and receipts.", Store],
    notifications: ["Notifications", "Activity", "Approvals and email delivery.", Bell],
    settings: ["Settings", "Settings", "Account, capabilities, and connections.", Settings2],
} as const;
type WorkspaceMode = keyof typeof workspaceData;
const workspaceNav: [WorkspaceMode, string, typeof LayoutDashboard][] = [
    ["dashboard", "Overview", LayoutDashboard], ["products", "Products", Package],
    ["studio", "Studio", Sparkles], ["batch", "Batch", Layers3], ["assets", "Assets", FolderOpen],
    ["social", "Social", Store],
    ["notifications", "Notifications", Bell], ["settings", "Settings", Settings2],
];

const workspaceNavSections: { label: string; keys: WorkspaceMode[] }[] = [
    { label: "Create", keys: ["dashboard", "products", "studio", "batch"] },
    { label: "Library", keys: ["assets"] },
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

// Shows the signed-in user's own brand (logo + name) rather than the generic
// STUDIO app mark, since each account now owns its own workspace/brand. The
// STUDIO mark stays too (small, above) as the app's own identity — this is
// the tenant's identity, visible on every workspace page including
// Products and Studio (generation), which is the whole point of collecting
// it at registration.
function WorkspaceBrand({ brand }: { brand: BrandSettings | null }) {
    const initial = brand?.name?.trim()?.[0]?.toUpperCase() ?? "?";
    return (
        <div className="studio-workspace-sidebar__tenant">
            {brand?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt={brand.name} className="studio-workspace-sidebar__tenant-logo" />
            ) : (
                <span className="studio-avatar">{initial}</span>
            )}
            <span className="studio-workspace-sidebar__tenant-name">{brand?.name || "Loading workspace…"}</span>
        </div>
    );
}

// Neither WorkspaceSidebar nor AdminPage's sidebar had any way to sign out at
// all in the STUDIO redesign — LogoutButton existed (already restyled for
// this design system) but was never actually rendered anywhere. Wired in
// here and in the Settings page below.
function SignOutButton({ variant = "link" }: { variant?: "link" | "button" }) {
    const router = useRouter();
    const doLogout = () => { logout(); router.push("/login"); };
    if (variant === "button") {
        return <button className="studio-button studio-button--danger" onClick={doLogout}><LogOut size={15} /> Sign out</button>;
    }
    return <button onClick={doLogout} className="studio-workspace-sidebar__signout"><LogOut size={15} />Sign out</button>;
}

function WorkspaceSidebar({ active, brand }: { active: WorkspaceMode; brand: BrandSettings | null }) {
    return <aside className="studio-workspace-sidebar"><div className="studio-workspace-sidebar__brand"><StudioMark compact /><span>WORKSPACE / LIVE</span></div><WorkspaceBrand brand={brand} /><nav>{workspaceNav.map(([key, label, Icon]) => <Link key={key} href={`/dashboard/${key}`} className={active === key ? "is-active" : ""}><Icon size={16} />{label}</Link>)}</nav><div className="studio-workspace-sidebar__bottom"><Link href="/contact"><CircleHelp size={15} />Need a hand?</Link><Link href="/">← Back to site</Link><SignOutButton /></div></aside>;
}

/**
 * Hard client-side gate for every authenticated route (dashboard + admin).
 * Previously there was no guard at all here — a visitor with no token (or an
 * expired one) still got the full app shell rendered, and only the data
 * fetches underneath it failed. That's the wrong failure mode for an
 * authenticated area: it should never render before we've confirmed there's
 * a session. Redirects to /login instantly when unauthenticated, and only
 * flips `ready` once we've actually confirmed a token exists — nothing in
 * the tree below this point mounts (or fires a single API call) until then.
 * The backend independently re-checks every request regardless — this only
 * controls what the browser shows, not what's authorized.
 */
function useRequireAuth(options: { adminOnly?: boolean } = {}) {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    useEffect(() => {
        if (!isAuthenticated()) {
            router.replace("/login");
            return;
        }
        if (options.adminOnly && !isAdmin()) {
            router.replace("/dashboard");
            return;
        }
        setReady(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- options is a fresh object literal each render; intentionally only re-run on router identity.
    }, [router]);
    return ready;
}

function useLiveWorkspace() {
    const [products, setProducts] = useState<Product[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [brand, setBrand] = useState<BrandSettings | null>(null);
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
    // Loaded separately from products/posts (its own endpoint, doesn't block
    // the rest of the workspace if it's briefly unavailable) and only once —
    // the sidebar doesn't need to refetch it on every reload() the way
    // products/posts do.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch intentionally hydrates the sidebar's brand identity.
    useEffect(() => { getBrand().then(setBrand).catch(() => {}); }, []);
    return { products, posts, brand, loading, error, reload };
}

function Stats({ products, posts }: { products: Product[]; posts: Post[] }) {
    const withPhotos = products.filter((product) => Boolean(product.imageUrl)).length;
    const ready = posts.filter((post) => post.status !== "DRAFT").length;
    const last = posts[0]?.createdAt ? new Date(posts[0].createdAt).toLocaleDateString() : "No activity";
    return <MetricLedger className="studio-overview-stats" items={[
        { label: "PRODUCTS", value: products.length, detail: `${withPhotos} with photos` },
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
    const multiImageSources = products.filter((product) => Boolean(product.imageUrl && product.imageUrl2)).length;
    const draftPosts = posts.filter((post) => post.status === "DRAFT").length;
    const approvedPosts = posts.filter((post) => post.status === "APPROVED").length;
    const recentPosts = posts.slice(0, 6);
    const funnel = [
        { label: "Sources", value: products.length, detail: `${products.length} in the catalog` },
        { label: "Proofs", value: posts.length, detail: `${draftPosts} draft` },
        { label: "Approved", value: approvedPosts, detail: "Ready for delivery" },
        { label: "Source depth", value: `${multiImageSources}/${products.length}`, detail: "2+ images" },
    ];
    return <div className="studio-worktable studio-worktable--overview studio-analysis-dashboard">
        <RouteMasthead kicker="WORKBOARD / ANALYSIS" title="Workboard" description="Live source, post, and delivery signals." actions={<button className="studio-text-button" onClick={refresh}><RefreshCw size={14} /> Refresh</button>} />
        <FadeContent duration={220} distance={6} threshold={0.08} className="studio-quiet-reveal"><Stats products={products} posts={posts} /></FadeContent>
        <div className="studio-analysis-dashboard__grid">
            <section className="studio-analysis-panel studio-analysis-panel--funnel"><div className="studio-analysis-panel__heading"><div><span className="studio-kicker">PIPELINE</span><h2>Record flow</h2></div><span>LIVE</span></div><div className="studio-analysis-funnel">{funnel.map((item, index) => <div key={item.label}><span>0{index + 1}</span><strong>{item.value}</strong><b>{item.label}</b><small>{item.detail}</small></div>)}</div></section>
            <section className="studio-analysis-panel studio-analysis-panel--quality"><div className="studio-analysis-panel__heading"><div><span className="studio-kicker">SOURCE QUALITY</span><h2>Coverage</h2></div></div><dl><div><dt>Products in catalog</dt><dd>{products.length}</dd></div><div><dt>Multi-image sources</dt><dd>{multiImageSources}</dd></div></dl></section>
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
    const [draft, setDraft] = useState<BrandSettingsInput>({ name: "", logoUrl: "", primaryColor: "#B9FF43", secondaryColor: "#11110F", fontFamily: "Space Grotesk", toneGuidelines: "" });
    const [status, setStatus] = useState("Loading brand kit…"); const [statusError, setStatusError] = useState(false); const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => { getBrand().then((value) => { setBrand(value); setDraft({ name: value.name ?? "", logoUrl: value.logoUrl ?? "", primaryColor: value.primaryColor ?? "", secondaryColor: value.secondaryColor ?? "", fontFamily: value.fontFamily ?? "", toneGuidelines: value.toneGuidelines ?? "" }); setStatus(""); }).catch((err) => { setStatus(err instanceof Error ? err.message : "Unable to load brand kit"); setStatusError(true); }); }, []);
    const save = async () => { setSaving(true); setStatus(""); try { const value = await updateBrand(draft); setBrand(value); setStatus("Brand settings saved."); setStatusError(false); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to save brand kit"); setStatusError(true); } finally { setSaving(false); } };
    const copyCode = async () => {
        if (!brand?.joinCode) return;
        try { await navigator.clipboard.writeText(brand.joinCode); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable — code is still selectable/visible */ }
    };
    const uploadLogo = async (file?: File) => {
        if (!file) return;
        setUploadingLogo(true); setStatus("");
        try {
            const value = await uploadBrandLogo(file);
            setBrand(value);
            setDraft((prev) => ({ ...prev, logoUrl: value.logoUrl ?? "" }));
            setStatus("Logo uploaded and saved.");
            setStatusError(false);
        } catch (err) {
            setStatus(err instanceof Error ? err.message : "Unable to upload logo");
            setStatusError(true);
        } finally {
            setUploadingLogo(false);
            if (logoInputRef.current) logoInputRef.current.value = "";
        }
    };
    if (!brand && status === "Loading brand kit…") return <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> {status}</div>;
    return <div className="studio-live-columns"><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">BRAND SETTINGS</span><h2>{brand?.name || "Your brand"}</h2></div></div><div className="flex items-center gap-4 mt-1 mb-4"><input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(event) => void uploadLogo(event.target.files?.[0])} /><span className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded border border-[#3a3d35] bg-[#0f100d]">{draft.logoUrl ? <img src={draft.logoUrl} alt="Brand logo" className="max-h-full max-w-full object-contain" /> : <ImagePlus size={26} className="text-[#5c5e56]" />}</span><div className="flex flex-col gap-2"><button type="button" className="studio-button studio-button--dark" disabled={uploadingLogo} onClick={() => logoInputRef.current?.click()}>{uploadingLogo ? <Loader2 className="studio-spin" size={13} /> : <ImagePlus size={13} />} {draft.logoUrl ? "Replace logo" : "Upload logo"}</button><span className="text-[11px] text-[#8a8b83]">PNG, JPG, WEBP or SVG.</span></div></div><div className="studio-form-grid">{([["name", "Brand name"], ["logoUrl", "Logo URL"], ["primaryColor", "Primary color"], ["secondaryColor", "Secondary color"], ["fontFamily", "Font family"]] as const).map(([key, label]) => <label key={key}>{label}<input value={draft[key] ?? ""} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}<label className="studio-form-grid__wide">Tone guidelines<textarea rows={5} value={draft.toneGuidelines ?? ""} onChange={(event) => setDraft({ ...draft, toneGuidelines: event.target.value })} /></label></div><p className="text-[11px] leading-relaxed text-[#8a8b83] mt-1">Primary and secondary colors set the default badge and promo colors in the Post editor for every new post — each brand gets its own look automatically.</p>{status && <p className={statusError ? "studio-form-error" : "studio-inline-notice"}>{status}</p>}<button className="studio-button studio-button--dark mt-3" disabled={saving} onClick={() => void save()}>{saving ? <Loader2 className="studio-spin" size={15} /> : <Check size={15} />} Save brand kit</button></section><section className="studio-workspace-panel studio-workspace-panel--accent"><span className="studio-kicker studio-kicker--dark">INVITE TEAMMATES</span><h2>Bring your team into this workspace.</h2><p>Share this code — teammates enter it under &quot;Join with a code&quot; on the register page to land in this exact brand instead of creating their own.</p>{brand?.joinCode && <div className="flex items-center gap-2 mt-3"><span className="studio-chip studio-chip--lime" style={{ fontSize: "13px", padding: "8px 12px", letterSpacing: "0.15em" }}>{brand.joinCode}</span><button className="studio-text-button" onClick={() => void copyCode()}>{copied ? "Copied!" : "Copy"}</button></div>}<div className="studio-color-pair"><span style={{ background: draft.primaryColor || "#B9FF43" }} /><span style={{ background: draft.secondaryColor || "#11110F" }} /></div></section></div>;
}

// lucide-react dropped brand/logo icons (Facebook, Instagram, etc.) a while
// back for trademark reasons, so these use generic stand-ins instead of the
// real platform logos.
const SOCIAL_PLATFORMS: [SocialPlatform, string, typeof Camera][] = [
    ["INSTAGRAM", "Instagram", Camera],
    ["FACEBOOK", "Facebook", ThumbsUp],
    ["TIKTOK", "TikTok", Music2],
    ["WHATSAPP", "WhatsApp", MessageCircle],
];

function ProfileSection() {
    const [me, setMe] = useState<UserSummary | null>(null);
    const [draft, setDraft] = useState({ name: "", email: "" });
    const [status, setStatus] = useState("Loading…");
    const [statusError, setStatusError] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getMe()
            .then((value) => { setMe(value); setDraft({ name: value.name ?? "", email: value.email }); setStatus(""); })
            .catch((err) => { setStatus(err instanceof Error ? err.message : "Unable to load profile"); setStatusError(true); });
    }, []);

    const save = async () => {
        setSaving(true); setStatus("");
        try { const value = await updateProfile(draft); setMe(value); setStatus("Profile updated."); setStatusError(false); }
        catch (err) { setStatus(err instanceof Error ? err.message : "Unable to update profile"); setStatusError(true); }
        finally { setSaving(false); }
    };

    return (
        <section className="studio-workspace-panel">
            <div className="studio-panel-heading">
                <div><span className="studio-kicker studio-kicker--dark">YOUR PROFILE</span><h2>{me?.name || "Loading…"}</h2></div>
                <span className="studio-chip">{me?.role}</span>
            </div>
            <div className="studio-form-grid">
                <label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
                <label>Email<input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label>
            </div>
            {status && <p className={statusError ? "studio-form-error" : "studio-inline-notice"}>{status}</p>}
            <button className="studio-button studio-button--dark" disabled={saving} onClick={() => void save()}>
                {saving ? <Loader2 className="studio-spin" size={15} /> : <Check size={15} />} Save changes
            </button>
        </section>
    );
}

function DeleteAccountSection() {
    const [me, setMe] = useState<UserSummary | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [typedName, setTypedName] = useState("");
    const [status, setStatus] = useState("");
    const [deleting, setDeleting] = useState(false);
    useEffect(() => { getMe().then(setMe).catch(() => {}); }, []);
    const expected = (me?.name || "").trim();
    const matches = expected.length > 0 && typedName.trim() === expected;

    const destroy = async () => {
        if (!matches) return;
        setDeleting(true); setStatus("");
        try {
            await deleteAccount({ confirmName: typedName.trim() });
            logout();
            window.location.href = "/";
        } catch (err) {
            setStatus(err instanceof Error ? err.message : "Unable to delete account");
            setDeleting(false);
        }
    };

    return (
        <section className="studio-workspace-panel studio-danger-zone">
            <div className="studio-panel-heading">
                <div><span className="studio-kicker studio-kicker--dark">DANGER ZONE</span><h2>Delete account</h2></div>
            </div>
            <p className="text-[11px] leading-relaxed text-[#8a8b83]">
                This permanently deletes your account, sign-in, and everything personal to it (linked social
                accounts, generation and publish history, email history). Products and posts you created stay
                with the rest of your team.
            </p>
            {!confirming ? (
                <button type="button" className="studio-button studio-button--danger mt-3" onClick={() => setConfirming(true)}>
                    <Trash2 size={14} /> Delete my account
                </button>
            ) : (
                <div className="mt-3 flex flex-col gap-2">
                    <label className="text-[11px] text-[#8a8b83]">
                        Type <strong className="text-[#e9ebe0]">{expected || "your name"}</strong> exactly to confirm.
                    </label>
                    <input
                        value={typedName}
                        onChange={(event) => setTypedName(event.target.value)}
                        placeholder={expected}
                        autoFocus
                    />
                    {status && <p className="studio-form-error">{status}</p>}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="studio-button studio-button--danger"
                            disabled={!matches || deleting}
                            onClick={() => void destroy()}
                        >
                            {deleting ? <Loader2 className="studio-spin" size={14} /> : <Trash2 size={14} />} Permanently delete
                        </button>
                        <button type="button" className="studio-text-button" disabled={deleting} onClick={() => { setConfirming(false); setTypedName(""); setStatus(""); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

function PasswordSection() {
    const [draft, setDraft] = useState({ currentPassword: "", newPassword: "" });
    const [status, setStatus] = useState("");
    const [statusError, setStatusError] = useState(false);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true); setStatus("");
        try {
            await changePassword(draft);
            setDraft({ currentPassword: "", newPassword: "" });
            setStatus("Password updated.");
            setStatusError(false);
        } catch (err) {
            setStatus(err instanceof Error ? err.message : "Unable to update password");
            setStatusError(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="studio-workspace-panel">
            <div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">SECURITY</span><h2>Password</h2></div></div>
            <div className="studio-form-grid">
                <label>Current password<input type="password" value={draft.currentPassword} onChange={(event) => setDraft({ ...draft, currentPassword: event.target.value })} /></label>
                <label>New password<input type="password" minLength={8} value={draft.newPassword} onChange={(event) => setDraft({ ...draft, newPassword: event.target.value })} /></label>
            </div>
            {status && <p className={statusError ? "studio-form-error" : "studio-inline-notice"}>{status}</p>}
            <button className="studio-button studio-button--dark" disabled={saving || !draft.currentPassword || draft.newPassword.length < 8} onClick={() => void save()}>
                {saving ? <Loader2 className="studio-spin" size={15} /> : <Check size={15} />} Update password
            </button>
        </section>
    );
}

function LinkedAccountsSection() {
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState<SocialPlatform | null>(null);
    const [status, setStatus] = useState("");

    const reload = useCallback(() => { listSocialAccounts().then(setAccounts).catch((err) => setStatus(err instanceof Error ? err.message : "Unable to load linked accounts")); }, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch intentionally hydrates this panel.
    useEffect(() => { reload(); }, [reload]);

    const connect = async (platform: SocialPlatform) => {
        const handle = (drafts[platform] || "").trim();
        if (!handle) return;
        setBusy(platform); setStatus("");
        try { await connectSocialAccount({ platform, handle }); reload(); }
        catch (err) { setStatus(err instanceof Error ? err.message : "Unable to connect account"); }
        finally { setBusy(null); }
    };

    const disconnect = async (account: SocialAccount) => {
        setBusy(account.platform); setStatus("");
        try { await disconnectSocialAccount(account.id); reload(); }
        catch (err) { setStatus(err instanceof Error ? err.message : "Unable to disconnect account"); }
        finally { setBusy(null); }
    };

    return (
        <section className="studio-workspace-panel">
            <div className="studio-panel-heading">
                <div><span className="studio-kicker studio-kicker--dark">LINKED ACCOUNTS</span><h2>Where this brand posts.</h2></div>
                <span className="studio-chip">{accounts.length} connected</span>
            </div>
            <p className="text-[12px] text-[#777870] -mt-2 mb-3">
                Manual for now — enter the handle your team posts under. Automatic publishing/sync isn&apos;t wired to each platform&apos;s API yet.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOCIAL_PLATFORMS.map(([platform, label, Icon]) => {
                    const existing = accounts.find((a) => a.platform === platform);
                    const isBusy = busy === platform;
                    return (
                        <div key={platform} className="border border-[#c5c4bb] bg-[#faf9f4] p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon size={15} />
                                <strong className="text-[12px] font-bold">{label}</strong>
                                {existing && <span className="studio-dot studio-dot--lime ml-auto" />}
                            </div>
                            {existing ? (
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[12px] text-[#4f504a] truncate">{existing.handle}</span>
                                    <button className="studio-text-button" disabled={isBusy} onClick={() => void disconnect(existing)}>
                                        {isBusy ? <Loader2 className="studio-spin" size={13} /> : <Trash2 size={13} />}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <input
                                        placeholder="@handle"
                                        value={drafts[platform] ?? ""}
                                        onChange={(event) => setDrafts({ ...drafts, [platform]: event.target.value })}
                                        className="min-w-0 flex-1 border border-[#bdbdb4] bg-white px-2 py-1.5 text-[12px] text-white outline-none focus:border-[var(--studio-lime)]"
                                    />
                                    <button className="studio-text-button" disabled={isBusy || !(drafts[platform] || "").trim()} onClick={() => void connect(platform)}>
                                        {isBusy ? <Loader2 className="studio-spin" size={13} /> : "Link"}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {status && <p className="studio-form-error">{status}</p>}
        </section>
    );
}

function CoworkersSection() {
    const [me, setMe] = useState<UserSummary | null>(null);
    const [members, setMembers] = useState<UserSummary[] | null>(null);
    const [bans, setBans] = useState<BrandBan[]>([]);
    const [status, setStatus] = useState("");
    const [statusError, setStatusError] = useState(false);
    const [sent, setSent] = useState<BrandInvitation[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteStatus, setInviteStatus] = useState("");
    const [inviteStatusError, setInviteStatusError] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [busyId, setBusyId] = useState("");

    const canModerate = me?.brandRole === "OWNER" || me?.brandRole === "ADMIN";
    const isOwner = me?.brandRole === "OWNER";

    const reload = useCallback(() => {
        getMe().then(setMe).catch(() => {});
        listMembers().then(setMembers).catch((err) => { setStatus(err instanceof Error ? err.message : "Unable to load members"); setStatusError(true); });
        listSentInvitations().then(setSent).catch(() => {});
        listBrandBans().then(setBans).catch(() => {});
    }, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch intentionally hydrates this panel.
    useEffect(() => { reload(); }, [reload]);

    const invite = async () => {
        const email = inviteEmail.trim();
        if (!email) return;
        setInviting(true); setInviteStatus("");
        try {
            await inviteToBrand(email);
            setInviteEmail("");
            setInviteStatus(`Invite sent to ${email}.`);
            setInviteStatusError(false);
            reload();
        } catch (err) {
            setInviteStatus(err instanceof Error ? err.message : "Unable to send invite");
            setInviteStatusError(true);
        } finally {
            setInviting(false);
        }
    };

    const runAction = async (id: string, action: () => Promise<unknown>, okMessage: string) => {
        setBusyId(id); setStatus("");
        try {
            await action();
            setStatus(okMessage);
            setStatusError(false);
            reload();
        } catch (err) {
            setStatus(err instanceof Error ? err.message : "That action didn't go through");
            setStatusError(true);
        } finally {
            setBusyId("");
        }
    };

    const pending = sent.filter((invitation) => invitation.status === "PENDING");

    return (
        <>
            <section className="studio-workspace-panel">
                <div className="studio-panel-heading">
                    <div><span className="studio-kicker studio-kicker--dark">MEMBERS &amp; ROLES</span><h2>Who&apos;s in this workspace — promote, kick, or ban.</h2></div>
                    <span className="studio-chip">{members?.length ?? 0}</span>
                </div>
                {status && <p className={statusError ? "studio-form-error" : "studio-inline-notice"}>{status}</p>}
                {members && members.length > 0 ? (
                    <div className="studio-data-stack">
                        {members.map((person) => {
                            const isSelf = person.id === me?.id;
                            const isBusy = busyId === person.id;
                            return (
                                <div className="studio-data-row" key={person.id}>
                                    <span className="studio-avatar">{person.name?.trim()?.[0]?.toUpperCase() ?? "?"}</span>
                                    <div><strong>{person.name}</strong><small>{person.email}</small></div>
                                    <span className={`studio-role-badge studio-role-badge--${person.brandRole.toLowerCase()}`}>{person.brandRole}</span>
                                    {canModerate && !isSelf && person.brandRole !== "OWNER" && (
                                        <div className="studio-member-actions">
                                            {isOwner && (
                                                <button
                                                    type="button"
                                                    className="studio-icon-button studio-icon-button--admin"
                                                    disabled={isBusy}
                                                    title={person.brandRole === "ADMIN" ? "Remove admin" : "Make admin"}
                                                    aria-label={person.brandRole === "ADMIN" ? "Remove admin" : "Make admin"}
                                                    onClick={() => void runAction(
                                                        person.id,
                                                        () => setMemberAdmin(person.id, person.brandRole !== "ADMIN"),
                                                        person.brandRole === "ADMIN" ? `${person.name} is no longer an admin.` : `${person.name} is now an admin.`,
                                                    )}
                                                >
                                                    {person.brandRole === "ADMIN" ? <ShieldMinus size={14} /> : <ShieldPlus size={14} />}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="studio-icon-button"
                                                disabled={isBusy}
                                                title="Kick from workspace"
                                                aria-label="Kick from workspace"
                                                onClick={() => void runAction(person.id, () => kickMember(person.id), `${person.name} was removed from this workspace.`)}
                                            >
                                                <UserMinus size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                className="studio-icon-button studio-icon-button--danger"
                                                disabled={isBusy}
                                                title="Ban from workspace"
                                                aria-label="Ban from workspace"
                                                onClick={() => void runAction(person.id, () => banMember(person.id), `${person.name} was removed and banned.`)}
                                            >
                                                <Ban size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : members ? (
                    <Notice title="It's just you so far." detail="Invite a teammate by email below, or share your workspace's join code from Brand settings so others can land here instead of creating their own brand." />
                ) : (
                    <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading team…</div>
                )}
            </section>
            <section className="studio-workspace-panel studio-workspace-panel--accent">
                <span className="studio-kicker studio-kicker--dark">INVITE BY EMAIL</span>
                <h2>Bring someone into this workspace.</h2>
                <p>They&apos;ll see this invite waiting for them on their Notifications page and can accept or decline it — nothing changes for them until they do.</p>
                <div className="flex items-center gap-2 mt-3">
                    <input
                        type="email"
                        placeholder="teammate@email.com"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                        className="min-w-0 flex-1 border border-[rgba(185,255,67,.4)] bg-[rgba(255,255,255,.05)] px-3 py-2 text-[13px] text-[var(--studio-paper)] outline-none focus:border-[var(--studio-lime)]"
                    />
                    <button className="studio-button studio-button--dark" disabled={inviting || !inviteEmail.trim()} onClick={() => void invite()}>
                        {inviting ? <Loader2 className="studio-spin" size={14} /> : <Plus size={14} />} Invite
                    </button>
                </div>
                {inviteStatus && <p className={inviteStatusError ? "studio-form-error" : "studio-inline-notice"}>{inviteStatus}</p>}
                {pending.length > 0 && (
                    <div className="studio-data-stack" style={{ marginTop: 14 }}>
                        {pending.map((invitation) => (
                            <div className="studio-data-row" key={invitation.id}>
                                <span className="studio-status-dot" />
                                <div><strong>{invitation.invitedEmail}</strong><small>Invited {new Date(invitation.createdAt).toLocaleDateString()}</small></div>
                                <span className="studio-data-value">PENDING</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>
            {canModerate && (
                <section className="studio-workspace-panel">
                    <div className="studio-panel-heading">
                        <div><span className="studio-kicker studio-kicker--dark">BAN LIST</span><h2>Blocked from rejoining.</h2></div>
                        <span className="studio-chip">{bans.length}</span>
                    </div>
                    {bans.length > 0 ? (
                        <div className="studio-data-stack">
                            {bans.map((ban) => (
                                <div className="studio-data-row" key={ban.id}>
                                    <span className="studio-avatar">{(ban.bannedName || ban.bannedEmail)?.trim()?.[0]?.toUpperCase() ?? "?"}</span>
                                    <div><strong>{ban.bannedName || ban.bannedEmail}</strong><small>{ban.bannedEmail}</small></div>
                                    <button
                                        type="button"
                                        className="studio-text-button"
                                        disabled={busyId === ban.id}
                                        onClick={() => void runAction(ban.id, () => unbanMember(ban.id), `${ban.bannedEmail} can rejoin with the workspace code again.`)}
                                    >
                                        Unban
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[11px] leading-relaxed text-[#8a8b83]">Nobody is banned from this workspace.</p>
                    )}
                </section>
            )}
        </>
    );
}

function DeleteBrandSection() {
    const [brand, setBrand] = useState<BrandSettings | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [typedName, setTypedName] = useState("");
    const [status, setStatus] = useState("");
    const [deleting, setDeleting] = useState(false);
    useEffect(() => { getBrand().then(setBrand).catch(() => {}); }, []);
    const expected = (brand?.name || "").trim();
    const matches = expected.length > 0 && typedName.trim().toLowerCase() === expected.toLowerCase();

    const destroy = async () => {
        if (!matches) return;
        setDeleting(true); setStatus("");
        try {
            await deleteBrand({ confirmName: typedName.trim() });
            window.location.href = "/dashboard";
        } catch (err) {
            setStatus(err instanceof Error ? err.message : "Unable to delete brand");
            setDeleting(false);
        }
    };

    return (
        <section className="studio-workspace-panel studio-danger-zone">
            <div className="studio-panel-heading">
                <div><span className="studio-kicker studio-kicker--dark">DANGER ZONE</span><h2>Delete brand</h2></div>
            </div>
            <p className="text-[11px] leading-relaxed text-[#8a8b83]">
                This permanently deletes the entire workspace: every product, post, template, and linked
                social account. Every other member keeps their own account but is moved to a fresh, empty
                personal workspace — this can&apos;t be undone.
            </p>
            {!confirming ? (
                <button type="button" className="studio-button studio-button--danger mt-3" onClick={() => setConfirming(true)}>
                    <Trash2 size={14} /> Delete brand
                </button>
            ) : (
                <div className="mt-3 flex flex-col gap-2">
                    <label className="text-[11px] text-[#8a8b83]">
                        Type <strong className="text-[#e9ebe0]">{expected || "the workspace name"}</strong> exactly to confirm.
                    </label>
                    <input
                        value={typedName}
                        onChange={(event) => setTypedName(event.target.value)}
                        placeholder={expected}
                        autoFocus
                    />
                    {status && <p className="studio-form-error">{status}</p>}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="studio-button studio-button--danger"
                            disabled={!matches || deleting}
                            onClick={() => void destroy()}
                        >
                            {deleting ? <Loader2 className="studio-spin" size={14} /> : <Trash2 size={14} />} Permanently delete
                        </button>
                        <button type="button" className="studio-text-button" disabled={deleting} onClick={() => { setConfirming(false); setTypedName(""); setStatus(""); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

type SettingsTab = "account" | "team" | "brand" | "social";

// Each entry reuses an icon already imported elsewhere in this file — see the
// Facebook/Instagram incident: this lucide-react version dropped several
// exports, so sticking to icons already proven to resolve avoids repeating
// that crash.
const SETTINGS_NAV: [SettingsTab, string, typeof Settings2][] = [
    ["account", "Account", Settings2],
    ["team", "Members & Roles", Users2],
    ["brand", "Brand", Palette],
    ["social", "Linked accounts", Store],
];

function SettingsSurface() {
    // Reads ?tab=social (etc.) so other pages can deep-link straight into a
    // specific Settings section — e.g. "link your accounts" from Batch, or
    // "Brand settings" from the sidebar's profile menu. useSearchParams (not
    // a one-time window.location read) is what makes this reactive: since
    // /dashboard/settings and /dashboard/settings?tab=brand are the same
    // route, Next.js doesn't remount this component on that navigation, so a
    // plain useState initializer would only ever read the URL once and never
    // update without a manual refresh. The Suspense boundary this requires
    // is scoped to just this surface (see Surface()), not the whole tree.
    const searchParams = useSearchParams();
    const requestedTab = searchParams.get("tab");
    const urlTab: SettingsTab = SETTINGS_NAV.some(([key]) => key === requestedTab) ? (requestedTab as SettingsTab) : "account";
    const [tab, setTab] = useState<SettingsTab>(urlTab);
    useEffect(() => { setTab(urlTab); }, [urlTab]);
    const [me, setMe] = useState<UserSummary | null>(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch intentionally hydrates this panel.
    useEffect(() => { getMe().then(setMe).catch(() => {}); }, []);
    return (
        <div className="studio-settings">
            <aside className="studio-settings__nav">
                <p className="studio-settings__nav-title">Settings</p>
                <nav className="studio-settings__nav-list">
                    {SETTINGS_NAV.map(([key, label, Icon]) => (
                        <button
                            key={key}
                            type="button"
                            className={`studio-settings__nav-item ${tab === key ? "is-active" : ""}`}
                            onClick={() => setTab(key)}
                        >
                            <Icon size={15} /> {label}
                        </button>
                    ))}
                </nav>
                <div className="studio-settings__nav-footer">
                    <SignOutButton variant="button" />
                </div>
            </aside>
            <div className="studio-settings__content">
                {tab === "account" && <><ProfileSection /><PasswordSection /><DeleteAccountSection />{me?.brandRole === "OWNER" && <DeleteBrandSection />}</>}
                {tab === "team" && <CoworkersSection />}
                {tab === "brand" && <BrandSurface />}
                {tab === "social" && <LinkedAccountsSection />}
            </div>
        </div>
    );
}

function AssetsSurface({ products, posts }: { products: Product[]; posts: Post[] }) {
    const assets = [...products.flatMap((product) => [product.imageUrl, product.imageUrl2, product.imageUrl3].filter(Boolean).map((url) => ({ url: url as string, label: product.name, kind: "Product" }))), ...posts.filter((post) => post.imageUrl).map((post) => ({ url: post.imageUrl as string, label: post.productName, kind: "Generated post" }))];
    return <section className="studio-workspace-panel studio-assets-library"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">ASSET MEMORY</span><h2>Approved visual sources</h2><p className="studio-panel-caption">Product references and saved post files, held in one inspectable contact sheet.</p></div><span className="studio-chip">{assets.length} files</span></div>{assets.length ? <><AssetDepthCarousel items={assets.map((asset, index) => ({ ...asset, id: `${asset.url}-${index}` }))} /><div className="studio-asset-grid">{assets.map((asset, index) => <a className="studio-asset-card" key={`${asset.url}-${index}`} href={asset.url} target="_blank" rel="noreferrer"><img src={asset.url} alt={asset.label} /><div><strong>{asset.label}</strong><small>{asset.kind}</small></div></a>)}</div></> : <Notice title="No assets have landed yet." detail="Upload a product reference to start building the library." action={<Link className="studio-button studio-button--dark" href="/dashboard/products">Add source material <Plus size={14} /></Link>} />}</section>;
}

function WorkspaceInvitesSection() {
    const [invites, setInvites] = useState<BrandInvitation[] | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [status, setStatus] = useState("");

    useEffect(() => { listMyInvitations().then(setInvites).catch((err) => setStatus(err instanceof Error ? err.message : "Unable to load invites")); }, []);

    const respond = async (invitation: BrandInvitation, accept: boolean) => {
        setBusy(invitation.id); setStatus("");
        try {
            if (accept) {
                await acceptInvitation(invitation.id);
                // Accepting moves this account to the invite's brand — every
                // brand-scoped view (sidebar, products, posts...) needs to
                // refetch against the new workspace, so a full reload is the
                // simplest way to guarantee nothing shows stale data.
                window.location.href = "/dashboard";
                return;
            }
            await declineInvitation(invitation.id);
            setInvites((current) => (current ?? []).filter((item) => item.id !== invitation.id));
        } catch (err) {
            setStatus(err instanceof Error ? err.message : "Unable to respond to invite");
            setBusy(null);
        }
    };

    if (!invites || invites.length === 0) return null;

    return (
        <section className="studio-workspace-panel studio-workspace-panel--accent studio-workspace-panel--wide">
            <span className="studio-kicker studio-kicker--dark">WORKSPACE INVITES</span>
            <h2>Someone wants you on their team.</h2>
            <div className="studio-data-stack">
                {invites.map((invitation) => (
                    <div className="studio-data-row" key={invitation.id}>
                        <span className="studio-avatar">{invitation.brandName?.trim()?.[0]?.toUpperCase() ?? "?"}</span>
                        <div><strong>{invitation.brandName}</strong><small>Invited by {invitation.invitedByName || "a teammate"} · {new Date(invitation.createdAt).toLocaleDateString()}</small></div>
                        <span className="flex items-center gap-2">
                            <button
                                className="studio-button studio-button--dark"
                                style={{ padding: "7px 14px", fontSize: 11 }}
                                disabled={busy === invitation.id}
                                onClick={() => void respond(invitation, true)}
                            >
                                {busy === invitation.id ? <Loader2 className="studio-spin" size={13} /> : "Accept"}
                            </button>
                            <button className="studio-text-button" disabled={busy === invitation.id} onClick={() => void respond(invitation, false)}>
                                Decline
                            </button>
                        </span>
                    </div>
                ))}
            </div>
            {status && <p className="studio-form-error">{status}</p>}
        </section>
    );
}

function NotificationsSurface({ products }: { products: Product[] }) {
    const [query, setQuery] = useState("");
    // Every product goes live immediately now (no approval gate), so "recently
    // added" is read straight off createdAt rather than a PENDING status that
    // nothing ever lands in anymore. Capped to the last 7 days / 20 items so
    // this doesn't turn into a full product history.
    const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const notices = products
        .filter((product) => product.createdAt && new Date(product.createdAt).getTime() >= recentCutoff)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20)
        .map((product) => ({ id: `product-${product.id}`, title: `${product.name} was added to your brand`, detail: "New product source is available in the catalog.", href: "/dashboard/products" }));
    const filteredNotices = query
        ? notices.filter((notice) => notice.title.toLowerCase().includes(query.toLowerCase()) || notice.detail.toLowerCase().includes(query.toLowerCase()))
        : notices;
    return <><WorkspaceInvitesSection /><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">LIVE SIGNALS</span><h2>Products added to your brand</h2></div><div className="relative"><Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#787c72]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notifications…" className="w-44 rounded-full border border-white/12 bg-black/25 py-1.5 pl-8 pr-7 text-xs text-[#e9ebe0] transition-colors placeholder:text-[#6f716a] outline-none focus:outline-none focus-visible:outline-none focus:border-[#c6ff5e]/70 sm:w-56" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#787c72] hover:text-[#c6ff5e]"><X size={12} /></button>}</div></div>{filteredNotices.length ? <div className="studio-data-stack">{filteredNotices.map((notice) => <Link className="studio-data-row" key={notice.id} href={notice.href}><span className="studio-status-dot studio-status-dot--lime" /><div><strong>{notice.title}</strong><small>{notice.detail}</small></div><ChevronRight size={14} /></Link>)}</div> : <Notice title={query ? "No matching notifications." : "Nothing needs your attention."} detail={query ? "Try a different search term." : "Invitations and new products added to your brand will appear here."} />}</section></>;
}

function SocialSurface({ posts }: { posts: Post[] }) {
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [jobs, setJobs] = useState<PublishJob[]>([]);
    const [selectedPost, setSelectedPost] = useState("");
    const [selectedConnection, setSelectedConnection] = useState("");
    const [scheduledFor, setScheduledFor] = useState("");
    const [status, setStatus] = useState("");
    const [statusError, setStatusError] = useState(false);
    const [busy, setBusy] = useState(false);
    const [timezone, setTimezone] = useState("your device timezone");
    const providers: SocialProvider[] = ["META", "TIKTOK", "LINKEDIN", "X"];
    const providerLabels: Record<SocialProvider, string> = { META: "Meta / Instagram + Facebook", TIKTOK: "TikTok", LINKEDIN: "LinkedIn", X: "X" };
    const reload = useCallback(async () => { try { const [nextConnections, nextJobs] = await Promise.all([listSocialConnections(), listPublishJobs()]); setConnections(nextConnections); setJobs(nextJobs); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to load social publishing data"); setStatusError(true); } }, []);
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
        } catch (err) { setStatus(err instanceof Error ? err.message : "Provider OAuth is not configured"); setStatusError(true); }
        finally { setBusy(false); }
    };
    const disconnect = async (id: string) => { setBusy(true); try { await disconnectSocialConnection(id); await reload(); setStatus("Connection marked disconnected."); setStatusError(false); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to disconnect provider"); setStatusError(true); } finally { setBusy(false); } };
    const publish = async () => { if (!selectedPost || !selectedConnection) { setStatus("Choose an approved post and an active channel first."); setStatusError(true); return; } setBusy(true); setStatus(""); try { await queueSocialPublish({ postId: selectedPost, connectionId: selectedConnection, scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null }); setStatus(scheduledFor ? "Scheduled delivery saved. STUDIO will hand it to the connected channel at the selected time." : "Publish job queued. The provider response will determine its final state."); setStatusError(false); setSelectedPost(""); setScheduledFor(""); await reload(); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to queue publish job"); setStatusError(true); } finally { setBusy(false); } };
    const approvedPosts = posts.filter((post) => post.status === "APPROVED");
    const activeConnections = connections.filter((connection) => connection.status === "ACTIVE");
    const steps = [
        { number: "01", title: "Connect", detail: activeConnections.length ? `${activeConnections.length} active channel${activeConnections.length === 1 ? "" : "s"}` : "Choose a channel below", ready: activeConnections.length > 0 },
        { number: "02", title: "Choose", detail: selectedPost ? "Approved post selected" : "Select an approved post", ready: Boolean(selectedPost) },
        { number: "03", title: "Schedule", detail: scheduledFor ? `${new Date(scheduledFor).toLocaleString()} (${timezone})` : `Now or a future time · ${timezone}`, ready: Boolean(selectedConnection) },
    ];
    return <div className="studio-delivery-board space-y-5"><ConnectTutorial /><section className="studio-workspace-panel studio-publish-stepper studio-delivery-path"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">AUTOMATION SETUP</span><h2>Connect once. Schedule with intent.</h2><p>STUDIO stores the delivery time on the server; it is not a browser reminder.</p></div><span className="studio-chip">{activeConnections.length} live</span></div><ol>{steps.map((step, index) => <li className={step.ready ? "is-ready" : ""} key={step.number}><span>{step.ready ? <Check size={14} /> : step.number}</span><div><strong>{step.title}</strong><small>{step.detail}</small></div>{index < steps.length - 1 && <i />}</li>)}</ol></section><div className="studio-live-columns"><section className="studio-workspace-panel studio-channel-board"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">STEP 01 / CONNECTIONS</span><h2>Choose your channels</h2><p className="studio-panel-caption">A connection becomes available only after its server-side OAuth configuration is ready.</p></div></div><div className="studio-data-stack">{providers.map((provider) => { const connection = connections.find((item) => item.provider === provider && item.status === "ACTIVE"); return <div className="studio-data-row" key={provider}><span className={`studio-status-dot ${connection ? "studio-status-dot--lime" : ""}`} /><div><strong>{providerLabels[provider]}</strong><small>{connection ? `${connection.accountName || "Connected account"} · ready to schedule` : "Connect to enable scheduled delivery"}</small></div>{connection ? <button type="button" className="studio-text-button" disabled={busy} onClick={() => void disconnect(connection.id)}>Disconnect</button> : <button type="button" className="studio-text-button" disabled={busy} onClick={() => void connect(provider)}>Connect</button>}</div>; })}</div>{status && <p className={statusError ? "studio-form-error" : "studio-inline-notice"} role="status">{status}</p>}</section><section className="studio-workspace-panel studio-workspace-panel--accent studio-delivery-picker"><span className="studio-kicker studio-kicker--dark">STEPS 02–03 / DELIVERY</span><h2>Pick the post, then pick the moment.</h2><p>An approved post is required. A blank time publishes immediately; a future time is persisted and picked up by the delivery scheduler.</p><div className="studio-form-grid"><label>Approved post<select value={selectedPost} onChange={(event) => setSelectedPost(event.target.value)}><option value="">Choose a post</option>{approvedPosts.map((post) => <option key={post.id} value={post.id}>{post.productName} · {post.format}</option>)}</select></label><label>Connected channel<select value={selectedConnection} onChange={(event) => setSelectedConnection(event.target.value)}><option value="">Choose a channel</option>{activeConnections.map((connection) => <option key={connection.id} value={connection.id}>{providerLabels[connection.provider]} · {connection.accountName || "Account"}</option>)}</select></label><label className="studio-form-grid__wide">Schedule for <span className="studio-field-hint">Leave blank to publish now.</span><div className="studio-schedule-input"><Clock3 size={15} /><input type="datetime-local" value={scheduledFor} min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)} onChange={(event) => setScheduledFor(event.target.value)} /></div></label></div><button type="button" className="studio-button studio-button--dark" disabled={busy || !approvedPosts.length || !activeConnections.length || !selectedPost || !selectedConnection} onClick={() => void publish()}><ArrowUpRight size={14} /> {scheduledFor ? "Schedule delivery" : "Queue publish"}</button>{!approvedPosts.length && <p className="studio-inline-notice">No approved posts are available yet.</p>}</section></div><section className="studio-workspace-panel studio-workspace-panel--wide studio-delivery-receipts"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">DELIVERY RECEIPTS</span><h2>Publish jobs</h2><p className="studio-panel-caption">Server-recorded delivery outcomes, not a simulated posting feed.</p></div><span className="studio-chip">{jobs.length} jobs</span></div>{jobs.length ? <div className="studio-data-stack">{jobs.slice(0, 10).map((job) => <div className="studio-data-row" key={job.id}><span className={`studio-status-dot ${job.status === "SENT" ? "studio-status-dot--lime" : ""}`} /><div><strong>{providerLabels[job.provider]} · {job.status}</strong><small>{job.scheduledFor && job.status === "QUEUED" ? `Scheduled for ${new Date(job.scheduledFor).toLocaleString()}` : job.externalPostId ? `Provider id ${job.externalPostId}` : job.errorMessage || "Awaiting provider response"}</small></div><span className="studio-data-value">{job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Queued"}</span></div>)}</div> : <Notice title="No publish jobs yet." detail="Connect a provider, choose an approved post, then save a delivery time." />}</section></div>;
}

function Unavailable({ label, reason }: { label: string; reason: string }) { return <Notice title={`${label} is ready for its backend route.`} detail={reason} action={<Link className="studio-button studio-button--dark" href="/contact">Talk to the team <ArrowUpRight size={14} /></Link>} />; }

function ProductsSurface({ products, refresh }: { products: Product[]; refresh: () => void }) {
    return <div className="studio-live-columns"><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">CATALOG</span><h2>Add a product</h2></div></div><ProductForm onCreated={refresh} /></section><section className="studio-workspace-panel studio-workspace-panel--wide"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">SOURCE MATERIAL</span><h2>Your products</h2></div><span className="studio-chip">{products.length} items</span></div><ProductList products={products} onProductDeleted={refresh} /></section></div>;
}

function Surface({ mode, products, posts, refresh, onStudioPostChange }: { mode: WorkspaceMode; products: Product[]; posts: Post[]; refresh: () => void; onStudioPostChange: () => void }) {
    if (mode === "dashboard") return <Overview products={products} posts={posts} refresh={refresh} />;
    if (mode === "products") return <ProductsSurface products={products} refresh={refresh} />;
    if (mode === "studio") return <section className="studio-workspace-panel studio-workspace-panel--wide studio-workspace-panel--studio"><CreativeStudio products={products} onPostChange={onStudioPostChange} /></section>;
    if (mode === "batch") return <BatchPublishStudio posts={posts} />;
    if (mode === "assets") return <AssetsSurface products={products} posts={posts} />;
    if (mode === "social") return <SocialSurface posts={posts} />;
    if (mode === "notifications") return <NotificationsSurface products={products} />;
    // Suspense boundary is required here (and only here) because SettingsSurface
    // reads the ?tab= query param via useSearchParams() so switching tabs from
    // the profile menu (a different route segment) actually updates the page
    // without a manual refresh — a plain window.location.search read doesn't
    // react to same-route client-side navigations.
    return <Suspense fallback={<div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading settings…</div>}><SettingsSurface /></Suspense>;
}

export function WorkspacePage({ mode }: { mode: WorkspaceMode }) {
    const authed = useRequireAuth();
    const [label, title, description, Icon] = workspaceData[mode];
    const isStudioRoute = mode === "studio";
    // Batch has its own hero + search built into BatchPublishStudio, so it opts out of
    // the generic masthead/control-bar header (whose search box wasn't wired to anything anyway).
    const isWorktableRoute = mode === "dashboard" || mode === "products" || mode === "batch" || mode === "social" || mode === "notifications" || mode === "settings" || mode === "assets";
    const { products, posts, brand, loading, error, reload } = useLiveWorkspace();
    const searchRef = useRef<HTMLInputElement>(null);
    if (!authed) return <div className="studio-loading" style={{ minHeight: "100vh" }}><Loader2 className="studio-spin" size={18} /> Checking your session…</div>;
    return <EditionDeskShell activeKey={mode} contextLabel="CREATIVE OPERATIONS" navigation={workspaceEditionNavigation} brand={brand}><StudioCommandPalette /><div className={`${isStudioRoute ? "studio-app--studio" : ""} studio-edition-route studio-edition-route--${mode}`}>{!isStudioRoute && !isWorktableRoute && <div className="studio-workspace-topbar"><RouteMasthead kicker={`WORKSPACE / ${label.toUpperCase()}`} title={title} description={description} actions={<><button className="studio-icon-button" aria-label={`Focus ${label.toLowerCase()} search`} onClick={() => searchRef.current?.focus()}><Search size={17} /></button><Link href="/dashboard/studio" className="studio-button studio-button--dark"><Plus size={15} /> New direction</Link></>} /></div>}<section className={`studio-workspace-content ${isWorktableRoute ? "studio-workspace-content--worktable" : ""}`}>{!isStudioRoute && !isWorktableRoute && <RouteControlBar icon={Icon} label={label}><label className="studio-search"><Search size={15} /><input ref={searchRef} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label.toLowerCase()}`} /></label></RouteControlBar>}{error && <div className="studio-form-error"><strong>Live data unavailable.</strong> {error} <button onClick={() => void reload()}>Retry</button></div>}{loading ? <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading live workspace data…</div> : <Surface mode={mode} products={products} posts={posts} refresh={() => void reload({ background: true })} onStudioPostChange={() => void reload({ background: true })} />}</section></div></EditionDeskShell>;
}

function AdminSurface({ mode, products, posts, templates, summary, capabilities }: { mode: AdminMode; products: Product[]; posts: Post[]; templates: Template[]; summary: AdminSummary | null; capabilities: SystemCapabilities | null }) {
    if (mode === "products") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">PRODUCTS</span><h2>Catalog</h2></div><span className="studio-chip">{products.length} items</span></div><Notice title="Every product goes live immediately." detail="Any brand member can add, edit, or delete a product — there's no approval step to moderate here anymore." /></section>;
    if (["content", "generations", "publishing"].includes(mode)) return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">LIVE RECORDS</span><h2>{mode === "publishing" ? "Publishing records" : mode === "generations" ? "Composition records" : "Content records"}</h2></div><span className="studio-chip">{posts.length} posts</span></div><div className="studio-data-stack">{posts.length ? posts.map((post) => <div className="studio-data-row" key={post.id}><span className="studio-status-dot" /><div><strong>{post.productName}</strong><small>{post.status} · {post.format}</small></div><span className="studio-data-value">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "New"}</span><ChevronRight size={14} /></div>) : <Notice title="No content records." detail="Composed posts will appear here once a workspace creates them." />}</div></section>;
    if (mode === "templates") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">TEMPLATE LIBRARY</span><h2>Reusable scaffolds</h2></div><span className="studio-chip">{templates.length} loaded</span></div><div className="studio-data-stack">{templates.length ? templates.map((template) => <div className="studio-data-row" key={template.id}><span className="studio-status-dot studio-status-dot--lime" /><div><strong>{template.name}</strong><small>{template.format}</small></div><span className="studio-data-value">{template.thumbnailUrl ? "Preview ready" : "No thumbnail"}</span><ChevronRight size={14} /></div>) : <Notice title="No templates returned." detail="Templates are loaded from `/api/templates`." />}</div></section>;
    if (mode === "dashboard" || mode === "analytics") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">BACKEND SIGNAL</span><h2>{mode === "analytics" ? "Observed workspace motion" : "System overview"}</h2></div><span className="studio-chip">{summary ? "LIVE SUMMARY" : "RECORD FALLBACK"}</span></div><div className="studio-stat-grid studio-stat-grid--admin"><div><span>USERS</span><strong>{summary?.users ?? "—"}</strong><small>Registered accounts</small></div><div><span>WORKSPACES</span><strong>{summary?.workspaces ?? "—"}</strong><small>Configured brand workspaces</small></div><div><span>PRODUCTS</span><strong>{summary?.products ?? products.length}</strong><small>Admin-visible source material</small></div><div><span>POSTS</span><strong>{summary?.posts ?? posts.length}</strong><small>Generated content records</small></div><div><span>TEMPLATES</span><strong>{summary?.templates ?? templates.length}</strong><small>Reusable creative scaffolds</small></div><div><span>PENDING</span><strong>{summary?.pendingProducts ?? "—"}</strong><small>Products awaiting review</small></div></div></section>;
    if (mode === "users" || mode === "workspaces") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">LIVE DIRECTORY</span><h2>{mode === "users" ? "Account directory" : "Workspace directory"}</h2></div></div><div className="studio-stat-grid studio-stat-grid--admin"><div><span>{mode === "users" ? "USERS" : "WORKSPACES"}</span><strong>{mode === "users" ? summary?.users ?? "—" : summary?.workspaces ?? "—"}</strong><small>Derived from persisted records</small></div><div><span>PRODUCTS</span><strong>{summary?.products ?? products.length}</strong><small>Source material in scope</small></div><div><span>POSTS</span><strong>{summary?.posts ?? posts.length}</strong><small>Content records in scope</small></div></div><Notice title="Directory mutations are intentionally disabled." detail="The current API exposes safe counts but not user deletion, workspace reassignment, or role-management endpoints. No destructive control is presented without an audited backend route." /></section>;
    if (mode === "publishing" || mode === "settings") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">SYSTEM READINESS</span><h2>{mode === "publishing" ? "Delivery readiness" : "Admin settings"}</h2></div></div><div className="studio-data-stack">{[["Caption templates", capabilities?.captionGeneration, "Local"], ["Visual composition", capabilities?.imageGeneration, "Local"], ["Cloud storage", capabilities?.cloudStorage, "Connected"], ["Local storage", capabilities?.localStorage, "Available"], ["Social publishing", capabilities?.socialPublishing, "Connected"], ["Email delivery", capabilities?.emailDelivery, "Connected"]].map(([label, ready, readyLabel]) => <div className="studio-data-row" key={String(label)}><span className={`studio-status-dot ${ready ? "studio-status-dot--lime" : ""}`} /><div><strong>{label}</strong><small>{ready ? readyLabel : "Not connected"}</small></div><span className="studio-data-value">{ready ? "READY" : "SETUP"}</span></div>)}</div><Notice title="Local creation is always self-contained." detail="Visual compositions and multilingual caption templates run inside STUDIO without image-generation or caption API keys. Connect channel credentials only when you are ready to deliver content by email or social publishing." /></section>;
    if (mode === "audit-logs") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">GOVERNANCE</span><h2>Audit log readiness</h2></div></div><Notice title="Audit persistence is not yet exposed by the current schema." detail="The control room does not invent audit entries. Add an audit-event table and append-only controller before enabling this route for compliance workflows." action={<Link className="studio-button studio-button--outline" href="/contact"><CircleHelp size={14} /> Request audit module</Link>} /></section>;
    return <Unavailable label={adminData[mode][0]} reason={`The current backend has no ${adminData[mode][0].toLowerCase()} controller.`} />;
}

export function AdminPage({ mode }: { mode: AdminMode }) {
    const authed = useRequireAuth({ adminOnly: true });
    const [label, title, Icon] = adminData[mode];
    const [products, setProducts] = useState<Product[]>([]); const [posts, setPosts] = useState<Post[]>([]); const [templates, setTemplates] = useState<Template[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<AdminSummary | null>(null); const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
    const reload = useCallback(async () => { setLoading(true); setError(null); try { const [nextProducts, nextPosts, nextTemplates, nextSummary, nextCapabilities] = await Promise.all([listProducts(), listPosts(), listTemplates(), getAdminSummary(), getSystemCapabilities()]); setProducts(nextProducts); setPosts(nextPosts); setTemplates(nextTemplates); setSummary(nextSummary); setCapabilities(nextCapabilities); } catch (err) { setError(err instanceof Error ? err.message : "Unable to load admin data"); } finally { setLoading(false); } }, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch intentionally hydrates this admin surface, gated on the auth check above.
    useEffect(() => { if (authed) void reload(); }, [authed, reload]);
    const adminNav: [AdminMode, string, typeof ShieldCheck][] = Object.entries(adminData).map(([key, value]) => [key as AdminMode, value[0], value[2] as typeof ShieldCheck]);
    if (!authed) return <div className="studio-loading" style={{ minHeight: "100vh" }}><Loader2 className="studio-spin" size={18} /> Checking your session…</div>;
    return <main className="studio-app studio-admin"><aside className="studio-workspace-sidebar"><div className="studio-workspace-sidebar__brand"><StudioMark compact /><span>ADMIN / CONTROL ROOM</span></div><nav>{adminNav.map(([key, item, NavIcon]) => <Link key={key} href={`/admin/${key}`} className={mode === key ? "is-active" : ""}><NavIcon size={16} />{item}</Link>)}</nav><div className="studio-workspace-sidebar__bottom"><Link href="/dashboard"><LayoutDashboard size={15} />Workspace</Link><Link href="/">← Back to site</Link><SignOutButton /></div></aside><div className="studio-workspace-main"><header className="studio-workspace-topbar"><div><span className="studio-kicker studio-kicker--dark">CONTROL ROOM / {label.toUpperCase()}</span><h1>{title}</h1><p>Operations, governance, and the signals behind the creative system.</p></div><div className="studio-admin-status"><span className="studio-dot studio-dot--lime" /> Live backend</div></header><section className="studio-workspace-content"><div className="studio-command-row"><div className="studio-route-title"><Icon size={20} /><span>{label}</span></div><button className="studio-text-button" onClick={() => void reload()}><RefreshCw size={14} /> Refresh data</button></div>{error && <div className="studio-form-error"><strong>Admin data unavailable.</strong> {error}</div>}{loading ? <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading admin data…</div> : <AdminSurface mode={mode} products={products} posts={posts} templates={templates} summary={summary} capabilities={capabilities} />}</section></div></main>;
}
