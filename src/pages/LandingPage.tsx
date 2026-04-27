import { useState, useEffect } from "react";
import {
  ArrowUpRight, Zap, ChevronDown,
  Instagram, Linkedin, MessageCircle, ArrowRight, Check,
} from "lucide-react";

const LIME  = "#B9FF4B";
const BLACK = "#080808";
const OFF   = "#F0EFE8";
const MUTED = "#666";

const SERVICES = [
  { n: "01", title: "Estratégia de Marca",     desc: "Posicionamento, pauta editorial e direção criativa alinhados ao seu negócio e público." },
  { n: "02", title: "Criação de Conteúdo",     desc: "Posts, reels, stories, artigos e anúncios escritos e desenhados com foco em conversão real." },
  { n: "03", title: "Tráfego Pago",            desc: "Campanhas no Meta e Google Ads gerenciadas para CPA baixo e ROAS alto." },
  { n: "04", title: "Gestão de Redes Sociais", desc: "Publicação diária, atendimento e monitoramento de todas as suas plataformas." },
  { n: "05", title: "SEO & Blog",              desc: "Conteúdo otimizado que atrai clientes orgânicos e posiciona sua marca como autoridade." },
  { n: "06", title: "CRM & Automação",         desc: "Qualificação de leads via WhatsApp e nutrição automatizada para fechar mais negócios." },
];

const TEAM = [
  { i: "A", name: "ARIA",     role: "Orquestradora",  color: LIME      },
  { i: "C", name: "Carolina", role: "Estrategista",   color: "#FBBF24" },
  { i: "B", name: "Beatriz",  role: "Copywriter",     color: "#A78BFA" },
  { i: "I", name: "Isadora",  role: "Designer",       color: "#D946EF" },
  { i: "R", name: "Rafaela",  role: "Tráfego Pago",  color: "#F97316" },
  { i: "M", name: "Marina",   role: "Social Media",  color: "#60A5FA" },
  { i: "L", name: "Lucas",    role: "Analytics",     color: "#34D399" },
  { i: "E", name: "Eduardo",  role: "Vendas & CRM",  color: "#F59E0B" },
  { i: "T", name: "Teo",      role: "Web & SEO",     color: "#06B6D4" },
  { i: "V", name: "Vitória",  role: "Revisão",       color: "#EC4899" },
];

const SAVINGS = [
  { role: "Gerente de Marketing Sênior",   min: 8000, max: 14000 },
  { role: "Copywriter / Redator Sênior",   min: 5000, max: 8000  },
  { role: "Designer Gráfico Sênior",       min: 5000, max: 9000  },
  { role: "Especialista em Tráfego Pago",  min: 5000, max: 9000  },
  { role: "Social Media Pleno/Sênior",     min: 3500, max: 5500  },
  { role: "Analista de Marketing Digital", min: 4500, max: 7000  },
  { role: "SDR / Pré-vendedor",            min: 3500, max: 6000  },
  { role: "Web Designer / Dev WordPress",  min: 4000, max: 6500  },
  { role: "Revisora de Conteúdo",          min: 2500, max: 4000  },
];
const MARKET_MIN = SAVINGS.reduce((acc, r) => acc + r.min, 0);

const TICKER_ITEMS = [
  "14 clientes ativos", "ROAS médio 3.8×", "94 posts/mês por cliente",
  "R$ 2.4M em vendas geradas", "CPA até 60% menor", "10 especialistas de IA",
  "São Paulo · Brasil", "98% de satisfação", "Marketing 24h por dia",
];

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

const styles = `
  .calu * { box-sizing: border-box; margin: 0; padding: 0; }
  .calu a { text-decoration: none; }
  .calu-fade { animation: caluFade 0.7s ease forwards; }
  @keyframes caluFade {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes caluTicker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes caluBob {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(6px); }
  }
  @keyframes caluPulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(185,255,75,0.4); }
    50%       { opacity: 0.7; box-shadow: 0 0 0 5px rgba(185,255,75,0); }
  }
  .calu-d1 { animation-delay: 0.05s; opacity: 0; }
  .calu-d2 { animation-delay: 0.15s; opacity: 0; }
  .calu-d3 { animation-delay: 0.25s; opacity: 0; }
  .calu-d4 { animation-delay: 0.40s; opacity: 0; }
  .calu-d5 { animation-delay: 0.55s; opacity: 0; }
  .calu-d6 { animation-delay: 0.75s; opacity: 0; }
  .calu-btn-main:hover { opacity: 0.88; transform: translateY(-1px); }
  .calu-btn-main { transition: opacity 0.18s, transform 0.18s; }
  .calu-card:hover { background: rgba(185,255,75,0.05) !important; }
  .calu-card { transition: background 0.2s; }
  .calu-team-card:hover { border-color: var(--tc) !important; background: var(--tb) !important; }
  .calu-team-card { transition: border-color 0.2s, background 0.2s; }
  .calu-nav-link:hover { color: #F0EFE8 !important; }
  .calu-nav-link { transition: color 0.18s; }
  .calu-social:hover { border-color: #B9FF4B !important; background: rgba(185,255,75,0.08) !important; }
  .calu-social { transition: border-color 0.18s, background 0.18s; }
  .calu-dot { animation: caluPulse 2s ease-in-out infinite; }
`;

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const S: React.CSSProperties = {
    fontFamily: "'Syne', 'Inter', sans-serif",
    background: BLACK,
    color: OFF,
    minHeight: "100vh",
  };

  return (
    <div className="calu" style={S}>
      <style>{styles}</style>

      {/* ── NAV ───────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 58, padding: "0 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(8,8,8,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "background 0.3s, border-color 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: LIME, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={15} color={BLACK} strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: OFF, letterSpacing: "-0.02em" }}>Calu Agência</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {[["Serviços", "#servicos"], ["Time", "#time"], ["Resultados", "#resultados"], ["Contato", "#contato"]].map(([label, href]) => (
            <a key={label} href={href} className="calu-nav-link" style={{ fontSize: 13, color: "rgba(240,239,232,0.4)", fontWeight: 500 }}>{label}</a>
          ))}
          <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="calu-btn-main"
            style={{ fontSize: 13, fontWeight: 700, color: BLACK, background: LIME, padding: "8px 18px", borderRadius: 100 }}>
            Começar agora
          </a>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 64px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "25%", right: "8%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(185,255,75,0.07) 0%, transparent 65%)", filter: "blur(32px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 240px", gap: 48, alignItems: "center" }}>
          <div>
            <div className="calu-fade calu-d1" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
              <div className="calu-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: LIME }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Publicidade · Tecnologia · IA</span>
            </div>

            <div className="calu-fade calu-d2" style={{ fontSize: "clamp(48px, 7vw, 90px)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.04em", marginBottom: 0 }}>
              Criatividade<br />
              <span>que vende.</span><br />
              <span style={{ color: LIME }}>IA que escala.</span>
            </div>

            <p className="calu-fade calu-d3" style={{ fontSize: 16, color: "rgba(240,239,232,0.4)", lineHeight: 1.65, marginTop: 24, maxWidth: 500 }}>
              A Calu Agência une estratégia criativa de alta performance com tecnologia de IA proprietária — para que sua marca cresça sem limite de equipe.
            </p>

            <div className="calu-fade calu-d4" style={{ display: "flex", gap: 12, marginTop: 36, alignItems: "center" }}>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="calu-btn-main"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: LIME, color: BLACK, fontWeight: 700, fontSize: 14, padding: "13px 26px", borderRadius: 100, boxShadow: "0 0 28px rgba(185,255,75,0.2)" }}>
                <MessageCircle size={15} /> Fale conosco
              </a>
              <a href="#servicos" className="calu-btn-main"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(240,239,232,0.38)", fontSize: 14, fontWeight: 500 }}>
                Ver serviços <ArrowRight size={14} />
              </a>
            </div>

            <div className="calu-fade calu-d5" style={{ display: "flex", gap: 36, marginTop: 52, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {[{ n: "14", l: "clientes ativos" }, { n: "3.8×", l: "ROAS médio" }, { n: "R$ 2.4M", l: "em vendas geradas" }].map(s => (
                <div key={s.n}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: OFF, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: MUTED, marginTop: 5 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent card */}
          <div className="calu-fade calu-d3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "20px", alignSelf: "center" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: LIME, marginBottom: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>Time ativo agora</div>
            {TEAM.slice(0, 5).map(t => (
              <div key={t.i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${t.color}20`, border: `1px solid ${t.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: t.color, flexShrink: 0 }}>{t.i}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: OFF, lineHeight: 1 }}>{t.name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: MUTED, marginTop: 2 }}>{t.role}</div>
                </div>
                <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: LIME, flexShrink: 0 }} />
              </div>
            ))}
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: MUTED, marginTop: 2 }}>+ 5 especialistas</div>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>scroll</span>
          <ChevronDown size={14} color={MUTED} style={{ animation: "caluBob 1.6s ease-in-out infinite" }} />
        </div>
      </section>

      {/* ── TICKER ────────────────────────────── */}
      <div style={{ background: LIME, overflow: "hidden", padding: "13px 0" }}>
        <div style={{ display: "flex", width: "max-content", animation: "caluTicker 28s linear infinite" }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: BLACK, whiteSpace: "nowrap", padding: "0 28px" }}>
              {t} <span style={{ opacity: 0.3 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── SERVICES ──────────────────────────── */}
      <section id="servicos" style={{ padding: "100px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 60 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>O que fazemos</span>
            <h2 style={{ fontSize: "clamp(30px, 4.5vw, 56px)", fontWeight: 800, color: OFF, lineHeight: 1.06, letterSpacing: "-0.04em", marginTop: 10 }}>
              Tudo que sua marca<br />precisa, em um lugar.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}>
            {SERVICES.map((s, i) => (
              <div key={s.n} className="calu-card"
                style={{
                  padding: "34px 28px", background: BLACK,
                  borderRight: i % 3 !== 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
                }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, marginBottom: 16, letterSpacing: "0.06em" }}>{s.n}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: OFF, lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(240,239,232,0.37)", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SOLUTIONS ──────────────────────── */}
      <section style={{ padding: "100px 64px", background: "#0D0D0D", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 64 }}>
            <div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Soluções com IA</span>
              <h2 style={{ fontSize: "clamp(30px, 4.5vw, 56px)", fontWeight: 800, color: OFF, lineHeight: 1.06, letterSpacing: "-0.04em", marginTop: 10 }}>
                Tecnologia que<br />trabalha por você.
              </h2>
            </div>
            <p style={{ fontSize: 15, color: "rgba(240,239,232,0.33)", maxWidth: 280, lineHeight: 1.65, textAlign: "right" as const }}>
              Produtos proprietários que amplificam os resultados de cada cliente.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              {
                tag: "CRM",
                name: "OmniCRM",
                sub: "Omnichannel",
                color: LIME,
                desc: "Central de comunicação que une WhatsApp, Instagram, e-mail e mais em um único lugar. Nunca perca um lead por falta de acompanhamento.",
                features: ["Inbox unificado", "Pipeline de vendas", "Automações", "Relatórios em tempo real"],
              },
              {
                tag: "IA",
                name: "Posture.AI",
                sub: "Análise de Posicionamento",
                color: "#A78BFA",
                desc: "Analisa a presença digital da sua marca e aponta exatamente onde e como melhorar o posicionamento para atrair mais clientes qualificados.",
                features: ["Diagnóstico de marca", "Análise de concorrência", "Plano de ação IA", "Score de autoridade"],
              },
              {
                tag: "RH",
                name: "RH Inteligente",
                sub: "Gestão de Pessoas com IA",
                color: "#34D399",
                desc: "Automatiza triagem de currículos, onboarding e avaliações. Seu RH foca no que importa — as pessoas — enquanto a IA cuida do operacional.",
                features: ["Triagem automática", "Onboarding digital", "Avaliações de desempenho", "People analytics"],
              },
            ].map((prod) => (
              <div key={prod.name} style={{
                borderRadius: 18,
                border: `1px solid ${prod.color}25`,
                background: `linear-gradient(135deg, ${prod.color}06 0%, transparent 60%)`,
                padding: "32px 28px",
                position: "relative" as const,
                overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${prod.color} 0%, transparent 70%)` }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: prod.color, background: `${prod.color}15`, border: `1px solid ${prod.color}30`, padding: "3px 10px", borderRadius: 100, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{prod.tag}</span>
                </div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: OFF, letterSpacing: "-0.03em", lineHeight: 1 }}>{prod.name}</h3>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: prod.color, marginTop: 4, marginBottom: 16 }}>{prod.sub}</div>
                <p style={{ fontSize: 14, color: "rgba(240,239,232,0.4)", lineHeight: 1.65, marginBottom: 24 }}>{prod.desc}</p>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  {prod.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: prod.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "rgba(240,239,232,0.5)", fontWeight: 500 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="calu-btn-main"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 28, fontSize: 13, fontWeight: 700, color: prod.color, background: `${prod.color}12`, border: `1px solid ${prod.color}30`, padding: "9px 18px", borderRadius: 100 }}>
                  Saber mais <ArrowUpRight size={13} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ──────────────────────────────── */}
      <section id="time" style={{ padding: "100px 64px", background: "rgba(255,255,255,0.018)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 56 }}>
            <div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Nosso time</span>
              <h2 style={{ fontSize: "clamp(30px, 4.5vw, 56px)", fontWeight: 800, color: OFF, lineHeight: 1.06, letterSpacing: "-0.04em", marginTop: 10 }}>
                10 especialistas.<br />1 investimento.
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 100, border: "1px solid rgba(185,255,75,0.2)", background: "rgba(185,255,75,0.06)" }}>
              <div className="calu-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: LIME }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME }}>Todos online agora</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            {TEAM.map(t => (
              <div key={t.i} className="calu-team-card"
                style={{ "--tc": `${t.color}45`, "--tb": `${t.color}08` } as React.CSSProperties & Record<string, string>}
              >
                <div style={{ padding: "20px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${t.color}20`, border: `1px solid ${t.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: t.color, marginBottom: 12 }}>{t.i}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: OFF, letterSpacing: "-0.02em", marginBottom: 3 }}>{t.name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: MUTED, marginBottom: 12 }}>{t.role}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: LIME }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: LIME }}>trabalhando</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ───────────────────────────── */}
      <section style={{ padding: "100px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 60 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Como funciona</span>
            <h2 style={{ fontSize: "clamp(30px, 4.5vw, 56px)", fontWeight: 800, color: OFF, lineHeight: 1.06, letterSpacing: "-0.04em", marginTop: 10 }}>
              Do briefing<br />aos resultados.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28 }}>
            {[
              { n: "01", t: "Briefing",   d: "Uma conversa sobre seu negócio, público, metas e tom de voz." },
              { n: "02", t: "Estratégia", d: "Em até 48h, plano editorial, campanhas e calendário prontos." },
              { n: "03", t: "Execução",   d: "O time entra em ação: conteúdo, design, ads e automações em paralelo." },
              { n: "04", t: "Resultados", d: "Relatórios semanais com métricas reais e ajustes contínuos." },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ width: 52, height: 52, borderRadius: 13, background: i === 0 ? LIME : "rgba(185,255,75,0.1)", border: `1px solid ${i === 0 ? "transparent" : "rgba(185,255,75,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: i === 0 ? BLACK : LIME }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: OFF, letterSpacing: "-0.03em", marginBottom: 10 }}>{s.t}</h3>
                <p style={{ fontSize: 14, color: "rgba(240,239,232,0.35)", lineHeight: 1.65 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAVINGS ───────────────────────────── */}
      <section style={{ padding: "100px 64px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
          <div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Por que faz sentido</span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 50px)", fontWeight: 800, color: OFF, lineHeight: 1.1, letterSpacing: "-0.04em", marginTop: 10, marginBottom: 16 }}>
              Você economiza<br /><span style={{ color: LIME }}>R$ {fmt(MARKET_MIN)}+</span><br />por mês.
            </h2>
            <p style={{ fontSize: 15, color: "rgba(240,239,232,0.37)", lineHeight: 1.65, marginBottom: 28 }}>
              Ter esses especialistas contratados individualmente custaria entre{" "}
              <strong style={{ color: "rgba(240,239,232,0.62)" }}>R$ {fmt(MARKET_MIN)}</strong> e{" "}
              <strong style={{ color: "rgba(240,239,232,0.62)" }}>R$ {fmt(MARKET_MIN + 40000)}</strong>/mês — só em salários, sem encargos.
            </p>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="calu-btn-main"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: LIME, color: BLACK, fontWeight: 700, fontSize: 14, padding: "11px 22px", borderRadius: 100 }}>
              Quero economizar <ArrowUpRight size={14} />
            </a>
          </div>
          <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: MUTED }}>PROFISSIONAL</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: MUTED }}>SALÁRIO / MÊS</span>
            </div>
            {SAVINGS.map((s, i) => (
              <div key={i} className="calu-card" style={{ padding: "11px 18px", borderBottom: i < SAVINGS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center", background: BLACK }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Check size={11} color={LIME} strokeWidth={2.5} />
                  <span style={{ fontSize: 13, color: "rgba(240,239,232,0.52)", fontWeight: 500 }}>{s.role}</span>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(240,239,232,0.28)" }}>R$ {fmt(s.min)}–{fmt(s.max)}</span>
              </div>
            ))}
            <div style={{ padding: "13px 18px", background: `${LIME}10`, borderTop: `1px solid ${LIME}20`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: LIME }}>Total estimado</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: LIME }}>R$ {fmt(MARKET_MIN)}+/mês</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESULTS ───────────────────────────── */}
      <section id="resultados" style={{ padding: "100px 64px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Resultados</span>
            <h2 style={{ fontSize: "clamp(30px, 4.5vw, 56px)", fontWeight: 800, color: OFF, lineHeight: 1.06, letterSpacing: "-0.04em", marginTop: 10 }}>
              Números que importam.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, overflow: "hidden" }}>
            {[
              { n: "14",    l: "Clientes ativos",  s: "e crescendo" },
              { n: "3.8×",  l: "ROAS médio",       s: "campanhas pagas" },
              { n: "94",    l: "Posts por mês",    s: "por cliente" },
              { n: "30",    l: "Dias",             s: "para ver resultados" },
            ].map((st, i) => (
              <div key={i} style={{ padding: "44px 28px", background: BLACK, borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none", textAlign: "center" }}>
                <div style={{ fontSize: "clamp(40px, 4vw, 64px)", fontWeight: 800, color: LIME, letterSpacing: "-0.05em", lineHeight: 1 }}>{st.n}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: OFF, marginTop: 10, letterSpacing: "-0.02em" }}>{st.l}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: MUTED, marginTop: 5 }}>{st.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────── */}
      <section id="contato" style={{ padding: "72px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", background: LIME, borderRadius: 22, padding: "64px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 36 }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(0,0,0,0.38)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Pronto para escalar?</div>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 48px)", fontWeight: 800, color: BLACK, lineHeight: 1.08, letterSpacing: "-0.04em" }}>
              Seu time de marketing<br />completo, a partir de hoje.
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer" className="calu-btn-main"
              style={{ display: "inline-flex", alignItems: "center", gap: 9, background: BLACK, color: LIME, fontWeight: 700, fontSize: 14, padding: "13px 26px", borderRadius: 100, whiteSpace: "nowrap" }}>
              <MessageCircle size={16} /> Falar no WhatsApp
            </a>
            <a href="mailto:carolinielucas.cl@gmail.com" className="calu-btn-main"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(0,0,0,0.1)", color: BLACK, fontWeight: 600, fontSize: 13, padding: "11px 26px", borderRadius: 100 }}>
              Enviar e-mail
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────── */}
      <footer style={{ padding: "32px 64px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: LIME, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={13} color={BLACK} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: OFF, letterSpacing: "-0.02em" }}>Calu Agência</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: MUTED }}>Marketing digital · São Paulo</div>
            </div>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(240,239,232,0.18)" }}>
            © {new Date().getFullYear()} Calu Agência · Todos os direitos reservados
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[Instagram, Linkedin, MessageCircle].map((Icon, i) => (
              <a key={i} href="#" className="calu-social"
                style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={13} color="rgba(240,239,232,0.38)" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
