"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil, Trash2, Loader2, Save, ImageOff, Clock } from "lucide-react";
import { deletePost, editCaption, type Post } from "@/lib/api/posts";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface RecentPostsProps {
    posts: Post[];
    onChange?: () => void;
}

const STATUS_STYLES: Record<Post["status"], string> = {
    DRAFT: "bg-stone-100 text-stone-600 border-2 border-stone-300",
    APPROVED: "bg-emerald-50 text-emerald-700 border-2 border-emerald-600",
    EXPORTED: "bg-orange-50 text-[#F47315] border-2 border-[#F47315]",
};

const STATUS_LABELS: Record<Post["status"], string> = {
    DRAFT: "Brouillon",
    APPROVED: "Approuvé",
    EXPORTED: "Exporté",
};

const LANGUAGES: { key: "fr" | "ar" | "darija" | "en"; label: string; field: keyof Post }[] = [
    { key: "fr", label: "Français", field: "captionFr" },
    { key: "ar", label: "Arabe", field: "captionAr" },
    { key: "darija", label: "Darija", field: "captionDarija" },
    { key: "en", label: "Anglais", field: "captionEn" },
];

function CaptionEditor({ post, onSaved }: { post: Post; onSaved: () => void }) {
    const [values, setValues] = useState({
        fr: post.captionFr ?? "",
        ar: post.captionAr ?? "",
        darija: post.captionDarija ?? "",
        en: post.captionEn ?? "",
    });
    const [savingLang, setSavingLang] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (lang: "fr" | "ar" | "darija" | "en") => {
        setSavingLang(lang);
        setError(null);
        try {
            await editCaption(post.id, lang, values[lang]);
            onSaved();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Échec de l'enregistrement");
        } finally {
            setSavingLang(null);
        }
    };

    return (
        <div className="mt-4 space-y-3 border-t-2 border-stone-100 pt-4">
            {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
            {LANGUAGES.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">{label}</span>
                    <div className="flex gap-2">
                        <textarea
                            value={values[key]}
                            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                            rows={2}
                            className="flex-1 text-xs rounded-xl border-2 border-stone-900 bg-white px-3 py-2 text-stone-800 outline-none focus-visible:ring-2 focus-visible:ring-[#F47315] resize-none"
                        />
                        <button
                            type="button"
                            onClick={() => handleSave(key)}
                            disabled={savingLang === key}
                            className="shrink-0 h-9 w-9 rounded-xl bg-stone-900 text-white flex items-center justify-center hover:bg-stone-800 transition-colors disabled:opacity-50"
                            aria-label={`Enregistrer la légende ${label}`}
                        >
                            {savingLang === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function RecentPosts({ posts, onChange }: RecentPostsProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<Post | null>(null);

    const recent = [...posts]
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .slice(0, 8);

    const confirmDelete = async () => {
        if (!confirmTarget) return;
        const post = confirmTarget;
        setDeleteError(null);
        setDeletingId(post.id);
        try {
            await deletePost(post.id);
            setConfirmTarget(null);
            onChange?.();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Échec de la suppression du post");
        } finally {
            setDeletingId(null);
        }
    };

    if (recent.length === 0) {
        return null;
    }

    return (
        <div className="bg-white border-3 border-stone-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(28,25,23,1)]">
            <h3 className="font-extrabold text-stone-800 text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#F47315]" />
                Posts récents
            </h3>

            {deleteError && (
                <p className="text-xs text-red-600 font-bold mb-3">{deleteError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                {recent.map((post) => (
                    <div key={post.id} className="rounded-2xl border-2 border-stone-900 overflow-hidden bg-white">
                        <div className="relative h-32 w-full bg-stone-100">
                            <span className={`absolute top-2 right-2 z-10 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_STYLES[post.status]}`}>
                                {STATUS_LABELS[post.status]}
                            </span>
                            {post.imageUrl ? (
                                <Image src={post.imageUrl} alt={post.productName} fill sizes="240px" className="object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-stone-300">
                                    <ImageOff className="h-6 w-6" />
                                </div>
                            )}
                        </div>
                        <div className="p-3">
                            <p className="text-xs font-extrabold text-stone-900 truncate" title={post.productName}>
                                {post.productName}
                            </p>
                            <div className="mt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingId(editingId === post.id ? null : post.id)}
                                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg text-[10px] font-extrabold h-8 px-2 bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                                >
                                    <Pencil className="h-3 w-3" />
                                    Modifier
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmTarget(post)}
                                    disabled={deletingId === post.id}
                                    className="shrink-0 inline-flex items-center justify-center rounded-lg h-8 w-8 border-2 border-red-500 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                    aria-label="Supprimer"
                                >
                                    {deletingId === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </button>
                            </div>

                            {editingId === post.id && (
                                <CaptionEditor post={post} onSaved={() => onChange?.()} />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                open={!!confirmTarget}
                title="Supprimer ce post ?"
                message="Supprimer définitivement ce post ? Cette action est irréversible."
                loading={!!confirmTarget && deletingId === confirmTarget.id}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmTarget(null)}
            />
        </div>
    );
}
