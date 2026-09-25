"use client";
/* BATCH DELIVERY / CONTACT SHEET: turns a set of approved posts into a multi-channel publish run.
   Distinct from the Assets "depth carousel" — this is a flat, filmstrip-style contact sheet built for
   fast multi-select, with a floating dock that turns the current selection into queued publish jobs.
   Browsing and selecting posts never requires a linked account — only queuing the actual publish does,
   at which point we point the user straight at Settings → Linked accounts instead of blocking the page. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Layers, Link2, Loader2, Search, Send, Sparkles, X } from "lucide-react";
import type { Post } from "@/lib/api/posts";
import {
    listSocialConnections,
    queueSocialPublish,
    type SocialConnection,
    type SocialProvider,
} from "@/lib/api/social";

const PROVIDER_LABEL: Record<SocialProvider, string> = {
    META: "Meta / Instagram + Facebook",
    TIKTOK: "TikTok",
    LINKEDIN: "LinkedIn",
    X: "X",
};

// The Settings "Linked accounts" tab is the older manual-handle system
// (just a text field, no real OAuth or publishing). The Social page is
// where a channel is actually connected via OAuth and becomes usable here.
const LINK_ACCOUNTS_HREF = "/dashboard/social";

function formatLabel(format: string) {
    return format === "STORY" ? "Story" : "Post";
}

export default function BatchPublishStudio({ posts }: { posts: Post[] }) {
    const [connections, setConnections] = useState<SocialConnection[]>([]);
    const [loadingConnections, setLoadingConnections] = useState(true);
    const [query, setQuery] = useState("");
    const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
    const [selectedConnectionIds, setSelectedConnectionIds] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<string | null>(null);
    const [queueing, setQueueing] = useState(false);

    const reload = async () => {
        setLoadingConnections(true);
        try {
            const next = await listSocialConnections();
            setConnections(next);
        } catch (err) {
            setStatus(err instanceof Error ? err.message : "Unable to load connected channels");
        } finally {
            setLoadingConnections(false);
        }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch intentionally hydrates this client surface.
    useEffect(() => { void reload(); }, []);

    const activeConnections = useMemo(() => connections.filter((connection) => connection.status === "ACTIVE"), [connections]);
    const hasLinkedAccount = loadingConnections || activeConnections.length > 0;
    const approvedPosts = useMemo(() => posts.filter((post) => post.status === "APPROVED"), [posts]);
    const visiblePosts = useMemo(
        () => approvedPosts.filter((post) => post.productName.toLowerCase().includes(query.trim().toLowerCase())),
        [approvedPosts, query],
    );

    useEffect(() => {
        // Drop selections for posts that scrolled out of the current filter/approval set.
        setSelectedPostIds((current) => {
            const stillValid = new Set([...current].filter((id) => approvedPosts.some((post) => post.id === id)));
            return stillValid.size === current.size ? current : stillValid;
        });
    }, [approvedPosts]);

    const togglePost = (id: string) => {
        setSelectedPostIds((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    const toggleConnection = (id: string) => {
        setSelectedConnectionIds((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    const clearSelection = () => { setSelectedPostIds(new Set()); setSelectedConnectionIds(new Set()); };

    const queueBatch = async () => {
        if (!selectedPostIds.size || !selectedConnectionIds.size) return;
        setQueueing(true); setStatus(null);
        const pairs: Array<{ postId: string; connectionId: string }> = [];
        selectedPostIds.forEach((postId) => selectedConnectionIds.forEach((connectionId) => pairs.push({ postId, connectionId })));
        let sent = 0; let failed = 0;
        for (const pair of pairs) {
            try {
                await queueSocialPublish(pair);
                sent += 1;
            } catch {
                failed += 1;
            }
        }
        setStatus(failed ? `${sent} job${sent === 1 ? "" : "s"} queued, ${failed} failed to queue.` : `${sent} publish job${sent === 1 ? "" : "s"} queued.`);
        setQueueing(false);
        clearSelection();
    };

    const selectionCount = selectedPostIds.size * (selectedConnectionIds.size || 1);

    return (
        <div className="space-y-4 pb-24">
            <div className="studio-batch-intro">
                <div>
                    <span className="studio-kicker">BATCH COMPOSITOR</span>
                    <h2><Layers size={21} /> Build one family of directions.</h2>
                    <p>Select approved posts, pick the channels, and send them out together — stories and regular posts can go out in the same run.</p>
                </div>
                <div className="studio-batch-intro__counter"><b>{selectedPostIds.size}</b><span>SELECTED<br />POSTS</span></div>
            </div>

            <section className="studio-workspace-panel studio-workspace-panel--wide">
                <div className="studio-panel-heading">
                    <div><span className="studio-kicker studio-kicker--dark">CONTACT SHEET</span><h2>Choose which posts go out.</h2></div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#787c72]" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search by product…"
                                className="w-44 rounded-full border border-white/12 bg-black/25 py-1.5 pl-8 pr-7 text-xs text-[#e9ebe0] transition-colors placeholder:text-[#6f716a] outline-none focus:outline-none focus-visible:outline-none focus:border-[#c6ff5e]/70 sm:w-56"
                            />
                            {query && (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onClick={() => setQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#787c72] hover:text-[#c6ff5e]"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <span className="studio-chip">{loadingConnections ? "…" : `${activeConnections.length} linked channel${activeConnections.length === 1 ? "" : "s"}`}</span>
                    </div>
                </div>

                {!approvedPosts.length ? (
                    <p className="studio-inline-notice mt-4">No approved posts yet — approve a few in the Composer or Posts tab first.</p>
                ) : !visiblePosts.length ? (
                    <p className="studio-inline-notice mt-4">No approved posts match &quot;{query}&quot;.</p>
                ) : (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {visiblePosts.map((post) => {
                            const selected = selectedPostIds.has(post.id);
                            return (
                                <button
                                    type="button"
                                    key={post.id}
                                    onClick={() => togglePost(post.id)}
                                    aria-pressed={selected}
                                    className={`group relative overflow-hidden rounded-md border text-left transition-all duration-150 ${selected ? "border-[#c6ff5e] shadow-[0_0_0_2px_rgba(198,255,94,0.35)]" : "border-white/10 hover:border-white/30"}`}
                                    style={{ aspectRatio: post.format === "STORY" ? "9 / 16" : "1 / 1" }}
                                >
                                    {post.imageUrl ? (
                                        <img src={post.imageUrl} alt={post.productName} className={`h-full w-full object-cover transition-transform duration-200 ${selected ? "scale-[1.03]" : "group-hover:scale-105"}`} />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-[#181a14] text-[#4d5045]"><Sparkles size={20} /></div>
                                    )}
                                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-1.5">
                                        <span className="rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#e9ebe0]">{formatLabel(post.format)}</span>
                                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${selected ? "border-[#c6ff5e] bg-[#c6ff5e] text-[#11110F]" : "border-white/40 bg-black/40 text-transparent"}`}>
                                            <Check size={12} strokeWidth={3} />
                                        </span>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-2.5 pb-2.5 pt-6">
                                        <strong className="block truncate text-sm font-bold leading-tight text-white">{post.productName}</strong>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="studio-workspace-panel studio-workspace-panel--wide">
                <div className="studio-panel-heading">
                    <div><span className="studio-kicker studio-kicker--dark">DELIVER TO</span><h2>Choose the channels for this run.</h2></div>
                    {hasLinkedAccount && <span className="studio-chip">{selectedConnectionIds.size} selected</span>}
                </div>
                {loadingConnections ? (
                    <p className="studio-panel-caption mt-3">Checking your linked accounts…</p>
                ) : activeConnections.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {activeConnections.map((connection) => {
                            const active = selectedConnectionIds.has(connection.id);
                            return (
                                <button
                                    type="button"
                                    key={connection.id}
                                    onClick={() => toggleConnection(connection.id)}
                                    aria-pressed={active}
                                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "border-[#c6ff5e] bg-[#c6ff5e]/15 text-[#c6ff5e]" : "border-white/15 text-[#c8cabe] hover:border-white/35"}`}
                                >
                                    <span className={`h-2 w-2 rounded-full ${active ? "bg-[#c6ff5e]" : "bg-[#5a5d54]"}`} />
                                    {PROVIDER_LABEL[connection.provider]}{connection.accountName ? ` · ${connection.accountName}` : ""}
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded border border-white/10 bg-black/20 px-3 py-2.5">
                        <p className="text-xs text-[#c8cabe]">No account is linked yet — connect one to send this batch out.</p>
                        <Link href={LINK_ACCOUNTS_HREF} className="studio-button studio-button--dark shrink-0">
                            <Link2 size={13} /> Link accounts
                        </Link>
                    </div>
                )}
                {status && <p className="studio-inline-notice mt-3" role="status">{status}</p>}
            </section>

            {(selectedPostIds.size > 0 || selectedConnectionIds.size > 0) && (
                <div className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-xl items-center justify-between gap-4 rounded-full border border-white/15 bg-[#14150f]/95 px-5 py-3 shadow-2xl backdrop-blur">
                    <div className="text-xs text-[#c8cabe]">
                        <strong className="text-[#e9ebe0]">{selectedPostIds.size}</strong> post{selectedPostIds.size === 1 ? "" : "s"} × <strong className="text-[#e9ebe0]">{selectedConnectionIds.size}</strong> channel{selectedConnectionIds.size === 1 ? "" : "s"}
                        {selectionCount > 0 && selectedConnectionIds.size > 0 && <span className="text-[#787c72]"> — {selectionCount} job{selectionCount === 1 ? "" : "s"}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" className="text-[10px] uppercase tracking-wide text-[#9c9f94] hover:text-[#e9ebe0]" onClick={clearSelection}>Clear</button>
                        {!hasLinkedAccount ? (
                            <Link href={LINK_ACCOUNTS_HREF} className="studio-button studio-button--dark">
                                <Link2 size={14} /> Link accounts to publish
                            </Link>
                        ) : (
                            <button
                                type="button"
                                className="studio-button studio-button--dark"
                                disabled={queueing || !selectedPostIds.size || !selectedConnectionIds.size}
                                onClick={() => void queueBatch()}
                            >
                                {queueing ? <Loader2 className="studio-spin" size={14} /> : <Send size={14} />} Queue batch
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
