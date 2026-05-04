import caluLogo from "@/assets/calu-logo.png";
import { useState, useEffect, useRef } from "react";
import { Zap, ArrowUpRight, MessageCircle, Instagram, Linkedin, ArrowRight, Check } from "lucide-react";

const LIME  = "#B9FF4B";
const BLACK = "#080808";
const OFF   = "#F0EFE8";
const MUTED = "#666";
const DIM   = "rgba(240,239,232,0.38)";
const mono  = "'DM Mono', monospace";
const syne  = "'Syne', 'Inter', sans-serif";

const SERVICES = [
  { n: "01", title: "Estratégia de Marca",     desc: "Posicionamento, pauta editorial e direção criativa alinhados ao seu negócio." },
  { n: "02", title: "Criação de Conteúdo",     desc: "Posts, reels, stories, artigos e anúncios com foco em conversão real." },
  { n: "03", title: "Tráfego Pago",            desc: "Meta e Google Ads gerenciados para CPA baixo e ROAS consistentemente alto." },
  { n: "04", title: "Gestão de Redes Sociais", desc: "Publicação diária, atendimento e monitoramento de todas as suas plataformas." },
  { n: "05", title: "SEO & Blog",              desc: "Conteúdo otimizado que atrai clientes orgânicos e posiciona sua marca como autoridade." },
  { n: "06", title: "CRM & Automação",         desc: "Leads qualificados, nurturados e convertidos via WhatsApp e automações." },
];

const PRODUCTS = [
  {
    tag: "CRM",
    name: "OmniCRM",
    sub: "Para agências e negócios locais",
    color: LIME,
    desc: "Todos os canais do seu cliente em um lugar — WhatsApp, Instagram, e-mail, site. Pipeline visual para fechar mais negócios com menos esforço.",
    items: ["Inbox unificado", "Pipeline de vendas", "Automações de follow-up", "Relatórios em tempo real"],
  },
  {
    tag: "SAÚDE",
    name: "Posture.AI",
    sub: "Para fisioterapeutas, personal trainers e estúdios",
    color: "#A78BFA",
    desc: "Tire uma foto e receba análise postural completa em segundos. IA treinada com 50 mil avaliações que identifica desalinhamentos, gera relatórios em PDF e acompanha a evolução de cada aluno.",
    items: ["Análise postural com IA", "Gestão completa de alunos", "Relatórios PDF profissionais", "Ficha de anamnese digital"],
  },
  {
    tag: "RH",
    name: "RH Inteligente",
    sub: "Para empresas em crescimento com time em expansão",
    color: "#34D399",
    desc: "Do recrutamento ao onboarding, a IA assume o operacional para seu RH focar no que mais importa: as pessoas.",
    items: ["Triagem automática de currículos", "Onboarding digital", "Avaliações de desempenho", "People analytics"],
  },
];

const TEAM = [
  { i: "Lu", name: "Luna",    role: "Orquestradora Geral",      color: LIME,      desc: "Coordena todo o time em tempo real, define prioridades e garante que cada entrega saia no prazo e com qualidade. É o cérebro que conecta todos os agentes.", tasks: ["Orquestração do time", "Controle de prazos", "Briefing automatizado", "Relatório executivo"] },
  { i: "Q", name: "Queila",  role: "Estrategista de Marca",    color: "#FBBF24", desc: "Define o posicionamento, a pauta editorial e a direção criativa da marca. Cria o mapa de conteúdo mensal e garante consistência de mensagem em todos os canais.", tasks: ["Pauta editorial mensal", "Posicionamento de marca", "Análise de concorrência", "Direção criativa"] },
  { i: "B", name: "Beatriz",  role: "Copywriter & Redatora",    color: "#A78BFA", desc: "Escreve cada legenda, artigo, e-mail e anúncio com foco em conversão. Seu copy tem personalidade, clareza e intenção — porque cada palavra tem um objetivo.", tasks: ["Legendas e posts", "Artigos e blog", "Roteiros de vídeo", "Copy de anúncios"] },
  { i: "M", name: "Marcela",  role: "Designer Visual",          color: "#D946EF", desc: "Cria todos os visuais da marca — posts, stories, banners, apresentações e peças de campanha. Cada pixel alinhado ao manual de identidade da empresa.", tasks: ["Posts e stories", "Banners e anúncios", "Apresentações", "Identidade visual"] },
  { i: "R", name: "Rafaela",  role: "Gestora de Tráfego Pago",  color: "#F97316", desc: "Gerencia campanhas no Meta Ads e Google Ads com foco em ROAS alto e CPA que faz sentido. Testa, otimiza e escala o que funciona — todos os dias.", tasks: ["Meta Ads (FB/IG)", "Google Ads", "Remarketing", "Otimização de verba"] },
  { i: "M", name: "Marina",   role: "Social Media Manager",     color: "#60A5FA", desc: "Agenda, publica e monitora todo o conteúdo orgânico. Responde comentários, monitora menções e mantém sua marca ativa e presente em todos os momentos.", tasks: ["Agendamento de posts", "Engajamento", "Monitoramento", "Relatório semanal"] },
  { i: "P", name: "Pedro",    role: "Calendário Editorial",     color: "#2DD4BF", desc: "Planeja e organiza todo o calendário editorial — semanas, meses e campanhas sazonais. Cada post no lugar certo, na hora certa, com o pilar de conteúdo adequado.", tasks: ["Calendário mensal", "Pilares de conteúdo", "Datas estratégicas", "Cronograma de campanhas"] },
  { i: "L", name: "Lucas",    role: "Analista de Dados",        color: "#34D399", desc: "Transforma números em decisões. Monitora métricas de tráfego, engajamento e vendas, e entrega relatórios com insights claros e ações recomendadas.", tasks: ["Dashboards de resultado", "Google Analytics", "Relatórios semanais", "Insights estratégicos"] },
  { i: "E", name: "Eduardo",  role: "Agente de Vendas & CRM",   color: "#F59E0B", desc: "Qualifica leads via WhatsApp, alimenta o CRM e garante que nenhum contato seja perdido. Do primeiro 'oi' até o fechamento do contrato.", tasks: ["Qualificação de leads", "Follow-up automatizado", "Gestão do CRM", "Relatório de pipeline"] },
  { i: "T", name: "Teo",      role: "Web Designer & SEO",       color: "#06B6D4", desc: "Mantém seu site atualizado, publica no blog e otimiza cada página para os buscadores. Mais visibilidade orgânica, mais clientes chegando até você.", tasks: ["Atualização de site", "SEO on-page", "Blog e artigos", "Landing pages"] },
  { i: "V", name: "Vitória",  role: "Revisora de Conteúdo",     color: "#EC4899", desc: "Revisa e corrige 100% do conteúdo antes de publicar. Gramática, tom de voz, consistência de marca — zero erros, zero vergonha.", tasks: ["Revisão gramatical", "Tom de voz", "Checagem de fatos", "Aprovação final"] },
  { i: "A", name: "Aira",     role: "Secretária IA",             color: "#FB7185", desc: "Gerencia a agenda, organiza reuniões, responde comunicações administrativas e cuida do dia a dia do time. Nada passa despercebido, tudo é acompanhado com precisão.", tasks: ["Gestão de agenda", "Comunicação administrativa", "Coordenação de reuniões", "Suporte ao time"] },
];

const TICKER = [
  "Criatividade que vende", "IA que escala", "ROAS 3.8×", "14 clientes ativos",
  "OmniCRM", "Posture.AI", "RH Inteligente", "São Paulo · Brasil",
  "94 posts/mês", "Marketing 24h", "R$ 2.4M em vendas",
];

const CSS = `
  .cl * { box-sizing: border-box; margin: 0; padding: 0; }
  .cl a { text-decoration: none; color: inherit; }
  .cl h1, .cl h2, .cl h3, .cl h4, .cl h5, .cl h6 { font-family: 'Syne', 'Inter', sans-serif; }
  @keyframes cl-in      { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes cl-tick    { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @keyframes cl-bob     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
  @keyframes cl-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(185,255,75,.5)} 50%{box-shadow:0 0 0 6px rgba(185,255,75,0)} }
  @keyframes cl-agent-in{ 0%{opacity:0;transform:translateY(12px) scale(.96)} 100%{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes cl-glow-in { 0%{opacity:0} 100%{opacity:1} }
  @keyframes cl-line    { from{transform:scaleX(0);transform-origin:left} to{transform:scaleX(1);transform-origin:left} }
  @keyframes cl-tl-in   { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
  @keyframes cl-shine   { from{transform:translateX(-220px) skewX(-18deg)} to{transform:translateX(960px) skewX(-18deg)} }
  .cl-a1{animation:cl-in .65s ease both .05s}
  .cl-a2{animation:cl-in .65s ease both .18s}
  .cl-a3{animation:cl-in .65s ease both .30s}
  .cl-a4{animation:cl-in .65s ease both .44s}
  .cl-a5{animation:cl-in .65s ease both .60s}
  .cl-pill{transition:opacity .18s,transform .18s}
  .cl-pill:hover{opacity:.85;transform:translateY(-1px)}
  .cl-link{transition:color .18s}
  .cl-link:hover{color:#B9FF4B !important}
  .cl-card{transition:background .2s,border-color .2s}
  .cl-card:hover{background:rgba(185,255,75,.04) !important;border-color:rgba(185,255,75,.2) !important}
  .cl-prod{transition:transform .22s,box-shadow .22s}
  .cl-prod:hover{transform:translateY(-4px);box-shadow:0 24px 64px rgba(0,0,0,.35)}
  .cl-social{transition:border-color .18s}
  .cl-social:hover{border-color:#B9FF4B !important}
  .cl-dot{animation:cl-pulse 2.2s ease-in-out infinite}
  .cl-bob{animation:cl-bob 1.7s ease-in-out infinite}
  .cl-track{overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .cl-track::-webkit-scrollbar{display:none}
  .cl-agent-in{animation:cl-agent-in .42s cubic-bezier(.22,.68,0,1.2) both}
  .cl-tl-step{transition:background .28s,border-color .28s,box-shadow .28s,transform .22s;cursor:pointer}
  .cl-tl-step:hover{transform:translateY(-4px) !important;border-color:rgba(185,255,75,.32) !important;box-shadow:0 16px 48px -16px rgba(185,255,75,.28),0 0 0 1px rgba(185,255,75,.14) !important}
  .cl-tl-node{transition:background .35s,border-color .35s,box-shadow .35s}
  .cl-agent-btn{transition:all .2s;cursor:pointer}
  .cl-agent-btn:hover{transform:scale(1.12)}
`;

function fmt(n: number) { return n.toLocaleString("pt-BR"); }

// ── Process steps ──────────────────────────────────────────────
const PROCESS = [
  {
    n: "01", title: "Briefing IA",
    agents: [{ i: "L", color: "#38BDF8", name: "Lia" }],
    duration: "30 min",
    output: "Diagnóstico completo",
    desc: "Lia coleta briefing via conversa natural com IA, analisa concorrência e entrega um diagnóstico de marketing personalizado.",
    details: ["Formulário inteligente de onboarding", "Análise automática da concorrência", "Mapa de oportunidades da marca", "Briefing consolidado para o time"],
    color: "#38BDF8",
  },
  {
    n: "02", title: "Estratégia",
    agents: [{ i: "Q", color: "#FBBF24", name: "Queila" }, { i: "P", color: "#2DD4BF", name: "Pedro" }],
    duration: "2h",
    output: "Pauta editorial mensal",
    desc: "Queila define posicionamento, pauta editorial e direção criativa. Pedro monta o calendário editorial completo com pilares, datas e cronograma estratégico para o mês.",
    details: ["Pauta editorial 30 dias", "Posicionamento e tom de voz", "Calendário de campanhas", "Direção criativa aprovada"],
    color: "#FBBF24",
  },
  {
    n: "03", title: "Produção",
    agents: [{ i: "B", color: "#A78BFA", name: "Beatriz" }, { i: "M", color: "#D946EF", name: "Marcela" }, { i: "🎬", color: "#B9FF4B", name: "Bobby" }],
    duration: "48h",
    output: "Todos os assets criados",
    desc: "Beatriz escreve copy, Marcela cria os visuais e Bobby edita os vídeos — tudo em paralelo, sem esperar um pelo outro.",
    details: ["Copy para posts, reels e anúncios", "Peças visuais e templates", "Vídeos editados e formatados", "Assets aprovados para revisão"],
    color: "#A78BFA",
  },
  {
    n: "04", title: "Revisão",
    agents: [{ i: "V", color: "#EC4899", name: "Vitória" }],
    duration: "4h",
    output: "Zero erros garantido",
    desc: "Vitória revisa 100% do conteúdo antes de qualquer aprovação — gramática, tom de voz, consistência de marca e checagem de fatos.",
    details: ["Revisão ortográfica e gramatical", "Checagem de tom de voz", "Consistência com o manual da marca", "Aprovação final para o cliente"],
    color: "#EC4899",
  },
  {
    n: "05", title: "Aprovação",
    agents: [{ i: "Lu", color: LIME, name: "Luna" }],
    duration: "24h",
    output: "Feedback do cliente",
    desc: "O cliente aprova tudo via portal exclusivo — vê os posts, sugere ajustes e aprova com um clique. Luna gerencia o fluxo de aprovação e sincroniza o time.",
    details: ["Portal de aprovação do cliente", "Comentários inline em cada peça", "Histórico de revisões", "Aprovação com um clique"],
    color: "#B9FF4B",
  },
  {
    n: "06", title: "Publicação",
    agents: [{ i: "M", color: "#60A5FA", name: "Marina" }, { i: "T", color: "#06B6D4", name: "Teo" }],
    duration: "contínuo",
    output: "Presença diária nas redes",
    desc: "Marina publica nos horários de maior engajamento e monitora comentários. Teo mantém o site e o blog atualizados com SEO otimizado.",
    details: ["Agendamento automático otimizado", "Publicação em todas as plataformas", "Monitoramento de comentários", "Blog e site atualizados"],
    color: "#60A5FA",
  },
  {
    n: "07", title: "Tráfego Pago",
    agents: [{ i: "R", color: "#F97316", name: "Rafaela" }, { i: "E", color: "#F59E0B", name: "Eduardo" }],
    duration: "24/7",
    output: "ROAS maximizado",
    desc: "Rafaela ativa e otimiza campanhas no Meta e Google. Eduardo qualifica os leads que chegam via WhatsApp e alimenta o pipeline.",
    details: ["Meta Ads e Google Ads ativos", "Remarketing configurado", "Qualificação de leads no CRM", "Otimização diária de verbas"],
    color: "#F97316",
  },
  {
    n: "08", title: "Relatório",
    agents: [{ i: "L", color: "#34D399", name: "Lucas" }, { i: "Lu", color: LIME, name: "Luna" }],
    duration: "semanal",
    output: "Insights + próximos passos",
    desc: "Lucas entrega relatório semanal com métricas reais. Luna consolida os dados e gera recomendações estratégicas para o próximo ciclo.",
    details: ["Dashboard de performance em tempo real", "Relatório PDF semanal", "Análise de ROI por canal", "Recomendações para o próximo mês"],
    color: "#34D399",
  },
];

// ── Hero Agent Card ────────────────────────────────────────────
function HeroAgentCard() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setActive(p => (p + 1) % TEAM.length);
      setKey(k => k + 1);
    }, 2800);
    return () => clearInterval(t);
  }, [paused]);

  const agent = TEAM[active];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        background: `${agent.color}07`,
        border: `1px solid ${agent.color}35`,
        borderRadius: 26,
        padding: "28px",
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 0 80px -20px ${agent.color}50, 0 0 0 1px ${agent.color}18`,
        transition: "background .6s, border-color .6s, box-shadow .6s",
      }}
    >
      {/* Glow blob top-right */}
      <div style={{
        position: "absolute", top: -80, right: -80,
        width: 320, height: 320, borderRadius: "50%",
        background: `radial-gradient(circle, ${agent.color}28 0%, transparent 68%)`,
        filter: "blur(36px)", pointerEvents: "none",
        transition: "background .6s",
      }} />
      {/* Glow blob bottom-left */}
      <div style={{
        position: "absolute", bottom: -60, left: -60,
        width: 200, height: 200, borderRadius: "50%",
        background: `radial-gradient(circle, ${agent.color}14 0%, transparent 70%)`,
        filter: "blur(28px)", pointerEvents: "none",
        transition: "background .6s",
      }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <span style={{ fontFamily: mono, fontSize: 10, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Time ativo agora</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div className="cl-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: LIME, boxShadow: `0 0 10px ${LIME}` }} />
          <span style={{ fontFamily: mono, fontSize: 10, color: LIME }}>10 online</span>
        </div>
      </div>

      {/* Featured agent */}
      <div key={key} className="cl-agent-in" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `${agent.color}1C`,
            border: `2px solid ${agent.color}60`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 800, color: agent.color, flexShrink: 0,
            boxShadow: `0 0 36px -6px ${agent.color}80, inset 0 1px 0 ${agent.color}30`,
            transition: "box-shadow .6s",
          }}>{agent.i}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, color: OFF }}>{agent.name}</div>
            <div style={{ fontFamily: mono, fontSize: 11, color: agent.color, marginTop: 5, opacity: 0.8 }}>{agent.role}</div>
          </div>
        </div>

        {/* Tasks grid */}
        <div style={{
          background: "rgba(0,0,0,.4)", borderRadius: 14, padding: "14px 16px",
          border: `1px solid ${agent.color}18`,
          boxShadow: `inset 0 1px 0 ${agent.color}10`,
        }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: MUTED, marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Executando agora</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 12px" }}>
            {agent.tasks.map((task, j) => (
              <div key={j} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: j === 0 ? agent.color : "rgba(255,255,255,.15)", flexShrink: 0, boxShadow: j === 0 ? `0 0 6px ${agent.color}` : "none" }} />
                <span style={{ fontSize: 12, color: j === 0 ? "rgba(240,239,232,.75)" : "rgba(240,239,232,.35)", lineHeight: 1.4 }}>{task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(to right, ${agent.color}20, rgba(255,255,255,.04), transparent)`, marginBottom: 18, transition: "background .6s" }} />

      {/* All agents */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
        {TEAM.map((t, i) => (
          <button
            key={t.i}
            onClick={() => { setActive(i); setKey(k => k + 1); setPaused(true); }}
            className="cl-agent-btn"
            style={{
              height: 44, borderRadius: 12, border: "none",
              background: i === active ? `${t.color}22` : "rgba(255,255,255,.04)",
              outline: i === active ? `1.5px solid ${t.color}70` : "1px solid rgba(255,255,255,.07)",
              display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 2,
              boxShadow: i === active ? `0 0 18px -4px ${t.color}70` : "none",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: i === active ? t.color : MUTED }}>{t.i}</span>
            <span style={{ fontFamily: mono, fontSize: 8, color: i === active ? t.color : "rgba(255,255,255,.2)", lineHeight: 1 }}>{t.name.slice(0,3)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Process Timeline ───────────────────────────────────────────
function ProcessTimeline() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [hovStep, setHovStep] = useState<number | null>(null);

  return (
    <section id="processo" style={{ padding: "120px 64px", borderBottom: "1px solid rgba(255,255,255,.06)", position: "relative", overflow: "hidden" }}>
      {/* background ambient */}
      <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 1000, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(185,255,75,.035) 0%, transparent 62%)", filter: "blur(72px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 96 }}>
          <span style={{ fontFamily: mono, fontSize: 12, color: LIME, letterSpacing: "0.14em", textTransform: "uppercase" as const, display: "block", marginBottom: 16 }}>Do briefing à publicação</span>
          <h2 style={{ fontSize: "clamp(34px, 4.5vw, 62px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.045em" }}>
            Como a Calu trabalha<br /><span style={{ color: LIME }}>do início ao resultado.</span>
          </h2>
          <p style={{ fontSize: 18, color: DIM, lineHeight: 1.7, marginTop: 20, maxWidth: 480, margin: "20px auto 0" }}>
            Clique em cada etapa para ver o que acontece nos bastidores.
          </p>
        </div>

        {/* Zigzag steps — 3 cols: [card-left] [spine] [card-right] */}
        <div>
          {PROCESS.map((step, i) => {
            const isActive = activeStep === i;
            const isPassed = activeStep !== null && i <= activeStep;
            const isLast = i === PROCESS.length - 1;
            const isRight = i % 2 === 0; // even → card on right

            const isHov = hovStep === i && !isActive;
            const card = (
              <div
                onClick={() => setActiveStep(isActive ? null : i)}
                onMouseEnter={() => setHovStep(i)}
                onMouseLeave={() => setHovStep(null)}
                style={{
                  padding: "30px 34px",
                  borderRadius: 24,
                  cursor: "pointer",
                  background: isActive ? `${step.color}09` : isHov ? `${step.color}06` : "rgba(255,255,255,.028)",
                  border: `1px solid ${isActive ? `${step.color}60` : isHov ? `${step.color}50` : "rgba(185,255,75,.14)"}`,
                  boxShadow: isActive
                    ? `0 0 0 1px ${step.color}1A, 0 20px 64px -20px ${step.color}65, inset 0 1px 0 ${step.color}18`
                    : isHov ? `0 0 0 1px ${step.color}14, 0 12px 44px -16px ${step.color}55, inset 0 1px 0 ${step.color}10`
                    : "inset 0 1px 0 rgba(255,255,255,.04)",
                  transform: isActive ? "none" : isHov ? "translateY(-4px)" : "none",
                  position: "relative", overflow: "hidden",
                  transition: "background .28s, border-color .28s, box-shadow .28s, transform .28s cubic-bezier(.22,.68,0,1.2)",
                }}
              >
                {/* Shine sweep — always present, very subtle */}
                <div style={{
                  position: "absolute", top: 0, bottom: 0, width: 90,
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,.038) 50%, transparent 100%)",
                  animation: `cl-shine ${5 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.65}s`,
                  pointerEvents: "none",
                }} />

                {/* Glow blob — corner opposite to spine */}
                <div style={{
                  position: "absolute",
                  top: -90, [isRight ? "left" : "right"]: -90,
                  width: 300, height: 300, borderRadius: "50%",
                  background: `radial-gradient(circle, ${step.color}${isActive ? "18" : isHov ? "12" : "07"} 0%, transparent 68%)`,
                  filter: "blur(40px)", pointerEvents: "none",
                  transition: "background .35s",
                }} />

                {/* Top: step label + agents */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16, position: "relative" }}>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 11, color: step.color, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 8, opacity: 0.9 }}>{step.n} · {step.duration}</div>
                    <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.038em", lineHeight: 1.08, color: isActive ? OFF : "rgba(240,239,232,.8)" }}>{step.title}</h3>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, paddingTop: 2 }}>
                    {step.agents.map(a => (
                      <div key={a.i} title={a.name} style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: `${a.color}15`, border: `1.5px solid ${a.color}55`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 800, color: a.color,
                        boxShadow: isActive ? `0 0 20px -4px ${a.color}80` : isHov ? `0 0 14px -4px ${a.color}60` : "none",
                        transition: "box-shadow .3s",
                      }}>{a.i}</div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <p style={{ fontSize: 16, color: DIM, lineHeight: 1.72, position: "relative" }}>{step.desc}</p>

                {/* Expanded */}
                {isActive && (
                  <div style={{ marginTop: 26, position: "relative" }}>
                    <div style={{ height: 1, background: `linear-gradient(to right, ${step.color}35, transparent)`, marginBottom: 22 }} />
                    <div style={{ fontFamily: mono, fontSize: 11, color: step.color, marginBottom: 16, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Entregáveis</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 28px", marginBottom: 22 }}>
                      {step.details.map((d, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: step.color, flexShrink: 0, marginTop: 9, boxShadow: `0 0 8px ${step.color}` }} />
                          <span style={{ fontSize: 15, color: "rgba(240,239,232,.58)", lineHeight: 1.65 }}>{d}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "13px 22px", borderRadius: 14, background: `${step.color}0E`, border: `1px solid ${step.color}38`, boxShadow: `0 0 32px -10px ${step.color}50` }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: step.color, boxShadow: `0 0 10px ${step.color}` }} />
                      <span style={{ fontFamily: mono, fontSize: 12, color: step.color, letterSpacing: "0.04em" }}>Output →</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: OFF }}>{step.output}</span>
                    </div>
                  </div>
                )}
              </div>
            );

            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 1fr", alignItems: "start", gap: "0 0" }}>

                {/* Left slot */}
                <div style={{ paddingRight: 32, paddingBottom: isLast ? 0 : 28 }}>
                  {!isRight ? card : <div />}
                </div>

                {/* Spine */}
                <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
                  <div
                    className="cl-tl-node"
                    onClick={() => setActiveStep(isActive ? null : i)}
                    style={{
                      width: 64, height: 64, borderRadius: "50%", flexShrink: 0, zIndex: 2, position: "relative",
                      background: isActive ? `${step.color}1C` : isPassed ? `${LIME}0D` : "rgba(255,255,255,.05)",
                      border: `2px solid ${isActive ? step.color : isPassed ? `${LIME}95` : "rgba(255,255,255,.13)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: mono, fontSize: 15, fontWeight: 800,
                      color: isActive ? step.color : isPassed ? LIME : MUTED,
                      cursor: "pointer",
                      boxShadow: isActive
                        ? `0 0 0 10px ${step.color}10, 0 0 56px -8px ${step.color}95`
                        : isPassed ? `0 0 22px -5px ${LIME}60` : "none",
                      transition: "all .4s cubic-bezier(.22,.68,0,1.2)",
                    }}
                  >{step.n}</div>

                  {!isLast && (
                    <div style={{ width: 2, flexGrow: 1, minHeight: 52, position: "relative", margin: "8px 0" }}>
                      <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.06)", borderRadius: 2 }} />
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0,
                        height: isPassed ? "100%" : "0%",
                        background: `linear-gradient(to bottom, ${LIME}, ${LIME}45)`,
                        borderRadius: 2,
                        boxShadow: isPassed ? `0 0 12px ${LIME}80` : "none",
                        transition: "height .6s ease",
                      }} />
                    </div>
                  )}
                </div>

                {/* Right slot */}
                <div style={{ paddingLeft: 32, paddingBottom: isLast ? 0 : 28 }}>
                  {isRight ? card : <div />}
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: "center", marginTop: 80 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "16px 32px", borderRadius: 100, background: "rgba(185,255,75,.06)", border: "1px solid rgba(185,255,75,.24)", boxShadow: "0 0 48px -14px rgba(185,255,75,.28)" }}>
            <div className="cl-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: LIME, boxShadow: `0 0 14px ${LIME}` }} />
            <span style={{ fontSize: 16, color: OFF }}>Todo esse processo acontece <strong style={{ color: LIME }}>em paralelo</strong>, sem esperar uma etapa acabar pra começar a outra.</span>
          </div>
        </div>

      </div>
    </section>
  );
}

function TeamCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hov, setHov] = useState<number | null>(null);
  const CARD_W = 340;
  const GAP = 16;

  const scrollTo = (idx: number) => {
    if (!trackRef.current) return;
    const clamped = Math.max(0, Math.min(idx, TEAM.length - 1));
    setActive(clamped);
    trackRef.current.scrollTo({ left: clamped * (CARD_W + GAP), behavior: "smooth" });
  };

  const onScroll = () => {
    if (!trackRef.current) return;
    const idx = Math.round(trackRef.current.scrollLeft / (CARD_W + GAP));
    setActive(idx);
  };

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % TEAM.length;
        if (trackRef.current) {
          trackRef.current.scrollTo({ left: next * (CARD_W + GAP), behavior: "smooth" });
        }
        return next;
      });
    }, 3200);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section id="time" style={{ padding: "100px 0", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "0 64px", maxWidth: 1200, margin: "0 auto 48px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Nosso time de IA</span>
          <h2 style={{ fontSize: "clamp(22px, 3.2vw, 42px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.04em", marginTop: 10 }}>
            10 especialistas.<br />1 investimento.
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 100, border: "1px solid rgba(185,255,75,.2)", background: "rgba(185,255,75,.06)" }}>
            <div className="cl-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: LIME }} />
            <span style={{ fontFamily: mono, fontSize: 11, color: LIME }}>Todos online agora</span>
          </div>
          <button
            onClick={() => setPaused(p => !p)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 100, border: `1px solid ${paused ? "rgba(185,255,75,.35)" : "rgba(255,255,255,.1)"}`, background: paused ? "rgba(185,255,75,.08)" : "transparent", cursor: "pointer", transition: "all .2s" }}>
            <span style={{ fontSize: 13 }}>{paused ? "▶" : "⏸"}</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: paused ? LIME : MUTED }}>{paused ? "retomar" : "pausar"}</span>
          </button>
          {/* Arrows */}
          <div style={{ display: "flex", gap: 8 }}>
            {["←", "→"].map((arrow, dir) => (
              <button key={arrow} onClick={() => scrollTo(active + (dir === 0 ? -1 : 1))}
                style={{ width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,.12)", background: "transparent", color: OFF, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color .2s, background .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = LIME; (e.currentTarget as HTMLButtonElement).style.background = `${LIME}12`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,.12)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                {arrow}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Track */}
      <div ref={trackRef} onScroll={onScroll} className="cl-track"
        onClick={() => setPaused(p => !p)}
        style={{ display: "flex", gap: GAP, scrollSnapType: "x mandatory", padding: "4px 64px 36px", cursor: paused ? "pointer" : "default" } as React.CSSProperties}>
        {TEAM.map((t, idx) => {
          const on = idx === active;
          const h = hov === idx && !on; // hovered but not the scroll-active card
          const lit = on || h;
          return (
            <div key={t.i}
              onMouseEnter={() => setHov(idx)}
              onMouseLeave={() => setHov(null)}
              style={{
                flexShrink: 0, width: CARD_W, scrollSnapAlign: "start",
                borderRadius: 22, padding: "36px 28px",
                display: "flex", flexDirection: "column" as const, minHeight: 460,
                position: "relative", overflow: "hidden",
                background: on ? `${t.color}0F` : h ? `${t.color}08` : "rgba(255,255,255,.022)",
                border: `1px solid ${on ? `${t.color}65` : h ? `${t.color}45` : "rgba(255,255,255,.07)"}`,
                boxShadow: on
                  ? `0 0 0 1px ${t.color}1A, 0 24px 72px -24px ${t.color}70, inset 0 1px 0 ${t.color}20`
                  : h ? `0 0 0 1px ${t.color}12, 0 16px 48px -20px ${t.color}50, inset 0 1px 0 ${t.color}14`
                  : "inset 0 1px 0 rgba(255,255,255,.04)",
                transform: on ? "translateY(-6px) scale(1.018)" : h ? "translateY(-3px) scale(1.008)" : "translateY(0) scale(1)",
                transition: "background .3s, border-color .3s, box-shadow .3s, transform .3s cubic-bezier(.22,.68,0,1.2)",
                zIndex: on ? 2 : h ? 2 : 1,
              }}>

              {/* Glow blob */}
              <div style={{
                position: "absolute", top: -80, right: -80,
                width: 280, height: 280, borderRadius: "50%",
                background: `radial-gradient(circle, ${t.color}${on ? "22" : h ? "14" : "05"} 0%, transparent 68%)`,
                filter: "blur(36px)", pointerEvents: "none",
                transition: "background .35s",
              }} />

              {/* Avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: 18,
                background: on ? `${t.color}28` : h ? `${t.color}22` : `${t.color}18`,
                border: `2px solid ${on ? t.color : h ? `${t.color}80` : `${t.color}45`}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 800, color: t.color,
                marginBottom: 24, flexShrink: 0, position: "relative",
                boxShadow: on ? `0 0 32px -6px ${t.color}90, inset 0 1px 0 ${t.color}35`
                  : h ? `0 0 22px -6px ${t.color}65` : "none",
                transition: "background .3s, border-color .3s, box-shadow .3s",
              }}>{t.i}</div>

              {/* Identity */}
              <div style={{ fontFamily: mono, fontSize: 10, color: t.color, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: 6, opacity: lit ? 1 : 0.55, transition: "opacity .3s" }}>Agente especialista</div>
              <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1, marginBottom: 4, color: lit ? OFF : "rgba(240,239,232,.5)", transition: "color .3s" }}>{t.name}</h3>
              <div style={{ fontFamily: mono, fontSize: 11, color: lit ? t.color : MUTED, marginBottom: 20, transition: "color .3s" }}>{t.role}</div>

              {/* Desc */}
              <p style={{ fontSize: 14, color: lit ? "rgba(240,239,232,.68)" : "rgba(240,239,232,.28)", lineHeight: 1.7, marginBottom: 24, flexGrow: 1, transition: "color .3s" }}>{t.desc}</p>

              {/* Tasks */}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 24 }}>
                {t.tasks.map(task => (
                  <div key={task} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: lit ? t.color : "rgba(255,255,255,.15)", flexShrink: 0, boxShadow: lit ? `0 0 6px ${t.color}` : "none", transition: "background .3s, box-shadow .3s" }} />
                    <span style={{ fontSize: 13, color: lit ? "rgba(240,239,232,.65)" : "rgba(240,239,232,.25)", fontWeight: 500, transition: "color .3s" }}>{task}</span>
                  </div>
                ))}
              </div>

              {/* Status */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 20, borderTop: `1px solid ${on ? `${t.color}25` : h ? `${t.color}18` : "rgba(255,255,255,.06)"}`, transition: "border-color .3s" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: LIME, boxShadow: on ? `0 0 10px ${LIME}` : "none", transition: "box-shadow .4s" }} />
                <span style={{ fontFamily: mono, fontSize: 10, color: LIME }}>trabalhando agora</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
        {TEAM.map((_, i) => (
          <button key={i} onClick={() => scrollTo(i)}
            style={{ width: i === active ? 24 : 7, height: 7, borderRadius: 100, background: i === active ? LIME : "rgba(255,255,255,.2)", border: "none", cursor: "pointer", padding: 0, transition: "width .3s, background .3s" }} />
        ))}
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 44);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="cl" style={{ fontFamily: syne, background: BLACK, color: OFF, minHeight: "100vh" }}>
      <style>{CSS}</style>

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        height: 58, padding: "0 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(8,8,8,.92)" : "transparent",
        backdropFilter: scrolled ? "blur(18px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,.06)" : "none",
        transition: "background .3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <img src={caluLogo} alt="Calu Agência" style={{ width: 28, height: 28, borderRadius: 7, objectFit: "cover" }} />
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Calu Agência</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {[["Serviços","#servicos"],["Processo","#processo"],["Soluções IA","#solucoes"],["Time","#time"],["Contato","#contato"]].map(([l,h]) => (
            <a key={l} href={h} className="cl-link" style={{ fontSize: 13, color: DIM, fontWeight: 500 }}>{l}</a>
          ))}
          <a href="/briefing" className="cl-pill"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, padding: "7px 16px", borderRadius: 100, background: LIME, color: BLACK, whiteSpace: "nowrap" }}>
            <Zap size={11} /> Diagnóstico IA
          </a>
          <a href="https://wa.me/5585986408404" target="_blank" rel="noreferrer" className="cl-pill"
            style={{ fontSize: 13, fontWeight: 700, color: BLACK, background: LIME, padding: "7px 18px", borderRadius: 100 }}>
            Começar agora
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 64px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "28%", right: "8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(185,255,75,.07) 0%, transparent 65%)", filter: "blur(40px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr 400px", gap: 56, alignItems: "center" }}>
          <div>
            <div className="cl-a1" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
              <div className="cl-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: LIME }} />
              <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Publicidade · Tecnologia · IA</span>
            </div>

            <h1 className="cl-a2" style={{ fontSize: "clamp(34px, 5.2vw, 68px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.045em", marginBottom: 24 }}>
              Criatividade<br />que vende.<br /><span style={{ color: LIME }}>IA que escala.</span>
            </h1>

            <p className="cl-a3" style={{ fontSize: 17, color: DIM, lineHeight: 1.65, maxWidth: 500, marginBottom: 36 }}>
              A Calu Agência une estratégia criativa de alta performance com tecnologia de IA proprietária — para sua marca crescer sem limite de equipe ou orçamento.
            </p>

            <div className="cl-a4" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 52 }}>
              <a href="https://wa.me/5585986408404" target="_blank" rel="noreferrer" className="cl-pill"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: LIME, color: BLACK, fontWeight: 700, fontSize: 14, padding: "13px 26px", borderRadius: 100, boxShadow: "0 0 28px rgba(185,255,75,.2)" }}>
                <MessageCircle size={15} /> Fale conosco
              </a>
              <a href="#servicos" className="cl-pill"
                style={{ display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid rgba(255,255,255,.12)", color: DIM, fontSize: 14, fontWeight: 500, padding: "13px 22px", borderRadius: 100 }}>
                Ver serviços <ArrowRight size={14} />
              </a>
            </div>

            <div className="cl-a5" style={{ display: "flex", gap: 0, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,.06)" }}>
              {[{ n:"14", l:"clientes ativos" },{ n:"3.8×", l:"ROAS médio" },{ n:"R$ 2.4M", l:"em vendas geradas" }].map((s, i) => (
                <div key={s.n} style={{ paddingRight: i < 2 ? 32 : 0, paddingLeft: i > 0 ? 32 : 0, borderRight: i < 2 ? "1px solid rgba(255,255,255,.06)" : "none" }}>
                  <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: MUTED, marginTop: 5 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent card */}
          <div className="cl-a3">
            <HeroAgentCard />
          </div>
        </div>

        <div className="cl-bob" style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,.15))" }} />
          <span style={{ fontFamily: mono, fontSize: 9, color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase" }}>scroll</span>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ background: LIME, overflow: "hidden", padding: "13px 0" }}>
        <div style={{ display: "flex", width: "max-content", animation: "cl-tick 26s linear infinite" }}>
          {[...TICKER,...TICKER,...TICKER,...TICKER,...TICKER].map((t, i) => (
            <span key={i} style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: BLACK, whiteSpace: "nowrap", padding: "0 28px" }}>
              {t} <span style={{ opacity: .3 }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* PROCESS TIMELINE */}
      <ProcessTimeline />

      {/* MARKETING + IA */}
      <section style={{ padding: "100px 64px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Como funciona</span>
            <h2 style={{ fontSize: "clamp(22px, 3.2vw, 42px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.04em", marginTop: 10 }}>
              Marketing executado<br /><span style={{ color: LIME }}>por inteligência artificial.</span>
            </h2>
            <p style={{ fontSize: 16, color: DIM, lineHeight: 1.65, marginTop: 16, maxWidth: 540, margin: "16px auto 0" }}>
              Cada post, anúncio, artigo e campanha passa por um time de 10 agentes especializados — trabalhando em paralelo, 24 horas por dia, sem parar.
            </p>
          </div>

          {/* Flow */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2, marginBottom: 64 }}>
            {[
              { agent: "Queila",   role: "Estratégia",   color: "#FBBF24", desc: "Define o que dizer, para quem e quando", icon: "01" },
              { agent: "Beatriz",  role: "Copy & Texto", color: "#A78BFA", desc: "Escreve cada palavra para converter",    icon: "02" },
              { agent: "Marcela",  role: "Design",       color: "#D946EF", desc: "Cria os visuais alinhados à sua marca", icon: "03" },
              { agent: "Rafaela",  role: "Tráfego Pago", color: "#F97316", desc: "Distribui com ROAS máximo",             icon: "04" },
              { agent: "Marina",   role: "Publicação",   color: "#60A5FA", desc: "Publica, monitora e responde",          icon: "05" },
            ].map((s, i) => (
              <div key={i} style={{ position: "relative" }}>
                {i < 4 && (
                  <div style={{ position: "absolute", top: 28, right: -1, width: 2, height: 28, background: `linear-gradient(to bottom, ${s.color}60, transparent)`, zIndex: 1 }} />
                )}
                <div style={{ padding: "24px 20px", background: "rgba(255,255,255,.025)", border: `1px solid ${s.color}25`, borderRadius: 14, height: "100%" }}>
                  <div style={{ fontFamily: mono, fontSize: 10, color: s.color, marginBottom: 12, letterSpacing: "0.06em" }}>{s.icon} · {s.agent}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: OFF, letterSpacing: "-0.02em", marginBottom: 8 }}>{s.role}</div>
                  <p style={{ fontSize: 13, color: DIM, lineHeight: 1.55 }}>{s.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 16 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.color }} />
                    <span style={{ fontFamily: mono, fontSize: 9, color: s.color }}>ativo agora</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Result bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { label: "Estratégia → Publicação",  value: "em até 48h",         color: LIME      },
              { label: "Ciclo de aprovação",        value: "via portal do cliente", color: "#A78BFA" },
              { label: "Relatório de performance",  value: "semanal, automático",   color: "#34D399" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", border: `1px solid ${r.color}20`, borderRadius: 12, background: `${r.color}06` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, color: r.color, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{r.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: OFF, letterSpacing: "-0.02em" }}>{r.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="servicos" style={{ padding: "100px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56 }}>
            <div>
              <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>O que fazemos</span>
              <h2 style={{ fontSize: "clamp(22px, 3.2vw, 42px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.04em", marginTop: 10 }}>
                Tudo que sua marca<br />precisa, em um lugar.
              </h2>
            </div>
            <p style={{ fontSize: 15, color: DIM, maxWidth: 260, lineHeight: 1.65, textAlign: "right" }}>
              Serviços integrados que trabalham juntos para crescer seu negócio.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 18, overflow: "hidden" }}>
            {SERVICES.map((s, i) => (
              <div key={s.n} className="cl-card"
                style={{ padding: "34px 28px", background: BLACK, borderRight: i%3!==2?"1px solid rgba(255,255,255,.07)":"none", borderBottom: i<3?"1px solid rgba(255,255,255,.07)":"none" }}>
                <div style={{ fontFamily: mono, fontSize: 11, color: LIME, marginBottom: 16, letterSpacing: "0.06em" }}>{s.n}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI SOLUTIONS */}
      <section id="solucoes" style={{ padding: "100px 64px", background: "#0C0C0C", borderTop: "1px solid rgba(255,255,255,.05)", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 60 }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Soluções com IA</span>
            <h2 style={{ fontSize: "clamp(22px, 3.2vw, 42px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.04em", marginTop: 10 }}>
              Tecnologia que<br />trabalha por você.
            </h2>
            <p style={{ fontSize: 15, color: DIM, lineHeight: 1.65, marginTop: 12, maxWidth: 520 }}>
              Cada produto foi desenvolvido para um nicho específico — resolvendo problemas reais de segmentos que a tecnologia genérica não atende.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {PRODUCTS.map(p => (
              <div key={p.name} className="cl-prod" style={{ borderRadius: 20, background: "rgba(255,255,255,.025)", border: `1px solid ${p.color}20`, padding: "34px 28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: p.color }} />
                <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, color: p.color, background: `${p.color}15`, border: `1px solid ${p.color}30`, padding: "4px 12px", borderRadius: 100, letterSpacing: "0.1em", textTransform: "uppercase", display: "inline-block", marginBottom: 22 }}>{p.tag}</span>
                <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>{p.name}</h3>
                <div style={{ fontFamily: mono, fontSize: 11, color: p.color, marginBottom: 18 }}>{p.sub}</div>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.7, marginBottom: 24 }}>{p.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 30 }}>
                  {p.items.map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "rgba(240,239,232,.48)", fontWeight: 500 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <a href="https://wa.me/5585986408404" target="_blank" rel="noreferrer" className="cl-pill"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: p.color, background: `${p.color}10`, border: `1px solid ${p.color}28`, padding: "9px 18px", borderRadius: 100 }}>
                  Saber mais <ArrowUpRight size={13} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM CAROUSEL */}
      <TeamCarousel />

      {/* PROCESS */}
      <section style={{ padding: "100px 64px", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 56 }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Como funciona</span>
            <h2 style={{ fontSize: "clamp(22px, 3.2vw, 42px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.04em", marginTop: 10 }}>
              Do briefing<br />aos resultados.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 28 }}>
            {[
              { n:"01", t:"Briefing",   d:"Uma conversa sobre seu negócio, público, metas e tom de voz." },
              { n:"02", t:"Estratégia", d:"Em até 48h, plano editorial, campanhas e calendário prontos." },
              { n:"03", t:"Execução",   d:"Conteúdo, design, ads e automações rodando em paralelo." },
              { n:"04", t:"Resultados", d:"Relatórios semanais com métricas reais e ajustes contínuos." },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ width: 52, height: 52, borderRadius: 13, background: i===0 ? LIME : "rgba(185,255,75,.1)", border: `1px solid ${i===0?"transparent":"rgba(185,255,75,.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 22 }}>
                  <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: i===0 ? BLACK : LIME }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 10 }}>{s.t}</h3>
                <p style={{ fontSize: 14, color: DIM, lineHeight: 1.65 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SAVINGS */}
      <section style={{ padding: "100px 64px", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>
          <div>
            <span style={{ fontFamily: mono, fontSize: 11, color: LIME, letterSpacing: "0.1em", textTransform: "uppercase" }}>Por que faz sentido</span>
            <h2 style={{ fontSize: "clamp(20px, 3vw, 38px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.04em", marginTop: 10, marginBottom: 16 }}>
              Economize<br /><span style={{ color: LIME }}>R$ {fmt(39500)}+</span><br />por mês.
            </h2>
            <p style={{ fontSize: 15, color: DIM, lineHeight: 1.65, marginBottom: 28 }}>
              Uma equipe completa custa entre <strong style={{ color: OFF }}>R$ {fmt(39500)}</strong> e <strong style={{ color: OFF }}>R$ {fmt(79500)}</strong>/mês em salários — sem contar encargos e ferramentas.
            </p>
            <a href="https://wa.me/5585986408404" target="_blank" rel="noreferrer" className="cl-pill"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, background: LIME, color: BLACK, fontWeight: 700, fontSize: 14, padding: "11px 22px", borderRadius: 100 }}>
              Quero saber o valor <ArrowUpRight size={14} />
            </a>
          </div>

          <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: mono, fontSize: 10, color: MUTED }}>PROFISSIONAL</span>
              <span style={{ fontFamily: mono, fontSize: 10, color: MUTED }}>SALÁRIO / MÊS</span>
            </div>
            {[
              ["Gerente de Marketing Sênior",   "R$ 8.000–14.000"],
              ["Copywriter / Redator",           "R$ 5.000–8.000" ],
              ["Designer Gráfico",               "R$ 5.000–9.000" ],
              ["Especialista em Tráfego Pago",   "R$ 5.000–9.000" ],
              ["Social Media",                   "R$ 3.500–5.500" ],
              ["Analista de Marketing",          "R$ 4.500–7.000" ],
              ["SDR / Pré-vendedor",             "R$ 3.500–6.000" ],
              ["Web Designer / Dev WordPress",   "R$ 4.000–6.500" ],
              ["Revisora de Conteúdo",           "R$ 2.500–4.000" ],
            ].map(([r, v], i, arr) => (
              <div key={i} className="cl-card" style={{ padding: "11px 18px", borderBottom: i<arr.length-1?"1px solid rgba(255,255,255,.04)":"none", display: "flex", justifyContent: "space-between", alignItems: "center", background: BLACK }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Check size={11} color={LIME} strokeWidth={2.5} />
                  <span style={{ fontSize: 13, color: "rgba(240,239,232,.5)", fontWeight: 500 }}>{r}</span>
                </div>
                <span style={{ fontFamily: mono, fontSize: 11, color: "rgba(240,239,232,.28)" }}>{v}</span>
              </div>
            ))}
            <div style={{ padding: "13px 18px", background: `${LIME}10`, borderTop: `1px solid ${LIME}20`, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: LIME }}>Total estimado</span>
              <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: LIME }}>R$ {fmt(39500)}+/mês</span>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section id="resultados" style={{ padding: "80px 64px", background: LIME }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
          {[{ n:"14", l:"Clientes ativos" },{ n:"3.8×", l:"ROAS médio" },{ n:"94", l:"Posts/mês por cliente" },{ n:"30 dias", l:"Para ver resultados" }].map((s, i) => (
            <div key={i} style={{ padding: "8px 0", paddingRight: i<3?40:0, paddingLeft: i>0?40:0, borderRight: i<3?"1px solid rgba(8,8,8,.15)":"none" }}>
              <div style={{ fontSize: "clamp(36px, 4vw, 58px)", fontWeight: 800, color: BLACK, letterSpacing: "-0.05em", lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontFamily: mono, fontSize: 12, color: "rgba(8,8,8,.5)", marginTop: 8 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="contato" style={{ padding: "72px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", background: LIME, borderRadius: 22, padding: "60px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 36 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "rgba(8,8,8,.38)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Pronto para escalar?</div>
            <h2 style={{ fontFamily: syne, fontSize: "clamp(18px, 2.5vw, 34px)", fontWeight: 800, color: BLACK, lineHeight: 1.08, letterSpacing: "-0.04em" }}>
              Seu time completo<br />começa hoje.
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
            <a href="/briefing" className="cl-pill"
              style={{ display: "inline-flex", alignItems: "center", gap: 9, background: BLACK, color: LIME, fontWeight: 700, fontSize: 14, padding: "13px 26px", borderRadius: 100, whiteSpace: "nowrap" }}>
              <Zap size={15} /> Diagnóstico gratuito com IA
            </a>
            <a href="https://wa.me/5585986408404" target="_blank" rel="noreferrer" className="cl-pill"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(8,8,8,.1)", color: BLACK, fontWeight: 600, fontSize: 13, padding: "11px 26px", borderRadius: 100 }}>
              <MessageCircle size={14} /> Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "32px 64px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <img src={caluLogo} alt="Calu Agência" style={{ width: 26, height: 26, borderRadius: 7, objectFit: "cover" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.02em" }}>Calu Agência</div>
              <div style={{ fontFamily: mono, fontSize: 9, color: MUTED }}>Publicidade · Tecnologia · IA · São Paulo</div>
            </div>
          </div>
          <div style={{ fontFamily: mono, fontSize: 9, color: "rgba(240,239,232,.18)" }}>© {new Date().getFullYear()} Calu Agência</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[Instagram, Linkedin, MessageCircle].map((Icon, i) => (
              <a key={i} href="#" className="cl-social"
                style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,.09)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={13} color={DIM} />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
