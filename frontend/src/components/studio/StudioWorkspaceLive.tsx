"use client";
/* CAMPAIGN SWITCHBOARD / AUTHENTICATED WORKSPACE: a landing-color production desk with charcoal controls, warm-paper records, lime active states, and real source → proof → delivery workflows. */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowUpRight, Bell, CalendarDays, Camera, Check, ChevronRight, CircleHelp,
    Download, FileImage, FolderOpen, Layers3, LayoutDashboard, Loader2,
    LogOut, MessageCircle, Music2, Package, Palette, Plus, RefreshCw, Search, Settings2, ShieldCheck,
    Sparkles, Store, ThumbsUp, Trash2, Users2,
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
import { logout, getCurrentUser, type UserProfile } from "@/lib/api/auth";
import { getMe, updateProfile, changePassword, listCoworkers, type UserSummary } from "@/lib/api/users";
import { getSystemCapabilities, type SystemCapabilities } from "@/lib/api/system";
import { getAdminSummary, type AdminSummary } from "@/lib/api/admin";
import { connectSocialAccount, disconnectSocialAccount, disconnectSocialConnection, getSocialConnectUrl, listPublishJobs, listSocialAccounts, listSocialConnections, queueSocialPublish, type MetaTarget, type PublishJob, type SocialAccount, type SocialConnection, type SocialPlatform, type SocialProvider } from "@/lib/api/social";
import { listEmailDeliveries, type EmailDelivery } from "@/lib/api/email";
import { acceptInvitation, declineInvitation, inviteToBrand, listMyInvitations, listSentInvitations, type BrandInvitation } from "@/lib/api/invitations";

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
    const [draft, setDraft] = useState<BrandSettingsInput>({ name: "", logoUrl: "", primaryColor: "#B9FF43", secondaryColor: "#11110F", fontFamily: "Space Grotesk", toneGuidelines: "" });
    const [status, setStatus] = useState("Loading brand kit…"); const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    useEffect(() => { getBrand().then((value) => { setBrand(value); setDraft({ name: value.name ?? "", logoUrl: value.logoUrl ?? "", primaryColor: value.primaryColor ?? "", secondaryColor: value.secondaryColor ?? "", fontFamily: value.fontFamily ?? "", toneGuidelines: value.toneGuidelines ?? "" }); setStatus(""); }).catch((err) => setStatus(err instanceof Error ? err.message : "Unable to load brand kit")); }, []);
    const save = async () => { setSaving(true); setStatus(""); try { const value = await updateBrand(draft); setBrand(value); setStatus("Brand settings saved."); } catch (err) { setStatus(err instanceof Error ? err.message : "Unable to save brand kit"); } finally { setSaving(false); } };
    const copyCode = async () => {
        if (!brand?.joinCode) return;
        try { await navigator.clipboard.writeText(brand.joinCode); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable — code is still selectable/visible */ }
    };
    if (!brand && status === "Loading brand kit…") return <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> {status}</div>;
    return <div className="studio-live-columns"><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">BRAND SETTINGS</span><h2>{brand?.name || "Your brand"}</h2></div><span className="studio-chip">LIVE API</span></div><div className="studio-form-grid">{([["name", "Brand name"], ["logoUrl", "Logo URL"], ["primaryColor", "Primary color"], ["secondaryColor", "Secondary color"], ["fontFamily", "Font family"]] as const).map(([key, label]) => <label key={key}>{label}<input value={draft[key] ?? ""} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}<label className="studio-form-grid__wide">Tone guidelines<textarea rows={5} value={draft.toneGuidelines ?? ""} onChange={(event) => setDraft({ ...draft, toneGuidelines: event.target.value })} /></label></div>{status && <p className="studio-inline-notice">{status}</p>}<button className="studio-button studio-button--dark" disabled={saving} onClick={() => void save()}>{saving ? <Loader2 className="studio-spin" size={15} /> : <Check size={15} />} Save brand kit</button></section><section className="studio-workspace-panel studio-workspace-panel--accent"><span className="studio-kicker studio-kicker--dark">INVITE TEAMMATES</span><h2>Bring your team into this workspace.</h2><p>Share this code — teammates enter it under &quot;Join with a code&quot; on the register page to land in this exact brand instead of creating their own.</p>{brand?.joinCode && <div className="flex items-center gap-2 mt-3"><span className="studio-chip studio-chip--lime" style={{ fontSize: "13px", padding: "8px 12px", letterSpacing: "0.15em" }}>{brand.joinCode}</span><button className="studio-text-button" onClick={() => void copyCode()}>{copied ? "Copied!" : "Copy"}</button></div>}<div className="studio-color-pair"><span style={{ background: draft.primaryColor || "#B9FF43" }} /><span style={{ background: draft.secondaryColor || "#11110F" }} /></div></section></div>;
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
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getMe()
            .then((value) => { setMe(value); setDraft({ name: value.name ?? "", email: value.email }); setStatus(""); })
            .catch((err) => setStatus(err instanceof Error ? err.message : "Unable to load profile"));
    }, []);

    const save = async () => {
        setSaving(true); setStatus("");
        try { const value = await updateProfile(draft); setMe(value); setStatus("Profile updated."); }
        catch (err) { setStatus(err instanceof Error ? err.message : "Unable to update profile"); }
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
            {status && <p className="studio-inline-notice">{status}</p>}
            <button className="studio-button studio-button--dark" disabled={saving} onClick={() => void save()}>
                {saving ? <Loader2 className="studio-spin" size={15} /> : <Check size={15} />} Save changes
            </button>
        </section>
    );
}

function PasswordSection() {
    const [draft, setDraft] = useState({ currentPassword: "", newPassword: "" });
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);

    const save = async () => {
        setSaving(true); setStatus("");
        try {
            await changePassword(draft);
            setDraft({ currentPassword: "", newPassword: "" });
            setStatus("Password updated.");
        } catch (err) {
            setStatus(err instanceof Error ? err.message : "Unable to update password");
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
            {status && <p className="studio-inline-notice">{status}</p>}
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
                                        className="min-w-0 flex-1 border border-[#bdbdb4] bg-white px-2 py-1.5 text-[12px] text-[var(--studio-ink)] outline-none focus:border-[var(--studio-ink)]"
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
            {status && <p className="studio-inline-notice">{status}</p>}
        </section>
    );
}

function CoworkersSection() {
    const [coworkers, setCoworkers] = useState<UserSummary[] | null>(null);
    const [status, setStatus] = useState("");
    const [sent, setSent] = useState<BrandInvitation[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteStatus, setInviteStatus] = useState("");
    const [inviting, setInviting] = useState(false);

    const reload = useCallback(() => {
        listCoworkers().then(setCoworkers).catch((err) => setStatus(err instanceof Error ? err.message : "Unable to load coworkers"));
        listSentInvitations().then(setSent).catch(() => {});
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
            reload();
        } catch (err) {
            setInviteStatus(err instanceof Error ? err.message : "Unable to send invite");
        } finally {
            setInviting(false);
        }
    };

    const pending = sent.filter((invitation) => invitation.status === "PENDING");

    return (
        <>
            <section className="studio-workspace-panel">
                <div className="studio-panel-heading">
                    <div><span className="studio-kicker studio-kicker--dark">TEAM</span><h2>Coworkers in this workspace.</h2></div>
                    <span className="studio-chip">{coworkers?.length ?? 0}</span>
                </div>
                {status && <p className="studio-inline-notice">{status}</p>}
                {coworkers && coworkers.length > 0 ? (
                    <div className="studio-data-stack">
                        {coworkers.map((person) => (
                            <div className="studio-data-row" key={person.id}>
                                <span className="studio-avatar">{person.name?.trim()?.[0]?.toUpperCase() ?? "?"}</span>
                                <div><strong>{person.name}</strong><small>{person.email}</small></div>
                                <span className="studio-data-value">{person.role}</span>
                            </div>
                        ))}
                    </div>
                ) : coworkers ? (
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
                {inviteStatus && <p className="studio-inline-notice">{inviteStatus}</p>}
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
        </>
    );
}

function CapabilityStatusSection() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => { Promise.all([getCurrentUser(), getSystemCapabilities()]).then(([nextProfile, nextCapabilities]) => { setProfile(nextProfile); setCapabilities(nextCapabilities); }).catch((err) => setError(err instanceof Error ? err.message : "Unable to load workspace settings")); }, []);
    if (error) return <Notice title="Capability status unavailable." detail={error} />;
    if (!profile || !capabilities) return <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading capability status…</div>;
    const capabilityRows: [string, boolean][] = [["Caption generation", capabilities.captionGeneration], ["Image generation", capabilities.imageGeneration], ["Cloud storage", capabilities.cloudStorage], ["Local storage", capabilities.localStorage], ["Social publishing", capabilities.socialPublishing], ["SMTP email", capabilities.smtpEmail], ["Meta OAuth", capabilities.metaOAuth], ["TikTok OAuth", capabilities.tiktokOAuth], ["LinkedIn OAuth", capabilities.linkedinOAuth], ["X OAuth", capabilities.xOAuth]];
    return (
        <section className="studio-workspace-panel studio-workspace-panel--accent">
            <span className="studio-kicker studio-kicker--dark">CAPABILITY CHECK</span>
            <h2>Only configured systems are shown as ready.</h2>
            <div className="studio-data-stack">{capabilityRows.map(([label, ready]) => <div className="studio-data-row" key={label}><span className={`studio-status-dot ${ready ? "studio-status-dot--lime" : ""}`} /><div><strong>{label}</strong><small>{ready ? "Configured" : "Needs environment setup"}</small></div></div>)}</div>
        </section>
    );
}

type SettingsTab = "account" | "team" | "brand" | "social" | "system";

// Each entry reuses an icon already imported elsewhere in this file — see the
// Facebook/Instagram incident: this lucide-react version dropped several
// exports, so sticking to icons already proven to resolve avoids repeating
// that crash.
const SETTINGS_NAV: [SettingsTab, string, typeof Settings2][] = [
    ["account", "Account", Settings2],
    ["team", "Team", Users2],
    ["brand", "Brand", Palette],
    ["social", "Linked accounts", Store],
    ["system", "System", ShieldCheck],
];

function SettingsSurface() {
    const [tab, setTab] = useState<SettingsTab>("account");
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
                {tab === "account" && <><ProfileSection /><PasswordSection /></>}
                {tab === "team" && <CoworkersSection />}
                {tab === "brand" && <BrandSurface />}
                {tab === "social" && <LinkedAccountsSection />}
                {tab === "system" && <CapabilityStatusSection />}
            </div>
        </div>
    );
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
    return <section className="studio-workspace-panel studio-calendar-ledger"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">CONTENT TIMELINE</span><h2>Recorded post dates</h2><p className="studio-calendar-caption">This lane reflects persisted creation dates. Scheduled delivery times live in Social receipts.</p></div><span className="studio-chip">{scheduled.length} dated</span></div>{scheduled.length ? <div className="studio-calendar-ledger__rows">{scheduled.map((post) => { const recordedAt = new Date(post.createdAt as string); return <Link className="studio-calendar-row" key={post.id} href="/dashboard/posts"><time dateTime={post.createdAt as string}><b>{String(recordedAt.getDate()).padStart(2, "0")}</b><small>{recordedAt.toLocaleDateString(undefined, { month: "short" })}</small></time><span className="studio-calendar-row__track" aria-hidden="true"><i /></span><div><strong>{post.productName}</strong><small>{post.status} · {post.format || "Post"}</small></div><span className={`studio-review-state studio-review-state--${post.status.toLowerCase()}`}>{post.status}</span><ChevronRight size={14} /></Link>; })}</div> : <Notice title="The date lane is waiting for a saved post." detail="Create a post in Studio and its persisted creation date will appear here." action={<Link className="studio-button studio-button--dark" href="/dashboard/studio"><Plus size={14} /> Create a post</Link>} />}</section>;
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
            {status && <p className="studio-inline-notice">{status}</p>}
        </section>
    );
}

function NotificationsSurface({ products, posts }: { products: Product[]; posts: Post[] }) {
    const [deliveries, setDeliveries] = useState<EmailDelivery[]>([]);
    const [deliveryError, setDeliveryError] = useState<string | null>(null);
    useEffect(() => { listEmailDeliveries().then(setDeliveries).catch((err) => setDeliveryError(err instanceof Error ? err.message : "Unable to load email delivery history")); }, []);
    const notices = [
        ...products.filter((product) => product.status === "PENDING").map((product) => ({ id: `product-${product.id}`, title: `${product.name} needs approval`, detail: "Product source is waiting in the moderation queue.", href: "/dashboard/products" })),
        ...posts.filter((post) => post.status === "DRAFT").map((post) => ({ id: `post-${post.id}`, title: `${post.productName} is still a draft`, detail: "Review captions or export the post from the content pipeline.", href: "/dashboard/posts" })),
    ];
    return <><WorkspaceInvitesSection /><div className="studio-live-columns"><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">LIVE SIGNALS</span><h2>Notifications from real records</h2></div><span className="studio-chip">{notices.length} open</span></div>{notices.length ? <div className="studio-data-stack">{notices.map((notice) => <Link className="studio-data-row" key={notice.id} href={notice.href}><span className="studio-status-dot studio-status-dot--lime" /><div><strong>{notice.title}</strong><small>{notice.detail}</small></div><ChevronRight size={14} /></Link>)}</div> : <Notice title="Nothing needs your attention." detail="Approval and draft events will appear here as your workspace changes." />}</section><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">SMTP DELIVERY</span><h2>Email history</h2></div><span className="studio-chip">{deliveries.length} records</span></div>{deliveryError ? <Notice title="Email history unavailable." detail={deliveryError} /> : deliveries.length ? <div className="studio-data-stack">{deliveries.slice(0, 8).map((delivery) => <div className="studio-data-row" key={delivery.id}><span className={`studio-status-dot ${delivery.status === "SENT" ? "studio-status-dot--lime" : ""}`} /><div><strong>{delivery.subject}</strong><small>{delivery.toAddress} · {delivery.status}{delivery.errorMessage ? ` · ${delivery.errorMessage}` : ""}</small></div><span className="studio-data-value">{delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString() : "Queued"}</span></div>)}</div> : <Notice title="No email deliveries yet." detail="SMTP delivery records will appear here after an authenticated send request is queued." />}</section></div></>;
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
    const router = useRouter();
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
    const adminNav: [AdminMode, string, typeof ShieldCheck][] = Object.entries(adminData).map(([key, value]) => [key as AdminMode, value[0], value[2] as typeof ShieldCheck]);
    return <main className="studio-app studio-admin"><aside className="studio-workspace-sidebar"><div className="studio-workspace-sidebar__brand"><StudioMark compact /><span>ADMIN / CONTROL ROOM</span></div><nav>{adminNav.map(([key, item, NavIcon]) => <Link key={key} href={`/admin/${key}`} className={mode === key ? "is-active" : ""}><NavIcon size={16} />{item}</Link>)}</nav><div className="studio-workspace-sidebar__bottom"><Link href="/dashboard"><LayoutDashboard size={15} />Workspace</Link><Link href="/">← Back to site</Link><SignOutButton /></div></aside><div className="studio-workspace-main"><header className="studio-workspace-topbar"><div><span className="studio-kicker studio-kicker--dark">CONTROL ROOM / {label.toUpperCase()}</span><h1>{title}</h1><p>Operations, governance, and the signals behind the creative system.</p></div><div className="studio-admin-status"><span className="studio-dot studio-dot--lime" /> Live backend</div></header><section className="studio-workspace-content"><div className="studio-command-row"><div className="studio-route-title"><Icon size={20} /><span>{label}</span></div><button className="studio-text-button" onClick={() => void reload()}><RefreshCw size={14} /> Refresh data</button></div>{error && <div className="studio-form-error"><strong>Admin data unavailable.</strong> {error}</div>}{loading ? <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading admin data…</div> : <AdminSurface mode={mode} products={products} posts={posts} templates={templates} summary={summary} capabilities={capabilities} />}</section></div></main>;
}
