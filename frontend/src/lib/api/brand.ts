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

/**
 * Stores an optional logo and persists its URL in the current Brand workspace
 * in one authenticated operation. This avoids a second client-side save racing
 * a completed multipart request.
 */
export const uploadBrandLogo = (file: File) => apiUpload<BrandSettings>("/api/brand/logo", file);
