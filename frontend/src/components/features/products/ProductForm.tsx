"use client";

import { useForm, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { createProduct } from "@/lib/api/products";
import { ProductSchema, ProductInput } from "@/schemas/product";

interface FormGroupProps {
    id: string;
    label: string;
    error?: FieldError;
    children: React.ReactNode;
}

function FormGroup({ id, label, error, children }: FormGroupProps) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                {label}
            </label>
            {children}
            {error && (
                <p role="alert" id={`${id}-error`} className="text-xs text-red-500 font-medium">
                    {error.message}
                </p>
            )}
        </div>
    );
}

const inputStyles = "flex w-full rounded-md border border-zinc-900 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-orange-500 focus-visible:outline-none transition-colors disabled:opacity-50";

interface ProductFormProps {
    onCreated?: () => void;
}

export function ProductForm({ onCreated }: ProductFormProps) {
    const [isPending, setIsPending] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const form = useForm<ProductInput>({
        resolver: zodResolver(ProductSchema),
        defaultValues: {
            name: "",
            description: "",
            sellingPoint: "",
            price: undefined,
            imageUrl: "",
        },
    });

    const onSubmit = async (data: ProductInput) => {
        setServerError(null);
        setIsPending(true);
        try {
            await createProduct({
                ...data,
                price: data.price !== undefined ? Number(data.price) : undefined,
            });
            form.reset();
            onCreated?.();
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Failed to create product");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="max-w-xl p-8 bg-zinc-900/10 border border-zinc-900 rounded-xl shadow-sm">
            <div className="mb-6 space-y-1">
                <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Index Product</h2>
                <p className="text-xs text-zinc-500">Provide details to register the item inside this workspace catalogue.</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormGroup id="product-name" label="Product Name" error={form.formState.errors.name}>
                    <input
                        id="product-name"
                        className={`${inputStyles} h-9`}
                        placeholder="e.g. Classic Running Shoes"
                        aria-invalid={!!form.formState.errors.name}
                        aria-describedby={form.formState.errors.name ? "product-name-error" : undefined}
                        {...form.register("name")}
                    />
                </FormGroup>

                <FormGroup id="product-desc" label="Description" error={form.formState.errors.description}>
                    <textarea
                        id="product-desc"
                        className={`${inputStyles} min-h-[100px] resize-y`}
                        placeholder="Provide details, selling points, or marketing description..."
                        aria-invalid={!!form.formState.errors.description}
                        aria-describedby={form.formState.errors.description ? "product-desc-error" : undefined}
                        {...form.register("description")}
                    />
                </FormGroup>

                <FormGroup id="product-selling-point" label="Key selling point (optional)" error={form.formState.errors.sellingPoint}>
                    <input
                        id="product-selling-point"
                        className={`${inputStyles} h-9`}
                        placeholder="e.g. Waterproof, 32h battery life"
                        {...form.register("sellingPoint")}
                    />
                </FormGroup>

                <div className="grid grid-cols-2 gap-4">
                    <FormGroup id="product-price" label="Price (Optional)" error={form.formState.errors.price}>
                        <input
                            id="product-price"
                            type="number"
                            step="0.01"
                            className={`${inputStyles} h-9`}
                            placeholder="0.00"
                            {...form.register("price")}
                        />
                    </FormGroup>

                    <FormGroup id="product-image" label="Image URL" error={form.formState.errors.imageUrl}>
                        <input
                            id="product-image"
                            type="url"
                            className={`${inputStyles} h-9`}
                            placeholder="https://..."
                            {...form.register("imageUrl")}
                        />
                    </FormGroup>
                </div>

                {serverError && (
                    <p role="alert" className="text-xs text-red-500 font-medium">
                        {serverError}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center justify-center rounded-md text-xs font-semibold h-9 px-6 w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_1px_5px_rgba(234,88,12,0.3)]"
                >
                    {isPending ? "Syncing Catalogue..." : "Register Product"}
                </button>
            </form>
        </div>
    );
}
