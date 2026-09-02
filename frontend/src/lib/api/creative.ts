import { apiFetch, apiUpload } from "./client";

export type CreativeJobType = "EDIT_IMAGE" | "PHOTO_SHOOT";
export type CreativeJobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface CreativeJob {
    id: string;
    type: string;
    status: CreativeJobStatus;
    prompt: string;
    aspectRatio: string | null;
    productImageUrl: string | null;
    modelImageUrl: string | null;
    resultImageUrl: string | null;
    resultVideoUrl: string | null;
    errorMessage: string | null;
    outputMode: "AI_GENERATED" | "TEMPLATE_COMPOSED" | null;
    recoveryMessage: string | null;
    createdAt: string;
    updatedAt: string;
}

export async function uploadCreativeReference(file: File): Promise<{ url: string }> {
    return apiUpload<{ url: string }>("/api/uploads/creative-reference", file);
}

export async function createCreativeJob(input: {
    type: CreativeJobType;
    prompt: string;
    aspectRatio: string;
    productImageUrl?: string;
    modelImageUrl?: string;
    generateVideo?: boolean;
}): Promise<CreativeJob> {
    return apiFetch<CreativeJob>("/api/creative/jobs", {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function getCreativeJob(id: string): Promise<CreativeJob> {
    return apiFetch<CreativeJob>(`/api/creative/jobs/${id}`);
}
