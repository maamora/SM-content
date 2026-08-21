import { apiFetch } from "./client";

export interface BrandSettings {
    id: string;
    name: string;
    // Server-generated at brand creation, not editable — share it with a
    // teammate so they can join this same workspace at registration instead
    // of creating their own separate brand.
    joinCode: string | null;
    // "BUSINESS" (default) or "PERSONAL" — set once at registration, not
    // editable here. Use this to soften "brand kit" language for a personal
    // profile if needed.
    accountType: "BUSINESS" | "PERSONAL";
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    fontFamily: string | null;
    toneGuidelines: string | null;
}

export type BrandSettingsInput = Omit<BrandSettings, "id" | "joinCode" | "accountType">;

export const getBrand = () => apiFetch<BrandSettings>("/api/brand");
export const updateBrand = (input: BrandSettingsInput) => apiFetch<BrandSettings>("/api/brand", {
    method: "PUT",
    body: JSON.stringify(input),
});
