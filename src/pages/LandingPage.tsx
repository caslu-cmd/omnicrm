import caluLogo from "@/assets/calu-logo.png";
import { useState, useEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, ArrowDown, MessageCircle, Instagram, Linkedin, Menu, X, Plus, Check } from "lucide-react";

/**
 * Landing page da Calu Agência. Direção: produto de IA (escuro premium).
 *
 * A Calu é um sistema de IA que faz o marketing do negócio, e a página tem a
 * cara desse produto: grafite sóbrio, uma malha técnica de pontos ao fundo,
 * tipografia técnica e compacta (Space Grotesk nos títulos, Inter no corpo,
 * JetBrains Mono nos dados), painéis com status e o limão da marca usado com
 * parcimônia — só no que é ação e sinal vivo (o botão, o ponto pulsando, a
 * palavra que importa). Sem títulos gigantes: hierarquia contida, como uma
 * interface de software. O que se move é o painel ao vivo e o mês se montando.
 *
 * O motor da scroll-craft mora em /public/scrollcraft e nunca é editado.
 */

const LIME = "#B9FF4B";
const INK  = "#E9EDF2";
const BG   = "#0E1115";
const WA   = "https://wa.me/5585986408404";

const SERVICES = [
  { n: "01", title: "Estratégia de Marca",     desc: "Posicionamento, pauta editorial e direção criativa alinhados ao seu negócio." },
  { n: "02", title: "Criação de Conteúdo",     desc: "Posts, reels, stories, artigos e anúncios com foco em conversão real." },
  { n: "03", title: "Tráfego Pago",            desc: "Meta e Google Ads gerenciados para CPA baixo e ROAS consistentemente alto." },
  { n: "04", title: "Gestão de Redes Sociais", desc: "Publicação diária, atendimento e monitoramento de todas as suas plataformas." },
  { n: "05", title: "SEO & Blog",              desc: "Conteúdo otimizado que atrai clientes orgânicos e posiciona sua marca como autoridade." },
  { n: "06", title: "CRM & Automação",         desc: "Leads qualificados, nurturados e convertidos via WhatsApp e automações." },
];

const PRODUCTS = [
  { tag: "CRM", name: "OmniCRM", sub: "Para agências e negócios locais",
    desc: "Todos os canais do seu cliente em um lugar: WhatsApp, Instagram, e-mail, site. Pipeline visual para fechar mais negócios com menos esforço.",
    items: ["Inbox unificado", "Pipeline de vendas", "Automações de follow-up", "Relatórios em tempo real"] },
  { tag: "Saúde", name: "Posture.AI", sub: "Para fisioterapeutas, personal trainers e estúdios",
    desc: "Tire uma foto e receba análise postural completa em segundos. IA treinada com 50 mil avaliações que identifica desalinhamentos, gera relatórios em PDF e acompanha a evolução de cada aluno.",
    items: ["Análise postural com IA", "Gestão completa de alunos", "Relatórios PDF profissionais", "Ficha de anamnese digital"] },
  { tag: "RH", name: "RH Inteligente", sub: "Para empresas em crescimento com time em expansão",
    desc: "Do recrutamento ao onboarding, a IA assume o operacional para seu RH focar no que mais importa: as pessoas.",
    items: ["Triagem automática de currículos", "Onboarding digital", "Avaliações de desempenho", "People analytics"] },
];

const TEAM = [
  { i: "Ai", name: "Aira",    role: "Orquestradora Geral",        desc: "Coordena todo o time em tempo real, define prioridades e garante que cada entrega saia no prazo e com qualidade.", tasks: ["Orquestração do time", "Controle de prazos", "Briefing automatizado", "Relatório executivo"] },
  { i: "Q",  name: "Queila",  role: "Estrategista de Marca",      desc: "Define o posicionamento, a pauta editorial e a direção criativa. Cria o mapa de conteúdo mensal e garante consistência em todos os canais.", tasks: ["Pauta editorial mensal", "Posicionamento de marca", "Análise de concorrência", "Direção criativa"] },
  { i: "B",  name: "Beatriz", role: "Copywriter & Redatora",      desc: "Escreve cada legenda, artigo, e-mail e anúncio com foco em conversão. Copy com personalidade, clareza e intenção.", tasks: ["Legendas e posts", "Artigos e blog", "Roteiros de vídeo", "Copy de anúncios"] },
  { i: "M",  name: "Marcela", role: "Designer Visual",            desc: "Cria todos os visuais da marca: posts, stories, banners, apresentações e peças de campanha, dentro do manual de identidade.", tasks: ["Posts e stories", "Banners e anúncios", "Apresentações", "Identidade visual"] },
  { i: "R",  name: "Rafaela", role: "Gestora de Tráfego Pago",    desc: "Gerencia campanhas no Meta Ads e Google Ads com foco em ROAS alto e CPA que faz sentido. Testa, otimiza e escala todos os dias.", tasks: ["Meta Ads (FB/IG)", "Google Ads", "Remarketing", "Otimização de verba"] },
  { i: "Ma", name: "Marina",  role: "Social Media Manager",       desc: "Agenda, publica e monitora todo o conteúdo orgânico. Responde comentários, monitora menções e mantém a marca presente.", tasks: ["Agendamento de posts", "Engajamento", "Monitoramento", "Relatório semanal"] },
  { i: "P",  name: "Pedro",   role: "Calendário Editorial",       desc: "Planeja o calendário editorial, semanas, meses e campanhas sazonais. Cada post no lugar certo, na hora certa.", tasks: ["Calendário mensal", "Pilares de conteúdo", "Datas estratégicas", "Cronograma de campanhas"] },
  { i: "L",  name: "Lucas",   role: "Analista de Dados",          desc: "Transforma números em decisões. Monitora tráfego, engajamento e vendas, e entrega relatórios com ações recomendadas.", tasks: ["Dashboards de resultado", "Google Analytics", "Relatórios semanais", "Insights estratégicos"] },
  { i: "E",  name: "Eduardo", role: "Agente de Vendas & CRM",     desc: "Qualifica leads via WhatsApp, alimenta o CRM e garante que nenhum contato seja perdido, do primeiro oi ao fechamento.", tasks: ["Qualificação de leads", "Follow-up automatizado", "Gestão do CRM", "Relatório de pipeline"] },
  { i: "T",  name: "Teo",     role: "Web Designer & SEO",         desc: "Mantém o site atualizado, publica no blog e otimiza cada página para os buscadores.", tasks: ["Atualização de site", "SEO on-page", "Blog e artigos", "Landing pages"] },
  { i: "V",  name: "Vitória", role: "Revisora de Conteúdo",       desc: "Revisa e corrige todo o conteúdo antes de publicar: gramática, tom de voz, consistência de marca.", tasks: ["Revisão gramatical", "Tom de voz", "Checagem de fatos", "Aprovação final"] },
  { i: "Be", name: "Ben",     role: "Especialista em Tendências", desc: "Pesquisa o Google Trends Brasil em tempo real e entrega tendências, queries em crescimento e ideias de conteúdo antes de qualquer produção.", tasks: ["Google Trends em tempo real", "Queries em crescimento", "Ideias de conteúdo", "Hashtags estratégicas"] },
];

/* Horários da pauta do dia (demonstração): a ordem em que o turno acontece. */
const TURNO = ["08:00", "08:30", "09:15", "10:00", "10:40", "11:30", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

const PROCESS = [
  { n: "01", title: "Briefing",   duration: "30 min",   agents: ["Lia"],                         desc: "Lia coleta o briefing numa conversa natural, analisa a concorrência e entrega um diagnóstico de marketing personalizado.", details: ["Formulário inteligente de onboarding", "Análise automática da concorrência", "Mapa de oportunidades da marca", "Briefing consolidado para o time"] },
  { n: "02", title: "Estratégia", duration: "2h",       agents: ["Ben", "Queila", "Pedro"],      desc: "Ben pesquisa o Google Trends Brasil. Queila define posicionamento e direção criativa. Pedro monta o calendário editorial do mês.", details: ["Tendências reais do Google Trends", "Pauta editorial de 30 dias", "Posicionamento e tom de voz", "Calendário de campanhas"] },
  { n: "03", title: "Produção",   duration: "48h",      agents: ["Beatriz", "Marcela", "Bobby"], desc: "Beatriz escreve a copy, Marcela cria os visuais e Bobby edita os vídeos, cada um em cima do trabalho do outro.", details: ["Copy para posts, reels e anúncios", "Peças visuais e templates", "Vídeos editados e formatados", "Assets prontos para revisão"] },
  { n: "04", title: "Revisão",    duration: "4h",       agents: ["Vitória"],                     desc: "Vitória revisa todo o conteúdo antes de qualquer aprovação: gramática, tom de voz, consistência de marca e checagem de fatos.", details: ["Revisão ortográfica e gramatical", "Checagem de tom de voz", "Consistência com o manual da marca", "Aprovação final para o cliente"] },
  { n: "05", title: "Aprovação",  duration: "24h",      agents: ["Aira"],                        desc: "Você aprova tudo num portal exclusivo: vê as peças, sugere ajustes e aprova com um clique. Aira gerencia o fluxo.", details: ["Portal de aprovação do cliente", "Comentários em cada peça", "Histórico de revisões", "Aprovação com um clique"] },
  { n: "06", title: "Publicação", duration: "contínuo", agents: ["Marina", "Teo"],               desc: "Marina publica nos horários de maior engajamento e monitora comentários. Teo mantém site e blog atualizados.", details: ["Agendamento otimizado", "Publicação em todas as plataformas", "Monitoramento de comentários", "Blog e site atualizados"] },
  { n: "07", title: "Tráfego",    duration: "24/7",     agents: ["Rafaela", "Eduardo"],          desc: "Rafaela ativa e otimiza campanhas no Meta e no Google. Eduardo qualifica os leads que chegam pelo WhatsApp.", details: ["Meta Ads e Google Ads ativos", "Remarketing configurado", "Qualificação de leads no CRM", "Otimização diária de verbas"] },
  { n: "08", title: "Relatório",  duration: "semanal",  agents: ["Lucas", "Aira"],               desc: "Lucas entrega o relatório semanal com métricas reais. Aira consolida e recomenda o próximo ciclo.", details: ["Dashboard de performance", "Relatório semanal", "Análise de ROI por canal", "Recomendações para o próximo mês"] },
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
/* Cor por pilar de conteúdo: o calendário e a fila de aprovação ficam color-coded. */
const PILAR_COR: Record<string, string> = { "educação": "var(--cyan)", "bastidor": "var(--violet)", "prova": "var(--coral)" };
const emA = (v: number, a: string) => ({ "--em": v, "--a": a } as CSSProperties);
const chipA = (a: string) => ({ "--a": a } as CSSProperties);

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

const NAV: Array<[string, string]> = [["Trabalho", "#trabalho"], ["Processo", "#processo"], ["Serviços", "#servicos"], ["Soluções", "#solucoes"], ["Time", "#time"]];

const PERGUNTAS: Array<[string, string]> = [
  ["A IA publica sem eu ver?", "Não. Cada peça passa pela Vitória (revisão) e depois entra na sua fila de aprovação. Só vai para o ar o que você aprovou."],
  ["Preciso entender de IA?", "Não. Você conversa com a Lia como conversaria com uma agência: conta o negócio, o objetivo do mês e o que não pode faltar. O resto é com o time."],
  ["E se eu não gostar de uma peça?", "Você devolve com um comentário e ela volta para a produção. O histórico de versões fica na plataforma."],
  ["O que entra no diagnóstico gratuito?", "Uma conversa de trinta minutos com a Lia, a leitura do seu posicionamento e da concorrência, e um briefing pronto para o primeiro mês. Sem compromisso."],
];

/* ─────────────────────────────────────────────────────────────────────────────
   CSS. Mobile-first, sem !important. Tokens no topo.
   ───────────────────────────────────────────────────────────────────────── */
const CSS = `
  .lp { --lime:${LIME}; --cyan:#4FE3C1; --violet:#A78BFA; --blue:#5B9DFF; --coral:#FFB067; --pink:#FF7EA6;
        --ink:${INK}; --bg:${BG}; --bg-2:#14181D; --panel:#171C22;
        --ink-2: rgba(233,237,242,.60); --ink-3: rgba(233,237,242,.40);
        --line: rgba(233,237,242,.10); --line-2: rgba(233,237,242,.18);
        --pad: clamp(20px, 5vw, 72px); --w: 1280px;
        --serif: 'Space Grotesk', 'Inter', system-ui, sans-serif;
        --sans: 'Inter', system-ui, sans-serif;
        --mono: 'JetBrains Mono', ui-monospace, monospace;
        font-family: var(--sans); color: var(--ink); background: var(--bg);
        -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; font-feature-settings: "kern", "liga"; }
  html:has(.lp), body:has(.lp) { overflow-x: clip; scroll-behavior: auto; background: ${BG}; }
  body:has(.lp) .fixed.inset-x-0.bottom-0 { z-index: 60; }
  .lp { position: relative; }
  .lp > *:not(.lp-grain) { position: relative; z-index: 1; }
  .lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp a { color: inherit; text-decoration: none; }
  .lp button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  .lp h1, .lp h2, .lp h3 { font-family: var(--serif); font-weight: 700; letter-spacing: -0.02em; line-height: 1.04; overflow-wrap: normal; }
  .lp h1 em, .lp h2 em, .lp h3 em { font-style: normal; color: var(--lime); }
  .lp p { line-height: 1.6; }
  .lp ::selection { background: var(--lime); color: #0E1115; }
  .lp-mono { font-family: var(--mono); font-size: 11px; letter-spacing: .04em; color: var(--ink-3); }
  .lp-cap { font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: .10em; text-transform: uppercase; color: var(--ink-3); }
  .lp-wrap { max-width: var(--w); margin: 0 auto; padding-left: var(--pad); padding-right: var(--pad); }
  /* malha técnica: pontos finos sobre o grafite */
  .lp-grain { position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: .5;
    background-image: radial-gradient(rgba(233,237,242,.06) 1px, transparent 1.4px); background-size: 24px 24px; }

  /* ênfase discreta: a palavra que importa vira limão */
  .lp mark { background: none; color: var(--lime); }

  /* botões */
  .lp-btn { display: inline-flex; align-items: center; gap: 9px; height: 48px; padding: 0 20px; border-radius: 10px; font-weight: 600; font-size: 14px; border: 1px solid var(--line-2); color: var(--ink); background: transparent; transition: background .2s, color .2s, border-color .2s, transform .35s cubic-bezier(.2,.7,0,1); white-space: nowrap; }
  .lp .lp-btn:hover { background: rgba(233,237,242,.06); border-color: var(--line-2); color: var(--ink); }
  .lp .lp-btn--ink { background: linear-gradient(180deg, #C7FF66, #A9F53C); color: #0E1115; border-color: transparent; box-shadow: 0 10px 30px -10px rgba(185,255,75,.55), 0 1px 0 rgba(255,255,255,.35) inset; }
  .lp-btn--ink:hover { background: linear-gradient(180deg, #D4FF7E, #B6FF52); border-color: transparent; color: #0E1115; box-shadow: 0 14px 38px -10px rgba(185,255,75,.7), 0 1px 0 rgba(255,255,255,.4) inset; }
  .lp-btn--sm { height: 38px; padding: 0 15px; font-size: 13px; }
  .lp-btn svg { transition: transform .35s cubic-bezier(.2,.7,0,1); }
  .lp-btn:hover svg { transform: translate(2px, -2px); }
  .lp-link { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; color: var(--ink); border-bottom: 1px solid var(--line-2); padding-bottom: 3px; transition: gap .25s, border-color .25s, color .25s; }
  .lp-link:hover { gap: 12px; color: var(--lime); border-color: var(--lime); }

  /* barra */
  .lp > .lp-nav { position: fixed; inset: 0 0 auto 0; z-index: 200; height: 64px; display: flex; align-items: center; border-bottom: 1px solid transparent; transition: background .35s, border-color .35s, transform .5s cubic-bezier(.2,.7,0,1); }
  .lp-nav.is-solid { background: rgba(14,17,21,.78); border-color: var(--line); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
  .lp-nav.is-hidden { transform: translateY(-100%); }
  .lp-nav__in { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .lp-brand { display: inline-flex; align-items: center; gap: 9px; font-family: var(--serif); font-weight: 700; font-size: 17px; letter-spacing: -0.01em; }
  .lp-brand img { width: 26px; height: 26px; border-radius: 7px; }
  .lp-nav__links { display: none; }
  .lp-nav__cta { display: none; }
  .lp-burger { width: 42px; height: 42px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line-2); border-radius: 9px; color: var(--ink); }
  @media (min-width: 900px) {
    .lp-nav__links { display: flex; gap: 26px; font-size: 13.5px; font-weight: 500; color: var(--ink-2); }
    .lp-nav__links a { transition: color .2s; } .lp-nav__links a:hover { color: var(--ink); }
    .lp-nav__cta { display: flex; align-items: center; gap: 20px; }
    .lp-nav__cta .lp-entrar { font-size: 13.5px; font-weight: 500; color: var(--ink-2); transition: color .2s; } .lp-nav__cta .lp-entrar:hover { color: var(--ink); }
    .lp-burger { display: none; }
  }
  .lp > .lp-menu { position: fixed; inset: 0; z-index: 190; background: var(--bg); display: flex; flex-direction: column; justify-content: center; padding: 92px var(--pad) 40px; gap: 4px; }
  .lp-menu a.lp-menu__l { font-family: var(--serif); font-weight: 700; font-size: clamp(28px, 7vw, 40px); letter-spacing: -0.02em; line-height: 1.1; padding: 10px 0; border-bottom: 1px solid var(--line); }
  .lp-menu__cta { display: flex; flex-direction: column; gap: 10px; margin-top: 28px; }

  /* hero */
  .lp-hero { position: relative; padding: 104px 0 40px; overflow: hidden; }
  .lp-hero::before { content: ""; position: absolute; inset: -35% -25% auto -25%; height: 130%; z-index: 0; pointer-events: none;
    background:
      radial-gradient(36% 50% at 74% 4%, rgba(185,255,75,.16), transparent 70%),
      radial-gradient(40% 55% at 20% 22%, rgba(167,139,250,.14), transparent 72%),
      radial-gradient(46% 58% at 52% 42%, rgba(79,227,193,.10), transparent 72%),
      radial-gradient(60% 70% at 50% -12%, rgba(233,237,242,.04), transparent 70%);
    filter: blur(8px); transform-origin: center; animation: lp-aurora 20s ease-in-out infinite alternate; }
  @keyframes lp-aurora { from { transform: translate3d(-1.5%, -1%, 0) scale(1); } to { transform: translate3d(2%, 1.5%, 0) scale(1.06); } }
  .lp-hero__grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr; gap: 40px; align-items: center; }
  .lp-hero__copy { min-width: 0; }
  .lp-hero__kicker { display: inline-flex; align-items: center; gap: 9px; margin-bottom: 22px; padding: 6px 13px 6px 11px; border: 1px solid var(--line-2); border-radius: 999px; background: linear-gradient(180deg, rgba(233,237,242,.06), rgba(233,237,242,.02)); box-shadow: 0 1px 0 rgba(255,255,255,.05) inset, 0 10px 30px -20px rgba(0,0,0,.9); }
  .lp-hero__kicker i { display: block; width: 6px; height: 6px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 0 0 rgba(185,255,75,.5); animation: lp-pulse 2.2s infinite; }
  .lp-h1 { font-size: clamp(32px, 4.6vw, 56px); line-height: 1.02; letter-spacing: -0.03em; max-width: 17ch; }
  .lp-h1 .l { display: block; overflow: hidden; padding-bottom: .08em; margin-bottom: -.08em; }
  .lp-h1 .w { display: block; transform: translateY(110%); animation: lp-line 1s cubic-bezier(.2,.7,0,1) forwards; }
  .lp-h1 .l:nth-child(1) .w { animation-delay: .05s; }
  .lp-h1 .l:nth-child(2) .w { animation-delay: .15s; }
  @keyframes lp-line { to { transform: none; } }
  @keyframes lp-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  .lp-hero__lede { font-size: clamp(15px, 1.1vw, 17px); line-height: 1.6; color: var(--ink-2); max-width: 48ch; margin-top: 22px; opacity: 0; animation: lp-rise 1s cubic-bezier(.2,.7,0,1) .5s forwards; }
  .lp-hero__lede b { color: var(--ink); font-weight: 600; }
  .lp-hero__ctas { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; margin-top: 26px; opacity: 0; animation: lp-rise 1s cubic-bezier(.2,.7,0,1) .7s forwards; }
  .lp-hero__sheet { min-width: 0; width: 100%; max-width: 480px; opacity: 0; animation: lp-rise 1.1s cubic-bezier(.2,.7,0,1) .4s forwards; }
  @media (min-width: 900px) {
    .lp-hero { padding: 124px 0 48px; min-height: 100svh; display: flex; flex-direction: column; justify-content: center; }
    .lp-hero__grid { grid-template-columns: minmax(0, 1.1fr) minmax(360px, .9fr); gap: clamp(40px, 5vw, 80px); }
    .lp-h1 { font-size: clamp(44px, 4vw, 60px); }
    .lp-hero__sheet { justify-self: end; }
  }
  .lp-hero__facts { position: relative; z-index: 1; list-style: none; display: flex; flex-wrap: wrap; gap: 16px clamp(24px, 4vw, 56px); margin-top: clamp(36px, 6vh, 64px); padding-top: 20px; border-top: 1px solid var(--line); opacity: 0; animation: lp-rise 1s cubic-bezier(.2,.7,0,1) .9s forwards; }
  .lp-hero__facts li { display: flex; align-items: baseline; gap: 9px; }
  .lp-hero__facts b { font-family: var(--serif); font-weight: 700; font-size: clamp(22px, 2vw, 30px); letter-spacing: -0.02em; line-height: 1; }
  .lp-hero__facts li:nth-child(1) b { color: var(--lime); }
  .lp-hero__facts li:nth-child(2) b { color: var(--cyan); }
  .lp-hero__facts li:nth-child(3) b { color: var(--violet); }
  .lp-hero__facts span { font-size: 12.5px; color: var(--ink-2); }
  .lp-hero__facts .lp-hero__go { margin-left: auto; display: inline-flex; align-items: center; gap: 10px; font-size: 12.5px; font-weight: 600; }
  .lp-hero__go i { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--line-2); display: inline-flex; align-items: center; justify-content: center; transition: background .25s, color .25s, border-color .25s; }
  .lp-hero__go:hover i { background: var(--lime); color: #0E1115; border-color: var(--lime); }

  /* prova: marcas que confiam na Calu */
  .lp-proof { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: rgba(233,237,242,.015); }
  .lp-proof__in { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 28px; padding-top: 18px; padding-bottom: 18px; }
  .lp-proof__list { list-style: none; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 30px; margin-left: auto; }
  .lp-proof__list li { position: relative; font-family: var(--serif); font-weight: 700; font-size: clamp(15px, 1.4vw, 19px); letter-spacing: -0.01em; color: var(--ink-2); transition: color .25s; }
  .lp-proof__list li + li::before { content: ""; position: absolute; left: -16px; top: 50%; width: 3px; height: 3px; border-radius: 50%; background: var(--line-2); transform: translateY(-50%); }
  .lp-proof__list li:hover { color: var(--ink); }
  @media (max-width: 640px) { .lp-proof__list { margin-left: 0; gap: 12px 22px; } .lp-proof__list li + li::before { left: -12px; } }

  /* painel de produto: sustenta a pauta ao vivo e o calendário */
  .lp-sheet { position: relative; border-radius: 14px; padding: clamp(16px, 2vw, 22px);
    background: linear-gradient(var(--panel), var(--panel)) padding-box,
                linear-gradient(155deg, rgba(185,255,75,.30), rgba(233,237,242,.08) 26%, rgba(233,237,242,0) 55%) border-box;
    border: 1px solid transparent;
    box-shadow: 0 1px 0 rgba(255,255,255,.05) inset, 0 30px 60px -34px rgba(0,0,0,.9), 0 0 70px -34px rgba(185,255,75,.18); }
  .lp-sheet--tilt { transform: none; }
  .lp-sheet__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--line-2); }
  .lp-sheet__title { font-family: var(--serif); font-weight: 700; font-size: 16px; letter-spacing: -0.01em; }
  .lp-sheet__meta { font-family: var(--mono); font-size: 10px; color: var(--ink-3); text-align: right; line-height: 1.5; }
  .lp-pauta { list-style: none; margin-top: 6px; }
  .lp-pauta li { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 10px; padding: 6.5px 0; border-bottom: 1px solid var(--line); font-size: 12.5px; position: relative; }
  .lp-pauta li:last-child { border-bottom: 0; }
  .lp-pauta time { font-family: var(--mono); font-size: 10px; color: var(--ink-3); }
  .lp-pauta .t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: color .4s; }
  .lp-pauta .t b { font-weight: 600; }
  .lp-pauta .t span { color: var(--ink-2); }
  .lp-pauta .q { width: 15px; height: 15px; border: 1px solid var(--line-2); border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; color: #0E1115; transition: background .3s, border-color .3s; }
  .lp-pauta li.is-done .q { background: var(--lime); border-color: var(--lime); color: #0E1115; }
  .lp-pauta li.is-done .t { color: var(--ink-3); text-decoration: line-through; text-decoration-color: var(--ink-3); text-decoration-thickness: 1px; }
  .lp-pauta li.is-now .t mark { color: var(--lime); }
  .lp-pauta li.is-now::before { content: ""; position: absolute; left: -10px; top: 50%; width: 5px; height: 5px; border-radius: 50%; background: var(--lime); transform: translateY(-50%); box-shadow: 0 0 8px 1px rgba(185,255,75,.55); }
  .lp-sheet__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line); font-size: 11.5px; color: var(--ink-2); }
  .lp-live { position: absolute; right: 14px; bottom: 42px; display: inline-flex; align-items: center; gap: 7px; font-family: var(--mono); font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-2); background: var(--bg-2); border: 1px solid var(--line-2); border-radius: 999px; padding: 4px 9px 4px 8px; }
  .lp-live::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 0 0 rgba(185,255,75,.55); animation: lp-pulse 2.2s infinite; }
  @keyframes lp-pulse { 0% { box-shadow: 0 0 0 0 rgba(185,255,75,.5); } 70% { box-shadow: 0 0 0 6px rgba(185,255,75,0); } 100% { box-shadow: 0 0 0 0 rgba(185,255,75,0); } }

  /* manifesto */
  .lp-manifesto { padding: clamp(56px, 8vw, 104px) 0; border-top: 1px solid var(--line); }
  .lp-manifesto p { font-family: var(--serif); font-weight: 700; font-size: clamp(22px, 2.8vw, 38px); letter-spacing: -0.02em; line-height: 1.18; max-width: 30ch; }
  .wd { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: .1em; margin-bottom: -.1em; }
  .wd > span { display: inline-block; transform: translateY(108%); transition: transform 1s cubic-bezier(.2,.7,0,1); transition-delay: calc(var(--i) * 20ms); }
  .sc-in .wd > span { transform: none; }
  .wd.is-em > span { color: var(--lime); }
  .lp-manifesto__meta { display: flex; gap: 12px 26px; flex-wrap: wrap; margin-top: 28px; }
  .lp-manifesto__meta span { display: inline-flex; align-items: center; gap: 9px; font-size: 13px; color: var(--ink-2); }
  .lp-manifesto__meta i { width: 6px; height: 6px; border-radius: 50%; background: var(--lime); display: inline-block; }

  /* capítulos */
  .lp-chapter { border-top: 1px solid var(--line); padding: clamp(52px, 7vw, 104px) 0; }
  .lp-chapter__grid { display: grid; grid-template-columns: 1fr; gap: 26px; }
  @media (min-width: 900px) { .lp-chapter__grid { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 64px; } .lp-chapter__head { position: sticky; top: 96px; align-self: start; } }
  .lp-chapter__n { display: inline-flex; align-items: center; gap: 9px; }
  .lp-chapter__n::after { content: ""; flex: 0 0 32px; height: 1px; background: var(--line-2); transform: scaleX(0); transform-origin: left; transition: transform .9s cubic-bezier(.2,.7,0,1) .25s; }
  .sc-in .lp-chapter__n::after { transform: none; }
  .lp-h2 { font-size: clamp(26px, 3vw, 42px); margin-top: 16px; line-height: 1.06; }
  .lp-chapter__lede { font-size: clamp(14.5px, 1.1vw, 17px); color: var(--ink-2); margin-top: 18px; max-width: 46ch; }
  .lp-chapter__lede + .lp-link { margin-top: 20px; }

  /* linhas expansíveis (processo e perguntas) */
  .lp-rows { border-top: 1px solid var(--line-2); }
  .lp-row { border-bottom: 1px solid var(--line); }
  .lp-row__btn { width: 100%; display: grid; grid-template-columns: 30px 1fr auto; align-items: baseline; gap: 14px; padding: 16px 0; text-align: left; }
  .lp-row__n { font-family: var(--mono); font-size: 11px; color: var(--ink-3); }
  .lp-row__t { font-family: var(--serif); font-weight: 700; font-size: clamp(18px, 1.7vw, 24px); letter-spacing: -0.02em; transition: transform .45s cubic-bezier(.2,.7,0,1), color .3s; }
  .lp-row__btn:hover .lp-row__t { transform: translateX(5px); color: var(--lime); }
  .lp-row__t--q { font-size: clamp(16px, 1.4vw, 20px); }
  .lp-row__meta { font-family: var(--mono); font-size: 11px; color: var(--ink-3); display: none; }
  .lp-row__plus { width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line-2); border-radius: 8px; transition: transform .35s cubic-bezier(.2,.7,0,1), background .25s, color .25s, border-color .25s; align-self: center; color: var(--ink); }
  .lp-row[data-open="true"] .lp-row__plus { transform: rotate(45deg); background: var(--lime); color: #0E1115; border-color: var(--lime); }
  .lp-row__body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s cubic-bezier(.2,.7,0,1); }
  .lp-row[data-open="true"] .lp-row__body { grid-template-rows: 1fr; }
  .lp-row__body > div { overflow: hidden; }
  .lp-row__inner { display: grid; grid-template-columns: 1fr; gap: 16px; padding: 0 0 24px 44px; }
  .lp-row__inner--q { grid-template-columns: 1fr; }
  .lp-row__inner p { color: var(--ink-2); font-size: 14.5px; max-width: 48ch; }
  .lp-row__agents { display: flex; flex-wrap: wrap; gap: 6px; }
  .lp-chip { font-family: var(--mono); font-size: 10.5px; font-weight: 500; padding: 4px 9px; border: 1px solid var(--line-2); border-radius: 999px; color: var(--ink-2); background: rgba(233,237,242,.03); }
  .lp-row__list { list-style: none; display: grid; gap: 8px; font-size: 13.5px; color: var(--ink-2); }
  .lp-row__list li { display: flex; gap: 10px; align-items: baseline; }
  .lp-row__list li::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--lime); flex: 0 0 5px; position: relative; top: -3px; }
  @media (min-width: 700px) { .lp-row__btn { grid-template-columns: 36px 1fr auto auto; } .lp-row__btn:has(.lp-row__t--q) { grid-template-columns: 36px 1fr auto; } .lp-row__meta { display: block; } .lp-row__inner { grid-template-columns: 1.2fr 1fr; gap: 30px; padding-left: 50px; } .lp-row__inner--q { grid-template-columns: 1fr; } }

  /* o mês se montando (pinado): calendário e lista de aprovação */
  .lp-month { position: relative; border-top: 1px solid var(--line-2); }
  .lp-month__stage { min-height: 100svh; display: flex; align-items: safe center; padding: 80px 0 28px; }
  .lp-month__head { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 20px; align-items: end; }
  @media (min-width: 900px) { .lp-month__head { grid-template-columns: 1.1fr 1fr; gap: 44px; } }
  .lp-month .lp-h2 { font-size: clamp(24px, 3vw, 40px); margin-top: 10px; }
  .lp-month__prog { position: relative; height: 2px; background: var(--line-2); margin-bottom: 20px; border-radius: 2px; overflow: hidden; }
  .lp-month__prog::before { content: ""; position: absolute; inset: 0; background: var(--lime); transform-origin: left; transform: scaleX(var(--sc-p, 0)); }
  .lp-month__prog b { position: absolute; top: 8px; left: 0; font-family: var(--mono); font-size: 10px; color: var(--ink-3); font-weight: 400; }
  .lp-month__prog b:last-child { left: auto; right: 0; }
  .lp-month__grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
  @media (min-width: 900px) { .lp-month__grid { grid-template-columns: minmax(0, 1.45fr) minmax(280px, 1fr); gap: 36px; align-items: start; } }
  .lp-cal { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); margin-top: 10px; }
  .lp-cal__dow { font-family: var(--mono); font-size: 10px; color: var(--ink-3); padding: 0 0 8px 6px; }
  .lp-cal__d { position: relative; aspect-ratio: 1 / .62; border-top: 1px solid var(--line); border-left: 1px solid var(--line); padding: 6px 7px; font-family: var(--mono); font-size: 10.5px; color: var(--ink-3); overflow: hidden; }
  .lp-cal__d:nth-child(7n) { border-right: 1px solid var(--line); }
  .lp-cal__d:nth-last-child(-n+7) { border-bottom: 1px solid var(--line); }
  .lp-cal__d.is-off { color: transparent; background: repeating-linear-gradient(135deg, transparent 0 6px, rgba(233,237,242,.03) 6px 7px); }
  .lp-cal__d.has { --v: clamp(0, calc((var(--sc-p, 0) - var(--em)) * 7), 1); color: var(--ink); }
  .lp-cal__chip { position: absolute; left: 5px; right: 5px; bottom: 5px; padding: 3px 6px; font-family: var(--mono); font-size: 9.5px; font-weight: 500; color: #0E1115; background: var(--a, var(--lime)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transform-origin: left; transform: scaleX(var(--v, 0)); z-index: 1; border-radius: 5px; }
  .lp-month__foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding-top: 14px; }
  .lp-month__foot p { font-size: 12.5px; color: var(--ink-2); max-width: 40ch; }
  .lp-count { font-family: var(--serif); font-weight: 700; font-size: clamp(36px, 4vw, 60px); letter-spacing: -0.03em; line-height: .9; display: flex; align-items: baseline; gap: 9px; }
  .lp-count small { font-family: var(--sans); font-weight: 500; font-size: 12px; color: var(--ink-3); }
  .lp-queue { list-style: none; }
  .lp-q { display: grid; grid-template-columns: 18px 42px 1fr; gap: 12px; align-items: start; padding: 10px 0; border-bottom: 1px solid var(--line); --v: clamp(0, calc((var(--sc-p, 0) - var(--em)) * 7), 1); opacity: calc(.3 + var(--v) * .7); }
  .lp-q .q { width: 15px; height: 15px; border: 1px solid var(--line-2); border-radius: 4px; margin-top: 3px; display: inline-flex; align-items: center; justify-content: center; color: #0E1115; background: rgba(185,255,75,var(--v)); background: color-mix(in oklab, var(--a, var(--lime)) calc(var(--v) * 100%), transparent); border-color: rgba(233,237,242,calc(.18 + var(--v) * .5)); }
  .lp-q .q svg { opacity: var(--v); }
  .lp-q__d { font-family: var(--serif); font-weight: 700; font-size: 20px; line-height: 1; }
  .lp-q__d small { display: block; font-family: var(--mono); font-size: 9px; color: var(--ink-3); margin-top: 3px; }
  .lp-q__t { font-weight: 600; font-size: 13.5px; }
  .lp-q__s { font-family: var(--mono); font-size: 10px; color: var(--ink-3); margin-top: 4px; }
  @media (prefers-reduced-motion: reduce) { .lp-cal__d.has, .lp-q { --v: 1; } .lp-month__prog::before { transform: none; } .lp-h1 .w, .lp-hero__lede, .lp-hero__ctas, .lp-hero__sheet, .lp-hero__facts { animation: none; opacity: 1; transform: none; } .wd > span { transform: none; transition: none; } .lp-chapter__n::after { transform: none; } .lp-nav.is-hidden { transform: none; } .lp-live::before, .lp-hero__kicker i, .lp-hero::before { animation: none; } }
  @media (max-height: 940px) and (min-width: 900px) { .lp-month__stage { padding-top: 72px; } .lp-month .lp-h2 { font-size: clamp(22px, 3.4vh, 36px); } .lp-cal__d { aspect-ratio: 1 / .52; } .lp-q { padding: 7px 0; } .lp-month__head { margin-bottom: 12px; } }
  @media (max-width: 899px) {
    .lp-month__stage { padding: 68px 0 14px; }
    .lp-month .lp-h2 { font-size: clamp(22px, 6vw, 30px); margin-top: 8px; }
    .lp-month__head { gap: 6px; margin-bottom: 12px; }
    .lp-month__head .lp-chapter__lede { font-size: 13px; margin-top: 0; }
    .lp-month__grid { gap: 10px; }
    .lp-sheet { padding: 12px; }
    .lp-cal__dow { padding-bottom: 6px; font-size: 9px; }
    .lp-cal__d { aspect-ratio: 1 / .5; font-size: 10px; padding: 4px 5px; }
    .lp-cal__chip { font-size: 9px; padding: 2px 4px; left: 3px; right: 3px; bottom: 3px; }
    .lp-month__foot { padding-top: 8px; } .lp-month__foot p { display: none; } .lp-count { font-size: 30px; }
    .lp-q { padding: 5px 0; gap: 8px; grid-template-columns: 16px 36px 1fr; }
    .lp-q__d { font-size: 15px; } .lp-q__d small { display: inline; margin-left: 3px; }
    .lp-q__t { font-size: 12px; } .lp-q__s { display: none; }
  }

  /* serviços */
  .lp-services { list-style: none; display: grid; grid-template-columns: 1fr; border-top: 1px solid var(--line-2); }
  .lp-service { position: relative; display: grid; grid-template-columns: 50px 1fr; gap: 12px; padding: 22px 0; border-bottom: 1px solid var(--line); transition: padding-left .35s cubic-bezier(.2,.7,0,1); }
  .lp-service::before { content: ""; position: absolute; left: 0; top: -1px; height: 1px; width: 0; background: var(--lime); transition: width .5s cubic-bezier(.2,.7,0,1); }
  .lp-service:hover::before { width: 100%; }
  .lp-service:hover { padding-left: 8px; }
  .lp-service__n { font-family: var(--mono); font-size: 13px; color: var(--ink-3); line-height: 1.6; }
  .lp-service h3 { font-size: clamp(18px, 1.8vw, 24px); }
  .lp-service p { color: var(--ink-2); font-size: 14px; margin-top: 8px; max-width: 42ch; }
  @media (min-width: 700px) { .lp-services { grid-template-columns: 1fr 1fr; column-gap: 44px; } }

  /* soluções */
  .lp-products { border-top: 1px solid var(--line-2); }
  .lp-product { --a: var(--lime); display: grid; grid-template-columns: 1fr; gap: 14px; padding: clamp(24px, 3vw, 40px) 0; border-bottom: 1px solid var(--line); }
  .lp-product:nth-child(2) { --a: var(--cyan); }
  .lp-product:nth-child(3) { --a: var(--violet); }
  @media (min-width: 900px) { .lp-product { grid-template-columns: 160px 1fr 1fr; gap: 36px; } }
  .lp-product h3 { font-size: clamp(24px, 2.4vw, 34px); }
  .lp-product .lp-cap { display: inline-flex; align-items: center; gap: 7px; color: var(--a); }
  .lp-product .lp-cap::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--a); }
  .lp-product__sub { font-size: 12.5px; color: var(--ink-3); margin-top: 8px; }
  .lp-product p { color: var(--ink-2); font-size: 14.5px; max-width: 48ch; }
  .lp-product__items { list-style: none; display: grid; gap: 8px; margin-top: 16px; font-size: 13.5px; }
  .lp-product__items li { display: flex; gap: 10px; align-items: baseline; color: var(--ink-2); }
  .lp-product__items li::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--a); flex: 0 0 5px; position: relative; top: -3px; }
  .lp-product .lp-link:hover { color: var(--a); border-color: var(--a); }
  .lp-product .lp-link { margin-top: 18px; }

  /* time: os doze agentes, cada um com plaquinha de inicial */
  .lp-roster { list-style: none; border-top: 1px solid var(--line-2); }
  .lp-cast { --a: var(--lime); border-bottom: 1px solid var(--line); transition: background .25s; }
  .lp-cast:nth-child(6n+2) { --a: var(--cyan); }
  .lp-cast:nth-child(6n+3) { --a: var(--violet); }
  .lp-cast:nth-child(6n+4) { --a: var(--blue); }
  .lp-cast:nth-child(6n+5) { --a: var(--coral); }
  .lp-cast:nth-child(6n+6) { --a: var(--pink); }
  .lp-cast:hover { background: linear-gradient(90deg, color-mix(in oklab, var(--a) 10%, transparent), transparent 44%); }
  .lp-cast__btn { width: 100%; display: grid; grid-template-columns: 40px 1fr auto; align-items: center; gap: 14px; padding: 11px 0; text-align: left; }
  .lp-cast__mono { width: 36px; height: 36px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; font-family: var(--serif); font-weight: 700; font-size: 14px; letter-spacing: -0.01em; background: var(--bg-2); background: color-mix(in oklab, var(--a) 15%, var(--bg-2)); color: var(--a); border: 1px solid color-mix(in oklab, var(--a) 42%, transparent); transition: background .3s, color .3s, border-color .3s; }
  .lp-cast[data-open="true"] .lp-cast__mono { background: var(--a); color: #0E1115; border-color: var(--a); }
  .lp-cast__name { font-family: var(--serif); font-weight: 700; font-size: clamp(19px, 2vw, 26px); letter-spacing: -0.02em; line-height: 1; transition: transform .45s cubic-bezier(.2,.7,0,1), color .3s; }
  .lp-cast__btn:hover .lp-cast__name { transform: translateX(5px); color: var(--a); }
  .lp-cast__role { font-family: var(--mono); font-size: 10.5px; letter-spacing: .02em; color: var(--ink-2); text-align: right; }
  .lp-cast__body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s cubic-bezier(.2,.7,0,1); }
  .lp-cast[data-open="true"] .lp-cast__body { grid-template-rows: 1fr; }
  .lp-cast__body > div { overflow: hidden; }
  .lp-cast__inner { display: grid; grid-template-columns: 1fr; gap: 14px; padding: 0 0 20px 54px; }
  .lp-cast__inner p { color: var(--ink-2); font-size: 14px; max-width: 48ch; }
  @media (min-width: 700px) { .lp-cast__inner { grid-template-columns: 1.3fr 1fr; gap: 30px; } }
  .lp-roster__big { display: none; }

  /* custo */
  .lp-table { list-style: none; border-top: 1px solid var(--line-2); }
  .lp-table li { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
  .lp-table li span:last-child { font-family: var(--mono); font-size: 11.5px; color: var(--ink-2); white-space: nowrap; }
  .lp-table li.is-total { padding: 16px 0; font-family: var(--serif); font-weight: 700; font-size: 17px; border-bottom: 1px solid var(--line-2); }
  .lp-table li.is-total span:last-child { font-family: var(--serif); font-weight: 700; font-size: 17px; color: var(--lime); }
  .lp-table__note { font-size: 11.5px; color: var(--ink-3); margin-top: 12px; }

  /* fecho: painel profundo com brilho de limão */
  .lp-close { position: relative; background: var(--bg-2); color: var(--ink); padding: clamp(60px, 9vw, 120px) 0; border-top: 1px solid var(--line-2); overflow: hidden; }
  .lp-close::before { content: ""; position: absolute; inset: auto -10% -50% 25%; height: 100%; background: radial-gradient(50% 100% at 55% 100%, rgba(185,255,75,.12), transparent 70%); pointer-events: none; }
  .lp-close .lp-wrap { position: relative; z-index: 1; }
  .lp-close .lp-cap { color: var(--ink-3); }
  .lp-close h2 { font-size: clamp(28px, 3.6vw, 52px); letter-spacing: -0.03em; line-height: 1.04; margin-top: 16px; max-width: 18ch; color: var(--ink); }
  .lp-close mark { color: var(--lime); }
  .lp-close__row { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; margin-top: clamp(26px, 3.5vw, 44px); padding-top: 22px; border-top: 1px solid var(--line); }
  .lp-close .lp-btn { border-color: var(--line-2); color: var(--ink); }
  .lp .lp-close .lp-btn:hover { background: rgba(233,237,242,.06); color: var(--ink); border-color: var(--line-2); }
  .lp .lp-close .lp-btn--ink { background: var(--lime); color: #0E1115; border-color: var(--lime); }
  .lp .lp-close .lp-btn--ink:hover { background: #CBFF6E; color: #0E1115; border-color: #CBFF6E; }
  .lp-close__note { font-size: 13.5px; color: var(--ink-2); max-width: 36ch; margin-left: auto; }

  /* rodapé com colofão */
  .lp-footer { padding: 40px 0 calc(28px + env(safe-area-inset-bottom)); border-top: 1px solid var(--line); }
  .lp-footer__in { display: grid; grid-template-columns: 1fr; gap: 22px; }
  .lp-footer__links { display: flex; flex-wrap: wrap; gap: 18px; font-size: 13px; color: var(--ink-2); }
  .lp-footer__links a:hover { color: var(--ink); }
  .lp-footer__social { display: flex; gap: 8px; }
  .lp-social { width: 38px; height: 38px; border: 1px solid var(--line-2); border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; color: var(--ink-2); transition: border-color .2s, color .2s; }
  .lp-social:hover { border-color: var(--lime); color: var(--lime); }
  .lp-colofao { font-size: 12px; color: var(--ink-3); line-height: 1.6; max-width: 52ch; }
  .lp-colofao em { font-family: var(--serif); font-style: normal; font-weight: 700; font-size: 1em; color: var(--ink-2); }
  @media (min-width: 900px) { .lp-footer__in { grid-template-columns: auto 1fr auto; align-items: center; gap: 40px; } .lp-colofao { justify-self: center; text-align: center; } }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Pauta do dia: uma folha com o turno inteiro, na ordem em que acontece. As
   linhas vão sendo riscadas conforme o dia passa; a linha atual recebe o
   marca-texto. Cenário de demonstração: horários ilustrativos.
   ───────────────────────────────────────────────────────────────────────── */
function PautaDoDia() {
  const [agora, setAgora] = useState(2);
  const [parado, setParado] = useState(false);
  useEffect(() => {
    if (parado || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setAgora((a) => (a + 1) % TEAM.length), 3400);
    return () => clearInterval(t);
  }, [parado]);
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="lp-sheet lp-sheet--tilt lp-marca-ja" onMouseEnter={() => setParado(true)} onMouseLeave={() => setParado(false)} aria-label="Pauta do dia, demonstração">
      <div className="lp-sheet__head">
        <div className="lp-sheet__title">Pauta do dia</div>
        <div className="lp-sheet__meta">{hoje}<br />Calu Agência · Fortaleza</div>
      </div>
      <ul className="lp-pauta">
        {TEAM.map((t, i) => (
          <li key={t.name} className={i < agora ? "is-done" : i === agora ? "is-now" : ""} onClick={() => { setAgora(i); setParado(true); }}>
            <time>{TURNO[i]}</time>
            <span className="t"><b>{t.name}</b> <span>{i === agora ? <mark>{t.tasks[0].toLowerCase()}</mark> : t.tasks[0].toLowerCase()}</span></span>
            <span className="q">{i < agora && <Check size={11} strokeWidth={3} />}</span>
          </li>
        ))}
      </ul>
      <div className="lp-sheet__foot"><span>{agora} de {TEAM.length} entregues no turno</span><span className="lp-mono">demonstração</span></div>
      <div className="lp-live" aria-hidden="true">Ao vivo</div>
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
  const [etapa, setEtapa] = useState<number | null>(0);
  const [membro, setMembro] = useState<number | null>(null);
  const [pergunta, setPergunta] = useState<number | null>(0);
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

  useEffect(() => { document.body.style.overflow = menu ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [menu]);

  /* Motor da scroll-craft: entradas por capítulo e o pin do mês. O contador e
     o estado visível do palco (para o harness) são lidos de --sc-p. */
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
        const palco = sec.querySelector<HTMLElement>("[data-sc-stage]");
        const estado = `pecas:${n};linha:${Math.round(p * 10)}`;
        if (palco && palco.dataset.scVerifyState !== estado) palco.dataset.scVerifyState = estado;
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
            <a href="/briefing" className="lp-btn lp-btn--ink lp-btn--sm">Diagnóstico gratuito <ArrowUpRight size={14} /></a>
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
            <a href="/briefing" className="lp-btn lp-btn--ink" onClick={() => setMenu(false)}>Diagnóstico gratuito com IA <ArrowUpRight size={14} /></a>
            <a href={WA} target="_blank" rel="noreferrer" className="lp-btn"><MessageCircle size={14} /> Falar no WhatsApp</a>
          </div>
        </div>
      )}

      {/* HERO: título à esquerda, a pauta do dia à direita */}
      <header className="lp-hero" data-sc-act="flow">
        <div className="lp-wrap">
          <div className="lp-hero__grid">
            <div className="lp-hero__copy lp-marca-ja">
              <div className="lp-hero__kicker"><i /><span className="lp-cap">Agência de marketing com IA · Fortaleza</span></div>
              <h1 className="lp-h1">
                <span className="l"><span className="w">Criatividade <mark>que vende.</mark></span></span>
                <span className="l"><span className="w"><em>IA que escala.</em></span></span>
              </h1>
              <p className="lp-hero__lede">Somos uma agência de marketing em IA: doze especialistas fazem o marketing do seu negócio, <b>do briefing ao post publicado</b>, por um único investimento mensal. Você aprova, o time executa.</p>
              <div className="lp-hero__ctas">
                <a href="/briefing" className="lp-btn lp-btn--ink">Fazer o diagnóstico gratuito <ArrowUpRight size={15} /></a>
                <a href={WA} target="_blank" rel="noreferrer" className="lp-link">ou fale com a gente no WhatsApp <ArrowRight size={14} /></a>
              </div>
            </div>
            <div className="lp-hero__sheet"><PautaDoDia /></div>
          </div>
          <ul className="lp-hero__facts" aria-label="Em números">
            <li><b>{TEAM.length}</b><span>agentes de IA</span></li>
            <li><b>{PROCESS.length}</b><span>etapas por mês</span></li>
            <li><b>1</b><span>investimento mensal</span></li>
            <li className="lp-hero__go-li" style={{ marginLeft: "auto" }}><a href="#trabalho" className="lp-hero__go"><i><ArrowDown size={14} /></i> Ver o time trabalhar</a></li>
          </ul>
        </div>
      </header>

      {/* PROVA: marcas que confiam na Calu */}
      <section className="lp-proof" aria-label="Marcas que confiam na Calu">
        <div className="lp-wrap lp-proof__in">
          <span className="lp-cap">Marcas que confiam na Calu</span>
          <ul className="lp-proof__list">
            {["Grupo Licita", "Abcer", "GNX", "Forplace"].map((m) => <li key={m}>{m}</li>)}
          </ul>
        </div>
      </section>

      {/* O MÊS SE MONTANDO: o trabalho, logo depois da hero. Demonstração rotulada. */}
      <section id="trabalho" className="lp-month" data-sc-act="pin" data-sc-span="2.6" aria-label="Demonstração: um mês de produção se montando">
        <div data-sc-stage className="lp-month__stage">
          <div className="lp-wrap">
            <div className="lp-month__head">
              <div>
                <div className="lp-chapter__n lp-cap">O trabalho · demonstração com cliente fictício</div>
                <h2 className="lp-h2">Veja um mês inteiro{" "}<br /><em>se montar.</em></h2>
              </div>
              <p className="lp-chapter__lede">Role devagar. É o que acontece na plataforma depois que o time recebe o seu briefing: o calendário enche, a lista de aprovação vai sendo marcada, o contador sobe.</p>
            </div>
            <div className="lp-month__prog" aria-hidden="true"><b>briefing</b><b>mês publicado</b></div>
            <div className="lp-month__grid">
              <div className="lp-sheet">
                <div className="lp-sheet__head"><div className="lp-sheet__title">Calendário editorial</div><div className="lp-sheet__meta">setembro de 2026<br />Clínica Vitta</div></div>
                <div className="lp-cal">
                  {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <div key={i} className="lp-cal__dow">{d}</div>)}
                  {CALENDARIO.map((c, i) => (
                    <div key={i} className={`lp-cal__d${c.dia === null ? " is-off" : ""}${c.i !== undefined ? " has" : ""}`} style={c.i !== undefined ? em(emDaPeca(c.i)) : undefined}>
                      {c.dia ?? "·"}
                      {c.i !== undefined && <span className="lp-cal__chip" style={chipA(PILAR_COR[PECAS[c.i].pilar])}>{PECAS[c.i].formato}</span>}
                    </div>
                  ))}
                </div>
                <div className="lp-month__foot">
                  <p>Pedro calendarizou, Beatriz escreveu, Marcela desenhou em cima da copy. Cada peça entra na lista com data e hora.</p>
                  <span className="lp-count"><span ref={contadorRef}>0</span><small>peças</small></span>
                </div>
              </div>
              <div className="lp-sheet">
                <div className="lp-sheet__head"><div className="lp-sheet__title">Lista de aprovação</div><div className="lp-sheet__meta">aguardando você</div></div>
                <ul className="lp-queue">
                  {PECAS.map((pc, i) => (
                    <li key={pc.id} className="lp-q" style={emA(emDaPeca(i), PILAR_COR[pc.pilar])}>
                      <span className="q"><Check size={11} strokeWidth={3} /></span>
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

      {/* MANIFESTO */}
      <section className="lp-manifesto">
        <div className="lp-wrap" data-sc-in>
          <p><Palavras partes={[{ t: "Montar um time de marketing custa caro e demora. Fazer sozinho não escala. A Calu é uma agência inteira em IA:" }, { t: "pensa, produz, revisa e publica", em: true }, { t: "todo dia, na ordem certa. Você só aprova." }]} /></p>
          <div className="lp-manifesto__meta">
            <span><i />Estratégia antes de produzir</span>
            <span><i />Revisão antes de você ver</span>
            <span><i />Relatório toda semana</span>
          </div>
        </div>
      </section>

      {/* 01 PROCESSO */}
      <section id="processo" className="lp-chapter">
        <div className="lp-wrap lp-chapter__grid">
          <div className="lp-chapter__head" data-sc-in>
            <div className="lp-chapter__n lp-cap">01 · Processo</div>
            <h2 className="lp-h2">Como um mês de marketing <em>acontece.</em></h2>
            <p className="lp-chapter__lede">Oito etapas, cada uma com dono. Cada agente trabalha em cima do que o anterior entregou, e nada vai para o ar sem passar pela revisão e pela sua aprovação.</p>
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

      {/* 02 SERVIÇOS */}
      <section id="servicos" className="lp-chapter">
        <div className="lp-wrap lp-chapter__grid">
          <div className="lp-chapter__head" data-sc-in>
            <div className="lp-chapter__n lp-cap">02 · Serviços</div>
            <h2 className="lp-h2">Tudo que a marca precisa, <em>num só lugar.</em></h2>
            <p className="lp-chapter__lede">A estratégia decide, a produção executa, o tráfego distribui e os dados corrigem o rumo. Tudo no mesmo time, no mesmo mês.</p>
            <a href={WA} target="_blank" rel="noreferrer" className="lp-link">Conversar sobre o meu escopo <ArrowRight size={14} /></a>
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
            <div className="lp-chapter__n lp-cap">03 · Soluções com IA</div>
            <h2 className="lp-h2">Tecnologia que <em>trabalha por você.</em></h2>
            <p className="lp-chapter__lede">Além da agência, três produtos próprios, cada um feito para um nicho que a tecnologia genérica não atende.</p>
          </div>
          <div className="lp-products" data-sc-in data-sc-stagger="70">
            {PRODUCTS.map((p) => (
              <article key={p.name} className="lp-product">
                <div><span className="lp-cap">{p.tag}</span></div>
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
            <div className="lp-chapter__n lp-cap">04 · Expediente</div>
            <h2 className="lp-h2">Doze especialistas. <em>Um investimento.</em></h2>
            <p className="lp-chapter__lede">Cada agente tem papel, entregas e limites definidos. Toque num nome para ver o que ele faz pelo seu negócio.</p>
            <div className="lp-roster__big" aria-hidden="true">{TEAM.length}</div>
          </div>
          <ul className="lp-roster" data-sc-in data-sc-stagger="40">
            {TEAM.map((t, i) => (
              <li key={t.name} className="lp-cast" data-open={membro === i}>
                <button className="lp-cast__btn" onClick={() => setMembro(membro === i ? null : i)} aria-expanded={membro === i}>
                  <span className="lp-cast__mono" aria-hidden="true">{t.i}</span>
                  <span className="lp-cast__name">{t.name}</span>
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

      {/* 05 CUSTO */}
      <section id="economia" className="lp-chapter">
        <div className="lp-wrap lp-chapter__grid">
          <div className="lp-chapter__head" data-sc-in>
            <div className="lp-chapter__n lp-cap">05 · Custo</div>
            <h2 className="lp-h2">Um time completo custa <mark>R$ 39.500+</mark> por mês.</h2>
            <p className="lp-chapter__lede">É a faixa de salários de mercado para montar essa equipe em casa, antes de encargos, ferramentas e o tempo de coordenar todo mundo. A Calu entrega o mesmo escopo por uma fração, num único investimento mensal.</p>
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

      {/* 06 PERGUNTAS */}
      <section id="perguntas" className="lp-chapter">
        <div className="lp-wrap lp-chapter__grid">
          <div className="lp-chapter__head" data-sc-in>
            <div className="lp-chapter__n lp-cap">06 · Perguntas</div>
            <h2 className="lp-h2">O que todo mundo pergunta <em>antes de começar.</em></h2>
            <p className="lp-chapter__lede">Respostas curtas. Se a sua não estiver aqui, é só chamar no WhatsApp.</p>
          </div>
          <div className="lp-rows" data-sc-in data-sc-stagger="50">
            {PERGUNTAS.map(([q, r], i) => (
              <div key={q} className="lp-row" data-open={pergunta === i}>
                <button className="lp-row__btn" onClick={() => setPergunta(pergunta === i ? null : i)} aria-expanded={pergunta === i}>
                  <span className="lp-row__n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="lp-row__t lp-row__t--q">{q}</span>
                  <span className="lp-row__plus"><Plus size={14} /></span>
                </button>
                <div className="lp-row__body"><div>
                  <div className="lp-row__inner lp-row__inner--q"><p>{r}</p></div>
                </div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FECHO */}
      <section id="contato" className="lp-close">
        <div className="lp-wrap" data-sc-in>
          <div className="lp-cap">Pronto para escalar?</div>
          <h2>Seu time completo <mark>começa hoje.</mark></h2>
          <div className="lp-close__row">
            <a href="/briefing" className="lp-btn lp-btn--ink">Diagnóstico gratuito com IA <ArrowUpRight size={15} /></a>
            <a href={WA} target="_blank" rel="noreferrer" className="lp-btn"><MessageCircle size={15} /> Falar no WhatsApp</a>
            <p className="lp-close__note">O diagnóstico é gratuito, leva trinta minutos numa conversa com a Lia e vira o briefing do seu primeiro mês.</p>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer__in">
          <a href="#" className="lp-brand"><img src={caluLogo} alt="" /> Calu Agência</a>
          <p className="lp-colofao"><em>Colofão.</em> Composto em Space Grotesk e Inter. Feito em Fortaleza, Ceará, por gente e por doze agentes de IA. © 2026 Calu Agência.</p>
          <div style={{ display: "grid", gap: 14, justifyItems: "end" }}>
            <div className="lp-footer__links">
              <Link to="/privacy">Privacidade</Link>
              <Link to="/cookies">Cookies</Link>
              <Link to="/entrar" style={{ color: INK, fontWeight: 600 }}>Entrar</Link>
            </div>
            <div className="lp-footer__social">
              <a href="#" className="lp-social" aria-label="Instagram"><Instagram size={14} /></a>
              <a href="#" className="lp-social" aria-label="LinkedIn"><Linkedin size={14} /></a>
              <a href={WA} target="_blank" rel="noreferrer" className="lp-social" aria-label="WhatsApp"><MessageCircle size={14} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
