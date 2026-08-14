"use client";

/* STUDIO editorial refresh: confirmation is a sharp paper interruption with explicit destructive color. */
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
 * Branded replacement for window.confirm() with an editorial paper surface
 * instead of the plain OS dialog box.
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,10,.68)] px-4 backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="studio-dialog"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#c99b9b] bg-[#fff2f2] text-[#944949]">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex h-7 w-7 items-center justify-center border-0 bg-transparent text-[#91918b] transition-colors hover:bg-[#e9e8e0] hover:text-[var(--studio-ink)] disabled:opacity-50"
                        aria-label="Fermer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <h2 className="mt-3 font-serif text-2xl font-normal text-[var(--studio-ink)]">{title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#60625a]">{message}</p>

                <div className="mt-6 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="studio-button studio-button--paper h-9 px-4 text-xs disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="studio-button studio-button--danger h-9 px-4 text-xs disabled:opacity-50"
                    >
                        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
