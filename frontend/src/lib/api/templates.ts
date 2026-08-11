import { apiFetch } from "./client";

export interface Template {
    id: string;
    name: string;
    format: "SQUARE_POST" | "STORY" | "WHATSAPP_STATUS";
    thumbnailUrl: string | null;
}

export const listTemplates = () => apiFetch<Template[]>("/api/templates");
