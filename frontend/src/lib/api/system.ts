import { apiFetch } from './client';

export interface SystemCapabilities {
    captionGeneration: boolean;
    imageGeneration: boolean;
    cloudStorage: boolean;
    localStorage: boolean;
    socialPublishing: boolean;
    emailDelivery: boolean;
    creativeEditing: boolean;
    photoShootGeneration: boolean;
    videoGeneration: boolean;
    smtpEmail: boolean;
    metaOAuth: boolean;
    tiktokOAuth: boolean;
    linkedinOAuth: boolean;
    xOAuth: boolean;
}

export const getSystemCapabilities = () => apiFetch<SystemCapabilities>('/api/system/capabilities');
