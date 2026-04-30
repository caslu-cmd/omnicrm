import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ─── SITE SCRAPER ─────────────────────────────────────────────────────────────
async function scrapeSite(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CaluBot/1.0)" },
      signal: AbortSignal.timeout(5000),
    });
    const html = await res.text();
    const get = (p: RegExp) => p.exec(html)?.[1]?.trim() ?? "";
    const title = get(/<title[^>]*>([^<]{1,120})<\/title>/i);
    const metaDesc = get(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']{1,250})["']/i);
    const h1 = get(/<h1[^>]*>([^<]{1,120})<\/h1>/i);
    const body = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
    return [`SITE: ${url}`, title && `Título: ${title}`, metaDesc && `Desc: ${metaDesc}`, h1 && `H1: ${h1}`, body && `Conteúdo: ${body}`]
      .filter(Boolean).join("\n");
  } catch {
    return `SITE: ${url} (inacessível)`;
  }
}

// ─── Lovable AI helper ────────────────────────────────────────────────────────
async function callLovableAI(system: string, user: string, key: string, model = "google/gemini-2.5-flash") {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`AI Gateway ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

// ─── ARIA orchestration ──────────────────────────────────────────────────────
async function orchestrate(
  demand: string,
  clientContext: Record<string, unknown>,
  lovableKey: string,
  siteUrl?: string,
) {
  const ctx = clientContext ?? {};
  const siteContext = siteUrl ? await scrapeSite(siteUrl) : "";

  const systemPrompt = `Você é ARIA, Diretora Sênior de Marketing da agência Calu. Lidera time premium: CAROLINA (estrategista), BEATRIZ (copy), RAFAELA (tráfego pago), LUCAS (dados), MARINA (calendário editorial), ISADORA (art director - gera imagem).

CONTEXTO CLIENTE:
Nome: ${ctx.name ?? "n/a"} | Segmento: ${ctx.industry ?? "n/a"} | Cor: ${ctx.brandColor ?? "n/a"}
Campanhas: ${(ctx.campaigns as string[] ?? []).join(", ") || "nenhuma"}
${ctx.teamInstructions ? `INSTRUÇÕES: ${ctx.teamInstructions}` : ""}
${siteContext ? `\n${siteContext}` : ""}

RETORNE APENAS JSON VÁLIDO no formato:
{
  "plan": "análise em 2-3 frases",
  "messages": [
    { "id": "msg_1", "from": "aria", "to": "carolina", "content": "briefing", "action": "plan" },
    { "id": "msg_2", "from": "carolina", "to": "aria", "content": "estratégia completa pronta para usar", "action": "respond" },
    { "id": "msg_3", "from": "aria", "to": "beatriz", "content": "briefing copy", "action": "write_copy" },
    { "id": "msg_4", "from": "beatriz", "to": "aria", "content": "copy completo: título + legenda + hashtags", "action": "respond" },
    { "id": "msg_5", "from": "aria", "to": "isadora", "content": "briefing visual detalhado", "action": "generate_image", "imageParams": { "aspectRatio": "3:4" } }
  ]
}

Actions válidas: write_copy, generate_image, analyze, plan, schedule, respond, diagnose
aspectRatio: "3:4" (feed), "1:1" (square), "9:16" (stories/reels), "16:9" (banner), "4:3" (slide)
Isadora NÃO tem mensagem de resposta. Português brasileiro. Entrega real e completa.`;

  const text = await callLovableAI(systemPrompt, `Briefing: "${demand}"`, lovableKey, "google/gemini-2.5-flash");

  try {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
    return JSON.parse(m[1].trim());
  } catch {
    return { plan: text, messages: [] };
  }
}

// ─── Image generation ────────────────────────────────────────────────────────
const SUPPORTED_RATIOS = new Set(["1:1", "3:4", "4:3", "9:16", "16:9"]);

function normalizeRatio(aspectRatio: string, prompt: string): string {
  const r = String(aspectRatio || "").trim();
  if (!r || r === "auto") {
    const d = prompt.toLowerCase();
    if (d.includes("stories") || d.includes("reels") || d.includes("tiktok")) return "9:16";
    if (d.includes("banner") || d.includes("youtube")) return "16:9";
    if (d.includes("slide")) return "4:3";
    if (d.includes("quadrado") || d.includes("square")) return "1:1";
    return "3:4";
  }
  if (r === "4:5") return "3:4";
  return SUPPORTED_RATIOS.has(r) ? r : "3:4";
}

const RATIO_HINT: Record<string, string> = {
  "3:4": "vertical portrait 3:4 aspect ratio (1080x1440)",
  "1:1": "square 1:1 aspect ratio (1080x1080)",
  "9:16": "vertical 9:16 aspect ratio (1080x1920)",
  "16:9": "horizontal 16:9 aspect ratio (1920x1080)",
  "4:3": "horizontal 4:3 aspect ratio (1080x810)",
};

async function generateImage(
  prompt: string,
  aspectRatio: string,
  clientContext: Record<string, unknown>,
  lovableKey: string,
  beatrizCopy = "",
  carolinaStrategy = "",
) {
  const ctx = clientContext ?? {};
  const ratio = normalizeRatio(aspectRatio, prompt);

  const teamCtx = [
    beatrizCopy && `COPY: ${beatrizCopy.slice(0, 600)}`,
    carolinaStrategy && `STRATEGY: ${carolinaStrategy.slice(0, 400)}`,
  ].filter(Boolean).join("\n");

  const finalPrompt = `${RATIO_HINT[ratio]}. Brand: ${ctx.name ?? ""} (${ctx.industry ?? ""}), brand color ${ctx.brandColor ?? "neutral"}.

${prompt}

${teamCtx}

Editorial photography, ultra high quality, 4K, sharp focus, no text, no logos, no watermarks.`;

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: finalPrompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) throw new Error(`Image gen ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!imageUrl) throw new Error("Sem imagem retornada");

  const match = imageUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  const mimeType = match?.[1] ?? "image/png";
  const imageData = match?.[2] ?? imageUrl;

  return { imageData, mimeType, enhancedPrompt: finalPrompt, aspectRatio: ratio };
}

// ─── Router ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (body.mode === "orchestrate") {
      const { demand, clientContext, siteUrl } = body;
      if (!demand) {
        return new Response(JSON.stringify({ error: "demand é obrigatório" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const result = await orchestrate(demand, clientContext ?? {}, lovableKey, siteUrl);
      return new Response(JSON.stringify(result), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { prompt, aspectRatio = "3:4", clientContext, beatrizCopy = "", carolinaStrategy = "" } = body;
    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt é obrigatório" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const result = await generateImage(prompt, aspectRatio, clientContext ?? {}, lovableKey, beatrizCopy, carolinaStrategy);
    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
