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

// ── Claude com saída estruturada e degradação suave ──────────────────────
async function callClaude(opts: {
  apiKey: string;
  system: string;
  user: string;
  /** Blocos prontos (texto + imagem) quando a chamada precisa de visão. */
  userContent?: unknown[];
  schema?: Record<string, unknown>;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}): Promise<string> {
  const { apiKey, system, user, userContent, schema, effort = "medium", maxTokens = 16000 } = opts;

  const outputConfig: Record<string, unknown> = { effort };
  if (schema) outputConfig.format = { type: "json_schema", schema };

  const buildBody = (withFallback: boolean) => {
    const body: Record<string, unknown> = {
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent ?? user }],
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

  // Tenta com fallback server-side; se a conta não tiver o beta, repete sem.
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

// ── Schemas ──────────────────────────────────────────────────────────────
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
          layout: {
            type: "string",
            enum: ["vidro", "capa", "editorial", "impacto", "revista", "gradiente", "minimal", "foto"],
          },
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

// ── Contraste garantido nas direções de arte ─────────────────────────────
// O modo automático aplica a PRIMEIRA direção sem ninguém olhar, e o Opus
// escolhe cor por intenção estética (verde da marca sobre vermelho de alerta,
// por exemplo). Pedir contraste no prompt não resolve: modelo de linguagem não
// calcula WCAG. Então medimos aqui e corrigimos o mínimo necessário, mantendo
// a INTENÇÃO da direção (mesma matiz, só a luminosidade muda).
// <<contraste>>
type Rgb = [number, number, number];

function lerHex(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex ?? "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
}

function paraHex([r, g, b]: Rgb): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function luminancia([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function contraste(a: Rgb, b: Rgb): number {
  const [alta, baixa] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (alta + 0.05) / (baixa + 0.05);
}

function paraHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rn
    ? ((gn - bn) / d + (gn < bn ? 6 : 0))
    : max === gn
    ? (bn - rn) / d + 2
    : (rn - gn) / d + 4;
  return [h / 6, s, l];
}

function deHsl([h, s, l]: [number, number, number]): Rgb {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const canal = (t: number) => {
    let v = t;
    if (v < 0) v += 1;
    if (v > 1) v -= 1;
    if (v < 1 / 6) return p + (q - p) * 6 * v;
    if (v < 1 / 2) return q;
    if (v < 2 / 3) return p + (q - p) * (2 / 3 - v) * 6;
    return p;
  };
  return [canal(h + 1 / 3) * 255, canal(h) * 255, canal(h - 1 / 3) * 255];
}

/**
 * Move a luminosidade da cor (matiz e saturação intactas) até bater o contraste
 * mínimo com o fundo. `sentido` +1 só clareia, -1 só escurece, 0 aceita os dois
 * e fica com a mudança menor. Devolve null quando aquele caminho não alcança.
 */
function moverLuz(cor: Rgb, fundo: Rgb, minimo: number, sentido: -1 | 0 | 1): Rgb | null {
  if (contraste(cor, fundo) >= minimo) return cor;
  const [h, s, l] = paraHsl(cor);
  for (let passo = 0.02; passo <= 1.0001; passo += 0.02) {
    const alvos = sentido === 1 ? [l + passo] : sentido === -1 ? [l - passo] : [l + passo, l - passo];
    for (const alvo of alvos) {
      if (alvo < 0 || alvo > 1) continue;
      const tentativa = deHsl([h, s, alvo]);
      if (contraste(tentativa, fundo) >= minimo) return tentativa;
    }
  }
  return null;
}

/** fg é texto corrido (AA = 4.5:1); accent vira número gigante, tarja e ponto (3:1). */
const MIN_FG = 4.5;
const MIN_ACCENT = 3;

function garantirContraste<T extends { bg: string; fg: string; accent: string }>(
  direcoes: T[],
): Array<T & { ajuste_contraste?: string }> {
  return (direcoes ?? []).map((dir) => {
    const bgOriginal = lerHex(dir.bg), fg = lerHex(dir.fg), accent = lerHex(dir.accent);
    if (!bgOriginal || !fg || !accent) return dir;

    const notas: string[] = [];
    let bgFinal = bgOriginal, fgFinal = fg;

    // A polaridade é a decisão de design (texto claro sobre fundo escuro, ou o
    // contrário). Preservá-la vale mais que economizar ajuste: um creme sobre
    // vermelho virando preto passa no WCAG e joga a direção no lixo.
    if (contraste(fg, bgOriginal) < MIN_FG) {
      const luzFg = luminancia(fg), luzBg = luminancia(bgOriginal);
      // Quando as duas luminosidades são quase iguais (creme sobre papel), não
      // existe polaridade a preservar — manda o fundo: claro pede texto escuro.
      const sentidoTexto: -1 | 1 = Math.abs(luzFg - luzBg) < 0.08
        ? (luzBg > 0.184 ? -1 : 1)
        : (luzFg >= luzBg ? 1 : -1);
      const antes = contraste(fg, bgOriginal).toFixed(1);

      const textoAjustado = moverLuz(fg, bgOriginal, MIN_FG, sentidoTexto);
      if (textoAjustado) {
        fgFinal = textoAjustado;
        notas.push(`texto ${dir.fg}→${paraHex(fgFinal)} (era ${antes}:1)`);
      } else {
        // O texto já está no extremo (creme quase branco, por exemplo): então
        // quem cede é o fundo, indo para o lado oposto e mantendo a matiz.
        const fundoAjustado = moverLuz(bgOriginal, fg, MIN_FG, sentidoTexto === 1 ? -1 : 1);
        if (fundoAjustado) {
          bgFinal = fundoAjustado;
          notas.push(`fundo ${dir.bg}→${paraHex(bgFinal)} para o texto ${dir.fg} se ler (era ${antes}:1)`);
        } else {
          fgFinal = moverLuz(fg, bgOriginal, MIN_FG, 0)
            ?? (contraste([255, 255, 255], bgOriginal) >= contraste([11, 11, 11], bgOriginal)
              ? [255, 255, 255] as Rgb
              : [11, 11, 11] as Rgb);
          notas.push(`texto ${dir.fg}→${paraHex(fgFinal)} (era ${antes}:1)`);
        }
      }
    }

    // O accent é medido contra o fundo FINAL, senão a correção do texto
    // invalidaria a conta. Aqui a matiz é a identidade; a luz pode ir aos dois lados.
    let accentFinal = accent;
    if (contraste(accent, bgFinal) < MIN_ACCENT) {
      const antes = contraste(accent, bgFinal).toFixed(1);
      accentFinal = moverLuz(accent, bgFinal, MIN_ACCENT, 0)
        ?? (contraste([255, 255, 255], bgFinal) >= contraste([11, 11, 11], bgFinal)
          ? [255, 255, 255] as Rgb
          : [11, 11, 11] as Rgb);
      notas.push(`destaque ${dir.accent}→${paraHex(accentFinal)} (era ${antes}:1)`);
    }

    if (!notas.length) return dir;

    return {
      ...dir,
      bg: paraHex(bgFinal),
      fg: paraHex(fgFinal),
      accent: paraHex(accentFinal),
      ajuste_contraste: `Ajustei para o texto ficar legível: ${notas.join("; ")}.`,
    };
  });
}
// <</contraste>>

// ── Prompt base ──────────────────────────────────────────────────────────
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
- destaque: 1 a 3 palavras OU um número curto (ex.: "3 de 4", "R$ 12 mil", "48h"). É a palavra que vira gráfico no slide. Nunca repita o título inteiro. No slide de CTA, o destaque vira o TEXTO DO BOTÃO (ex.: "CHAMAR NO DIRECT", "BAIXAR O GUIA").
- prompt_imagem: prompt EM INGLÊS para gerador de imagem. O padrão que funciona no Instagram é FOTO REALISTA DE PESSOA — o profissional do nicho, o cliente ideal, ou alguém vivendo a situação do slide. Descreva quem é a pessoa (idade aproximada, aparência brasileira, roupa coerente com o nicho), a expressão, o cenário e a luz. Composição com a pessoa de um lado e ESPAÇO VAZIO do outro ou embaixo, porque o texto entra por cima. Sem nenhum texto na imagem, sem logotipos, sem pessoas famosas, sem colagem. Quando a ideia do slide for abstrata demais para uma pessoa, use objeto ou cena real do dia a dia do nicho, nunca ilustração genérica de banco de imagem. Sempre termine com: "shot on 85mm, editorial photography, natural skin texture, cinematic lighting, shallow depth of field, negative space for text".

LEGENDA:
- Abre com uma linha que repete o gancho de outro jeito, desenvolve em 3 a 6 linhas curtas com quebra de linha dupla, e fecha com o CTA + pergunta para comentário.
- hashtags: 12 a 18, mistura de nicho específico, nicho amplo e branded. Sem "#", só a palavra.`;

const DIRETOR_SYSTEM = `Você é o diretor de arte de uma agência brasileira que compete com Pentagram, Wieden+Kennedy e Porto Rocha.
Seu trabalho: olhar o segmento do cliente, lembrar de como as MARCAS E AGÊNCIAS DE REFERÊNCIA REAIS daquele mercado tratam identidade visual, e traduzir isso em uma direção aplicável.

REGRAS:
1. "referencia" cita marcas ou agências REAIS e reconhecíveis daquele segmento (ou de segmento vizinho, quando o mercado é visualmente pobre) e diz o que se rouba de cada uma. Nunca invente marca.
2. As 3 direções precisam ser REALMENTE diferentes entre si, não três variações da mesma ideia. Uma segura e alinhada ao mercado, uma contemporânea, uma que quebra o padrão do segmento.
3. Cores em hex. bg é o fundo, fg é o TEXTO principal, accent é a cor de destaque (número gigante, tarja, ponto do indicador — também aparece como texto sobre o bg).
   Legibilidade é requisito, não gosto: fg tem que ser claramente claro sobre bg escuro, ou claramente escuro sobre bg claro — nunca dois tons de intensidade parecida. O accent precisa se destacar do bg pela LUMINOSIDADE, não só pela matiz: laranja sobre vermelho, verde sobre vermelho ou azul sobre roxo têm matiz diferente e continuam ilegíveis. Se a direção pede uma cor de marca que briga com o fundo, mude a intensidade dela (mais clara ou mais escura) em vez de entregar algo que não se lê.
4. Nada de roxo-degradê-em-fundo-branco, nada de "corporativo azul genérico" a não ser que o segmento realmente peça e você justifique.
5. "porque" tem no máximo 2 linhas e fala de negócio, não de estética: o que essa direção comunica para ESSE público.
6. Layouts disponíveis: "vidro" (foto + cartão translúcido com o título, o padrão campeão de Instagram), "capa" (foto + título gigante direto na imagem), "editorial" (fundo escuro tipográfico), "impacto" (cor cheia), "revista" (papel claro serifado), "gradiente", "minimal" (branco), "foto". Prefira "vidro" ou "capa" quando a marca puder usar fotos de pessoas.
7. Escolha fonte coerente com o layout: serifada + revista/minimal para autoridade; condensada + impacto para urgência; grotesk + vidro/capa/editorial para moderno.`;

// ── Handler ──────────────────────────────────────────────────────────────
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
    const cabecalhoMarca = marca ? `${marca}\n\n` : "";

    const historico: string[] = Array.isArray(body.historico)
      ? body.historico.filter(Boolean).map(String)
      : [];
    const skills: string[] = Array.isArray(body.skills)
      ? body.skills.filter(Boolean).map(String)
      : [];

    const blocoSkills = skills.length
      ? `SKILLS ATIVADAS PELA CAROL — estas instruções mandam mais que o seu padrão:\n${skills.map((k, i) => `${i + 1}. ${k}`).join("\n\n")}`
      : "";
    const blocoHistorico = historico.length
      ? `MEMÓRIA DESTA MARCA — conteúdos que ela JÁ publicou:\n${historico.slice(0, 15).map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\nRegra: não repita nenhum desses ângulos nem reescreva o mesmo gancho. Se o tema pedido encostar num deles, ataque por um ângulo novo e trate o conteúdo como continuação (pode referenciar o anterior). Mantenha a mesma voz.`
      : "";
    const blocoBen = body.benTrends
      ? `TENDÊNCIAS DO BEN (use o que for realmente relevante, não force):\n${String(body.benTrends).slice(0, 3500)}`
      : "";

    // ── Referência visual: a Carol sobe um print e a IA lê o design ────
    if (action === "referencia") {
      const imagem = String(body.imagem ?? "");
      if (!imagem) return respond({ error: "Envie a imagem de referência." }, 400);

      const raw = await callClaude({
        apiKey,
        system: `${DIRETOR_SYSTEM}

Desta vez você recebeu uma REFERÊNCIA VISUAL real que a Carol garimpou. Sua tarefa é ler a peça como diretor de arte lê: grade, hierarquia tipográfica, paleta, uso de foto, densidade de texto, onde a marca aparece.
Devolva 2 direções: a primeira TRADUZ a referência o mais fiel possível para os nossos layouts e fontes; a segunda é uma leitura mais autoral, adaptada ao segmento do cliente.
No campo "referencia" descreva o que a peça enviada faz de certo (não invente marca; se reconhecer o estilo de alguma marca real, pode citar).
As cores devem ser AMOSTRADAS da imagem sempre que fizerem sentido para a marca.`,
        schema: DIRECAO_SCHEMA,
        effort: "high",
        maxTokens: 8000,
        user: "",
        userContent: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: String(body.mediaType ?? "image/jpeg"),
              data: imagem,
            },
          },
          {
            type: "text",
            text: [
              `${cabecalhoMarca}SEGMENTO: ${cliente.segmento || body.nicho || "negócios"}`,
              body.corMarca ? `COR ATUAL DA MARCA: ${body.corMarca}` : "",
              blocoSkills,
              "Leia a referência acima e devolva as 2 direções.",
            ].filter(Boolean).join("\n\n"),
          },
        ],
      });
      const lida = parseJson<{ direcoes?: Array<{ bg: string; fg: string; accent: string }> }>(raw);
      return respond({ ...lida, success: true, direcoes: garantirContraste(lida.direcoes ?? []) });
    }

    // ── Diretor de arte ────────────────────────────────────────────────
    if (action === "direcao") {
      const segmento = cliente.segmento || body.nicho || "negócios";
      const partes = [
        `${cabecalhoMarca}SEGMENTO: ${segmento}`,
        body.tema ? `CONTEÚDO QUE VAI SER DESENHADO: ${body.tema}` : "",
        body.corMarca ? `COR ATUAL DA MARCA: ${body.corMarca} (pode manter, ajustar ou contrariar; se contrariar, justifique)` : "",
        body.benTrends ? `O QUE ESTÁ EM ALTA NESSE SEGMENTO AGORA:\n${String(body.benTrends).slice(0, 2000)}` : "",
        blocoSkills,
        "Entregue 3 direções de arte para os carrosséis desta marca.",
      ].filter(Boolean);

      const raw = await callClaude({
        apiKey,
        system: DIRETOR_SYSTEM,
        schema: DIRECAO_SCHEMA,
        effort: "high",
        maxTokens: 8000,
        user: partes.join("\n\n"),
      });
      const lida = parseJson<{ direcoes?: Array<{ bg: string; fg: string; accent: string }> }>(raw);
      return respond({ ...lida, success: true, direcoes: garantirContraste(lida.direcoes ?? []) });
    }

    // ── Pautas ─────────────────────────────────────────────────────────
    if (action === "ideias") {
      const nicho = body.nicho ?? cliente.segmento ?? "marketing digital";
      const partes = [
        `${cabecalhoMarca}Gere 8 pautas de carrossel para o nicho: ${nicho}.`,
        body.benTrends ? `TENDÊNCIAS DO BEN (o que está em alta agora nesse segmento, priorize o aproveitável):\n${String(body.benTrends).slice(0, 3000)}` : "",
        historico.length ? `JÁ PUBLICADO por esta marca (NÃO repita nenhum desses):\n${historico.slice(0, 15).map((h, i) => `${i + 1}. ${h}`).join("\n")}` : "",
        blocoSkills,
        body.contexto ? `Contexto extra:\n${String(body.contexto).slice(0, 3000)}` : "",
        'Cada pauta precisa ser específica o suficiente para virar um carrossel inteiro (nada de "dicas de marketing"). O campo "gancho" é o título da capa, máximo 8 palavras.',
      ].filter(Boolean);

      const raw = await callClaude({
        apiKey,
        system: BASE_SYSTEM,
        schema: IDEAS_SCHEMA,
        effort: "low",
        maxTokens: 8000,
        user: partes.join("\n\n"),
      });
      return respond({ success: true, ...parseJson(raw) });
    }

    // ── Reescrever um slide ────────────────────────────────────────────
    if (action === "slide") {
      const partes = [
        `${cabecalhoMarca}Tema do carrossel: ${body.tema ?? "—"}`,
        `Slide atual (posição ${body.posicao ?? "?"} de ${body.total ?? "?"}, tipo ${body.tipo ?? "conteudo"}):\ntítulo: ${body.titulo ?? ""}\ncorpo: ${body.corpo ?? ""}`,
        `Instrução da Carol: ${body.instrucao ?? "melhore mantendo a mesma ideia, deixe mais concreto e mais curto"}`,
        blocoSkills,
        `Reescreva este slide. Mantenha o tipo "${body.tipo ?? "conteudo"}" e respeite todos os limites de caracteres.`,
      ].filter(Boolean);

      const raw = await callClaude({
        apiKey,
        system: BASE_SYSTEM,
        schema: SLIDE_SCHEMA,
        effort: "low",
        maxTokens: 4000,
        user: partes.join("\n\n"),
      });
      return respond({ success: true, slide: parseJson(raw) });
    }

    // ── Estratégia completa ────────────────────────────────────────────
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
      lancamento: "Criar antecipação. Amarre problema, nova solução, prova e próximo passo. CTA: garantir vaga/avisar.",
    };

    const estrutura = formato === "post"
      ? 'Gere EXATAMENTE 1 slide, tipo "capa". Ele precisa funcionar sozinho: gancho no título, a ideia inteira no corpo e a promessa no destaque.'
      : `Gere EXATAMENTE ${nSlides} slides nesta ordem:\n- slide 1: tipo "capa" (só o gancho + uma linha de contexto no corpo)\n- slides 2 a ${nSlides - 1}: tipo "conteudo" (progressão lógica, sem repetir ideia, cada um entrega algo aplicável)\n- slide ${nSlides}: tipo "cta"\nA sequência precisa ter arco: dor/tensão, virada, método, prova, próximo passo. O slide 2 nunca começa com "primeiro" ou "vamos falar sobre".`;

    const partes = [
      `${cabecalhoMarca}TEMA: ${tema}`,
      `FORMATO: ${formato === "post" ? "post único (imagem única de feed)" : `carrossel de ${nSlides} slides`}`,
      `OBJETIVO: ${objetivo} — ${objetivoGuia[objetivo] ?? objetivoGuia.autoridade}`,
      `PLATAFORMA: ${body.plataforma ?? "Instagram"}`,
      body.publico ? `PÚBLICO: ${body.publico}` : "",
      body.tom ? `TOM: ${body.tom}` : "",
      estrutura,
      blocoSkills,
      blocoHistorico,
      blocoBen,
      body.estrategia ? `ESTRATÉGIA DO CLIENTE:\n${String(body.estrategia).slice(0, 2500)}` : "",
      body.briefing ? `BRIEFING:\n${String(body.briefing).slice(0, 2500)}` : "",
      body.referencia ? `REFERÊNCIA/MATERIAL DE APOIO:\n${String(body.referencia).slice(0, 4000)}` : "",
      `Também entregue:
- "angulo": em uma frase, qual é o ângulo estratégico escolhido e por que ele funciona para esse público.
- "legenda": legenda pronta para publicar.
- "hashtags": lista sem o símbolo #.
- "dica_visual": uma orientação curta de direção de arte para esse conteúdo específico.
- "melhor_horario": melhor dia e horário para publicar esse conteúdo nesse nicho, com uma justificativa de meia linha.`,
    ].filter(Boolean);

    const raw = await callClaude({
      apiKey,
      system: BASE_SYSTEM,
      schema: STRATEGY_SCHEMA,
      effort: "high",
      maxTokens: 16000,
      user: partes.join("\n\n"),
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
