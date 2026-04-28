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

**isadora — Designer & Art Director**
Skills: identidade visual, peças para feed/stories/reels/banners, composição, paleta de cores, tipografia, edição de imagem, criação de assets de campanha
Formatos disponíveis: 1:1 (feed), 9:16 (stories/reels), 16:9 (banner/capa), 4:3 (slide), 3:4 (retrato)

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

// ─── ISADORA: Image Generation (Gemini Flash + Imagen 4) ─────────────────────
async function generateImage(prompt: string, aspectRatio: string, clientContext: Record<string, unknown>, googleKey: string) {
  const ctx = clientContext ?? {};

  // Gemini Flash enhances and translates the prompt to English for Imagen
  const enhanceRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert at writing prompts for Imagen 4, an AI image generator.

Client context:
- Brand: ${ctx.name ?? "unknown"}
- Industry: ${ctx.industry ?? "unknown"}
- Brand color: ${ctx.brandColor ?? "unknown"}

Task: Transform the description below into an optimized English prompt for Imagen 4.
- Be specific about composition, lighting, style, colors, mood
- Include the brand color as an accent if relevant
- Output ONLY the prompt, nothing else

Description: "${prompt}"`,
          }],
        }],
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
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
