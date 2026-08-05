/**
 * Modelo de slide em HTML/CSS — o motor novo.
 *
 * Por que existe: o motor de canvas desenha na mão, linha por linha, e cada
 * sombra, máscara ou recorte é código. Toda peça nova pedia layout novo, e por
 * isso a arte chegava perto das referências mas com jeito de montada. Aqui a
 * peça é HTML: tipografia de verdade, grid, degradê, máscara e sobreposição
 * saem de graça, e a identidade do cliente vira variável de CSS.
 *
 * A saída continua PNG 1080×1350 (ver rasterizarSlide), então ZIP, agendamento
 * e publicação não mudam nada.
 */
import { forwardRef } from "react";
import type { AcabamentoId, BrandInfo, FormatId, LayoutId, SlideData, Theme } from "@/lib/carouselRender";
import { FONT_PAIRS, FORMAT_SIZE, extrairEnfase } from "@/lib/carouselRender";
import {
  ModeloChips, ModeloCitacao, ModeloComparativo, ModeloConvite,
  ModeloDado, ModeloObjeto, ModeloPartido, type ModeloProps,
} from "@/components/slides/ModelosEmana";
import ModeloGenerativo, { type Composicao } from "@/components/slides/ModeloGenerativo";

export interface SlideHtmlProps {
  slide: SlideData;
  index: number;
  total: number;
  theme: Theme;
  brand: BrandInfo;
  format: FormatId;
  imagem?: string | null;
  acabamento?: AcabamentoId;
  mostrarNumero?: boolean;
  mostrarArraste?: boolean;
  /** Foto atravessando vários slides: cada peça mostra a sua janela. */
  fatia?: { parte: number; de: number };
  /** Qual modelo HTML desenhar. Sem isso, o "estudio". */
  layout?: LayoutId;
  /**
   * A peça projetada pelo diretor de arte. Quando vem, MANDA — é ela que
   * permite peça nova em vez de escolha entre modelos prontos.
   */
  composicao?: Composicao | null;
}

/**
 * Cada modelo do motor HTML entra aqui como irmão do "estudio".
 *
 * É este mapa que permite migrar um modelo por vez sem derrubar os outros: o
 * que não está aqui continua sendo desenhado pelo canvas.
 */
const MODELOS: Partial<Record<LayoutId, (p: ModeloProps) => JSX.Element>> = {
  dado: ModeloDado,
  objeto: ModeloObjeto,
  partido: ModeloPartido,
  citacao: ModeloCitacao,
  chips: ModeloChips,
  comparativo: ModeloComparativo,
  convite: ModeloConvite,
};

/** Título com a palavra marcada por *asteriscos* virando tarja. */
function TituloComEnfase({ texto, corTarja, sobreTarja }: { texto: string; corTarja: string; sobreTarja: string }) {
  const { limpo, enfase } = extrairEnfase(texto);
  if (!enfase.length) return <>{limpo}</>;
  const pedacos: Array<{ t: string; marcado: boolean }> = [];
  let cursor = 0;
  for (const [a, b] of enfase) {
    if (a > cursor) pedacos.push({ t: limpo.slice(cursor, a), marcado: false });
    pedacos.push({ t: limpo.slice(a, b), marcado: true });
    cursor = b;
  }
  if (cursor < limpo.length) pedacos.push({ t: limpo.slice(cursor), marcado: false });
  return (
    <>
      {pedacos.map((p, i) =>
        p.marcado ? (
          <mark
            key={i}
            style={{
              background: corTarja,
              color: sobreTarja,
              // Sem padding VERTICAL: com entrelinha apertada a tarja invadia a
              // linha de cima. O respiro é só horizontal.
              padding: "0 .12em",
              borderRadius: ".1em",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            {p.t}
          </mark>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </>
  );
}

function claro(hex: string): boolean {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) || 0);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

/**
 * Um modelo só, por enquanto: papel com o texto em cima, faixa de foto na base
 * e os cartões de apoio cavalgando a emenda. É a estrutura das referências da
 * Carol, e a que ela aprovou. Os próximos entram como irmãos deste.
 */
const SlideHtml = forwardRef<HTMLDivElement, SlideHtmlProps>(function SlideHtml(props, ref) {
  const { slide, index, total, theme, brand, format, imagem, mostrarNumero, mostrarArraste, fatia } = props;

  // A peça projetada tem prioridade sobre qualquer modelo pronto.
  if (props.composicao) {
    const [Wc, Hc] = FORMAT_SIZE[format];
    return (
      <div ref={ref} style={{ width: Wc, height: Hc, overflow: "hidden" }}>
        <ModeloGenerativo slide={slide} index={index} total={total} theme={theme}
          brand={brand} format={format} imagem={imagem} composicao={props.composicao} />
      </div>
    );
  }

  // Modelo irmão: desenha o dele e sai. O wrapper tem o tamanho EXATO da peça —
  // `display:contents` não serviria, porque o rasterizador fotografa o primeiro
  // filho do container e um elemento sem caixa não tem o que fotografar.
  const Modelo = props.layout ? MODELOS[props.layout] : undefined;
  if (Modelo) {
    const [Wm, Hm] = FORMAT_SIZE[format];
    return (
      <div ref={ref} style={{ width: Wm, height: Hm, overflow: "hidden" }}>
        <Modelo slide={slide} index={index} total={total} theme={theme} brand={brand}
          format={format} imagem={imagem} mostrarNumero={mostrarNumero} />
      </div>
    );
  }
  const [W, H] = FORMAT_SIZE[format];
  const fonts = FONT_PAIRS[theme.fontPair];
  const papel = claro(theme.bg) ? theme.bg : "#EEF1F6";
  const tinta = claro(papel) ? "#0D1727" : "#FFFFFF";
  const marca = theme.accent;
  const apoio = theme.accent2 || (claro(papel) ? "#0D1E4A" : "#0A0D14");
  const temFoto = !!imagem;
  const inicial = (brand.nome || "•").trim().charAt(0).toUpperCase();

  // Escala tudo a partir da largura: o modelo serve 4:5, 1:1 e 9:16 sem
  // números mágicos espalhados.
  const u = (v: number) => `${(v * W) / 1080}px`;
  const alturaFoto = temFoto ? H * 0.35 : 0;

  // Foto que atravessa slides: a janela desta peça dentro do painel inteiro.
  const estiloFoto: React.CSSProperties = fatia
    ? {
        width: `${fatia.de * 100}%`,
        height: "100%",
        objectFit: "cover",
        transform: `translateX(-${(fatia.parte * 100) / fatia.de}%)`,
      }
    : { width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 22%" };

  return (
    <div
      ref={ref}
      style={{
        position: "relative", width: W, height: H, overflow: "hidden",
        background: papel, color: tinta, fontFamily: fonts.body,
        display: "grid", gridTemplateRows: `auto 1fr ${alturaFoto}px`,
        padding: `${u(76)} ${u(76)} 0`, boxSizing: "border-box",
      }}
    >
      {/* Papel quadriculado — a malha das referências */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage:
          `linear-gradient(to right, ${marca}14 1px, transparent 1px),` +
          `linear-gradient(to bottom, ${marca}14 1px, transparent 1px)`,
        backgroundSize: `${u(60)} ${u(60)}`,
      }} />

      {/* Símbolo da marca gigante em marca d'água */}
      <div style={{
        position: "absolute", right: u(-130), top: u(90), zIndex: 0,
        fontFamily: fonts.display, fontWeight: 800, fontSize: u(620),
        lineHeight: .78, letterSpacing: "-.06em", color: `${marca}1F`, userSelect: "none",
      }}>{inicial}</div>

      {/* Topo: marca e etiqueta */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: u(12), fontWeight: 800, fontSize: u(22), letterSpacing: "-.02em" }}>
          {brand.logoUrl
            ? <img src={brand.logoUrl} alt="" crossOrigin="anonymous" style={{ height: u(40), width: "auto", objectFit: "contain" }} />
            : <span style={{
                width: u(40), height: u(40), borderRadius: u(12), background: marca,
                display: "grid", placeItems: "center", color: claro(marca) ? "#0D1727" : "#fff", fontSize: u(22),
              }}>{inicial}</span>}
          {brand.nome}
        </div>
        {slide.destaque ? (
          <div style={{ fontSize: u(15), fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", opacity: .55 }}>
            {slide.destaque}
          </div>
        ) : null}
      </div>

      {/* Miolo: título e cartões. `gridRow: 2` explícito porque a malha e a
          marca d'água são absolutas e não ocupam faixa — sem isso o conteúdo
          cola no topo e a metade de baixo fica vazia. */}
      <div style={{
        gridRow: 2, position: "relative", zIndex: 3, display: "flex",
        flexDirection: "column", justifyContent: "flex-end", gap: u(46),
      }}>
        <h1 style={{
          margin: 0, fontFamily: fonts.display, fontWeight: 500,
          fontSize: u(slide.tipo === "capa" ? 96 : 84), lineHeight: 1.06,
          letterSpacing: "-.035em", textWrap: "balance", maxWidth: "13ch",
          textTransform: fonts.upper ? "uppercase" : "none",
        }}>
          <TituloComEnfase texto={slide.titulo} corTarja={marca} sobreTarja={claro(marca) ? "#0D1727" : "#fff"} />
        </h1>

        {slide.corpo ? (
          <div style={{
            position: "relative", zIndex: 3, marginBottom: temFoto ? u(-104) : 0,
            display: "flex", gap: u(20), alignItems: "stretch",
          }}>
            <div style={{
              flex: 1, background: apoio, color: claro(apoio) ? "#0D1727" : "#fff",
              borderRadius: u(30), padding: `${u(30)} ${u(34)}`,
              display: "flex", flexDirection: "column", justifyContent: "center", gap: u(10),
              boxShadow: `0 ${u(24)} ${u(48)} ${u(-24)} ${apoio}99`,
            }}>
              <span style={{ fontSize: u(14), fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", opacity: .6 }}>
                {brand.nome}
              </span>
              <p style={{ margin: 0, fontSize: u(25), lineHeight: 1.35, fontWeight: 500 }}>{slide.corpo}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Faixa de foto na base */}
      {temFoto ? (
        <div style={{ gridRow: 3, position: "relative", margin: `0 ${u(-76)}`, overflow: "hidden" }}>
          <img src={imagem as string} alt="" crossOrigin="anonymous" style={estiloFoto} />
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(to bottom, ${papel} 0%, transparent 22%)`,
          }} />
        </div>
      ) : null}

      {/* Base: botão e progresso */}
      <div style={{
        position: "absolute", zIndex: 3, left: u(76), right: u(76), bottom: u(52),
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: u(20),
      }}>
        {(slide.tipo === "cta" || (mostrarArraste !== false && total > 1)) ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: u(16),
            background: tinta, color: papel, borderRadius: "999px",
            padding: `${u(16)} ${u(16)} ${u(16)} ${u(30)}`, fontSize: u(21), fontWeight: 700,
          }}>
            {slide.tipo === "cta" ? (slide.destaque || "Saiba mais") : "Arrasta pro lado"}
            <span style={{
              width: u(44), height: u(44), borderRadius: "999px", background: marca,
              display: "grid", placeItems: "center", fontSize: u(20), color: claro(marca) ? "#0D1727" : "#fff",
            }}>→</span>
          </span>
        ) : <span />}

        {total > 1 && mostrarNumero !== false ? (
          <div style={{
            display: "flex", gap: u(8), alignItems: "center",
            // Sobre a foto o cinza escuro sumia: claro com sombra sempre lê.
            textShadow: temFoto ? "0 2px 10px rgba(0,0,0,.5)" : "none",
          }}>
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} style={{
                width: u(46), height: u(5), borderRadius: u(3),
                background: i <= index
                  ? (temFoto ? "#fff" : marca)
                  : (temFoto ? "rgba(255,255,255,.42)" : `${tinta}2E`),
              }} />
            ))}
            <span style={{
              fontSize: u(16), fontWeight: 700, marginLeft: u(10),
              color: temFoto ? "rgba(255,255,255,.85)" : `${tinta}73`,
            }}>
              {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
});

export default SlideHtml;
