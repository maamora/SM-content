"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Pencil, Loader2, PackageSearch, User as UserIcon } from "lucide-react";
import { RequireAuth } from "@/components/features/auth/RequireAuth";
import { ProductForm } from "@/components/features/products/ProductForm";
import { getProduct, type Product } from "@/lib/api/products";
import { getUserId, isAdmin } from "@/lib/api/client";

const STATUS_STYLES: Record<Product["status"], string> = {
    PENDING: "bg-amber-50 text-amber-700 border-2 border-amber-500",
    APPROVED: "bg-emerald-50 text-emerald-700 border-2 border-emerald-600",
    REJECTED: "bg-red-50 text-red-700 border-2 border-red-500",
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
            <div className="flex min-h-screen items-center justify-center bg-[#FDFBF7]">
                <Loader2 className="h-6 w-6 animate-spin text-[#F47315]" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#FDFBF7] px-4">
                <div className="h-10 w-10 rounded-xl bg-stone-100 border-2 border-stone-300 flex items-center justify-center text-stone-400">
                    <PackageSearch className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-stone-800">Produit introuvable</p>
                <p className="text-xs text-stone-400 max-w-xs text-center">{error ?? "Ce produit n'existe pas ou n'est pas encore approuvé."}</p>
                <Link href="/?tab=products" className="text-xs text-[#F47315] font-extrabold hover:underline mt-2">
                    &larr; Retour au catalogue
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] px-4 py-10">
            <div className="mx-auto max-w-4xl">
                <button
                    onClick={() => router.push("/?tab=products")}
                    className="mb-6 inline-flex items-center gap-1.5 text-xs font-extrabold text-stone-500 hover:text-stone-900 transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour au catalogue
                </button>

                {isEditing ? (
                    <div className="bg-white border-3 border-stone-900 rounded-3xl shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] p-6">
                        <h1 className="text-lg font-black text-[#F47315] font-serif mb-5">Modifier le produit</h1>
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
                    <div className="bg-white border-3 border-stone-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Gallery */}
                        <div>
                            <div className="relative h-80 w-full rounded-2xl overflow-hidden bg-stone-100 border-2 border-stone-900">
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
                                    <div className="flex h-full items-center justify-center text-stone-400">
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
                                            className={`relative h-20 rounded-xl border-2 overflow-hidden transition-all ${i === activeImage ? "border-[#F47315]" : "border-stone-900 opacity-70 hover:opacity-100"
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
                                    <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg mb-2 ${STATUS_STYLES[product.status]}`}>
                                        {STATUS_LABELS[product.status]}
                                    </span>
                                    <h1 className="text-2xl font-black text-stone-900 font-serif tracking-tight">{product.name}</h1>
                                </div>
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl text-xs font-extrabold h-9 px-4 bg-stone-900 text-white border-2 border-stone-900 shadow-[3px_3px_0px_0px_rgba(244,115,21,1)] hover:bg-stone-800 transition-colors"
                                    >
                                        <Pencil className="h-3.5 w-3.5 text-white" />
                                        <span className="text-white">Éditer</span>
                                    </button>
                                )}
                            </div>

                            {product.price != null && (
                                <p className="text-2xl font-mono font-black text-[#F47315]">{product.price.toFixed(2)} MAD</p>
                            )}

                            {product.sellingPoint && (
                                <div className="rounded-xl border-2 border-stone-900 bg-orange-50 px-4 py-2.5">
                                    <p className="text-xs font-bold text-stone-800">{product.sellingPoint}</p>
                                </div>
                            )}

                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block mb-1.5">Description</span>
                                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                            </div>

                            {product.createdByName && (
                                <div className="flex items-center gap-2 pt-4 border-t border-stone-200 text-xs text-stone-400 font-bold">
                                    <UserIcon className="h-3.5 w-3.5" />
                                    Soumis par {product.createdByName}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
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
