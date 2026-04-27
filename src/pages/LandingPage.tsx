import { useState, useEffect, useRef, type ReactNode } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight, Zap, ChevronDown, Instagram, Linkedin,
  MessageCircle, ArrowRight, Check,
} from "lucide-react";

const LIME  = "#B9FF4B";
const BLACK = "#080808";
const OFF   = "#F0EFE8";
const MUTED = "#666";

const SERVICES = [
  { n: "01", title: "Estratégia\nde Marca",      desc: "Posicionamento, pauta editorial e direção criativa alinhados ao seu negócio e público." },
  { n: "02", title: "Criação de\nConteúdo",      desc: "Posts, reels, stories, artigos e anúncios escritos e desenhados com foco em conversão real." },
  { n: "03", title: "Tráfego\nPago",             desc: "Campanhas no Meta e Google Ads gerenciadas para CPA baixo e ROAS consistentemente alto." },
  { n: "04", title: "Gestão de\nRedes Sociais",  desc: "Publicação diária, atendimento e monitoramento de todas as suas plataformas, sem esforço seu." },
  { n: "05", title: "SEO &\nBlog",               desc: "Conteúdo otimizado que atrai clientes orgânicos e posiciona sua marca como autoridade." },
  { n: "06", title: "CRM &\nAutomação",          desc: "Qualificação de leads via WhatsApp e nutrição automatizada para fechar mais negócios." },
];

const TEAM = [
  { i: "A", name: "ARIA",     role: "Orquestradora",   color: LIME,      desc: "Coordena todo o time em tempo real, garantindo prazos e qualidade." },
  { i: "C", name: "Carolina", role: "Estrategista",    color: "#FBBF24", desc: "Define seu posicionamento e pauta editorial mês a mês." },
  { i: "B", name: "Beatriz",  role: "Copywriter",      color: "#A78BFA", desc: "Escreve cada texto, legenda e anúncio para converter e engajar." },
  { i: "I", name: "Isadora",  role: "Designer",        color: "#D946EF", desc: "Cria todos os visuais alinhados ao manual de marca da sua empresa." },
  { i: "R", name: "Rafaela",  role: "Tráfego Pago",   color: "#F97316", desc: "Gerencia campanhas pagas com foco em performance e escalabilidade." },
  { i: "M", name: "Marina",   role: "Social Media",   color: "#60A5FA", desc: "Agenda, publica e monitora todo o conteúdo orgânico diariamente." },
  { i: "L", name: "Lucas",    role: "Analytics",      color: "#34D399", desc: "Monitora métricas e entrega relatórios com insights toda semana." },
  { i: "E", name: "Eduardo",  role: "Vendas & CRM",   color: "#F59E0B", desc: "Qualifica leads via WhatsApp e alimenta o CRM para fechar negócios." },
  { i: "T", name: "Teo",      role: "Web & SEO",      color: "#06B6D4", desc: "Atualiza seu site, publica no blog e otimiza para buscadores." },
  { i: "V", name: "Vitória",  role: "Revisão",        color: "#EC4899", desc: "Revisa 100% do conteúdo antes de publicar — zero erros." },
];

const SAVINGS = [
  { role: "Gerente de Marketing Sênior",   min: 8000,  max: 14000 },
  { role: "Copywriter / Redator Sênior",   min: 5000,  max: 8000  },
  { role: "Designer Gráfico Sênior",       min: 5000,  max: 9000  },
  { role: "Especialista em Tráfego Pago",  min: 5000,  max: 9000  },
  { role: "Social Media Pleno/Sênior",     min: 3500,  max: 5500  },
  { role: "Analista de Marketing Digital", min: 4500,  max: 7000  },
  { role: "SDR / Pré-vendedor",            min: 3500,  max: 6000  },
  { role: "Web Designer / Dev WordPress",  min: 4000,  max: 6500  },
  { role: "Revisora de Conteúdo",          min: 2500,  max: 4000  },
];
const MARKET_MIN = SAVINGS.reduce((acc, r) => acc + r.min, 0);

const TICKER = [
  "14 clientes ativos", "ROAS médio 3.8×", "94 posts/mês",
  "R$ 2.4M em vendas geradas", "CPA até 60% menor", "10 especialistas de IA",
  "São Paulo · Brasil", "98% satisfação", "Marketing 24h por dia",
];

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function Ticker() {
  const items = [...TICKER, ...TICKER, ...TICKER, ...TICKER];
  return (
    <div style={{ background: LIME, overflow: "hidden", padding: "13px 0" }}>
      <div style={{
        display: "flex",
        width: "max-content",
        animation: "calu-ticker 28s linear infinite",
      }}>
        {items.map((t, i) => (
          <span key={i} style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            fontWeight: 500,
            color: BLACK,
            whiteSpace: "nowrap",
            padding: "0 32px",
          }}>
            {t} <span style={{ opacity: 0.35 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 48px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(8,8,8,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: LIME, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={15} color={BLACK} strokeWidth={2.5} />
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: OFF, letterSpacing: "-0.02em" }}>Calu Agência</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {[["Serviços", "servicos"], ["Time", "time"], ["Resultados", "resultados"], ["Contato", "contato"]].map(([label, id]) => (
          <a key={id} href={`#${id}`} style={{ fontSize: 13, color: "rgba(240,239,232,0.45)", textDecoration: "none", fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.color = OFF)}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,239,232,0.45)")}>
            {label}
          </a>
        ))}
        <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer"
          style={{ fontSize: 13, fontWeight: 700, color: BLACK, background: LIME, padding: "8px 18px", borderRadius: 100, textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          Começar agora
        </a>
      </div>
    </motion.nav>
  );
}

function Hero() {
  const lines = ["Marketing", "que realmente", "converte."];
  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 64px 80px", position: "relative", overflow: "hidden" }}>

      {/* Glow */}
      <div style={{ position: "absolute", top: "30%", right: "10%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, rgba(185,255,75,0.07) 0%, transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "5%",  width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, rgba(185,255,75,0.04) 0%, transparent 70%)`, filter: "blur(40px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "center" }}>
        <div>
          {/* Eyebrow */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: LIME, boxShadow: `0 0 10px ${LIME}` }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
              Marketing digital de alta performance
            </span>
          </motion.div>

          {/* Headline */}
          <div>
            {lines.map((line, i) => (
              <div key={i} style={{ overflow: "hidden" }}>
                <motion.div
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.09 }}
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "clamp(48px, 7vw, 92px)",
                    fontWeight: 800,
                    lineHeight: 1.02,
                    letterSpacing: "-0.04em",
                    color: i === 2 ? LIME : OFF,
                    marginBottom: i < 2 ? 4 : 0,
                  }}>
                  {line}
                </motion.div>
              </div>
            ))}
          </div>

          {/* Sub */}
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.58 }}
            style={{ fontSize: 17, color: "rgba(240,239,232,0.42)", lineHeight: 1.6, marginTop: 24, maxWidth: 500, fontWeight: 400 }}>
            Time completo de especialistas em IA — estrategista, copywriter, designer, gestor de tráfego e mais 6 profissionais — trabalhando pela sua marca todos os dias.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.72 }}
            style={{ display: "flex", gap: 12, marginTop: 36, alignItems: "center" }}>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: LIME, color: BLACK, fontWeight: 700, fontSize: 14, padding: "13px 26px", borderRadius: 100, textDecoration: "none", letterSpacing: "-0.01em", boxShadow: `0 0 32px rgba(185,255,75,0.22)` }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; }}>
              <MessageCircle size={15} /> Fale conosco
            </a>
            <a href="#servicos"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(240,239,232,0.4)", fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "13px 4px" }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = OFF)}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(240,239,232,0.4)")}>
              Ver serviços <ArrowRight size={15} />
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.0 }}
            style={{ display: "flex", gap: 36, marginTop: 52, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { n: "14",     label: "clientes ativos" },
              { n: "3.8×",   label: "ROAS médio" },
              { n: "R$ 2.4M", label: "em vendas geradas" },
            ].map(s => (
              <div key={s.n}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: OFF, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: MUTED, marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — agent card */}
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.35 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "22px 24px", width: 230 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: LIME, marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Time ativo agora</div>
            {TEAM.slice(0, 5).map(t => (
              <div key={t.i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${t.color}20`, border: `1px solid ${t.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: t.color, flexShrink: 0, fontFamily: "'Syne', sans-serif" }}>{t.i}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: OFF, lineHeight: 1 }}>{t.name}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: MUTED, marginTop: 2 }}>{t.role}</div>
                </div>
                <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: LIME, boxShadow: `0 0 6px ${LIME}`, flexShrink: 0 }} />
              </div>
            ))}
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: MUTED, marginTop: 4 }}>+ 5 especialistas</div>
          </div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.5 }}
        style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" as const }}>scroll</span>
        <motion.div animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
          <ChevronDown size={15} color={MUTED} />
        </motion.div>
      </motion.div>
    </section>
  );
}

function ServicesSection() {
  const [hov, setHov] = useState<number | null>(null);
  return (
    <section id="servicos" style={{ padding: "100px 64px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 64 }}>
            <div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>O que fazemos</span>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 4.5vw, 58px)", fontWeight: 800, color: OFF, lineHeight: 1.05, letterSpacing: "-0.04em", marginTop: 10 }}>
                Tudo que sua marca<br />precisa, em um lugar.
              </h2>
            </div>
            <p style={{ fontSize: 15, color: "rgba(240,239,232,0.35)", maxWidth: 260, lineHeight: 1.65, textAlign: "right" as const }}>
              Serviços integrados que trabalham juntos para crescer seu negócio de forma consistente.
            </p>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" }}>
          {SERVICES.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.06}>
              <div
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
                style={{
                  padding: "36px 32px",
                  background: hov === i ? "rgba(185,255,75,0.04)" : BLACK,
                  borderRight: i % 3 !== 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  transition: "background 0.2s",
                }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, marginBottom: 18, letterSpacing: "0.06em" }}>{s.n}</div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: OFF, lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: 14, whiteSpace: "pre-line" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(240,239,232,0.38)", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  const [active, setActive] = useState<number | null>(null);
  return (
    <section id="time" style={{ padding: "100px 64px", background: "rgba(255,255,255,0.018)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 60 }}>
            <div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Nosso time</span>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 4.5vw, 58px)", fontWeight: 800, color: OFF, lineHeight: 1.05, letterSpacing: "-0.04em", marginTop: 10 }}>
                10 especialistas.<br />1 investimento.
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 100, border: `1px solid rgba(185,255,75,0.2)`, background: "rgba(185,255,75,0.06)" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: LIME, boxShadow: `0 0 8px ${LIME}` }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME }}>Todos online agora</span>
            </div>
          </div>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {TEAM.map((t, i) => (
            <Reveal key={t.i} delay={i * 0.04}>
              <div
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                style={{
                  padding: "22px 18px",
                  borderRadius: 14,
                  border: `1px solid ${active === i ? `${t.color}45` : "rgba(255,255,255,0.07)"}`,
                  background: active === i ? `${t.color}08` : "rgba(255,255,255,0.02)",
                  transition: "all 0.2s",
                  cursor: "default",
                  minHeight: 160,
                }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${t.color}20`, border: `1px solid ${t.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: t.color, marginBottom: 14 }}>{t.i}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: OFF, letterSpacing: "-0.02em", marginBottom: 3 }}>{t.name}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: MUTED, marginBottom: 10 }}>{t.role}</div>
                {active === i && (
                  <p style={{ fontSize: 12, color: "rgba(240,239,232,0.38)", lineHeight: 1.55, marginBottom: 10 }}>{t.desc}</p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: "auto" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: LIME, boxShadow: `0 0 6px ${LIME}` }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: LIME }}>trabalhando</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    { n: "01", title: "Briefing",    desc: "Uma conversa rápida sobre seu negócio, público, metas e tom de voz." },
    { n: "02", title: "Estratégia",  desc: "Em até 48h, plano editorial, campanhas e calendário prontos." },
    { n: "03", title: "Execução",    desc: "O time entra em ação: conteúdo, design, ads e automações em paralelo." },
    { n: "04", title: "Resultados",  desc: "Relatórios semanais com métricas reais e ajustes contínuos." },
  ];
  return (
    <section style={{ padding: "100px 64px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ marginBottom: 64 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Como funciona</span>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 4.5vw, 58px)", fontWeight: 800, color: OFF, lineHeight: 1.05, letterSpacing: "-0.04em", marginTop: 10 }}>
              Do briefing<br />aos resultados.
            </h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 0.09}>
              <div>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: i === 0 ? LIME : "rgba(185,255,75,0.1)", border: `1px solid ${i === 0 ? "transparent" : "rgba(185,255,75,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: i === 0 ? BLACK : LIME }}>{s.n}</span>
                </div>
                <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 19, fontWeight: 700, color: OFF, letterSpacing: "-0.03em", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(240,239,232,0.35)", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function SavingsSection() {
  const [hov, setHov] = useState<number | null>(null);
  return (
    <section style={{ padding: "100px 64px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <Reveal>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Por que faz sentido</span>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(30px, 4vw, 52px)", fontWeight: 800, color: OFF, lineHeight: 1.1, letterSpacing: "-0.04em", marginTop: 10, marginBottom: 18 }}>
            Você economiza<br /><span style={{ color: LIME }}>R$ {fmt(MARKET_MIN)}+</span><br />por mês.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(240,239,232,0.38)", lineHeight: 1.65, marginBottom: 28 }}>
            Ter esses especialistas contratados individualmente custaria entre{" "}
            <strong style={{ color: "rgba(240,239,232,0.65)" }}>R$ {fmt(MARKET_MIN)}</strong> e{" "}
            <strong style={{ color: "rgba(240,239,232,0.65)" }}>R$ {fmt(MARKET_MIN + 40000)}</strong> por mês — só em salários, sem contar encargos e ferramentas.
          </p>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, background: LIME, color: BLACK, fontWeight: 700, fontSize: 14, padding: "11px 22px", borderRadius: 100, textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            Quero economizar <ArrowUpRight size={15} />
          </a>
        </Reveal>

        <Reveal delay={0.12}>
          <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.02)" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: MUTED }}>PROFISSIONAL</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: MUTED }}>SALÁRIO DE MERCADO</span>
            </div>
            {SAVINGS.map((s, i) => (
              <div key={i}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
                style={{
                  padding: "12px 20px",
                  borderBottom: i < SAVINGS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: hov === i ? "rgba(185,255,75,0.04)" : "transparent",
                  transition: "background 0.15s",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Check size={12} color={LIME} strokeWidth={2.5} />
                  <span style={{ fontSize: 13, color: "rgba(240,239,232,0.55)", fontWeight: 500 }}>{s.role}</span>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(240,239,232,0.3)" }}>R$ {fmt(s.min)}–{fmt(s.max)}</span>
              </div>
            ))}
            <div style={{ padding: "14px 20px", background: `${LIME}10`, borderTop: `1px solid ${LIME}20`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: LIME }}>Total estimado</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: LIME }}>R$ {fmt(MARKET_MIN)}+/mês</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ResultsSection() {
  const stats = [
    { n: "14",   label: "Clientes ativos",  sub: "e crescendo" },
    { n: "3.8×", label: "ROAS médio",       sub: "campanhas pagas" },
    { n: "94",   label: "Posts por mês",    sub: "por cliente" },
    { n: "30",   label: "Dias",             sub: "para ver resultados" },
  ];
  return (
    <section id="resultados" style={{ padding: "100px 64px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Resultados</span>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px, 4.5vw, 58px)", fontWeight: 800, color: OFF, lineHeight: 1.05, letterSpacing: "-0.04em", marginTop: 10 }}>
              Números que importam.
            </h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" }}>
          {stats.map((s, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <div style={{ padding: "48px 32px", background: BLACK, borderRight: i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none", textAlign: "center" as const }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(44px, 4vw, 68px)", fontWeight: 800, color: LIME, letterSpacing: "-0.05em", lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 600, color: OFF, marginTop: 10, letterSpacing: "-0.02em" }}>{s.label}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: MUTED, marginTop: 5 }}>{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section id="contato" style={{ padding: "80px 64px" }}>
      <Reveal>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          background: LIME, borderRadius: 24, padding: "72px 64px",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 40,
          position: "relative", overflow: "hidden",
        }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(0,0,0,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 14 }}>Pronto para escalar?</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 3.5vw, 50px)", fontWeight: 800, color: BLACK, lineHeight: 1.08, letterSpacing: "-0.04em" }}>
              Seu time de marketing<br />completo, a partir de hoje.
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 9, background: BLACK, color: LIME, fontWeight: 700, fontSize: 14, padding: "14px 28px", borderRadius: 100, textDecoration: "none", whiteSpace: "nowrap" as const }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              <MessageCircle size={16} /> Falar no WhatsApp
            </a>
            <a href="mailto:carolinielucas.cl@gmail.com"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, background: "rgba(0,0,0,0.1)", color: BLACK, fontWeight: 600, fontSize: 13, padding: "12px 28px", borderRadius: 100, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.18)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.1)")}>
              Enviar e-mail
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: "36px 64px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: LIME, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={14} color={BLACK} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: OFF, letterSpacing: "-0.02em" }}>Calu Agência</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: MUTED }}>Marketing digital · São Paulo</div>
          </div>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(240,239,232,0.18)" }}>
          © {new Date().getFullYear()} Calu Agência · Todos os direitos reservados
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[Instagram, Linkedin, MessageCircle].map((Icon, i) => (
            <a key={i} href="#"
              style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.09)", display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = LIME; e.currentTarget.style.background = `${LIME}12`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.background = "transparent"; }}>
              <Icon size={14} color="rgba(240,239,232,0.4)" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── Keyframes injected once via a dedicated element
function GlobalStyles() {
  return (
    <style>{`
      @keyframes calu-ticker {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `}</style>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: BLACK, color: OFF, minHeight: "100vh", fontFamily: "'Syne', sans-serif" }}>
      <GlobalStyles />
      <Nav />
      <Hero />
      <Ticker />
      <ServicesSection />
      <TeamSection />
      <ProcessSection />
      <SavingsSection />
      <ResultsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
