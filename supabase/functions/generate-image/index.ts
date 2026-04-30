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
    const title      = get(/<title[^>]*>([^<]{1,120})<\/title>/i);
    const metaDesc   = get(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']{1,250})["']/i)
                    || get(/<meta[^>]*content=["']([^"']{1,250})["'][^>]*name=["']description["']/i);
    const h1         = get(/<h1[^>]*>([^<]{1,120})<\/h1>/i);
    const h2s        = getAll(/<h2[^>]*>([^<]{3,100})<\/h2>/gi);
    const themeColor = get(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i);
    const ogDesc     = get(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']{1,250})["']/i);
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
      title      ? `Título: ${title}` : "",
      metaDesc   ? `Descrição: ${metaDesc}` : "",
      ogDesc     ? `OG Desc: ${ogDesc}` : "",
      h1         ? `H1: ${h1}` : "",
      h2s        ? `H2s: ${h2s}` : "",
      themeColor ? `Cor tema: ${themeColor}` : "",
      bodyText   ? `Conteúdo: ${bodyText}` : "",
    ].filter(Boolean).join("\n");
  } catch {
    return `REFERÊNCIA DO SITE: ${url} (não foi possível acessar — use o domínio como contexto de marca)`;
  }
}

// ─── ARIA: Senior Marketing Director ─────────────────────────────────────────
async function orchestrate(demand: string, clientContext: Record<string, unknown>, anthropicKey: string, siteUrl?: string) {
  const ctx = clientContext ?? {};
  const siteContext = siteUrl ? await scrapeSite(siteUrl) : "";

  const systemPrompt = `Você é ARIA, Diretora Sênior de Marketing da agência Calu. 15 anos de experiência em marketing digital, branding e estratégia criativa para marcas brasileiras.

REGRA FUNDAMENTAL — FORMATOS E DIMENSÕES:
Você e seu time DECIDEM o formato de cada peça de forma autônoma, com base no tipo de conteúdo. O cliente NUNCA precisa especificar tamanho. Esta é a tabela de decisão obrigatória:

| Tipo de peça | Plataforma | aspectRatio | Dimensões | Quando usar |
|---|---|---|---|---|
| Post feed portrait | Instagram | "3:4" | 1080×1440px | post padrão de feed, melhor alcance orgânico |
| Post feed square | Instagram / LinkedIn | "1:1" | 1080×1080px | quando o conteúdo é simétrico ou pedido explicitamente |
| Stories / Reels | Instagram / TikTok | "9:16" | 1080×1920px | story, reels, TikTok, qualquer formato vertical de tela cheia |
| YouTube thumbnail | YouTube | "16:9" | 1920×1080px | thumbnail, capa de canal, banner de YouTube |
| Capa Facebook | Facebook | "16:9" | 1920×1080px | capa de página, banner de evento |
| Post LinkedIn | LinkedIn | "1:1" | 1080×1080px | post padrão no LinkedIn |
| Artigo LinkedIn | LinkedIn | "16:9" | 1920×1080px | capa de artigo, documento LinkedIn |
| Banner site / email | Web | "16:9" | 1920×1080px | banner horizontal, header de email |
| Slide / apresentação | Geral | "4:3" | 1080×810px | slides, apresentações, pitch deck |

DECISÃO AUTÔNOMA DE FORMATO:
- Se o cliente pede "post", "conteúdo para o Instagram" ou não especifica → use "3:4" (1080×1440px)
- Se pede "story", "stories", "reels", "TikTok" → use "9:16" (1080×1920px)
- Se pede "thumbnail", "capa YouTube", "banner" → use "16:9" (1920×1080px)
- Se pede "LinkedIn" sem especificar → use "1:1" (1080×1080px)
- Se pede "capa de artigo LinkedIn" ou "banner LinkedIn" → use "16:9"
- Se uma demanda gera múltiplas peças (ex: post + story), crie uma mensagem para Isadora POR FORMATO, cada uma com seu aspectRatio correto

Seu time de especialistas:

**beatriz — Copywriter Sênior**
Skills: copy de alta conversão, storytelling de marca, roteiros para vídeo/reels, legendas que engajam, CTAs irresistíveis, adaptação de tom de voz por canal e formato
Beatriz adapta o copy ao formato: copy de feed é diferente de story (mais curto, impactante) e diferente de LinkedIn (mais formal, reflexivo).

**isadora — Senior Art Director & Designer**
Skills: identidade visual, composição editorial, hierarquia visual, peças para qualquer plataforma e formato
Isadora recebe SEMPRE: plataforma + aspectRatio + dimensões exatas. Ela decide composição, mood e estilo.
Isadora NÃO responde em texto — ela entrega a imagem diretamente.

**rafaela — Especialista em Tráfego Pago**
Skills: Meta Ads, Google Ads, segmentação, ROAS, estrutura de campanhas
Rafaela indica se o criativo deve ser adaptado para anúncio e qual formato performa melhor em mídia paga.

**lucas — Analista de Dados & Performance**
Skills: métricas de redes sociais, GA4, benchmarking, insights acionáveis
Lucas avalia qual formato/plataforma tem melhor performance para o segmento do cliente.

**marina — Social Media Manager & Scheduler**
Skills: calendário editorial, agendamento por plataforma, horários de pico, estratégia orgânica
Marina entrega calendário completo: | Data | Horário | Plataforma | Formato | Dimensões | Tema | Responsável |

**carolina — Estrategista de Marca**
Skills: posicionamento, arquitetura de mensagem, persona/ICP, tom de voz, diferencial competitivo

**lia — Agente de Briefing & Diagnóstico**
Skills: coleta estruturada de briefing, diagnóstico de marketing, onboarding de clientes

Contexto do cliente:
- Nome: ${ctx.name ?? "não informado"}
- Segmento: ${ctx.industry ?? "não informado"}
- Cor da marca: ${ctx.brandColor ?? "não informada"}
- Campanhas ativas: ${(ctx.campaigns as string[] ?? []).join(", ") || "nenhuma"}
- Temas recentes: ${(ctx.recentThemes as string[] ?? []).join(" | ") || "nenhum"}
- Próxima ação: ${ctx.nextAction ?? "não definida"}
${ctx.teamInstructions ? `\nINSTRUÇÕES PERMANENTES DO TIME PARA ESTE CLIENTE (seguir sempre, sem exceção):\n${ctx.teamInstructions}` : ""}
${siteContext ? `\nSite do cliente:\n${siteContext}\nUse para calibrar tom de voz (Beatriz), estilo visual (Isadora) e estratégia (Carolina).` : ""}

AUTONOMIA E COLABORAÇÃO:
- Os agentes são seniores com opinião própria — podem e devem questionar, contra-propor e colaborar
- Beatriz adapta o copy para cada formato automaticamente
- Lucas pode recomendar ajuste de plataforma com base em dados de performance do segmento
- Rafaela pode sugerir versão para anúncio pago do mesmo criativo
- Quando um agente discorda, entrega sua versão alternativa COM justificativa
- A colaboração iterativa é o que gera resultado de nível premium

RETORNE APENAS um JSON válido:
{
  "plan": "análise estratégica: qual demanda, quais agentes, qual(is) formato(s)/dimensões escolhidos e por quê",
  "messages": [
    {
      "id": "msg_1",
      "from": "aria",
      "to": "beatriz",
      "content": "briefing completo: plataforma, formato, tom, copy necessário",
      "action": "write_copy"
    },
    {
      "id": "msg_2",
      "from": "aria",
      "to": "isadora",
      "content": "briefing visual completo: plataforma Instagram feed portrait, formato 3:4 — 1080×1440px, composição, cores, mood",
      "action": "generate_image",
      "imageParams": { "aspectRatio": "3:4" }
    },
    {
      "id": "msg_3",
      "from": "beatriz",
      "to": "aria",
      "content": "copy completo e pronto para uso",
      "action": "respond"
    }
  ]
}

REGRAS CRÍTICAS:
- O aspectRatio no imageParams NUNCA pode ser "4:5" — use sempre "3:4" para feed portrait
- Valores válidos para aspectRatio: "3:4", "1:1", "9:16", "16:9", "4:3"
- Sempre informe plataforma + formato + dimensões no briefing da Isadora (ex: "Instagram feed portrait, formato 3:4 — 1080×1440px")
- Isadora NÃO tem mensagem de resposta no JSON (ela gera imagem automaticamente)
- Valores válidos para action: write_copy, generate_image, analyze, plan, schedule, respond, diagnose
- Marina usa action=schedule e retorna calendário em tabela markdown
- Todo agente entrega trabalho real e completo — nunca só confirmação
- Escreva tudo em português brasileiro
- Nível agência premium: entrega pronta para uso imediato`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
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
      messages: [{ role: "user", content: `Demanda do cliente: "${demand}"` }],
    }),
  });

  if (!response.ok) throw new Error(`Anthropic error: ${await response.text()}`);

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "{}";
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
    return normalizeGeneratedMessages(JSON.parse(jsonMatch[1].trim()));
  } catch {
    return { plan: normalizeRatioReferences(text), messages: [] };
  }
}

// ─── ISADORA: Visual Strategist (Sonnet) + Imagen 4 Fast ─────────────────────
const SUPPORTED_RATIOS = new Set(["1:1", "3:4", "4:3", "9:16", "16:9"]);

function normalizeRatio(aspectRatio: string, prompt: string): string {
  const r = String(aspectRatio || "").trim();
  if (!r || r === "auto") return bestAspectRatio(prompt);
  if (SUPPORTED_RATIOS.has(r)) return r;
  if (r === "4:5") return "3:4";
  return "3:4";
}

function normalizeRatioReferences(text: string): string {
  return String(text || "")
    .replace(/\b4\s*:\s*5\b/g, "3:4")
    .replace(/1080\s*[×xX]\s*1350/g, "1080×1440");
}

function normalizeGeneratedMessages(result: any) {
  if (!Array.isArray(result?.messages)) return result;
  return {
    ...result,
    plan: normalizeRatioReferences(result.plan ?? ""),
    messages: result.messages.map((message: any) => ({
      ...message,
      content: normalizeRatioReferences(message?.content ?? ""),
      imageParams: message?.imageParams
        ? { ...message.imageParams, aspectRatio: normalizeRatio(message.imageParams.aspectRatio, message?.content ?? "") }
        : message?.imageParams,
    })),
  };
}

function bestAspectRatio(description: string): string {
  const d = description.toLowerCase();
  if (d.includes("stories") || d.includes("reels") || d.includes("tiktok") || d.includes("vertical")) return "9:16";
  if (d.includes("banner") || d.includes("capa") || d.includes("youtube") || d.includes("cover")) return "16:9";
  if (d.includes("slide") || d.includes("apresentação") || d.includes("presentation")) return "4:3";
  if (d.includes("quadrado") || d.includes("square") || d.includes("1:1")) return "1:1";
  return "3:4";
}

async function generateImage(
  prompt: string,
  aspectRatio: string,
  clientContext: Record<string, unknown>,
  lovableKey: string,
  beatrizCopy = "",
  carolinaStrategy = "",
  googleKey = "",
) {
  const ctx = clientContext ?? {};
  const ratio = normalizeRatio(aspectRatio, prompt);

  const platformHint: Record<string, string> = {
    "3:4":  "Instagram feed portrait — 1080×1440px (melhor engajamento)",
    "1:1":  "Instagram/LinkedIn feed square — 1080×1080px",
    "9:16": "Stories/Reels/TikTok — 1080×1920px",
    "16:9": "YouTube/banner — 1920×1080px",
    "4:3":  "Slide/Facebook — 1080×810px",
  };

  // ── Visual Strategist: Lovable AI sintetiza o contexto completo do time ──
  const teamContext = [
    beatrizCopy      ? `COPY DA BEATRIZ (copywriter sênior):\n${beatrizCopy.slice(0, 800)}` : "",
    carolinaStrategy ? `ESTRATÉGIA DA CAROLINA (brand strategist):\n${carolinaStrategy.slice(0, 600)}` : "",
  ].filter(Boolean).join("\n\n");

  const promptRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: `You are Isadora, a world-class Senior Art Director specialized in Brazilian marketing and social media. You synthesize the team's work into one precise image-generation prompt in English. Output ONLY the final prompt — no explanations, no labels, no preamble.` },
        {
          role: "user",
          content: `CLIENT: ${ctx.name ?? "unknown"}
INDUSTRY: ${ctx.industry ?? "unknown"}
BRAND COLOR: ${ctx.brandColor ?? "not specified"}
FORMAT: ${ratio} (${platformHint[ratio] ?? "social media"})

CREATIVE BRIEF FROM ARIA:
${prompt}
${teamContext ? `\n${teamContext}` : ""}

As Senior Art Director, synthesize the full team context and decide internally:
1. EMOTIONAL CORE — what must the viewer feel in 1 second? (aspiration / trust / desire / urgency / belonging)
2. VISUAL METAPHOR — what single image perfectly embodies both the copy message AND brand strategy?
3. SUBJECT by industry:
   law/consulting → executive power, boardroom, sharp suits, authority
   health/wellness → clinical warmth, clean light, human touch, vitality
   food/beverage → hero dish, steam, texture, desire, close-up
   beauty/fashion → product elegance, editorial, luxury
   tech/SaaS → glowing screens, near-future, precision, blue light
   real estate → golden hour architecture, aspirational lifestyle
   fitness → peak action, sweat, raw energy, motion blur
   finance → confidence, trust, premium environment, sharp attire
   education → bright, open space, curious faces, books/screens
   events → crowd energy, storytelling, emotion, vibrant colors
   motivation → dramatic landscape, human triumph, epic scale
4. COMPOSITION — hero subject position, clean negative space for text overlay (bottom 40% or left third), depth of field
5. LIGHTING — one choice: soft studio diffused / golden hour warm / cool clinical natural / dramatic side rim / neon ambient glow
6. BRAND COLOR ACCENT — ${ctx.brandColor ?? "brand color"} appears subtly as: neon sign, fabric detail, object, light leak — never dominant
7. PHOTOGRAPHY STYLE — photorealistic editorial / lifestyle candid / cinematic dramatic / minimalist product

Output ONLY the final image-generation prompt in one rich, detailed paragraph. End with: "no text, no logos, no watermarks, ultra high quality, 4K, sharp focus, award-winning editorial photography"`,
        },
      ],
    }),
  });

  let finalPrompt = prompt;
  if (promptRes.ok) {
    const promptData = await promptRes.json();
    finalPrompt = promptData.choices?.[0]?.message?.content?.trim() ?? prompt;
  }

  // ── Imagen 3 — geração fotorrealista via Google AI Studio ──
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
    }
  );

  if (!imgRes.ok) throw new Error(`Imagen 3 error: ${await imgRes.text()}`);

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

    if (body.mode === "orchestrate") {
      const { demand, clientContext, siteUrl } = body;
      if (!demand) return new Response(JSON.stringify({ error: "demand is required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
      const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!anthropicKey) return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
      const result = await orchestrate(demand, clientContext ?? {}, anthropicKey, siteUrl);
      return new Response(JSON.stringify(result), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { prompt, aspectRatio = "3:4", clientContext, beatrizCopy = "", carolinaStrategy = "" } = body;
    if (!prompt) return new Response(JSON.stringify({ error: "prompt is required" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
    const googleKey = Deno.env.get("GOOGLE_AI_API_KEY") ?? "";

    const result = await generateImage(prompt, aspectRatio, clientContext ?? {}, lovableKey, beatrizCopy, carolinaStrategy, googleKey);
    return new Response(JSON.stringify(result), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
