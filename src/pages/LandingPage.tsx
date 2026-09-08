import caluLogo from "@/assets/calu-logo.png";
import { useState, useEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, ArrowDown, MessageCircle, Instagram, Linkedin, Menu, X, Plus } from "lucide-react";

/**
 * Landing page da Calu Agência. Direção: editorial noir.
 *
 * Uma revista de luxo impressa em preto, com um único acento (limão), uma
 * família de agência (Instrument Sans) para títulos e texto, Instrument Serif
 * itálico como acento, rótulos em mono.
 * A página argumenta por capítulos numerados separados por linhas finas,
 * não por cards. O scroll dirige três coisas: a profundidade do hero (planos
 * em taxas diferentes), as entradas de cada capítulo e a única seção pinada,
 * em que um mês de produção se monta na frente do visitante.
 *
 * O motor da scroll-craft mora em /public/scrollcraft e nunca é editado.
 */

const LIME  = "#B9FF4B";
const INK   = "#F2F1EA";
const CANVAS = "#0A0A0A";
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
    desc: "Todos os canais do seu cliente em um lugar: WhatsApp, Instagram, e-mail, site. Pipeline visual para fechar mais negócios com menos esforço.",
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
  { i: "Ai", name: "Aira",     role: "Orquestradora Geral",        color: LIME,      desc: "Coordena todo o time em tempo real, define prioridades e garante que cada entrega saia no prazo e com qualidade.", tasks: ["Orquestração do time", "Controle de prazos", "Briefing automatizado", "Relatório executivo"] },
  { i: "Q",  name: "Queila",   role: "Estrategista de Marca",      color: "#FBBF24", desc: "Define o posicionamento, a pauta editorial e a direção criativa. Cria o mapa de conteúdo mensal e garante consistência em todos os canais.", tasks: ["Pauta editorial mensal", "Posicionamento de marca", "Análise de concorrência", "Direção criativa"] },
  { i: "B",  name: "Beatriz",  role: "Copywriter & Redatora",      color: "#A78BFA", desc: "Escreve cada legenda, artigo, e-mail e anúncio com foco em conversão. Copy com personalidade, clareza e intenção.", tasks: ["Legendas e posts", "Artigos e blog", "Roteiros de vídeo", "Copy de anúncios"] },
  { i: "M",  name: "Marcela",  role: "Designer Visual",            color: "#D946EF", desc: "Cria todos os visuais da marca: posts, stories, banners, apresentações e peças de campanha, dentro do manual de identidade.", tasks: ["Posts e stories", "Banners e anúncios", "Apresentações", "Identidade visual"] },
  { i: "R",  name: "Rafaela",  role: "Gestora de Tráfego Pago",    color: "#F97316", desc: "Gerencia campanhas no Meta Ads e Google Ads com foco em ROAS alto e CPA que faz sentido. Testa, otimiza e escala todos os dias.", tasks: ["Meta Ads (FB/IG)", "Google Ads", "Remarketing", "Otimização de verba"] },
  { i: "Ma", name: "Marina",   role: "Social Media Manager",       color: "#60A5FA", desc: "Agenda, publica e monitora todo o conteúdo orgânico. Responde comentários, monitora menções e mantém a marca presente.", tasks: ["Agendamento de posts", "Engajamento", "Monitoramento", "Relatório semanal"] },
  { i: "P",  name: "Pedro",    role: "Calendário Editorial",       color: "#2DD4BF", desc: "Planeja o calendário editorial, semanas, meses e campanhas sazonais. Cada post no lugar certo, na hora certa.", tasks: ["Calendário mensal", "Pilares de conteúdo", "Datas estratégicas", "Cronograma de campanhas"] },
  { i: "L",  name: "Lucas",    role: "Analista de Dados",          color: "#34D399", desc: "Transforma números em decisões. Monitora tráfego, engajamento e vendas, e entrega relatórios com ações recomendadas.", tasks: ["Dashboards de resultado", "Google Analytics", "Relatórios semanais", "Insights estratégicos"] },
  { i: "E",  name: "Eduardo",  role: "Agente de Vendas & CRM",     color: "#F59E0B", desc: "Qualifica leads via WhatsApp, alimenta o CRM e garante que nenhum contato seja perdido, do primeiro oi ao fechamento.", tasks: ["Qualificação de leads", "Follow-up automatizado", "Gestão do CRM", "Relatório de pipeline"] },
  { i: "T",  name: "Teo",      role: "Web Designer & SEO",         color: "#06B6D4", desc: "Mantém o site atualizado, publica no blog e otimiza cada página para os buscadores.", tasks: ["Atualização de site", "SEO on-page", "Blog e artigos", "Landing pages"] },
  { i: "V",  name: "Vitória",  role: "Revisora de Conteúdo",       color: "#EC4899", desc: "Revisa e corrige todo o conteúdo antes de publicar: gramática, tom de voz, consistência de marca.", tasks: ["Revisão gramatical", "Tom de voz", "Checagem de fatos", "Aprovação final"] },
  { i: "Be", name: "Ben",      role: "Especialista em Tendências", color: LIME,      desc: "Pesquisa o Google Trends Brasil em tempo real e entrega tendências, queries em crescimento e ideias de conteúdo antes de qualquer produção.", tasks: ["Google Trends em tempo real", "Queries em crescimento", "Ideias de conteúdo", "Hashtags estratégicas"] },
];

const PROCESS = [
  { n: "01", title: "Briefing",     duration: "30 min",   agents: ["Lia"],                        desc: "Lia coleta o briefing numa conversa natural, analisa a concorrência e entrega um diagnóstico de marketing personalizado.", details: ["Formulário inteligente de onboarding", "Análise automática da concorrência", "Mapa de oportunidades da marca", "Briefing consolidado para o time"] },
  { n: "02", title: "Estratégia",   duration: "2h",       agents: ["Ben", "Queila", "Pedro"],     desc: "Ben pesquisa o Google Trends Brasil. Queila define posicionamento e direção criativa. Pedro monta o calendário editorial do mês.", details: ["Tendências reais do Google Trends", "Pauta editorial de 30 dias", "Posicionamento e tom de voz", "Calendário de campanhas"] },
  { n: "03", title: "Produção",     duration: "48h",      agents: ["Beatriz", "Marcela", "Bobby"], desc: "Beatriz escreve a copy, Marcela cria os visuais e Bobby edita os vídeos, cada um em cima do trabalho do outro.", details: ["Copy para posts, reels e anúncios", "Peças visuais e templates", "Vídeos editados e formatados", "Assets prontos para revisão"] },
  { n: "04", title: "Revisão",      duration: "4h",       agents: ["Vitória"],                    desc: "Vitória revisa todo o conteúdo antes de qualquer aprovação: gramática, tom de voz, consistência de marca e checagem de fatos.", details: ["Revisão ortográfica e gramatical", "Checagem de tom de voz", "Consistência com o manual da marca", "Aprovação final para o cliente"] },
  { n: "05", title: "Aprovação",    duration: "24h",      agents: ["Aira"],                       desc: "Você aprova tudo num portal exclusivo: vê as peças, sugere ajustes e aprova com um clique. Aira gerencia o fluxo.", details: ["Portal de aprovação do cliente", "Comentários em cada peça", "Histórico de revisões", "Aprovação com um clique"] },
  { n: "06", title: "Publicação",   duration: "contínuo", agents: ["Marina", "Teo"],              desc: "Marina publica nos horários de maior engajamento e monitora comentários. Teo mantém site e blog atualizados.", details: ["Agendamento otimizado", "Publicação em todas as plataformas", "Monitoramento de comentários", "Blog e site atualizados"] },
  { n: "07", title: "Tráfego",      duration: "24/7",     agents: ["Rafaela", "Eduardo"],         desc: "Rafaela ativa e otimiza campanhas no Meta e no Google. Eduardo qualifica os leads que chegam pelo WhatsApp.", details: ["Meta Ads e Google Ads ativos", "Remarketing configurado", "Qualificação de leads no CRM", "Otimização diária de verbas"] },
  { n: "08", title: "Relatório",    duration: "semanal",  agents: ["Lucas", "Aira"],              desc: "Lucas entrega o relatório semanal com métricas reais. Aira consolida e recomenda o próximo ciclo.", details: ["Dashboard de performance", "Relatório semanal", "Análise de ROI por canal", "Recomendações para o próximo mês"] },
];

/* Cenário de demonstração da seção pinada: cliente fictício. */
type Peca = { id: string; dia: number; formato: string; tema: string; pilar: string };
const PECAS: Peca[] = [
  { id: "p1", dia: 8,  formato: "reels",     pilar: "educação", tema: "Por que a dor volta" },
  { id: "p2", dia: 12, formato: "carrossel", pilar: "educação", tema: "A dor tem endereço" },
  { id: "p3", dia: 17, formato: "reels",     pilar: "bastidor", tema: "Primeira consulta, sem mistério" },
  { id: "p4", dia: 22, formato: "carrossel", pilar: "prova",    tema: "Três meses depois" },
  { id: "p5", dia: 24, formato: "post",      pilar: "educação", tema: "Sentar não é descansar" },
  { id: "p6", dia: 30, formato: "carrossel", pilar: "bastidor", tema: "Quem cuida de você" },
];
/* Setembro de 2026 começa numa terça e tem 30 dias. */
const CALENDARIO: Array<{ dia: number | null; i?: number }> = (() => {
  const cells: Array<{ dia: number | null; i?: number }> = [];
  for (let k = 0; k < 2; k++) cells.push({ dia: null });
  for (let d = 1; d <= 30; d++) { const i = PECAS.findIndex((x) => x.dia === d); cells.push({ dia: d, i: i >= 0 ? i : undefined }); }
  while (cells.length % 7) cells.push({ dia: null });
  return cells;
})();
const emDaPeca = (i: number) => 0.1 + i * 0.13;
const em = (v: number) => ({ "--em": v } as CSSProperties);

/* Faixas salariais de mercado (estimativa), usadas na comparação de custo. */
const SALARIES: Array<[string, string]> = [
  ["Gerente de Marketing Sênior", "R$ 8.000 a 14.000"],
  ["Copywriter / Redator",        "R$ 5.000 a 8.000"],
  ["Designer Gráfico",            "R$ 5.000 a 9.000"],
  ["Especialista em Tráfego",     "R$ 5.000 a 9.000"],
  ["Social Media",                "R$ 3.500 a 5.500"],
  ["Analista de Marketing",       "R$ 4.500 a 7.000"],
  ["SDR / Pré-vendedor",          "R$ 3.500 a 6.000"],
  ["Web Designer / WordPress",    "R$ 4.000 a 6.500"],
  ["Revisora de Conteúdo",        "R$ 2.500 a 4.000"],
];

const NAV: Array<[string, string]> = [["Processo", "#processo"], ["Serviços", "#servicos"], ["Soluções", "#solucoes"], ["Time", "#time"]];

/* ─────────────────────────────────────────────────────────────────────────────
   CSS. Mobile-first, sem !important. Tokens no topo; tudo que é layout mora
   aqui, inline só entra cor dinâmica por agente.
   ───────────────────────────────────────────────────────────────────────── */
const CSS = `
  .lp { --lime:${LIME}; --ink:${INK}; --canvas:${CANVAS};
        --ink-2: rgba(242,241,234,.62); --ink-3: rgba(242,241,234,.38);
        --line: rgba(242,241,234,.12); --line-2: rgba(242,241,234,.22);
        --pad: clamp(20px, 5vw, 72px); --w: 1360px;
        --display: 'Instrument Sans', 'Manrope', system-ui, sans-serif;
        --body: 'Instrument Sans', 'Manrope', system-ui, sans-serif;
        --serif: 'Instrument Serif', 'Times New Roman', serif;
        --mono: 'DM Mono', ui-monospace, monospace;
        font-family: var(--body); color: var(--ink); background: var(--canvas);
        -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
  html:has(.lp), body:has(.lp) { overflow-x: clip; scroll-behavior: auto; background: ${CANVAS}; }
  body:has(.lp) .fixed.inset-x-0.bottom-0 { z-index: 60; }
  .lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp a { color: inherit; text-decoration: none; }
  .lp button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  .lp h1, .lp h2, .lp h3 { font-family: var(--display); font-weight: 700; letter-spacing: -0.035em; line-height: .98; overflow-wrap: normal; }
  .lp-serif, .lp h1 em, .lp h2 em, .lp h3 em { font-family: var(--serif); font-style: italic; font-weight: 400; letter-spacing: -0.015em; }
  .lp h2 em { color: var(--lime); }
  .lp p { line-height: 1.6; }
  .lp ::selection { background: var(--lime); color: ${CANVAS}; }
  .lp-mono { font-family: var(--mono); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
  .lp-wrap { max-width: var(--w); margin: 0 auto; padding-left: var(--pad); padding-right: var(--pad); }
  .lp-outline { color: transparent; -webkit-text-stroke: 1.5px var(--lime); }
  @supports not (-webkit-text-stroke: 1px #000) { .lp-outline { color: var(--lime); } }
  .lp-grain { position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: .05; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

  /* botões */
  .lp-btn { display: inline-flex; align-items: center; gap: 10px; height: 52px; padding: 0 26px; border-radius: 999px; font-weight: 700; font-size: 14px; border: 1px solid var(--line-2); transition: transform .35s cubic-bezier(.2,.7,0,1), background .25s, color .25s, border-color .25s; white-space: nowrap; }
  .lp-btn:hover { transform: translateY(-2px); border-color: var(--ink); }
  .lp-btn svg { transition: transform .35s cubic-bezier(.2,.7,0,1); }
  .lp-btn:hover svg { transform: translate(2px, -2px); }
  .lp-btn--lime:hover { box-shadow: 0 16px 36px -14px rgba(185,255,75,.55); }
  .lp-btn--lime { background: var(--lime); color: ${CANVAS}; border-color: var(--lime); }
  .lp-btn--lime:hover { background: #ceff70; border-color: #ceff70; }
  .lp-btn--ink { background: var(--ink); color: ${CANVAS}; border-color: var(--ink); }
  .lp-btn--sm { height: 40px; padding: 0 18px; font-size: 13px; }
  .lp-link { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; border-bottom: 1px solid var(--line-2); padding-bottom: 4px; transition: border-color .25s, gap .25s; }
  .lp-link:hover { border-color: var(--lime); gap: 12px; }

  /* barra */
  .lp-nav { position: fixed; inset: 0 0 auto 0; z-index: 200; height: 68px; display: flex; align-items: center; border-bottom: 1px solid transparent; transition: background .35s, border-color .35s, transform .5s cubic-bezier(.2,.7,0,1); }
  .lp-nav.is-hidden { transform: translateY(-100%); }
  .lp-nav.is-solid { background: rgba(10,10,10,.92); border-color: var(--line); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
  .lp-nav__in { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .lp-brand { display: inline-flex; align-items: center; gap: 10px; font-family: var(--display); font-weight: 700; font-size: 16px; letter-spacing: -0.02em; }
  .lp-brand img { width: 30px; height: 30px; border-radius: 8px; }
  .lp-nav__links { display: none; }
  .lp-nav__cta { display: none; }
  .lp-burger { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line-2); border-radius: 999px; }
  @media (min-width: 900px) {
    .lp-nav__links { display: flex; gap: 32px; font-size: 13.5px; font-weight: 600; color: var(--ink-2); }
    .lp-nav__links a { transition: color .2s; } .lp-nav__links a:hover { color: var(--ink); }
    .lp-nav__cta { display: flex; align-items: center; gap: 22px; }
    .lp-nav__cta .lp-entrar { font-size: 13.5px; font-weight: 600; color: var(--ink-2); }
    .lp-burger { display: none; }
  }
  .lp-menu { position: fixed; inset: 0; z-index: 190; background: var(--canvas); display: flex; flex-direction: column; justify-content: center; padding: 96px var(--pad) 40px; gap: 6px; }
  .lp-menu a.lp-menu__l { font-family: var(--display); font-weight: 700; font-size: clamp(34px, 9vw, 56px); letter-spacing: -0.04em; line-height: 1.05; padding: 8px 0; border-bottom: 1px solid var(--line); }
  .lp-menu__cta { display: flex; flex-direction: column; gap: 10px; margin-top: 28px; }

  /* hero: referência NUORBIT. Palavra única espaçada atravessando um anel de
     luz; o anel tem metade atrás e metade na frente das letras. */
  .lp-hero { position: relative; min-height: 100svh; display: flex; flex-direction: column; justify-content: center; padding: 96px 0 150px; overflow: hidden; isolation: isolate; }
  .lp-plane { position: absolute; inset: -14% 0; pointer-events: none; will-change: transform; }
  .lp-plane--far { z-index: 0; overflow: hidden; }
  .lp-hero__bg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; opacity: .9; filter: saturate(1.05); -webkit-mask-image: radial-gradient(120% 90% at 58% 50%, #000 40%, transparent 100%); mask-image: radial-gradient(120% 90% at 58% 50%, #000 40%, transparent 100%); }
  .lp-hero::after { content: ""; position: absolute; inset: auto 0 0 0; height: 30%; background: linear-gradient(to bottom, transparent, var(--canvas)); z-index: 1; pointer-events: none; }
  .lp-plane--rule { z-index: 0; background-image: linear-gradient(90deg, var(--line) 1px, transparent 1px); background-size: calc(100% / 6) 100%; -webkit-mask-image: linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent); mask-image: linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent); opacity: .6; }
  .lp-plane--near { z-index: 6; background: radial-gradient(40% 22% at 58% 112%, rgba(185,255,75,.12), transparent 70%); }
  .lp-hero__in { position: relative; z-index: auto; min-width: 0; max-width: 100%; width: 100%; text-align: center; }
  .lp-h1 { position: relative; z-index: 3; }
  .lp-hero__meta { position: relative; z-index: 5; }
  .lp-h1 { font-size: clamp(30px, 9vw, 118px); font-weight: 500; letter-spacing: .14em; text-transform: uppercase; line-height: 1; padding-left: .14em; white-space: nowrap; }
  .lp-h1 .ch { display: inline-block; opacity: 0; transform: translateY(.35em); animation: lp-ch 1s cubic-bezier(.2,.7,0,1) forwards; animation-delay: calc(.15s + var(--i) * 45ms); text-shadow: 0 0 40px rgba(185,255,75,.18); }
  @keyframes lp-ch { to { opacity: 1; transform: none; } }
  .lp-h1__sub { display: block; margin-top: clamp(14px, 2.4vh, 26px); font-family: var(--display); font-weight: 500; font-size: clamp(19px, 2.3vw, 32px); letter-spacing: -0.01em; text-transform: none; color: var(--ink-2); white-space: normal; padding-left: 0; opacity: 0; animation: lp-rise 1s cubic-bezier(.2,.7,0,1) .9s forwards; }
  .lp-h1__sub em { font-family: var(--serif); font-style: italic; font-weight: 400; color: var(--ink); font-size: 1.1em; }
  .lp-h1__sub b { font-weight: 500; color: var(--lime); }
  .lp-hero__meta { display: flex; flex-direction: column; align-items: center; gap: 18px; margin-top: clamp(28px, 5vh, 52px); opacity: 0; animation: lp-rise 1s cubic-bezier(.2,.7,0,1) 1.1s forwards; }
  .lp-hero__eyebrow { display: inline-flex; align-items: center; gap: 12px; }
  .lp-hero__eyebrow i { display: block; width: 36px; height: 1px; background: var(--lime); transform: scaleX(0); transform-origin: left; animation: lp-draw .9s cubic-bezier(.2,.7,0,1) 1.2s forwards; }
  @keyframes lp-draw { to { transform: none; } }
  @keyframes lp-rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
  .lp-hero__ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  @media (min-width: 900px) {
    .lp-hero { padding: 120px 0 160px; }
    .lp-h1 { font-size: clamp(60px, 8.1vw, 122px); letter-spacing: .24em; padding-left: .24em; }
    .lp-hero__in { text-align: left; }
    .lp-h1 { text-align: center; }
    .lp-h1__sub { text-align: center; }
    .lp-hero__meta { flex-direction: row; justify-content: space-between; align-items: center; }
    .lp-hero__ctas { justify-content: flex-start; }
  }

  /* anel de luz */
  .lp-anel { position: absolute; left: 50%; top: 50%; width: min(86vw, 74svh, 720px); aspect-ratio: 1; transform: translate(-46%, -56%); pointer-events: none; opacity: 0; animation: lp-anel-in 1.8s cubic-bezier(.2,.7,0,1) .2s forwards; }
  @media (min-width: 900px) { .lp-anel { transform: translate(-42%, -55%); width: min(52vw, 78svh, 760px); } }
  .lp-anel--tras { z-index: 2; }
  .lp-anel--frente { z-index: 4; }
  @keyframes lp-anel-in { from { opacity: 0; transform: translate(-46%, -56%) scale(.92); } to { opacity: 1; } }
  @media (min-width: 900px) { @keyframes lp-anel-in { from { opacity: 0; transform: translate(-42%, -55%) scale(.92); } to { opacity: 1; } } }
  .lp-anel svg { width: 100%; height: 100%; overflow: visible; display: block; }
  .lp-anel__glow { filter: blur(14px); opacity: .55; }
  .lp-anel__glow2 { filter: blur(40px); opacity: .35; }
  .lp-anel__node { transition: r .4s, fill .4s; }
  .lp-hero__floor { position: absolute; z-index: 1; left: 50%; bottom: 8%; width: min(90vw, 900px); height: 26vh; transform: translateX(-42%); background: radial-gradient(50% 60% at 50% 100%, rgba(185,255,75,.16), transparent 70%); pointer-events: none; }

  /* barra inferior do hero: fatos reais, atalho e redes */
  .lp-hero__bar { position: absolute; z-index: 5; left: 0; right: 0; bottom: 0; padding-top: 18px; padding-bottom: calc(18px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 16px; opacity: 0; animation: lp-rise 1s cubic-bezier(.2,.7,0,1) 1.3s forwards; }
  .lp-hero__bar::before { content: ""; position: absolute; left: var(--pad); right: var(--pad); top: 0; height: 1px; background: var(--line-2); }
  .lp-hero__facts { list-style: none; display: flex; gap: clamp(22px, 4vw, 56px); }
  .lp-hero__facts li { display: flex; flex-direction: column; gap: 4px; }
  .lp-hero__facts b { font-family: var(--display); font-weight: 600; font-size: clamp(20px, 2vw, 28px); letter-spacing: -0.02em; line-height: 1; }
  .lp-hero__facts b small { font-size: .6em; color: var(--lime); margin-left: 2px; }
  .lp-hero__facts span { font-family: var(--mono); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
  .lp-hero__side { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
  .lp-hero__play { display: inline-flex; align-items: center; gap: 12px; font-family: var(--mono); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-2); }
  .lp-hero__play i { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--line-2); display: inline-flex; align-items: center; justify-content: center; transition: background .25s, color .25s, border-color .25s; }
  .lp-hero__play:hover i { background: var(--lime); color: ${CANVAS}; border-color: var(--lime); }
  .lp-hero__social { display: flex; gap: 8px; }
  @media (min-width: 900px) {
    .lp-hero__bar { flex-direction: row; align-items: center; justify-content: space-between; padding-top: 22px; padding-bottom: 26px; }
    .lp-hero__side { gap: 36px; }
  }
  @media (max-width: 899px) { .lp-hero__social { display: none; } }

  /* manifesto */
  .lp-manifesto { padding: clamp(56px, 10vw, 120px) 0; border-top: 1px solid var(--line); }
  .lp-manifesto p { font-family: var(--display); font-weight: 600; font-size: clamp(24px, 4.2vw, 56px); letter-spacing: -0.03em; line-height: 1.12; max-width: 22ch; }
  .wd { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: .1em; margin-bottom: -.1em; }
  .wd > span { display: inline-block; transform: translateY(108%); transition: transform 1s cubic-bezier(.2,.7,0,1); transition-delay: calc(var(--i) * 24ms); }
  .sc-in .wd > span { transform: none; }
  .wd.is-em { color: var(--lime); font-family: var(--serif); font-style: italic; font-weight: 400; letter-spacing: -0.01em; font-size: 1.06em; }
  .lp-manifesto__meta { display: flex; gap: 28px; flex-wrap: wrap; margin-top: 28px; }
  .lp-manifesto__meta span { display: inline-flex; align-items: center; gap: 10px; }
  .lp-manifesto__meta i { width: 6px; height: 6px; border-radius: 50%; background: var(--lime); display: inline-block; }

  /* capítulos */
  .lp-chapter { border-top: 1px solid var(--line); padding: clamp(56px, 9vw, 120px) 0; }
  .lp-chapter__grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
  @media (min-width: 900px) { .lp-chapter__grid { grid-template-columns: minmax(0, 5.5fr) minmax(0, 6.5fr); gap: 64px; } .lp-chapter__head { position: sticky; top: 100px; align-self: start; } }
  .lp-chapter__n { font-family: var(--mono); font-size: 12px; letter-spacing: .14em; color: var(--lime); display: flex; align-items: center; gap: 12px; }
  .lp-chapter__n::after { content: ""; flex: 0 0 40px; height: 1px; background: var(--lime); transform: scaleX(0); transform-origin: left; transition: transform .9s cubic-bezier(.2,.7,0,1) .25s; }
  .sc-in .lp-chapter__n::after { transform: none; }
  .lp-h2 { font-size: clamp(34px, 4.3vw, 64px); margin-top: 18px; }
  .lp-chapter__lede { font-size: clamp(15px, 1.2vw, 18px); color: var(--ink-2); margin-top: 22px; max-width: 44ch; }
  .lp-chapter__lede + .lp-link { margin-top: 22px; }

  /* processo: linhas expansíveis */
  .lp-rows { border-top: 1px solid var(--line-2); }
  .lp-row { border-bottom: 1px solid var(--line); }
  .lp-row__btn { width: 100%; display: grid; grid-template-columns: 34px 1fr auto; align-items: baseline; gap: 14px; padding: 20px 0; text-align: left; transition: padding .3s; }
  .lp-row__btn:hover .lp-row__t { color: var(--lime); transform: translateX(6px); }
  .lp-row__t { transition: color .25s, transform .45s cubic-bezier(.2,.7,0,1); }
  .lp-row__n { font-family: var(--mono); font-size: 12px; color: var(--ink-3); letter-spacing: .1em; }
  .lp-row__t { font-family: var(--display); font-weight: 700; font-size: clamp(22px, 2.6vw, 34px); letter-spacing: -0.035em; transition: color .25s; }
  .lp-row__meta { font-family: var(--mono); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); display: none; }
  .lp-row__plus { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line-2); border-radius: 50%; transition: transform .35s cubic-bezier(.2,.7,0,1), background .25s, color .25s; align-self: center; }
  .lp-row[data-open="true"] .lp-row__plus { transform: rotate(45deg); background: var(--lime); color: ${CANVAS}; border-color: var(--lime); }
  .lp-row__body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s cubic-bezier(.2,.7,0,1); }
  .lp-row[data-open="true"] .lp-row__body { grid-template-rows: 1fr; }
  .lp-row__body > div { overflow: hidden; }
  .lp-row__inner { display: grid; grid-template-columns: 1fr; gap: 18px; padding: 0 0 26px 48px; }
  .lp-row__inner p { color: var(--ink-2); font-size: 15px; max-width: 46ch; }
  .lp-row__agents { display: flex; flex-wrap: wrap; gap: 6px; }
  .lp-chip { font-family: var(--mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; padding: 6px 10px; border: 1px solid var(--line-2); border-radius: 999px; color: var(--ink-2); }
  .lp-row__list { list-style: none; display: grid; gap: 8px; font-size: 13.5px; color: var(--ink-2); }
  .lp-row__list li { display: flex; gap: 10px; align-items: baseline; }
  .lp-row__list li::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--lime); flex: 0 0 5px; position: relative; top: -2px; }
  @media (min-width: 700px) { .lp-row__btn { grid-template-columns: 40px 1fr auto auto; } .lp-row__meta { display: block; } .lp-row__inner { grid-template-columns: 1.2fr 1fr; gap: 32px; padding-left: 54px; } }

  /* o mês se montando (pinado) */
  .lp-month { position: relative; border-top: 1px solid var(--line); }
  .lp-month__stage { min-height: 100svh; display: flex; align-items: safe center; padding: 84px 0 28px; }
  .lp-month__head { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 24px; align-items: end; }
  @media (min-width: 900px) { .lp-month__head { grid-template-columns: 1.1fr 1fr; gap: 48px; } }
  .lp-month__head .lp-h2 { margin-top: 12px; }
  .lp-month__grid { display: grid; grid-template-columns: 1fr; gap: 12px; border-top: 1px solid var(--line-2); padding-top: 18px; }
  @media (min-width: 900px) { .lp-month__grid { grid-template-columns: minmax(0, 1.45fr) minmax(280px, 1fr); gap: 56px; } }
  .lp-cal { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
  .lp-cal__dow { font-family: var(--mono); font-size: 10px; letter-spacing: .12em; color: var(--ink-3); padding: 0 0 10px 8px; }
  .lp-cal__d { position: relative; aspect-ratio: 1 / .62; border-top: 1px solid var(--line); border-left: 1px solid var(--line); padding: 7px 8px; font-family: var(--mono); font-size: 11px; color: var(--ink-3); overflow: hidden; }
  .lp-cal__d:nth-child(7n) { border-right: 1px solid var(--line); }
  .lp-cal__d:nth-last-child(-n+7) { border-bottom: 1px solid var(--line); }
  .lp-cal__d.is-off { color: transparent; }
  .lp-cal__d.has { --v: clamp(0, calc((var(--sc-p, 0) - var(--em)) * 7), 1); }
  .lp-cal__d.has::after { content: ""; position: absolute; inset: 0; background: rgba(185,255,75,calc(var(--v) * .08)); pointer-events: none; }
  .lp-cal__chip { position: absolute; left: 6px; right: 6px; bottom: 6px; padding: 4px 7px; border-radius: 4px; font-family: var(--mono); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: ${CANVAS}; background: var(--lime); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: var(--v, 0); transform: translateY(calc((1 - var(--v, 0)) * 8px)); z-index: 1; }
  .lp-month__foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding-top: 14px; }
  .lp-month__foot p { font-size: 13px; color: var(--ink-2); max-width: 40ch; }
  .lp-count { font-family: var(--display); font-weight: 700; font-size: clamp(44px, 6vw, 88px); letter-spacing: -0.05em; line-height: .9; color: var(--lime); display: flex; align-items: baseline; gap: 10px; }
  .lp-count small { font-family: var(--mono); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
  .lp-queue { list-style: none; }
  .lp-queue__head { display: flex; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid var(--line-2); }
  .lp-q { display: grid; grid-template-columns: 44px 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); --v: clamp(0, calc((var(--sc-p, 0) - var(--em)) * 7), 1); opacity: var(--v); transform: translateX(calc((1 - var(--v)) * 14px)); }
  .lp-q__d { font-family: var(--display); font-weight: 700; font-size: 20px; letter-spacing: -0.03em; line-height: 1; }
  .lp-q__d small { display: block; font-family: var(--mono); font-size: 9px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); margin-top: 4px; }
  .lp-q__t { font-weight: 700; font-size: 14px; }
  .lp-q__s { font-family: var(--mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); margin-top: 4px; }
  @media (prefers-reduced-motion: reduce) { .lp-cal__d.has, .lp-q { --v: 1; transform: none; opacity: 1; } .lp-h1 .ch, .lp-h1__sub, .lp-hero__meta, .lp-hero__bar, .lp-hero__eyebrow i, .lp-anel { animation: none; opacity: 1; transform: none; } .lp-anel { transform: translate(-46%, -56%); } .wd > span { transform: none; transition: none; } .lp-chapter__n::after { transform: none; } .lp-nav.is-hidden { transform: none; } }
  .lp-month .lp-h2 { font-size: clamp(32px, 4.2vw, 60px); }
  @media (max-height: 940px) and (min-width: 900px) { .lp-month__stage { padding-top: 76px; } .lp-month .lp-h2 { font-size: clamp(30px, 4.6vh, 56px); } .lp-cal__d { aspect-ratio: 1 / .52; } .lp-q { padding: 8px 0; } .lp-month__head { margin-bottom: 12px; } .lp-month__grid { padding-top: 12px; } }
  @media (max-width: 899px) {
    .lp-month__stage { padding: 72px 0 14px; }
    .lp-month .lp-h2 { font-size: clamp(26px, 7.6vw, 36px); margin-top: 8px; }
    .lp-month__head { gap: 6px; margin-bottom: 12px; }
    .lp-month__head .lp-chapter__lede { font-size: 13px; margin-top: 0; }
    .lp-month__grid { gap: 10px; padding-top: 12px; }
    .lp-cal__dow { padding-bottom: 6px; font-size: 9px; }
    .lp-cal__d { aspect-ratio: 1 / .52; font-size: 10px; padding: 4px 5px; }
    .lp-cal__chip { font-size: 8.5px; padding: 2px 4px; left: 3px; right: 3px; bottom: 3px; letter-spacing: .04em; }
    .lp-month__foot { padding-top: 8px; } .lp-month__foot p { display: none; } .lp-count { font-size: 34px; }
    .lp-queue__head { padding-bottom: 6px; }
    .lp-q { padding: 5px 0; gap: 8px; grid-template-columns: 38px 1fr; }
    .lp-q__d { font-size: 14px; } .lp-q__d small { display: inline; margin-left: 3px; }
    .lp-q__t { font-size: 12.5px; } .lp-q__s { display: none; }
  }

  /* serviços: índice */
  .lp-services { list-style: none; display: grid; grid-template-columns: 1fr; border-top: 1px solid var(--line-2); }
  .lp-service { position: relative; display: grid; grid-template-columns: 56px 1fr; gap: 12px; padding: 24px 0; border-bottom: 1px solid var(--line); transition: padding-left .35s cubic-bezier(.2,.7,0,1); }
  .lp-service::before { content: ""; position: absolute; left: 0; top: -1px; height: 1px; width: 0; background: var(--lime); transition: width .5s cubic-bezier(.2,.7,0,1); }
  .lp-service:hover::before { width: 100%; }
  .lp-service:hover { padding-left: 8px; }
  .lp-service__n { font-family: var(--display); font-weight: 700; font-size: 26px; letter-spacing: -0.04em; color: transparent; -webkit-text-stroke: 1px var(--ink-3); line-height: 1; }
  .lp-service h3 { font-size: clamp(20px, 2.1vw, 28px); letter-spacing: -0.03em; }
  .lp-service p { color: var(--ink-2); font-size: 14.5px; margin-top: 8px; max-width: 40ch; }
  @media (min-width: 700px) { .lp-services { grid-template-columns: 1fr 1fr; column-gap: 48px; } }

  /* soluções */
  .lp-products { border-top: 1px solid var(--line-2); }
  .lp-product { display: grid; grid-template-columns: 1fr; gap: 16px; padding: clamp(28px, 4vw, 44px) 0; border-bottom: 1px solid var(--line); }
  @media (min-width: 900px) { .lp-product { grid-template-columns: 180px 1fr 1fr; gap: 40px; } }
  .lp-product__tag { display: inline-flex; align-items: center; gap: 8px; }
  .lp-product__tag i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .lp-product h3 { font-size: clamp(32px, 4vw, 56px); letter-spacing: -0.04em; }
  .lp-product__sub { font-family: var(--mono); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); margin-top: 10px; }
  .lp-product p { color: var(--ink-2); font-size: 15px; max-width: 46ch; }
  .lp-product__items { list-style: none; display: grid; gap: 8px; margin-top: 16px; font-size: 13.5px; }
  .lp-product__items li { display: flex; gap: 10px; align-items: baseline; color: var(--ink-2); }
  .lp-product__items li::before { content: ""; width: 14px; height: 1px; background: var(--ink-3); flex: 0 0 14px; position: relative; top: -4px; }
  .lp-product .lp-link { margin-top: 20px; }

  /* time: elenco */
  .lp-roster { list-style: none; border-top: 1px solid var(--line-2); }
  .lp-cast { border-bottom: 1px solid var(--line); }
  .lp-cast__btn { width: 100%; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; padding: 16px 0; text-align: left; }
  .lp-cast__name { font-family: var(--display); font-weight: 700; font-size: clamp(26px, 3.6vw, 46px); letter-spacing: -0.04em; line-height: 1; display: flex; align-items: center; gap: 14px; transition: color .25s; }
  .lp-cast__name i { width: 10px; height: 10px; border-radius: 50%; flex: 0 0 10px; transform: scale(.6); transition: transform .35s; }
  .lp-cast__btn:hover .lp-cast__name i, .lp-cast[data-open="true"] .lp-cast__name i { transform: scale(1); }
  .lp-cast__name { transition: color .25s, transform .45s cubic-bezier(.2,.7,0,1); }
  .lp-cast__btn:hover .lp-cast__name { transform: translateX(6px); }
  .lp-cast__role { font-family: var(--mono); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); text-align: right; }
  .lp-cast__body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s cubic-bezier(.2,.7,0,1); }
  .lp-cast[data-open="true"] .lp-cast__body { grid-template-rows: 1fr; }
  .lp-cast__body > div { overflow: hidden; }
  .lp-cast__inner { display: grid; grid-template-columns: 1fr; gap: 14px; padding: 0 0 22px 24px; }
  .lp-cast__inner p { color: var(--ink-2); font-size: 14.5px; max-width: 46ch; }
  @media (min-width: 700px) { .lp-cast__inner { grid-template-columns: 1.3fr 1fr; gap: 32px; } }
  .lp-roster__big { font-family: var(--display); font-weight: 700; font-size: clamp(96px, 20vw, 260px); letter-spacing: -0.06em; line-height: .8; color: transparent; -webkit-text-stroke: 1.5px var(--line-2); margin-top: 18px; }
  @supports not (-webkit-text-stroke: 1px #000) { .lp-roster__big { color: var(--line-2); } }

  /* economia */
  .lp-econ__big { font-size: clamp(34px, 4.4vw, 62px); margin-top: 18px; }
  .lp-econ__big em { font-size: 1.04em; }
  .lp-table { list-style: none; border-top: 1px solid var(--line-2); }
  .lp-table li { display: flex; justify-content: space-between; gap: 16px; padding: 13px 0; border-bottom: 1px solid var(--line); font-size: 14.5px; }
  .lp-table li span:last-child { font-family: var(--mono); font-size: 12px; letter-spacing: .04em; color: var(--ink-2); white-space: nowrap; }
  .lp-table li.is-total { padding: 18px 0; font-weight: 700; font-family: var(--display); font-size: 16px; border-bottom: 1px solid var(--lime); }
  .lp-table li.is-total span:last-child { color: var(--lime); font-size: 13px; }
  .lp-table__note { font-family: var(--mono); font-size: 10.5px; letter-spacing: .08em; color: var(--ink-3); margin-top: 12px; text-transform: uppercase; }

  /* fecho */
  .lp-close { background: var(--lime); color: ${CANVAS}; padding: clamp(64px, 11vw, 150px) 0; }
  .lp-close .lp-mono { color: rgba(10,10,10,.55); }
  .lp-close h2 em { color: inherit; }
  .lp-close h2 { font-size: clamp(44px, 9.6vw, 148px); letter-spacing: -0.055em; line-height: .9; margin-top: 18px; max-width: 12ch; }
  .lp-close__row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: clamp(28px, 4vw, 48px); padding-top: 24px; border-top: 1px solid rgba(10,10,10,.25); }
  .lp-close .lp-btn { border-color: ${CANVAS}; color: ${CANVAS}; }
  .lp-close .lp-btn--ink { background: ${CANVAS}; color: var(--lime); }
  .lp-close .lp-btn:hover { border-color: ${CANVAS}; }
  .lp-close__note { font-size: 14px; color: rgba(10,10,10,.7); max-width: 34ch; margin-left: auto; }

  /* rodapé */
  .lp-footer { padding: 40px 0 calc(28px + env(safe-area-inset-bottom)); border-top: 1px solid var(--line); }
  .lp-footer__in { display: flex; flex-direction: column; gap: 22px; }
  .lp-footer__links { display: flex; flex-wrap: wrap; gap: 18px; }
  .lp-footer__links a { transition: color .2s; } .lp-footer__links a:hover { color: var(--ink); }
  .lp-footer__social { display: flex; gap: 8px; }
  .lp-social { width: 40px; height: 40px; border: 1px solid var(--line-2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: var(--ink-2); transition: border-color .2s, color .2s; }
  .lp-social:hover { border-color: var(--ink); color: var(--ink); }
  @media (min-width: 900px) { .lp-footer__in { flex-direction: row; align-items: center; justify-content: space-between; } }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Fundo vivo do hero: uma aurora em canvas. Cinco luzes grandes e macias
   (limão, limão escuro, violeta) deslizam em trajetórias senoidais, somadas
   em modo "lighter", desenhadas em baixa resolução e ampliadas pelo CSS.
   Segue o mouse de leve, pausa fora da tela e vira um quadro parado sob
   prefers-reduced-motion.
   ───────────────────────────────────────────────────────────────────────── */
type Luz = { cor: [number, number, number]; a: number; r: number; cx: number; cy: number; ax: number; ay: number; fx: number; fy: number; px: number; py: number };
const LUZES: Luz[] = [
  { cor: [185, 255, 75],  a: .42, r: .46, cx: .74, cy: .34, ax: .10, ay: .08, fx: .11, fy: .09, px: 0,   py: 1.2 },
  { cor: [185, 255, 75],  a: .22, r: .38, cx: .30, cy: .78, ax: .12, ay: .07, fx: .07, fy: .13, px: 2.1, py: .4 },
  { cor: [90, 140, 40],   a: .30, r: .52, cx: .52, cy: .52, ax: .16, ay: .10, fx: .05, fy: .08, px: 4.0, py: 2.6 },
  { cor: [140, 120, 255], a: .16, r: .40, cx: .12, cy: .22, ax: .08, ay: .10, fx: .09, fy: .06, px: 1.0, py: 3.3 },
  { cor: [185, 255, 75],  a: .14, r: .30, cx: .90, cy: .86, ax: .06, ay: .06, fx: .13, fy: .11, px: 5.2, py: .9 },
];

function FundoVivo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let vivo = true, visivel = true, raf = 0, w = 0, h = 0;
    const alvo = { x: 0, y: 0 }, mouse = { x: 0, y: 0 };
    const medir = () => {
      const r = canvas.getBoundingClientRect();
      const esc = 0.22;
      w = Math.max(160, Math.round(r.width * esc));
      h = Math.max(120, Math.round(r.height * esc));
      canvas.width = w; canvas.height = h;
    };
    const quadro = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      mouse.x += (alvo.x - mouse.x) * .04; mouse.y += (alvo.y - mouse.y) * .04;
      const m = Math.min(w, h);
      for (const L of LUZES) {
        const x = (L.cx + L.ax * Math.sin(t * L.fx + L.px)) * w + mouse.x * w * .06;
        const y = (L.cy + L.ay * Math.cos(t * L.fy + L.py)) * h + mouse.y * h * .06;
        const r = L.r * m * (1 + .08 * Math.sin(t * .17 + L.px));
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const [cr, cg, cb] = L.cor;
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${L.a})`);
        g.addColorStop(.45, `rgba(${cr},${cg},${cb},${L.a * .35})`);
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = "source-over";
    };
    const laco = (ms: number) => {
      if (!vivo) return;
      if (visivel && !document.hidden) quadro(ms / 1000);
      raf = requestAnimationFrame(laco);
    };
    medir();
    if (reduz) { quadro(3.2); }
    else { raf = requestAnimationFrame(laco); }
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      alvo.x = ((e.clientX - r.left) / r.width - .5) * 2;
      alvo.y = ((e.clientY - r.top) / r.height - .5) * 2;
    };
    const onLeave = () => { alvo.x = 0; alvo.y = 0; };
    const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => { visivel = es.some((e) => e.isIntersecting); }) : null;
    io?.observe(canvas);
    const ro = "ResizeObserver" in window ? new ResizeObserver(() => { medir(); if (reduz) quadro(3.2); }) : null;
    ro?.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      vivo = false; cancelAnimationFrame(raf);
      io?.disconnect(); ro?.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return <canvas ref={ref} className="lp-hero__bg" aria-hidden="true" />;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Anel de luz: uma elipse inclinada, com brilho, dividida em duas camadas.
   A metade de cima fica atrás das letras e a de baixo na frente, então a
   palavra atravessa o anel. Os doze nós do time andam sobre ele, o ativo
   aceso em limão.
   ───────────────────────────────────────────────────────────────────────── */
function Anel({ active, camada }: { active: number; camada: "tras" | "frente" }) {
  const C = 400, RX = 330, RY = 352, TILT = -12;
  const arco = camada === "tras"
    ? `M ${C - RX} ${C} A ${RX} ${RY} 0 0 1 ${C + RX} ${C}`
    : `M ${C + RX} ${C} A ${RX} ${RY} 0 0 1 ${C - RX} ${C}`;
  return (
    <div className={`lp-anel lp-anel--${camada}`} aria-hidden="true">
      <svg viewBox="0 0 800 800">
        <defs>
          <linearGradient id={`lp-anel-g-${camada}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F4FFD6" />
            <stop offset=".45" stopColor={LIME} />
            <stop offset="1" stopColor="#5E8F1F" />
          </linearGradient>
        </defs>
        <g transform={`rotate(${TILT} ${C} ${C})`}>
          {camada === "tras" && <ellipse className="lp-anel__glow2" cx={C} cy={C} rx={RX} ry={RY} fill="none" stroke={LIME} strokeWidth="60" />}
          <path className="lp-anel__glow" d={arco} fill="none" stroke={LIME} strokeWidth="22" strokeLinecap="round" />
          <path d={arco} fill="none" stroke={`url(#lp-anel-g-${camada})`} strokeWidth="5" strokeLinecap="round" />
          {TEAM.map((t, k) => {
            const a = (k / TEAM.length) * Math.PI * 2 - Math.PI / 2;
            const x = C + Math.cos(a) * RX, y = C + Math.sin(a) * RY;
            const naFrente = Math.sin(a) > 0;
            if ((camada === "frente") !== naFrente) return null;
            const on = k === active;
            return (
              <g key={t.name}>
                <circle className="lp-anel__node" cx={x} cy={y} r={on ? 7 : 3.5} fill={on ? "#F4FFD6" : "rgba(242,241,234,.55)"} />
                {on && <circle cx={x} cy={y} r={18} fill="none" stroke={LIME} strokeOpacity=".6" strokeWidth="1.2" />}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/* Quebra um parágrafo em palavras mascaradas que sobem em cascata quando o
   bloco entra (o motor marca o pai com .sc-in). */
function Palavras({ partes }: { partes: Array<{ t: string; em?: boolean }> }) {
  let i = 0;
  return (
    <>
      {partes.map((pt, k) => pt.t.split(" ").filter(Boolean).map((w, j) => (
        <span key={`${k}-${j}`}>
          <span className={`wd${pt.em ? " is-em" : ""}`} style={{ "--i": i++ } as CSSProperties}><span>{w}</span></span>{" "}
        </span>
      )))}
    </>
  );
}

type Motor = { mount: (el: Element) => unknown };

export default function LandingPage() {
  const [solid, setSolid] = useState(false);
  const [oculta, setOculta] = useState(false);
  const [menu, setMenu] = useState(false);
  const ultimoY = useRef(0);
  const [ativo, setAtivo] = useState(0);
  const [etapa, setEtapa] = useState<number | null>(0);
  const [membro, setMembro] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const contadorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 24);
      setOculta(y > 260 && y > ultimoY.current + 4);
      ultimoY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setAtivo((a) => (a + 1) % TEAM.length), 3600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { document.body.style.overflow = menu ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [menu]);

  /* Motor da scroll-craft: planos do hero, entradas por capítulo e o pin do
     mês. O contador lê --sc-p da seção pinada sem passar por estado React. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let vivo = true;
    let raf = 0;
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = "/scrollcraft/scrollcraft.css";
    document.head.appendChild(link);
    const laco = () => {
      if (!vivo) return;
      const sec = root.querySelector<HTMLElement>(".lp-month");
      if (sec && contadorRef.current) {
        const p = parseFloat(getComputedStyle(sec).getPropertyValue("--sc-p")) || 0;
        const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const n = reduz ? PECAS.length : PECAS.filter((_, i) => p - emDaPeca(i) > 0.02).length;
        if (contadorRef.current.textContent !== String(n)) contadorRef.current.textContent = String(n);
      }
      raf = requestAnimationFrame(laco);
    };
    const montar = () => {
      const SC = (window as unknown as { ScrollCraft?: Motor }).ScrollCraft;
      if (!SC || !vivo) return;
      SC.mount(root);
      raf = requestAnimationFrame(laco);
    };
    if ((window as unknown as { ScrollCraft?: Motor }).ScrollCraft) montar();
    else {
      const existente = document.querySelector<HTMLScriptElement>("script[data-scrollcraft]");
      const sc = existente ?? Object.assign(document.createElement("script"), { src: "/scrollcraft/scrollcraft.js", async: true });
      sc.dataset.scrollcraft = "1";
      sc.addEventListener("load", montar, { once: true });
      if (!existente) document.head.appendChild(sc);
    }
    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      link.remove();
      document.documentElement.style.removeProperty("--sc-canvas");
    };
  }, []);

  return (
    <div className="lp" ref={rootRef}>
      <style>{CSS}</style>
      <div className="lp-grain" aria-hidden="true" />

      {/* BARRA */}
      <nav className={`lp-nav ${solid || menu ? "is-solid" : ""} ${oculta && !menu ? "is-hidden" : ""}`}>
        <div className="lp-wrap lp-nav__in">
          <a href="#" className="lp-brand" onClick={() => setMenu(false)}><img src={caluLogo} alt="" /> Calu Agência</a>
          <div className="lp-nav__links">{NAV.map(([l, h]) => <a key={l} href={h}>{l}</a>)}</div>
          <div className="lp-nav__cta">
            <Link to="/entrar" className="lp-entrar">Entrar</Link>
            <a href="/briefing" className="lp-btn lp-btn--sm">Diagnóstico gratuito <ArrowUpRight size={14} /></a>
          </div>
          <button className="lp-burger" onClick={() => setMenu((m) => !m)} aria-label={menu ? "Fechar menu" : "Abrir menu"} aria-expanded={menu}>
            {menu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
      {menu && (
        <div className="lp-menu" role="dialog" aria-label="Menu">
          {NAV.map(([l, h]) => <a key={l} href={h} className="lp-menu__l" onClick={() => setMenu(false)}>{l}</a>)}
          <Link to="/entrar" className="lp-menu__l" onClick={() => setMenu(false)}>Entrar</Link>
          <div className="lp-menu__cta">
            <a href="/briefing" className="lp-btn lp-btn--lime" onClick={() => setMenu(false)}>Diagnóstico gratuito com IA <ArrowUpRight size={14} /></a>
            <a href={WA} target="_blank" rel="noreferrer" className="lp-btn"><MessageCircle size={14} /> Falar no WhatsApp</a>
          </div>
        </div>
      )}

      {/* HERO: palavra atravessando o anel de luz, sobre a aurora */}
      <header className="lp-hero" data-sc-act="flow">
        <div className="lp-plane lp-plane--far" data-sc-parallax="-0.9" aria-hidden="true"><FundoVivo /></div>
        <div className="lp-plane lp-plane--rule" data-sc-parallax="-0.5" aria-hidden="true" />
        <div className="lp-hero__floor" aria-hidden="true" />
        <Anel active={ativo} camada="tras" />
        <div className="lp-wrap lp-hero__in">
          <h1 className="lp-h1" aria-label="Criatividade que vende. IA que escala.">
            <span aria-hidden="true">{"CRIATIVIDADE".split("").map((c, k) => <span key={k} className="ch" style={{ "--i": k } as CSSProperties}>{c}</span>)}</span>
            <span className="lp-h1__sub" aria-hidden="true"><em>que vende.</em> <b>IA que escala.</b></span>
          </h1>
          <div className="lp-hero__meta">
            <div className="lp-hero__eyebrow"><i /><span className="lp-mono">Agência de marketing com IA · Fortaleza, Brasil</span></div>
            <div className="lp-hero__ctas">
              <a href="/briefing" className="lp-btn lp-btn--lime">Começar com um diagnóstico <ArrowUpRight size={15} /></a>
              <a href={WA} target="_blank" rel="noreferrer" className="lp-btn"><MessageCircle size={15} /> WhatsApp</a>
            </div>
          </div>
        </div>
        <Anel active={ativo} camada="frente" />
        <div className="lp-wrap lp-hero__bar">
          <ul className="lp-hero__facts" aria-label="Em números">
            <li><b>{String(TEAM.length).padStart(2, "0")}</b><span>agentes de IA</span></li>
            <li><b>{String(PROCESS.length).padStart(2, "0")}</b><span>etapas por mês</span></li>
            <li><b>01</b><span>investimento</span></li>
          </ul>
          <div className="lp-hero__side">
            <a href="#processo" className="lp-hero__play"><i><ArrowDown size={15} /></i> Ver o processo</a>
            <div className="lp-hero__social">
              <a href="#" className="lp-social" aria-label="Instagram"><Instagram size={14} /></a>
              <a href="#" className="lp-social" aria-label="LinkedIn"><Linkedin size={14} /></a>
              <a href={WA} target="_blank" rel="noreferrer" className="lp-social" aria-label="WhatsApp"><MessageCircle size={14} /></a>
            </div>
          </div>
        </div>
        <div className="lp-plane lp-plane--near" data-sc-parallax="0.9" aria-hidden="true" />
      </header>

      {/* MANIFESTO */}
      <section className="lp-manifesto">
        <div className="lp-wrap" data-sc-in>
          <p><Palavras partes={[{ t: "Uma agência de publicidade não é um lugar. É um time que" }, { t: "pensa, produz, revisa e publica", em: true }, { t: "todo dia, na ordem certa. A Calu é esse time, em IA, para o seu negócio." }]} /></p>
          <div className="lp-manifesto__meta lp-mono">
            <span><i />Estratégia antes da produção</span>
            <span><i />Revisão antes da aprovação</span>
            <span><i />Relatório toda semana</span>
          </div>
        </div>
      </section>

      {/* 01 PROCESSO */}
      <section id="processo" className="lp-chapter">
        <div className="lp-wrap lp-chapter__grid">
          <div className="lp-chapter__head" data-sc-in>
            <div className="lp-chapter__n">01 · Processo</div>
            <h2 className="lp-h2">Como um mês de marketing <em>acontece.</em></h2>
            <p className="lp-chapter__lede">Oito etapas, cada uma com dono. Cada agente trabalha em cima do que o anterior entregou, e nada vai para o cliente sem passar pela revisão.</p>
          </div>
          <div className="lp-rows" data-sc-in data-sc-stagger="50">
            {PROCESS.map((s, i) => (
              <div key={s.n} className="lp-row" data-open={etapa === i}>
                <button className="lp-row__btn" onClick={() => setEtapa(etapa === i ? null : i)} aria-expanded={etapa === i}>
                  <span className="lp-row__n">{s.n}</span>
                  <span className="lp-row__t">{s.title}</span>
                  <span className="lp-row__meta">{s.duration}</span>
                  <span className="lp-row__plus"><Plus size={14} /></span>
                </button>
                <div className="lp-row__body"><div>
                  <div className="lp-row__inner">
                    <div>
                      <p>{s.desc}</p>
                      <div className="lp-row__agents" style={{ marginTop: 14 }}>{s.agents.map((a) => <span key={a} className="lp-chip">{a}</span>)}</div>
                    </div>
                    <ul className="lp-row__list">{s.details.map((d) => <li key={d}>{d}</li>)}</ul>
                  </div>
                </div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O MÊS SE MONTANDO: seção pinada, cenário de demonstração rotulado */}
      <section className="lp-month" data-sc-act="pin" data-sc-span="3" aria-label="Demonstração: um mês de produção se montando">
        <div data-sc-stage className="lp-month__stage">
          <div className="lp-wrap">
            <div className="lp-month__head">
              <div>
                <div className="lp-chapter__n">Demonstração · cliente fictício</div>
                <h2 className="lp-h2">Veja um mês inteiro{" "}<br /><em>se montar.</em></h2>
              </div>
              <p className="lp-chapter__lede">Role devagar. O calendário enche, a fila de aprovação cresce e o contador sobe: é o que acontece na plataforma depois que o time recebe o briefing.</p>
            </div>
            <div className="lp-month__grid">
              <div>
                <div className="lp-cal">
                  {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <div key={i} className="lp-cal__dow">{d}</div>)}
                  {CALENDARIO.map((c, i) => (
                    <div key={i} className={`lp-cal__d${c.dia === null ? " is-off" : ""}${c.i !== undefined ? " has" : ""}`} style={c.i !== undefined ? em(emDaPeca(c.i)) : undefined}>
                      {c.dia ?? "·"}
                      {c.i !== undefined && <span className="lp-cal__chip">{PECAS[c.i].formato}</span>}
                    </div>
                  ))}
                </div>
                <div className="lp-month__foot">
                  <p>Pedro calendarizou, Beatriz escreveu, Marcela desenhou em cima da copy. Cada peça entra na fila com data e hora.</p>
                  <span className="lp-count"><span ref={contadorRef}>0</span><small>peças</small></span>
                </div>
              </div>
              <div>
                <div className="lp-queue__head lp-mono"><span>Fila de aprovação</span><span style={{ color: LIME }}>Setembro</span></div>
                <ul className="lp-queue">
                  {PECAS.map((pc, i) => (
                    <li key={pc.id} className="lp-q" style={em(emDaPeca(i))}>
                      <div className="lp-q__d">{String(pc.dia).padStart(2, "0")}<small>set</small></div>
                      <div><div className="lp-q__t">{pc.tema}</div><div className="lp-q__s">{pc.formato} · pilar {pc.pilar} · 12:00</div></div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 SERVIÇOS */}
      <section id="servicos" className="lp-chapter">
        <div className="lp-wrap lp-chapter__grid">
          <div className="lp-chapter__head" data-sc-in>
            <div className="lp-chapter__n">02 · Serviços</div>
            <h2 className="lp-h2">Tudo que a marca precisa, <em>num só lugar.</em></h2>
            <p className="lp-chapter__lede">Serviços integrados que trabalham juntos: a estratégia decide, a produção executa, o tráfego distribui e os dados corrigem o rumo.</p>
            <a href={WA} target="_blank" rel="noreferrer" className="lp-link">Montar meu escopo <ArrowRight size={14} /></a>
          </div>
          <ul className="lp-services" data-sc-in data-sc-stagger="50">
            {SERVICES.map((s) => (
              <li key={s.n} className="lp-service">
                <span className="lp-service__n">{s.n}</span>
                <div><h3>{s.title}</h3><p>{s.desc}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 03 SOLUÇÕES */}
      <section id="solucoes" className="lp-chapter">
        <div className="lp-wrap">
          <div data-sc-in style={{ marginBottom: "clamp(28px, 4vw, 48px)", maxWidth: 720 }}>
            <div className="lp-chapter__n">03 · Soluções com IA</div>
            <h2 className="lp-h2">Tecnologia que <em>trabalha por você.</em></h2>
            <p className="lp-chapter__lede">Cada produto nasceu para um nicho específico, resolvendo problemas reais que a tecnologia genérica não atende.</p>
          </div>
          <div className="lp-products" data-sc-in data-sc-stagger="70">
            {PRODUCTS.map((p) => (
              <article key={p.name} className="lp-product">
                <div>
                  <span className="lp-product__tag lp-mono"><i style={{ background: p.color }} />{p.tag}</span>
                </div>
                <div>
                  <h3>{p.name}</h3>
                  <div className="lp-product__sub">{p.sub}</div>
                </div>
                <div>
                  <p>{p.desc}</p>
                  <ul className="lp-product__items">{p.items.map((it) => <li key={it}>{it}</li>)}</ul>
                  <a href={WA} target="_blank" rel="noreferrer" className="lp-link">Conhecer {p.name} <ArrowUpRight size={14} /></a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 04 TIME */}
      <section id="time" className="lp-chapter">
        <div className="lp-wrap lp-chapter__grid">
          <div className="lp-chapter__head" data-sc-in>
            <div className="lp-chapter__n">04 · Time</div>
            <h2 className="lp-h2">Doze especialistas. <em>Um investimento.</em></h2>
            <p className="lp-chapter__lede">Cada agente tem papel, entregas e limites definidos. Toque num nome para ver o que ele faz pelo seu negócio.</p>
            <div className="lp-roster__big" aria-hidden="true">{TEAM.length}</div>
          </div>
          <ul className="lp-roster" data-sc-in data-sc-stagger="40">
            {TEAM.map((t, i) => (
              <li key={t.name} className="lp-cast" data-open={membro === i}>
                <button className="lp-cast__btn" onClick={() => setMembro(membro === i ? null : i)} aria-expanded={membro === i}>
                  <span className="lp-cast__name"><i style={{ background: t.color }} />{t.name}</span>
                  <span className="lp-cast__role">{t.role}</span>
                </button>
                <div className="lp-cast__body"><div>
                  <div className="lp-cast__inner">
                    <p>{t.desc}</p>
                    <ul className="lp-row__list">{t.tasks.map((k) => <li key={k}>{k}</li>)}</ul>
                  </div>
                </div></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 05 ECONOMIA */}
      <section id="economia" className="lp-chapter">
        <div className="lp-wrap lp-chapter__grid">
          <div className="lp-chapter__head" data-sc-in>
            <div className="lp-chapter__n">05 · Custo</div>
            <h2 className="lp-h2 lp-econ__big">Um time completo custa <em>R$ 39.500+</em> por mês.</h2>
            <p className="lp-chapter__lede">É a faixa de salários de mercado para montar essa equipe em casa, sem contar encargos, ferramentas e o tempo de coordenar todo mundo. A Calu entrega o mesmo escopo por uma fração.</p>
            <a href={WA} target="_blank" rel="noreferrer" className="lp-link">Quero saber o valor <ArrowUpRight size={14} /></a>
          </div>
          <div data-sc-in>
            <ul className="lp-table">
              {SALARIES.map(([r, v]) => <li key={r}><span>{r}</span><span>{v}</span></li>)}
              <li className="is-total"><span>Total estimado</span><span>R$ 39.500+ / mês</span></li>
            </ul>
            <div className="lp-table__note">Faixas de mercado, estimativa. Salários brutos, sem encargos.</div>
          </div>
        </div>
      </section>

      {/* FECHO */}
      <section id="contato" className="lp-close">
        <div className="lp-wrap" data-sc-in>
          <div className="lp-mono">Pronto para escalar?</div>
          <h2>Seu time completo <em>começa hoje.</em></h2>
          <div className="lp-close__row">
            <a href="/briefing" className="lp-btn lp-btn--ink">Diagnóstico gratuito com IA <ArrowUpRight size={15} /></a>
            <a href={WA} target="_blank" rel="noreferrer" className="lp-btn"><MessageCircle size={15} /> Falar no WhatsApp</a>
            <p className="lp-close__note">O diagnóstico leva trinta minutos numa conversa com a Lia e vira o briefing do seu primeiro mês.</p>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer__in">
          <a href="#" className="lp-brand"><img src={caluLogo} alt="" /> Calu Agência</a>
          <div className="lp-footer__links lp-mono">
            <Link to="/privacy">Privacidade</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/entrar" style={{ color: LIME }}>Entrar</Link>
            <span>© 2026 · Fortaleza, CE</span>
          </div>
          <div className="lp-footer__social">
            <a href="#" className="lp-social" aria-label="Instagram"><Instagram size={14} /></a>
            <a href="#" className="lp-social" aria-label="LinkedIn"><Linkedin size={14} /></a>
            <a href={WA} target="_blank" rel="noreferrer" className="lp-social" aria-label="WhatsApp"><MessageCircle size={14} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
