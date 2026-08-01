/**
 * Motor de render do Estúdio de Carrossel — Calu Agência.
 * Desenha slides prontos para publicar (1080px) em canvas, sem depender de Canva/Figma.
 */

export type LayoutId = "estudio" | "vidro" | "capa" | "organico" | "agencia" | "editorial" | "impacto" | "revista" | "gradiente" | "minimal" | "foto";

/**
 * Layouts desenhados pelo motor HTML e não pelo canvas. O app troca o caminho
 * de render por esta lista — é o que permite migrar um modelo por vez sem
 * derrubar os outros nove.
 */
export const LAYOUTS_HTML: LayoutId[] = ["estudio"];
export const ehLayoutHtml = (l: LayoutId) => LAYOUTS_HTML.includes(l);
export type FormatId = "4:5" | "1:1" | "9:16";
export type FontPairId =
  | "editorial" | "impacto" | "moderno" | "tecnico" | "manchete" | "esportivo"
  | "luxo" | "revista" | "boutique" | "startup" | "corporativo" | "fino"
  | "brutalista" | "geometrico" | "classico" | "codigo";
export type SlideTipo = "capa" | "conteudo" | "cta";
export type AcabamentoId = "nenhum" | "grao" | "glow" | "cinema";

export interface SlideData {
  tipo: SlideTipo;
  titulo: string;
  corpo: string;
  destaque?: string;
  prompt_imagem?: string;
  imagem?: string | null;
  /**
   * A mesma foto hospedada no bucket. A `imagem` é uma data URL de megabytes,
   * boa para desenhar na hora e péssima para gravar na Biblioteca — sem esta
   * cópia a arte sumia ao trocar de peça.
   */
  imagemUrl?: string | null;
}

export interface Theme {
  bg: string;
  fg: string;
  accent: string;
  /**
   * Segunda cor da marca, quando a agência define o par fixo. Vazia = o motor
   * deriva um tom a partir do accent, o que só acerta em marca de uma cor só.
   */
  accent2?: string;
  fontPair: FontPairId;
}

export interface BrandInfo {
  nome?: string;
  handle?: string;
  logoUrl?: string | null;
}

export interface RenderOptions {
  slide: SlideData;
  index: number;
  total: number;
  layout: LayoutId;
  format: FormatId;
  theme: Theme;
  brand: BrandInfo;
  image?: HTMLImageElement | null;
  logo?: HTMLImageElement | null;
  mostrarNumero?: boolean;
  mostrarArraste?: boolean;
  /** Tratamento aplicado por cima do slide pronto. Ver ACABAMENTOS. */
  acabamento?: AcabamentoId;
  /** Fator de escala do bitmap (1 = 1080px). Use 0.3 para miniaturas. */
  scale?: number;
  /**
   * Foto ATRAVESSANDO vários slides: a mesma imagem é fatiada e cada slide
   * recebe o seu pedaço, então ao arrastar a cena continua. É o gesto que mais
   * faz um carrossel parecer uma peça só, e não posts soltos.
   * `parte` é a posição deste slide na sequência (0-based) e `de` é o total.
   */
  fatia?: { parte: number; de: number };
}

export const FORMAT_SIZE: Record<FormatId, [number, number]> = {
  "4:5": [1080, 1350],
  "1:1": [1080, 1080],
  "9:16": [1080, 1920],
};

export const FORMAT_LABEL: Record<FormatId, string> = {
  "4:5": "Feed 4:5 · 1080×1350",
  "1:1": "Quadrado 1:1 · 1080×1080",
  "9:16": "Stories 9:16 · 1080×1920",
};

export const FONT_PAIRS: Record<
  FontPairId,
  { label: string; nota: string; display: string; body: string; displayWeight: number; upper: boolean; tracking: number }
> = {
  editorial:   { label: "Editorial",   nota: "Serifada clássica de revista",      display: '"Playfair Display", Georgia, serif', body: 'Inter, system-ui, sans-serif',            displayWeight: 700, upper: false, tracking: -0.01 },
  impacto:     { label: "Impacto",     nota: "Peso máximo, frase de efeito",      display: '"Archivo Black", Impact, sans-serif', body: 'Inter, system-ui, sans-serif',           displayWeight: 400, upper: true,  tracking: -0.02 },
  moderno:     { label: "Moderno",     nota: "Geométrica com personalidade",      display: 'Syne, system-ui, sans-serif',        body: 'Inter, system-ui, sans-serif',            displayWeight: 800, upper: false, tracking: -0.02 },
  tecnico:     { label: "Técnico",     nota: "Grotesk de produto e SaaS",         display: '"Space Grotesk", system-ui, sans-serif', body: 'Inter, system-ui, sans-serif',        displayWeight: 700, upper: false, tracking: -0.015 },
  manchete:    { label: "Manchete",    nota: "Condensada de jornal, grita",       display: 'Anton, Impact, sans-serif',          body: 'Inter, system-ui, sans-serif',            displayWeight: 400, upper: true,  tracking: -0.005 },
  esportivo:   { label: "Esportivo",   nota: "Alta e estreita, energia",          display: '"Bebas Neue", Impact, sans-serif',   body: 'Archivo, Inter, system-ui, sans-serif',   displayWeight: 400, upper: true,  tracking: 0.01 },
  luxo:        { label: "Luxo",        nota: "Serifada fina, alto padrão",        display: '"Cormorant Garamond", Georgia, serif', body: 'Inter, system-ui, sans-serif',          displayWeight: 700, upper: false, tracking: 0 },
  revista:     { label: "Revista",     nota: "Serifada de capa, elegante",        display: '"DM Serif Display", Georgia, serif', body: 'Inter, system-ui, sans-serif',            displayWeight: 400, upper: false, tracking: -0.005 },
  boutique:    { label: "Boutique",    nota: "Serifada contemporânea, autoral",   display: 'Fraunces, Georgia, serif',           body: 'Manrope, Inter, sans-serif',              displayWeight: 700, upper: false, tracking: -0.01 },
  startup:     { label: "Startup",     nota: "Limpa e amigável, tech",            display: 'Outfit, system-ui, sans-serif',      body: 'Outfit, system-ui, sans-serif',           displayWeight: 700, upper: false, tracking: -0.02 },
  corporativo: { label: "Corporativo", nota: "Sóbria, confiável, B2B",            display: '"Plus Jakarta Sans", system-ui, sans-serif', body: '"Plus Jakarta Sans", Inter, sans-serif', displayWeight: 800, upper: false, tracking: -0.02 },
  fino:        { label: "Fino",        nota: "Serifada leve, ar de curadoria",    display: '"Instrument Serif", Georgia, serif', body: 'Manrope, Inter, sans-serif',              displayWeight: 400, upper: false, tracking: -0.005 },
  brutalista:  { label: "Brutalista",  nota: "Grotesk deformada, ousada",         display: '"Bricolage Grotesque", system-ui, sans-serif', body: 'Inter, system-ui, sans-serif',   displayWeight: 800, upper: false, tracking: -0.03 },
  geometrico:  { label: "Geométrico",  nota: "Futurista, marcante",               display: 'Unbounded, system-ui, sans-serif',   body: 'Sora, Inter, sans-serif',                 displayWeight: 700, upper: false, tracking: -0.02 },
  classico:    { label: "Clássico",    nota: "Condensada tradicional",            display: 'Oswald, Impact, sans-serif',         body: 'Inter, system-ui, sans-serif',            displayWeight: 600, upper: true,  tracking: 0.005 },
  codigo:      { label: "Código",      nota: "Monoespaçada, dev e dados",         display: '"JetBrains Mono", monospace',        body: 'Inter, system-ui, sans-serif',            displayWeight: 700, upper: false, tracking: -0.03 },
};

export const LAYOUTS: { id: LayoutId; label: string; desc: string; precisaImagem?: boolean }[] = [
  { id: "estudio", label: "Estúdio ✦", desc: "Papel quadriculado, cartão sólido de apoio, faixa de foto na base e a inicial da marca em marca d'água. Desenhado em HTML — tipografia e acabamento de peça de estúdio.", precisaImagem: true },
  { id: "vidro", label: "Vidro", desc: "Foto + cartão de vidro com o título. O padrão que mais roda no feed.", precisaImagem: true },
  { id: "capa", label: "Capa", desc: "Foto + título gigante direto na imagem, com seta e pílulas.", precisaImagem: true },
  { id: "organico", label: "Orgânico", desc: "Forma de marca gigante em cor cheia, foto recortada dentro dela e selo circular. O padrão de agência.", precisaImagem: true },
  { id: "agencia", label: "Agência", desc: "Foto sangrando de um lado, cartões sólidos empilhados do outro, papel quadriculado e bloco de contato. A estrutura das referências.", precisaImagem: true },
  { id: "editorial", label: "Editorial", desc: "Fundo escuro, número gigante, tipografia grande. O mais versátil." },
  { id: "impacto", label: "Impacto", desc: "Cor cheia e tipografia pesada. Para frase de efeito e dado forte." },
  { id: "revista", label: "Revista", desc: "Papel claro, serifada, filetes finos. Ar de publicação premium." },
  { id: "gradiente", label: "Gradiente", desc: "Malha de cor com cartão de vidro. Moderno e colorido." },
  { id: "minimal", label: "Minimal", desc: "Branco, respiro, um traço de cor. Elegante e limpo." },
  { id: "foto", label: "Foto", desc: "Sua imagem em tela cheia com máscara e texto por cima.", precisaImagem: true },
];

/**
 * KITS — artes fechadas, aprovadas olhando na tela.
 *
 * Por que existem: deixar a IA remontar um design do zero a cada peça significa
 * dezenas de decisões por post, e basta uma ser mediana para a arte inteira
 * ficar mediana. Um kit trava layout, tipografia, acabamento e o PAPEL de cada
 * cor; o que varia é o conteúdo e a cor da marca do cliente.
 *
 * Kit é UMA das opções, não obrigação: a direção autoral (a IA compondo) e a
 * cópia de referência continuam existindo.
 *
 * `corDaMarca` diz onde a cor do cliente entra — é o que faz o mesmo kit servir
 * marcas diferentes sem virar template repetido.
 */
export interface Kit {
  id: string;
  label: string;
  desc: string;
  layout: LayoutId;
  fontPair: FontPairId;
  acabamento: AcabamentoId;
  /** Onde a cor da marca entra: fundo, destaque, ou a forma do layout. */
  corDaMarca: "accent" | "bg";
  /** Base neutra do kit; a cor da marca é aplicada por cima conforme acima. */
  base: { bg: string; fg: string; accent: string };
  precisaImagem?: boolean;
}

export const KITS: Kit[] = [
  {
    id: "agencia-forma",
    label: "Forma de marca",
    desc: "Fundo claro, forma da marca ocupando a base com a foto dentro dela e selo circular. O padrão de agência.",
    layout: "organico",
    fontPair: "startup",
    acabamento: "nenhum",
    corDaMarca: "accent",
    base: { bg: "#F7F9F3", fg: "#15211A", accent: "#8DC63F" },
    precisaImagem: true,
  },
  {
    id: "vitrine-noturna",
    label: "Vitrine noturna",
    desc: "Foto em tela cheia, cartão de vidro com o título e tratamento cinematográfico. Para marca escura.",
    layout: "vidro",
    fontPair: "corporativo",
    acabamento: "cinema",
    corDaMarca: "accent",
    base: { bg: "#101418", fg: "#F5F7FA", accent: "#FF7A45" },
    precisaImagem: true,
  },
  {
    id: "dossie-claro",
    label: "Dossiê claro",
    desc: "Papel claro, serifada e muito respiro. Para autoridade técnica: contabilidade, jurídico, consultoria.",
    layout: "revista",
    fontPair: "fino",
    acabamento: "grao",
    corDaMarca: "accent",
    base: { bg: "#F4F1EA", fg: "#1B1815", accent: "#B23C0C" },
  },
];

/** Aplica a cor da marca no papel que o kit reservou para ela. */
export function temaDoKit(kit: Kit, corMarca?: string | null): Theme {
  const base = { ...kit.base };
  if (corMarca && /^#?[0-9a-f]{6}$/i.test(corMarca.replace("#", ""))) {
    const cor = corMarca.startsWith("#") ? corMarca : `#${corMarca}`;
    if (kit.corDaMarca === "accent") {
      // O accent precisa se separar do fundo do kit, senão a peça some.
      base.accent = isLight(base.bg) === isLight(cor) ? shade(cor, isLight(base.bg) ? -0.35 : 0.35) : cor;
    } else {
      base.bg = cor;
      base.fg = contrastOn(cor);
    }
  }
  return { ...base, fontPair: kit.fontPair };
}

export const PALETTES: { id: string; label: string; bg: string; fg: string; accent: string }[] = [
  { id: "noite", label: "Noite", bg: "#0A0C0F", fg: "#F4F5F2", accent: "#B9FF4B" },
  { id: "papel", label: "Papel", bg: "#F4F1EA", fg: "#16130F", accent: "#C2410C" },
  { id: "tinta", label: "Tinta", bg: "#0E1728", fg: "#EAF0FF", accent: "#5B8CFF" },
  { id: "vinho", label: "Vinho", bg: "#180A11", fg: "#FBEFF3", accent: "#EF4A80" },
  { id: "floresta", label: "Floresta", bg: "#0A1611", fg: "#E9F5EE", accent: "#3FD37E" },
  { id: "areia", label: "Areia", bg: "#EDE5D9", fg: "#2A2018", accent: "#0F766E" },
  { id: "grafite", label: "Grafite", bg: "#17181A", fg: "#F2F2F2", accent: "#FF6B35" },
  { id: "ceu", label: "Céu", bg: "#F2F6FA", fg: "#0B1B2B", accent: "#1D4ED8" },
];

// ── Cor ───────────────────────────────────────────────────────────────────
function clamp(v: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, v));
}

function hexToRgb(hex: string): [number, number, number] {
  let h = (hex || "#000000").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return [0, 0, 0];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function isLight(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 145;
}

export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => clamp(Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount)));
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Cor de texto legível sobre um fundo qualquer. */
export function contrastOn(hex: string): string {
  return isLight(hex) ? "#0A0C0F" : "#FFFFFF";
}

/**
 * Cor da ênfase do título. Precisa de duas coisas ao mesmo tempo: ler sobre o
 * fundo e se DISTINGUIR do resto do texto. Alguns layouts invertem a peça e
 * acabam com accent igual ao fg (o slide de CTA do editorial fazia isso) — aí a
 * ênfase some sem avisar. Nesse caso escurecemos ou clareamos o accent original
 * até ele voltar a se separar do texto.
 */
export function corEnfase(fundo: string, texto: string, accent: string): string {
  const norm = (h: string) => String(h ?? "").replace("#", "").toLowerCase();
  const colideComTexto = norm(accent) === norm(texto);
  // Mesma faixa de luminosidade do fundo = não se lê, mesmo com matiz diferente.
  const colideComFundo = norm(accent) === norm(fundo) || isLight(accent) === isLight(fundo);
  if (!colideComTexto && !colideComFundo) return accent;
  // Puxa o accent para o lado oposto do fundo, preservando a matiz da marca.
  return shade(accent, isLight(fundo) ? -0.55 : 0.55);
}

// ── Texto ─────────────────────────────────────────────────────────────────
function setTracking(ctx: CanvasRenderingContext2D, px: number) {
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
  } catch {
    /* navegador sem suporte — ignora */
  }
}

/** Quebra o texto em linhas. `quebrouPalavra` avisa que alguma palavra teve de ser
 *  cortada no meio — sinal de que a fonte ainda está grande demais. */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): { lines: string[]; quebrouPalavra: boolean } {
  const paragraphs = String(text ?? "").split(/\n+/);
  const out: string[] = [];
  let quebrouPalavra = false;

  for (const p of paragraphs) {
    const words = p.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      // Palavra que não cabe nem sozinha: só aqui cortamos no caractere.
      if (ctx.measureText(word).width > maxWidth) {
        quebrouPalavra = true;
        if (line) { out.push(line); line = ""; }
        let chunk = "";
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
            out.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        line = chunk;
        continue;
      }
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        out.push(line);
        line = word;
      }
    }
    if (line) out.push(line);
  }
  return { lines: out.length ? out : [""], quebrouPalavra };
}

interface TextBlock {
  lines: string[];
  size: number;
  lineHeight: number;
  height: number;
  /** Texto já sem as marcações, na forma em que foi medido. */
  texto: string;
  /** Trechos com ênfase, em índices de `texto`. */
  enfase: Array<[number, number]>;
}

/**
 * Ênfase dentro do título: `*palavra*` sai na cor de destaque e mais pesada.
 * É o recurso que aparece em toda referência boa de social media — uma palavra
 * do título em outra cor, no meio da frase.
 *
 * A marcação é retirada ANTES de medir, então a quebra de linha e o corpo da
 * fonte são calculados com o texto limpo. O peso extra é feito com contorno
 * fino sobre o preenchimento (faux bold) justamente para NÃO mudar a largura —
 * trocar a família/peso de verdade mudaria a métrica e estouraria a caixa que
 * já foi calculada.
 */
// Exportada porque o modelo HTML precisa da MESMA leitura de `*palavra*` que o
// canvas: duas implementações divergiriam e a ênfase sairia diferente por motor.
export function extrairEnfase(txt: string): { limpo: string; enfase: Array<[number, number]> } {
  const s = String(txt ?? "");
  if (!s.includes("*")) return { limpo: s, enfase: [] };
  const re = /\*([^*\n]+)\*/g;
  const enfase: Array<[number, number]> = [];
  let limpo = "";
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    limpo += s.slice(i, m.index);
    const ini = limpo.length;
    limpo += m[1];
    enfase.push([ini, limpo.length]);
    i = m.index + m[0].length;
  }
  limpo += s.slice(i);
  return { limpo, enfase };
}

/**
 * Geometria da pílula de ênfase, em fração do corpo da fonte.
 *
 * `FOLGA` é o respiro DENTRO da pílula, dos dois lados da palavra. `EMPURRA` é
 * o quanto a pílula afasta as palavras vizinhas: o espaço normal de uma fonte
 * (~0,25 em) não dá conta de hospedar a pílula E ainda separar do vizinho, e a
 * ponta arredondada avança justo na altura do olho — sem isso sai "mais)e nem
 * sabe", grudado. Quem mede a linha tem que reservar `RESERVA_ENFASE`, senão o
 * empurrão estoura a caixa que o fitText calculou.
 */
const PILULA_FOLGA = 0.11;
const PILULA_EMPURRA = 0.1;
export const RESERVA_ENFASE = PILULA_EMPURRA * 2;

/** Desenha uma linha em pedaços, trocando a cor nos trechos com ênfase. */
function desenharLinhaComEnfase(
  ctx: CanvasRenderingContext2D,
  linha: string,
  inicioNaFrase: number,
  block: TextBlock,
  x: number,
  cy: number,
  align: CanvasTextAlign,
  accent: string,
  tarja = false,
) {
  const fim = inicioNaFrase + linha.length;
  // Fronteiras dos pedaços, em índices locais da linha.
  const cortes = new Set<number>([0, linha.length]);
  for (const [a, b] of block.enfase) {
    if (b <= inicioNaFrase || a >= fim) continue;
    cortes.add(Math.max(0, a - inicioNaFrase));
    cortes.add(Math.min(linha.length, b - inicioNaFrase));
  }
  const pontos = [...cortes].sort((p, q) => p - q);

  const alinhamentoAntigo = ctx.textAlign;
  const corBase = ctx.fillStyle;

  // Os pedaços são montados ANTES de desenhar porque a pílula alarga a linha:
  // sem saber o quanto, uma linha centralizada sairia fora do eixo.
  const pedacos = [];
  for (let k = 0; k < pontos.length - 1; k++) {
    const texto = linha.slice(pontos[k], pontos[k + 1]);
    if (!texto) continue;
    const absoluto = inicioNaFrase + pontos[k];
    const marcado = block.enfase.some(([a, b]) => absoluto >= a && absoluto < b);
    const pilula = marcado && tarja;
    // A pílula não empurra contra a borda da linha: ali ela pode transbordar,
    // que é o que as referências fazem. Só empurra contra palavra vizinha.
    const empurra = pilula ? block.size * PILULA_EMPURRA : 0;
    pedacos.push({
      texto,
      marcado,
      pilula,
      larg: ctx.measureText(texto).width,
      empurraEsq: pontos[k] === 0 ? 0 : empurra,
      empurraDir: pontos[k + 1] === linha.length ? 0 : empurra,
    });
  }

  const total = pedacos.reduce((s, p) => s + p.larg + p.empurraEsq + p.empurraDir, 0);
  let cursorX = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  ctx.textAlign = "left";

  for (const p of pedacos) {
    cursorX += p.empurraEsq;

    if (p.pilula) {
      // Pílula preenchida: a única ênfase que funciona quando o fundo já é
      // colorido — cor sozinha ali some. Desenha o bloco e inverte o texto.
      const semEspaco = p.texto.replace(/\s+$/, "");
      const largSemEspaco = ctx.measureText(semEspaco).width;
      const folga = block.size * PILULA_FOLGA;
      const altura = block.size * 1.12;
      const topo = cy - block.size * 0.86;
      ctx.save();
      roundRectPath(ctx, cursorX - folga, topo, largSemEspaco + folga * 2, altura, altura / 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = contrastOn(accent);
      ctx.fillText(p.texto, cursorX, cy);
    } else {
      ctx.fillStyle = p.marcado ? accent : corBase;
      ctx.fillText(p.texto, cursorX, cy);
      if (p.marcado) {
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(1, block.size * 0.022);
        ctx.lineJoin = "round";
        ctx.strokeText(p.texto, cursorX, cy);
        ctx.restore();
      }
    }
    cursorX += p.larg + p.empurraDir;
  }

  ctx.fillStyle = corBase;
  ctx.textAlign = alinhamentoAntigo;
}

/** Encontra o maior corpo de fonte em que o texto ainda cabe na caixa. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  o: {
    font: (size: number) => string; maxWidth: number; maxHeight: number; max: number; min: number; lh: number;
    tracking?: number;
    /** Quem vai desenhar a ênfase em PÍLULA precisa disso: ela alarga a linha. */
    enfaseEmPilula?: boolean;
  },
): TextBlock {
  // A marcação de ênfase sai antes de medir: tudo abaixo trabalha com o texto limpo.
  const { limpo, enfase } = extrairEnfase(text);
  const step = Math.max(1, Math.round(o.max * 0.02));
  let reserva: TextBlock | null = null; // melhor opção caso nenhuma fonte evite corte de palavra
  const comPilula = !!o.enfaseEmPilula && enfase.length > 0;

  for (let size = o.max; size >= o.min; size -= step) {
    ctx.font = o.font(size);
    setTracking(ctx, (o.tracking ?? 0) * size);
    const largura = o.maxWidth - (comPilula ? size * RESERVA_ENFASE : 0);
    const { lines, quebrouPalavra } = wrapLines(ctx, limpo, largura);
    const lineHeight = size * o.lh;
    const height = lines.length * lineHeight;
    if (height <= o.maxHeight) {
      // Só aceita se nenhuma palavra precisou ser cortada no meio.
      if (!quebrouPalavra) {
        setTracking(ctx, 0);
        return { lines, size, lineHeight, height, texto: limpo, enfase };
      }
      if (!reserva) reserva = { lines, size, lineHeight, height, texto: limpo, enfase };
    }
  }

  setTracking(ctx, 0);
  if (reserva) return reserva;

  ctx.font = o.font(o.min);
  setTracking(ctx, (o.tracking ?? 0) * o.min);
  const { lines } = wrapLines(ctx, limpo, o.maxWidth - (comPilula ? o.min * RESERVA_ENFASE : 0));
  setTracking(ctx, 0);
  return {
    lines, size: o.min, lineHeight: o.min * o.lh,
    height: lines.length * o.min * o.lh, texto: limpo, enfase,
  };
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  block: TextBlock,
  x: number,
  y: number,
  o: {
    font: (size: number) => string; align?: CanvasTextAlign; tracking?: number;
    accent?: string;
    /** Ênfase em tarja em vez de cor. Obrigatório quando o fundo já é colorido. */
    tarja?: boolean;
  },
) {
  ctx.font = o.font(block.size);
  ctx.textAlign = o.align ?? "left";
  ctx.textBaseline = "alphabetic";
  setTracking(ctx, (o.tracking ?? 0) * block.size);
  let cy = y + block.size * 0.82;

  const comEnfase = !!(o.accent && block.enfase?.length);
  let cursor = 0; // por onde já passamos em block.texto, para achar cada linha
  for (const line of block.lines) {
    if (!comEnfase) {
      ctx.fillText(line, x, cy);
    } else {
      const ini = block.texto.indexOf(line, cursor);
      if (ini < 0) {
        ctx.fillText(line, x, cy); // não localizou: desenha normal, nunca deixa de desenhar
      } else {
        desenharLinhaComEnfase(ctx, line, ini, block, x, cy, o.align ?? "left", o.accent as string, o.tarja);
        cursor = ini + line.length;
      }
    }
    cy += block.lineHeight;
  }
  setTracking(ctx, 0);
  ctx.textAlign = "left";
}

// ── Formas ────────────────────────────────────────────────────────────────
function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (!img.width || !img.height) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

/**
 * Como o drawCover, mas escolhendo QUE ALTURA da foto aparece na janela.
 * `foco` é a fração da imagem que fica acima do recorte: 0 mostra o topo, 0.5
 * o meio. Existe por causa da barra baixa do arranjo `rodape` — ali o corte
 * centrado pegava a barriga e decapitava a pessoa, e o corte no topo pegava só
 * parede. O brief garante gente na metade de cima, então ~0,2 cai no rosto.
 */
function drawCoverFoco(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  foco: number,
) {
  if (!img.width || !img.height) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const escala = Math.max(w / img.width, h / img.height);
  const dw = img.width * escala;
  const dh = img.height * escala;
  // Nunca deixar borda: o deslocamento é preso ao que a imagem tem de sobra.
  const desloca = Math.min(Math.max(foco * dh, 0), Math.max(0, dh - h));
  ctx.drawImage(img, x + (w - dw) / 2, y - desloca, dw, dh);
  ctx.restore();
}

/**
 * Desenha a FATIA desta peça de uma foto que atravessa vários slides.
 * A imagem é tratada como um painel de largura `w * de`: a peça `parte` mostra
 * a janela correspondente. Ao arrastar no feed, a cena continua de um slide
 * para o outro.
 *
 * A foto é escalada pela ALTURA, não pela largura: escalar pela largura
 * encolheria a imagem inteira até caber no painel e sobrariam tarjas em cima e
 * embaixo. Se ela for estreita demais para o painel, o que falta vira
 * espelhamento nas bordas em vez de faixa vazia.
 */
function drawFatia(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  parte: number,
  de: number,
) {
  if (!img.width || !img.height || de < 1) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const painel = w * de;
  const escala = h / img.height;
  const larguraFoto = img.width * escala;
  // Foto mais estreita que o painel: espalha o que tem e aceita o corte menor,
  // em vez de deixar buraco. Foto mais larga: centra o painel nela.
  const usada = Math.max(larguraFoto, painel);
  const escalaFinal = usada / img.width;
  const dw = img.width * escalaFinal;
  const dh = img.height * escalaFinal;
  const esquerdaPainel = (dw - painel) / 2;
  ctx.drawImage(img, x - esquerdaPainel - parte * w, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  o: { fontSize: number; bg: string; fg: string; font: string; padX?: number; padY?: number; radius?: number },
) {
  ctx.font = `700 ${o.fontSize}px ${o.font}`;
  setTracking(ctx, o.fontSize * 0.02);
  const padX = o.padX ?? o.fontSize * 1.1;
  const padY = o.padY ?? o.fontSize * 0.72;
  const w = ctx.measureText(text).width + padX * 2;
  const h = o.fontSize + padY * 2;
  ctx.fillStyle = o.bg;
  roundRectPath(ctx, x, y, w, h, o.radius ?? h / 2);
  ctx.fill();
  ctx.fillStyle = o.fg;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + o.fontSize * 0.04);
  ctx.textBaseline = "alphabetic";
  setTracking(ctx, 0);
  return { w, h };
}

function drawKicker(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  o: { size: number; color: string; font: string },
) {
  ctx.fillStyle = o.color;
  ctx.font = `700 ${o.size}px ${o.font}`;
  setTracking(ctx, o.size * 0.16);
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text.toUpperCase(), x, y + o.size);
  setTracking(ctx, 0);
}

// ── Rodapé compartilhado ──────────────────────────────────────────────────
interface Chrome {
  W: number;
  H: number;
  pad: number;
  fg: string;
  accent: string;
  body: string;
}

function drawFooter(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  const { W, H, pad, fg, accent, body } = c;
  const handle = (o.brand.handle || o.brand.nome || "").trim();
  const baseY = H - pad * 0.72;

  // Barra de progresso segmentada (só faz sentido em carrossel)
  if (o.total > 1) {
    const segW = (W - pad * 2) / o.total;
    const barH = Math.max(3, W * 0.005);
    const y = H - pad * 0.42;
    for (let i = 0; i < o.total; i++) {
      ctx.fillStyle = i <= o.index ? accent : rgba(fg, 0.18);
      roundRectPath(ctx, pad + segW * i + (i ? W * 0.004 : 0), y, segW - W * 0.004, barH, barH / 2);
      ctx.fill();
    }
  }

  if (handle) {
    ctx.fillStyle = rgba(fg, 0.55);
    ctx.font = `600 ${Math.round(W * 0.024)}px ${body}`;
    setTracking(ctx, W * 0.024 * 0.06);
    ctx.textBaseline = "alphabetic";
    ctx.fillText(handle, pad, baseY);
    setTracking(ctx, 0);
  }

  if (o.mostrarNumero !== false && o.total > 1) {
    const label = `${String(o.index + 1).padStart(2, "0")}/${String(o.total).padStart(2, "0")}`;
    ctx.fillStyle = rgba(fg, 0.45);
    ctx.font = `600 ${Math.round(W * 0.024)}px ${body}`;
    ctx.textAlign = "right";
    ctx.fillText(label, W - pad, baseY);
    ctx.textAlign = "left";
  }
}

function drawLogo(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  if (!o.logo?.width) return;
  const h = c.W * 0.052;
  const w = (o.logo.width / o.logo.height) * h;
  ctx.drawImage(o.logo, c.pad, c.pad * 0.62, Math.min(w, c.W * 0.36), h);
}

function drawArraste(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  if (o.mostrarArraste === false || o.total <= 1 || o.slide.tipo !== "capa") return;
  const size = Math.round(c.W * 0.026);
  drawPill(ctx, "ARRASTE  →", c.pad, c.H - c.pad * 1.32 - size * 2.4, {
    fontSize: size,
    bg: c.accent,
    fg: contrastOn(c.accent),
    font: c.body,
  });
}

// ── Layouts ───────────────────────────────────────────────────────────────
function layoutEditorial(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  const { W, H, pad } = c;
  const fonts = FONT_PAIRS[o.theme.fontPair];
  const isCta = o.slide.tipo === "cta";
  const bg = isCta ? o.theme.accent : o.theme.bg;
  const fg = isCta ? contrastOn(o.theme.accent) : o.theme.fg;
  const accent = isCta ? contrastOn(o.theme.accent) : o.theme.accent;
  // No CTA o fundo vira o próprio accent — a ênfase precisa de outra cor.
  const enfase = corEnfase(bg, fg, o.theme.accent);

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  if (!isCta) {
    const glow = ctx.createRadialGradient(W * 0.85, H * 0.08, 0, W * 0.85, H * 0.08, W * 0.9);
    glow.addColorStop(0, rgba(o.theme.accent, 0.16));
    glow.addColorStop(1, rgba(o.theme.accent, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  const local: Chrome = { ...c, fg, accent };
  drawLogo(ctx, o, local);

  const topY = pad * (o.logo?.width ? 2.0 : 1.1);
  let cursor = topY;

  // Número gigante nos slides de conteúdo
  if (o.slide.tipo === "conteudo") {
    const numSize = Math.round(W * 0.17);
    ctx.font = `${fonts.displayWeight} ${numSize}px ${fonts.display}`;
    ctx.fillStyle = rgba(accent, 0.9);
    ctx.textBaseline = "alphabetic";
    ctx.fillText(String(o.index + 1).padStart(2, "0"), pad, cursor + numSize * 0.78);
    ctx.fillStyle = rgba(fg, 0.18);
    ctx.fillRect(pad, cursor + numSize * 1.02, W - pad * 2, Math.max(1, W * 0.0018));
    cursor += numSize * 1.28;
  } else {
    drawKicker(ctx, isCta ? "PRÓXIMO PASSO" : o.brand.nome || "CARROSSEL", pad, cursor, {
      size: Math.round(W * 0.024),
      color: rgba(accent, 0.95),
      font: fonts.body,
    });
    cursor += W * 0.09;
  }

  const bottomLimit = H - pad * 1.55;
  const titulo = fonts.upper ? o.slide.titulo.toUpperCase() : o.slide.titulo;
  const tituloMax = o.slide.tipo === "capa" ? W * 0.145 : W * 0.098;
  const t = fitText(ctx, titulo, {
    font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`,
    maxWidth: W - pad * 2,
    maxHeight: (bottomLimit - cursor) * (o.slide.corpo ? 0.62 : 0.95),
    max: tituloMax,
    min: W * 0.048,
    lh: 1.1,
    tracking: fonts.tracking,
  });

  if (o.slide.tipo === "capa") {
    // Capa: título ancorado embaixo
    const corpoBlock = o.slide.corpo
      ? fitText(ctx, o.slide.corpo, {
          font: (s) => `400 ${s}px ${fonts.body}`,
          maxWidth: W - pad * 2,
          maxHeight: H * 0.14,
          max: W * 0.038,
          min: W * 0.026,
          lh: 1.45,
        })
      : null;
    const totalH = t.height + (corpoBlock ? corpoBlock.height + W * 0.045 : 0);
    const startY = bottomLimit - totalH - W * 0.11;
    ctx.fillStyle = fg;
    drawBlock(ctx, t, pad, startY, { font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`, tracking: fonts.tracking, accent: enfase });
    if (corpoBlock) {
      ctx.fillStyle = rgba(fg, 0.62);
      drawBlock(ctx, corpoBlock, pad, startY + t.height + W * 0.045, { font: (s) => `400 ${s}px ${fonts.body}` });
    }
  } else {
    ctx.fillStyle = fg;
    drawBlock(ctx, t, pad, cursor, { font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`, tracking: fonts.tracking, accent });
    cursor += t.height + W * 0.05;

    if (o.slide.corpo) {
      const b = fitText(ctx, o.slide.corpo, {
        font: (s) => `400 ${s}px ${fonts.body}`,
        maxWidth: W - pad * 2,
        maxHeight: bottomLimit - cursor - (o.slide.destaque ? W * 0.14 : 0),
        max: W * 0.042,
        min: W * 0.027,
        lh: 1.5,
      });
      ctx.fillStyle = rgba(fg, 0.72);
      drawBlock(ctx, b, pad, cursor, { font: (s) => `400 ${s}px ${fonts.body}` });
      cursor += b.height + W * 0.05;
    }

    if (o.slide.destaque) {
      drawPill(ctx, o.slide.destaque, pad, Math.min(cursor, bottomLimit - W * 0.1), {
        fontSize: Math.round(W * 0.03),
        bg: isCta ? rgba(fg, 0.14) : rgba(accent, 0.16),
        fg: isCta ? fg : accent,
        font: fonts.body,
      });
    }
  }

  drawArraste(ctx, o, local);
  drawFooter(ctx, o, local);
}

function layoutImpacto(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  const { W, H, pad } = c;
  const fonts = FONT_PAIRS[o.theme.fontPair];
  // O fundo é o BG que a direção escolheu, e o accent segue sendo destaque.
  // Antes a peça era pintada com o ACCENT e o destaque virava a própria cor do
  // texto: o diretor prometia "azul chapado com destaque quente" e saía uma
  // peça amarela sem ênfase nenhuma. Também furava o garantirContraste, que
  // mede fg contra bg — e bg não era o que ia para a tela.
  // O CTA inverte de propósito: fecha o carrossel virando a cor de destaque.
  const inverte = o.slide.tipo === "cta";
  const bg = inverte ? o.theme.accent : o.theme.bg;
  const fg = inverte ? contrastOn(o.theme.accent) : o.theme.fg;
  const accent = inverte ? contrastOn(o.theme.accent) : corEnfase(bg, o.theme.fg, o.theme.accent);
  const local: Chrome = { ...c, fg, accent };

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Faixa diagonal sutil
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.moveTo(W * 0.55, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, H * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  drawLogo(ctx, o, local);

  const top = pad * (o.logo?.width ? 2.0 : 1.1);
  drawKicker(ctx, o.slide.tipo === "cta" ? "PRÓXIMO PASSO" : `${String(o.index + 1).padStart(2, "0")} — ${String(o.total).padStart(2, "0")}`, pad, top, {
    size: Math.round(W * 0.024),
    color: rgba(fg, 0.7),
    font: fonts.body,
  });

  const bottomLimit = H - pad * 1.5;
  const corpoAltura = o.slide.corpo ? H * 0.17 : 0;
  const titulo = o.slide.titulo.toUpperCase();
  const t = fitText(ctx, titulo, {
    font: (s) => `${fonts.upper ? fonts.displayWeight : 800} ${s}px ${fonts.display}`,
    maxWidth: W - pad * 2,
    maxHeight: bottomLimit - top - W * 0.1 - corpoAltura,
    max: W * 0.16,
    min: W * 0.055,
    lh: 0.98,
    tracking: -0.025,
  });

  const startY = bottomLimit - corpoAltura - t.height - (o.slide.corpo ? W * 0.05 : 0);
  ctx.fillStyle = fg;
  drawBlock(ctx, t, pad, startY, {
    font: (s) => `${fonts.upper ? fonts.displayWeight : 800} ${s}px ${fonts.display}`,
    tracking: -0.025,
    accent,
  });

  if (o.slide.corpo) {
    const b = fitText(ctx, o.slide.corpo, {
      font: (s) => `500 ${s}px ${fonts.body}`,
      maxWidth: W - pad * 2,
      maxHeight: corpoAltura,
      max: W * 0.04,
      min: W * 0.026,
      lh: 1.45,
    });
    ctx.fillStyle = rgba(fg, 0.78);
    drawBlock(ctx, b, pad, startY + t.height + W * 0.05, { font: (s) => `500 ${s}px ${fonts.body}` });
  }

  // No CTA a peça já É a cor de destaque, então a seta usa o contraste dela.
  drawArraste(ctx, o, { ...local, accent: inverte ? fg : o.theme.accent });
  drawFooter(ctx, o, local);
}

function layoutRevista(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  const { W, H, pad } = c;
  const fonts = FONT_PAIRS[o.theme.fontPair];
  const bg = isLight(o.theme.bg) ? o.theme.bg : "#F4F1EA";
  const fg = isLight(bg) ? "#171310" : o.theme.fg;
  const accent = o.theme.accent;
  const local: Chrome = { ...c, fg, accent };

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Moldura fina
  ctx.strokeStyle = rgba(fg, 0.16);
  ctx.lineWidth = Math.max(1, W * 0.0016);
  ctx.strokeRect(pad * 0.45, pad * 0.45, W - pad * 0.9, H - pad * 0.9);

  drawLogo(ctx, o, local);

  const top = pad * (o.logo?.width ? 2.05 : 1.2);
  // Kicker com filetes
  const kicker = o.slide.tipo === "cta" ? "PRÓXIMO PASSO" : `${String(o.index + 1).padStart(2, "0")} / ${String(o.total).padStart(2, "0")}`;
  const ks = Math.round(W * 0.022);
  ctx.font = `700 ${ks}px ${fonts.body}`;
  setTracking(ctx, ks * 0.2);
  const kw = ctx.measureText(kicker.toUpperCase()).width;
  ctx.fillStyle = accent;
  ctx.fillText(kicker.toUpperCase(), pad, top + ks);
  setTracking(ctx, 0);
  ctx.fillStyle = rgba(fg, 0.22);
  ctx.fillRect(pad + kw + W * 0.03, top + ks * 0.55, W - pad * 2 - kw - W * 0.03, Math.max(1, W * 0.0014));

  let cursor = top + ks * 2.4;
  const bottomLimit = H - pad * 1.55;

  // Imagem opcional em faixa
  if (o.image?.width) {
    const imgH = H * 0.3;
    drawCover(ctx, o.image, pad, cursor, W - pad * 2, imgH);
    ctx.strokeStyle = rgba(fg, 0.12);
    ctx.lineWidth = Math.max(1, W * 0.0014);
    ctx.strokeRect(pad, cursor, W - pad * 2, imgH);
    cursor += imgH + W * 0.06;
  }

  // Página de revista com texto curto não deixa a metade de baixo vazia: o
  // título cresce até ocupar o espaço e o bloco inteiro é redistribuído.
  const disponivel = bottomLimit - cursor;
  const fonteTitulo = (s: number) => `${fonts.displayWeight} ${s}px ${fonts.display}`;
  const fonteCorpo = (s: number) => `400 ${s}px ${fonts.body}`;
  const tetoTitulo = o.image?.width ? W * 0.1 : o.slide.tipo === "capa" ? W * 0.17 : W * 0.145;

  const t = fitText(ctx, o.slide.titulo, {
    font: fonteTitulo,
    maxWidth: W - pad * 2,
    maxHeight: disponivel * (o.slide.corpo ? 0.6 : 0.9),
    max: tetoTitulo,
    min: W * 0.044,
    lh: 1.14,
    tracking: -0.005,
  });

  const filete = W * 0.045 + W * 0.04;
  let b: TextBlock | null = null;
  if (o.slide.corpo) {
    b = fitText(ctx, o.slide.corpo, {
      font: fonteCorpo,
      maxWidth: W * 0.82,
      maxHeight: Math.max(W * 0.1, disponivel - t.height - filete),
      max: o.image?.width ? W * 0.04 : W * 0.05,
      min: W * 0.026,
      lh: 1.55,
    });
  }

  // Sobra distribuída: um pouco de ar em cima, o resto embaixo — bloco no
  // terço óptico, nunca colado no kicker com um buraco embaixo.
  const alturaBloco = t.height + (b ? filete + b.height : 0);
  cursor += Math.max(0, disponivel - alturaBloco) * 0.34;

  ctx.fillStyle = fg;
  drawBlock(ctx, t, pad, cursor, { font: fonteTitulo, tracking: -0.005, accent });
  cursor += t.height + W * 0.045;

  if (b) {
    ctx.fillStyle = accent;
    ctx.fillRect(pad, cursor, W * 0.09, Math.max(2, W * 0.004));
    cursor += W * 0.04;
    ctx.fillStyle = rgba(fg, 0.75);
    drawBlock(ctx, b, pad, cursor, { font: fonteCorpo });
  }

  if (o.slide.destaque && o.slide.tipo !== "capa") {
    ctx.fillStyle = rgba(accent, 0.9);
    const ds = Math.round(W * 0.028);
    ctx.font = `700 ${ds}px ${fonts.body}`;
    setTracking(ctx, ds * 0.1);
    ctx.textAlign = "right";
    ctx.fillText(o.slide.destaque.toUpperCase(), W - pad, top + ks);
    ctx.textAlign = "left";
    setTracking(ctx, 0);
  }

  drawArraste(ctx, o, local);
  drawFooter(ctx, o, local);
}

function layoutGradiente(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  const { W, H, pad } = c;
  const fonts = FONT_PAIRS[o.theme.fontPair];
  const base = o.theme.bg;
  const accent = o.theme.accent;
  const escuro = !isLight(base);
  const fg = escuro ? "#FFFFFF" : "#0A0C0F";
  const local: Chrome = { ...c, fg, accent };

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  const blobs: [number, number, number, string][] = [
    [W * 0.18, H * 0.16, W * 0.85, rgba(accent, escuro ? 0.55 : 0.42)],
    [W * 0.92, H * 0.34, W * 0.75, rgba(shade(accent, escuro ? -0.45 : 0.35), escuro ? 0.5 : 0.4)],
    [W * 0.4, H * 0.95, W * 0.9, rgba(shade(accent, escuro ? 0.35 : -0.3), escuro ? 0.35 : 0.3)],
  ];
  for (const [x, y, r, color] of blobs) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, rgba(base, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const veil = ctx.createLinearGradient(0, 0, 0, H);
  veil.addColorStop(0, rgba(base, escuro ? 0.15 : 0.05));
  veil.addColorStop(1, rgba(base, escuro ? 0.6 : 0.25));
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, W, H);

  drawLogo(ctx, o, local);

  // Cartão de vidro
  const cardX = pad * 0.8;
  const cardW = W - cardX * 2;
  const cardTop = o.slide.tipo === "capa" ? H * 0.28 : H * 0.22;
  const cardH = H - cardTop - pad * 1.5;
  ctx.fillStyle = escuro ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.55)";
  roundRectPath(ctx, cardX, cardTop, cardW, cardH, W * 0.05);
  ctx.fill();
  ctx.strokeStyle = escuro ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.85)";
  ctx.lineWidth = Math.max(1, W * 0.0018);
  ctx.stroke();

  const inner = pad * 0.9;
  let cursor = cardTop + inner;

  drawKicker(ctx, o.slide.tipo === "cta" ? "PRÓXIMO PASSO" : `${String(o.index + 1).padStart(2, "0")} de ${String(o.total).padStart(2, "0")}`, cardX + inner, cursor, {
    size: Math.round(W * 0.022),
    color: rgba(fg, 0.7),
    font: fonts.body,
  });
  cursor += W * 0.075;

  const limite = cardTop + cardH - inner;
  const t = fitText(ctx, fonts.upper ? o.slide.titulo.toUpperCase() : o.slide.titulo, {
    font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`,
    maxWidth: cardW - inner * 2,
    maxHeight: (limite - cursor) * (o.slide.corpo ? 0.6 : 0.95),
    max: o.slide.tipo === "capa" ? W * 0.115 : W * 0.09,
    min: W * 0.044,
    lh: 1.12,
    tracking: fonts.tracking,
  });
  ctx.fillStyle = fg;
  drawBlock(ctx, t, cardX + inner, cursor, { font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`, tracking: fonts.tracking, accent });
  cursor += t.height + W * 0.04;

  if (o.slide.corpo) {
    const b = fitText(ctx, o.slide.corpo, {
      font: (s) => `400 ${s}px ${fonts.body}`,
      maxWidth: cardW - inner * 2,
      maxHeight: limite - cursor - (o.slide.destaque ? W * 0.12 : 0),
      max: W * 0.04,
      min: W * 0.026,
      lh: 1.5,
    });
    ctx.fillStyle = rgba(fg, 0.8);
    drawBlock(ctx, b, cardX + inner, cursor, { font: (s) => `400 ${s}px ${fonts.body}` });
    cursor += b.height + W * 0.04;
  }

  if (o.slide.destaque) {
    drawPill(ctx, o.slide.destaque, cardX + inner, Math.min(cursor, limite - W * 0.09), {
      fontSize: Math.round(W * 0.028),
      bg: escuro ? "rgba(255,255,255,0.16)" : "rgba(10,12,15,0.08)",
      fg,
      font: fonts.body,
    });
  }

  drawArraste(ctx, o, local);
  drawFooter(ctx, o, local);
}

function layoutMinimal(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  const { W, H, pad } = c;
  const fonts = FONT_PAIRS[o.theme.fontPair];
  const bg = isLight(o.theme.bg) ? o.theme.bg : "#FBFBF9";
  const fg = "#101215";
  const accent = o.theme.accent;
  const enfase = corEnfase(bg, fg, accent);
  const local: Chrome = { ...c, fg, accent };

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawLogo(ctx, o, local);

  // Régua de acento no topo
  ctx.fillStyle = accent;
  ctx.fillRect(pad, pad * 0.5, W * 0.16, Math.max(3, W * 0.006));

  const top = pad * (o.logo?.width ? 2.2 : 1.5);
  const bottomLimit = H - pad * 1.6;

  const t = fitText(ctx, fonts.upper ? o.slide.titulo.toUpperCase() : o.slide.titulo, {
    font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`,
    maxWidth: W * 0.78,
    maxHeight: (bottomLimit - top) * 0.5,
    max: o.slide.tipo === "capa" ? W * 0.12 : W * 0.088,
    min: W * 0.042,
    lh: 1.16,
    tracking: fonts.tracking,
  });

  const corpoBlock = o.slide.corpo
    ? fitText(ctx, o.slide.corpo, {
        font: (s) => `400 ${s}px ${fonts.body}`,
        maxWidth: W * 0.72,
        maxHeight: (bottomLimit - top) * 0.32,
        max: W * 0.038,
        min: W * 0.025,
        lh: 1.6,
      })
    : null;

  const bloco = t.height + (corpoBlock ? corpoBlock.height + W * 0.05 : 0);
  const startY = top + (bottomLimit - top - bloco) * 0.42;

  ctx.fillStyle = fg;
  drawBlock(ctx, t, pad, startY, { font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`, tracking: fonts.tracking, accent: enfase });

  if (corpoBlock) {
    ctx.fillStyle = rgba(fg, 0.62);
    drawBlock(ctx, corpoBlock, pad, startY + t.height + W * 0.05, { font: (s) => `400 ${s}px ${fonts.body}` });
  }

  if (o.slide.destaque) {
    const ds = Math.round(W * 0.026);
    ctx.font = `700 ${ds}px ${fonts.body}`;
    setTracking(ctx, ds * 0.16);
    ctx.fillStyle = accent;
    ctx.textAlign = "right";
    ctx.fillText(o.slide.destaque.toUpperCase(), W - pad, pad * 0.5 + ds);
    ctx.textAlign = "left";
    setTracking(ctx, 0);
  }

  drawArraste(ctx, o, local);
  drawFooter(ctx, o, local);
}

/**
 * ── Onde a foto está ocupada ──────────────────────────────────────────────
 * O gerador de imagem nem sempre obedece ao pedido de deixar espaço vazio, e a
 * peça saía com o texto em cima do rosto. Em vez de confiar no prompt, aqui a
 * gente OLHA a foto: mede tom de pele e nível de detalhe faixa a faixa, e
 * devolve onde dá para escrever sem tapar ninguém.
 *
 * O perfil fica em cache por imagem — o preview e as miniaturas redesenham o
 * tempo todo e ler pixel é caro.
 */
const FAIXAS = 24;
const perfilCache = new WeakMap<HTMLImageElement, { pele: number[]; detalhe: number[] } | null>();

function perfilDaFoto(img: HTMLImageElement): { pele: number[]; detalhe: number[] } | null {
  const emCache = perfilCache.get(img);
  if (emCache !== undefined) return emCache;

  let perfil: { pele: number[]; detalhe: number[] } | null = null;
  try {
    if (typeof document === "undefined") throw new Error("sem DOM");
    const w = 24;
    const h = FAIXAS;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true });
    if (!g) throw new Error("sem contexto");
    g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;

    const pele = new Array(h).fill(0);
    const detalhe = new Array(h).fill(0);
    for (let y = 0; y < h; y++) {
      let lumAnterior = -1;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r = d[i], vd = d[i + 1], b = d[i + 2];
        // Heurística clássica de tom de pele: cobre pele clara e escura.
        const max = Math.max(r, vd, b), min = Math.min(r, vd, b);
        if (r > 60 && vd > 30 && b > 15 && max - min > 12 && r > vd && r > b && Math.abs(r - vd) > 10) {
          pele[y] += 1;
        }
        const lum = (r * 299 + vd * 587 + b * 114) / 1000;
        if (lumAnterior >= 0) detalhe[y] += Math.abs(lum - lumAnterior);
        lumAnterior = lum;
      }
      pele[y] /= w;
      detalhe[y] /= w * 255;
    }
    perfil = { pele, detalhe };
  } catch {
    // Foto de outra origem sem CORS tinge o canvas e getImageData explode.
    // Sem perfil, os layouts seguem com a posição padrão.
    perfil = null;
  }
  perfilCache.set(img, perfil);
  return perfil;
}

/**
 * Melhor topo (0..1) para um bloco de altura `alturaFrac`, fugindo de rosto e
 * de detalhe. `preferido` desempata para a posição que o layout gostaria.
 */
function faixaLivre(img: HTMLImageElement | null | undefined, alturaFrac: number, preferido: number): number {
  if (!img?.width) return preferido;
  const perfil = perfilDaFoto(img);
  if (!perfil) return preferido;

  const altura = Math.max(1, Math.round(alturaFrac * FAIXAS));
  let melhor = preferido;
  let menorCusto = Infinity;
  for (let ini = 0; ini + altura <= FAIXAS; ini++) {
    let custo = 0;
    for (let k = ini; k < ini + altura; k++) {
      // Rosto pesa muito mais que textura: tapar cara é o pecado.
      custo += perfil.pele[k] * 6 + perfil.detalhe[k];
    }
    custo /= altura;
    // Empurrão leve para a posição que o layout preferia, para não ficar pulando.
    custo += Math.abs(ini / FAIXAS - preferido) * 0.35;
    if (custo < menorCusto) {
      menorCusto = custo;
      melhor = ini / FAIXAS;
    }
  }
  return melhor;
}

/**
 * Forma orgânica de marca — a "vírgula" gigante que atravessa a peça.
 * É o elemento que mais dá identidade nas referências da Carol: às vezes ela é
 * só cor de fundo, às vezes a foto vive recortada DENTRO dela.
 * O desenho varia com `semente` para os slides do carrossel não ficarem idênticos.
 */
function caminhoFormaOrganica(ctx: CanvasRenderingContext2D, W: number, H: number, semente: number, topoBase: number) {
  // Variação sutil e determinística: mesma peça sempre desenha igual.
  const v = ((semente % 3) - 1) * 0.035;
  const topo = topoBase + H * v;

  ctx.beginPath();
  ctx.moveTo(-W * 0.15, topo + H * 0.16);
  // Sobe pela esquerda e abre a barriga da forma
  ctx.bezierCurveTo(W * 0.10, topo - H * 0.10, W * 0.42, topo - H * 0.04, W * 0.62, topo + H * 0.05);
  // Ombro à direita
  ctx.bezierCurveTo(W * 0.86, topo + H * 0.15, W * 1.06, topo + H * 0.02, W * 1.12, topo + H * 0.20);
  // Desce e fecha por baixo
  ctx.lineTo(W * 1.12, H * 1.1);
  ctx.lineTo(-W * 0.15, H * 1.1);
  ctx.closePath();
}

/** Selo circular com o texto correndo na curva — o "condição especial" girando. */
function drawSeloCircular(
  ctx: CanvasRenderingContext2D,
  texto: string,
  cx: number,
  cy: number,
  raio: number,
  o: { cor: string; corTexto: string; font: string; miolo?: string },
) {
  ctx.save();
  ctx.fillStyle = o.cor;
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.fill();

  const size = Math.round(raio * 0.17);
  ctx.font = `700 ${size}px ${o.font}`;
  ctx.fillStyle = o.corTexto;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Quantas repetições cabem na circunferência, medindo o texto de verdade.
  const unidade = `${texto.toUpperCase()}  •  `;
  const larguraUnidade = ctx.measureText(unidade).width;
  const raioTexto = raio - size * 0.85;
  const perimetro = 2 * Math.PI * raioTexto;
  const repeticoes = Math.max(1, Math.round(perimetro / Math.max(1, larguraUnidade)));
  const frase = unidade.repeat(repeticoes);

  // Avanço PROPORCIONAL à largura de cada letra. Passo fixo espaça "I" igual a
  // "M" e o texto sai gaguejado — é o detalhe que denuncia curva feita na mão.
  const larguraTotal = ctx.measureText(frase).width;
  const escala = (2 * Math.PI) / Math.max(1, larguraTotal);

  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 2);
  for (const ch of frase) {
    const w = ctx.measureText(ch).width;
    ctx.rotate((w / 2) * escala);
    ctx.save();
    ctx.translate(0, -raioTexto);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    ctx.rotate((w / 2) * escala);
  }
  ctx.restore();

  if (o.miolo) {
    ctx.save();
    ctx.fillStyle = o.corTexto;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.round(raio * 0.42)}px ${o.font}`;
    ctx.fillText(o.miolo, cx, cy);
    ctx.restore();
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/**
 * Layout ORGÂNICO — o padrão das referências que a Carol mandou: fundo claro,
 * forma de marca gigante em cor cheia atravessando a peça, foto vivendo dentro
 * dela, título em cima com uma palavra no accent e selo circular no CTA.
 */
function layoutOrganico(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  const { W, H, pad } = c;
  const fonts = FONT_PAIRS[o.theme.fontPair];
  // Respeita a marca: fundo escuro continua escuro. A forma é sempre o accent.
  const bg = o.theme.bg;
  const fg = o.theme.fg;
  const accent = o.theme.accent;
  const enfase = corEnfase(bg, fg, accent);
  const temFoto = !!o.image?.width;
  const local: Chrome = { ...c, fg, accent };

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawLogo(ctx, o, local);

  // 1) O texto é medido ANTES da forma: é ele que decide onde a forma começa,
  //    senão o corpo cai em cima da foto e some.
  const topY = pad * (o.logo?.width ? 2.0 : 1.05);
  const t = fitText(ctx, fonts.upper ? o.slide.titulo.toUpperCase() : o.slide.titulo, {
    font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`,
    maxWidth: W - pad * 2,
    maxHeight: H * 0.24,
    max: o.slide.tipo === "capa" ? W * 0.098 : W * 0.082,
    min: W * 0.042,
    lh: 1.1,
    tracking: fonts.tracking,
  });

  const corpoBlock = o.slide.corpo
    ? fitText(ctx, o.slide.corpo, {
        font: (s) => `400 ${s}px ${fonts.body}`,
        maxWidth: W * 0.74,
        maxHeight: H * 0.11,
        max: W * 0.031,
        min: W * 0.022,
        lh: 1.5,
      })
    : null;

  const fimDoTexto = topY + t.height + (corpoBlock ? W * 0.03 + corpoBlock.height : 0);
  // Sem foto a forma é só cor: encolhe, para não virar um bloco vazio enorme.
  const topoForma = temFoto ? fimDoTexto + H * 0.045 : Math.max(fimDoTexto + H * 0.1, H * 0.56);

  // 2) A forma, com a foto vivendo dentro dela.
  ctx.save();
  caminhoFormaOrganica(ctx, W, H, o.index, topoForma);
  ctx.fillStyle = accent;
  ctx.fill();
  if (temFoto) {
    ctx.clip();
    drawCover(ctx, o.image as HTMLImageElement, 0, topoForma - H * 0.06, W, H - topoForma + H * 0.06);
    // Véu na cor da marca: a foto pertence à peça em vez de parecer colada.
    ctx.fillStyle = rgba(accent, 0.18);
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();

  // 3) Texto por cima do fundo limpo, nunca sobre a foto.
  ctx.fillStyle = fg;
  drawBlock(ctx, t, pad, topY, {
    font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`,
    tracking: fonts.tracking,
    accent: enfase,
  });
  if (corpoBlock) {
    ctx.fillStyle = rgba(fg, 0.72);
    drawBlock(ctx, corpoBlock, pad, topY + t.height + W * 0.03, { font: (s) => `400 ${s}px ${fonts.body}` });
  }

  // 4) Selo circular: o texto que corre na curva é a marca ou a chamada do CTA,
  //    nunca um rótulo genérico. O miolo é o número.
  if (o.slide.destaque) {
    const raio = W * 0.115;
    const curva = o.slide.tipo === "cta"
      ? (o.brand?.handle || "fale com a gente")
      : (o.brand?.nome || o.brand?.handle || "");
    const fundoSelo = isLight(accent) ? "#101512" : "#FFFFFF";
    drawSeloCircular(ctx, curva || o.slide.destaque, W - pad - raio * 0.72, H - pad * 2.0, raio, {
      cor: fundoSelo,
      corTexto: corEnfase(fundoSelo, contrastOn(fundoSelo), accent),
      font: fonts.body,
      miolo: o.slide.destaque.length <= 9 ? o.slide.destaque : undefined,
    });
  }

  if (o.total > 1 && o.mostrarNumero !== false) {
    drawGlassPill(ctx, `${String(o.index + 1).padStart(2, "0")} / ${String(o.total).padStart(2, "0")}`, pad, H - pad * 1.2, {
      fontSize: Math.round(W * 0.018), font: fonts.body, fg: contrastOn(accent), img: o.image, W, H, escuro: !isLight(accent),
    });
  }
}

// ── Movimentos de agência ─────────────────────────────────────────────────
// O que separa uma peça de agência de um template: fundo com malha, tipografia
// gigante sangrando pela borda, cartões sólidos empilhados em camadas e um
// bloco de contato fixo. Cada um desenhado abaixo como peça independente.

/** Papel quadriculado, quase imperceptível. Dá textura sem virar assunto. */
function drawMalha(ctx: CanvasRenderingContext2D, W: number, H: number, cor: string) {
  const passo = W / 18;
  ctx.save();
  ctx.strokeStyle = rgba(cor, 0.07);
  ctx.lineWidth = Math.max(1, W * 0.0012);
  ctx.beginPath();
  for (let x = passo; x < W; x += passo) {
    ctx.moveTo(Math.round(x) + 0.5, 0);
    ctx.lineTo(Math.round(x) + 0.5, H);
  }
  for (let y = passo; y < H; y += passo) {
    ctx.moveTo(0, Math.round(y) + 0.5);
    ctx.lineTo(W, Math.round(y) + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Palavra gigante cortada pela borda, usada como textura de fundo.
 * O corte é o ponto: tipografia inteira e centrada vira título, tipografia
 * sangrando vira grafismo. Por isso a posição é deliberadamente fora da tela.
 */
function drawTipoSangrando(
  ctx: CanvasRenderingContext2D,
  palavra: string,
  W: number,
  H: number,
  o: {
    font: string; peso: number; cor: string;
    borda: "baixo" | "direita" | "esquerda"; tamanho: number; corte?: number;
  },
) {
  const txt = palavra.trim().toUpperCase();
  if (!txt) return;
  ctx.save();
  ctx.font = `${o.peso} ${o.tamanho}px ${o.font}`;
  ctx.fillStyle = o.cor;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  setTracking(ctx, -o.tamanho * 0.03);
  const larg = ctx.measureText(txt).width;
  if (o.borda === "baixo") {
    // `corte` = quanto da caixa fica fora da tela. Quanto menor, mais a palavra
    // sobe e mais base ela ocupa.
    ctx.fillText(txt, -W * 0.04, H + o.tamanho * (o.corte ?? 0.28));
  } else if (o.borda === "direita") {
    ctx.fillText(txt, W - larg * 0.72, H * 0.55);
  } else {
    ctx.fillText(txt, -larg * 0.28, H * 0.55);
  }
  setTracking(ctx, 0);
  ctx.restore();
}

/** Cartão sólido. É o tijolo das camadas — sem vidro, sem borrão. */
function drawCartao(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cor: string,
  raio: number,
  sombra = 0,
) {
  ctx.save();
  if (sombra > 0) {
    ctx.shadowColor = `rgba(0,0,0,${sombra})`;
    ctx.shadowBlur = w * 0.06;
    ctx.shadowOffsetY = w * 0.018;
  }
  roundRectPath(ctx, x, y, w, h, raio);
  ctx.fillStyle = cor;
  ctx.fill();
  ctx.restore();
}

/**
 * Bloco de contato — presente em toda peça das referências da Carol.
 * É o que faz a peça parecer entregue por uma agência e não gerada: o leitor
 * sempre sabe para onde ligar. Devolve a altura ocupada.
 */
function drawBlocoContato(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  o: { brand: BrandInfo; fundo: string; fg: string; font: string; W: number },
): number {
  const { W } = o;
  const rotulo = Math.round(W * 0.019);
  const valor = Math.round(W * 0.031);
  const padI = W * 0.035;
  const h = padI * 2 + rotulo + valor * 1.5;
  drawCartao(ctx, x, y, w, h, o.fundo, W * 0.03);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = rgba(o.fg, 0.6);
  ctx.font = `700 ${rotulo}px ${o.font}`;
  setTracking(ctx, rotulo * 0.14);
  ctx.fillText("FALE COM A GENTE", x + padI, y + padI + rotulo);
  setTracking(ctx, 0);

  ctx.fillStyle = o.fg;
  ctx.font = `700 ${valor}px ${o.font}`;
  ctx.fillText((o.brand.handle || o.brand.nome || "").trim(), x + padI, y + padI + rotulo + valor * 1.25);
  return h;
}

/**
 * Pílula com seta em círculo — o elemento de apoio das referências ("Leia a
 * legenda ↓", os bullets com check). Serve de ponte quando a peça sem foto fica
 * com um vão morto entre o cartão e o rodapé: dá densidade sem inventar assunto.
 * Devolve a altura ocupada.
 */
function drawPilulaSeta(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  texto: string,
  o: { fundo: string; fg: string; accent: string; sobreAccent: string; font: string; W: number },
): number {
  const { W } = o;
  const corpo = Math.round(W * 0.028);
  const padI = W * 0.028;
  const h = corpo + padI * 2;
  const raioSeta = h * 0.34;
  ctx.font = `700 ${corpo}px ${o.font}`;
  const larg = padI * 2 + ctx.measureText(texto).width + raioSeta * 2 + padI;

  drawCartao(ctx, x, y, larg, h, o.fundo, h / 2);
  ctx.fillStyle = o.fg;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(texto, x + padI, y + padI + corpo * 0.82);

  // Seta dentro do círculo, apontando para a direita (avança o carrossel).
  const ccx = x + larg - padI * 0.6 - raioSeta;
  const ccy = y + h / 2;
  ctx.beginPath();
  ctx.arc(ccx, ccy, raioSeta, 0, Math.PI * 2);
  ctx.fillStyle = o.accent;
  ctx.fill();
  ctx.strokeStyle = o.sobreAccent;
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const braco = raioSeta * 0.42;
  ctx.beginPath();
  ctx.moveTo(ccx - braco, ccy);
  ctx.lineTo(ccx + braco, ccy);
  ctx.moveTo(ccx + braco * 0.25, ccy - braco * 0.75);
  ctx.lineTo(ccx + braco, ccy);
  ctx.lineTo(ccx + braco * 0.25, ccy + braco * 0.75);
  ctx.stroke();
  return h;
}

/**
 * Layout "agência" — a estrutura que se repete nas referências: foto sangrando
 * de um lado, cartões sólidos empilhados do outro, malha no papel e contato
 * fixo. Sem foto, a peça vira cor cheia com a palavra-chave sangrando embaixo.
 */
/**
 * Layout "agência" — não é UMA composição, são cinco.
 *
 * Um carrossel com o mesmo arranjo em todo slide é template, não carrossel. As
 * referências da Carol têm seis peças com seis composições e o MESMO DNA: dois
 * tons da marca + papel, cartão sólido, bloco de contato, tipografia sangrando.
 * Aqui o DNA é fixo e o ARRANJO gira por slide.
 */
type ArranjoAg = "foto-cheia" | "cartao-foto" | "duas-colunas" | "cor-cheia" | "cartao-papel";

function arranjoDoSlide(o: RenderOptions, temFoto: boolean): ArranjoAg {
  if (temFoto) {
    // A capa fica sempre com a foto inteira. O ciclo dos demais começa DEPOIS
    // dela: com `index % 3` o slide 3 caía de novo em "foto-cheia" e o carrossel
    // repetia o arranjo — que é exatamente o defeito que isso veio corrigir.
    if (o.slide.tipo === "capa") return "foto-cheia";
    const ciclo: ArranjoAg[] = ["cartao-foto", "duas-colunas", "foto-cheia"];
    return ciclo[(o.index + ciclo.length - 1) % ciclo.length];
  }
  if (o.slide.tipo === "capa" || o.slide.tipo === "cta") return "cor-cheia";
  // Alternar por `index % 2` não serve: os slides sem foto costumam cair em
  // índices de mesma paridade (1 e 3) e voltavam ao mesmo arranjo.
  return Math.floor(o.index / 2) % 2 === 0 ? "cartao-papel" : "cor-cheia";
}

interface PaletaAg {
  forte: string;
  papel: string;
  claro: string;
  sobreForte: string;
  sobreClaro: string;
  tinta: string;
}

function paletaAgencia(theme: Theme): PaletaAg {
  const forte = theme.accent;
  const papel = isLight(theme.bg) ? theme.bg : "#F2F4F7";
  // O cartão de trás é SEMPRE mais claro que o da frente — é assim que a camada
  // se lê. Mas se ele encostar no papel some a camada, então recua um pouco.
  const lum = (h: string) => {
    const [r, g, b] = hexToRgb(h);
    return (r * 299 + g * 587 + b * 114) / 1000;
  };
  // Com a SEGUNDA COR da marca definida, ela é o tom de apoio — é o "dois tons
  // da mesma cor" das referências. Derivar só serve enquanto a marca não tem
  // par próprio: acerta por acaso, e em marca de duas cores erra sempre.
  let claro = theme.accent2 || shade(forte, 0.78);
  // A camada de trás precisa se separar do papel; se a cor escolhida encostar
  // nele, escurece o necessário sem trocar a matiz que a Carol definiu.
  if (Math.abs(lum(claro) - lum(papel)) < 14) {
    claro = theme.accent2 ? shade(theme.accent2, -0.25) : shade(forte, 0.5);
  }
  return {
    forte,
    papel,
    claro,
    sobreForte: contrastOn(forte),
    sobreClaro: contrastOn(claro),
    tinta: isLight(papel) ? "#12161C" : "#FFFFFF",
  };
}

interface BlocoCartaoAg {
  t: TextBlock;
  b: TextBlock | null;
  rotulo: number;
  padI: number;
  altura: number;
}

/** Mede o conteúdo do cartão. Separado do desenho porque a altura decide a
 *  posição — e a posição só existe depois de saber a altura. */
function medirCartaoAg(
  ctx: CanvasRenderingContext2D,
  o: RenderOptions,
  fonts: (typeof FONT_PAIRS)[FontPairId],
  W: number,
  H: number,
  larg: number,
  lim: { maxTitulo: number; tituloH: number; corpoH: number },
): BlocoCartaoAg {
  const padI = W * 0.055;
  const rotulo = Math.round(W * 0.02);
  const t = fitText(ctx, fonts.upper ? o.slide.titulo.toUpperCase() : o.slide.titulo, {
    font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`,
    maxWidth: larg - padI * 2,
    maxHeight: H * lim.tituloH,
    max: lim.maxTitulo,
    min: W * 0.038,
    lh: 1.12,
    tracking: fonts.tracking,
    // O título do `agencia` é sempre desenhado com a ênfase em pílula, nos dois
    // lugares que usam este medidor (cartão sólido e peça de cor cheia).
    enfaseEmPilula: true,
  });
  const b = o.slide.corpo
    ? fitText(ctx, o.slide.corpo, {
        font: (s) => `400 ${s}px ${fonts.body}`,
        maxWidth: larg - padI * 2,
        maxHeight: H * lim.corpoH,
        max: W * 0.033,
        min: W * 0.022,
        lh: 1.5,
      })
    : null;
  return {
    t,
    b,
    rotulo,
    padI,
    altura: padI * 2 + rotulo * 2.2 + t.height + (b ? W * 0.03 + b.height : 0),
  };
}

/** Desenha o cartão sólido com a camada de trás e o texto dentro. */
function desenharCartaoAg(
  ctx: CanvasRenderingContext2D,
  o: RenderOptions,
  bc: BlocoCartaoAg,
  x: number,
  y: number,
  larg: number,
  p: PaletaAg,
  W: number,
  fonts: (typeof FONT_PAIRS)[FontPairId],
  opts: { camada?: boolean; sombra?: number; align?: CanvasTextAlign } = {},
) {
  const raio = W * 0.05;
  const align = opts.align ?? "left";
  if (opts.camada !== false) {
    drawCartao(ctx, x + W * 0.045, y - W * 0.028, larg - W * 0.03, bc.altura, p.claro, raio);
  }
  drawCartao(ctx, x, y, larg, bc.altura, p.forte, raio, opts.sombra ?? 0);

  const tx = align === "center" ? x + larg / 2 : x + bc.padI;
  let cy = y + bc.padI;

  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = rgba(p.sobreForte, 0.62);
  ctx.font = `700 ${bc.rotulo}px ${fonts.body}`;
  setTracking(ctx, bc.rotulo * 0.16);
  ctx.fillText((o.brand.nome || "").toUpperCase(), tx, cy + bc.rotulo);
  setTracking(ctx, 0);
  ctx.textAlign = "left";
  cy += bc.rotulo * 2.2;

  // O cartão já é cor cheia: ênfase por cor sumiria. Vai de tarja no tom claro.
  ctx.fillStyle = p.sobreForte;
  drawBlock(ctx, bc.t, tx, cy, {
    font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`,
    tracking: fonts.tracking,
    accent: p.claro,
    tarja: true,
    align,
  });
  cy += bc.t.height;

  if (bc.b) {
    cy += W * 0.03;
    ctx.fillStyle = rgba(p.sobreForte, 0.82);
    drawBlock(ctx, bc.b, tx, cy, { font: (s) => `400 ${s}px ${fonts.body}`, align });
  }
}

/**
 * Palavra-chave gigante do fundo. Nunca repete o que já está em tarja no
 * título — três aparições do mesmo número na mesma peça é ruído, não repetição
 * proposital. O corpo sai da LARGURA da palavra: com tamanho fixo, "COLHEITA"
 * mostra só "CO" e "SÓ" ocupa meia peça.
 */
function chaveGrafica(o: RenderOptions): { palavra: string; jaNoTitulo: boolean } {
  const tituloLimpo = o.slide.titulo.replace(/[*]/g, "");
  const destaque = (o.slide.destaque || "").replace(/[*]/g, "").trim();
  const jaNoTitulo = !!destaque && tituloLimpo.toLowerCase().includes(destaque.toLowerCase());
  const maior = tituloLimpo
    .split(/\s+/)
    .filter((w) => w.replace(/[^\p{L}\p{N}]/gu, "").length > 3)
    .sort((a, b) => b.length - a.length)[0];
  return {
    palavra: (jaNoTitulo || !destaque ? maior : destaque) || tituloLimpo.split(/\s+/)[0] || "",
    jaNoTitulo,
  };
}

function corpoDaChave(
  ctx: CanvasRenderingContext2D,
  palavra: string,
  fonts: (typeof FONT_PAIRS)[FontPairId],
  W: number,
  alvo: number,
): number {
  ctx.font = `${fonts.displayWeight} 100px ${fonts.display}`;
  const ref = Math.max(1, ctx.measureText(palavra.toUpperCase()).width);
  return Math.min(W * 0.46, Math.max(W * 0.15, (100 * alvo) / ref));
}

/** Barra de progresso do layout, presa a uma coluna — nunca cruzando a foto. */
function rodapeAgencia(
  ctx: CanvasRenderingContext2D,
  o: RenderOptions,
  W: number,
  H: number,
  pad: number,
  x: number,
  larg: number,
  cor: string,
  tinta: string,
  fonts: (typeof FONT_PAIRS)[FontPairId],
) {
  if (o.total <= 1) return;
  const segW = larg / o.total;
  const barH = Math.max(3, W * 0.005);
  const by = H - pad * 0.5;
  for (let i = 0; i < o.total; i++) {
    ctx.fillStyle = i <= o.index ? cor : rgba(tinta, 0.18);
    roundRectPath(ctx, x + segW * i + (i ? W * 0.004 : 0), by, segW - W * 0.004, barH, barH / 2);
    ctx.fill();
  }
  if (o.mostrarNumero !== false) {
    ctx.fillStyle = rgba(tinta, 0.5);
    ctx.font = `700 ${Math.round(W * 0.022)}px ${fonts.body}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(
      `${String(o.index + 1).padStart(2, "0")}/${String(o.total).padStart(2, "0")}`,
      x,
      by - W * 0.022,
    );
  }
}

function layoutAgencia(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  const { W, H, pad } = c;
  const fonts = FONT_PAIRS[o.theme.fontPair];
  const temFoto = !!o.image?.width;
  const p = paletaAgencia(o.theme);
  const arranjo = arranjoDoSlide(o, temFoto);
  const cx = pad * 0.75;
  const contatoH = W * 0.035 * 2 + Math.round(W * 0.019) + Math.round(W * 0.031) * 1.5;
  const { palavra, jaNoTitulo } = chaveGrafica(o);
  const destaque = (o.slide.destaque || "").replace(/[*]/g, "").trim();
  const local: Chrome = { ...c, fg: p.tinta, accent: p.forte };

  if (arranjo === "foto-cheia") {
    // Foto ocupa a peça inteira; o cartão flutua sobre ela e foge do rosto.
    drawCover(ctx, o.image as HTMLImageElement, 0, 0, W, H);
    // Cartão deliberadamente compacto: num fundo de foto inteira, um cartão
    // grande não deixa NENHUMA faixa livre e acaba em cima do rosto. Aqui o
    // contato vira uma linha no rodapé em vez de um segundo cartão.
    const larg = W * 0.62;
    const bc = medirCartaoAg(ctx, o, fonts, W, H, larg, {
      maxTitulo: W * 0.072,
      tituloH: 0.22,
      corpoH: 0.11,
    });
    // Ancorado embaixo, sem depender de detecção de rosto: a heurística de pele
    // erra feio em foto de fim de tarde (a imagem inteira fica cor de pele) e
    // rosto quase sempre está na metade DE CIMA. Base é o lugar seguro.
    const topo = H - pad * 1.55 - bc.altura;
    desenharCartaoAg(ctx, o, bc, cx, topo, larg, p, W, fonts, { camada: false, sombra: 0.28 });

    drawPill(ctx, (o.brand.handle || o.brand.nome || "").trim(), cx, pad * 0.7, {
      fontSize: Math.round(W * 0.026),
      bg: p.forte,
      fg: p.sobreForte,
      font: fonts.body,
    });
    drawLogo(ctx, o, local);
    rodapeAgencia(ctx, o, W, H, pad, cx, W - cx * 2, p.forte, "#FFFFFF", fonts);
    return;
  }

  if (arranjo === "cor-cheia") {
    // Peça de cor cheia, texto centrado e a palavra-chave rasgando a base.
    ctx.fillStyle = p.forte;
    ctx.fillRect(0, 0, W, H);
    const tam = corpoDaChave(ctx, palavra, fonts, W, W * 1.2);
    drawTipoSangrando(ctx, palavra, W, H, {
      font: fonts.display,
      peso: fonts.displayWeight,
      cor: rgba(p.sobreForte, 0.12),
      borda: "baixo",
      tamanho: tam,
      corte: 0.12,
    });
    const larg = W - cx * 2;
    const bc = medirCartaoAg(ctx, o, fonts, W, H, larg, {
      maxTitulo: W * 0.1,
      tituloH: 0.32,
      corpoH: 0.16,
    });
    // Sem cartão: o texto vive direto sobre a cor. O "cartão" aqui é a peça.
    const piso = H - tam * (0.72 - 0.12);
    let cy = Math.max(pad * 1.4, (piso - (bc.altura - bc.padI * 2)) / 2);
    ctx.textAlign = "center";
    ctx.fillStyle = rgba(p.sobreForte, 0.62);
    ctx.font = `700 ${bc.rotulo}px ${fonts.body}`;
    setTracking(ctx, bc.rotulo * 0.16);
    ctx.fillText((o.brand.nome || "").toUpperCase(), W / 2, cy + bc.rotulo);
    setTracking(ctx, 0);
    ctx.textAlign = "left";
    cy += bc.rotulo * 2.4;

    ctx.fillStyle = p.sobreForte;
    drawBlock(ctx, bc.t, W / 2, cy, {
      font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`,
      tracking: fonts.tracking,
      accent: p.claro,
      tarja: true,
      align: "center",
    });
    cy += bc.t.height;
    if (bc.b) {
      cy += W * 0.03;
      ctx.fillStyle = rgba(p.sobreForte, 0.82);
      drawBlock(ctx, bc.b, W / 2, cy, { font: (s) => `400 ${s}px ${fonts.body}`, align: "center" });
      cy += bc.b.height;
    }
    drawBlocoContato(ctx, (W - W * 0.5) / 2, cy + W * 0.07, W * 0.5, {
      brand: o.brand,
      fundo: p.claro,
      fg: p.sobreClaro,
      font: fonts.body,
      W,
    });
    drawLogo(ctx, o, local);
    rodapeAgencia(ctx, o, W, H, pad, cx, W - cx * 2, p.claro, p.sobreForte, fonts);
    return;
  }

  if (arranjo === "duas-colunas") {
    // Papel: cartão de texto à esquerda, foto em cartão arredondado sangrando
    // pela direita, e a palavra gigante correndo atrás pela borda.
    ctx.fillStyle = p.papel;
    ctx.fillRect(0, 0, W, H);
    drawMalha(ctx, W, H, p.forte);
    // A foto sangra pela direita E por baixo: cartão parado no meio da peça
    // deixa a base morta.
    const fx = W * 0.58;
    ctx.save();
    roundRectPath(ctx, fx, H * 0.22, W * 0.48, H * 0.9, W * 0.05);
    ctx.clip();
    drawCover(ctx, o.image as HTMLImageElement, fx, H * 0.22, W * 0.48, H * 0.9);
    ctx.restore();

    const larg = W * 0.52;
    // A palavra gigante ocupa a base da coluna de texto, presa a ela.
    const tam = corpoDaChave(ctx, palavra, fonts, W, fx * 1.15);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, fx, H);
    ctx.clip();
    drawTipoSangrando(ctx, palavra, W, H, {
      font: fonts.display,
      peso: fonts.displayWeight,
      cor: rgba(p.forte, 0.15),
      borda: "baixo",
      tamanho: tam,
      corte: 0.24,
    });
    ctx.restore();
    const bc = medirCartaoAg(ctx, o, fonts, W, H, larg, {
      maxTitulo: W * 0.068,
      tituloH: 0.3,
      corpoH: 0.16,
    });
    const piso = H - tam * (0.72 - 0.24);
    const topo = Math.max(pad, (piso - bc.altura - W * 0.03 - contatoH) / 2);
    desenharCartaoAg(ctx, o, bc, cx, topo, larg, p, W, fonts, { camada: true, sombra: 0.14 });
    drawBlocoContato(ctx, cx, topo + bc.altura + W * 0.03, larg * 0.92, {
      brand: o.brand,
      fundo: p.claro,
      fg: p.sobreClaro,
      font: fonts.body,
      W,
    });
    drawLogo(ctx, o, local);
    rodapeAgencia(ctx, o, W, H, pad, cx, larg, p.forte, p.tinta, fonts);
    return;
  }

  // "cartao-foto" e "cartao-papel": papel + cartões empilhados. Com foto ela
  // sangra pela direita; sem foto, a palavra-chave ocupa a base.
  ctx.fillStyle = p.papel;
  ctx.fillRect(0, 0, W, H);
  drawMalha(ctx, W, H, p.forte);

  const fx = W * 0.44;
  if (temFoto) drawCover(ctx, o.image as HTMLImageElement, fx, 0, W - fx, H);

  const alvo = (temFoto ? fx : W) * 1.22;
  const tam = corpoDaChave(ctx, palavra, fonts, W, alvo);
  const corte = temFoto ? 0.26 : 0.12;
  ctx.save();
  if (temFoto) {
    ctx.beginPath();
    ctx.rect(0, 0, fx, H);
    ctx.clip();
  }
  drawTipoSangrando(ctx, palavra, W, H, {
    font: fonts.display,
    peso: fonts.displayWeight,
    cor: rgba(p.forte, temFoto ? 0.16 : 0.17),
    borda: "baixo",
    tamanho: tam,
    corte,
  });
  ctx.restore();
  const piso = H - tam * (0.72 - corte);

  const larg = temFoto ? W * 0.63 : W - pad * 2;
  const bc = medirCartaoAg(ctx, o, fonts, W, H, larg, {
    // Sem foto o CARTÃO É A PEÇA: o texto tem que crescer para ocupá-la. Com os
    // limites de quando há foto, o cartão terminava no meio da altura e sobrava
    // um quarto do slide vazio entre o contato e a palavra da base.
    maxTitulo: temFoto ? (o.slide.tipo === "capa" ? W * 0.088 : W * 0.072) : W * 0.105,
    tituloH: temFoto ? 0.34 : 0.42,
    corpoH: temFoto ? 0.17 : 0.2,
  });
  // Altura da pílula com seta, que só existe na peça sem foto. É determinística
  // (ver drawPilulaSeta), então dá para reservar ANTES de desenhar.
  const pilulaH = Math.round(W * 0.028) + W * 0.056;
  const gapPilula = W * 0.035;
  const gapContato = W * 0.04;
  // Empilhamento contínuo — cartão, pílula e contato colados — com o conjunto
  // centrado entre o topo e a palavra da base. Ancorar o cartão em cima e o
  // contato lá embaixo (o que havia antes) não fechava o vão: só o mudava de
  // lugar, e o buraco ficava bem no meio da peça.
  const alturaPilha = temFoto
    ? bc.altura + W * 0.03 + contatoH
    : bc.altura + gapPilula + pilulaH + gapContato + contatoH;
  const topo = Math.max(pad * 0.9, (piso - alturaPilha) / 2);
  const yContato = temFoto
    ? topo + bc.altura + W * 0.03
    : topo + bc.altura + gapPilula + pilulaH + gapContato;
  desenharCartaoAg(ctx, o, bc, cx, topo, larg, p, W, fonts, { camada: true, sombra: temFoto ? 0.22 : 0 });
  if (!temFoto) {
    // A ponte entre o cartão e o rodapé. Diz o que fazer com o slide, que é o
    // papel que essa pílula tem nas referências.
    const chamada = destaque && !jaNoTitulo ? destaque : o.slide.tipo === "cta" ? "Fale com a gente" : "Arrasta pro lado";
    drawPilulaSeta(ctx, cx, topo + bc.altura + gapPilula, chamada, {
      fundo: p.claro,
      fg: p.sobreClaro,
      accent: p.forte,
      sobreAccent: p.sobreForte,
      font: fonts.body,
      W,
    });
  }
  drawBlocoContato(ctx, cx, yContato, larg * 0.72, {
    brand: o.brand,
    fundo: p.claro,
    fg: p.sobreClaro,
    font: fonts.body,
    W,
  });

  if (destaque && !jaNoTitulo && temFoto && o.slide.tipo !== "cta") {
    drawPill(ctx, destaque.toUpperCase(), W * 0.5, H - pad * 1.9, {
      fontSize: Math.round(W * 0.03),
      bg: p.papel,
      fg: p.tinta,
      font: fonts.body,
    });
  }

  drawLogo(ctx, o, local);
  rodapeAgencia(ctx, o, W, H, pad, cx, temFoto ? fx - cx - W * 0.03 : larg, p.forte, p.tinta, fonts);
}

function layoutFoto(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  const { W, H, pad } = c;
  const fonts = FONT_PAIRS[o.theme.fontPair];
  const fg = "#FFFFFF";
  const accent = o.theme.accent;
  const local: Chrome = { ...c, fg, accent };

  if (o.image?.width) {
    drawCover(ctx, o.image, 0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, shade(o.theme.accent, -0.55));
    g.addColorStop(1, o.theme.bg);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // Máscara para leitura
  const scrim = ctx.createLinearGradient(0, H * 0.28, 0, H);
  scrim.addColorStop(0, "rgba(0,0,0,0)");
  scrim.addColorStop(0.5, "rgba(0,0,0,0.62)");
  scrim.addColorStop(1, "rgba(0,0,0,0.92)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, H);
  const topScrim = ctx.createLinearGradient(0, 0, 0, H * 0.28);
  topScrim.addColorStop(0, "rgba(0,0,0,0.5)");
  topScrim.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topScrim;
  ctx.fillRect(0, 0, W, H * 0.28);

  // Filete de acento no topo
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, Math.max(4, W * 0.007));

  // O fundo aqui é a foto escurecida pelo véu: trate como escuro.
  const enfase = corEnfase("#0A0C0F", fg, accent);

  drawLogo(ctx, o, local);

  const kickerY = pad * (o.logo?.width ? 2.0 : 1.0);
  drawKicker(ctx, o.slide.tipo === "cta" ? "PRÓXIMO PASSO" : `${String(o.index + 1).padStart(2, "0")} / ${String(o.total).padStart(2, "0")}`, pad, kickerY, {
    size: Math.round(W * 0.023),
    color: rgba(accent, 0.95),
    font: fonts.body,
  });

  const bottomLimit = H - pad * 1.5;
  const t = fitText(ctx, fonts.upper ? o.slide.titulo.toUpperCase() : o.slide.titulo, {
    font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`,
    maxWidth: W - pad * 2,
    maxHeight: H * (o.slide.tipo === "capa" ? 0.34 : 0.28),
    max: o.slide.tipo === "capa" ? W * 0.13 : W * 0.095,
    min: W * 0.046,
    lh: 1.1,
    tracking: fonts.tracking,
  });

  const corpoBlock = o.slide.corpo
    ? fitText(ctx, o.slide.corpo, {
        font: (s) => `400 ${s}px ${fonts.body}`,
        maxWidth: W * 0.88,
        maxHeight: H * 0.16,
        max: W * 0.038,
        min: W * 0.025,
        lh: 1.5,
      })
    : null;

  const bloco = t.height + (corpoBlock ? corpoBlock.height + W * 0.04 : 0);
  // Reserva o pé: é onde entram a pílula de arraste e o rodapé. Sem isso o
  // texto descia até colidir com o botão.
  const pePeca = bottomLimit - bloco - W * 0.14;
  const preferidoFoto = pePeca / H;
  const topoLivreFoto = faixaLivre(o.image, (bloco + W * 0.14) / H, preferidoFoto);
  const startY = Math.max(pad * 2.4, Math.min(topoLivreFoto * H, pePeca));

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = W * 0.03;
  ctx.fillStyle = fg;
  drawBlock(ctx, t, pad, startY, { font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`, tracking: fonts.tracking, accent: enfase });
  ctx.restore();

  if (corpoBlock) {
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    drawBlock(ctx, corpoBlock, pad, startY + t.height + W * 0.04, { font: (s) => `400 ${s}px ${fonts.body}` });
  }

  drawArraste(ctx, o, local);
  drawFooter(ctx, o, local);
}


// ── Peças do padrão "foto + vidro" ───────────────────────────────────────
/** Pílula translúcida com o fundo borrado atrás — vidro de verdade. */
function drawGlassPill(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  o: { fontSize: number; font: string; fg: string; img?: HTMLImageElement | null; W: number; H: number; escuro?: boolean; alinhar?: "esq" | "dir" },
) {
  ctx.font = `600 ${o.fontSize}px ${o.font}`;
  setTracking(ctx, o.fontSize * 0.08);
  const rotulo = texto.toUpperCase();
  const padX = o.fontSize * 1.3;
  const w = ctx.measureText(rotulo).width + padX * 2;
  const h = o.fontSize * 2.6;
  const px = o.alinhar === "dir" ? x - w : x;

  ctx.save();
  roundRectPath(ctx, px, y, w, h, h / 2);
  ctx.clip();
  if (o.img?.width) {
    ctx.filter = "blur(18px)";
    drawCover(ctx, o.img, 0, 0, o.W, o.H);
    ctx.filter = "none";
  }
  ctx.fillStyle = o.escuro ? "rgba(10,12,15,0.34)" : "rgba(255,255,255,0.32)";
  ctx.fillRect(px, y, w, h);
  ctx.restore();

  ctx.strokeStyle = o.escuro ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.5)";
  ctx.lineWidth = Math.max(1, o.W * 0.0012);
  roundRectPath(ctx, px, y, w, h, h / 2);
  ctx.stroke();

  ctx.fillStyle = o.fg;
  ctx.textBaseline = "middle";
  ctx.fillText(rotulo, px + padX, y + h / 2 + o.fontSize * 0.05);
  ctx.textBaseline = "alphabetic";
  setTracking(ctx, 0);
  return { w, h };
}

/** Botão de arraste: pílula de vidro + seta dentro de um círculo colorido. */
function drawSwipeButton(
  ctx: CanvasRenderingContext2D,
  texto: string,
  o: { W: number; H: number; pad: number; accent: string; font: string; img?: HTMLImageElement | null; escuro?: boolean },
) {
  const fs = Math.round(o.W * 0.024);
  ctx.font = `700 ${fs}px ${o.font}`;
  setTracking(ctx, fs * 0.06);
  const label = texto.toUpperCase();
  const tw = ctx.measureText(label).width;
  const h = fs * 3;
  const circ = h * 0.86;
  const w = tw + fs * 2.4 + circ;
  const x = o.W - o.pad - w;
  const y = o.H - o.pad - h * 1.35;

  ctx.save();
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.clip();
  if (o.img?.width) {
    ctx.filter = "blur(18px)";
    drawCover(ctx, o.img, 0, 0, o.W, o.H);
    ctx.filter = "none";
  }
  ctx.fillStyle = o.escuro ? "rgba(10,12,15,0.44)" : "rgba(255,255,255,0.36)";
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = o.escuro ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(1, o.W * 0.0012);
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.stroke();

  ctx.fillStyle = o.escuro ? "#FFFFFF" : "#0A0C0F";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + fs * 1.2, y + h / 2 + fs * 0.05);
  setTracking(ctx, 0);

  const cx = x + w - circ / 2 - (h - circ) / 2;
  const cy = y + h / 2;
  ctx.fillStyle = o.accent;
  ctx.beginPath();
  ctx.arc(cx, cy, circ / 2, 0, Math.PI * 2);
  ctx.fill();

  const seta = circ * 0.32;
  ctx.strokeStyle = contrastOn(o.accent);
  ctx.lineWidth = Math.max(2, o.W * 0.0034);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - seta / 2, cy);
  ctx.lineTo(cx + seta / 2, cy);
  ctx.moveTo(cx + seta * 0.08, cy - seta * 0.42);
  ctx.lineTo(cx + seta / 2, cy);
  ctx.lineTo(cx + seta * 0.08, cy + seta * 0.42);
  ctx.stroke();
  ctx.textBaseline = "alphabetic";
}

/** Cabeçalho: marca à esquerda, @ à direita, ambos em vidro. */
function drawGlassHeader(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome, escuro: boolean) {
  const fonts = FONT_PAIRS[o.theme.fontPair];
  const fs = Math.round(c.W * 0.02);
  const y = c.pad * 0.8;
  const fg = escuro ? "#FFFFFF" : "#0A0C0F";
  const esquerda = (o.brand.nome || "").trim();
  const direita = (o.brand.handle || "").trim();

  if (esquerda) {
    drawGlassPill(ctx, esquerda, c.pad, y, { fontSize: fs, font: fonts.body, fg, img: o.image, W: c.W, H: c.H, escuro });
  }
  if (direita) {
    drawGlassPill(ctx, direita, c.W - c.pad, y, { fontSize: fs, font: fonts.body, fg, img: o.image, W: c.W, H: c.H, escuro, alinhar: "dir" });
  }
}

/** Foto de fundo — ou gradiente da marca, quando ainda não há imagem. */
function drawFundoFoto(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome): boolean {
  if (o.image?.width) {
    drawCover(ctx, o.image, 0, 0, c.W, c.H);
    return true;
  }
  const g = ctx.createLinearGradient(0, 0, c.W, c.H);
  g.addColorStop(0, shade(o.theme.accent, -0.5));
  g.addColorStop(1, o.theme.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.W, c.H);
  return false;
}

// ── Layout VIDRO ─────────────────────────────────────────────────────────
/**
 * Arranjo de cada slide no `vidro`. Antes o layout desenhava TODO slide igual —
 * foto inteira + cartão no mesmo lugar — e um carrossel de 7 slides virava a
 * mesma peça sete vezes ("fica parecendo que é o mesmo post"). O `agencia` já
 * resolvia isso alternando arranjos; aqui é o mesmo princípio, dentro do mesmo
 * sistema visual (vidro sobre foto), para o carrossel ter ritmo sem virar
 * colcha de retalhos.
 */
type ArranjoVidro = "heroi" | "estreito" | "meia-meia" | "faixa" | "rodape";

function arranjoDoVidro(o: RenderOptions, temFoto: boolean): ArranjoVidro {
  if (!temFoto) return "meia-meia"; // sem foto o vidro não existe: vira bloco de cor
  // Slide que é fatia de uma foto contínua não pode ter cartão nem tarja por
  // cima: o que vende o efeito é a cena atravessando limpa de um slide ao outro.
  if (o.fatia) return "faixa";
  if (o.slide.tipo === "capa") return "heroi";
  if (o.slide.tipo === "cta") return "heroi";
  // O ciclo começa DEPOIS da capa, senão o slide 2 repete o arranjo dela.
  // TODOS mantêm a leitura na metade de BAIXO: o brief manda a pessoa para a
  // metade de cima, então subir o texto taparia o rosto. A variação é na
  // largura, no alinhamento e na natureza do bloco — não na altura.
  const ciclo: ArranjoVidro[] = ["estreito", "rodape", "meia-meia", "faixa"];
  return ciclo[(o.index + ciclo.length - 1) % ciclo.length];
}

/**
 * Peça partida em foto + cor chapada, sem nenhum vidro por cima do texto.
 * `meia-meia` põe a foto na metade de CIMA; `rodape` reduz a foto a uma barra
 * na BASE e o texto ocupa a peça. São os dois arranjos que tiram o carrossel do
 * "tudo é foto com cartão por cima" sem sair do sistema visual, porque a cor é
 * a do tema e a pessoa é a mesma.
 */
function layoutVidroPartido(
  ctx: CanvasRenderingContext2D,
  o: RenderOptions,
  c: Chrome,
  arranjo: "meia-meia" | "rodape",
) {
  const { W, H, pad } = c;
  const fonts = FONT_PAIRS[o.theme.fontPair];
  const escuro = !isLight(o.theme.bg);
  const tinta = escuro ? "#FFFFFF" : "#111318";
  const noRodape = arranjo === "rodape";

  ctx.fillStyle = o.theme.bg;
  ctx.fillRect(0, 0, W, H);

  const alturaFoto = noRodape ? H * 0.3 : H * 0.52;
  const yFoto = noRodape ? H - alturaFoto : 0;
  if (o.image?.width) {
    if (o.fatia) drawFatia(ctx, o.image, 0, yFoto, W, alturaFoto, o.fatia.parte, o.fatia.de);
    // Numa barra baixa e larga, o corte centrado do drawCover pega a barriga da
    // foto e decapita a pessoa — o brief põe gente na metade de CIMA. Aqui a
    // faixa é ancorada no topo da imagem.
    else if (noRodape) drawCoverFoco(ctx, o.image, 0, yFoto, W, alturaFoto, 0.2);
    else drawCover(ctx, o.image, 0, yFoto, W, alturaFoto);
  } else if (!noRodape) {
    // Sem foto a metade de cima vira bloco do accent, senão fica buraco.
    ctx.fillStyle = o.theme.accent;
    ctx.fillRect(0, 0, W, alturaFoto);
  }

  drawGlassHeader(ctx, o, c, true);

  const larg = W - pad * 1.6;
  const t = fitText(ctx, fonts.upper ? o.slide.titulo.toUpperCase() : o.slide.titulo, {
    font: (sz) => `${fonts.displayWeight} ${sz}px ${fonts.display}`,
    maxWidth: larg,
    maxHeight: H * 0.22,
    max: W * 0.082,
    min: W * 0.04,
    lh: 1.12,
    tracking: fonts.tracking,
  });
  const corpo = o.slide.corpo
    ? fitText(ctx, o.slide.corpo, {
        font: (sz) => `400 ${sz}px ${fonts.body}`,
        maxWidth: larg,
        maxHeight: H * 0.14,
        max: W * 0.032,
        min: W * 0.022,
        lh: 1.5,
      })
    : null;

  // O texto ocupa a faixa que sobra da foto: embaixo dela no `meia-meia`,
  // em cima dela no `rodape`. Nos dois casos centrado nessa faixa.
  const altura = t.height + (corpo ? corpo.height + W * 0.03 : 0);
  const inicio = noRodape ? pad * 2.3 : alturaFoto + pad * 0.9;
  const fim = noRodape ? yFoto - pad * 1.2 : H - pad * 2.5;
  let y = inicio + Math.max(0, (fim - inicio - altura) / 2);

  ctx.fillStyle = tinta;
  drawBlock(ctx, t, pad * 0.8, y, {
    font: (sz) => `${fonts.displayWeight} ${sz}px ${fonts.display}`,
    align: "left",
    tracking: fonts.tracking,
    accent: corEnfase(o.theme.bg, tinta, o.theme.accent),
  });
  y += t.height;
  if (corpo) {
    y += W * 0.03;
    ctx.fillStyle = rgba(tinta, 0.75);
    drawBlock(ctx, corpo, pad * 0.8, y, { font: (sz) => `400 ${sz}px ${fonts.body}`, align: "left" });
  }

  // No `rodape` a base é a FOTO: botão e rodapé desenhados lá caem em cima dela
  // e o @ some. Fingir que a peça termina onde a foto começa resolve os dois
  // sem duplicar código — eles se posicionam por essa altura.
  const baseUtil = noRodape ? yFoto : H;
  if (o.slide.tipo === "cta" || (o.mostrarArraste !== false && o.total > 1)) {
    drawSwipeButton(ctx, o.slide.tipo === "cta" ? (o.slide.destaque || "SAIBA MAIS") : "ARRASTA PRO LADO!", {
      W, H: baseUtil, pad, accent: o.theme.accent, font: fonts.body, escuro,
    });
  }
  drawLogo(ctx, o, c);
  drawFooter(ctx, o, { ...c, fg: tinta, H: baseUtil });
}

function layoutVidro(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  const { W, H, pad } = c;
  const fonts = FONT_PAIRS[o.theme.fontPair];
  const arranjo = arranjoDoVidro(o, !!o.image?.width);

  if (arranjo === "meia-meia" || arranjo === "rodape") {
    layoutVidroPartido(ctx, o, c, arranjo);
    return;
  }

  const temFoto = o.fatia && o.image?.width
    ? (drawFatia(ctx, o.image, 0, 0, W, H, o.fatia.parte, o.fatia.de), true)
    : drawFundoFoto(ctx, o, c);

  // Véu leve: escurece o suficiente para o texto ler, sem lavar a foto.
  const veu = ctx.createLinearGradient(0, 0, 0, H);
  veu.addColorStop(0, "rgba(0,0,0,0.24)");
  veu.addColorStop(0.42, "rgba(0,0,0,0.04)");
  veu.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = veu;
  ctx.fillRect(0, 0, W, H);

  drawGlassHeader(ctx, o, c, true);

  // A variação por slide mora aqui: largura, ancoragem e alinhamento do bloco.
  // "faixa" atravessa a peça de ponta a ponta e não é cartão — é outro gesto.
  const estreito = arranjo === "estreito";
  const faixa = arranjo === "faixa";
  const cardW = faixa ? W : estreito ? W * 0.68 : W - pad * 1.4;
  const cardX = faixa ? 0 : estreito ? pad * 0.7 : (W - cardW) / 2;
  const alinha: CanvasTextAlign = arranjo === "heroi" ? "center" : "left";
  const inner = pad * 0.8;

  const t = fitText(ctx, fonts.upper ? o.slide.titulo.toUpperCase() : o.slide.titulo, {
    font: (sz) => `${fonts.displayWeight} ${sz}px ${fonts.display}`,
    maxWidth: cardW - inner * 2,
    maxHeight: H * 0.32,
    max: o.slide.tipo === "capa" ? W * 0.086 : W * 0.074,
    min: W * 0.038,
    lh: 1.16,
    tracking: fonts.tracking,
  });

  const corpoBlock = o.slide.corpo
    ? fitText(ctx, o.slide.corpo, {
        font: (sz) => `400 ${sz}px ${fonts.body}`,
        maxWidth: cardW - inner * 2,
        maxHeight: H * 0.13,
        max: W * 0.032,
        min: W * 0.022,
        lh: 1.5,
      })
    : null;

  // A faixa encosta na base, e ali embaixo já moram o rodapé, a barra de
  // progresso e o contador. Sem essa folga extra o corpo do texto sai por cima
  // deles — foi o que aconteceu no primeiro teste visual.
  const folgaRodape = faixa ? pad * 1.35 : 0;
  const cardH = inner * 2 + folgaRodape + t.height + (corpoBlock ? corpoBlock.height + W * 0.028 : 0);
  // Onde o cartão cabe sem tapar rosto. A preferência continua sendo embaixo;
  // ele só sobe (ou desce) quando a foto tem gente justamente ali. A faixa é
  // sempre colada na base: é ela que dá o gesto de "tarja de capa de revista".
  const preferido = (H - pad * 3.5 - cardH) / H;
  const limiteBaixo = (H - pad * 2.6 - cardH) / H;
  const topoLivre = faixaLivre(o.image, cardH / H, preferido);
  const cardY = faixa
    ? H - cardH
    : Math.max(pad * 2.2, Math.min(topoLivre * H, limiteBaixo * H));
  const raio = faixa ? 0 : W * 0.055;
  const textoX = alinha === "center" ? W / 2 : cardX + inner;

  ctx.save();
  roundRectPath(ctx, cardX, cardY, cardW, cardH, raio);
  ctx.clip();
  if (temFoto && o.image) {
    ctx.filter = "blur(26px)";
    drawCover(ctx, o.image, 0, 0, W, H);
    ctx.filter = "none";
  }
  // A faixa é mais opaca: encostada na base ela recebe a parte mais movimentada
  // da foto, e no vidro leve o texto sumia.
  ctx.fillStyle = faixa ? "rgba(8,12,20,0.62)" : "rgba(8,12,20,0.42)";
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.restore();
  if (!faixa) {
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = Math.max(1, W * 0.0014);
    roundRectPath(ctx, cardX, cardY, cardW, cardH, raio);
    ctx.stroke();
  }

  ctx.fillStyle = "#FFFFFF";
  drawBlock(ctx, t, textoX, cardY + inner, {
    font: (sz) => `${fonts.displayWeight} ${sz}px ${fonts.display}`,
    align: alinha,
    tracking: fonts.tracking,
    accent: o.theme.accent,
  });
  if (corpoBlock) {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    drawBlock(ctx, corpoBlock, textoX, cardY + inner + t.height + W * 0.028, {
      font: (sz) => `400 ${sz}px ${fonts.body}`,
      align: alinha,
    });
  }

  if (o.slide.tipo === "cta" || (o.mostrarArraste !== false && o.total > 1)) {
    drawSwipeButton(ctx, o.slide.tipo === "cta" ? (o.slide.destaque || "SAIBA MAIS") : "ARRASTA PRO LADO!", {
      W, H, pad, accent: o.theme.accent, font: fonts.body, img: o.image, escuro: true,
    });
  }

  if (o.total > 1 && o.mostrarNumero !== false) {
    drawGlassPill(ctx, `${String(o.index + 1).padStart(2, "0")} / ${String(o.total).padStart(2, "0")}`, pad, H - pad * 1.5, {
      fontSize: Math.round(W * 0.018), font: fonts.body, fg: "#FFFFFF", img: o.image, W, H, escuro: true,
    });
  }
}

// ── Layout CAPA ──────────────────────────────────────────────────────────
function layoutCapa(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  const { W, H, pad } = c;
  const fonts = FONT_PAIRS[o.theme.fontPair];
  drawFundoFoto(ctx, o, c);

  // Paleta clara da marca => texto escuro sobre véu claro (e vice-versa).
  const textoClaro = !isLight(o.theme.bg);
  const fg = textoClaro ? "#FFFFFF" : "#0B0D10";

  // O véu é desenhado DEPOIS, quando já se sabe onde o texto vai cair — ele
  // precisa acompanhar o bloco. Antes era fixo embaixo e, quando o texto subia
  // para não tapar o rosto, ficava branco sobre céu claro, ilegível.
  const bottomLimit = H - pad * 3.1;

  const t = fitText(ctx, fonts.upper ? o.slide.titulo.toUpperCase() : o.slide.titulo, {
    font: (sz) => `${fonts.displayWeight} ${sz}px ${fonts.display}`,
    maxWidth: W - pad * 2,
    maxHeight: H * 0.3,
    max: o.slide.tipo === "capa" ? W * 0.096 : W * 0.084,
    min: W * 0.042,
    lh: 1.08,
    tracking: fonts.tracking,
  });

  const corpoBlock = o.slide.corpo
    ? fitText(ctx, o.slide.corpo, {
        font: (sz) => `400 ${sz}px ${fonts.body}`,
        maxWidth: W * 0.86,
        maxHeight: H * 0.12,
        max: W * 0.03,
        min: W * 0.021,
        lh: 1.55,
      })
    : null;

  const bloco = t.height + (corpoBlock ? corpoBlock.height + W * 0.032 : 0);
  // A seta entra acima do título, então o bloco reserva ela na busca por espaço.
  const blocoComSeta = bloco + W * 0.11;
  const preferido = (bottomLimit - bloco) / H;
  const topoLivre = faixaLivre(o.image, blocoComSeta / H, preferido);
  const startY = Math.max(pad * 2.6, Math.min(topoLivre * H + W * 0.11, bottomLimit - bloco));

  // Véu acompanhando o bloco: forte atrás do texto, dissolvendo para os lados.
  const topoVeu = Math.max(0, startY - W * 0.16);
  const veu = ctx.createLinearGradient(0, topoVeu, 0, Math.min(H, startY + bloco + W * 0.12));
  const forte = textoClaro ? "rgba(0,0,0,0.72)" : "rgba(255,255,255,0.8)";
  const zero = textoClaro ? "rgba(0,0,0,0)" : "rgba(255,255,255,0)";
  veu.addColorStop(0, zero);
  veu.addColorStop(0.35, forte);
  veu.addColorStop(1, forte);
  ctx.fillStyle = veu;
  ctx.fillRect(0, topoVeu, W, H - topoVeu);
  // Se o texto subiu, o pé da peça ainda precisa de base para as pílulas.
  if (startY + bloco < H - pad * 4) {
    const rodape = ctx.createLinearGradient(0, H - pad * 4, 0, H);
    rodape.addColorStop(0, zero);
    rodape.addColorStop(1, textoClaro ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)");
    ctx.fillStyle = rodape;
    ctx.fillRect(0, H - pad * 4, W, pad * 4);
  }

  drawGlassHeader(ctx, o, c, textoClaro);

  // Seta diagonal de entrada, logo acima do título
  const s = W * 0.05;
  const setaY = startY - W * 0.055;
  ctx.strokeStyle = fg;
  ctx.lineWidth = Math.max(3, W * 0.0065);
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(pad + s, setaY - s * 0.7);
  ctx.lineTo(pad, setaY);
  ctx.moveTo(pad, setaY);
  ctx.lineTo(pad + s * 0.6, setaY);
  ctx.moveTo(pad, setaY);
  ctx.lineTo(pad, setaY - s * 0.6);
  ctx.stroke();

  ctx.fillStyle = fg;
  drawBlock(ctx, t, pad, startY, {
    font: (sz) => `${fonts.displayWeight} ${sz}px ${fonts.display}`,
    tracking: fonts.tracking,
    accent: o.theme.accent,
  });
  if (corpoBlock) {
    ctx.fillStyle = textoClaro ? "rgba(255,255,255,0.76)" : "rgba(11,13,16,0.7)";
    drawBlock(ctx, corpoBlock, pad, startY + t.height + W * 0.032, { font: (sz) => `400 ${sz}px ${fonts.body}` });
  }

  if (o.slide.tipo === "cta" || (o.mostrarArraste !== false && o.total > 1)) {
    drawSwipeButton(ctx, o.slide.tipo === "cta" ? (o.slide.destaque || "SAIBA MAIS") : "ARRASTE!", {
      W, H, pad, accent: o.theme.accent, font: fonts.body, img: o.image, escuro: textoClaro,
    });
  }
}

// ── API pública ───────────────────────────────────────────────────────────
/**
 * ── Acabamento ────────────────────────────────────────────────────────────
 * Camada de pós-processo, aplicada sobre o slide já desenhado. Fica aqui e
 * não dentro dos layouts de propósito: assim o mesmo acabamento vale para os
 * oito layouts, em vez de virar oito layouts novos.
 */

/** Ruído em tile, gerado uma vez e reaproveitado (é caro). */
let tileGrao: HTMLCanvasElement | null = null;

function pegarTileGrao(): HTMLCanvasElement | null {
  if (tileGrao) return tileGrao;
  if (typeof document === "undefined") return null;
  const lado = 160;
  const c = document.createElement("canvas");
  c.width = lado;
  c.height = lado;
  const g = c.getContext("2d");
  if (!g) return null;
  const dados = g.createImageData(lado, lado);
  for (let i = 0; i < dados.data.length; i += 4) {
    const v = 110 + Math.random() * 90;
    dados.data[i] = v;
    dados.data[i + 1] = v;
    dados.data[i + 2] = v;
    dados.data[i + 3] = 255;
  }
  g.putImageData(dados, 0, 0);
  tileGrao = c;
  return c;
}

function aplicarGrao(ctx: CanvasRenderingContext2D, w: number, h: number, forca: number) {
  const tile = pegarTileGrao();
  if (!tile) return;
  const padrao = ctx.createPattern(tile, "repeat");
  if (!padrao) return;
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = forca;
  ctx.fillStyle = padrao;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/**
 * Bloom: reprojeta o próprio slide desfocado e clareado em modo "screen", então
 * o que já era claro (tipografia, accent, luz da foto) espalha luz em volta.
 */
function aplicarGlow(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number, forca: number) {
  if (typeof document === "undefined") return;
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const t = tmp.getContext("2d");
  if (!t) return;
  t.filter = `blur(${Math.round(w * 0.022)}px) brightness(1.5) saturate(1.25)`;
  t.drawImage(canvas, 0, 0, w, h);
  t.filter = "none";
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = forca;
  ctx.drawImage(tmp, 0, 0, w, h);
  ctx.restore();
}

/** Vinheta suave: fecha os cantos e joga o olho para o centro. */
function aplicarVinheta(ctx: CanvasRenderingContext2D, w: number, h: number, forca: number) {
  const g = ctx.createRadialGradient(w / 2, h * 0.46, Math.min(w, h) * 0.32, w / 2, h * 0.5, Math.max(w, h) * 0.78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${forca})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export const ACABAMENTOS: { id: AcabamentoId; label: string; desc: string }[] = [
  { id: "nenhum", label: "Limpo", desc: "Cor chapada, sem tratamento. O padrão." },
  { id: "grao", label: "Grão", desc: "Ruído de filme por cima. Tira o ar de digital chapado." },
  { id: "glow", label: "Glow", desc: "A tipografia e o accent espalham luz. Bom em fundo escuro." },
  { id: "cinema", label: "Cinema", desc: "Glow discreto, vinheta e grão juntos. O mais Behance dos três." },
];

function aplicarAcabamento(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, o: RenderOptions) {
  const qual = o.acabamento ?? "nenhum";
  if (qual === "nenhum") return;
  const w = canvas.width;
  const h = canvas.height;

  // O pós-processo trabalha em pixels do bitmap, não nas coordenadas de 1080.
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const escuro = !isLight(o.theme.bg);

  if (qual === "grao") {
    aplicarGrao(ctx, w, h, 0.5);
  } else if (qual === "glow") {
    aplicarGlow(canvas, ctx, w, h, escuro ? 0.5 : 0.28);
  } else if (qual === "cinema") {
    aplicarGlow(canvas, ctx, w, h, escuro ? 0.34 : 0.2);
    aplicarVinheta(ctx, w, h, escuro ? 0.42 : 0.22);
    aplicarGrao(ctx, w, h, 0.42);
  }
  ctx.restore();
}

export function renderSlide(canvas: HTMLCanvasElement, o: RenderOptions) {
  const [W, H] = FORMAT_SIZE[o.format];
  const scale = o.scale && o.scale > 0 ? o.scale : 1;
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (scale !== 1) ctx.scale(scale, scale);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  const chrome: Chrome = {
    W,
    H,
    pad: Math.round(W * 0.085),
    fg: o.theme.fg,
    accent: o.theme.accent,
    body: FONT_PAIRS[o.theme.fontPair].body,
  };

  switch (o.layout) {
    case "vidro":
      layoutVidro(ctx, o, chrome);
      break;
    case "capa":
      layoutCapa(ctx, o, chrome);
      break;
    case "organico":
      layoutOrganico(ctx, o, chrome);
      break;
    case "agencia":
      layoutAgencia(ctx, o, chrome);
      break;
    case "impacto":
      layoutImpacto(ctx, o, chrome);
      break;
    case "revista":
      layoutRevista(ctx, o, chrome);
      break;
    case "gradiente":
      layoutGradiente(ctx, o, chrome);
      break;
    case "minimal":
      layoutMinimal(ctx, o, chrome);
      break;
    case "foto":
      layoutFoto(ctx, o, chrome);
      break;
    default:
      layoutEditorial(ctx, o, chrome);
  }

  aplicarAcabamento(canvas, ctx, o);
}

/** Garante que as fontes do design estejam carregadas antes de desenhar. */
export async function ensureFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const familias = [
    '700 100px "Playfair Display"', '900 100px "Playfair Display"',
    '400 100px "Archivo Black"', '800 100px Syne', '700 100px "Space Grotesk"',
    '400 100px Anton', '400 100px "Bebas Neue"', '700 100px "Cormorant Garamond"',
    '400 100px "DM Serif Display"', '700 100px Fraunces', '700 100px Outfit',
    '800 100px "Plus Jakarta Sans"', '400 100px "Instrument Serif"',
    '800 100px "Bricolage Grotesque"', '700 100px Unbounded', '600 100px Oswald',
    '700 100px "JetBrains Mono"', '600 100px Manrope', '600 100px Sora',
    '500 100px Archivo', '400 100px Inter', '600 100px Inter', '700 100px Inter',
  ];
  try {
    await Promise.all(familias.map((f) => document.fonts.load(f).catch(() => undefined)));
    await document.fonts.ready;
  } catch {
    /* segue com fallback do sistema */
  }
}

/** Carrega imagem (data URL ou http) pronta para o canvas. */
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png", 1));
}
