import { apiFetch } from './client';

export interface SystemCapabilities {
    captionGeneration: boolean;
    imageGeneration: boolean;
    cloudStorage: boolean;
    localStorage: boolean;
    socialPublishing: boolean;
    emailDelivery: boolean;
}

export const getSystemCapabilities = () => apiFetch<SystemCapabilities>('/api/system/capabilities');
