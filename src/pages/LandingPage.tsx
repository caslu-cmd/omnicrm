import caluLogo from "@/assets/calu-logo.png";
import { useState, useEffect, useRef, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, ArrowDown, MessageCircle, Instagram, Linkedin, Menu, X, Plus, Check } from "lucide-react";

/**
 * Landing page da Calu Agência. Direção: o expediente.
 *
 * Uma agência é um elenco. A Calu tem doze — cada agente com nome, função e
 * turno — e a página é a folha de chamada desse time: papel claro com um
 * respiro de limão (a cor da marca), tinta quente quase preta, e as iniciais
 * de cada agente em plaquinhas, como um quadro de expediente. Display em
 * grotesca expressiva (Bricolage), corpo em humanista (Plus Jakarta) e mono
 * (JetBrains) nos horários, funções e etiquetas — a papelada de uma redação
 * que trabalha. O limão aparece cheio, em blocos: o destaque nos títulos, as
 * plaquinhas do elenco e a laje do fecho. O que se move é o time entregando o
 * turno e o mês se montando.
 *
 * O motor da scroll-craft mora em /public/scrollcraft e nunca é editado.
 */

const LIME  = "#B9FF4B";
const INK   = "#16150F";
const PAPER = "#F5F7ED";
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
  .lp { --lime:${LIME}; --ink:${INK}; --paper:${PAPER}; --card:#FFFFFF; --sand:#E8E6DA;
        --ink-2: rgba(22,21,15,.60); --ink-3: rgba(22,21,15,.42);
        --line: rgba(22,21,15,.13); --line-2: rgba(22,21,15,.26);
        --pad: clamp(20px, 5vw, 72px); --w: 1320px;
        --serif: 'Bricolage Grotesque', 'Plus Jakarta Sans', system-ui, sans-serif;
        --sans: 'Plus Jakarta Sans', system-ui, sans-serif;
        --mono: 'JetBrains Mono', ui-monospace, monospace;
        font-family: var(--sans); color: var(--ink); background: var(--paper);
        -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; font-feature-settings: "kern", "liga"; }
  html:has(.lp), body:has(.lp) { overflow-x: clip; scroll-behavior: auto; background: ${PAPER}; }
  body:has(.lp) .fixed.inset-x-0.bottom-0 { z-index: 60; }
  .lp { position: relative; }
  .lp > *:not(.lp-grain) { position: relative; z-index: 1; }
  .lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp a { color: inherit; text-decoration: none; }
  .lp button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
  .lp h1, .lp h2, .lp h3 { font-family: var(--serif); font-weight: 700; letter-spacing: -0.03em; line-height: 1; overflow-wrap: normal; }
  .lp h1 em, .lp h2 em, .lp h3 em { font-style: normal; background-image: linear-gradient(var(--lime), var(--lime)); background-repeat: no-repeat; background-size: 100% 0.26em; background-position: 0 90%; }
  .lp p { line-height: 1.6; }
  .lp ::selection { background: var(--lime); color: var(--ink); }
  .lp-mono { font-family: var(--mono); font-size: 11px; letter-spacing: .04em; color: var(--ink-3); }
  .lp-cap { font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
  .lp-wrap { max-width: var(--w); margin: 0 auto; padding-left: var(--pad); padding-right: var(--pad); }
  /* fibra do papel: ruído fino sobre o claro */
  .lp-grain { position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: .04;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

  /* marca-texto: um traço de limão sob a palavra que importa */
  .lp mark { background: none; color: inherit; background-image: linear-gradient(var(--lime), var(--lime)); background-repeat: no-repeat; background-size: 0% 0.28em; background-position: 0 92%; padding: 0 .04em; margin: 0 -.04em; transition: background-size 1.1s cubic-bezier(.2,.7,0,1) .25s; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
  .sc-in mark, .lp-marca-ja mark { background-size: 100% 0.28em; }

  /* botões: primário em tinta, secundário em contorno */
  .lp-btn { display: inline-flex; align-items: center; gap: 10px; height: 52px; padding: 0 22px; border-radius: 8px; font-weight: 700; font-size: 14.5px; border: 1px solid var(--ink); color: var(--ink); background: transparent; transition: background .25s, color .25s, border-color .25s, transform .35s cubic-bezier(.2,.7,0,1); white-space: nowrap; }
  .lp .lp-btn:hover { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .lp .lp-btn--ink { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .lp-btn--ink:hover { background: #2E2C20; border-color: #2E2C20; color: var(--paper); }
  .lp-btn--sm { height: 40px; padding: 0 16px; font-size: 13px; }
  .lp-btn svg { transition: transform .35s cubic-bezier(.2,.7,0,1); }
  .lp-btn:hover svg { transform: translate(2px, -2px); }
  .lp-link { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14.5px; border-bottom: 1px solid var(--ink); padding-bottom: 3px; transition: gap .25s, border-color .25s; }
  .lp-link:hover { gap: 12px; border-color: var(--lime); }

  /* barra */
  .lp > .lp-nav { position: fixed; inset: 0 0 auto 0; z-index: 200; height: 68px; display: flex; align-items: center; border-bottom: 1px solid transparent; transition: background .35s, border-color .35s, transform .5s cubic-bezier(.2,.7,0,1); }
  .lp-nav.is-solid { background: rgba(245,247,237,.86); border-color: var(--line); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
  .lp-nav.is-hidden { transform: translateY(-100%); }
  .lp-nav__in { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .lp-brand { display: inline-flex; align-items: center; gap: 10px; font-family: var(--serif); font-weight: 700; font-size: 19px; letter-spacing: -0.02em; }
  .lp-brand img { width: 28px; height: 28px; border-radius: 7px; }
  .lp-nav__links { display: none; }
  .lp-nav__cta { display: none; }
  .lp-burger { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line-2); border-radius: 8px; color: var(--ink); }
  @media (min-width: 900px) {
    .lp-nav__links { display: flex; gap: 28px; font-size: 14px; font-weight: 500; color: var(--ink-2); }
    .lp-nav__links a { border-bottom: 1px solid transparent; transition: color .2s, border-color .2s; } .lp-nav__links a:hover { color: var(--ink); border-color: var(--lime); }
    .lp-nav__cta { display: flex; align-items: center; gap: 22px; }
    .lp-nav__cta .lp-entrar { font-size: 14px; font-weight: 500; color: var(--ink-2); transition: color .2s; } .lp-nav__cta .lp-entrar:hover { color: var(--ink); }
    .lp-burger { display: none; }
  }
  .lp > .lp-menu { position: fixed; inset: 0; z-index: 190; background: var(--paper); display: flex; flex-direction: column; justify-content: center; padding: 96px var(--pad) 40px; gap: 4px; }
  .lp-menu a.lp-menu__l { font-family: var(--serif); font-weight: 700; font-size: clamp(36px, 9vw, 56px); letter-spacing: -0.03em; line-height: 1.1; padding: 10px 0; border-bottom: 1px solid var(--line); }
  .lp-menu__cta { display: flex; flex-direction: column; gap: 10px; margin-top: 28px; }

  /* hero: título à esquerda, a folha de chamada à direita */
  .lp-hero { position: relative; padding: 108px 0 36px; overflow: hidden; }
  .lp-hero::before { content: ""; position: absolute; inset: -10% -20% auto -20%; height: 78%; background: radial-gradient(46% 100% at 26% 0%, rgba(185,255,75,.34), transparent 66%); pointer-events: none; z-index: 0; }
  .lp-hero__grid { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr; gap: 40px; align-items: center; }
  .lp-hero__copy { min-width: 0; }
  .lp-hero__kicker { display: flex; align-items: center; gap: 12px; margin-bottom: clamp(20px, 3vh, 30px); }
  .lp-hero__kicker i { display: block; width: 28px; height: 2px; background: var(--lime); }
  .lp-h1 { font-size: clamp(40px, 10.2vw, 84px); line-height: .94; letter-spacing: -0.035em; max-width: 100%; overflow-wrap: break-word; }
  .lp-h1 .l { display: block; overflow: hidden; padding-bottom: .1em; margin-bottom: -.1em; }
  .lp-h1 .w { display: block; transform: translateY(110%); animation: lp-line 1.1s cubic-bezier(.2,.7,0,1) forwards; }
  .lp-h1 .l:nth-child(1) .w { animation-delay: .06s; }
  .lp-h1 .l:nth-child(2) .w { animation-delay: .18s; }
  @keyframes lp-line { to { transform: none; } }
  @keyframes lp-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  .lp-hero__lede { font-size: clamp(16px, 1.25vw, 19px); line-height: 1.55; color: var(--ink-2); max-width: 46ch; margin-top: clamp(20px, 3vh, 28px); opacity: 0; animation: lp-rise 1s cubic-bezier(.2,.7,0,1) .6s forwards; }
  .lp-hero__lede b { color: var(--ink); font-weight: 700; }
  .lp-hero__ctas { display: flex; flex-wrap: wrap; align-items: center; gap: 14px 22px; margin-top: clamp(22px, 3vh, 30px); opacity: 0; animation: lp-rise 1s cubic-bezier(.2,.7,0,1) .8s forwards; }
  .lp-hero__sheet { min-width: 0; width: 100%; max-width: 520px; opacity: 0; animation: lp-rise 1.1s cubic-bezier(.2,.7,0,1) .45s forwards; }
  @media (min-width: 900px) {
    .lp-hero { padding: 132px 0 40px; min-height: 100svh; display: flex; flex-direction: column; justify-content: center; }
    .lp-hero__grid { grid-template-columns: minmax(0, 1.2fr) minmax(380px, .8fr); gap: clamp(40px, 6vw, 96px); }
    .lp-h1 { font-size: clamp(56px, 5.8vw, 90px); }
    .lp-hero__sheet { justify-self: end; }
  }
  .lp-hero__facts { position: relative; z-index: 1; list-style: none; display: flex; flex-wrap: wrap; gap: 18px clamp(28px, 5vw, 72px); margin-top: clamp(40px, 7vh, 72px); padding-top: 22px; border-top: 1px solid var(--ink); opacity: 0; animation: lp-rise 1s cubic-bezier(.2,.7,0,1) 1s forwards; }
  .lp-hero__facts li { display: flex; align-items: baseline; gap: 10px; }
  .lp-hero__facts b { font-family: var(--serif); font-weight: 700; font-size: clamp(28px, 2.6vw, 40px); letter-spacing: -0.03em; line-height: 1; }
  .lp-hero__facts span { font-size: 13px; color: var(--ink-2); }
  .lp-hero__facts .lp-hero__go { margin-left: auto; display: inline-flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; }
  .lp-hero__go i { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--ink); display: inline-flex; align-items: center; justify-content: center; transition: background .25s, color .25s, border-color .25s; }
  .lp-hero__go:hover i { background: var(--lime); color: var(--ink); border-color: var(--lime); }

  /* folha de chamada: cartão claro que sustenta a pauta e o calendário */
  .lp-sheet { position: relative; background: var(--card); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 1px 0 rgba(22,21,15,.03), 0 30px 60px -44px rgba(22,21,15,.45); padding: clamp(18px, 2.2vw, 26px); }
  .lp-sheet--tilt { transform: rotate(-1.2deg); }
  @media (min-width: 900px) { .lp-sheet--tilt { transform: rotate(-1.6deg); } }
  .lp-sheet__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--ink); }
  .lp-sheet__title { font-family: var(--serif); font-weight: 700; font-size: 21px; letter-spacing: -0.02em; }
  .lp-sheet__meta { font-family: var(--mono); font-size: 10px; color: var(--ink-3); text-align: right; line-height: 1.5; }
  .lp-pauta { list-style: none; margin-top: 6px; }
  .lp-pauta li { display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--line); font-size: 13px; position: relative; }
  .lp-pauta li:last-child { border-bottom: 0; }
  .lp-pauta time { font-family: var(--mono); font-size: 10px; color: var(--ink-3); }
  .lp-pauta .t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: color .4s; }
  .lp-pauta .t b { font-weight: 700; }
  .lp-pauta .t span { color: var(--ink-2); }
  .lp-pauta .t mark { transition: background-size .55s cubic-bezier(.2,.7,0,1); }
  .lp-pauta .q { width: 16px; height: 16px; border: 1px solid var(--line-2); border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; color: var(--ink); transition: background .3s, border-color .3s; }
  .lp-pauta li.is-done .q { background: var(--lime); border-color: var(--lime); color: var(--ink); }
  .lp-pauta li.is-done .t { color: var(--ink-3); text-decoration: line-through; text-decoration-color: var(--ink-3); text-decoration-thickness: 1px; }
  .lp-pauta li.is-now .t mark { background-size: 100% 0.28em; }
  .lp-pauta li.is-now::before { content: ""; position: absolute; left: -10px; top: 50%; width: 5px; height: 5px; border-radius: 50%; background: var(--lime); transform: translateY(-50%); box-shadow: 0 0 0 3px rgba(139,196,42,.28); }
  .lp-sheet__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line); font-size: 12px; color: var(--ink-2); }
  .lp-live { position: absolute; right: 14px; bottom: 44px; display: inline-flex; align-items: center; gap: 7px; font-family: var(--mono); font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-2); background: var(--paper); border: 1px solid var(--line-2); border-radius: 999px; padding: 5px 10px 5px 9px; }
  .lp-live::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--lime); box-shadow: 0 0 0 0 rgba(139,196,42,.5); animation: lp-pulse 2.2s infinite; }
  @keyframes lp-pulse { 0% { box-shadow: 0 0 0 0 rgba(139,196,42,.45); } 70% { box-shadow: 0 0 0 7px rgba(139,196,42,0); } 100% { box-shadow: 0 0 0 0 rgba(139,196,42,0); } }

  /* manifesto */
  .lp-manifesto { padding: clamp(64px, 10vw, 128px) 0; border-top: 1px solid var(--ink); }
  .lp-manifesto p { font-family: var(--serif); font-weight: 700; font-size: clamp(28px, 4.6vw, 62px); letter-spacing: -0.03em; line-height: 1.08; max-width: 24ch; }
  .wd { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: .12em; margin-bottom: -.12em; }
  .wd > span { display: inline-block; transform: translateY(108%); transition: transform 1s cubic-bezier(.2,.7,0,1); transition-delay: calc(var(--i) * 22ms); }
  .sc-in .wd > span { transform: none; }
  .wd.is-em > span { background-image: linear-gradient(var(--lime), var(--lime)); background-repeat: no-repeat; background-size: 100% 0.22em; background-position: 0 88%; }
  .lp-manifesto__meta { display: flex; gap: 12px 28px; flex-wrap: wrap; margin-top: 30px; }
  .lp-manifesto__meta span { display: inline-flex; align-items: center; gap: 10px; font-size: 13.5px; color: var(--ink-2); }
  .lp-manifesto__meta i { width: 14px; height: 2px; background: var(--lime); display: inline-block; }

  /* capítulos */
  .lp-chapter { border-top: 1px solid var(--line); padding: clamp(56px, 9vw, 120px) 0; }
  .lp-chapter__grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
  @media (min-width: 900px) { .lp-chapter__grid { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 72px; } .lp-chapter__head { position: sticky; top: 100px; align-self: start; } }
  .lp-chapter__n { display: flex; align-items: center; gap: 12px; }
  .lp-chapter__n::after { content: ""; flex: 0 0 40px; height: 2px; background: var(--lime); transform: scaleX(0); transform-origin: left; transition: transform .9s cubic-bezier(.2,.7,0,1) .25s; }
  .sc-in .lp-chapter__n::after { transform: none; }
  .lp-h2 { font-size: clamp(36px, 4.6vw, 68px); margin-top: 18px; line-height: 1.0; }
  .lp-chapter__lede { font-size: clamp(15px, 1.2vw, 18px); color: var(--ink-2); margin-top: 22px; max-width: 44ch; }
  .lp-chapter__lede + .lp-link { margin-top: 22px; }

  /* linhas expansíveis (processo e perguntas) */
  .lp-rows { border-top: 1px solid var(--ink); }
  .lp-row { border-bottom: 1px solid var(--line); }
  .lp-row__btn { width: 100%; display: grid; grid-template-columns: 34px 1fr auto; align-items: baseline; gap: 14px; padding: 18px 0; text-align: left; }
  .lp-row__n { font-family: var(--mono); font-size: 11px; color: var(--ink-3); }
  .lp-row__t { font-family: var(--serif); font-weight: 700; font-size: clamp(24px, 2.6vw, 36px); letter-spacing: -0.03em; transition: transform .45s cubic-bezier(.2,.7,0,1); }
  .lp-row__btn:hover .lp-row__t { transform: translateX(6px); }
  .lp-row__t--q { font-size: clamp(20px, 2vw, 28px); }
  .lp-row__meta { font-family: var(--mono); font-size: 11px; color: var(--ink-3); display: none; }
  .lp-row__plus { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--ink); border-radius: 50%; transition: transform .35s cubic-bezier(.2,.7,0,1), background .25s, color .25s, border-color .25s; align-self: center; color: var(--ink); }
  .lp-row[data-open="true"] .lp-row__plus { transform: rotate(45deg); background: var(--lime); color: var(--ink); border-color: var(--lime); }
  .lp-row__body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s cubic-bezier(.2,.7,0,1); }
  .lp-row[data-open="true"] .lp-row__body { grid-template-rows: 1fr; }
  .lp-row__body > div { overflow: hidden; }
  .lp-row__inner { display: grid; grid-template-columns: 1fr; gap: 18px; padding: 0 0 26px 48px; }
  .lp-row__inner--q { grid-template-columns: 1fr; }
  .lp-row__inner p { color: var(--ink-2); font-size: 15px; max-width: 46ch; }
  .lp-row__agents { display: flex; flex-wrap: wrap; gap: 6px; }
  .lp-chip { font-family: var(--mono); font-size: 11px; font-weight: 500; padding: 5px 9px; border: 1px solid var(--line-2); border-radius: 999px; color: var(--ink-2); }
  .lp-row__list { list-style: none; display: grid; gap: 8px; font-size: 14px; color: var(--ink-2); }
  .lp-row__list li { display: flex; gap: 10px; align-items: baseline; }
  .lp-row__list li::before { content: ""; width: 12px; height: 2px; background: var(--lime); flex: 0 0 12px; position: relative; top: -4px; }
  @media (min-width: 700px) { .lp-row__btn { grid-template-columns: 40px 1fr auto auto; } .lp-row__btn:has(.lp-row__t--q) { grid-template-columns: 40px 1fr auto; } .lp-row__meta { display: block; } .lp-row__inner { grid-template-columns: 1.2fr 1fr; gap: 32px; padding-left: 54px; } .lp-row__inner--q { grid-template-columns: 1fr; } }

  /* o mês se montando (pinado): calendário e lista de aprovação */
  .lp-month { position: relative; border-top: 1px solid var(--ink); }
  .lp-month__stage { min-height: 100svh; display: flex; align-items: safe center; padding: 84px 0 28px; }
  .lp-month__head { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 22px; align-items: end; }
  @media (min-width: 900px) { .lp-month__head { grid-template-columns: 1.1fr 1fr; gap: 48px; } }
  .lp-month .lp-h2 { font-size: clamp(34px, 4.4vw, 64px); margin-top: 12px; }
  .lp-month__prog { position: relative; height: 2px; background: var(--line-2); margin-bottom: 20px; }
  .lp-month__prog::before { content: ""; position: absolute; inset: 0; background: var(--lime); transform-origin: left; transform: scaleX(var(--sc-p, 0)); }
  .lp-month__prog b { position: absolute; top: 8px; left: 0; font-family: var(--mono); font-size: 10px; color: var(--ink-3); font-weight: 400; }
  .lp-month__prog b:last-child { left: auto; right: 0; }
  .lp-month__grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
  @media (min-width: 900px) { .lp-month__grid { grid-template-columns: minmax(0, 1.45fr) minmax(280px, 1fr); gap: 40px; align-items: start; } }
  .lp-cal { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); margin-top: 10px; }
  .lp-cal__dow { font-family: var(--mono); font-size: 10px; color: var(--ink-3); padding: 0 0 8px 6px; }
  .lp-cal__d { position: relative; aspect-ratio: 1 / .62; border-top: 1px solid var(--line); border-left: 1px solid var(--line); padding: 6px 7px; font-family: var(--mono); font-size: 11px; color: var(--ink-3); overflow: hidden; }
  .lp-cal__d:nth-child(7n) { border-right: 1px solid var(--line); }
  .lp-cal__d:nth-last-child(-n+7) { border-bottom: 1px solid var(--line); }
  .lp-cal__d.is-off { color: transparent; background: repeating-linear-gradient(135deg, transparent 0 6px, rgba(22,21,15,.04) 6px 7px); }
  .lp-cal__d.has { --v: clamp(0, calc((var(--sc-p, 0) - var(--em)) * 7), 1); color: var(--ink); }
  .lp-cal__chip { position: absolute; left: 5px; right: 5px; bottom: 5px; padding: 3px 6px; font-family: var(--mono); font-size: 10px; font-weight: 500; color: var(--ink); background: var(--lime); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transform-origin: left; transform: scaleX(var(--v, 0)); z-index: 1; border-radius: 4px; }
  .lp-month__foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding-top: 14px; }
  .lp-month__foot p { font-size: 13px; color: var(--ink-2); max-width: 40ch; }
  .lp-count { font-family: var(--serif); font-weight: 700; font-size: clamp(48px, 6vw, 92px); letter-spacing: -0.04em; line-height: .9; display: flex; align-items: baseline; gap: 10px; }
  .lp-count small { font-family: var(--sans); font-weight: 500; font-size: 12px; color: var(--ink-3); }
  .lp-queue { list-style: none; }
  .lp-q { display: grid; grid-template-columns: 18px 44px 1fr; gap: 12px; align-items: start; padding: 11px 0; border-bottom: 1px solid var(--line); --v: clamp(0, calc((var(--sc-p, 0) - var(--em)) * 7), 1); opacity: calc(.3 + var(--v) * .7); }
  .lp-q .q { width: 16px; height: 16px; border: 1px solid var(--line-2); border-radius: 4px; margin-top: 3px; display: inline-flex; align-items: center; justify-content: center; color: var(--ink); background: rgba(185,255,75,var(--v)); border-color: rgba(22,21,15,calc(.24 + var(--v) * .5)); }
  .lp-q .q svg { opacity: var(--v); }
  .lp-q__d { font-family: var(--serif); font-weight: 700; font-size: 22px; line-height: 1; }
  .lp-q__d small { display: block; font-family: var(--mono); font-size: 9px; color: var(--ink-3); margin-top: 3px; }
  .lp-q__t { font-weight: 700; font-size: 14px; }
  .lp-q__s { font-family: var(--mono); font-size: 10px; color: var(--ink-3); margin-top: 4px; }
  @media (prefers-reduced-motion: reduce) { .lp-cal__d.has, .lp-q { --v: 1; } .lp-month__prog::before { transform: none; } .lp-h1 .w, .lp-hero__lede, .lp-hero__ctas, .lp-hero__sheet, .lp-hero__facts { animation: none; opacity: 1; transform: none; } .wd > span { transform: none; transition: none; } .lp-chapter__n::after { transform: none; } .lp-nav.is-hidden { transform: none; } .lp mark { background-size: 100% 0.28em; transition: none; } .lp-live::before { animation: none; } }
  @media (max-height: 940px) and (min-width: 900px) { .lp-month__stage { padding-top: 76px; } .lp-month .lp-h2 { font-size: clamp(30px, 4.6vh, 56px); } .lp-cal__d { aspect-ratio: 1 / .52; } .lp-q { padding: 8px 0; } .lp-month__head { margin-bottom: 12px; } }
  @media (max-width: 899px) {
    .lp-month__stage { padding: 72px 0 14px; }
    .lp-month .lp-h2 { font-size: clamp(28px, 7.6vw, 38px); margin-top: 8px; }
    .lp-month__head { gap: 6px; margin-bottom: 12px; }
    .lp-month__head .lp-chapter__lede { font-size: 13px; margin-top: 0; }
    .lp-month__grid { gap: 10px; }
    .lp-sheet { padding: 12px; }
    .lp-cal__dow { padding-bottom: 6px; font-size: 9px; }
    .lp-cal__d { aspect-ratio: 1 / .5; font-size: 10px; padding: 4px 5px; }
    .lp-cal__chip { font-size: 9px; padding: 2px 4px; left: 3px; right: 3px; bottom: 3px; }
    .lp-month__foot { padding-top: 8px; } .lp-month__foot p { display: none; } .lp-count { font-size: 36px; }
    .lp-q { padding: 5px 0; gap: 8px; grid-template-columns: 16px 38px 1fr; }
    .lp-q__d { font-size: 16px; } .lp-q__d small { display: inline; margin-left: 3px; }
    .lp-q__t { font-size: 12.5px; } .lp-q__s { display: none; }
  }

  /* serviços: índice de reportagem */
  .lp-services { list-style: none; display: grid; grid-template-columns: 1fr; border-top: 1px solid var(--ink); }
  .lp-service { position: relative; display: grid; grid-template-columns: 56px 1fr; gap: 12px; padding: 24px 0; border-bottom: 1px solid var(--line); transition: padding-left .35s cubic-bezier(.2,.7,0,1); }
  .lp-service::before { content: ""; position: absolute; left: 0; top: -1px; height: 2px; width: 0; background: var(--lime); transition: width .5s cubic-bezier(.2,.7,0,1); }
  .lp-service:hover::before { width: 100%; }
  .lp-service:hover { padding-left: 8px; }
  .lp-service__n { font-family: var(--mono); font-size: 15px; color: var(--ink-3); line-height: 1.6; }
  .lp-service h3 { font-size: clamp(22px, 2.2vw, 30px); }
  .lp-service p { color: var(--ink-2); font-size: 14.5px; margin-top: 8px; max-width: 40ch; }
  @media (min-width: 700px) { .lp-services { grid-template-columns: 1fr 1fr; column-gap: 48px; } }

  /* soluções */
  .lp-products { border-top: 1px solid var(--ink); }
  .lp-product { display: grid; grid-template-columns: 1fr; gap: 16px; padding: clamp(28px, 4vw, 44px) 0; border-bottom: 1px solid var(--line); }
  @media (min-width: 900px) { .lp-product { grid-template-columns: 180px 1fr 1fr; gap: 40px; } }
  .lp-product h3 { font-size: clamp(36px, 4.2vw, 60px); }
  .lp-product__sub { font-size: 13px; color: var(--ink-3); margin-top: 8px; }
  .lp-product p { color: var(--ink-2); font-size: 15px; max-width: 46ch; }
  .lp-product__items { list-style: none; display: grid; gap: 8px; margin-top: 16px; font-size: 14px; }
  .lp-product__items li { display: flex; gap: 10px; align-items: baseline; color: var(--ink-2); }
  .lp-product__items li::before { content: ""; width: 12px; height: 2px; background: var(--lime); flex: 0 0 12px; position: relative; top: -4px; }
  .lp-product .lp-link { margin-top: 20px; }

  /* time: o expediente, agente por agente, com plaquinha de inicial */
  .lp-roster { list-style: none; border-top: 1px solid var(--ink); }
  .lp-cast { border-bottom: 1px solid var(--line); }
  .lp-cast__btn { width: 100%; display: grid; grid-template-columns: 46px 1fr auto; align-items: center; gap: 14px; padding: 12px 0; text-align: left; }
  .lp-cast__mono { width: 42px; height: 42px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-family: var(--serif); font-weight: 700; font-size: 16px; letter-spacing: -0.02em; background: var(--sand); color: var(--ink); border: 1px solid var(--line); transition: background .3s, color .3s, border-color .3s; }
  .lp-cast:nth-child(3n+1) .lp-cast__mono { background: var(--lime); border-color: var(--lime); }
  .lp-cast[data-open="true"] .lp-cast__mono { background: var(--ink); color: var(--paper); border-color: var(--ink); }
  .lp-cast__name { font-family: var(--serif); font-weight: 700; font-size: clamp(24px, 3.4vw, 42px); letter-spacing: -0.03em; line-height: 1; transition: transform .45s cubic-bezier(.2,.7,0,1); }
  .lp-cast__btn:hover .lp-cast__name { transform: translateX(6px); }
  .lp-cast__role { font-family: var(--mono); font-size: 11px; letter-spacing: .02em; color: var(--ink-2); text-align: right; }
  .lp-cast__body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s cubic-bezier(.2,.7,0,1); }
  .lp-cast[data-open="true"] .lp-cast__body { grid-template-rows: 1fr; }
  .lp-cast__body > div { overflow: hidden; }
  .lp-cast__inner { display: grid; grid-template-columns: 1fr; gap: 14px; padding: 0 0 22px 60px; }
  .lp-cast__inner p { color: var(--ink-2); font-size: 14.5px; max-width: 46ch; }
  @media (min-width: 700px) { .lp-cast__inner { grid-template-columns: 1.3fr 1fr; gap: 32px; } }
  .lp-roster__big { font-family: var(--serif); font-weight: 700; font-size: clamp(120px, 22vw, 300px); letter-spacing: -0.06em; line-height: .8; color: var(--ink); opacity: .05; margin-top: 18px; }

  /* custo */
  .lp-table { list-style: none; border-top: 1px solid var(--ink); }
  .lp-table li { display: flex; justify-content: space-between; gap: 16px; padding: 13px 0; border-bottom: 1px solid var(--line); font-size: 14.5px; }
  .lp-table li span:last-child { font-family: var(--mono); font-size: 12px; color: var(--ink-2); white-space: nowrap; }
  .lp-table li.is-total { padding: 18px 0; font-family: var(--serif); font-weight: 700; font-size: 20px; border-bottom: 1px solid var(--ink); }
  .lp-table li.is-total span:last-child { font-family: var(--serif); font-weight: 700; font-size: 20px; color: var(--ink); }
  .lp-table__note { font-size: 12px; color: var(--ink-3); margin-top: 12px; }

  /* fecho: laje de limão */
  .lp-close { background: var(--lime); color: var(--ink); padding: clamp(64px, 11vw, 150px) 0; }
  .lp-close .lp-cap { color: rgba(22,21,15,.6); }
  .lp-close h2 { font-size: clamp(48px, 9.6vw, 150px); letter-spacing: -0.04em; line-height: .92; margin-top: 18px; max-width: 12ch; color: var(--ink); }
  .lp-close mark { background-image: linear-gradient(var(--ink), var(--ink)); }
  .lp-close__row { display: flex; flex-wrap: wrap; gap: 14px 22px; align-items: center; margin-top: clamp(28px, 4vw, 48px); padding-top: 24px; border-top: 1px solid rgba(22,21,15,.24); }
  .lp-close .lp-btn { border-color: var(--ink); color: var(--ink); }
  .lp .lp-close .lp-btn:hover { background: var(--ink); color: var(--lime); border-color: var(--ink); }
  .lp .lp-close .lp-btn--ink { background: var(--ink); color: var(--lime); border-color: var(--ink); }
  .lp .lp-close .lp-btn--ink:hover { background: #2E2C20; color: var(--lime); border-color: #2E2C20; }
  .lp-close__note { font-size: 14px; color: rgba(22,21,15,.7); max-width: 36ch; margin-left: auto; }

  /* rodapé com colofão */
  .lp-footer { padding: 40px 0 calc(28px + env(safe-area-inset-bottom)); border-top: 1px solid var(--line-2); }
  .lp-footer__in { display: grid; grid-template-columns: 1fr; gap: 22px; }
  .lp-footer__links { display: flex; flex-wrap: wrap; gap: 18px; font-size: 13px; color: var(--ink-2); }
  .lp-footer__links a:hover { color: var(--ink); }
  .lp-footer__social { display: flex; gap: 8px; }
  .lp-social { width: 40px; height: 40px; border: 1px solid var(--line-2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: var(--ink-2); transition: border-color .2s, color .2s; }
  .lp-social:hover { border-color: var(--lime); color: var(--ink); }
  .lp-colofao { font-size: 12.5px; color: var(--ink-3); line-height: 1.6; max-width: 52ch; }
  .lp-colofao em { font-family: var(--serif); font-style: normal; font-weight: 700; font-size: 1.02em; color: var(--ink-2); }
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
                      {c.i !== undefined && <span className="lp-cal__chip">{PECAS[c.i].formato}</span>}
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
                    <li key={pc.id} className="lp-q" style={em(emDaPeca(i))}>
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
          <p className="lp-colofao"><em>Colofão.</em> Composto em Bricolage Grotesque e Plus Jakarta Sans. Feito em Fortaleza, Ceará, por gente e por doze agentes de IA. © 2026 Calu Agência.</p>
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
