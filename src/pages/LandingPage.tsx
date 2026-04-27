import { useState, useEffect, useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Zap, ChevronDown, Instagram, Linkedin, MessageCircle, ArrowRight, Check } from "lucide-react";

// ── Brand
const LIME = "#B9FF4B";
const BLACK = "#080808";
const OFF = "#F0EFE8";
const MUTED = "#555";

// ── Font injection (Syne + DM Mono)
const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  .calu-root { font-family: 'Syne', sans-serif; }
  .mono { font-family: 'DM Mono', monospace; }
  @keyframes ticker {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-12px); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  .spin-slow { animation: spin-slow 16s linear infinite; }
  .float     { animation: float 4s ease-in-out infinite; }
`;

// ── Data
const SERVICES = [
  { n: "01", title: "Estratégia\nde Marca",     desc: "Posicionamento, pauta editorial e direção criativa alinhados ao seu negócio e ao seu público." },
  { n: "02", title: "Criação de\nConteúdo",     desc: "Posts, reels, stories, artigos e anúncios escritos e desenhados com foco em conversão real." },
  { n: "03", title: "Tráfego\nPago",            desc: "Campanhas no Meta e Google Ads gerenciadas para CPA baixo e ROAS consistentemente alto." },
  { n: "04", title: "Gestão de\nRedes Sociais", desc: "Publicação diária, atendimento e monitoramento de todas as suas plataformas, sem esforço seu." },
  { n: "05", title: "SEO &\nBlog",              desc: "Conteúdo otimizado que atrai clientes orgânicos e posiciona sua marca como autoridade." },
  { n: "06", title: "CRM &\nAutomação",         desc: "Qualificação de leads via WhatsApp e nutrição automatizada para fechar mais negócios." },
];

const TEAM = [
  { i: "A", name: "ARIA",     role: "Orquestradora",   color: LIME,      desc: "Coordena todo o time em tempo real, garantindo que cada peça saia no prazo certo." },
  { i: "C", name: "Carolina", role: "Estrategista",    color: "#FBBF24", desc: "Define seu posicionamento e pauta editorial mês a mês." },
  { i: "B", name: "Beatriz",  role: "Copywriter",      color: "#A78BFA", desc: "Escreve cada texto, legenda e anúncio para converter e engajar." },
  { i: "I", name: "Isadora",  role: "Designer",        color: "#D946EF", desc: "Cria todos os visuais alinhados ao manual de marca da sua empresa." },
  { i: "R", name: "Rafaela",  role: "Tráfego Pago",    color: "#F97316", desc: "Gerencia campanhas pagas com foco em performance e escalabilidade." },
  { i: "M", name: "Marina",   role: "Social Media",    color: "#60A5FA", desc: "Agenda, publica e monitora todo o conteúdo orgânico diariamente." },
  { i: "L", name: "Lucas",    role: "Analytics",       color: "#34D399", desc: "Monitora métricas e entrega relatórios com insights acionáveis toda semana." },
  { i: "E", name: "Eduardo",  role: "Vendas & CRM",    color: "#F59E0B", desc: "Qualifica leads via WhatsApp e alimenta o CRM para fechar negócios." },
  { i: "T", name: "Teo",      role: "Web & SEO",       color: "#06B6D4", desc: "Atualiza seu site, publica no blog e otimiza páginas para buscadores." },
  { i: "V", name: "Vitória",  role: "Revisão",         color: "#EC4899", desc: "Revisa e corrige 100% do conteúdo antes de publicar — zero erros." },
];

const SAVINGS = [
  { role: "Gerente de Marketing Sênior",  min: 8000,  max: 14000 },
  { role: "Copywriter / Redator Sênior",  min: 5000,  max: 8000  },
  { role: "Designer Gráfico Sênior",      min: 5000,  max: 9000  },
  { role: "Especialista em Tráfego Pago", min: 5000,  max: 9000  },
  { role: "Social Media Pleno/Sênior",    min: 3500,  max: 5500  },
  { role: "Analista de Marketing Digital",min: 4500,  max: 7000  },
  { role: "SDR / Pré-vendedor",           min: 3500,  max: 6000  },
  { role: "Web Designer / Dev WordPress", min: 4000,  max: 6500  },
  { role: "Revisora de Conteúdo",         min: 2500,  max: 4000  },
];
const MARKET_MIN = SAVINGS.reduce((s, r) => s + r.min, 0);

const TICKER = [
  "14 clientes ativos", "ROAS médio 3.8×", "94 posts/mês", "R$ 2.4M em vendas geradas",
  "CPA até 60% menor", "10 especialistas de IA", "São Paulo · Brasil", "98% satisfação",
  "Marketing 24h por dia", "Zero contratação CLT", "Resultados em 30 dias",
];

// ── Helpers
function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

// ── Sub-components

function InViewFade({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function TickerBar() {
  const repeated = [...TICKER, ...TICKER, ...TICKER, ...TICKER];
  return (
    <div style={{ background: LIME, overflow: "hidden", padding: "14px 0", borderTop: `1px solid ${LIME}`, borderBottom: `1px solid ${LIME}` }}>
      <div style={{ display: "flex", width: "max-content", animation: "ticker 30s linear infinite" }}>
        {repeated.map((t, i) => (
          <span key={i} className="mono" style={{ fontSize: 13, fontWeight: 500, color: BLACK, whiteSpace: "nowrap", paddingRight: 48, letterSpacing: "0.02em" }}>
            {t} <span style={{ opacity: 0.4, marginRight: 48 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function RotatingBadge() {
  const text = "CALU AGÊNCIA · MARKETING DIGITAL · SÃO PAULO · ";
  const chars = text.split("");
  return (
    <div style={{ position: "relative", width: 140, height: 140 }}>
      <div className="spin-slow" style={{ width: 140, height: 140, position: "absolute" }}>
        <svg viewBox="0 0 140 140" width="140" height="140">
          <defs>
            <path id="circle-path" d="M 70 70 m -50 0 a 50 50 0 1 1 100 0 a 50 50 0 1 1 -100 0" />
          </defs>
          <text className="mono" style={{ fontSize: 11.5, fill: LIME, letterSpacing: "0.14em" }}>
            <textPath href="#circle-path">{text}</textPath>
          </text>
        </svg>
      </div>
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: LIME, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={22} color={BLACK} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 32px",
        height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(8,8,8,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "background 0.3s, border 0.3s",
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: LIME, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={16} color={BLACK} strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: OFF, letterSpacing: "-0.02em" }}>Calu Agência</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {["Serviços", "Time", "Resultados", "Contato"].map(l => (
          <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 13, color: "rgba(240,239,232,0.5)", textDecoration: "none", transition: "color 0.2s", fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.color = OFF)}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,239,232,0.5)")}>
            {l}
          </a>
        ))}
        <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer"
          style={{ fontSize: 13, fontWeight: 700, color: BLACK, background: LIME, padding: "8px 18px", borderRadius: 100, textDecoration: "none", letterSpacing: "-0.01em", transition: "opacity 0.2s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          Começar agora
        </a>
      </div>
    </motion.nav>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, -120]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <motion.section style={{ y, opacity, position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 64px 80px", overflow: "hidden" }}>
      {/* Background grain + glow */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(ellipse 60% 60% at 80% 50%, rgba(185,255,75,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 50% at 10% 80%, rgba(185,255,75,0.04) 0%, transparent 60%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")", backgroundSize: "200px", opacity: 0.6, pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "center" }}>
        <div>
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 32 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: LIME, boxShadow: `0 0 12px ${LIME}` }} />
            <span className="mono" style={{ fontSize: 12, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Marketing digital de alta performance
            </span>
          </motion.div>

          {/* Headline */}
          <div style={{ overflow: "hidden" }}>
            {["Marketing", "que realmente", "converte."].map((line, i) => (
              <div key={i} style={{ overflow: "hidden" }}>
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 + i * 0.1 }}
                  style={{
                    fontSize: "clamp(52px, 7vw, 96px)",
                    fontWeight: 800,
                    lineHeight: 1.0,
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
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            style={{ fontSize: 18, color: "rgba(240,239,232,0.45)", lineHeight: 1.55, marginTop: 28, maxWidth: 520, fontWeight: 400 }}>
            Time completo de especialistas em IA — estrategista, copywriter, designer, gestor de tráfego e mais 6 profissionais — trabalhando pela sua marca todos os dias.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            style={{ display: "flex", gap: 12, marginTop: 40, alignItems: "center" }}>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: LIME, color: BLACK, fontWeight: 700, fontSize: 15, padding: "14px 28px", borderRadius: 100, textDecoration: "none", letterSpacing: "-0.02em", transition: "transform 0.2s, box-shadow 0.2s", boxShadow: `0 0 40px rgba(185,255,75,0.25)` }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 40px rgba(185,255,75,0.35)`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 0 40px rgba(185,255,75,0.25)`; }}>
              <MessageCircle size={16} /> Fale conosco
            </a>
            <a href="#servicos"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(240,239,232,0.55)", fontSize: 15, fontWeight: 500, textDecoration: "none", padding: "14px 4px", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = OFF)}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,239,232,0.55)")}>
              Ver serviços <ArrowRight size={16} />
            </a>
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            style={{ display: "flex", gap: 32, marginTop: 56, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { n: "14", label: "clientes ativos" },
              { n: "3.8×", label: "ROAS médio" },
              { n: "R$ 2.4M", label: "em vendas geradas" },
            ].map(s => (
              <div key={s.n}>
                <div style={{ fontSize: 28, fontWeight: 800, color: OFF, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.n}</div>
                <div className="mono" style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: rotating badge + float card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
          <RotatingBadge />
          {/* Floating agent preview card */}
          <div className="float" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "20px 24px", backdropFilter: "blur(16px)", width: 220 }}>
            <div style={{ fontSize: 11, color: LIME, marginBottom: 14, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }} className="mono">Time ativo agora</div>
            {TEAM.slice(0, 4).map(t => (
              <div key={t.i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${t.color}22`, border: `1px solid ${t.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: t.color, flexShrink: 0 }}>{t.i}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: OFF, lineHeight: 1 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{t.role}</div>
                </div>
                <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: LIME, boxShadow: `0 0 8px ${LIME}`, animation: "blink 2s ease-in-out infinite", animationDelay: `${Math.random() * 2}s` }} />
              </div>
            ))}
            <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }} className="mono">+ 6 especialistas</div>
          </div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span className="mono" style={{ fontSize: 10, color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase" }}>scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}>
          <ChevronDown size={16} color={MUTED} />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

function ServicesSection() {
  return (
    <section id="servicos" style={{ padding: "120px 64px", maxWidth: 1200, margin: "0 auto" }}>
      <InViewFade>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 72 }}>
          <div>
            <span className="mono" style={{ fontSize: 12, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>O que fazemos</span>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, color: OFF, lineHeight: 1.05, letterSpacing: "-0.04em", marginTop: 12 }}>
              Tudo que sua marca<br />precisa, em um lugar.
            </h2>
          </div>
          <p style={{ fontSize: 16, color: "rgba(240,239,232,0.4)", maxWidth: 280, lineHeight: 1.6, textAlign: "right" }}>
            Serviços integrados que trabalham juntos para crescer o seu negócio de forma consistente.
          </p>
        </div>
      </InViewFade>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
        {SERVICES.map((s, i) => (
          <InViewFade key={s.n} delay={i * 0.07}>
            <div
              style={{ padding: "40px 36px", background: BLACK, transition: "background 0.25s", cursor: "default", borderRight: i % 3 !== 2 ? "1px solid rgba(255,255,255,0.06)" : "none", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(185,255,75,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = BLACK)}>
              <div className="mono" style={{ fontSize: 12, color: LIME, marginBottom: 20, letterSpacing: "0.06em" }}>{s.n}</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: OFF, lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: 16, whiteSpace: "pre-line" }}>{s.title}</h3>
              <p style={{ fontSize: 14, color: "rgba(240,239,232,0.4)", lineHeight: 1.65, fontWeight: 400 }}>{s.desc}</p>
            </div>
          </InViewFade>
        ))}
      </div>
    </section>
  );
}

function TeamSection() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="time" style={{ padding: "120px 64px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <InViewFade>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 72 }}>
            <div>
              <span className="mono" style={{ fontSize: 12, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Nosso time</span>
              <h2 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, color: OFF, lineHeight: 1.05, letterSpacing: "-0.04em", marginTop: 12 }}>
                10 especialistas.<br />1 investimento.
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRadius: 100, border: `1px solid rgba(185,255,75,0.22)`, background: "rgba(185,255,75,0.06)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: LIME, boxShadow: `0 0 10px ${LIME}`, animation: "blink 2s ease-in-out infinite" }} />
              <span className="mono" style={{ fontSize: 12, color: LIME }}>Todos online agora</span>
            </div>
          </div>
        </InViewFade>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {TEAM.map((t, i) => (
            <InViewFade key={t.i} delay={i * 0.05}>
              <div
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                style={{
                  padding: "24px 20px",
                  borderRadius: 16,
                  border: `1px solid ${active === i ? `${t.color}40` : "rgba(255,255,255,0.07)"}`,
                  background: active === i ? `${t.color}08` : "rgba(255,255,255,0.02)",
                  transition: "all 0.25s",
                  cursor: "default",
                }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${t.color}20`, border: `1px solid ${t.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: t.color, marginBottom: 16 }}>{t.i}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: OFF, letterSpacing: "-0.02em", marginBottom: 4 }}>{t.name}</div>
                <div className="mono" style={{ fontSize: 11, color: MUTED, marginBottom: 12 }}>{t.role}</div>
                <p style={{ fontSize: 12.5, color: "rgba(240,239,232,0.38)", lineHeight: 1.55, fontWeight: 400, height: active === i ? "auto" : 0, overflow: "hidden", opacity: active === i ? 1 : 0, transition: "opacity 0.25s" }}>{t.desc}</p>
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.i === "A" ? LIME : "rgba(185,255,75,0.4)", boxShadow: t.i === "A" ? `0 0 8px ${LIME}` : "none" }} />
                  <span className="mono" style={{ fontSize: 10, color: t.i === "A" ? LIME : "rgba(185,255,75,0.5)" }}>trabalhando</span>
                </div>
              </div>
            </InViewFade>
          ))}
        </div>
      </div>
    </section>
  );
}

function SavingsSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section style={{ padding: "120px 64px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <InViewFade>
          <span className="mono" style={{ fontSize: 12, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Por que faz sentido</span>
          <h2 style={{ fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 800, color: OFF, lineHeight: 1.1, letterSpacing: "-0.04em", marginTop: 12, marginBottom: 20 }}>
            Você economiza<br /><span style={{ color: LIME }}>R$ {fmt(MARKET_MIN)}+</span><br />por mês.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(240,239,232,0.4)", lineHeight: 1.65, marginBottom: 32 }}>
            Para ter todos esses especialistas contratados individualmente, você gastaria entre <strong style={{ color: "rgba(240,239,232,0.7)" }}>R$ {fmt(MARKET_MIN)}</strong> e <strong style={{ color: "rgba(240,239,232,0.7)" }}>R$ {fmt(MARKET_MIN + 40000)}</strong> por mês — só em salários, sem contar encargos, ferramentas e gestão.
          </p>
          <p style={{ fontSize: 14, color: "rgba(240,239,232,0.28)", lineHeight: 1.65 }}>
            Com a Calu Agência, você tem todos eles por uma fração desse valor, com resultados mensuráveis desde o primeiro mês.
          </p>
          <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 36, background: LIME, color: BLACK, fontWeight: 700, fontSize: 14, padding: "12px 24px", borderRadius: 100, textDecoration: "none", letterSpacing: "-0.01em" }}>
            Quero economizar <ArrowUpRight size={16} />
          </a>
        </InViewFade>

        <InViewFade delay={0.15}>
          <div style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: 11, color: MUTED }}>PROFISSIONAL</span>
              <span className="mono" style={{ fontSize: 11, color: MUTED }}>SALÁRIO DE MERCADO</span>
            </div>
            {SAVINGS.map((s, i) => (
              <div key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: "14px 20px",
                  borderBottom: i < SAVINGS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: hovered === i ? "rgba(185,255,75,0.04)" : "transparent",
                  transition: "background 0.2s",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Check size={13} color={LIME} strokeWidth={2.5} />
                  <span style={{ fontSize: 13, color: "rgba(240,239,232,0.6)", fontWeight: 500 }}>{s.role}</span>
                </div>
                <span className="mono" style={{ fontSize: 12, color: "rgba(240,239,232,0.35)" }}>R$ {fmt(s.min)}–{fmt(s.max)}</span>
              </div>
            ))}
            <div style={{ padding: "16px 20px", background: `${LIME}0F`, borderTop: `1px solid ${LIME}22`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: LIME }}>Total estimado</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: LIME }}>R$ {fmt(MARKET_MIN)}+/mês</span>
            </div>
          </div>
        </InViewFade>
      </div>
    </section>
  );
}

function ResultsSection() {
  const stats = [
    { n: "14", label: "Clientes ativos", sub: "e crescendo" },
    { n: "3.8×", label: "ROAS médio", sub: "campanhas pagas" },
    { n: "94", label: "Posts por mês", sub: "por cliente" },
    { n: "30", label: "Dias", sub: "para ver resultados" },
  ];

  return (
    <section id="resultados" style={{ padding: "100px 64px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <InViewFade>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <span className="mono" style={{ fontSize: 12, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Resultados</span>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, color: OFF, lineHeight: 1.05, letterSpacing: "-0.04em", marginTop: 12 }}>
              Números que importam.
            </h2>
          </div>
        </InViewFade>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
          {stats.map((s, i) => (
            <InViewFade key={i} delay={i * 0.08}>
              <div style={{ padding: "48px 36px", background: BLACK, borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none", textAlign: "center" }}>
                <div style={{ fontSize: "clamp(48px, 5vw, 72px)", fontWeight: 800, color: LIME, letterSpacing: "-0.05em", lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: OFF, marginTop: 12, letterSpacing: "-0.02em" }}>{s.label}</div>
                <div className="mono" style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{s.sub}</div>
              </div>
            </InViewFade>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    { n: "01", title: "Briefing",      desc: "Uma conversa rápida para entender seu negócio, público, metas e tom de voz." },
    { n: "02", title: "Estratégia",    desc: "Em até 48h, seu plano editorial, campanhas e calendário estão prontos." },
    { n: "03", title: "Execução",      desc: "O time entra em ação: conteúdo, design, ads e automações rodando em paralelo." },
    { n: "04", title: "Resultados",    desc: "Relatórios semanais com métricas reais. Ajustes contínuos para maximizar retorno." },
  ];

  return (
    <section style={{ padding: "120px 64px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <InViewFade>
          <div style={{ marginBottom: 72 }}>
            <span className="mono" style={{ fontSize: 12, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Como funciona</span>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 800, color: OFF, lineHeight: 1.05, letterSpacing: "-0.04em", marginTop: 12 }}>
              Do briefing<br />aos resultados.
            </h2>
          </div>
        </InViewFade>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, position: "relative" }}>
          {/* connecting line */}
          <div style={{ position: "absolute", top: 32, left: "12.5%", right: "12.5%", height: 1, background: `linear-gradient(to right, ${LIME}60, ${LIME}20)`, zIndex: 0 }} />
          {steps.map((s, i) => (
            <InViewFade key={i} delay={i * 0.1}>
              <div style={{ padding: "0 24px 0 0", position: "relative", zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: i === 0 ? LIME : "rgba(185,255,75,0.1)", border: `1px solid ${i === 0 ? "transparent" : "rgba(185,255,75,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? BLACK : LIME }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: OFF, letterSpacing: "-0.03em", marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(240,239,232,0.38)", lineHeight: 1.65, fontWeight: 400 }}>{s.desc}</p>
              </div>
            </InViewFade>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section id="contato" style={{ padding: "100px 64px" }}>
      <InViewFade>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          background: LIME, borderRadius: 28, padding: "80px 72px",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 48,
          position: "relative", overflow: "hidden",
        }}>
          {/* Background texture */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")", backgroundSize: "200px", pointerEvents: "none" }} />
          <div>
            <div className="mono" style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Pronto para escalar?</div>
            <h2 style={{ fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 800, color: BLACK, lineHeight: 1.05, letterSpacing: "-0.04em" }}>
              Seu time de marketing<br />completo, a partir de hoje.
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>
            <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 10, background: BLACK, color: LIME, fontWeight: 700, fontSize: 15, padding: "16px 32px", borderRadius: 100, textDecoration: "none", letterSpacing: "-0.02em", whiteSpace: "nowrap", transition: "opacity 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
              <MessageCircle size={18} /> Falar no WhatsApp
            </a>
            <a href="mailto:carolinielucas.cl@gmail.com"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(0,0,0,0.12)", color: BLACK, fontWeight: 600, fontSize: 14, padding: "14px 32px", borderRadius: 100, textDecoration: "none", letterSpacing: "-0.01em", transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.12)")}>
              Enviar e-mail
            </a>
          </div>
        </div>
      </InViewFade>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: "40px 64px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: LIME, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={14} color={BLACK} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: OFF, letterSpacing: "-0.02em" }}>Calu Agência</div>
            <div className="mono" style={{ fontSize: 11, color: MUTED }}>Marketing digital · São Paulo</div>
          </div>
        </div>
        <div className="mono" style={{ fontSize: 11, color: "rgba(240,239,232,0.2)" }}>
          © {new Date().getFullYear()} Calu Agência · Todos os direitos reservados
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[Instagram, Linkedin, MessageCircle].map((Icon, i) => (
            <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.2s, background 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = LIME; e.currentTarget.style.background = `${LIME}12`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "transparent"; }}>
              <Icon size={15} color="rgba(240,239,232,0.45)" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── Main export
export default function LandingPage() {
  return (
    <div className="calu-root" style={{ background: BLACK, color: OFF, minHeight: "100vh" }}>
      <style>{FONT_CSS}</style>
      <Nav />
      <Hero />
      <TickerBar />
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
