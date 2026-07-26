import React, { useRef, useState, useEffect } from "react";
import { Product, ImageTemplate, PostFormat } from "../types";
import { Download, RefreshCw, Layers, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface SocialPostCanvasProps {
  product: Product;
  template: ImageTemplate;
  format: PostFormat;
  promoText: string;
  badgeStyle: 'classic' | 'minimal' | 'badge-3d' | 'vintage';
  onDownload?: (imageUrl: string) => void;
}

export const SocialPostCanvas: React.FC<SocialPostCanvasProps> = ({
  product,
  template,
  format,
  promoText,
  badgeStyle = 'badge-3d',
  onDownload
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Dynamic AI Image logic using Gemini API via server endpoint
  const [aiImageUrl, setAiImageUrl] = useState<string>("");
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    // Generate a fresh AI image whenever the product changes
    const generateImage = async () => {
      setImageLoading(true);
      setImageError(false);
      setAiImageUrl("");
      try {
        const res = await fetch("/api/generate-product-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: product.name, sellingPoint: product.sellingPoint }),
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();
        if (data.imageUrl) {
          setAiImageUrl(data.imageUrl);
        } else {
          throw new Error("No image URL returned");
        }
      } catch (err) {
        console.error("AI image generation failed:", err);
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    generateImage();
  }, [product.name, product.sellingPoint]);

  // Sizing definitions for different social formats in UI
  const formatAspectRatios = {
    square: "aspect-square w-full max-w-[420px]",
    story: "aspect-[9/16] w-full max-w-[320px]",
    whatsapp: "aspect-[9/16] w-full max-w-[320px]"
  };

  const getFormatLabel = () => {
    switch (format) {
      case "square": return "Square Post (Instagram/Facebook - 1:1)";
      case "story": return "Story Format (Instagram/Snapchat - 9:16)";
      case "whatsapp": return "WhatsApp Status (9:16)";
    }
  };

  // Function to draw everything on the canvas and download it
  const handleExport = async () => {
    if (!canvasRef.current || !product) return;
    setExporting(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setExporting(false);
      return;
    }

    // Set high-fidelity dimensions depending on format
    const width = format === "square" ? 1080 : 1080;
    const height = format === "square" ? 1080 : 1920;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw dynamic gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (template.id === "temp-sunset") {
      bgGrad.addColorStop(0, "#FFFDF9");
      bgGrad.addColorStop(0.5, "#FFF3E8");
      bgGrad.addColorStop(1, "#FFE5D3");
    } else if (template.id === "temp-moss") {
      bgGrad.addColorStop(0, "#FBFDFB");
      bgGrad.addColorStop(0.5, "#EAF2ED");
      bgGrad.addColorStop(1, "#D4E6DC");
    } else if (template.id === "temp-ochre") {
      bgGrad.addColorStop(0, "#FAF6F0");
      bgGrad.addColorStop(0.5, "#F6ECE2");
      bgGrad.addColorStop(1, "#EBD5C2");
    } else if (template.id === "temp-mint") {
      bgGrad.addColorStop(0, "#F7FCFA");
      bgGrad.addColorStop(0.5, "#ECF7F3");
      bgGrad.addColorStop(1, "#D1EDE3");
    } else {
      bgGrad.addColorStop(0, "#0F172A");
      bgGrad.addColorStop(0.5, "#1E1B4B");
      bgGrad.addColorStop(1, "#311042");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw organic decoration or grid line highlights
    ctx.strokeStyle = template.id === "temp-terracotta-dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
    ctx.lineWidth = 2;
    // Draw grid
    for (let i = 0; i < width; i += 80) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let j = 0; j < height; j += 80) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }

    // 3. Draw Brand Curved Header Arc (Maamora Logo representation)
    const isDark = template.id === "temp-terracotta-dark";
    const brandColor = "#F47315";
    const textThemeColor = isDark ? "#FFFFFF" : "#1C1917";

    ctx.save();
    // Arc curve
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.15, width * 0.2, Math.PI, 0);
    ctx.lineWidth = 14;
    const arcGrad = ctx.createLinearGradient(width * 0.3, 0, width * 0.7, 0);
    arcGrad.addColorStop(0, "#FFB800");
    arcGrad.addColorStop(1, "#F47315");
    ctx.strokeStyle = arcGrad;
    ctx.stroke();

    // Brand Name Text
    ctx.fillStyle = brandColor;
    ctx.font = "bold 72px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("maamora", width / 2, height * 0.19);
    ctx.restore();

    // 4. Draw Promo Line
    if (promoText) {
      ctx.save();
      ctx.fillStyle = isDark ? "#3B82F6" : "#F47315";
      ctx.font = "bold 32px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(promoText.toUpperCase(), width / 2, height * 0.25);
      ctx.restore();
    }

    // 5. Draw Product Name & Tagline
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = textThemeColor;
    ctx.font = "bold 64px 'Playfair Display', Georgia, serif";
    ctx.fillText(product.name, width / 2, height * 0.32);

    ctx.fillStyle = isDark ? "#94A3B8" : "#57534E";
    ctx.font = "italic 32px 'Inter', sans-serif";
    ctx.fillText(product.sellingPoint, width / 2, height * 0.36);
    ctx.restore();

    // 6. Draw AI-Generated Product Image (Loaded dynamically)
    if (aiImageUrl) {
      try {
        const img = new Image();
        // No crossOrigin needed — aiImageUrl is a base64 data URL from our own server
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = aiImageUrl;
        });

        ctx.save();
        // Create a rounded rect clipping mask for the image
        ctx.beginPath();
        const imgW = width * 0.7;
        const imgH = height * 0.45;
        const imgX = (width - imgW) / 2;
        const imgY = height * 0.4;

        ctx.roundRect(imgX, imgY, imgW, imgH, 30);
        ctx.clip();

        // Draw the image
        ctx.drawImage(img, imgX, imgY, imgW, imgH);
        ctx.restore();

        // Add a subtle inner shadow/border to the image
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, imgW, imgH, 30);
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      } catch (e) {
        console.error("Failed to load AI image for canvas export:", e);
      }
    }

    // 7. Draw Price Stamp / Badge
    ctx.save();
    const stampX = width * 0.76;
    const stampY = height * 0.72;

    if (badgeStyle === 'badge-3d') {
      // 3D Neobrutalist design: solid orange badge with absolute black offsets
      ctx.fillStyle = "#1C1917";
      ctx.beginPath();
      ctx.arc(stampX + 8, stampY + 8, 95, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#F47315";
      ctx.beginPath();
      ctx.arc(stampX, stampY, 95, 0, 2 * Math.PI);
      ctx.fill();

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 44px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(product.price + " DH", stampX, stampY + 10);
      ctx.font = "bold 16px 'Inter', sans-serif";
      ctx.fillText("PRODUIT BIO", stampX, stampY + 40);
    } else {
      // Classic elegant badge
      ctx.fillStyle = textThemeColor;
      ctx.beginPath();
      ctx.arc(stampX, stampY, 80, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = isDark ? "#1C1917" : "#FFFFFF";
      ctx.font = "bold 38px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(product.price + " DH", stampX, stampY + 12);
    }
    ctx.restore();

    // 8. Bottom Footer with standard address/contact
    ctx.save();
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.4)" : "rgba(28,25,23,0.6)";
    ctx.font = "bold 24px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("WWW.MAAMORA.MA  •  COOPÉRATIVE AGRICOLE BIO", width / 2, height * 0.94);
    ctx.restore();

    // Export to file download
    const imgUrl = canvas.toDataURL("image/png");
    if (onDownload) {
      onDownload(imgUrl);
    }

    // Trigger standard browser download
    const link = document.createElement("a");
    link.download = `Maamora_${product.name.replace(/\s+/g, '_')}_${format}.png`;
    link.href = imgUrl;
    link.click();

    setExporting(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center bg-stone-50/50 p-6 rounded-3xl border border-stone-200/60 shadow-inner w-full">
      {/* Target Format Indicator */}
      <div className="flex items-center gap-2 mb-4 bg-white px-4 py-1.5 rounded-full border border-stone-200/80 shadow-sm">
        <Layers className="w-4 h-4 text-[#F47315]" />
        <span className="text-xs font-semibold text-stone-600">{getFormatLabel()}</span>
      </div>

      {/* Visual Live Container mimicking a 3D Glass Frame (inspired by sofihealth.com) */}
      <div
        ref={containerRef}
        className={`relative ${formatAspectRatios[format]} rounded-[2.5rem] p-6 bg-gradient-to-br ${template.bgGradient} border-4 border-stone-900 shadow-[10px_10px_0px_0px_rgba(28,25,23,0.9)] overflow-hidden transition-all duration-300 flex flex-col justify-between`}
      >
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* Top Header - Arc logo representation */}
        <div className="relative flex flex-col items-center pt-2 select-none z-10">
          {/* Curved arc line */}
          <svg className="w-24 h-4 text-[#F47315] fill-none" viewBox="0 0 100 20">
            <path d="M10,20 Q50,0 90,20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <span className={`text-xl font-extrabold tracking-tight mt-[-4px] text-[#F47315]`}>
            maamora
          </span>
          {promoText && (
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-[8px] tracking-[0.25em] font-black uppercase text-center mt-1.5 bg-white/80 px-2 py-0.5 rounded-md border border-[#F47315]/20 ${template.textColor}`}
            >
              {promoText}
            </motion.span>
          )}
        </div>

        {/* Center Section with Product Floating beautifully */}
        <div className="relative flex flex-col items-center justify-center my-auto py-4 z-10">
          {/* Subtle reflection backing */}
          <div className="absolute w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center mb-3">
            <h3 className={`text-lg font-bold font-serif leading-tight ${template.textColor}`}>
              {product.name}
            </h3>
            <p className="text-[10px] text-stone-500 italic mt-0.5 max-w-[200px] mx-auto leading-tight">
              {product.sellingPoint}
            </p>
          </div>

          {/* AI Generated Image */}
          <div className="relative mt-2 drop-shadow-xl z-20 w-48 h-48 sm:w-56 sm:h-56">
            <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-stone-100 flex items-center justify-center relative">
              {imageLoading ? (
                <div className="flex flex-col items-center gap-2 p-4">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#F47315]" />
                  <span className="text-[8px] text-stone-400 font-medium text-center">Génération IA...</span>
                </div>
              ) : imageError ? (
                <div className="flex flex-col items-center gap-1 p-3">
                  <span className="text-xl">🌿</span>
                  <span className="text-[8px] text-stone-400 text-center font-medium">{product.name}</span>
                </div>
              ) : aiImageUrl ? (
                <img
                  src={aiImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <RefreshCw className="w-6 h-6 animate-spin text-stone-400" />
              )}
            </div>

            {/* Interactive Floating Price Badge stamp over image */}
            <div className="absolute -bottom-4 -right-4 z-30">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 3 }}
                className={`flex flex-col items-center justify-center rounded-full border-2 border-stone-900 shadow-md ${badgeStyle === 'badge-3d' ? 'w-16 h-16 sm:w-20 sm:h-20 bg-[#F47315] text-white shadow-[3px_3px_0px_0px_rgba(28,25,23,1)]' : 'w-14 h-14 sm:w-16 sm:h-16 bg-white text-stone-900'}`}
              >
                <span className="text-[10px] sm:text-xs font-black leading-none">{product.price} DH</span>
                <span className="text-[5px] sm:text-[6px] font-bold uppercase tracking-wider mt-0.5">BIO NATURAL</span>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Bottom footer bar */}
        <div className="relative border-t border-stone-400/20 pt-2 flex justify-between items-center z-10">
          <span className="text-[7px] font-black tracking-widest text-stone-500/80 uppercase">
            COOPÉRATIVE MAGHRIBIA
          </span>
          <span className="text-[7px] font-black text-stone-500/80">
            MAAMORA.MA
          </span>
        </div>
      </div>

      {/* Hidden Canvas used purely for high-fidelity PNG render during export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls & Export Trigger */}
      <div className="mt-6 flex flex-col gap-2 w-full max-w-[360px]">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-2 bg-[#F47315] hover:bg-[#ff852e] active:translate-y-0.5 text-white font-extrabold py-3 px-6 rounded-2xl border-b-4 border-stone-900 shadow-[4px_4px_0px_0px_rgba(28,25,23,1)] hover:shadow-[2px_2px_0px_0px_rgba(28,25,23,1)] transition-all cursor-pointer select-none"
        >
          {exporting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              GÉNÉRATION DU PNG...
            </>
          ) : success ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-300" />
              COPIE ENREGISTRÉE !
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              TÉLÉCHARGER LE VISUEL
            </>
          )}
        </button>
        <span className="text-[10px] text-center text-stone-400 font-medium">
          Génère un fichier PNG de 1080px prêt à être partagé sur Instagram ou Facebook.
        </span>
      </div>
    </div>
  );
};
