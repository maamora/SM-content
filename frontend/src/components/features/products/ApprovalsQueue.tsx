"use client";

import { useCallback, useEffect, useState } from "react";
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
        return <p className="text-xs text-zinc-500">Loading pending products...</p>;
    }

    if (errorMsg) {
        return <p className="text-xs text-red-400">{errorMsg}</p>;
    }

    if (products.length === 0) {
        return (
            <div className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-900 bg-zinc-900/5">
                <ShieldCheck className="h-6 w-6 text-zinc-600" />
                <p className="text-sm text-zinc-400 font-medium">Nothing waiting on review</p>
                <p className="text-xs text-zinc-500 max-w-xs text-center">
                    New products submitted by any team member will show up here before they can be used in the Content Studio.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {products.map((product) => (
                <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 p-4 rounded-xl border border-zinc-900 bg-zinc-950/20"
                >
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-200 truncate">{product.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{product.description}</p>
                        {product.price != null && (
                            <p className="text-xs font-mono text-orange-400 mt-1">${product.price.toFixed(2)}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => handleReject(product.id)}
                            disabled={busyId === product.id}
                            className="h-8 px-3 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-400 text-xs font-semibold hover:bg-zinc-800 hover:text-red-400 flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {busyId === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                            Reject
                        </button>
                        <button
                            onClick={() => handleApprove(product.id)}
                            disabled={busyId === product.id}
                            className="h-8 px-3 rounded-md bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {busyId === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Approve
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
