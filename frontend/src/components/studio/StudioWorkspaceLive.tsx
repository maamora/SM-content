"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowUpRight, Bell, CalendarDays, Check, ChevronRight, CircleHelp,
    Download, Facebook, FileImage, FolderOpen, Instagram, Layers3, LayoutDashboard, Loader2,
    LogOut, MessageCircle, Music2, Package, Palette, Plus, RefreshCw, Search, Settings2, ShieldCheck,
    Sparkles, Store, Trash2, Users2,
} from "lucide-react";
import { StudioMark } from "./StudioShell";
import CreativeStudio from "@/components/features/studio/CreativeStudio";
import BatchStudio from "@/components/features/studio/BatchStudio";
import ProductList from "@/components/features/products/ProductList";
import { ProductForm } from "@/components/features/products/ProductForm";
import ApprovalsQueue from "@/components/features/products/ApprovalsQueue";
import { listProducts, type Product } from "@/lib/api/products";
import { deletePost, exportPost, listPosts, type Post } from "@/lib/api/posts";
import { getBrand, updateBrand, type BrandSettings, type BrandSettingsInput } from "@/lib/api/brand";
import { listTemplates, type Template } from "@/lib/api/templates";
import { logout } from "@/lib/api/auth";
import { getMe, updateProfile, changePassword, listCoworkers, type UserSummary } from "@/lib/api/users";
import { listSocialAccounts, connectSocialAccount, disconnectSocialAccount, type SocialAccount, type SocialPlatform } from "@/lib/api/social";

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
    const reload = useCallback(async () => {
        setLoading(true); setError(null);
        try { const [nextProducts, nextPosts] = await Promise.all([listProducts(), listPosts()]); setProducts(nextProducts); setPosts(nextPosts); }
        catch (err) { setError(err instanceof Error ? err.message : "Unable to load workspace data"); }
        finally { setLoading(false); }
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
    return <div className="studio-stat-grid"><div><span>PRODUCTS</span><strong>{products.length}</strong><small>{approved} approved</small></div><div><span>POSTS</span><strong>{posts.length}</strong><small>{ready} ready to ship</small></div><div><span>APPROVAL RATE</span><strong>{products.length ? `${Math.round(approved / products.length * 100)}%` : "—"}</strong><small>Current source material</small></div><div><span>LAST MOVEMENT</span><strong>{posts.length ? "LIVE" : "—"}</strong><small>{last}</small></div></div>;
}

function Overview({ products, posts, refresh }: { products: Product[]; posts: Post[]; refresh: () => void }) {
    const recent = posts.slice(0, 5);
    return <><Stats products={products} posts={posts} /><div className="studio-workspace-grid"><section className="studio-workspace-panel studio-workspace-panel--wide"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">LIVE BOARD</span><h2>Real workspace movement</h2></div><button className="studio-text-button" onClick={refresh}><RefreshCw size={14} /> Refresh</button></div>{recent.length ? <div className="studio-data-stack">{recent.map((post) => <Link className="studio-data-row" key={post.id} href="/dashboard/posts"><span className="studio-status-dot" /><div><strong>{post.productName}</strong><small>{post.status} · {post.format}</small></div><span className="studio-data-value">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "New"}</span><ChevronRight size={14} /></Link>)}</div> : <Notice title="Your live board is waiting." detail="Create a product, then open Studio to generate the first real post." action={<Link className="studio-button studio-button--dark" href="/dashboard/products"><Plus size={14} /> Add product</Link>} />}</section><section className="studio-workspace-panel studio-workspace-panel--accent"><span className="studio-kicker studio-kicker--dark">NEXT MOVE</span><h2>Turn one approved product into a full campaign.</h2><p>Use the real product and template APIs to generate, caption, approve, and export.</p><Link href="/dashboard/studio" className="studio-button studio-button--dark">Open studio <ArrowUpRight size={15} /></Link></section></div></>;
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

const SOCIAL_PLATFORMS: [SocialPlatform, string, typeof Instagram][] = [
    ["INSTAGRAM", "Instagram", Instagram],
    ["FACEBOOK", "Facebook", Facebook],
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

    useEffect(() => { listCoworkers().then(setCoworkers).catch((err) => setStatus(err instanceof Error ? err.message : "Unable to load coworkers")); }, []);

    return (
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
                <Notice title="It's just you so far." detail="Share your workspace's join code (Brand → Invite teammates) so others can land here instead of creating their own brand." />
            ) : (
                <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading team…</div>
            )}
        </section>
    );
}

function SettingsSurface() {
    return (
        <div className="grid gap-4">
            <ProfileSection />
            <PasswordSection />
            <LinkedAccountsSection />
            <CoworkersSection />
            <section className="studio-workspace-panel studio-workspace-panel--accent">
                <span className="studio-kicker studio-kicker--dark">SESSION</span>
                <h2>Done for now?</h2>
                <p>Signing out clears this session on this device — your workspace and everything in it stays exactly as you left it.</p>
                <SignOutButton variant="button" />
            </section>
        </div>
    );
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

function Unavailable({ label, reason }: { label: string; reason: string }) { return <Notice title={`${label} is ready for its backend route.`} detail={reason} action={<Link className="studio-button studio-button--dark" href="/contact">Talk to the team <ArrowUpRight size={14} /></Link>} />; }

function Surface({ mode, products, posts, refresh }: { mode: WorkspaceMode; products: Product[]; posts: Post[]; refresh: () => void }) {
    if (mode === "dashboard") return <Overview products={products} posts={posts} refresh={refresh} />;
    if (mode === "products") return <div className="studio-live-columns"><section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">SOURCE MATERIAL</span><h2>Products</h2></div><span className="studio-chip">{products.length} total</span></div><ProductList products={products} onProductDeleted={refresh} /></section><section className="studio-workspace-panel studio-workspace-panel--accent"><span className="studio-kicker studio-kicker--dark">NEW INPUT</span><h2>Add a product reference.</h2><p>Upload source material that powers approved creative directions.</p><ProductForm onCreated={refresh} /></section></div>;
    if (mode === "brand") return <BrandSurface />;
    if (mode === "studio") return <section className="studio-workspace-panel studio-workspace-panel--wide"><CreativeStudio products={products} onPostChange={refresh} /></section>;
    if (mode === "batch") return <section className="studio-workspace-panel studio-workspace-panel--wide"><BatchStudio products={products} onBatchChange={refresh} /></section>;
    if (mode === "posts") return <PostsSurface posts={posts} refresh={refresh} />;
    if (mode === "assets") return <AssetsSurface products={products} posts={posts} />;
    if (mode === "calendar") return <Unavailable label="Calendar" reason="No calendar controller exists in the current backend inventory, so schedules are not presented as persisted data." />;
    if (mode === "social") return <Unavailable label="Social" reason="Social accounts and publishing controllers are not exposed yet. This shell is ready for a connector-backed implementation." />;
    if (mode === "notifications") return <Unavailable label="Notifications" reason="Notifications are not exposed by the current backend. The page is ready for a persisted event feed." />;
    return <SettingsSurface />;
}

export function WorkspacePage({ mode }: { mode: WorkspaceMode }) {
    const [label, title, description, Icon] = workspaceData[mode];
    const { products, posts, brand, loading, error, reload } = useLiveWorkspace();
    return <main className="studio-app"><WorkspaceSidebar active={mode} brand={brand} /><div className="studio-workspace-main"><header className="studio-workspace-topbar"><div><span className="studio-kicker studio-kicker--dark">WORKSPACE / {label.toUpperCase()}</span><h1>{title}</h1><p>{description}</p></div><div className="studio-workspace-actions"><button className="studio-icon-button" aria-label="Search"><Search size={17} /></button><Link href="/dashboard/studio" className="studio-button studio-button--dark"><Plus size={15} /> New direction</Link></div></header><section className="studio-workspace-content"><div className="studio-command-row"><div className="studio-route-title"><Icon size={20} /><span>{label}</span></div><label className="studio-search"><Search size={15} /><input placeholder={`Search ${label.toLowerCase()}`} /></label></div>{error && <div className="studio-form-error"><strong>Live data unavailable.</strong> {error} <button onClick={() => void reload()}>Retry</button></div>}{loading ? <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading live workspace data…</div> : <Surface mode={mode} products={products} posts={posts} refresh={() => void reload()} />}</section></div></main>;
}

function AdminSurface({ mode, products, posts, templates }: { mode: AdminMode; products: Product[]; posts: Post[]; templates: Template[] }) {
    if (mode === "products") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">MODERATION QUEUE</span><h2>Pending products</h2></div><span className="studio-chip">ADMIN API</span></div><ApprovalsQueue /></section>;
    if (["content", "generations", "publishing"].includes(mode)) return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">LIVE RECORDS</span><h2>{mode === "publishing" ? "Publishing records" : mode === "generations" ? "Generation records" : "Content records"}</h2></div><span className="studio-chip">{posts.length} posts</span></div><div className="studio-data-stack">{posts.length ? posts.map((post) => <div className="studio-data-row" key={post.id}><span className="studio-status-dot" /><div><strong>{post.productName}</strong><small>{post.status} · {post.format}</small></div><span className="studio-data-value">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "New"}</span><ChevronRight size={14} /></div>) : <Notice title="No content records." detail="Generated posts will appear here once a workspace creates them." />}</div></section>;
    if (mode === "templates") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">TEMPLATE LIBRARY</span><h2>Reusable scaffolds</h2></div><span className="studio-chip">{templates.length} loaded</span></div><div className="studio-data-stack">{templates.length ? templates.map((template) => <div className="studio-data-row" key={template.id}><span className="studio-status-dot studio-status-dot--lime" /><div><strong>{template.name}</strong><small>{template.format}</small></div><span className="studio-data-value">{template.thumbnailUrl ? "Preview ready" : "No thumbnail"}</span><ChevronRight size={14} /></div>) : <Notice title="No templates returned." detail="Templates are loaded from `/api/templates`." />}</div></section>;
    if (mode === "dashboard" || mode === "analytics") return <section className="studio-workspace-panel"><div className="studio-panel-heading"><div><span className="studio-kicker studio-kicker--dark">BACKEND SIGNAL</span><h2>{mode === "analytics" ? "Observed workspace motion" : "System overview"}</h2></div></div><div className="studio-stat-grid studio-stat-grid--admin"><div><span>PRODUCTS</span><strong>{products.length}</strong><small>Admin-visible source material</small></div><div><span>POSTS</span><strong>{posts.length}</strong><small>Generated content records</small></div><div><span>TEMPLATES</span><strong>{templates.length}</strong><small>Live API response</small></div><div><span>API HEALTH</span><strong>LIVE</strong><small>Authenticated routes responding</small></div></div></section>;
    return <Unavailable label={adminData[mode][0]} reason={`The current backend has no ${adminData[mode][0].toLowerCase()} controller. This admin surface remains explicit until that API exists.`} />;
}

export function AdminPage({ mode }: { mode: AdminMode }) {
    const [label, title, Icon] = adminData[mode];
    const [products, setProducts] = useState<Product[]>([]); const [posts, setPosts] = useState<Post[]>([]); const [templates, setTemplates] = useState<Template[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
    const reload = useCallback(async () => { setLoading(true); setError(null); try { const [nextProducts, nextPosts, nextTemplates] = await Promise.all([listProducts(), listPosts(), listTemplates()]); setProducts(nextProducts); setPosts(nextPosts); setTemplates(nextTemplates); } catch (err) { setError(err instanceof Error ? err.message : "Unable to load admin data"); } finally { setLoading(false); } }, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch intentionally hydrates this admin surface.
    useEffect(() => { void reload(); }, [reload]);
    const adminNav: [AdminMode, string, typeof ShieldCheck][] = Object.entries(adminData).map(([key, value]) => [key as AdminMode, value[0], value[2] as typeof ShieldCheck]);
    return <main className="studio-app studio-admin"><aside className="studio-workspace-sidebar"><div className="studio-workspace-sidebar__brand"><StudioMark compact /><span>ADMIN / CONTROL ROOM</span></div><nav>{adminNav.map(([key, item, NavIcon]) => <Link key={key} href={`/admin/${key}`} className={mode === key ? "is-active" : ""}><NavIcon size={16} />{item}</Link>)}</nav><div className="studio-workspace-sidebar__bottom"><Link href="/dashboard"><LayoutDashboard size={15} />Workspace</Link><Link href="/">← Back to site</Link><SignOutButton /></div></aside><div className="studio-workspace-main"><header className="studio-workspace-topbar"><div><span className="studio-kicker studio-kicker--dark">CONTROL ROOM / {label.toUpperCase()}</span><h1>{title}</h1><p>Operations, governance, and the signals behind the creative system.</p></div><div className="studio-admin-status"><span className="studio-dot studio-dot--lime" /> Live backend</div></header><section className="studio-workspace-content"><div className="studio-command-row"><div className="studio-route-title"><Icon size={20} /><span>{label}</span></div><button className="studio-text-button" onClick={() => void reload()}><RefreshCw size={14} /> Refresh data</button></div>{error && <div className="studio-form-error"><strong>Admin data unavailable.</strong> {error}</div>}{loading ? <div className="studio-loading"><Loader2 className="studio-spin" size={18} /> Loading admin data…</div> : <AdminSurface mode={mode} products={products} posts={posts} templates={templates} />}</section></div></main>;
}
