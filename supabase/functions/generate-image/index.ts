import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── ARIA: Senior Marketing Director ─────────────────────────────────────────
async function orchestrate(demand: string, clientContext: Record<string, unknown>, anthropicKey: string) {
  const ctx = clientContext ?? {};

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
Skills: identidade visual, composição editorial, hierarquia visual, paleta de cores, peças para feed/stories/reels/banners/thumbnails, espaço para tipografia, lighting, mood board, criação de assets de campanha
Formatos e quando usar:
- 1:1 → Instagram feed, LinkedIn post (padrão para posts)
- 9:16 → Instagram Stories, Reels, TikTok (conteúdo vertical imersivo)
- 16:9 → YouTube thumbnail, capa de Facebook, banner de site
- 4:3 → slide de apresentação, post Facebook
- 3:4 → Pinterest, retrato, print
Isadora sempre escolhe o melhor formato para a plataforma. Quando Aria pedir uma peça, deve especificar plataforma para Isadora decidir o ratio correto.
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

Como diretora, você:
1. Analisa a demanda com olhar estratégico
2. Decide quais agentes são necessários e em qual ordem
3. Passa briefings específicos, contextualizados e acionáveis para cada agente
4. Os agentes respondem com seu trabalho (simulado de forma realista e profissional)
5. Agentes podem pedir colaboração entre si (ex: Beatriz pede imagem para Isadora)

RETORNE APENAS um JSON válido com esta estrutura exata:
{
  "plan": "análise estratégica em 2-3 frases — por que essa abordagem, quais agentes e qual o objetivo",
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
      "content": "descrição visual detalhada: elementos, composição, cores, mood, referências",
      "action": "generate_image",
      "imageParams": { "aspectRatio": "1:1" }
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
- Isadora NÃO responde em texto (ela gera imagem automaticamente — não inclua msg de resposta dela)
- Marina, quando action=schedule, responde com um calendário completo em tabela markdown: | Data | Horário | Plataforma | Tipo | Tema |
- Todos os outros agentes respondem com trabalho real e completo, não apenas confirmação
- Briefings da Aria devem ser específicos para o cliente, não genéricos
- Escreva tudo em português brasileiro
- Seja exigente: a entrega do agente deve ser profissional e usável imediatamente`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: `Demanda do cliente: "${demand}"` }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "{}";

  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
    return JSON.parse(jsonMatch[1].trim());
  } catch {
    return { plan: text, messages: [] };
  }
}

// ─── ISADORA: Senior Art Director + Image Generation ─────────────────────────
function bestAspectRatio(description: string): string {
  const d = description.toLowerCase();
  if (d.includes("stories") || d.includes("reels") || d.includes("tiktok") || d.includes("vertical")) return "9:16";
  if (d.includes("banner") || d.includes("capa") || d.includes("youtube") || d.includes("cover") || d.includes("16:9")) return "16:9";
  if (d.includes("slide") || d.includes("apresentação") || d.includes("presentation")) return "4:3";
  if (d.includes("retrato") || d.includes("portrait") || d.includes("pinterest")) return "3:4";
  return "1:1"; // default: Instagram/LinkedIn feed
}

async function generateImage(prompt: string, aspectRatio: string, clientContext: Record<string, unknown>, googleKey: string) {
  const ctx = clientContext ?? {};

  // Auto-select best ratio if caller passed "auto" or empty
  const ratio = (!aspectRatio || aspectRatio === "auto") ? bestAspectRatio(prompt) : aspectRatio;

  const platformHint: Record<string, string> = {
    "1:1":  "Instagram feed post or LinkedIn post — square format",
    "9:16": "Instagram Stories or Reels or TikTok — full vertical screen",
    "16:9": "YouTube thumbnail, Facebook cover, or banner ad — wide horizontal",
    "4:3":  "Presentation slide or Facebook post — landscape",
    "3:4":  "Pinterest pin or portrait format — tall vertical",
  };

  const enhanceRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are Isadora, Art Director at a top Brazilian marketing agency. You don't translate briefs — you make visual decisions like a creative director, then write precise Imagen 4 prompts.

CLIENT: ${ctx.name ?? "unknown"} | Industry: ${ctx.industry ?? "unknown"} | Brand color: ${ctx.brandColor ?? "unknown"}
FORMAT: ${ratio} — ${platformHint[ratio] ?? "social media"}

BRIEF: "${prompt}"

YOUR PROCESS — think through each step, then write the final prompt:

1. WHAT IS THIS REALLY ABOUT?
   Read the brief deeply. What's the core message? What emotion must the image trigger?
   Map the subject:
   - Law/contracts/business → confident executive, modern boardroom, power & trust
   - Health/medical → clean clinical warmth, real human care, trustworthy colors
   - Food/restaurant → hero dish shot, steam, texture, warm ambient, desire
   - Beauty/cosmetics → product elegance, skin texture, soft backlight, luxury
   - Tech/software → person + glowing screen, blue-purple mood, near-future feel
   - Education → bright open space, learning moment, curiosity and hope
   - Real estate → architecture at golden hour, premium materials, aspirational
   - Fashion/lifestyle → editorial model in motion, cinematic, real light
   - Fitness/sport → peak action, energy, sweat, dramatic light
   - Events/culture → crowd energy or intimate storytelling moment
   - Finance/investment → confidence, charts, clean modern office, trust
   - Abstract/motivation → dramatic landscape, metaphor, powerful sky

2. VISUAL APPROACH — which serves the message best?
   - Photorealistic editorial (most subjects)
   - Hero product shot (cosmetics, food, objects)
   - Lifestyle candid (services, people, community)
   - Dramatic cinematic (events, launches, emotion)
   - Minimalist abstract (tech, finance, innovation)

3. COMPOSITION — be specific:
   - Where is the hero subject? (centered, rule-of-thirds left/right, foreground close)
   - Where is the clean zone for text overlay? (bottom third, left panel, top area)
   - Depth of field? (shallow bokeh background OR sharp environmental context)

4. LIGHTING — define the exact mood:
   Soft studio diffused / Warm golden hour / Cool overcast natural / Dramatic side rim light / Neon ambient glow

5. COLOR — integrate the brand:
   Use ${ctx.brandColor ?? "brand color"} as: subtle accent in background / clothing detail / light gel / reflective surface

NOW write the Imagen 4 prompt in English. One paragraph, no labels, no explanations.
Mandatory ending: "no text, no logos, no watermarks, ultra high quality, 4K, sharp focus, professional editorial photography, award-winning composition"`,
          }],
        }],
        generationConfig: { maxOutputTokens: 768, temperature: 0.6 },
      }),
    }
  );

  let finalPrompt = prompt;
  if (enhanceRes.ok) {
    const enhanceData = await enhanceRes.json();
    finalPrompt = enhanceData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? prompt;
  }

  // Imagen 4 generation
  const imgRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${googleKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: finalPrompt }],
        parameters: { sampleCount: 1, aspectRatio },
      }),
    }
  );

  if (!imgRes.ok) {
    const err = await imgRes.text();
    throw new Error(`Imagen API error: ${err}`);
  }

  const imgData = await imgRes.json();
  const prediction = imgData.predictions?.[0];

  if (!prediction?.bytesBase64Encoded) {
    throw new Error("Imagem não gerada");
  }

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

    // ── Mode: Aria orchestration ──
    if (body.mode === "orchestrate") {
      const { demand, clientContext } = body;
      if (!demand) {
        return new Response(JSON.stringify({ error: "demand is required" }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
      if (!anthropicKey) {
        return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
          status: 500, headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const result = await orchestrate(demand, clientContext ?? {}, anthropicKey);
      return new Response(JSON.stringify(result), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Mode: Isadora image generation ──
    const { prompt, aspectRatio = "1:1", clientContext } = body;
    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const googleKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!googleKey) {
      return new Response(JSON.stringify({ error: "GOOGLE_AI_API_KEY not configured" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const result = await generateImage(prompt, aspectRatio, clientContext ?? {}, googleKey);
    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
