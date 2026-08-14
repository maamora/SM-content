/* STUDIO Editorial Creative OS: product mockups are tactile specimens with paper labels and a lime signal. */
import React from "react";
import { motion } from "motion/react";

interface Product3DModelProps {
  /** One of the preset keys or a real image URL/base64 string. */
  type: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isFloating?: boolean;
}

const PRESET_KEYS = ["argan-bottle", "honey-jar", "rose-serum", "savon-jar", "figue-dropper"];
const PRESET_DETAILS = {
  "argan-bottle": { title: "Argan", subtitle: "Elixir Pur", note: "50ml", shape: "bottle", tone: "#697d42" },
  "honey-jar": { title: "Miel Pur", subtitle: "Daghmous Rare", note: "100% bio", shape: "jar", tone: "#b9ff43" },
  "rose-serum": { title: "Rose", subtitle: "Sérum Suprême", note: "30ml", shape: "serum", tone: "#d6b8b1" },
  "savon-jar": { title: "Savon Noir", subtitle: "Eucalyptus & Argan", note: "Soin purifiant", shape: "dark-jar", tone: "#b9ff43" },
  "figue-dropper": { title: "Figue de Barbarie", subtitle: "Huile de Pépins", note: "L'élixir", shape: "dropper", tone: "#80936a" },
} as const;

export const Product3DModel: React.FC<Product3DModelProps> = ({ type, size = "md", className = "", isFloating = true }) => {
  const sizeClasses = { sm: "w-24 h-32", md: "w-36 h-48", lg: "w-48 h-64", xl: "w-64 h-80" };
  const isCustomImage = !PRESET_KEYS.includes(type);
  const preset = PRESET_DETAILS[type as keyof typeof PRESET_DETAILS] ?? PRESET_DETAILS["argan-bottle"];
  const floatTransition = isFloating ? { y: { duration: 3, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" as const }, rotate: { duration: 5, repeat: Infinity, repeatType: "reverse" as const, ease: "easeInOut" as const } } : undefined;
  const floatAnimate = isFloating ? { y: [0, -8, 0], rotate: [-1, 1, -1] } : undefined;

  const renderPreset = () => <div className="studio-product-model" style={{ "--product-tone": preset.tone } as React.CSSProperties}>
    <div className="studio-product-model__shadow" />
    <div className={`studio-product-model__object studio-product-model__object--${preset.shape}`}>
      <div className="studio-product-model__highlight" />
      <div className="studio-product-model__cap"><span /></div>
      <div className="studio-product-model__label"><div className="studio-product-model__brand">STUDIO / MAAMORA</div><strong>{preset.title}</strong><small>{preset.subtitle}</small><i /><em>{preset.note}</em></div>
      <span className="studio-product-model__axis">SPECIMEN / 01</span>
    </div>
  </div>;

  return <motion.div animate={floatAnimate} transition={floatTransition} className={`relative select-none flex items-center justify-center ${sizeClasses[size]} ${className}`}>
    {isCustomImage ? <div className="studio-product-model__custom"><div className="studio-product-model__custom-frame">{type ? <img src={type} alt="Product" className="studio-product-model__custom-image" onError={(event) => { (event.currentTarget as HTMLImageElement).style.display = "none"; }} referrerPolicy="no-referrer" /> : null}<div className="studio-product-model__custom-placeholder"><span aria-hidden="true">✦</span><small>STUDIO / SOURCE</small></div></div><div className="studio-product-model__custom-badge">+</div></div> : renderPreset()}
  </motion.div>;
};
