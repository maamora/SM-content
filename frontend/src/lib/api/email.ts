import { apiFetch } from "./client";

export interface EmailDelivery {
    id: string;
    toAddress: string;
    subject: string;
    status: "QUEUED" | "PROCESSING" | "SENT" | "FAILED";
    errorMessage: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    sentAt: string | null;
}

export const queueEmailDelivery = (input: {
    toAddress: string;
    subject: string;
    body: string;
    postId?: string;
}) => apiFetch<EmailDelivery>("/api/email/send", { method: "POST", body: JSON.stringify(input) });

export const listEmailDeliveries = () => apiFetch<EmailDelivery[]>("/api/email/deliveries");
