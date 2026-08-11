import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PackageSearch, Trash2, Loader2 } from "lucide-react";
import { deleteProduct, type Product } from "@/lib/api/products";
import { getUserId, isAdmin } from "@/lib/api/client";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface ProductListProps {
    products: Product[];
    /** Called after a successful delete so the parent can refetch the list. */
    onProductDeleted?: () => void;
}

const STATUS_STYLES: Record<Product["status"], string> = {
    PENDING: "bg-amber-50 text-amber-700 border-2 border-amber-500",
    APPROVED: "bg-emerald-50 text-emerald-700 border-2 border-emerald-600",
    REJECTED: "bg-red-50 text-red-700 border-2 border-red-500",
};

const STATUS_LABELS: Record<Product["status"], string> = {
    PENDING: "En attente",
    APPROVED: "Approuvé",
    REJECTED: "Rejeté",
};

export default function ProductList({ products, onProductDeleted }: ProductListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<Product | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const requestDelete = (e: React.MouseEvent, product: Product) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteError(null);
        setConfirmTarget(product);
    };

    const confirmDelete = async () => {
        if (!confirmTarget) return;
        const product = confirmTarget;
        setDeletingId(product.id);
        try {
            await deleteProduct(product.id);
            setConfirmTarget(null);
            onProductDeleted?.();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Échec de la suppression du produit");
        } finally {
            setDeletingId(null);
        }
    };

    if (products.length === 0) {
        return (
            <div className="flex h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white">
                <div className="h-10 w-10 rounded-xl bg-stone-100 border-2 border-stone-300 flex items-center justify-center text-stone-400">
                    <PackageSearch className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-stone-800">Aucun produit enregistré</p>
                <p className="text-xs text-stone-400 mt-0.5 max-w-xs text-center">
                    Ajoutez un produit depuis le panneau de gauche pour l&apos;afficher ici.
                </p>
            </div>
        );
    }

    return (
        <>
            {deleteError && (
                <div className="mb-4 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700">
                    {deleteError}
                </div>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="group relative block overflow-hidden rounded-2xl border-3 border-stone-900 bg-white shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(28,25,23,1)]"
                >
                    <div className="relative h-44 w-full bg-stone-100 border-b-3 border-stone-900 overflow-hidden">
                        <span className={`absolute top-2 right-2 z-10 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${STATUS_STYLES[product.status]}`}>
                            {STATUS_LABELS[product.status]}
                        </span>
                        {(isAdmin() || product.createdById === getUserId()) && (
                            <button
                                type="button"
                                onClick={(e) => requestDelete(e, product)}
                                disabled={deletingId === product.id}
                                aria-label={`Supprimer ${product.name}`}
                                className="absolute top-2 left-2 z-10 h-7 w-7 rounded-lg bg-white/90 backdrop-blur-sm border-2 border-stone-900 text-red-600 flex items-center justify-center hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                                {deletingId === product.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                )}
                            </button>
                        )}
                        {product.imageUrl ? (
                            <Image
                                src={product.imageUrl}
                                alt={`Image of ${product.name}`}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                                quality={85}
                            />
                        ) : (
                            <div className="flex flex-col h-full items-center justify-center text-stone-400 bg-gradient-to-br from-stone-100 to-stone-200">
                                <span className="text-[10px] uppercase tracking-widest font-mono font-black">Pas d&apos;image</span>
                            </div>
                        )}
                    </div>

                    <div className="p-4 font-sans">
                        <h3 className="truncate text-sm font-extrabold tracking-tight text-stone-900" title={product.name}>
                            {product.name}
                        </h3>
                        {product.price ? (
                            <p className="mt-1 text-xs font-mono font-black text-[#F47315]">{product.price.toFixed(2)} MAD</p>
                        ) : (
                            <p className="mt-1 text-xs text-stone-400 font-semibold">Prix non défini</p>
                        )}
                        {product.status === "PENDING" && product.createdByName && (
                            <p className="mt-2 text-[10px] text-amber-600 font-bold border-t border-stone-100 pt-2">
                                Soumis par {product.createdByName}
                            </p>
                        )}
                    </div>
                </Link>
                ))}
            </div>

            <ConfirmDialog
                open={!!confirmTarget}
                title="Supprimer ce produit ?"
                message={confirmTarget ? `Supprimer définitivement "${confirmTarget.name}" ? Cette action est irréversible.` : ""}
                loading={!!confirmTarget && deletingId === confirmTarget.id}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmTarget(null)}
            />
        </>
    );
}
