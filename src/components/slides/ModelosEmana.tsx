/**
 * Os sete sistemas visuais que nasceram no protótipo da Emana, agora como
 * modelos do motor HTML — escolhíveis pelo diretor de arte, como qualquer
 * layout.
 *
 * Eles existiam só como HTML estático meu, com o conteúdo chumbado; a Carol viu
 * a diferença de acabamento e pediu todos ("quero todos"). Aqui cada um vira
 * componente parametrizado: recebe o slide, o tema e a marca, e se pinta com a
 * identidade do cliente.
 *
 * O que os torna diferentes do canvas: tipografia de verdade com peso variável
 * na mesma frase, degradê costurando foto e papel, marca d'água gigante
 * sangrando pela borda, cartões com raio grande e sombra — coisas que no canvas
 * seriam código de desenho e aqui saem de CSS.
 *
 * REGRA DE PALETA (vale para os sete): a peça usa TRÊS cores derivadas da
 * identidade do cliente — `forte` (a cor da marca), `escuro` (a segunda cor, ou
 * um tom profundo derivado dela) e `papel`. Nunca inventar uma quarta.
 */
import type { CSSProperties, ReactNode } from "react";
import type { BrandInfo, FormatId, SlideData, Theme } from "@/lib/carouselRender";
import { FORMAT_SIZE, extrairEnfase, isLight, shade } from "@/lib/carouselRender";

export interface ModeloProps {
  slide: SlideData;
  index: number;
  total: number;
  theme: Theme;
  brand: BrandInfo;
  format: FormatId;
  imagem?: string | null;
  mostrarNumero?: boolean;
}

/** As três cores da peça, derivadas da identidade do cliente. */
function paleta(theme: Theme) {
  const forte = theme.accent || "#A3E635";
  // A segunda cor da marca quando existe; senão um tom profundo da primeira.
  // Derivar em vez de escolher mantém a peça dentro da identidade.
  const escuro = theme.accent2 && !isLight(theme.accent2)
    ? theme.accent2
    : (!isLight(theme.bg) ? theme.bg : shade(forte, -0.72));
  const papel = isLight(theme.bg) ? theme.bg : "#F4F7F0";
  const fundo = shade(escuro, -0.35);
  const sobreForte = isLight(forte) ? shade(escuro, -0.1) : "#FFFFFF";
  const sobreEscuro = isLight(forte) ? forte : "#E9F5EC";
  return { forte, escuro, papel, fundo, sobreForte, sobreEscuro, tinta: shade(escuro, -0.05) };
}

/**
 * Título com a palavra marcada. Nos modelos claros ela vira TARJA (é o gesto da
 * referência); nos escuros, peso + cor, porque tarja em fundo escuro fecha
 * demais a composição.
 */
function Titulo({ texto, cor, tarja, sobreTarja }: { texto: string; cor?: string; tarja?: string; sobreTarja?: string }) {
  const { limpo, enfase } = extrairEnfase(texto);
  if (!enfase.length) return <>{limpo}</>;
  const partes: ReactNode[] = [];
  let cursor = 0;
  enfase.forEach(([a, b], i) => {
    if (a > cursor) partes.push(<span key={`t${i}`}>{limpo.slice(cursor, a)}</span>);
    partes.push(
      tarja
        ? <mark key={`m${i}`} style={{
            /**
             * A tarja é um GRADIENTE de altura fixa, não um `background` comum.
             *
             * Background de elemento inline cobre a "content area" da fonte —
             * que na Outfit é bem mais alta que a letra —, então a tarja subia e
             * comia a linha de cima. Aumentar a entrelinha piora: a caixa cresce
             * junto. Pintando uma faixa de 1.06em centrada, a altura passa a ser
             * decisão nossa e não da métrica da fonte.
             */
            background: `linear-gradient(${tarja}, ${tarja}) center/100% 1.06em no-repeat`,
            color: sobreTarja, fontWeight: 700,
            padding: "0 .1em", borderRadius: ".08em",
            boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone",
          }}>{limpo.slice(a, b)}</mark>
        : <b key={`b${i}`} style={{ fontWeight: 700, color: cor }}>{limpo.slice(a, b)}</b>,
    );
    cursor = b;
  });
  if (cursor < limpo.length) partes.push(<span key="fim">{limpo.slice(cursor)}</span>);
  return <>{partes}</>;
}

/** Marca no topo, em caixa alta espaçada — a assinatura dos sete. */
function Marca({ nome, cor, u, opacidade = 1 }: { nome: string; cor: string; u: (v: number) => string; opacidade?: number }) {
  return (
    <div style={{
      position: "absolute", zIndex: 4, left: 0, right: 0, top: u(62), textAlign: "center",
      fontSize: u(19), fontWeight: 700, letterSpacing: ".34em", textTransform: "uppercase",
      color: cor, opacity: opacidade,
    }}>{nome}</div>
  );
}

/** A inicial da marca, gigante, sangrando pela borda. */
function Agua({ letra, style }: { letra: string; style: CSSProperties }) {
  return <div style={{ position: "absolute", fontWeight: 800, lineHeight: .72, userSelect: "none", ...style }}>{letra}</div>;
}

function Cta({ texto, bg, cor, u, style }: { texto: string; bg: string; cor: string; u: (v: number) => string; style?: CSSProperties }) {
  if (!texto) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: u(14), borderRadius: "999px",
      padding: `${u(19)} ${u(38)}`, fontSize: u(22), fontWeight: 700,
      background: bg, color: cor, ...style,
    }}>{texto}</span>
  );
}

/** Base comum: tamanho da peça, fonte e a escala que serve 4:5, 1:1 e 9:16. */
function usarBase(props: ModeloProps) {
  const [W, H] = FORMAT_SIZE[props.format];
  const u = (v: number) => `${(v * W) / 1080}px`;
  const p = paleta(props.theme);
  const inicial = (props.brand.nome || "•").trim().charAt(0).toLowerCase();
  const ehCta = props.slide.tipo === "cta";
  // O destaque vira o texto do botão no CTA; nos outros ele é o dado em evidência.
  const textoCta = ehCta ? (props.slide.destaque || "Fale com a gente") : "";
  return { W, H, u, p, inicial, ehCta, textoCta };
}

const fonteBase = "Outfit, ui-sans-serif, system-ui, sans-serif";

/* ═══ 1 · Dado gigante em cor cheia ═══════════════════════════════════════ */
export function ModeloDado(props: ModeloProps) {
  const { W, H, u, p, inicial, textoCta } = usarBase(props);
  const { slide, brand } = props;
  return (
    <div style={{
      position: "relative", width: W, height: H, overflow: "hidden", fontFamily: fonteBase,
      background: p.forte, color: p.escuro, display: "grid", gridTemplateRows: "auto 1fr auto",
      padding: `${u(130)} ${u(84)} ${u(84)}`, textAlign: "center", boxSizing: "border-box",
    }}>
      <Agua letra={inicial} style={{ right: u(-150), bottom: u(-180), fontSize: u(660), color: `${p.escuro}17` }} />
      <Marca nome={brand.nome} cor={p.escuro} u={u} opacidade={.55} />
      <div style={{ gridRow: 2, display: "flex", flexDirection: "column", justifyContent: "center", gap: u(26), position: "relative", zIndex: 3 }}>
        {slide.destaque && slide.tipo !== "cta" && (
          <div style={{ fontSize: u(208), fontWeight: 800, lineHeight: .84, letterSpacing: "-.05em" }}>{slide.destaque}</div>
        )}
        <h2 style={{ margin: 0, fontSize: u(58), fontWeight: 300, lineHeight: 1.12, letterSpacing: "-.03em", textWrap: "balance" }}>
          <Titulo texto={slide.titulo} />
        </h2>
        {slide.corpo && (
          <p style={{ margin: "0 auto", fontSize: u(23), opacity: .72, lineHeight: 1.45, maxWidth: "30ch" }}>{slide.corpo}</p>
        )}
      </div>
      <div style={{ position: "relative", zIndex: 4, textAlign: "center" }}>
        <Cta texto={textoCta} bg={p.escuro} cor={p.forte} u={u} />
      </div>
    </div>
  );
}

/* ═══ 2 · Objeto herói com glow ═══════════════════════════════════════════ */
export function ModeloObjeto(props: ModeloProps) {
  const { W, H, u, p, inicial, textoCta } = usarBase(props);
  const { slide, brand, imagem } = props;
  return (
    <div style={{
      position: "relative", width: W, height: H, overflow: "hidden", fontFamily: fonteBase,
      background: `radial-gradient(115% 85% at 50% 40%, ${shade(p.escuro, .18)} 0%, ${p.fundo} 62%)`,
      color: p.sobreEscuro, display: "grid", gridTemplateRows: "auto 1fr auto",
      padding: `${u(120)} ${u(84)} ${u(84)}`, textAlign: "center", boxSizing: "border-box",
    }}>
      <Agua letra={inicial} style={{ left: u(-170), bottom: u(-200), fontSize: u(700), color: `${p.forte}10` }} />
      <Marca nome={brand.nome} cor={p.forte} u={u} />
      <div style={{ gridRow: 2, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 3 }}>
        {imagem && (
          // O glow radial dissolve a foto no fundo em vez de recortá-la num
          // quadrado — é o que faz o objeto parecer iluminado, e não colado.
          //
          // O radial sozinho não bastava: com foto CLARA (um telhado, um céu) a
          // base continuava luminosa e o título caía em cima dela, ilegível. O
          // linear garante que o terço de baixo vire fundo, seja qual for a foto.
          <div style={{ margin: `0 ${u(-84)}`, height: u(500), position: "relative" }}>
            <img src={imagem} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{
              position: "absolute", inset: u(-2),
              background: `radial-gradient(64% 64% at 50% 44%, transparent 38%, ${p.fundo} 84%)`,
            }} />
            {/* As duas bordas horizontais também dissolvem: sem isto a foto
                termina numa linha reta no topo e o "objeto flutuando na luz"
                vira um retângulo colado no fundo. */}
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(to bottom, ${p.fundo} 0%, transparent 22%, transparent 46%, ${p.fundo}D9 78%, ${p.fundo} 100%)`,
            }} />
          </div>
        )}
        <h2 style={{
          margin: 0, marginTop: imagem ? u(8) : 0, fontSize: u(76), fontWeight: 200,
          lineHeight: 1.08, letterSpacing: "-.03em", textWrap: "balance",
        }}>
          <Titulo texto={slide.titulo} cor={p.forte} />
        </h2>
        {slide.corpo && (
          <p style={{ margin: `${u(26)} auto 0`, fontSize: u(24), opacity: .68, lineHeight: 1.5, maxWidth: "32ch" }}>{slide.corpo}</p>
        )}
      </div>
      <div style={{ position: "relative", zIndex: 4 }}>
        <Cta texto={textoCta} bg={p.forte} cor={p.fundo} u={u} />
      </div>
    </div>
  );
}

/* ═══ 3 · Peça partida: papel em cima, cena embaixo ═══════════════════════ */
export function ModeloPartido(props: ModeloProps) {
  const { W, H, u, p, inicial, textoCta } = usarBase(props);
  const { slide, brand, imagem } = props;
  const alturaFoto = imagem ? H * 0.37 : 0;
  return (
    <div style={{
      position: "relative", width: W, height: H, overflow: "hidden", fontFamily: fonteBase,
      background: p.papel, color: p.tinta, display: "grid",
      gridTemplateRows: `auto 1fr ${alturaFoto}px`, padding: `${u(120)} ${u(84)} 0`, boxSizing: "border-box",
    }}>
      <Agua letra={inicial} style={{ right: u(-140), top: u(150), fontSize: u(560), color: `${p.escuro}12` }} />
      <Marca nome={brand.nome} cor={p.escuro} u={u} opacidade={.5} />
      <div style={{
        gridRow: 2, display: "flex", flexDirection: "column", justifyContent: "flex-end",
        gap: u(30), paddingBottom: u(60), position: "relative", zIndex: 3,
      }}>
        <h2 style={{ margin: 0, fontSize: u(84), fontWeight: 300, lineHeight: 1.1, letterSpacing: "-.035em", textWrap: "balance", maxWidth: "15ch" }}>
          <Titulo texto={slide.titulo} tarja={p.forte} sobreTarja={isLight(p.forte) ? p.escuro : "#fff"} />
        </h2>
        {slide.corpo && <p style={{ margin: 0, fontSize: u(25), lineHeight: 1.5, opacity: .68, maxWidth: "30ch" }}>{slide.corpo}</p>}
      </div>
      {imagem && (
        <div style={{ gridRow: 3, margin: `0 ${u(-84)}`, position: "relative" }}>
          <img src={imagem} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${p.papel} 0%, transparent 18%)` }} />
        </div>
      )}
      {textoCta && (
        <div style={{ position: "absolute", zIndex: 4, left: u(84), bottom: u(64) }}>
          <Cta texto={textoCta} bg={p.escuro} cor={p.forte} u={u} />
        </div>
      )}
    </div>
  );
}

/* ═══ 4 · Citação com aspas gráficas ══════════════════════════════════════ */
export function ModeloCitacao(props: ModeloProps) {
  const { W, H, u, p, inicial } = usarBase(props);
  const { slide, brand } = props;
  return (
    <div style={{
      position: "relative", width: W, height: H, overflow: "hidden", fontFamily: fonteBase,
      background: p.escuro, color: p.papel, display: "grid", gridTemplateRows: "auto 1fr auto",
      padding: `${u(120)} ${u(90)} ${u(84)}`, boxSizing: "border-box",
    }}>
      <Agua letra={inicial} style={{ right: u(-160), bottom: u(-190), fontSize: u(660), color: `${p.forte}12` }} />
      <Marca nome={brand.nome} cor={p.forte} u={u} />
      <div style={{ gridRow: 2, display: "flex", flexDirection: "column", justifyContent: "center", gap: u(34), position: "relative", zIndex: 3 }}>
        <div style={{ fontSize: u(190), lineHeight: .5, fontWeight: 800, color: p.forte, height: u(96) }}>“</div>
        <blockquote style={{ margin: 0, fontSize: u(72), fontWeight: 200, lineHeight: 1.18, letterSpacing: "-.025em", textWrap: "balance" }}>
          <Titulo texto={slide.titulo} cor={p.forte} />
        </blockquote>
        {slide.corpo && (
          <span style={{
            display: "inline-flex", alignSelf: "flex-start", background: `${p.papel}1A`,
            borderRadius: "999px", padding: `${u(13)} ${u(26)}`, fontSize: u(20), fontWeight: 500,
          }}>{slide.corpo}</span>
        )}
      </div>
      <div style={{ position: "relative", zIndex: 4, color: `${p.papel}73`, fontSize: u(19), letterSpacing: ".2em" }}>
        {brand.handle || ""}
      </div>
    </div>
  );
}

/* ═══ 5 · Grade de cartões técnicos ═══════════════════════════════════════ */
export function ModeloChips(props: ModeloProps) {
  const { W, H, u, p, inicial, textoCta } = usarBase(props);
  const { slide, brand } = props;
  /**
   * O corpo vira cartões: cada frase do texto é um dado. É o único modelo que
   * FATIA o corpo — por isso ele só serve quando há mais de uma informação, e o
   * diretor é instruído a escolhê-lo nesse caso.
   */
  const itens = (slide.corpo || "")
    .split(/(?<=[.;])\s+|\s+·\s+/)
    .map((t) => t.trim().replace(/[.;]$/, ""))
    .filter(Boolean)
    .slice(0, 4);
  return (
    <div style={{
      position: "relative", width: W, height: H, overflow: "hidden", fontFamily: fonteBase,
      background: p.fundo, color: p.sobreEscuro, display: "grid", gridTemplateRows: "auto 1fr auto",
      padding: `${u(120)} ${u(76)} ${u(84)}`, textAlign: "center", boxSizing: "border-box",
    }}>
      <Agua letra={inicial} style={{ left: u(-150), top: u(200), fontSize: u(620), color: `${p.forte}0D` }} />
      <Marca nome={brand.nome} cor={p.forte} u={u} />
      <div style={{ gridRow: 2, display: "flex", flexDirection: "column", justifyContent: "center", gap: u(40), position: "relative", zIndex: 3 }}>
        <h2 style={{ margin: 0, fontSize: u(66), fontWeight: 200, lineHeight: 1.1, letterSpacing: "-.03em", textWrap: "balance" }}>
          <Titulo texto={slide.titulo} cor={p.forte} />
        </h2>
        {itens.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: itens.length > 1 ? "1fr 1fr" : "1fr", gap: u(18) }}>
            {itens.map((t, i) => (
              <div key={i} style={{
                background: `${p.forte}12`, border: `1px solid ${p.forte}3D`, borderRadius: u(26),
                padding: `${u(30)} ${u(26)}`, textAlign: "left", display: "flex", flexDirection: "column", gap: u(8),
              }}>
                <span style={{ fontSize: u(44), fontWeight: 800, color: p.forte, lineHeight: 1 }}>{i + 1}</span>
                <small style={{ fontSize: u(21), opacity: .72, lineHeight: 1.35 }}>{t}</small>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ position: "relative", zIndex: 4 }}>
        <Cta texto={textoCta} bg={p.forte} cor={p.fundo} u={u} />
      </div>
    </div>
  );
}

/* ═══ 6 · Comparativo antes/depois ════════════════════════════════════════ */
export function ModeloComparativo(props: ModeloProps) {
  const { W, H, u, p, inicial, textoCta } = usarBase(props);
  const { slide, brand } = props;
  // "antes → depois", "de X para Y", "X vs Y" — o corpo é partido em dois lados.
  const partes = (slide.corpo || "").split(/\s+(?:→|->|vs\.?|versus|para)\s+/i);
  const antes = partes[0]?.trim() ?? "";
  const depois = (partes[1] ?? "").trim();
  return (
    <div style={{
      position: "relative", width: W, height: H, overflow: "hidden", fontFamily: fonteBase,
      background: p.papel, color: p.tinta, display: "grid", gridTemplateRows: "auto 1fr auto",
      padding: `${u(120)} ${u(84)} ${u(84)}`, boxSizing: "border-box",
    }}>
      <Agua letra={inicial} style={{ right: u(-150), bottom: u(-170), fontSize: u(600), color: `${p.escuro}0F` }} />
      <Marca nome={brand.nome} cor={p.escuro} u={u} opacidade={.5} />
      <div style={{ gridRow: 2, display: "flex", flexDirection: "column", justifyContent: "center", gap: u(40), position: "relative", zIndex: 3 }}>
        <h2 style={{ margin: 0, fontSize: u(72), fontWeight: 300, lineHeight: 1.12, letterSpacing: "-.035em", textWrap: "balance" }}>
          <Titulo texto={slide.titulo} tarja={p.forte} sobreTarja={isLight(p.forte) ? p.escuro : "#fff"} />
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: depois ? "1fr 1fr" : "1fr", gap: u(20) }}>
          <div style={{ background: `${p.tinta}12`, borderRadius: u(30), padding: `${u(36)} ${u(32)}`, display: "flex", flexDirection: "column", gap: u(12) }}>
            <em style={{ fontStyle: "normal", fontSize: u(17), fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", opacity: .55 }}>Antes</em>
            <small style={{ fontSize: u(20), opacity: .7, lineHeight: 1.35 }}>{antes}</small>
          </div>
          {depois && (
            <div style={{ background: p.escuro, color: p.papel, borderRadius: u(30), padding: `${u(36)} ${u(32)}`, display: "flex", flexDirection: "column", gap: u(12) }}>
              <em style={{ fontStyle: "normal", fontSize: u(17), fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", opacity: .55 }}>Depois</em>
              {slide.destaque && slide.tipo !== "cta" && (
                <strong style={{ fontSize: u(62), fontWeight: 800, letterSpacing: "-.04em", lineHeight: 1, color: p.forte }}>{slide.destaque}</strong>
              )}
              <small style={{ fontSize: u(20), opacity: .75, lineHeight: 1.35 }}>{depois}</small>
            </div>
          )}
        </div>
      </div>
      <div style={{ position: "relative", zIndex: 4 }}>
        <Cta texto={textoCta} bg={p.escuro} cor={p.forte} u={u} />
      </div>
    </div>
  );
}

/* ═══ 7 · Convite com retrato ═════════════════════════════════════════════ */
export function ModeloConvite(props: ModeloProps) {
  const { W, H, u, p, inicial, textoCta } = usarBase(props);
  const { slide, brand, imagem } = props;
  return (
    <div style={{
      position: "relative", width: W, height: H, overflow: "hidden", fontFamily: fonteBase,
      background: p.fundo, color: p.sobreEscuro, boxSizing: "border-box",
    }}>
      {imagem
        ? (
          <div style={{ position: "absolute", inset: 0 }}>
            <img src={imagem} alt="" crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }} />
            {/* O degradê vem em quatro paradas: escurece o topo o suficiente para
                a marca ler, abre no rosto e fecha na base para o texto. */}
            <div style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(to bottom, ${p.fundo}8C 0%, ${p.fundo}26 26%, ${p.fundo}EB 64%, ${p.fundo} 88%)`,
            }} />
          </div>
        )
        : <Agua letra={inicial} style={{ right: u(-140), top: u(180), fontSize: u(640), color: `${p.forte}12` }} />}
      <Marca nome={brand.nome} cor={p.forte} u={u} />
      <div style={{
        position: "absolute", zIndex: 4, left: u(84), right: u(84), bottom: u(84),
        display: "flex", flexDirection: "column", gap: u(26),
      }}>
        <h2 style={{ margin: 0, fontSize: u(78), fontWeight: 200, lineHeight: 1.12, letterSpacing: "-.03em", textWrap: "balance" }}>
          <Titulo texto={slide.titulo} tarja={p.forte} sobreTarja={isLight(p.forte) ? p.fundo : "#fff"} />
        </h2>
        {slide.corpo && <p style={{ margin: 0, fontSize: u(24), opacity: .74, lineHeight: 1.5, maxWidth: "32ch" }}>{slide.corpo}</p>}
        <Cta texto={textoCta} bg={p.forte} cor={p.fundo} u={u} style={{ alignSelf: "flex-start" }} />
      </div>
    </div>
  );
}
