import { apiFetch, apiUpload } from "./client";

export interface BrandSettings {
    id: string;
    name: string;
    configured: boolean;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    fontFamily: string | null;
    toneGuidelines: string | null;
}

export type BrandSettingsInput = Omit<BrandSettings, "id" | "configured">;

export const getBrand = () => apiFetch<BrandSettings>("/api/brand");
export const updateBrand = (input: BrandSettingsInput) => apiFetch<BrandSettings>("/api/brand", {
    method: "PUT",
    body: JSON.stringify(input),
});

type UploadResponse = { url: string };

/** Stores a Brand-page logo through the existing authenticated image-upload route. */
export const uploadBrandLogo = async (file: File) => {
    const upload = await apiUpload<UploadResponse>("/api/uploads/brand-logo", file);
    return upload.url;
};
