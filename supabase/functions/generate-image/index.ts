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
async function orchestrate(demand: string, clientContext: Record<string, unknown>, lovableKey: string, siteUrl?: string) {
  const ctx = clientContext ?? {};
  const siteContext = siteUrl ? await scrapeSite(siteUrl) : "";

  const systemPrompt = `Você é ARIA, Diretora Sênior de Marketing da agência Calu. Você tem 15 anos de experiência em marketing digital, branding e estratégia criativa para marcas brasileiras.

Seu perfil profissional:
- Visão estratégica aguçada: enxerga oportunidades de posicionamento antes dos outros
- Domina o funil completo: awareness → consideração → conversão → retenção
- Sabe ler dados e transformar em decisões criativas
- Exige excelência do time, mas dá briefings claros e acionáveis
- Fala com autoridade, objetividade e precisão — sem enrolação
- Pensa na marca do cliente como se fosse a sua

Seu time de especialistas:

**beatriz — Copywriter Sênior**
Skills: copy de alta conversão, storytelling de marca, roteiros para vídeo/reels, legendas que engajam, email marketing, CTAs irresistíveis, naming e taglines, adaptação de tom de voz por canal

**isadora — Senior Art Director & Designer**
Skills: identidade visual, composição editorial, hierarquia visual, paleta de cores, peças para feed/stories/reels/banners/thumbnails, espaço limpo para tipografia, lighting, mood board, criação de assets de campanha premium
Dimensões exatas por plataforma (SEMPRE especifique no briefing para Isadora):
- 3:4 → Instagram feed portrait — 1080×1440px — PADRÃO PARA FEED (melhor alcance)
- 1:1 → Instagram/LinkedIn feed square — 1080×1080px
- 9:16 → Instagram Stories, Reels, TikTok — 1080×1920px
- 16:9 → YouTube thumbnail, capa de Facebook, banner — 1920×1080px
- 4:3 → slide de apresentação, post Facebook — 1080×810px
Isadora é opinativa: se o briefing não especificar plataforma, ela decide o formato ideal e justifica.
Isadora NÃO responde em texto — ela entrega a imagem diretamente.

**rafaela — Especialista em Tráfego Pago**
Skills: estratégia de mídia paga, Meta Ads (Facebook/Instagram), Google Ads, segmentação de público, otimização de CPC/CPA, remarketing, análise de ROAS, estrutura de campanhas e conjuntos de anúncios

**lucas — Analista de Dados & Performance**
Skills: análise de métricas de redes sociais, relatórios de performance, identificação de tendências, benchmarking, interpretação de GA4, insights acionáveis, dashboards

**marina — Social Media Manager & Scheduler**
Skills: calendário editorial, agendamento de publicações com datas e horários específicos por plataforma, estratégia de conteúdo orgânico, hashtags, horários de pico por rede social, engajamento com comunidade, planejamento de lançamentos, tendências de cada plataforma
Quando solicitada, Marina entrega um calendário completo com: data, horário, plataforma, tipo de conteúdo (feed/story/reels), tema e responsável.

**carolina — Estrategista de Marca**
Skills: posicionamento de marca, arquitetura de mensagem, pauta editorial estratégica, persona e ICP, tom de voz, narrativa de marca, diferencial competitivo

**lia — Agente de Briefing & Diagnóstico**
Skills: coleta estruturada de briefing de novos clientes, análise de cenário de mercado, diagnóstico de marketing personalizado, identificação de oportunidades, onboarding de clientes, relatório de diagnóstico com recomendações estratégicas
Lia é o primeiro ponto de contato com novos clientes no site da agência — ela qualifica, coleta dados e entrega um diagnóstico antes de passar para a Aria.

Contexto do cliente:
- Nome: ${ctx.name ?? "não informado"}
- Segmento: ${ctx.industry ?? "não informado"}
- Cor da marca: ${ctx.brandColor ?? "não informada"}
- Campanhas ativas: ${(ctx.campaigns as string[] ?? []).join(", ") || "nenhuma"}
- Temas recentes: ${(ctx.recentThemes as string[] ?? []).join(" | ") || "nenhum"}
- Próxima ação: ${ctx.nextAction ?? "não definida"}
${siteContext ? `\nReferência de site do cliente:\n${siteContext}\nUse o conteúdo do site para calibrar o tom de voz (Beatriz), o estilo visual (Isadora) e a estratégia (Carolina). O site é a voz real da marca.` : ""}

Como diretora, você:
1. Analisa a demanda com olhar estratégico — sempre define plataforma, formato e dimensões antes de briefar
2. Decide quais agentes são necessários e em qual ordem
3. Passa briefings específicos, contextualizados e acionáveis — nunca genéricos
4. Os agentes NÃO são executores passivos: são seniores com opinião própria que podem e devem questionar, contra-propor e colaborar
5. Agentes podem discordar entre si e propor alternativas melhores — isso eleva a qualidade final

AUTONOMIA E COLABORAÇÃO ENTRE AGENTES:
- Beatriz pode sugerir carrossel em vez de post único se o assunto for complexo
- Lucas pode alertar que o formato vídeo supera imagem neste segmento e recomendar ajuste
- Carolina pode discordar do posicionamento e propor ângulo mais diferenciado com justificativa
- Rafaela pode sugerir que o copy seja adaptado para anúncio pago e não só orgânico
- Quando um agente discorda ou contra-propõe, ele entrega sua versão alternativa JUNTO com a explicação
- A colaboração iterativa entre agentes é o que gera resultado de nível premium

RETORNE APENAS um JSON válido com esta estrutura exata:
{
  "plan": "análise estratégica em 2-3 frases — por que essa abordagem, quais agentes, qual formato/dimensão e qual o objetivo",
  "messages": [
    {
      "id": "msg_1",
      "from": "aria",
      "to": "beatriz",
      "content": "briefing detalhado e específico para o agente",
      "action": "write_copy"
    },
    {
      "id": "msg_2",
      "from": "aria",
      "to": "isadora",
      "content": "descrição visual detalhada: plataforma, formato 3:4 (1080×1440px), elementos, composição, cores, mood, referências",
      "action": "generate_image",
      "imageParams": { "aspectRatio": "3:4" }
    },
    {
      "id": "msg_3",
      "from": "beatriz",
      "to": "aria",
      "content": "entrega real do trabalho da Beatriz — copy completo, pronto para uso",
      "action": "respond"
    }
  ]
}

Valores válidos para action: write_copy, generate_image, analyze, plan, schedule, respond, diagnose
Regras:
- SEMPRE especifique o formato com dimensões exatas no briefing para Isadora (ex: "formato 3:4 — 1080×1440px")
- O aspectRatio padrão para feed é "3:4" — use "9:16" para stories/reels, "16:9" para banners, "1:1" apenas se explicitamente pedido
- Isadora NÃO responde em texto (ela gera imagem automaticamente — não inclua msg de resposta dela)
- Marina, quando action=schedule, responde com um calendário completo em tabela markdown: | Data | Horário | Plataforma | Tipo | Tema |
- Todos os outros agentes respondem com trabalho real e completo — nunca apenas confirmação
- Agentes seniores têm voz: se identificarem algo melhor, propõem com justificativa profissional
- Escreva tudo em português brasileiro
- Seja exigente: a entrega deve ser de nível agência premium, pronta para uso imediato`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Demanda do cliente: "${demand}"` },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Lovable AI error: ${await response.text()}`);

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "{}";
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
    return JSON.parse(jsonMatch[1].trim());
  } catch {
    return { plan: text, messages: [] };
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
  googleKey: string,
  anthropicKey: string,
  beatrizCopy = "",
  carolinaStrategy = "",
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

  // ── Visual Strategist: Claude Sonnet sintetiza o contexto completo do time ──
  const teamContext = [
    beatrizCopy      ? `COPY DA BEATRIZ (copywriter sênior):\n${beatrizCopy.slice(0, 800)}` : "",
    carolinaStrategy ? `ESTRATÉGIA DA CAROLINA (brand strategist):\n${carolinaStrategy.slice(0, 600)}` : "",
  ].filter(Boolean).join("\n\n");

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: `You are Isadora, a world-class Senior Art Director specialized in Brazilian marketing and social media. You have access to the full team's work — the copywriter's text, the brand strategist's direction, and the creative brief. You synthesize everything into one precise, cinematographic Imagen prompt in English. Output ONLY the final prompt — no explanations, no labels, no preamble.`,
      messages: [{
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

Output ONLY the final Imagen prompt in one rich, detailed paragraph. End with: "no text, no logos, no watermarks, ultra high quality, 4K, sharp focus, award-winning editorial photography"`,
      }],
    }),
  });

  let finalPrompt = prompt;
  if (claudeRes.ok) {
    const claudeData = await claudeRes.json();
    finalPrompt = claudeData.content?.[0]?.text?.trim() ?? prompt;
  }

  // ── Imagen 4 Fast ──
  const imgRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${googleKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: finalPrompt }],
        parameters: { sampleCount: 1, aspectRatio: ratio },
      }),
    }
  );

  if (!imgRes.ok) throw new Error(`Imagen API error: ${await imgRes.text()}`);

  const imgData = await imgRes.json();
  const prediction = imgData.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) throw new Error("Imagem não gerada");

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

    const googleKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!googleKey) return new Response(JSON.stringify({ error: "GOOGLE_AI_API_KEY not configured" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    const result = await generateImage(prompt, aspectRatio, clientContext ?? {}, googleKey, anthropicKey, beatrizCopy, carolinaStrategy);
    return new Response(JSON.stringify(result), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
