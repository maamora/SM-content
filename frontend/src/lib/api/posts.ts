import { apiFetch, apiUpload } from "./client";

export interface Post {
    id: string;
    productId: string;
    templateId: string;
    format: string;
    imageUrl: string | null;
    captionEn: string | null;
    captionFr: string | null;
    captionAr: string | null;
    captionDarija: string | null;
    status: "DRAFT" | "APPROVED" | "EXPORTED";
    generationMode: "AI_GENERATED" | "TEMPLATE_COMPOSED" | "BROWSER_GENERATED";
    productName: string;
    createdAt: string | null;
}

export const listPosts = () => apiFetch<Post[]>("/api/posts");

export const deletePost = (id: string) =>
    apiFetch<void>(`/api/posts/${id}`, { method: "DELETE" });

export const generateImage = (input: {
    productId: string;
    templateId: string;
    badgeText?: string;
    promoText?: string;
    accentColor?: string;
    mood?: string;
    includeBrandLogo?: boolean;
    brandLogoPlacement?: "TOP_RIGHT" | "TOP_LEFT" | "BOTTOM_RIGHT" | "BOTTOM_LEFT";
}) => apiFetch<Post>("/api/posts/generate-image", { method: "POST", body: JSON.stringify(input) });

type UploadResponse = { url: string };

export const createBrowserVisualPost = async (input: {
    productId: string;
    templateId: string;
    image: Blob;
    badgeText?: string;
    promoText?: string;
}) => {
    const contentType = input.image.type.startsWith("image/") ? input.image.type : "image/png";
    const extension = contentType === "image/jpeg" ? "jpg" : contentType === "image/webp" ? "webp" : "png";
    const visualFile = new File([input.image], `studio-browser-visual.${extension}`, { type: contentType });
    const upload = await apiUpload<UploadResponse>("/api/uploads/creative-output", visualFile);

    return apiFetch<Post>("/api/posts/from-browser-visual", {
        method: "POST",
        body: JSON.stringify({
            productId: input.productId,
            templateId: input.templateId,
            imageUrl: upload.url,
            badgeText: input.badgeText,
            promoText: input.promoText,
        }),
    });
};

export const generateCaptions = (postId: string, languages: string[] = ["fr", "ar", "darija", "en"]) =>
    apiFetch<Post>("/api/posts/generate-captions", {
        method: "POST",
        body: JSON.stringify({ postId, languages }),
    });

export const editCaption = (postId: string, language: "fr" | "ar" | "darija" | "en", text: string) =>
    apiFetch<Post>(`/api/posts/${postId}/caption`, {
        method: "PATCH",
        body: JSON.stringify({ language, text }),
    });

export const approvePost = (postId: string) =>
    apiFetch<Post>(`/api/posts/${postId}/approve`, { method: "POST" });

export const exportPost = (postId: string) =>
    apiFetch<Blob>(`/api/posts/${postId}/export`, { method: "GET" });
