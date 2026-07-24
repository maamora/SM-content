import { Product, ImageTemplate } from "../types";

export const PRODUCT_PRESETS: Product[] = [
  {
    id: "prod-argan",
    name: "Argan Elixir Pur",
    price: "180",
    sellingPoint: "Hand-pressed in the Atlas mountains, 100% cold-extracted organic serum.",
    photo: "argan-bottle", // we render a custom 3D CSS bottle in the UI
    description: "Our signature pure Argan oil, ethically sourced from Moroccan cooperatives. Rich in Vitamin E and antioxidants, it provides an exquisite treatment for hair, face, and body.",
    category: "oil",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-honey",
    name: "Miel d'Euphorbe Rare",
    price: "260",
    sellingPoint: "Authentic spicy Daghmous honey from Souss, rare natural medicinal properties.",
    photo: "honey-jar", // 3D CSS honey jar
    description: "Premium Daghmous (Euphorbia) honey, harvested by traditional beekeepers in Souss-Massa. Known for its distinct warm tingling sensation and outstanding wellness benefits.",
    category: "honey",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-rose",
    name: "Sérum de Rose Suprême",
    price: "195",
    sellingPoint: "Concentrated hydration & skin-firming using damask roses from Kelaat M'gouna.",
    photo: "rose-serum", // 3D CSS rose serum dropper
    description: "An ultra-nourishing facial serum infused with the pure extract of thousands of fresh-picked damask roses. Revitalizes skin texture for a natural glowing Moroccan radiance.",
    category: "cosmetics",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-savon",
    name: "Savon Noir Premium",
    price: "85",
    sellingPoint: "Authentic hammam experience with rich eucalyptus oils & Atlas clay.",
    photo: "savon-jar", // 3D CSS soap tub
    description: "A luxury traditional black soap crafted with cold-pressed olive oils, enriched with crushed eucalyptus leaves and organic Argan oil. Essential for detoxifying body exfoliations.",
    category: "wellness",
    createdAt: new Date().toISOString()
  },
  {
    id: "prod-figue",
    name: "Huile de Figue de Barbarie",
    price: "490",
    sellingPoint: "The ultimate youth elixir. Pure organic prickly pear seed oil.",
    photo: "figue-dropper", // 3D CSS expensive prickly pear seed oil
    description: "Often called 'liquid gold', it takes nearly 1 ton of prickly pear fruit seeds to extract a single liter. Incredibly rich in Vitamin K, it is the world's most effective natural anti-aging serum.",
    category: "oil",
    createdAt: new Date().toISOString()
  }
];

export const IMAGE_TEMPLATES: ImageTemplate[] = [
  {
    id: "temp-sunset",
    name: "Maamora Sunset",
    bgGradient: "from-[#FFFDF9] via-[#FFF3E8] to-[#FFE5D3]",
    textColor: "text-stone-900",
    accentColor: "bg-[#F47315]",
    priceBadgeBg: "bg-[#F47315]",
    priceBadgeText: "text-white",
    overlayStyle: "sand-dust"
  },
  {
    id: "temp-moss",
    name: "Atlas Moss",
    bgGradient: "from-[#FBFDFB] via-[#EAF2ED] to-[#D4E6DC]",
    textColor: "text-stone-900",
    accentColor: "bg-[#2D5A41]",
    priceBadgeBg: "bg-[#2D5A41]",
    priceBadgeText: "text-[#F5FBF7]",
    overlayStyle: "organic-leaf"
  },
  {
    id: "temp-ochre",
    name: "Ochre Medina",
    bgGradient: "from-[#FAF6F0] via-[#F6ECE2] to-[#EBD5C2]",
    textColor: "text-stone-900",
    accentColor: "bg-[#9A3412]",
    priceBadgeBg: "bg-[#9A3412]",
    priceBadgeText: "text-[#FAF6F0]",
    overlayStyle: "medina-arch"
  },
  {
    id: "temp-mint",
    name: "Royal Mint",
    bgGradient: "from-[#F7FCFA] via-[#ECF7F3] to-[#D1EDE3]",
    textColor: "text-stone-900",
    accentColor: "bg-[#1B5E4F]",
    priceBadgeBg: "bg-[#1B5E4F]",
    priceBadgeText: "text-[#ECF7F3]",
    overlayStyle: "tea-steam"
  },
  {
    id: "temp-terracotta-dark",
    name: "Majorelle Eclipse",
    bgGradient: "from-[#0F172A] via-[#1E1B4B] to-[#311042]",
    textColor: "text-amber-50",
    accentColor: "bg-[#3B82F6]",
    priceBadgeBg: "bg-[#F59E0B]",
    priceBadgeText: "text-[#0F172A]",
    overlayStyle: "cosmic-glow"
  }
];
