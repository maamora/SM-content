import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// ── AI Provider Configuration ──────────────────────────────────────────
// We support two providers out of the box:
//   1. Groq  (FREE tier — Llama 3.3 70B) — recommended, set GROQ_API_KEY
//   2. Gemini (Google AI) — set GEMINI_API_KEY
// The server will use whichever key is available (Groq first).
// ────────────────────────────────────────────────────────────────────────

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const activeProvider =
  GROQ_API_KEY ? "groq" :
    GEMINI_API_KEY ? "gemini" : null;

if (activeProvider) {
  console.log(`✅ AI caption generation active — provider: ${activeProvider}`);
} else {
  console.warn(
    "⚠️  No AI API keys found. Set GROQ_API_KEY (free: https://console.groq.com) " +
    "or GEMINI_API_KEY in frontend/.env to enable AI captions."
  );
}

// Helper to clean up JSON returned by LLM if they add markdown wrapper
function parseLLMResponse(text: string) {
  try {
    const trimmed = text.trim();
    const jsonMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    const cleanText = jsonMatch ? jsonMatch[1] : trimmed;
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON response from AI, raw response:", text);
    throw new Error("Invalid JSON format in model output");
  }
}

// ── Build the common prompt (shared by all providers) ──────────────────
function buildCaptionPrompt(name: string, price: string, sellingPoint: string, format: string): string {
  return `You are an elite Moroccan Social Media Copywriter and Growth Marketer for "Maamora", a luxury Moroccan brand that sells premium organic, natural, and authentic local wellness/cosmetic products (like Argan oil, premium honey, Moroccan soap, aromatic herbs).

Your task is to write high-converting, extremely engaging social media captions for a product in exactly three language versions: Formal Arabic, elegant Moroccan French, and authentic Moroccan Darija (local dialect, spelled in Arabic script but with a warm, natural Moroccan voice, not robot translation).

Product Details:
- Name: ${name}
- Price: ${price ? price + ' DH' : 'Upon request'}
- Key Selling Point: ${sellingPoint || '100% natural, premium local quality'}
- Format Target: ${format || 'Square Post (Instagram/Facebook)'}

Guidelines for each language:
1. Formal Arabic (arabic): Professional yet warm, inspiring, premium brand voice, uses rich emojis, concludes with a clear call-to-action to order via DM or bio link, and includes relevant hashtags like #مأمورة #المغرب #طبيعي.
2. Moroccan French (french): Chic, sophisticated, modern Moroccan-French tone, clean layouts, highlighting the benefits, with a clean call-to-action and hashtags.
3. Moroccan Darija (darija): MUST sound like a genuine Moroccan friend talking passionately about an amazing product. Use authentic Moroccan expressions like "تهلاي فراسك", "من قلب الطبيعة", "مكاينش بحالو", "التوصيل تال باب الدار". Do NOT write standard Arabic. Use Arabic script. Rich in emotional connection.

Respond ONLY with a valid JSON object matching this structure:
{
  "arabic": "The generated formal Arabic caption string here",
  "french": "The generated French caption string here",
  "darija": "The generated Moroccan Darija caption string here"
}

Do not add any explanations, headers, or other text outside of the JSON block.`;
}

// ── Groq provider (Llama 3.3 70B — free tier) ─────────────────────────
async function callGroq(prompt: string): Promise<{ arabic: string; french: string; darija: string }> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a professional social media copywriter. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from Groq");
  return parseLLMResponse(text);
}

// ── Gemini provider (fallback) ─────────────────────────────────────────
async function callGemini(prompt: string): Promise<{ arabic: string; french: string; darija: string }> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.8,
        },
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");
  return parseLLMResponse(text);
}

// ── Main AI dispatcher ─────────────────────────────────────────────────
async function generateCaptions(prompt: string): Promise<{ arabic: string; french: string; darija: string }> {
  if (activeProvider === "groq") return callGroq(prompt);
  if (activeProvider === "gemini") return callGemini(prompt);
  throw new Error("No AI provider configured");
}

// API endpoint to generate social media copy
app.post("/api/gemini/generate-captions", async (req, res) => {
  const { name, price, sellingPoint, format } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Product name is required" });
  }

  // Fallback captions if no AI provider is configured
  const mockCaptions = {
    arabic: `✨ نقدم لكم المنتج الأكثر مبيعاً لدينا: ${name}! ✨\n\n🌿 الجودة الطبيعية الفاخرة التي تستحقونها من مأمورة.\n✅ الميزة الأهم: ${sellingPoint || 'منتج طبيعي 100% غني بالفوائد'}\n💰 السعر المناسب: ${price || 'متوفر عند الطلب'} درهم فقط!\n\n🛍️ للطلب والاستفسار، أرسلوا لنا رسالة في الخاص أو اضغطوا على الرابط في البايو. التوصيل متوفر لجميع المدن المغربية! 🇲🇦\n\n#مأمورة #منتجات_طبيعية #المغرب #تجميل_طبيعي #Maamora`,
    french: `✨ Découvrez notre produit phare : ${name}! ✨\n\n🌿 L'excellence naturelle de Maamora pour prendre soin de vous au quotidien.\n✅ Notre point fort : ${sellingPoint || '100% biologique et traditionnel'}\n💰 Prix exclusif : ${price || 'Sur devis'} DH seulement !\n\n🛍️ Commandez dès maintenant en nous contactant par DM ou via notre lien en bio. Livraison disponible partout au Maroc ! 🇲🇦\n\n#Maamora #OrganicBeauty #Morocco #PremiumCare #Naturel`,
    darija: `✨ جربي السحر الحقيقي مع ${name}! ✨\n\n🌿 هادشي طبيعي 100% ومن قلب الطبيعة د مأمورة، غايعجبك بزاف.\n🔥 أهم حاجة فيه: ${sellingPoint || 'النتيجة مضمونة ومكونات نقية'}\n💸 والثمن مناسب بزاف: غير بـ ${price || 'أحسن ثمن'} درهم !\n\n🚀 شنو كتسناو؟ التوصيل راه واجد لجميع المدن تال باب الدار! صيفطو لينا ميساج دابا باش تقداو ديالكم 🇲🇦❤️\n\n#Maamora #بلادي #طبيعي_مغربي #جمال #الداريجة`
  };

  if (!activeProvider) {
    console.log("⚠️ No AI provider configured, returning mock captions.");
    return res.json(mockCaptions);
  }

  try {
    console.log(`🤖 Generating captions with ${activeProvider} for product: ${name}`);
    const prompt = buildCaptionPrompt(name, price, sellingPoint, format);
    const result = await generateCaptions(prompt);
    console.log(`✅ Captions generated successfully for: ${name}`);
    return res.json(result);
  } catch (error: any) {
    console.error(`❌ Error calling ${activeProvider} API:`, error.message);
    // Graceful fallback on error so the user has a working interface regardless
    return res.json({
      ...mockCaptions,
      _error: error.message || `Unable to reach ${activeProvider}, using preset captions`
    });
  }
});

// ── Product Image Generation (Stability AI) ─────────────────────
app.post("/api/generate-product-image", async (req, res) => {
  const { name, sellingPoint } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Product name is required" });
  }

  const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

  if (!STABILITY_API_KEY) {
    return res.status(503).json({ error: "STABILITY_API_KEY not configured in .env" });
  }

  const imagePrompt = `Professional luxury product photography for Moroccan brand "Maamora": ${name}. ${sellingPoint ? `Key feature: ${sellingPoint}.` : ""} Minimalist white studio background, elegant soft lighting, premium cosmetic product display, high-end advertising photography, 4K sharp detail.`;

  try {
    const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STABILITY_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: imagePrompt,
            weight: 1
          }
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 30,
        samples: 1
      })
    });

    if (!response.ok) {
      let errorMsg = `Stability API error (${response.status})`;
      try {
        const errorBody = await response.json();
        errorMsg += `: ${errorBody.message || JSON.stringify(errorBody)}`;
      } catch (e) {
        errorMsg += await response.text();
      }
      return res.status(502).json({ error: errorMsg });
    }

    const responseJSON = await response.json();
    const base64Data = responseJSON.artifacts[0].base64;
    const dataUrl = `data:image/png;base64,${base64Data}`;

    console.log(`✅ Product image generated via Stability AI for: ${name}`);
    return res.json({ imageUrl: dataUrl });
  } catch (error: any) {
    console.error("❌ Error generating product image:", error.message);
    return res.status(500).json({ error: error.message });
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
