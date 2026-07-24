"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { listPendingProducts, approveProduct, rejectProduct, type Product } from "@/lib/api/products";
import { Check, X, ShieldCheck, Loader2 } from "lucide-react";

interface ApprovalsQueueProps {
    onChange?: () => void;
}

export default function ApprovalsQueue({ onChange }: ApprovalsQueueProps) {
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
        return <p className="text-xs text-stone-400 font-bold">Chargement des produits en attente...</p>;
    }

    if (errorMsg) {
        return <p className="text-xs text-red-600 font-bold">{errorMsg}</p>;
    }

    if (products.length === 0) {
        return (
            <div className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-stone-800">Rien à examiner</p>
                <p className="text-xs text-stone-400 max-w-xs text-center font-medium">
                    Les nouveaux produits soumis par l&apos;équipe apparaîtront ici avant de pouvoir être utilisés dans l&apos;Atelier.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {products.map((product) => (
                <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl border-3 border-stone-900 bg-white shadow-[4px_4px_0px_0px_rgba(28,25,23,1)]"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border-2 border-stone-900 bg-stone-100">
                            {product.imageUrl ? (
                                <Image src={product.imageUrl} alt={product.name} fill sizes="56px" className="object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-[8px] font-black text-stone-400 uppercase">N/A</div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-extrabold text-stone-900 truncate">{product.name}</p>
                            <p className="text-xs text-stone-400 mt-0.5 line-clamp-1 font-medium">{product.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                                {product.price != null && (
                                    <p className="text-xs font-mono font-black text-[#F47315]">{product.price.toFixed(2)} MAD</p>
                                )}
                                {product.createdByName && (
                                    <p className="text-[10px] text-stone-400 font-bold">Soumis par {product.createdByName}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => handleReject(product.id)}
                            disabled={busyId === product.id}
                            className="h-9 px-3 rounded-xl border-2 border-stone-900 bg-white text-stone-500 text-xs font-extrabold hover:bg-red-50 hover:text-red-600 hover:border-red-500 flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                        >
                            {busyId === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                            Rejeter
                        </button>
                        <button
                            onClick={() => handleApprove(product.id)}
                            disabled={busyId === product.id}
                            className="h-9 px-4 rounded-xl bg-[#F47315] hover:bg-[#ff852e] text-white text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50 border-b-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] transition-all"
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
