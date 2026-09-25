"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Pencil, Trash2, Loader2, PackageSearch, User as UserIcon } from "lucide-react";
import { RequireAuth } from "@/components/features/auth/RequireAuth";
import { ProductForm } from "@/components/features/products/ProductForm";
import { getProduct, deleteProduct, type Product } from "@/lib/api/products";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

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
    // Amazon-style hover zoom: while hovering the main image, it scales up
    // and pans to follow the cursor via transform-origin. isZooming also
    // pauses the auto-cycle below so the photo doesn't flip out from under
    // the cursor mid-zoom.
    const [isZooming, setIsZooming] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
    // Real width/height of each loaded photo, keyed by URL — lets the gallery
    // box size itself to the actual image instead of a fixed, cropped box.
    const [naturalSizes, setNaturalSizes] = useState<Record<string, { w: number; h: number }>>({});

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
    // Every member of the brand can edit or delete any of the brand's
    // products — the backend enforces the brand-membership scoping, so the
    // frontend doesn't need to gate this on ownership or platform admin.
    const canEdit = !!product;

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
        if (images.length < 2 || isZooming) return;
        const interval = setInterval(() => {
            setActiveImage((i) => (i + 1) % images.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [images.length, isZooming]);

    // Zoom factor for the side panel; the lens square is sized to exactly the
    // inverse fraction of the image (2.5x zoom -> the lens covers 40% of the
    // image width/height) so what's inside the lens is exactly what fills the
    // zoom panel.
    const ZOOM_FACTOR = 2.5;
    const LENS_SIZE_PCT = 100 / ZOOM_FACTOR;

    const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setZoomOrigin({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        });
    };

    // Clamp the lens so it never visually extends past the image's edges,
    // even when the cursor is right at a corner.
    const lensLeft = Math.min(Math.max(zoomOrigin.x - LENS_SIZE_PCT / 2, 0), 100 - LENS_SIZE_PCT);
    const lensTop = Math.min(Math.max(zoomOrigin.y - LENS_SIZE_PCT / 2, 0), 100 - LENS_SIZE_PCT);

    const activeNatural = images[activeImage] ? naturalSizes[images[activeImage]] : undefined;

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#11130f]">
                <Loader2 className="h-6 w-6 animate-spin text-[#f4f3ed]" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#11130f] px-4">
                <div className="h-10 w-10 border border-[#343832] bg-[#1a1c19] flex items-center justify-center text-[#9a9b91]">
                    <PackageSearch className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-[#f4f3ed]">Produit introuvable</p>
                <p className="text-xs text-[#9a9b91] max-w-xs text-center">{error ?? "Ce produit n'existe pas."}</p>
                <Link href="/dashboard/products" className="text-xs font-extrabold text-[#b9dd45] hover:underline mt-2">
                    &larr; Retour au catalogue
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#11130f] px-4 py-10">
            <div className="mx-auto max-w-4xl">
                <button
                    onClick={() => router.back()}
                    className="mb-6 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#9a9b91] hover:text-[#f4f3ed] transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour
                </button>

                {isEditing ? (
                    <div className="border border-[#343832] bg-[#1a1c19] shadow-[6px_6px_0_rgba(0,0,0,.35)] p-6">
                        <h1 className="text-2xl font-normal text-[#f4f3ed] mb-5" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Modifier le produit</h1>
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
                    <div className="border border-[#343832] bg-[#1a1c19] shadow-[8px_8px_0_rgba(0,0,0,.35)] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Gallery */}
                        <div className="relative">
                            <div
                                // No fixed height: the box's aspect-ratio follows the currently
                                // active photo's real dimensions (captured via onLoad below) so a
                                // tall or wide product photo gets its natural proportions instead
                                // of being force-cropped into a small static 320px band. Falls back
                                // to a 4:3 box and a sensible min-height until the image has loaded.
                                className={`relative w-full overflow-hidden bg-[#15170f] border border-[#b9dd45] ${images.length > 0 ? "cursor-zoom-in" : ""}`}
                                style={{
                                    aspectRatio: activeNatural ? `${activeNatural.w} / ${activeNatural.h}` : "4 / 3",
                                    minHeight: 280,
                                    maxHeight: 640,
                                }}
                                onMouseEnter={() => images.length > 0 && setIsZooming(true)}
                                onMouseLeave={() => setIsZooming(false)}
                                onMouseMove={images.length > 0 ? handleZoomMove : undefined}
                            >
                                {images.length > 0 ? (
                                    <>
                                        {images.map((img, i) => (
                                            <Image
                                                key={img}
                                                src={img}
                                                alt={`${product.name} ${i + 1}`}
                                                fill
                                                sizes="(max-width: 1024px) 100vw, 50vw"
                                                className={`object-contain transition-opacity duration-1000 ease-in-out ${i === activeImage ? "opacity-100" : "opacity-0"}`}
                                                quality={90}
                                                priority={i === 0}
                                                onLoad={(e) => {
                                                    const el = e.currentTarget;
                                                    setNaturalSizes((prev) => (prev[img] ? prev : { ...prev, [img]: { w: el.naturalWidth, h: el.naturalHeight } }));
                                                }}
                                            />
                                        ))}
                                        {/* Lens: the square patch of the image currently being magnified in the side panel. */}
                                        {isZooming && (
                                            <div
                                                className="pointer-events-none absolute border-2 border-[#22c55e] bg-[rgba(34,197,94,.25)]"
                                                style={{
                                                    left: `${lensLeft}%`,
                                                    top: `${lensTop}%`,
                                                    width: `${LENS_SIZE_PCT}%`,
                                                    height: `${LENS_SIZE_PCT}%`,
                                                }}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-[#9a9b91]">
                                        <span className="text-xs uppercase tracking-widest font-mono font-black">Pas d&apos;image</span>
                                    </div>
                                )}
                            </div>
                            {/* Zoom panel: sits beside the main image (not inside it), showing a magnified
                                view of whatever's under the lens. Hidden on small screens — there's no room
                                for a side panel next to a full-width stacked gallery. */}
                            {isZooming && images.length > 0 && (
                                <div
                                    className="pointer-events-none absolute left-full top-0 z-30 ml-4 hidden h-[420px] w-[420px] border border-[#343832] bg-[#15170f] shadow-[8px_8px_0_rgba(0,0,0,.45)] lg:block"
                                    style={{
                                        backgroundImage: `url(${images[activeImage]})`,
                                        backgroundSize: `${ZOOM_FACTOR * 100}% ${ZOOM_FACTOR * 100}%`,
                                        backgroundPosition: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                                        backgroundRepeat: "no-repeat",
                                    }}
                                />
                            )}
                            {images.length > 1 && (
                                <div className="mt-3 grid grid-cols-3 gap-3">
                                    {images.map((img, i) => (
                                        <button
                                            key={img}
                                            onClick={() => setActiveImage(i)}
                                            className={`relative h-20 border-2 border-[#b9dd45] overflow-hidden transition-all ${i === activeImage ? "opacity-100" : "opacity-70 hover:opacity-100"
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
                                    <h1 className="text-2xl font-normal text-[#f4f3ed] tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{product.name}</h1>
                                </div>
                                {canEdit && (
                                    <div className="flex shrink-0 items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            // Not .studio-button--dark: that class only gets its
                                            // dark-background styling from a themed ancestor
                                            // (.studio-app--press-bench etc.) that this standalone
                                            // page never has, so it fell back to a transparent
                                            // background with inherited (near-white) text — nearly
                                            // invisible on this page's own dark card. Explicit
                                            // classes here guarantee contrast regardless of theme.
                                            className="studio-button bg-[#f4f3ed] text-[#11130f] hover:bg-[#d7d6cf]"
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
                                <p className="text-2xl font-mono font-black text-[#b9dd45]">{product.price.toFixed(2)} MAD</p>
                            )}

                            {product.sellingPoint && (
                                <div className="border border-[#343832] bg-[rgba(185,221,69,.1)] px-4 py-2.5">
                                    <p className="text-xs font-bold text-[#f4f3ed]">{product.sellingPoint}</p>
                                </div>
                            )}

                            <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#9a9b91] block mb-1.5">Description</span>
                                <p className="text-sm text-[#d7d6cf] leading-relaxed whitespace-pre-wrap">{product.description}</p>
                            </div>

                            {product.createdByName && (
                                <div className="flex items-center gap-2 pt-4 border-t border-[#343832] text-xs text-[#9a9b91] font-bold">
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
