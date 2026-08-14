"use client";

/* STUDIO editorial refresh: moderation reads as a quiet live board with lime decisions. */
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { listPendingProducts, approveProduct, rejectProduct, type Product } from "@/lib/api/products";
import { Check, X, ShieldCheck, Loader2 } from "lucide-react";

interface ApprovalsQueueProps {
    onChange?: () => void;
}

export default function ApprovalsQueue({ onChange }: ApprovalsQueueProps) {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const refetch = useCallback(() => {
        setLoading(true);
        listPendingProducts()
            .then(setProducts)
            .catch((err) => setErrorMsg(err instanceof Error ? err.message : "Failed to load pending products"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- initial pending-products fetch on mount
        refetch();
    }, [refetch]);

    const handleApprove = async (id: string) => {
        setBusyId(id);
        try {
            await approveProduct(id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
            onChange?.();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to approve product");
        } finally {
            setBusyId(null);
        }
    };

    const handleReject = async (id: string) => {
        setBusyId(id);
        try {
            await rejectProduct(id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
            onChange?.();
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Failed to reject product");
        } finally {
            setBusyId(null);
        }
    };

    if (loading) {
        return <div className="studio-loading"><Loader2 className="studio-spin" size={16} /> Chargement des produits en attente...</div>;
    }

    if (errorMsg) {
        return <p className="studio-form-error">{errorMsg}</p>;
    }

    if (products.length === 0) {
        return (
            <div className="studio-product-empty">
                <div>
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center border border-[#8aa65a] bg-[rgba(185,255,67,.14)] text-[#5f762a]">
                    <ShieldCheck className="h-5 w-5" />
                    </div>
                    <p>Rien à examiner</p>
                    <small>Les nouveaux produits soumis par l&apos;équipe apparaîtront ici avant de pouvoir être utilisés dans l&apos;Atelier.</small>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {products.map((product) => (
                <div
                    key={product.id}
                    onClick={() => router.push(`/products/${product.id}`)}
                    className="studio-data-row studio-approval-row"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="studio-approval-thumb shrink-0">
                            {product.imageUrl ? (
                                <Image src={product.imageUrl} alt={product.name} fill sizes="56px" className="object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-[8px] font-black uppercase text-[#91918b]">N/A</div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-[var(--studio-ink)]">{product.name}</p>
                            <p className="mt-0.5 line-clamp-1 text-xs font-medium text-[#777870]">{product.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                                {product.price != null && (
                                    <p className="text-xs font-mono font-black text-[#5f762a]">{product.price.toFixed(2)} MAD</p>
                                )}
                                {product.createdByName && (
                                    <p className="text-[10px] font-bold text-[#91918b]">Soumis par {product.createdByName}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReject(product.id);
                            }}
                            disabled={busyId === product.id}
                            className="studio-button studio-button--paper h-9 px-3 text-xs disabled:opacity-50"
                        >
                            {busyId === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                            Rejeter
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(product.id);
                            }}
                            disabled={busyId === product.id}
                            className="studio-button studio-button--lime h-9 px-4 text-xs disabled:opacity-50"
                        >
                            {busyId === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Approuver
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
