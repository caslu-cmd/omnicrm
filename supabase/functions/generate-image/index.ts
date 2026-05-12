import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATIO_MAP: Record<string, string> = {
  "1:1":  "ASPECT_1_1",
  "3:4":  "ASPECT_3_4",
  "4:3":  "ASPECT_4_3",
  "9:16": "ASPECT_9_16",
  "16:9": "ASPECT_16_9",
  "4:5":  "ASPECT_3_4",
};

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
  return RATIO_MAP[v] ? v : "3:4";
}

async function buildDesignPromptWithClaude(
  userRequest: string,
  clientContext: Record<string, unknown>,
  beatrizCopy: string,
  carolinaStrategy: string,
  anthropicKey: string,
): Promise<string> {
  const brandColor = String(clientContext.brandColor ?? "neutro");
  const brandName  = String(clientContext.name ?? "marca");
  const industry   = String(clientContext.industry ?? "negócio");

  const systemMsg = `You are Marcela, a senior visual designer. Write a detailed Ideogram AI image generation prompt in English.

RULES — follow exactly:
1. VISUAL ONLY — describe photography, illustration, composition, lighting, colors, mood, textures. Do NOT invent or include random text in the image.
2. If text must appear in the image, use ONLY the brand name "${brandName}" placed tastefully (e.g. small watermark, corner logo). Nothing else written.
3. The image concept must visually represent the theme of the copy provided — same subject, same emotion, same product/service.
4. Brand color palette: ${brandColor}. Industry: ${industry}.
5. Style: clean, modern, professional social media aesthetic. No stock-photo clichés.

Write ONLY the prompt text. No explanations, no JSON.
End with: High quality, professional design, sharp, clean composition.`;

  const userMsg = [
    `Post theme and copy to visually represent: ${beatrizCopy ? beatrizCopy.slice(0, 500) : userRequest}`,
    `Visual request: ${userRequest}`,
    carolinaStrategy ? `Brand strategy: ${carolinaStrategy.slice(0, 200)}` : "",
  ].filter(Boolean).join("\n\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemMsg,
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  if (!res.ok) return userRequest;
  const data = await res.json();
  return data.content?.[0]?.text?.trim() ?? userRequest;
}

function toBase64Chunked(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function generateWithIdeogram(
  prompt: string,
  aspectRatio: string,
  ideogramKey: string,
): Promise<{ imageData: string; mimeType: string; imageUrl: string }> {
  const ratio = normalizeRatio(aspectRatio, prompt);
  const ideogramRatio = RATIO_MAP[ratio] ?? "ASPECT_3_4";

  const res = await fetch("https://api.ideogram.ai/generate", {
    method: "POST",
    headers: {
      "Api-Key": ideogramKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_request: {
        prompt,
        aspect_ratio: ideogramRatio,
        model: "V_2",
        magic_prompt_option: "OFF",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ideogram error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const imageUrl: string = data.data?.[0]?.url ?? "";

  if (!imageUrl) throw new Error("Ideogram returned no image URL");

  // Download image and convert to base64
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to fetch generated image: ${imgRes.status}`);

  const buffer = await imgRes.arrayBuffer();
  const mimeType = imgRes.headers.get("content-type") ?? "image/jpeg";
  const imageData = toBase64Chunked(buffer);

  return { imageData, mimeType, imageUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const {
      prompt,
      aspectRatio = "3:4",
      clientContext = {},
      beatrizCopy = "",
      carolinaStrategy = "",
    } = await req.json();

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    const ideogramKey  = Deno.env.get("IDEOGRAM_API_KEY");

    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt obrigatório" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Step 1: Claude builds the professional design prompt
    const finalPrompt = await buildDesignPromptWithClaude(
      prompt, clientContext, beatrizCopy, carolinaStrategy, anthropicKey,
    );

    // Step 2: If no Ideogram key, return just the briefing
    if (!ideogramKey) {
      return new Response(
        JSON.stringify({
          success: false,
          briefing: finalPrompt,
          message: "IDEOGRAM_API_KEY não configurada. Configure a chave no painel do Supabase → Edge Functions → Secrets.",
        }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    // Step 3: Generate image with Ideogram
    const { imageData, mimeType, imageUrl } = await generateWithIdeogram(finalPrompt, aspectRatio, ideogramKey);

    return new Response(
      JSON.stringify({ success: true, imageData, mimeType, imageUrl, promptUsed: finalPrompt }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
