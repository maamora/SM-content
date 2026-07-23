import { apiFetch } from "./client";

export interface Post {
    id: string;
    productId: string;
    templateId: string;
    format: string;
    imageUrl: string | null;
    captionFr: string | null;
    captionAr: string | null;
    captionDarija: string | null;
    status: "DRAFT" | "APPROVED" | "EXPORTED";
}

export const generateImage = (input: {
    productId: string;
    templateId: string;
    badgeText?: string;
    promoText?: string;
    accentColor?: string;
}) => apiFetch<Post>("/api/posts/generate-image", { method: "POST", body: JSON.stringify(input) });

export const generateCaptions = (postId: string, languages: string[] = ["fr", "ar", "darija"]) =>
    apiFetch<Post>("/api/posts/generate-captions", {
        method: "POST",
        body: JSON.stringify({ postId, languages }),
    });

export const editCaption = (postId: string, language: "fr" | "ar" | "darija", text: string) =>
    apiFetch<Post>(`/api/posts/${postId}/caption`, {
        method: "PATCH",
        body: JSON.stringify({ language, text }),
    });

export const approvePost = (postId: string) =>
    apiFetch<Post>(`/api/posts/${postId}/approve`, { method: "POST" });

export const exportPost = (postId: string) =>
    apiFetch<Blob>(`/api/posts/${postId}/export`, { method: "GET" });
