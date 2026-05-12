import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Image generation — Google Imagen 3 (~10-15s) ────────────────────────────
const RATIOS = new Set(["1:1", "3:4", "4:3", "9:16", "16:9"]);

function normalizeRatio(r: string, prompt: string): string {
  const v = String(r || "").trim();
  if (!v || v === "auto") {
    const d = prompt.toLowerCase();
    if (d.includes("stories") || d.includes("reels") || d.includes("tiktok")) return "9:16";
    if (d.includes("banner") || d.includes("youtube")) return "16:9";
    if (d.includes("slide")) return "4:3";
    if (d.includes("quadrado") || d.includes("square")) return "1:1";
    return "3:4";
  }
  if (v === "4:5") return "3:4";
  return RATIOS.has(v) ? v : "3:4";
}

async function generateImage(
  prompt: string,
  aspectRatio: string,
  ctx: Record<string, unknown>,
  googleKey: string,
  beatrizCopy = "",
  carolinaStrategy = "",
) {
  const ratio = normalizeRatio(aspectRatio, prompt);
  const hint: Record<string, string> = {
    "3:4": "vertical portrait 3:4 (1080x1440)",
    "1:1": "square 1:1 (1080x1080)",
    "9:16": "vertical 9:16 (1080x1920)",
    "16:9": "horizontal 16:9 (1920x1080)",
    "4:3": "horizontal 4:3 (1080x810)",
  };

  const extras = [
    beatrizCopy ? `Copy: ${beatrizCopy.slice(0, 300)}` : "",
    carolinaStrategy ? `Estratégia: ${carolinaStrategy.slice(0, 200)}` : "",
  ].filter(Boolean).join(" | ");

  const finalPrompt = `${prompt}. Brand: ${ctx.name ?? ""} in ${ctx.industry ?? ""}, brand color ${ctx.brandColor ?? "neutral"}. Format: ${hint[ratio]}. ${extras} Editorial photography, ultra high quality, 4K, sharp focus, no text, no logos, no watermarks.`;

  const imgRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${googleKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: finalPrompt }],
        parameters: { sampleCount: 1, aspectRatio: ratio },
      }),
    },
  );

  if (!imgRes.ok) throw new Error(`Imagen 3 ${imgRes.status}: ${await imgRes.text()}`);

  const imgData = await imgRes.json();
  const pred = imgData.predictions?.[0];
  if (!pred?.bytesBase64Encoded) throw new Error("Imagen 3 não retornou imagem");

  return {
    imageData: pred.bytesBase64Encoded,
    mimeType: pred.mimeType ?? "image/png",
    enhancedPrompt: finalPrompt,
    aspectRatio: ratio,
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    const { prompt, aspectRatio = "3:4", clientContext, beatrizCopy = "", carolinaStrategy = "" } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt obrigatório" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const googleKey = Deno.env.get("GOOGLE_AI_API_KEY") ?? "";

    if (!googleKey) {
      // No image API key — return a visual brief as text so Isadora still delivers
      const ratio = normalizeRatio(aspectRatio, prompt);
      const dimensions: Record<string, string> = {
        "3:4": "1080×1440px (feed portrait)", "1:1": "1080×1080px (square)",
        "9:16": "1080×1920px (stories/reels)", "16:9": "1920×1080px (banner)", "4:3": "1080×810px",
      };
      const brief = `**Direção de Arte — Isadora**\n\n📐 Formato: ${dimensions[ratio] ?? ratio}\n🎨 Visual: ${prompt}\n🏷️ Marca: ${(clientContext as Record<string,unknown>)?.name ?? ""} | Cor: ${(clientContext as Record<string,unknown>)?.brandColor ?? "—"}\n${carolinaStrategy ? `\n📋 Estratégia: ${carolinaStrategy.slice(0, 200)}` : ""}${beatrizCopy ? `\n✍️ Copy: ${beatrizCopy.slice(0, 200)}` : ""}\n\n_Configure GOOGLE_AI_API_KEY no Supabase para gerar a imagem automaticamente._`;
      return new Response(JSON.stringify({ imageBrief: brief, aspectRatio: ratio }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const result = await generateImage(prompt, aspectRatio, clientContext ?? {}, googleKey, beatrizCopy, carolinaStrategy);
    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
