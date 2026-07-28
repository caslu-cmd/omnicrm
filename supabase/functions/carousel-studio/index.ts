import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "claude-opus-5";

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// ── Anthropic call with structured output + graceful degradation ──────────
async function callClaude(opts: {
  apiKey: string;
  system: string;
  user: string;
  schema?: Record<string, unknown>;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<string> {
  const { apiKey, system, user, schema, effort = "medium", maxTokens = 16000 } = opts;

  const outputConfig: Record<string, unknown> = { effort };
  if (schema) outputConfig.format = { type: "json_schema", schema };

  const buildBody = (withFallback: boolean) => {
    const body: Record<string, unknown> = {
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
      output_config: outputConfig,
    };
    if (withFallback) body.fallbacks = "default";
    return JSON.stringify(body);
  };

  const buildHeaders = (withFallback: boolean) => {
    const h: Record<string, string> = {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    };
    if (withFallback) h["anthropic-beta"] = "server-side-fallback-2026-07-01";
    return h;
  };

  // Tenta com fallback server-side ligado; se a conta não tiver o beta, repete sem.
  for (const withFallback of [true, false]) {
    let res: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1200 * attempt));
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: buildHeaders(withFallback),
        body: buildBody(withFallback),
      });
      if (r.status === 429 || r.status === 500 || r.status === 529) continue;
      res = r;
      break;
    }
    if (!res) throw new Error("Claude indisponível (sobrecarga). Tente novamente.");

    if (!res.ok) {
      const err = await res.text();
      // Beta indisponível para a conta → tenta de novo sem o parâmetro de fallback.
      if (withFallback && res.status === 400 && /fallback|beta/i.test(err)) continue;
      throw new Error(`Claude ${res.status}: ${err.slice(0, 400)}`);
    }

    const data = await res.json();
    if (data.stop_reason === "refusal") {
      throw new Error("O pedido foi recusado pelos filtros de segurança. Reformule o tema.");
    }
    const text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
    if (!text) throw new Error("Claude retornou resposta vazia.");
    return text;
  }

  throw new Error("Não foi possível falar com o Claude.");
}

function parseJson<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as T;
    throw new Error("Resposta da IA não veio em JSON válido.");
  }
}

// ── Schemas ───────────────────────────────────────────────────────────────
const SLIDE_SCHEMA = {
  type: "object",
  properties: {
    tipo: { type: "string", enum: ["capa", "conteudo", "cta"] },
    titulo: { type: "string" },
    corpo: { type: "string" },
    destaque: { type: "string" },
    prompt_imagem: { type: "string" },
  },
  required: ["tipo", "titulo", "corpo", "destaque", "prompt_imagem"],
  additionalProperties: false,
};

const STRATEGY_SCHEMA = {
  type: "object",
  properties: {
    titulo_projeto: { type: "string" },
    angulo: { type: "string" },
    slides: { type: "array", items: SLIDE_SCHEMA },
    legenda: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
    dica_visual: { type: "string" },
    melhor_horario: { type: "string" },
  },
  required: ["titulo_projeto", "angulo", "slides", "legenda", "hashtags", "dica_visual", "melhor_horario"],
  additionalProperties: false,
};

const DIRECAO_SCHEMA = {
  type: "object",
  properties: {
    direcoes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: { type: "string" },
          referencia: { type: "string" },
          porque: { type: "string" },
          layout: { type: "string", enum: ["editorial", "impacto", "revista", "gradiente", "minimal", "foto"] },
          fonte: {
            type: "string",
            enum: ["editorial", "impacto", "moderno", "tecnico", "manchete", "esportivo", "luxo",
                   "revista", "boutique", "startup", "corporativo", "fino", "brutalista",
                   "geometrico", "classico", "codigo"],
          },
          bg: { type: "string" },
          fg: { type: "string" },
          accent: { type: "string" },
        },
        required: ["nome", "referencia", "porque", "layout", "fonte", "bg", "fg", "accent"],
        additionalProperties: false,
      },
    },
  },
  required: ["direcoes"],
  additionalProperties: false,
};

const IDEAS_SCHEMA = {
  type: "object",
  properties: {
    ideias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tema: { type: "string" },
          gancho: { type: "string" },
          formato: { type: "string" },
          porque: { type: "string" },
        },
        required: ["tema", "gancho", "formato", "porque"],
        additionalProperties: false,
      },
    },
  },
  required: ["ideias"],
  additionalProperties: false,
};

// ── Prompt base ───────────────────────────────────────────────────────────
const BASE_SYSTEM = `Você é MARCELA, diretora de conteúdo sênior de uma agência brasileira premiada.
Você escreve carrosséis e posts únicos para Instagram e LinkedIn que param o scroll, ensinam de verdade e vendem sem soar vendedor.

REGRAS INEGOCIÁVEIS DE COPY:
1. NADA de linguagem genérica de IA. Proibido: "no mundo de hoje", "cada vez mais", "revolucionário", "descubra o poder", "não é segredo que", "prepare-se para", "mergulhe", "desbloqueie", "elevar", "jornada".
2. O primeiro slide (capa) é 90% do resultado. Gancho concreto e específico: número, contradição, erro caro, pergunta que dói, ou promessa mensurável. Máximo 8 palavras no título da capa.
3. Um slide = uma ideia. Nada de listas dentro do slide. Se o slide precisa de duas frases, são duas frases curtas.
4. Use exemplos, números e situações reais do nicho. Se você não tem o dado, use uma situação concreta e verificável, nunca uma estatística inventada.
5. Português brasileiro falado, frases curtas, voz ativa, segunda pessoa ("você"). Zero jargão corporativo.
6. Sem emoji dentro dos slides (o design é limpo). Emoji só é permitido na legenda, e no máximo 3.
7. O último slide é CTA específico e de baixo atrito. Nada de "siga para mais conteúdo". Diga exatamente o que fazer e o que a pessoa ganha.

LIMITES TÉCNICOS DE DESIGN (o texto é renderizado em canvas, respeite ou quebra o layout):
- titulo: máximo 58 caracteres (capa: máximo 42).
- corpo: máximo 190 caracteres. Pode ter no máximo 2 frases.
- destaque: 1 a 3 palavras OU um número curto (ex.: "3 de 4", "R$ 12 mil", "48h"). É a palavra que vira gráfico no slide. Nunca repita o título inteiro.
- prompt_imagem: prompt EM INGLÊS para gerador de imagem. O padrão que funciona no Instagram é FOTO REALISTA DE PESSOA — o profissional do nicho, o cliente ideal, ou alguém vivendo a situação do slide. Descreva: quem é a pessoa (idade aproximada, aparência brasileira, roupa coerente com o nicho), a expressão, o cenário e a luz. Composição com a pessoa de um lado e ESPAÇO VAZIO do outro/embaixo, porque o texto entra por cima. Sem nenhum texto na imagem, sem logotipos, sem pessoas famosas, sem colagem. Quando a ideia do slide for abstrata demais para uma pessoa, use objeto ou cena real do dia a dia do nicho — nunca ilustração genérica de banco de imagem. Sempre termine com: "shot on 85mm, editorial photography, natural skin texture, cinematic lighting, shallow depth of field, negative space for text".

LEGENDA:
- Abre com uma linha que repete o gancho de outro jeito, desenvolve em 3 a 6 linhas curtas com quebra de linha dupla, e fecha com o CTA + pergunta para comentário.
- hashtags: 12 a 18, mistura de nicho específico, nicho amplo e branded. Sem "#", só a palavra.`;

// ── Handler ───────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return respond({ error: "ANTHROPIC_API_KEY não configurada no Supabase." }, 500);

    const body = await req.json();
    const action: string = body.action ?? "strategy";

    const cliente = body.cliente ?? {};
    const marca = [
      cliente.nome ? `Marca: ${cliente.nome}` : "",
      cliente.segmento ? `Segmento: ${cliente.segmento}` : "",
      cliente.publico ? `Público: ${cliente.publico}` : "",
      cliente.tom ? `Tom de voz: ${cliente.tom}` : "",
      cliente.diferenciais ? `Diferenciais: ${cliente.diferenciais}` : "",
      cliente.oferta ? `Oferta/produto: ${cliente.oferta}` : "",
    ].filter(Boolean).join("\n");

    // ── Ideias de pauta ────────────────────────────────────────────────
    // ── Diretor de arte: 3 direções com referência real do segmento ────
    if (action === "direcao") {
      const segmento = cliente.segmento || body.nicho || "negócios";
      const raw = await callClaude({
        apiKey,
        system: `Você é o diretor de arte de uma agência brasileira que compete com Pentagram, Wieden+Kennedy e Porto Rocha.
Seu trabalho aqui: olhar o segmento do cliente, lembrar de como as MARCAS E AGÊNCIAS DE REFERÊNCIA REAIS daquele mercado tratam identidade visual, e traduzir isso em uma direção aplicável.

REGRAS:
1. "referencia" cita marcas ou agências REAIS e reconhecíveis daquele segmento (ou de segmento vizinho, quando o mercado é visualmente pobre) e diz o que se rouba de cada uma. Nunca invente marca.
2. As 3 direções precisam ser REALMENTE diferentes entre si — não três variações da mesma ideia. Uma segura e alinhada ao mercado, uma contemporânea, uma que quebra o padrão do segmento.
3. Cores em hex. bg é o fundo, fg é o texto principal (contraste alto e legível sobre bg — verifique isso), accent é a cor de destaque (precisa brigar com o bg, nunca ser quase igual).
4. Nada de roxo-degradê-em-fundo-branco, nada de "corporativo azul genérico" a não ser que o segmento realmente peça e você justifique.
5. "porque" tem no máximo 2 linhas e fala de negócio, não de estética: o que essa direção comunica para ESSE público.
6. Escolha layout e fonte da lista fechada, coerentes entre si: serifada + revista/minimal para autoridade; condensada + impacto para volume e urgência; grotesk + editorial/gradiente para tecnologia.`,
        schema: DIRECAO_SCHEMA,
        effort: "high",
        maxTokens: 8000,
        user: `${marca ? marca + "

" : ""}SEGMENTO: ${segmento}
${body.tema ? `CONTEÚDO QUE VAI SER DESENHADO: ${body.tema}` : ""}
${body.corMarca ? `COR ATUAL DA MARCA: ${body.corMarca} (pode manter, ajustar ou contrariar — se contrariar, justifique)` : ""}
${body.benTrends ? `
O QUE ESTÁ EM ALTA NESSE SEGMENTO AGORA:
${String(body.benTrends).slice(0, 2000)}` : ""}

Entregue 3 direções de arte para os carrosséis desta marca.`,
      });
      return respond({ success: true, ...parseJson(raw) });
    }

    if (action === "ideias") {
      const nicho = body.nicho ?? cliente.segmento ?? "marketing digital";
      const raw = await callClaude({
        apiKey,
        system: BASE_SYSTEM,
        schema: IDEAS_SCHEMA,
        effort: "low",
        maxTokens: 8000,
        user: `${marca ? marca + "\n\n" : ""}Gere 8 pautas de carrossel para o nicho: ${nicho}.
${body.benTrends ? `\nTENDÊNCIAS DO BEN (o que está em alta agora nesse segmento — priorize o que for aproveitável):\n${String(body.benTrends).slice(0, 3000)}` : ""}
${Array.isArray(body.historico) && body.historico.length ? `\nJÁ PUBLICADO por esta marca (NÃO repita nenhum desses):\n${body.historico.slice(0, 15).map((h: string, i: number) => `${i + 1}. ${h}`).join("\n")}` : ""}
${body.contexto ? `\nContexto extra:\n${String(body.contexto).slice(0, 3000)}` : ""}
Cada pauta precisa ser específica o suficiente para virar um carrossel inteiro (nada de "dicas de marketing"). O campo "gancho" é o título da capa, máximo 8 palavras.`,
      });
      return respond({ success: true, ...parseJson(raw) });
    }

    // ── Reescrever um slide ────────────────────────────────────────────
    if (action === "slide") {
      const raw = await callClaude({
        apiKey,
        system: BASE_SYSTEM,
        schema: SLIDE_SCHEMA,
        effort: "low",
        maxTokens: 4000,
        user: `${marca ? marca + "\n\n" : ""}Tema do carrossel: ${body.tema ?? "—"}
Slide atual (posição ${body.posicao ?? "?"} de ${body.total ?? "?"}, tipo ${body.tipo ?? "conteudo"}):
título: ${body.titulo ?? ""}
corpo: ${body.corpo ?? ""}

Instrução da Carol: ${body.instrucao ?? "melhore mantendo a mesma ideia, deixe mais concreto e mais curto"}

Reescreva este slide. Mantenha o tipo "${body.tipo ?? "conteudo"}" e respeite todos os limites de caracteres.`,
      });
      return respond({ success: true, slide: parseJson(raw) });
    }

    // ── Estratégia completa (carrossel ou post único) ──────────────────
    const formato: string = body.formato === "post" ? "post" : "carrossel";
    const nSlides: number = formato === "post"
      ? 1
      : Math.min(10, Math.max(4, Number(body.nSlides) || 7));
    const objetivo: string = body.objetivo ?? "autoridade";
    const tema: string = String(body.tema ?? "").trim();
    if (!tema) return respond({ error: "Informe o tema do conteúdo." }, 400);

    const objetivoGuia: Record<string, string> = {
      autoridade: "Provar domínio do assunto. Entregue um insight que só quem vive o dia a dia do nicho teria. CTA: salvar/compartilhar.",
      educar: "Ensinar um processo passo a passo aplicável hoje. Cada slide é um passo com o 'como', não só o 'o quê'. CTA: aplicar e comentar o resultado.",
      vender: "Levar à conversão sem parecer anúncio. Comece pelo problema caro, mostre o custo de não resolver, e só no fim conecte com a oferta. CTA: ação comercial clara.",
      engajar: "Provocar resposta. Use contradição, opinião forte ou erro comum que o público comete. CTA: pergunta que dá vontade de responder.",
      lancamento: "Criar antecipação. Amarre problema → nova solução → prova → data/próximo passo. CTA: garantir vaga/avisar.",
    };

    const estrutura = formato === "post"
      ? `Gere EXATAMENTE 1 slide, tipo "capa". Ele precisa funcionar sozinho: gancho no título, a ideia inteira no corpo e a promessa no destaque.`
      : `Gere EXATAMENTE ${nSlides} slides nesta ordem:
- slide 1: tipo "capa" (só o gancho + uma linha de contexto no corpo)
- slides 2 a ${nSlides - 1}: tipo "conteudo" (progressão lógica, sem repetir ideia, cada um entrega algo aplicável)
- slide ${nSlides}: tipo "cta"
A sequência precisa ter arco: dor/tensão → virada → método → prova → próximo passo. O slide 2 nunca começa com "primeiro" ou "vamos falar sobre".`;

    const historico: string[] = Array.isArray(body.historico) ? body.historico.filter(Boolean).map(String) : [];

    const contextos = [
      historico.length
        ? `MEMÓRIA DESTA MARCA — conteúdos que ela JÁ publicou:\n${historico.slice(0, 15).map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\nRegra: não repita nenhum desses ângulos nem reescreva o mesmo gancho. Se o tema pedido encostar num deles, ataque por um ângulo novo e trate o conteúdo como continuação (pode referenciar o anterior). Mantenha a mesma voz.`
        : "",
      body.benTrends ? `TENDÊNCIAS DO BEN (use o que for realmente relevante, não force):\n${String(body.benTrends).slice(0, 3500)}` : "",
      body.estrategia ? `ESTRATÉGIA DO CLIENTE:\n${String(body.estrategia).slice(0, 2500)}` : "",
      body.briefing ? `BRIEFING:\n${String(body.briefing).slice(0, 2500)}` : "",
      body.referencia ? `REFERÊNCIA/MATERIAL DE APOIO:\n${String(body.referencia).slice(0, 4000)}` : "",
    ].filter(Boolean).join("\n\n---\n\n");

    const raw = await callClaude({
      apiKey,
      system: BASE_SYSTEM,
      schema: STRATEGY_SCHEMA,
      effort: "high",
      maxTokens: 16000,
      user: `${marca ? marca + "\n\n" : ""}TEMA: ${tema}
FORMATO: ${formato === "post" ? "post único (imagem única de feed)" : `carrossel de ${nSlides} slides`}
OBJETIVO: ${objetivo} — ${objetivoGuia[objetivo] ?? objetivoGuia.autoridade}
PLATAFORMA: ${body.plataforma ?? "Instagram"}
${body.publico ? `PÚBLICO: ${body.publico}` : ""}
${body.tom ? `TOM: ${body.tom}` : ""}

${estrutura}

${contextos ? `\n${contextos}\n` : ""}
Também entregue:
- "angulo": em uma frase, qual é o ângulo estratégico escolhido e por que ele funciona para esse público.
- "legenda": legenda pronta para publicar.
- "hashtags": lista sem o símbolo #.
- "dica_visual": uma orientação curta de direção de arte para esse conteúdo específico.
- "melhor_horario": melhor dia e horário para publicar esse conteúdo nesse nicho, com uma justificativa de meia linha.`,
    });

    const parsed = parseJson<{ slides: unknown[] }>(raw);
    if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) {
      return respond({ error: "A IA não retornou slides. Tente de novo." }, 502);
    }

    return respond({ success: true, ...parsed });
  } catch (e) {
    console.error("carousel-studio error:", e);
    return respond({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
