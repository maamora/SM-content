import React from "react";
import { motion } from "motion/react";

interface Product3DModelProps {
  type: string; // "argan-bottle" | "honey-jar" | "rose-serum" | "savon-jar" | "figue-dropper" or user custom image base64/url
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isFloating?: boolean;
}

export const Product3DModel: React.FC<Product3DModelProps> = ({
  type,
  size = "md",
  className = "",
  isFloating = true
}) => {
  const sizeClasses = {
    sm: "w-24 h-32",
    md: "w-36 h-48",
    lg: "w-48 h-64",
    xl: "w-64 h-80"
  };

  const isCustomImage = !["argan-bottle", "honey-jar", "rose-serum", "savon-jar", "figue-dropper"].includes(type);

  // Floating animation configs
  const floatTransition = isFloating
    ? {
        y: {
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut"
        },
        rotate: {
          duration: 5,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut"
        }
      }
    : undefined;

  const floatAnimate = isFloating
    ? {
        y: [0, -8, 0],
        rotate: [-1, 1, -1]
      }
    : undefined;

  const renderPresetBottle = () => {
    switch (type) {
      case "argan-bottle":
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* 3D Soft Drop Shadow */}
            <div className="absolute -bottom-2 w-3/4 h-3 bg-stone-900/10 rounded-full blur-sm filter" />

            {/* Amber Glass Bottle Body */}
            <div className="relative w-2/3 h-4/5 rounded-t-3xl rounded-b-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 border border-amber-900/30 shadow-[inset_-8px_0_12px_rgba(0,0,0,0.5),inset_8px_0_12px_rgba(255,255,255,0.2)] flex flex-col items-center justify-between py-4">
              {/* Highlight refraction */}
              <div className="absolute top-2 left-3 w-2 h-[85%] bg-white/20 rounded-full blur-[1px]" />
              
              {/* Bottle Neck */}
              <div className="absolute -top-4 w-1/3 h-5 bg-gradient-to-r from-amber-800 to-amber-700 border-b border-amber-950/40" />
              
              {/* Wooden Cork/Cap */}
              <div className="absolute -top-10 w-2/5 h-6 rounded-t bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 border border-amber-400/50 shadow-md">
                <div className="w-full h-1 bg-amber-500/10" />
                <div className="w-full h-2 bg-amber-600/20" />
              </div>

              {/* Minimalist Eco-Luxury Label */}
              <div className="z-10 w-[85%] h-1/2 bg-stone-50 border border-stone-200/50 rounded-md p-1 shadow-md flex flex-col items-center justify-between text-center select-none">
                <div className="w-full border-b border-stone-200 pb-0.5">
                  <span className="text-[7px] tracking-widest text-[#F47315] font-semibold uppercase block">MAAMORA</span>
                  <span className="text-[5px] text-stone-400 block tracking-wider">MAROC</span>
                </div>
                <div>
                  <h4 className="text-[9px] font-bold text-stone-800 leading-tight">Argan</h4>
                  <p className="text-[5px] text-stone-500 italic">Elixir Pur</p>
                </div>
                <div className="w-full flex items-center justify-center gap-0.5">
                  <span className="w-1 h-1 bg-[#F47315] rounded-full" />
                  <span className="text-[4px] text-[#F47315] font-bold">100% BIO</span>
                </div>
              </div>

              {/* Liquid Content Line */}
              <div className="absolute bottom-1 right-2 text-[6px] text-white/40 font-mono">50ml</div>
            </div>
          </div>
        );

      case "honey-jar":
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Jar Shadow */}
            <div className="absolute -bottom-2 w-4/5 h-3 bg-stone-900/12 rounded-full blur-md filter" />

            {/* Glass Hexagonal Jar Body */}
            <div className="relative w-4/5 h-3/4 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 border border-white/20 shadow-[inset_-10px_0_15px_rgba(0,0,0,0.3),inset_10px_0_15px_rgba(255,255,255,0.3),0_8px_16px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center p-3">
              {/* Glass Reflection */}
              <div className="absolute top-2 left-4 w-3 h-[80%] bg-white/25 rounded-full blur-[1px]" />
              
              {/* Screw Cap */}
              <div className="absolute -top-5 w-4/5 h-5 rounded bg-gradient-to-r from-stone-800 via-stone-700 to-stone-900 border-b border-stone-950 flex items-center justify-center shadow-md">
                <div className="w-[90%] h-[2px] bg-stone-600 rounded" />
              </div>

              {/* Golden Ribbon around the Cap */}
              <div className="absolute -top-1 w-2/3 h-1 bg-[#F47315] shadow-sm" />

              {/* Honey Label */}
              <div className="z-10 w-[80%] h-3/5 bg-amber-50/95 border border-amber-200/50 rounded-lg p-1 shadow flex flex-col items-center justify-between text-center">
                <div className="w-full border-b border-amber-200/60 pb-0.5">
                  <span className="text-[6px] tracking-widest text-amber-700 font-bold uppercase block">MAAMORA</span>
                </div>
                <div>
                  <h4 className="text-[9px] font-bold text-amber-950 leading-none">MIEL PUR</h4>
                  <p className="text-[5px] text-stone-500 font-medium">Daghmous Rare</p>
                </div>
                <div className="text-[4px] text-amber-800 bg-amber-200/50 px-1 rounded-full font-semibold">SOUSS-MASSA</div>
              </div>
            </div>
          </div>
        );

      case "rose-serum":
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Shadow */}
            <div className="absolute -bottom-2 w-3/4 h-3 bg-stone-900/10 rounded-full blur-sm filter" />

            {/* Frosted Rose Bottle Body */}
            <div className="relative w-3/5 h-4/5 rounded-t-3xl rounded-b-2xl bg-gradient-to-r from-rose-200 via-rose-300 to-rose-400 border border-rose-400/40 shadow-[inset_-8px_0_12px_rgba(225,120,150,0.4),inset_8px_0_12px_rgba(255,255,255,0.5),0_6px_12px_rgba(225,120,150,0.25)] flex flex-col items-center justify-between py-4">
              {/* Highlight */}
              <div className="absolute top-2 left-2.5 w-1.5 h-[80%] bg-white/40 rounded-full blur-[0.5px]" />
              
              {/* Dropper collar */}
              <div className="absolute -top-4 w-1/2 h-4 bg-gradient-to-r from-stone-100 to-stone-300 border-b border-stone-400" />
              
              {/* Dropper bulb */}
              <div className="absolute -top-8 w-1/3 h-5 rounded-t-full bg-gradient-to-r from-stone-700 to-stone-800" />

              {/* Rose Label */}
              <div className="z-10 w-[85%] h-1/2 bg-stone-50/90 backdrop-blur-[1px] border border-stone-200/50 rounded-md p-1 shadow-sm flex flex-col items-center justify-between text-center">
                <div className="w-full border-b border-stone-100 pb-0.5">
                  <span className="text-[6px] tracking-widest text-rose-600 font-bold uppercase block">MAAMORA</span>
                </div>
                <div>
                  <h4 className="text-[9px] font-extrabold text-stone-800 leading-none">ROSE</h4>
                  <p className="text-[4px] text-stone-500 italic mt-0.5">Sérum Suprême</p>
                </div>
                <div className="text-[4.5px] text-rose-600 font-medium tracking-wide">KELAAT M'GOUNA</div>
              </div>

              {/* Liquid content badge */}
              <div className="absolute bottom-1 left-2 text-[5px] text-rose-800 font-mono font-bold">30ml</div>
            </div>
          </div>
        );

      case "savon-jar":
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Shadow */}
            <div className="absolute -bottom-2 w-[90%] h-3 bg-stone-900/15 rounded-full blur-md filter" />

            {/* Dark Exfoliating soap tub */}
            <div className="relative w-5/6 h-2/3 rounded-xl bg-gradient-to-br from-stone-900 via-stone-800 to-zinc-950 border border-stone-800 shadow-[inset_-8px_0_12px_rgba(255,255,255,0.05),inset_8px_0_12px_rgba(255,255,255,0.1),0_8px_16px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center p-3">
              {/* Reflections */}
              <div className="absolute top-1 left-3 w-2 h-[75%] bg-white/10 rounded-full blur-[1px]" />
              
              {/* Wide lid */}
              <div className="absolute -top-4 w-full h-4 rounded-t-lg bg-gradient-to-r from-stone-800 via-stone-700 to-stone-900 border-b border-stone-950 shadow flex items-center justify-center">
                <div className="w-[95%] h-[1.5px] bg-[#F47315] opacity-80" />
              </div>

              {/* Label */}
              <div className="z-10 w-[85%] h-3/5 bg-stone-100 border border-stone-200 rounded p-1 shadow-md flex flex-col items-center justify-between text-center">
                <div>
                  <span className="text-[6px] tracking-widest text-[#F47315] font-bold uppercase block">MAAMORA</span>
                </div>
                <div>
                  <h4 className="text-[9px] font-bold text-stone-900 leading-none">SAVON NOIR</h4>
                  <p className="text-[4px] text-stone-500 font-semibold mt-0.5">Eucalyptus & Argan</p>
                </div>
                <div className="text-[4.5px] text-emerald-800 font-bold bg-emerald-50 px-1 rounded-full uppercase">Soin Purifiant</div>
              </div>
            </div>
          </div>
        );

      case "figue-dropper":
        return (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Shadow */}
            <div className="absolute -bottom-2 w-3/4 h-3 bg-stone-900/12 rounded-full blur-sm filter" />

            {/* Deep Green Luxury Dropper Bottle */}
            <div className="relative w-3/5 h-4/5 rounded-t-3xl rounded-b-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-900 border border-emerald-950 shadow-[inset_-10px_0_15px_rgba(0,0,0,0.6),inset_10px_0_15px_rgba(255,255,255,0.15),0_6px_12px_rgba(0,0,0,0.2)] flex flex-col items-center justify-between py-4">
              {/* Bright vertical highlight */}
              <div className="absolute top-1.5 left-2 w-1.5 h-[85%] bg-white/15 rounded-full blur-[0.5px]" />
              
              {/* Shiny Gold Cap collar */}
              <div className="absolute -top-4 w-1/2 h-4 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 border-b border-amber-600 shadow-sm" />
              
              {/* Dropper bulb */}
              <div className="absolute -top-8 w-1/3 h-5 rounded-t-full bg-gradient-to-r from-stone-800 to-stone-900" />

              {/* Luxury Label */}
              <div className="z-10 w-[80%] h-1/2 bg-[#FCFAF5] border border-amber-200/40 rounded p-1 shadow-md flex flex-col items-center justify-between text-center">
                <div className="w-full border-b border-stone-200/50 pb-0.5">
                  <span className="text-[5px] tracking-widest text-emerald-900 font-bold uppercase block">MAAMORA</span>
                </div>
                <div>
                  <h4 className="text-[8px] font-extrabold text-stone-900 leading-none">FIGUE DE BARBARIE</h4>
                  <p className="text-[4px] text-amber-700 italic mt-0.5">Huile de Pépins</p>
                </div>
                <div className="text-[4px] text-emerald-900 font-bold tracking-widest bg-amber-100/50 px-1 rounded">L'ÉLIXIR</div>
              </div>

              {/* Content text */}
              <div className="absolute bottom-1 right-2 text-[5px] text-amber-400/70 font-mono">15ml</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      animate={floatAnimate}
      transition={floatTransition}
      className={`relative select-none flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      {isCustomImage ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-2">
          {/* Subtle floating 3D glass backplate */}
          <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40 shadow-xl" />
          
          {/* 3D frame overlay */}
          <div className="relative w-[90%] h-[90%] rounded-xl overflow-hidden border border-stone-300 bg-stone-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center">
            <img
              src={type}
              alt="Uploaded Product"
              className="w-full h-full object-cover select-none pointer-events-none"
              onError={(e) => {
                // If broken link, render generic nice CSS box
                (e.target as HTMLElement).style.display = 'none';
              }}
              referrerPolicy="no-referrer"
            />
            {/* Simple fallback inside frame if image fails/is missing */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 text-center p-2">
              <svg className="w-8 h-8 opacity-40 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-[8px] uppercase tracking-wider font-bold">Maamora Natural</span>
            </div>
          </div>
          
          {/* Floating leaf decorative overlay */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-sm backdrop-blur-md">
            🍃
          </div>
        </div>
      ) : (
        renderPresetBottle()
      )}
    </motion.div>
  );
};
