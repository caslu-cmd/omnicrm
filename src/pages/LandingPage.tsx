import { useState, useEffect } from "react";
import { Zap, ArrowUpRight, MessageCircle, Instagram, Linkedin, ArrowRight } from "lucide-react";

const LIME  = "#B9FF4B";
const BLACK = "#080808";
const OFF   = "#EFEFEB";
const DIM   = "rgba(239,239,235,0.38)";

/* ─── CSS ──────────────────────────────────────────────────── */
const CSS = `
  .cl * { box-sizing: border-box; margin: 0; padding: 0; }
  .cl a { text-decoration: none; color: inherit; }
  .cl button { font-family: inherit; }

  /* Animations */
  @keyframes cl-in   { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
  @keyframes cl-tick { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @keyframes cl-bob  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(7px); } }
  @keyframes cl-glow { 0%,100% { box-shadow:0 0 0 0 rgba(185,255,75,.5); } 50% { box-shadow:0 0 0 6px rgba(185,255,75,0); } }

  .cl-a1 { animation: cl-in .7s ease both .05s; }
  .cl-a2 { animation: cl-in .7s ease both .18s; }
  .cl-a3 { animation: cl-in .7s ease both .32s; }
  .cl-a4 { animation: cl-in .7s ease both .48s; }
  .cl-a5 { animation: cl-in .7s ease both .68s; }

  /* Hover states */
  .cl-pill:hover  { opacity:.82; transform:translateY(-1px); }
  .cl-pill        { transition: opacity .18s, transform .18s; }
  .cl-link:hover  { color: ${LIME} !important; }
  .cl-link        { transition: color .18s; }
  .cl-scard:hover { border-color: rgba(185,255,75,.25) !important; background: rgba(185,255,75,.03) !important; }
  .cl-scard       { transition: border-color .2s, background .2s; }
  .cl-prod:hover  { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,.4); }
  .cl-prod        { transition: transform .25s, box-shadow .25s; }
  .cl-social:hover { border-color: ${LIME} !important; }
  .cl-social      { transition: border-color .2s; }

  .cl-dot { animation: cl-glow 2.2s ease-in-out infinite; }
  .cl-bob { animation: cl-bob 1.7s ease-in-out infinite; }

  /* Horizontal rule design element */
  .cl-hr { width:100%; height:1px; background: rgba(255,255,255,.07); }
`;

/* ─── Data ──────────────────────────────────────────────────── */
const SERVICES = [
  { n: "01", name: "Estratégia & Marca",     copy: "Posicionamento, identidade e pauta editorial que fazem sua marca ser reconhecida e lembrada." },
  { n: "02", name: "Conteúdo & Copy",        copy: "Textos, legendas, artigos e roteiros que convencem — porque cada palavra tem uma função." },
  { n: "03", name: "Tráfego Pago",           copy: "Facebook, Instagram e Google Ads gerenciados para ROAS alto e CPA que faz sentido." },
  { n: "04", name: "Redes Sociais",          copy: "Publicação diária, atendimento e engajamento. Sua marca ativa, todos os dias." },
  { n: "05", name: "SEO & Blog",             copy: "Autoridade orgânica que cresce com o tempo e atrai clientes sem depender de anúncios." },
  { n: "06", name: "CRM & Automação",        copy: "Leads qualificados, nurturados e convertidos. Do WhatsApp ao fechamento." },
];

const PRODUCTS = [
  {
    tag: "CRM",
    name: "OmniCRM",
    headline: "Omnichannel",
    color: LIME,
    desc: "Todos os canais do seu cliente em um lugar só — WhatsApp, Instagram, e-mail, site. Um pipeline visual para fechar mais negócios com menos esforço.",
    items: ["Inbox unificado", "Pipeline visual", "Automações de follow-up", "Relatórios em tempo real"],
  },
  {
    tag: "IA",
    name: "Posture.AI",
    headline: "Análise de Posicionamento",
    color: "#A78BFA",
    desc: "IA que lê sua presença digital e diz exatamente o que está travando seu crescimento. Diagnóstico, plano de ação e score de autoridade gerados em minutos.",
    items: ["Diagnóstico completo de marca", "Análise de concorrência", "Score de autoridade digital", "Plano de ação priorizado"],
  },
  {
    tag: "RH",
    name: "RH Inteligente",
    headline: "Gestão de Pessoas com IA",
    color: "#34D399",
    desc: "Do recrutamento ao onboarding, a IA assume o operacional para o seu RH focar no que mais importa: as pessoas.",
    items: ["Triagem automática de currículos", "Onboarding digital", "Avaliações de desempenho", "People analytics"],
  },
];

const TEAM = [
  { i: "A", name: "ARIA",     role: "Orquestradora",  color: LIME      },
  { i: "C", name: "Carolina", role: "Estrategista",   color: "#FBBF24" },
  { i: "B", name: "Beatriz",  role: "Copywriter",     color: "#A78BFA" },
  { i: "I", name: "Isadora",  role: "Designer",       color: "#D946EF" },
  { i: "R", name: "Rafaela",  role: "Tráfego",        color: "#F97316" },
  { i: "M", name: "Marina",   role: "Social Media",   color: "#60A5FA" },
  { i: "L", name: "Lucas",    role: "Analytics",      color: "#34D399" },
  { i: "E", name: "Eduardo",  role: "Vendas / CRM",   color: "#F59E0B" },
  { i: "T", name: "Teo",      role: "Web & SEO",      color: "#06B6D4" },
  { i: "V", name: "Vitória",  role: "Revisão",        color: "#EC4899" },
];

const TICKER = [
  "Criatividade", "Tecnologia", "Performance", "IA proprietária",
  "ROAS 3.8×", "14 clientes", "São Paulo", "Resultados reais",
  "Marketing 24h", "OmniCRM", "Posture.AI", "RH Inteligente",
];

const mono = "'DM Mono', monospace";
const syne = "'Syne', 'Inter', sans-serif";

function fmt(n: number) { return n.toLocaleString("pt-BR"); }

/* ─── Component ─────────────────────────────────────────────── */
export default function LandingPage() {
  const [nav, setNav] = useState(false);

  useEffect(() => {
    const fn = () => setNav(window.scrollY > 48);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="cl" style={{ fontFamily: syne, background: BLACK, color: OFF, minHeight: "100vh" }}>
      <style>{CSS}</style>

      {/* ════════ NAV ════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        height: 60, padding: "0 52px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: nav ? "rgba(8,8,8,.94)" : "transparent",
        backdropFilter: nav ? "blur(18px)" : "none",
        borderBottom: nav ? "1px solid rgba(255,255,255,.06)" : "none",
        transition: "background .3s, border-color .3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: LIME, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={14} color={BLACK} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.025em" }}>Calu Agência</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[["Serviços","#servicos"],["Soluções IA","#solucoes"],["Time","#time"],["Contato","#contato"]].map(([l,h]) => (
            <a key={l} href={h} className="cl-link" style={{ fontSize: 13, color: DIM, fontWeight: 500 }}>{l}</a>
          ))}
          <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="cl-pill"
            style={{ fontSize: 13, fontWeight: 700, color: BLACK, background: LIME, padding: "7px 18px", borderRadius: 100 }}>
            Falar agora
          </a>
        </div>
      </nav>

      {/* ════════ HERO ═══════════════════════════════════ */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "110px 52px 72px", position: "relative", overflow: "hidden" }}>

        {/* Background large text */}
        <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-52%)", fontSize: "clamp(120px, 22vw, 320px)", fontWeight: 800, letterSpacing: "-0.06em", color: "rgba(185,255,75,.04)", whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none", lineHeight: 1 }}>
          CALU
        </div>

        {/* Glow */}
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(185,255,75,.08) 0%, transparent 65%)", filter: "blur(40px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1160, margin: "0 auto", width: "100%", position: "relative" }}>

          {/* Eyebrow */}
          <div className="cl-a1" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <div style={{ height: 1, width: 40, background: LIME }} />
            <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Publicidade · Tecnologia · IA
            </span>
          </div>

          {/* Headline */}
          <h1 className="cl-a2" style={{ fontSize: "clamp(52px, 8vw, 108px)", fontWeight: 800, lineHeight: .97, letterSpacing: "-0.045em", maxWidth: 900, marginBottom: 32 }}>
            Criatividade<br />
            que vende.<br />
            <span style={{ color: LIME }}>IA que escala.</span>
          </h1>

          {/* Sub + CTA row */}
          <div className="cl-a3" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, flexWrap: "wrap" }}>
            <p style={{ fontSize: 17, color: DIM, lineHeight: 1.65, maxWidth: 480, fontWeight: 400 }}>
              A Calu Agência une estratégia criativa de alta performance com tecnologia de IA proprietária — para sua marca crescer sem limite de equipe ou orçamento.
            </p>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="cl-pill"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: LIME, color: BLACK, fontWeight: 700, fontSize: 14, padding: "13px 26px", borderRadius: 100, boxShadow: "0 0 32px rgba(185,255,75,.18)" }}>
                <MessageCircle size={15} /> Fale conosco
              </a>
              <a href="#solucoes" className="cl-pill"
                style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid rgba(255,255,255,.12)", color: DIM, fontSize: 14, fontWeight: 500, padding: "13px 22px", borderRadius: 100 }}>
                Ver soluções <ArrowRight size={14} />
              </a>
            </div>
          </div>

          {/* Stats strip */}
          <div className="cl-a4" style={{ display: "flex", gap: 0, marginTop: 64, paddingTop: 36, borderTop: "1px solid rgba(255,255,255,.06)" }}>
            {[
              { n: "14",     l: "clientes ativos" },
              { n: "3.8×",   l: "ROAS médio" },
              { n: "10",     l: "especialistas IA" },
              { n: "R$ 2.4M", l: "em vendas geradas" },
            ].map((s, i) => (
              <div key={s.n} style={{ flex: 1, paddingRight: 32, borderRight: i < 3 ? "1px solid rgba(255,255,255,.06)" : "none", paddingLeft: i > 0 ? 32 : 0 }}>
                <div style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 800, color: OFF, letterSpacing: "-0.05em", lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: MUTED, marginTop: 7 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Scroll */}
          <div className="cl-a5 cl-bob" style={{ position: "absolute", bottom: -48, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,.18))" }} />
            <span style={{ fontFamily: mono, fontSize: 9, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase", writingMode: "vertical-rl" }}>scroll</span>
          </div>
        </div>
      </section>

      {/* ════════ TICKER ═════════════════════════════════ */}
      <div style={{ background: LIME, overflow: "hidden", padding: "14px 0", borderTop: `2px solid ${LIME}`, borderBottom: `2px solid ${LIME}` }}>
        <div style={{ display: "flex", width: "max-content", animation: "cl-tick 22s linear infinite" }}>
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, color: BLACK, whiteSpace: "nowrap", padding: "0 28px" }}>
              {t}<span style={{ opacity: .3, marginLeft: 28 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ════════ MANIFESTO ══════════════════════════════ */}
      <section style={{ padding: "120px 52px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "200px 1fr", gap: 80, alignItems: "start" }}>
          <div>
            <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Manifesto</span>
            <div style={{ width: 32, height: 2, background: LIME, marginTop: 16 }} />
          </div>
          <div>
            <p style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 600, color: OFF, lineHeight: 1.4, letterSpacing: "-0.025em", marginBottom: 28 }}>
              "Acreditamos que marketing de verdade não é sobre aparecer —{" "}
              <span style={{ color: LIME }}>é sobre convencer.</span>"
            </p>
            <p style={{ fontSize: 16, color: DIM, lineHeight: 1.75, maxWidth: 600 }}>
              Por isso unimos profissionais criativos com tecnologia de IA proprietária. Cada post, cada anúncio, cada automação é construída com intenção — para que o crescimento do seu negócio seja real, mensurável e consistente.
            </p>
          </div>
        </div>
      </section>

      {/* ════════ SERVICES ═══════════════════════════════ */}
      <section id="servicos" style={{ padding: "100px 52px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 56 }}>
            <div>
              <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Serviços</span>
              <h2 style={{ fontSize: "clamp(32px, 4vw, 58px)", fontWeight: 800, color: OFF, lineHeight: 1.06, letterSpacing: "-0.04em", marginTop: 10 }}>
                O que fazemos<br />por você.
              </h2>
            </div>
            <a href="#contato" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: DIM }} className="cl-link">
              Ver todos os serviços <ArrowUpRight size={13} />
            </a>
          </div>

          {SERVICES.map((s, i) => (
            <div key={s.n} className="cl-scard" style={{
              display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: 32, alignItems: "center",
              padding: "26px 0", borderBottom: "1px solid rgba(255,255,255,.06)",
              background: "transparent", borderRadius: 8, paddingLeft: 16, paddingRight: 16, margin: "0 -16px",
              cursor: "default",
            }}>
              <span style={{ fontFamily: mono, fontSize: 12, color: LIME, letterSpacing: "0.04em" }}>{s.n}</span>
              <span style={{ fontSize: "clamp(16px, 2vw, 21px)", fontWeight: 700, color: OFF, letterSpacing: "-0.025em" }}>{s.name}</span>
              <span style={{ fontSize: 14, color: DIM, lineHeight: 1.6 }}>{s.copy}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ AI PRODUCTS ════════════════════════════ */}
      <section id="solucoes" style={{ padding: "100px 52px", background: "#0C0C0C", borderTop: "1px solid rgba(255,255,255,.05)", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 80, marginBottom: 64, alignItems: "start" }}>
            <div>
              <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Soluções IA</span>
              <div style={{ width: 32, height: 2, background: LIME, marginTop: 16 }} />
            </div>
            <div>
              <h2 style={{ fontSize: "clamp(32px, 4vw, 58px)", fontWeight: 800, color: OFF, lineHeight: 1.06, letterSpacing: "-0.04em" }}>
                Tecnologia que<br />trabalha por você.
              </h2>
              <p style={{ fontSize: 15, color: DIM, lineHeight: 1.65, marginTop: 16, maxWidth: 520 }}>
                Produtos proprietários desenvolvidos pela Calu para amplificar os resultados de cada cliente — do CRM ao RH.
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {PRODUCTS.map(p => (
              <div key={p.name} className="cl-prod" style={{
                borderRadius: 20,
                background: "rgba(255,255,255,.03)",
                border: `1px solid ${p.color}20`,
                padding: "36px 30px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Top accent line */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: p.color, borderRadius: "20px 20px 0 0" }} />

                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                  <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, color: p.color, background: `${p.color}15`, border: `1px solid ${p.color}30`, padding: "4px 12px", borderRadius: 100, letterSpacing: "0.1em", textTransform: "uppercase" }}>{p.tag}</span>
                </div>

                <h3 style={{ fontSize: 30, fontWeight: 800, color: OFF, letterSpacing: "-0.04em", lineHeight: 1 }}>{p.name}</h3>
                <div style={{ fontFamily: mono, fontSize: 11, color: p.color, marginTop: 5, marginBottom: 18 }}>{p.headline}</div>

                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.7, marginBottom: 24 }}>{p.desc}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                  {p.items.map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "rgba(239,239,235,.5)", fontWeight: 500 }}>{item}</span>
                    </div>
                  ))}
                </div>

                <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="cl-pill"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: p.color, background: `${p.color}10`, border: `1px solid ${p.color}28`, padding: "9px 18px", borderRadius: 100 }}>
                  Saber mais <ArrowUpRight size={13} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ TEAM ═══════════════════════════════════ */}
      <section id="time" style={{ padding: "100px 52px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 80, marginBottom: 56, alignItems: "start" }}>
            <div>
              <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Time</span>
              <div style={{ width: 32, height: 2, background: LIME, marginTop: 16 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <h2 style={{ fontSize: "clamp(32px, 4vw, 58px)", fontWeight: 800, color: OFF, lineHeight: 1.06, letterSpacing: "-0.04em" }}>
                10 especialistas.<br />1 investimento.
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 100, border: "1px solid rgba(185,255,75,.2)", background: "rgba(185,255,75,.05)" }}>
                <div className="cl-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: LIME }} />
                <span style={{ fontFamily: mono, fontSize: 11, color: LIME }}>Online agora</span>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 }}>
            {TEAM.map(t => (
              <div key={t.i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "20px 8px", borderRadius: 14, border: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)", textAlign: "center" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${t.color}1A`, border: `1px solid ${t.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: t.color }}>{t.i}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: OFF, letterSpacing: "-0.02em" }}>{t.name}</div>
                  <div style={{ fontFamily: mono, fontSize: 9, color: MUTED, marginTop: 3 }}>{t.role}</div>
                </div>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: LIME }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ NUMBERS ════════════════════════════════ */}
      <section id="resultados" style={{ padding: "80px 52px", background: LIME }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
            {[
              { n: "14",      l: "Clientes ativos" },
              { n: "3.8×",   l: "ROAS médio" },
              { n: "94",     l: "Posts/mês por cliente" },
              { n: "R$ 2.4M", l: "Em vendas geradas" },
            ].map((s, i) => (
              <div key={s.n} style={{ padding: "20px 0", paddingRight: i < 3 ? 40 : 0, paddingLeft: i > 0 ? 40 : 0, borderRight: i < 3 ? "1px solid rgba(8,8,8,.18)" : "none" }}>
                <div style={{ fontFamily: syne, fontSize: "clamp(36px, 4vw, 60px)", fontWeight: 800, color: BLACK, letterSpacing: "-0.05em", lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: mono, fontSize: 12, color: "rgba(8,8,8,.55)", marginTop: 8 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ SAVINGS ════════════════════════════════ */}
      <section style={{ padding: "100px 52px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Por que faz sentido</span>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 800, color: OFF, lineHeight: 1.08, letterSpacing: "-0.04em", marginTop: 12, marginBottom: 18 }}>
              Economize mais de<br /><span style={{ color: LIME }}>R$ {fmt(39500)}/mês</span><br />em salários.
            </h2>
            <p style={{ fontSize: 15, color: DIM, lineHeight: 1.7, marginBottom: 28 }}>
              Uma equipe completa de marketing custa entre <strong style={{ color: OFF }}>R$ 39.500</strong> e <strong style={{ color: OFF }}>R$ 79.500</strong>/mês em salários — sem contar encargos, ferramentas e gestão. Com a Calu, você tem tudo isso por uma fração desse valor.
            </p>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="cl-pill"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: LIME, color: BLACK, fontWeight: 700, fontSize: 14, padding: "11px 22px", borderRadius: 100 }}>
              Quero saber o valor <ArrowUpRight size={14} />
            </a>
          </div>

          <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
            <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: mono, fontSize: 10, color: MUTED }}>PROFISSIONAL</span>
              <span style={{ fontFamily: mono, fontSize: 10, color: MUTED }}>SALÁRIO / MÊS</span>
            </div>
            {[
              { r: "Gerente de Marketing Sênior",   v: "R$ 8.000–14.000" },
              { r: "Copywriter / Redator",           v: "R$ 5.000–8.000"  },
              { r: "Designer Gráfico",               v: "R$ 5.000–9.000"  },
              { r: "Especialista em Tráfego Pago",   v: "R$ 5.000–9.000"  },
              { r: "Social Media",                   v: "R$ 3.500–5.500"  },
              { r: "Analista de Marketing",          v: "R$ 4.500–7.000"  },
              { r: "SDR / Pré-vendedor",             v: "R$ 3.500–6.000"  },
              { r: "Web Designer / Dev WordPress",   v: "R$ 4.000–6.500"  },
              { r: "Revisora de Conteúdo",           v: "R$ 2.500–4.000"  },
            ].map((row, i, arr) => (
              <div key={i} style={{ padding: "11px 20px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: LIME, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "rgba(239,239,235,.5)", fontWeight: 500 }}>{row.r}</span>
                </div>
                <span style={{ fontFamily: mono, fontSize: 11, color: "rgba(239,239,235,.28)" }}>{row.v}</span>
              </div>
            ))}
            <div style={{ padding: "14px 20px", background: `${LIME}10`, borderTop: `1px solid ${LIME}20`, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: LIME }}>Total estimado</span>
              <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: LIME }}>R$ 39.500+/mês</span>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ CTA ════════════════════════════════════ */}
      <section id="contato" style={{ padding: "80px 52px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 80, alignItems: "center" }}>
            <div>
              <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Contato</span>
              <div style={{ width: 32, height: 2, background: LIME, marginTop: 16 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32, padding: "56px 52px", background: LIME, borderRadius: 20 }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: 10, color: "rgba(8,8,8,.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Pronto para crescer?</div>
                <h2 style={{ fontFamily: syne, fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 800, color: BLACK, lineHeight: 1.1, letterSpacing: "-0.04em" }}>
                  Seu time de marketing<br />começa hoje.
                </h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="cl-pill"
                  style={{ display: "inline-flex", alignItems: "center", gap: 9, background: BLACK, color: LIME, fontWeight: 700, fontSize: 14, padding: "13px 26px", borderRadius: 100, whiteSpace: "nowrap" }}>
                  <MessageCircle size={15} /> WhatsApp
                </a>
                <a href="mailto:carolinielucas.cl@gmail.com" className="cl-pill"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(8,8,8,.1)", color: BLACK, fontWeight: 600, fontSize: 13, padding: "11px 26px", borderRadius: 100 }}>
                  E-mail
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ═════════════════════════════════ */}
      <footer style={{ padding: "32px 52px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: LIME, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={12} color={BLACK} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "-0.02em" }}>Calu Agência</div>
              <div style={{ fontFamily: mono, fontSize: 9, color: MUTED }}>Publicidade · Tecnologia · IA · São Paulo</div>
            </div>
          </div>
          <div style={{ fontFamily: mono, fontSize: 9, color: "rgba(239,239,235,.18)" }}>
            © {new Date().getFullYear()} Calu Agência · Todos os direitos reservados
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[Instagram, Linkedin, MessageCircle].map((Icon, i) => (
              <a key={i} href="#" className="cl-social"
                style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={13} color={DIM} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

const MUTED = "#555";
