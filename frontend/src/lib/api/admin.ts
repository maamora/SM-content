import { apiFetch } from './client';

export interface AdminSummary {
    users: number;
    workspaces: number;
    products: number;
    posts: number;
    templates: number;
    pendingProducts: number;
}

export const getAdminSummary = () => apiFetch<AdminSummary>('/api/admin/summary');
