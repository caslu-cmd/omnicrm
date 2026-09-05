/**
 * Recorte de fundo (movimento 1 das referências: pessoa recortada sem fundo).
 *
 * Roda 100% no navegador — sem chave, sem custo por imagem, sem servidor.
 * O modelo (IS-Net) é baixado do CDN da imgly na primeira vez e fica no cache
 * do browser; as chamadas seguintes só rodam a inferência.
 *
 * A máscara crua de QUALQUER modelo de matting não é um recorte pronto: a borda
 * sai com um halo da cor do fundo antigo, porque um pixel de borda é uma MISTURA
 * (C = a*F + (1-a)*B). Colar isso num fundo novo é o que dá aquele contorno
 * fantasma. As quatro etapas depois do modelo é que fazem o recorte parecer
 * perfeito:
 *
 *   1. modelo        → alpha por pixel
 *   2. descontaminar → tira a cor do fundo velho de dentro da borda (despill)
 *   3. níveis        → o cinza indeciso do modelo vira opaco ou transparente
 *   4. encolher/suavizar → mata a franja de 1px e devolve uma borda que não serrilha
 *   5. aparar        → recorta na caixa do sujeito, pro layout poder posicionar
 */

import { removeBackground } from "@imgly/background-removal";

export type Qualidade = "rapida" | "boa" | "maxima";

const MODELOS: Record<Qualidade, "isnet_quint8" | "isnet_fp16" | "isnet"> = {
  rapida: "isnet_quint8", // ~11 MB, alguns segundos
  boa: "isnet_fp16", // ~44 MB, padrão
  maxima: "isnet", // ~88 MB, fp32
};

export type RecorteOptions = {
  qualidade?: Qualidade;
  /** Tira a cor do fundo velho que sangrou na borda. Deixe ligado. */
  descontaminar?: boolean;
  /** 0..1 — quanto o alpha indeciso é empurrado para opaco/transparente. */
  aperto?: number;
  /** Encolhe a silhueta, em pixels de 1080. Mata a franja clara. */
  encolher?: number;
  /** Suaviza a borda, em pixels de 1080. Evita serrilhado. */
  suavizar?: number;
  /** Recorta na caixa do sujeito. */
  aparar?: boolean;
  /**
   * "maior" joga fora pedaço solto que o modelo manteve (um naco de balcão, um
   * vaso atrás). "todas" preserva tudo — use quando a peça tem dois sujeitos.
   */
  ilhas?: "maior" | "todas";
  /** "gpu" usa WebGPU quando existe e cai pra cpu sozinho. */
  device?: "cpu" | "gpu";
  onProgresso?: (etapa: string, fracao: number) => void;
};

export type Recorte = {
  /** PNG com canal alpha, pronto pro canvas. */
  dataUrl: string;
  width: number;
  height: number;
  /** Onde o sujeito estava na imagem original (antes de aparar). */
  bbox: { x: number; y: number; w: number; h: number };
  /** Fração de pixels opacos. Serve de alarme: veja `suspeito`. */
  cobertura: number;
  /**
   * true quando o resultado tem cara de erro — quase nada sobrou (o modelo não
   * achou sujeito) ou quase nada saiu (não havia fundo a remover).
   */
  suspeito: boolean;
};

const PADRAO: Required<Omit<RecorteOptions, "onProgresso">> = {
  qualidade: "boa",
  descontaminar: true,
  aperto: 0.55,
  encolher: 0.6,
  suavizar: 0.8,
  aparar: true,
  ilhas: "maior",
  device: "cpu",
};

/** Recorta o fundo de uma imagem e devolve um PNG com transparência. */
export async function removerFundo(
  origem: string | Blob,
  opcoes: RecorteOptions = {}
): Promise<Recorte> {
  const o = { ...PADRAO, ...opcoes };
  const avisar = opcoes.onProgresso ?? (() => {});

  avisar("carregando modelo", 0);
  let blob: Blob;
  try {
    blob = await removeBackground(origem, {
      model: MODELOS[o.qualidade],
      device: o.device,
      output: { format: "image/png" },
      progress: (chave, atual, total) => {
        // chave vem como "fetch:/models/..." ou "compute:inference"
        const etapa = chave.startsWith("fetch") ? "baixando modelo" : "recortando";
        avisar(etapa, total ? atual / total : 0);
      },
    });
  } catch (e) {
    if (o.device === "gpu") {
      // WebGPU não existe em todo navegador; a cpu sempre funciona.
      return removerFundo(origem, { ...opcoes, device: "cpu" });
    }
    throw e;
  }

  avisar("acabando a borda", 0.9);
  const recortada = await carregarImagem(URL.createObjectURL(blob));
  const original = await carregarImagem(
    typeof origem === "string" ? origem : URL.createObjectURL(origem)
  );

  const W = recortada.width;
  const H = recortada.height;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(recortada, 0, 0);
  const img = ctx.getImageData(0, 0, W, H);

  // A escala das folgas é dada em pixels de uma peça de 1080 — assim o mesmo
  // ajuste vale pra foto de 800px e pra de 2000px.
  const escala = Math.max(W, H) / 1080;

  if (o.descontaminar) {
    // Precisa da imagem ORIGINAL: o PNG recortado já vem com a borda
    // pré-multiplicada e a cor do fundo perdida.
    const orig = amostrarOriginal(original, W, H);
    descontaminarBorda(img, orig);
  }
  if (o.aperto > 0) aplicarNiveis(img, o.aperto);
  if (o.encolher > 0) deslocarBorda(img, -o.encolher * escala);
  if (o.suavizar > 0) suavizarAlpha(img, o.suavizar * escala);

  ctx.putImageData(img, 0, 0);

  const bbox = caixaDoSujeito(img, W, H);
  const cobertura = bbox.w > 0 ? contarOpacos(img) / (W * H) : 0;

  let saida = cv;
  if (o.aparar && bbox.w > 0 && (bbox.w < W || bbox.h < H)) {
    const rec = document.createElement("canvas");
    rec.width = bbox.w;
    rec.height = bbox.h;
    rec.getContext("2d")!.drawImage(cv, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, bbox.w, bbox.h);
    saida = rec;
  }

  avisar("pronto", 1);
  return {
    dataUrl: saida.toDataURL("image/png"),
    width: saida.width,
    height: saida.height,
    bbox,
    cobertura,
    suspeito: cobertura < 0.02 || cobertura > 0.97,
  };
}

/* ---------------------------------------------------------------- etapas */

/**
 * Descontaminação de cor (despill).
 *
 * Num pixel de borda o que se vê é C = a*F + (1-a)*B. O modelo entrega `a` e
 * `C`, e o recorte cru assume F = C — por isso a borda carrega a cor do fundo
 * velho (o famoso halo branco sobre fundo claro, verde sobre grama).
 * Recuperamos F = (C - (1-a)*B) / a, estimando B pelo fundo REAL em volta.
 */
function descontaminarBorda(img: ImageData, orig: Uint8ClampedArray) {
  const { width: W, height: H, data } = img;
  const fundo = estimarFundo(orig, data, W, H);
  if (!fundo) return; // imagem sem fundo visível: nada a descontaminar

  const { cor, cw, ch } = fundo;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      const a = data[p + 3] / 255;
      if (a <= 0.02 || a >= 0.98) continue; // só a borda parcial importa

      // fundo local, amostrado da grade grossa
      const gx = Math.min(cw - 1, (x * cw) / W) | 0;
      const gy = Math.min(ch - 1, (y * ch) / H) | 0;
      const g = (gy * cw + gx) * 3;

      for (let c = 0; c < 3; c++) {
        const C = orig[p + c];
        const B = cor[g + c];
        const F = (C - (1 - a) * B) / a;
        // clamp largo: recuperar cor exagerada estoura o pixel
        data[p + c] = F < 0 ? 0 : F > 255 ? 255 : F;
      }
    }
  }
}

/**
 * Estima a cor do fundo numa grade grossa, a partir dos pixels que o modelo
 * deu como transparentes, e propaga pras células vazias. Grade em vez de uma
 * cor só porque fundo real tem gradiente (céu, parede com luz lateral).
 */
function estimarFundo(orig: Uint8ClampedArray, data: Uint8ClampedArray, W: number, H: number) {
  const CEL = 16;
  const cw = Math.max(1, Math.ceil(W / CEL));
  const ch = Math.max(1, Math.ceil(H / CEL));
  const soma = new Float32Array(cw * ch * 3);
  const cont = new Float32Array(cw * ch);

  for (let y = 0; y < H; y++) {
    const gy = ((y / CEL) | 0) * cw;
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      if (data[p + 3] > 8) continue; // só fundo puro
      const g = gy + ((x / CEL) | 0);
      soma[g * 3] += orig[p];
      soma[g * 3 + 1] += orig[p + 1];
      soma[g * 3 + 2] += orig[p + 2];
      cont[g]++;
    }
  }

  let vistas = 0;
  const cor = new Float32Array(cw * ch * 3);
  for (let g = 0; g < cw * ch; g++) {
    if (cont[g] < 4) continue;
    cor[g * 3] = soma[g * 3] / cont[g];
    cor[g * 3 + 1] = soma[g * 3 + 1] / cont[g];
    cor[g * 3 + 2] = soma[g * 3 + 2] / cont[g];
    cont[g] = 1;
    vistas++;
  }
  if (vistas === 0) return null;

  // Propaga a cor pras células cobertas pelo sujeito (dilatação por vizinhança).
  // As células no meio do corpo nunca viram fundo — herdam do contorno.
  for (let passo = 0; passo < Math.max(cw, ch); passo++) {
    let mudou = false;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const g = y * cw + x;
        if (cont[g] === 1) continue;
        let r = 0, vv = 0, b = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
            const ng = ny * cw + nx;
            if (cont[ng] !== 1) continue;
            r += cor[ng * 3]; vv += cor[ng * 3 + 1]; b += cor[ng * 3 + 2]; n++;
          }
        }
        if (n) {
          cor[g * 3] = r / n; cor[g * 3 + 1] = vv / n; cor[g * 3 + 2] = b / n;
          cont[g] = 2; // preenchida nesta passada
          mudou = true;
        }
      }
    }
    for (let g = 0; g < cw * ch; g++) if (cont[g] === 2) cont[g] = 1;
    if (!mudou) break;
  }

  return { cor, cw, ch };
}

/** Empurra o alpha indeciso pras pontas. Curva em S, não corte duro. */
function aplicarNiveis(img: ImageData, aperto: number) {
  const k = 0.5 * Math.min(0.98, Math.max(0, aperto));
  const lo = k * 255;
  const hi = 255 - k * 255;
  const tabela = new Uint8ClampedArray(256);
  for (let a = 0; a < 256; a++) {
    const t = (a - lo) / (hi - lo);
    tabela[a] = t <= 0 ? 0 : t >= 1 ? 255 : Math.round(t * t * (3 - 2 * t) * 255);
  }
  const d = img.data;
  for (let p = 3; p < d.length; p += 4) d[p] = tabela[d[p]];
}

/**
 * Move a borda pra dentro (raio negativo) ou pra fora. Erodir meio pixel é o
 * que tira a franja da cor do fundo que sobra mesmo depois da descontaminação.
 */
function deslocarBorda(img: ImageData, raio: number) {
  const r = Math.abs(raio);
  if (r < 0.05) return;
  const alpha = borrarAlpha(img, r);
  const d = img.data;
  // Reinterpretar o alpha borrado com o limiar deslocado equivale a erodir
  // (limiar alto) ou dilatar (limiar baixo) com precisão de subpixel, sem
  // precisar de morfologia de verdade.
  const limiar = 0.5 + (raio < 0 ? 1 : -1) * Math.min(0.4, r * 0.3);
  const rampa = 0.25; // largura da transição; menor = borda mais dura
  const a0 = limiar - rampa / 2;
  const a1 = limiar + rampa / 2;
  for (let i = 0, p = 3; i < alpha.length; i++, p += 4) {
    const t = (alpha[i] / 255 - a0) / (a1 - a0);
    const v = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
    d[p] = Math.round(v * 255);
  }
}

function suavizarAlpha(img: ImageData, raio: number) {
  if (raio < 0.05) return;
  const alpha = borrarAlpha(img, raio);
  const d = img.data;
  for (let i = 0, p = 3; i < alpha.length; i++, p += 4) d[p] = alpha[i];
}

/** Box blur separável no canal alpha. Duas passadas ≈ gaussiana. */
function borrarAlpha(img: ImageData, raio: number): Uint8ClampedArray {
  const { width: W, height: H, data } = img;
  const r = Math.max(1, Math.round(raio));
  let src = new Float32Array(W * H);
  for (let i = 0, p = 3; i < src.length; i++, p += 4) src[i] = data[p];
  let tmp = new Float32Array(W * H);

  for (let passada = 0; passada < 2; passada++) {
    // horizontal
    for (let y = 0; y < H; y++) {
      const linha = y * W;
      let soma = 0;
      for (let x = -r; x <= r; x++) soma += src[linha + Math.min(W - 1, Math.max(0, x))];
      const div = r * 2 + 1;
      for (let x = 0; x < W; x++) {
        tmp[linha + x] = soma / div;
        soma -= src[linha + Math.min(W - 1, Math.max(0, x - r))];
        soma += src[linha + Math.min(W - 1, Math.max(0, x + r + 1))];
      }
    }
    // vertical
    for (let x = 0; x < W; x++) {
      let soma = 0;
      for (let y = -r; y <= r; y++) soma += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
      const div = r * 2 + 1;
      for (let y = 0; y < H; y++) {
        src[y * W + x] = soma / div;
        soma -= tmp[Math.min(H - 1, Math.max(0, y - r)) * W + x];
        soma += tmp[Math.min(H - 1, Math.max(0, y + r + 1)) * W + x];
      }
    }
  }
  const out = new Uint8ClampedArray(W * H);
  for (let i = 0; i < out.length; i++) out[i] = src[i];
  return out;
}

/* ---------------------------------------------------------------- apoio */

function caixaDoSujeito(img: ImageData, W: number, H: number) {
  const d = img.data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] < 12) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function contarOpacos(img: ImageData) {
  const d = img.data;
  let n = 0;
  for (let p = 3; p < d.length; p += 4) if (d[p] > 127) n++;
  return n;
}

/** Redesenha a original no tamanho do recorte e devolve os pixels crus. */
function amostrarOriginal(img: HTMLImageElement, W: number, H: number) {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  return ctx.getImageData(0, 0, W, H).data;
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, erro) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => ok(im);
    im.onerror = () => erro(new Error("não consegui carregar a imagem"));
    im.src = src;
  });
}
