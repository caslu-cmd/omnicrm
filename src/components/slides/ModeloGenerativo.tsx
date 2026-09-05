/**
 * A peça que o diretor de arte PROJETA, em vez de escolher de uma lista.
 *
 * Pedido da Carol: *"não quero que você sempre use os mesmos layouts da Emana;
 * quero que use o diretor de arte para criar peças novas"*. Um conjunto fixo de
 * modelos sempre devolve as mesmas sete caras — por mais bem feitas que sejam,
 * o feed do cliente vira repetição.
 *
 * Aqui o diretor não escolhe um modelo: ele descreve a COMPOSIÇÃO zona por zona
 * (onde entra a foto e com que forma, onde ancora o texto, o que vira o
 * destaque, que ornamento estrutura o fundo), e este componente desenha o que
 * ele descreveu. A combinatória passa de sete peças para milhares — e continua
 * legível, porque cada primitiva foi construída para não quebrar.
 *
 * O que NÃO é negociável, e por isso mora aqui e não no prompt: a peça respeita
 * a cor e a fonte travadas do cliente, o texto nunca encosta na borda, e todo
 * texto sobre foto ganha véu. Direção de arte livre não pode custar
 * legibilidade.
 */
import type { CSSProperties, ReactNode } from "react";
import type { BrandInfo, FormatId, SlideData, Theme } from "@/lib/carouselRender";
import { FORMAT_SIZE, extrairEnfase, isLight, shade } from "@/lib/carouselRender";

/** A receita da peça, como o diretor de arte a descreve. */
export interface Composicao {
  fundo: "papel" | "cor-cheia" | "escuro" | "foto-cheia" | "duotone";
  foto: "nenhuma" | "faixa-base" | "faixa-topo" | "coluna-esquerda" | "coluna-direita" | "tela-cheia" | "circulo" | "arco";
  /** Quanto da peça a foto ocupa, de 0.2 a 0.6 — ignorado em tela-cheia. */
  foto_peso?: number;
  texto_ancora: "topo" | "centro" | "base";
  texto_alinha: "esquerda" | "centro";
  /** Fração da largura que o bloco de texto ocupa (0.5 a 1). */
  texto_largura?: number;
  titulo_escala: "grande" | "gigante" | "colossal";
  titulo_peso: "fino" | "medio" | "pesado";
  titulo_caixa: "normal" | "alta";
  enfase: "tarja" | "cor" | "peso" | "sublinhado";
  destaque: "nenhum" | "numero-gigante" | "pilula" | "selo-circular" | "chip-lateral";
  apoio: "nenhum" | "cartao" | "lista" | "linha-fina";
  ornamento: "nenhum" | "inicial-gigante" | "malha" | "faixa-cor" | "moldura";
}

export interface GenerativoProps {
  slide: SlideData;
  index: number;
  total: number;
  theme: Theme;
  brand: BrandInfo;
  format: FormatId;
  imagem?: string | null;
  composicao: Composicao;
}

const FONTE = "Outfit, ui-sans-serif, system-ui, sans-serif";

function paleta(theme: Theme) {
  const forte = theme.accent || "#A3E635";
  const escuro = theme.accent2 && !isLight(theme.accent2)
    ? theme.accent2
    : (!isLight(theme.bg) ? theme.bg : shade(forte, -0.72));
  const papel = isLight(theme.bg) ? theme.bg : "#F4F6F1";
  return {
    forte, escuro, papel,
    fundo: shade(escuro, -0.3),
    tintaClara: "#F2F5F0",
    tintaEscura: shade(escuro, -0.15),
  };
}

/** Título com a marcação, no gesto que o diretor pediu. */
function Titulo({ texto, modo, cor, sobre }: { texto: string; modo: Composicao["enfase"]; cor: string; sobre: string }) {
  const { limpo, enfase } = extrairEnfase(texto);
  if (!enfase.length) return <>{limpo}</>;
  const partes: ReactNode[] = [];
  let cursor = 0;
  enfase.forEach(([a, b], i) => {
    if (a > cursor) partes.push(<span key={`a${i}`}>{limpo.slice(cursor, a)}</span>);
    const trecho = limpo.slice(a, b);
    partes.push(
      modo === "tarja"
        ? <mark key={`m${i}`} style={{
            // Faixa de altura fixa: `background` de inline cobre a área da fonte
            // e comeria a linha de cima.
            background: `linear-gradient(${cor}, ${cor}) center/100% 1.06em no-repeat`,
            color: sobre, fontWeight: 700, padding: "0 .1em", borderRadius: ".08em",
            boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone",
          }}>{trecho}</mark>
        : modo === "sublinhado"
        ? <span key={`s${i}`} style={{
            backgroundImage: `linear-gradient(${cor}, ${cor})`,
            backgroundSize: "100% .12em", backgroundPosition: "0 92%", backgroundRepeat: "no-repeat",
          }}>{trecho}</span>
        : modo === "peso"
        ? <b key={`p${i}`} style={{ fontWeight: 800 }}>{trecho}</b>
        : <b key={`c${i}`} style={{ fontWeight: 700, color: cor }}>{trecho}</b>,
    );
    cursor = b;
  });
  if (cursor < limpo.length) partes.push(<span key="f">{limpo.slice(cursor)}</span>);
  return <>{partes}</>;
}

export default function ModeloGenerativo(props: GenerativoProps) {
  const { slide, theme, brand, format, imagem, composicao: c } = props;
  const [W, H] = FORMAT_SIZE[format];
  const u = (v: number) => (v * W) / 1080;
  const p = paleta(theme);
  const inicial = (brand.nome || "•").trim().charAt(0).toLowerCase();
  const ehCta = slide.tipo === "cta";

  // ── Fundo e tinta ────────────────────────────────────────────────────────
  /**
   * A cor de fundo é a que o DIRETOR escolheu (`theme.bg`), não uma derivação
   * minha. Na primeira versão eu pintava "cor-cheia" com o accent da marca e
   * ignorava o `bg` da direção: o diretor pedia um limão vibrante, saía o verde
   * escuro da marca, e o número gigante — que usa o realce — ficava escuro
   * sobre escuro. Direção de arte que é sobrescrita pelo motor não é direção.
   */
  const temFotoCheia = !!imagem && (c.fundo === "foto-cheia" || c.foto === "tela-cheia");
  const corBase =
    c.fundo === "papel" ? (isLight(theme.bg) ? theme.bg : p.papel)
    : c.fundo === "cor-cheia" ? theme.bg
    : c.fundo === "escuro" ? (!isLight(theme.bg) ? theme.bg : p.fundo)
    : p.fundo;
  const claro = isLight(corBase) && !temFotoCheia;
  const tinta = temFotoCheia
    ? p.tintaClara
    : (theme.fg && isLight(theme.fg) !== claro ? theme.fg : (claro ? p.tintaEscura : p.tintaClara));
  const fundo =
    temFotoCheia ? p.fundo
    : c.fundo === "duotone" ? `linear-gradient(135deg, ${p.escuro} 0%, ${shade(p.forte, -0.5)} 100%)`
    : corBase;

  /**
   * O realce (número gigante, tarja, pílula, filete) precisa se separar do
   * fundo pela LUMINOSIDADE, não só pela matiz — verde sobre verde tem matiz
   * igual e some, e foi exatamente o que aconteceu no primeiro teste. Se a cor
   * da marca não se separa, ela é empurrada para o lado oposto do fundo.
   */
  const lum = (hex: string) => {
    const h = hex.replace("#", "");
    const n = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) || 0);
    return (r * 299 + g * 587 + b * 114) / 1000;
  };
  const baseParaRealce = temFotoCheia ? p.fundo : corBase;
  const candidato = p.forte;
  const realce = Math.abs(lum(candidato) - lum(baseParaRealce)) > 60
    ? candidato
    : shade(candidato, isLight(baseParaRealce) ? -0.55 : 0.6);
  const sobreRealce = isLight(realce) ? p.tintaEscura : "#fff";

  const pad = u(84);
  const pesoTitulo = c.titulo_peso === "fino" ? 200 : c.titulo_peso === "medio" ? 400 : 800;
  const escalaTitulo = c.titulo_escala === "colossal" ? 0.115 : c.titulo_escala === "gigante" ? 0.088 : 0.068;
  const larguraTexto = Math.min(1, Math.max(0.5, c.texto_largura ?? 0.86));
  const pesoFoto = Math.min(0.6, Math.max(0.2, c.foto_peso ?? 0.36));

  // ── A foto, na forma que o diretor pediu ────────────────────────────────
  const fotoEstilo: CSSProperties | null = !imagem ? null
    : c.foto === "tela-cheia" || c.fundo === "foto-cheia" ? { position: "absolute", inset: 0 }
    : c.foto === "faixa-base" ? { position: "absolute", left: 0, right: 0, bottom: 0, height: H * pesoFoto }
    : c.foto === "faixa-topo" ? { position: "absolute", left: 0, right: 0, top: 0, height: H * pesoFoto }
    : c.foto === "coluna-esquerda" ? { position: "absolute", left: 0, top: 0, bottom: 0, width: W * Math.max(0.35, pesoFoto) }
    : c.foto === "coluna-direita" ? { position: "absolute", right: 0, top: 0, bottom: 0, width: W * Math.max(0.35, pesoFoto) }
    : c.foto === "circulo" ? {
        position: "absolute", left: "50%", top: H * 0.3, transform: "translateX(-50%)",
        width: W * 0.62, height: W * 0.62, borderRadius: "50%", overflow: "hidden",
      }
    : c.foto === "arco" ? {
        position: "absolute", left: pad, right: pad, top: H * 0.26, height: H * 0.42,
        borderRadius: `${W * 0.31}px ${W * 0.31}px ${u(28)}px ${u(28)}px`, overflow: "hidden",
      }
    : null;

  /** Véu sobre a foto — só onde o texto realmente cai. */
  const veu = temFotoCheia
    ? c.texto_ancora === "topo"
      ? `linear-gradient(to bottom, ${p.fundo}E0 0%, ${p.fundo}40 46%, ${p.fundo}CC 100%)`
      : c.texto_ancora === "centro"
      ? `linear-gradient(to bottom, ${p.fundo}99 0%, ${p.fundo}E6 42%, ${p.fundo}99 100%)`
      : `linear-gradient(to bottom, ${p.fundo}59 0%, ${p.fundo}26 34%, ${p.fundo}F2 78%, ${p.fundo} 100%)`
    : null;

  // Com foto em coluna, o texto ocupa o outro lado.
  const recuoEsq = c.foto === "coluna-esquerda" && imagem ? W * Math.max(0.35, pesoFoto) + pad * 0.6 : pad;
  const recuoDir = c.foto === "coluna-direita" && imagem ? W * Math.max(0.35, pesoFoto) + pad * 0.6 : pad;
  // Faixas de foto empurram o texto para o lado oposto.
  const recuoTopo = c.foto === "faixa-topo" && imagem ? H * pesoFoto + u(50) : u(140);
  const recuoBase = c.foto === "faixa-base" && imagem ? H * pesoFoto + u(50) : u(120);

  const alinha = c.texto_alinha === "centro" ? "center" : "flex-start";

  return (
    <div style={{
      position: "relative", width: W, height: H, overflow: "hidden",
      fontFamily: FONTE, background: fundo, color: tinta,
    }}>
      {/* Ornamento estrutura o fundo antes de tudo */}
      {c.ornamento === "malha" && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(to right, ${realce}12 1px, transparent 1px), linear-gradient(to bottom, ${realce}12 1px, transparent 1px)`,
          backgroundSize: `${u(60)}px ${u(60)}px`,
        }} />
      )}
      {c.ornamento === "faixa-cor" && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: u(18), background: realce }} />
      )}
      {c.ornamento === "moldura" && (
        <div style={{ position: "absolute", inset: u(40), border: `${u(3)}px solid ${realce}66`, borderRadius: u(18) }} />
      )}
      {c.ornamento === "inicial-gigante" && (
        <div style={{
          position: "absolute", right: u(-140), bottom: u(-170), fontSize: u(640),
          fontWeight: 800, lineHeight: .72, color: `${realce}1A`, userSelect: "none",
        }}>{inicial}</div>
      )}

      {imagem && fotoEstilo && (
        <div style={fotoEstilo}>
          <img src={imagem} alt="" crossOrigin="anonymous"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 35%" }} />
          {/* Toda foto que recebe texto por cima ganha véu; as demais, um leve
              casamento com o fundo na borda que encosta no texto. */}
          {veu
            ? <div style={{ position: "absolute", inset: 0, background: veu }} />
            : <div style={{
                position: "absolute", inset: 0,
                background: c.foto === "faixa-base"
                  ? `linear-gradient(to bottom, ${c.fundo === "papel" ? p.papel : fundo} 0%, transparent 16%)`
                  : c.foto === "faixa-topo"
                  ? `linear-gradient(to top, ${c.fundo === "papel" ? p.papel : fundo} 0%, transparent 16%)`
                  : "transparent",
              }} />}
        </div>
      )}

      {/* Marca */}
      <div style={{
        position: "absolute", zIndex: 5, left: 0, right: 0, top: u(58), textAlign: "center",
        fontSize: u(19), fontWeight: 700, letterSpacing: ".34em", textTransform: "uppercase",
        color: temFotoCheia ? p.tintaClara : realce, opacity: temFotoCheia ? .9 : .65,
      }}>{brand.nome}</div>

      {/* Bloco de texto */}
      <div style={{
        position: "absolute", zIndex: 4,
        left: recuoEsq, right: recuoDir, top: recuoTopo, bottom: recuoBase,
        display: "flex", flexDirection: "column",
        justifyContent: c.texto_ancora === "topo" ? "flex-start" : c.texto_ancora === "base" ? "flex-end" : "center",
        alignItems: alinha, gap: u(26),
        textAlign: c.texto_alinha === "centro" ? "center" : "left",
      }}>
        {c.destaque === "numero-gigante" && slide.destaque && !ehCta && (
          <div style={{ fontSize: u(190), fontWeight: 800, lineHeight: .86, letterSpacing: "-.05em", color: realce }}>
            {slide.destaque}
          </div>
        )}
        {c.destaque === "chip-lateral" && slide.destaque && !ehCta && (
          <span style={{
            fontSize: u(17), fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase",
            color: realce, border: `${u(2)}px solid ${realce}`, borderRadius: "999px", padding: `${u(10)}px ${u(22)}px`,
          }}>{slide.destaque}</span>
        )}

        <h2 style={{
          margin: 0, maxWidth: `${larguraTexto * 100}%`,
          fontSize: u(escalaTitulo * 1080), fontWeight: pesoTitulo,
          lineHeight: c.titulo_escala === "colossal" ? 0.98 : 1.1,
          letterSpacing: c.titulo_escala === "colossal" ? "-.045em" : "-.03em",
          textTransform: c.titulo_caixa === "alta" ? "uppercase" : "none",
          textWrap: "balance",
        }}>
          <Titulo texto={slide.titulo} modo={c.enfase} cor={realce} sobre={sobreRealce} />
        </h2>

        {slide.corpo && c.apoio === "cartao" && (
          <div style={{
            background: temFotoCheia || !claro ? `${p.tintaClara}14` : `${p.tintaEscura}0D`,
            border: `1px solid ${temFotoCheia || !claro ? `${p.tintaClara}26` : `${p.tintaEscura}1A`}`,
            borderRadius: u(26), padding: `${u(28)}px ${u(30)}px`, maxWidth: `${larguraTexto * 100}%`,
            fontSize: u(24), lineHeight: 1.45,
          }}>{slide.corpo}</div>
        )}
        {slide.corpo && c.apoio === "lista" && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: u(12), maxWidth: `${larguraTexto * 100}%` }}>
            {slide.corpo.split(/(?<=[.;])\s+/).filter(Boolean).slice(0, 4).map((t, i) => (
              <li key={i} style={{ display: "flex", gap: u(12), fontSize: u(23), lineHeight: 1.4, textAlign: "left" }}>
                <span style={{ color: realce, fontWeight: 800 }}>—</span>
                <span style={{ opacity: .82 }}>{t.replace(/[.;]$/, "")}</span>
              </li>
            ))}
          </ul>
        )}
        {slide.corpo && c.apoio === "linha-fina" && (
          <>
            <div style={{ width: u(120), height: u(3), background: realce }} />
            <p style={{ margin: 0, fontSize: u(24), lineHeight: 1.5, opacity: .78, maxWidth: `${larguraTexto * 100}%` }}>{slide.corpo}</p>
          </>
        )}
        {slide.corpo && c.apoio === "nenhum" && (
          <p style={{ margin: 0, fontSize: u(24), lineHeight: 1.5, opacity: .78, maxWidth: `${larguraTexto * 100}%` }}>{slide.corpo}</p>
        )}

        {ehCta && slide.destaque && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: u(14), borderRadius: "999px",
            padding: `${u(19)}px ${u(38)}px`, fontSize: u(22), fontWeight: 700,
            background: realce, color: sobreRealce,
          }}>{slide.destaque}</span>
        )}
      </div>

      {/* Selo circular: assinatura de peça de estúdio, fora do fluxo do texto */}
      {c.destaque === "selo-circular" && slide.destaque && !ehCta && (
        <div style={{
          position: "absolute", zIndex: 5, right: pad, bottom: u(70),
          width: u(190), height: u(190), borderRadius: "50%", background: realce, color: sobreRealce,
          display: "grid", placeItems: "center", textAlign: "center", padding: u(24),
          fontSize: u(24), fontWeight: 800, lineHeight: 1.1,
        }}>{slide.destaque}</div>
      )}
      {c.destaque === "pilula" && slide.destaque && !ehCta && (
        <div style={{
          position: "absolute", zIndex: 5, left: recuoEsq, bottom: u(66),
          background: realce, color: sobreRealce, borderRadius: "999px",
          padding: `${u(14)}px ${u(30)}px`, fontSize: u(21), fontWeight: 700,
        }}>{slide.destaque}</div>
      )}
    </div>
  );
}
