"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Pencil, Trash2, Loader2, PackageSearch, User as UserIcon } from "lucide-react";
import { RequireAuth } from "@/components/features/auth/RequireAuth";
import { ProductForm } from "@/components/features/products/ProductForm";
import { getProduct, deleteProduct, type Product } from "@/lib/api/products";
import { getUserId, isAdmin } from "@/lib/api/client";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// Same status chip classes as ProductList.tsx's card grid, so a product
// looks the same whether you're scanning the grid or looking at one in
// detail — this page used to carry its own amber/emerald/red palette left
// over from before the STUDIO redesign, which is why it looked visually
// disconnected from the rest of the app (lime + ink everywhere else).
const STATUS_STYLES: Record<Product["status"], string> = {
    PENDING: "studio-chip studio-chip--warning",
    APPROVED: "studio-chip studio-chip--lime",
    REJECTED: "studio-chip studio-chip--danger",
};

const STATUS_LABELS: Record<Product["status"], string> = {
    PENDING: "En attente d'approbation",
    APPROVED: "Approuvé",
    REJECTED: "Rejeté",
};

function ProductDetailInner() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const refetch = useCallback(() => {
        setLoading(true);
        setError(null);
        getProduct(params.id)
            .then(setProduct)
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load product"))
            .finally(() => setLoading(false));
    }, [params.id]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial product fetch on mount
        refetch();
    }, [refetch]);

    const images = product ? [product.imageUrl, product.imageUrl2, product.imageUrl3].filter((u): u is string => !!u) : [];
    const canEdit = !!product && (isAdmin() || product.createdById === getUserId());

    const handleDelete = async () => {
        if (!product) return;
        setDeleteError(null);
        setIsDeleting(true);
        try {
            await deleteProduct(product.id);
            router.push("/dashboard/products");
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Échec de la suppression du produit");
            setIsDeleting(false);
            setConfirmOpen(false);
        }
    };

    // Auto-cycle through multiple photos: fade the current one out while the
    // next fades in, looping continuously. Restarts from image 0 whenever the
    // set of images changes (e.g. after an edit).
    useEffect(() => {
        if (images.length < 2) return;
        const interval = setInterval(() => {
            setActiveImage((i) => (i + 1) % images.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [images.length]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--studio-paper)]">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--studio-ink)]" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--studio-paper)] px-4">
                <div className="h-10 w-10 border border-[#c5c4bb] bg-[#e8e7df] flex items-center justify-center text-[#777870]">
                    <PackageSearch className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-[var(--studio-ink)]">Produit introuvable</p>
                <p className="text-xs text-[#70716a] max-w-xs text-center">{error ?? "Ce produit n'existe pas ou n'est pas encore approuvé."}</p>
                <Link href="/dashboard/products" className="text-xs font-extrabold text-[#5f762a] hover:underline mt-2">
                    &larr; Retour au catalogue
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--studio-paper)] px-4 py-10">
            <div className="mx-auto max-w-4xl">
                <button
                    onClick={() => router.back()}
                    className="mb-6 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#70716a] hover:text-[var(--studio-ink)] transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour
                </button>

                {isEditing ? (
                    <div className="border border-[#c5c4bb] bg-[#f8f7f1] shadow-[6px_6px_0_rgba(17,17,15,.12)] p-6">
                        <h1 className="text-2xl font-normal text-[var(--studio-ink)] mb-5" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Modifier le produit</h1>
                        <ProductForm
                            product={product}
                            onSaved={(updated) => {
                                setProduct(updated);
                                setIsEditing(false);
                            }}
                            onCancel={() => setIsEditing(false)}
                        />
                    </div>
                ) : (
                    <div className="border border-[#c5c4bb] bg-[#f8f7f1] shadow-[8px_8px_0_rgba(17,17,15,.12)] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Gallery */}
                        <div>
                            <div className="relative h-80 w-full overflow-hidden bg-[#e8e7df] border border-[#c5c4bb]">
                                {images.length > 0 ? (
                                    images.map((img, i) => (
                                        <Image
                                            key={img}
                                            src={img}
                                            alt={`${product.name} ${i + 1}`}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                            className={`object-cover transition-opacity duration-1000 ease-in-out ${i === activeImage ? "opacity-100" : "opacity-0"}`}
                                            quality={90}
                                            priority={i === 0}
                                        />
                                    ))
                                ) : (
                                    <div className="flex h-full items-center justify-center text-[#777870]">
                                        <span className="text-xs uppercase tracking-widest font-mono font-black">Pas d&apos;image</span>
                                    </div>
                                )}
                            </div>
                            {images.length > 1 && (
                                <div className="mt-3 grid grid-cols-3 gap-3">
                                    {images.map((img, i) => (
                                        <button
                                            key={img}
                                            onClick={() => setActiveImage(i)}
                                            className={`relative h-20 border overflow-hidden transition-all ${i === activeImage ? "border-[var(--studio-lime)]" : "border-[#c5c4bb] opacity-70 hover:opacity-100"
                                                }`}
                                        >
                                            <Image src={img} alt={`${product.name} ${i + 1}`} fill sizes="120px" className="object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="space-y-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className={`inline-block mb-2 ${STATUS_STYLES[product.status]}`}>
                                        {STATUS_LABELS[product.status]}
                                    </span>
                                    <h1 className="text-2xl font-normal text-[var(--studio-ink)] tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{product.name}</h1>
                                </div>
                                {canEdit && (
                                    <div className="flex shrink-0 items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            className="studio-button studio-button--dark"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Éditer
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setConfirmOpen(true)}
                                            disabled={isDeleting}
                                            className="studio-button studio-button--danger disabled:opacity-50"
                                        >
                                            {isDeleting ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                            Supprimer
                                        </button>
                                    </div>
                                )}
                            </div>

                            {deleteError && (
                                <p className="studio-form-error">{deleteError}</p>
                            )}

                            {product.price != null && (
                                <p className="text-2xl font-mono font-black text-[#5f762a]">{product.price.toFixed(2)} MAD</p>
                            )}

                            {product.sellingPoint && (
                                <div className="border border-[#c5c4bb] bg-[rgba(185,255,67,.12)] px-4 py-2.5">
                                    <p className="text-xs font-bold text-[var(--studio-ink)]">{product.sellingPoint}</p>
                                </div>
                            )}

                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#777870] block mb-1.5">Description</span>
                                <p className="text-sm text-[#4f504a] leading-relaxed whitespace-pre-wrap">{product.description}</p>
                            </div>

                            {product.createdByName && (
                                <div className="flex items-center gap-2 pt-4 border-t border-[#deddd5] text-xs text-[#8a8b83] font-bold">
                                    <UserIcon className="h-3.5 w-3.5" />
                                    Soumis par {product.createdByName}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title="Supprimer ce produit ?"
                message={`Supprimer définitivement "${product.name}" ? Cette action est irréversible.`}
                loading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </div>
    );
}

export default function ProductDetailPage() {
    return (
        <RequireAuth>
            <ProductDetailInner />
        </RequireAuth>
    );
}
