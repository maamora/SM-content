import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("⚠️ GEMINI_API_KEY is not defined in environment variables. Gemini calls will fall back to rich simulated captions.");
}

// Helper to clean up JSON returned by LLM if they add markdown wrapper
function parseLLMResponse(text: string) {
  try {
    const trimmed = text.trim();
    const jsonMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    const cleanText = jsonMatch ? jsonMatch[1] : trimmed;
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON response from Gemini, raw response:", text);
    throw new Error("Invalid JSON format in model output");
  }
}

// API endpoint to generate social media copy
app.post("/api/gemini/generate-captions", async (req, res) => {
  const { name, price, sellingPoint, format } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Product name is required" });
  }

  // Fallback captions if Gemini is not configured
  const mockCaptions = {
    arabic: `✨ نقدم لكم المنتج الأكثر مبيعاً لدينا: ${name}! ✨\n\n🌿 الجودة الطبيعية الفاخرة التي تستحقونها من مأمورة.\n✅ الميزة الأهم: ${sellingPoint || 'منتج طبيعي 100% غني بالفوائد'}\n💰 السعر المناسب: ${price || 'متوفر عند الطلب'} درهم فقط!\n\n🛍️ للطلب والاستفسار، أرسلوا لنا رسالة في الخاص أو اضغطوا على الرابط في البايو. التوصيل متوفر لجميع المدن المغربية! 🇲🇦\n\n#مأمورة #منتجات_طبيعية #المغرب #تجميل_طبيعي #Maamora`,
    french: `✨ Découvrez notre produit phare : ${name}! ✨\n\n🌿 L'excellence naturelle de Maamora pour prendre soin de vous au quotidien.\n✅ Notre point fort : ${sellingPoint || '100% biologique et traditionnel'}\n💰 Prix exclusif : ${price || 'Sur devis'} DH seulement !\n\n🛍️ Commandez dès maintenant en nous contactant par DM ou via notre lien en bio. Livraison disponible partout au Maroc ! 🇲🇦\n\n#Maamora #OrganicBeauty #Morocco #PremiumCare #Naturel`,
    darija: `✨ جربي السحر الحقيقي مع ${name}! ✨\n\n🌿 هادشي طبيعي 100% ومن قلب الطبيعة د مأمورة، غايعجبك بزاف.\n🔥 أهم حاجة فيه: ${sellingPoint || 'النتيجة مضمونة ومكونات نقية'}\n💸 والثمن مناسب بزاف: غير بـ ${price || 'أحسن ثمن'} درهم !\n\n🚀 شنو كتسناو؟ التوصيل راه واجد لجميع المدن تال باب الدار! صيفطو لينا ميساج دابا باش تقداو ديالكم 🇲🇦❤️\n\n#Maamora #بلادي #طبيعي_مغربي #جمال #الداريجة`
  };

  if (!ai) {
    console.log("No Gemini API client, returning simulated captions.");
    return res.json(mockCaptions);
  }

  try {
    console.log(`Generating captions with Gemini for product: ${name}`);

    const prompt = `You are an elite Moroccan Social Media Copywriter and Growth Marketer for "Maamora", a luxury Moroccan brand that sells premium organic, natural, and authentic local wellness/cosmetic products (like Argan oil, premium honey, Moroccan soap, aromatic herbs).

Your task is to write high-converting, extremely engaging social media captions for a product in exactly three language versions: Formal Arabic, elegant Moroccan French, and authentic Moroccan Darija (local dialect, spelled in Arabic script but with a warm, natural Moroccan voice, not robot translation).

Product Details:
- Name: ${name}
- Price: ${price ? price + ' DH' : 'Upon request'}
- Key Selling Point: ${sellingPoint || '100% natural, premium local quality'}
- Format Target: ${format || 'Square Post (Instagram/Facebook)'}

Guidelines for each language:
1. Formal Arabic (arabic): Professional yet warm, inspiring, premium brand voice, uses rich emojis, concludes with a clear call-to-action to order via DM or bio link, and includes relevant hashtags like #مأمورة #المغرب #طبيعي.
2. Moroccan French (french): Chic, sophisticated, modern Moroccan-French tone, clean layouts, highlighting the benefits, with a clean call-to-action and hashtags.
3. Moroccan Darija (darija): MUST sound like a genuine Moroccan friend talking passionately about an amazing product. Use authentic Moroccan expressions like "7اجة طوب", "تهلاي فراسك", "من قلب الطبيعة", "مكاينش بحالو", "التوصيل تال باب الدار". Do NOT write standard Arabic. Use Arabic script. Rich in emotional connection.

Respond ONLY with a valid JSON object matching this structure:
{
  "arabic": "The generated formal Arabic caption string here",
  "french": "The generated French caption string here",
  "darija": "The generated Moroccan Darija caption string here"
}

Do not add any explanations, headers, or other text outside of the JSON block.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            arabic: { type: Type.STRING, description: "Highly engaging formal Arabic caption with emojis" },
            french: { type: Type.STRING, description: "Premium Moroccan French caption with emojis" },
            darija: { type: Type.STRING, description: "Authentic, warm Moroccan Darija (in Arabic script) caption with emojis" }
          },
          required: ["arabic", "french", "darija"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const result = parseLLMResponse(text);
    return res.json(result);
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    // Graceful fallback on error so the user has a working interface regardless
    return res.json({
      ...mockCaptions,
      _error: error.message || "Unable to reach Gemini, using fine-tuned presets"
    });
  }
});

// Start server and handle Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
