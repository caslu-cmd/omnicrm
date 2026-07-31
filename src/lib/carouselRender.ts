/**
 * Motor de render do Estúdio de Carrossel — Calu Agência.
 * Desenha slides prontos para publicar (1080px) em canvas, sem depender de Canva/Figma.
 */

export type LayoutId = "vidro" | "capa" | "editorial" | "impacto" | "revista" | "gradiente" | "minimal" | "foto";
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
}

export interface Theme {
  bg: string;
  fg: string;
  accent: string;
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
  { id: "vidro", label: "Vidro", desc: "Foto + cartão de vidro com o título. O padrão que mais roda no feed.", precisaImagem: true },
  { id: "capa", label: "Capa", desc: "Foto + título gigante direto na imagem, com seta e pílulas.", precisaImagem: true },
  { id: "editorial", label: "Editorial", desc: "Fundo escuro, número gigante, tipografia grande. O mais versátil." },
  { id: "impacto", label: "Impacto", desc: "Cor cheia e tipografia pesada. Para frase de efeito e dado forte." },
  { id: "revista", label: "Revista", desc: "Papel claro, serifada, filetes finos. Ar de publicação premium." },
  { id: "gradiente", label: "Gradiente", desc: "Malha de cor com cartão de vidro. Moderno e colorido." },
  { id: "minimal", label: "Minimal", desc: "Branco, respiro, um traço de cor. Elegante e limpo." },
  { id: "foto", label: "Foto", desc: "Sua imagem em tela cheia com máscara e texto por cima.", precisaImagem: true },
];

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
function extrairEnfase(txt: string): { limpo: string; enfase: Array<[number, number]> } {
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
  const total = ctx.measureText(linha).width;
  let cursorX = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  ctx.textAlign = "left";

  for (let k = 0; k < pontos.length - 1; k++) {
    const pedaco = linha.slice(pontos[k], pontos[k + 1]);
    if (!pedaco) continue;
    const absoluto = inicioNaFrase + pontos[k];
    const marcado = block.enfase.some(([a, b]) => absoluto >= a && absoluto < b);
    ctx.fillStyle = marcado ? accent : corBase;
    ctx.fillText(pedaco, cursorX, cy);
    if (marcado) {
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, block.size * 0.022);
      ctx.lineJoin = "round";
      ctx.strokeText(pedaco, cursorX, cy);
      ctx.restore();
    }
    cursorX += ctx.measureText(pedaco).width;
  }

  ctx.fillStyle = corBase;
  ctx.textAlign = alinhamentoAntigo;
}

/** Encontra o maior corpo de fonte em que o texto ainda cabe na caixa. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  o: { font: (size: number) => string; maxWidth: number; maxHeight: number; max: number; min: number; lh: number; tracking?: number },
): TextBlock {
  // A marcação de ênfase sai antes de medir: tudo abaixo trabalha com o texto limpo.
  const { limpo, enfase } = extrairEnfase(text);
  const step = Math.max(1, Math.round(o.max * 0.02));
  let reserva: TextBlock | null = null; // melhor opção caso nenhuma fonte evite corte de palavra

  for (let size = o.max; size >= o.min; size -= step) {
    ctx.font = o.font(size);
    setTracking(ctx, (o.tracking ?? 0) * size);
    const { lines, quebrouPalavra } = wrapLines(ctx, limpo, o.maxWidth);
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
  const { lines } = wrapLines(ctx, limpo, o.maxWidth);
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
  o: { font: (size: number) => string; align?: CanvasTextAlign; tracking?: number; accent?: string },
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
        desenharLinhaComEnfase(ctx, line, ini, block, x, cy, o.align ?? "left", o.accent as string);
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
  const isDark = o.slide.tipo === "cta";
  const bg = isDark ? o.theme.bg : o.theme.accent;
  const fg = isDark ? o.theme.fg : contrastOn(o.theme.accent);
  const accent = isDark ? o.theme.accent : contrastOn(o.theme.accent);
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

  drawArraste(ctx, o, { ...local, accent: isDark ? o.theme.accent : bg === o.theme.accent ? fg : accent });
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

  const t = fitText(ctx, o.slide.titulo, {
    font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`,
    maxWidth: W - pad * 2,
    maxHeight: (bottomLimit - cursor) * (o.slide.corpo ? 0.58 : 0.9),
    max: o.slide.tipo === "capa" ? W * 0.125 : W * 0.092,
    min: W * 0.044,
    lh: 1.14,
    tracking: -0.005,
  });
  ctx.fillStyle = fg;
  drawBlock(ctx, t, pad, cursor, { font: (s) => `${fonts.displayWeight} ${s}px ${fonts.display}`, tracking: -0.005, accent });
  cursor += t.height + W * 0.045;

  if (o.slide.corpo) {
    ctx.fillStyle = accent;
    ctx.fillRect(pad, cursor, W * 0.09, Math.max(2, W * 0.004));
    cursor += W * 0.04;
    const b = fitText(ctx, o.slide.corpo, {
      font: (s) => `400 ${s}px ${fonts.body}`,
      maxWidth: W * 0.82,
      maxHeight: bottomLimit - cursor,
      max: W * 0.04,
      min: W * 0.026,
      lh: 1.55,
    });
    ctx.fillStyle = rgba(fg, 0.75);
    drawBlock(ctx, b, pad, cursor, { font: (s) => `400 ${s}px ${fonts.body}` });
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
  const startY = bottomLimit - bloco - W * 0.06;

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
function layoutVidro(ctx: CanvasRenderingContext2D, o: RenderOptions, c: Chrome) {
  const { W, H, pad } = c;
  const fonts = FONT_PAIRS[o.theme.fontPair];
  const temFoto = drawFundoFoto(ctx, o, c);

  // Véu leve: escurece o suficiente para o texto ler, sem lavar a foto.
  const veu = ctx.createLinearGradient(0, 0, 0, H);
  veu.addColorStop(0, "rgba(0,0,0,0.24)");
  veu.addColorStop(0.42, "rgba(0,0,0,0.04)");
  veu.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = veu;
  ctx.fillRect(0, 0, W, H);

  drawGlassHeader(ctx, o, c, true);

  const cardW = W - pad * 1.4;
  const cardX = (W - cardW) / 2;
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

  const cardH = inner * 2 + t.height + (corpoBlock ? corpoBlock.height + W * 0.028 : 0);
  const cardY = H - pad * 3.5 - cardH;

  ctx.save();
  roundRectPath(ctx, cardX, cardY, cardW, cardH, W * 0.055);
  ctx.clip();
  if (temFoto && o.image) {
    ctx.filter = "blur(26px)";
    drawCover(ctx, o.image, 0, 0, W, H);
    ctx.filter = "none";
  }
  ctx.fillStyle = "rgba(8,12,20,0.42)";
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = Math.max(1, W * 0.0014);
  roundRectPath(ctx, cardX, cardY, cardW, cardH, W * 0.055);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  drawBlock(ctx, t, W / 2, cardY + inner, {
    font: (sz) => `${fonts.displayWeight} ${sz}px ${fonts.display}`,
    align: "center",
    tracking: fonts.tracking,
    accent: o.theme.accent,
  });
  if (corpoBlock) {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    drawBlock(ctx, corpoBlock, W / 2, cardY + inner + t.height + W * 0.028, {
      font: (sz) => `400 ${sz}px ${fonts.body}`,
      align: "center",
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

  const scrim = ctx.createLinearGradient(0, H * 0.3, 0, H);
  scrim.addColorStop(0, textoClaro ? "rgba(0,0,0,0)" : "rgba(255,255,255,0)");
  scrim.addColorStop(1, textoClaro ? "rgba(0,0,0,0.74)" : "rgba(255,255,255,0.8)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, H);

  drawGlassHeader(ctx, o, c, textoClaro);

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
  const startY = bottomLimit - bloco;

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
