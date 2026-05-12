import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASPECT_RATIO_MAP: Record<string, string> = {
  "1:1": "ASPECT_1_1",
  "3:4": "ASPECT_3_4",
  "4:3": "ASPECT_4_3",
  "9:16": "ASPECT_9_16",
  "16:9": "ASPECT_16_9",
};

function normalizeAspectRatio(ratio: string, prompt: string): string {
  const v = String(ratio || "").trim();
  if (!v || v === "auto") {
    const d = prompt.toLowerCase();
    if (d.includes("stories") || d.includes("reels") || d.includes("tiktok")) return "9:16";
    if (d.includes("banner") || d.includes("youtube")) return "16:9";
    if (d.includes("slide")) return "4:3";
    if (d.includes("quadrado") || d.includes("square")) return "1:1";
    return "3:4";
  }
  if (v === "4:5") return "3:4";
  return Object.keys(ASPECT_RATIO_MAP).includes(v) ? v : "3:4";
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function buildDesignPromptWithClaude(
  userDirection: string,
  clientContext: Record<string, unknown>,
  beatrizCopy: string,
  carolinaStrategy: string,
  anthropicKey: string,
): Promise<string> {
  const ctx = clientContext ?? {};

  const systemPrompt = `You are Marcela, a senior visual designer specialized in social media marketing for Brazilian
  brands.

  Your mission: create detailed, professional image generation prompts for Ideogram AI.

  Strict rules:
  - Write the prompt in English (Ideogram performs best in English)
  - BUT any text that appears INSIDE the image must be specified in Brazilian Portuguese
  - Create modern, clean, high-impact social media posts
  - Include specific details: composition, typography style, color palette, lighting, mood
  - Specify text placement and hierarchy in the image
  - Use exact hex colors when provided
  - Output ONLY the prompt, no explanations`;

  const parts = [
    userDirection ? `User request: ${userDirection}` : "",
    (ctx.name as string) ? `Brand name: ${ctx.name}` : "",
    (ctx.industry as string) ? `Industry: ${ctx.industry}` : "",
    (ctx.brandColor as string) ? `Brand color: ${ctx.brandColor}` : "",
    beatrizCopy ? `Copywriter text to include: ${beatrizCopy.slice(0, 400)}` : "",
    carolinaStrategy ? `Strategy context: ${carolinaStrategy.slice(0, 200)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const userMessage = `Create a professional Ideogram prompt for a Brazilian social media
  post:\n\n${parts}\n\nRemember: prompt in English, but text visible inside the image must be in Brazilian Portuguese.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) throw new Error(`Claude error: ${await response.text()}`);
  const result = await response.json();
  return result.content?.[0]?.text ?? userDirection;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { prompt, aspectRatio = "3:4", clientContext, beatrizCopy = "", carolinaStrategy = "" } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ideogramApiKey = Deno.env.get("IDEOGRAM_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ideogramApiKey) {
      return new Response(JSON.stringify({ error: "IDEOGRAM_API_KEY not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const ratio = normalizeAspectRatio(aspectRatio, prompt);
    const ideogramRatio = ASPECT_RATIO_MAP[ratio] ?? "ASPECT_3_4";

    let finalPrompt = prompt;
    if (anthropicKey) {
      finalPrompt = await buildDesignPromptWithClaude(
        prompt,
        clientContext ?? {},
        beatrizCopy,
        carolinaStrategy,
        anthropicKey,
      );
    }

    const response = await fetch("https://api.ideogram.ai/generate", {
      method: "POST",
      headers: {
        "Api-Key": ideogramApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_request: {
          prompt: finalPrompt,
          aspect_ratio: ideogramRatio,
          model: "V_2",
          magic_prompt_option: "OFF",
        },
      }),
    });

    if (!response.ok) throw new Error(`Ideogram error: ${await response.text()}`);

    const result = await response.json();
    const imageUrl = result.data?.[0]?.url;
    if (!imageUrl) throw new Error("Ideogram did not return an image URL");

    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageData = arrayBufferToBase64(imageBuffer);
    const mimeType = imageResponse.headers.get("content-type") ?? "image/jpeg";

    return new Response(
      JSON.stringify({ imageData, mimeType, imageUrl, enhancedPrompt: finalPrompt, aspectRatio: ratio }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
