import caluLogo from "@/assets/calu-logo.png";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * Landing da Calu como SUPERFÍCIE VIVA (scroll-craft, gramática 2.3).
 *
 * A página é a plataforma rodando um cenário de demonstração, rotulado como
 * tal. O scroll dirige o estado: o briefing entra, o time conversa, o painel
 * de ajuda explica quem faz o quê, o mês se monta (calendário + fila), a
 * revisão corrige, o visitante aprova ou devolve cada peça, e o relatório do
 * final é calculado do que ele aprovou. O fechamento é um input real.
 *
 * Motor: /public/scrollcraft (copiado do engine da skill, nunca editado).
 * Tudo que é bespoke lê `--sc-p` e o estado dos botões; o motor não é tocado.
 * BRIEF: scrollcraft/builds/calu-lp/BRIEF.md
 */

const CANVAS = "#0A0B0A";
const SURFACE = "#121412";
const INK = "#F0EFE8";
const INK_SOFT = "#9AA096";
const ACCENT = "#B9FF4B";

type Agente = { id: string; nome: string; papel: string; cor: string; skills: string[] };

/* Evidência: o registro real do time (supabase/functions/_shared/agencia.ts). */
const TIME: Agente[] = [
  { id: "lia", nome: "Lia", papel: "Diagnóstico e briefing", cor: "#38BDF8", skills: ["Leitura de briefing", "Público, dores e objeções", "Objetivo mensurável"] },
  { id: "ben", nome: "Ben", papel: "Tendências", cor: "#B9FF4B", skills: ["Google Trends Brasil", "Formatos que estão performando", "Sazonalidade do nicho"] },
  { id: "queila", nome: "Queila", papel: "Estratégia", cor: "#FBBF24", skills: ["Posicionamento e big idea", "Pilares de conteúdo", "Funil e KPIs"] },
  { id: "carolina", nome: "Carolina", papel: "Direção de arte", cor: "#F472B6", skills: ["Conceito visual", "Paleta e tipografia", "Sistema de layout"] },
  { id: "pedro", nome: "Pedro", papel: "Calendário editorial", cor: "#2DD4BF", skills: ["Cadência por canal", "Datas estratégicas", "Ordem de produção"] },
  { id: "beatriz", nome: "Beatriz", papel: "Copy", cor: "#A78BFA", skills: ["Legendas, carrosséis, roteiros", "Hooks e CTAs", "Brief visual por peça"] },
  { id: "marcela", nome: "Marcela", papel: "Design", cor: "#D946EF", skills: ["Peças para feed, stories, reels", "Aplicação da direção de arte", "Prompt de imagem"] },
  { id: "bobby", nome: "Bobby", papel: "Vídeo", cor: "#B9FF4B", skills: ["Roteiro cena a cena", "Gancho nos 2 segundos", "O que o cliente precisa gravar"] },
  { id: "rafaela", nome: "Rafaela", papel: "Tráfego pago", cor: "#F97316", skills: ["Meta e Google Ads", "Públicos e orçamento", "Plano de teste"] },
  { id: "teo", nome: "Teo", papel: "Web e SEO", cor: "#06B6D4", skills: ["Artigo otimizado", "Landing page da campanha", "SEO técnico"] },
  { id: "vitoria", nome: "Vitória", papel: "Revisão", cor: "#EC4899", skills: ["Gramática e tom de voz", "Claims e promessas", "Checklist de publicação"] },
  { id: "aira", nome: "Aira", papel: "Orquestração", cor: "#B9FF4B", skills: ["Sequência do time", "Fila de aprovação", "Relatório executivo"] },
  { id: "marina", nome: "Marina", papel: "Social media", cor: "#60A5FA", skills: ["Horários e publicação", "Resposta a comentários", "Monitoramento"] },
  { id: "eduardo", nome: "Eduardo", papel: "Vendas e CRM", cor: "#F59E0B", skills: ["Qualificação no WhatsApp", "Cadência de follow-up", "Pipeline"] },
  { id: "lucas", nome: "Lucas", papel: "Dados", cor: "#34D399", skills: ["KPIs e metas", "Relatório semanal", "Alertas"] },
];
const porId = Object.fromEntries(TIME.map((a) => [a.id, a])) as Record<string, Agente>;

/* Cenário de demonstração. Cliente fictício, rotulado na página. */
const CENARIO = {
  cliente: "Clínica Vitta",
  cidade: "Fortaleza",
  mes: "setembro de 2026",
  objetivo: "Preciso encher a agenda de setembro com pacientes novos. Já tentei impulsionar post e não deu em nada. E não quero prometer cura para ninguém.",
};

/* Conversa entre agentes, no formato real das notas de passagem. `em` é o ponto
   do ato (0 a 1) em que a mensagem já aconteceu. */
const CONVERSA = [
  { em: 0.0, de: "lia", para: "ben", texto: "Público deste mês: pessoas de 35 a 60 anos com dor crônica que já tentaram remédio. Objetivo mensurável: 40 primeiras consultas. Restrição do cliente: nunca prometer cura." },
  { em: 0.18, de: "ben", para: "queila", texto: "A busca por 'fisioterapia para dor nas costas' sobe em setembro em Fortaleza. Cortei as tendências de estética: não é esse público." },
  { em: 0.36, de: "queila", para: "carolina, pedro", texto: "Big idea: 'A dor tem endereço.' Três pilares: educação (50%), bastidor (30%), prova (20%). Tom direto, sem jargão de consultório." },
  { em: 0.54, de: "carolina", para: "marcela", texto: "Fundo claro sempre, azul-petróleo como tinta, limão em no máximo 8% da área. Foto real de consultório. Nunca ilustração de esqueleto." },
  { em: 0.70, de: "pedro", para: "beatriz, marcela, bobby", texto: "Seis peças de 8 a 30 de setembro, terça e quinta ao meio-dia. Duas em vídeo para o Bobby. Nada nos feriados." },
  { em: 0.86, de: "beatriz", para: "marcela", texto: "Copies prontas. O headline da capa de 12/09 tem cinco palavras: não cortar. Deixei o brief visual em cada peça." },
];

type Peca = { id: string; dia: number; formato: string; tema: string; legenda: string; hashtags: string; pilar: string };
const PECAS: Peca[] = [
  { id: "p1", dia: 8,  formato: "reels",     pilar: "educação", tema: "Por que a dor volta",             legenda: "Remédio tira a dor de hoje. A causa continua lá amanhã. Em 40 segundos, o que a fisioterapia faz de diferente.", hashtags: "#fisioterapia #dorcronica #fortaleza" },
  { id: "p2", dia: 12, formato: "carrossel", pilar: "educação", tema: "A dor tem endereço",              legenda: "Cinco lugares onde a dor nas costas costuma começar. Nenhum deles é onde ela dói.", hashtags: "#dornascostas #fisioterapia" },
  { id: "p3", dia: 17, formato: "reels",     pilar: "bastidor", tema: "Primeira consulta, sem mistério", legenda: "O que acontece nos 50 minutos da primeira avaliação. Filmado no consultório, sem ator.", hashtags: "#clinicavitta #primeiraconsulta" },
  { id: "p4", dia: 22, formato: "carrossel", pilar: "prova",    tema: "Três meses depois",               legenda: "Com autorização, o antes e o depois de quem chegou com dor há três meses. Sem promessa: registro.", hashtags: "#resultado #fisioterapiafortaleza" },
  { id: "p5", dia: 24, formato: "post",      pilar: "educação", tema: "Sentar não é descansar",          legenda: "Oito horas sentado pedem dez minutos de mobilidade. Três exercícios que cabem no intervalo.", hashtags: "#mobilidade #trabalho" },
  { id: "p6", dia: 30, formato: "carrossel", pilar: "bastidor", tema: "Quem cuida de você",              legenda: "O time da clínica, um por um, e o que cada um faz na sua consulta.", hashtags: "#clinicavitta #time" },
];
/* Setembro de 2026 começa numa terça-feira e tem 30 dias. */
const SET_INICIA_EM = 2; // 0 = domingo
const SET_DIAS = 30;
/** Ponto do ato 4 (0 a 1) em que a peça i já entrou no calendário e na fila. */
const emDaPeca = (i: number) => 0.08 + i * 0.13;

const REVISAO = [
  { ok: true,  item: "Gramática e ortografia nas seis peças" },
  { ok: true,  item: "Tom de voz: direto, sem jargão, conforme a estratégia" },
  { ok: true,  item: "Direção de arte respeitada: fundo claro, limão em 8%" },
  { ok: false, item: "Peça de 12/09 dizia 'acaba com a dor'. Trocado por 'trata a causa da dor'. O cliente proibiu promessa de cura." },
  { ok: true,  item: "Hashtags com volume real e sem termo de saúde proibido" },
];

const ETAPAS = [
  { id: "briefing", rotulo: "Briefing" },
  { id: "time", rotulo: "Time" },
  { id: "ajuda", rotulo: "Quem faz o quê" },
  { id: "producao", rotulo: "Produção" },
  { id: "revisao", rotulo: "Revisão" },
  { id: "aprovacao", rotulo: "Aprovação" },
  { id: "relatorio", rotulo: "Relatório" },
];

type Decisao = "pendente" | "aprovada" | "devolvida";
const em = (v: number) => ({ "--em": v } as CSSProperties);

const CSS = `
  .lp { --sc-canvas:${CANVAS}; --sc-surface:${SURFACE}; --sc-ink:${INK}; --sc-ink-soft:${INK_SOFT}; --sc-accent:${ACCENT}; --sc-accent-ink:${CANVAS};
        --sc-font-display:'Syne','Manrope',system-ui,sans-serif; --sc-font-text:'Manrope',system-ui,sans-serif;
        --bar:56px; --rail:224px; --tab:60px; --hair:1px solid rgba(240,239,232,.08); --edge: inset 0 1px 0 rgba(240,239,232,.06);
        --shadow: 0 10px 30px -12px rgba(0,0,0,.6), 0 2px 6px -2px rgba(0,0,0,.4);
        background: var(--sc-canvas); color: var(--sc-ink); font-family: var(--sc-font-text); min-height:100vh; }
  .lp *, .lp *::before, .lp *::after { box-sizing: border-box; }
  /* O motor liga scroll-behavior: smooth no html; aqui os saltos do trilho já são suaves por JS, e o suave global engole rolagens programáticas. */
  html:has(.lp) { scroll-behavior: auto; }
  .lp a { color: inherit; text-decoration: none; }
  .lp button { font: inherit; color: inherit; cursor: pointer; }
  .lp h1, .lp h2, .lp h3 { font-family: var(--sc-font-display); letter-spacing: -0.03em; line-height: 1.08; text-wrap: balance; margin: 0; }
  .lp p { margin: 0; text-wrap: pretty; }
  .lp :focus-visible { outline: 2px solid var(--sc-accent); outline-offset: 3px; }
  .lp ::selection { background: rgba(185,255,75,.28); }

  /* ── chrome do produto ── */
  .bar { position: fixed; top: 0; left: 0; right: 0; height: var(--bar); z-index: 60; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; padding: 0 16px; background: rgba(10,11,10,.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-bottom: var(--hair); }
  .bar__brand { display: flex; align-items: center; gap: 9px; font-family: var(--sc-font-display); font-weight: 700; font-size: 14px; letter-spacing: -0.02em; }
  .bar__brand img { width: 26px; height: 26px; border-radius: 7px; object-fit: cover; }
  .bar__mid { display: flex; align-items: center; gap: 10px; min-width: 0; font-size: 12px; color: var(--sc-ink-soft); }
  .bar__mid .st { display: inline-flex; align-items: center; gap: 6px; padding: 4px 9px; border-radius: 999px; border: var(--hair); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar__mid .st i { width: 6px; height: 6px; border-radius: 50%; background: var(--sc-accent); flex-shrink: 0; }
  .bar__mid .st--etapa { color: var(--sc-ink); }
  .bar__right { display: flex; align-items: center; gap: 10px; }
  .ledger { display: flex; align-items: baseline; gap: 6px; font-variant-numeric: tabular-nums; font-size: 12px; color: var(--sc-ink-soft); }
  .ledger b { font-family: var(--sc-font-display); font-size: 18px; color: var(--sc-accent); letter-spacing: -0.02em; }
  .bar__entrar { font-size: 12px; font-weight: 700; padding: 7px 12px; border-radius: 8px; border: 1px solid rgba(185,255,75,.35); color: var(--sc-accent); transition: background .16s var(--sc-ease-out), transform .12s; }
  .bar__entrar:hover { background: rgba(185,255,75,.1); }
  .bar__entrar:active { transform: translateY(1px); }
  @media (max-width: 720px) { .bar__mid .st--demo, .ledger span { display: none; } }

  .rail { position: fixed; top: var(--bar); left: 0; bottom: 0; width: var(--rail); z-index: 50; display: none; flex-direction: column; padding: 18px 12px; gap: 2px; border-right: var(--hair); background: rgba(10,11,10,.6); }
  .rail__label { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; color: var(--sc-ink-soft); padding: 0 10px 10px; }
  .rail button { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 9px 10px; border-radius: 9px; border: 1px solid transparent; background: transparent; font-size: 13px; font-weight: 600; color: var(--sc-ink-soft); transition: color .14s, background .14s; }
  .rail button i { width: 7px; height: 7px; border-radius: 50%; background: rgba(240,239,232,.15); flex-shrink: 0; transition: background .2s; }
  .rail button:hover { color: var(--sc-ink); background: rgba(240,239,232,.04); }
  .rail button.is-on { color: var(--sc-ink); background: rgba(185,255,75,.08); border-color: rgba(185,255,75,.18); }
  .rail button.is-on i, .rail button.is-past i { background: var(--sc-accent); }
  .rail__foot { margin-top: auto; padding: 10px; font-size: 11px; line-height: 1.5; color: var(--sc-ink-soft); border-top: var(--hair); }
  @media (min-width: 1024px) { .rail { display: flex; } }

  .tabs { position: fixed; left: 0; right: 0; bottom: 0; height: calc(var(--tab) + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom); z-index: 60; display: flex; background: rgba(10,11,10,.92); backdrop-filter: blur(14px); border-top: var(--hair); overflow-x: auto; scrollbar-width: none; }
  .tabs::-webkit-scrollbar { display: none; }
  .tabs button { flex: 1 0 auto; min-width: 84px; padding: 10px 8px; font-size: 11px; font-weight: 700; color: var(--sc-ink-soft); background: transparent; border: 0; border-top: 2px solid transparent; white-space: nowrap; }
  .tabs button.is-on { color: var(--sc-accent); border-top-color: var(--sc-accent); }
  @media (min-width: 1024px) { .tabs { display: none; } }
  /* O banner de cookies do app é fixo no rodapé; na landing, sobe acima da tira de abas. */
  @media (max-width: 1023px) { body:has(.lp) .fixed.inset-x-0.bottom-0 { bottom: calc(var(--tab, 60px) + env(safe-area-inset-bottom)); } }

  /* ── área de trabalho ── */
  .work { padding-top: var(--bar); padding-bottom: calc(var(--tab) + 24px); }
  @media (min-width: 1024px) { .work { padding-left: var(--rail); padding-bottom: 0; } }
  .wrap { width: min(1120px, 100% - 2 * clamp(14px, 3vw, 32px)); margin-inline: auto; }
  .panel { background: var(--sc-surface); border: var(--hair); border-radius: 16px; box-shadow: var(--edge), var(--shadow); }
  .panel__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: var(--hair); }
  .panel__title { font-family: var(--sc-font-display); font-size: 13px; font-weight: 700; letter-spacing: -0.01em; display: flex; align-items: center; gap: 8px; }
  .panel__meta { font-size: 11px; color: var(--sc-ink-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--sc-ink-soft); }
  .status { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 999px; border: var(--hair); color: var(--sc-ink-soft); white-space: nowrap; }
  .status i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .status--on { color: var(--sc-accent); border-color: rgba(185,255,75,.3); }
  .avatar { width: 30px; height: 30px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; font-family: var(--sc-font-display); font-weight: 800; font-size: 12px; flex-shrink: 0; }
  .avatar--sm { width: 24px; height: 24px; font-size: 11px; }

  /* ato 1: briefing (flow) */
  .a1 { padding: clamp(28px, 5vw, 64px) 0 clamp(36px, 6vw, 80px); }
  .a1__grid { display: grid; grid-template-columns: 1fr; gap: 18px; align-items: start; }
  @media (min-width: 900px) { .a1__grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 24px; } }
  .help { padding: clamp(18px, 3vw, 28px); }
  .help h1 { font-size: clamp(26px, 3.4vw, 40px); margin-bottom: 14px; }
  .help p { font-size: 15px; line-height: 1.6; color: var(--sc-ink-soft); max-width: 46ch; }
  .help p + p { margin-top: 10px; }
  .help .demo { margin-top: 18px; padding: 10px 12px; border-radius: 10px; background: rgba(185,255,75,.06); border: 1px solid rgba(185,255,75,.18); font-size: 12px; line-height: 1.5; color: var(--sc-ink); }
  .inbox .msg { padding: 16px; display: grid; grid-template-columns: auto 1fr; gap: 12px; }
  .inbox .msg + .msg { border-top: var(--hair); }
  .msg__who { font-weight: 700; font-size: 13px; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .msg__who small { font-weight: 500; font-size: 11px; color: var(--sc-ink-soft); }
  .msg__text { font-size: 14px; line-height: 1.6; color: var(--sc-ink); margin-top: 4px; }
  .lines p { font-size: 14px; line-height: 1.6; padding: 6px 0; border-top: 1px dashed rgba(240,239,232,.08); }
  .lines p:first-child { border-top: 0; }
  .lines p.soft { color: var(--sc-ink-soft); }

  /* ato 2: time (pin) */
  .stage { min-height: 100svh; display: flex; align-items: center; padding: calc(var(--bar) + 16px) 0 24px; }
  .chat { width: 100%; }
  .chat__list { padding: 6px 0; }
  .chat .m { display: grid; grid-template-columns: auto 1fr; gap: 12px; padding: 12px 16px; border-top: var(--hair);
    --v: clamp(0, calc((var(--sc-p, 0) - var(--em)) * 9), 1); opacity: var(--v); transform: translateY(calc((1 - var(--v)) * 10px)); }
  .chat .m:first-of-type { border-top: 0; }
  .m__who { font-size: 12px; display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
  .m__who b { font-weight: 700; }
  .m__who span { color: var(--sc-ink-soft); }
  .m__text { font-size: 14px; line-height: 1.6; margin-top: 3px; max-width: 70ch; }
  .chat__empty { padding: 14px 16px; font-size: 12px; color: var(--sc-ink-soft); }
  @media (prefers-reduced-motion: reduce) { .chat .m { --v: 1; transform: none; } }

  /* ato 3: ajuda (flow) */
  .a3 { padding: clamp(24px, 5vw, 56px) 0; }
  .who__row { display: grid; grid-template-columns: minmax(0, 1fr); gap: 4px 20px; padding: 12px 0; border-top: var(--hair); }
  @media (min-width: 640px) { .who__row { grid-template-columns: 200px minmax(0, 1fr); } }
  .who__name { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 14px; }
  .who__name small { font-weight: 500; color: var(--sc-ink-soft); font-size: 12px; }
  .who__skills { font-size: 13px; color: var(--sc-ink-soft); line-height: 1.55; }
  .who__skills span + span::before { content: " · "; }

  /* ato 4: produção (pin, pico) */
  .prod { width: 100%; display: grid; grid-template-columns: 1fr; gap: 14px; }
  @media (min-width: 900px) { .prod { grid-template-columns: minmax(0, 1.4fr) minmax(300px, 1fr); } }
  .cal__grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; padding: 10px; }
  .cal__dow { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--sc-ink-soft); text-align: center; padding: 4px 0 6px; }
  .cal__d { position: relative; aspect-ratio: 1 / .9; border-radius: 8px; border: 1px solid rgba(240,239,232,.06); padding: 5px 6px; font-size: 11px; color: var(--sc-ink-soft); font-variant-numeric: tabular-nums; overflow: hidden; }
  .cal__d.is-off { opacity: .28; border-style: dashed; }
  .cal__d.has { --v: clamp(0, calc((var(--sc-p, 0) - var(--em)) * 7), 1); border-color: rgba(185,255,75,calc(var(--v) * .45)); }
  .cal__d .chip { position: absolute; left: 4px; right: 4px; bottom: 4px; padding: 3px 5px; border-radius: 6px; font-size: 10px; font-weight: 700; color: var(--sc-accent-ink); background: var(--sc-accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    opacity: var(--v, 0); transform: translateY(calc((1 - var(--v, 0)) * 6px)) scale(calc(.94 + var(--v, 0) * .06)); }
  .queue__list { padding: 6px 0; min-height: 200px; }
  .queue .q { display: grid; grid-template-columns: auto 1fr; gap: 10px; padding: 10px 14px; border-top: var(--hair);
    --v: clamp(0, calc((var(--sc-p, 0) - var(--em)) * 7), 1); opacity: var(--v); transform: translateX(calc((1 - var(--v)) * 12px)); }
  .queue .q:first-child { border-top: 0; }
  .q__date { font-family: var(--sc-font-display); font-weight: 800; font-size: 15px; letter-spacing: -0.02em; line-height: 1; padding-top: 2px; text-align: center; min-width: 34px; }
  .q__date small { display: block; font-family: var(--sc-font-text); font-weight: 600; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; color: var(--sc-ink-soft); margin-top: 3px; }
  .q__title { font-size: 13px; font-weight: 700; }
  .q__sub { font-size: 12px; color: var(--sc-ink-soft); margin-top: 2px; }
  .prod__count { font-family: var(--sc-font-display); font-weight: 800; font-size: clamp(28px, 4vw, 44px); letter-spacing: -0.03em; line-height: 1; color: var(--sc-accent); font-variant-numeric: tabular-nums; }
  .prod__foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; padding: 12px 16px; border-top: var(--hair); }
  .prod__foot p { font-size: 12px; color: var(--sc-ink-soft); max-width: 30ch; line-height: 1.5; }
  @media (prefers-reduced-motion: reduce) { .cal__d.has, .queue .q { --v: 1; transform: none; opacity: 1; } }
  /* Celular: calendário e fila empilhados precisam caber no palco pinado. */
  @media (max-width: 899px) {
    .prod { gap: 10px; }
    .cal__grid { gap: 3px; padding: 8px; }
    .cal__d { aspect-ratio: 1 / .62; padding: 3px 5px; font-size: 10px; border-radius: 6px; }
    .cal__d .chip { left: 3px; right: 3px; bottom: 3px; padding: 2px 4px; font-size: 9px; }
    .prod__foot p { display: none; }
    .prod__foot { padding: 8px 14px; }
    .queue__list { min-height: 0; padding: 2px 0; }
    .queue .q { padding: 7px 12px; }
    .q__sub { display: none; }
    .panel__head { padding: 9px 12px; }
    /* Fechamento: relatório + campo precisam caber numa tela de 812px com barra e abas. */
    .ask { padding: 14px 16px; gap: 8px; }
    .ask > p { display: none; }
    .ask textarea { min-height: 72px; }
    .report dl div { padding: 7px 14px; }
    .report__note { padding: 8px 14px; }
    .foot { margin-top: 10px; padding-top: 10px; }
    .stage { padding: calc(var(--bar) + 8px) 0 8px; }
  }

  /* ato 5: revisão (flow + reveal) */
  .a5 { padding: clamp(24px, 5vw, 56px) 0; }
  .rev { max-width: 720px; }
  .rev ul { margin: 0; padding: 4px 0; list-style: none; }
  .rev li { display: grid; grid-template-columns: 22px 1fr; gap: 10px; padding: 11px 16px; border-top: var(--hair); font-size: 14px; line-height: 1.55; }
  .rev li:first-child { border-top: 0; }
  .rev .tick { width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; margin-top: 2px; }
  .rev .tick--ok { background: rgba(185,255,75,.14); color: var(--sc-accent); }
  .rev .tick--fix { background: rgba(236,72,153,.16); color: #F9A8D4; }
  .rev li.fix { background: rgba(236,72,153,.05); }

  /* ato 6: aprovação (pan) */
  .rail6 { display: flex; align-items: stretch; gap: 14px; padding: 0 clamp(14px, 3vw, 32px); }
  @media (min-width: 1024px) { .rail6 { padding-left: calc(var(--rail) + 32px); } }
  .rail6 > * { flex: 0 0 auto; }
  .rail6__lead { width: min(340px, 78vw); display: flex; flex-direction: column; justify-content: center; gap: 12px; }
  .rail6__lead h2 { font-size: clamp(24px, 3vw, 34px); }
  .rail6__lead p { font-size: 14px; color: var(--sc-ink-soft); line-height: 1.6; max-width: 34ch; }
  .card { width: min(300px, 78vw); display: flex; flex-direction: column; transition: border-color .16s var(--sc-ease-out); }
  .card--aprovada { border-color: rgba(185,255,75,.4); }
  .card--devolvida { border-color: rgba(236,72,153,.35); }
  .card__body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; flex-grow: 1; }
  .card__legenda { font-size: 13px; line-height: 1.6; color: var(--sc-ink); }
  .card__tags { font-size: 12px; color: var(--sc-ink-soft); }
  .card__actions { display: flex; gap: 8px; padding: 12px 16px; border-top: var(--hair); }
  .btn { flex: 1; padding: 10px 12px; border-radius: 9px; font-size: 13px; font-weight: 700; border: 1px solid rgba(240,239,232,.12); background: transparent; transition: background .12s, border-color .12s, transform .1s; }
  .btn:active { transform: translateY(1px); }
  .btn--ok { background: var(--sc-accent); color: var(--sc-accent-ink); border-color: transparent; }
  .btn--ok:hover { background: #CBFF7A; }
  .btn--ok[aria-pressed="true"] { box-shadow: inset 0 0 0 2px rgba(10,11,10,.35); }
  .btn--no:hover { border-color: rgba(236,72,153,.5); color: #F9A8D4; }
  .btn--no[aria-pressed="true"] { border-color: rgba(236,72,153,.6); color: #F9A8D4; background: rgba(236,72,153,.1); }
  .rail6__end { width: min(300px, 78vw); display: flex; flex-direction: column; justify-content: center; gap: 8px; }
  .rail6__end p { font-size: 13px; color: var(--sc-ink-soft); line-height: 1.6; }
  .rail6__end b { font-family: var(--sc-font-display); font-size: clamp(26px, 3vw, 36px); color: var(--sc-accent); letter-spacing: -0.03em; font-variant-numeric: tabular-nums; line-height: 1; }

  /* ato 7: relatório (pin, segura) */
  .close { width: 100%; }
  .close__grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
  @media (min-width: 900px) { .close__grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } }
  .report dl { margin: 0; padding: 6px 0; }
  .report dl div { display: flex; justify-content: space-between; gap: 12px; padding: 9px 16px; border-top: var(--hair); font-size: 13px; }
  .report dl div:first-child { border-top: 0; }
  .report dt { color: var(--sc-ink-soft); }
  .report dd { margin: 0; font-weight: 700; font-variant-numeric: tabular-nums; text-align: right; }
  .report dd.ok { color: var(--sc-accent); }
  .report__note { padding: 12px 16px; border-top: var(--hair); font-size: 12px; line-height: 1.55; color: var(--sc-ink-soft); }
  .ask { padding: clamp(18px, 3vw, 28px); display: flex; flex-direction: column; gap: 12px; }
  .ask h2 { font-size: clamp(24px, 3vw, 34px); }
  .ask p { font-size: 14px; color: var(--sc-ink-soft); line-height: 1.6; max-width: 40ch; }
  .ask label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--sc-ink-soft); }
  .ask textarea { width: 100%; min-height: 96px; resize: vertical; padding: 12px 14px; border-radius: 10px; border: 1px solid rgba(240,239,232,.14); background: rgba(10,11,10,.6); color: var(--sc-ink); font-size: 15px; line-height: 1.5; caret-color: var(--sc-accent); }
  .ask textarea::placeholder { color: rgba(154,160,150,.7); }
  .ask__row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .ask__go { padding: 12px 18px; border-radius: 10px; background: var(--sc-accent); color: var(--sc-accent-ink); font-weight: 800; font-size: 14px; border: 0; transition: background .12s, transform .1s; }
  .ask__go:hover { background: #CBFF7A; }
  .ask__go:active { transform: translateY(1px); }
  .ask__row a { font-size: 13px; font-weight: 600; color: var(--sc-ink-soft); text-decoration: underline; text-underline-offset: 3px; }
  .foot { margin-top: 18px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px 18px; font-size: 12px; color: var(--sc-ink-soft); padding-top: 14px; border-top: var(--hair); }
  .foot nav { display: flex; gap: 14px; flex-wrap: wrap; }
  .foot a:hover { color: var(--sc-ink); }
`;

/** Lê `--sc-p` de um ato como número (0 a 1). */
const pDe = (el: Element | null) => {
  if (!el) return 0;
  const v = parseFloat(getComputedStyle(el).getPropertyValue("--sc-p"));
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
};

type Motor = { mount: (el: Element) => unknown };

export default function LandingPage() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const [etapa, setEtapa] = useState("briefing");
  const [razao, setRazao] = useState({ mensagens: 0, pecas: 0 });
  const [decisao, setDecisao] = useState<Record<string, Decisao>>({});
  const [objetivo, setObjetivo] = useState("");

  const aprovadas = PECAS.filter((p) => decisao[p.id] === "aprovada").length;
  const devolvidas = PECAS.filter((p) => decisao[p.id] === "devolvida").length;
  const pendentes = PECAS.length - aprovadas - devolvidas;
  const entregas = razao.mensagens + razao.pecas + aprovadas;
  const verifyState = `msgs:${razao.mensagens} pecas:${razao.pecas} aprov:${aprovadas} dev:${devolvidas} etapa:${etapa}`;

  /* Motor: carrega CSS + JS uma vez, monta na raiz, e um laço próprio lê
     `--sc-p` para o livro-razão e a etapa atual. Nada disso toca o motor. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let vivo = true;
    let raf = 0;
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = "/scrollcraft/scrollcraft.css";
    document.head.appendChild(link);

    const loop = () => {
      if (!vivo) return;
      const acts = Array.from(root.querySelectorAll<HTMLElement>("[data-sc-act]"));
      const meio = window.innerHeight * 0.5;
      let atual: string | null = null;
      for (const a of acts) {
        const r = a.getBoundingClientRect();
        if (r.top <= meio && r.bottom >= meio) { atual = a.dataset.etapa ?? null; break; }
      }
      const pTime = pDe(root.querySelector('[data-etapa="time"]'));
      const pProd = pDe(root.querySelector('[data-etapa="producao"]'));
      const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const msgs = reduz ? CONVERSA.length : CONVERSA.filter((m) => pTime - m.em > 0.02).length;
      const pecas = reduz ? PECAS.length : PECAS.filter((_, i) => pProd - emDaPeca(i) > 0.02).length;
      if (atual) setEtapa((e) => (e === atual ? e : atual as string));
      setRazao((r) => (r.mensagens === msgs && r.pecas === pecas ? r : { mensagens: msgs, pecas }));
      raf = requestAnimationFrame(loop);
    };

    const montar = () => {
      const SC = (window as unknown as { ScrollCraft?: Motor }).ScrollCraft;
      if (!SC || !vivo) return;
      SC.mount(root);
      raf = requestAnimationFrame(loop);
    };
    const existente = document.querySelector<HTMLScriptElement>("script[data-scrollcraft]");
    if ((window as unknown as { ScrollCraft?: Motor }).ScrollCraft) montar();
    else if (existente) existente.addEventListener("load", montar, { once: true });
    else {
      const s = document.createElement("script");
      s.src = "/scrollcraft/scrollcraft.js"; s.async = true; s.dataset.scrollcraft = "1";
      s.addEventListener("load", montar, { once: true });
      document.head.appendChild(s);
    }
    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      link.remove();
      // O motor pinta o chão (drift) no documento; ao sair da landing, devolve.
      document.documentElement.style.removeProperty("background-color");
      document.body.style.removeProperty("background-color");
      document.documentElement.style.removeProperty("--sc-canvas");
    };
  }, []);

  const irPara = (id: string) => {
    const el = rootRef.current?.querySelector<HTMLElement>(`[data-etapa="${id}"]`);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 56, behavior: "smooth" });
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const q = objetivo.trim();
    navigate(q ? `/briefing?objetivo=${encodeURIComponent(q)}` : "/briefing");
  };

  const idxEtapa = Math.max(0, ETAPAS.findIndex((x) => x.id === etapa));
  const calendario = useMemo(() => {
    const cells: Array<{ dia: number | null; peca?: Peca; i?: number }> = [];
    for (let i = 0; i < SET_INICIA_EM; i++) cells.push({ dia: null });
    for (let d = 1; d <= SET_DIAS; d++) {
      const i = PECAS.findIndex((p) => p.dia === d);
      cells.push({ dia: d, peca: i >= 0 ? PECAS[i] : undefined, i: i >= 0 ? i : undefined });
    }
    while (cells.length % 7) cells.push({ dia: null });
    return cells;
  }, []);

  const decidir = (id: string, d: Decisao) =>
    setDecisao((s) => ({ ...s, [id]: s[id] === d ? "pendente" : d }));

  const av = (a: Agente, sm = false) => (
    <span className={`avatar${sm ? " avatar--sm" : ""}`} style={{ background: `${a.cor}22`, color: a.cor }}>{a.nome.slice(0, 1)}</span>
  );

  return (
    <div className="lp" ref={rootRef}>
      <style>{CSS}</style>
      <div className="sc-grain" aria-hidden="true" />

      {/* ── chrome do produto ── */}
      <header className="bar" data-sc-verify-state={verifyState}>
        <Link to="/" className="bar__brand"><img src={caluLogo} alt="" /> Calu</Link>
        <div className="bar__mid">
          <span className="st st--demo"><i />Demonstração · {CENARIO.cliente} · {CENARIO.mes}</span>
          <span className="st st--etapa" aria-live="polite">{ETAPAS[idxEtapa].rotulo}</span>
        </div>
        <div className="bar__right">
          <span className="ledger" title="Entregas do time enquanto você rola"><b>{entregas}</b><span>entregas</span></span>
          <Link to="/entrar" className="bar__entrar">Entrar</Link>
        </div>
      </header>

      <nav className="rail" aria-label="Etapas da produção">
        <div className="rail__label">Produção</div>
        {ETAPAS.map((e, i) => (
          <button key={e.id} type="button" onClick={() => irPara(e.id)} className={i === idxEtapa ? "is-on" : i < idxEtapa ? "is-past" : ""} aria-current={i === idxEtapa ? "step" : undefined}>
            <i />{e.rotulo}
          </button>
        ))}
        <div className="rail__foot">Calu Agência · Fortaleza, CE<br />Publicidade, tecnologia e IA.</div>
      </nav>
      <nav className="tabs" aria-label="Etapas da produção">
        {ETAPAS.map((e, i) => (
          <button key={e.id} type="button" onClick={() => irPara(e.id)} className={i === idxEtapa ? "is-on" : ""} aria-current={i === idxEtapa ? "step" : undefined}>{e.rotulo}</button>
        ))}
      </nav>

      <main className="work">
        {/* ── 1 · BRIEFING (flow): a superfície já em estado ── */}
        <section data-sc-act="flow" data-sc-drift={CANVAS} data-etapa="briefing" className="a1">
          <div className="wrap a1__grid" data-sc-in data-sc-stagger="70">
            <aside className="panel help">
              <h1>Uma agência inteira, operada por um time de IA que trabalha como uma agência de verdade.</h1>
              <p>Isto não é um vídeo nem uma maquete. É a plataforma da Calu rodando um mês de produção para um cliente. Role a página e o time trabalha: um briefing entra, os agentes conversam entre si, o calendário se monta, a revisão corrige, e você aprova cada peça.</p>
              <p>No final, o relatório é o que você aprovou.</p>
              <div className="demo">Cenário de demonstração. {CENARIO.cliente} é um cliente fictício; as peças, as mensagens e os números desta página são calculados dos dados de exemplo que ela contém.</div>
            </aside>
            <div className="panel inbox">
              <div className="panel__head">
                <span className="panel__title"><span className="status status--on"><i />Briefing recebido</span></span>
                <span className="panel__meta">dia 1 · 09:12</span>
              </div>
              <div className="msg">
                <span className="avatar" style={{ background: "rgba(240,239,232,.08)", color: INK }}>CV</span>
                <div>
                  <div className="msg__who">{CENARIO.cliente} <small>{CENARIO.cidade} · cliente</small></div>
                  <p className="msg__text">{CENARIO.objetivo}</p>
                </div>
              </div>
              <div className="msg">
                {av(porId.lia)}
                <div>
                  <div className="msg__who">Lia <small>{porId.lia.papel}</small></div>
                  <div className="lines">
                    <p>Li o briefing. O público não é "todo mundo com dor": é quem já tentou remédio e cansou.</p>
                    <p>Objetivo mensurável: 40 primeiras consultas em setembro.</p>
                    <p>Restrição registrada para o time inteiro: nunca prometer cura.</p>
                    <p className="soft">Passando para o Ben e a Queila.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2 · TIME (pin): a conversa avança enquanto o quadro segura ── */}
        <section data-sc-act="pin" data-sc-span="2.6" data-sc-drift="#0C0E0C" data-etapa="time">
          <div data-sc-stage className="stage">
            <div className="wrap">
              <div className="panel chat">
                <div className="panel__head">
                  <span className="panel__title">Conversa do time</span>
                  <span className="panel__meta">{razao.mensagens} de {CONVERSA.length} passagens de bastão</span>
                </div>
                <div className="chat__list">
                  <p className="chat__empty">Os agentes se falam por notas de passagem: cada um termina a entrega dizendo ao próximo o que precisa saber.</p>
                  {CONVERSA.map((m, i) => {
                    const de = porId[m.de];
                    return (
                      <div key={i} className="m" style={em(m.em)}>
                        {av(de)}
                        <div>
                          <div className="m__who"><b>{de.nome}</b><span>para {m.para.split(",").map((p) => porId[p.trim()]?.nome ?? p.trim()).join(", ")}</span></div>
                          <p className="m__text">{m.texto}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 · QUEM FAZ O QUÊ (flow): o silêncio antes do pico ── */}
        <section data-sc-act="flow" data-sc-drift={CANVAS} data-etapa="ajuda" className="a3">
          <div className="wrap" data-sc-in data-sc-stagger="40">
            <div className="label" style={{ marginBottom: 10 }}>Painel de ajuda · o time</div>
            <h2 style={{ fontSize: "clamp(22px, 2.6vw, 30px)", marginBottom: 18 }}>Quinze agentes. Cada um faz uma coisa, e passa o bastão.</h2>
            <div className="who">
              {TIME.map((a) => (
                <div key={a.id} className="who__row">
                  <div className="who__name">{av(a, true)}{a.nome} <small>{a.papel}</small></div>
                  <div className="who__skills">{a.skills.map((s) => <span key={s}>{s}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4 · PRODUÇÃO (pin, pico): o mês se monta na sua frente ── */}
        <section data-sc-act="pin" data-sc-span="3.4" data-sc-drift="#0E110D" data-etapa="producao">
          <div data-sc-stage className="stage">
            <div className="wrap prod">
              <div className="panel cal">
                <div className="panel__head">
                  <span className="panel__title">Calendário editorial · setembro</span>
                  <span className="panel__meta">{razao.pecas} de {PECAS.length} peças</span>
                </div>
                <div className="cal__grid">
                  {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <div key={i} className="cal__dow">{d}</div>)}
                  {calendario.map((c, i) => (
                    <div key={i} className={`cal__d ${c.dia === null ? "is-off" : ""} ${c.peca ? "has" : ""}`} style={c.i !== undefined ? em(emDaPeca(c.i)) : undefined}>
                      {c.dia ?? ""}
                      {c.peca && <span className="chip">{c.peca.formato}</span>}
                    </div>
                  ))}
                </div>
                <div className="prod__foot">
                  <p>Pedro calendarizou; Beatriz escreveu; Marcela desenhou em cima da copy dela. Cada peça entra na fila com data e hora.</p>
                  <div className="prod__count" aria-label={`${razao.pecas} peças`}>{razao.pecas}</div>
                </div>
              </div>
              <div className="panel queue">
                <div className="panel__head">
                  <span className="panel__title">Fila de aprovação</span>
                  <span className="status"><i />aguardando você</span>
                </div>
                <div className="queue__list">
                  {PECAS.map((p, i) => (
                    <div key={p.id} className="q" style={em(emDaPeca(i))}>
                      <div className="q__date">{String(p.dia).padStart(2, "0")}<small>set</small></div>
                      <div>
                        <div className="q__title">{p.tema}</div>
                        <div className="q__sub">{p.formato} · pilar {p.pilar} · 12:00</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5 · REVISÃO (flow + reveal): a Vitória pega o que não pode ir ── */}
        <section data-sc-act="flow" data-sc-drift={CANVAS} data-etapa="revisao" className="a5">
          <div className="wrap">
            <div className="panel rev" data-sc-reveal="left" data-sc-reveal-at="0.08 0.5">
              <div className="panel__head">
                <span className="panel__title">{av(porId.vitoria, true)}Revisão da Vitória</span>
                <span className="status status--on"><i />aprovado com 1 ajuste</span>
              </div>
              <ul>
                {REVISAO.map((r, i) => (
                  <li key={i} className={r.ok ? "" : "fix"}>
                    <span className={`tick ${r.ok ? "tick--ok" : "tick--fix"}`} aria-hidden="true">{r.ok ? "✓" : "!"}</span>
                    <span>{r.item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── 6 · APROVAÇÃO (pan): agora é a sua mão ── */}
        <section data-sc-act="pan" data-sc-span="2.2" data-sc-drift="#0C0E0C" data-etapa="aprovacao">
          <div data-sc-stage className="stage">
            <div className="rail6" data-sc-pan="0.06">
              <div className="rail6__lead">
                <span className="label">Fila de aprovação</span>
                <h2>Seis peças. Aprove ou devolva cada uma.</h2>
                <p>No produto, o cliente faz exatamente isto pelo portal. Aqui, o que você decidir vira o relatório no fim da página.</p>
              </div>
              {PECAS.map((p) => {
                const d = decisao[p.id] ?? "pendente";
                return (
                  <article key={p.id} className={`panel card${d !== "pendente" ? ` card--${d}` : ""}`}>
                    <div data-sc-tilt="4">
                      <div className="panel__head">
                        <span className="panel__title">{String(p.dia).padStart(2, "0")}/09 · {p.formato}</span>
                        <span className={`status${d === "aprovada" ? " status--on" : ""}`}><i />{d}</span>
                      </div>
                      <div className="card__body">
                        <div className="q__title">{p.tema}</div>
                        <p className="card__legenda">{p.legenda}</p>
                        <div className="card__tags">{p.hashtags}</div>
                      </div>
                    </div>
                    <div className="card__actions">
                      <button type="button" className="btn btn--ok" aria-pressed={d === "aprovada"} onClick={() => decidir(p.id, "aprovada")}>Aprovar</button>
                      <button type="button" className="btn btn--no" aria-pressed={d === "devolvida"} onClick={() => decidir(p.id, "devolvida")}>Devolver</button>
                    </div>
                  </article>
                );
              })}
              <div className="rail6__end">
                <b>{aprovadas}</b>
                <p>{aprovadas === PECAS.length ? "Tudo aprovado. A Marina agenda e publica nos horários do calendário." : aprovadas === 0 ? "aprovadas até agora. Nada vai ao ar sem o seu ok." : `de ${PECAS.length} aprovadas. As devolvidas voltam para a Beatriz e a Marcela com o seu comentário.`}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7 · RELATÓRIO (pin, segura): o que você aprovou, e um campo ── */}
        <section data-sc-act="pin" data-sc-span="1.2" data-sc-drift={CANVAS} data-etapa="relatorio" id="contato">
          <div data-sc-stage className="stage">
            <div className="wrap close">
              <div className="close__grid">
                <div className="panel report">
                  <div className="panel__head">
                    <span className="panel__title">{av(porId.aira, true)}Relatório da Aira</span>
                    <span className="panel__meta">{CENARIO.cliente} · {CENARIO.mes}</span>
                  </div>
                  <dl>
                    <div><dt>Passagens de bastão entre agentes</dt><dd>{CONVERSA.length}</dd></div>
                    <div><dt>Peças calendarizadas e produzidas</dt><dd>{PECAS.length}</dd></div>
                    <div><dt>Ajustes pedidos pela revisão</dt><dd>{REVISAO.filter((r) => !r.ok).length}</dd></div>
                    <div><dt>Aprovadas por você</dt><dd className="ok">{aprovadas}</dd></div>
                    <div><dt>Devolvidas para ajuste</dt><dd>{devolvidas}</dd></div>
                    <div><dt>Ainda aguardando decisão</dt><dd>{pendentes}</dd></div>
                  </dl>
                  <p className="report__note">
                    {aprovadas === 0 && devolvidas === 0
                      ? "Você ainda não decidiu nenhuma peça. Volte à fila de aprovação: o relatório muda com o que você escolher."
                      : aprovadas === PECAS.length
                        ? "Setembro fechado: seis peças aprovadas vão ao ar nas datas do calendário. A Marina publica; o Lucas mede; a Aira reporta toda semana."
                        : `${aprovadas} peça(s) vão ao ar; ${devolvidas} voltam para ajuste e ${pendentes} esperam você. No produto, tudo isso acontece no portal do cliente.`}
                  </p>
                </div>
                <form className="panel ask" onSubmit={enviar} action="/briefing" method="get">
                  <span className="label">Agora o seu mês</span>
                  <h2>Qual é o objetivo do seu próximo mês?</h2>
                  <p>Escreva como falaria com alguém da equipe. A Lia lê, faz o diagnóstico gratuito e o time começa por aí.</p>
                  <label htmlFor="objetivo">Objetivo</label>
                  <textarea id="objetivo" name="objetivo" value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Ex.: Preciso encher a agenda de setembro com pacientes novos, sem prometer cura." />
                  <div className="ask__row">
                    <button type="submit" className="ask__go">Começar o diagnóstico</button>
                    <a href="https://wa.me/5585986408404" target="_blank" rel="noreferrer">ou falar no WhatsApp</a>
                  </div>
                  <footer className="foot">
                    <span>© {new Date().getFullYear()} Calu Agência · Fortaleza, CE</span>
                    <nav aria-label="Legal"><Link to="/privacy">Privacidade</Link><Link to="/terms">Termos</Link><Link to="/cookies">Cookies</Link><Link to="/entrar">Entrar</Link></nav>
                  </footer>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
