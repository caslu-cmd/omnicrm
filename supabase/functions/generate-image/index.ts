import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── ARIA orchestration — Claude Haiku (fast, ~5-10s) ─────────────────────────
async function orchestrate(
  demand: string,
  ctx: Record<string, unknown>,
  anthropicKey: string,
) {
  const system = `Você é ARIA, Diretora de Marketing da agência Calu. Lidere seu time entregando trabalho REAL.

TIME:
• CAROLINA (estrategista) — posicionamento, persona, pilares editoriais, tom de voz
• BEATRIZ (copywriter) — copy completo: título + legenda + hashtags, pronto para publicar
• RAFAELA (tráfego) — estrutura de campanha: público, orçamento, métricas
• LUCAS (dados) — benchmarks do segmento, melhores horários, formatos
• MARINA (social media) — calendário 7 dias em tabela markdown
• ISADORA (art director) — gera imagem (NÃO tem resposta de texto no JSON)

CLIENTE: ${ctx.name ?? "n/a"} | Segmento: ${ctx.industry ?? "n/a"} | Cor: ${ctx.brandColor ?? "n/a"}
Campanhas: ${(ctx.campaigns as string[] ?? []).join(", ") || "nenhuma"}
${ctx.teamInstructions ? `INSTRUÇÕES DO CLIENTE: ${ctx.teamInstructions}` : ""}

FORMATOS Isadora — aspectRatio obrigatório:
"3:4" = Instagram feed portrait (1080×1440px)
"1:1" = Instagram/LinkedIn square (1080×1080px)
"9:16" = Stories/Reels (1080×1920px)
"16:9" = Banner/YouTube (1920×1080px)

RETORNE APENAS JSON VÁLIDO:
{"plan":"análise em 2 frases","messages":[{"id":"msg_1","from":"aria","to":"carolina","content":"briefing","action":"plan"},{"id":"msg_2","from":"carolina","to":"aria","content":"estratégia completa e detalhada pronta para usar","action":"respond"},{"id":"msg_3","from":"aria","to":"beatriz","content":"briefing","action":"write_copy"},{"id":"msg_4","from":"beatriz","to":"aria","content":"copy completo: título + legenda + hashtags","action":"respond"},{"id":"msg_5","from":"aria","to":"isadora","content":"briefing visual detalhado","action":"generate_image","imageParams":{"aspectRatio":"3:4"}}]}

Inclua apenas agentes necessários para a demanda. Isadora só se pedir imagem/criativo.
Actions: write_copy, generate_image, analyze, plan, schedule, respond, diagnose
Português brasileiro. Entrega real e completa — nunca só confirmação.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      system,
      messages: [{ role: "user", content: `Demanda: "${demand}"` }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "{}";

  try {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
    return JSON.parse(m[1].trim());
  } catch {
    return { plan: text, messages: [] };
  }
}

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

  if (!googleKey) throw new Error("GOOGLE_AI_API_KEY não configurada");

  const imgRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${googleKey}`,
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

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (body.mode === "orchestrate") {
      const { demand, clientContext } = body;
      if (!demand) {
        return new Response(JSON.stringify({ error: "demand obrigatório" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const result = await orchestrate(demand, clientContext ?? {}, anthropicKey);
      return new Response(JSON.stringify(result), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { prompt, aspectRatio = "3:4", clientContext, beatrizCopy = "", carolinaStrategy = "" } = body;
    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt obrigatório" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const googleKey = Deno.env.get("GOOGLE_AI_API_KEY") ?? "";
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
