"use client";

/* STUDIO editorial refresh: paper fields, uppercase metadata, sharp image slots, and lime actions. */

import { useForm, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Upload, PackagePlus, Loader2, X, Pencil } from "lucide-react";
import { createProduct, updateProduct, uploadProductImage, deleteProductImage, type Product } from "@/lib/api/products";
import { ProductSchema, ProductInput } from "@/schemas/product";

interface FormGroupProps {
    id: string;
    label: string;
    error?: FieldError;
    children: React.ReactNode;
    wide?: boolean;
}

function FormGroup({ id, label, error, children, wide }: FormGroupProps) {
    return (
        <div className={wide ? "studio-form-grid__wide" : undefined}>
            <label htmlFor={id}>
                {label}
            </label>
            {children}
            {error && (
                <p role="alert" id={`${id}-error`} className="studio-inline-notice text-[#944949]">
                    {error.message}
                </p>
            )}
        </div>
    );
}

const inputStyles = "w-full border border-[#bdbdb4] bg-[#faf9f4] px-3 py-2 text-sm text-[var(--studio-ink)] placeholder:text-[#91918b] outline-none transition-colors focus:border-[var(--studio-lime)] disabled:opacity-50";

const IMAGE_FIELDS = ["imageUrl", "imageUrl2", "imageUrl3"] as const;

interface ProductFormProps {
    /** Create mode (default): called after a new product is successfully added. */
    onCreated?: () => void;
    /** Edit mode: pass an existing product to switch the form to "update" behavior. */
    product?: Product;
    /** Edit mode: called with the updated product after a successful save. */
    onSaved?: (updated: Product) => void;
    /** Edit mode: called when the user cancels out of editing. */
    onCancel?: () => void;
}

export function ProductForm({ onCreated, product, onSaved, onCancel }: ProductFormProps) {
    const isEditMode = !!product;
    const [isPending, setIsPending] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const form = useForm<ProductInput>({
        resolver: zodResolver(ProductSchema),
        defaultValues: {
            name: product?.name ?? "",
            description: product?.description ?? "",
            sellingPoint: product?.sellingPoint ?? "",
            price: product?.price ?? undefined,
            imageUrl: product?.imageUrl ?? "",
            imageUrl2: product?.imageUrl2 ?? "",
            imageUrl3: product?.imageUrl3 ?? "",
        },
    });

    const onSubmit = async (data: ProductInput) => {
        setServerError(null);
        setIsPending(true);
        try {
            const payload = { ...data, price: data.price !== undefined ? Number(data.price) : undefined };
            if (isEditMode && product) {
                const updated = await updateProduct(product.id, payload);
                onSaved?.(updated);
            } else {
                await createProduct(payload);
                form.reset();
                onCreated?.();
            }
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Failed to save product");
        } finally {
            setIsPending(false);
        }
    };

    // Keeps the 3 slots gap-free: whichever photos actually exist always
    // occupy imageUrl, then imageUrl2, then imageUrl3, in order. Without this,
    // leaving slot 1 empty while slot 2 has a photo would mean the product's
    // "cover" image (imageUrl, used everywhere outside this form) is blank
    // even though a photo was uploaded.
    const compactImages = (urls: (string | undefined)[]) => {
        const nonEmpty = urls.filter((u): u is string => !!u);
        IMAGE_FIELDS.forEach((field, i) => {
            form.setValue(field, nonEmpty[i] ?? "", { shouldValidate: true });
        });
    };

    const handleImageSelected = (slot: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previousUrl = form.getValues(IMAGE_FIELDS[slot]);

        setUploadError(null);
        setUploadingSlot(slot);
        try {
            const { url } = await uploadProductImage(file);
            const current = IMAGE_FIELDS.map((f) => form.getValues(f));
            current[slot] = url;
            compactImages(current);

            // Replacing a photo: clean up the old Cloudinary asset now that
            // the new one is safely saved, so it doesn't linger unused.
            if (previousUrl && previousUrl !== url) {
                deleteProductImage(previousUrl).catch(() => { });
            }
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : "Failed to upload image");
        } finally {
            setUploadingSlot(null);
        }
    };

    const handleRemoveImage = (slot: number) => {
        const removedUrl = form.getValues(IMAGE_FIELDS[slot]);
        const current = IMAGE_FIELDS.map((f) => form.getValues(f));
        current[slot] = undefined;
        compactImages(current);

        if (removedUrl) {
            deleteProductImage(removedUrl).catch(() => { });
        }
    };

    return (
        <div className={`studio-product-form ${isEditMode ? "studio-product-form--edit" : ""}`}>
            {!isEditMode && (
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center border border-[var(--studio-lime)] bg-[rgba(185,255,67,.16)] text-[#5f762a]">
                        <PackagePlus className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-serif text-xl font-normal tracking-tight text-[var(--studio-ink)]">Nouveau Produit</h2>
                        <p className="text-[11px] text-[#777870]">Ajouté au catalogue partagé de l&apos;équipe</p>
                    </div>
                </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="studio-form-grid">
                <FormGroup id="product-name" label="Nom du produit" error={form.formState.errors.name}>
                    <input
                        id="product-name"
                        className={`${inputStyles} h-10`}
                        placeholder="ex. Argan Elixir Pur"
                        aria-invalid={!!form.formState.errors.name}
                        aria-describedby={form.formState.errors.name ? "product-name-error" : undefined}
                        {...form.register("name")}
                    />
                </FormGroup>

                <FormGroup id="product-desc" label="Description" error={form.formState.errors.description} wide>
                    <textarea
                        id="product-desc"
                        className={`${inputStyles} min-h-[96px] resize-y`}
                        placeholder="Décrivez le produit, ses ingrédients, son usage..."
                        aria-invalid={!!form.formState.errors.description}
                        aria-describedby={form.formState.errors.description ? "product-desc-error" : undefined}
                        {...form.register("description")}
                    />
                </FormGroup>

                <FormGroup id="product-selling-point" label="Argument clé (optionnel)" error={form.formState.errors.sellingPoint}>
                    <input
                        id="product-selling-point"
                        className={`${inputStyles} h-10`}
                        placeholder="ex. 100% naturel, pressé à froid"
                        {...form.register("sellingPoint")}
                    />
                </FormGroup>

                <FormGroup id="product-price" label="Prix (optionnel)" error={form.formState.errors.price}>
                    <input
                        id="product-price"
                        type="number"
                        step="0.01"
                        className={`${inputStyles} h-10`}
                        placeholder="0.00"
                        {...form.register("price")}
                    />
                </FormGroup>

                <div className="studio-form-grid__wide">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-[#6f7068]">Photos produit (max. 3)</span>
                    <div className="mt-2 grid grid-cols-3 gap-3">
                        {IMAGE_FIELDS.map((field, slot) => {
                            const value = form.watch(field);
                            const isUploading = uploadingSlot === slot;
                            return (
                                <div key={field} className="relative">
                                    {value ? (
                                        <div className="relative h-24 w-full overflow-hidden border border-[#bdbdb4] bg-[#e8e7df]">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={value} alt={`Photo ${slot + 1}`} className="h-full w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(slot)}
                                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center border border-[var(--studio-ink)] bg-[var(--studio-ink)] text-white transition-colors hover:bg-[#944949]"
                                                aria-label={`Retirer la photo ${slot + 1}`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor={`product-image-${slot}`}
                                            className={`flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-[#bdbdb4] transition-colors hover:border-[var(--studio-lime)] hover:bg-[rgba(185,255,67,.12)] ${isUploading ? "pointer-events-none opacity-60" : ""}`}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-[#5f762a]" />
                                            ) : (
                                                <Upload className="h-4 w-4 text-[#91918b]" />
                                            )}
                                            <span className="text-[9px] font-bold text-[#91918b]">{isUploading ? "Envoi..." : `Photo ${slot + 1}`}</span>
                                        </label>
                                    )}
                                    <input
                                        id={`product-image-${slot}`}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelected(slot)}
                                        disabled={isUploading}
                                        className="hidden"
                                    />
                                    <input type="hidden" {...form.register(field)} />
                                </div>
                            );
                        })}
                    </div>
                    {uploadError && <p className="studio-inline-notice text-[#944949]">{uploadError}</p>}
                </div>

                {serverError && (
                    <p role="alert" className="studio-form-error">
                        {serverError}
                    </p>
                )}

                <div className="studio-form-grid__wide flex gap-3">
                    {isEditMode && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="studio-button studio-button--paper flex-1"
                        >
                            Annuler
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isPending || uploadingSlot !== null}
                        className="studio-button studio-button--lime studio-button--large flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Synchronisation...
                            </>
                        ) : isEditMode ? (
                            <>
                                <Pencil className="h-4 w-4" />
                                Enregistrer
                            </>
                        ) : (
                            "Ajouter le produit"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
