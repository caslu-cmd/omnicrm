import caluLogo from "@/assets/calu-logo.png";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Zap, ArrowUpRight, MessageCircle, Instagram, Linkedin, ArrowRight, Check, Menu, X } from "lucide-react";

/**
 * Landing page da Calu — sistema "Noir Volt".
 *
 * Preto profundo, verde-limão elétrico, Syne nos títulos, Manrope no texto,
 * DM Mono nos rótulos. Grade editorial fluida: tipografia em clamp(), padding
 * lateral em função da viewport, grids que colapsam sem `!important`, menu
 * de verdade no celular. Conteúdo e interações (card do time no hero, linha
 * do tempo do processo, carrossel do time) são os mesmos de antes — só a
 * casa mudou.
 */

const LIME  = "#B9FF4B";
const BLACK = "#080808";
const OFF   = "#F0EFE8";
const MUTED = "#6B6B6B";
const DIM   = "rgba(240,239,232,0.5)";
const WA    = "https://wa.me/5585986408404";

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
    tag: "CRM", name: "OmniCRM", sub: "Para agências e negócios locais", color: LIME,
    desc: "Todos os canais do seu cliente em um lugar — WhatsApp, Instagram, e-mail, site. Pipeline visual para fechar mais negócios com menos esforço.",
    items: ["Inbox unificado", "Pipeline de vendas", "Automações de follow-up", "Relatórios em tempo real"],
  },
  {
    tag: "Saúde", name: "Posture.AI", sub: "Para fisioterapeutas, personal trainers e estúdios", color: "#A78BFA",
    desc: "Tire uma foto e receba análise postural completa em segundos. IA treinada com 50 mil avaliações que identifica desalinhamentos, gera relatórios em PDF e acompanha a evolução de cada aluno.",
    items: ["Análise postural com IA", "Gestão completa de alunos", "Relatórios PDF profissionais", "Ficha de anamnese digital"],
  },
  {
    tag: "RH", name: "RH Inteligente", sub: "Para empresas em crescimento com time em expansão", color: "#34D399",
    desc: "Do recrutamento ao onboarding, a IA assume o operacional para seu RH focar no que mais importa: as pessoas.",
    items: ["Triagem automática de currículos", "Onboarding digital", "Avaliações de desempenho", "People analytics"],
  },
];

const TEAM = [
  { i: "Ai", name: "Aira",     role: "Orquestradora Geral",       color: LIME,      desc: "Coordena todo o time em tempo real, define prioridades e garante que cada entrega saia no prazo e com qualidade. É o cérebro que conecta todos os agentes.", tasks: ["Orquestração do time", "Controle de prazos", "Briefing automatizado", "Relatório executivo"] },
  { i: "Q",  name: "Queila",   role: "Estrategista de Marca",     color: "#FBBF24", desc: "Define o posicionamento, a pauta editorial e a direção criativa da marca. Cria o mapa de conteúdo mensal e garante consistência de mensagem em todos os canais.", tasks: ["Pauta editorial mensal", "Posicionamento de marca", "Análise de concorrência", "Direção criativa"] },
  { i: "B",  name: "Beatriz",  role: "Copywriter & Redatora",     color: "#A78BFA", desc: "Escreve cada legenda, artigo, e-mail e anúncio com foco em conversão. Seu copy tem personalidade, clareza e intenção — porque cada palavra tem um objetivo.", tasks: ["Legendas e posts", "Artigos e blog", "Roteiros de vídeo", "Copy de anúncios"] },
  { i: "M",  name: "Marcela",  role: "Designer Visual",           color: "#D946EF", desc: "Cria todos os visuais da marca — posts, stories, banners, apresentações e peças de campanha. Cada pixel alinhado ao manual de identidade da empresa.", tasks: ["Posts e stories", "Banners e anúncios", "Apresentações", "Identidade visual"] },
  { i: "R",  name: "Rafaela",  role: "Gestora de Tráfego Pago",   color: "#F97316", desc: "Gerencia campanhas no Meta Ads e Google Ads com foco em ROAS alto e CPA que faz sentido. Testa, otimiza e escala o que funciona — todos os dias.", tasks: ["Meta Ads (FB/IG)", "Google Ads", "Remarketing", "Otimização de verba"] },
  { i: "Ma", name: "Marina",   role: "Social Media Manager",      color: "#60A5FA", desc: "Agenda, publica e monitora todo o conteúdo orgânico. Responde comentários, monitora menções e mantém sua marca ativa e presente em todos os momentos.", tasks: ["Agendamento de posts", "Engajamento", "Monitoramento", "Relatório semanal"] },
  { i: "P",  name: "Pedro",    role: "Calendário Editorial",      color: "#2DD4BF", desc: "Planeja e organiza todo o calendário editorial — semanas, meses e campanhas sazonais. Cada post no lugar certo, na hora certa, com o pilar de conteúdo adequado.", tasks: ["Calendário mensal", "Pilares de conteúdo", "Datas estratégicas", "Cronograma de campanhas"] },
  { i: "L",  name: "Lucas",    role: "Analista de Dados",         color: "#34D399", desc: "Transforma números em decisões. Monitora métricas de tráfego, engajamento e vendas, e entrega relatórios com insights claros e ações recomendadas.", tasks: ["Dashboards de resultado", "Google Analytics", "Relatórios semanais", "Insights estratégicos"] },
  { i: "E",  name: "Eduardo",  role: "Agente de Vendas & CRM",    color: "#F59E0B", desc: "Qualifica leads via WhatsApp, alimenta o CRM e garante que nenhum contato seja perdido. Do primeiro 'oi' até o fechamento do contrato.", tasks: ["Qualificação de leads", "Follow-up automatizado", "Gestão do CRM", "Relatório de pipeline"] },
  { i: "T",  name: "Teo",      role: "Web Designer & SEO",        color: "#06B6D4", desc: "Mantém seu site atualizado, publica no blog e otimiza cada página para os buscadores. Mais visibilidade orgânica, mais clientes chegando até você.", tasks: ["Atualização de site", "SEO on-page", "Blog e artigos", "Landing pages"] },
  { i: "V",  name: "Vitória",  role: "Revisora de Conteúdo",      color: "#EC4899", desc: "Revisa e corrige 100% do conteúdo antes de publicar. Gramática, tom de voz, consistência de marca — zero erros, zero vergonha.", tasks: ["Revisão gramatical", "Tom de voz", "Checagem de fatos", "Aprovação final"] },
  { i: "Be", name: "Ben",      role: "Especialista em Tendências", color: "#B9FF4B", desc: "Pesquisa o Google Trends Brasil em tempo real e entrega tendências do momento, queries em crescimento e ideias de conteúdo baseadas em dados reais — antes de qualquer produção.", tasks: ["Google Trends em tempo real", "Queries em crescimento", "Ideias de conteúdo viral", "Hashtags estratégicas"] },
];

const TICKER = [
  "Criatividade que vende", "IA que escala", "Do briefing à publicação",
  "OmniCRM", "Posture.AI", "RH Inteligente", "Fortaleza · Brasil",
  "Fila de aprovação", "Marketing 24h", "Estratégia que decide",
];

const PROCESS = [
  { n: "01", title: "Briefing IA",  duration: "30 min",   output: "Diagnóstico completo",       color: "#38BDF8", agents: [{ i: "L",  color: "#38BDF8", name: "Lia" }], desc: "Lia coleta briefing via conversa natural com IA, analisa concorrência e entrega um diagnóstico de marketing personalizado.", details: ["Formulário inteligente de onboarding", "Análise automática da concorrência", "Mapa de oportunidades da marca", "Briefing consolidado para o time"] },
  { n: "02", title: "Estratégia",   duration: "2h",       output: "Pauta editorial mensal",     color: "#FBBF24", agents: [{ i: "Be", color: LIME, name: "Ben" }, { i: "Q", color: "#FBBF24", name: "Queila" }, { i: "P", color: "#2DD4BF", name: "Pedro" }], desc: "Ben pesquisa o Google Trends Brasil e entrega as tendências do momento. Queila usa esses dados para definir posicionamento e direção criativa. Pedro monta o calendário editorial estratégico para o mês.", details: ["Tendências reais do Google Trends", "Pauta editorial 30 dias", "Posicionamento e tom de voz", "Calendário de campanhas"] },
  { n: "03", title: "Produção",     duration: "48h",      output: "Todos os assets criados",    color: "#A78BFA", agents: [{ i: "B", color: "#A78BFA", name: "Beatriz" }, { i: "M", color: "#D946EF", name: "Marcela" }, { i: "Bo", color: LIME, name: "Bobby" }], desc: "Beatriz escreve copy, Marcela cria os visuais e Bobby edita os vídeos — cada um em cima do trabalho do outro, sem retrabalho.", details: ["Copy para posts, reels e anúncios", "Peças visuais e templates", "Vídeos editados e formatados", "Assets aprovados para revisão"] },
  { n: "04", title: "Revisão",      duration: "4h",       output: "Zero erros garantido",       color: "#EC4899", agents: [{ i: "V", color: "#EC4899", name: "Vitória" }], desc: "Vitória revisa 100% do conteúdo antes de qualquer aprovação — gramática, tom de voz, consistência de marca e checagem de fatos.", details: ["Revisão ortográfica e gramatical", "Checagem de tom de voz", "Consistência com o manual da marca", "Aprovação final para o cliente"] },
  { n: "05", title: "Aprovação",    duration: "24h",      output: "Feedback do cliente",        color: LIME,      agents: [{ i: "Ai", color: LIME, name: "Aira" }], desc: "O cliente aprova tudo via portal exclusivo — vê os posts, sugere ajustes e aprova com um clique. Aira gerencia o fluxo de aprovação e sincroniza o time.", details: ["Portal de aprovação do cliente", "Comentários em cada peça", "Histórico de revisões", "Aprovação com um clique"] },
  { n: "06", title: "Publicação",   duration: "contínuo", output: "Presença diária nas redes",  color: "#60A5FA", agents: [{ i: "Ma", color: "#60A5FA", name: "Marina" }, { i: "T", color: "#06B6D4", name: "Teo" }], desc: "Marina publica nos horários de maior engajamento e monitora comentários. Teo mantém o site e o blog atualizados com SEO otimizado.", details: ["Agendamento automático otimizado", "Publicação em todas as plataformas", "Monitoramento de comentários", "Blog e site atualizados"] },
  { n: "07", title: "Tráfego Pago", duration: "24/7",     output: "ROAS maximizado",            color: "#F97316", agents: [{ i: "R", color: "#F97316", name: "Rafaela" }, { i: "E", color: "#F59E0B", name: "Eduardo" }], desc: "Rafaela ativa e otimiza campanhas no Meta e Google. Eduardo qualifica os leads que chegam via WhatsApp e alimenta o pipeline.", details: ["Meta Ads e Google Ads ativos", "Remarketing configurado", "Qualificação de leads no CRM", "Otimização diária de verbas"] },
  { n: "08", title: "Relatório",    duration: "semanal",  output: "Insights + próximos passos", color: "#34D399", agents: [{ i: "L", color: "#34D399", name: "Lucas" }, { i: "Ai", color: LIME, name: "Aira" }], desc: "Lucas entrega relatório semanal com métricas reais. Aira consolida os dados e gera recomendações estratégicas para o próximo ciclo.", details: ["Dashboard de performance em tempo real", "Relatório semanal", "Análise de ROI por canal", "Recomendações para o próximo mês"] },
];

const FLOW = [
  { agent: "Queila",  role: "Estratégia",   color: "#FBBF24", desc: "Define o que dizer, para quem e quando" },
  { agent: "Beatriz", role: "Copy & Texto", color: "#A78BFA", desc: "Escreve cada palavra para converter" },
  { agent: "Marcela", role: "Design",       color: "#D946EF", desc: "Cria os visuais alinhados à sua marca" },
  { agent: "Rafaela", role: "Tráfego Pago", color: "#F97316", desc: "Distribui com ROAS máximo" },
  { agent: "Marina",  role: "Publicação",   color: "#60A5FA", desc: "Publica, monitora e responde" },
];

const SALARIES: Array<[string, string]> = [
  ["Gerente de Marketing Sênior", "R$ 8.000–14.000"],
  ["Copywriter / Redator",        "R$ 5.000–8.000"],
  ["Designer Gráfico",            "R$ 5.000–9.000"],
  ["Especialista em Tráfego",     "R$ 5.000–9.000"],
  ["Social Media",                "R$ 3.500–5.500"],
  ["Analista de Marketing",       "R$ 4.500–7.000"],
  ["SDR / Pré-vendedor",          "R$ 3.500–6.000"],
  ["Web Designer / WordPress",    "R$ 4.000–6.500"],
  ["Revisora de Conteúdo",        "R$ 2.500–4.000"],
];

const fmt = (n: number) => n.toLocaleString("pt-BR");

/* ─────────────────────────────────────────────────────────────────────────────
   CSS — mobile-first, sem !important. Tudo que é layout mora aqui; inline só
   entra cor dinâmica por agente.
   ───────────────────────────────────────────────────────────────────────── */
const CSS = `
  .cl { --lime:${LIME}; --off:${OFF}; --dim:${DIM}; --muted:${MUTED};
        --pad: clamp(20px, 5vw, 64px); --w: 1200px;
        --font-display: 'Syne', 'Manrope', sans-serif;
        --font-body: 'Manrope', 'Inter', system-ui, sans-serif;
        --font-mono: 'DM Mono', ui-monospace, monospace;
        font-family: var(--font-body); -webkit-font-smoothing: antialiased; }
  .cl *, .cl *::before, .cl *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .cl a { text-decoration: none; color: inherit; }
  .cl button { font: inherit; color: inherit; }
  .cl h1, .cl h2, .cl h3, .cl h4 { font-family: var(--font-display); letter-spacing: -0.04em; line-height: 1.02; overflow-wrap: normal; }
  .cl-mono { font-family: var(--font-mono); letter-spacing: .1em; text-transform: uppercase; font-size: 11px; }
  .cl-wrap { max-width: var(--w); margin: 0 auto; padding-left: var(--pad); padding-right: var(--pad); }
  .cl-section { padding-top: clamp(64px, 10vw, 120px); padding-bottom: clamp(64px, 10vw, 120px); }
  .cl-eyebrow { display:inline-flex; align-items:center; gap:8px; color: var(--lime); }
  .cl-h2 { font-size: clamp(30px, 4.6vw, 54px); font-weight: 800; margin-top: 14px; }
  .cl-lede { font-size: clamp(15px, 1.4vw, 18px); color: var(--dim); line-height: 1.65; margin-top: 16px; max-width: 560px; }
  .cl-head { display:flex; flex-direction:column; gap: 12px; margin-bottom: clamp(36px, 5vw, 64px); }
  @media (min-width: 900px) { .cl-head.is-split { flex-direction: row; align-items: flex-end; justify-content: space-between; } .cl-head.is-split .cl-lede { text-align: right; margin-top: 0; max-width: 300px; } }

  /* grain + atmosfera */
  .cl-grain { position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: .35; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.4'/%3E%3C/svg%3E"); }
  .cl-glow { position:absolute; border-radius:50%; pointer-events:none; filter: blur(60px); }

  /* NAV */
  .cl-nav { position: fixed; inset: 0 0 auto 0; z-index: 200; height: 64px; display:flex; align-items:center; transition: background .3s, border-color .3s, backdrop-filter .3s; border-bottom: 1px solid transparent; }
  .cl-nav.is-scrolled { background: rgba(8,8,8,.86); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-color: rgba(255,255,255,.06); }
  .cl-nav-in { width:100%; display:flex; align-items:center; justify-content:space-between; gap: 16px; }
  .cl-brand { display:flex; align-items:center; gap:10px; font-family: var(--font-display); font-weight: 700; font-size: 15px; letter-spacing: -0.02em; }
  .cl-brand img { width: 30px; height: 30px; border-radius: 8px; object-fit: cover; }
  .cl-links { display:none; align-items:center; gap: 26px; }
  .cl-links a { font-size: 13px; font-weight: 600; color: var(--dim); transition: color .18s; }
  .cl-links a:hover { color: var(--lime); }
  .cl-burger { display:inline-flex; width: 42px; height: 42px; align-items:center; justify-content:center; border-radius: 12px; border:1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.03); cursor:pointer; }
  @media (min-width: 960px) { .cl-links { display:flex; } .cl-burger { display:none; } }
  .cl-menu { position: fixed; inset: 0; z-index: 190; background: #080808; isolation: isolate; display:flex; flex-direction:column; justify-content:center; padding: 96px var(--pad) 40px; gap: 6px; animation: cl-fade .25s ease both; }
  .cl-menu a { font-family: var(--font-display); font-size: clamp(30px, 8vw, 44px); font-weight: 800; letter-spacing: -0.04em; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.06); color: var(--off); }
  .cl-menu a:hover { color: var(--lime); }
  .cl-menu-cta { margin-top: 24px; display:flex; flex-direction: column; gap: 10px; }
  .cl-menu-cta a { font-size: 15px; border: none; padding: 0; }

  /* botões */
  .cl-btn { display:inline-flex; align-items:center; justify-content:center; gap: 9px; border-radius: 100px; font-weight: 700; font-size: 14px; padding: 13px 24px; white-space: nowrap; transition: transform .18s, box-shadow .18s, background .18s, border-color .18s; cursor:pointer; border: 1px solid transparent; }
  .cl-btn:hover { transform: translateY(-1px); }
  .cl-btn-lime { background: var(--lime); color: ${BLACK}; box-shadow: 0 0 28px rgba(185,255,75,.18); }
  .cl-btn-lime:hover { box-shadow: 0 0 36px rgba(185,255,75,.35); }
  .cl-btn-ghost { border-color: rgba(255,255,255,.14); color: var(--off); }
  .cl-btn-ghost:hover { border-color: rgba(185,255,75,.45); color: var(--lime); }
  .cl-btn-sm { padding: 8px 16px; font-size: 12px; }

  /* HERO */
  .cl-hero { position: relative; overflow: hidden; padding-top: 112px; padding-bottom: clamp(56px, 8vw, 96px); min-height: 100svh; display:flex; align-items:center; }
  .cl-hero-grid { display:grid; grid-template-columns: 1fr; gap: clamp(36px, 5vw, 64px); align-items:center; width: 100%; }
  @media (min-width: 900px) { .cl-hero-grid { grid-template-columns: minmax(0, 1.15fr) minmax(320px, 420px); } }
  .cl-h1 { font-size: clamp(36px, 9.6vw, 82px); font-weight: 800; margin: 22px 0 22px; overflow-wrap: normal; word-break: keep-all; }
  @media (min-width: 900px) { .cl-h1 { font-size: clamp(48px, 5.4vw, 82px); } }
  .cl-hero p { font-size: clamp(15px, 1.5vw, 18px); color: var(--dim); line-height: 1.65; max-width: 520px; }
  .cl-hero-actions { display:flex; flex-wrap:wrap; gap: 12px; margin-top: 30px; }
  .cl-stats { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin-top: clamp(36px, 5vw, 56px); }
  .cl-stat { padding: 16px 0 0; border-top: 1px solid rgba(255,255,255,.08); min-width: 0; }
  .cl-stat b { display:block; font-family: var(--font-display); font-size: clamp(22px, 4vw, 40px); font-weight: 800; letter-spacing: -0.04em; line-height: 1; color: var(--off); }
  .cl-stat span { display:block; margin-top: 6px; font-family: var(--font-mono); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .cl-scroll { display:none; }
  @media (min-width: 900px) { .cl-scroll { display:flex; position:absolute; bottom: 22px; left: 50%; transform: translateX(-50%); flex-direction: column; align-items:center; gap: 6px; animation: cl-bob 1.7s ease-in-out infinite; } }

  /* card do time no hero */
  .cl-agent { border-radius: 26px; padding: clamp(20px, 3vw, 28px); position: relative; overflow: hidden; transition: background .6s, border-color .6s, box-shadow .6s; }
  .cl-agent-grid { display:grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 6px; }
  @media (min-width: 420px) { .cl-agent-grid { gap: 8px; } }
  .cl-agent-btn { height: 44px; border-radius: 12px; border: none; display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 2px; cursor:pointer; transition: transform .2s; min-width: 0; }
  .cl-agent-btn:hover { transform: scale(1.08); }
  .cl-tasks { display:grid; grid-template-columns: 1fr; gap: 7px 12px; }
  @media (min-width: 420px) { .cl-tasks { grid-template-columns: 1fr 1fr; } }

  /* ticker */
  .cl-ticker { background: var(--lime); overflow:hidden; padding: 13px 0; }
  .cl-ticker-track { display:flex; width: max-content; animation: cl-tick 30s linear infinite; }
  .cl-ticker span { font-family: var(--font-mono); font-size: 12px; font-weight: 600; color: ${BLACK}; white-space: nowrap; padding: 0 26px; }

  /* processo (linha do tempo) */
  .cl-tl-row { display:grid; grid-template-columns: 44px minmax(0,1fr); column-gap: 14px; align-items: start; }
  .cl-tl-left, .cl-tl-right { grid-column: 2; grid-row: 1; min-width: 0; padding-bottom: 22px; }
  .cl-tl-spine { grid-column: 1; grid-row: 1; display:flex; flex-direction:column; align-items:center; align-self: stretch; }
  .cl-tl-node { width: 44px; height: 44px; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-family: var(--font-mono); font-size: 13px; font-weight: 800; cursor:pointer; flex-shrink: 0; z-index: 2; transition: all .4s cubic-bezier(.22,.68,0,1.2); }
  .cl-tl-line { width: 2px; flex-grow: 1; min-height: 40px; position: relative; margin: 8px 0; }
  .cl-tl-card { padding: clamp(20px, 3vw, 32px); border-radius: 22px; cursor:pointer; position:relative; overflow:hidden; transition: background .28s, border-color .28s, box-shadow .28s, transform .28s cubic-bezier(.22,.68,0,1.2); }
  .cl-tl-card h3 { font-size: clamp(20px, 2.4vw, 28px); font-weight: 800; }
  .cl-tl-head { display:flex; align-items:flex-start; justify-content:space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; position:relative; }
  .cl-tl-card p { font-size: 15px; color: var(--dim); line-height: 1.7; position: relative; }
  .cl-tl-details { display:grid; grid-template-columns: 1fr; gap: 10px 28px; margin-bottom: 20px; }
  @media (min-width: 640px) { .cl-tl-details { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 900px) {
    .cl-tl-row { grid-template-columns: minmax(0,1fr) 100px minmax(0,1fr); column-gap: 0; }
    .cl-tl-left { grid-column: 1; padding-right: 32px; }
    .cl-tl-spine { grid-column: 2; }
    .cl-tl-right { grid-column: 3; padding-left: 32px; }
    .cl-tl-node { width: 64px; height: 64px; font-size: 15px; }
  }
  .cl-pill-note { display:inline-flex; align-items:center; gap: 12px; padding: 14px 22px; border-radius: 100px; background: rgba(185,255,75,.06); border: 1px solid rgba(185,255,75,.22); text-align:left; }
  .cl-pill-note span { font-size: 15px; color: var(--off); }

  /* fluxo 5 agentes */
  .cl-flow { display:grid; grid-template-columns: 1fr; gap: 10px; margin-bottom: clamp(36px, 5vw, 64px); }
  @media (min-width: 560px) { .cl-flow { grid-template-columns: repeat(2, minmax(0,1fr)); } }
  @media (min-width: 960px) { .cl-flow { grid-template-columns: repeat(5, minmax(0,1fr)); gap: 8px; } }
  .cl-flow-card { padding: 22px 20px; border-radius: 16px; background: rgba(255,255,255,.025); height: 100%; }
  .cl-results { display:grid; grid-template-columns: 1fr; gap: 12px; }
  @media (min-width: 760px) { .cl-results { grid-template-columns: repeat(3, minmax(0,1fr)); } }

  /* serviços */
  .cl-services { display:grid; grid-template-columns: 1fr; border: 1px solid rgba(255,255,255,.08); border-radius: 20px; overflow:hidden; }
  @media (min-width: 640px) { .cl-services { grid-template-columns: repeat(2, minmax(0,1fr)); } }
  @media (min-width: 960px) { .cl-services { grid-template-columns: repeat(3, minmax(0,1fr)); } }
  .cl-service { padding: clamp(24px, 3vw, 36px) clamp(20px, 2.6vw, 30px); background: ${BLACK}; border: 0 solid rgba(255,255,255,.07); border-bottom-width: 1px; transition: background .2s; position: relative; }
  .cl-service:hover { background: rgba(185,255,75,.045); }
  @media (min-width: 640px) { .cl-service:nth-child(odd) { border-right-width: 1px; } }
  @media (min-width: 960px) { .cl-service:nth-child(odd) { border-right-width: 0; } .cl-service:not(:nth-child(3n)) { border-right-width: 1px; } .cl-service:nth-last-child(-n+3) { border-bottom-width: 0; } }
  @media (max-width: 959px) and (min-width: 640px) { .cl-service:nth-last-child(-n+2) { border-bottom-width: 0; } }
  @media (max-width: 639px) { .cl-service:last-child { border-bottom-width: 0; } }
  .cl-service h3 { font-size: 20px; font-weight: 700; margin: 14px 0 10px; }
  .cl-service p { font-size: 14px; color: var(--dim); line-height: 1.65; }

  /* produtos */
  .cl-products { display:grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 900px) { .cl-products { grid-template-columns: repeat(3, minmax(0,1fr)); } }
  .cl-product { border-radius: 22px; background: rgba(255,255,255,.025); padding: clamp(24px, 3vw, 34px) clamp(20px, 2.6vw, 28px); position:relative; overflow:hidden; transition: transform .22s, box-shadow .22s; display:flex; flex-direction:column; }
  .cl-product:hover { transform: translateY(-4px); box-shadow: 0 24px 64px rgba(0,0,0,.35); }
  .cl-product h3 { font-size: clamp(24px, 2.6vw, 30px); font-weight: 800; }
  .cl-product p { font-size: 14px; color: var(--dim); line-height: 1.7; margin: 16px 0 22px; }
  .cl-product ul { list-style: none; display:flex; flex-direction:column; gap: 9px; margin-bottom: 28px; flex-grow: 1; }
  .cl-product li { display:flex; align-items:center; gap: 9px; font-size: 13px; font-weight: 600; color: rgba(240,239,232,.6); }

  /* time (carrossel) */
  .cl-team-head { display:flex; flex-direction: column; gap: 18px; margin-bottom: 36px; }
  @media (min-width: 900px) { .cl-team-head { flex-direction: row; align-items: flex-end; justify-content: space-between; } }
  .cl-team-ctl { display:flex; align-items:center; gap: 10px; flex-wrap: wrap; }
  .cl-round { width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(255,255,255,.12); background: transparent; color: var(--off); display:flex; align-items:center; justify-content:center; cursor:pointer; transition: border-color .2s, background .2s; }
  .cl-round:hover { border-color: var(--lime); background: rgba(185,255,75,.08); }
  .cl-track { display:flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; padding: 6px var(--pad) 36px; scroll-padding-left: var(--pad); }
  .cl-track::-webkit-scrollbar { display:none; }
  .cl-tcard { flex-shrink: 0; width: min(340px, 84vw); scroll-snap-align: start; border-radius: 22px; padding: clamp(24px, 3vw, 36px) clamp(20px, 2.6vw, 28px); display:flex; flex-direction:column; min-height: 440px; position:relative; overflow:hidden; transition: background .3s, border-color .3s, box-shadow .3s, transform .3s cubic-bezier(.22,.68,0,1.2); }
  .cl-tcard h3 { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
  .cl-tcard p { font-size: 14px; line-height: 1.7; margin-bottom: 22px; flex-grow: 1; transition: color .3s; }
  .cl-dots { display:flex; justify-content:center; gap: 6px; margin-top: 4px; }

  /* como funciona (4 passos) */
  .cl-steps { display:grid; grid-template-columns: 1fr; gap: 28px; }
  @media (min-width: 560px) { .cl-steps { grid-template-columns: repeat(2, minmax(0,1fr)); } }
  @media (min-width: 960px) { .cl-steps { grid-template-columns: repeat(4, minmax(0,1fr)); } }
  .cl-step h3 { font-size: 19px; font-weight: 700; margin: 20px 0 10px; }
  .cl-step p { font-size: 14px; color: var(--dim); line-height: 1.65; }

  /* economia */
  .cl-savings { display:grid; grid-template-columns: 1fr; gap: clamp(32px, 5vw, 72px); align-items:center; }
  @media (min-width: 900px) { .cl-savings { grid-template-columns: minmax(0,1fr) minmax(0,1.15fr); } }
  .cl-table { border-radius: 18px; border: 1px solid rgba(255,255,255,.08); overflow:hidden; }
  .cl-table-row { display:flex; justify-content:space-between; align-items:center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid rgba(255,255,255,.05); background: ${BLACK}; }
  .cl-table-row:hover { background: rgba(185,255,75,.03); }
  .cl-table-row > span:first-child { display:flex; align-items:center; gap: 8px; font-size: 13px; font-weight: 600; color: rgba(240,239,232,.6); min-width: 0; }
  .cl-table-row > span:last-child { font-family: var(--font-mono); font-size: 11px; color: rgba(240,239,232,.35); white-space: nowrap; }

  /* cta */
  .cl-cta { background: var(--lime); border-radius: 26px; padding: clamp(32px, 5vw, 60px) clamp(22px, 4vw, 52px); display:flex; flex-direction:column; gap: 28px; position: relative; overflow:hidden; }
  @media (min-width: 900px) { .cl-cta { flex-direction: row; align-items:center; justify-content:space-between; } }
  .cl-cta h2 { font-size: clamp(28px, 4vw, 44px); font-weight: 800; color: ${BLACK}; }
  .cl-cta-actions { display:flex; flex-direction:column; gap: 10px; flex-shrink: 0; }
  .cl-cta-actions .cl-btn { white-space: normal; }

  /* rodapé */
  .cl-footer { border-top: 1px solid rgba(255,255,255,.06); padding: 32px 0; }
  .cl-footer-row { display:flex; flex-direction: column; align-items:center; text-align:center; gap: 18px; }
  @media (min-width: 760px) { .cl-footer-row { flex-direction: row; justify-content: space-between; text-align:left; } }
  .cl-social { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(255,255,255,.1); display:flex; align-items:center; justify-content:center; transition: border-color .18s; }
  .cl-social:hover { border-color: var(--lime); }

  /* animações */
  @keyframes cl-in { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform:none; } }
  @keyframes cl-fade { from { opacity:0; } to { opacity:1; } }
  @keyframes cl-tick { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes cl-bob { 0%,100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 6px); } }
  @keyframes cl-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(185,255,75,.5); } 50% { box-shadow: 0 0 0 6px rgba(185,255,75,0); } }
  @keyframes cl-agent-in { from { opacity:0; transform: translateY(12px) scale(.96); } to { opacity:1; transform:none; } }
  .cl-a1 { animation: cl-in .65s ease both .05s } .cl-a2 { animation: cl-in .65s ease both .18s }
  .cl-a3 { animation: cl-in .65s ease both .30s } .cl-a4 { animation: cl-in .65s ease both .44s }
  .cl-dot { animation: cl-pulse 2.2s ease-in-out infinite; }
  .cl-agent-in { animation: cl-agent-in .42s cubic-bezier(.22,.68,0,1.2) both; }
  @media (prefers-reduced-motion: reduce) { .cl *, .cl *::before, .cl *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
`;

/* ─── Card do time no hero ────────────────────────────────────────────────── */
function HeroAgentCard() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => { setActive((p) => (p + 1) % TEAM.length); setKey((k) => k + 1); }, 2800);
    return () => clearInterval(t);
  }, [paused]);

  const agent = TEAM[active];
  return (
    <div className="cl-agent" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      style={{ background: `${agent.color}08`, border: `1px solid ${agent.color}38`, boxShadow: `0 0 80px -20px ${agent.color}55, 0 0 0 1px ${agent.color}18` }}>
      <div className="cl-glow" style={{ top: -80, right: -80, width: 300, height: 300, background: `radial-gradient(circle, ${agent.color}2A 0%, transparent 68%)` }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, position: "relative" }}>
        <span className="cl-mono" style={{ fontSize: 10, color: LIME }}>Time ativo agora</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <i className="cl-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: LIME, boxShadow: `0 0 10px ${LIME}` }} />
          <span className="cl-mono" style={{ fontSize: 10, color: LIME, letterSpacing: 0, textTransform: "none" }}>{TEAM.length} online</span>
        </span>
      </div>
      <div key={key} className="cl-agent-in" style={{ marginBottom: 18, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: `${agent.color}1C`, border: `2px solid ${agent.color}60`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: agent.color, flexShrink: 0, boxShadow: `0 0 36px -6px ${agent.color}80` }}>{agent.i}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, color: OFF }}>{agent.name}</div>
            <div className="cl-mono" style={{ fontSize: 10, color: agent.color, marginTop: 5, opacity: .85, letterSpacing: ".06em" }}>{agent.role}</div>
          </div>
        </div>
        <div style={{ background: "rgba(0,0,0,.4)", borderRadius: 14, padding: "14px 16px", border: `1px solid ${agent.color}18` }}>
          <div className="cl-mono" style={{ fontSize: 9, color: MUTED, marginBottom: 10 }}>Executando agora</div>
          <div className="cl-tasks">
            {agent.tasks.map((task, j) => (
              <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <i style={{ width: 4, height: 4, borderRadius: "50%", background: j === 0 ? agent.color : "rgba(255,255,255,.15)", flexShrink: 0, boxShadow: j === 0 ? `0 0 6px ${agent.color}` : "none" }} />
                <span style={{ fontSize: 12.5, color: j === 0 ? "rgba(240,239,232,.8)" : "rgba(240,239,232,.4)", lineHeight: 1.4, overflowWrap: "anywhere" }}>{task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ height: 1, background: `linear-gradient(to right, ${agent.color}25, rgba(255,255,255,.04), transparent)`, marginBottom: 16 }} />
      <div className="cl-agent-grid">
        {TEAM.map((t, i) => (
          <button key={t.name} className="cl-agent-btn" title={t.name}
            onClick={() => { setActive(i); setKey((k) => k + 1); setPaused(true); }}
            style={{ background: i === active ? `${t.color}22` : "rgba(255,255,255,.04)", outline: i === active ? `1.5px solid ${t.color}70` : "1px solid rgba(255,255,255,.07)", boxShadow: i === active ? `0 0 18px -4px ${t.color}70` : "none" }}>
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 800, color: i === active ? t.color : MUTED }}>{t.i}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: i === active ? t.color : "rgba(255,255,255,.22)", lineHeight: 1 }}>{t.name.slice(0, 3)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Linha do tempo do processo ──────────────────────────────────────────── */
function ProcessTimeline() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [hov, setHov] = useState<number | null>(null);

  return (
    <section id="processo" className="cl-section" style={{ borderBottom: "1px solid rgba(255,255,255,.06)", position: "relative", overflow: "hidden" }}>
      <div className="cl-glow" style={{ top: "30%", left: "50%", transform: "translateX(-50%)", width: "min(1000px, 120vw)", height: 700, background: "radial-gradient(circle, rgba(185,255,75,.035) 0%, transparent 62%)" }} />
      <div className="cl-wrap" style={{ position: "relative", maxWidth: 1120 }}>
        <div className="cl-head" style={{ alignItems: "center", textAlign: "center" }}>
          <span className="cl-eyebrow cl-mono">Do briefing à publicação</span>
          <h2 className="cl-h2">Como a Calu trabalha<br /><span style={{ color: LIME }}>do início ao resultado.</span></h2>
          <p className="cl-lede" style={{ margin: "12px auto 0" }}>Toque em cada etapa para ver o que acontece nos bastidores.</p>
        </div>

        {PROCESS.map((step, i) => {
          const isActive = activeStep === i;
          const isPassed = activeStep !== null && i <= activeStep;
          const isLast = i === PROCESS.length - 1;
          const isRight = i % 2 === 0;
          const isHov = hov === i && !isActive;
          const card = (
            <div className="cl-tl-card" onClick={() => setActiveStep(isActive ? null : i)} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{
                background: isActive ? `${step.color}09` : isHov ? `${step.color}06` : "rgba(255,255,255,.028)",
                border: `1px solid ${isActive ? `${step.color}60` : isHov ? `${step.color}50` : "rgba(185,255,75,.14)"}`,
                boxShadow: isActive ? `0 0 0 1px ${step.color}1A, 0 20px 64px -20px ${step.color}65` : isHov ? `0 12px 44px -16px ${step.color}55` : "inset 0 1px 0 rgba(255,255,255,.04)",
                transform: isHov ? "translateY(-4px)" : "none",
              }}>
              <div className="cl-glow" style={{ top: -90, [isRight ? "left" : "right"]: -90, width: 280, height: 280, background: `radial-gradient(circle, ${step.color}${isActive ? "18" : isHov ? "12" : "07"} 0%, transparent 68%)` }} />
              <div className="cl-tl-head">
                <div style={{ minWidth: 0 }}>
                  <div className="cl-mono" style={{ fontSize: 10, color: step.color, marginBottom: 8, opacity: .9 }}>{step.n} · {step.duration}</div>
                  <h3 style={{ color: isActive ? OFF : "rgba(240,239,232,.85)" }}>{step.title}</h3>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {step.agents.map((a) => (
                    <div key={a.name} title={a.name} style={{ width: 38, height: 38, borderRadius: 12, background: `${a.color}15`, border: `1.5px solid ${a.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontSize: 12, fontWeight: 800, color: a.color, boxShadow: isActive ? `0 0 20px -4px ${a.color}80` : "none", transition: "box-shadow .3s" }}>{a.i}</div>
                  ))}
                </div>
              </div>
              <p>{step.desc}</p>
              {isActive && (
                <div style={{ marginTop: 22, position: "relative" }}>
                  <div style={{ height: 1, background: `linear-gradient(to right, ${step.color}35, transparent)`, marginBottom: 20 }} />
                  <div className="cl-mono" style={{ fontSize: 10, color: step.color, marginBottom: 14 }}>Entregáveis</div>
                  <div className="cl-tl-details">
                    {step.details.map((d) => (
                      <div key={d} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <i style={{ width: 6, height: 6, borderRadius: "50%", background: step.color, flexShrink: 0, marginTop: 8, boxShadow: `0 0 8px ${step.color}` }} />
                        <span style={{ fontSize: 14.5, color: "rgba(240,239,232,.62)", lineHeight: 1.6 }}>{d}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: 10, padding: "12px 18px", borderRadius: 14, background: `${step.color}0E`, border: `1px solid ${step.color}38` }}>
                    <i style={{ width: 7, height: 7, borderRadius: "50%", background: step.color, boxShadow: `0 0 10px ${step.color}` }} />
                    <span className="cl-mono" style={{ fontSize: 10, color: step.color, letterSpacing: ".04em", textTransform: "none" }}>Output →</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: OFF }}>{step.output}</span>
                  </div>
                </div>
              )}
            </div>
          );
          return (
            <div key={step.n} className="cl-tl-row">
              <div className="cl-tl-left">{!isRight ? card : null}</div>
              <div className="cl-tl-spine">
                <div className="cl-tl-node" onClick={() => setActiveStep(isActive ? null : i)}
                  style={{ background: isActive ? `${step.color}1C` : isPassed ? `${LIME}0D` : "rgba(255,255,255,.05)", border: `2px solid ${isActive ? step.color : isPassed ? `${LIME}95` : "rgba(255,255,255,.13)"}`, color: isActive ? step.color : isPassed ? LIME : MUTED, boxShadow: isActive ? `0 0 0 8px ${step.color}10, 0 0 48px -8px ${step.color}95` : isPassed ? `0 0 22px -5px ${LIME}60` : "none" }}>{step.n}</div>
                {!isLast && (
                  <div className="cl-tl-line">
                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.06)", borderRadius: 2 }} />
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: isPassed ? "100%" : "0%", background: `linear-gradient(to bottom, ${LIME}, ${LIME}45)`, borderRadius: 2, boxShadow: isPassed ? `0 0 12px ${LIME}80` : "none", transition: "height .6s ease" }} />
                  </div>
                )}
              </div>
              <div className="cl-tl-right">{isRight ? card : null}</div>
            </div>
          );
        })}

        <div style={{ textAlign: "center", marginTop: clamp(40) }}>
          <div className="cl-pill-note">
            <i className="cl-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: LIME, boxShadow: `0 0 14px ${LIME}`, flexShrink: 0 }} />
            <span>Cada agente trabalha em cima do que o anterior entregou — <strong style={{ color: LIME }}>como numa agência de verdade</strong>.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
const clamp = (px: number) => `clamp(${Math.round(px * 0.6)}px, 6vw, ${px * 2}px)`;

/* ─── Carrossel do time ───────────────────────────────────────────────────── */
function TeamCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hov, setHov] = useState<number | null>(null);

  /** Largura real do card + gap — muda com a viewport, então mede na hora. */
  const passo = useCallback(() => {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return 356;
    const gap = parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap || "16") || 16;
    return card.getBoundingClientRect().width + gap;
  }, []);

  const scrollTo = useCallback((idx: number) => {
    const el = trackRef.current; if (!el) return;
    const clamped = Math.max(0, Math.min(idx, TEAM.length - 1));
    setActive(clamped);
    el.scrollTo({ left: clamped * passo(), behavior: "smooth" });
  }, [passo]);

  const onScroll = () => {
    const el = trackRef.current; if (!el) return;
    setActive(Math.round(el.scrollLeft / passo()));
  };

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % TEAM.length;
        trackRef.current?.scrollTo({ left: next * passo(), behavior: "smooth" });
        return next;
      });
    }, 3200);
    return () => clearInterval(timer);
  }, [paused, passo]);

  return (
    <section id="time" className="cl-section" style={{ overflow: "hidden", paddingLeft: 0, paddingRight: 0 }}>
      <div className="cl-wrap cl-team-head">
        <div>
          <span className="cl-eyebrow cl-mono">Nosso time de IA</span>
          <h2 className="cl-h2">{TEAM.length} especialistas.<br />1 investimento.</h2>
        </div>
        <div className="cl-team-ctl">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 100, border: "1px solid rgba(185,255,75,.2)", background: "rgba(185,255,75,.06)" }}>
            <i className="cl-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: LIME }} />
            <span className="cl-mono" style={{ fontSize: 10, color: LIME, textTransform: "none", letterSpacing: 0 }}>Todos online agora</span>
          </span>
          <button className="cl-round" onClick={() => setPaused((p) => !p)} title={paused ? "Retomar" : "Pausar"} style={{ width: "auto", padding: "0 14px", borderRadius: 100, gap: 7 }}>
            <span style={{ fontSize: 12 }}>{paused ? "▶" : "⏸"}</span>
            <span className="cl-mono" style={{ fontSize: 10, textTransform: "none", letterSpacing: 0, color: paused ? LIME : MUTED }}>{paused ? "retomar" : "pausar"}</span>
          </button>
          <button className="cl-round" onClick={() => scrollTo(active - 1)} aria-label="Anterior">←</button>
          <button className="cl-round" onClick={() => scrollTo(active + 1)} aria-label="Próximo">→</button>
        </div>
      </div>

      <div ref={trackRef} onScroll={onScroll} className="cl-track">
        {TEAM.map((t, idx) => {
          const on = idx === active;
          const lit = on || (hov === idx);
          return (
            <div key={t.name} className="cl-tcard" onMouseEnter={() => setHov(idx)} onMouseLeave={() => setHov(null)} onClick={() => setPaused((p) => !p)}
              style={{
                background: on ? `${t.color}0F` : lit ? `${t.color}08` : "rgba(255,255,255,.022)",
                border: `1px solid ${on ? `${t.color}65` : lit ? `${t.color}45` : "rgba(255,255,255,.07)"}`,
                boxShadow: on ? `0 0 0 1px ${t.color}1A, 0 24px 72px -24px ${t.color}70` : "inset 0 1px 0 rgba(255,255,255,.04)",
                transform: on ? "translateY(-6px)" : lit ? "translateY(-3px)" : "none",
              }}>
              <div className="cl-glow" style={{ top: -80, right: -80, width: 260, height: 260, background: `radial-gradient(circle, ${t.color}${on ? "22" : lit ? "14" : "05"} 0%, transparent 68%)` }} />
              <div style={{ width: 64, height: 64, borderRadius: 18, background: `${t.color}${on ? "28" : "18"}`, border: `2px solid ${on ? t.color : `${t.color}45`}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 800, color: t.color, marginBottom: 22, boxShadow: on ? `0 0 32px -6px ${t.color}90` : "none", transition: "all .3s", position: "relative" }}>{t.i}</div>
              <div className="cl-mono" style={{ fontSize: 9, color: t.color, marginBottom: 6, opacity: lit ? 1 : .55 }}>Agente especialista</div>
              <h3 style={{ color: lit ? OFF : "rgba(240,239,232,.55)", transition: "color .3s" }}>{t.name}</h3>
              <div className="cl-mono" style={{ fontSize: 10, color: lit ? t.color : MUTED, marginBottom: 18, textTransform: "none", letterSpacing: ".04em" }}>{t.role}</div>
              <p style={{ color: lit ? "rgba(240,239,232,.7)" : "rgba(240,239,232,.32)" }}>{t.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
                {t.tasks.map((task) => (
                  <div key={task} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <i style={{ width: 5, height: 5, borderRadius: "50%", background: lit ? t.color : "rgba(255,255,255,.15)", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: lit ? "rgba(240,239,232,.7)" : "rgba(240,239,232,.28)", transition: "color .3s" }}>{task}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 18, borderTop: `1px solid ${on ? `${t.color}25` : "rgba(255,255,255,.06)"}` }}>
                <i style={{ width: 7, height: 7, borderRadius: "50%", background: LIME, boxShadow: on ? `0 0 10px ${LIME}` : "none" }} />
                <span className="cl-mono" style={{ fontSize: 10, color: LIME, textTransform: "none", letterSpacing: 0 }}>trabalhando agora</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="cl-dots">
        {TEAM.map((_, i) => (
          <button key={i} onClick={() => scrollTo(i)} aria-label={`Ir para ${TEAM[i].name}`}
            style={{ width: i === active ? 24 : 7, height: 7, borderRadius: 100, background: i === active ? LIME : "rgba(255,255,255,.2)", border: "none", cursor: "pointer", padding: 0, transition: "width .3s, background .3s" }} />
        ))}
      </div>
    </section>
  );
}

/* ─── Página ──────────────────────────────────────────────────────────────── */
const NAV = [["Serviços", "#servicos"], ["Processo", "#processo"], ["Soluções IA", "#solucoes"], ["Time", "#time"], ["Contato", "#contato"]] as const;

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menu]);

  return (
    <div className="cl" style={{ background: BLACK, color: OFF, minHeight: "100vh", overflowX: "hidden" }}>
      <style>{CSS}</style>
      <div className="cl-grain" />

      {/* NAV */}
      <nav className={`cl-nav ${scrolled || menu ? "is-scrolled" : ""}`}>
        <div className="cl-wrap cl-nav-in">
          <a href="#" className="cl-brand" onClick={() => setMenu(false)}>
            <img src={caluLogo} alt="Calu Agência" /> Calu Agência
          </a>
          <div className="cl-links">
            {NAV.map(([l, h]) => <a key={l} href={h}>{l}</a>)}
            <a href="/briefing" className="cl-btn cl-btn-ghost cl-btn-sm"><Zap size={12} /> Diagnóstico IA</a>
            <a href={WA} target="_blank" rel="noreferrer" className="cl-btn cl-btn-lime cl-btn-sm">Começar agora</a>
          </div>
          <button className="cl-burger" onClick={() => setMenu((m) => !m)} aria-label={menu ? "Fechar menu" : "Abrir menu"} aria-expanded={menu}>
            {menu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
      {menu && (
        <div className="cl-menu">
          {NAV.map(([l, h]) => <a key={l} href={h} onClick={() => setMenu(false)}>{l}</a>)}
          <div className="cl-menu-cta">
            <a href="/briefing" className="cl-btn cl-btn-ghost" onClick={() => setMenu(false)}><Zap size={14} /> Diagnóstico gratuito com IA</a>
            <a href={WA} target="_blank" rel="noreferrer" className="cl-btn cl-btn-lime"><MessageCircle size={14} /> Falar no WhatsApp</a>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="cl-hero">
        <div className="cl-glow" style={{ top: "20%", right: "-10%", width: "min(560px, 90vw)", height: 560, background: "radial-gradient(circle, rgba(185,255,75,.09) 0%, transparent 65%)" }} />
        <div className="cl-glow" style={{ bottom: "-10%", left: "-15%", width: "min(480px, 80vw)", height: 480, background: "radial-gradient(circle, rgba(167,139,250,.06) 0%, transparent 65%)" }} />
        <div className="cl-wrap cl-hero-grid">
          <div style={{ minWidth: 0 }}>
            <span className="cl-eyebrow cl-mono cl-a1">
              <i className="cl-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: LIME }} />
              Publicidade · Tecnologia · IA
            </span>
            <h1 className="cl-h1 cl-a2">Criatividade<br />que vende.<br /><span style={{ color: LIME }}>IA que escala.</span></h1>
            <p className="cl-a3">A Calu Agência une estratégia criativa de alta performance com tecnologia de IA proprietária — para sua marca crescer sem limite de equipe ou orçamento.</p>
            <div className="cl-hero-actions cl-a4">
              <a href={WA} target="_blank" rel="noreferrer" className="cl-btn cl-btn-lime"><MessageCircle size={15} /> Fale conosco</a>
              <a href="#servicos" className="cl-btn cl-btn-ghost">Ver serviços <ArrowRight size={14} /></a>
            </div>
            <div className="cl-stats cl-a4">
              {[["10", "agentes no time"], ["48h", "da estratégia ao post"], ["24/7", "produção contínua"]].map(([v, l]) => (
                <div key={l} className="cl-stat"><b>{v}</b><span>{l}</span></div>
              ))}
            </div>
          </div>
          <div className="cl-a3"><HeroAgentCard /></div>
        </div>
        <div className="cl-scroll">
          <i style={{ width: 1, height: 40, background: "linear-gradient(to bottom, transparent, rgba(255,255,255,.18))" }} />
          <span className="cl-mono" style={{ fontSize: 9, color: MUTED }}>scroll</span>
        </div>
      </section>

      {/* TICKER */}
      <div className="cl-ticker" aria-hidden>
        <div className="cl-ticker-track">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => <span key={i}>{t} <em style={{ opacity: .3, fontStyle: "normal" }}>·</em></span>)}
        </div>
      </div>

      <ProcessTimeline />

      {/* MARKETING + IA */}
      <section className="cl-section" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div className="cl-wrap">
          <div className="cl-head" style={{ alignItems: "center", textAlign: "center" }}>
            <span className="cl-eyebrow cl-mono">Como funciona</span>
            <h2 className="cl-h2">Marketing executado<br /><span style={{ color: LIME }}>por inteligência artificial.</span></h2>
            <p className="cl-lede" style={{ margin: "12px auto 0" }}>Cada post, anúncio, artigo e campanha passa por um time de agentes especializados — trabalhando em sequência, 24 horas por dia.</p>
          </div>
          <div className="cl-flow">
            {FLOW.map((s, i) => (
              <div key={s.agent} className="cl-flow-card" style={{ border: `1px solid ${s.color}28` }}>
                <div className="cl-mono" style={{ fontSize: 10, color: s.color, marginBottom: 12, letterSpacing: ".06em" }}>0{i + 1} · {s.agent}</div>
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 700, color: OFF, letterSpacing: "-0.02em", marginBottom: 8 }}>{s.role}</div>
                <p style={{ fontSize: 13.5, color: DIM, lineHeight: 1.55 }}>{s.desc}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 16 }}>
                  <i style={{ width: 5, height: 5, borderRadius: "50%", background: s.color }} />
                  <span className="cl-mono" style={{ fontSize: 9, color: s.color, textTransform: "none", letterSpacing: 0 }}>ativo agora</span>
                </div>
              </div>
            ))}
          </div>
          <div className="cl-results">
            {[["Estratégia → publicação", "em até 48h", LIME], ["Ciclo de aprovação", "via portal do cliente", "#A78BFA"], ["Relatório de performance", "semanal, automático", "#34D399"]].map(([label, value, color]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 22px", border: `1px solid ${color}22`, borderRadius: 14, background: `${color}06`, minWidth: 0 }}>
                <i style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div className="cl-mono" style={{ fontSize: 10, color, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 700, color: OFF, letterSpacing: "-0.02em" }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="cl-section">
        <div className="cl-wrap">
          <div className="cl-head is-split">
            <div>
              <span className="cl-eyebrow cl-mono">O que fazemos</span>
              <h2 className="cl-h2">Tudo que sua marca<br />precisa, em um lugar.</h2>
            </div>
            <p className="cl-lede">Serviços integrados que trabalham juntos para crescer seu negócio.</p>
          </div>
          <div className="cl-services">
            {SERVICES.map((s) => (
              <div key={s.n} className="cl-service">
                <span className="cl-mono" style={{ fontSize: 11, color: LIME, letterSpacing: ".06em" }}>{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUÇÕES */}
      <section id="solucoes" className="cl-section" style={{ background: "#0C0C0C", borderTop: "1px solid rgba(255,255,255,.05)", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
        <div className="cl-wrap">
          <div className="cl-head">
            <div>
              <span className="cl-eyebrow cl-mono">Soluções com IA</span>
              <h2 className="cl-h2">Tecnologia que<br />trabalha por você.</h2>
            </div>
            <p className="cl-lede">Cada produto foi desenvolvido para um nicho específico — resolvendo problemas reais de segmentos que a tecnologia genérica não atende.</p>
          </div>
          <div className="cl-products">
            {PRODUCTS.map((p) => (
              <div key={p.name} className="cl-product" style={{ border: `1px solid ${p.color}22` }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: p.color }} />
                <span className="cl-mono" style={{ fontSize: 9, fontWeight: 700, color: p.color, background: `${p.color}15`, border: `1px solid ${p.color}30`, padding: "4px 12px", borderRadius: 100, display: "inline-block", marginBottom: 20, alignSelf: "flex-start" }}>{p.tag}</span>
                <h3>{p.name}</h3>
                <div className="cl-mono" style={{ fontSize: 10, color: p.color, marginTop: 6, textTransform: "none", letterSpacing: ".04em" }}>{p.sub}</div>
                <p>{p.desc}</p>
                <ul>{p.items.map((it) => <li key={it}><i style={{ width: 5, height: 5, borderRadius: "50%", background: p.color, flexShrink: 0 }} />{it}</li>)}</ul>
                <a href={WA} target="_blank" rel="noreferrer" className="cl-btn cl-btn-sm" style={{ alignSelf: "flex-start", color: p.color, background: `${p.color}10`, borderColor: `${p.color}30` }}>Saber mais <ArrowUpRight size={13} /></a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TeamCarousel />

      {/* COMO FUNCIONA */}
      <section className="cl-section" style={{ borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div className="cl-wrap">
          <div className="cl-head">
            <div>
              <span className="cl-eyebrow cl-mono">Como funciona</span>
              <h2 className="cl-h2">Do briefing<br />aos resultados.</h2>
            </div>
          </div>
          <div className="cl-steps">
            {[["01", "Briefing", "Uma conversa sobre seu negócio, público, metas e tom de voz."], ["02", "Estratégia", "Em até 48h, plano editorial, campanhas e calendário prontos."], ["03", "Execução", "Conteúdo, design, ads e automações rodando em sequência."], ["04", "Resultados", "Relatórios semanais com métricas reais e ajustes contínuos."]].map(([n, t, d], i) => (
              <div key={n} className="cl-step">
                <div style={{ width: 52, height: 52, borderRadius: 14, background: i === 0 ? LIME : "rgba(185,255,75,.08)", border: `1px solid ${i === 0 ? "transparent" : "rgba(185,255,75,.22)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="cl-mono" style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? BLACK : LIME, letterSpacing: 0 }}>{n}</span>
                </div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ECONOMIA */}
      <section className="cl-section" style={{ borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div className="cl-wrap cl-savings">
          <div>
            <span className="cl-eyebrow cl-mono">Por que faz sentido</span>
            <h2 className="cl-h2">Economize<br /><span style={{ color: LIME }}>R$ {fmt(39500)}+</span><br />por mês.</h2>
            <p className="cl-lede">Uma equipe completa custa entre <strong style={{ color: OFF }}>R$ {fmt(39500)}</strong> e <strong style={{ color: OFF }}>R$ {fmt(79500)}</strong>/mês em salários — sem contar encargos e ferramentas.</p>
            <a href={WA} target="_blank" rel="noreferrer" className="cl-btn cl-btn-lime" style={{ marginTop: 28 }}>Quero saber o valor <ArrowUpRight size={14} /></a>
          </div>
          <div className="cl-table">
            <div className="cl-table-row" style={{ background: "rgba(255,255,255,.02)" }}>
              <span className="cl-mono" style={{ fontSize: 10, color: MUTED }}>Profissional</span>
              <span className="cl-mono" style={{ fontSize: 10, color: MUTED }}>Salário / mês</span>
            </div>
            {SALARIES.map(([r, v]) => (
              <div key={r} className="cl-table-row">
                <span><Check size={12} color={LIME} strokeWidth={2.5} /> <span style={{ overflowWrap: "anywhere" }}>{r}</span></span>
                <span>{v}</span>
              </div>
            ))}
            <div className="cl-table-row" style={{ background: `${LIME}10`, borderTop: `1px solid ${LIME}20`, borderBottom: "none" }}>
              <span style={{ fontWeight: 700, color: LIME }}>Total estimado</span>
              <span style={{ color: LIME, fontWeight: 700 }}>R$ {fmt(39500)}+/mês</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contato" className="cl-section" style={{ paddingTop: clamp(40), paddingBottom: clamp(40) }}>
        <div className="cl-wrap">
          <div className="cl-cta">
            <div className="cl-glow" style={{ top: -120, right: -80, width: 320, height: 320, background: "radial-gradient(circle, rgba(8,8,8,.18) 0%, transparent 70%)" }} />
            <div style={{ position: "relative" }}>
              <div className="cl-mono" style={{ fontSize: 10, color: "rgba(8,8,8,.45)", marginBottom: 12 }}>Pronto para escalar?</div>
              <h2>Seu time completo<br />começa hoje.</h2>
            </div>
            <div className="cl-cta-actions" style={{ position: "relative" }}>
              <a href="/briefing" className="cl-btn" style={{ background: BLACK, color: LIME }}><Zap size={15} /> Diagnóstico gratuito com IA</a>
              <a href={WA} target="_blank" rel="noreferrer" className="cl-btn" style={{ background: "rgba(8,8,8,.1)", color: BLACK, fontWeight: 600 }}><MessageCircle size={14} /> Falar no WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="cl-footer">
        <div className="cl-wrap cl-footer-row">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={caluLogo} alt="Calu Agência" style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }} />
            <div>
              <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>Calu Agência</div>
              <div className="cl-mono" style={{ fontSize: 9, color: MUTED, letterSpacing: ".06em" }}>Publicidade · Tecnologia · IA · Fortaleza, CE</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
              <Link to="/privacy" className="cl-mono" style={{ fontSize: 10, color: DIM }}>Privacidade</Link>
              <Link to="/cookies" className="cl-mono" style={{ fontSize: 10, color: DIM }}>Cookies</Link>
              <Link to="/terms" className="cl-mono" style={{ fontSize: 10, color: DIM }}>Termos</Link>
              <Link to="/entrar" className="cl-mono" style={{ fontSize: 10, color: LIME }}>Entrar</Link>
            </div>
            <div className="cl-mono" style={{ fontSize: 9, color: "rgba(240,239,232,.22)", letterSpacing: ".04em" }}>© {new Date().getFullYear()} Calu Agência</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[[Instagram, "Instagram"], [Linkedin, "LinkedIn"], [MessageCircle, "WhatsApp"]].map(([Icon, label]) => {
              const I = Icon as typeof Instagram;
              return <a key={label as string} href={label === "WhatsApp" ? WA : "#"} className="cl-social" aria-label={label as string}><I size={13} color={DIM} /></a>;
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}
