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

/**
 * Baixa as imagens de referência para o diretor de arte OLHAR.
 * Vem URL, não binário, porque a referência mora num CDN público (Behance) e
 * guardar megabytes por peça no banco não se paga.
 * Limite de 3 imagens e ~1,2 MB cada: acima disso a chamada fica cara e lenta
 * sem melhorar a decisão.
 */
async function baixarReferencias(
  refs: unknown,
): Promise<Array<{ data: string; mediaType: string }>> {
  if (!Array.isArray(refs) || !refs.length) return [];
  const saida: Array<{ data: string; mediaType: string }> = [];

  // Referência já embutida (base64). É o caminho de quem sobe a peça pelo app,
  // sem depender de a imagem estar publicada em algum CDN.
  const embutidas = refs
    .filter((r): r is { data: string; mediaType?: string } =>
      !!r && typeof r === "object" && typeof (r as { data?: unknown }).data === "string")
    .slice(0, 3);
  for (const e of embutidas) {
    saida.push({ data: e.data, mediaType: e.mediaType ?? "image/jpeg" });
  }
  if (saida.length >= 3) return saida.slice(0, 3);

  const urls = refs
    .map((r) => (typeof r === "string" ? r : (r as { url?: string })?.url))
    .filter((u): u is string => typeof u === "string" && /^https:\/\//.test(u))
    .slice(0, 3 - saida.length);

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CaluAgencia/1.0)" },
      });
      if (!res.ok) continue;
      const tipo = res.headers.get("content-type") ?? "image/jpeg";
      if (!tipo.startsWith("image/") || tipo.includes("webp")) continue; // Claude não lê webp
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > 1_200_000) continue;
      let bin = "";
      for (let i = 0; i < buf.length; i += 8192) {
        bin += String.fromCharCode(...buf.subarray(i, i + 8192));
      }
      saida.push({ data: btoa(bin), mediaType: tipo.split(";")[0] });
    } catch {
      /* referência que não baixa é ignorada: o diretor decide sem ela */
    }
  }
  return saida;
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
            enum: ["vidro", "capa", "organico", "agencia", "editorial", "impacto", "revista", "gradiente", "minimal", "foto"],
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
          acabamento: {
            type: "string",
            enum: ["nenhum", "grao", "glow", "cinema"],
          },
        },
        required: ["nome", "referencia", "porque", "layout", "fonte", "bg", "fg", "accent", "acabamento"],
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
          // Em lote, a pauta já nasce com o papel dela no calendário: sem isso
          // um tema de venda cairia num post escrito para engajar.
          objetivo: { type: "string", enum: ["autoridade", "educar", "vender", "engajar", "lancamento"] },
        },
        required: ["tema", "gancho", "formato", "porque", "objetivo"],
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
  /**
   * Cor travada pela agência. Quando existe, ela é INTOCÁVEL: quem cede para
   * alcançar o contraste é o fundo. Sem isso a função "consertava" o accent e
   * devolvia uma cor que não é a da marca — e o app, que reimpõe a cor travada
   * na volta, acabaria com a peça ilegível.
   */
  corTravada?: string,
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
    const travada = lerHex(corTravada ?? "");
    let accentFinal = travada ?? accent;
    if (contraste(accentFinal, bgFinal) < MIN_ACCENT) {
      const antes = contraste(accentFinal, bgFinal).toFixed(1);
      if (travada) {
        // Cor da marca não se ajusta. Move o FUNDO para longe dela, mantendo a
        // matiz do fundo — a direção continua de pé, a marca sai intacta.
        const fundoAjustado = moverLuz(bgFinal, travada, MIN_ACCENT, luminancia(travada) > luminancia(bgFinal) ? -1 : 1)
          ?? moverLuz(bgFinal, travada, MIN_ACCENT, 0);
        if (fundoAjustado) {
          bgFinal = fundoAjustado;
          notas.push(`fundo ${paraHex(bgOriginal)}→${paraHex(bgFinal)} para a cor da marca ${paraHex(travada)} se destacar (era ${antes}:1)`);
          // O texto foi medido contra o fundo antigo: refaz a conta.
          if (contraste(fgFinal, bgFinal) < MIN_FG) {
            fgFinal = contraste([255, 255, 255], bgFinal) >= contraste([11, 11, 11], bgFinal)
              ? [255, 255, 255] as Rgb
              : [11, 11, 11] as Rgb;
            notas.push(`texto para ${paraHex(fgFinal)} por causa do fundo novo`);
          }
        }
      } else {
        accentFinal = moverLuz(accent, bgFinal, MIN_ACCENT, 0)
          ?? (contraste([255, 255, 255], bgFinal) >= contraste([11, 11, 11], bgFinal)
            ? [255, 255, 255] as Rgb
            : [11, 11, 11] as Rgb);
        notas.push(`destaque ${dir.accent}→${paraHex(accentFinal)} (era ${antes}:1)`);
      }
    }

    // Com cor travada sempre reescreve o accent, mesmo sem nota: o modelo pode
    // ter devolvido outra cor mesmo com a instrução, e aqui é a última porteira.
    if (!notas.length && !travada) return dir;

    return {
      ...dir,
      bg: paraHex(bgFinal),
      fg: paraHex(fgFinal),
      accent: paraHex(accentFinal),
      ...(notas.length ? { ajuste_contraste: `Ajustei para o texto ficar legível: ${notas.join("; ")}.` } : {}),
    };
  });
}
// <</contraste>>

/**
 * Porteira final da identidade travada. O prompt PEDE que o modelo mantenha cor
 * e fonte, mas pedir não é garantir — igual ao contraste, isso fica no código.
 * Com a identidade solta, comporta-se exatamente como antes.
 */
function travarIdentidade<T extends { bg: string; fg: string; accent: string; fonte?: string }>(
  direcoes: T[],
  identidade: unknown,
): Array<T & { ajuste_contraste?: string }> {
  const id = identidade as { travada?: boolean; cor?: string; fonte?: string } | undefined;
  const travada = id?.travada ? id : undefined;
  const ajustadas = garantirContraste(direcoes, travada?.cor);
  if (!travada?.fonte) return ajustadas;
  return ajustadas.map((d) => ({ ...d, fonte: travada.fonte as string }));
}

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
- ÊNFASE NO TÍTULO: marque UM trecho com asteriscos — *assim* — e ele sai na cor de destaque, mais encorpado, no meio da frase. É o recurso que faz o título parecer desenhado em vez de digitado, e aparece em toda peça boa de social media. Regras: no máximo UMA marcação por título (duas viram enfeite), de 1 a 3 palavras, e marque a palavra que carrega o argumento — o número, o valor, o verbo da ação, o nome do erro. Nunca marque artigo, preposição ou o título inteiro. Os asteriscos NÃO contam no limite de caracteres. Se nenhuma palavra for claramente mais importante, não marque nada.
- corpo: máximo 190 caracteres. Pode ter no máximo 2 frases.
- destaque: 1 a 3 palavras OU um número curto (ex.: "3 de 4", "R$ 12 mil", "48h"). É a palavra que vira gráfico no slide. Nunca repita o título inteiro. No slide de CTA, o destaque vira o TEXTO DO BOTÃO (ex.: "CHAMAR NO DIRECT", "BAIXAR O GUIA").
- prompt_imagem: prompt EM INGLÊS para gerador de imagem. A foto não ilustra o tema do carrossel: ela mostra o MOMENTO DAQUELE SLIDE. Se o slide fala do erro, a foto é o erro acontecendo; se fala da virada, é a virada; se é o CTA, é o resultado já conquistado. Sete retratos da mesma pessoa sorrindo é o que faz um carrossel passar batido.
  O que faz a foto parar o dedo, em ordem de importância:
  1. UMA emoção específica e legível — irritação contida, alívio, concentração, susto, orgulho. Nunca "sorrindo simpático".
  2. UM assunto só, grande no quadro, com contraste forte de claro e escuro. O feed é pequeno: se não lê em miniatura, não existe.
  3. Momento pego, não posado. Pessoa no meio da ação, olhando para o trabalho e não para a lente (exceto na capa, onde olhar na câmera funciona).
  4. Cenário concreto e específico do nicho, com objeto de trabalho de verdade na mão.
  Quando houver pessoa, descreva quem ela é (idade aproximada, aparência brasileira, roupa coerente com o nicho), a emoção exata, a ação, o cenário e a luz. MANTENHA A MESMA PESSOA, a mesma roupa e a mesma luz em todos os slides que tiverem gente — muda a cena e a ação, nunca o personagem. Slides de objeto no meio do carrossel não quebram isso: a luz e a paleta é que costuram a série.
  PROIBIDO: texto na imagem, logotipo, pessoa famosa, colagem, ilustração, aperto de mão em escritório, polegar para cima, gente de terno em fundo branco, "equipe diversa reunida em volta do notebook" — é banco de imagem e o público reconhece na hora.
  EM FOTO DE OBJETO, exija explicitamente no prompt que o equipamento seja GENÉRICO e SEM MARCA VISÍVEL ("unbranded, no logos, no brand names, no legible text on the equipment"). Sem isso o gerador estampa a marca de um fabricante real na peça do cliente — já aconteceu, e coloca uma terceira empresa dentro do anúncio dele.
  PESSOA NÃO É OBRIGATÓRIA, NEM MESMO NA CAPA. Você escolhe o que dá mais impacto naquele slide: gente, ou um OBJETO tratado como herói — o interruptor, a lâmpada, a conta de luz, a chave, o documento, a peça de roupa —, fotografado de perto, com luz dramática e espaço vazio em volta. Peça de objeto costuma ganhar quando o assunto é um número, um custo, um prazo ou uma coisa física; peça de gente ganha quando o assunto é uma emoção, um erro humano ou uma decisão. Alternar entre os dois ao longo do carrossel é o que dá ritmo.
  Se você escolher pessoa, o rosto tem que aparecer inteiro e em foco — nunca de costas, cortado no queixo ou tapado pela mão. Se escolher objeto, ele ocupa o quadro; nada de pessoa entrando pela metade.
  Sempre termine com: "shot on 85mm, editorial photography, natural skin texture, cinematic lighting, shallow depth of field, negative space for text".
  Não descreva onde fica o espaço vazio: o app acrescenta essa exigência conforme o layout que o diretor de arte escolher.

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
6. Layouts disponíveis: "vidro" (foto + cartão translúcido com o título, o padrão campeão de Instagram), "capa" (foto + título gigante direto na imagem), "organico" (título em cima no fundo limpo e uma FORMA DE MARCA gigante em cor cheia ocupando a parte de baixo, com a foto recortada dentro dela e selo circular com a marca correndo na curva — escolha quando a marca tem uma cor forte e quer identidade própria), "agencia" (papel quadriculado, foto sangrando por um lado e do outro cartões sólidos EMPILHADOS com o título, bloco de contato fixo com o @ e uma palavra gigante sangrando pela base — é o padrão de peça de agência que a Carol usa como referência; escolha quando a marca quiser parecer feita por estúdio, com sistema visual próprio em vez de post avulso), "editorial" (fundo escuro tipográfico), "impacto" (cor cheia), "revista" (papel claro serifado), "gradiente", "minimal" (branco), "foto". **Não existe layout padrão: "vidro" e "capa" são seguros, e por isso mesmo viram monotonia se você os escolher sempre. Rode entre eles.**
7. Escolha fonte coerente com o layout: serifada + revista/minimal para autoridade; condensada + impacto para urgência; grotesk + vidro/capa/editorial para moderno.
8. "acabamento" é o tratamento aplicado por cima da peça pronta. Escolha:
   - "nenhum": cor chapada. Use quando a direção é limpa, suíça, institucional, ou o fundo é claro.
   - "grao": ruído de filme. Use quando quer tirar o ar de digital chapado — editorial, documental, artesanal, moda.
   - "glow": a tipografia e o accent espalham luz. Só em FUNDO ESCURO, e quando a direção é noturna, tech, neon, evento, música.
   - "cinema": glow discreto + vinheta + grão. O mais dramático. Use em fundo escuro quando a direção pede peso cinematográfico.
   Não use "glow" nem "cinema" com bg claro — o efeito lava a peça. Nesses casos use "grao" ou "nenhum".
9. FOTO NÃO É OPCIONAL POR PADRÃO. O sistema gera a foto de cada slide automaticamente, e peça com foto de pessoa real é o que sustenta alcance no feed — as referências de qualidade desta casa são quase todas fotográficas. Cinco layouts usam foto: "vidro", "capa", "organico", "agencia" e "foto". Portanto: **pelo menos DUAS das suas três direções precisam usar um desses cinco layouts.** Direção sem foto (editorial, impacto, revista, gradiente, minimal) só como a terceira opção, e só quando houver um motivo real — dado numérico que pede tipografia gigante, marca que não pode mostrar pessoas, ou assunto sensível em que foto de gente empobrece. Se você entregar as três sem foto, errou a tarefa.`;

/**
 * Identidade travada do cliente. Quando a agência fixa cor e fonte, elas param
 * de ser escolha do diretor de arte — e ele precisa saber disso ANTES, para
 * construir o fundo em volta da cor. Se ele escolhesse fundo livre e a cor
 * fosse trocada só na volta, a peça sairia com o contraste quebrado.
 */
function blocoIdentidade(identidade: unknown): string {
  const id = identidade as {
    travada?: boolean; cor?: string; cor2?: string; fonte?: string; fonteLabel?: string;
  } | undefined;
  if (!id?.travada || (!id.cor && !id.fonte)) return "";
  const linhas = ["IDENTIDADE TRAVADA PELA AGÊNCIA — isto NÃO é escolha sua:"];
  if (id.cor2) {
    linhas.push(
      `• A marca tem DUAS cores: ${id.cor} (principal) e ${id.cor2} (apoio). Trabalhe com o PAR — é assim que a marca é. ` +
      `O apoio serve de fundo, de cartão de trás e de segundo plano; a principal fica no destaque. ` +
      `Não invente um terceiro tom para o papel dessas duas.`,
    );
  }
  if (id.cor) {
    linhas.push(
      `• accent = ${id.cor} nas TRÊS direções, exatamente esse hex. É a cor da marca e ela não muda de post para post. ` +
      `Sua liberdade está no FUNDO e no TEXTO: escolha bg e fg que façam ESSA cor funcionar — claro sobre escuro, escuro sobre claro, ` +
      `sempre com o accent legível contra o bg. Se a direção que você imaginou só fecha com outra cor de destaque, mude a direção, não a cor.`,
    );
  }
  if (id.fonte) {
    linhas.push(
      `• fonte = "${id.fonte}"${id.fonteLabel ? ` (${id.fonteLabel})` : ""} nas TRÊS direções. É a tipografia da marca. ` +
      `Escolha layouts que fiquem bons com ela, em vez de trocá-la.`,
    );
  }
  linhas.push("As três direções ainda precisam ser DIFERENTES entre si — a diferença agora vem de layout, fundo, acabamento e composição.");
  return linhas.join("\n");
}

/**
 * Designs que este cliente já usou, do mais recente para o mais antigo.
 * Sem isto o diretor decide do zero toda vez e devolve sempre a mesma coisa —
 * a Carol pediu conteúdo novo e recebeu os mesmos layouts.
 */
function blocoHistoricoDesign(designs: unknown): string {
  if (!Array.isArray(designs) || !designs.length) return "";
  const linhas = designs
    .slice(0, 6)
    .map((d, i) => {
      const x = d as { layout?: string; acabamento?: string; fonte?: string };
      if (!x?.layout) return "";
      const partes = [x.layout, x.acabamento && x.acabamento !== "nenhum" ? `acabamento ${x.acabamento}` : ""].filter(Boolean);
      return `${i === 0 ? "• MAIS RECENTE" : `• ${i + 1}ª atrás`}: ${partes.join(", ")}`;
    })
    .filter(Boolean);
  if (!linhas.length) return "";
  return [
    "O QUE ESTE CLIENTE JÁ PUBLICOU (design das últimas peças):",
    ...linhas,
    "",
    "REGRA DE VARIAÇÃO, obrigatória: NENHUMA das suas 3 direções pode usar o layout da peça MAIS RECENTE.",
    "Evite também os layouts das 3 últimas, a não ser que sobrem menos de 3 opções que sirvam ao conteúdo — e nesse caso mude o acabamento e a composição para a peça não sair igual.",
    "Um feed é uma sequência: duas peças seguidas com o mesmo layout parecem a mesma peça repostada. Variar é parte da tarefa, não enfeite.",
  ].join("\n");
}

/**
 * Arquivos e links dos Projetos do cliente, já extraídos pelo app.
 *
 * É a fonte mais confiável que chega aqui: veio da Carol, não de suposição
 * sobre o nicho. Por isso a instrução manda usar dado DAQUI antes de inventar
 * exemplo — foi a queixa de "posts genéricos".
 */
/**
 * O que cada objetivo pede da peça. Fora do `strategy` porque as PAUTAS também
 * precisam disso: em lote, a pauta já nasce com o papel dela no calendário.
 */
const objetivoGuia: Record<string, string> = {
  autoridade: "Provar domínio do assunto. Entregue um insight que só quem vive o dia a dia do nicho teria. CTA: salvar/compartilhar.",
  educar: "Ensinar um processo passo a passo aplicável hoje. Cada slide é um passo com o 'como', não só o 'o quê'. CTA: aplicar e comentar o resultado.",
  vender: "Levar à conversão sem parecer anúncio. Comece pelo problema caro, mostre o custo de não resolver, e só no fim conecte com a oferta. CTA: ação comercial clara.",
  engajar: "Provocar resposta. Use contradição, opinião forte ou erro comum que o público comete. CTA: pergunta que dá vontade de responder.",
  lancamento: "Criar antecipação. Amarre problema, nova solução, prova e próximo passo. CTA: garantir vaga/avisar.",
};

/**
 * O documento É o conteúdo — não é material de apoio.
 *
 * Caso real: o cliente manda o texto pronto em PDF ou Word e o trabalho da
 * Marcela é transformar AQUILO em carrossel. É diferente de `blocoDeMaterial`,
 * onde ela lê o briefing e escreve o que quiser: aqui inventar assunto novo é
 * defeito, porque o cliente vai comparar a peça com o que mandou.
 */
function blocoDeFonte(doc: unknown, literal = false): string {
  const d = (doc ?? {}) as { nome?: string; conteudo?: string };
  const texto = (d.conteudo ?? "").trim();
  if (!texto) return "";

  /**
   * Dois níveis de fidelidade, porque "usar o conteúdo do cliente" quer dizer
   * coisas diferentes conforme o material.
   *
   * ADAPTAR: o assunto e os dados são do documento, mas a escrita é dela. Serve
   * para material bruto — ata de reunião, laudo, anotação solta.
   *
   * LITERAL: as frases do cliente entram como estão. Serve para texto que já foi
   * escrito para publicar (e revisado, e às vezes aprovado por jurídico) — nesse
   * caso reescrever é ESTRAGAR, mesmo que fique mais bonito. Foi a queixa da
   * Carol: "a Marcela está mudando o texto que está no anexo".
   */
  const regras = literal
    ? [
      "REGRAS DESTE MODO — TEXTO LITERAL. Elas mandam mais que qualquer outra instrução, inclusive as de estilo, gancho e persona:",
      "1. As frases do documento entram COMO ESTÃO. Copie, não reescreva.",
      "2. Você PODE: escolher quais trechos entram, em que ordem e em qual slide; cortar uma frase longa pelas bordas; separar uma frase em duas linhas.",
      "3. Você NÃO PODE: trocar palavra por sinônimo, mudar a ordem das palavras dentro da frase, ajustar o tom, 'melhorar' a redação, criar frase que não existe no documento.",
      "4. O TÍTULO de cada slide é um trecho do próprio documento — a frase (ou o pedaço de frase) que carrega aquela ideia. Se nenhum trecho couber no limite de caracteres, use o mais curto que preserve o sentido, cortando pelas bordas, nunca reescrevendo.",
      "5. Só é permitido acrescentar palavra fora do documento em UM lugar: o texto do botão do slide final. Todo o resto é do cliente.",
      "6. Marque a ênfase com *asteriscos* em palavras que JÁ ESTÃO na frase — a marcação é formatação, não texto novo.",
      "7. A legenda também é montada com trechos do documento, na ordem dele.",
      "8. Se o material não der para encher os slides pedidos, faça MENOS slides. Enchimento aqui é inventar texto, que é o que este modo proíbe.",
    ]
    : [
      "REGRAS PARA ESTE MODO, e elas mandam mais que qualquer outra instrução:",
      "1. O carrossel é a TRADUÇÃO deste conteúdo para o formato. Não troque o assunto, não escolha outro ângulo, não acrescente tema que não está aqui.",
      "2. Todo número, nome, prazo, valor e termo técnico sai DAQUI, com a mesma grafia. Nunca arredonde nem invente dado para completar slide.",
      "3. Se o material não der para encher os slides pedidos, faça MENOS slides em vez de esticar com enchimento.",
      "4. O que você acrescenta é FORMA, não conteúdo: quebra em slides, hierarquia, título que segura a atenção, ordem que faz sentido na leitura arrastando.",
      "5. Se houver ordem, passos ou lista no documento, respeite a sequência — ela costuma ser a espinha do carrossel.",
      "6. Se algo estiver ambíguo no material, escolha a leitura mais literal. Não preencha lacuna com suposição sobre o nicho.",
    ];

  return [
    `CONTEÚDO ENVIADO PELO CLIENTE — é ESTE material que vira o carrossel (arquivo: ${d.nome ?? "documento"}):`,
    "```",
    texto.slice(0, 24000),
    "```",
    regras.join("\n"),
  ].join("\n");
}

function blocoDeMaterial(documentos: unknown): string {
  const docs = (Array.isArray(documentos) ? documentos : []) as Array<{ nome?: string; conteudo?: string }>;
  const uteis = docs.filter((d) => (d.conteudo ?? "").trim());
  if (!uteis.length) return "";
  return [
    "MATERIAL DO CLIENTE (arquivos e links que a agência anexou ao projeto):",
    ...uteis.map((d) => `### ${d.nome ?? "documento"}\n${(d.conteudo ?? "").slice(0, 6000)}`),
    "Use número, nome e fato DESTE material antes de recorrer a exemplo genérico do nicho. Se ele contradisser o que você ia dizer, ele manda.",
  ].join("\n\n");
}

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

Desta vez você recebeu uma REFERÊNCIA VISUAL real que a Carol garimpou, e aqui a tarefa é OUTRA: ela quer que a peça dela fique o mais parecida possível com esta imagem. Não é inspiração, é reprodução.

A REGRA 3 (contraste) e a REGRA 8 (acabamento) continuam valendo — peça ilegível não serve nem clonada. TUDO O MAIS cede para a fidelidade. Em particular, a regra de puxar a cor da marca do cliente NÃO se aplica aqui: a cor vem da referência.

DIREÇÃO 1 — CÓPIA. Reproduza o que você está vendo:
- bg, fg e accent tirados da PRÓPRIA IMAGEM. Estime os hex olhando a peça; se o fundo é creme, devolva o creme dela, não um creme genérico.
- layout = o dos nossos oito que mais se aproxima da composição que você está vendo. Se a peça tem foto de pessoa com um cartão de texto por cima, é "vidro". Se tem foto com título gigante direto nela, é "capa". Se é tipografia sobre cor cheia, é "impacto". Se é papel claro com serifada, é "revista". Escolha pela ESTRUTURA, não pelo gosto.
- fonte = o par mais próximo do que você vê (serifada de revista, condensada de manchete, grotesk moderna, monoespaçada).
- acabamento = o tratamento que a peça aparenta ter (grão de filme, brilho, ou nada).
- No campo "porque", diga em uma linha o que você copiou e o que precisou aproximar por limite dos nossos layouts.

DIREÇÃO 2 — a mesma ideia adaptada ao segmento do cliente, aí sim com a cor da marca dele.

Seja honesto sobre o limite: nossos oito layouts são fixos. Se a referência tem uma forma orgânica atravessando a peça, foto recortada sem fundo ou selo circular com texto em curva, isso o motor ainda não desenha — chegue o mais perto possível com o que existe e diga no "porque" o que ficou de fora.
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
              blocoIdentidade(body.identidade),
              blocoHistoricoDesign(body.designsRecentes),
              blocoSkills,
              "Leia a referência acima e devolva as 2 direções.",
            ].filter(Boolean).join("\n\n"),
          },
        ],
      });
      const lida = parseJson<{ direcoes?: Array<{ bg: string; fg: string; accent: string }> }>(raw);
      return respond({ ...lida, success: true, direcoes: travarIdentidade(lida.direcoes ?? [], body.identidade) });
    }

    // ── Diretor de arte ────────────────────────────────────────────────
    if (action === "direcao") {
      const segmento = cliente.segmento || body.nicho || "negócios";

      // Referências visuais da casa. O diretor OLHA e decide; não copia.
      const imagensRef = await baixarReferencias(body.refs);

      const partes = [
        `${cabecalhoMarca}SEGMENTO: ${segmento}`,
        body.tema ? `CONTEÚDO QUE VAI SER DESENHADO: ${body.tema}` : "",
        body.corMarca
          ? `COR DA MARCA DO CLIENTE: ${body.corMarca}. Esta é a origem da cor das suas 3 direções. PELO MENOS DUAS precisam usá-la como fundo, texto ou destaque — pode variar a intensidade, a saturação e o papel dela na peça. A terceira pode ousar, mas ainda dentro do que o segmento aceita, e você justifica em "porque".`
          : "",
        body.benTrends ? `O QUE ESTÁ EM ALTA NESSE SEGMENTO AGORA:\n${String(body.benTrends).slice(0, 2000)}` : "",
        imagensRef.length
          ? `As imagens acima são o PADRÃO DE ACABAMENTO da casa — peças de social media escolhidas como referência de qualidade. Leia com atenção o que elas fazem BEM e traduza para este cliente.

REGRA DURA SOBRE COR: a paleta da referência é IRRELEVANTE para você. A cor sai da MARCA DO CLIENTE (a cor informada acima) e do que o segmento pede. Se a referência é verde e a marca do cliente é azul, a sua peça é AZUL. Não existe hipótese de a cor da referência aparecer na sua resposta. Se você devolver a paleta da referência, errou a tarefa.

O que SE COPIA da referência: o rigor da hierarquia (o que é grande, o que é pequeno, o que respira), a disciplina de usar poucas cores, a relação entre foto e texto, o cuidado com o espaço vazio, o nível de acabamento dos detalhes.
O que NÃO se copia: paleta, assunto, marca, tipo de negócio, nicho, ou o desenho literal dos elementos.

Se a referência é uma agência verde e o cliente é uma clínica, a resposta não é uma clínica verde — é uma clínica com o MESMO capricho, no vocabulário visual e nas cores da clínica.`
          : "",
        blocoIdentidade(body.identidade),
        blocoHistoricoDesign(body.designsRecentes),
        blocoSkills,
        "Entregue 3 direções de arte para os carrosséis desta marca.",
      ].filter(Boolean);

      const userContent = imagensRef.length
        ? [
            ...imagensRef.map((img) => ({
              type: "image",
              source: { type: "base64", media_type: img.mediaType, data: img.data },
            })),
            { type: "text", text: partes.join("\n\n") },
          ]
        : undefined;

      const raw = await callClaude({
        apiKey,
        system: DIRETOR_SYSTEM,
        schema: DIRECAO_SCHEMA,
        effort: "high",
        maxTokens: 8000,
        user: partes.join("\n\n"),
        userContent,
      });
      const lida = parseJson<{ direcoes?: Array<{ bg: string; fg: string; accent: string }> }>(raw);
      return respond({ ...lida, success: true, direcoes: travarIdentidade(lida.direcoes ?? [], body.identidade) });
    }

    // ── Pautas ─────────────────────────────────────────────────────────
    if (action === "ideias") {
      const nicho = body.nicho ?? cliente.segmento ?? "marketing digital";
      // A produção em lote pede exatamente quantas peças vai escrever; sem isso
      // ela devolvia sempre 8 e o lote de 12 repetia pauta.
      const quantas = Math.max(1, Math.min(20, Number(body.quantidade) || 8));

      /**
       * Calendário misto. Quem manda é a lista que o app enviou (é ele que sabe
       * quantas peças de cada tipo a Carol quer); sem ela, um objetivo só.
       */
      const mix = (Array.isArray(body.objetivos) ? body.objetivos : [])
        .map((o: unknown) => String(o))
        .filter((o: string) => objetivoGuia[o]);
      const blocoMix = mix.length
        ? [
          `CALENDÁRIO: estas ${quantas} pautas NÃO são todas do mesmo tipo. Distribua exatamente nesta proporção:`,
          ...[...new Set(mix)].map((o) => `- ${mix.filter((x: string) => x === o).length}× ${o}: ${objetivoGuia[o]}`),
          "Marque cada pauta com o objetivo dela no campo `objetivo`. **ALTERNE**: nunca duas de venda seguidas, e a primeira do lote nunca é de venda — quem chega no perfil precisa de motivo para ficar antes de motivo para comprar.",
        ].join("\n")
        : `Marque cada pauta com o objetivo dela no campo \`objetivo\` (${Object.keys(objetivoGuia).join(", ")}).`;

      const partes = [
        `${cabecalhoMarca}Gere ${quantas} pautas de conteúdo para o nicho: ${nicho}.`,
        quantas > 1 ? `As ${quantas} precisam ser assuntos DIFERENTES entre si — nada de variação da mesma ideia com outro título.` : "",
        blocoMix,
        blocoDeMaterial(body.documentos),
        body.benTrends ? `TENDÊNCIAS DO BEN (o que está em alta agora nesse segmento, priorize o aproveitável):\n${String(body.benTrends).slice(0, 3000)}` : "",
        historico.length ? `JÁ PUBLICADO por esta marca (NÃO repita nenhum desses):\n${historico.slice(0, 15).map((h, i) => `${i + 1}. ${h}`).join("\n")}` : "",
        blocoSkills,
        body.contexto ? `Contexto extra:\n${String(body.contexto).slice(0, 3000)}` : "",
        'Cada pauta precisa ser específica o suficiente para virar um carrossel inteiro (nada de "dicas de marketing"). O campo "gancho" é o título da capa, máximo 8 palavras.',
        `Devolva exatamente ${quantas} pautas.`,
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
    // Com o conteúdo do cliente anexado, o tema deixa de ser obrigatório: ele
    // sai do próprio documento. Exigir tema aqui obrigaria a resumir na mão
    // aquilo que a Marcela vai ler inteiro logo em seguida.
    const fonte = blocoDeFonte(body.documentoFonte, body.fonteLiteral === true);
    if (!tema && !fonte) return respond({ error: "Informe o tema do conteúdo." }, 400);

    // Com conteúdo do cliente, o número de slides é TETO e não meta: esticar
    // material curto para bater a contagem é justamente o enchimento que a
    // regra 3 do bloco de fonte proíbe. As duas instruções brigariam.
    const quantos = fonte && formato !== "post" ? `no MÁXIMO ${nSlides}` : `EXATAMENTE ${nSlides}`;
    const estrutura = formato === "post"
      ? 'Gere EXATAMENTE 1 slide, tipo "capa". Ele precisa funcionar sozinho: gancho no título, a ideia inteira no corpo e a promessa no destaque.'
      : `Gere ${quantos} slides nesta ordem:\n- slide 1: tipo "capa" (só o gancho + uma linha de contexto no corpo)\n- slides 2 a ${nSlides - 1}: tipo "conteudo" (progressão lógica, sem repetir ideia, cada um entrega algo aplicável)\n- slide ${nSlides}: tipo "cta"\nA sequência precisa ter arco: dor/tensão, virada, método, prova, próximo passo. O slide 2 nunca começa com "primeiro" ou "vamos falar sobre".`;

    const partes = [
      fonte
        ? `${cabecalhoMarca}${tema ? `RECORTE PEDIDO PELA AGÊNCIA (use como foco DENTRO do conteúdo enviado, sem sair dele): ${tema}` : "O tema sai do próprio conteúdo enviado abaixo."}`
        : `${cabecalhoMarca}TEMA: ${tema}`,
      // A fonte vem cedo no prompt, antes das instruções de forma: o que ela
      // deve dizer é decidido pelo documento, não pelo nicho.
      fonte,
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
      // Arquivos e links que a Carol pôs nos Projetos do cliente. É a fonte mais
      // confiável que existe aqui: veio dela, não de suposição sobre o nicho.
      blocoDeMaterial(body.documentos),
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
