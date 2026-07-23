import { apiFetch } from "./client";

export interface Product {
    id: string;
    name: string;
    description: string;
    sellingPoint: string | null;
    price: number | null;
    imageUrl: string | null;
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
