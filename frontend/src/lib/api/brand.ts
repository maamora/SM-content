import { apiFetch } from "./client";

export interface BrandSettings {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    fontFamily: string | null;
    toneGuidelines: string | null;
}

export type BrandSettingsInput = Omit<BrandSettings, "id">;

export const getBrand = () => apiFetch<BrandSettings>("/api/brand");
export const updateBrand = (input: BrandSettingsInput) => apiFetch<BrandSettings>("/api/brand", {
    method: "PUT",
    body: JSON.stringify(input),
});
