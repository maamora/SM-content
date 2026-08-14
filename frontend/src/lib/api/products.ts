import { apiFetch, apiUpload } from "./client";

export interface Product {
    id: string;
    name: string;
    description: string;
    sellingPoint: string | null;
    price: number | null;
    imageUrl: string | null;
    imageUrl2: string | null;
    imageUrl3: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdByName: string | null;
    createdById: string | null;
}

export interface ProductInput {
    name: string;
    description: string;
    sellingPoint?: string;
    price?: number;
    imageUrl?: string;
    imageUrl2?: string;
    imageUrl3?: string;
}

export const listProducts = () => apiFetch<Product[]>("/api/products");

export const getProduct = (id: string) => apiFetch<Product>(`/api/products/${id}`);

export const createProduct = (input: ProductInput) =>
    apiFetch<Product>("/api/products", { method: "POST", body: JSON.stringify(input) });

export const updateProduct = (id: string, input: ProductInput) =>
    apiFetch<Product>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(input) });

export const deleteProduct = (id: string) =>
    apiFetch<void>(`/api/products/${id}`, { method: "DELETE" });

// Admin-only moderation queue: products awaiting approval before they can be
// used to generate content.
export const listPendingProducts = () => apiFetch<Product[]>("/api/products/pending");

export const approveProduct = (id: string) =>
    apiFetch<Product>(`/api/products/${id}/approve`, { method: "POST" });

// Rejecting deletes the product outright — it doesn't linger with a
// "rejected" tag, so there's nothing to return.
export const rejectProduct = (id: string) =>
    apiFetch<void>(`/api/products/${id}/reject`, { method: "POST" });

// Uploads a product photo to Cloudinary (via the backend) and returns its
// public URL, ready to save as a product's imageUrl.
export const uploadProductImage = (file: File) =>
    apiUpload<{ url: string }>("/api/uploads/image", file);

// Deletes a previously uploaded photo from Cloudinary — called when a slot in
// the product form is removed or replaced, so the old asset doesn't linger.
export const deleteProductImage = (url: string) =>
    apiFetch<void>(`/api/uploads/image?url=${encodeURIComponent(url)}`, { method: "DELETE" });
