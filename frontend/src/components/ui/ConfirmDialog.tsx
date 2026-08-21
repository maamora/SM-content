"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Branded replacement for window.confirm() — same neobrutalist look as the
 * rest of the app (black border, offset drop shadow) instead of the plain OS
 * dialog box.
 */
export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "Supprimer",
    cancelLabel = "Annuler",
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm px-4"
            onClick={onCancel}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl border-3 border-stone-900 bg-white shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] p-6"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-red-50 border-2 border-red-500 flex items-center justify-center text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors disabled:opacity-50"
                        aria-label="Fermer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <h2 className="mt-3 text-base font-black text-stone-900 font-serif">{title}</h2>
                <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">{message}</p>

                <div className="mt-6 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="h-9 px-4 rounded-xl border-2 border-stone-900 bg-white text-stone-700 text-xs font-extrabold hover:bg-stone-50 transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50 border-b-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] transition-all"
                    >
                        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
