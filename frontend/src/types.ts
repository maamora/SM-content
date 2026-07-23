export type ProductCategory = 'cosmetics' | 'honey' | 'wellness' | 'oil' | 'other';
export type PostFormat = 'square' | 'story' | 'whatsapp';
export type UserRole = 'social_media_manager' | 'admin' | 'visitor';

export interface Product {
  id: string;
  name: string;
  price: string;
  sellingPoint: string;
  photo: string; // URL, Base64, or Preset Image ID
  description?: string;
  category: ProductCategory;
  createdAt: string;
}

export interface SocialMediaPost {
  id: string;
  productId: string;
  productName: string;
  productPhoto: string;
  productPrice: string;
  format: PostFormat;
  templateId: string;
  captionArabic: string;
  captionFrench: string;
  captionDarija: string;
  status: 'pending' | 'approved' | 'rejected';
  adminFeedback?: string;
  createdAt: string;
  approvedAt?: string;
  batchId?: string; // For tracing batch generations
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

export interface ImageTemplate {
  id: string;
  name: string;
  bgGradient: string;
  textColor: string;
  accentColor: string;
  priceBadgeBg: string;
  priceBadgeText: string;
  overlayStyle?: string;
}
