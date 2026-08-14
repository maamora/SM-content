"use client";

/* STUDIO editorial refresh: recent work is an indexed paper archive with restrained actions. */
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
    DRAFT: "studio-chip",
    APPROVED: "studio-chip studio-chip--lime",
    EXPORTED: "studio-chip studio-chip--warning",
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
        <div className="mt-4 space-y-3 border-t border-[#deddd5] pt-4">
            {error && <p className="studio-form-error">{error}</p>}
            {LANGUAGES.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#91918b]">{label}</span>
                    <div className="flex gap-2">
                        <textarea
                            value={values[key]}
                            onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                            rows={2}
                            className="min-w-0 flex-1 resize-none border border-[#bdbdb4] bg-[#faf9f4] px-3 py-2 text-xs text-[var(--studio-ink)] outline-none focus:border-[var(--studio-lime)]"
                        />
                        <button
                            type="button"
                            onClick={() => handleSave(key)}
                            disabled={savingLang === key}
                            className="studio-button studio-button--dark h-9 w-9 shrink-0 px-0 disabled:opacity-50"
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
        <div className="studio-workspace-panel">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-2xl font-normal text-[var(--studio-ink)]">
                <Clock className="h-5 w-5 text-[#5f762a]" />
                Posts récents
            </h3>

            {deleteError && (
                <p className="studio-form-error mb-3">{deleteError}</p>
            )}

            <div className="studio-recent-post-grid items-start">
                {recent.map((post) => (
                    <div key={post.id} className="studio-recent-post-card">
                        <div className="studio-recent-post-card__media">
                            <span className={`absolute right-2 top-2 z-10 ${STATUS_STYLES[post.status]}`}>
                                {STATUS_LABELS[post.status]}
                            </span>
                            {post.imageUrl ? (
                                <Image src={post.imageUrl} alt={post.productName} fill sizes="240px" className="object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-[#91918b]">
                                    <ImageOff className="h-6 w-6" />
                                </div>
                            )}
                        </div>
                        <div className="studio-recent-post-card__body">
                            <p className="truncate text-xs font-extrabold text-[var(--studio-ink)]" title={post.productName}>
                                {post.productName}
                            </p>
                            <div className="mt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingId(editingId === post.id ? null : post.id)}
                                    className="studio-button studio-button--dark h-8 flex-1 px-2 text-[10px]"
                                >
                                    <Pencil className="h-3 w-3" />
                                    Modifier
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmTarget(post)}
                                    disabled={deletingId === post.id}
                                    className="studio-button studio-button--danger h-8 w-8 shrink-0 px-0 disabled:opacity-50"
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
