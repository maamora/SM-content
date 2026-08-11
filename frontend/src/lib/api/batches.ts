import { apiFetch } from "./client";
import { type Post } from "./posts";

export interface BatchJob {
    id: string;
    brandId: string;
    status: "PROCESSING" | "DONE" | "FAILED";
    posts: Post[];
}

export const createBatch = (input: {
    productIds: string[];
    templateId: string;
}) => apiFetch<BatchJob>("/api/batches", { method: "POST", body: JSON.stringify(input) });

export const getBatch = (id: string) => apiFetch<BatchJob>(`/api/batches/${id}`);

export const exportBatch = (id: string) => apiFetch<Blob>(`/api/batches/${id}/export`, { method: "GET" });
