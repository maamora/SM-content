/* STUDIO editorial refresh: sharp paper surfaces, graphite type, and lime status accents. */
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
    PENDING: "studio-chip studio-chip--warning",
    APPROVED: "studio-chip studio-chip--lime",
    REJECTED: "studio-chip studio-chip--danger",
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
            <div className="studio-product-empty">
                <div>
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center border border-[#b7b6ad] bg-[#e8e7df] text-[#777870]">
                        <PackageSearch className="h-5 w-5" />
                    </div>
                    <p>Aucun produit enregistré</p>
                    <small>Ajoutez un produit depuis le panneau de gauche pour l&apos;afficher ici.</small>
                </div>
            </div>
        );
    }

    return (
        <>
            {deleteError && (
                <div className="studio-form-error mb-4">
                    {deleteError}
                </div>
            )}
            <div className="studio-product-grid">
                {products.map((product) => (
                <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="studio-product-card group"
                >
                    <div className="studio-product-card__media">
                        <span className={`absolute right-3 top-3 z-10 ${STATUS_STYLES[product.status]}`}>
                            {STATUS_LABELS[product.status]}
                        </span>
                        {(isAdmin() || product.createdById === getUserId()) && (
                            <button
                                type="button"
                                onClick={(e) => requestDelete(e, product)}
                                disabled={deletingId === product.id}
                                aria-label={`Supprimer ${product.name}`}
                                className="studio-product-card__delete"
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
                            <div className="flex h-full flex-col items-center justify-center bg-[#dfded6] text-[#777870]">
                                <span className="text-[10px] font-mono font-black uppercase tracking-widest">Pas d&apos;image</span>
                            </div>
                        )}
                    </div>

                    <div className="studio-product-card__body">
                        <h3 title={product.name}>
                            {product.name}
                        </h3>
                        {product.price ? (
                            <p className="studio-product-card__price">{product.price.toFixed(2)} MAD</p>
                        ) : (
                            <p className="studio-product-card__price text-[#91918b]">Prix non défini</p>
                        )}
                        {product.status === "PENDING" && product.createdByName && (
                            <p className="studio-product-card__meta">
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
