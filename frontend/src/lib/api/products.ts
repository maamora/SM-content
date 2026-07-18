import { apiFetch } from "./client";

export interface Product {
    id: string;
    name: string;
    description: string;
    sellingPoint: string | null;
    price: number | null;
    imageUrl: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface ProductInput {
    name: string;
    description: string;
    sellingPoint?: string;
    price?: number;
    imageUrl?: string;
}

export const listProducts = () => apiFetch<Product[]>("/api/products");

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

export const rejectProduct = (id: string) =>
    apiFetch<Product>(`/api/products/${id}/reject`, { method: "POST" });
