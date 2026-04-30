import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── SITE SCRAPER ─────────────────────────────────────────────────────────────
async function scrapeSite(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CaluBot/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    const html = await res.text();
    const get = (pattern: RegExp) => pattern.exec(html)?.[1]?.trim() ?? "";
    const getAll = (pattern: RegExp, limit = 4) =>
      [...html.matchAll(pattern)].slice(0, limit).map(m => m[1]?.trim()).filter(Boolean).join(" | ");
    const title    = get(/<title[^>]*>([^<]{1,120})<\/title>/i);
    const metaDesc = get(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']{1,250})["']/i)
                  || get(/<meta[^>]*content=["']([^"']{1,250})["'][^>]*name=["']description["']/i);
    const h1       = get(/<h1[^>]*>([^<]{1,120})<\/h1>/i);
    const h2s      = getAll(/<h2[^>]*>([^<]{3,100})<\/h2>/gi);
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 600);
    return [
      `REFERÊNCIA DO SITE: ${url}`,
      title    ? `Título: ${title}` : "",
      metaDesc ? `Descrição: ${metaDesc}` : "",
      h1       ? `H1: ${h1}` : "",
      h2s      ? `H2s: ${h2s}` : "",
      bodyText ? `Conteúdo: ${bodyText}` : "",
    ].filter(Boolean).join("\n");
  } catch {
    return `REFERÊNCIA DO SITE: ${url} (não foi possível acessar)`;
  }
}

// ─── ARIA orchestration via Claude Sonnet ─────────────────────────────────────
async function orchestrate(
  demand: string,
  clientContext: Record<string, unknown>,
  anthropicKey: string,
  siteUrl?: string,
) {
  const ctx = clientContext ?? {};
  const siteContext = siteUrl ? await scrapeSite(siteUrl) : "";

  const systemPrompt = `Você é ARIA, Diretora Sênior de Marketing da agência Calu. 15 anos de experiência em marketing digital, branding e estratégia criativa para marcas brasileiras.

Você lidera um time de especialistas seniores. Quando recebe um briefing, convoca os agentes relevantes e eles entregam trabalho real e completo — como numa reunião de agência premium.

━━━ SEU TIME ━━━

**CAROLINA — Estrategista de Marca**
Entrega: diagnóstico de posicionamento, arquitetura de mensagem, persona/ICP, tom de voz, diferencial competitivo, pilares editoriais. Fala primeiro — define o terreno estratégico que todos seguem.

**BEATRIZ — Copywriter Sênior**
Entrega: copy completo e pronto para uso. Para posts: título + legenda completa + hashtags. Para anúncios: headline + body copy + CTA. Ela usa a estratégia da Carolina como base.

**RAFAELA — Especialista em Tráfego Pago**
Entrega: estrutura de campanha — objetivo, público segmentado, criativo recomendado, orçamento sugerido, métricas-chave (CPC, CPL, ROAS), cronograma.

**LUCAS — Analista de Dados & Performance**
Entrega: benchmarks do segmento, análise de concorrência, melhores horários, formatos com melhor performance, metas realistas.

**MARINA — Social Media Manager**
Entrega: calendário editorial em tabela markdown — mínimo 7 dias: | Data | Horário | Plataforma | Formato | Tema | Copy (resumo) | Responsável |

**ISADORA — Art Director**
Entrega imagem automaticamente. NÃO tem mensagem de resposta no JSON. Recebe briefing com: plataforma, aspectRatio, dimensões, composição, cores, mood.

━━━ FORMATOS DE IMAGEM ━━━
| Tipo | Plataforma | aspectRatio | Dimensões |
|---|---|---|---|
| Post feed portrait | Instagram | "3:4" | 1080×1440px |
| Post feed square | Instagram/LinkedIn | "1:1" | 1080×1080px |
| Stories/Reels | Instagram/TikTok | "9:16" | 1080×1920px |
| YouTube/banner | YouTube/Web | "16:9" | 1920×1080px |
| Slide/apresentação | Geral | "4:3" | 1080×810px |

━━━ CONTEXTO DO CLIENTE ━━━
Nome: ${ctx.name ?? "não informado"}
Segmento: ${ctx.industry ?? "não informado"}
Cor da marca: ${ctx.brandColor ?? "não informada"}
Campanhas ativas: ${(ctx.campaigns as string[] ?? []).join(", ") || "nenhuma"}
Temas recentes: ${(ctx.recentThemes as string[] ?? []).join(" | ") || "nenhum"}
Próxima ação: ${ctx.nextAction ?? "não definida"}
${ctx.teamInstructions ? `\nINSTRUÇÕES PERMANENTES DO TIME:\n${ctx.teamInstructions}` : ""}
${siteContext ? `\nSite do cliente:\n${siteContext}` : ""}

━━━ RETORNE APENAS JSON VÁLIDO ━━━

{
  "plan": "análise em 2-3 frases: o que foi pedido, quais agentes foram acionados e o que cada um entregará",
  "messages": [
    { "id": "msg_1", "from": "aria", "to": "carolina", "content": "briefing detalhado para a estrategista", "action": "plan" },
    { "id": "msg_2", "from": "carolina", "to": "aria", "content": "estratégia completa: posicionamento, persona, pilares editoriais, tom de voz — texto completo pronto para usar", "action": "respond" },
    { "id": "msg_3", "from": "aria", "to": "beatriz", "content": "briefing de copy com a estratégia da Carolina", "action": "write_copy" },
    { "id": "msg_4", "from": "beatriz", "to": "aria", "content": "copy completo: título + legenda + hashtags — pronto para publicar", "action": "respond" },
    { "id": "msg_5", "from": "aria", "to": "isadora", "content": "briefing visual: Instagram feed portrait, formato 3:4 — 1080×1440px, composição, cores, mood", "action": "generate_image", "imageParams": { "aspectRatio": "3:4" } }
  ]
}

Valores válidos para action: write_copy, generate_image, analyze, plan, schedule, respond, diagnose
Valores válidos para aspectRatio: "3:4", "1:1", "9:16", "16:9", "4:3"
Isadora NÃO tem mensagem de resposta.
Cada agente referencia o trabalho dos outros.
Todo agente entrega trabalho REAL e COMPLETO — nunca só confirmação.
Escreva tudo em português brasileiro. Nível agência premium.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: `Briefing / Demanda: "${demand}"` }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "{}";

  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
    return JSON.parse(jsonMatch[1].trim());
  } catch {
    return { plan: text, messages: [] };
  }
}

// ─── Isadora: Claude Haiku prompt → Google Imagen 3 ──────────────────────────
const SUPPORTED_RATIOS = new Set(["1:1", "3:4", "4:3", "9:16", "16:9"]);

function normalizeRatio(aspectRatio: string, prompt: string): string {
  const r = String(aspectRatio || "").trim();
  if (!r || r === "auto") return bestAspectRatio(prompt);
  if (r === "4:5") return "3:4";
  return SUPPORTED_RATIOS.has(r) ? r : "3:4";
}

function bestAspectRatio(desc: string): string {
  const d = desc.toLowerCase();
  if (d.includes("stories") || d.includes("reels") || d.includes("tiktok")) return "9:16";
  if (d.includes("banner") || d.includes("youtube") || d.includes("cover")) return "16:9";
  if (d.includes("slide") || d.includes("apresentação")) return "4:3";
  if (d.includes("quadrado") || d.includes("square") || d.includes("1:1")) return "1:1";
  return "3:4";
}

async function generateImage(
  prompt: string,
  aspectRatio: string,
  clientContext: Record<string, unknown>,
  anthropicKey: string,
  googleKey: string,
  beatrizCopy = "",
  carolinaStrategy = "",
) {
  const ctx = clientContext ?? {};
  const ratio = normalizeRatio(aspectRatio, prompt);

  const platformHint: Record<string, string> = {
    "3:4":  "Instagram feed portrait — 1080×1440px",
    "1:1":  "Instagram/LinkedIn square — 1080×1080px",
    "9:16": "Stories/Reels/TikTok — 1080×1920px",
    "16:9": "YouTube/banner — 1920×1080px",
    "4:3":  "Slide/Facebook — 1080×810px",
  };

  const teamContext = [
    beatrizCopy      ? `COPY (Beatriz):\n${beatrizCopy.slice(0, 800)}` : "",
    carolinaStrategy ? `ESTRATÉGIA (Carolina):\n${carolinaStrategy.slice(0, 600)}` : "",
  ].filter(Boolean).join("\n\n");

  // Claude Haiku builds the image prompt
  let finalPrompt = prompt;
  try {
    const haiku = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: "You are Isadora, a world-class Senior Art Director. Synthesize the brief into one precise image-generation prompt in English. Output ONLY the final prompt — no explanations, no labels.",
        messages: [{
          role: "user",
          content: `CLIENT: ${ctx.name ?? "unknown"} | INDUSTRY: ${ctx.industry ?? "unknown"} | BRAND COLOR: ${ctx.brandColor ?? "none"} | FORMAT: ${ratio} (${platformHint[ratio] ?? "social media"})

BRIEF: ${prompt}
${teamContext ? `\n${teamContext}` : ""}

Write one rich, detailed paragraph for image generation. End with: "no text, no logos, no watermarks, ultra high quality, 4K, sharp focus, award-winning editorial photography"`,
        }],
      }),
    });
    if (haiku.ok) {
      const haikuData = await haiku.json();
      const synthesized = haikuData.content?.[0]?.text?.trim();
      if (synthesized) finalPrompt = synthesized;
    }
  } catch {
    // fallback to original prompt
  }

  // Google Imagen 3 generates the image
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

  if (!imgRes.ok) throw new Error(`Imagen 3 error ${imgRes.status}: ${await imgRes.text()}`);

  const imgData = await imgRes.json();
  const prediction = imgData.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) throw new Error("Imagen 3 não retornou imagem");

  return {
    imageData: prediction.bytesBase64Encoded,
    mimeType: prediction.mimeType ?? "image/png",
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
      const { demand, clientContext, siteUrl } = body;
      if (!demand) {
        return new Response(JSON.stringify({ error: "demand é obrigatório" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const result = await orchestrate(demand, clientContext ?? {}, anthropicKey, siteUrl);
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

    const googleKey = Deno.env.get("GOOGLE_AI_API_KEY") ?? "";
    const result = await generateImage(prompt, aspectRatio, clientContext ?? {}, anthropicKey, googleKey, beatrizCopy, carolinaStrategy);
    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
