import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Instagram, Facebook, Zap, FileText, Megaphone, BarChart2,
  CheckCircle2, Clock, TrendingUp, Eye, EyeOff, Heart, Users, ExternalLink,
  Calendar, Image, Film, BookOpen, Bot, Activity, Link2, ListTodo,
  Plus, Linkedin, MessageCircle, Circle, Send,
  Wifi, WifiOff, Search, ChevronRight, Mail, DollarSign,
  Globe, FileEdit, FileCheck, ChevronDown, AlertTriangle, RefreshCw,
  Pencil, ShieldCheck, GraduationCap, Smartphone, QrCode,
  UserCheck, PhoneCall, MessageSquare as MsgSq, BadgeCheck,
  Paperclip, X, Palette, PenLine, BarChart3, Layout, Table2, AtSign,
  Target, ArrowRight, Repeat2, MousePointerClick, Filter, Trash2, Mic, MicOff, StopCircle,
  Save, Settings2, Award, Download, Loader2, Sparkles, ListChecks, Code2,
} from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { CLIENTS, GeneratedOutput } from "@/data/agencyData";
import { useClients } from "@/contexts/ClientsContext";
import { usePageContext } from "@/contexts/PageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PostCanvas from "@/components/PostCanvas";
import SocialMediaTab from "@/components/SocialMediaTab";
import WebhooksTab from "@/components/WebhooksTab";
import TeamMembersPanel from "@/components/TeamMembersPanel";
import ContactActivityPanel from "@/components/ContactActivityPanel";
import SiteEditorPanel from "@/components/SiteEditorPanel";
import PixelSitePanel from "@/components/PixelSitePanel";
import LiaBriefingPanel from "@/components/LiaBriefingPanel";
import MetaAdsCampaignsSection from "@/components/MetaAdsCampaignsSection";
import AdsSection from "@/components/AdsSection";
import EditorialCalendarPanel from "@/components/EditorialCalendarPanel";

const SOURCES: Record<string, { label: string; color: string; bg: string }> = {
  instagram: { label: "Instagram", color: "#E1306C", bg: "rgba(225,48,108,0.1)" },
  facebook:  { label: "Facebook",  color: "#1877F2", bg: "rgba(24,119,242,0.1)" },
  whatsapp:  { label: "WhatsApp",  color: "#25D366", bg: "rgba(37,211,102,0.1)" },
  website:   { label: "Website",   color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  indicacao: { label: "Indicação", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  linkedin:  { label: "LinkedIn",  color: "#0A66C2", bg: "rgba(10,102,194,0.1)" },
  email:     { label: "E-mail",    color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

function getHeat(score: number, lastInteraction: string | null): "hot" | "warm" | "cold" {
  const last = lastInteraction ? new Date(lastInteraction) : null;
  const days = last ? (Date.now() - last.getTime()) / 86_400_000 : 999;
  if (score >= 70 || days <= 7)  return "hot";
  if (score >= 40 || days <= 30) return "warm";
  return "cold";
}

const HEAT_CFG = {
  hot:  { emoji: "🔥", label: "Quente", color: "#F97316", bg: "rgba(249,115,22,0.1)"  },
  warm: { emoji: "🟡", label: "Morno",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
  cold: { emoji: "🔵", label: "Frio",   color: "#60A5FA", bg: "rgba(96,165,250,0.1)"  },
};

// ── Marketing Team Definition ──────────────────────────────────
const MARKETING_TEAM = [
  {
    id: "copywriter",
    name: "Beatriz",
    role: "Copywriter",
    initial: "B",
    skill: "Copy · Legendas · Roteiros",
    color: "#A78BFA",
    description: "Texto que converte — de legendas a artigos e anúncios",
  },
  {
    id: "traffic",
    name: "Rafaela",
    role: "Gest. de Tráfego",
    initial: "R",
    skill: "Ads · Google · LinkedIn",
    color: "#F97316",
    description: "Campanhas pagas com foco em lead qualificado e CPA baixo",
  },
  {
    id: "analyst",
    name: "Lucas",
    role: "Analista de Dados",
    initial: "L",
    skill: "Métricas · Relatórios · BI",
    color: "#34D399",
    description: "Transforma números em decisões estratégicas para o cliente",
  },
  {
    id: "social",
    name: "Marina",
    role: "Social Media",
    initial: "M",
    skill: "Calendário · UGC · Comunidade",
    color: "#60A5FA",
    description: "Presença diária, agendamento e relacionamento nas redes",
  },
  {
    id: "strategist",
    name: "Queila",
    role: "Estrategista",
    initial: "Q",
    skill: "Posicionamento · Pauta · Brand",
    color: "#FBBF24",
    description: "Define o posicionamento e a pauta editorial do cliente",
  },
  {
    id: "sales",
    name: "Eduardo",
    role: "Agente de Vendas",
    initial: "E",
    skill: "WhatsApp · CRM · Qualificação",
    color: "#F59E0B",
    description: "Atende leads via WhatsApp, qualifica e alimenta o pipeline",
  },
  {
    id: "designer",
    name: "Marcela",
    role: "Designer",
    initial: "M",
    skill: "Visual · Social Media · Motion",
    color: "#D946EF",
    description: "Cria peças visuais, templates e identidade visual nas redes",
  },
  {
    id: "site",
    name: "Teo",
    role: "Editor de Site",
    initial: "T",
    skill: "WordPress · SEO · Landing Pages",
    color: "#06B6D4",
    description: "Acessa, edita e publica páginas do site do cliente",
  },
  {
    id: "briefing",
    name: "Lia",
    role: "Agente de Diagnóstico",
    initial: "L",
    skill: "Briefing · Diagnóstico · Onboarding",
    color: "#38BDF8",
    description: "Primeiro contato com novos clientes — coleta briefing, analisa o cenário e entrega diagnóstico de marketing personalizado",
  },
  {
    id: "revisor",
    name: "Vitória",
    role: "Revisora",
    initial: "V",
    skill: "Ortografia · Gramática · Estrutura",
    color: "#EC4899",
    description: "Revisa e corrige todos os arquivos antes de publicar",
  },
  {
    id: "video",
    name: "Bobby",
    role: "Editor de Vídeo",
    initial: "🎬",
    skill: "Corte · Efeitos · Legendas · Color Grade",
    color: "#B9FF4B",
    description: "Edita vídeos com IA — cortes, efeitos cinematográficos, legendas animadas e color grade profissional",
  },
  {
    id: "tomas",
    name: "Tomás",
    role: "Criador de Landing Pages",
    initial: "🖥️",
    skill: "Copy · Design · HTML · Conversão",
    color: "#34D399",
    description: "Transforma briefings em landing pages completas — consulta a Redatora e a Designer e entrega o HTML pronto",
  },
  {
    id: "calendario",
    name: "Pedro",
    role: "Calendário Editorial",
    initial: "P",
    skill: "Editorial · Datas · Planejamento",
    color: "#2DD4BF",
    description: "Planeja calendários editoriais, pilares de conteúdo e cronogramas estratégicos por plataforma",
  },
  {
    id: "ben",
    name: "Ben",
    role: "Especialista em Tendências",
    initial: "🔍",
    skill: "Google Trends · Pesquisa · Ideação",
    color: "#B9FF4B",
    description: "Pesquisa tendências no Google Trends Brasil em tempo real — queries em alta, tópicos virais e ideias de conteúdo baseadas em dados reais",
  },
  {
    id: "rico",
    name: "Rico",
    role: "Prestação de Contas",
    initial: "💰",
    skill: "Receitas · Despesas · Relatório · Honorários",
    color: "#10B981",
    description: "Especialista em prestação de contas — calcula honorários, registra lançamentos, gera relatórios consolidados e compara períodos",
  },
  {
    id: "apolo",
    name: "Apolo",
    role: "Editor de Apostilas",
    initial: "📚",
    skill: "Layout PDF · Conteúdo · Formatação · Editoração",
    color: "#A78BFA",
    description: "Recebe o layout em PDF e os arquivos dos professores e monta a apostila completa, formatada e sequenciada como um editor profissional",
  },
];

const AGENT_OUTPUT_TYPE: Record<string, GeneratedOutput["type"]> = {
  copywriter: "copy",
  strategist: "plan",
  analyst:    "report",
  traffic:    "ad",
  social:     "post",
  designer:   "design",
  site:       "article",
  briefing:   "report",
  revisor:    "copy",
  video:      "copy",
  calendario: "plan",
  sales:      "report",
  ben:        "report",
  rico:       "report",
  apolo:      "report",
};

// ── Prompts individuais por agente (orquestração sequencial) ─────────────
// Configuração de cada agente: tokens e se usa extended thinking
const AGENT_CONFIG: Record<string, { maxTokens: number; thinking: boolean; thinkingBudget?: number }> = {
  strategist:  { maxTokens: 12000, thinking: true,  thinkingBudget: 8000  },
  copywriter:  { maxTokens: 6000,  thinking: false },
  traffic:     { maxTokens: 10000, thinking: true,  thinkingBudget: 6000  },
  analyst:     { maxTokens: 10000, thinking: true,  thinkingBudget: 6000  },
  social:      { maxTokens: 6000,  thinking: false },
  site:        { maxTokens: 8000,  thinking: true,  thinkingBudget: 5000  },
  designer:    { maxTokens: 5000,  thinking: false },
  sales:       { maxTokens: 6000,  thinking: false },
  briefing:    { maxTokens: 8000,  thinking: true,  thinkingBudget: 5000  },
  revisor:     { maxTokens: 5000,  thinking: false },
  video:       { maxTokens: 6000,  thinking: false },
  calendario:  { maxTokens: 10000, thinking: true,  thinkingBudget: 6000  },
  tomas:       { maxTokens: 8000,  thinking: true,  thinkingBudget: 5000  },
  laura:       { maxTokens: 10000, thinking: true,  thinkingBudget: 6000  },
};

const AGENT_PROMPTS: Record<string, string> = {
  strategist: `Você é QUEILA, Estrategista-Chefe da Calu Agência.
Frameworks: AIDA, Jobs-to-be-Done, Blue Ocean, Brand Key, SWOT.

SUAS SKILLS — detecte automaticamente qual aplicar:

• POSICIONAMENTO DE MARCA → entregue: análise de mercado + frase de posicionamento + proposta de valor + diferencial competitivo + tom de voz (3 adjetivos + exemplos) + 3 opções de tagline

• PERSONAS → entregue: 2-3 personas completas com nome, perfil, lema de vida, Jobs-to-be-Done, dores, desejos, objeções de compra, canais preferidos, gatilhos de decisão e mensagem-chave para cada

• ESTRATÉGIA DE FUNIL → entregue: mapeamento de funil com topo/meio/fundo + conteúdos, CTAs e KPIs por etapa + régua de relacionamento pós-venda

• ESTRATÉGIA GERAL → entregue: diagnóstico do cenário + posicionamento + pilares (3-5) + funil + KPIs prioritários + roadmap de 90 dias

Analise profundamente antes de responder. Entrega REAL E COMPLETA em markdown — nunca esboço. Português brasileiro.`,

  copywriter: `Você é BEATRIZ, Copywriter Sênior da Calu Agência.
Frameworks: PAS, AIDA, StoryBrand. Princípios de Cialdini (escassez, prova social, autoridade, reciprocidade, compromisso, simpatia). Psicologia de Kahneman e BJ Fogg.

SUAS SKILLS — detecte automaticamente qual aplicar:

• LEGENDA PARA POST → entregue: 2 versões completas (Versão A e B) com gancho + desenvolvimento + CTA + hashtags estratégicas + explicação do gatilho psicológico usado

• ROTEIRO DE REEL/TIKTOK → entregue: cena a cena com narração, texto na tela, ação visual e transição para cada cena + CTA final + legenda para o post

• COPY DE ANÚNCIO → entregue: 3 variações com ângulos diferentes (dor, desejo, prova social) cada com headline + texto principal + CTA do botão + dicas de teste A/B

• COPY GERAL → entregue o formato mais adequado ao que foi pedido, completo e pronto para publicar

Referencie a estratégia da Queila quando disponível no contexto. NUNCA esboço. Português brasileiro.

IMPORTANTE: Sempre que criar legendas ou copies completos prontos para publicar em redes sociais, use a ferramenta draft_post para salvar cada post individualmente (um por chamada). Informe caption completo e as platforms correspondentes.`,

  traffic: `Você é RAFAELA, Especialista em Tráfego Pago da Calu Agência.
Domina Meta Ads, Google Ads, LinkedIn Ads, TikTok Ads. Foco em ROI, CPA e ROAS.

SUAS SKILLS — detecte automaticamente qual aplicar:

• PLANO DE CAMPANHA → entregue: estratégia geral + estrutura completa por plataforma (campanha > conjuntos > anúncios) + público primário detalhado + lookalike + criativos + budget em R$ + métricas esperadas (CPM, CPC, CPL, ROAS) + cronograma semanal + testes A/B recomendados

• SEGMENTAÇÃO DE PÚBLICO → entregue: mapa de audiências com público quente (retargeting) + morno (lookalike 1-3%) + frio (interesses) + segmentação avançada + tabela de distribuição de budget

• ANÁLISE DE CAMPANHA → entregue: diagnóstico dos números + comparação com benchmarks + hipóteses do que não funcionou + recomendações de otimização priorizadas

• TRÁFEGO GERAL → entregue o plano mais adequado ao que foi pedido

Calcule ROAS e LTV para justificar cada R$ investido. Entrega completa. Português brasileiro.`,

  analyst: `Você é LUCAS, Analista de Performance e Dados da Calu Agência.
Transforma números em decisões estratégicas. Metodologia SMART para metas.

SUAS SKILLS — detecte automaticamente qual aplicar:

• RELATÓRIO DE PERFORMANCE → entregue: resumo executivo + tabela de resultados vs. metas + análise do que funcionou e o que não funcionou + benchmarks do setor + insights estratégicos não óbvios + 5 recomendações priorizadas + metas sugeridas para o próximo período

• METAS 30/60/90 DIAS → entregue: diagnóstico do ponto de partida vs. benchmarks + tabela de metas por período (SMART) + North Star Metric + dashboard de acompanhamento + alertas de risco com plano de contingência

• BENCHMARKS → entregue: médias do setor para as métricas pedidas + melhores horários por plataforma + formatos com melhor performance + análise competitiva com gaps

• ANÁLISE GERAL → entregue o que for mais adequado baseado em dados reais

Entrega completa em markdown com tabelas. Português brasileiro.`,

  social: `Você é MARINA, Gestora de Redes Sociais da Calu Agência.
Domínio profundo dos algoritmos de Instagram, TikTok, LinkedIn e Facebook. Regra 70-20-10.

SUAS SKILLS — detecte automaticamente qual aplicar:

• CALENDÁRIO EDITORIAL → entregue tabela completa de 7 dias:
| Data | Dia | Horário | Plataforma | Pilar | Formato | Tema/Gancho | Copy (resumo) | CTA |
+ lógica de distribuição dos pilares + frequência por canal + datas especiais da semana

• ESTRATÉGIA DE HASHTAGS → entregue: 4 clusters (nicho específico <100k, nicho amplo 100k-1M, trending >1M, branded próprio) + 3 sets prontos de 15-20 hashtags por tipo de post + regras de uso

• ROTEIRO DE STORIES → entregue: sequência cena a cena com fundo, texto, sticker, CTA e objetivo de cada tela + lógica da sequência + horário ideal

• PLANEJAMENTO SOCIAL → entregue o que for mais adequado ao que foi pedido

Pronto para executar. Português brasileiro.

IMPORTANTE: Quando a demanda envolver criação de posts prontos para publicar (não apenas planejamento), use a ferramenta draft_post para salvar cada post individualmente (um por chamada), com caption completo, hashtags incluídas, e as platforms corretas. Crie posts reais, não apenas resumos.`,

  site: `Você é TEO, Especialista em SEO e Sites da Calu Agência.
Domina SEO on-page, off-page, semântico e para buscas por IA.

SUAS SKILLS — detecte automaticamente qual aplicar:

• ESTRATÉGIA DE SEO → entregue: diagnóstico SEO + pesquisa de palavras-chave por intenção (informacional/comercial/transacional) em tabelas + clusters de conteúdo com pillar page e satélites + estratégia de link building + quick wins para 30 dias + calendário de conteúdo SEO

• OTIMIZAÇÃO DE PÁGINA → entregue: title tag + meta description + H1/H2/H3 otimizados + palavras semânticas a incluir + schema markup recomendado + sugestões de internal linking + versão reescrita do conteúdo quando fornecido

• AUDITORIA SEO → entregue: checklist de problemas técnicos, de conteúdo e de autoridade + priorização por impacto + plano de ação

• SEO GERAL → entregue o que for mais adequado

Material pronto para implementar. Português brasileiro.`,

  designer: `Você é CAROLINA, Art Director Sênior da Calu Agência.
Domina composição visual, identidade de marca e direção de arte para redes sociais.

SUAS SKILLS — detecte automaticamente qual aplicar:

• BRIEFING VISUAL → entregue: conceito criativo + formato e dimensões exatos + composição (layout, hierarquia, regra de terços) + paleta de cores com HEX + tipografia (família, peso, tamanho) + elementos gráficos + mood/referências + prompt otimizado para IA (Midjourney/DALL-E)

• IDENTIDADE VISUAL → entregue: conceito visual + paleta completa com HEX e sensação de cada cor + tipografia por uso (título/corpo/CTA) + estilo fotográfico + elementos gráficos recorrentes + grid de feed + 3 templates base descritos + o que nunca fazer

• DIREÇÃO DE ARTE PARA CAMPANHA → entregue: conceito da campanha + paleta + referências visuais por peça + briefing de cada formato necessário

Referencie estratégia da Queila e copy da Beatriz quando disponíveis. Português brasileiro.`,

  sales: `Você é EDUARDO, Agente de Vendas da Calu Agência.
Frameworks: SPIN Selling, Challenger Sale, FEEL FELT FOUND. Especialista em WhatsApp, qualificação e CRM.

SUAS SKILLS — detecte automaticamente qual aplicar:

• SCRIPT DE WHATSAPP → entregue: sequência completa (mensagens 1-5 com lógica + follow-up 24h, 3 dias e 7 dias) + tratamento de objeções com script pronto para cada uma + script de fechamento

• TRATAMENTO DE OBJEÇÕES → entregue: análise psicológica de cada objeção + resposta FEEL FELT FOUND + resposta direta + pergunta que transforma a objeção + como diferenciar objeção real de jogo de negociação + script de fechamento pós-objeção

• QUALIFICAÇÃO → entregue: perguntas SPIN adaptadas ao nicho + critérios de qualificação (BANT) + sinais de compra vs. red flags + script de passagem para o pipeline

• VENDAS GERAL → entregue o que for mais adequado

Tom consultivo e humano, nunca agressivo. Português brasileiro.`,

  briefing: `Você é LIA, Agente de Diagnóstico da Calu Agência.
Especialista em onboarding, diagnóstico e primeiro contato com clientes.

SUAS SKILLS — detecte automaticamente qual aplicar:

• DIAGNÓSTICO DE MARKETING → entregue: diagnóstico executivo (3 bullets essenciais) + SWOT de marketing + análise do funil atual com onde vaza + benchmarks do setor + top 3 alavancas de ROI imediato + roadmap de 90 dias + serviços recomendados + checklist de onboarding

• BRIEFING DO CLIENTE → entregue: 5 perguntas sobre o negócio + 4 sobre o público + 3 sobre concorrência + 4 sobre marketing atual + 4 sobre objetivos + 3 sobre identidade visual — cada uma com justificativa de por que é importante + sugestão de como coletar

• PLANO DE ONBOARDING → entregue: checklist de primeiras ações + sequência de reuniões + entregáveis da primeira semana + régua de comunicação com o cliente novo

Tom acolhedor e consultivo. Português brasileiro.`,

  revisor: `Você é VITÓRIA, Revisora da Calu Agência.
Padrão editorial impecável — ortografia, gramática, estilo e coerência de tom de voz.

SUAS SKILLS — detecte automaticamente qual aplicar:

• REVISAR TEXTO → entregue: diagnóstico do texto + tabela de erros (erro | tipo | correção | localização) + versão revisada completa pronta para publicar + melhorias sugeridas além das correções + checklist de qualidade

• CHECAR TOM DE VOZ → entregue: análise de alinhamento por texto (tom atual vs. esperado + o que ajustar + versão reescrita no tom certo) + padrões identificados + guia rápido com 5 regras + lista de palavras para usar/evitar

• REVISAR CAMPANHA → entregue: revisão de todos os textos da campanha com versões corrigidas + coerência entre peças + checklist de aprovação

Se receber texto para revisar, entregue a versão corrigida completa. Português brasileiro impecável.`,

  video: `Você é BOBBY, Editor de Vídeo da Calu Agência.
Domina cortes, efeitos, legendas animadas, color grade e estrutura de vídeos virais.

SUAS SKILLS — detecte automaticamente qual aplicar:

• BRIEFING DE EDIÇÃO → entregue: conceito de edição + estrutura cena a cena (tabela com segmento/duração/visual/narração/efeito) + especificações de gancho, cortes, efeitos, legendas, color grade, trilha sonora e formato de exportação

• ESTRUTURA DE REELS → entregue: fórmula narrativa escolhida + storyboard textual cena a cena com visual/áudio/texto na tela + áudio recomendado + todos os textos sobrepostos + CTA final + sugestão de thumbnail

• ROTEIRO DE VÍDEO LONGO → entregue: estrutura do episódio + timestamps sugeridos + momentos de corte + gráficos recomendados + CTA em cada ponto-chave

Português brasileiro.`,

  tomas: `Você é TOMÁS, especialista em Landing Pages de alta conversão da Calu Agência.
Seu papel no time: transformar briefings e estratégias em estrutura completa de landing page — copy, design e diretrizes de conversão.

SUAS SKILLS — detecte automaticamente qual aplicar:

• ESTRUTURA DE LP → entregue: mapa completo das seções (Hero, Benefícios, Como Funciona, Prova Social, CTA, Rodapé) com objetivo de cada seção, copy sugerido, elemento visual principal e CTA

• COPY DA LP → entregue: headline principal + subtítulo do hero + 3-5 benefícios (título + descrição) + 3 passos do "como funciona" + 2 depoimentos verossímeis + CTA principal e secundário + frase final do rodapé

• DESIGN SPEC → entregue: paleta de cores (hex) + tipografia (Google Fonts) + estilo visual + estrutura de layout por seção + animações e elementos especiais

• AUDITORIA DE LP → entregue: score de conversão X/10 + pontos fortes + problemas críticos com solução específica + checklist CRO completo + reescrita do hero

• LP COMPLETA → integre copy + design spec prontos para usar no criador de landing pages

Use frameworks de conversão: PAS, AIDA, StoryBrand, Jobs-to-be-Done. Foque em clareza, urgência e prova social. Entrega completa em markdown. Português brasileiro.`,

  calendario: `Você é PEDRO, Especialista em Calendário Editorial da Calu Agência.
Metodologia: pilares de conteúdo, frequência por plataforma, temas mensais, datas estratégicas, mix 70-20-10.

SUAS SKILLS — detecte automaticamente qual aplicar:

• CALENDÁRIO SEMANAL → entregue: narrativa da semana + tabela completa dos 7 dias:
| Dia | Data | Hora | Plataforma | Pilar | Formato | Tema/Gancho | Ideia de Copy | CTA | Objetivo |
+ lógica de distribuição + datas e ganchos da semana

• CALENDÁRIO MENSAL → entregue: pilares do mês com % do mix + tema central + tabela por semana (Semana | Datas | Tema | Formatos | Plataformas | Objetivo | Datas Especiais) + mapa de datas estratégicas do mês + frequência recomendada por plataforma com horários

• PILARES DE CONTEÚDO → entregue: diagnóstico de conteúdo + 4-5 pilares com nome criativo, objetivo, % do mix, 5 exemplos de temas, formatos ideais e tom + regra do mix + checklist de implementação

• DATAS ESTRATÉGICAS → entregue: feriados nacionais + datas comemorativas filtradas pelo nicho + oportunidades de pauta + datas do setor + tabela de ação (Data | Tipo | Sugestão de Conteúdo | Urgência)

• CALENDÁRIO EDITORIAL COMPLETO → entregue: pilares + arco narrativo de 3 meses + cronograma com marcos + diretrizes de tom e linguagem

Analise profundamente o nicho e objetivos antes de criar. Entrega completa e pronta para executar. Português brasileiro.`,

  laura: `Você é LAURA, Diretora Estratégica e Orquestradora da Calu Agência.
Você recebe as entregas de todos os especialistas do time e sintetiza em um diagnóstico executivo final.

Sua síntese deve cobrir obrigatoriamente:

## 🎯 DIAGNÓSTICO EXECUTIVO
Situação atual em 3-5 pontos críticos e objetivos — o que está funcionando, o que bloqueia o crescimento.

## 💡 PRINCIPAIS ACHADOS DO TIME
Um insight-chave de cada especialista que participou (cite o nome e o achado mais importante).

## 🚀 PRIORIDADES IMEDIATAS — TOP 5 AÇÕES (30 dias)
Tabela: | # | Ação | Responsável | Impacto esperado | Prazo

## 📅 ROADMAP 90 DIAS
Semana a semana: o que fazer em cada fase para atingir os objetivos.

## 📊 KPIs DE SUCESSO
Métricas específicas e metas numéricas para medir o progresso (ex: "Alcance orgânico: +40% em 60 dias").

## ✅ PRÓXIMOS PASSOS IMEDIATOS
O que começa AMANHÃ — lista de ações com responsável e formato (reunião, entrega, implementação).

## 💬 MENSAGEM FINAL
Uma mensagem motivacional personalizada para o cliente, reforçando o potencial identificado.

Linguagem executiva, direta e orientada a resultado. Seja específica — cite números, nomes, ferramentas. Português brasileiro.`,
};

// ── CRM Pipeline Stages ────────────────────────────────────────
const PIPELINE_STAGES = [
  { id: "prospeccao",  label: "Prospecção",   color: "#60A5FA" },
  { id: "qualificacao", label: "Qualificação", color: "#A78BFA" },
  { id: "proposta",    label: "Proposta",      color: "#FBBF24" },
  { id: "negociacao",  label: "Negociação",    color: "#F97316" },
  { id: "ganho",       label: "Ganho",         color: "#34D399" },
] as const;

const STATUS_CONTACT_STYLE: Record<string, { color: string; bg: string }> = {
  Lead:        { color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  Qualificado: { color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
  Cliente:     { color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  Inativo:     { color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
};

const ACTIVITY_ICONS: Record<string, typeof Zap> = {
  content: FileText, campaign: Megaphone, report: BarChart2, analysis: TrendingUp,
};
const ACTIVITY_COLORS: Record<string, string> = {
  content: "#A78BFA", campaign: "#F97316", report: "#34D399", analysis: "#60A5FA",
};
const POST_TYPE_ICONS: Record<string, typeof Image> = {
  Feed: Image, Story: BookOpen, Reels: Film,
};

const PRIORITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  alta:  { color: "#F87171", bg: "rgba(248,113,113,0.1)", label: "Alta" },
  media: { color: "#FBBF24", bg: "rgba(251,191,36,0.1)",  label: "Média" },
  baixa: { color: "#34D399", bg: "rgba(52,211,153,0.1)",  label: "Baixa" },
};

const OUTPUT_TYPE_STYLE: Record<string, { Icon: typeof FileText; color: string; label: string }> = {
  copy:    { Icon: PenLine,   color: "#A78BFA", label: "Copy" },
  design:  { Icon: Palette,   color: "#D946EF", label: "Design" },
  post:    { Icon: AtSign,    color: "#F97316", label: "Post" },
  article: { Icon: FileText,  color: "#60A5FA", label: "Artigo" },
  report:  { Icon: BarChart3, color: "#34D399", label: "Relatório" },
  plan:    { Icon: Table2,    color: "#FBBF24", label: "Plano" },
  email:   { Icon: Mail,      color: "#F87171", label: "E-mail" },
  ad:      { Icon: Layout,    color: "#FB923C", label: "Anúncio" },
};
const OUTPUT_STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  rascunho: { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.06)", label: "Rascunho" },
  revisão:  { color: "#FBBF24",               bg: "rgba(251,191,36,0.1)",   label: "Em revisão" },
  aprovado: { color: "#60A5FA",               bg: "rgba(96,165,250,0.1)",   label: "Aprovado" },
  publicado:{ color: "#34D399",               bg: "rgba(52,211,153,0.1)",   label: "Publicado" },
};

const MOCK_TASKS_BY_CLIENT: Record<string, typeof MOCK_TASKS_TEMPLATE> = {};
const MOCK_TASKS_TEMPLATE: { id: string; text: string; priority: string; done: boolean; due: string }[] = [];

// ── Mock site pages per client ─────────────────────────────────
const SITE_PAGES: Record<string, { page: string; url: string; lastEdit: string; status: "publicado" | "rascunho" | "editando"; changes: number }[]> = {
  "grupo-licita": [
    { page: "Home", url: "/", lastEdit: "há 2 dias", status: "publicado", changes: 3 },
    { page: "Serviços", url: "/servicos", lastEdit: "há 1h", status: "editando", changes: 5 },
    { page: "Blog — Nova Lei 14.133", url: "/blog/nova-lei", lastEdit: "há 3h", status: "publicado", changes: 12 },
    { page: "Contato", url: "/contato", lastEdit: "há 1 sem", status: "publicado", changes: 1 },
    { page: "Quem Somos", url: "/sobre", lastEdit: "há 2 sem", status: "rascunho", changes: 0 },
  ],
  "abcer": [],
  "gnx": [
    { page: "Home", url: "/", lastEdit: "ontem", status: "publicado", changes: 7 },
    { page: "Landing Page — Leads", url: "/automacao", lastEdit: "há 3h", status: "editando", changes: 9 },
    { page: "Blog — Automação PMEs", url: "/blog/automacao", lastEdit: "há 1 dia", status: "publicado", changes: 11 },
    { page: "Casos de Uso", url: "/casos", lastEdit: "há 4 dias", status: "rascunho", changes: 0 },
    { page: "Contato & Demo", url: "/contato", lastEdit: "há 1 sem", status: "publicado", changes: 2 },
  ],
};

// ── Mock revised files per client ──────────────────────────────
const REVISED_FILES: Record<string, { id: string; name: string; type: string; errors: number; fixed: number; diffs: { before: string; after: string; type: "typo" | "structure" | "style" }[] }[]> = {
  "grupo-licita": [
    {
      id: "rf1", name: "Artigo LinkedIn — Nova Lei de Licitações", type: "Artigo", errors: 4, fixed: 4,
      diffs: [
        { before: "de acordo com a lei 14.133", after: "de acordo com a Lei 14.133/21", type: "typo" },
        { before: "licitação publica", after: "licitação pública", type: "typo" },
        { before: "O processo licitatório ele é obrigatório", after: "O processo licitatório é obrigatório", type: "structure" },
        { before: "resultados que são muito mais eficientes", after: "resultados muito mais eficientes", type: "style" },
      ],
    },
    {
      id: "rf2", name: "Copy Anúncio LinkedIn Ads — Versão B", type: "Anúncio", errors: 2, fixed: 2,
      diffs: [
        { before: "Aprenda como ganhar licitações!", after: "Aprenda a ganhar licitações.", type: "style" },
        { before: "nossa consultoria especializada em licitações publicas", after: "nossa consultoria especializada em licitações públicas", type: "typo" },
      ],
    },
    {
      id: "rf3", name: "Legenda Instagram — Post Autoridade", type: "Legenda", errors: 1, fixed: 1,
      diffs: [
        { before: "Você sabe quais são os erros mais comuns que as empresas cometem?", after: "Você sabe quais erros as empresas mais cometem?", type: "style" },
      ],
    },
  ],
  "abcer": [],
  "gnx": [
    {
      id: "rf1", name: "Artigo 1 — Automação para PMEs", type: "Artigo", errors: 5, fixed: 5,
      diffs: [
        { before: "a performance da sua empresa", after: "o desempenho da sua empresa", type: "style" },
        { before: "o ROI positivo", after: "o retorno sobre investimento positivo", type: "style" },
        { before: "Empresas que não se adaptam ao mercado ficam para traz", after: "Empresas que não se adaptam ficam para trás", type: "typo" },
        { before: "Nós podemos te ajudar a", after: "Podemos ajudá-lo a", type: "structure" },
        { before: "Isso é um processo que", after: "Esse é um processo que", type: "typo" },
      ],
    },
    {
      id: "rf2", name: "Landing Page — CTA e Headlines", type: "Página Web", errors: 3, fixed: 3,
      diffs: [
        { before: "Transforme seu negocio hoje", after: "Transforme seu negócio hoje", type: "typo" },
        { before: "Agende uma call gratuita", after: "Agende uma conversa gratuita", type: "style" },
        { before: "Mais de 50+ empresas confiam na GNX", after: "Mais de 50 empresas confiam na GNX", type: "style" },
      ],
    },
  ],
};

const reachData = [
  { name: "Sem 1", valor: 8200 }, { name: "Sem 2", valor: 11400 },
  { name: "Sem 3", valor: 9800 }, { name: "Sem 4", valor: 14600 },
];

const INTEGRATIONS_BASE = [
  {
    id: "instagram", name: "Instagram", description: "Posts, Stories, Reels e métricas",
    Icon: Instagram, color: "#E1306C", bg: "rgba(225,48,108,0.1)", border: "rgba(225,48,108,0.2)",
    connected: false, account: null, followers: null,
    features: ["Publicar posts e stories", "Agendar conteúdo", "Métricas de alcance", "Responder comentários"],
    configFields: [{ key: "page_id", label: "Page ID" }, { key: "token", label: "Access Token", type: "password" }],
  },
  {
    id: "facebook", name: "Facebook", description: "Página, Grupos e Facebook Ads",
    Icon: Facebook, color: "#1877F2", bg: "rgba(24,119,242,0.1)", border: "rgba(24,119,242,0.2)",
    connected: false, account: null, followers: null,
    features: ["Publicar na Página", "Gerenciar Facebook Ads", "Métricas da Página", "Responder mensagens"],
    configFields: [{ key: "ad_account_id", label: "Ad Account ID" }, { key: "token", label: "Access Token", type: "password" }],
  },
  {
    id: "linkedin", name: "LinkedIn", description: "Página empresarial e conteúdo B2B",
    Icon: Linkedin, color: "#0A66C2", bg: "rgba(10,102,194,0.1)", border: "rgba(10,102,194,0.2)",
    connected: false, account: null, followers: null,
    features: ["Publicar na Página", "Artigos e newsletters", "Métricas de engajamento", "Geração de leads B2B"],
    configFields: [{ key: "page_id", label: "Page ID" }, { key: "token", label: "Access Token", type: "password" }],
  },
  {
    id: "whatsapp", name: "WhatsApp Business", description: "Mensagens, automações e atendimento",
    Icon: MessageCircle, color: "#25D366", bg: "rgba(37,211,102,0.1)", border: "rgba(37,211,102,0.2)",
    connected: false, account: null, followers: null,
    features: ["Enviar mensagens em massa", "Chatbot de atendimento", "Templates aprovados", "Relatório de entrega"],
    configFields: [],
  },
];

// ── All-platform connectors (full list for workspace) ────────
const CONNECTOR_DEFS = [
  { name: "WhatsApp Business", category: "Mensageria", description: "Meta Business API para envio e recebimento de mensagens", icon: "💬", configFields: [{ key: "phone_id", label: "Phone Number ID" }, { key: "token", label: "Access Token", type: "password" }] },
  { name: "Google Calendar", category: "Produtividade", description: "Sincronize agendamentos e reuniões automaticamente", icon: "📅", configFields: [{ key: "calendar_id", label: "Calendar ID" }] },
  { name: "Stripe", category: "Pagamentos", description: "Cobranças, assinaturas e gestão de pagamentos", icon: "💳", configFields: [{ key: "api_key", label: "API Key", type: "password" }, { key: "webhook_secret", label: "Webhook Secret", type: "password" }] },
  { name: "Google Ads", category: "Ads", description: "Importe dados de campanhas e conversões", icon: "📊", configFields: [{ key: "customer_id", label: "Customer ID" }] },
  { name: "Facebook Ads", category: "Ads", description: "Relatórios de performance e conversões", icon: "📈", configFields: [{ key: "ad_account_id", label: "Ad Account ID" }, { key: "token", label: "Access Token", type: "password" }] },
  { name: "Mailgun", category: "E-mail", description: "Envio transacional com alta entregabilidade", icon: "📧", configFields: [{ key: "domain", label: "Domain" }, { key: "api_key", label: "API Key", type: "password" }] },
  { name: "Twilio", category: "Voz & SMS", description: "Chamadas, SMS e verificação por telefone", icon: "📞", configFields: [{ key: "account_sid", label: "Account SID" }, { key: "auth_token", label: "Auth Token", type: "password" }] },
  { name: "Zoom", category: "Produtividade", description: "Criação automática de reuniões e links", icon: "🎥", configFields: [{ key: "client_id", label: "Client ID" }, { key: "client_secret", label: "Client Secret", type: "password" }] },
  { name: "Zapier", category: "Automação", description: "Conecte com +5000 apps via workflows", icon: "⚡", configFields: [{ key: "webhook_url", label: "Webhook URL" }] },
  { name: "Make (Integromat)", category: "Automação", description: "Automações visuais avançadas entre plataformas", icon: "🔄", configFields: [{ key: "webhook_url", label: "Webhook URL" }] },
  { name: "PayPal", category: "Pagamentos", description: "Pagamentos internacionais e checkout", icon: "💰", configFields: [{ key: "client_id", label: "Client ID" }, { key: "secret", label: "Secret", type: "password" }] },
  { name: "Mercado Pago", category: "Pagamentos", description: "Pagamentos e cobranças no Brasil e LATAM", icon: "🇧🇷", configFields: [{ key: "access_token", label: "Access Token", type: "password" }] },
  { name: "HubSpot", category: "CRM", description: "Sincronize contatos e deals bi-direcionalmente", icon: "🔶", configFields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { name: "Slack", category: "Produtividade", description: "Notificações e alertas em canais de equipe", icon: "💬", configFields: [{ key: "webhook_url", label: "Webhook URL" }, { key: "channel", label: "Channel" }] },
  { name: "Google Business Profile", category: "Reputação", description: "Monitore e responda reviews automaticamente com IA", icon: "⭐", configFields: [{ key: "location_id", label: "Location ID" }] },
  { name: "Outlook Calendar", category: "Produtividade", description: "Sincronize com calendário Microsoft", icon: "📆", configFields: [{ key: "tenant_id", label: "Tenant ID" }] },
  { name: "Pagar.me", category: "Pagamentos", description: "Gateway de pagamentos brasileiro", icon: "💵", configFields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { name: "SendGrid", category: "E-mail", description: "E-mail marketing e transacional em escala", icon: "✉️", configFields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { name: "n8n", category: "Automação", description: "Workflows de automação self-hosted", icon: "🔧", configFields: [{ key: "base_url", label: "Instance URL" }, { key: "api_key", label: "API Key", type: "password" }] },
  { name: "Calendly", category: "Produtividade", description: "Links de agendamento profissional", icon: "🗓️", configFields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { name: "Google Analytics", category: "Analytics", description: "Tráfego e conversões do seu site", icon: "📉", configFields: [{ key: "measurement_id", label: "Measurement ID" }] },
  { name: "Facebook Messenger", category: "Mensageria", description: "Inbox e automações via Messenger", icon: "💬", configFields: [{ key: "page_id", label: "Page ID" }, { key: "token", label: "Access Token", type: "password" }] },
  { name: "Salesforce", category: "CRM", description: "Integração bidirecional com Salesforce CRM", icon: "☁️", configFields: [{ key: "instance_url", label: "Instance URL" }, { key: "token", label: "Access Token", type: "password" }] },
];
const CONNECTOR_CATEGORIES = ["Todos", "Mensageria", "Pagamentos", "Ads", "Produtividade", "E-mail", "Automação", "CRM", "Reputação", "Analytics", "Voz & SMS"];

type AgentMsg = {
  id: string;
  from: string;
  to: string;
  content: string;
  action?: string;
  imageUrl?: string;
  imageParams?: { aspectRatio?: string };
  timestamp: string;
  status: "sent" | "processing" | "done" | "error";
};

const AGENT_META: Record<string, { initial: string; color: string; name: string }> = {
  aria:      { initial: "Lu", color: "#B9FF4B", name: "Luna" },
  luana:     { initial: "Lu", color: "#B9FF4B", name: "Luna" },
  beatriz:   { initial: "B", color: "#A78BFA", name: "Beatriz" },
  marcela:   { initial: "M", color: "#D946EF", name: "Marcela" },
  rafaela:   { initial: "R", color: "#F97316", name: "Rafaela" },
  lucas:     { initial: "L", color: "#34D399", name: "Lucas" },
  marina:    { initial: "M", color: "#60A5FA", name: "Marina" },
  carolina:  { initial: "Q", color: "#FBBF24", name: "Queila" },
  queila:    { initial: "Q", color: "#FBBF24", name: "Queila" },
  aira:      { initial: "A", color: "#FB7185", name: "Aira" },
  valentina: { initial: "V", color: "#E879F9", name: "Valentina" },
  lia:       { initial: "L", color: "#38BDF8", name: "Lia" },
  user:      { initial: "U", color: "#94A3B8", name: "Você" },
  // Aliases por ID do time (orquestração sequencial)
  strategist: { initial: "Q", color: "#FBBF24", name: "Queila" },
  copywriter: { initial: "B", color: "#A78BFA", name: "Beatriz" },
  traffic:    { initial: "R", color: "#F97316", name: "Rafaela" },
  analyst:    { initial: "L", color: "#34D399", name: "Lucas" },
  social:     { initial: "M", color: "#60A5FA", name: "Marina" },
  site:       { initial: "V", color: "#E879F9", name: "Valentina" },
  designer:   { initial: "M", color: "#D946EF", name: "Marcela" },
  secretary:  { initial: "A", color: "#FB7185", name: "Aira" },
  sales:      { initial: "E", color: "#F59E0B", name: "Eduardo" },
  briefing:   { initial: "L", color: "#38BDF8", name: "Lia" },
  revisor:    { initial: "V", color: "#EC4899", name: "Vitória" },
  video:      { initial: "🎬", color: "#B9FF4B", name: "Bobby" },
  eduardo:    { initial: "E", color: "#F59E0B", name: "Eduardo" },
  vitoria:    { initial: "V", color: "#EC4899", name: "Vitória" },
  bobby:      { initial: "🎬", color: "#B9FF4B", name: "Bobby" },
  pedro:      { initial: "P", color: "#2DD4BF", name: "Pedro" },
  calendario: { initial: "P", color: "#2DD4BF", name: "Pedro" },
  laura:      { initial: "La", color: "#B9FF4B", name: "Laura" },
};

const normalizeImageAspectRatio = (ratio?: string) => {
  const supported = new Set(["1:1", "9:16", "16:9", "4:3", "3:4"]);
  if (!ratio || ratio === "4:5") return "3:4";
  return supported.has(ratio) ? ratio : "3:4";
};

function parseBeatrizCopy(text: string): { headline: string; body: string; cta: string } {
  const clean = text.replace(/\*\*/g, "").replace(/^#+\s*/gm, "");

  // Try explicit CTA patterns
  const ctaMatch = clean.match(/(?:CTA|Call to Action|Chamada)[:\s]+(.{5,60})(?:\n|$)/i)
    ?? clean.match(/(?:➡️|👉|🔗|→)\s*(.{5,60})(?:\n|$)/);
  const cta = ctaMatch?.[1]?.trim().slice(0, 60) ?? "Saiba mais →";

  // Try explicit headline patterns
  const headlineMatch = clean.match(/(?:título|headline|manchete|h1|cabeçalho)[:\s]+(.{10,100})(?:\n|$)/i)
    ?? clean.match(/^(.{15,100})(?:\n)/);

  let headline = headlineMatch?.[1]?.trim().slice(0, 100) ?? "";
  let body = "";

  if (headline) {
    body = clean
      .replace(headlineMatch![0], "")
      .replace(ctaMatch?.[0] ?? "", "")
      .replace(/(?:CTA|legenda|copy|texto)[:\s]+/gi, "")
      .trim()
      .slice(0, 280);
  } else {
    // Fallback: first non-empty line = headline, rest = body
    const lines = clean.split("\n").map(l => l.trim()).filter(Boolean);
    headline = lines[0]?.slice(0, 100) ?? "Post da campanha";
    body = lines.slice(1, 4).join(" ").slice(0, 280);
  }

  return { headline, body, cta };
}

const DESIGN_FORMATS = [
  { ratio: "1:1",  label: "Feed",     hint: "Instagram · LinkedIn" },
  { ratio: "9:16", label: "Stories",  hint: "Reels · TikTok · Stories" },
  { ratio: "16:9", label: "Banner",   hint: "YouTube · Capa · Ads" },
  { ratio: "4:3",  label: "Slide",    hint: "Apresentação · TV" },
  { ratio: "3:4",  label: "Retrato",  hint: "Pinterest · Print" },
] as const;

const VIDEO_FORMATS = [
  { id: "youtube",   label: "YouTube",    ratio: "16:9", res: "1920×1080", icon: "▶"  },
  { id: "reels",     label: "Reels",      ratio: "9:16", res: "1080×1920", icon: "📱" },
  { id: "tiktok",    label: "TikTok",     ratio: "9:16", res: "1080×1920", icon: "♪"  },
  { id: "feed",      label: "Feed",       ratio: "1:1",  res: "1080×1080", icon: "⬛" },
  { id: "stories",   label: "Stories",    ratio: "9:16", res: "1080×1920", icon: "◻"  },
  { id: "linkedin",  label: "LinkedIn",   ratio: "16:9", res: "1280×720",  icon: "in" },
  { id: "twitter",   label: "Twitter/X",  ratio: "16:9", res: "1280×720",  icon: "𝕏"  },
] as const;

// ── Component ─────────────────────────────────────────────────
export default function ClientWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "";
  const { user } = useAuth();
  const { setPageContext, clearPageContext } = usePageContext();
  const [openingPortal, setOpeningPortal] = useState(false);
  const [siteDbPages, setSiteDbPages] = useState<any[]>([]);
  const [siteDbPagesLoading, setSiteDbPagesLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePortalToken, setSharePortalToken] = useState<string | null>(null);
  const [sharePasswordInput, setSharePasswordInput] = useState("");
  const [showSharePwd, setShowSharePwd] = useState(false);
  const [savingSharePassword, setSavingSharePassword] = useState(false);
  const [sharePasswordSaved, setSharePasswordSaved] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareCopiedWithPwd, setShareCopiedWithPwd] = useState(false);
  const [openingShare, setOpeningShare] = useState(false);
  const [tasks, setTasks] = useState(MOCK_TASKS_TEMPLATE);
  const [crmView, setCrmView] = useState<"contacts" | "pipeline" | "approvals" | "insights" | "whatsapp" | "deliverables" | "calendar">("contacts");
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [delivLoading, setDelivLoading] = useState(false);
  const [delivForm, setDelivForm] = useState({ title: "", category: "", description: "", done_at: new Date().toISOString().slice(0, 10), visible_to_client: true, status: "completed" as "completed" | "in_progress" });
  const [savingDeliv, setSavingDeliv] = useState(false);
  const [portalClientUUID, setPortalClientUUID] = useState<string | null>(null);
  const [portalOnboarding, setPortalOnboarding] = useState<any[]>([]);
  const [portalDemands, setPortalDemands] = useState<any[]>([]);
  const [portalLoading, setPortalLoading] = useState(false);
  const [onboardForm, setOnboardForm] = useState({ title: "", description: "", responsible: "agency" as "agency" | "client", category: "geral" });
  const [demandForm, setDemandForm] = useState({ title: "", description: "", responsible: "agency" as "agency" | "client", priority: "medium" as "low" | "medium" | "high", due_date: "", agent: "luna" });
  const [savingOnboard, setSavingOnboard] = useState(false);
  const [savingDemand, setSavingDemand] = useState(false);
  const [generatingDemands, setGeneratingDemands] = useState(false);
  const [editingDemand, setEditingDemand] = useState<{ id: string; field: "title" | "description"; value: string } | null>(null);
  const [portalSection, setPortalSection] = useState<"onboarding" | "entregas" | "demandas">("onboarding");
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [agentForm, setAgentForm] = useState({ agent_id: "luna", agent_name: "Luna", agent_color: "#B9FF4B", titulo: "", descricao: "" });
  const [savingAgent, setSavingAgent] = useState(false);
  const [showDelivForm, setShowDelivForm] = useState(false);
  const [showOnboardForm, setShowOnboardForm] = useState(false);
  const [showDemandFormPortal, setShowDemandFormPortal] = useState(false);
  const [expandedWorkspaceDemand, setExpandedWorkspaceDemand] = useState<string | null>(null);
  const [activityInputs, setActivityInputs] = useState<Record<string, string>>({});
  const [savingActivity, setSavingActivity] = useState<string | null>(null);
  const [demandActivities, setDemandActivities] = useState<Record<string, any[]>>({});
  const [answeringOnboard, setAnsweringOnboard] = useState<string | null>(null);
  const [answeringAll, setAnsweringAll] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  // ── Agentes Autônomos ─────────────────────────────────────────
  const [salesAgents, setSalesAgents] = useState<any[]>([]);
  const [salesAgentsLoading, setSalesAgentsLoading] = useState(false);
  const [showSalesAgentForm, setShowSalesAgentForm] = useState(false);
  const [salesAgentForm, setSalesAgentForm] = useState({
    name: "", avatar_color: "#B9FF4B",
    product_name: "", product_description: "", product_price: "", product_url: "",
    persona: "", zapi_instance: "", zapi_token: "", zapi_client_token: "",
  });
  const [savingSalesAgent, setSavingSalesAgent] = useState(false);
  const [salesAgentConvs, setSalesAgentConvs] = useState<Record<string, any[]>>({});
  const [activeConvAgent, setActiveConvAgent] = useState<string | null>(null);
  const [aiPortalLoading, setAiPortalLoading] = useState(false);
  const [aiPortalSuggestions, setAiPortalSuggestions] = useState<{
    onboarding: { title: string; category: string; responsible: "agency" | "client" }[];
    entregas: { description: string; category: string }[];
    propostas: { titulo: string; agent_id: string; agent_name: string; agent_color: string; descricao: string }[];
    demandas: { title: string; responsible: "agency" | "client"; priority: "low" | "medium" | "high" }[];
  } | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [activeSegment, setActiveSegment] = useState<string>("Todos");
  const [dbContacts, setDbContacts] = useState<any[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [activeContact, setActiveContact] = useState<any | null>(null);
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContactForm, setNewContactForm] = useState({ name: "", email: "", phone: "", company: "", channel: "", status: "Novo" });
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [agentProposals, setAgentProposals] = useState<any[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [approvingProposalId, setApprovingProposalId] = useState<string | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftAgent, setDraftAgent] = useState<any>(null);
  const [draftForm, setDraftForm] = useState({ platforms: [] as string[], tone: "profissional e envolvente", topic: "" });
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [agentCommand, setAgentCommand] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFileUrl, setAttachedFileUrl] = useState<string | null>(null);
  const [attachedFileText, setAttachedFileText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [viewingAgentId, setViewingAgentId] = useState<string | null>(null);
  const [agentInstruction, setAgentInstruction] = useState("");
  const [agentFile, setAgentFile] = useState<File | null>(null);
  const [agentFileUrl, setAgentFileUrl] = useState<string | null>(null);
  const [agentFileText, setAgentFileText] = useState<string | null>(null);
  const agentFileRef = useRef<HTMLInputElement>(null);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [expandedOutput, setExpandedOutput] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  // Per-client ZApi credentials
  const [wpCreds, setWpCreds] = useState<{ zapi_instance: string; zapi_token: string; zapi_client_token: string } | null>(null);
  const [wpCredsForm, setWpCredsForm] = useState({ zapi_instance: "", zapi_token: "", zapi_client_token: "" });
  const [wpCredsOpen, setWpCredsOpen] = useState(false);
  const [wpCredsSaving, setWpCredsSaving] = useState(false);
  const [wpStatus, setWpStatus] = useState<"idle" | "loading" | "connected" | "disconnected">("idle");
  const [wpPhone, setWpPhone] = useState<string | null>(null);
  const [wpQr, setWpQr] = useState<string | null>(null);
  const [wpGroups, setWpGroups] = useState<{ id: string; name: string; participants: number }[]>([]);
  const [wpSelectedGroups, setWpSelectedGroups] = useState<string[]>([]);
  const [wpSelectedContacts, setWpSelectedContacts] = useState<string[]>([]);
  const [wpMessage, setWpMessage] = useState("");
  const [wpCaption, setWpCaption] = useState("");
  const [wpMediaType, setWpMediaType] = useState<"text" | "image" | "video" | "audio">("text");
  const [wpMediaData, setWpMediaData] = useState<string | null>(null);
  const [wpMediaName, setWpMediaName] = useState("");
  const [wpTargetTab, setWpTargetTab] = useState<"grupos" | "contatos">("grupos");
  const [wpBlasting, setWpBlasting] = useState(false);
  const [wpBlastResult, setWpBlastResult] = useState<string | null>(null);
  const [wpAiGenerating, setWpAiGenerating] = useState(false);
  const [wpAiPrompt, setWpAiPrompt] = useState("");
  // Agente autônomo WhatsApp
  const [wpFavoriteGroupIds, setWpFavoriteGroupIds] = useState<string[]>([]);
  const [agentSendPrompt, setAgentSendPrompt] = useState("");
  const [agentSending, setAgentSending] = useState(false);
  const [agentSendResult, setAgentSendResult] = useState<{ message: string; ok: number; total: number; status: string } | null>(null);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  // Email blast por contato
  const [emailBlastContact, setEmailBlastContact] = useState<any>(null);
  const [emailBlastSubject, setEmailBlastSubject] = useState("");
  const [emailBlastBody, setEmailBlastBody] = useState("");
  const [emailBlastPrompt, setEmailBlastPrompt] = useState("");
  const [emailBlasting, setEmailBlasting] = useState(false);
  // WordPress credentials per client (for Tomás LP publishing)
  const [clientWpCreds, setClientWpCreds] = useState({ wp_url: "", wp_user: "", wp_password: "" });
  const [clientWpCredsSaving, setClientWpCredsSaving] = useState(false);
  const [clientWpCredsLoaded, setClientWpCredsLoaded] = useState(false);

  // Agent channel config per client
  const [agentChannelConfig, setAgentChannelConfig] = useState({
    whatsapp: { active: true, system_prompt: "" },
    instagram: { active: true, system_prompt: "" },
    facebook: { active: false, system_prompt: "" },
  });
  const [agentConfigSaving, setAgentConfigSaving] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  const [agentLogsLoading, setAgentLogsLoading] = useState(false);
  const [socialAccountsMap, setSocialAccountsMap] = useState({});
  // Real courses from DB
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [dbEnrollments, setDbEnrollments] = useState<Record<string, any[]>>({});
  const [dbCrmGroups, setDbCrmGroups] = useState<any[]>([]);
  const [dbGroupMembers, setDbGroupMembers] = useState<Record<string, any[]>>({});
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourseForm, setNewCourseForm] = useState({ title: "", description: "", level: "Básico" });
  const [savingCourse, setSavingCourse] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState<string | null>(null);
  const [newStudentForm, setNewStudentForm] = useState({ student_name: "", student_email: "", student_phone: "" });
  const [addingStudent, setAddingStudent] = useState(false);
  // Certificate emission
  const [certCourseId, setCertCourseId] = useState<string | null>(null);
  const [certTemplate, setCertTemplate] = useState<string | null>(null);
  const [certStudentName, setCertStudentName] = useState("");
  const [certNameX, setCertNameX] = useState(50);
  const [certNameY, setCertNameY] = useState(65);
  const [certFontSize, setCertFontSize] = useState(60);
  const [certFontColor, setCertFontColor] = useState("#1a1a1a");
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [certGenerating, setCertGenerating] = useState(false);
  const [generatedCerts, setGeneratedCerts] = useState<{ name: string; dataUrl: string }[]>([]);
  const [certManualName, setCertManualName] = useState("");
  const [certManualList, setCertManualList] = useState<string[]>([]);
  // Course attendance
  const [dbAttendance, setDbAttendance] = useState<Record<string, any[]>>({});
  const [attendanceCourseId, setAttendanceCourseId] = useState<string | null>(null);
  // Course checklists
  const [dbChecklists, setDbChecklists] = useState<Record<string, any[]>>({});
  const [checklistGenerating, setChecklistGenerating] = useState<string | null>(null); // `${courseId}_${phase}`
  const [showAddChecklistItem, setShowAddChecklistItem] = useState<string | null>(null); // `${courseId}_${phase}`
  const [newChecklistItem, setNewChecklistItem] = useState({ title: "", description: "", responsible: "agency" });
  const [savingChecklistItem, setSavingChecklistItem] = useState(false);
  const [selectedChecklistPhase, setSelectedChecklistPhase] = useState<Record<string, string>>({});
  const [generatedImages, setGeneratedImages] = useState<Array<{id: string, imageData: string, mimeType: string, prompt: string, createdAt: string}>>([]);
  const [marcelaLoading, setMarcelaLoading] = useState(false);
  const [marcelaError, setMarcelaError] = useState<string | null>(null);
  const [designAspectRatio, setDesignAspectRatio] = useState<"1:1" | "9:16" | "16:9" | "4:3" | "3:4">("1:1");
  const [videoPlatform, setVideoPlatform] = useState<string>("reels");
  const [videoScript, setVideoScript] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  // AIRA — ouvir reunião (captura no browser, transcreve via IA, envia WhatsApp)
  type AiraPerson = { name: string; phone: string };
  const [airaStatus, setAiraStatus] = useState<"idle" | "recording" | "paused" | "loading" | "done">("idle");
  const [airaSummary, setAiraSummary] = useState<string | null>(null);
  const [airaError, setAiraError] = useState<string | null>(null);
  const [airaElapsed, setAiraElapsed] = useState(0);
  const [airaShowSetup, setAiraShowSetup] = useState(false);
  const [airaMeetingTitle, setAiraMeetingTitle] = useState("");
  const [airaParticipants, setAiraParticipants] = useState<AiraPerson[]>(() => {
    try { return JSON.parse(localStorage.getItem(`aira-participants-${id}`) || "[]"); } catch { return []; }
  });
  const [airaSelectedGroups, setAiraSelectedGroups] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(`aira-groups-${id}`) || "[]"); } catch { return []; }
  });
  const [airaLoadingGroups, setAiraLoadingGroups] = useState(false);
  const [airaOnlyLuana, setAiraOnlyLuana] = useState(false);
  const [airaLiveText, setAiraLiveText] = useState("");
  const [airaShowShare, setAiraShowShare] = useState(false);
  const [airaSharePhone, setAiraSharePhone] = useState("");
  const [airaShareSending, setAiraShareSending] = useState(false);
  const [airaShareResult, setAiraShareResult] = useState<string | null>(null);
  // ── Social integrations per client ─────────────────────────
  const [socialConnected, setSocialConnected] = useState<Record<string, boolean>>({});
  const [socialConfigModal, setSocialConfigModal] = useState<string | null>(null);
  const [socialConfigValues, setSocialConfigValues] = useState<Record<string, string>>({});
  const [socialConfigSaving, setSocialConfigSaving] = useState(false);
  const [connectorSearch, setConnectorSearch] = useState("");
  const [connectorCategory, setConnectorCategory] = useState("Todos");
  const [airaSource, setAiraSource] = useState<"system" | "mic" | "both">(() => {
    const v = localStorage.getItem(`aira-source-${id}`);
    return (v === "mic" || v === "both" || v === "system") ? v : "mic";
  });
  const airaSaveSource = (s: "system" | "mic" | "both") => { setAiraSource(s); localStorage.setItem(`aira-source-${id}`, s); };
  const airaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const airaRecorderRef = useRef<MediaRecorder | null>(null);
  const airaChunksRef = useRef<Blob[]>([]);
  const airaStreamRef = useRef<MediaStream | null>(null);
  // ── Visão Geral — dados reais ──────────────────────────────
  const [overviewPosts, setOverviewPosts] = useState<any[]>([]);
  const [overviewConnections, setOverviewConnections] = useState<any[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const airaSaveParticipants = (p: AiraPerson[]) => { setAiraParticipants(p); localStorage.setItem(`aira-participants-${id}`, JSON.stringify(p)); };
  const airaSaveGroups = (g: string[]) => { setAiraSelectedGroups(g); localStorage.setItem(`aira-groups-${id}`, JSON.stringify(g)); };

  const airaStartRecording = async () => {
    setAiraError(null);
    setAiraLiveText("");
    try {
      let stream: MediaStream;

      const captureSystem = async (): Promise<MediaStream> => {
        // Tenta loopback nativo (Stereo Mix / What U Hear) sem prompt de tela
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const loopback = devices.find(d =>
            d.kind === "audioinput" &&
            /stereo mix|mistura est|what you hear|loopback|wave out|output mix/i.test(d.label)
          );
          if (loopback) {
            const s = await navigator.mediaDevices.getUserMedia({
              audio: { deviceId: { exact: loopback.deviceId }, echoCancellation: false, noiseSuppression: false },
            });
            setAiraLiveText(`Capturando áudio do PC via: ${loopback.label}`);
            return s;
          }
        } catch {}
        // Fallback: compartilhamento de tela com áudio do sistema
        const display = await (navigator.mediaDevices as any).getDisplayMedia({
          video: { width: 1, height: 1, frameRate: 1 },
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        });
        display.getVideoTracks().forEach((t: MediaStreamTrack) => t.stop());
        const audioTracks = display.getAudioTracks();
        if (audioTracks.length === 0) {
          throw new Error("Nenhum áudio capturado. Ao compartilhar a tela, marque 'Compartilhar áudio do sistema' (no Chrome, escolha 'Aba' ou 'Tela inteira' e ative a caixinha de áudio).");
        }
        setAiraLiveText("Capturando áudio do PC via compartilhamento de tela...");
        return new MediaStream(audioTracks);
      };

      const captureMic = async (): Promise<MediaStream> => {
        const s = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        setAiraLiveText("Capturando microfone...");
        return s;
      };

      if (airaSource === "mic") {
        stream = await captureMic();
      } else if (airaSource === "system") {
        stream = await captureSystem();
      } else {
        // both: mistura áudio do sistema + microfone num único stream
        const sys = await captureSystem();
        const mic = await captureMic();
        const ctx = new AudioContext();
        const dest = ctx.createMediaStreamDestination();
        ctx.createMediaStreamSource(sys).connect(dest);
        ctx.createMediaStreamSource(mic).connect(dest);
        stream = dest.stream;
        // mantém referências para parar depois
        (stream as any)._extraTracks = [...sys.getTracks(), ...mic.getTracks()];
        setAiraLiveText("Capturando áudio do PC + microfone...");
      }

      airaStreamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      airaChunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) airaChunksRef.current.push(e.data); };
      rec.start(1000);
      airaRecorderRef.current = rec;
      setAiraStatus("recording");
      setAiraElapsed(0);
      airaTimerRef.current = setInterval(() => setAiraElapsed(s => s + 1), 1000);
    } catch (e: any) {
      const msg = e?.name === "NotAllowedError" || e?.name === "AbortError"
        ? "Acesso negado ou cancelado. Permita o acesso ao áudio e tente novamente."
        : "Erro ao capturar áudio: " + (e?.message || e);
      setAiraError(msg);
      setAiraStatus("idle");
    }
  };

  const airaStopStream = (): Promise<Blob> => new Promise((resolve) => {
    if (airaTimerRef.current) clearInterval(airaTimerRef.current);
    const rec = airaRecorderRef.current;
    const stopAll = () => {
      airaStreamRef.current?.getTracks().forEach(t => t.stop());
      const extra = (airaStreamRef.current as any)?._extraTracks as MediaStreamTrack[] | undefined;
      extra?.forEach(t => { try { t.stop(); } catch {} });
    };
    if (!rec || rec.state === "inactive") {
      stopAll();
      return resolve(new Blob(airaChunksRef.current));
    }
    rec.onstop = () => {
      stopAll();
      resolve(new Blob(airaChunksRef.current, { type: rec.mimeType }));
    };
    rec.stop();
  });

  const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => { const s = r.result as string; resolve(s.split(",")[1] || ""); };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

  const airaFinalize = async () => {
    setAiraStatus("loading");
    setAiraLiveText("Salvando áudio...");
    try {
      const blob = await airaStopStream();
      if (blob.size < 1000) {
        setAiraError("Gravação muito curta ou sem áudio detectado.");
        setAiraStatus("idle");
        return;
      }

      const audioPath = `aira/${Date.now()}.webm`;
      let audioBase64: string | null = null;
      let audioUrl: string | null = null;
      if (blob.size <= 8 * 1024 * 1024) {
        audioBase64 = await blobToBase64(blob);
      } else {
        const { error: uploadError } = await supabase.storage
          .from("aira-recordings")
          .upload(audioPath, blob, { contentType: blob.type || "audio/webm" });
        if (uploadError) throw new Error("Erro ao salvar áudio: " + uploadError.message);
        const { data: signedAudio, error: signedAudioError } = await supabase.storage
          .from("aira-recordings")
          .createSignedUrl(audioPath, 60 * 10);
        if (signedAudioError || !signedAudio?.signedUrl) {
          throw new Error("Erro ao preparar áudio: " + (signedAudioError?.message || "URL indisponível"));
        }
        audioUrl = signedAudio.signedUrl;
      }

      setAiraLiveText("Transcrevendo e resumindo...");

      const { data, error } = await supabase.functions.invoke("aira-meeting", {
        body: {
          audioPath,
          audioUrl,
          audioBase64,
          audioMimeType: blob.type || "audio/webm",
          clientName: client?.name,
          meetingTitle: airaMeetingTitle || `Reuniao ${new Date().toLocaleString("pt-BR")}`,
          onlyLuana: airaOnlyLuana,
          groups: airaOnlyLuana ? [] : airaSelectedGroups,
          participants: airaOnlyLuana ? [] : airaParticipants.filter(p => p.phone),
        },
      });
      if (error) {
        let detail = (error as any)?.message || String(error);
        try {
          const body = await (error as any)?.context?.json?.();
          if (body?.error) detail = body.error;
        } catch {}
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      setAiraSummary(data?.summary || "Resumo nao disponivel.");
      setAiraStatus("done");
      setAiraLiveText("");
      if (audioUrl) supabase.storage.from("aira-recordings").remove([audioPath]).catch(() => {});
    } catch (e: any) {
      setAiraError("Erro ao processar a reuniao: " + (e?.message || e));
      setAiraStatus("idle");
      setAiraLiveText("");
    }
  };

  const airaShareNow = async () => {
    if (!airaSummary || !airaSharePhone.trim()) return;
    setAiraShareSending(true);
    setAiraShareResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("aira-meeting", {
        body: {
          summary: airaSummary,
          clientName: client?.name,
          groups: [],
          participants: [{ phone: airaSharePhone.trim() }],
        },
      });
      if (error) throw error;
      setAiraShareResult("Enviado com sucesso!");
      setAiraSharePhone("");
    } catch (e: any) {
      setAiraShareResult("Erro ao enviar: " + (e?.message || e));
    } finally {
      setAiraShareSending(false);
    }
  };

  const fmtTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const [videoFileUrl, setVideoFileUrl] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [designerTask, setDesignerTask] = useState<{prompt: string; progress: number; startedAt: number; estimatedSeconds: number} | null>(null);
  const [designerRecentWork, setDesignerRecentWork] = useState<string[]>([]);
  const designerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ariaLoading, setAriaLoading] = useState(false);
  const [showManualOutput, setShowManualOutput] = useState(false);
  const [manualForm, setManualForm] = useState<{
    name: string; type: GeneratedOutput["type"]; preview: string;
    status: GeneratedOutput["status"]; platform: string;
  }>({ name: "", type: "copy", preview: "", status: "revisão", platform: "" });
  const [agentConversations, setAgentConversations] = useState<AgentMsg[]>(() => {
    try { return JSON.parse(localStorage.getItem(`agent-conv-${id}`) ?? "[]"); } catch { return []; }
  });
  const [clientBriefing, setClientBriefing] = useState<Record<string, any> | null>(() => {
    try { const raw = localStorage.getItem(`client-briefing-${id}`); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [agentChats, setAgentChats] = useState<Record<string, {role:"user"|"assistant"; content:string}[]>>(() => {
    try { const raw = localStorage.getItem(`agent-chats-${id}`); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  });
  const [agentChatsLoaded, setAgentChatsLoaded] = useState(false);
  const [agentChatInput, setAgentChatInput] = useState("");
  const [agentChatLoading, setAgentChatLoading] = useState(false);
  const agentChatEndRef = useRef<HTMLDivElement>(null);
  const [agentOutputs, setAgentOutputs] = useState<Record<string, string>>({});
  const [agentDeadlines, setAgentDeadlines] = useState<Record<string, string>>({});
  // Onda de orquestração ARIA: 0 = ocioso; 1+ = onda ativa
  const [currentWave, setCurrentWave] = useState<number>(0);
  const [totalWaves, setTotalWaves] = useState<number>(0);
  const [agentWaves, setAgentWaves] = useState<Record<string, number>>({});
  const [isDiagnosticMode, setIsDiagnosticMode] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);
  const [expandedAgentOutput, setExpandedAgentOutput] = useState<string | null>(null);
  const [postCanvas, setPostCanvas] = useState<{ imageUrl: string; headline?: string; body?: string; cta?: string } | null>(null);
  const [showSiteInput, setShowSiteInput] = useState(false);
  const [showEditClient, setShowEditClient] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string; industry: string; status: "Ativo" | "Onboarding" | "Em pausa";
    revenue: string; nextAction: string; followersIg: string; followersFb: string; portalPin: string;
    siteUrl: string; siteRepo: string; teamInstructions: string;
  } | null>(null);
  const { clients, updateClient, deleteClient, clearClientData } = useClients();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const client = clients.find((c) => c.id === id);
  const [siteUrl, setSiteUrl] = useState(client?.siteUrl ?? "");

  // ── Pixel (WordPress agent) inline state ──────────────────────
  const [pixelMessages, setPixelMessages] = useState<{role:"user"|"assistant";content:string;toolCalls?:string[]}[]>([]);
  const [pixelInput, setPixelInput] = useState("");
  const [pixelLoading, setPixelLoading] = useState(false);
  const [pixelSite, setPixelSite] = useState<{id:string;name:string;url:string}|null>(null);

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-full text-white" style={{ background: "#080810" }}>
        Cliente não encontrado.{" "}
        <button onClick={() => navigate("/agency")} className="ml-2 underline">Voltar</button>
      </div>
    );
  }

  // Helper: invoke whatsapp edge function with per-client credentials
  const wpInvoke = (body: object) =>
    supabase.functions.invoke("whatsapp", { body: { ...wpCreds, ...body } });

  const openEditClient = () => {
    setEditForm({
      name: client.name,
      industry: client.industry,
      status: client.status,
      revenue: client.revenue,
      nextAction: client.nextAction,
      followersIg: client.followers.instagram,
      followersFb: client.followers.facebook,
      portalPin: client.portalPin,
      siteUrl: client.siteUrl ?? "",
      siteRepo: client.siteRepo ?? "",
      teamInstructions: client.teamInstructions ?? "",
    });
    setShowEditClient(true);
  };

  const checkWpStatus = async () => {
    setWpStatus("loading");
    setWpQr(null);
    try {
      const { data } = await wpInvoke({ action: "status" });
      if (data?.connected) {
        setWpStatus("connected");
        setWpPhone(data.phone ?? null);
        const { data: grps } = await wpInvoke({ action: "groups" });
        setWpGroups(Array.isArray(grps) ? grps : []);
      } else {
        setWpStatus("disconnected");
      }
    } catch {
      setWpStatus("disconnected");
    }
  };

  // ── Social integrations helpers ─────────────────────────────
  const invokeMgmt = async (action: string, method: "GET" | "POST" = "GET", body?: unknown) => {
    const projectId = import.meta.env.VITE_SUPABASE_URL?.replace("https://", "").replace(".supabase.co", "") || "";
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/manage-integrations`;
    const session = (await supabase.auth.getSession()).data.session;
    const res = await fetch(`${baseUrl}?action=${action}`, {
      method,
      headers: {
        "Authorization": `Bearer ${session?.access_token}`,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Request failed"); }
    return res.json();
  };

  const fetchSocialIntegrations = async () => {
    if (!id) return;
    try {
      const data: { connector_name: string; connected: boolean }[] = await invokeMgmt("list");
      const map: Record<string, boolean> = {};
      for (const row of data) {
        const prefix = `social_${id}_`;
        if (row.connector_name.startsWith(prefix)) {
          const platform = row.connector_name.replace(prefix, "");
          map[platform] = row.connected;
        }
      }
      setSocialConnected(map);
    } catch { /* silent */ }
  };

  const handleSocialToggle = async (platformId: string, connect: boolean) => {
    if (!id) return;
    const name = `social_${id}_${platformId}`;
    try {
      await invokeMgmt("toggle", "POST", { connector_name: name, connected: connect });
      setSocialConnected(prev => ({ ...prev, [platformId]: connect }));
      toast.success(connect ? `${platformId} conectado!` : `${platformId} desconectado`);
    } catch { toast.error("Erro ao atualizar integração"); }
  };

  const openSocialConfig = async (platformId: string) => {
    if (!id) return;
    const name = `social_${id}_${platformId}`;
    try {
      const data = await invokeMgmt(`get-config&connector=${encodeURIComponent(name)}`);
      setSocialConfigValues(data?.config || {});
    } catch { setSocialConfigValues({}); }
    setSocialConfigModal(platformId);
  };

  const saveSocialConfig = async () => {
    if (!socialConfigModal || !id) return;
    setSocialConfigSaving(true);
    const name = `social_${id}_${socialConfigModal}`;
    try {
      await invokeMgmt("save-config", "POST", {
        connector_name: name,
        config: socialConfigValues,
        connected: true,
        status: "active",
      });
      setSocialConnected(prev => ({ ...prev, [socialConfigModal]: true }));
      toast.success("Integração salva e conectada!");
      setSocialConfigModal(null);
    } catch { toast.error("Erro ao salvar configurações"); }
    setSocialConfigSaving(false);
  };

  const handleSaveClient = () => {
    if (!editForm || !id) return;
    updateClient(id, {
      name: editForm.name,
      industry: editForm.industry,
      status: editForm.status,
      revenue: editForm.revenue,
      nextAction: editForm.nextAction,
      followers: { instagram: editForm.followersIg, facebook: editForm.followersFb },
      portalPin: editForm.portalPin.trim(),
      siteUrl: editForm.siteUrl.trim() || undefined,
      siteRepo: editForm.siteRepo.trim() || undefined,
      teamInstructions: editForm.teamInstructions.trim() || undefined,
    });
    if (editForm.siteUrl.trim()) setSiteUrl(editForm.siteUrl.trim());
    setShowEditClient(false);
  };

  const addConvMsgs = (msgs: AgentMsg[]) => {
    setAgentConversations((prev) => {
      const updated = [...prev, ...msgs];
      localStorage.setItem(`agent-conv-${id}`, JSON.stringify(updated.slice(-100)));
      return updated;
    });
  };

  const updateConvMsg = (msgId: string, patch: Partial<AgentMsg>) => {
    setAgentConversations((prev) => {
      const updated = prev.map((m) => m.id === msgId ? { ...m, ...patch } : m);
      localStorage.setItem(`agent-conv-${id}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Build the briefing + memory context block injected into every agent call
  const buildBriefingBlock = (extra?: string) => {
    const b = clientBriefing;
    const lines: string[] = [];
    if (b) {
      lines.push("=== BRIEFING DO CLIENTE ===");
      if (b.empresa)         lines.push(`Empresa: ${b.empresa}`);
      if (b.segmento)        lines.push(`Segmento/Setor: ${b.segmento}`);
      if (b.tempoMercado)    lines.push(`Tempo de Mercado: ${b.tempoMercado}`);
      if (b.faturamento)     lines.push(`Faturamento: ${b.faturamento}`);
      if (b.produtos)        lines.push(`Produtos/Serviços: ${b.produtos}`);
      if (b.clienteIdeal)    lines.push(`Cliente Ideal: ${b.clienteIdeal}`);
      if (b.faixaEtaria)     lines.push(`Faixa Etária: ${b.faixaEtaria}`);
      if (b.canaisPublico?.length) lines.push(`Canais onde o público está: ${b.canaisPublico.join(", ")}`);
      if (b.dorPrincipal)    lines.push(`Principal Dor: ${b.dorPrincipal}`);
      if (b.diferencial)     lines.push(`Diferencial: ${b.diferencial}`);
      if (b.concorrentes)    lines.push(`Concorrentes: ${b.concorrentes}`);
      if (b.posicaoMercado)  lines.push(`Posição no Mercado: ${b.posicaoMercado}`);
      if (b.canaisAtivos?.length) lines.push(`Canais Ativos: ${b.canaisAtivos.join(", ")}`);
      if (b.frequencia)      lines.push(`Frequência de Posts: ${b.frequencia}`);
      if (b.trafegoPago)     lines.push(`Tráfego Pago: ${b.trafegoPago}`);
      if (b.budgetTrafego)   lines.push(`Budget Tráfego: ${b.budgetTrafego}`);
      if (b.budgetMarketing) lines.push(`Budget Marketing: ${b.budgetMarketing}`);
      if (b.meta90dias)      lines.push(`Meta 90 dias: ${b.meta90dias}`);
      if (b.prazoResultados) lines.push(`Prazo esperado de resultados: ${b.prazoResultados}`);
      if (b.jaTentou)        lines.push(`Já tentou antes: ${b.jaTentou}`);
      if (b.preocupacoes)    lines.push(`Preocupações: ${b.preocupacoes}`);
      // raw briefing text (from paste or client submission)
      try {
        const raw = localStorage.getItem(`client-briefing-raw-${id}`);
        if (raw) lines.push(`\nBRIEFING ORIGINAL:\n${raw.slice(0, 3000)}`);
      } catch {}
      // diagnosis excerpt
      try {
        const diag = localStorage.getItem(`client-briefing-diagnosis-${id}`);
        if (diag) lines.push(`\nDIAGNÓSTICO (resumo):\n${diag.slice(0, 2500)}`);
      } catch {}
    }
    if (extra) lines.push(extra);
    lines.push(`\n⚠️ REGRA — DADOS REAIS vs. INVENÇÃO: Você PODE e DEVE entregar estratégias completas, prazos estimados, benchmarks do setor e recomendações profissionais. O que é PROIBIDO é fingir que algo JÁ EXISTE quando não foi informado: não cite propostas no CRM, leads cadastrados, campanhas em andamento, seguidores atuais, resultados passados ou qualquer estado atual do cliente que não está no briefing. Use tempo futuro para o que será feito ("vamos criar", "será configurado") e tempo condicional para estimativas ("em média X dias", "espera-se Y%").`);
    return lines.length ? `\n\n${lines.join("\n")}` : "";
  };

  // Send a message directly to one specific agent (without ARIA orchestration)
  const handleSendToSingleAgent = async (agentId: string, instruction: string) => {
    if (!instruction.trim()) return;
    const agent = MARKETING_TEAM.find((a) => a.id === agentId);
    if (!agent) return;
    const ts = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    // User message
    addConvMsgs([{ id: `u-${Date.now()}`, from: "user", to: agentId, content: instruction, timestamp: ts(), status: "done" }]);
    // Typing indicator
    const typingId = `${agentId}-typing-${Date.now()}`;
    addConvMsgs([{ id: typingId, from: agentId, to: "user", content: "", action: "typing", timestamp: ts(), status: "processing" }]);
    setAriaLoading(true);
    try {
      const agCfg = AGENT_CONFIG[agentId] ?? { maxTokens: 5000, thinking: false };
      const isPostAgent = ["social", "copywriter"].includes(agentId);
      const { data: { session } } = await supabase.auth.getSession();
      const agentUserId = session?.user?.id ?? null;
      const segmentoSingle = clientBriefing?.segmento || client.industry;
      const ctxBase = `Cliente: ${client.name} | Segmento: ${segmentoSingle} | Cor: ${client.color}${client.teamInstructions ? `\nInstruções permanentes: ${client.teamInstructions}` : ""}`;
      const briefingBlock = buildBriefingBlock();
      const { data: agData, error: agErr } = await supabase.functions.invoke("chat-ai", {
        body: {
          systemPrompt: AGENT_PROMPTS[agentId] ?? `Você é ${agent.name}, ${agent.role} da Calu Agência.`,
          maxTokens: agCfg.maxTokens,
          enableThinking: agCfg.thinking,
          thinkingBudget: agCfg.thinkingBudget,
          ...(isPostAgent && agentUserId && id
            ? { enableDraftTool: true, client_id: id, user_id: agentUserId }
            : {}),
          messages: [{ role: "user", content: `${instruction}\n\n${ctxBase}${briefingBlock}` }],
        },
      });
      if (agErr) throw agErr;
      const reply = (agData?.content ?? "").trim() || "Sem resposta.";
      updateConvMsg(typingId, { content: reply, action: "respond", status: "done" });
      if (agData?.posts_created?.length > 0) {
        loadPendingPosts();
        addConvMsgs([{ id: `${agentId}-drafted-${Date.now()}`, from: agentId, to: "user", content: `📝 Criei ${agData.posts_created.length} post${agData.posts_created.length > 1 ? "s" : ""} e salvei para aprovação — veja na aba Social.`, action: "respond", timestamp: ts(), status: "done" }]);
      }
    } catch (e) {
      updateConvMsg(typingId, { content: `Erro: ${e instanceof Error ? e.message : String(e)}`, action: "respond", status: "error" });
    } finally {
      setAriaLoading(false);
    }
  };

  const updateAgentChat = (agentId: string, msgs: {role:"user"|"assistant"; content:string}[]) => {
    setAgentChats((prev) => {
      const updated = { ...prev, [agentId]: msgs };
      localStorage.setItem(`agent-chats-${id}`, JSON.stringify(updated));
      saveAgentChatsToDb(updated);
      return updated;
    });
  };

  const handleAgentChat = async (agentId: string) => {
    const msg = agentChatInput.trim();
    if (!msg || agentChatLoading) return;
    setAgentChatInput("");
    const agent = MARKETING_TEAM.find((a) => a.id === agentId);
    const history = agentChats[agentId] ?? [];
    const newHistory: {role:"user"|"assistant"; content:string}[] = [...history, { role: "user", content: msg }];
    updateAgentChat(agentId, newHistory);
    setAgentChatLoading(true);
    try {
      const agCfg = AGENT_CONFIG[agentId] ?? { maxTokens: 6000, thinking: false };
      const isPostAgent = ["social", "copywriter"].includes(agentId);
      const { data: { session } } = await supabase.auth.getSession();
      const agentUserId = session?.user?.id ?? null;
      const segmento = clientBriefing?.segmento || client.industry;
      const systemWithCtx = `${AGENT_PROMPTS[agentId] ?? `Você é ${agent?.name}, ${agent?.role} da Calu Agência.`}

CONTEXTO DO CLIENTE:
Cliente: ${client.name} | Segmento: ${segmento}${client.teamInstructions ? `\nInstruções permanentes: ${client.teamInstructions}` : ""}${buildBriefingBlock()}

⚠️ REGRA: Estratégias, prazos estimados e benchmarks do setor são bem-vindos. O que é proibido é citar estado atual inventado — não mencione propostas no CRM, leads cadastrados, campanhas em andamento ou resultados que não foram fornecidos no briefing. Use futuro para o que será feito, condicional para estimativas.`;
      const { data: agData, error: agErr } = await supabase.functions.invoke("chat-ai", {
        body: {
          systemPrompt: systemWithCtx,
          maxTokens: agCfg.maxTokens,
          ...(isPostAgent && agentUserId && id ? { enableDraftTool: true, client_id: id, user_id: agentUserId } : {}),
          messages: newHistory,
        },
      });
      if (agErr) throw agErr;
      const reply = (agData?.content ?? "").trim() || "Sem resposta.";
      updateAgentChat(agentId, [...newHistory, { role: "assistant", content: reply }]);
      if (agData?.posts_created?.length > 0) loadPendingPosts();
    } catch (e) {
      updateAgentChat(agentId, [...newHistory, { role: "assistant", content: `Erro: ${e instanceof Error ? e.message : String(e)}` }]);
    } finally {
      setAgentChatLoading(false);
      setTimeout(() => agentChatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const handleSendToAria = async () => {
    const demand = agentCommand.trim();
    if (!demand && !attachedFile) return;
    setAgentCommand("");
    clearAriaFile();
    setAriaLoading(true);
    // reset estado de ondas
    setAgentWaves({});
    setCurrentWave(1);
    setTotalWaves(1);

    const isDiagnostic = /diagnos|diagnóst|análise completa|análise geral|full analysis/i.test(demand);
    setIsDiagnosticMode(isDiagnostic);

    const ts = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const userMsg: AgentMsg = { id: `u-${Date.now()}`, from: "user", to: "aria", content: demand || `[arquivo: ${attachedFile?.name}]`, timestamp: ts, status: "done" };
    addConvMsgs([userMsg]);

    const clientContext = {
      name: client.name, industry: clientBriefing?.segmento || client.industry, brandColor: client.color,
      campaigns: client.activeCampaigns?.map((c) => c.name) ?? [],
      recentThemes: client.recentPosts?.map((p) => p.caption.slice(0, 80)) ?? [],
      nextAction: client.nextAction,
      teamInstructions: client.teamInstructions ?? undefined,
    };

    const nowTs = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // Mensagens curtas que ARIA envia para cada agente
    const ARIA_DELEGATIONS: Record<string, string> = {
      strategist: "Queila, defina o terreno estratégico: posicionamento, personas, pilares e KPIs.",
      copywriter: "Beatriz, escreva o copy completo aplicando psicologia do consumidor — gancho, body e CTA.",
      traffic:    "Rafaela, monte o plano de tráfego pago: público, criativo, orçamento e métricas esperadas.",
      analyst:    "Lucas, traga benchmarks, North Star Metric e metas de 30/60/90 dias.",
      social:     "Marina, monte o calendário editorial completo de 7 dias em tabela.",
      site:       "Valentina, traga a estratégia de SEO: keywords, clusters e títulos otimizados.",
      designer:   "Carolina, escreva o briefing visual completo da peça (formato, paleta, mood).",
      sales:      "Eduardo, monte o script de WhatsApp + qualificação + objeções + follow-up.",
      briefing:   "Lia, faça o diagnóstico inicial e monte o briefing de onboarding.",
      revisor:    "Vitória, revise os textos do contexto e entregue a versão final corrigida.",
      video:      "Bobby, monte o briefing de edição do vídeo (cortes, efeitos, legendas, color).",
    };

    try {
      // ━━━━━━━━━━ PASSO 1 — ARIA planeja (chamada curta) ━━━━━━━━━━
      const planSystem = `Você é ARIA, Diretora Sênior de Marketing da Calu Agência.
Decida QUAIS AGENTES acionar para a demanda. NÃO gere conteúdo agora.
Agentes disponíveis (use exatamente esses IDs):
- strategist (Queila — Estrategista, posicionamento, personas, pilares)
- copywriter (Beatriz — Copy, legendas, roteiros, anúncios)
- traffic (Rafaela — Tráfego pago, campanhas, ads)
- analyst (Lucas — Métricas, benchmarks, dados)
- social (Marina — Calendário editorial, social media)
- site (Valentina — SEO, blog, conteúdo orgânico)
- designer (Carolina — Briefing visual, criativo)
- sales (Eduardo — WhatsApp, vendas, qualificação de leads, CRM)
- briefing (Lia — Diagnóstico, onboarding, briefing inicial de novos clientes)
- revisor (Vitória — Revisão ortográfica e gramatical de textos prontos)
- video (Bobby — Edição de vídeo: cortes, efeitos, legendas, color grade)

Escolha SOMENTE os agentes que realmente fazem sentido para a demanda. Mínimo 1, máximo 5.

Contexto: cliente "${clientContext.name}", segmento "${clientContext.industry}".
${clientContext.teamInstructions ? `Instruções permanentes: ${clientContext.teamInstructions}` : ""}

Responda APENAS JSON válido, sem markdown, sem texto extra:
{"plan":"2 frases curtas explicando a abordagem","agents":["strategist","copywriter"]}`;

      const { data: planData, error: planError } = await supabase.functions.invoke("chat-ai", {
        body: {
          systemPrompt: planSystem,
          maxTokens: 300,
          messages: [{ role: "user", content: `Demanda: "${demand}"` }],
        },
      });
      if (planError) throw planError;

      const planRaw: string = planData?.content ?? "{}";
      let plan: { plan: string; agents: string[] } = { plan: "", agents: [] };
      try {
        const fromBlock = planRaw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]?.trim();
        const fromRaw   = planRaw.match(/(\{[\s\S]*\})/)?.[1]?.trim();
        plan = JSON.parse(fromBlock ?? fromRaw ?? planRaw);
      } catch {
        plan = { plan: planRaw.slice(0, 240), agents: ["strategist", "copywriter"] };
      }

      const validIds = new Set(Object.keys(AGENT_PROMPTS));
      const agents = (plan.agents ?? []).filter((a) => validIds.has(a));
      if (agents.length === 0) agents.push("strategist", "copywriter");

      // Divisor visual: Onda 1
      addConvMsgs([{
        id: `wave-divider-1-${Date.now()}`,
        from: "system", to: "system",
        content: `Onda 1 • Planejamento e primeira leva (${agents.length} agente${agents.length > 1 ? "s" : ""})`,
        action: "wave-divider", timestamp: nowTs(), status: "done",
      }]);

      // ARIA mostra o plano na conversa
      addConvMsgs([{
        id: `aria-plan-${Date.now()}`,
        from: "aria", to: "user",
        content: plan.plan || "Vou acionar o time.",
        action: "plan", timestamp: nowTs(), status: "done",
      }]);

      // marca cada agente da onda 1
      setAgentWaves((prev) => {
        const next = { ...prev };
        agents.forEach((a) => { next[a] = 1; });
        return next;
      });

      // ━━━━━━━━━━ PASSO 2 — Delegação ━━━━━━━━━━
      const delegationMsgs: AgentMsg[] = agents.map((agentId, i) => ({
        id: `aria-deleg-${Date.now()}-${i}`,
        from: "aria", to: agentId,
        content: ARIA_DELEGATIONS[agentId] ?? `${agentId}, entregue sua parte da demanda.`,
        action: "plan", timestamp: nowTs(), status: "done",
      }));
      addConvMsgs(delegationMsgs);

      // marca todos como aguardando + define deadline (~2 min por agente)
      const newDeadlines: Record<string, string> = {};
      const baseTasks = { ...client.agentTasks };
      agents.forEach((agentId, i) => {
        const deadline = new Date(Date.now() + (i + 1) * 2 * 60_000);
        newDeadlines[agentId] = deadline.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        baseTasks[agentId] = {
          current: ARIA_DELEGATIONS[agentId] ?? "Aguardando início",
          status: "aguardando",
          recent: baseTasks[agentId]?.recent ?? [],
          progress: 0,
        };
      });
      setAgentDeadlines((prev) => ({ ...prev, ...newDeadlines }));
      if (id) updateClient(id, { agentTasks: baseTasks });

      // ━━━━━━━━━━ PASSO 3 — Execução sequencial ━━━━━━━━━━
      const accumulated: Record<string, string> = {};

      // Session necessária para que agentes salvem posts no Supabase
      const { data: { session: _agentSession } } = await supabase.auth.getSession();
      const agentUserId = _agentSession?.user?.id ?? null;

      for (const agentId of agents) {
        // (a) marca como trabalhando
        const workingTasks = { ...client.agentTasks, ...baseTasks };
        workingTasks[agentId] = {
          current: ARIA_DELEGATIONS[agentId] ?? "Trabalhando…",
          status: "trabalhando",
          recent: workingTasks[agentId]?.recent ?? [],
          progress: 25,
        };
        if (id) updateClient(id, { agentTasks: workingTasks });

        // (b) indicador de digitação
        const typingMsgId = `${agentId}-typing-${Date.now()}`;
        addConvMsgs([{
          id: typingMsgId, from: agentId, to: "aria",
          content: "", action: "typing", timestamp: nowTs(), status: "processing",
        }]);

        // (c) chama o agente individualmente
        const ctxBlock = `Cliente: ${clientContext.name} | Segmento: ${clientContext.industry} | Cor: ${clientContext.brandColor}
${clientContext.teamInstructions ? `Instruções permanentes: ${clientContext.teamInstructions}` : ""}${buildBriefingBlock()}
${accumulated.strategist ? `\nESTRATÉGIA DA QUEILA (referencie):\n${accumulated.strategist.slice(0, 1500)}` : ""}
${accumulated.copywriter ? `\nCOPY DA BEATRIZ (referencie):\n${accumulated.copywriter.slice(0, 1000)}` : ""}

⚠️ Estratégias, estimativas de prazo e benchmarks são permitidos. Não invente estado atual do cliente (propostas no CRM, leads, campanhas ativas, resultados) que não foi informado. Use futuro para o que será feito.`;

        let outputText = "";
        try {
          const agCfg = AGENT_CONFIG[agentId] ?? { maxTokens: 5000, thinking: false };
          const isPostAgent = ["social", "copywriter"].includes(agentId);
          const { data: agData, error: agErr } = await supabase.functions.invoke("chat-ai", {
            body: {
              systemPrompt: AGENT_PROMPTS[agentId],
              maxTokens: agCfg.maxTokens,
              enableThinking: agCfg.thinking,
              thinkingBudget: agCfg.thinkingBudget,
              ...(isPostAgent && agentUserId && id
                ? { enableDraftTool: true, client_id: id, user_id: agentUserId }
                : {}),
              messages: [{
                role: "user",
                content: `Demanda do cliente: "${demand}"\n\n${ctxBlock}`,
              }],
            },
          });
          if (agErr) throw agErr;
          outputText = (agData?.content ?? "").trim();

          const agentPosts: unknown[] = agData?.posts_created ?? [];
          if (agentPosts.length > 0) {
            loadPendingPosts();
            addConvMsgs([{
              id: `${agentId}-drafted-${Date.now()}`,
              from: agentId, to: "aria",
              content: `📝 Criei ${agentPosts.length} post${agentPosts.length > 1 ? "s" : ""} e salvei para aprovação — veja na aba Social.`,
              action: "respond", timestamp: nowTs(), status: "done",
            }]);
          }
        } catch (e) {
          outputText = `*Erro ao executar este agente: ${e instanceof Error ? e.message : String(e)}*`;
        }

        // (c) salva output completo
        accumulated[agentId] = outputText;
        setAgentOutputs((prev) => ({ ...prev, [agentId]: outputText }));

        // (d) marca como concluído
        const doneTasks = { ...client.agentTasks, ...baseTasks };
        Object.keys(accumulated).forEach((aId) => {
          doneTasks[aId] = {
            current: "Entrega concluída",
            status: "concluído",
            recent: ["Entrega pronta para revisão", ...(doneTasks[aId]?.recent ?? [])].slice(0, 3),
            progress: 100,
          };
        });
        // os que ainda não rodaram seguem aguardando
        agents.filter((a) => !accumulated[a]).forEach((a) => {
          doneTasks[a] = {
            current: ARIA_DELEGATIONS[a] ?? "Aguardando",
            status: "aguardando",
            recent: doneTasks[a]?.recent ?? [],
            progress: 0,
          };
        });
        if (id) updateClient(id, { agentTasks: doneTasks });

        // (e) substitui o typing indicator pela resposta real
        const firstPara = outputText.split(/\n\s*\n/)[0]?.replace(/^#+\s*/g, "").trim() ?? outputText;
        updateConvMsg(typingMsgId, {
          content: firstPara.slice(0, 300) + (firstPara.length > 300 ? "…" : ""),
          action: "respond", status: "done",
        });
      }

      // ━━━━━━━━━━ PASSO 4 — Handoff iterativo (até 2 ondas extras) ━━━━━━━━━━
      const alreadyRan = new Set<string>(agents);
      let waveIndex = 1;
      const MAX_EXTRA_WAVES = 2;
      const MAX_PER_WAVE = 3;

      while (waveIndex <= MAX_EXTRA_WAVES) {
        // resumo curto das entregas até agora
        const deliveriesSummary = Object.entries(accumulated)
          .map(([aId, txt]) => `- ${aId}: ${txt.replace(/\n+/g, " ").slice(0, 220)}…`)
          .join("\n");

        const remaining = Object.keys(AGENT_PROMPTS).filter((a) => !alreadyRan.has(a));
        if (remaining.length === 0) break;

        const handoffSystem = `Você é ARIA, Diretora Sênior. Avalie se a demanda do cliente exige continuidade por OUTROS agentes que ainda não atuaram.

Demanda original: "${demand}"
Agentes que JÁ entregaram: ${[...alreadyRan].join(", ")}
Agentes DISPONÍVEIS para continuar: ${remaining.join(", ")}

Resumo das entregas atuais:
${deliveriesSummary}

Decida: a demanda está PLENAMENTE atendida ou faltam etapas (ex: copy pronto → falta briefing visual → falta calendário social → falta plano de tráfego)?

Responda APENAS JSON:
{"continue": true/false, "reason":"1 frase", "agents":["id1","id2"]}
- continue=false se a demanda está completa.
- agents: máximo ${MAX_PER_WAVE}, somente IDs de "DISPONÍVEIS".`;

        const { data: handoffData, error: handoffErr } = await supabase.functions.invoke("chat-ai", {
          body: {
            systemPrompt: handoffSystem,
            maxTokens: 250,
            messages: [{ role: "user", content: "Avalie continuidade." }],
          },
        });
        if (handoffErr) break;

        const hRaw: string = handoffData?.content ?? "{}";
        let handoff: { continue: boolean; reason: string; agents: string[] } = { continue: false, reason: "", agents: [] };
        try {
          const fromBlock = hRaw.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]?.trim();
          const fromRaw   = hRaw.match(/(\{[\s\S]*\})/)?.[1]?.trim();
          handoff = JSON.parse(fromBlock ?? fromRaw ?? hRaw);
        } catch { break; }

        const nextAgents = (handoff.agents ?? [])
          .filter((a) => validIds.has(a) && !alreadyRan.has(a))
          .slice(0, MAX_PER_WAVE);

        // Wave 2 (first handoff) always runs automatically; from wave 3+ only if AI says so
        const isFirstHandoff = waveIndex === 1;
        if (!isFirstHandoff && (!handoff.continue || nextAgents.length === 0)) break;
        if (nextAgents.length === 0 && isFirstHandoff) {
          // Auto-select revisor + calendario for mandatory wave 2
          const fallback = remaining
            .filter((a) => ["revisor", "calendario", "analyst"].includes(a))
            .slice(0, MAX_PER_WAVE);
          if (fallback.length === 0) break;
          nextAgents.push(...fallback);
          if (!handoff.reason) handoff.reason = "Revisão e calendário editorial automáticos";
        }
        if (nextAgents.length === 0) break;

        // ─── Atualiza estado de ondas (onda real = waveIndex + 1) ───
        const realWaveNum = waveIndex + 1;
        setCurrentWave(realWaveNum);
        setTotalWaves((prev) => Math.max(prev, realWaveNum));
        setAgentWaves((prev) => {
          const next = { ...prev };
          nextAgents.forEach((a) => { next[a] = realWaveNum; });
          return next;
        });

        // Divisor visual da nova onda
        addConvMsgs([{
          id: `wave-divider-${realWaveNum}-${Date.now()}`,
          from: "system", to: "system",
          content: `Onda ${realWaveNum} • ${handoff.reason || "Continuidade"} (${nextAgents.length} agente${nextAgents.length > 1 ? "s" : ""})`,
          action: "wave-divider", timestamp: nowTs(), status: "done",
        }]);

        // ARIA anuncia a continuidade
        addConvMsgs([{
          id: `aria-handoff-${Date.now()}`,
          from: "aria", to: "user",
          content: `🔄 Continuando: ${handoff.reason || "acionando próximos agentes para dar sequência."}`,
          action: "plan", timestamp: nowTs(), status: "done",
        }]);

        // delegação da nova onda
        const wDeleg: AgentMsg[] = nextAgents.map((agentId, i) => ({
          id: `aria-wave${waveIndex}-${Date.now()}-${i}`,
          from: "aria", to: agentId,
          content: ARIA_DELEGATIONS[agentId] ?? `${agentId}, dê continuidade ao trabalho.`,
          action: "plan", timestamp: nowTs(), status: "done",
        }));
        addConvMsgs(wDeleg);

        // execução sequencial da nova onda
        for (const agentId of nextAgents) {
          alreadyRan.add(agentId);

          const workTasks = { ...client.agentTasks };
          workTasks[agentId] = {
            current: ARIA_DELEGATIONS[agentId] ?? "Trabalhando…",
            status: "trabalhando",
            recent: workTasks[agentId]?.recent ?? [],
            progress: 25,
          };
          if (id) updateClient(id, { agentTasks: workTasks });

          const typingMsgId2 = `${agentId}-w${waveIndex}-typing-${Date.now()}`;
          addConvMsgs([{
            id: typingMsgId2, from: agentId, to: "aria",
            content: "", action: "typing", timestamp: nowTs(), status: "processing",
          }]);

          // contexto rico com TUDO que já foi entregue
          const priorBlock = Object.entries(accumulated)
            .map(([aId, txt]) => `\n--- Entrega de ${aId} ---\n${txt.slice(0, 1200)}`)
            .join("\n");

          const ctx2 = `Cliente: ${clientContext.name} | Segmento: ${clientContext.industry}
${clientContext.teamInstructions ? `Instruções: ${clientContext.teamInstructions}` : ""}${buildBriefingBlock()}

ENTREGAS ANTERIORES DO TIME (use como base e dê CONTINUIDADE — não repita, complemente):
${priorBlock}`;

          let outText = "";
          try {
            const agCfg2 = AGENT_CONFIG[agentId] ?? { maxTokens: 5000, thinking: false };
            const isPostAgent2 = ["social", "copywriter"].includes(agentId);
            const { data: agData, error: agErr } = await supabase.functions.invoke("chat-ai", {
              body: {
                systemPrompt: AGENT_PROMPTS[agentId],
                maxTokens: agCfg2.maxTokens,
                enableThinking: agCfg2.thinking,
                thinkingBudget: agCfg2.thinkingBudget,
                ...(isPostAgent2 && agentUserId && id
                  ? { enableDraftTool: true, client_id: id, user_id: agentUserId }
                  : {}),
                messages: [{
                  role: "user",
                  content: `Demanda original: "${demand}"\n\n${ctx2}\n\nEntregue sua parte dando continuidade ao que o time já produziu.`,
                }],
              },
            });
            if (agErr) throw agErr;
            outText = (agData?.content ?? "").trim();

            const wavePosts: unknown[] = agData?.posts_created ?? [];
            if (wavePosts.length > 0) {
              loadPendingPosts();
              addConvMsgs([{
                id: `${agentId}-w${waveIndex}-drafted-${Date.now()}`,
                from: agentId, to: "aria",
                content: `📝 Criei ${wavePosts.length} post${wavePosts.length > 1 ? "s" : ""} e salvei para aprovação — veja na aba Social.`,
                action: "respond", timestamp: nowTs(), status: "done",
              }]);
            }
          } catch (e) {
            outText = `*Erro: ${e instanceof Error ? e.message : String(e)}*`;
          }

          accumulated[agentId] = outText;
          setAgentOutputs((prev) => ({ ...prev, [agentId]: outText }));

          const doneT = { ...client.agentTasks };
          doneT[agentId] = {
            current: "Entrega concluída",
            status: "concluído",
            recent: ["Continuidade entregue", ...(doneT[agentId]?.recent ?? [])].slice(0, 3),
            progress: 100,
          };
          if (id) updateClient(id, { agentTasks: doneT });

          const fp = outText.split(/\n\s*\n/)[0]?.replace(/^#+\s*/g, "").trim() ?? outText;
          updateConvMsg(typingMsgId2, {
            content: fp.slice(0, 300) + (fp.length > 300 ? "…" : ""),
            action: "respond", status: "done",
          });
        }

        waveIndex++;
      }

      // ━━━━━━━━━━ PASSO 5 — ARIA encerra + registra entregas no portal ━━━━━━━━━━
      if (id && Object.keys(accumulated).length > 0) {
        const today = new Date();
        const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}`;
        const newOutputs: GeneratedOutput[] = Object.entries(accumulated).map(([aId, txt]) => ({
          id: `${aId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: `${AGENT_META[aId]?.name ?? aId} — ${txt.split("\n")[0].replace(/^#+\s*/, "").trim().slice(0, 55) || demand.slice(0, 40)}`,
          type: AGENT_OUTPUT_TYPE[aId] ?? "copy",
          agent: aId,
          createdAt: dateStr,
          preview: txt.slice(0, 500),
          status: "revisão" as const,
        }));
        updateClient(id, { outputs: [...(client.outputs ?? []), ...newOutputs] });
      }

      // ━━━━━━━━━━ PASSO 6 — LAURA sintetiza (modo diagnóstico) ━━━━━━━━━━
      if (isDiagnostic && Object.keys(accumulated).length > 0) {
        const lauraTypingId = `laura-typing-${Date.now()}`;
        addConvMsgs([{
          id: lauraTypingId, from: "laura", to: "user",
          content: "", action: "typing", timestamp: nowTs(), status: "processing",
        }]);
        try {
          const allOutputs = Object.entries(accumulated)
            .map(([aId, txt]) => `\n=== ${AGENT_META[aId]?.name ?? aId} ===\n${txt.slice(0, 1800)}`)
            .join("\n");
          const { data: lauraData } = await supabase.functions.invoke("chat-ai", {
            body: {
              systemPrompt: AGENT_PROMPTS.laura,
              maxTokens: 10000,
              enableThinking: true,
              thinkingBudget: 6000,
              messages: [{
                role: "user",
                content: `Demanda original: "${demand}"\nCliente: ${clientContext.name} | ${clientContext.industry}\n\nEntregas do time:\n${allOutputs}\n\nProduza a síntese executiva completa do diagnóstico.`,
              }],
            },
          });
          const lauraSynthesis = (lauraData?.content ?? "").trim();
          const lauraFirstPara = lauraSynthesis.split(/\n\s*\n/)[0]?.replace(/^#+\s*/g, "").trim() ?? lauraSynthesis;
          updateConvMsg(lauraTypingId, {
            content: lauraFirstPara.slice(0, 500) + (lauraFirstPara.length > 500 ? "…" : ""),
            action: "laura-synthesis", status: "done",
          });
          accumulated["laura"] = lauraSynthesis;
          setAgentOutputs((prev) => ({ ...prev, laura: lauraSynthesis }));
          if (id) {
            const today = new Date();
            const ds = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}`;
            const lauraEntry: GeneratedOutput = {
              id: `laura-${Date.now()}`,
              name: `Laura — Síntese do Diagnóstico — ${demand.slice(0, 40)}`,
              type: "report" as const,
              agent: "laura",
              createdAt: ds,
              preview: lauraSynthesis.slice(0, 500),
              status: "revisão" as const,
            };
            updateClient(id, { outputs: [...(client.outputs ?? []), lauraEntry] });
          }
        } catch (e) {
          updateConvMsg(lauraTypingId, {
            content: `Erro na síntese: ${e instanceof Error ? e.message : String(e)}`,
            action: "respond", status: "error",
          });
        }
      }

      addConvMsgs([{
        id: `aria-end-${Date.now()}`,
        from: "aria", to: "user",
        content: isDiagnostic
          ? `✅ Diagnóstico completo! ${alreadyRan.size} especialistas + síntese da Laura. Veja as entregas nos cards abaixo.`
          : `✅ ${alreadyRan.size} agente(s) concluíram em ${waveIndex} onda(s). Veja as entregas completas nos cards abaixo.`,
        action: "respond", timestamp: nowTs(), status: "done",
      }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addConvMsgs([{ id: `e-${Date.now()}`, from: "aria", to: "user", content: `Erro: ${errMsg}`, timestamp: ts, status: "error" }]);
    } finally {
      setAriaLoading(false);
      setCurrentWave(0);
    }
  };

  const handleAddManualOutput = () => {
    if (!id || !manualForm.name.trim()) return;
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}`;
    const entry: GeneratedOutput = {
      id: `manual-${Date.now()}`,
      name: manualForm.name.trim(),
      type: manualForm.type,
      agent: "manual",
      createdAt: dateStr,
      preview: manualForm.preview.trim(),
      platform: manualForm.platform.trim() || undefined,
      status: manualForm.status,
    };
    updateClient(id, { outputs: [...(client.outputs ?? []), entry] });
    setShowManualOutput(false);
    setManualForm({ name: "", type: "copy", preview: "", status: "revisão", platform: "" });
  };

  const fetchWpQr = async () => {
    setWpQr(null);
    const { data } = await wpInvoke({ action: "qrcode" });
    setWpQr(data?.qrcode ?? null);
  };

  const refreshWpGroups = async () => {
    const { data } = await wpInvoke({ action: "groups" });
    setWpGroups(Array.isArray(data) ? data : []);
    await loadFavoriteGroups();
  };


  const doWpBlast = async () => {
    const allTargets = [...wpSelectedGroups, ...wpSelectedContacts];
    const hasMedia = wpMediaType !== "text" && !!wpMediaData;
    if (!allTargets.length || (!hasMedia && !wpMessage.trim())) return;
    setWpBlasting(true);
    setWpBlastResult(null);
    try {
      const body: Record<string, any> = { action: "blast", targets: allTargets, message: wpMessage };
      if (hasMedia) { body.mediaType = wpMediaType; body.mediaData = wpMediaData; body.caption = wpCaption || wpMessage; }
      const { data } = await wpInvoke(body);
      setWpBlastResult(`${data?.ok ?? 0} de ${allTargets.length} destinos receberam a mensagem`);
    } catch {
      setWpBlastResult("Erro ao enviar. Verifique a conexão Z-API.");
    }
    setWpBlasting(false);
  };

  const handleWpFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWpMediaName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setWpMediaData(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleGroup = (gid: string) =>
    setWpSelectedGroups((prev) => prev.includes(gid) ? prev.filter((g) => g !== gid) : [...prev, gid]);

  const toggleWpContact = (phone: string) =>
    setWpSelectedContacts((prev) => prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]);

  const generateWpMessageWithAI = async () => {
    if (!wpAiPrompt.trim()) return;
    setWpAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: {
          messages: [{ role: "user", content: wpAiPrompt }],
          systemPrompt: `Você é especialista em comunicação via WhatsApp para cursos e eventos de capacitação profissional.
Escreva mensagens diretas, calorosas e sem formatação markdown (sem asteriscos, sem #).
Use linguagem natural de WhatsApp — pode usar emojis com moderação.
Responda APENAS com o texto da mensagem, sem explicações ou introduções.
Contexto do cliente: ${client.name}${(client as any).segment ? ` — segmento ${(client as any).segment}` : ""}.`,
          maxTokens: 600,
        },
      });
      if (error) throw new Error(error.message);
      const msg = data?.content?.trim() ?? "";
      if (msg) setWpMessage(msg);
    } catch {
      toast.error("Erro ao gerar mensagem");
    } finally {
      setWpAiGenerating(false);
    }
  };

  const loadWpCreds = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await (supabase as any).from("integrations")
      .select("config").eq("user_id", session.user.id).eq("connector_name", `whatsapp_${id}`).maybeSingle();
    if (data?.config?.zapi_instance) {
      setWpCreds(data.config);
      setWpCredsForm(data.config);
    }
  };

  const saveWpCreds = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setWpCredsSaving(true);
    await (supabase as any).from("integrations").upsert({
      user_id: session.user.id,
      connector_name: `whatsapp_${id}`,
      config: wpCredsForm,
      connected: true, status: "active",
    }, { onConflict: "user_id,connector_name" });
    setWpCreds(wpCredsForm);
    setWpCredsSaving(false);
    setWpCredsOpen(false);
    toast.success("Credenciais ZApi salvas!");
  };

  const loadAgentChatsFromDb = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await (supabase as any).from("integrations")
      .select("config").eq("user_id", session.user.id).eq("connector_name", `agent_chats_${id}`).maybeSingle();
    if (data?.config?.chats) {
      setAgentChats(data.config.chats);
      localStorage.setItem(`agent-chats-${id}`, JSON.stringify(data.config.chats));
    }
    setAgentChatsLoaded(true);
  };

  const saveAgentChatsToDb = async (chats: Record<string, {role:"user"|"assistant"; content:string}[]>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await (supabase as any).from("integrations").upsert({
      user_id: session.user.id,
      connector_name: `agent_chats_${id}`,
      config: { chats },
      connected: true, status: "active",
    }, { onConflict: "user_id,connector_name" });
  };

  const loadClientWpCreds = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await (supabase as any).from("integrations")
      .select("config").eq("user_id", session.user.id).eq("connector_name", `wordpress_${id}`).maybeSingle();
    if (data?.config) setClientWpCreds(prev => ({ ...prev, ...data.config }));
    setClientWpCredsLoaded(true);
  };

  const saveClientWpCreds = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setClientWpCredsSaving(true);
    await (supabase as any).from("integrations").upsert({
      user_id: session.user.id,
      connector_name: `wordpress_${id}`,
      config: clientWpCreds,
      connected: !!clientWpCreds.wp_url, status: "active",
    }, { onConflict: "user_id,connector_name" });
    setClientWpCredsSaving(false);
    toast.success("Credenciais WordPress salvas!");
  };

  const loadFavoriteGroups = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await (supabase as any).from("integrations")
      .select("config").eq("user_id", session.user.id).eq("connector_name", `agent_whatsapp_${id}`).maybeSingle();
    if (data?.config?.favorite_groups) {
      setWpFavoriteGroupIds((data.config.favorite_groups as { id: string }[]).map(g => g.id));
    }
  };

  const saveFavoriteGroups = async (newIds: string[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const favoriteGroups = wpGroups.filter(g => newIds.includes(g.id)).map(g => ({ id: g.id, name: g.name }));
    await (supabase as any).from("integrations").upsert({
      user_id: session.user.id,
      connector_name: `agent_whatsapp_${id}`,
      config: { favorite_groups: favoriteGroups },
      connected: true,
      status: "active",
    }, { onConflict: "user_id,connector_name" });
  };

  const toggleFavoriteGroup = async (groupId: string) => {
    const newIds = wpFavoriteGroupIds.includes(groupId)
      ? wpFavoriteGroupIds.filter(x => x !== groupId)
      : [...wpFavoriteGroupIds, groupId];
    setWpFavoriteGroupIds(newIds);
    await saveFavoriteGroups(newIds);
  };

  const doAgentBroadcast = async () => {
    if (!agentSendPrompt.trim() || wpFavoriteGroupIds.length === 0) return;
    setAgentSending(true);
    setAgentSendResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const favoriteGroups = wpGroups.filter(g => wpFavoriteGroupIds.includes(g.id));
      const res = await supabase.functions.invoke("agent-broadcast", {
        body: {
          user_id: session?.user.id,
          client_id: id,
          channel: "whatsapp",
          prompt: agentSendPrompt,
          groups: favoriteGroups,
          auto_send: true,
        },
      });
      if (res.error) throw res.error;
      setAgentSendResult(res.data);
      toast.success(`Agente enviou para ${res.data.ok}/${res.data.total} grupos!`);
    } catch {
      toast.error("Erro no envio autônomo");
    } finally {
      setAgentSending(false);
    }
  };

  const generateEmailWithAI = async () => {
    if (!emailBlastPrompt.trim()) return;
    const { data, error } = await supabase.functions.invoke("chat-ai", {
      body: {
        messages: [{ role: "user", content: emailBlastPrompt }],
        systemPrompt: `Você é especialista em comunicação por e-mail para cursos e eventos de capacitação profissional.
Escreva e-mails cordiais, diretos e profissionais em HTML simples (pode usar <b>, <p>, <br>).
Contexto do cliente: ${client?.name ?? ""}. Responda APENAS com o corpo do e-mail, sem introduções.`,
        maxTokens: 800,
      },
    });
    if (!error && data?.content) setEmailBlastBody(data.content.trim());
  };

  const sendEmailToContact = async () => {
    if (!emailBlastContact || !emailBlastSubject.trim() || !emailBlastBody.trim()) return;
    setEmailBlasting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("agent-broadcast", {
        body: {
          user_id: session?.user.id,
          client_id: id,
          channel: "email",
          prompt: emailBlastBody,
          system_context: "Responda APENAS com o texto fornecido, sem alterações.",
          emails: [emailBlastContact.email],
          subject: emailBlastSubject,
          auto_send: true,
        },
      });
      if (res.error) throw res.error;
      toast.success("E-mail enviado!");
      setEmailBlastContact(null);
      setEmailBlastSubject("");
      setEmailBlastBody("");
      setEmailBlastPrompt("");
    } catch {
      toast.error("Erro ao enviar e-mail");
    } finally {
      setEmailBlasting(false);
    }
  };

  const loadAgentChannelConfig = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await (supabase as any).from("integrations")
      .select("config").eq("user_id", session.user.id).eq("connector_name", `agent_${id}`).maybeSingle();
    if (data?.config?.channels) {
      setAgentChannelConfig(prev => ({ ...prev, ...data.config.channels }));
    }
  };

  const saveAgentChannelConfig = async (channels) => {
    setAgentConfigSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await (supabase as any).from("integrations").upsert({
        user_id: session.user.id,
        connector_name: `agent_${id}`,
        config: { channels },
        connected: true,
        status: "active",
      }, { onConflict: "user_id,connector_name" });
      toast.success("Configuração salva!");
    } catch {
      toast.error("Erro ao salvar configuração");
    } finally {
      setAgentConfigSaving(false);
    }
  };

  const loadAgentLogs = async () => {
    setAgentLogsLoading(true);
    try {
      const { data } = await (supabase as any).from("agent_broadcast_logs")
        .select("*").eq("client_id", id).order("created_at", { ascending: false }).limit(10);
      setAgentLogs(data ?? []);
    } finally {
      setAgentLogsLoading(false);
    }
  };

  const loadSocialAccounts = async () => {
    const { data } = await (supabase as any).from("social_connections")
      .select("*").eq("client_id", id);
    const map = {};
    for (const row of data ?? []) map[row.platform] = row;
    setSocialAccountsMap(map);
  };

  const renderCertificate = (template: string, name: string, xPct: number, yPct: number, fontSize: number, color: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px "Georgia", serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(name, (xPct / 100) * img.width, (yPct / 100) * img.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = template;
    });

  const handleCertTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCertTemplate(reader.result as string);
      setCertPreview(null);
      setGeneratedCerts([]);
    };
    reader.readAsDataURL(file);
  };

  const previewCert = async () => {
    if (!certTemplate || !certStudentName.trim()) return;
    setCertGenerating(true);
    const url = await renderCertificate(certTemplate, certStudentName, certNameX, certNameY, certFontSize, certFontColor);
    setCertPreview(url);
    setCertGenerating(false);
  };

  const generateAllCerts = async (courseId: string) => {
    if (!certTemplate) return;
    setCertGenerating(true);
    const attending = (dbAttendance[courseId] ?? []).map((a: any) => a.student_name);
    const enrolled = (dbEnrollments[courseId] ?? []).map((s: any) => s.student_name);
    // Prefer attendance list; fall back to enrolled students + manual list
    const base = attending.length > 0 ? attending : enrolled;
    const allNames = [...new Set([...base, ...certManualList])].filter(Boolean);
    const certs: { name: string; dataUrl: string }[] = [];
    for (const name of allNames) {
      const dataUrl = await renderCertificate(certTemplate, name, certNameX, certNameY, certFontSize, certFontColor);
      certs.push({ name, dataUrl });
    }
    setGeneratedCerts(certs);
    setCertGenerating(false);
  };

  const downloadCert = (dataUrl: string, name: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `certificado-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  const sendCertViaWp = async (dataUrl: string, phone: string, name: string) => {
    try {
      const base64 = dataUrl.split(",")[1];
      await wpInvoke({ action: "send", type: "image", to: phone, mediaBase64: base64, caption: `Certificado de conclusão — ${name}` });
      toast.success(`Certificado enviado para ${name}`);
    } catch {
      toast.error("Falha ao enviar certificado");
    }
  };

  const loadDbCourses = async () => {
    setCoursesLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setCoursesLoading(false); return; }

    // Courses table (scoped by client)
    const { data: courses } = await (supabase as any)
      .from("courses").select("*")
      .eq("user_id", session.user.id).eq("client_id", id ?? "")
      .order("created_at", { ascending: false });
    if (courses) {
      setDbCourses(courses);
      const map: Record<string, any[]> = {};
      const checkMap: Record<string, any[]> = {};
      const attendMap: Record<string, any[]> = {};
      await Promise.all(courses.map(async (c: any) => {
        const { data: enr } = await (supabase as any).from("course_enrollments").select("*")
          .eq("course_id", c.id).order("enrolled_at", { ascending: true });
        map[c.id] = enr ?? [];
        const { data: checks } = await (supabase as any).from("course_checklists").select("*")
          .eq("course_id", c.id).order("order_index", { ascending: true });
        checkMap[c.id] = checks ?? [];
        const { data: attend } = await (supabase as any).from("course_attendance").select("*")
          .eq("course_id", c.id).order("attended_at", { ascending: true });
        attendMap[c.id] = attend ?? [];
      }));
      setDbEnrollments(map);
      setDbChecklists(checkMap);
      setDbAttendance(attendMap);
    }

    // CRM contact_groups (user-level, all groups)
    const { data: groups } = await (supabase as any)
      .from("contact_groups").select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (groups) {
      setDbCrmGroups(groups);
      const gmap: Record<string, any[]> = {};
      await Promise.all(groups.map(async (g: any) => {
        const { data: members } = await (supabase as any)
          .from("contact_group_members")
          .select("contact_id, contacts(id, name, phone, email, status, company)")
          .eq("group_id", g.id);
        gmap[g.id] = (members ?? []).map((m: any) => m.contacts).filter(Boolean);
      }));
      setDbGroupMembers(gmap);
    }

    setCoursesLoading(false);
  };

  const handleCreateCourse = async () => {
    if (!newCourseForm.title.trim()) return;
    setSavingCourse(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await (supabase as any).from("courses").insert({
      user_id: session.user.id, client_id: id ?? "",
      title: newCourseForm.title, description: newCourseForm.description || null,
      level: newCourseForm.level, status: "active",
    });
    setShowNewCourse(false);
    setNewCourseForm({ title: "", description: "", level: "Básico" });
    loadDbCourses();
    toast.success("Curso criado!");
    setSavingCourse(false);
  };

  const handleAddStudent = async (courseId: string) => {
    if (!newStudentForm.student_name.trim()) return;
    setAddingStudent(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await (supabase as any).from("course_enrollments").insert({
      course_id: courseId, user_id: session.user.id,
      student_name: newStudentForm.student_name,
      student_email: newStudentForm.student_email || null,
      student_phone: newStudentForm.student_phone || null,
    });
    setShowAddStudent(null);
    setNewStudentForm({ student_name: "", student_email: "", student_phone: "" });
    loadDbCourses();
    toast.success("Aluno adicionado!");
    setAddingStudent(false);
  };

  const handleDeleteEnrollment = async (enrollmentId: string, courseId: string) => {
    await (supabase as any).from("course_enrollments").delete().eq("id", enrollmentId);
    setDbEnrollments(prev => ({ ...prev, [courseId]: (prev[courseId] ?? []).filter((e: any) => e.id !== enrollmentId) }));
  };

  const handleDeleteCourse = async (courseId: string) => {
    await (supabase as any).from("courses").delete().eq("id", courseId);
    setDbCourses(prev => prev.filter(c => c.id !== courseId));
    toast.success("Curso removido");
  };

  const PHASE_LABELS: Record<string, string> = {
    pre_venda:  "Pré-venda",
    venda:      "Venda",
    pos_venda:  "Pós-venda",
    dia_evento: "Dia do Evento",
  };
  const PHASES = ["pre_venda", "venda", "pos_venda", "dia_evento"] as const;

  const handleGenerateChecklist = async (course: any, phase: string) => {
    const key = `${course.id}_${phase}`;
    setChecklistGenerating(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await supabase.functions.invoke("generate-course-checklist", {
        body: {
          course_title: course.title,
          course_description: course.description ?? "",
          course_level: course.level ?? "Básico",
          client_segment: (client as any).segment ?? "",
          phase,
        },
      });
      if (error || !data?.items?.length) throw new Error(error?.message ?? "Sem itens");
      await (supabase as any).from("course_checklists").delete()
        .eq("course_id", course.id).eq("phase", phase);
      const rows = (data.items as any[]).map((item: any, idx: number) => ({
        course_id: course.id, user_id: session.user.id, client_id: id ?? "",
        title: item.title, description: item.description || null,
        responsible: ["agency","client","student"].includes(item.responsible) ? item.responsible : "agency",
        order_index: idx,
        phase,
      }));
      await (supabase as any).from("course_checklists").insert(rows);
      const { data: fresh } = await (supabase as any).from("course_checklists").select("*")
        .eq("course_id", course.id).order("order_index", { ascending: true });
      setDbChecklists(prev => ({ ...prev, [course.id]: fresh ?? [] }));
      toast.success(`${rows.length} itens gerados para ${PHASE_LABELS[phase]}!`);
    } catch {
      toast.error("Erro ao gerar checklist");
    } finally {
      setChecklistGenerating(null);
    }
  };

  const handleAddChecklistItem = async (courseId: string, phase: string) => {
    if (!newChecklistItem.title.trim()) return;
    setSavingChecklistItem(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const existing = (dbChecklists[courseId] ?? []).filter(i => i.phase === phase);
    await (supabase as any).from("course_checklists").insert({
      course_id: courseId, user_id: session.user.id, client_id: id ?? "",
      title: newChecklistItem.title, description: newChecklistItem.description || null,
      responsible: newChecklistItem.responsible, order_index: existing.length,
      phase,
    });
    setNewChecklistItem({ title: "", description: "", responsible: "agency" });
    setShowAddChecklistItem(null);
    const { data: fresh } = await (supabase as any).from("course_checklists").select("*")
      .eq("course_id", courseId).order("order_index", { ascending: true });
    setDbChecklists(prev => ({ ...prev, [courseId]: fresh ?? [] }));
    setSavingChecklistItem(false);
  };

  const handleToggleChecklist = async (item: any, courseId: string) => {
    const next = item.status === "completed" ? "pending" : "completed";
    await (supabase as any).from("course_checklists").update({
      status: next,
      completed_at: next === "completed" ? new Date().toISOString() : null,
    }).eq("id", item.id);
    setDbChecklists(prev => ({
      ...prev,
      [courseId]: (prev[courseId] ?? []).map(i => i.id === item.id ? { ...i, status: next } : i),
    }));
  };

  const handleDeleteChecklistItem = async (itemId: string, courseId: string) => {
    await (supabase as any).from("course_checklists").delete().eq("id", itemId);
    setDbChecklists(prev => ({
      ...prev,
      [courseId]: (prev[courseId] ?? []).filter(i => i.id !== itemId),
    }));
  };

  const selectedAgent = selectedAgentId
    ? (MARKETING_TEAM.find((a) => a.id === selectedAgentId) ?? null)
    : null;

  const viewedAgent = viewingAgentId
    ? (MARKETING_TEAM.find((a) => a.id === viewingAgentId) ?? null)
    : null;

  const vTask = viewedAgent ? client.agentTasks[viewedAgent.id] : null;

  // ── Campaigns tab derived variables ───────────────────────────
  const campList = client.collabCampaigns ?? [];
  const PHASE_AGENT_COLOR: Record<string, string> = {
    strategist: "#FBBF24", copywriter: "#A78BFA", designer: "#D946EF",
    traffic: "#F97316", social: "#60A5FA", sales: "#F59E0B",
    analyst: "#34D399", site: "#06B6D4", revisor: "#EC4899",
    video: "#B9FF4B",
  };
  const REMARK_TYPE_ICON: Record<string, typeof Target> = {
    website: MousePointerClick, video: Film, lookalike: Users,
    email: Mail, custom: Filter,
  };
  const REMARK_TYPE_LABEL: Record<string, string> = {
    website: "Visitantes do site", video: "Vídeo", lookalike: "Lookalike",
    email: "E-mail", custom: "Personalizado",
  };
  const effectiveTask = viewedAgent?.id === "designer" && (designerTask || designerRecentWork.length > 0)
    ? {
        current: designerTask?.prompt ?? designerRecentWork[0] ?? "",
        status: designerTask ? (designerTask.progress < 100 ? "trabalhando" : "concluído") : "concluído",
        recent: designerRecentWork,
        progress: designerTask?.progress ?? 100,
      } as const
    : vTask;
  const effectiveTaskIsWorking = viewedAgent?.id === "designer"
    ? (designerTask !== null && (designerTask?.progress ?? 0) < 100)
    : vTask?.status === "trabalhando";
  const vTaskIsWorking = effectiveTaskIsWorking;
  const vSitePages = viewedAgent?.id === "site" ? (SITE_PAGES[client.id] ?? []) : [];
  const vRevisedFiles = viewedAgent?.id === "revisor" ? (REVISED_FILES[client.id] ?? []) : [];
  const vOutputs = viewedAgent ? (client.outputs ?? []).filter((o) => o.agent === viewedAgent.id) : [];

  const handleAriaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (attachedFileUrl) URL.revokeObjectURL(attachedFileUrl);
    setAttachedFile(file);
    setAttachedFileText(null);
    if (!file) { setAttachedFileUrl(null); return; }
    const url = URL.createObjectURL(file);
    setAttachedFileUrl(url);
    if (file.type.startsWith("text/") || /\.(md|csv|txt)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachedFileText((ev.target?.result as string) ?? null);
      reader.readAsText(file);
    }
  };

  const handleAgentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (agentFileUrl) URL.revokeObjectURL(agentFileUrl);
    setAgentFile(file);
    setAgentFileText(null);
    if (!file) { setAgentFileUrl(null); return; }
    const url = URL.createObjectURL(file);
    setAgentFileUrl(url);
    if (file.type.startsWith("text/") || /\.(md|csv|txt)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = (ev) => setAgentFileText((ev.target?.result as string) ?? null);
      reader.readAsText(file);
    }
  };

  const clearAriaFile = () => {
    if (attachedFileUrl) URL.revokeObjectURL(attachedFileUrl);
    setAttachedFile(null); setAttachedFileUrl(null); setAttachedFileText(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearAgentFile = () => {
    if (agentFileUrl) URL.revokeObjectURL(agentFileUrl);
    setAgentFile(null); setAgentFileUrl(null); setAgentFileText(null);
    if (agentFileRef.current) agentFileRef.current.value = "";
  };

  const handleSendToDesigner = async () => {
    const direction = agentInstruction.trim();
    setAgentInstruction("");
    setMarcelaLoading(true);
    setMarcelaError(null);
    const taskLabel = direction || "Carolina criando autonomamente...";
    const ESTIMATED = 35;
    const startedAt = Date.now();
    setDesignerTask({ prompt: taskLabel, progress: 0, startedAt, estimatedSeconds: ESTIMATED });
    if (designerIntervalRef.current) clearInterval(designerIntervalRef.current);
    designerIntervalRef.current = setInterval(() => {
      setDesignerTask((prev) => {
        if (!prev) return null;
        const elapsed = (Date.now() - prev.startedAt) / 1000;
        const p = Math.min(90, Math.round((elapsed / prev.estimatedSeconds) * 100));
        return { ...prev, progress: p };
      });
    }, 600);

    const clientContext = {
      name: client.name,
      industry: client.industry,
      brandColor: client.color,
      campaigns: client.activeCampaigns?.map((c) => c.name) ?? [],
      recentThemes: client.recentPosts?.map((p) => p.caption.slice(0, 80)) ?? [],
      nextAction: client.nextAction,
    };

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: direction, aspectRatio: normalizeImageAspectRatio(designAspectRatio), clientContext },
      });
      if (designerIntervalRef.current) clearInterval(designerIntervalRef.current);
      if (error) throw error;
      if (!data?.imageData) throw new Error(data?.error ? String(data.error).slice(0, 200) : "Sem imageData na resposta");
      const displayLabel = data.generatedPrompt || direction || "Peça autônoma";
      setDesignerTask((prev) => prev ? { ...prev, progress: 100 } : null);
      setDesignerRecentWork((prev) => [displayLabel, ...prev.slice(0, 4)]);
      setTimeout(() => setDesignerTask(null), 2500);
      const blob = new Blob(
        [Uint8Array.from(atob(data.imageData), (c) => c.charCodeAt(0))],
        { type: data.mimeType ?? "image/png" }
      );
      const blobUrl = URL.createObjectURL(blob);
      setGeneratedImages((prev) => [
        { id: Date.now().toString(), imageData: blobUrl, mimeType: data.mimeType ?? "image/png", prompt: displayLabel, createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
        ...prev,
      ]);
    } catch (err) {
      if (designerIntervalRef.current) clearInterval(designerIntervalRef.current);
      setDesignerTask(null);
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : JSON.stringify(err);
      setMarcelaError(msg);
    } finally {
      setMarcelaLoading(false);
    }
  };

  const renderFilePreview = (file: File, url: string | null, text: string | null, accent: string) => (
    <div className="mt-2 rounded-xl overflow-hidden"
      style={{ border: `1px solid ${accent}20`, background: "rgba(0,0,0,0.25)" }}>
      {file.type.startsWith("image/") && url ? (
        <img src={url} alt={file.name} style={{ width: "100%", maxHeight: 200, objectFit: "contain", display: "block" }} />
      ) : file.type === "application/pdf" && url ? (
        <iframe src={`${url}#toolbar=0&navpanes=0`} title={file.name} style={{ width: "100%", height: 220, border: "none", display: "block" }} />
      ) : text !== null ? (
        <pre style={{ padding: "10px 14px", fontSize: 10, color: "rgba(255,255,255,0.55)", maxHeight: 160, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, fontFamily: "monospace" }}>
          {text.length > 4000 ? text.slice(0, 4000) + "\n\n[...]" : text}
        </pre>
      ) : (
        <div style={{ padding: "10px 14px", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          Pré-visualização não disponível para .{file.name.split(".").pop()?.toUpperCase()}
        </div>
      )}
    </div>
  );

  const toggleTask = (taskId: string) =>
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, done: !t.done } : t));

  const filteredContacts = client.contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.company.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const crmSegments: string[] = ["Todos", ...Array.from(
    new Set(dbContacts.map((c) => c.source).filter(Boolean))
  ).sort()];

  const filteredDbContacts = dbContacts.filter((c) => {
    const matchSegment = activeSegment === "Todos" || c.source === activeSegment;
    const q = contactSearch.toLowerCase();
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q);
    return matchSegment && matchSearch;
  });

  const loadDbContacts = async () => {
    setContactsLoading(true);
    const { data } = await (supabase as any).from("contacts").select("*")
      .eq("client_id", id ?? "")
      .order("created_at", { ascending: false });
    if (data) setDbContacts(data);
    setContactsLoading(false);
  };

  const handleCreateContact = async () => {
    if (!newContactForm.name.trim()) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await (supabase as any).from("contacts").insert({
      user_id: session.user.id,
      client_id: id ?? "",
      name: newContactForm.name,
      email: newContactForm.email || null,
      phone: newContactForm.phone || null,
      company: newContactForm.company || null,
      channel: newContactForm.channel || null,
      status: newContactForm.status,
    });
    if (!error) {
      setShowNewContact(false);
      setNewContactForm({ name: "", email: "", phone: "", company: "", channel: "", status: "Novo" });
      loadDbContacts();
    }
  };

  // ── Agentes Autônomos helpers ──────────────────────────────────
  const fetchSalesAgents = async () => {
    if (!id) return;
    setSalesAgentsLoading(true);
    const { data } = await (supabase as any).from("sales_agents").select("*")
      .eq("client_id", id).order("created_at", { ascending: false });
    if (data) setSalesAgents(data);
    setSalesAgentsLoading(false);
  };

  const saveSalesAgent = async () => {
    if (!id || !salesAgentForm.name.trim() || !salesAgentForm.product_name.trim()) return;
    setSavingSalesAgent(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSavingSalesAgent(false); return; }
    const { error } = await (supabase as any).from("sales_agents").insert({
      client_id: id,
      user_id: session.user.id,
      ...salesAgentForm,
      active: false,
    });
    if (!error) {
      setShowSalesAgentForm(false);
      setSalesAgentForm({ name: "", avatar_color: "#B9FF4B", product_name: "", product_description: "", product_price: "", product_url: "", persona: "", zapi_instance: "", zapi_token: "", zapi_client_token: "" });
      fetchSalesAgents();
      toast.success("Agente criado!");
    } else {
      toast.error("Erro ao criar agente");
    }
    setSavingSalesAgent(false);
  };

  const toggleSalesAgent = async (agentId: string, current: boolean) => {
    await (supabase as any).from("sales_agents").update({ active: !current }).eq("id", agentId);
    setSalesAgents(prev => prev.map(a => a.id === agentId ? { ...a, active: !current } : a));
  };

  const deleteSalesAgent = async (agentId: string) => {
    await (supabase as any).from("sales_agents").delete().eq("id", agentId);
    setSalesAgents(prev => prev.filter(a => a.id !== agentId));
    if (activeConvAgent === agentId) setActiveConvAgent(null);
    toast.success("Agente removido");
  };

  const fetchAgentConvs = async (agentId: string) => {
    const { data } = await (supabase as any).from("agent_conversations").select("*")
      .eq("agent_id", agentId).order("created_at", { ascending: false }).limit(100);
    if (data) setSalesAgentConvs(prev => ({ ...prev, [agentId]: data }));
    setActiveConvAgent(agentId);
  };

  useEffect(() => { if (id) loadDbContacts(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (activeTab === "integrations" && id) fetchSocialIntegrations(); }, [activeTab, id]);
  useEffect(() => { if (activeTab === "courses" && id) loadDbCourses(); }, [activeTab, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === "sales-agents" && id) { fetchSalesAgents(); loadAgentChannelConfig(); loadAgentLogs(); loadSocialAccounts(); } }, [activeTab, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === "agents" && id && !agentChatsLoaded) loadAgentChatsFromDb(); }, [activeTab, id, agentChatsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (id && !clientWpCredsLoaded) loadClientWpCreds(); }, [id, clientWpCredsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOverviewData = async () => {
    if (!id) return;
    setOverviewLoading(true);
    const [postsRes, connRes] = await Promise.all([
      supabase.from("scheduled_posts").select("id,caption,platforms,status,scheduled_at,created_at")
        .eq("client_id", id).order("created_at", { ascending: false }).limit(50),
      supabase.from("social_connections").select("*").eq("client_id", id),
    ]);
    if (postsRes.data) setOverviewPosts(postsRes.data);
    if (connRes.data) setOverviewConnections(connRes.data);
    setOverviewLoading(false);
  };
  useEffect(() => { if (activeTab === "" && id) fetchOverviewData(); }, [activeTab, id]); // eslint-disable-line react-hooks/exhaustive-deps
  const fetchSitePages = async () => {
    if (!id || !client.siteRepo) return;
    setSiteDbPagesLoading(true);
    // Check Supabase first
    const { data: existing } = await (supabase.from as any)('site_pages').select('*').eq('client_id', id).order('page_name');
    if (existing && existing.length > 0) {
      setSiteDbPages(existing);
      setSiteDbPagesLoading(false);
      return;
    }
    // Seed from GitHub via teo-site
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const r = await fetch('https://proldgiyterqhthludlp.supabase.co/functions/v1/teo-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ action: 'list_pages', repo: client.siteRepo }),
      });
      if (r.ok) {
        const json = await r.json();
        const pages: any[] = (json.pages ?? []).map((p: any) => ({
          client_id: id,
          user_id: session?.user?.id ?? null,
          file_path: p.file_path,
          page_name: p.page_name,
          url: p.url,
          status: 'publicado',
          edit_count: 0,
        }));
        if (pages.length > 0) {
          const { data: inserted } = await (supabase.from as any)('site_pages').upsert(pages, { onConflict: 'client_id,file_path' }).select();
          if (inserted) setSiteDbPages(inserted);
        }
      }
    } catch { /* ignore */ }
    setSiteDbPagesLoading(false);
  };
  useEffect(() => { if (activeTab === 'agents' && id && client.siteRepo) fetchSitePages(); }, [activeTab, id, client?.siteRepo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load WordPress site for Pixel tab
  useEffect(() => {
    if (activeTab !== 'pixel') return;
    fetch("http://localhost:8500/api/sites")
      .then(r => r.json())
      .then((sites: any[]) => {
        const matched = sites.find((s: any) => s.client_name?.toLowerCase() === client.name.toLowerCase());
        if (matched) setPixelSite(matched);
      })
      .catch(() => {});
  }, [activeTab, client?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // Injeta contexto do cliente na Calu IA
  useEffect(() => {
    if (!client) return;
    const TAB_NAMES: Record<string, string> = {
      "":           "Visão Geral",
      overview:     "Visão Geral",
      social:       "Redes Sociais",
      portal:       "Portal do Cliente",
      crm:          "CRM",
      sites:        "Sites",
      agents:          "Agentes IA",
      "sales-agents":  "Agentes Autônomos",
      pixel:           "Pixel — WordPress",
      content:         "Conteúdo",
      courses:      "Cursos",
      integrations: "Integrações",
      webhooks:     "Webhooks",
      files:        "Arquivos",
    };
    const b = clientBriefing;
    const briefingLines = b ? [
      b.segmento      && `Segmento: ${b.segmento}`,
      b.produtos      && `Produtos/Serviços: ${b.produtos}`,
      b.clienteIdeal  && `Público-alvo: ${b.clienteIdeal}`,
      b.dorPrincipal  && `Principal dor: ${b.dorPrincipal}`,
      b.diferencial   && `Diferencial: ${b.diferencial}`,
      b.meta90dias    && `Meta 90 dias: ${b.meta90dias}`,
      b.canaisAtivos?.length && `Canais ativos: ${b.canaisAtivos.join(", ")}`,
    ].filter(Boolean).join(" | ") : "";
    const ctx = [
      `Página atual: Workspace do cliente "${client.name}" (${client.industry || (client as any).segment || "—"}).`,
      `Aba ativa: ${TAB_NAMES[activeTab] ?? activeTab}.`,
      briefingLines && `Briefing resumido — ${briefingLines}.`,
    ].filter(Boolean).join(" ");
    setPageContext(ctx);
    return () => clearPageContext();
  }, [client?.id, activeTab, clientBriefing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manter WhatsApp conectado: verifica status ao abrir a aba e a cada 30s
  useEffect(() => {
    if (activeTab !== "integrations" || !id) return;
    checkWpStatus();
    const interval = setInterval(() => { checkWpStatus(); }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  useEffect(() => {
    if (activeTab === "crm" && crmView === "whatsapp" && id) {
      loadWpCreds().then(() => checkWpStatus());
      loadFavoriteGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, crmView, id]);

  const loadPendingPosts = async () => {
    setPendingLoading(true);
    const { data } = await supabase.from("scheduled_posts").select("*")
      .eq("client_id", id ?? "").eq("status", "pending_approval")
      .order("created_at", { ascending: false });
    if (data) setPendingPosts(data);
    setPendingLoading(false);
  };

  useEffect(() => { if (id) loadPendingPosts(); }, [id]);

  const loadProposals = async () => {
    if (!id) return;
    setProposalsLoading(true);
    const { data } = await (supabase as any).from("agent_proposals").select("*")
      .eq("client_id", id).neq("status", "rejected")
      .order("created_at", { ascending: false });
    if (data) setAgentProposals(data);
    setProposalsLoading(false);
  };

  useEffect(() => { if (id) loadProposals(); }, [id]);

  const loadDeliverables = async () => {
    if (!id) return;
    setDelivLoading(true);
    const { data } = await (supabase as any).from("client_deliverables").select("*").eq("client_id", id).order("done_at", { ascending: false });
    if (data) setDeliverables(data);
    setDelivLoading(false);
  };

  const saveDeliverable = async (category: string, title: string, description: string, doneAt: string, visible: boolean, status: string) => {
    if (!id || !title.trim()) return;
    setSavingDeliv(true);
    const { data } = await (supabase as any).from("client_deliverables").insert({
      client_id: id, category,
      title: title.trim(),
      description: description.trim(),
      done_at: doneAt,
      visible_to_client: visible,
      status,
    }).select().single();
    if (data) setDeliverables((prev) => [data, ...prev]);
    setSavingDeliv(false);
    setDelivForm({ title: "", category: "", description: "", done_at: new Date().toISOString().slice(0, 10), visible_to_client: true, status: "completed" });
  };

  const toggleDelivVisible = async (delivId: string, current: boolean) => {
    await (supabase as any).from("client_deliverables").update({ visible_to_client: !current }).eq("id", delivId);
    setDeliverables((prev) => prev.map((d) => d.id === delivId ? { ...d, visible_to_client: !current } : d));
  };

  const deleteDeliv = async (delivId: string) => {
    await (supabase as any).from("client_deliverables").delete().eq("id", delivId);
    setDeliverables((prev) => prev.filter((d) => d.id !== delivId));
  };

  useEffect(() => { if (id) loadDeliverables(); }, [id]);

  // Fetch Supabase client UUID — picks the oldest row with a portal_token for this workspace
  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      // Fetch all rows for this workspace, prefer ones that already have a portal_token
      const { data: rows } = await (supabase as any).from("clients")
        .select("id, workspace_id, portal_token")
        .eq("user_id", user.id)
        .eq("workspace_id", id)
        .order("created_at", { ascending: true });

      let row: { id: string } | null = null;
      if (rows && rows.length > 0) {
        // Prefer a row that has a portal_token (meaning the portal was opened before)
        row = rows.find((r: any) => r.portal_token) ?? rows[0];
      }

      // Fallback: look up by name (in case workspace_id was never backfilled)
      if (!row) {
        const { data: byName } = await (supabase as any).from("clients")
          .select("id, workspace_id, portal_token")
          .eq("user_id", user.id)
          .ilike("name", client.name)
          .order("created_at", { ascending: true })
          .limit(1);
        if (byName?.[0]?.id) {
          await (supabase as any).from("clients").update({ workspace_id: id }).eq("id", byName[0].id);
          row = byName[0];
        }
      }

      if (row?.id) setPortalClientUUID(row.id);
    })();
  }, [id, user?.id]);

  const loadPortalContent = async (uuid: string) => {
    setPortalLoading(true);
    const [{ data: ob }, { data: dem }] = await Promise.all([
      (supabase as any).from("client_onboarding").select("*").eq("client_id", uuid).order("order_index"),
      (supabase as any).from("client_demands").select("*").eq("client_id", uuid).neq("status", "cancelled").order("created_at", { ascending: false }),
    ]);
    if (ob) setPortalOnboarding(ob);
    if (dem) setPortalDemands(dem);
    setPortalLoading(false);
  };

  useEffect(() => { if (portalClientUUID) loadPortalContent(portalClientUUID); }, [portalClientUUID]);

  const saveOnboardItem = async () => {
    if (!portalClientUUID || !onboardForm.title.trim() || !user) return;
    setSavingOnboard(true);
    const maxOrder = portalOnboarding.reduce((m, i) => Math.max(m, i.order_index ?? 0), 0);
    const { data, error } = await (supabase as any).from("client_onboarding").insert({
      client_id: portalClientUUID, user_id: user.id,
      title: onboardForm.title.trim(), description: onboardForm.description.trim() || null,
      responsible: onboardForm.responsible, category: onboardForm.category,
      status: "pending", order_index: maxOrder + 1,
    }).select().single();
    if (!error && data) { setPortalOnboarding((p) => [...p, data]); setOnboardForm({ title: "", description: "", responsible: "agency", category: "geral" }); }
    setSavingOnboard(false);
  };

  const toggleOnboardStatus = async (itemId: string, current: string) => {
    const next = current === "completed" ? "pending" : "completed";
    const patch: any = { status: next };
    if (next === "completed") patch.completed_at = new Date().toISOString();
    await (supabase as any).from("client_onboarding").update(patch).eq("id", itemId);
    setPortalOnboarding((p) => p.map((i) => i.id === itemId ? { ...i, ...patch } : i));
  };

  const deleteOnboardItem = async (itemId: string) => {
    await (supabase as any).from("client_onboarding").delete().eq("id", itemId);
    setPortalOnboarding((p) => p.filter((i) => i.id !== itemId));
  };

  const ONBOARD_AGENT: Record<string, { name: string; role: string; color: string }> = {
    geral:         { name: "Luna",    role: "Orquestradora Geral da Calu Agência",          color: "#B9FF4B" },
    redes_sociais: { name: "Marina",  role: "Social Media Specialist da Calu Agência",      color: "#60A5FA" },
    acessos:       { name: "Lia",     role: "Agente de Diagnóstico e Onboarding",           color: "#38BDF8" },
    configuracao:  { name: "Lia",     role: "Agente de Diagnóstico e Onboarding",           color: "#38BDF8" },
    documentos:    { name: "Beatriz", role: "Copywriter da Calu Agência",                   color: "#A78BFA" },
  };

  const answerOnboardItem = async (item: any) => {
    if (answeringOnboard) return;
    setAnsweringOnboard(item.id);
    await (supabase as any).from("client_onboarding").update({ status: "in_progress" }).eq("id", item.id);
    setPortalOnboarding(p => p.map(i => i.id === item.id ? { ...i, status: "in_progress" } : i));
    const b = clientBriefing as any;
    const ctx = b
      ? `Segmento: ${b.segmento || client.industry}\nPúblico-alvo: ${b.clienteIdeal || "não informado"}\nPlataformas: ${b.canaisAtivos?.join(", ") || "não informado"}\nDiferenciais: ${b.diferencial || "não informado"}\nMeta 90 dias: ${b.meta90dias || "não informado"}`
      : `Segmento: ${client.industry}`;
    const agent = ONBOARD_AGENT[item.category] ?? ONBOARD_AGENT.geral;
    try {
      const { data: res } = await supabase.functions.invoke("chat-ai", {
        body: {
          systemPrompt: `Você é ${agent.name}, ${agent.role}.

REGRA ABSOLUTA: Use SOMENTE as informações do briefing fornecido abaixo. NUNCA invente métricas, números, propostas, leads, resultados, CRM, campanhas ativas ou qualquer dado que não foi explicitamente informado. Se algo ainda não existe na plataforma, descreva o que SERÁ feito — nunca finja que já está feito ou que já existe.

Responda a tarefa de onboarding com um plano de ação direto: o que vai ser executado, como e em qual ordem. Sem dados inventados.

Português brasileiro. Máximo 200 palavras.`,
          maxTokens: 500,
          messages: [{ role: "user", content: `Cliente: ${client.name}\n${ctx}\n\nTarefa de onboarding a ser executada:\nTítulo: "${item.title}"${item.description ? `\nDescrição: "${item.description}"` : ""}\n\nDescreva o que você vai fazer para concluir esta tarefa. Use somente o que está no briefing. Não invente dados, números ou situações que não existem.` }],
        },
      });
      const answer = res?.content?.trim() || "Sem resposta gerada.";
      const patch = { notes: answer, status: "completed", completed_at: new Date().toISOString() };
      await (supabase as any).from("client_onboarding").update(patch).eq("id", item.id);
      setPortalOnboarding(p => p.map(i => i.id === item.id ? { ...i, ...patch } : i));
      setExpandedNotes(prev => new Set([...prev, item.id]));
    } catch {
      await (supabase as any).from("client_onboarding").update({ status: "pending" }).eq("id", item.id);
      setPortalOnboarding(p => p.map(i => i.id === item.id ? { ...i, status: "pending" } : i));
    } finally {
      setAnsweringOnboard(null);
    }
  };

  const answerAllOnboard = async () => {
    const pending = portalOnboarding.filter(i => i.responsible === "agency" && i.status === "pending");
    if (!pending.length) return;
    setAnsweringAll(true);
    for (const item of pending) {
      await answerOnboardItem(item);
    }
    setAnsweringAll(false);
  };

  const DEMAND_STATUS_CYCLE = ["pending", "in_progress", "waiting_client", "completed"] as const;
  const DEMAND_STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
    pending:        { label: "Pendente",          color: "#888",    bg: "rgba(0,0,0,0.05)" },
    in_progress:    { label: "Em andamento",      color: "#3B82F6", bg: "#EFF6FF" },
    waiting_client: { label: "Aguardando você",   color: "#F97316", bg: "#FFF7ED" },
    completed:      { label: "Concluído",          color: "#22C55E", bg: "#F0FDF4" },
  };

  const saveDemandItem = async () => {
    if (!portalClientUUID || !demandForm.title.trim() || !user) return;
    setSavingDemand(true);
    const agent = WS_AGENTS.find(a => a.id === demandForm.agent) ?? WS_AGENTS[0];
    const { data, error } = await (supabase as any).from("client_demands").insert({
      client_id: portalClientUUID, user_id: user.id,
      title: demandForm.title.trim(), description: demandForm.description.trim() || null,
      responsible: demandForm.responsible, priority: demandForm.priority,
      type: "task", status: "pending",
      due_date: demandForm.due_date ? new Date(demandForm.due_date).toISOString() : null,
      agents: [{ id: agent.id, name: agent.name, color: agent.color }],
    }).select().single();
    if (!error && data) {
      setPortalDemands((p) => [{ ...data, activities: [] }, ...p]);
      setDemandForm({ title: "", description: "", responsible: "agency", priority: "medium", due_date: "", agent: "luna" });
      setShowDemandFormPortal(false);
    }
    setSavingDemand(false);
  };

  const saveEditDemand = async () => {
    if (!editingDemand) return;
    const { id, field, value } = editingDemand;
    await (supabase as any).from("client_demands").update({ [field]: value.trim() || null }).eq("id", id);
    setPortalDemands(p => p.map(d => d.id === id ? { ...d, [field]: value.trim() } : d));
    setEditingDemand(null);
  };

  const cycleDemandStatus = async (demId: string, current: string) => {
    const idx = DEMAND_STATUS_CYCLE.indexOf(current as any);
    const next = DEMAND_STATUS_CYCLE[(idx + 1) % DEMAND_STATUS_CYCLE.length];
    await (supabase as any).from("client_demands").update({ status: next }).eq("id", demId);
    setPortalDemands(p => p.map(d => d.id === demId ? { ...d, status: next } : d));
  };

  const generateDemandsWithAI = async () => {
    if (!portalClientUUID || !user) return;
    setGeneratingDemands(true);

    const briefingBlock = buildBriefingBlock();
    const clientCtx = `Cliente: ${client?.name} | Segmento: ${clientBriefing?.segmento || client?.industry || "–"}${client?.teamInstructions ? `\nInstruções permanentes: ${client.teamInstructions}` : ""}`;

    const systemPrompt = `Você é a ARIA, orquestradora estratégica da Calu Agência de Marketing Digital.
Analise o briefing do cliente e distribua as demandas do próximo ciclo (30 dias) entre os agentes especialistas do time.

Agentes disponíveis e suas especialidades:
- queila: estratégia de conteúdo, copywriting, pauta editorial, posicionamento de marca
- beatriz: design gráfico, identidade visual, criação de artes e peças visuais
- rafaela: tráfego pago, campanhas Meta Ads / Google Ads, performance
- marina: social media, publicação orgânica, gestão de redes sociais
- lia: diagnóstico, automações, inteligência artificial, relatórios
- luna: orquestração geral, planejamento estratégico, onboarding`;

    const userMsg = `${clientCtx}${briefingBlock}

Crie entre 4 e 8 demandas concretas para o próximo mês, cada uma atribuída ao agente correto.

Retorne SOMENTE um array JSON válido, sem texto antes ou depois:
[
  {
    "title": "título curto e claro (máx 60 chars)",
    "description": "o que será entregue e qual resultado o cliente verá",
    "agent": "queila",
    "priority": "high",
    "due_days": 7
  }
]

Regras:
- agent: use exatamente um dos IDs: queila, beatriz, rafaela, marina, lia, luna
- Atribua cada tarefa ao agente cuja especialidade melhor se encaixa
- due_days: prazo realista em dias corridos a partir de hoje
- priority: "low", "medium" ou "high"
- description: 1–2 frases concretas do que será feito e o que o cliente receberá`;

    try {
      const { data: res } = await supabase.functions.invoke("chat-ai", {
        body: {
          systemPrompt,
          messages: [{ role: "user", content: userMsg }],
          maxTokens: 2000,
          stream: false,
        },
      });
      const content: string = res?.content ?? res?.text ?? "";
      const match = content.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("JSON não encontrado");
      const demands: any[] = JSON.parse(match[0]);

      let created = 0;
      for (const dem of demands) {
        const agent = WS_AGENTS.find(a => a.id === dem.agent) ?? WS_AGENTS[0];
        const dueDate = dem.due_days ? new Date(Date.now() + dem.due_days * 86400000).toISOString() : null;
        const agentEntry = { id: agent.id, name: agent.name, color: agent.color };
        const { data: row } = await (supabase as any).from("client_demands").insert({
          client_id: portalClientUUID, user_id: user.id,
          title: dem.title, description: dem.description || null,
          responsible: "agency", priority: dem.priority || "medium",
          type: "task", status: "in_progress", due_date: dueDate,
          agents: [agentEntry],
        }).select().single();
        if (row) { setPortalDemands(p => [...p, { ...row, activities: [] }]); created++; }
      }
      toast.success(`${created} demanda${created !== 1 ? "s" : ""} gerada${created !== 1 ? "s" : ""} com IA!`);
    } catch {
      toast.error("Erro ao gerar demandas. Tente novamente.");
    }
    setGeneratingDemands(false);
  };

  const WS_AGENTS = [
    { id: "luna",    name: "Luna",    color: "#B9FF4B" },
    { id: "queila",  name: "Queila",  color: "#FBBF24" },
    { id: "beatriz", name: "Beatriz", color: "#A78BFA" },
    { id: "marina",  name: "Marina",  color: "#60A5FA" },
    { id: "rafaela", name: "Rafaela", color: "#F97316" },
    { id: "lia",     name: "Lia",     color: "#38BDF8" },
  ];

  const loadDemandActivities = async (demandId: string) => {
    const { data } = await (supabase as any).from("demand_activities").select("*").eq("demand_id", demandId).order("created_at", { ascending: true });
    if (data) setDemandActivities(p => ({ ...p, [demandId]: data }));
  };

  const addDemandActivity = async (demandId: string, agentName: string, agentColor: string) => {
    const content = (activityInputs[demandId] ?? "").trim();
    if (!content) return;
    setSavingActivity(demandId);
    const { data: row } = await (supabase as any).from("demand_activities").insert({ demand_id: demandId, content, agent_name: agentName, agent_color: agentColor }).select().single();
    if (row) {
      setDemandActivities(p => ({ ...p, [demandId]: [...(p[demandId] ?? []), row] }));
      setActivityInputs(p => ({ ...p, [demandId]: "" }));
    }
    setSavingActivity(null);
  };

  const assignAgentToDemand = async (demand: any, agent: { id: string; name: string; color: string }) => {
    const current: any[] = Array.isArray(demand.agents) ? demand.agents : [];
    const alreadyIn = current.some((a: any) => a.id === agent.id);
    const next = alreadyIn ? current.filter((a: any) => a.id !== agent.id) : [...current, agent];
    await (supabase as any).from("client_demands").update({ agents: next }).eq("id", demand.id);
    setPortalDemands(p => p.map(d => d.id === demand.id ? { ...d, agents: next } : d));
  };

  const updateDemandDueDate = async (demandId: string, value: string) => {
    const iso = value ? new Date(value).toISOString() : null;
    await (supabase as any).from("client_demands").update({ due_date: iso }).eq("id", demandId);
    setPortalDemands(p => p.map(d => d.id === demandId ? { ...d, due_date: iso } : d));
  };

  const toggleDemandStatus = async (demId: string, current: string) => {
    const next = current === "completed" ? "pending" : "completed";
    await (supabase as any).from("client_demands").update({ status: next }).eq("id", demId);
    setPortalDemands((p) => p.map((d) => d.id === demId ? { ...d, status: next } : d));
  };

  const deleteDemandItem = async (demId: string) => {
    await (supabase as any).from("client_demands").delete().eq("id", demId);
    setPortalDemands((p) => p.filter((d) => d.id !== demId));
  };

  // Check if client submitted a briefing via the shareable link
  useEffect(() => {
    if (!id || clientBriefing) return;
    (async () => {
      const { data } = await (supabase as any).from("lia_submissions" as any)
        .select("briefing_text, submitted_at")
        .eq("client_id", id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.briefing_text) {
        const syntheticBriefing = { empresa: client.name, segmento: client.industry, produtos: data.briefing_text.slice(0, 500) };
        localStorage.setItem(`client-briefing-${id}`, JSON.stringify(syntheticBriefing));
        localStorage.setItem(`client-briefing-raw-${id}`, data.briefing_text.slice(0, 5000));
        setClientBriefing(syntheticBriefing);
        toast.success("Briefing enviado pelo cliente disponível!");
      }
    })();
  }, [id]);

  // Auto-sync localStorage briefing → Supabase client_briefings
  useEffect(() => {
    if (!portalClientUUID || !user?.id || !clientBriefing) return;
    (async () => {
      const { data: existing } = await (supabase as any)
        .from("client_briefings").select("id, completeness_score")
        .eq("client_id", portalClientUUID).maybeSingle();

      const b = clientBriefing as any;

      // Enrich sparse briefings (paste-mode) from raw text via AI extraction
      let enriched = { ...b };
      const rawText = (() => { try { return localStorage.getItem(`client-briefing-raw-${id}`) || ""; } catch { return ""; } })();
      if (rawText && (!b.clienteIdeal || !b.canaisAtivos?.length || !b.diferencial)) {
        try {
          const { data: extractRes } = await supabase.functions.invoke("chat-ai", {
            body: {
              systemPrompt: "Extrator de briefing. Retorne SOMENTE JSON válido sem markdown.",
              maxTokens: 600,
              messages: [{
                role: "user",
                content: `Extraia do texto abaixo em JSON. Use null se não encontrado.\n{"target_audience":null,"active_platforms":[],"post_frequency":null,"differentials":null,"goals":[],"brand_voice":null,"main_pain":null}\n\nTEXTO:\n${rawText.slice(0, 3000)}`,
              }],
            },
          });
          const rawJson = extractRes?.content ?? "";
          const match = rawJson.match(/\{[\s\S]*\}/);
          if (match) {
            const ext = JSON.parse(match[0]);
            if (ext.target_audience) enriched.clienteIdeal = ext.target_audience;
            if (ext.active_platforms?.length) enriched.canaisAtivos = ext.active_platforms;
            if (ext.post_frequency) enriched.frequencia = ext.post_frequency;
            if (ext.differentials) enriched.diferencial = ext.differentials;
            if (ext.goals?.[0]) enriched.meta90dias = ext.goals[0];
            if (ext.main_pain) enriched.dorPrincipal = ext.main_pain;
          }
        } catch {}
      }

      const budgetMap: Record<string, number> = {
        "Até R$ 1.000/mês": 1000, "R$ 1.000–3.000/mês": 2000,
        "R$ 3.000–7.000/mês": 5000, "R$ 7.000–15.000/mês": 11000,
        "Acima de R$ 15.000/mês": 15000,
      };
      const audience = enriched.clienteIdeal
        ? `${enriched.clienteIdeal}${enriched.faixaEtaria ? ` (${enriched.faixaEtaria})` : ""}` : null;
      const comps = enriched.concorrentes
        ? enriched.concorrentes.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean) : [];
      const goals = enriched.meta90dias ? [enriched.meta90dias] : [];
      const notes = [enriched.dorPrincipal, enriched.preocupacoes, enriched.jaTentou].filter(Boolean).join("\n\n") || null;
      const required = [enriched.empresa || client.name, enriched.segmento, audience, goals.length > 0,
        (enriched.canaisAtivos?.length ?? 0) > 0, enriched.frequencia, enriched.diferencial];
      const score = Math.round((required.filter(Boolean).length / (required.length + 1)) * 100);

      if (existing?.completeness_score >= score) return; // existing data is already as good or better

      const missing: string[] = [];
      if (!enriched.segmento)              missing.push("segment");
      if (!audience)                       missing.push("target_audience");
      missing.push("brand_voice");
      if (!goals.length)                   missing.push("goals");
      if (!enriched.canaisAtivos?.length)  missing.push("active_platforms");
      if (!enriched.frequencia)            missing.push("post_frequency");
      if (!enriched.diferencial)           missing.push("differentials");
      const payload: any = {
        client_id: portalClientUUID, user_id: user.id,
        brand_name: enriched.empresa || client.name,
        segment: enriched.segmento || null, target_audience: audience,
        competitors: comps, goals, active_platforms: enriched.canaisAtivos || [],
        monthly_budget: budgetMap[enriched.budgetMarketing] ?? null,
        post_frequency: enriched.frequencia || null, differentials: enriched.diferencial || null,
        notes, completeness_score: score, missing_fields: missing,
        updated_at: new Date().toISOString(),
      };
      if (existing?.id) {
        const { client_id: _c, user_id: _u, ...upd } = payload;
        await (supabase as any).from("client_briefings").update(upd).eq("id", existing.id);
      } else {
        await (supabase as any).from("client_briefings").insert(payload);
      }
    })();
  }, [portalClientUUID, user?.id]);

  const handleApproveProposal = async (proposalId: string) => {
    setApprovingProposalId(proposalId);
    const proposal = agentProposals.find(p => p.id === proposalId);
    await (supabase as any).from("agent_proposals").update({ status: "approved" }).eq("id", proposalId);

    // Auto-create demand when proposal is approved
    if (proposal && portalClientUUID && user?.id) {
      const agents = [{ id: proposal.agent_id, name: proposal.agent_name, color: proposal.agent_color }];
      const { data: newDemand } = await (supabase as any).from("client_demands").insert({
        client_id: portalClientUUID,
        user_id: user.id,
        title: proposal.titulo,
        description: proposal.descricao,
        type: "agent",
        responsible: "agency",
        status: "in_progress",
        priority: "high",
        agents,
      }).select().single();
      if (newDemand?.id) {
        // Agent estimates delivery days autonomously
        let dueDateIso: string | null = null;
        try {
          const { data: estRes } = await supabase.functions.invoke("chat-ai", {
            body: {
              systemPrompt: "Gerente de projetos de marketing. Retorne SOMENTE um número inteiro (dias corridos necessários, mínimo 1, máximo 60).",
              maxTokens: 8,
              messages: [{ role: "user", content: `Tarefa: ${proposal.titulo}\nDescrição: ${proposal.descricao}\nQuantos dias para concluir?` }],
            },
          });
          const days = Math.min(60, Math.max(1, parseInt((estRes?.content ?? "7").replace(/\D/g, "")) || 7));
          const due = new Date();
          due.setDate(due.getDate() + days);
          dueDateIso = due.toISOString();
          await (supabase as any).from("client_demands").update({ due_date: dueDateIso }).eq("id", newDemand.id);
        } catch {}

        await (supabase as any).from("demand_activities").insert({
          demand_id: newDemand.id,
          content: "Proposta aprovada. Execução iniciada.",
          agent_name: proposal.agent_name,
          agent_color: proposal.agent_color,
        });
        setPortalDemands(prev => [{ ...newDemand, agents, due_date: dueDateIso, activities: [] }, ...prev]);
        toast.success(`Demanda criada para ${proposal.agent_name}`);
      }
    }

    setAgentProposals(prev => prev.filter(p => p.id !== proposalId));
    setApprovingProposalId(null);
  };

  const handleRejectProposal = async (proposalId: string) => {
    await (supabase as any).from("agent_proposals").update({ status: "rejected" }).eq("id", proposalId);
    setAgentProposals(prev => prev.filter(p => p.id !== proposalId));
  };

  const saveAgentProposal = async () => {
    if (!agentForm.titulo.trim()) return;
    setSavingAgent(true);
    try {
      const { data: row } = await (supabase as any).from("agent_proposals").insert({
        client_id: id,
        agent_id: agentForm.agent_id,
        agent_name: agentForm.agent_name,
        agent_color: agentForm.agent_color,
        titulo: agentForm.titulo,
        descricao: agentForm.descricao,
        status: "pending",
      }).select().single();
      if (row) setAgentProposals(prev => [row, ...prev]);
      setAgentForm({ agent_id: "luna", agent_name: "Luna", agent_color: "#B9FF4B", titulo: "", descricao: "" });
      setShowAgentForm(false);
      toast.success("Proposta criada!");
    } catch { toast.error("Erro ao criar proposta."); }
    setSavingAgent(false);
  };

  const fetchAiPortalSuggestions = async () => {
    setAiPortalLoading(true);
    setAiPortalSuggestions(null);
    try {
      const briefingCtx = buildBriefingBlock();
      const existingCtx = [
        portalOnboarding.length ? `Onboarding já tem ${portalOnboarding.length} item(s).` : "",
        deliverables.length ? `Entregas já registradas: ${deliverables.length}.` : "",
        agentProposals.length ? `Propostas existentes: ${agentProposals.map(p => p.titulo).join(", ")}.` : "",
        portalDemands.length ? `Demandas existentes: ${portalDemands.map(d => d.title).join(", ")}.` : "",
      ].filter(Boolean).join(" ");

      const prompt = `Cliente: ${client.name} (${client.industry}).${briefingCtx}

${existingCtx ? `Contexto atual do portal: ${existingCtx}` : ""}

Sugira conteúdo novo e relevante para o portal deste cliente. Responda APENAS com JSON válido neste formato exato (sem markdown, sem texto antes ou depois):
{
  "onboarding": [
    { "title": "...", "category": "redes_sociais", "responsible": "agency" }
  ],
  "entregas": [
    { "description": "...", "category": "social" }
  ],
  "propostas": [
    { "titulo": "...", "agent_id": "luna", "agent_name": "Luna", "agent_color": "#B9FF4B", "descricao": "..." }
  ],
  "demandas": [
    { "title": "...", "responsible": "agency", "priority": "medium" }
  ]
}

Regras:
- Sugira 3-5 itens por seção, específicos para o nicho e momento do cliente
- onboarding.category: "geral" | "redes_sociais" | "acessos" | "configuracao" | "documentos"
- onboarding.responsible: "agency" | "client"
- entregas.category: "social" | "story" | "video" | "arte" | "copy" | "email" | "relatorio" | "reuniao" | "trafego" | "calendario" | "estrategia" | "outro"
- propostas.agent_id: "luna" | "queila" | "beatriz" | "marcela" | "rafaela" | "marina" | "pedro" | "lucas" | "teo" | "bobby"
- Escolha o agente mais adequado para cada proposta
- demandas.priority: "low" | "medium" | "high"
- Não repita itens que já existem`;

      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: {
          messages: [{ role: "user", content: prompt }],
          maxTokens: 2000,
          systemPrompt: "Você é um assistente de agência de marketing. Responda APENAS com JSON válido, sem markdown, sem explicações.",
        },
      });
      if (error) throw error;
      const raw = (data?.content ?? "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
      const parsed = JSON.parse(raw);
      setAiPortalSuggestions(parsed);
    } catch (e) {
      toast.error("Erro ao gerar sugestões. Tente novamente.");
    }
    setAiPortalLoading(false);
  };

  const handleApprove = async (postId: string) => {
    setApprovingId(postId);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setApprovingId(null); return; }
    const { data, error } = await supabase.functions.invoke("smm", {
      body: { action: "approve-post", post_id: postId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error || data?.error) {
      alert(data?.error ?? "Erro ao aprovar.");
    } else {
      if (data?.linkedin_intent_url) window.open(data.linkedin_intent_url, "_blank");
      loadPendingPosts();
    }
    setApprovingId(null);
  };

  const handleReject = async (postId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setRejectingId(postId);
    await supabase.functions.invoke("smm", {
      body: { action: "reject-post", post_id: postId, reason: rejectReason },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    setShowRejectModal(null);
    setRejectReason("");
    setRejectingId(null);
    loadPendingPosts();
  };

  const handleGenerateDraft = async () => {
    if (!draftForm.topic.trim() || !draftForm.platforms.length) return;
    setGeneratingDraft(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setGeneratingDraft(false); return; }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-crm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": anonKey },
      body: JSON.stringify({
        action: "generate-draft",
        client_id: id,
        client_name: client.name,
        platforms: draftForm.platforms,
        tone: draftForm.tone,
        topic: draftForm.topic,
        agent_id: draftAgent?.id,
        agent_name: draftAgent?.name,
      }),
    });
    const data = await res.json();
    if (data?.error) { alert(data.error); }
    else {
      setShowDraftModal(false);
      setDraftForm({ platforms: [], tone: "profissional e envolvente", topic: "" });
      setCrmView("approvals");
      loadPendingPosts();
    }
    setGeneratingDraft(false);
  };

  const loadInsights = async () => {
    setInsightsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setInsightsLoading(false); return; }
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
    const res = await fetch(`${supabaseUrl}/functions/v1/ai-crm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}`, "apikey": anonKey },
      body: JSON.stringify({ action: "analyze-performance", client_id: id }),
    });
    const data = await res.json();
    if (!data?.error) setInsights(data);
    setInsightsLoading(false);
  };

  useEffect(() => { if (crmView === "insights" && !insights) loadInsights(); }, [crmView]);

  const pipelineValue = client.pipeline.reduce((sum, d) => {
    const n = parseFloat(d.value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    return sum + n;
  }, 0);

  const wonDeals = client.pipeline.filter((d) => d.stage === "ganho").length;
  const winRate = client.pipeline.length > 0
    ? Math.round((wonDeals / client.pipeline.length) * 100)
    : 0;

  // Shared helper: finds the canonical Supabase client row for this workspace
  const findOrCreatePortalRow = async () => {
    const { data: rows } = await (supabase as any)
      .from("clients")
      .select("id, portal_token, portal_password, workspace_id")
      .eq("user_id", user!.id)
      .eq("workspace_id", id)
      .order("created_at", { ascending: true });

    if (rows && rows.length > 0) {
      // Pick the row that already has a portal_token; otherwise the oldest one
      return (rows.find((r: any) => r.portal_token) ?? rows[0]) as any;
    }

    // No row with workspace_id — create one
    const { data: created } = await (supabase as any)
      .from("clients")
      .insert({ user_id: user!.id, name: client.name, segment: client.industry ?? null, status: "active", workspace_id: id } as any)
      .select("id, portal_token, portal_password, workspace_id")
      .single();
    return created;
  };

  const handleOpenPortal = async () => {
    if (!user) { toast.error("Você precisa estar logado."); return; }
    setOpeningPortal(true);
    try {
      const row = await findOrCreatePortalRow();
      if (!row?.portal_token) { toast.error("Erro ao gerar link do portal."); return; }
      window.open(`/portal/${row.portal_token}`, "_blank");
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleOpenShareModal = async () => {
    if (!user) { toast.error("Você precisa estar logado."); return; }
    setOpeningShare(true);
    try {
      const row = await findOrCreatePortalRow();
      if (!row?.portal_token) { toast.error("Erro ao gerar link do portal."); return; }
      setSharePortalToken(row.portal_token);
      setSharePasswordInput(row.portal_password ?? "");
      setSharePasswordSaved(false);
      setShareCopied(false);
      setShowShareModal(true);
    } finally {
      setOpeningShare(false);
    }
  };

  const handleSaveSharePassword = async () => {
    if (!user) return;
    setSavingSharePassword(true);
    try {
      await (supabase as any)
        .from("clients")
        .update({ portal_password: sharePasswordInput.trim() || null })
        .eq("user_id", user.id)
        .eq("workspace_id", id);
      setSharePasswordSaved(true);
      setTimeout(() => setSharePasswordSaved(false), 3000);
    } catch { toast.error("Erro ao salvar senha."); }
    finally { setSavingSharePassword(false); }
  };

  return (
    <div className="min-h-full flex flex-col text-white" style={{ background: "#080810" }}>

      {/* ── Top info bar ── */}
      {/* ── Top info bar ── */}
      <div className="flex items-center gap-2 sm:gap-4 px-4 sm:px-8 py-3 flex-shrink-0 flex-wrap"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,8,16,0.95)" }}>
        <div className="flex items-center gap-3 sm:gap-4 text-xs flex-wrap" style={{ color: "rgba(255,255,255,0.35)" }}>
          <div className="flex items-center gap-1.5 whitespace-nowrap"><Instagram className="w-3.5 h-3.5" /> {client.followers.instagram}</div>
          <div className="flex items-center gap-1.5 whitespace-nowrap"><Facebook className="w-3.5 h-3.5" /> {client.followers.facebook}</div>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#FBBF24"; e.currentTarget.style.borderColor = "rgba(251,191,36,0.3)"; e.currentTarget.style.background = "rgba(251,191,36,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
            <RefreshCw className="w-3 h-3" /> Limpar dados
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#F87171"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)"; e.currentTarget.style.background = "rgba(248,113,113,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
            <Trash2 className="w-3 h-3" /> Excluir cliente
          </button>
          <button
            onClick={openEditClient}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.09)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}>
            <Pencil className="w-3 h-3" /> Editar cliente
          </button>
          <button onClick={handleOpenPortal} disabled={openingPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: `${client.color}18`, color: client.color, border: `1px solid ${client.color}30`, opacity: openingPortal ? 0.6 : 1 }}>
            {openingPortal
              ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              : <ExternalLink className="w-3 h-3" />}
            Ver portal do cliente
          </button>
          <button onClick={handleOpenShareModal} disabled={openingShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "rgba(185,255,75,0.08)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)", opacity: openingShare ? 0.6 : 1 }}>
            {openingShare
              ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              : <Link2 className="w-3 h-3" />}
            Compartilhar
          </button>
        </div>

        {/* ── Modal: Compartilhar Portal ── */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowShareModal(false); }}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl p-6 space-y-5"
                style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.09)" }}>

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">Compartilhar Portal</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{client.name}</div>
                  </div>
                  <button onClick={() => setShowShareModal(false)} style={{ color: "rgba(255,255,255,0.3)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Link */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Link do portal</div>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-xl px-3 py-2.5 text-xs font-mono truncate"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)" }}>
                      caluagencia.com.br/portal/{sharePortalToken}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://www.caluagencia.com.br/portal/${sharePortalToken}`);
                        setShareCopied(true);
                        setTimeout(() => setShareCopied(false), 2000);
                      }}
                      className="px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                      style={{ background: shareCopied ? "rgba(185,255,75,0.12)" : "rgba(185,255,75,0.08)", color: shareCopied ? "#B9FF4B" : "#B9FF4B", border: `1px solid ${shareCopied ? "rgba(185,255,75,0.4)" : "rgba(185,255,75,0.2)"}` }}>
                      {shareCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                      {shareCopied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>

                {/* Copy link with password */}
                {sharePasswordInput.trim() && sharePasswordSaved && (
                  <button
                    onClick={() => {
                      const url = `https://www.caluagencia.com.br/portal/${sharePortalToken}#${encodeURIComponent(sharePasswordInput.trim())}`;
                      navigator.clipboard.writeText(url);
                      setShareCopiedWithPwd(true);
                      setTimeout(() => setShareCopiedWithPwd(false), 2000);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: shareCopiedWithPwd ? "rgba(185,255,75,0.15)" : "rgba(185,255,75,0.06)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.25)" }}>
                    {shareCopiedWithPwd ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                    {shareCopiedWithPwd ? "Copiado!" : "Copiar link com senha incluída"}
                  </button>
                )}

                {/* Password */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Senha de acesso <span style={{ color: "rgba(255,255,255,0.2)" }}>(opcional)</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showSharePwd ? "text" : "password"}
                        value={sharePasswordInput}
                        onChange={(e) => setSharePasswordInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveSharePassword(); }}
                        placeholder="Deixe em branco para acesso livre"
                        className="w-full rounded-xl px-3 py-2.5 pr-9 text-xs outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0" }}
                      />
                      <button type="button" onClick={() => setShowSharePwd(p => !p)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2"
                        style={{ color: "rgba(255,255,255,0.3)" }}>
                        {showSharePwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button onClick={handleSaveSharePassword} disabled={savingSharePassword}
                      className="px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                      style={{ background: "#B9FF4B", color: "#07080A" }}>
                      {savingSharePassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Salvar"}
                    </button>
                  </div>
                  {sharePasswordSaved && (
                    <div className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#B9FF4B" }}>
                      <CheckCircle2 className="w-3 h-3" /> Senha salva com sucesso
                    </div>
                  )}
                </div>

                {/* Open portal */}
                <button onClick={() => window.open(`/portal/${sharePortalToken}`, "_blank")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: `${client.color}18`, color: client.color, border: `1px solid ${client.color}30` }}>
                  <ExternalLink className="w-4 h-4" /> Abrir portal
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Modal: Limpar Dados ── */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowClearConfirm(false); }}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm rounded-2xl p-6 space-y-4"
                style={{ background: "#0D0D1A", border: "1px solid rgba(251,191,36,0.2)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: "#FBBF24" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Limpar dados de {client.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Só os dados deste cliente serão apagados</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                  O cliente <span className="font-semibold text-white">{client.name}</span> será mantido, mas todos os dados fictícios serão removidos para que você possa inserir as informações reais.
                </p>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    Cancelar
                  </button>
                  <button onClick={() => { clearClientData(client.id); setShowClearConfirm(false); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "#FBBF24", color: "#07080A" }}>
                    Limpar dados
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Modal: Registrar Entrega Manual ── */}
        <AnimatePresence>
          {showManualOutput && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowManualOutput(false); }}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-2xl overflow-hidden"
                style={{ background: "#0D0D14", border: "1px solid rgba(185,255,75,0.2)" }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="text-sm font-bold text-white">Registrar entrega no portal</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Esta entrega ficará visível para o cliente em {client.name}
                    </p>
                  </div>
                  <button onClick={() => setShowManualOutput(false)} style={{ color: "rgba(255,255,255,0.3)" }}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Título da entrega *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Planejamento editorial de junho"
                      value={manualForm.name}
                      onChange={(e) => setManualForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-xl px-4 py-2.5 text-sm"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>Tipo</label>
                      <select value={manualForm.type} onChange={(e) => setManualForm(f => ({ ...f, type: e.target.value as GeneratedOutput["type"] }))}
                        className="w-full rounded-xl px-3 py-2.5 text-sm"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }}>
                        <option value="copy">Copy</option>
                        <option value="article">Artigo</option>
                        <option value="plan">Plano</option>
                        <option value="report">Relatório</option>
                        <option value="post">Post</option>
                        <option value="design">Design</option>
                        <option value="email">E-mail</option>
                        <option value="ad">Anúncio</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>Status</label>
                      <select value={manualForm.status} onChange={(e) => setManualForm(f => ({ ...f, status: e.target.value as GeneratedOutput["status"] }))}
                        className="w-full rounded-xl px-3 py-2.5 text-sm"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }}>
                        <option value="rascunho">Rascunho</option>
                        <option value="revisão">Para revisar</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="publicado">Publicado</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Plataforma (opcional)
                    </label>
                    <input type="text" placeholder="Ex: Instagram, LinkedIn, E-mail..."
                      value={manualForm.platform}
                      onChange={(e) => setManualForm(f => ({ ...f, platform: e.target.value }))}
                      className="w-full rounded-xl px-4 py-2.5 text-sm"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Conteúdo / Prévia
                    </label>
                    <textarea rows={4} placeholder="Cole o conteúdo, descreva a entrega ou adicione observações..."
                      value={manualForm.preview}
                      onChange={(e) => setManualForm(f => ({ ...f, preview: e.target.value }))}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowManualOutput(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                      Cancelar
                    </button>
                    <button onClick={handleAddManualOutput} disabled={!manualForm.name.trim()}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                      style={{ background: "#B9FF4B", color: "#07080A" }}>
                      Registrar no portal
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Modal: Excluir Cliente ── */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}>
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm rounded-2xl p-6 space-y-4"
                style={{ background: "#0D0D1A", border: "1px solid rgba(248,113,113,0.2)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
                    <Trash2 className="w-5 h-5" style={{ color: "#F87171" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Excluir cliente</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Esta ação não pode ser desfeita</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Tem certeza que deseja excluir <span className="font-semibold text-white">{client.name}</span>? O cliente e todos os seus dados serão removidos permanentemente.
                </p>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    Cancelar
                  </button>
                  <button onClick={() => { deleteClient(client.id); navigate("/agency"); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "#F87171", color: "#07080A" }}>
                    Excluir cliente
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto p-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>

            {/* ══════════════════════════════════════════════════════
                VISÃO GERAL
            ══════════════════════════════════════════════════════ */}
            {activeTab === "" && (() => {
              const ovCounts = {
                total:     overviewPosts.length,
                pending:   overviewPosts.filter(p => p.status === "pending_approval" || p.status === "draft").length,
                scheduled: overviewPosts.filter(p => p.status === "scheduled" || p.status === "publishing").length,
                published: overviewPosts.filter(p => p.status === "published").length,
              };
              const todayOv = new Date();
              const mondayOv = new Date(todayOv);
              mondayOv.setDate(todayOv.getDate() - ((todayOv.getDay() + 6) % 7));
              const OV_DAY_LABELS = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
              const weekDaysData = OV_DAY_LABELS.map((dayLabel, i) => {
                const d = new Date(mondayOv);
                d.setDate(mondayOv.getDate() + i);
                const dateStr = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
                const dayPosts = overviewPosts.filter(p => {
                  if (!p.scheduled_at) return false;
                  const pd = new Date(p.scheduled_at);
                  return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth() && pd.getDate() === d.getDate();
                });
                return { day: dayLabel, date: dateStr, posts: dayPosts.map(p => ({ type: (p.platforms?.[0] ?? "Post") })) };
              });
              const OV_STATUS: Record<string, { label: string; color: string; bg: string }> = {
                pending_approval: { label: "Aguardando", color: "#F5C842", bg: "rgba(245,200,66,0.12)" },
                draft:            { label: "Rascunho",   color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
                scheduled:        { label: "Agendado",   color: "#34D399", bg: "rgba(52,211,153,0.12)" },
                publishing:       { label: "Publicando", color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
                published:        { label: "Publicado",  color: "#34D399", bg: "rgba(52,211,153,0.12)" },
                failed:           { label: "Falhou",     color: "#F87171", bg: "rgba(248,113,113,0.12)" },
              };
              const ovMetrics = [
                { label: "Total de Posts",       value: ovCounts.total },
                { label: "Aguardando Aprovação", value: ovCounts.pending },
                { label: "Agendados",            value: ovCounts.scheduled },
                { label: "Publicados",           value: ovCounts.published },
              ];
              return (
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-5">
                    {overviewLoading
                      ? <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} /></div>
                      : <>
                        <div className="grid grid-cols-4 gap-3">
                          {ovMetrics.map((m) => (
                            <div key={m.label} className="rounded-xl p-4"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                              <div className="text-[10px] mb-2 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
                              <div className="text-2xl mb-1 font-bold tracking-tight">{m.value}</div>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <h3 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Posts Recentes</h3>
                          {overviewPosts.length === 0
                            ? <p className="text-xs text-center py-6" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhum post criado ainda.</p>
                            : <div className="space-y-3">
                              {overviewPosts.slice(0, 5).map((post) => {
                                const st = OV_STATUS[post.status] ?? { label: post.status, color: "#94A3B8", bg: "rgba(148,163,184,0.12)" };
                                return (
                                  <div key={post.id} className="flex items-start gap-3 p-3 rounded-xl"
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                      style={{ background: `${client.color}15`, border: `1px solid ${client.color}25` }}>
                                      <Image className="w-4 h-4" style={{ color: client.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[11px] font-medium" style={{ color: client.color }}>
                                          {(post.platforms ?? []).join(", ") || "—"}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                          style={{ background: st.bg, color: st.color }}>{st.label}</span>
                                      </div>
                                      <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{post.caption}</p>
                                      <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                                          <Clock className="w-2.5 h-2.5 inline mr-1" />
                                          {post.scheduled_at
                                            ? new Date(post.scheduled_at).toLocaleDateString("pt-BR")
                                            : new Date(post.created_at).toLocaleDateString("pt-BR")}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          }
                        </div>
                      </>
                    }
                  </div>

                  <div className="space-y-5">
                    <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <h3 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Esta Semana</h3>
                      <div className="space-y-1.5">
                        {weekDaysData.map((day) => (
                          <div key={day.day} className="flex items-center gap-3 p-2.5 rounded-lg"
                            style={{ background: day.posts.length > 0 ? "rgba(255,255,255,0.04)" : "transparent" }}>
                            <div className="w-8 text-center flex-shrink-0">
                              <div className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>{day.day}</div>
                              <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{day.date.split("/")[0]}</div>
                            </div>
                            {day.posts.length === 0
                              ? <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>Sem publicações</div>
                              : <div className="flex gap-1 flex-wrap">{day.posts.map((p, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-md"
                                  style={{ background: `${client.color}15`, color: client.color, border: `1px solid ${client.color}25` }}>
                                  {p.type}
                                </span>
                              ))}</div>
                            }
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <h3 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Redes Conectadas</h3>
                      {overviewConnections.length === 0
                        ? <p className="text-xs text-center py-3" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhuma rede social conectada.</p>
                        : <div className="space-y-2">{overviewConnections.map((conn) => (
                          <div key={conn.id} className="p-3 rounded-xl"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
                                {conn.account_name || conn.platform}
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{ background: conn.connected ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)", color: conn.connected ? "#34D399" : "#F87171" }}>
                                {conn.connected ? "Conectado" : "Desconectado"}
                              </span>
                            </div>
                            <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                              {conn.platform}{conn.followers_count ? ` · ${Number(conn.followers_count).toLocaleString("pt-BR")} seguidores` : ""}
                            </div>
                          </div>
                        ))}</div>
                      }
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════════
                CRM
            ══════════════════════════════════════════════════════ */}
            {activeTab === "crm" && (
              <div className="space-y-5">

                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Contatos",        value: dbContacts.length || client.contacts.length,                    icon: Users },
                    { label: "Negócios ativos",  value: client.pipeline.filter(d => d.stage !== "ganho").length,       icon: TrendingUp },
                    { label: "Pipeline total",   value: `R$ ${(pipelineValue).toLocaleString("pt-BR")}`,               icon: DollarSign },
                    { label: "Taxa de ganhos",   value: `${winRate}%`,                                                  icon: CheckCircle2 },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl p-4 flex items-center gap-3"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${client.color}15`, border: `1px solid ${client.color}25` }}>
                        <s.icon className="w-4 h-4" style={{ color: client.color }} />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</div>
                        <div className="text-xl font-bold tracking-tight" style={{ color: "#F0F0F0" }}>{s.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-1 p-1 rounded-xl w-fit"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {([
                    ["contacts",     "Leads"],
                    ["pipeline",     "Pipeline"],
                    ["calendar",     "🗓️ Calendário"],
                    ["approvals",    `Aprovações${(pendingPosts.length + agentProposals.length) > 0 ? ` (${pendingPosts.length + agentProposals.length})` : ""}`],
                    ["deliverables", "Entregas"],
                    ["insights",     "Insights IA"],
                    ["whatsapp",     "📲 WhatsApp"],
                  ] as const).map(([v, label]) => (
                    <button key={v} onClick={() => setCrmView(v as any)}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all relative"
                      style={crmView === v
                        ? v === "whatsapp"
                          ? { background: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)" }
                          : { background: `${client.color}22`, color: client.color, border: `1px solid ${client.color}30` }
                        : { color: "rgba(255,255,255,0.4)" }}>
                      {label}
                      {v === "approvals" && (pendingPosts.length + agentProposals.length) > 0 && crmView !== "approvals" && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full" style={{ background: client.color }} />
                      )}
                    </button>
                  ))}
                </div>

                {/* ── CONTATOS ── */}
                {crmView === "contacts" && (
                  <div className="space-y-3">

                    {/* Segment tabs (Airtable tables) */}
                    {crmSegments.length > 1 && (
                      <div className="flex gap-1.5 flex-wrap pb-1 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        {crmSegments.map((seg) => {
                          const count = seg === "Todos"
                            ? dbContacts.length
                            : dbContacts.filter((c) => c.source === seg).length;
                          const active = activeSegment === seg;
                          return (
                            <button
                              key={seg}
                              onClick={() => setActiveSegment(seg)}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                              style={active
                                ? { background: `${client.color}22`, color: client.color, border: `1px solid ${client.color}40` }
                                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}
                            >
                              {seg} <span className="ml-1 opacity-60">({count})</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Search + New */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
                        <input
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                          placeholder="Buscar por nome, empresa ou e-mail..."
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F0F0" }}
                        />
                      </div>
                      <button
                        onClick={() => setShowNewContact(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: client.color, color: "#07080A" }}>
                        <Plus className="w-3.5 h-3.5" /> Novo Lead
                      </button>
                    </div>

                    {/* New contact form */}
                    {showNewContact && (
                      <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${client.color}30` }}>
                        <p className="text-xs font-semibold" style={{ color: client.color }}>Novo Lead</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: "name",    ph: "Nome *" },
                            { key: "company", ph: "Empresa" },
                            { key: "email",   ph: "E-mail" },
                            { key: "phone",   ph: "Telefone" },
                          ].map(({ key, ph }) => (
                            <input key={key} placeholder={ph}
                              value={(newContactForm as any)[key]}
                              onChange={e => setNewContactForm(p => ({ ...p, [key]: e.target.value }))}
                              className="rounded-lg px-3 py-2 text-xs focus:outline-none"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                          ))}
                          <select value={newContactForm.channel} onChange={e => setNewContactForm(p => ({ ...p, channel: e.target.value }))}
                            className="rounded-lg px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }}>
                            <option value="">Origem do lead</option>
                            {Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                          <select value={newContactForm.status} onChange={e => setNewContactForm(p => ({ ...p, status: e.target.value }))}
                            className="rounded-lg px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }}>
                            {["Novo", "Lead", "Qualificado", "Ativo", "Cliente", "Inativo"].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setShowNewContact(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Cancelar</button>
                          <button onClick={handleCreateContact} className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ background: client.color, color: "#07080A" }}>Criar</button>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {/* Header */}
                      <div className="grid px-5 py-2.5 text-[10px] uppercase tracking-wider font-medium"
                        style={{ gridTemplateColumns: "2fr 1.2fr 1fr 1fr 0.8fr 60px", color: "rgba(255,255,255,0.25)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span>Lead</span><span>Empresa</span><span>Origem</span>
                        <span>Temperatura</span><span>Score</span><span></span>
                      </div>

                      {contactsLoading && (
                        <div className="flex justify-center py-8">
                          <div className="h-5 w-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: client.color, borderTopColor: "transparent" }} />
                        </div>
                      )}

                      {!contactsLoading && filteredDbContacts.length === 0 && (
                        <div className="text-center py-10">
                          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Nenhum lead cadastrado ainda.</p>
                          <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.15)" }}>Clique em "Novo Lead" para adicionar.</p>
                        </div>
                      )}

                      {!contactsLoading && filteredDbContacts.map((contact, i) => {
                        const heat = getHeat(contact.score ?? 0, contact.last_interaction);
                        const hcfg = HEAT_CFG[heat];
                        const src  = contact.channel ? SOURCES[contact.channel] : null;
                        return (
                          <motion.div key={contact.id}
                            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="grid px-5 py-3.5 items-center transition-colors cursor-pointer"
                            style={{ gridTemplateColumns: "2fr 1.2fr 1fr 1fr 0.8fr 60px", borderBottom: i < filteredDbContacts.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            onClick={() => setActiveContact(contact)}>
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                                style={{ background: `${client.color}20`, color: client.color }}>
                                {contact.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("")}
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{contact.name}</div>
                                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{contact.email || "—"}</div>
                              </div>
                            </div>
                            <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{contact.company || "—"}</div>
                            <div>
                              {src ? (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: src.bg, color: src.color }}>{src.label}</span>
                              ) : <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: hcfg.bg, color: hcfg.color }}>
                                {hcfg.emoji} {hcfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-12 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                                <div className="h-full rounded-full" style={{ width: `${contact.score ?? 0}%`, background: hcfg.color }} />
                              </div>
                              <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{contact.score ?? 0}</span>
                            </div>
                            <div className="flex justify-end items-center gap-1">
                              {contact.email && (
                                <button onClick={(e) => { e.stopPropagation(); setEmailBlastContact(contact); setEmailBlastSubject(""); setEmailBlastBody(""); setEmailBlastPrompt(""); }}
                                  title="Enviar e-mail" className="p-1.5 rounded-lg transition-all"
                                  style={{ color: "rgba(255,255,255,0.25)", background: "transparent" }}
                                  onMouseEnter={e => (e.currentTarget.style.color = "#60A5FA")}
                                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button className="p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.25)" }}>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Email blast modal */}
                    <AnimatePresence>
                      {emailBlastContact && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="fixed inset-0 z-50 flex items-center justify-center p-4"
                          style={{ background: "rgba(0,0,0,0.7)" }}
                          onClick={() => setEmailBlastContact(null)}>
                          <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
                            className="w-full max-w-lg rounded-2xl p-6 space-y-4"
                            style={{ background: "#12141A", border: "1px solid rgba(96,165,250,0.3)" }}
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" style={{ color: "#60A5FA" }} />
                                <span className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>
                                  E-mail para {emailBlastContact.name}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(96,165,250,0.1)", color: "#60A5FA" }}>
                                  {emailBlastContact.email}
                                </span>
                              </div>
                              <button onClick={() => setEmailBlastContact(null)} style={{ color: "rgba(255,255,255,0.3)" }}>
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <input value={emailBlastSubject} onChange={e => setEmailBlastSubject(e.target.value)}
                              placeholder="Assunto do e-mail *"
                              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0" }} />

                            <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(185,255,75,0.04)", border: "1px solid rgba(185,255,75,0.15)" }}>
                              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#B9FF4B" }}>Agente escreve</span>
                              <div className="flex gap-2">
                                <input value={emailBlastPrompt} onChange={e => setEmailBlastPrompt(e.target.value)}
                                  onKeyDown={e => e.key === "Enter" && generateEmailWithAI()}
                                  placeholder='Ex: "agendar reunião para semana que vem"'
                                  className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none"
                                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(185,255,75,0.2)", color: "#F0F0F0" }} />
                                <button onClick={generateEmailWithAI} disabled={!emailBlastPrompt.trim()}
                                  className="px-3 py-2 rounded-lg text-[11px] font-semibold disabled:opacity-40"
                                  style={{ background: "rgba(185,255,75,0.15)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.3)" }}>
                                  <Sparkles className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <textarea value={emailBlastBody} onChange={e => setEmailBlastBody(e.target.value)}
                              rows={5} placeholder="Corpo do e-mail (pode usar HTML básico)…"
                              className="w-full px-3 py-2.5 rounded-lg text-sm resize-none focus:outline-none"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }} />

                            <div className="flex gap-2">
                              <button onClick={sendEmailToContact}
                                disabled={emailBlasting || !emailBlastSubject.trim() || !emailBlastBody.trim()}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                                style={{ background: "#60A5FA", color: "#07080A" }}>
                                {emailBlasting ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Enviando…</> : <><Send className="w-3.5 h-3.5" /> Enviar e-mail</>}
                              </button>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* ── APROVAÇÕES ── */}
                {crmView === "calendar" && id && (
                  <EditorialCalendarPanel
                    clientId={id}
                    clientName={client.name}
                    clientSegment={(client as any).segment}
                    accentColor={client.color}
                  />
                )}

                {crmView === "approvals" && (
                  <div className="space-y-5">

                    {/* Propostas dos Agentes */}
                    {(() => {
                      const pendingProposals = agentProposals.filter(p => p.status === "pending");
                      const activeProposals  = agentProposals.filter(p => ["approved", "in_progress", "completed"].includes(p.status));
                      const PROP_STATUS: Record<string, { label: string; color: string }> = {
                        approved:    { label: "Aprovado",      color: "#60A5FA" },
                        in_progress: { label: "Em andamento",  color: "#B9FF4B" },
                        completed:   { label: "Concluído",     color: "#34D399" },
                      };
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Propostas & Ações</p>
                              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                                {pendingProposals.length > 0 ? `${pendingProposals.length} aguardando aprovação · ` : ""}
                                {activeProposals.length > 0 ? `${activeProposals.length} em andamento` : ""}
                                {pendingProposals.length === 0 && activeProposals.length === 0 ? "Gere um diagnóstico e clique em «Consultar o Time»" : ""}
                              </p>
                            </div>
                            <button onClick={loadProposals} disabled={proposalsLoading}
                              className="p-1.5 rounded-lg transition-all disabled:opacity-40"
                              style={{ color: "rgba(255,255,255,0.3)" }}>
                              <RefreshCw className={`w-3.5 h-3.5 ${proposalsLoading ? "animate-spin" : ""}`} />
                            </button>
                          </div>

                          {proposalsLoading && (
                            <div className="flex justify-center py-6">
                              <div className="h-5 w-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: client.color, borderTopColor: "transparent" }} />
                            </div>
                          )}

                          {!proposalsLoading && agentProposals.length === 0 && (
                            <div className="rounded-2xl py-8 flex flex-col items-center gap-2"
                              style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)" }}>
                              <p className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhuma proposta ainda</p>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.12)" }}>Gere um diagnóstico e clique em "Consultar o Time"</p>
                            </div>
                          )}

                          {/* Pendentes — aguardando aprovação */}
                          {!proposalsLoading && pendingProposals.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[10px] uppercase tracking-wider font-semibold px-1" style={{ color: "rgba(251,191,36,0.7)" }}>Aguardando aprovação</p>
                              {pendingProposals.map((proposal) => (
                                <div key={proposal.id} className="rounded-2xl p-4 space-y-3"
                                  style={{ background: "rgba(251,191,36,0.04)", border: `1px solid rgba(251,191,36,0.2)` }}>
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                                      style={{ background: `${proposal.agent_color}18`, color: proposal.agent_color, border: `1px solid ${proposal.agent_color}30` }}>
                                      {proposal.agent_name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-semibold" style={{ color: proposal.agent_color }}>{proposal.agent_name}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24" }}>proposta</span>
                                      </div>
                                      <p className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>{proposal.titulo}</p>
                                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{proposal.descricao}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleApproveProposal(proposal.id)}
                                      disabled={approvingProposalId === proposal.id}
                                      className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                                      style={{ background: proposal.agent_color, color: "#07080A" }}>
                                      {approvingProposalId === proposal.id
                                        ? <><RefreshCw className="w-3 h-3 animate-spin" /> Aprovando…</>
                                        : <><CheckCircle2 className="w-3.5 h-3.5" /> Aprovar</>}
                                    </button>
                                    <button
                                      onClick={() => handleRejectProposal(proposal.id)}
                                      className="px-4 py-2 rounded-xl text-xs font-medium"
                                      style={{ background: "rgba(248,113,113,0.08)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                                      Rejeitar
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Ativas — aprovadas / em andamento / concluídas */}
                          {!proposalsLoading && activeProposals.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[10px] uppercase tracking-wider font-semibold px-1" style={{ color: "rgba(185,255,75,0.6)" }}>Ações em andamento</p>
                              {activeProposals.map((proposal) => {
                                const st = PROP_STATUS[proposal.status] ?? PROP_STATUS.approved;
                                return (
                                  <div key={proposal.id} className="rounded-2xl p-3 flex items-start gap-3"
                                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${proposal.agent_color}20` }}>
                                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0"
                                      style={{ background: `${proposal.agent_color}15`, color: proposal.agent_color, border: `1px solid ${proposal.agent_color}25` }}>
                                      {proposal.agent_name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                        <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{proposal.titulo}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                                          style={{ background: `${st.color}15`, color: st.color, border: `1px solid ${st.color}30` }}>
                                          {proposal.status === "in_progress" && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 animate-pulse" style={{ background: st.color }} />}
                                          {st.label}
                                        </span>
                                      </div>
                                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{proposal.agent_name} · {proposal.descricao?.slice(0, 80)}{(proposal.descricao?.length ?? 0) > 80 ? "…" : ""}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Divider */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

                    {/* Posts para aprovação */}
                    <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Fila de Aprovação</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Posts criados pelos agentes aguardando sua aprovação</p>
                      </div>
                      <button onClick={() => { setDraftAgent(null); setShowDraftModal(true); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: client.color, color: "#07080A" }}>
                        <Plus className="w-3.5 h-3.5" /> Solicitar post
                      </button>
                    </div>

                    {pendingLoading && (
                      <div className="flex justify-center py-10">
                        <div className="h-5 w-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: client.color, borderTopColor: "transparent" }} />
                      </div>
                    )}

                    {!pendingLoading && pendingPosts.length === 0 && (
                      <div className="rounded-2xl py-12 flex flex-col items-center gap-3"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
                        <CheckCircle2 className="w-8 h-8" style={{ color: "rgba(255,255,255,0.1)" }} />
                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Nenhum post aguardando aprovação</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>Os agentes vão criar posts aqui para você revisar</p>
                      </div>
                    )}

                    {!pendingLoading && pendingPosts.map((post) => (
                      <div key={post.id} className="rounded-2xl p-4 space-y-3"
                        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${client.color}25` }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              {(post.platforms as string[]).map((p: string) => (
                                <span key={p} className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize"
                                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>{p}</span>
                              ))}
                              {post.agent_id && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                  style={{ background: `${client.color}15`, color: client.color }}>
                                  Agente: {post.agent_id}
                                </span>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "rgba(255,255,255,0.75)" }}>
                              {post.caption}
                            </p>
                            <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                              Criado {new Date(post.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(post.id)}
                            disabled={approvingId === post.id}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                            style={{ background: client.color, color: "#07080A" }}>
                            {approvingId === post.id
                              ? <><RefreshCw className="w-3 h-3 animate-spin" /> Publicando…</>
                              : <><CheckCircle2 className="w-3.5 h-3.5" /> Aprovar e publicar</>}
                          </button>
                          <button
                            onClick={() => setShowRejectModal(post.id)}
                            className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                            style={{ background: "rgba(248,113,113,0.08)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                            Rejeitar
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Reject modal */}
                    {showRejectModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
                        <div className="w-full max-w-sm rounded-2xl p-5 space-y-4" style={{ background: "#0D0D1A", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Rejeitar post</p>
                          <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Motivo da rejeição (opcional)..."
                            rows={3}
                            className="w-full rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.8)" }}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => setShowRejectModal(null)} className="flex-1 py-2 rounded-xl text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Cancelar</button>
                            <button onClick={() => handleReject(showRejectModal)} disabled={!!rejectingId}
                              className="flex-1 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                              style={{ background: "#F87171", color: "#07080A" }}>
                              {rejectingId ? "Rejeitando…" : "Confirmar rejeição"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>{/* end posts section */}
                  </div>
                )}

                {/* ── ENTREGAS ── */}
                {crmView === "deliverables" && (() => {
                  const PRESETS = [
                    { category: "social",    label: "📝 Post publicado" },
                    { category: "story",     label: "📱 Story publicado" },
                    { category: "video",     label: "🎬 Vídeo editado" },
                    { category: "arte",      label: "🎨 Arte criada" },
                    { category: "copy",      label: "✍️ Copy/Legenda" },
                    { category: "email",     label: "📧 E-mail marketing" },
                    { category: "relatorio", label: "📊 Relatório mensal" },
                    { category: "reuniao",   label: "🤝 Reunião" },
                    { category: "trafego",   label: "🎯 Campanha tráfego" },
                    { category: "calendario",label: "📅 Calendário editorial" },
                    { category: "estrategia",label: "💡 Planejamento estratégico" },
                    { category: "outro",     label: "➕ Outro" },
                  ];
                  return (
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Registro de Entregas</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {deliverables.filter(d => d.visible_to_client).length} visíveis ao cliente · {deliverables.length} total
                        </p>
                      </div>
                      <button onClick={loadDeliverables} disabled={delivLoading} className="p-1.5 rounded-lg transition-all disabled:opacity-40" style={{ color: "rgba(255,255,255,0.3)" }}>
                        <RefreshCw className={`w-4 h-4 ${delivLoading ? "animate-spin" : ""}`} />
                      </button>
                    </div>

                    {/* Presets (quick add) */}
                    <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Selecione o que foi entregue</p>
                      <div className="flex flex-wrap gap-2">
                        {PRESETS.map((p) => (
                          <button key={p.category}
                            onClick={() => setDelivForm((f) => ({ ...f, category: p.category, description: p.label.replace(/^[^\s]+\s/, "") }))}
                            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                            style={delivForm.category === p.category
                              ? { background: `${client.color}25`, color: client.color, border: `1px solid ${client.color}40` }
                              : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            {p.label}
                          </button>
                        ))}
                      </div>

                      {/* Form */}
                      <div className="space-y-2 pt-1">
                        <input
                          value={delivForm.description}
                          onChange={(e) => setDelivForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Descrição da entrega (ex: 3 posts feed setembro)…"
                          className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.85)" }}
                        />
                        <div className="flex items-center gap-2">
                          <input type="date" value={delivForm.done_at}
                            onChange={(e) => setDelivForm((f) => ({ ...f, done_at: e.target.value }))}
                            className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.7)", colorScheme: "dark" }} />
                          <button
                            onClick={() => setDelivForm((f) => ({ ...f, visible_to_client: !f.visible_to_client }))}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                            style={delivForm.visible_to_client
                              ? { background: "rgba(185,255,75,0.12)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)" }
                              : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <Eye className="w-3.5 h-3.5" />
                            {delivForm.visible_to_client ? "Visível ao cliente" : "Oculto"}
                          </button>
                          <button
                            onClick={() => saveDeliverable(delivForm.category, delivForm.title, delivForm.description, delivForm.done_at, delivForm.visible_to_client, delivForm.status)}
                            disabled={savingDeliv || !delivForm.title.trim()}
                            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                            style={{ background: client.color, color: "#07080A" }}>
                            {savingDeliv ? "Salvando…" : "Registrar"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* List */}
                    {delivLoading ? (
                      <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.2)" }} /></div>
                    ) : deliverables.length === 0 ? (
                      <div className="rounded-2xl py-8 flex flex-col items-center gap-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)" }}>
                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhuma entrega registrada</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.12)" }}>Use os chips acima para registrar rapidamente</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {deliverables.map((d) => (
                          <div key={d.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                            style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${d.visible_to_client ? "rgba(185,255,75,0.12)" : "rgba(255,255,255,0.06)"}` }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{d.description}</p>
                              <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                                {new Date(d.done_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <button onClick={() => toggleDelivVisible(d.id, d.visible_to_client)}
                              className="p-1.5 rounded-lg transition-all"
                              title={d.visible_to_client ? "Visível ao cliente — clique para ocultar" : "Oculto — clique para mostrar ao cliente"}
                              style={{ color: d.visible_to_client ? "#B9FF4B" : "rgba(255,255,255,0.2)" }}>
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteDeliv(d.id)} className="p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.15)" }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })()}

                {/* ── INSIGHTS IA ── */}
                {crmView === "insights" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Insights de Performance</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Claude analisa os posts publicados e sugere melhorias</p>
                      </div>
                      <button onClick={loadInsights} disabled={insightsLoading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <RefreshCw className={`w-3 h-3 ${insightsLoading ? "animate-spin" : ""}`} /> Atualizar
                      </button>
                    </div>

                    {insightsLoading && (
                      <div className="flex flex-col items-center gap-3 py-10">
                        <div className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: client.color, borderTopColor: "transparent" }} />
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Claude analisando posts…</p>
                      </div>
                    )}

                    {!insightsLoading && !insights && (
                      <div className="rounded-2xl py-12 flex flex-col items-center gap-3"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
                        <TrendingUp className="w-8 h-8" style={{ color: "rgba(255,255,255,0.1)" }} />
                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Nenhuma análise ainda</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>Publique posts para gerar insights</p>
                      </div>
                    )}

                    {!insightsLoading && insights?.insights?.map((ins: any, i: number) => (
                      <div key={i} className="rounded-xl p-4 space-y-1.5"
                        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${ins.tipo === "alerta" ? "rgba(248,113,113,0.2)" : ins.tipo === "melhoria" ? `${client.color}25` : "rgba(255,255,255,0.07)"}` }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
                            style={ins.tipo === "alerta"
                              ? { background: "rgba(248,113,113,0.1)", color: "#F87171" }
                              : ins.tipo === "melhoria"
                              ? { background: `${client.color}15`, color: client.color }
                              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                            {ins.tipo}
                          </span>
                          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{ins.titulo}</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{ins.descricao}</p>
                        <p className="text-xs font-medium mt-1 pt-1" style={{ color: client.color, borderTop: "1px solid rgba(255,255,255,0.05)" }}>→ {ins.acao}</p>
                      </div>
                    ))}

                    {!insightsLoading && insights?.proxima_sugestao && (
                      <div className="rounded-xl p-4" style={{ background: `${client.color}0D`, border: `1px solid ${client.color}30` }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: client.color }}>Próximo post sugerido</p>
                        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{insights.proxima_sugestao}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── PIPELINE ── */}
                {crmView === "pipeline" && (
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-4" style={{ minWidth: "900px" }}>
                      {PIPELINE_STAGES.map((stage) => {
                        const deals = client.pipeline.filter((d) => d.stage === stage.id);
                        const stageTotal = deals.reduce((s, d) => {
                          const n = parseFloat(d.value.replace(/[^\d]/g, "")) || 0;
                          return s + n;
                        }, 0);
                        return (
                          <div key={stage.id} className="flex-1 min-w-[160px]">
                            {/* Stage header */}
                            <div className="flex items-center justify-between mb-3 px-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                                <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{stage.label}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                  style={{ background: `${stage.color}18`, color: stage.color }}>
                                  {deals.length}
                                </span>
                              </div>
                            </div>

                            {/* Deal cards */}
                            <div className="space-y-2">
                              {deals.map((deal, i) => (
                                <motion.div key={deal.id}
                                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.06 }}
                                  className="rounded-xl p-3.5 cursor-pointer transition-all"
                                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = `${stage.color}35`;
                                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                                    (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                                  }}>
                                  <div className="text-xs font-semibold mb-1 leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>
                                    {deal.title}
                                  </div>
                                  <div className="text-[10px] mb-2.5" style={{ color: "rgba(255,255,255,0.35)" }}>{deal.contact}</div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold" style={{ color: stage.color }}>{deal.value}</span>
                                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{deal.probability}%</span>
                                  </div>
                                  <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                    <div className="h-full rounded-full" style={{ width: `${deal.probability}%`, background: stage.color }} />
                                  </div>
                                  <div className="mt-2 text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                                    <Clock className="w-2.5 h-2.5 inline mr-1" />{deal.dueDate}
                                  </div>
                                </motion.div>
                              ))}

                              {deals.length === 0 && (
                                <div className="rounded-xl p-4 text-center border border-dashed"
                                  style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhum negócio</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── CRM WHATSAPP (Z-API) ── */}
                {crmView === "whatsapp" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ border: wpStatus === "connected" ? "1px solid rgba(37,211,102,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4"
                      style={{ background: "rgba(37,211,102,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)" }}>
                          <MessageCircle className="w-5 h-5" style={{ color: "#25D366" }} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                            WhatsApp Business
                            <span className="text-[10px] font-normal ml-2 px-1.5 py-0.5 rounded" style={{ background: "rgba(37,211,102,0.12)", color: "#25D366" }}>via Z-API</span>
                          </div>
                          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {wpStatus === "connected" && wpPhone ? `Conectado: ${wpPhone}` : "Envie mensagens para grupos ou contatos do CRM"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {wpStatus === "connected" && (
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                            </span>
                            <span className="text-xs font-medium" style={{ color: "#34D399" }}>Conectado</span>
                          </div>
                        )}
                        {wpStatus === "disconnected" && (
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Desconectado</span>
                        )}
                        <button onClick={() => setWpCredsOpen(v => !v)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                          style={wpCreds ? { background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" } : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)" }}>
                          <Settings2 className="w-3 h-3" /> {wpCreds ? "ZApi configurado" : "Configurar ZApi"}
                        </button>
                        <button onClick={checkWpStatus} disabled={wpStatus === "loading"}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50"
                          style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                          {wpStatus === "loading"
                            ? <><RefreshCw className="w-3 h-3 animate-spin" /> Verificando…</>
                            : <><Wifi className="w-3 h-3" /> Verificar conexão</>}
                        </button>
                      </div>
                    </div>

                    {/* ZApi credentials panel */}
                    <AnimatePresence>
                      {wpCredsOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden"
                          style={{ borderBottom: "1px solid rgba(37,211,102,0.15)" }}>
                          <div className="px-6 py-4 space-y-3" style={{ background: "rgba(37,211,102,0.03)" }}>
                            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#25D366" }}>
                              Credenciais ZApi — {client.name}
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: "Instance ID", key: "zapi_instance", ph: "Ex: 3EBC0C..." },
                                { label: "Token", key: "zapi_token", ph: "Ex: BA4478..." },
                                { label: "Client Token", key: "zapi_client_token", ph: "Ex: Fabc..." },
                              ].map(({ label, key, ph }) => (
                                <div key={key}>
                                  <label className="block text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</label>
                                  <input
                                    value={(wpCredsForm as any)[key]}
                                    onChange={e => setWpCredsForm(p => ({ ...p, [key]: e.target.value }))}
                                    placeholder={ph}
                                    className="w-full rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none font-mono"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={saveWpCreds} disabled={wpCredsSaving || !wpCredsForm.zapi_instance.trim() || !wpCredsForm.zapi_token.trim()}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                                style={{ background: "#25D366", color: "#07080A" }}>
                                {wpCredsSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
                              </button>
                              <button onClick={() => setWpCredsOpen(false)} className="px-3 py-2 text-xs rounded-xl" style={{ color: "rgba(255,255,255,0.35)" }}>Cancelar</button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="p-6 space-y-5">
                      {/* Desconectado: instruções */}
                      {!wpCreds && (wpStatus === "disconnected" || wpStatus === "idle") && (
                        <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#FBBF24" }} />
                          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                            Configure as credenciais ZApi deste cliente para conectar o WhatsApp.
                          </p>
                        </div>
                      )}
                      {/* Desconectado: instruções (com creds já configuradas) */}
                      {(wpStatus === "disconnected" || wpStatus === "idle") && (
                        <div className="flex items-start gap-6">
                          <div className="flex-1">
                            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Como conectar</h3>
                            <ol className="space-y-2">
                              {["1. Clique em Verificar conexão", "2. Se desconectado, clique em Gerar QR Code", "3. Abra WhatsApp → Dispositivos conectados → Conectar", "4. Escaneie o QR Code com o celular"].map((step, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                                    style={{ background: "rgba(37,211,102,0.12)", color: "#25D366" }}>{i + 1}</span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                          <div className="flex-shrink-0 flex flex-col items-center gap-3">
                            <button onClick={fetchWpQr}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold"
                              style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                              <QrCode className="w-3.5 h-3.5" /> Gerar QR Code
                            </button>
                            {wpQr && (
                              <div className="p-3 rounded-xl" style={{ background: "white" }}>
                                <img src={wpQr} alt="QR Code WhatsApp" className="w-40 h-40 object-contain" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Conectado: envio de mensagens */}
                      {wpStatus === "connected" && (
                        <div className="space-y-5">
                          {/* Tabs Modo de Envio: Grupos / Individual */}
                          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            {(["grupos", "contatos"] as const).map((tab) => (
                              <button key={tab} onClick={() => setWpTargetTab(tab)}
                                className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all"
                                style={wpTargetTab === tab
                                  ? { background: "#25D366", color: "#fff" }
                                  : { color: "rgba(255,255,255,0.35)" }}>
                                {tab === "grupos" ? `📢 Grupos (${wpSelectedGroups.length} sel.)` : `👤 Individual (${wpSelectedContacts.length} sel.)`}
                              </button>
                            ))}
                          </div>

                          {/* Modo rápido: TODOS os grupos */}
                          {wpTargetTab === "grupos" && wpGroups.length > 0 && (() => {
                            const allSelected = wpGroups.every(g => wpSelectedGroups.includes(g.id));
                            return (
                              <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl"
                                style={{ background: "rgba(37,211,102,0.05)", border: "1px solid rgba(37,211,102,0.18)" }}>
                                <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>
                                  Modo rápido:
                                </span>
                                <button
                                  onClick={() => setWpSelectedGroups(allSelected ? [] : wpGroups.map(g => g.id))}
                                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all"
                                  style={allSelected
                                    ? { background: "#25D366", color: "#07080A" }
                                    : { background: "rgba(37,211,102,0.12)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)" }}>
                                  {allSelected
                                    ? `✓ Todos os ${wpGroups.length} grupos selecionados`
                                    : `📢 Selecionar TODOS os ${wpGroups.length} grupos`}
                                </button>
                                {wpSelectedGroups.length > 0 && !allSelected && (
                                  <button onClick={() => setWpSelectedGroups([])}
                                    className="text-[10px] px-2 py-1 rounded-lg"
                                    style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
                                    Limpar seleção
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          {/* Lista de Grupos */}
                          {wpTargetTab === "grupos" && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                                  Grupos ({wpGroups.length})
                                </h3>
                                <div className="flex items-center gap-1.5">
                                  {wpGroups.length > 0 && (
                                    <button
                                      onClick={() => {
                                        const allIds = wpGroups.map(g => g.id);
                                        const allSelected = allIds.every(id => wpSelectedGroups.includes(id));
                                        setWpSelectedGroups(allSelected ? [] : allIds);
                                      }}
                                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all"
                                      style={{
                                        color: wpGroups.every(g => wpSelectedGroups.includes(g.id)) ? "#25D366" : "rgba(255,255,255,0.4)",
                                        background: wpGroups.every(g => wpSelectedGroups.includes(g.id)) ? "rgba(37,211,102,0.1)" : "rgba(255,255,255,0.04)",
                                        border: `1px solid ${wpGroups.every(g => wpSelectedGroups.includes(g.id)) ? "rgba(37,211,102,0.3)" : "rgba(255,255,255,0.08)"}`,
                                      }}>
                                      {wpGroups.every(g => wpSelectedGroups.includes(g.id)) ? "✓ Todos" : "Selecionar todos"}
                                    </button>
                                  )}
                                  <button onClick={refreshWpGroups} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg"
                                    style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    <RefreshCw className="w-3 h-3" /> Atualizar
                                  </button>
                                </div>
                              </div>
                              {wpGroups.length === 0
                                ? <div className="py-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhum grupo. Clique em Atualizar.</div>
                                : <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                    {wpGroups.map((g) => {
                                      const sel = wpSelectedGroups.includes(g.id);
                                      const fav = wpFavoriteGroupIds.includes(g.id);
                                      return (
                                        <div key={g.id} className="relative">
                                          <button onClick={() => toggleGroup(g.id)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all pr-8"
                                            style={{ background: sel ? "rgba(37,211,102,0.1)" : "rgba(255,255,255,0.03)", border: sel ? "1px solid rgba(37,211,102,0.3)" : "1px solid rgba(255,255,255,0.07)" }}>
                                            <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: sel ? "#25D366" : "rgba(255,255,255,0.08)" }}>
                                              {sel && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="min-w-0">
                                              <div className="text-[11px] font-medium truncate" style={{ color: sel ? "#25D366" : "rgba(255,255,255,0.65)" }}>{g.name}</div>
                                              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{g.participants} membros</div>
                                            </div>
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); toggleFavoriteGroup(g.id); }}
                                            title={fav ? "Remover dos favoritos do agente" : "Adicionar aos favoritos do agente"}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-base leading-none"
                                            style={{ color: fav ? "#FBBF24" : "rgba(255,255,255,0.18)" }}>
                                            ★
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                              }
                              {wpFavoriteGroupIds.length > 0 && (
                                <p className="text-[10px] mt-2" style={{ color: "rgba(251,191,36,0.6)" }}>
                                  ★ {wpFavoriteGroupIds.length} grupo{wpFavoriteGroupIds.length !== 1 ? "s" : ""} favoritado{wpFavoriteGroupIds.length !== 1 ? "s" : ""} para o agente autônomo
                                </p>
                              )}
                            </div>
                          )}

                          {/* Contatos do CRM */}
                          {wpTargetTab === "contatos" && (
                            <div>
                              <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Leads do CRM</h3>

                              {/* Quick-select por Grupo do CRM */}
                              {dbCrmGroups.length > 0 && (
                                <div className="mb-3 p-3 rounded-xl" style={{ background: "rgba(37,211,102,0.04)", border: "1px solid rgba(37,211,102,0.15)" }}>
                                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#25D366" }}>
                                    📋 Selecionar por grupo do CRM
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {dbCrmGroups.map((g: any) => {
                                      const members = dbGroupMembers[g.id] ?? [];
                                      const phones = members.map((m: any) => (m.whatsapp ?? m.phone ?? "").toString().trim()).filter(Boolean);
                                      if (phones.length === 0) return (
                                        <span key={g.id} className="text-[10px] px-2 py-1 rounded-lg opacity-50"
                                          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                          {g.name} (0)
                                        </span>
                                      );
                                      const allSel = phones.every((p: string) => wpSelectedContacts.includes(p));
                                      return (
                                        <button key={g.id}
                                          onClick={() => {
                                            setWpSelectedContacts((prev: string[]) => {
                                              const set = new Set(prev);
                                              if (allSel) phones.forEach((p: string) => set.delete(p));
                                              else phones.forEach((p: string) => set.add(p));
                                              return Array.from(set);
                                            });
                                          }}
                                          className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all"
                                          style={allSel
                                            ? { background: "#25D366", color: "#07080A" }
                                            : { background: "rgba(37,211,102,0.1)", color: "#25D366", border: `1px solid ${g.color ?? "rgba(37,211,102,0.3)"}` }}>
                                          {allSel ? "✓ " : ""}{g.name} ({phones.length})
                                        </button>
                                      );
                                    })}
                                    {wpSelectedContacts.length > 0 && (
                                      <button onClick={() => setWpSelectedContacts([])}
                                        className="text-[10px] px-2 py-1 rounded-lg"
                                        style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
                                        Limpar seleção
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {(dbContacts.length === 0 && (!client.contacts || client.contacts.length === 0))
                                ? <div className="py-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhum contato com telefone cadastrado.</div>
                                : <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                    {[...dbContacts, ...(client.contacts ?? [])].filter((c: any, idx: number, arr: any[]) => arr.findIndex(x => (x.phone ?? x.whatsapp) === (c.phone ?? c.whatsapp)) === idx).map((c: any) => {
                                      const ph = c.phone ?? c.whatsapp ?? "";
                                      if (!ph) return null;
                                      const sel = wpSelectedContacts.includes(ph);
                                      return (
                                        <button key={ph} onClick={() => toggleWpContact(ph)}
                                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                                          style={{ background: sel ? "rgba(37,211,102,0.1)" : "rgba(255,255,255,0.03)", border: sel ? "1px solid rgba(37,211,102,0.3)" : "1px solid rgba(255,255,255,0.07)" }}>
                                          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: sel ? "#25D366" : "rgba(255,255,255,0.08)" }}>
                                            {sel && <CheckCircle2 className="w-3 h-3 text-white" />}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <div className="text-[11px] font-medium truncate" style={{ color: sel ? "#25D366" : "rgba(255,255,255,0.65)" }}>{c.name ?? ph}</div>
                                            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{ph}</div>
                                          </div>
                                          {(c.status || c.role) && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B" }}>
                                              {c.status ?? c.role}
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                              }
                            </div>
                          )}

                          {/* Tipo de mensagem */}
                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Tipo de envio</h3>
                            <div className="flex gap-2 flex-wrap">
                              {(["text", "image", "video", "audio"] as const).map((t) => {
                                const labels: Record<string, string> = { text: "💬 Texto", image: "🖼️ Imagem", video: "🎥 Vídeo", audio: "🎵 Áudio" };
                                return (
                                  <button key={t} onClick={() => { setWpMediaType(t); setWpMediaData(null); setWpMediaName(""); }}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                                    style={wpMediaType === t
                                      ? { background: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.35)" }
                                      : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                    {labels[t]}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Compositor */}
                          <div className="space-y-3">
                            {/* Gerar com IA */}
                            <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(185,255,75,0.04)", border: "1px solid rgba(185,255,75,0.15)" }}>
                              <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-3 h-3" style={{ color: "#B9FF4B" }} />
                                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#B9FF4B" }}>Agente escreve a mensagem</span>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  value={wpAiPrompt}
                                  onChange={e => setWpAiPrompt(e.target.value)}
                                  onKeyDown={e => e.key === "Enter" && generateWpMessageWithAI()}
                                  placeholder='Ex: "lembrar que a aula começa amanhã às 19h"'
                                  className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none"
                                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(185,255,75,0.2)", color: "#F0F0F0" }} />
                                <button onClick={generateWpMessageWithAI} disabled={wpAiGenerating || !wpAiPrompt.trim()}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold disabled:opacity-40 whitespace-nowrap"
                                  style={{ background: "rgba(185,255,75,0.15)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.3)" }}>
                                  {wpAiGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                  {wpAiGenerating ? "Gerando…" : "Gerar"}
                                </button>
                              </div>
                            </div>

                            {wpMediaType !== "text" && (
                              <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
                                style={{ background: "rgba(255,255,255,0.04)", border: "2px dashed rgba(255,255,255,0.12)" }}>
                                <input type="file" className="hidden"
                                  accept={wpMediaType === "image" ? "image/*" : wpMediaType === "video" ? "video/*" : "audio/*"}
                                  onChange={handleWpFile} />
                                <span className="text-lg">{wpMediaType === "image" ? "🖼️" : wpMediaType === "video" ? "🎥" : "🎵"}</span>
                                <span className="text-[11px]" style={{ color: wpMediaName ? "#25D366" : "rgba(255,255,255,0.3)" }}>
                                  {wpMediaName || "Clique para selecionar arquivo"}
                                </span>
                              </label>
                            )}
                            {(wpMediaType === "image" || wpMediaType === "video") && (
                              <input value={wpCaption} onChange={(e) => setWpCaption(e.target.value)}
                                placeholder="Legenda (opcional)..." className="w-full px-4 py-2.5 rounded-xl text-sm"
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", outline: "none" }} />
                            )}
                            <textarea value={wpMessage} onChange={(e) => setWpMessage(e.target.value)}
                              rows={wpMediaType === "text" ? 4 : 2}
                              placeholder={wpMediaType === "text" ? "Digite a mensagem ou gere com IA acima…" : "Texto adicional (opcional)..."}
                              className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", outline: "none" }} />
                          </div>

                          {/* Disparar */}
                          <div className="space-y-3">
                            {(wpSelectedGroups.length + wpSelectedContacts.length) > 0 && (
                              <div className="flex flex-wrap gap-3 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                {wpSelectedGroups.length > 0 && <span>📢 {wpSelectedGroups.length} grupo{wpSelectedGroups.length !== 1 ? "s" : ""}</span>}
                                {wpSelectedContacts.length > 0 && <span>👤 {wpSelectedContacts.length} contato{wpSelectedContacts.length !== 1 ? "s" : ""}</span>}
                                <span>· {wpSelectedGroups.length + wpSelectedContacts.length} destinos total</span>
                              </div>
                            )}
                            <div className="flex items-center gap-4">
                              <button onClick={doWpBlast}
                                disabled={wpBlasting || (wpSelectedGroups.length + wpSelectedContacts.length) === 0 || (wpMediaType === "text" && !wpMessage.trim()) || (wpMediaType !== "text" && !wpMediaData)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                                style={{ background: "#25D366", color: "#fff", boxShadow: wpBlasting ? "none" : "0 0 20px -4px rgba(37,211,102,0.4)" }}>
                                {wpBlasting
                                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando…</>
                                  : <><Send className="w-4 h-4" /> Disparar ({wpSelectedGroups.length + wpSelectedContacts.length})</>}
                              </button>
                              {wpBlastResult && (
                                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                                  style={{ background: "rgba(52,211,153,0.1)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> {wpBlastResult}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── Agente Autônomo ── */}
                      <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <button onClick={() => setShowAgentPanel(v => !v)}
                          className="flex items-center gap-2 w-full text-left"
                          style={{ color: "rgba(255,255,255,0.5)" }}>
                          <Bot className="w-4 h-4" style={{ color: "#B9FF4B" }} />
                          <span className="text-xs font-semibold" style={{ color: "#B9FF4B" }}>Agente Autônomo</span>
                          <span className="text-[10px] ml-1" style={{ color: "rgba(255,255,255,0.3)" }}>— gera e envia sem revisão humana</span>
                          <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${showAgentPanel ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                          {showAgentPanel && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden">
                              <div className="pt-4 space-y-3">
                                <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(185,255,75,0.04)", border: "1px solid rgba(185,255,75,0.12)" }}>
                                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                    O agente vai gerar a mensagem com IA e enviar automaticamente para os grupos com ★.
                                    Favorite grupos na lista acima para usá-los aqui.
                                  </p>
                                  {wpFavoriteGroupIds.length > 0 && (
                                    <p className="text-[10px] font-medium" style={{ color: "#FBBF24" }}>
                                      ★ {wpFavoriteGroupIds.length} grupo{wpFavoriteGroupIds.length !== 1 ? "s" : ""} selecionado{wpFavoriteGroupIds.length !== 1 ? "s" : ""}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <input value={agentSendPrompt} onChange={e => setAgentSendPrompt(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && doAgentBroadcast()}
                                    placeholder='Ex: "confirmar presença no evento de amanhã"'
                                    className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(185,255,75,0.2)", color: "#F0F0F0" }} />
                                  <button onClick={doAgentBroadcast}
                                    disabled={agentSending || !agentSendPrompt.trim() || wpFavoriteGroupIds.length === 0}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold disabled:opacity-40 whitespace-nowrap"
                                    style={{ background: "rgba(185,255,75,0.15)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.3)" }}>
                                    {agentSending ? <><RefreshCw className="w-3 h-3 animate-spin" /> Enviando…</> : <><Bot className="w-3 h-3" /> Enviar agora</>}
                                  </button>
                                </div>
                                <AnimatePresence>
                                  {agentSendResult && (
                                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                      className="rounded-xl p-3 space-y-2"
                                      style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
                                      <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#34D399" }}>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Enviado para {agentSendResult.ok}/{agentSendResult.total} grupos
                                      </div>
                                      <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", whiteSpace: "pre-wrap" }}>
                                        {agentSendResult.message}
                                      </p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                CAMPANHAS — ANÚNCIOS & GESTÃO
            ══════════════════════════════════════════════════════ */}
            {activeTab === "campaigns" && (
              <div className="space-y-8">
                <MetaAdsCampaignsSection clientId={client.id} clientColor={client.color} />
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "2rem" }}>
                  <AdsSection clientId={client.id} clientColor={client.color} />
                </div>
              </div>
            )}

            {false && campList.map((camp) => {
                    const doneCount = camp.phases.filter(p => p.status === "done").length;
                    const progress = Math.round((doneCount / camp.phases.length) * 100);
                    const statusStyle = camp.status === "ativa"
                      ? { color: "#34D399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.25)" }
                      : camp.status === "pausada"
                      ? { color: "#FBBF24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.2)" }
                      : { color: "#94A3B8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" };

                    return (
                      <motion.div key={camp.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>

                        {/* Campaign header */}
                        <div className="px-6 py-5"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: `${client.color}06` }}>
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2.5 mb-1">
                                <h3 className="text-base font-bold" style={{ color: "#F0F0F0" }}>{camp.name}</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                  style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
                                  {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{camp.objective}</p>
                            </div>
                            <div className="flex gap-1.5 flex-wrap justify-end flex-shrink-0">
                              {camp.platforms.map((p) => (
                                <span key={p} className="text-[10px] px-2 py-0.5 rounded-lg font-medium"
                                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Metrics row */}
                          <div className="flex items-center gap-6">
                            {[
                              { label: "Orçamento",  value: camp.budget },
                              { label: "Investido",  value: camp.spent },
                              { label: "Alcance",    value: camp.reach },
                              { label: "Leads",      value: camp.leads.toString() },
                              { label: "CPA",        value: camp.cpa },
                              ...(camp.roas ? [{ label: "ROAS", value: camp.roas }] : []),
                              { label: "No CRM",     value: camp.crmLeads.toString() },
                            ].map((m) => (
                              <div key={m.label}>
                                <div className="text-[9px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{m.label}</div>
                                <div className="text-sm font-bold" style={{ color: "#F0F0F0" }}>{m.value}</div>
                              </div>
                            ))}
                            <div className="ml-auto text-right">
                              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Progresso</div>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                                  <div className="h-full rounded-full" style={{ width: `${progress}%`, background: client.color }} />
                                </div>
                                <span className="text-xs font-bold" style={{ color: client.color }}>{progress}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 space-y-6">

                          {/* ── Collaboration flow ── */}
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Zap className="w-3.5 h-3.5" style={{ color: client.color }} />
                              <h4 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Fluxo de Colaboração dos Agentes</h4>
                            </div>
                            <div className="flex items-start gap-1 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                              {camp.phases.map((phase, i) => {
                                const agentDef = MARKETING_TEAM.find(a => a.id === phase.agentId);
                                const phaseColor = PHASE_AGENT_COLOR[phase.agentId] ?? "#94A3B8";
                                return (
                                  <div key={phase.id} className="flex items-start gap-1 flex-shrink-0">
                                    <div className="flex flex-col items-center w-[120px]">
                                      {/* Status indicator + box */}
                                      <div className="relative w-full rounded-xl p-3 text-center"
                                        style={{
                                          background: phase.status === "done"
                                            ? `${phaseColor}12`
                                            : phase.status === "active"
                                            ? `${phaseColor}20`
                                            : "rgba(255,255,255,0.02)",
                                          border: phase.status === "done"
                                            ? `1px solid ${phaseColor}30`
                                            : phase.status === "active"
                                            ? `1px solid ${phaseColor}50`
                                            : "1px solid rgba(255,255,255,0.06)",
                                          boxShadow: phase.status === "active"
                                            ? `0 0 20px -6px ${phaseColor}40`
                                            : "none",
                                        }}>
                                        {phase.status === "active" && (
                                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: phaseColor }} />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: phaseColor }} />
                                          </span>
                                        )}
                                        <div className="w-7 h-7 rounded-lg mx-auto mb-1.5 flex items-center justify-center text-[11px] font-bold"
                                          style={{ background: `${phaseColor}20`, border: `1px solid ${phaseColor}35`, color: phaseColor }}>
                                          {agentDef?.initial ?? "?"}
                                        </div>
                                        <div className="text-[9px] font-bold mb-0.5" style={{ color: phaseColor }}>{agentDef?.name ?? phase.agentId}</div>
                                        <div className="text-[9px] leading-tight" style={{ color: "rgba(255,255,255,0.45)" }}>{phase.label}</div>
                                        {phase.status === "done" && (
                                          <div className="mt-1.5">
                                            <CheckCircle2 className="w-3 h-3 mx-auto" style={{ color: phaseColor, opacity: 0.8 }} />
                                          </div>
                                        )}
                                        {phase.status === "pending" && (
                                          <div className="mt-1.5">
                                            <Clock className="w-3 h-3 mx-auto" style={{ color: "rgba(255,255,255,0.2)" }} />
                                          </div>
                                        )}
                                        {phase.output && (
                                          <div className="mt-2 text-[8px] leading-tight px-1"
                                            style={{ color: "rgba(255,255,255,0.3)" }}>
                                            {phase.output.length > 55 ? phase.output.slice(0, 55) + "…" : phase.output}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {i < camp.phases.length - 1 && (
                                      <div className="flex-shrink-0 mt-6">
                                        <ArrowRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.15)" }} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* ── Remarketing audiences ── */}
                          {camp.remarketing.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <Repeat2 className="w-3.5 h-3.5" style={{ color: "#F97316" }} />
                                <h4 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Audiências de Remarketing</h4>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {camp.remarketing.map((aud) => {
                                  const Icon = REMARK_TYPE_ICON[aud.type] ?? Target;
                                  const isActive = aud.status === "ativa";
                                  return (
                                    <div key={aud.id} className="rounded-xl p-3.5"
                                      style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${isActive ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)"}` }}>
                                      <div className="flex items-start gap-2.5 mb-2">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                          style={{ background: isActive ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.04)", border: isActive ? "1px solid rgba(249,115,22,0.25)" : "1px solid rgba(255,255,255,0.06)" }}>
                                          <Icon className="w-3.5 h-3.5" style={{ color: isActive ? "#F97316" : "rgba(255,255,255,0.2)" }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-[11px] font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.8)" }}>{aud.name}</div>
                                          <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{REMARK_TYPE_LABEL[aud.type]} · {aud.platform}</div>
                                        </div>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                                          style={{ background: isActive ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)", color: isActive ? "#34D399" : "rgba(255,255,255,0.3)" }}>
                                          {isActive ? "Ativa" : "Pausada"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div>
                                          <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>Audiência</div>
                                          <div className="text-xs font-semibold" style={{ color: "#F0F0F0" }}>{aud.size}</div>
                                        </div>
                                        {aud.cpa && (
                                          <div>
                                            <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>CPA</div>
                                            <div className="text-xs font-semibold" style={{ color: "#34D399" }}>{aud.cpa}</div>
                                          </div>
                                        )}
                                        {aud.leadsThisWeek !== undefined && (
                                          <div>
                                            <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>Leads (7d)</div>
                                            <div className="text-xs font-semibold" style={{ color: "#60A5FA" }}>{aud.leadsThisWeek}</div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* ── CRM integration note ── */}
                          <div className="rounded-xl p-4 flex items-start gap-3"
                            style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)" }}>
                            <Users className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#A78BFA" }} />
                            <div>
                              <div className="text-xs font-semibold mb-0.5" style={{ color: "#A78BFA" }}>
                                {camp.crmLeads} leads desta campanha no CRM
                              </div>
                              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                Eduardo está nutrindo estes contatos com follow-up via WhatsApp. Cada lead qualificado entra automaticamente no pipeline de vendas.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

            {/* ══════════════════════════════════════════════════════
                AGENTES IA — TIME DE MARKETING
            ══════════════════════════════════════════════════════ */}
            {activeTab === "agents" && (
              <div className="space-y-5">

                {/* ── Passo 1 — Lia (Briefing) ── */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: clientBriefing ? "rgba(56,189,248,0.05)" : "rgba(56,189,248,0.08)",
                    border: clientBriefing ? "1px solid rgba(56,189,248,0.25)" : "1px solid rgba(56,189,248,0.4)",
                    boxShadow: clientBriefing ? "none" : "0 0 40px -16px rgba(56,189,248,0.3)",
                  }}>
                  <div className="px-5 py-4 flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm"
                        style={{ background: "#38BDF818", border: "1px solid #38BDF835", color: "#38BDF8" }}>
                        L
                      </div>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(56,189,248,0.12)", color: "#38BDF8", border: "1px solid rgba(56,189,248,0.25)" }}>
                          Passo 1
                        </span>
                        <span className="text-sm font-bold" style={{ color: "#F0F0F0" }}>Lia</span>
                        <span className="text-[10px]" style={{ color: "#38BDF8" }}>Agente de Diagnóstico</span>
                        {clientBriefing && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#34D399" }}>
                            <CheckCircle2 className="w-3 h-3" /> Briefing concluído
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {clientBriefing
                          ? "Contexto do cliente carregado — todos os agentes respondem com base no briefing."
                          : "Colete o briefing antes de enviar demandas para Luna. Sem ele, os agentes não têm contexto do cliente."}
                      </p>
                      <button
                        onClick={() => { setSelectedAgentId(selectedAgentId === "briefing" ? null : "briefing"); setViewingAgentId(null); setAgentInstruction(""); clearAgentFile(); }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: clientBriefing ? "rgba(56,189,248,0.1)" : "#38BDF8",
                          color: clientBriefing ? "#38BDF8" : "#07080A",
                          border: clientBriefing ? "1px solid rgba(56,189,248,0.3)" : "none",
                          boxShadow: clientBriefing ? "none" : "0 0 20px -4px rgba(56,189,248,0.5)",
                        }}>
                        {clientBriefing ? <><RefreshCw className="w-3.5 h-3.5" /> Atualizar Briefing</> : <><Zap className="w-3.5 h-3.5" /> Iniciar Briefing</>}
                      </button>
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/briefing?clientId=${id}`;
                          navigator.clipboard.writeText(link);
                          toast.success("Link copiado! Envie para o cliente preencher.");
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: "rgba(56,189,248,0.07)", color: "rgba(56,189,248,0.7)", border: "1px solid rgba(56,189,248,0.2)" }}>
                        <Link2 className="w-3.5 h-3.5" /> Compartilhar link
                      </button>
                      {clientBriefing && (
                        <button
                          onClick={() => {
                            if (!confirm("Limpar todos os dados do briefing e conversas deste cliente?")) return;
                            [`client-briefing-${id}`, `client-briefing-diagnosis-${id}`, `client-briefing-raw-${id}`, `agent-chats-${id}`, `agent-conv-${id}`]
                              .forEach(k => localStorage.removeItem(k));
                            setClientBriefing(null);
                            setAgentChats({});
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{ background: "rgba(239,68,68,0.07)", color: "rgba(239,68,68,0.6)", border: "1px solid rgba(239,68,68,0.15)" }}>
                          <Trash2 className="w-3 h-3" /> Limpar dados
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Briefing preenchido — grid de campos */}
                  {clientBriefing && selectedAgentId !== "briefing" && (() => {
                    const b = clientBriefing as any;
                    const fields = [
                      { label: "Nome da marca",      value: b.empresa || client.name,                    full: false },
                      { label: "Segmento / nicho",   value: b.segmento || client.industry,               full: false },
                      { label: "Público-alvo",       value: b.clienteIdeal,                              full: false },
                      { label: "Plataformas ativas", value: b.canaisAtivos?.join(" · ") || null,         full: false },
                      { label: "Frequência de posts",value: b.frequencia,                                full: false },
                      { label: "Objetivo 90 dias",   value: b.meta90dias,                                full: false },
                      { label: "Dor principal",      value: b.dorPrincipal,                              full: true  },
                      { label: "Diferenciais",       value: b.diferencial,                               full: true  },
                    ];
                    return (
                      <div className="px-5 pb-4 grid grid-cols-2 gap-2"
                        style={{ borderTop: "1px solid rgba(56,189,248,0.1)", paddingTop: "12px" }}>
                        {fields.map(({ label, value, full }) => (
                          <div key={label}
                            className={`rounded-xl p-3 ${full ? "col-span-2" : ""}`}
                            style={{ background: value ? "rgba(56,189,248,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${value ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)"}` }}>
                            <div className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: value ? "rgba(56,189,248,0.6)" : "rgba(255,255,255,0.15)" }}>
                              {label}
                            </div>
                            <p className="text-[11px] leading-relaxed" style={{ color: value ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.18)" }}>
                              {value || "Não coletado"}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Painel Lia inline */}
                  <AnimatePresence>
                    {selectedAgentId === "briefing" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                        style={{ borderTop: "1px solid rgba(56,189,248,0.15)" }}>
                        <div className="px-5 py-4">
                          <LiaBriefingPanel
                            clientId={client.id}
                            clientName={client.name}
                            clientIndustry={client.industry}
                            supabaseClientId={portalClientUUID ?? undefined}
                            userId={user?.id}
                            onClose={() => setSelectedAgentId(null)}
                            onBriefingSaved={(saved) => setClientBriefing(saved)}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ── Passo 2 — Luna (Orquestradora) ── */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(185,255,75,0.04)",
                    border: "1px solid rgba(185,255,75,0.2)",
                    boxShadow: "0 0 48px -16px rgba(185,255,75,0.15)",
                  }}>

                  {/* Status row — tudo em linha, com wrap */}
                  <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 pb-4 flex-wrap">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: "#B9FF4B", boxShadow: "0 0 24px -4px rgba(185,255,75,0.55)" }}>
                        <Zap className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: "#07080A" }} />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)" }}>
                        Passo 2
                      </span>
                      <h3 className="text-base font-bold" style={{ color: "#F0F0F0" }}>Luna</h3>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap"
                        style={{ background: "rgba(185,255,75,0.12)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.25)" }}>
                        Orquestradora
                      </span>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#B9FF4B" }} />
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#B9FF4B" }} />
                      </span>
                      <span className="text-xs whitespace-nowrap" style={{ color: "rgba(185,255,75,0.7)" }}>Coordenando o time</span>
                      <span className="text-sm break-words min-w-0" style={{ color: "rgba(255,255,255,0.45)" }}>
                        · {client.orchestratorStatus}
                      </span>
                    </div>

                    {/* Plano — chips em linha com wrap */}
                    <div className="flex flex-wrap gap-2 w-full">
                      {client.orchestratorPlan.map((step, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                          style={{
                            background: step.done ? "rgba(52,211,153,0.07)" : step.active ? "rgba(185,255,75,0.08)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${step.done ? "rgba(52,211,153,0.2)" : step.active ? "rgba(185,255,75,0.2)" : "rgba(255,255,255,0.06)"}`,
                          }}>
                          {step.done
                            ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#34D399" }} />
                            : step.active
                            ? <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                            : <Circle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.15)" }} />
                          }
                          <span className="text-[11px] leading-tight break-words"
                            style={{ color: step.done ? "rgba(52,211,153,0.8)" : step.active ? "#B9FF4B" : "rgba(255,255,255,0.3)" }}>
                            {step.step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Instrução à Luana — full-width bottom ── */}
                  <div className="px-6 pb-6" style={{ borderTop: "1px solid rgba(185,255,75,0.1)", paddingTop: "20px" }}>
                    <div className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: "rgba(185,255,75,0.5)" }}>
                      Dar instrução ao time
                    </div>
                    <textarea
                      value={agentCommand}
                      onChange={(e) => setAgentCommand(e.target.value)}
                      placeholder="Ex: Crie 3 posts sobre a nova lei de licitações com foco em gestores municipais..."
                      rows={2}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none mb-3"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(185,255,75,0.18)", color: "#F0F0F0", outline: "none" }}
                    />

                    {/* Site URL reference */}
                    {showSiteInput && (
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(185,255,75,0.5)" }} />
                        <input
                          type="url"
                          value={siteUrl}
                          onChange={(e) => setSiteUrl(e.target.value)}
                          placeholder="https://site-do-cliente.com.br"
                          className="flex-1 rounded-lg px-3 py-1.5 text-[12px]"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(185,255,75,0.25)", color: "#F0F0F0", outline: "none" }}
                          onFocus={(e) => (e.target.style.borderColor = "rgba(185,255,75,0.5)")}
                          onBlur={(e) => (e.target.style.borderColor = "rgba(185,255,75,0.25)")}
                        />
                        <button onClick={() => { setSiteUrl(""); setShowSiteInput(false); }}
                          style={{ color: "rgba(255,255,255,0.25)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* hidden file input for ARIA */}
                    <input ref={fileInputRef} type="file"
                      accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.csv,.xlsx"
                      className="hidden"
                      onChange={handleAriaFileChange} />

                    {/* File preview */}
                    {attachedFile && renderFilePreview(attachedFile, attachedFileUrl, attachedFileText, "#B9FF4B")}

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {attachedFile ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
                          style={{ background: "rgba(185,255,75,0.08)", border: "1px solid rgba(185,255,75,0.2)" }}>
                          {attachedFile.type.startsWith("image/")
                            ? <Image className="w-3 h-3 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                            : <FileText className="w-3 h-3 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                          }
                          <span className="text-[11px] font-medium max-w-[140px] truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
                            {attachedFile.name}
                          </span>
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                            {(attachedFile.size / 1024).toFixed(0)} KB
                          </span>
                          <button onClick={clearAriaFile}
                            style={{ color: "rgba(255,255,255,0.3)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0"
                            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px dashed rgba(255,255,255,0.14)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(185,255,75,0.35)"; e.currentTarget.style.color = "rgba(185,255,75,0.75)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
                            <Paperclip className="w-3 h-3" /> Anexar
                          </button>
                          <button
                            onClick={() => setShowSiteInput(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0"
                            style={{
                              background: siteUrl ? "rgba(185,255,75,0.08)" : "rgba(255,255,255,0.04)",
                              color: siteUrl ? "#B9FF4B" : "rgba(255,255,255,0.35)",
                              border: siteUrl ? "1px solid rgba(185,255,75,0.3)" : "1px dashed rgba(255,255,255,0.14)",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(185,255,75,0.35)"; e.currentTarget.style.color = "rgba(185,255,75,0.75)"; }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = siteUrl ? "rgba(185,255,75,0.3)" : "rgba(255,255,255,0.14)";
                              e.currentTarget.style.color = siteUrl ? "#B9FF4B" : "rgba(255,255,255,0.35)";
                            }}>
                            <Globe className="w-3 h-3" /> {siteUrl ? "Site ✓" : "Site"}
                          </button>
                        </>
                      )}
                      <button
                        onClick={handleSendToAria}
                        disabled={(!agentCommand.trim() && !attachedFile) || ariaLoading}
                        className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 w-full sm:w-auto sm:ml-auto"
                        style={{ background: "#B9FF4B", color: "#07080A", boxShadow: (agentCommand || attachedFile) ? "0 0 20px -4px rgba(185,255,75,0.5)" : "none" }}>
                        {ariaLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Orquestrando...</> : <><Send className="w-3.5 h-3.5" /> Enviar para Luna</>}
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* ── AIRA — Ouvir Reunião ── */}
                <style>{`
                  @keyframes aira-bar { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
                  .aira-bar { transform-origin: bottom; animation: aira-bar 1s ease-in-out infinite; }
                  .aira-bar:nth-child(1){animation-delay:0s}
                  .aira-bar:nth-child(2){animation-delay:.1s}
                  .aira-bar:nth-child(3){animation-delay:.2s}
                  .aira-bar:nth-child(4){animation-delay:.3s}
                  .aira-bar:nth-child(5){animation-delay:.4s}
                  .aira-bar:nth-child(6){animation-delay:.3s}
                  .aira-bar:nth-child(7){animation-delay:.2s}
                  .aira-bar:nth-child(8){animation-delay:.1s}
                  .aira-bar:nth-child(9){animation-delay:0s}
                `}</style>
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: airaStatus === "recording" ? "rgba(239,68,68,0.04)" : "rgba(185,255,75,0.03)",
                    border: `1px solid ${airaStatus === "recording" ? "rgba(239,68,68,0.25)" : "rgba(185,255,75,0.15)"}`,
                    transition: "all 0.4s ease",
                  }}>

                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 flex-wrap"
                    style={{ borderBottom: `1px solid ${airaStatus === "recording" ? "rgba(239,68,68,0.1)" : "rgba(185,255,75,0.08)"}` }}>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: airaStatus === "recording" ? "rgba(239,68,68,0.12)" : "rgba(185,255,75,0.1)", border: `1px solid ${airaStatus === "recording" ? "rgba(239,68,68,0.3)" : "rgba(185,255,75,0.2)"}` }}>
                        <Mic className="w-5 h-5" style={{ color: airaStatus === "recording" ? "#EF4444" : "#B9FF4B" }} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-sm font-bold" style={{ color: "#F0F0F0" }}>AIRA</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                          style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)" }}>
                          Ouvir Reunião
                        </span>
                        {airaStatus === "recording" && (
                          <span className="relative flex h-2 w-2 flex-shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#EF4444" }} />
                            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#EF4444" }} />
                          </span>
                        )}
                        <p className="text-[11px] break-words min-w-0" style={{ color: "rgba(255,255,255,0.4)" }}>
                          · {airaStatus === "idle" && "Escuta a reunião e gera resumo no WhatsApp"}
                          {airaStatus === "loading" && "Processando..."}
                          {airaStatus === "recording" && "Ao vivo — ouvindo a reunião"}
                          {airaStatus === "paused" && "Pausado — retome quando quiser"}
                          {airaStatus === "done" && (airaOnlyLuana ? "Resumo salvo para Luna ✓" : "Resumo enviado ✓")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Botão Nova reunião */}
                      {airaStatus === "done" && (
                        <button onClick={() => { setAiraStatus("idle"); setAiraSummary(null); setAiraElapsed(0); }}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          Nova reunião
                        </button>
                      )}

                      {airaStatus === "recording" && (
                        <button onClick={() => {
                          try { airaRecorderRef.current?.pause(); } catch {}
                          if (airaTimerRef.current) clearInterval(airaTimerRef.current);
                          setAiraStatus("paused");
                        }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                          ⏸ Pausar
                        </button>
                      )}

                      {airaStatus === "paused" && (
                        <button onClick={() => {
                          try { airaRecorderRef.current?.resume(); } catch {}
                          airaTimerRef.current = setInterval(() => setAiraElapsed(s => s + 1), 1000);
                          setAiraStatus("recording");
                        }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={{ background: "rgba(185,255,75,0.12)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.3)" }}>
                          ▶ Continuar
                        </button>
                      )}

                      {(airaStatus === "recording" || airaStatus === "paused") && (
                        <button onClick={airaFinalize}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                          style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                          <StopCircle className="w-4 h-4" /> Parar e enviar
                        </button>
                      )}

                      {(airaStatus === "idle" || airaStatus === "loading") && (
                        <button
                          disabled={airaStatus === "loading"}
                          onClick={async () => {
                            setAiraShowSetup(true);
                            if (wpStatus !== "connected") { try { await checkWpStatus(); } catch {} }
                            else if (wpGroups.length === 0) {
                              setAiraLoadingGroups(true);
                              try {
                                const { data: grps } = await wpInvoke({ action: "groups" });
                                if (Array.isArray(grps)) setWpGroups(grps);
                              } catch {}
                              setAiraLoadingGroups(false);
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                          style={{ background: "#B9FF4B", color: "#07080A", boxShadow: "0 0 20px -4px rgba(185,255,75,0.4)" }}>
                          {airaStatus === "loading"
                            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Processando</>
                            : <><Mic className="w-4 h-4" /> Ouvir Reunião</>}
                        </button>
                      )}
                    </div>
                  </div>

                  {(airaStatus === "recording" || airaStatus === "paused") && (
                    <div className="px-6 pt-3 text-center text-xs font-mono" style={{ color: airaStatus === "paused" ? "#F59E0B" : "#EF4444" }}>
                      {fmtTime(airaElapsed)}
                    </div>
                  )}

                  {/* Área de gravação ao vivo */}
                  {(airaStatus === "recording" || airaStatus === "paused") && (
                    <div className="px-6 py-8 flex flex-col items-center gap-5"
                      style={{ background: airaStatus === "paused" ? "rgba(245,158,11,0.03)" : "rgba(239,68,68,0.03)" }}>
                      {/* Waveform */}
                      <div className="flex items-end gap-1" style={{ height: 48 }}>
                        {[18,28,38,44,48,44,38,28,18].map((h, i) => (
                          <div key={i}
                            className={airaStatus === "recording" ? "aira-bar rounded-full" : "rounded-full"}
                            style={{ width: 5, height: airaStatus === "paused" ? 8 : h, background: airaStatus === "paused" ? "linear-gradient(to top, #F59E0B, #FCD34D)" : "linear-gradient(to top, #EF4444, #FCA5A5)", opacity: 0.85, transition: "height 0.3s ease" }} />
                        ))}
                      </div>
                      {/* Texto */}
                      <div className="text-center">
                        {airaStatus === "recording" && (
                          <>
                            <p className="text-lg font-bold mb-1" style={{ color: "#EF4444" }}>
                              Estou ouvindo...
                              <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>
                                ● gravando
                              </span>
                            </p>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                              A AIRA está captando tudo. Use <strong style={{ color: "rgba(255,255,255,0.5)" }}>Pausar</strong> para interromper ou <strong style={{ color: "rgba(255,255,255,0.5)" }}>Parar</strong> para encerrar e gerar o resumo.
                            </p>
                          </>
                        )}
                        {airaStatus === "paused" && (
                          <>
                            <p className="text-lg font-bold mb-1" style={{ color: "#F59E0B" }}>Pausado</p>
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                              Gravação em pausa. Clique em <strong style={{ color: "rgba(255,255,255,0.5)" }}>Continuar</strong> para retomar ou <strong style={{ color: "rgba(255,255,255,0.5)" }}>Parar</strong> para encerrar.
                            </p>
                          </>
                        )}
                        {airaLiveText && (
                          <div className="mt-3 px-3 py-2 rounded-lg max-h-24 overflow-y-auto text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{airaLiveText}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Processando resumo */}
                  {airaStatus === "loading" && (
                    <div className="px-6 py-8 flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin" style={{ color: "#B9FF4B" }} />
                      <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Gerando resumo da reunião...</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Você receberá no WhatsApp em instantes</p>
                    </div>
                  )}

                  {/* Erro */}
                  {airaError && (
                    <div className="px-6 py-3 text-xs" style={{ color: "#FCA5A5", background: "rgba(239,68,68,0.06)", borderTop: "1px solid rgba(239,68,68,0.12)" }}>
                      {airaError}
                    </div>
                  )}

                  {/* Resumo pós-reunião */}
                  {airaStatus === "done" && airaSummary && (
                    <div className="px-6 py-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" style={{ color: "#B9FF4B" }} />
                          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#B9FF4B" }}>
                            Resumo da Reunião
                          </p>
                        </div>
                        <button
                          onClick={() => { setAiraShowShare(s => !s); setAiraShareResult(null); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: airaShowShare ? "rgba(185,255,75,0.15)" : "rgba(255,255,255,0.06)", color: airaShowShare ? "#B9FF4B" : "rgba(255,255,255,0.6)", border: `1px solid ${airaShowShare ? "rgba(185,255,75,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                          <Send className="w-3 h-3" /> Compartilhar
                        </button>
                      </div>
                      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.7)" }}>
                          {airaSummary}
                        </p>
                      </div>
                      {airaShowShare && (
                        <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(185,255,75,0.04)", border: "1px solid rgba(185,255,75,0.15)" }}>
                          <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>Enviar resumo via WhatsApp</p>
                          <div className="flex gap-2">
                            <input
                              value={airaSharePhone}
                              onChange={(e) => setAiraSharePhone(e.target.value)}
                              placeholder="Telefone: 5585987654321"
                              className="flex-1 px-3 py-2 rounded-lg text-sm"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0" }}
                            />
                            <button
                              onClick={airaShareNow}
                              disabled={airaShareSending || !airaSharePhone.trim()}
                              className="px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-40"
                              style={{ background: "#B9FF4B", color: "#07080A" }}>
                              {airaShareSending ? "..." : "Enviar"}
                            </button>
                          </div>
                          {airaShareResult && (
                            <p className="text-xs" style={{ color: airaShareResult.startsWith("Erro") ? "#FCA5A5" : "#B9FF4B" }}>
                              {airaShareResult}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Modal de setup AIRA */}
                {airaShowSetup && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setAiraShowSetup(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "#0F1014", border: "1px solid rgba(185,255,75,0.2)" }}>
                      <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                        <h3 className="text-base font-bold" style={{ color: "#F0F0F0" }}>Configurar reunião</h3>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>A AIRA capta e transcreve a reunião, gerando um resumo executivo automático.</p>
                      </div>
                      <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {/* Toggle: Somente para Luna */}
                        <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer" style={{ background: airaOnlyLuana ? "rgba(185,255,75,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${airaOnlyLuana ? "rgba(185,255,75,0.3)" : "rgba(255,255,255,0.08)"}` }}>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: airaOnlyLuana ? "#B9FF4B" : "#F0F0F0" }}>Somente para Luna</p>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>O resumo fica só na plataforma, sem envio por WhatsApp</p>
                          </div>
                          <input type="checkbox" checked={airaOnlyLuana} onChange={(e) => setAiraOnlyLuana(e.target.checked)} className="w-4 h-4 accent-lime-400" />
                        </label>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Título da reunião (opcional)</label>
                          <input value={airaMeetingTitle} onChange={(e) => setAiraMeetingTitle(e.target.value)} placeholder="Ex: Alinhamento estratégico"
                            className="w-full mt-1 px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F0F0" }} />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Tipo de reunião</label>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            {([
                              { v: "mic", t: "🎙️ Presencial", d: "Microfone capta a sala" },
                              { v: "system", t: "💻 Online", d: "Áudio da reunião virtual" },
                              { v: "both", t: "🎙️+💻 Híbrida", d: "Mic + áudio do PC" },
                            ] as const).map(opt => {
                              const sel = airaSource === opt.v;
                              return (
                                <button key={opt.v} onClick={() => airaSaveSource(opt.v)} type="button"
                                  className="p-2 rounded-lg text-left transition-all"
                                  style={{ background: sel ? "rgba(185,255,75,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${sel ? "rgba(185,255,75,0.4)" : "rgba(255,255,255,0.08)"}` }}>
                                  <div className="text-xs font-semibold" style={{ color: sel ? "#B9FF4B" : "#F0F0F0" }}>{opt.t}</div>
                                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{opt.d}</div>
                                </button>
                              );
                            })}
                          </div>
                          {airaSource === "mic" && (
                            <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                              🎙️ A AIRA vai usar o <strong style={{ color: "#B9FF4B" }}>microfone do seu computador</strong> para captar as vozes da reunião presencial.
                            </p>
                          )}
                          {airaSource !== "mic" && (
                            <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                              💡 O navegador pedirá para compartilhar uma aba ou tela — <strong style={{ color: "#B9FF4B" }}>marque "Compartilhar áudio do sistema/aba"</strong>. Funciona melhor no Chrome/Edge.
                            </p>
                          )}
                        </div>
                        {!airaOnlyLuana && <div className="rounded-xl p-3" style={{ background: "rgba(185,255,75,0.04)", border: "1px solid rgba(185,255,75,0.15)" }}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#B9FF4B" }}>Grupos do WhatsApp</label>
                            <button
                              onClick={async () => {
                                setAiraLoadingGroups(true);
                                try {
                                  const { data: grps } = await wpInvoke({ action: "groups" });
                                  if (Array.isArray(grps)) setWpGroups(grps);
                                } catch {}
                                setAiraLoadingGroups(false);
                              }}
                              className="text-[11px] px-2 py-1 rounded-lg" style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B" }}>
                              {airaLoadingGroups ? "Carregando..." : "↻ Atualizar"}
                            </button>
                          </div>
                          {wpStatus !== "connected" ? (
                            <p className="text-xs" style={{ color: "#FCA5A5" }}>WhatsApp não conectado. Conecte na aba WhatsApp.</p>
                          ) : wpGroups.length === 0 ? (
                            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{airaLoadingGroups ? "Buscando grupos..." : "Nenhum grupo encontrado. Clique em Atualizar."}</p>
                          ) : (
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {wpGroups.map((g) => {
                                const sel = airaSelectedGroups.includes(g.id);
                                return (
                                  <label key={g.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm"
                                    style={{ background: sel ? "rgba(185,255,75,0.08)" : "transparent", color: "#F0F0F0" }}>
                                    <input type="checkbox" checked={sel}
                                      onChange={() => airaSaveGroups(sel ? airaSelectedGroups.filter(x => x !== g.id) : [...airaSelectedGroups, g.id])} />
                                    <span className="flex-1 truncate">{g.name}</span>
                                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{g.participants}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>}
                        {!airaOnlyLuana && <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Participantes individuais (opcional)</label>
                            <button onClick={() => airaSaveParticipants([...airaParticipants, { name: "", phone: "" }])}
                              className="text-[11px] px-2 py-1 rounded-lg" style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B" }}>+ Adicionar</button>
                          </div>
                          <div className="space-y-2">
                            {airaParticipants.map((p, i) => (
                              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                <input value={p.name} onChange={(e) => { const c = [...airaParticipants]; c[i] = { ...c[i], name: e.target.value }; airaSaveParticipants(c); }} placeholder="Nome"
                                  className="px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F0F0" }} />
                                <input value={p.phone} onChange={(e) => { const c = [...airaParticipants]; c[i] = { ...c[i], phone: e.target.value.replace(/\D/g,"") }; airaSaveParticipants(c); }} placeholder="5511..."
                                  className="px-3 py-2 rounded-lg text-sm font-mono" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F0F0" }} />
                                <button onClick={() => airaSaveParticipants(airaParticipants.filter((_, idx) => idx !== i))}
                                  className="px-2 py-2 rounded-lg text-xs" style={{ color: "#F87171", background: "rgba(239,68,68,0.08)" }}>✕</button>
                              </div>
                            ))}
                          </div>
                        </div>}
                        {!airaOnlyLuana && (
                          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                            💡 Selecione um grupo do WhatsApp e/ou adicione participantes individuais. Telefones em formato internacional: <code>5511987654321</code>
                          </p>
                        )}
                      </div>
                      <div className="px-6 py-4 flex justify-end gap-2 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                        <button onClick={() => setAiraShowSetup(false)} className="px-4 py-2 text-sm rounded-lg" style={{ color: "rgba(255,255,255,0.5)" }}>Cancelar</button>
                        <button onClick={() => { setAiraShowSetup(false); airaStartRecording(); }}
                          disabled={!airaOnlyLuana && airaSelectedGroups.length === 0 && airaParticipants.filter(p => p.phone).length === 0}
                          className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-40"
                          style={{ background: "#B9FF4B", color: "#07080A" }}>
                          <Mic className="w-4 h-4 inline mr-1" /> Começar a ouvir
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Conversa do Time / Sala de Diagnóstico ── */}
                {agentConversations.length > 0 && (
                  <div className="rounded-2xl overflow-hidden" style={{
                    background: isDiagnosticMode ? "rgba(185,255,75,0.02)" : "rgba(255,255,255,0.02)",
                    border: isDiagnosticMode ? "1px solid rgba(185,255,75,0.15)" : "1px solid rgba(255,255,255,0.07)",
                  }}>
                    <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: isDiagnosticMode ? "1px solid rgba(185,255,75,0.12)" : "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-2">
                        {isDiagnosticMode
                          ? <span className="text-base">🔍</span>
                          : <MessageCircle className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />}
                        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: isDiagnosticMode ? "#B9FF4B" : "rgba(255,255,255,0.3)" }}>
                          {isDiagnosticMode ? "Sala de Diagnóstico — ao vivo" : "Conversa do Time"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B" }}>{agentConversations.length}</span>
                        {isDiagnosticMode && ariaLoading && (
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: "rgba(185,255,75,0.15)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.3)" }}>
                            ● ao vivo
                          </motion.span>
                        )}
                      </div>
                      <button onClick={() => { setAgentConversations([]); setAgentOutputs({}); setIsDiagnosticMode(false); localStorage.removeItem(`agent-conv-${id}`); }}
                        className="text-[10px] transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>
                        Limpar
                      </button>
                    </div>
                    <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                      {agentConversations.map((msg) => {
                        // Indicador de digitação animado
                        if (msg.action === "typing" || (msg.status === "processing" && msg.content === "")) {
                          const typingMeta = AGENT_META[msg.from] ?? { initial: msg.from[0]?.toUpperCase(), color: "#B9FF4B", name: msg.from };
                          return (
                            <motion.div key={msg.id}
                              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                              style={{ background: `${typingMeta.color}06`, border: `1px solid ${typingMeta.color}15` }}>
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                                style={{ background: `${typingMeta.color}20`, border: `1px solid ${typingMeta.color}40`, color: typingMeta.color }}>
                                {typingMeta.initial}
                              </div>
                              <span className="text-[11px] font-semibold" style={{ color: typingMeta.color }}>{typingMeta.name}</span>
                              <div className="flex gap-1 items-center ml-1">
                                {[0, 1, 2].map((i) => (
                                  <motion.div key={i}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: typingMeta.color }}
                                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                                    transition={{ delay: i * 0.18, repeat: Infinity, duration: 1 }} />
                                ))}
                              </div>
                              <span className="text-[10px] ml-auto" style={{ color: "rgba(255,255,255,0.2)" }}>{msg.timestamp}</span>
                            </motion.div>
                          );
                        }

                        // Síntese especial da Laura
                        if (msg.from === "laura" && msg.action === "laura-synthesis") {
                          return (
                            <motion.div key={msg.id}
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5 }}
                              className="rounded-2xl overflow-hidden"
                              style={{ background: "linear-gradient(135deg, rgba(185,255,75,0.07) 0%, rgba(185,255,75,0.02) 100%)", border: "2px solid rgba(185,255,75,0.3)" }}>
                              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid rgba(185,255,75,0.18)", background: "rgba(185,255,75,0.05)" }}>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-black flex-shrink-0"
                                  style={{ background: "rgba(185,255,75,0.2)", border: "2px solid rgba(185,255,75,0.5)", color: "#B9FF4B" }}>
                                  La
                                </div>
                                <div>
                                  <p className="text-sm font-bold" style={{ color: "#B9FF4B" }}>Laura — Orquestradora</p>
                                  <p className="text-[10px]" style={{ color: "rgba(185,255,75,0.6)" }}>Síntese Executiva do Diagnóstico</p>
                                </div>
                                <div className="ml-auto flex items-center gap-2">
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                    style={{ background: "rgba(185,255,75,0.2)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.4)" }}>
                                    ✦ Síntese Final
                                  </span>
                                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>{msg.timestamp}</span>
                                </div>
                              </div>
                              <div className="px-5 py-4">
                                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.9)" }}>{msg.content}</p>
                                {agentOutputs["laura"] && agentOutputs["laura"].length > (msg.content?.length ?? 0) + 10 && (
                                  <button
                                    onClick={() => setExpandedAgentOutput(expandedAgentOutput === "laura" ? null : "laura")}
                                    className="mt-3 text-[12px] font-bold"
                                    style={{ color: "#B9FF4B" }}>
                                    {expandedAgentOutput === "laura" ? "↑ Recolher síntese" : "↓ Ver síntese executiva completa"}
                                  </button>
                                )}
                                {expandedAgentOutput === "laura" && agentOutputs["laura"] && (
                                  <div className="mt-3 text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.8)" }}>
                                    {agentOutputs["laura"]}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        }

                        // Divisor visual de Onda
                        if (msg.action === "wave-divider") {
                          return (
                            <motion.div key={msg.id}
                              initial={{ opacity: 0, scaleX: 0.85 }} animate={{ opacity: 1, scaleX: 1 }}
                              className="flex items-center gap-3 py-2 px-1 my-1">
                              <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(185,255,75,0.35))" }} />
                              <div
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                  background: "rgba(185,255,75,0.1)",
                                  border: "1px solid rgba(185,255,75,0.3)",
                                  color: "#B9FF4B",
                                }}>
                                🌊 {msg.content}
                              </div>
                              <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(185,255,75,0.35))" }} />
                            </motion.div>
                          );
                        }

                        const fromMeta = AGENT_META[msg.from] ?? { initial: msg.from[0]?.toUpperCase(), color: "#888", name: msg.from };
                        const toMeta   = AGENT_META[msg.to]   ?? { initial: msg.to[0]?.toUpperCase(),   color: "#888", name: msg.to };
                        const isExpanded = expandedMsg === msg.id;
                        const isLong = msg.content.length > 400;
                        const isUserMsg = msg.from === "user";
                        const isAriaMsg = msg.from === "aria" && msg.to !== "user";

                        return (
                          <motion.div key={msg.id}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl overflow-hidden"
                            style={{
                              background: isUserMsg ? "rgba(148,163,184,0.06)" : `${fromMeta.color}08`,
                              border: `1px solid ${isUserMsg ? "rgba(255,255,255,0.07)" : `${fromMeta.color}20`}`,
                            }}>

                            {/* Header: quem fala com quem */}
                            <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: `1px solid ${fromMeta.color}15` }}>
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                style={{ background: `${fromMeta.color}20`, border: `1px solid ${fromMeta.color}40`, color: fromMeta.color }}>
                                {fromMeta.initial}
                              </div>
                              <span className="text-[11px] font-bold" style={{ color: fromMeta.color }}>{fromMeta.name}</span>
                              <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                style={{ background: `${toMeta.color}15`, border: `1px solid ${toMeta.color}30`, color: toMeta.color }}>
                                {toMeta.initial}
                              </div>
                              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{toMeta.name}</span>
                              <div className="flex-1" />
                              {msg.status === "processing" && <RefreshCw className="w-3 h-3 animate-spin" style={{ color: "#FBBF24" }} />}
                              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>{msg.timestamp}</span>
                            </div>

                            {/* Conteúdo da mensagem */}
                            <div className="px-4 py-3">
                              {isAriaMsg ? (
                                /* Mensagens da ARIA para agentes: briefing curto */
                                <p className="text-[11px] leading-relaxed italic" style={{ color: "rgba(255,255,255,0.4)" }}>
                                  {msg.content}
                                </p>
                              ) : (
                                /* Resposta dos agentes: conteúdo completo com markdown simples */
                                <div>
                                  <div
                                    className="text-xs leading-relaxed whitespace-pre-wrap"
                                    style={{
                                      color: msg.status === "error" ? "#FCA5A5" : "rgba(255,255,255,0.75)",
                                      maxHeight: isExpanded ? "none" : isLong ? "160px" : "none",
                                      overflow: isExpanded ? "visible" : "hidden",
                                    }}>
                                    {msg.content}
                                  </div>
                                  {isLong && (
                                    <button
                                      onClick={() => setExpandedMsg(isExpanded ? null : msg.id)}
                                      className="mt-2 text-[11px] font-semibold transition-colors"
                                      style={{ color: fromMeta.color }}>
                                      {isExpanded ? "↑ Recolher" : `↓ Ver entrega completa (${Math.ceil(msg.content.length / 5)} palavras)`}
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Imagem da Carolina */}
                              {msg.imageUrl && (
                                <div className="mt-3">
                                  <img src={msg.imageUrl} alt="gerado" className="rounded-lg max-h-56 object-cover w-full" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      onClick={() => {
                                        const beatrizMsg = [...agentConversations].reverse().find(m => m.from === "beatriz" && m.action === "respond" && m.content.length > 20);
                                        const { headline, body, cta } = parseBeatrizCopy(beatrizMsg?.content ?? "");
                                        setPostCanvas({ imageUrl: msg.imageUrl!, headline, body, cta });
                                      }}
                                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg"
                                      style={{ background: "rgba(185,255,75,0.12)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.25)" }}>
                                      <Layout className="w-3 h-3" /> Montar Post
                                    </button>
                                    <a href={msg.imageUrl} download={`marcela-${msg.id}.png`}
                                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg"
                                      style={{ background: "rgba(244,114,182,0.1)", color: "#F472B6", border: "1px solid rgba(244,114,182,0.2)" }}>
                                      Baixar
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Barra global de Ondas (visível enquanto ARIA orquestra) ── */}
                {currentWave > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl px-5 py-3 flex items-center gap-4"
                    style={{
                      background: "linear-gradient(90deg, rgba(185,255,75,0.08), rgba(185,255,75,0.02))",
                      border: "1px solid rgba(185,255,75,0.25)",
                      boxShadow: "0 0 28px -10px rgba(185,255,75,0.4)",
                    }}>
                    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#B9FF4B" }} />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#B9FF4B" }} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#B9FF4B" }}>
                          🌊 Onda {currentWave} de {Math.max(totalWaves, currentWave)}
                        </span>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>•</span>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                          {Object.entries(agentWaves).filter(([aId, w]) => w === currentWave && client.agentTasks[aId]?.status !== "concluído").length} agente(s) ativo(s) nesta onda
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "#B9FF4B" }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(currentWave / Math.max(totalWaves, currentWave, 3)) * 100}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Máx 3 ondas
                    </span>
                  </motion.div>
                )}

                {/* ── Time de Especialistas ── */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Time de Especialistas
                    </h3>
                    <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>{MARKETING_TEAM.length - 1} especialistas</span>
                    <button
                      onClick={() => setShowManualOutput(true)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0"
                      style={{ background: "rgba(185,255,75,0.08)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(185,255,75,0.14)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(185,255,75,0.08)"; }}>
                      <Plus className="w-3 h-3" /> Registrar entrega
                    </button>
                  </div>

                  {/* ── Barra de progresso do time ── */}
                  {(() => {
                    const done = MARKETING_TEAM.filter(a => client.agentTasks[a.id]?.status === "concluído").length;
                    const working = MARKETING_TEAM.filter(a => client.agentTasks[a.id]?.status === "trabalhando").length;
                    const pct = Math.round((done / MARKETING_TEAM.length) * 100);
                    return (
                      <div className="mb-4 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="font-bold" style={{ color: "#B9FF4B" }}>{done} concluídos</span>
                            {working > 0 && (
                              <span className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-400" />
                                </span>
                                {working} trabalhando
                              </span>
                            )}
                            <span style={{ color: "rgba(255,255,255,0.25)" }}>{MARKETING_TEAM.length - done - working} aguardando</span>
                          </div>
                          <span className="text-[10px] font-bold" style={{ color: pct === 100 ? "#34D399" : "#B9FF4B" }}>{pct}%</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <motion.div className="h-full rounded-full" style={{ background: pct === 100 ? "#34D399" : "#B9FF4B" }}
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }} />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
                    {MARKETING_TEAM.filter(a => a.id !== "briefing" && (a.id !== "rico" || id === "gnx") && (a.id !== "apolo" || id === "grupo-licita")).map((agent, i) => {
                      const task = client.agentTasks[agent.id];
                      const isWorking = task?.status === "trabalhando";
                      const isDone = task?.status === "concluído";
                      const isSelected = selectedAgentId === agent.id;
                      const isViewing = viewingAgentId === agent.id;
                      const isActive = isSelected || isViewing;

                      const currentText = agent.id === "designer"
                        ? (designerTask?.prompt ?? designerRecentWork[0] ?? "")
                        : task?.current;
                      const progress = agent.id === "designer" ? (designerTask?.progress ?? 0) : (task?.progress ?? 0);
                      const showProgress = (agent.id === "designer" ? (designerTask && designerTask.progress < 100) : isWorking) && progress > 0;

                      return (
                        <motion.div key={agent.id}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="rounded-2xl px-3 py-3 sm:px-4 sm:flex sm:flex-col"
                          style={{
                            background: isActive ? `${agent.color}0d` : "rgba(255,255,255,0.025)",
                            border: `1px solid ${isActive ? `${agent.color}40` : isWorking ? `${agent.color}28` : "rgba(255,255,255,0.07)"}`,
                            boxShadow: isActive ? `0 0 32px -10px ${agent.color}40` : isWorking ? `0 0 28px -10px ${agent.color}30` : "none",
                          }}>

                          {/* Mobile: em linha com wrap | Desktop: coluna (quadrado) */}
                          <div className="flex items-center gap-2 flex-wrap sm:flex-col sm:items-start sm:gap-2 sm:flex-nowrap sm:h-full">
                            {/* Avatar + nome + role */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                                style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}30`, color: agent.color }}>
                                {agent.initial}
                              </div>
                              <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                                <span className="text-xs font-bold leading-tight break-words" style={{ color: "rgba(255,255,255,0.9)" }}>{agent.name}</span>
                                <span className="text-[10px] leading-tight break-words" style={{ color: agent.color }}>{agent.role}</span>
                              </div>
                            </div>

                            {/* Status dot/check */}
                            {isWorking && (
                              <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: agent.color }} />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: agent.color }} />
                              </span>
                            )}
                            {isDone && !isWorking && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#34D399" }} />}

                            {/* Skill */}
                            <span className="text-[10px] break-words min-w-0" style={{ color: "rgba(255,255,255,0.32)" }}>
                              · {agent.skill}
                            </span>

                            {/* Wave + Deadline badges */}
                            {agentWaves[agent.id] && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider whitespace-nowrap"
                                style={{ background: "rgba(185,255,75,0.12)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.3)" }}>
                                🌊 Onda {agentWaves[agent.id]}
                              </span>
                            )}
                            {agentDeadlines[agent.id] && !isDone && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-semibold whitespace-nowrap"
                                style={{ background: `${agent.color}14`, color: agent.color, border: `1px solid ${agent.color}30` }}>
                                ⏱ {agentDeadlines[agent.id]}
                              </span>
                            )}

                            {/* Tarefa atual (inline) */}
                            {currentText && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] break-words min-w-0"
                                style={{ color: "rgba(255,255,255,0.55)" }}>
                                <span className="text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap"
                                  style={{ color: isWorking ? agent.color : isDone ? "#34D399" : "rgba(255,255,255,0.3)" }}>
                                  {agent.id === "designer"
                                    ? (designerTask && designerTask.progress < 100 ? "● Criando" : "✓ Feito")
                                    : (isWorking ? "● Agora" : isDone ? "✓ Feito" : "○ Aguard.")}
                                </span>
                                <span className="line-clamp-2">{currentText}</span>
                              </span>
                            )}

                            {/* Progresso inline */}
                            {showProgress && (
                              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <span className="h-1 w-16 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                  <motion.span className="h-full block rounded-full"
                                    style={{ background: agent.color }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                  />
                                </span>
                                <span className="text-[9px]" style={{ color: agent.color }}>{progress}%</span>
                              </span>
                            )}

                            {/* Última entrega resumida */}
                            {agentOutputs[agent.id] && (
                              <button
                                onClick={() => setExpandedAgentOutput(expandedAgentOutput === agent.id ? null : agent.id)}
                                className="text-[10px] font-semibold whitespace-nowrap px-2 py-0.5 rounded-md"
                                style={{ background: `${agent.color}10`, color: agent.color, border: `1px solid ${agent.color}25` }}>
                                Ver entrega ↓
                              </button>
                            )}

                            {/* Spacer: mobile → empurra botões à direita | desktop → oculto */}
                            <div className="flex-1 min-w-0 sm:hidden" />

                            {/* Ações inline */}
                            <div className="flex items-center gap-1.5 flex-wrap sm:w-full sm:mt-auto">
                              <button
                                onClick={() => {
                                  setViewingAgentId(isViewing ? null : agent.id);
                                  if (!isViewing) setSelectedAgentId(null);
                                }}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                                style={{
                                  background: isViewing ? `${agent.color}22` : `${agent.color}08`,
                                  color: agent.color,
                                  border: `1px solid ${isViewing ? `${agent.color}45` : `${agent.color}20`}`,
                                }}>
                                {isViewing ? "▲ Fechar" : "Ver"}
                              </button>
                              {agent.id !== "rico" && (
                                <button
                                  onClick={() => {
                                    setSelectedAgentId(isSelected ? null : agent.id);
                                    setViewingAgentId(null);
                                    setAgentInstruction("");
                                    clearAgentFile();
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                                  style={{
                                    background: isSelected ? `${agent.color}22` : `${agent.color}08`,
                                    color: agent.color,
                                    border: `1px solid ${isSelected ? `${agent.color}45` : `${agent.color}20`}`,
                                  }}>
                                  {isSelected ? "▲ Fechar" : agent.id === "briefing" ? "Briefing" : "Instruir"}
                                </button>
                              )}
                              {agent.id !== "briefing" && agent.id !== "tomas" && agent.id !== "rico" && (
                                <button
                                  onClick={() => {
                                    setDraftAgent(agent);
                                    setDraftForm({ platforms: [], tone: "profissional e envolvente", topic: "" });
                                    setShowDraftModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap"
                                  style={{ background: `${agent.color}12`, color: agent.color, border: `1px solid ${agent.color}25` }}>
                                  <Send className="w-3 h-3" /> Gerar post
                                </button>
                              )}
                              {agent.id === "tomas" && (
                                <button
                                  onClick={() => window.open(`/tomas?clientId=${id}&clientName=${encodeURIComponent(client.name)}`, '_blank')}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap"
                                  style={{ background: `${agent.color}12`, color: agent.color, border: `1px solid ${agent.color}25` }}>
                                  🖥️ Criar LP
                                </button>
                              )}
                              {agent.id === "rico" && (
                                <button
                                  onClick={() => window.open('/conta-report', '_blank')}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap"
                                  style={{ background: `${agent.color}18`, color: agent.color, border: `1px solid ${agent.color}40` }}>
                                  💰 Abrir
                                </button>
                              )}
                              {agent.id === "apolo" && (
                                <button
                                  onClick={() => window.open('/apostila', '_blank')}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap"
                                  style={{ background: `${agent.color}18`, color: agent.color, border: `1px solid ${agent.color}40` }}>
                                  📚 Abrir
                                </button>
                              )}
                              {agent.id === "site" && (
                                <button
                                  onClick={() => window.open(`/teo?clientId=${id}&clientName=${encodeURIComponent(client.name)}`, '_blank')}
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap"
                                  style={{ background: `${agent.color}18`, color: agent.color, border: `1px solid ${agent.color}40` }}>
                                  🌐 Editar Site
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* ── Painel de instrução individual ── */}
                  <AnimatePresence>
                    {selectedAgent && selectedAgent.id !== "briefing" && (
                        <motion.div
                          key={selectedAgent.id}
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          className="mt-4 rounded-2xl"
                          style={{ border: `1px solid ${selectedAgent.color}35`, background: `${selectedAgent.color}07` }}>

                          {/* hidden file input for agent */}
                          <input ref={agentFileRef} type="file"
                            accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.csv,.xlsx"
                            className="hidden"
                            onChange={handleAgentFileChange} />

                          <div className="px-5 py-4">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                                style={{ background: `${selectedAgent.color}18`, border: `1px solid ${selectedAgent.color}35`, color: selectedAgent.color }}>
                                {selectedAgent.initial}
                              </div>
                              <div>
                                <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                                  {selectedAgent.id === "briefing" ? "Briefing de Marketing" : `Instrução para ${selectedAgent.name}`}
                                </div>
                                <div className="text-[10px]" style={{ color: selectedAgent.color }}>{selectedAgent.role} · {selectedAgent.skill}</div>
                              </div>
                              <button onClick={() => setSelectedAgentId(null)}
                                className="ml-auto p-1 rounded-lg transition-colors"
                                style={{ color: "rgba(255,255,255,0.25)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Lia: briefing interativo + diagnóstico + PDF */}
                            {selectedAgent.id === "briefing" && (
                              <LiaBriefingPanel
                                clientId={client.id}
                                clientName={client.name}
                                clientIndustry={client.industry}
                                supabaseClientId={portalClientUUID ?? undefined}
                                userId={user?.id}
                                onClose={() => setSelectedAgentId(null)}
                              />
                            )}

                            {/* Formato (só Carolina) */}
                            {/* Bobby: painel completo de plataforma + roteiro */}
                            {selectedAgent.id === "video" && (
                              <div className="space-y-4 mb-2">
                                <div>
                                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Plataforma destino</div>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {VIDEO_FORMATS.map(f => (
                                      <button key={f.id} onClick={() => setVideoPlatform(f.id)}
                                        className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-center transition-all"
                                        style={{
                                          background: videoPlatform === f.id ? "#B9FF4B18" : "rgba(255,255,255,0.03)",
                                          border: `1px solid ${videoPlatform === f.id ? "#B9FF4B50" : "rgba(255,255,255,0.07)"}`,
                                        }}>
                                        <span className="text-base leading-none">{f.icon}</span>
                                        <span className="text-[10px] font-bold leading-tight" style={{ color: videoPlatform === f.id ? "#B9FF4B" : "rgba(255,255,255,0.55)" }}>{f.label}</span>
                                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{f.ratio}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Upload de vídeo */}
                                <div>
                                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Arquivo de vídeo</div>
                                  <input
                                    ref={videoInputRef}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={e => {
                                      const f = e.target.files?.[0];
                                      if (!f) return;
                                      setVideoFile(f);
                                      setVideoFileUrl(URL.createObjectURL(f));
                                    }}
                                  />
                                  {videoFile ? (
                                    <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#B9FF4B10", border: "1px solid #B9FF4B35" }}>
                                      <span className="text-xl">🎬</span>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold truncate" style={{ color: "#F0F0F0" }}>{videoFile.name}</div>
                                        <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                                          {(videoFile.size / 1024 / 1024).toFixed(1)} MB · {videoFile.type.split("/")[1]?.toUpperCase()}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => { setVideoFile(null); setVideoFileUrl(null); if (videoInputRef.current) videoInputRef.current.value = ""; }}
                                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                                        style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)" }}
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => videoInputRef.current?.click()}
                                      className="w-full flex flex-col items-center gap-2 py-5 rounded-xl transition-all"
                                      style={{ border: "1.5px dashed rgba(185,255,75,0.2)", background: "rgba(185,255,75,0.03)", color: "rgba(255,255,255,0.4)" }}
                                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(185,255,75,0.45)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,255,75,0.06)"; }}
                                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(185,255,75,0.2)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(185,255,75,0.03)"; }}
                                    >
                                      <span className="text-2xl">📁</span>
                                      <span className="text-xs font-medium">Clique para subir o vídeo</span>
                                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>MP4, MOV, AVI, WebM</span>
                                    </button>
                                  )}
                                </div>

                                <div>
                                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Roteiro (opcional)</div>
                                  <textarea
                                    value={videoScript}
                                    onChange={e => setVideoScript(e.target.value)}
                                    placeholder={"Cole aqui o roteiro ou briefing do vídeo.\nBobby vai usar como referência para sugerir edições."}
                                    rows={3}
                                    className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #B9FF4B28", color: "#F0F0F0", outline: "none" }}
                                  />
                                  <p className="text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                                    Gerado por Beatriz ou Queila? Cole aqui e Bobby edita em cima.
                                  </p>
                                </div>

                                <button
                                  onClick={() => {
                                    const params = new URLSearchParams();
                                    params.set("clientName", client.name);
                                    params.set("platform", videoPlatform);
                                    if (videoScript.trim()) params.set("script", videoScript.trim());
                                    setSelectedAgentId(null);
                                    navigate(`/video-editor?${params.toString()}`, {
                                      state: { file: videoFile ?? undefined },
                                    });
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                                  style={{ background: "#B9FF4B", color: "#07080A", boxShadow: "0 0 20px -4px #B9FF4B60" }}
                                >
                                  <span>🎬</span> Abrir Editor Bobby
                                </button>
                              </div>
                            )}

                            {/* Tomás: briefing rápido → abre criador de LP */}
                            {selectedAgent.id === "tomas" && (
                              <div className="space-y-4 mb-2">
                                <div>
                                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Briefing da Landing Page</div>
                                  <textarea
                                    value={agentInstruction}
                                    onChange={e => setAgentInstruction(e.target.value)}
                                    placeholder={"Descreva o produto, público-alvo, objetivo e tom de voz.\n\nEx: Curso de gestão financeira para MEIs, público 30-50 anos, objetivo: inscrições, tom direto e motivador."}
                                    rows={4}
                                    className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #34D39928", color: "#F0F0F0", outline: "none" }}
                                  />
                                  <p className="text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                                    O Tomás consulta a Redatora e a Designer antes de gerar o HTML completo.
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    const params = new URLSearchParams();
                                    params.set("clientId", id ?? "");
                                    params.set("clientName", client.name);
                                    if (agentInstruction.trim()) params.set("briefing", agentInstruction.trim());
                                    window.open(`/tomas?${params.toString()}`, '_blank');
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                                  style={{ background: "#34D399", color: "#07080A", boxShadow: "0 0 20px -4px #34D39960" }}
                                >
                                  <span>🖥️</span> Abrir Tomás
                                </button>
                              </div>
                            )}

                            {selectedAgent.id === "designer" && (
                              <div className="mb-3">
                                <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Formato</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {DESIGN_FORMATS.map(({ ratio, label, hint }) => (
                                    <button key={ratio} onClick={() => setDesignAspectRatio(ratio as any)}
                                      className="flex flex-col items-start px-3 py-1.5 rounded-xl text-left transition-all"
                                      style={{
                                        background: designAspectRatio === ratio ? `${selectedAgent.color}18` : "rgba(255,255,255,0.04)",
                                        border: `1px solid ${designAspectRatio === ratio ? `${selectedAgent.color}50` : "rgba(255,255,255,0.08)"}`,
                                      }}>
                                      <span className="text-[11px] font-bold" style={{ color: designAspectRatio === ratio ? selectedAgent.color : "rgba(255,255,255,0.6)" }}>
                                        {label} <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>{ratio}</span>
                                      </span>
                                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{hint}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Designer: textarea + formato + send */}
                            {selectedAgent.id === "designer" && (
                              <>
                                <textarea
                                  value={agentInstruction}
                                  onChange={(e) => setAgentInstruction(e.target.value)}
                                  placeholder="Dê uma direção (opcional) — ou deixe em branco e a Carolina decide sozinha com base no cliente."
                                  rows={3}
                                  autoFocus
                                  className="w-full rounded-xl px-4 py-3 text-sm resize-none mb-3"
                                  style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${selectedAgent.color}28`, color: "#F0F0F0", outline: "none" }}
                                />
                                {marcelaError && (
                                  <div className="mb-3 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
                                    {marcelaError}
                                  </div>
                                )}
                                <div className="flex items-center gap-3">
                                  {agentFile ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0" style={{ background: `${selectedAgent.color}12`, border: `1px solid ${selectedAgent.color}28` }}>
                                      <Image className="w-3 h-3 flex-shrink-0" style={{ color: selectedAgent.color }} />
                                      <span className="text-[11px] font-medium max-w-[120px] truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{agentFile.name}</span>
                                      <button onClick={clearAgentFile} style={{ color: "rgba(255,255,255,0.3)" }}><X className="w-3 h-3" /></button>
                                    </div>
                                  ) : (
                                    <button onClick={() => agentFileRef.current?.click()}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0"
                                      style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px dashed rgba(255,255,255,0.14)" }}>
                                      <Paperclip className="w-3 h-3" /> Referência
                                    </button>
                                  )}
                                  <div className="flex-1" />
                                  <button
                                    onClick={() => { setSelectedAgentId(null); handleSendToDesigner(); }}
                                    disabled={marcelaLoading}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                                    style={{ background: selectedAgent.color, color: "#07080A" }}>
                                    {marcelaLoading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Gerando...</> : <><Send className="w-3.5 h-3.5" /> Criar agora</>}
                                  </button>
                                </div>
                                {agentFile && renderFilePreview(agentFile, agentFileUrl, agentFileText, selectedAgent.color)}
                              </>
                            )}

                            {/* Chat direto — todos os agentes exceto Designer, Bobby, Lia e Tomás */}
                            {selectedAgent.id !== "designer" && selectedAgent.id !== "video" && selectedAgent.id !== "briefing" && selectedAgent.id !== "tomas" && (
                              <div className="flex flex-col gap-2">
                                {clientBriefing && (
                                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)" }}>
                                    <span className="text-[10px]" style={{ color: "#38BDF8" }}>📋 Briefing carregado — respostas com contexto do cliente</span>
                                  </div>
                                )}

                                {/* Histórico do chat */}
                                {(agentChats[selectedAgent.id] ?? []).length > 0 && (
                                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1 py-1">
                                    {(agentChats[selectedAgent.id] ?? []).map((msg, i) => (
                                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div
                                          className="max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap"
                                          style={msg.role === "user"
                                            ? { background: `${selectedAgent.color}22`, color: "rgba(255,255,255,0.9)", border: `1px solid ${selectedAgent.color}35` }
                                            : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.82)" }}>
                                          {msg.content}
                                        </div>
                                      </div>
                                    ))}
                                    {agentChatLoading && (
                                      <div className="flex justify-start">
                                        <div className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                                          <div className="flex gap-1">
                                            {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: selectedAgent.color, animationDelay: `${i*0.15}s` }} />)}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <div ref={agentChatEndRef} />
                                  </div>
                                )}

                                {/* Input */}
                                <div className="flex gap-2 items-end">
                                  <textarea
                                    value={agentChatInput}
                                    onChange={(e) => setAgentChatInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAgentChat(selectedAgent.id); } }}
                                    placeholder={`Pergunte algo para ${selectedAgent.name}… (Enter para enviar)`}
                                    rows={2}
                                    autoFocus
                                    className="flex-1 rounded-xl px-3 py-2.5 text-sm resize-none"
                                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${selectedAgent.color}28`, color: "#F0F0F0", outline: "none" }}
                                  />
                                  <button
                                    onClick={() => handleAgentChat(selectedAgent.id)}
                                    disabled={!agentChatInput.trim() || agentChatLoading}
                                    className="p-2.5 rounded-xl flex-shrink-0 transition-all disabled:opacity-40"
                                    style={{ background: selectedAgent.color, color: "#07080A" }}>
                                    {agentChatLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                  </button>
                                </div>

                                {(agentChats[selectedAgent.id] ?? []).length > 0 && (
                                  <button
                                    onClick={() => updateAgentChat(selectedAgent.id, [])}
                                    className="text-[10px] text-right"
                                    style={{ color: "rgba(255,255,255,0.2)" }}>
                                    Limpar conversa
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>
                </div>

                {/* ── Painel do Site (Teo) ── */}
                {(() => {
                  const pages: any[] = [];
                  const siteTask = client.agentTasks["site"];
                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Globe className="w-3.5 h-3.5" style={{ color: "#06B6D4" }} />
                        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                          Site do Cliente — Teo
                        </h3>
                        <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                        {siteTask?.status === "trabalhando" && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#06B6D4" }} />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "#06B6D4" }} />
                          </span>
                        )}
                      </div>
                      <div className="rounded-2xl overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        {/* Header */}
                        {/* Header — esconde em mobile */}
                        <div className="hidden md:grid px-5 py-2.5 text-[10px] uppercase tracking-wider"
                          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", color: "rgba(255,255,255,0.25)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <span>Página</span><span>URL</span><span>Última edição</span><span>Status</span><span></span>
                        </div>
                        {pages.length === 0 && (
                          <div className="px-5 py-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhuma página encontrada no repositório.</div>
                        )}
                        {pages.map((p, i) => {
                          const statusColor = p.status === "publicado" ? "#34D399" : p.status === "editando" ? "#06B6D4" : "#94A3B8";
                          const statusBg   = p.status === "publicado" ? "rgba(52,211,153,0.1)" : p.status === "editando" ? "rgba(6,182,212,0.1)" : "rgba(148,163,184,0.1)";
                          const isEditing  = editingPage === p.page_name;
                          return (
                            <div key={p.id ?? p.page_name}>
                              <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap px-4 sm:px-5 py-3 transition-colors"
                                style={{ borderBottom: i < pages.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                  <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(6,182,212,0.5)" }} />
                                  <span className="text-sm font-medium break-words" style={{ color: "rgba(255,255,255,0.8)" }}>{p.page_name}</span>
                                  {p.edit_count > 0 && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
                                      style={{ background: "rgba(6,182,212,0.12)", color: "#06B6D4" }}>
                                      {p.edit_count} edições
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-mono break-all min-w-0" style={{ color: "rgba(255,255,255,0.4)" }}>{p.url}</span>
                                <span className="text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.35)" }}>{p.last_edited_at ? new Date(p.last_edited_at).toLocaleDateString("pt-BR") : "—"}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                                  style={{ background: statusBg, color: statusColor }}>
                                  {p.status}
                                </span>
                                <div className="flex-1 min-w-0" />
                                <button
                                  onClick={() => setEditingPage(isEditing ? null : p.page_name)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap"
                                  style={{ background: isEditing ? "rgba(6,182,212,0.2)" : "rgba(6,182,212,0.08)", color: "#06B6D4", border: "1px solid rgba(6,182,212,0.2)" }}>
                                  <Pencil className="w-2.5 h-2.5" />
                                  {isEditing ? "Fechar" : "Editar"}
                                </button>
                              </div>
                              {/* Inline edit panel */}
                              <AnimatePresence>
                                {isEditing && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                    style={{ borderBottom: "1px solid rgba(6,182,212,0.12)", background: "rgba(6,182,212,0.03)" }}>
                                    <div className="px-5 py-4">
                                      <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "rgba(6,182,212,0.6)" }}>
                                        Editor — {p.page_name}
                                      </div>
                                      <textarea
                                        className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
                                        rows={4}
                                        placeholder={`Digite as alterações para a página "${p.page}"...\nO Teo irá aplicar as mudanças no site.`}
                                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(6,182,212,0.2)", color: "#F0F0F0" }}
                                      />
                                      <div className="flex gap-2 mt-2">
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                          style={{ background: "#06B6D4", color: "#000" }}>
                                          <RefreshCw className="w-3 h-3" /> Aplicar alterações
                                        </button>
                                        <button
                                          onClick={() => setEditingPage(null)}
                                          className="px-3 py-1.5 rounded-lg text-xs transition-all"
                                          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Arquivos Revisados (Vitória) ── */}
                {(() => {
                  const files = REVISED_FILES[client.id] ?? [];
                  const revisorTask = client.agentTasks["revisor"];
                  const DIFF_TYPE_STYLE = {
                    typo:      { color: "#F87171", label: "Erro ortográfico" },
                    structure: { color: "#FBBF24", label: "Estrutura"         },
                    style:     { color: "#EC4899", label: "Estilo"            },
                  };
                  return (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#EC4899" }} />
                        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                          Arquivos Revisados — Vitória
                        </h3>
                        <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                        {revisorTask?.status === "trabalhando" && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#EC4899" }} />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "#EC4899" }} />
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {files.map((file) => {
                          const isOpen = expandedFile === file.id;
                          return (
                            <motion.div key={file.id}
                              className="rounded-2xl overflow-hidden"
                              style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${isOpen ? "rgba(236,72,153,0.22)" : "rgba(255,255,255,0.07)"}` }}>
                              {/* File header */}
                              <button
                                className="w-full flex items-center gap-4 px-5 py-3.5 transition-colors text-left"
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                onClick={() => setExpandedFile(isOpen ? null : file.id)}>
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.2)" }}>
                                  <FileCheck className="w-4 h-4" style={{ color: "#EC4899" }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{file.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>{file.type}</span>
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[11px] flex items-center gap-1" style={{ color: file.errors > 0 ? "#34D399" : "rgba(255,255,255,0.3)" }}>
                                      <ShieldCheck className="w-3 h-3" />
                                      {file.fixed} correções aplicadas
                                    </span>
                                    {file.errors > 0 && (
                                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                                        · {file.diffs.filter(d => d.type === "typo").length} ortografia · {file.diffs.filter(d => d.type === "structure").length} estrutura · {file.diffs.filter(d => d.type === "style").length} estilo
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <ChevronDown
                                  className="w-4 h-4 flex-shrink-0 transition-transform"
                                  style={{ color: "rgba(255,255,255,0.3)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                                />
                              </button>

                              {/* Diff view */}
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                    className="overflow-hidden">
                                    <div className="px-5 pb-4 space-y-2"
                                      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                      <div className="text-[10px] uppercase tracking-wider pt-3 mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                                        Alterações aplicadas pela Vitória
                                      </div>
                                      {file.diffs.map((diff, i) => {
                                        const dt = DIFF_TYPE_STYLE[diff.type];
                                        return (
                                          <div key={i} className="rounded-xl overflow-hidden"
                                            style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                                            <div className="flex items-center justify-between px-3 py-1.5"
                                              style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                              <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: dt.color }}>
                                                {dt.label}
                                              </span>
                                            </div>
                                            <div className="p-3 space-y-1.5">
                                              <div className="flex items-start gap-2">
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                                                  style={{ background: "rgba(248,113,113,0.15)", color: "#F87171" }}>−</span>
                                                <span className="text-xs font-mono" style={{ color: "rgba(248,113,113,0.8)" }}>{diff.before}</span>
                                              </div>
                                              <div className="flex items-start gap-2">
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                                                  style={{ background: "rgba(52,211,153,0.15)", color: "#34D399" }}>+</span>
                                                <span className="text-xs font-mono" style={{ color: "rgba(52,211,153,0.85)" }}>{diff.after}</span>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      <div className="flex gap-2 pt-1">
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                          style={{ background: "rgba(236,72,153,0.12)", color: "#EC4899", border: "1px solid rgba(236,72,153,0.22)" }}>
                                          <FileEdit className="w-3 h-3" /> Editar arquivo
                                        </button>
                                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                          style={{ background: "rgba(52,211,153,0.1)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
                                          <CheckCircle2 className="w-3 h-3" /> Aprovar correções
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ── Activity Feed do Time ── */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Atividade Recente do Time
                    </h3>
                    <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                  </div>
                  <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {client.agentFeed.map((item, i) => {
                      const Icon = ACTIVITY_ICONS[item.type] ?? Zap;
                      const color = ACTIVITY_COLORS[item.type];
                      return (
                        <motion.div key={item.id}
                          initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex gap-4 px-5 py-3.5 transition-colors"
                          style={{ borderBottom: i < client.agentFeed.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                            <Icon className="w-3.5 h-3.5" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{item.action}</span>
                              <span className="text-[11px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>{item.time}</span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{item.detail}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                ATIVIDADES
            ══════════════════════════════════════════════════════ */}
            {activeTab === "activities" && (
              <div className="max-w-2xl space-y-4">
                <div>
                  <h2 className="text-base font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>Atividades</h2>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Tudo que foi feito pelos agentes e pela equipe</p>
                </div>
                <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {client.agentFeed.length === 0
                    ? <p className="text-sm text-center py-8" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhuma atividade ainda.</p>
                    : <div className="space-y-1">
                      {client.agentFeed.map((item, i) => {
                        const Icon = ACTIVITY_ICONS[item.type] ?? Zap;
                        const color = ACTIVITY_COLORS[item.type];
                        return (
                          <motion.div key={item.id}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex gap-4 p-4 rounded-xl transition-colors"
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                              <Icon className="w-4 h-4" style={{ color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{item.action}</span>
                                <span className="text-[11px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>{item.time}</span>
                              </div>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{item.detail}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  }
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                O QUE FAZER
            ══════════════════════════════════════════════════════ */}
            {activeTab === "tasks" && (
              <div className="max-w-2xl space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>O que precisa ser feito</h2>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {tasks.filter((t) => !t.done).length} pendentes · {tasks.filter((t) => t.done).length} concluídas
                    </p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
                    style={{ background: `${client.color}18`, color: client.color, border: `1px solid ${client.color}30` }}>
                    <Plus className="w-3.5 h-3.5" /> Nova tarefa
                  </button>
                </div>

                {/* Pending tasks */}
                {tasks.filter((t) => !t.done).length === 0 ? (
                  <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(52,211,153,0.4)" }} />
                    <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Tudo concluído!</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Nenhuma tarefa pendente.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {tasks.filter((t) => !t.done).map((task, i, arr) => {
                      const p = PRIORITY_STYLE[task.priority];
                      return (
                        <div key={task.id}
                          className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
                          style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          onClick={() => toggleTask(task.id)}>
                          <Circle className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{task.text}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: p.bg, color: p.color }}>{p.label}</span>
                            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{task.due}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Toggle completed button */}
                {tasks.filter((t) => t.done).length > 0 && (
                  <button
                    onClick={() => setShowCompleted((v) => !v)}
                    className="flex items-center gap-2 text-xs font-medium w-full px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: showCompleted ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)",
                      border: showCompleted ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(255,255,255,0.07)",
                      color: showCompleted ? "#34D399" : "rgba(255,255,255,0.35)",
                    }}>
                    <CheckCircle2 className="w-4 h-4" />
                    {showCompleted ? "Ocultar" : "Ver"} concluídas ({tasks.filter((t) => t.done).length})
                    <motion.span
                      animate={{ rotate: showCompleted ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-auto"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.span>
                  </button>
                )}

                {/* Completed tasks */}
                <AnimatePresence>
                  {showCompleted && tasks.filter((t) => t.done).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.15)" }}>
                      <div className="px-5 py-3 flex items-center gap-2"
                        style={{ borderBottom: "1px solid rgba(52,211,153,0.1)" }}>
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#34D399" }} />
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(52,211,153,0.7)" }}>
                          Concluídas
                        </span>
                      </div>
                      {tasks.filter((t) => t.done).map((task, i, arr) => {
                        const p = PRIORITY_STYLE[task.priority];
                        return (
                          <div key={task.id}
                            className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors"
                            style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(52,211,153,0.08)" : "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(52,211,153,0.05)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            onClick={() => toggleTask(task.id)}>
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#34D399" }} />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm line-through" style={{ color: "rgba(255,255,255,0.3)" }}>
                                {task.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: p.bg, color: p.color, opacity: 0.5 }}>{p.label}</span>
                              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>{task.due}</span>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                AGENTES AUTÔNOMOS DE VENDAS
            ══════════════════════════════════════════════════════ */}
            {activeTab === "sales-agents" && (() => {
              const SUPABASE_URL = "https://proldgiyterqhthludlp.supabase.co";
              return (
              <div className="space-y-5">

                {/* Configuração de Canais IA */}
                <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(185,255,75,0.03)", border: "1px solid rgba(185,255,75,0.12)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#B9FF4B" }}>Configuração de Canais IA</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Configure qual canal o agente monitora e responde automaticamente para este cliente</p>
                    </div>
                    <button
                      onClick={() => saveAgentChannelConfig(agentChannelConfig)}
                      disabled={agentConfigSaving}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                      style={{ background: "#B9FF4B", color: "#07080A" }}
                    >
                      {agentConfigSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Salvar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {(["whatsapp", "instagram", "facebook"]).map(ch => {
                      const cfg = agentChannelConfig[ch];
                      const icons = { whatsapp: "💬", instagram: "📸", facebook: "👍" };
                      const labels = { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook" };
                      const socialAcc = socialAccountsMap[ch];
                      return (
                        <div key={ch} className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: cfg.active ? "1px solid rgba(185,255,75,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{icons[ch]}</span>
                              <span className="text-sm font-semibold" style={{ color: cfg.active ? "#F0F0F0" : "rgba(255,255,255,0.4)" }}>{labels[ch]}</span>
                              {socialAcc && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B" }}>conectado</span>}
                            </div>
                            <button
                              onClick={() => setAgentChannelConfig(prev => ({ ...prev, [ch]: { ...prev[ch], active: !prev[ch].active } }))}
                              className="relative w-9 h-5 rounded-full transition-colors"
                              style={{ background: cfg.active ? "#B9FF4B" : "rgba(255,255,255,0.1)" }}
                            >
                              <span className="absolute top-0.5 transition-all w-4 h-4 rounded-full" style={{ background: cfg.active ? "#07080A" : "rgba(255,255,255,0.5)", left: cfg.active ? "18px" : "2px" }} />
                            </button>
                          </div>

                          {cfg.active && (
                            <div className="space-y-2">
                              <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.4)" }}>Prompt do sistema (opcional)</label>
                              <textarea
                                value={cfg.system_prompt}
                                onChange={e => setAgentChannelConfig(prev => ({ ...prev, [ch]: { ...prev[ch], system_prompt: e.target.value } }))}
                                placeholder={ch === "whatsapp" ? "Ex: Você é assistente de vendas da empresa X. Responda sobre cursos disponíveis..." : "Ex: Responda comentários de forma engajadora, convide para DM quando necessário..."}
                                rows={2}
                                className="w-full text-xs rounded-lg px-3 py-2 resize-none outline-none"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F0F0" }}
                              />
                              {ch === "whatsapp" && (
                                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                                  {wpFavoriteGroupIds.length} grupo(s) favorito(s) • Configure os grupos favoritos na aba WhatsApp ★
                                </p>
                              )}
                              {(ch === "instagram" || ch === "facebook") && (
                                <div className="rounded-lg p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Webhook Meta</p>
                                  <div className="flex items-center gap-2">
                                    <code className="text-[10px] flex-1 truncate" style={{ color: "rgba(185,255,75,0.8)" }}>{SUPABASE_URL}/functions/v1/social-agent</code>
                                    <button onClick={() => { navigator.clipboard.writeText(SUPABASE_URL + "/functions/v1/social-agent"); toast.success("Copiado!"); }} className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B" }}>copiar</button>
                                  </div>
                                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Verify token: <span style={{ color: "rgba(185,255,75,0.7)" }}>calu_verify_2025</span></p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {agentLogs.length > 0 && (
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Atividade Recente</p>
                    <div className="space-y-2">
                      {agentLogs.slice(0, 5).map((log, i) => (
                        <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < Math.min(agentLogs.length, 5) - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <span className="text-base shrink-0">{log.channel === "whatsapp" ? "💬" : log.channel === "instagram" ? "📸" : log.channel === "email" ? "📧" : "🤖"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{log.message ? log.message.slice(0, 80) : "—"}...</p>
                            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                              {log.channel} · {log.status} · {new Date(log.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: log.status === "sent" ? "rgba(185,255,75,0.1)" : "rgba(239,68,68,0.1)", color: log.status === "sent" ? "#B9FF4B" : "#EF4444" }}>
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold" style={{ color: "#F0F0F0" }}>Agentes Autônomos</h2>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Agentes de IA conectados ao WhatsApp do cliente via Z-API. Ativados uma única vez — rodam sozinhos.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSalesAgentForm(!showSalesAgentForm)}
                    className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                    style={{ background: "#B9FF4B", color: "#07080A" }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Novo Agente
                  </button>
                </div>

                {/* Create form */}
                <AnimatePresence>
                  {showSalesAgentForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(185,255,75,0.04)", border: "1px solid rgba(185,255,75,0.15)" }}>
                        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#B9FF4B" }}>Novo Agente</p>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 flex gap-3">
                            <div className="flex-1">
                              <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Nome do agente *</label>
                              <input
                                value={salesAgentForm.name}
                                onChange={e => setSalesAgentForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="ex.: Vendas do Curso X"
                                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                              />
                            </div>
                            <div style={{ width: 80 }}>
                              <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Cor</label>
                              <input
                                type="color"
                                value={salesAgentForm.avatar_color}
                                onChange={e => setSalesAgentForm(p => ({ ...p, avatar_color: e.target.value }))}
                                className="w-full h-[38px] rounded-xl border border-input bg-background cursor-pointer"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Produto / Curso *</label>
                            <input
                              value={salesAgentForm.product_name}
                              onChange={e => setSalesAgentForm(p => ({ ...p, product_name: e.target.value }))}
                              placeholder="Nome do produto"
                              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Preço</label>
                            <input
                              value={salesAgentForm.product_price}
                              onChange={e => setSalesAgentForm(p => ({ ...p, product_price: e.target.value }))}
                              placeholder="ex.: R$ 497"
                              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Descrição do produto</label>
                            <textarea
                              value={salesAgentForm.product_description}
                              onChange={e => setSalesAgentForm(p => ({ ...p, product_description: e.target.value }))}
                              placeholder="O que o produto resolve, para quem é, principais benefícios..."
                              rows={3}
                              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Link de compra</label>
                            <input
                              value={salesAgentForm.product_url}
                              onChange={e => setSalesAgentForm(p => ({ ...p, product_url: e.target.value }))}
                              placeholder="https://..."
                              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Persona / Instruções extras</label>
                            <textarea
                              value={salesAgentForm.persona}
                              onChange={e => setSalesAgentForm(p => ({ ...p, persona: e.target.value }))}
                              placeholder="Como o agente deve se comportar, tom de voz, perguntas para qualificar..."
                              rows={3}
                              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                            />
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-3" style={{ borderColor: "rgba(185,255,75,0.1)" }}>
                          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>Z-API — Conexão WhatsApp</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Instance ID</label>
                              <input
                                value={salesAgentForm.zapi_instance}
                                onChange={e => setSalesAgentForm(p => ({ ...p, zapi_instance: e.target.value }))}
                                placeholder="ID da instância"
                                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Token</label>
                              <input
                                value={salesAgentForm.zapi_token}
                                onChange={e => setSalesAgentForm(p => ({ ...p, zapi_token: e.target.value }))}
                                placeholder="Token da instância"
                                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-widest font-semibold mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>Client Token</label>
                              <input
                                value={salesAgentForm.zapi_client_token}
                                onChange={e => setSalesAgentForm(p => ({ ...p, zapi_client_token: e.target.value }))}
                                placeholder="(opcional)"
                                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            onClick={() => setShowSalesAgentForm(false)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={saveSalesAgent}
                            disabled={savingSalesAgent || !salesAgentForm.name.trim() || !salesAgentForm.product_name.trim()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
                            style={{ background: "#B9FF4B", color: "#07080A" }}
                          >
                            {savingSalesAgent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Criar Agente
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Agent list */}
                {salesAgentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} />
                  </div>
                ) : salesAgents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(185,255,75,0.08)" }}>
                      <Bot className="w-7 h-7" style={{ color: "rgba(185,255,75,0.5)" }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Nenhum agente criado</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>Crie um agente para começar a vender no WhatsApp</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {salesAgents.map(agent => {
                      const webhookUrl = `${SUPABASE_URL}/functions/v1/zapi-agent?id=${agent.id}`;
                      const convs = salesAgentConvs[agent.id] ?? [];
                      const isViewing = activeConvAgent === agent.id;
                      // Group conversations by phone
                      const byPhone: Record<string, any[]> = {};
                      convs.forEach(c => {
                        if (!byPhone[c.phone]) byPhone[c.phone] = [];
                        byPhone[c.phone].push(c);
                      });
                      const phones = Object.keys(byPhone);

                      return (
                        <div key={agent.id} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${agent.active ? `${agent.avatar_color}30` : "rgba(255,255,255,0.07)"}` }}>
                          {/* Agent header row */}
                          <div className="flex items-center gap-3 px-4 py-3.5">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: `${agent.avatar_color}20`, color: agent.avatar_color, border: `1px solid ${agent.avatar_color}40` }}
                            >
                              {agent.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>{agent.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: agent.active ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)", color: agent.active ? "#34D399" : "rgba(255,255,255,0.3)", border: `1px solid ${agent.active ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.1)"}` }}>
                                  {agent.active ? "● Ativo" : "○ Inativo"}
                                </span>
                              </div>
                              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{agent.product_name}{agent.product_price ? ` · ${agent.product_price}` : ""}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {/* Copy webhook URL */}
                              <button
                                onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("URL do webhook copiada!"); }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
                                title="Copiar URL do webhook para Z-API"
                              >
                                <Link2 className="w-3 h-3" />
                                Webhook
                              </button>
                              {/* View convs */}
                              <button
                                onClick={() => isViewing ? setActiveConvAgent(null) : fetchAgentConvs(agent.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                                style={{ background: isViewing ? "rgba(185,255,75,0.12)" : "rgba(255,255,255,0.06)", color: isViewing ? "#B9FF4B" : "rgba(255,255,255,0.4)" }}
                              >
                                <MessageCircle className="w-3 h-3" />
                                Conversas {convs.length > 0 && `(${phones.length})`}
                              </button>
                              {/* Active toggle */}
                              <button
                                onClick={() => toggleSalesAgent(agent.id, agent.active)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                                style={{ background: agent.active ? "rgba(249,115,22,0.12)" : "rgba(52,211,153,0.12)", color: agent.active ? "#F97316" : "#34D399" }}
                              >
                                {agent.active ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                                {agent.active ? "Pausar" : "Ativar"}
                              </button>
                              {/* Delete */}
                              <button
                                onClick={() => deleteSalesAgent(agent.id)}
                                className="p-1.5 rounded-lg transition-all"
                                style={{ color: "rgba(255,255,255,0.2)" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#F87171")}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Webhook URL info row */}
                          <div className="px-4 pb-3 flex items-center gap-2">
                            <div className="flex-1 rounded-lg px-3 py-1.5 text-[10px] font-mono truncate" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
                              {webhookUrl}
                            </div>
                          </div>

                          {/* Z-API setup hint when no instance configured */}
                          {(!agent.zapi_instance || !agent.zapi_token) && (
                            <div className="mx-4 mb-3 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#F59E0B" }} />
                              <span className="text-[10px]" style={{ color: "rgba(245,158,11,0.8)" }}>Z-API não configurado — adicione Instance ID e Token para enviar mensagens</span>
                            </div>
                          )}

                          {/* Conversations panel */}
                          <AnimatePresence>
                            {isViewing && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.07)" }}
                              >
                                <div className="px-4 py-3">
                                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                                    Conversas recentes {phones.length > 0 ? `· ${phones.length} contato${phones.length !== 1 ? "s" : ""}` : ""}
                                  </p>

                                  {phones.length === 0 ? (
                                    <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.25)" }}>
                                      Nenhuma conversa ainda — o agente responde automaticamente quando o WhatsApp receber mensagens
                                    </p>
                                  ) : (
                                    <div className="space-y-2 max-h-72 overflow-y-auto">
                                      {phones.map(phone => {
                                        const msgs = byPhone[phone].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                                        const customerName = msgs.find((m: any) => m.customer_name)?.customer_name || phone;
                                        return (
                                          <div key={phone} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                            <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: `${agent.avatar_color}20`, color: agent.avatar_color }}>
                                                {customerName.charAt(0).toUpperCase()}
                                              </div>
                                              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{customerName}</span>
                                              <span className="text-[10px] ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>{phone}</span>
                                              <span className="text-[10px] ml-1" style={{ color: "rgba(255,255,255,0.2)" }}>{msgs.length} msgs</span>
                                            </div>
                                            <div className="p-2 space-y-1">
                                              {msgs.slice(-4).map((msg: any, mi: number) => (
                                                <div key={mi} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                                                  <div
                                                    className="rounded-xl px-2.5 py-1.5 text-[11px] max-w-[80%]"
                                                    style={{
                                                      background: msg.role === "user" ? "rgba(255,255,255,0.07)" : `${agent.avatar_color}18`,
                                                      color: msg.role === "user" ? "rgba(255,255,255,0.65)" : agent.avatar_color,
                                                    }}
                                                  >
                                                    {msg.content}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Setup guide */}
                <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Como configurar no Z-API</p>
                  <ol className="space-y-1.5">
                    {[
                      "Crie o agente acima preenchendo o produto e as credenciais Z-API",
                      "No painel Z-API, vá em Webhook → On Message Received",
                      "Cole a URL do webhook do agente",
                      "Ative o agente com o botão “Ativar”",
                      "Pronto — toda mensagem recebida no WhatsApp será respondida automaticamente pela IA",
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5" style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B" }}>{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

              </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════════
                CURSOS
            ══════════════════════════════════════════════════════ */}
            {activeTab === "courses" && (
              <div className="space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Cursos</h2>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {dbCourses.length + dbCrmGroups.length} curso{(dbCourses.length + dbCrmGroups.length) !== 1 ? "s" : ""} · inclui cursos criados aqui e grupos do CRM
                    </p>
                  </div>
                  <button onClick={() => setShowNewCourse(v => !v)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: showNewCourse ? `${client.color}22` : `${client.color}12`, color: client.color, border: `1px solid ${client.color}30` }}>
                    <Plus className="w-3.5 h-3.5" /> Novo curso
                  </button>
                </div>

                {/* Novo curso form */}
                <AnimatePresence>
                  {showNewCourse && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${client.color}30` }}>
                        <p className="text-xs font-semibold" style={{ color: client.color }}>Novo Curso</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input placeholder="Nome do curso *" value={newCourseForm.title}
                            onChange={e => setNewCourseForm(p => ({ ...p, title: e.target.value }))}
                            className="col-span-2 rounded-lg px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                          <input placeholder="Descrição" value={newCourseForm.description}
                            onChange={e => setNewCourseForm(p => ({ ...p, description: e.target.value }))}
                            className="rounded-lg px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                          <select value={newCourseForm.level} onChange={e => setNewCourseForm(p => ({ ...p, level: e.target.value }))}
                            className="rounded-lg px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }}>
                            {["Básico", "Intermediário", "Avançado"].map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleCreateCourse} disabled={savingCourse || !newCourseForm.title.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                            style={{ background: client.color, color: "#07080A" }}>
                            {savingCourse ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Criar
                          </button>
                          <button onClick={() => setShowNewCourse(false)} className="px-3 py-2 rounded-xl text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Cancelar</button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading */}
                {coursesLoading && (
                  <div className="flex items-center justify-center py-12 gap-3">
                    <RefreshCw className="w-4 h-4 animate-spin" style={{ color: client.color }} />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Carregando cursos…</span>
                  </div>
                )}

                {/* Empty */}
                {!coursesLoading && dbCourses.length === 0 && dbCrmGroups.length === 0 && (
                  <div className="rounded-2xl p-14 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                    <GraduationCap className="w-10 h-10 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.1)" }} />
                    <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Nenhum curso ainda.</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Clique em "Novo curso" ou crie grupos no CRM para vê-los aqui.</p>
                  </div>
                )}

                {/* Course list */}
                {!coursesLoading && dbCourses.map((course) => {
                  const students = dbEnrollments[course.id] ?? [];
                  const isOpen = expandedCourse === course.id;
                  const isCertOpen = certCourseId === course.id;
                  const isAttendOpen = attendanceCourseId === course.id;
                  const attending = dbAttendance[course.id] ?? [];
                  const presencaUrl = `https://www.caluagencia.com.br/presenca/${course.id}`;

                  return (
                    <motion.div key={course.id} className="rounded-2xl overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${isOpen ? `${client.color}28` : "rgba(255,255,255,0.07)"}` }}>

                      {/* Course header */}
                      <div className="flex items-center gap-4 px-5 py-4">
                        <button className="flex items-center gap-4 flex-1 text-left" onClick={() => setExpandedCourse(isOpen ? null : course.id)}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: `${client.color}18`, border: `1px solid ${client.color}28` }}>
                            <GraduationCap className="w-5 h-5" style={{ color: client.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{course.title}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>{course.level}</span>
                            </div>
                            {course.description && (
                              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{course.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-5 flex-shrink-0">
                            <div className="text-right">
                              <div className="text-sm font-bold" style={{ color: client.color }}>{students.length}</div>
                              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>aluno{students.length !== 1 ? "s" : ""}</div>
                            </div>
                            <ChevronDown className="w-4 h-4 transition-transform flex-shrink-0"
                              style={{ color: "rgba(255,255,255,0.3)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                          </div>
                        </button>

                        {/* Action buttons always visible */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setCertCourseId(isCertOpen ? null : course.id);
                              if (!isCertOpen) {
                                setCertTemplate(null); setCertPreview(null);
                                setGeneratedCerts([]); setCertManualList([]);
                                setCertStudentName(""); setExpandedCourse(course.id);
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all"
                            style={isCertOpen
                              ? { background: "rgba(250,204,21,0.18)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.35)" }
                              : { background: "rgba(250,204,21,0.08)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.2)" }}>
                            <Award className="w-3.5 h-3.5" />
                            Certificados
                          </button>
                          <button
                            onClick={() => setAttendanceCourseId(isAttendOpen ? null : course.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all"
                            style={isAttendOpen
                              ? { background: "rgba(52,211,153,0.18)", color: "#34D399", border: "1px solid rgba(52,211,153,0.35)" }
                              : { background: "rgba(52,211,153,0.08)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Presença{attending.length > 0 && <span className="ml-1 px-1.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(52,211,153,0.25)" }}>{attending.length}</span>}
                          </button>
                          <button
                            onClick={() => setShowAddStudent(showAddStudent === course.id ? null : course.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all"
                            style={{ background: `${client.color}10`, color: client.color, border: `1px solid ${client.color}25` }}>
                            <Plus className="w-3 h-3" /> Aluno
                          </button>
                          <button onClick={() => handleDeleteCourse(course.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                            style={{ background: "rgba(248,113,113,0.08)", color: "rgba(248,113,113,0.5)", border: "1px solid rgba(248,113,113,0.15)" }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Add student form */}
                      <AnimatePresence>
                        {showAddStudent === course.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="px-5 py-4 space-y-2">
                              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: client.color }}>Adicionar aluno</p>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { key: "student_name", ph: "Nome *" },
                                  { key: "student_email", ph: "E-mail" },
                                  { key: "student_phone", ph: "WhatsApp (ex: 5511999…)" },
                                ].map(({ key, ph }) => (
                                  <input key={key} placeholder={ph}
                                    value={(newStudentForm as any)[key]}
                                    onChange={e => setNewStudentForm(p => ({ ...p, [key]: e.target.value }))}
                                    className="rounded-lg px-3 py-2 text-xs focus:outline-none"
                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleAddStudent(course.id)} disabled={addingStudent || !newStudentForm.student_name.trim()}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                                  style={{ background: client.color, color: "#07080A" }}>
                                  {addingStudent ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Adicionar
                                </button>
                                <button onClick={() => setShowAddStudent(null)} className="px-3 py-2 rounded-xl text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Cancelar</button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Student list (expanded) */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden"
                            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <div className="px-5 py-4">
                              {students.length === 0 ? (
                                <div className="py-6 text-center">
                                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Nenhum aluno cadastrado ainda.</p>
                                  <button onClick={() => setShowAddStudent(course.id)}
                                    className="mt-2 text-xs font-semibold" style={{ color: client.color }}>
                                    + Adicionar primeiro aluno
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-4 gap-2 px-1 pb-1">
                                    {["Nome", "E-mail", "WhatsApp", ""].map(h => (
                                      <div key={h} className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>{h}</div>
                                    ))}
                                  </div>
                                  {students.map((s: any) => (
                                    <div key={s.id} className="grid grid-cols-4 gap-2 items-center px-1 py-2 rounded-xl"
                                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                                          style={{ background: `${client.color}20`, color: client.color }}>
                                          {s.student_name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-[11px] font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{s.student_name}</span>
                                      </div>
                                      <span className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{s.student_email || "—"}</span>
                                      <span className="text-[11px]" style={{ color: s.student_phone ? "#25D366" : "rgba(255,255,255,0.25)" }}>
                                        {s.student_phone || "—"}
                                      </span>
                                      <div className="flex justify-end gap-1">
                                        {s.student_phone && wpStatus === "connected" && (
                                          <button
                                            onClick={() => { setWpMessage(""); setWpSelectedContacts([s.student_phone]); setWpTargetTab("contatos"); setCrmView("whatsapp"); }}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                                            style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                                            <MessageCircle className="w-2.5 h-2.5" /> WA
                                          </button>
                                        )}
                                        <button onClick={() => handleDeleteEnrollment(s.id, course.id)}
                                          className="w-6 h-6 flex items-center justify-center rounded-lg"
                                          style={{ color: "rgba(248,113,113,0.4)" }}>
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Checklist por Fase ──────────────────── */}
                      <AnimatePresence>
                        {isOpen && (() => {
                          const allItems = dbChecklists[course.id] ?? [];
                          const totalDone = allItems.filter(i => i.status === "completed").length;
                          const activePhase = selectedChecklistPhase[course.id] ?? "pre_venda";
                          const phaseItems = allItems.filter(i => i.phase === activePhase);
                          const phaseDone = phaseItems.filter(i => i.status === "completed").length;
                          const genKey = `${course.id}_${activePhase}`;
                          const isGenerating = checklistGenerating === genKey;
                          const addKey = `${course.id}_${activePhase}`;
                          const isAddingItem = showAddChecklistItem === addKey;

                          const RESP_CFG: Record<string, { label: string; color: string; bg: string }> = {
                            agency:  { label: "Agência", color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
                            client:  { label: "Cliente", color: client.color, bg: `${client.color}12` },
                            student: { label: "Aluno",   color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
                          };

                          return (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden"
                              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <div className="px-5 py-4 space-y-3">

                                {/* Header */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <ListChecks className="w-3.5 h-3.5" style={{ color: client.color }} />
                                    <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: client.color }}>Checklist Operacional</span>
                                    {allItems.length > 0 && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                                        {totalDone}/{allItems.length} total
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Abas de fase */}
                                <div className="flex gap-1">
                                  {PHASES.map(ph => {
                                    const phItems = allItems.filter(i => i.phase === ph);
                                    const phDone = phItems.filter(i => i.status === "completed").length;
                                    const isActive = activePhase === ph;
                                    return (
                                      <button key={ph} onClick={() => setSelectedChecklistPhase(p => ({ ...p, [course.id]: ph }))}
                                        className="flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-[10px] font-semibold transition-all"
                                        style={isActive
                                          ? { background: `${client.color}18`, color: client.color, border: `1px solid ${client.color}35` }
                                          : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                        {PHASE_LABELS[ph]}
                                        {phItems.length > 0 && (
                                          <span className="text-[9px] font-normal" style={{ color: isActive ? client.color : "rgba(255,255,255,0.25)" }}>
                                            {phDone}/{phItems.length}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Barra de progresso da fase ativa */}
                                {phaseItems.length > 0 && (
                                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                                    <div className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${Math.round((phaseDone / phaseItems.length) * 100)}%`, background: client.color }} />
                                  </div>
                                )}

                                {/* Ações da fase ativa */}
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                                    {phaseItems.length === 0 ? "Sem itens nesta fase" : `${phaseDone} de ${phaseItems.length} concluído${phaseDone !== 1 ? "s" : ""}`}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleGenerateChecklist(course, activePhase)}
                                      disabled={isGenerating}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-all disabled:opacity-50"
                                      style={{ background: `${client.color}15`, color: client.color, border: `1px solid ${client.color}30` }}>
                                      {isGenerating ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                                      {isGenerating ? "Agente gerando…" : phaseItems.length > 0 ? "Reagendar" : "Acionar Agente"}
                                    </button>
                                    <button onClick={() => setShowAddChecklistItem(isAddingItem ? null : addKey)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold"
                                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                      <Plus className="w-2.5 h-2.5" /> Item
                                    </button>
                                  </div>
                                </div>

                                {/* Form adicionar item */}
                                <AnimatePresence>
                                  {isAddingItem && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                                      <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                        <input placeholder="Título do item *"
                                          value={newChecklistItem.title}
                                          onChange={e => setNewChecklistItem(p => ({ ...p, title: e.target.value }))}
                                          className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none"
                                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                                        <div className="grid grid-cols-2 gap-2">
                                          <input placeholder="Descrição (opcional)"
                                            value={newChecklistItem.description}
                                            onChange={e => setNewChecklistItem(p => ({ ...p, description: e.target.value }))}
                                            className="rounded-lg px-3 py-2 text-xs focus:outline-none"
                                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                                          <select value={newChecklistItem.responsible}
                                            onChange={e => setNewChecklistItem(p => ({ ...p, responsible: e.target.value }))}
                                            className="rounded-lg px-3 py-2 text-xs focus:outline-none"
                                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }}>
                                            <option value="agency">Agência</option>
                                            <option value="client">Cliente</option>
                                            <option value="student">Aluno</option>
                                          </select>
                                        </div>
                                        <div className="flex gap-2">
                                          <button onClick={() => handleAddChecklistItem(course.id, activePhase)}
                                            disabled={savingChecklistItem || !newChecklistItem.title.trim()}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-40"
                                            style={{ background: client.color, color: "#07080A" }}>
                                            {savingChecklistItem ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Plus className="w-2.5 h-2.5" />} Salvar
                                          </button>
                                          <button onClick={() => setShowAddChecklistItem(null)} className="px-3 py-1.5 text-[11px] rounded-lg" style={{ color: "rgba(255,255,255,0.35)" }}>Cancelar</button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Lista de itens da fase */}
                                <div className="space-y-1.5">
                                  {phaseItems.map((item: any) => {
                                    const rc = RESP_CFG[item.responsible] ?? RESP_CFG.agency;
                                    return (
                                      <div key={item.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5 group transition-all"
                                        style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${item.status === "completed" ? `${client.color}22` : "rgba(255,255,255,0.06)"}` }}>
                                        <button onClick={() => handleToggleChecklist(item, course.id)}
                                          className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all"
                                          style={{ borderColor: item.status === "completed" ? client.color : "rgba(255,255,255,0.25)", background: item.status === "completed" ? client.color : "transparent" }}>
                                          {item.status === "completed" && <CheckCircle2 className="w-2.5 h-2.5" style={{ color: "#07080A" }} />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                          <span className="text-[11px] font-medium leading-snug" style={{
                                            color: item.status === "completed" ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.82)",
                                            textDecoration: item.status === "completed" ? "line-through" : "none",
                                          }}>{item.title}</span>
                                          {item.description && (
                                            <p className="text-[10px] mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.25)" }}>{item.description}</p>
                                          )}
                                        </div>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-semibold"
                                          style={{ background: rc.bg, color: rc.color }}>
                                          {rc.label}
                                        </span>
                                        <button onClick={() => handleDeleteChecklistItem(item.id, course.id)}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded flex-shrink-0"
                                          style={{ color: "rgba(248,113,113,0.45)" }}>
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>

                      {/* Certificate panel */}
                      <AnimatePresence>
                        {isCertOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden"
                            style={{ borderTop: "1px solid rgba(250,204,21,0.2)" }}>
                            <div className="px-5 py-5 space-y-5">
                              <div className="flex items-center gap-3">
                                <Award className="w-4 h-4" style={{ color: "#FBBF24" }} />
                                <p className="text-sm font-semibold" style={{ color: "#FBBF24" }}>Emissão de Certificados</p>
                                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>— envie o template, a ferramenta preenche o nome</span>
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                {/* Esquerda: Template + Configuração */}
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                                      Template (PNG/JPG)
                                    </label>
                                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
                                      style={{ background: certTemplate ? "rgba(250,204,21,0.06)" : "rgba(255,255,255,0.04)", border: certTemplate ? "1px solid rgba(250,204,21,0.3)" : "2px dashed rgba(255,255,255,0.12)" }}>
                                      <input type="file" className="hidden" accept="image/*" onChange={handleCertTemplateUpload} />
                                      <Award className="w-4 h-4 flex-shrink-0" style={{ color: certTemplate ? "#FBBF24" : "rgba(255,255,255,0.25)" }} />
                                      <span className="text-[11px]" style={{ color: certTemplate ? "#FBBF24" : "rgba(255,255,255,0.3)" }}>
                                        {certTemplate ? "✓ Template carregado — clique para trocar" : "Clique para enviar o template"}
                                      </span>
                                    </label>
                                  </div>

                                  {certTemplate && (
                                    <>
                                      <div className="space-y-3">
                                        <label className="text-[10px] uppercase tracking-widest font-semibold block" style={{ color: "rgba(255,255,255,0.3)" }}>Posição do nome</label>
                                        <div className="grid grid-cols-2 gap-3">
                                          {[
                                            { label: `Horizontal: ${certNameX}%`, state: certNameX, set: (v: number) => { setCertNameX(v); setCertPreview(null); } },
                                            { label: `Vertical: ${certNameY}%`, state: certNameY, set: (v: number) => { setCertNameY(v); setCertPreview(null); } },
                                            { label: `Fonte: ${certFontSize}px`, state: certFontSize, set: (v: number) => { setCertFontSize(v); setCertPreview(null); }, min: 20, max: 120 },
                                          ].map((s, i) => (
                                            <div key={i}>
                                              <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                                              <input type="range" min={s.min ?? 5} max={s.max ?? 95} value={s.state}
                                                onChange={e => s.set(+e.target.value)} className="w-full accent-yellow-400" />
                                            </div>
                                          ))}
                                          <div>
                                            <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Cor do texto</div>
                                            <div className="flex items-center gap-2">
                                              <input type="color" value={certFontColor}
                                                onChange={e => { setCertFontColor(e.target.value); setCertPreview(null); }}
                                                className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                                              <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{certFontColor}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      <div>
                                        <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Pré-visualizar</label>
                                        <div className="flex gap-2">
                                          <input value={certStudentName} onChange={e => { setCertStudentName(e.target.value); setCertPreview(null); }}
                                            placeholder="Digite um nome para testar…"
                                            className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none"
                                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0" }} />
                                          <button onClick={previewCert} disabled={!certStudentName.trim() || certGenerating}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold disabled:opacity-40"
                                            style={{ background: "rgba(250,204,21,0.12)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.25)" }}>
                                            {certGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />} Ver
                                          </button>
                                        </div>
                                        {certPreview && (
                                          <div className="mt-2 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(250,204,21,0.2)" }}>
                                            <img src={certPreview} alt="Preview" className="w-full" />
                                            <div className="flex gap-2 p-2" style={{ background: "rgba(0,0,0,0.5)" }}>
                                              <button onClick={() => downloadCert(certPreview!, certStudentName)}
                                                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold"
                                                style={{ background: "rgba(250,204,21,0.12)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.25)" }}>
                                                <Download className="w-3 h-3" /> Baixar preview
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Direita: Lista de alunos + geração em lote */}
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                                      Alunos do curso ({students.length})
                                    </label>

                                    {students.length === 0 ? (
                                      <div className="py-4 text-center rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)" }}>
                                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Nenhum aluno cadastrado.</p>
                                        <button onClick={() => setShowAddStudent(course.id)} className="mt-1 text-xs font-semibold" style={{ color: client.color }}>+ Adicionar</button>
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5 max-h-40 overflow-y-auto mb-3">
                                        {students.map((s: any) => (
                                          <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                                              style={{ background: `${client.color}20`, color: client.color }}>
                                              {s.student_name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="flex-1 text-[11px] truncate" style={{ color: "rgba(255,255,255,0.75)" }}>{s.student_name}</span>
                                            {s.student_phone && <BadgeCheck className="w-3 h-3 flex-shrink-0" style={{ color: "#25D366" }} />}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Adicionar nome manual */}
                                    <div className="flex gap-2 mb-2">
                                      <input value={certManualName} onChange={e => setCertManualName(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter" && certManualName.trim()) { setCertManualList(p => [...p, certManualName.trim()]); setCertManualName(""); } }}
                                        placeholder="Nome extra (Enter para adicionar)"
                                        className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none"
                                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0" }} />
                                      <button onClick={() => { if (certManualName.trim()) { setCertManualList(p => [...p, certManualName.trim()]); setCertManualName(""); } }}
                                        className="px-3 py-2 rounded-lg text-[11px]"
                                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                    {certManualList.length > 0 && (
                                      <div className="space-y-1 mb-3 max-h-24 overflow-y-auto">
                                        {certManualList.map((name, i) => (
                                          <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>{name}</span>
                                            <button onClick={() => setCertManualList(p => p.filter((_, j) => j !== i))} style={{ color: "rgba(255,255,255,0.3)" }}>
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {certTemplate && (
                                      <>
                                        {attending.length > 0 && (
                                          <p className="text-[10px] text-center mb-2" style={{ color: "rgba(52,211,153,0.7)" }}>
                                            Usando lista de presença ({attending.length} aluno{attending.length !== 1 ? "s" : ""})
                                          </p>
                                        )}
                                        <button onClick={() => generateAllCerts(course.id)} disabled={certGenerating || (attending.length + students.length + certManualList.length === 0)}
                                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                                          style={{ background: "#FBBF24", color: "#07080A", boxShadow: "0 0 20px -4px rgba(250,204,21,0.35)" }}>
                                          {certGenerating
                                            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando…</>
                                            : (() => {
                                                const n = attending.length > 0 ? attending.length + certManualList.length : students.length + certManualList.length;
                                                return <><Award className="w-4 h-4" /> Gerar {n} certificado{n !== 1 ? "s" : ""}</>;
                                              })()}
                                        </button>
                                      </>
                                    )}
                                    {!certTemplate && (
                                      <p className="text-[11px] text-center py-2" style={{ color: "rgba(255,255,255,0.3)" }}>← Envie o template primeiro</p>
                                    )}
                                  </div>

                                  {/* Certificados gerados */}
                                  {generatedCerts.length > 0 && certCourseId === course.id && (
                                    <div>
                                      <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2" style={{ color: "#34D399" }}>
                                        ✓ {generatedCerts.length} certificado{generatedCerts.length !== 1 ? "s" : ""} gerado{generatedCerts.length !== 1 ? "s" : ""}
                                      </label>
                                      <div className="space-y-1.5 max-h-44 overflow-y-auto">
                                        {generatedCerts.map((cert, i) => (
                                          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                            <div className="w-8 h-6 rounded overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(250,204,21,0.2)" }}>
                                              <img src={cert.dataUrl} alt={cert.name} className="w-full h-full object-cover" />
                                            </div>
                                            <span className="flex-1 text-[11px] font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{cert.name}</span>
                                            <div className="flex gap-1.5">
                                              <button onClick={() => downloadCert(cert.dataUrl, cert.name)}
                                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                                                style={{ background: "rgba(250,204,21,0.1)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.2)" }}>
                                                <Download className="w-3 h-3" /> Baixar
                                              </button>
                                              {wpStatus === "connected" && (() => {
                                                const st = students.find((s: any) => s.student_name === cert.name);
                                                return st?.student_phone ? (
                                                  <button onClick={() => sendCertViaWp(cert.dataUrl, st.student_phone, cert.name)}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                                                    style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                                                    <Send className="w-3 h-3" /> WA
                                                  </button>
                                                ) : null;
                                              })()}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      <button onClick={() => generatedCerts.forEach(c => downloadCert(c.dataUrl, c.name))}
                                        className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                                        style={{ background: "rgba(250,204,21,0.08)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.2)" }}>
                                        <Download className="w-3.5 h-3.5" /> Baixar todos
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Attendance panel */}
                      <AnimatePresence>
                        {isAttendOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden"
                            style={{ borderTop: "1px solid rgba(52,211,153,0.2)" }}>
                            <div className="px-5 py-5 space-y-5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <CheckCircle2 className="w-4 h-4" style={{ color: "#34D399" }} />
                                  <p className="text-sm font-semibold" style={{ color: "#34D399" }}>Lista de Presença</p>
                                  <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>— {attending.length} confirmado{attending.length !== 1 ? "s" : ""}</span>
                                </div>
                                <button
                                  onClick={async () => {
                                    const { data } = await (supabase as any).from("course_attendance").select("*")
                                      .eq("course_id", course.id).order("attended_at", { ascending: true });
                                    setDbAttendance(prev => ({ ...prev, [course.id]: data ?? [] }));
                                    toast.success("Lista atualizada");
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold"
                                  style={{ background: "rgba(52,211,153,0.08)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
                                  <RefreshCw className="w-3 h-3" /> Atualizar
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-6">
                                {/* QR Code */}
                                <div className="space-y-3">
                                  <label className="text-[10px] uppercase tracking-widest font-semibold block" style={{ color: "rgba(255,255,255,0.3)" }}>
                                    QR Code para alunos
                                  </label>
                                  <div className="flex flex-col items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                    <div className="p-3 rounded-xl" style={{ background: "white" }}>
                                      <QRCodeSVG value={presencaUrl} size={140} />
                                    </div>
                                    <p className="text-[10px] text-center leading-snug" style={{ color: "rgba(255,255,255,0.35)" }}>
                                      Aluno escaneia e confirma presença com o e-mail da matrícula
                                    </p>
                                    <button
                                      onClick={() => { navigator.clipboard.writeText(presencaUrl); toast.success("Link copiado!"); }}
                                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold w-full justify-center"
                                      style={{ background: "rgba(52,211,153,0.1)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
                                      <Link2 className="w-3 h-3" /> Copiar link
                                    </button>
                                  </div>
                                  {attending.length > 0 && (
                                    <p className="text-[10px] text-center" style={{ color: "rgba(52,211,153,0.7)" }}>
                                      ✓ Certificados serão gerados para esses {attending.length} aluno{attending.length !== 1 ? "s" : ""}
                                    </p>
                                  )}
                                </div>

                                {/* List */}
                                <div className="space-y-3">
                                  <label className="text-[10px] uppercase tracking-widest font-semibold block" style={{ color: "rgba(255,255,255,0.3)" }}>
                                    Presenças confirmadas
                                  </label>
                                  {attending.length === 0 ? (
                                    <div className="py-8 text-center rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
                                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.08)" }} />
                                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>Nenhuma presença registrada.</p>
                                      <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.18)" }}>Compartilhe o QR code com os alunos.</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                                      {attending.map((a: any, i: number) => (
                                        <div key={a.id ?? i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                                          style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}>
                                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                                            style={{ background: "rgba(52,211,153,0.15)", color: "#34D399" }}>
                                            {a.student_name?.charAt(0)?.toUpperCase() ?? "?"}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{a.student_name}</p>
                                            <p className="text-[9px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{a.student_email}</p>
                                          </div>
                                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "#34D399" }} />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </motion.div>
                  );
                })}

                {/* ── GRUPOS DO CRM ── */}
                {!coursesLoading && dbCrmGroups.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 pt-2">
                      <Users className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                      <h3 className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Grupos do CRM ({dbCrmGroups.length})
                      </h3>
                      <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                    </div>

                    {dbCrmGroups.map((group) => {
                      const members = dbGroupMembers[group.id] ?? [];
                      const isOpen = expandedCourse === `grp-${group.id}`;
                      const isCertOpen = certCourseId === `grp-${group.id}`;

                      return (
                        <motion.div key={`grp-${group.id}`} className="rounded-2xl overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${isOpen ? `${group.color}28` : "rgba(255,255,255,0.07)"}` }}>

                          {/* Group header */}
                          <div className="flex items-center gap-4 px-5 py-4">
                            <button className="flex items-center gap-4 flex-1 text-left"
                              onClick={() => setExpandedCourse(isOpen ? null : `grp-${group.id}`)}>
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: `${group.color}18`, border: `1px solid ${group.color}28` }}>
                                <Users className="w-5 h-5" style={{ color: group.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{group.name}</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>CRM</span>
                                </div>
                                {group.description && (
                                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{group.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-5 flex-shrink-0">
                                <div className="text-right">
                                  <div className="text-sm font-bold" style={{ color: group.color }}>{members.length}</div>
                                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>aluno{members.length !== 1 ? "s" : ""}</div>
                                </div>
                                <ChevronDown className="w-4 h-4 transition-transform flex-shrink-0"
                                  style={{ color: "rgba(255,255,255,0.3)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                              </div>
                            </button>

                            {/* Certificate button */}
                            <button
                              onClick={() => {
                                setCertCourseId(isCertOpen ? null : `grp-${group.id}`);
                                if (!isCertOpen) {
                                  setCertTemplate(null); setCertPreview(null);
                                  setGeneratedCerts([]); setCertManualList([]);
                                  setCertStudentName(""); setExpandedCourse(`grp-${group.id}`);
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all flex-shrink-0"
                              style={isCertOpen
                                ? { background: "rgba(250,204,21,0.18)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.35)" }
                                : { background: "rgba(250,204,21,0.08)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.2)" }}>
                              <Award className="w-3.5 h-3.5" /> Certificados
                            </button>
                          </div>

                          {/* Member list */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden"
                                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <div className="px-5 py-4">
                                  {members.length === 0 ? (
                                    <p className="text-xs py-4 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
                                      Nenhum contato neste grupo. Adicione pelo CRM → Grupos.
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-4 gap-2 px-1 pb-1">
                                        {["Nome", "E-mail", "WhatsApp", "Status"].map(h => (
                                          <div key={h} className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.25)" }}>{h}</div>
                                        ))}
                                      </div>
                                      {members.map((m: any) => (
                                        <div key={m.id} className="grid grid-cols-4 gap-2 items-center px-1 py-2 rounded-xl"
                                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                                              style={{ background: `${group.color}20`, color: group.color }}>
                                              {m.name?.charAt(0)?.toUpperCase() ?? "?"}
                                            </div>
                                            <span className="text-[11px] font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{m.name}</span>
                                          </div>
                                          <span className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{m.email || "—"}</span>
                                          <span className="text-[11px]" style={{ color: m.phone ? "#25D366" : "rgba(255,255,255,0.25)" }}>{m.phone || "—"}</span>
                                          <span className="text-[10px] px-2 py-0.5 rounded-full w-fit" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>{m.status || "—"}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Certificate panel for group */}
                          <AnimatePresence>
                            {isCertOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden"
                                style={{ borderTop: "1px solid rgba(250,204,21,0.2)" }}>
                                <div className="px-5 py-5 space-y-5">
                                  <div className="flex items-center gap-3">
                                    <Award className="w-4 h-4" style={{ color: "#FBBF24" }} />
                                    <p className="text-sm font-semibold" style={{ color: "#FBBF24" }}>Emissão de Certificados — {group.name}</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-6">
                                    {/* Template + Config */}
                                    <div className="space-y-4">
                                      <div>
                                        <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Template (PNG/JPG)</label>
                                        <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
                                          style={{ background: certTemplate ? "rgba(250,204,21,0.06)" : "rgba(255,255,255,0.04)", border: certTemplate ? "1px solid rgba(250,204,21,0.3)" : "2px dashed rgba(255,255,255,0.12)" }}>
                                          <input type="file" className="hidden" accept="image/*" onChange={handleCertTemplateUpload} />
                                          <Award className="w-4 h-4 flex-shrink-0" style={{ color: certTemplate ? "#FBBF24" : "rgba(255,255,255,0.25)" }} />
                                          <span className="text-[11px]" style={{ color: certTemplate ? "#FBBF24" : "rgba(255,255,255,0.3)" }}>
                                            {certTemplate ? "✓ Template carregado — clique para trocar" : "Clique para enviar o template"}
                                          </span>
                                        </label>
                                      </div>
                                      {certTemplate && (
                                        <>
                                          <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest font-semibold block" style={{ color: "rgba(255,255,255,0.3)" }}>Posição do nome</label>
                                            <div className="grid grid-cols-2 gap-3">
                                              {[
                                                { label: `Horizontal: ${certNameX}%`, v: certNameX, set: (n: number) => { setCertNameX(n); setCertPreview(null); } },
                                                { label: `Vertical: ${certNameY}%`, v: certNameY, set: (n: number) => { setCertNameY(n); setCertPreview(null); } },
                                                { label: `Fonte: ${certFontSize}px`, v: certFontSize, set: (n: number) => { setCertFontSize(n); setCertPreview(null); }, min: 20, max: 120 },
                                              ].map((s, i) => (
                                                <div key={i}>
                                                  <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                                                  <input type="range" min={s.min ?? 5} max={s.max ?? 95} value={s.v}
                                                    onChange={e => s.set(+e.target.value)} className="w-full accent-yellow-400" />
                                                </div>
                                              ))}
                                              <div>
                                                <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Cor do texto</div>
                                                <div className="flex items-center gap-2">
                                                  <input type="color" value={certFontColor} onChange={e => { setCertFontColor(e.target.value); setCertPreview(null); }}
                                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                                                  <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{certFontColor}</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          <div>
                                            <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Pré-visualizar</label>
                                            <div className="flex gap-2">
                                              <input value={certStudentName} onChange={e => { setCertStudentName(e.target.value); setCertPreview(null); }}
                                                placeholder="Digite um nome para testar…"
                                                className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none"
                                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0" }} />
                                              <button onClick={previewCert} disabled={!certStudentName.trim() || certGenerating}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold disabled:opacity-40"
                                                style={{ background: "rgba(250,204,21,0.12)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.25)" }}>
                                                {certGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />} Ver
                                              </button>
                                            </div>
                                            {certPreview && (
                                              <div className="mt-2 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(250,204,21,0.2)" }}>
                                                <img src={certPreview} alt="Preview" className="w-full" />
                                                <div className="flex gap-2 p-2" style={{ background: "rgba(0,0,0,0.5)" }}>
                                                  <button onClick={() => downloadCert(certPreview!, certStudentName)}
                                                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold"
                                                    style={{ background: "rgba(250,204,21,0.12)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.25)" }}>
                                                    <Download className="w-3 h-3" /> Baixar preview
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {/* Alunos do grupo + geração */}
                                    <div className="space-y-4">
                                      <div>
                                        <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                                          Alunos do grupo ({members.length})
                                        </label>
                                        {members.length === 0 ? (
                                          <p className="text-xs py-3 text-center rounded-xl" style={{ color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.03)" }}>
                                            Nenhum membro neste grupo.
                                          </p>
                                        ) : (
                                          <div className="space-y-1.5 max-h-40 overflow-y-auto mb-3">
                                            {members.map((m: any) => (
                                              <div key={m.id} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                                                  style={{ background: `${group.color}20`, color: group.color }}>
                                                  {m.name?.charAt(0)?.toUpperCase() ?? "?"}
                                                </div>
                                                <span className="flex-1 text-[11px] truncate" style={{ color: "rgba(255,255,255,0.75)" }}>{m.name}</span>
                                                {m.phone && <BadgeCheck className="w-3 h-3 flex-shrink-0" style={{ color: "#25D366" }} />}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Nomes extras manuais */}
                                        <div className="flex gap-2 mb-2">
                                          <input value={certManualName} onChange={e => setCertManualName(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter" && certManualName.trim()) { setCertManualList(p => [...p, certManualName.trim()]); setCertManualName(""); } }}
                                            placeholder="Nome extra (Enter)"
                                            className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none"
                                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0" }} />
                                          <button onClick={() => { if (certManualName.trim()) { setCertManualList(p => [...p, certManualName.trim()]); setCertManualName(""); } }}
                                            className="px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                            <Plus className="w-3 h-3" />
                                          </button>
                                        </div>
                                        {certManualList.length > 0 && (
                                          <div className="space-y-1 mb-3 max-h-24 overflow-y-auto">
                                            {certManualList.map((name, i) => (
                                              <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>{name}</span>
                                                <button onClick={() => setCertManualList(p => p.filter((_, j) => j !== i))} style={{ color: "rgba(255,255,255,0.3)" }}>
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {certTemplate && (
                                          <button
                                            onClick={async () => {
                                              if (!certTemplate) return;
                                              setCertGenerating(true);
                                              const names = [...new Set([...members.map((m: any) => m.name).filter(Boolean), ...certManualList])];
                                              const certs: { name: string; dataUrl: string }[] = [];
                                              for (const name of names) {
                                                const dataUrl = await renderCertificate(certTemplate, name, certNameX, certNameY, certFontSize, certFontColor);
                                                certs.push({ name, dataUrl });
                                              }
                                              setGeneratedCerts(certs);
                                              setCertGenerating(false);
                                            }}
                                            disabled={certGenerating || (members.length + certManualList.length === 0)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                                            style={{ background: "#FBBF24", color: "#07080A", boxShadow: "0 0 20px -4px rgba(250,204,21,0.35)" }}>
                                            {certGenerating
                                              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando…</>
                                              : <><Award className="w-4 h-4" /> Gerar {members.length + certManualList.length} certificado{(members.length + certManualList.length) !== 1 ? "s" : ""}</>}
                                          </button>
                                        )}
                                        {!certTemplate && (
                                          <p className="text-[11px] text-center py-2" style={{ color: "rgba(255,255,255,0.3)" }}>← Envie o template primeiro</p>
                                        )}
                                      </div>

                                      {/* Certificados gerados */}
                                      {generatedCerts.length > 0 && certCourseId === `grp-${group.id}` && (
                                        <div>
                                          <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2" style={{ color: "#34D399" }}>
                                            ✓ {generatedCerts.length} certificado{generatedCerts.length !== 1 ? "s" : ""} gerado{generatedCerts.length !== 1 ? "s" : ""}
                                          </label>
                                          <div className="space-y-1.5 max-h-44 overflow-y-auto">
                                            {generatedCerts.map((cert, i) => (
                                              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                                <div className="w-8 h-6 rounded overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(250,204,21,0.2)" }}>
                                                  <img src={cert.dataUrl} alt={cert.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="flex-1 text-[11px] font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{cert.name}</span>
                                                <div className="flex gap-1.5">
                                                  <button onClick={() => downloadCert(cert.dataUrl, cert.name)}
                                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                                                    style={{ background: "rgba(250,204,21,0.1)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.2)" }}>
                                                    <Download className="w-3 h-3" /> Baixar
                                                  </button>
                                                  {wpStatus === "connected" && (() => {
                                                    const member = members.find((m: any) => m.name === cert.name);
                                                    return member?.phone ? (
                                                      <button onClick={() => sendCertViaWp(cert.dataUrl, member.phone, cert.name)}
                                                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                                                        style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                                                        <Send className="w-3 h-3" /> WA
                                                      </button>
                                                    ) : null;
                                                  })()}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                          <button onClick={() => generatedCerts.forEach(c => downloadCert(c.dataUrl, c.name))}
                                            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                                            style={{ background: "rgba(250,204,21,0.08)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.2)" }}>
                                            <Download className="w-3.5 h-3.5" /> Baixar todos
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                        </motion.div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                BLOCO ANTIGO REMOVIDO
            ══════════════════════════════════════════════════════ */}
            {false && (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Cursos</h2>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {client.courses?.length ?? 0} cursos · Eduardo (Agente de Vendas) monitora os leads via WhatsApp
                    </p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
                    style={{ background: `${client.color}18`, color: client.color, border: `1px solid ${client.color}30` }}>
                    <Plus className="w-3.5 h-3.5" /> Novo curso
                  </button>
                </div>

                {/* Course grid */}
                {(client.courses ?? []).length === 0 ? (
                  <div className="rounded-2xl p-12 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
                    <GraduationCap className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Nenhum curso cadastrado.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(client.courses ?? []).map((course) => {
                      const isOpen = expandedCourse === course.id;
                      const spotsLeft = course.spots - course.enrolled;
                      const fillPct = Math.round((course.enrolled / course.spots) * 100);
                      const modalityColor: Record<string, string> = {
                        "Online Ao Vivo": "#60A5FA",
                        "Gravado":         "#34D399",
                        "Presencial":      "#F97316",
                        "Híbrido":         "#A78BFA",
                      };
                      const mColor = modalityColor[course.modality] ?? "#60A5FA";

                      return (
                        <motion.div key={course.id}
                          className="rounded-2xl overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${isOpen ? `${client.color}28` : "rgba(255,255,255,0.07)"}` }}>

                          {/* Course header row */}
                          <button
                            className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            onClick={() => setExpandedCourse(isOpen ? null : course.id)}>

                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: `${client.color}18`, border: `1px solid ${client.color}28` }}>
                              <GraduationCap className="w-5 h-5" style={{ color: client.color }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{course.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: `${mColor}15`, color: mColor }}>
                                  {course.modality}
                                </span>
                                {course.whatsappGroupId && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(37,211,102,0.12)", color: "#25D366" }}>
                                    WhatsApp
                                  </span>
                                )}
                              </div>
                              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{course.tagline}</p>
                            </div>

                            {/* Compact stats */}
                            <div className="flex items-center gap-6 flex-shrink-0">
                              <div className="text-right">
                                <div className="text-xs font-bold" style={{ color: client.color }}>{course.price}</div>
                                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{course.duration}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold" style={{ color: spotsLeft < 10 ? "#F87171" : "rgba(255,255,255,0.8)" }}>
                                  {spotsLeft < 999 ? `${spotsLeft} vagas` : "∞ vagas"}
                                </div>
                                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{course.nextDate}</div>
                              </div>
                              <ChevronDown className="w-4 h-4 transition-transform" style={{ color: "rgba(255,255,255,0.3)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                            </div>
                          </button>

                          {/* Expanded spec sheet */}
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                                className="overflow-hidden"
                                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <div className="px-5 py-5 grid grid-cols-3 gap-6">

                                  {/* Col 1: Specs */}
                                  <div className="space-y-3">
                                    <h4 className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>Especificações</h4>
                                    {[
                                      { label: "Duração",       value: course.duration },
                                      { label: "Modalidade",    value: course.modality },
                                      { label: "Público-alvo",  value: course.targetAudience },
                                      { label: "Certificado",   value: course.certificate },
                                      { label: "Instrutor",     value: course.instructor },
                                      { label: "Parcelamento",  value: course.installments },
                                    ].map((s) => (
                                      <div key={s.label}>
                                        <div className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.25)" }}>{s.label}</div>
                                        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{s.value}</div>
                                      </div>
                                    ))}
                                    {/* Enrollment bar */}
                                    <div>
                                      <div className="flex justify-between mb-1">
                                        <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.25)" }}>Ocupação</span>
                                        <span className="text-[10px]" style={{ color: fillPct > 80 ? "#F87171" : client.color }}>{fillPct}%</span>
                                      </div>
                                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                                        <motion.div className="h-full rounded-full"
                                          style={{ background: fillPct > 80 ? "#F87171" : client.color }}
                                          initial={{ width: 0 }} animate={{ width: `${fillPct}%` }}
                                          transition={{ duration: 0.8, ease: "easeOut" }} />
                                      </div>
                                      <div className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                                        {course.enrolled} matriculados · {course.spots < 999 ? `${spotsLeft} restantes` : "vagas ilimitadas"}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Col 2: Topics */}
                                  <div className="space-y-3">
                                    <h4 className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>Conteúdo programático</h4>
                                    <div className="space-y-1.5">
                                      {course.topics.map((t, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                          <span className="text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ color: client.color }}>{String(i + 1).padStart(2, "0")}</span>
                                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{t}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div>
                                      <h4 className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Inclui</h4>
                                      {course.includes.map((inc, i) => (
                                        <div key={i} className="flex items-center gap-1.5 mb-1">
                                          <BadgeCheck className="w-3 h-3 flex-shrink-0" style={{ color: "#34D399" }} />
                                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{inc}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Col 3: Actions */}
                                  <div className="space-y-3">
                                    <h4 className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>Ações</h4>
                                    <div className="space-y-2">
                                      {course.whatsappGroupId && (
                                        <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                                          style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                                          <Smartphone className="w-3.5 h-3.5" />
                                          Disparar no grupo WhatsApp
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setCertCourseId(certCourseId === course.id ? null : course.id);
                                          setCertTemplate(null);
                                          setCertPreview(null);
                                          setGeneratedCerts([]);
                                          setCertManualList([]);
                                          setCertStudentName("");
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                                        style={certCourseId === course.id
                                          ? { background: "rgba(250,204,21,0.15)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.3)" }
                                          : { background: "rgba(250,204,21,0.08)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.18)" }}>
                                        <Award className="w-3.5 h-3.5" />
                                        {certCourseId === course.id ? "Fechar certificados" : "Emitir Certificados"}
                                      </button>
                                      <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                                        style={{ background: `${client.color}12`, color: client.color, border: `1px solid ${client.color}25` }}>
                                        <MsgSq className="w-3.5 h-3.5" />
                                        Pedir ao Eduardo para divulgar
                                      </button>
                                      <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                        <FileEdit className="w-3.5 h-3.5" />
                                        Editar especificações
                                      </button>
                                    </div>

                                    {/* WhatsApp leads for this course */}
                                    {(client.whatsappLeads ?? []).filter(l => l.courseId === course.id).length > 0 && (
                                      <div>
                                        <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
                                          Leads deste curso
                                        </div>
                                        {(client.whatsappLeads ?? []).filter(l => l.courseId === course.id).map(lead => (
                                          <div key={lead.id} className="flex items-center gap-2 p-2 rounded-lg mb-1"
                                            style={{ background: "rgba(255,255,255,0.04)" }}>
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                                              style={{ background: "rgba(37,211,102,0.15)", color: "#25D366" }}>
                                              {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-[11px] font-medium truncate" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.name}</div>
                                              <div className="text-[10px]" style={{ color: lead.addedToCrm ? "#34D399" : "rgba(255,255,255,0.25)" }}>
                                                {lead.addedToCrm ? "✓ No CRM" : "Aguardando qualificação"}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* ── PAINEL DE CERTIFICADOS ── */}
                                <AnimatePresence>
                                  {certCourseId === course.id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                                      className="overflow-hidden"
                                      style={{ borderTop: "1px solid rgba(250,204,21,0.15)" }}>
                                      <div className="px-5 py-5 space-y-5">

                                        {/* Title */}
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.2)" }}>
                                            <Award className="w-4 h-4" style={{ color: "#FBBF24" }} />
                                          </div>
                                          <div>
                                            <p className="text-sm font-semibold" style={{ color: "#FBBF24" }}>Emissão de Certificados</p>
                                            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Envie o template e a ferramenta preenche o nome do aluno</p>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                          {/* Coluna Esquerda: Config */}
                                          <div className="space-y-4">

                                            {/* Upload template */}
                                            <div>
                                              <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                                                Template do certificado (PNG/JPG)
                                              </label>
                                              <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                                                style={{ background: certTemplate ? "rgba(250,204,21,0.06)" : "rgba(255,255,255,0.04)", border: certTemplate ? "1px solid rgba(250,204,21,0.3)" : "2px dashed rgba(255,255,255,0.12)" }}>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleCertTemplateUpload} />
                                                <Award className="w-4 h-4 flex-shrink-0" style={{ color: certTemplate ? "#FBBF24" : "rgba(255,255,255,0.25)" }} />
                                                <span className="text-[11px]" style={{ color: certTemplate ? "#FBBF24" : "rgba(255,255,255,0.3)" }}>
                                                  {certTemplate ? "✓ Template carregado — clique para trocar" : "Clique para enviar o template"}
                                                </span>
                                              </label>
                                            </div>

                                            {/* Position controls */}
                                            {certTemplate && (
                                              <div className="space-y-3">
                                                <label className="text-[10px] uppercase tracking-widest font-semibold block" style={{ color: "rgba(255,255,255,0.3)" }}>
                                                  Posição do nome
                                                </label>
                                                <div className="grid grid-cols-2 gap-3">
                                                  <div>
                                                    <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Horizontal: {certNameX}%</div>
                                                    <input type="range" min="5" max="95" value={certNameX}
                                                      onChange={e => { setCertNameX(+e.target.value); setCertPreview(null); }}
                                                      className="w-full accent-yellow-400" />
                                                  </div>
                                                  <div>
                                                    <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Vertical: {certNameY}%</div>
                                                    <input type="range" min="5" max="95" value={certNameY}
                                                      onChange={e => { setCertNameY(+e.target.value); setCertPreview(null); }}
                                                      className="w-full accent-yellow-400" />
                                                  </div>
                                                  <div>
                                                    <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Tamanho: {certFontSize}px</div>
                                                    <input type="range" min="20" max="120" value={certFontSize}
                                                      onChange={e => { setCertFontSize(+e.target.value); setCertPreview(null); }}
                                                      className="w-full accent-yellow-400" />
                                                  </div>
                                                  <div>
                                                    <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>Cor do texto</div>
                                                    <div className="flex items-center gap-2">
                                                      <input type="color" value={certFontColor}
                                                        onChange={e => { setCertFontColor(e.target.value); setCertPreview(null); }}
                                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                                                      <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>{certFontColor}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {/* Preview test name */}
                                            {certTemplate && (
                                              <div>
                                                <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                                                  Pré-visualizar com nome
                                                </label>
                                                <div className="flex gap-2">
                                                  <input
                                                    value={certStudentName}
                                                    onChange={e => { setCertStudentName(e.target.value); setCertPreview(null); }}
                                                    placeholder="Ex: Maria Silva"
                                                    className="flex-1 px-3 py-2 rounded-lg text-xs"
                                                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                                                  <button onClick={previewCert} disabled={!certStudentName.trim() || certGenerating}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold disabled:opacity-40"
                                                    style={{ background: "rgba(250,204,21,0.12)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.25)" }}>
                                                    {certGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                                                    Ver
                                                  </button>
                                                </div>
                                                {certPreview && (
                                                  <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(250,204,21,0.2)" }}>
                                                    <img src={certPreview} alt="Preview" className="w-full" />
                                                    <div className="flex gap-2 p-2" style={{ background: "rgba(0,0,0,0.4)" }}>
                                                      <button onClick={() => downloadCert(certPreview!, certStudentName)}
                                                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold"
                                                        style={{ background: "rgba(250,204,21,0.12)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.25)" }}>
                                                        <Download className="w-3 h-3" /> Baixar
                                                      </button>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>

                                          {/* Coluna Direita: Alunos + Geração em lote */}
                                          <div className="space-y-4">
                                            <div>
                                              <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                                                Alunos do curso
                                              </label>

                                              {/* Leads detectados */}
                                              {(client.whatsappLeads ?? []).filter(l => l.courseId === course.id).length > 0 && (
                                                <div className="mb-3 space-y-1.5 max-h-32 overflow-y-auto">
                                                  {(client.whatsappLeads ?? []).filter(l => l.courseId === course.id).map(lead => (
                                                    <div key={lead.id} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                                                      style={{ background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.15)" }}>
                                                      <BadgeCheck className="w-3 h-3 flex-shrink-0" style={{ color: "#34D399" }} />
                                                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.name}</span>
                                                      <span className="text-[9px] ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>{lead.number}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}

                                              {/* Adicionar manualmente */}
                                              <div className="flex gap-2 mb-2">
                                                <input
                                                  value={certManualName}
                                                  onChange={e => setCertManualName(e.target.value)}
                                                  onKeyDown={e => {
                                                    if (e.key === "Enter" && certManualName.trim()) {
                                                      setCertManualList(p => [...p, certManualName.trim()]);
                                                      setCertManualName("");
                                                    }
                                                  }}
                                                  placeholder="Nome do aluno (Enter para adicionar)"
                                                  className="flex-1 px-3 py-2 rounded-lg text-xs"
                                                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                                                <button
                                                  onClick={() => { if (certManualName.trim()) { setCertManualList(p => [...p, certManualName.trim()]); setCertManualName(""); } }}
                                                  className="px-3 py-2 rounded-lg text-[11px] font-semibold"
                                                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                                  <Plus className="w-3 h-3" />
                                                </button>
                                              </div>

                                              {/* Lista manual */}
                                              {certManualList.length > 0 && (
                                                <div className="space-y-1 mb-3 max-h-28 overflow-y-auto">
                                                  {certManualList.map((name, i) => (
                                                    <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                                                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>{name}</span>
                                                      <button onClick={() => setCertManualList(p => p.filter((_, j) => j !== i))}
                                                        className="w-4 h-4 flex items-center justify-center rounded"
                                                        style={{ color: "rgba(255,255,255,0.3)" }}>
                                                        <X className="w-3 h-3" />
                                                      </button>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}

                                              {/* Total e botão gerar */}
                                              {certTemplate && (
                                                <div className="space-y-2">
                                                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                                                    {[...(client.whatsappLeads ?? []).filter(l => l.courseId === course.id).map(l => l.name), ...certManualList].filter(Boolean).length} aluno(s) no total
                                                  </p>
                                                  <button
                                                    onClick={() => generateAllCerts(course.id)}
                                                    disabled={certGenerating || ([...(client.whatsappLeads ?? []).filter(l => l.courseId === course.id).map(l => l.name), ...certManualList].filter(Boolean).length === 0)}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                                                    style={{ background: "#FBBF24", color: "#07080A", boxShadow: "0 0 20px -4px rgba(250,204,21,0.35)" }}>
                                                    {certGenerating
                                                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando…</>
                                                      : <><Award className="w-4 h-4" /> Gerar todos os certificados</>}
                                                  </button>
                                                </div>
                                              )}
                                            </div>

                                            {/* Certificados gerados */}
                                            {generatedCerts.length > 0 && (
                                              <div>
                                                <label className="text-[10px] uppercase tracking-widest font-semibold block mb-2" style={{ color: "#34D399" }}>
                                                  ✓ {generatedCerts.length} certificado(s) gerado(s)
                                                </label>
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                  {generatedCerts.map((cert, i) => (
                                                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                                                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid rgba(250,204,21,0.2)" }}>
                                                        <img src={cert.dataUrl} alt={cert.name} className="w-full h-full object-cover" />
                                                      </div>
                                                      <span className="flex-1 text-[11px] font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{cert.name}</span>
                                                      <div className="flex gap-1.5">
                                                        <button onClick={() => downloadCert(cert.dataUrl, cert.name)}
                                                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                                                          style={{ background: "rgba(250,204,21,0.1)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.2)" }}>
                                                          <Download className="w-3 h-3" /> Baixar
                                                        </button>
                                                        {wpStatus === "connected" && (() => {
                                                          const lead = (client.whatsappLeads ?? []).find(l => l.name === cert.name && l.courseId === course.id);
                                                          return lead?.number ? (
                                                            <button onClick={() => sendCertViaWp(cert.dataUrl, lead.number, cert.name)}
                                                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold"
                                                              style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                                                              <Send className="w-3 h-3" /> WhatsApp
                                                            </button>
                                                          ) : null;
                                                        })()}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                                {/* Baixar todos */}
                                                <button
                                                  onClick={() => generatedCerts.forEach(c => downloadCert(c.dataUrl, c.name))}
                                                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                                                  style={{ background: "rgba(250,204,21,0.08)", color: "#FBBF24", border: "1px solid rgba(250,204,21,0.2)" }}>
                                                  <Download className="w-3.5 h-3.5" /> Baixar todos
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Eduardo's WhatsApp leads panel */}
                {(client.whatsappLeads ?? []).length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Smartphone className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
                      <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Leads WhatsApp — Eduardo
                      </h3>
                      <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#F59E0B" }} />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "#F59E0B" }} />
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(client.whatsappLeads ?? []).map((lead) => {
                        const course = (client.courses ?? []).find(c => c.id === lead.courseId);
                        const STAGE_LABEL: Record<string, string> = { prospeccao: "Prospecção", qualificacao: "Qualificação", proposta: "Proposta", negociacao: "Negociação", ganho: "Ganho" };
                        const STAGE_COLOR: Record<string, string> = { prospeccao: "#60A5FA", qualificacao: "#A78BFA", proposta: "#FBBF24", negociacao: "#F97316", ganho: "#34D399" };
                        return (
                          <motion.div key={lead.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl p-4"
                            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{ background: "rgba(37,211,102,0.12)", color: "#25D366" }}>
                                  {lead.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{lead.name}</div>
                                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{lead.number}</div>
                                </div>
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: `${STAGE_COLOR[lead.stage]}15`, color: STAGE_COLOR[lead.stage] }}>
                                {STAGE_LABEL[lead.stage]}
                              </span>
                            </div>

                            {course && (
                              <div className="mb-2 px-2 py-1 rounded-lg"
                                style={{ background: `${client.color}10`, border: `1px solid ${client.color}20` }}>
                                <span className="text-[10px] font-medium" style={{ color: client.color }}>{course.name}</span>
                              </div>
                            )}

                            <p className="text-[11px] mb-3 leading-relaxed line-clamp-2"
                              style={{ color: "rgba(255,255,255,0.45)" }}>
                              "{lead.message}"
                            </p>

                            <div className="flex items-center justify-between">
                              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>{lead.time}</span>
                              <div className="flex gap-1.5">
                                {!lead.addedToCrm && (
                                  <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium"
                                    style={{ background: "rgba(52,211,153,0.1)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
                                    <UserCheck className="w-2.5 h-2.5" /> Adicionar ao CRM
                                  </button>
                                )}
                                <button className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium"
                                  style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>
                                  <PhoneCall className="w-2.5 h-2.5" /> Responder
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                PORTAL DO CLIENTE — VISÃO DA AGÊNCIA
            ══════════════════════════════════════════════════════ */}
            {activeTab === "portal" && (() => {
              const DELIV_PRESETS = [
                { category: "social",     label: "📝 Post publicado" },
                { category: "story",      label: "📱 Story publicado" },
                { category: "video",      label: "🎬 Vídeo editado" },
                { category: "arte",       label: "🎨 Arte criada" },
                { category: "copy",       label: "✍️ Copy/Legenda" },
                { category: "email",      label: "📧 E-mail marketing" },
                { category: "relatorio",  label: "📊 Relatório mensal" },
                { category: "reuniao",    label: "🤝 Reunião" },
                { category: "trafego",    label: "🎯 Campanha tráfego" },
                { category: "calendario", label: "📅 Calendário editorial" },
                { category: "estrategia", label: "💡 Planejamento" },
                { category: "outro",      label: "➕ Outro" },
              ];
              const AGENTS = [
                { id: "luna",      name: "Luna",    color: "#B9FF4B", role: "Orquestradora" },
                { id: "queila",    name: "Queila",  color: "#FBBF24", role: "Estrategista" },
                { id: "beatriz",   name: "Beatriz", color: "#A78BFA", role: "Copywriter" },
                { id: "marcela",   name: "Marcela", color: "#D946EF", role: "Designer" },
                { id: "rafaela",   name: "Rafaela", color: "#F97316", role: "Tráfego" },
                { id: "marina",    name: "Marina",  color: "#60A5FA", role: "Social Media" },
                { id: "pedro",     name: "Pedro",   color: "#2DD4BF", role: "Calendário" },
                { id: "lucas",     name: "Lucas",   color: "#34D399", role: "Analista" },
                { id: "teo",       name: "Teo",     color: "#06B6D4", role: "Editor de Site" },
                { id: "bobby",     name: "Bobby",   color: "#B9FF4B", role: "Editor de Vídeo" },
              ];
              const visibleDelivs = deliverables.filter(d => d.visible_to_client);
              const OB_CATS = ["geral","redes_sociais","acessos","configuracao","documentos"];
              const OB_CAT_LABEL: Record<string,string> = { geral:"Geral", redes_sociais:"Redes Sociais", acessos:"Acessos & Senhas", configuracao:"Configuração", documentos:"Documentos" };
              const PROP_STATUS: Record<string, { label: string; color: string; bg: string }> = {
                pending:     { label: "Aguardando",   color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
                approved:    { label: "Aprovado",     color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
                in_progress: { label: "Em andamento", color: "#B9FF4B", bg: "rgba(185,255,75,0.12)" },
                completed:   { label: "Concluído",    color: "#34D399", bg: "rgba(52,211,153,0.12)" },
                rejected:    { label: "Rejeitado",    color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
              };
              return (
              <div style={{ margin: "-24px", minHeight: "100%", background: "#F2F1EE", fontFamily: "system-ui,-apple-system,sans-serif" }}>

                {/* ── Agency bar ── */}
                <div className="px-5 py-3 flex items-center gap-3 flex-shrink-0" style={{ background: "#111", borderBottom: "2px solid #B9FF4B22" }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "#B9FF4B18", color: "#B9FF4B", border: "1px solid #B9FF4B30" }}>Modo Agência</span>
                  <span className="text-[11px] flex-1" style={{ color: "rgba(255,255,255,0.35)" }}>Você está editando o que o cliente vê</span>
                  <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>PIN: {client.portalPin || "—"}</span>
                  <button onClick={fetchAiPortalSuggestions} disabled={aiPortalLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0 disabled:opacity-60"
                    style={{ background: "rgba(185,255,75,0.12)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)" }}>
                    {aiPortalLoading
                      ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      : <span>✨</span>}
                    Sugerir com IA
                  </button>
                  <button onClick={handleOpenPortal} disabled={openingPortal}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                    style={{ background: "#B9FF4B", color: "#07080A" }}>
                    {openingPortal ? <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                    Abrir portal real
                  </button>
                </div>

                {/* ── AI Suggestions Panel ── */}
                {aiPortalSuggestions && (() => {
                  const AGENT_COLORS: Record<string, string> = {
                    luna: "#B9FF4B", queila: "#FBBF24", beatriz: "#A78BFA", marcela: "#D946EF",
                    rafaela: "#F97316", marina: "#60A5FA", pedro: "#2DD4BF", lucas: "#34D399",
                    teo: "#06B6D4", bobby: "#B9FF4B",
                  };
                  const s = aiPortalSuggestions;
                  const addOnboard = async (item: typeof s.onboarding[number]) => {
                    try {
                      const { data: row } = await (supabase as any).from("client_onboarding").insert({
                        client_uuid: portalClientUUID, title: item.title,
                        category: item.category, responsible: item.responsible, status: "pending",
                      }).select().single();
                      if (row) { setPortalOnboarding(prev => [...prev, row]); toast.success("Item adicionado!"); }
                    } catch { toast.error("Erro ao adicionar."); }
                  };
                  const addEntrega = async (item: typeof s.entregas[number]) => {
                    const today = new Date().toISOString().slice(0, 10);
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) return;
                      const { data: row } = await (supabase as any).from("client_deliverables").insert({
                        client_id: id, user_id: session.user.id,
                        category: item.category, description: item.description,
                        done_at: today, visible_to_client: true,
                      }).select().single();
                      if (row) { setDeliverables(prev => [row, ...prev]); toast.success("Entrega registrada!"); }
                    } catch { toast.error("Erro ao registrar."); }
                  };
                  const addProposta = async (item: typeof s.propostas[number]) => {
                    try {
                      const { data: row } = await (supabase as any).from("agent_proposals").insert({
                        client_id: id, agent_id: item.agent_id, agent_name: item.agent_name,
                        agent_color: item.agent_color, titulo: item.titulo, descricao: item.descricao, status: "pending",
                      }).select().single();
                      if (row) { setAgentProposals(prev => [row, ...prev]); toast.success("Proposta criada!"); }
                    } catch { toast.error("Erro ao criar proposta."); }
                  };
                  const addDemanda = async (item: typeof s.demandas[number]) => {
                    try {
                      const { data: row } = await (supabase as any).from("client_demands").insert({
                        client_uuid: portalClientUUID, title: item.title,
                        responsible: item.responsible, priority: item.priority, status: "pending",
                      }).select().single();
                      if (row) { setPortalDemands(prev => [...prev, row]); toast.success("Demanda adicionada!"); }
                    } catch { toast.error("Erro ao adicionar."); }
                  };

                  type SectionKey = "onboarding" | "entregas" | "propostas" | "demandas";
                  const sections: { key: SectionKey; label: string; items: unknown[]; addFn: (item: any) => void }[] = [
                    { key: "onboarding", label: "✅ Onboarding", items: s.onboarding, addFn: addOnboard },
                    { key: "entregas",   label: "📦 Entregas",   items: s.entregas,   addFn: addEntrega },
                    { key: "propostas",  label: "⚡ Propostas",  items: s.propostas,  addFn: addProposta },
                    { key: "demandas",   label: "📋 Demandas",   items: s.demandas,   addFn: addDemanda },
                  ];

                  return (
                    <div style={{ background: "#0D0D0D", borderBottom: "1px solid rgba(185,255,75,0.12)" }}>
                      <div className="max-w-3xl mx-auto px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: 14 }}>✨</span>
                            <p className="text-xs font-semibold" style={{ color: "#B9FF4B" }}>Sugestões da Calu IA</p>
                            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>baseadas no briefing de {client.name}</p>
                          </div>
                          <button onClick={() => setAiPortalSuggestions(null)}
                            style={{ color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {sections.map(({ key, label, items, addFn }) => (
                            <div key={key} className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                              <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</p>
                                <button
                                  onClick={async () => { for (const item of items) await addFn(item); toast.success(`Todos os itens de ${label} adicionados!`); }}
                                  className="text-[10px] px-2 py-0.5 rounded-lg font-medium"
                                  style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)" }}>
                                  + Todos
                                </button>
                              </div>
                              <div>
                                {(items as any[]).map((item, i) => (
                                  <div key={i} className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    {key === "propostas" && (
                                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: AGENT_COLORS[item.agent_id] ?? "#B9FF4B", display: "inline-block", flexShrink: 0 }} />
                                    )}
                                    <p className="text-[11px] flex-1" style={{ color: "rgba(255,255,255,0.75)" }}>
                                      {key === "onboarding" ? item.title
                                        : key === "entregas" ? item.description
                                        : key === "propostas" ? `${item.agent_name}: ${item.titulo}`
                                        : item.title}
                                    </p>
                                    <button onClick={() => addFn(item)}
                                      className="text-[10px] px-2 py-0.5 rounded-lg font-medium flex-shrink-0"
                                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                      +
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Portal content ── */}
                <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">

                  {/* ── ONBOARDING ── */}
                  <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#111" }}>✅ Onboarding</p>
                        <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                          {portalOnboarding.filter(i => i.status === "completed").length}/{portalOnboarding.length} concluídos
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {portalOnboarding.some(i => i.responsible === "agency" && i.status === "pending") && (
                          <button
                            onClick={answerAllOnboard}
                            disabled={!!answeringOnboard || answeringAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                            style={{ background: "rgba(185,255,75,0.12)", color: "#3a6e00", border: "1px solid rgba(185,255,75,0.35)" }}>
                            {answeringAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                            Agentes respondem
                          </button>
                        )}
                        <button onClick={() => setShowOnboardForm(s => !s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                          style={{ background: showOnboardForm ? "#111" : "rgba(0,0,0,0.06)", color: showOnboardForm ? "#B9FF4B" : "#555" }}>
                          + Adicionar
                        </button>
                      </div>
                    </div>
                    {showOnboardForm && (
                      <div className="px-5 py-4 space-y-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF8" }}>
                        <input value={onboardForm.title} onChange={(e) => setOnboardForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="Título do item (ex: Enviar acesso ao Instagram)…"
                          className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#111" }} />
                        <div className="flex gap-2">
                          <select value={onboardForm.category} onChange={(e) => setOnboardForm(f => ({ ...f, category: e.target.value }))}
                            className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#555" }}>
                            {OB_CATS.map(c => <option key={c} value={c}>{OB_CAT_LABEL[c]}</option>)}
                          </select>
                          <select value={onboardForm.responsible} onChange={(e) => setOnboardForm(f => ({ ...f, responsible: e.target.value as any }))}
                            className="rounded-xl px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#555" }}>
                            <option value="agency">Agência</option>
                            <option value="client">Cliente</option>
                          </select>
                          <button onClick={saveOnboardItem} disabled={savingOnboard || !onboardForm.title.trim() || !portalClientUUID}
                            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 flex-shrink-0"
                            style={{ background: "#111", color: "#B9FF4B" }}>
                            {savingOnboard ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
                          </button>
                        </div>
                      </div>
                    )}
                    {!portalClientUUID ? (
                      <div className="px-5 py-6 text-center"><p className="text-sm" style={{ color: "#bbb" }}>Abra o portal uma vez para ativar</p></div>
                    ) : portalOnboarding.length === 0 ? (
                      <div className="px-5 py-6 text-center"><p className="text-sm" style={{ color: "#bbb" }}>Nenhum item ainda</p></div>
                    ) : (
                      <div>
                        {portalOnboarding.map((item) => {
                          const isAnswering = answeringOnboard === item.id;
                          const hasNotes = !!item.notes;
                          const notesOpen = expandedNotes.has(item.id);
                          const agentInfo = ONBOARD_AGENT[item.category] ?? ONBOARD_AGENT.geral;
                          return (
                            <div key={item.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                              <div className="flex items-center gap-3 px-5 py-3">
                                <button onClick={() => toggleOnboardStatus(item.id, item.status)} className="flex-shrink-0">
                                  {item.status === "completed"
                                    ? <CheckCircle2 className="w-4 h-4" style={{ color: "#34D399" }} />
                                    : isAnswering
                                    ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#B9FF4B" }} />
                                    : <Circle className="w-4 h-4" style={{ color: "#ddd" }} />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm" style={{ color: item.status === "completed" ? "#aaa" : "#111", textDecoration: item.status === "completed" ? "line-through" : "none" }}>{item.title}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-xs" style={{ color: "#bbb" }}>{OB_CAT_LABEL[item.category] ?? item.category} · {item.responsible === "client" ? "Cliente" : "Agência"}</p>
                                    {hasNotes && (
                                      <button onClick={() => setExpandedNotes(prev => { const n = new Set(prev); notesOpen ? n.delete(item.id) : n.add(item.id); return n; })}
                                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                                        style={{ background: `${agentInfo.color}18`, color: agentInfo.color }}>
                                        {notesOpen ? "▲ fechar" : "▼ ver resposta"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {item.responsible === "agency" && item.status !== "completed" && !isAnswering && (
                                  <button
                                    onClick={() => answerOnboardItem(item)}
                                    disabled={!!answeringOnboard}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex-shrink-0 disabled:opacity-40 transition-all"
                                    style={{ background: "rgba(185,255,75,0.1)", color: "#3a6e00", border: "1px solid rgba(185,255,75,0.3)" }}>
                                    <Zap className="w-3 h-3" /> Responder
                                  </button>
                                )}
                                <button onClick={() => deleteOnboardItem(item.id)} className="p-1.5 rounded-lg flex-shrink-0" style={{ color: "#ccc" }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {hasNotes && notesOpen && (
                                <div className="mx-5 mb-3 rounded-xl p-3 text-xs leading-relaxed whitespace-pre-wrap"
                                  style={{ background: `${agentInfo.color}08`, border: `1px solid ${agentInfo.color}20`, color: "#444" }}>
                                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: agentInfo.color }}>
                                    {agentInfo.name} respondeu
                                  </span>
                                  {item.notes}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── ENTREGAS ── */}
                  <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#111" }}>O que fizemos por você</p>
                        <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                          {deliverables.length} entrega{deliverables.length !== 1 ? "s" : ""} · {visibleDelivs.length} visível{visibleDelivs.length !== 1 ? "s" : ""} ao cliente
                        </p>
                      </div>
                      <button onClick={() => setShowDelivForm(s => !s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: showDelivForm ? "#111" : "rgba(0,0,0,0.06)", color: showDelivForm ? "#B9FF4B" : "#555" }}>
                        + Registrar
                      </button>
                    </div>
                    {showDelivForm && (
                      <div className="px-5 py-4 space-y-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF8" }}>
                        {/* Category chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {DELIV_PRESETS.map((p) => (
                            <button key={p.category}
                              onClick={() => setDelivForm((f) => ({ ...f, category: p.category }))}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                              style={delivForm.category === p.category
                                ? { background: "rgba(0,0,0,0.1)", color: "#111", border: "1px solid rgba(0,0,0,0.2)" }
                                : { background: "rgba(0,0,0,0.04)", color: "#888", border: "1px solid rgba(0,0,0,0.08)" }}>
                              {p.label}
                            </button>
                          ))}
                        </div>
                        {/* Title */}
                        <input value={delivForm.title} onChange={(e) => setDelivForm((f) => ({ ...f, title: e.target.value }))}
                          placeholder="Título (ex: 12 posts de feed — setembro)…"
                          className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#111" }} />
                        {/* Description */}
                        <textarea value={delivForm.description} onChange={(e) => setDelivForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Descrição / detalhes (opcional)…" rows={2}
                          className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#555" }} />
                        {/* Date + Status + Visibility + Save */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <input type="date" value={delivForm.done_at} onChange={(e) => setDelivForm((f) => ({ ...f, done_at: e.target.value }))}
                            className="rounded-xl px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#555" }} />
                          {/* Status toggle */}
                          <button onClick={() => setDelivForm((f) => ({ ...f, status: f.status === "completed" ? "in_progress" : "completed" }))}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0"
                            style={delivForm.status === "completed"
                              ? { background: "rgba(52,211,153,0.1)", color: "#059669", border: "1px solid rgba(52,211,153,0.2)" }
                              : { background: "rgba(251,191,36,0.1)", color: "#d97706", border: "1px solid rgba(251,191,36,0.2)" }}>
                            {delivForm.status === "completed" ? "✅ Concluído" : "⏳ Em andamento"}
                          </button>
                          {/* Visibility toggle */}
                          <button onClick={() => setDelivForm((f) => ({ ...f, visible_to_client: !f.visible_to_client }))}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0"
                            style={delivForm.visible_to_client
                              ? { background: "rgba(91,173,47,0.1)", color: "#5BAD2F", border: "1px solid rgba(91,173,47,0.2)" }
                              : { background: "rgba(0,0,0,0.04)", color: "#aaa", border: "1px solid rgba(0,0,0,0.08)" }}>
                            <Eye className="w-3.5 h-3.5" />{delivForm.visible_to_client ? "Visível" : "Oculto"}
                          </button>
                          <button onClick={() => saveDeliverable(delivForm.category, delivForm.title, delivForm.description, delivForm.done_at, delivForm.visible_to_client, delivForm.status)}
                            disabled={savingDeliv || !delivForm.title.trim()}
                            className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 flex-shrink-0"
                            style={{ background: "#111", color: "#B9FF4B" }}>
                            {savingDeliv ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
                          </button>
                        </div>
                      </div>
                    )}
                    {deliverables.length === 0 ? (
                      <div className="px-5 py-8 flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-7 h-7" style={{ color: "#ddd" }} />
                        <p className="text-sm" style={{ color: "#bbb" }}>Nenhuma entrega registrada ainda</p>
                      </div>
                    ) : (
                      <div>
                        {deliverables.map((d) => {
                          const isCompleted = !d.status || d.status === "completed";
                          return (
                            <div key={d.id} className="flex items-start gap-3 px-5 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: isCompleted ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)" }}>
                                {isCompleted
                                  ? <CheckCircle2 className="w-4 h-4" style={{ color: "#059669" }} />
                                  : <Clock className="w-4 h-4" style={{ color: "#d97706" }} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium" style={{ color: d.visible_to_client ? "#111" : "#aaa" }}>
                                    {d.title || d.description}
                                  </p>
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                    style={isCompleted
                                      ? { background: "rgba(52,211,153,0.1)", color: "#059669" }
                                      : { background: "rgba(251,191,36,0.1)", color: "#d97706" }}>
                                    {isCompleted ? "Concluído" : "Em andamento"}
                                  </span>
                                </div>
                                {d.title && d.description && (
                                  <p className="text-xs mt-0.5" style={{ color: "#888" }}>{d.description}</p>
                                )}
                                <p className="text-xs mt-0.5" style={{ color: "#bbb" }}>
                                  {new Date(d.done_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                                </p>
                              </div>
                              <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                                <button onClick={() => toggleDelivVisible(d.id, d.visible_to_client)}
                                  title={d.visible_to_client ? "Visível ao cliente" : "Oculto do cliente"}
                                  className="p-1.5 rounded-lg" style={{ color: d.visible_to_client ? "#5BAD2F" : "#ccc" }}>
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteDeliv(d.id)} className="p-1.5 rounded-lg" style={{ color: "#ccc" }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── PROPOSTAS & AGENTES ── */}
                  <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#111" }}>Propostas & Agentes</p>
                        <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                          {agentProposals.filter(p => p.status === "pending").length} aguardando aprovação
                        </p>
                      </div>
                      <button onClick={() => setShowAgentForm(s => !s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: showAgentForm ? "#111" : "rgba(0,0,0,0.06)", color: showAgentForm ? "#B9FF4B" : "#555" }}>
                        ⚡ Iniciar agente
                      </button>
                    </div>
                    {showAgentForm && (
                      <div className="px-5 py-4 space-y-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF8" }}>
                        <div className="flex flex-wrap gap-1.5">
                          {AGENTS.map((a) => (
                            <button key={a.id} onClick={() => setAgentForm(f => ({ ...f, agent_id: a.id, agent_name: a.name, agent_color: a.color }))}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                              style={agentForm.agent_id === a.id
                                ? { background: `${a.color}18`, color: a.color, border: `1px solid ${a.color}35` }
                                : { background: "rgba(0,0,0,0.04)", color: "#888", border: "1px solid rgba(0,0,0,0.08)" }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.color, display: "inline-block", flexShrink: 0 }} />
                              {a.name}
                            </button>
                          ))}
                        </div>
                        <input value={agentForm.titulo} onChange={(e) => setAgentForm(f => ({ ...f, titulo: e.target.value }))}
                          placeholder="Título da proposta…"
                          className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#111" }} />
                        <div className="flex gap-2">
                          <textarea value={agentForm.descricao} onChange={(e) => setAgentForm(f => ({ ...f, descricao: e.target.value }))}
                            placeholder="Descrição (opcional)…" rows={2}
                            className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#555" }} />
                          <button onClick={saveAgentProposal} disabled={savingAgent || !agentForm.titulo.trim()}
                            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 self-end flex-shrink-0"
                            style={{ background: "#111", color: "#B9FF4B" }}>
                            {savingAgent ? <Loader2 className="w-3 h-3 animate-spin" /> : "Criar"}
                          </button>
                        </div>
                      </div>
                    )}
                    {agentProposals.length === 0 ? (
                      <div className="px-5 py-8 flex flex-col items-center gap-2">
                        <p className="text-sm" style={{ color: "#bbb" }}>Nenhuma proposta ainda</p>
                      </div>
                    ) : (
                      <div>
                        {agentProposals.map((p) => {
                          const st = PROP_STATUS[p.status] ?? PROP_STATUS.pending;
                          return (
                            <div key={p.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium" style={{ color: "#111" }}>{p.titulo}</p>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                                    style={{ background: st.bg, color: st.color }}>{st.label}</span>
                                </div>
                                <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                                  {p.agent_name}{p.descricao ? ` · ${p.descricao}` : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── DEMANDAS ── */}
                  <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "#111" }}>📋 Demandas & Pendências</p>
                        <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                          {portalDemands.filter(d => d.status !== "completed").length} pendente{portalDemands.filter(d => d.status !== "completed").length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={generateDemandsWithAI} disabled={generatingDemands || !clientBriefing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                          style={{ background: "rgba(185,255,75,0.12)", color: "#5BAD2F", border: "1px solid rgba(91,173,47,0.25)" }}>
                          {generatingDemands ? <Loader2 className="w-3 h-3 animate-spin" /> : "✨"} Gerar com IA
                        </button>
                        <button onClick={() => setShowDemandFormPortal(s => !s)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                          style={{ background: showDemandFormPortal ? "#111" : "rgba(0,0,0,0.06)", color: showDemandFormPortal ? "#B9FF4B" : "#555" }}>
                          + Nova demanda
                        </button>
                      </div>
                    </div>
                    {showDemandFormPortal && (
                      <div className="px-5 py-4 space-y-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF8" }}>
                        <input value={demandForm.title} onChange={(e) => setDemandForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="Título da demanda (ex: Aprovar artes de outubro)…"
                          className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#111" }} />
                        <textarea value={demandForm.description} onChange={(e) => setDemandForm(f => ({ ...f, description: e.target.value }))}
                          placeholder="Descrição (opcional)…" rows={2}
                          className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                          style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#555" }} />
                        <div className="flex gap-2 flex-wrap">
                          <select value={demandForm.responsible} onChange={(e) => setDemandForm(f => ({ ...f, responsible: e.target.value as any }))}
                            className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#555", minWidth: 140 }}>
                            <option value="agency">Responsável: Agência</option>
                            <option value="client">Responsável: Cliente</option>
                          </select>
                          <select value={demandForm.priority} onChange={(e) => setDemandForm(f => ({ ...f, priority: e.target.value as any }))}
                            className="rounded-xl px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#555" }}>
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                          </select>
                          <select value={demandForm.agent} onChange={(e) => setDemandForm(f => ({ ...f, agent: e.target.value }))}
                            className="rounded-xl px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#555" }}>
                            {WS_AGENTS.map(ag => <option key={ag.id} value={ag.id}>{ag.name}</option>)}
                          </select>
                          <input type="date" value={demandForm.due_date} onChange={(e) => setDemandForm(f => ({ ...f, due_date: e.target.value }))}
                            className="rounded-xl px-3 py-2 text-xs focus:outline-none"
                            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.14)", color: "#555" }} />
                          <button onClick={saveDemandItem} disabled={savingDemand || !demandForm.title.trim() || !portalClientUUID}
                            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 flex-shrink-0"
                            style={{ background: "#111", color: "#B9FF4B" }}>
                            {savingDemand ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
                          </button>
                        </div>
                      </div>
                    )}
                    {!portalClientUUID ? (
                      <div className="px-5 py-6 text-center"><p className="text-sm" style={{ color: "#bbb" }}>Abra o portal uma vez para ativar</p></div>
                    ) : portalDemands.length === 0 ? (
                      <div className="px-5 py-6 text-center"><p className="text-sm" style={{ color: "#bbb" }}>Nenhuma demanda ainda</p></div>
                    ) : (
                      <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                        {portalDemands.map((d) => {
                          const isExp = expandedWorkspaceDemand === d.id;
                          const acts = demandActivities[d.id] ?? [];
                          const agts: any[] = Array.isArray(d.agents) ? d.agents : [];
                          return (
                            <div key={d.id}>
                              {/* Row */}
                              <div className="flex items-start gap-3 px-5 py-3">
                                {/* Status badge — click to cycle */}
                                {(() => {
                                  const st = DEMAND_STATUS_LABEL[d.status] ?? DEMAND_STATUS_LABEL.pending;
                                  return (
                                    <button onClick={() => cycleDemandStatus(d.id, d.status)}
                                      className="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 whitespace-nowrap transition-all"
                                      style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}30` }}
                                      title="Clique para avançar o status">
                                      {st.label}
                                    </button>
                                  );
                                })()}
                                <div className="flex-1 min-w-0">
                                  {/* Title — click to edit */}
                                  {editingDemand?.id === d.id && editingDemand.field === "title" ? (
                                    <input
                                      autoFocus
                                      value={editingDemand.value}
                                      onChange={(e) => setEditingDemand(ed => ed ? { ...ed, value: e.target.value } : ed)}
                                      onBlur={saveEditDemand}
                                      onKeyDown={(e) => { if (e.key === "Enter") saveEditDemand(); if (e.key === "Escape") setEditingDemand(null); }}
                                      className="w-full rounded-lg px-2 py-0.5 text-sm focus:outline-none"
                                      style={{ background: "#fff", border: "1px solid rgba(91,173,47,0.4)", color: "#111" }}
                                    />
                                  ) : (
                                    <p className="text-sm cursor-pointer hover:text-[#5BAD2F] transition-colors"
                                      style={{ color: d.status === "completed" ? "#aaa" : "#111", textDecoration: d.status === "completed" ? "line-through" : "none" }}
                                      onClick={() => setEditingDemand({ id: d.id, field: "title", value: d.title })}>
                                      {d.title}
                                    </p>
                                  )}
                                  {/* Description — show/click to edit */}
                                  {editingDemand?.id === d.id && editingDemand.field === "description" ? (
                                    <textarea
                                      autoFocus
                                      value={editingDemand.value}
                                      onChange={(e) => setEditingDemand(ed => ed ? { ...ed, value: e.target.value } : ed)}
                                      onBlur={saveEditDemand}
                                      onKeyDown={(e) => { if (e.key === "Escape") setEditingDemand(null); }}
                                      rows={2}
                                      className="w-full rounded-lg px-2 py-1 text-xs focus:outline-none resize-none mt-0.5"
                                      style={{ background: "#fff", border: "1px solid rgba(91,173,47,0.4)", color: "#555" }}
                                    />
                                  ) : (
                                    <p className="text-xs mt-0.5 cursor-pointer"
                                      style={{ color: d.description ? "#888" : "#ccc" }}
                                      onClick={() => setEditingDemand({ id: d.id, field: "description", value: d.description ?? "" })}>
                                      {d.description || "Adicionar descrição…"}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {d.due_date && (() => {
                                      const daysLeft = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / 86400000);
                                      return (
                                        <span className="text-[10px] font-semibold"
                                          style={{ color: daysLeft < 0 ? "#EF4444" : daysLeft <= 2 ? "#F97316" : "#888" }}>
                                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d atrasado` : daysLeft === 0 ? "Hoje" : `${daysLeft}d`}
                                        </span>
                                      );
                                    })()}
                                    <span className="text-xs" style={{ color: "#bbb" }}>{d.priority === "high" ? "Alta" : d.priority === "medium" ? "Média" : "Baixa"}</span>
                                    {agts.slice(0, 4).map((ag: any) => (
                                      <div key={ag.id} title={ag.name}
                                        className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
                                        style={{ background: `${ag.color}20`, border: `1px solid ${ag.color}50`, color: ag.color }}>
                                        {ag.name[0]}
                                      </div>
                                    ))}
                                    {acts.length > 0 && <span className="text-[10px]" style={{ color: "#bbb" }}>· {acts.length} atualiz.</span>}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const next = isExp ? null : d.id;
                                    setExpandedWorkspaceDemand(next);
                                    if (next) loadDemandActivities(next);
                                  }}
                                  className="p-1.5 rounded-lg flex-shrink-0 mt-0.5 transition-colors"
                                  style={{ color: isExp ? "#5BAD2F" : "#ccc" }}
                                  title="Expandir detalhes">
                                  <ChevronDown className="w-3.5 h-3.5" style={{ transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                                </button>
                                <button onClick={() => deleteDemandItem(d.id)} className="p-1.5 rounded-lg flex-shrink-0 mt-0.5" style={{ color: "#ccc" }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Expanded panel */}
                              {isExp && (
                                <div className="px-5 pb-4 space-y-3" style={{ background: "#FAFAF8", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                                  {/* Due date */}
                                  <div className="pt-3 flex items-center gap-3">
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "#aaa" }}>Data de entrega</p>
                                      <input
                                        type="date"
                                        value={d.due_date ? new Date(d.due_date).toISOString().split("T")[0] : ""}
                                        onChange={(e) => updateDemandDueDate(d.id, e.target.value)}
                                        className="rounded-xl px-3 py-2 text-xs focus:outline-none"
                                        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.12)", color: "#111" }}
                                      />
                                    </div>
                                    {d.due_date && (() => {
                                      const daysLeft = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / 86400000);
                                      return (
                                        <span className="text-[11px] font-semibold mt-4"
                                          style={{ color: daysLeft < 0 ? "#EF4444" : daysLeft <= 2 ? "#F97316" : "#34D399" }}>
                                          {daysLeft < 0 ? `${Math.abs(daysLeft)}d atrasado` : daysLeft === 0 ? "Entrega hoje" : `${daysLeft}d restantes`}
                                        </span>
                                      );
                                    })()}
                                  </div>

                                  {/* Agents */}
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "#aaa" }}>Agentes responsáveis</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {WS_AGENTS.map((ag) => {
                                        const active = agts.some((a: any) => a.id === ag.id);
                                        return (
                                          <button key={ag.id} onClick={() => assignAgentToDemand(d, ag)}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all"
                                            style={{ background: active ? `${ag.color}15` : "rgba(0,0,0,0.04)", color: active ? ag.color : "#888", border: `1px solid ${active ? `${ag.color}35` : "rgba(0,0,0,0.08)"}` }}>
                                            <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
                                              style={{ background: active ? `${ag.color}25` : "rgba(0,0,0,0.08)", color: active ? ag.color : "#aaa" }}>{ag.name[0]}</div>
                                            {ag.name}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Activities */}
                                  {acts.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#aaa" }}>Atualizações visíveis ao cliente</p>
                                      {acts.map((act: any) => (
                                        <div key={act.id} className="flex gap-2">
                                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5"
                                            style={{ background: `${act.agent_color}20`, border: `1px solid ${act.agent_color}40`, color: act.agent_color }}>
                                            {act.agent_name[0]}
                                          </div>
                                          <div>
                                            <span className="text-[11px] font-semibold" style={{ color: "#333" }}>{act.agent_name} </span>
                                            <span className="text-xs" style={{ color: "#666" }}>{act.content}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Add activity */}
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "#aaa" }}>Registrar atualização</p>
                                    <div className="flex gap-2">
                                      <input
                                        value={activityInputs[d.id] ?? ""}
                                        onChange={(e) => setActivityInputs(p => ({ ...p, [d.id]: e.target.value }))}
                                        onKeyDown={(e) => { if (e.key === "Enter") addDemandActivity(d.id, agts[0]?.name ?? "Agência", agts[0]?.color ?? "#B9FF4B"); }}
                                        placeholder="O que está sendo feito nessa demanda?"
                                        className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none"
                                        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.12)", color: "#111" }} />
                                      <select
                                        id={`agent-sel-${d.id}`}
                                        className="rounded-xl px-2 py-2 text-xs focus:outline-none"
                                        style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.12)", color: "#555" }}>
                                        {WS_AGENTS.map(ag => <option key={ag.id} value={`${ag.name}|${ag.color}`}>{ag.name}</option>)}
                                      </select>
                                      <button
                                        disabled={savingActivity === d.id || !(activityInputs[d.id] ?? "").trim()}
                                        onClick={() => {
                                          const sel = (document.getElementById(`agent-sel-${d.id}`) as HTMLSelectElement)?.value ?? "";
                                          const [aName, aColor] = sel.split("|");
                                          addDemandActivity(d.id, aName || "Agência", aColor || "#B9FF4B");
                                        }}
                                        className="px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40 transition-all flex-shrink-0"
                                        style={{ background: "#111", color: "#B9FF4B" }}>
                                        {savingActivity === d.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Salvar"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>



              </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════════
                SITES
            ══════════════════════════════════════════════════════ */}
            {activeTab === "sites" && (
              <div className="h-[calc(100vh-12rem)]">
                <PixelSitePanel clientName={client.name} />
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                SITE — TEO
            ══════════════════════════════════════════════════════ */}
            {activeTab === "teo" && (
              <div className="flex flex-col gap-4 overflow-y-auto" style={{ height: "calc(100vh - 8rem)" }}>
                {client.siteRepo ? (
                  <div style={{ height: "60vh", flexShrink: 0 }}>
                    <SiteEditorPanel
                      clientId={client.id}
                      siteUrl={client.siteUrl ?? ""}
                      siteRepo={client.siteRepo}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-6 py-12 flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(185,255,75,0.08)", border: "1px solid rgba(185,255,75,0.2)" }}>
                      <Code2 className="w-8 h-8" style={{ color: "#B9FF4B" }} />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                        Repositório GitHub não configurado
                      </p>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Edite o cliente e informe o repositório no formato{" "}
                        <span className="font-mono">usuario/repositorio</span>
                      </p>
                    </div>
                    <button
                      onClick={openEditClient}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: "rgba(185,255,75,0.12)", border: "1px solid rgba(185,255,75,0.25)", color: "#B9FF4B" }}>
                      Configurar repositório
                    </button>
                  </div>
                )}

                {/* ── WordPress do cliente ── */}
                <div className="rounded-2xl p-5 space-y-4 flex-shrink-0" style={{ background: "rgba(185,255,75,0.03)", border: "1px solid rgba(185,255,75,0.1)" }}>
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4" style={{ color: "#B9FF4B" }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>WordPress do cliente</p>
                      <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Credenciais para o Tomás publicar landing pages no site do cliente</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "URL do site", key: "wp_url", ph: "https://clientesite.com.br", type: "url" },
                      { label: "Usuário WP",  key: "wp_user", ph: "admin", type: "text" },
                      { label: "Senha de Aplicação", key: "wp_password", ph: "xxxx xxxx xxxx xxxx", type: "password" },
                    ].map((f) => (
                      <div key={f.key} className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>{f.label}</label>
                        <input
                          type={f.type as any}
                          value={(clientWpCreds as any)[f.key]}
                          onChange={(e) => setClientWpCreds(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.ph}
                          className="rounded-xl px-3 py-2 text-xs outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F0F0" }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={saveClientWpCreds}
                      disabled={clientWpCredsSaving || !clientWpCreds.wp_url.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-40"
                      style={{ background: "rgba(185,255,75,0.15)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.3)" }}>
                      {clientWpCredsSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Salvar credenciais
                    </button>
                    {clientWpCreds.wp_url && (
                      <button
                        onClick={() => window.open(`/tomas?clientId=${id}&clientName=${encodeURIComponent(client.name)}`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        🖥️ Abrir Tomás
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                REDES SOCIAIS
            ══════════════════════════════════════════════════════ */}
            {activeTab === "social" && (
              <SocialMediaTab clientId={client.id} clientName={client.name} clientColor={client.color} />
            )}

            {/* ══════════════════════════════════════════════════════
                CALENDÁRIO EDITORIAL (sidebar)
            ══════════════════════════════════════════════════════ */}
            {activeTab === "calendario" && id && (
              <EditorialCalendarPanel
                clientId={id}
                clientName={client.name}
                clientSegment={(client as any).segment}
                accentColor={client.color}
              />
            )}

            {/* ══════════════════════════════════════════════════════
                WEBHOOKS
            ══════════════════════════════════════════════════════ */}
            {activeTab === "webhooks" && (
              <WebhooksTab clientId={client.id} />
            )}

            {/* ══════════════════════════════════════════════════════
                TIME DO CLIENTE
            ══════════════════════════════════════════════════════ */}
            {activeTab === "time" && (
              <TeamMembersPanel clientId={client.id} />
            )}

            {/* ══════════════════════════════════════════════════════
                INTEGRAÇÕES
            ══════════════════════════════════════════════════════ */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>Integrações</h2>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Conecte as redes sociais e plataformas deste cliente</p>
                </div>

                {/* Social media cards */}
                <div className="grid grid-cols-3 gap-4">
                  {INTEGRATIONS_BASE.filter((i) => i.id !== "whatsapp").map((integ) => {
                    const isConn = socialConnected[integ.id] ?? false;
                    return (
                      <motion.div key={integ.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl p-5"
                        style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${isConn ? integ.border : "rgba(255,255,255,0.07)"}` }}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ background: integ.bg, border: `1px solid ${integ.border}` }}>
                              <integ.Icon className="w-5 h-5" style={{ color: integ.color }} />
                            </div>
                            <div>
                              <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{integ.name}</div>
                              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{integ.description}</div>
                            </div>
                          </div>
                          {isConn && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ background: `${integ.color}18`, color: integ.color }}>
                              <CheckCircle2 className="w-3 h-3" /> Ativo
                            </span>
                          )}
                        </div>
                        <div className="mb-3 space-y-1.5">
                          {integ.features.slice(0, 3).map((f) => (
                            <div key={f} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: isConn ? "#34D399" : "rgba(255,255,255,0.15)" }} />
                              <span className="text-[10px]" style={{ color: isConn ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}>{f}</span>
                            </div>
                          ))}
                        </div>
                        {isConn ? (
                          <div className="flex gap-2">
                            <button onClick={() => openSocialConfig(integ.id)}
                              className="flex-1 py-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1 transition-all"
                              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                              <Settings2 className="w-3 h-3" /> Gerenciar
                            </button>
                            <button onClick={() => handleSocialToggle(integ.id, false)}
                              className="py-2 px-3 rounded-xl text-[11px] font-medium transition-all"
                              style={{ background: "rgba(239,68,68,0.08)", color: "#F87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => openSocialConfig(integ.id)}
                            className="w-full py-2 rounded-xl text-[11px] font-medium transition-all"
                            style={{ background: integ.bg, color: integ.color, border: `1px solid ${integ.border}` }}>
                            Conectar
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* ── Card de Site / Teo ─────────────────────────────── */}
                {client.siteRepo && (() => {
                  const siteConnected = !!client.siteRepo;
                  return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl overflow-hidden"
                      style={{ border: siteConnected ? "1px solid rgba(6,182,212,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>

                      {/* Header */}
                      <div className="flex items-center justify-between px-6 py-4"
                        style={{ background: "rgba(6,182,212,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}>
                            <Globe className="w-5 h-5" style={{ color: "#06B6D4" }} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold flex items-center gap-2" style={{ color: "rgba(255,255,255,0.9)" }}>
                              Site
                              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded"
                                style={{ background: "rgba(6,182,212,0.12)", color: "#06B6D4" }}>
                                via Teo · Lovable
                              </span>
                            </div>
                            <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                              {client.siteUrl ?? client.siteRepo} · edição e deploy automático
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#06B6D4" }} />
                              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#06B6D4" }} />
                            </span>
                            <span className="text-xs font-medium" style={{ color: "#06B6D4" }}>Conectado</span>
                          </div>
                          <a href={client.siteUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                            style={{ background: "rgba(6,182,212,0.1)", color: "#06B6D4", border: "1px solid rgba(6,182,212,0.2)" }}>
                            <ExternalLink className="w-3 h-3" /> Ver site
                          </a>
                        </div>
                      </div>

                      {/* Teo editor expandido */}
                      <div style={{ height: "600px" }}>
                        <SiteEditorPanel
                          clientId={client.id}
                          siteUrl={client.siteUrl ?? ""}
                          siteRepo={client.siteRepo}
                        />
                      </div>
                    </motion.div>
                  );
                })()}

                {/* ── WhatsApp Z-API Panel ────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ border: wpStatus === "connected" ? "1px solid rgba(37,211,102,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>

                  {/* Panel header */}
                  <div className="flex items-center justify-between px-6 py-4"
                    style={{ background: "rgba(37,211,102,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)" }}>
                        <MessageCircle className="w-5 h-5" style={{ color: "#25D366" }} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>WhatsApp Business <span className="text-[10px] font-normal ml-1 px-1.5 py-0.5 rounded" style={{ background: "rgba(37,211,102,0.12)", color: "#25D366" }}>via Z-API</span></div>
                        <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {wpStatus === "connected" && wpPhone ? `Conectado: ${wpPhone}` : "Disparos em grupo, chatbot de vendas (Eduardo)"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {wpStatus === "connected" && (
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                          </span>
                          <span className="text-xs font-medium" style={{ color: "#34D399" }}>Conectado</span>
                        </div>
                      )}
                      {wpStatus === "disconnected" && (
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Desconectado</span>
                      )}
                      <button
                        onClick={checkWpStatus}
                        disabled={wpStatus === "loading"}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50"
                        style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                        {wpStatus === "loading" ? (
                          <><RefreshCw className="w-3 h-3 animate-spin" /> Verificando…</>
                        ) : (
                          <><Wifi className="w-3 h-3" /> Verificar conexão</>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Disconnected: show QR code flow */}
                    {(wpStatus === "disconnected" || wpStatus === "idle") && (
                      <div className="flex items-start gap-6">
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Como conectar</h3>
                          <ol className="space-y-2">
                            {["1. Clique em Verificar conexão para checar o status atual", "2. Se desconectado, clique em Gerar QR Code abaixo", "3. Abra WhatsApp → Dispositivos conectados → Conectar dispositivo", "4. Escaneie o QR Code com o celular do cliente"].map((step, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                                  style={{ background: "rgba(37,211,102,0.12)", color: "#25D366" }}>{i + 1}</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-center gap-3">
                          <button onClick={fetchWpQr}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                            style={{ background: "rgba(37,211,102,0.1)", color: "#25D366", border: "1px solid rgba(37,211,102,0.2)" }}>
                            <QrCode className="w-3.5 h-3.5" /> Gerar QR Code
                          </button>
                          {wpQr && (
                            <div className="p-3 rounded-xl" style={{ background: "white" }}>
                              <img src={wpQr} alt="QR Code WhatsApp" className="w-40 h-40 object-contain" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Connected: show groups + blast */}
                    {wpStatus === "connected" && (
                      <div className="space-y-5">

                        {/* Tabs Grupos / Contatos */}
                        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {(["grupos", "contatos"] as const).map((tab) => (
                            <button key={tab} onClick={() => setWpTargetTab(tab)}
                              className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-all"
                              style={wpTargetTab === tab
                                ? { background: "#25D366", color: "#fff" }
                                : { color: "rgba(255,255,255,0.35)" }}>
                              {tab === "grupos" ? `📢 Grupos (${wpSelectedGroups.length} sel.)` : `👤 Contatos (${wpSelectedContacts.length} sel.)`}
                            </button>
                          ))}
                        </div>

                        {/* Lista de Grupos */}
                        {wpTargetTab === "grupos" && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                                Grupos ({wpGroups.length})
                              </h3>
                              <div className="flex items-center gap-1.5">
                                {wpGroups.length > 0 && (
                                  <button
                                    onClick={() => {
                                      const allIds = wpGroups.map(g => g.id);
                                      const allSelected = allIds.every(id => wpSelectedGroups.includes(id));
                                      setWpSelectedGroups(allSelected ? [] : allIds);
                                    }}
                                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all"
                                    style={{
                                      color: wpGroups.every(g => wpSelectedGroups.includes(g.id)) ? "#25D366" : "rgba(255,255,255,0.4)",
                                      background: wpGroups.every(g => wpSelectedGroups.includes(g.id)) ? "rgba(37,211,102,0.1)" : "rgba(255,255,255,0.04)",
                                      border: `1px solid ${wpGroups.every(g => wpSelectedGroups.includes(g.id)) ? "rgba(37,211,102,0.3)" : "rgba(255,255,255,0.08)"}`,
                                    }}>
                                    {wpGroups.every(g => wpSelectedGroups.includes(g.id)) ? "✓ Todos" : "Selecionar todos"}
                                  </button>
                                )}
                                <button onClick={refreshWpGroups} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all"
                                  style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                  <RefreshCw className="w-3 h-3" /> Atualizar
                                </button>
                              </div>
                            </div>
                            {wpGroups.length === 0
                              ? <div className="py-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhum grupo. Clique em Atualizar.</div>
                              : (
                              <div className="grid grid-cols-2 gap-2">
                                  {wpGroups.map((g) => {
                                    const sel = wpSelectedGroups.includes(g.id);
                                    const fav2 = wpFavoriteGroupIds.includes(g.id);
                                    return (
                                      <div key={g.id} className="relative">
                                        <button
                                          onClick={() => toggleGroup(g.id)}
                                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all pr-8"
                                          style={{ background: sel ? "rgba(37,211,102,0.1)" : "rgba(255,255,255,0.03)", border: sel ? "1px solid rgba(37,211,102,0.3)" : "1px solid rgba(255,255,255,0.07)" }}
                                        >
                                          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: sel ? "#25D366" : "rgba(255,255,255,0.08)" }}>
                                            {sel && <CheckCircle2 className="w-3 h-3 text-white" />}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="text-[11px] font-medium truncate" style={{ color: sel ? "#25D366" : "rgba(255,255,255,0.65)" }}>{g.name}</div>
                                            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{g.participants} membros</div>
                                          </div>
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavoriteGroup(g.id);
                                          }}
                                          className="absolute right-2 top-1/2 -translate-y-1/2 text-base leading-none"
                                          style={{ color: fav2 ? "#FBBF24" : "rgba(255,255,255,0.18)" }}
                                        >
                                          ★
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                            )
                            }
                            {wpFavoriteGroupIds.length > 0 && (
                              <p className="text-[10px] mt-2" style={{ color: "rgba(251,191,36,0.6)" }}>
                                ★ {wpFavoriteGroupIds.length} grupo{wpFavoriteGroupIds.length !== 1 ? "s" : ""} favoritado{wpFavoriteGroupIds.length !== 1 ? "s" : ""} para o agente
                              </p>
                            )}
                          </div>
                        )}

                                                {/* Contatos individuais do cliente */}
                        {wpTargetTab === "contatos" && (
                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Contatos do cliente</h3>
                            {(!client.contacts || client.contacts.length === 0)
                              ? <div className="py-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhum contato cadastrado para este cliente.</div>
                              : <div className="space-y-2">
                                  {client.contacts.map((c: any) => {
                                    const ph = c.phone ?? c.whatsapp ?? "";
                                    if (!ph) return null;
                                    const sel = wpSelectedContacts.includes(ph);
                                    return (
                                      <button key={ph} onClick={() => toggleWpContact(ph)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                                        style={{ background: sel ? "rgba(37,211,102,0.1)" : "rgba(255,255,255,0.03)", border: sel ? "1px solid rgba(37,211,102,0.3)" : "1px solid rgba(255,255,255,0.07)" }}>
                                        <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: sel ? "#25D366" : "rgba(255,255,255,0.08)" }}>
                                          {sel && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="text-[11px] font-medium truncate" style={{ color: sel ? "#25D366" : "rgba(255,255,255,0.65)" }}>{c.name ?? ph}</div>
                                          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{ph}</div>
                                        </div>
                                        {c.role && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B" }}>{c.role}</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                            }
                          </div>
                        )}

                        {/* Tipo de envio */}
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Tipo de envio</h3>
                          <div className="flex gap-2 flex-wrap">
                            {(["text", "image", "video", "audio"] as const).map((t) => {
                              const labels: Record<string, string> = { text: "💬 Texto", image: "🖼️ Imagem", video: "🎥 Vídeo", audio: "🎵 Áudio" };
                              return (
                                <button key={t} onClick={() => { setWpMediaType(t); setWpMediaData(null); setWpMediaName(""); }}
                                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                                  style={wpMediaType === t
                                    ? { background: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.35)" }
                                    : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                  {labels[t]}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Compositor */}
                        <div className="space-y-3">
                          {/* Gerar com IA */}
                          <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(185,255,75,0.04)", border: "1px solid rgba(185,255,75,0.15)" }}>
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="w-3 h-3" style={{ color: "#B9FF4B" }} />
                              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#B9FF4B" }}>Agente escreve a mensagem</span>
                            </div>
                            <div className="flex gap-2">
                              <input
                                value={wpAiPrompt}
                                onChange={e => setWpAiPrompt(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && generateWpMessageWithAI()}
                                placeholder='Ex: "lembrar que a aula começa amanhã às 19h"'
                                className="flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(185,255,75,0.2)", color: "#F0F0F0" }} />
                              <button onClick={generateWpMessageWithAI} disabled={wpAiGenerating || !wpAiPrompt.trim()}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold disabled:opacity-40 whitespace-nowrap"
                                style={{ background: "rgba(185,255,75,0.15)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.3)" }}>
                                {wpAiGenerating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                {wpAiGenerating ? "Gerando…" : "Gerar"}
                              </button>
                            </div>
                          </div>

                          {wpMediaType !== "text" && (
                            <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all"
                              style={{ background: "rgba(255,255,255,0.04)", border: "2px dashed rgba(255,255,255,0.12)" }}>
                              <input type="file" className="hidden"
                                accept={wpMediaType === "image" ? "image/*" : wpMediaType === "video" ? "video/*" : "audio/*"}
                                onChange={handleWpFile} />
                              <span className="text-lg">{wpMediaType === "image" ? "🖼️" : wpMediaType === "video" ? "🎥" : "🎵"}</span>
                              <span className="text-[11px]" style={{ color: wpMediaName ? "#25D366" : "rgba(255,255,255,0.3)" }}>
                                {wpMediaName || "Clique para selecionar arquivo"}
                              </span>
                            </label>
                          )}
                          {(wpMediaType === "image" || wpMediaType === "video") && (
                            <input value={wpCaption} onChange={(e) => setWpCaption(e.target.value)}
                              placeholder="Legenda (opcional)..." className="w-full px-4 py-2.5 rounded-xl text-sm"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", outline: "none" }} />
                          )}
                          <textarea value={wpMessage} onChange={(e) => setWpMessage(e.target.value)}
                            rows={wpMediaType === "text" ? 5 : 2}
                            placeholder={wpMediaType === "text" ? "Digite a mensagem ou gere com IA acima…" : "Texto adicional (opcional)..."}
                            className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", outline: "none" }} />
                        </div>

                        {/* Resumo + Disparar */}
                        <div className="space-y-3">
                          {(wpSelectedGroups.length + wpSelectedContacts.length) > 0 && (
                            <div className="flex flex-wrap gap-3 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                              {wpSelectedGroups.length > 0 && <span>📢 {wpSelectedGroups.length} grupo{wpSelectedGroups.length !== 1 ? "s" : ""}</span>}
                              {wpSelectedContacts.length > 0 && <span>👤 {wpSelectedContacts.length} contato{wpSelectedContacts.length !== 1 ? "s" : ""}</span>}
                              <span>· {wpSelectedGroups.length + wpSelectedContacts.length} destinos total</span>
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <button onClick={doWpBlast}
                              disabled={wpBlasting || (wpSelectedGroups.length + wpSelectedContacts.length) === 0 || (wpMediaType === "text" && !wpMessage.trim()) || (wpMediaType !== "text" && !wpMediaData)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                              style={{ background: "#25D366", color: "#fff", boxShadow: wpBlasting ? "none" : "0 0 20px -4px rgba(37,211,102,0.4)" }}>
                              {wpBlasting
                                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando…</>
                                : <><Send className="w-4 h-4" /> Disparar ({wpSelectedGroups.length + wpSelectedContacts.length})</>}
                            </button>
                            {wpBlastResult && (
                              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                                style={{ background: "rgba(52,211,153,0.1)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
                                <CheckCircle2 className="w-3.5 h-3.5" /> {wpBlastResult}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Agente Autônomo */}
                        <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <button
                            onClick={() => setShowAgentPanel((v) => !v)}
                            className="flex items-center gap-2 w-full text-left"
                          >
                            <Bot className="w-4 h-4" style={{ color: "#B9FF4B" }} />
                            <span className="text-xs font-semibold" style={{ color: "#B9FF4B" }}>Agente Autônomo</span>
                            <span className="text-[10px] ml-1" style={{ color: "rgba(255,255,255,0.3)" }}>— gera e envia sem revisão</span>
                            <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${showAgentPanel ? "rotate-180" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {showAgentPanel && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 space-y-3">
                                  {wpFavoriteGroupIds.length === 0 && (
                                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                                      Favorite grupos com ★ acima para o agente enviar.
                                    </p>
                                  )}
                                  {wpFavoriteGroupIds.length > 0 && (
                                    <p className="text-[10px] font-medium" style={{ color: "#FBBF24" }}>
                                      ★ {wpFavoriteGroupIds.length} grupo{wpFavoriteGroupIds.length !== 1 ? "s" : ""} alvo
                                    </p>
                                  )}
                                  <div className="flex gap-2">
                                    <input
                                      value={agentSendPrompt}
                                      onChange={(e) => setAgentSendPrompt(e.target.value)}
                                      placeholder="Ex: confirmar presença no evento"
                                      className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs focus:outline-none"
                                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(185,255,75,0.2)", color: "#F0F0F0" }}
                                    />
                                    <button
                                      onClick={doAgentBroadcast}
                                      disabled={agentSending || !agentSendPrompt.trim() || wpFavoriteGroupIds.length === 0}
                                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold disabled:opacity-40 whitespace-nowrap"
                                      style={{ background: "rgba(185,255,75,0.15)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.3)" }}
                                    >
                                      {agentSending ? <><RefreshCw className="w-3 h-3 animate-spin" /> Enviando…</> : <><Bot className="w-3 h-3" /> Enviar agora</>}
                                    </button>
                                  </div>
                                  {agentSendResult && (
                                    <div className="rounded-xl p-3 space-y-1" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
                                      <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#34D399" }}>
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Enviado para {agentSendResult.ok}/{agentSendResult.total} grupos
                                      </div>
                                      <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)", whiteSpace: "pre-wrap" }}>
                                        {agentSendResult.message}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}


                    {/* Note about Z-API credentials */}
                    {wpStatus === "idle" && (
                      <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
                        style={{ background: "rgba(185,255,75,0.04)", border: "1px solid rgba(185,255,75,0.1)" }}>
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                          Configure os secrets <code className="font-mono text-[10px] px-1 py-0.5 rounded" style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B" }}>ZAPI_INSTANCE_ID</code> e <code className="font-mono text-[10px] px-1 py-0.5 rounded" style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B" }}>ZAPI_TOKEN</code> no Supabase para ativar o WhatsApp. Clique em "Verificar conexão" após configurar.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* ── Todas as plataformas ─────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Todas as plataformas</h3>
                      <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {CONNECTOR_DEFS.filter(c => socialConnected[c.name]).length} conectadas · {CONNECTOR_DEFS.length} disponíveis
                      </p>
                    </div>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }} />
                      <input
                        value={connectorSearch}
                        onChange={e => setConnectorSearch(e.target.value)}
                        placeholder="Buscar..."
                        className="pl-9 pr-3 py-1.5 rounded-xl text-xs focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", width: 180 }}
                      />
                    </div>
                  </div>

                  {/* Category filters */}
                  <div className="flex gap-1.5 flex-wrap mb-4">
                    {CONNECTOR_CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => setConnectorCategory(cat)}
                        className="px-3 py-1 rounded-lg text-[11px] font-medium transition-all"
                        style={connectorCategory === cat
                          ? { background: "#B9FF4B", color: "#07080A" }
                          : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Connector cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {CONNECTOR_DEFS
                      .filter(c =>
                        (connectorCategory === "Todos" || c.category === connectorCategory) &&
                        c.name.toLowerCase().includes(connectorSearch.toLowerCase())
                      )
                      .map(c => {
                        const isConn = socialConnected[c.name] ?? false;
                        return (
                          <motion.div key={c.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -2 }}
                            className="rounded-xl p-4 transition-all"
                            style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${isConn ? "rgba(185,255,75,0.25)" : "rgba(255,255,255,0.07)"}` }}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{c.icon}</span>
                                <div>
                                  <div className="text-[11px] font-semibold leading-tight" style={{ color: "rgba(255,255,255,0.9)" }}>{c.name}</div>
                                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{c.category}</div>
                                </div>
                              </div>
                              {isConn && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                                  style={{ background: "rgba(185,255,75,0.12)", color: "#B9FF4B" }}>
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Ativo
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] mb-3 line-clamp-2" style={{ color: "rgba(255,255,255,0.35)" }}>{c.description}</p>
                            {isConn ? (
                              <div className="flex gap-1.5">
                                <button onClick={() => openSocialConfig(c.name)}
                                  className="flex-1 py-1.5 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-all"
                                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                                  <Settings2 className="w-2.5 h-2.5" /> Config
                                </button>
                                <button onClick={() => handleSocialToggle(c.name, false)}
                                  className="py-1.5 px-2 rounded-lg text-[10px] transition-all"
                                  style={{ background: "rgba(239,68,68,0.08)", color: "#F87171", border: "1px solid rgba(239,68,68,0.15)" }}>
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => (c.configFields.length > 0 ? openSocialConfig(c.name) : handleSocialToggle(c.name, true))}
                                className="w-full py-1.5 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-all"
                                style={{ background: "rgba(185,255,75,0.08)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.15)" }}>
                                <Plus className="w-2.5 h-2.5" /> Conectar
                              </button>
                            )}
                          </motion.div>
                        );
                      })}
                  </div>
                </div>

              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ══ Modal "Ver agente" ══════════════════════════════════ */}
      <AnimatePresence>
        {viewedAgent && (
          <>
            {/* Backdrop */}
            <motion.div
              key="agent-modal-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setViewingAgentId(null)}
              style={{
                position: "fixed", inset: 0, zIndex: 200,
                background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
              }}
            />

            {/* Panel */}
            <motion.div
              key={"agent-modal-" + viewedAgent.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
                position: "fixed", inset: 0, zIndex: 201,
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: "100%", maxWidth: 560, maxHeight: "85vh",
                  background: "#0E0F13", border: `1px solid ${viewedAgent.color}35`,
                  borderRadius: 20, overflow: "hidden", display: "flex",
                  flexDirection: "column", pointerEvents: "auto",
                  boxShadow: `0 32px 80px -12px rgba(0,0,0,0.8), 0 0 60px -20px ${viewedAgent.color}30`,
                }}
              >
                {/* Modal header */}
                <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
                  style={{ borderBottom: `1px solid ${viewedAgent.color}18`, background: `${viewedAgent.color}08` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${viewedAgent.color}20`, border: `1px solid ${viewedAgent.color}40`, color: viewedAgent.color }}>
                    {viewedAgent.initial}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold" style={{ color: "#F0F0F0" }}>{viewedAgent.name}</div>
                    <div className="text-[10px]" style={{ color: viewedAgent.color }}>{viewedAgent.role} · {viewedAgent.skill}</div>
                  </div>
                  {vTask && (
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                      style={{
                        background: vTaskIsWorking ? `${viewedAgent.color}18` : "rgba(52,211,153,0.12)",
                        color: vTaskIsWorking ? viewedAgent.color : "#34D399",
                        border: `1px solid ${vTaskIsWorking ? `${viewedAgent.color}35` : "rgba(52,211,153,0.3)"}`,
                      }}>
                      {vTaskIsWorking ? "● Trabalhando" : "✓ Concluído"}
                    </span>
                  )}
                  <button onClick={() => setViewingAgentId(null)}
                    className="p-1.5 rounded-lg flex-shrink-0 transition-colors"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">

                  {/* Current task */}
                  {effectiveTask && (
                    <div className="rounded-xl p-4"
                      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${vTaskIsWorking ? `${viewedAgent.color}25` : "rgba(255,255,255,0.06)"}` }}>
                      <div className="text-[10px] uppercase tracking-widest font-semibold mb-2"
                        style={{ color: vTaskIsWorking ? viewedAgent.color : "rgba(255,255,255,0.3)" }}>
                        {vTaskIsWorking ? "● Fazendo agora" : "✓ Concluído"}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{effectiveTask.current}</p>
                      {vTaskIsWorking && effectiveTask.progress > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between mb-1.5">
                            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Progresso</span>
                            <div className="flex items-center gap-2">
                              {designerTask && (
                                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                                  ~{Math.max(0, designerTask.estimatedSeconds - Math.floor((Date.now() - designerTask.startedAt) / 1000))}s restantes
                                </span>
                              )}
                              <span className="text-[10px] font-bold" style={{ color: viewedAgent.color }}>{effectiveTask.progress}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                            <motion.div className="h-full rounded-full"
                              style={{ background: viewedAgent.color }}
                              initial={{ width: 0 }} animate={{ width: `${effectiveTask.progress}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent work */}
                  {effectiveTask && effectiveTask.recent.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-semibold mb-2"
                        style={{ color: "rgba(255,255,255,0.3)" }}>Trabalho recente</div>
                      <div className="space-y-1.5">
                        {effectiveTask.recent.map((r, j) => (
                          <div key={j} className="flex items-start gap-2 px-3 py-2 rounded-lg"
                            style={{ background: "rgba(255,255,255,0.03)" }}>
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: `${viewedAgent.color}80` }} />
                            <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teo: site pages */}
                  {vSitePages.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-semibold mb-2"
                        style={{ color: "rgba(255,255,255,0.3)" }}>Páginas do site</div>
                      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                        {vSitePages.map((p, pi) => (
                          <div key={pi} className="flex items-center gap-3 px-4 py-2.5 text-xs"
                            style={{ borderBottom: pi < vSitePages.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: p.status === "editando" ? "rgba(6,182,212,0.04)" : "transparent" }}>
                            <Globe className="w-3 h-3 flex-shrink-0" style={{ color: "#06B6D4" }} />
                            <span className="flex-1 font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{p.page}</span>
                            <span style={{ color: "rgba(255,255,255,0.3)" }}>{p.url}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-2"
                              style={{ background: p.status === "editando" ? "rgba(6,182,212,0.15)" : p.status === "publicado" ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)", color: p.status === "editando" ? "#06B6D4" : p.status === "publicado" ? "#34D399" : "rgba(255,255,255,0.3)" }}>
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vitória: revised files */}
                  {vRevisedFiles.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-semibold mb-2"
                        style={{ color: "rgba(255,255,255,0.3)" }}>Arquivos revisados</div>
                      <div className="space-y-2">
                        {vRevisedFiles.map((file) => (
                          <div key={file.id} className="rounded-xl overflow-hidden"
                            style={{ border: "1px solid rgba(236,72,153,0.2)", background: "rgba(236,72,153,0.04)" }}>
                            <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
                              onClick={() => setExpandedFile(expandedFile === file.id ? null : file.id)}>
                              <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#EC4899" }} />
                              <span className="flex-1 text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{file.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,0.1)", color: "#34D399" }}>{file.fixed} correções</span>
                              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0"
                                style={{ color: "rgba(255,255,255,0.3)", transform: expandedFile === file.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                            </button>
                            {expandedFile === file.id && (
                              <div className="px-4 pb-3 space-y-2">
                                {file.diffs.map((d, di) => (
                                  <div key={di} className="rounded-lg overflow-hidden text-[11px]">
                                    <div className="px-3 py-1.5" style={{ background: "rgba(248,113,113,0.08)", color: "#F87171" }}>− {d.before}</div>
                                    <div className="px-3 py-1.5" style={{ background: "rgba(52,211,153,0.08)", color: "#34D399" }}>+ {d.after}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Designer generated images */}
                  {viewedAgent.id === "designer" && generatedImages.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-[10px] uppercase tracking-widest font-semibold"
                          style={{ color: "rgba(255,255,255,0.3)" }}>Peças geradas</div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: `${viewedAgent.color}15`, color: viewedAgent.color }}>
                          {generatedImages.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {generatedImages.map((img) => (
                          <div key={img.id} className="rounded-xl overflow-hidden"
                            style={{ border: `1px solid ${viewedAgent.color}25`, background: "rgba(255,255,255,0.02)" }}>
                            <img
                              src={img.imageData}
                              alt={img.prompt}
                              className="w-full object-cover rounded-t-xl"
                              style={{ maxHeight: 280 }}
                            />
                            <div className="px-3 py-2 flex items-center justify-between gap-2">
                              <p className="text-[10px] truncate flex-1" style={{ color: "rgba(255,255,255,0.4)" }}>{img.prompt}</p>
                              <span className="text-[10px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>{img.createdAt}</span>
                              <a
                                href={img.imageData}
                                download={`marcela-${img.id}.png`}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0"
                                style={{ background: `${viewedAgent.color}20`, color: viewedAgent.color }}>
                                Baixar
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generated outputs */}
                  {vOutputs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-[10px] uppercase tracking-widest font-semibold"
                          style={{ color: "rgba(255,255,255,0.3)" }}>Arquivos gerados</div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: `${viewedAgent.color}15`, color: viewedAgent.color }}>
                          {vOutputs.length}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {vOutputs.map((out) => {
                          const ts = OUTPUT_TYPE_STYLE[out.type] ?? OUTPUT_TYPE_STYLE.copy;
                          const ss = OUTPUT_STATUS_STYLE[out.status] ?? OUTPUT_STATUS_STYLE.rascunho;
                          const TypeIcon = ts.Icon;
                          const isExpanded = expandedOutput === out.id;
                          return (
                            <div key={out.id} className="rounded-xl overflow-hidden"
                              style={{ border: `1px solid ${isExpanded ? `${ts.color}30` : "rgba(255,255,255,0.07)"}`, background: isExpanded ? `${ts.color}06` : "rgba(255,255,255,0.02)", transition: "all 0.15s" }}>
                              <button
                                className="w-full flex items-center gap-3 px-4 py-3 text-left"
                                onClick={() => setExpandedOutput(isExpanded ? null : out.id)}>
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ background: `${ts.color}15`, border: `1px solid ${ts.color}25` }}>
                                  <TypeIcon className="w-3.5 h-3.5" style={{ color: ts.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{out.name}</div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px]" style={{ color: `${ts.color}90` }}>{ts.label}</span>
                                    {out.platform && <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>· {out.platform}</span>}
                                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>· {out.createdAt}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                                  style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 ml-1"
                                  style={{ color: "rgba(255,255,255,0.2)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                              </button>
                              {isExpanded && (
                                <div className="px-4 pb-4">
                                  {out.type === "design" ? (
                                    <div className="rounded-xl overflow-hidden mb-3"
                                      style={{ background: `linear-gradient(135deg, ${ts.color}18, ${viewedAgent.color}12)`, border: `1px solid ${ts.color}20`, height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <div className="text-center">
                                        <Palette className="w-8 h-8 mx-auto mb-1" style={{ color: `${ts.color}60` }} />
                                        <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>Preview não disponível</div>
                                      </div>
                                    </div>
                                  ) : null}
                                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{out.preview}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Instruction form */}
                  <div className="pt-4" style={{ borderTop: `1px solid ${viewedAgent.color}18` }}>
                    <div className="text-[10px] uppercase tracking-widest font-semibold mb-3"
                      style={{ color: `${viewedAgent.color}90` }}>Dar instrução a {viewedAgent.name}</div>
                    <input ref={agentFileRef} type="file"
                      accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.csv,.xlsx"
                      className="hidden" onChange={handleAgentFileChange} />
                    {viewedAgent.id === "designer" && (
                      <div className="mb-3">
                        <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Formato</div>
                        <div className="flex flex-wrap gap-1.5">
                          {DESIGN_FORMATS.map(({ ratio, label, hint }) => (
                            <button key={ratio} onClick={() => setDesignAspectRatio(ratio as any)}
                              className="flex flex-col items-start px-3 py-1.5 rounded-xl text-left transition-all"
                              style={{
                                background: designAspectRatio === ratio ? `${viewedAgent.color}18` : "rgba(255,255,255,0.04)",
                                border: `1px solid ${designAspectRatio === ratio ? `${viewedAgent.color}50` : "rgba(255,255,255,0.08)"}`,
                              }}>
                              <span className="text-[11px] font-bold" style={{ color: designAspectRatio === ratio ? viewedAgent.color : "rgba(255,255,255,0.6)" }}>
                                {label} <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>{ratio}</span>
                              </span>
                              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>{hint}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <textarea
                      value={agentInstruction}
                      onChange={(e) => setAgentInstruction(e.target.value)}
                      placeholder={viewedAgent.id === "designer" ? "Dê uma direção (opcional) — ou deixe em branco e a Carolina decide sozinha com base no cliente." : `O que você quer que ${viewedAgent.name} faça?`}
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${viewedAgent.color}25`, color: "#F0F0F0", outline: "none" }}
                    />
                    {agentFile && <div className="mt-2">{renderFilePreview(agentFile, agentFileUrl, agentFileText, viewedAgent.color)}</div>}
                    {marcelaError && viewedAgent.id === "designer" && (
                      <div className="mt-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
                        Erro: {marcelaError}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      {agentFile ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
                          style={{ background: `${viewedAgent.color}12`, border: `1px solid ${viewedAgent.color}28` }}>
                          <FileText className="w-3 h-3 flex-shrink-0" style={{ color: viewedAgent.color }} />
                          <span className="text-[11px] max-w-[160px] truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{agentFile.name}</span>
                          <button onClick={clearAgentFile} style={{ color: "rgba(255,255,255,0.3)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => agentFileRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px dashed rgba(255,255,255,0.14)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${viewedAgent.color}50`; e.currentTarget.style.color = viewedAgent.color; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
                          <Paperclip className="w-3 h-3" /> Anexar arquivo
                        </button>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => {
                          if (viewedAgent.id === "designer") {
                            handleSendToDesigner();
                          } else {
                            setAgentInstruction(""); clearAgentFile(); setViewingAgentId(null);
                          }
                        }}
                        disabled={(viewedAgent.id !== "designer" && !agentInstruction.trim() && !agentFile) || marcelaLoading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                        style={{ background: viewedAgent.color, color: "#07080A", boxShadow: (agentInstruction || agentFile || viewedAgent.id === "designer") ? `0 0 20px -4px ${viewedAgent.color}70` : "none" }}>
                        {marcelaLoading && viewedAgent.id === "designer" ? (
                          <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                        ) : (
                          <><Send className="w-3.5 h-3.5" /> {viewedAgent.id === "designer" && !agentInstruction.trim() ? "Criar agora" : `Enviar para ${viewedAgent.name}`}</>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modal entrega completa do agente ── */}
      <AnimatePresence>
        {expandedAgentOutput && agentOutputs[expandedAgentOutput] && (() => {
          const agMeta = AGENT_META[expandedAgentOutput] ?? { initial: expandedAgentOutput[0]?.toUpperCase(), color: "#888", name: expandedAgentOutput };
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.85)" }}
              onClick={() => setExpandedAgentOutput(null)}>
              <motion.div
                initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
                className="rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
                style={{ background: "#0e0f1a", border: `1px solid ${agMeta.color}30`, boxShadow: `0 0 60px -10px ${agMeta.color}30` }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: `1px solid ${agMeta.color}18` }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: `${agMeta.color}20`, border: `1px solid ${agMeta.color}40`, color: agMeta.color }}>
                    {agMeta.initial}
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{agMeta.name}</div>
                    <div className="text-[11px]" style={{ color: agMeta.color }}>Última entrega</div>
                  </div>
                  <button onClick={() => setExpandedAgentOutput(null)} className="ml-auto p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-y-auto px-6 py-5">
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans" style={{ color: "rgba(255,255,255,0.78)" }}>
                    {agentOutputs[expandedAgentOutput]}
                  </pre>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Post Canvas Modal ── */}
      <AnimatePresence>
        {postCanvas && (
          <PostCanvas
            imageUrl={postCanvas.imageUrl}
            brandColor={client.color}
            clientName={client.name}
            initialHeadline={postCanvas.headline}
            initialBody={postCanvas.body}
            initialCta={postCanvas.cta}
            onClose={() => setPostCanvas(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Edit Client Modal ── */}
      {showEditClient && editForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: "#0F0F1A", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold" style={{ color: "#F0F0F0" }}>Editar cliente</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>As alterações são salvas localmente</p>
              </div>
              <button onClick={() => setShowEditClient(false)} style={{ color: "rgba(255,255,255,0.35)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Nome</label>
                  <input value={editForm.name} onChange={(e) => setEditForm(f => f && { ...f, name: e.target.value })}
                    className="w-full rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Segmento</label>
                  <input value={editForm.industry} onChange={(e) => setEditForm(f => f && { ...f, industry: e.target.value })}
                    className="w-full rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm(f => f && { ...f, status: e.target.value as any })}
                    className="w-full rounded-xl px-3 py-2 text-sm appearance-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }}>
                    <option value="Ativo">Ativo</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Em pausa">Em pausa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Honorário mensal</label>
                  <input value={editForm.revenue} onChange={(e) => setEditForm(f => f && { ...f, revenue: e.target.value })}
                    placeholder="R$ 0.000"
                    className="w-full rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Próxima ação</label>
                <input value={editForm.nextAction} onChange={(e) => setEditForm(f => f && { ...f, nextAction: e.target.value })}
                  className="w-full rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Seguidores Instagram</label>
                  <input value={editForm.followersIg} onChange={(e) => setEditForm(f => f && { ...f, followersIg: e.target.value })}
                    placeholder="ex: 3,1k"
                    className="w-full rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Seguidores Facebook</label>
                  <input value={editForm.followersFb} onChange={(e) => setEditForm(f => f && { ...f, followersFb: e.target.value })}
                    placeholder="ex: 6,4k"
                    className="w-full rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>PIN do Portal</label>
                <input value={editForm.portalPin} onChange={(e) => setEditForm(f => f && { ...f, portalPin: e.target.value })}
                  placeholder="ex: GL2025"
                  className="w-full rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Site do cliente</label>
                <input value={editForm.siteUrl} onChange={(e) => setEditForm(f => f && { ...f, siteUrl: e.target.value })}
                  placeholder="https://site-do-cliente.com.br"
                  type="url"
                  className="w-full rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>A Aria faz scraping automático do site para calibrar o time</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Repositório GitHub</label>
                <input value={(editForm as any).siteRepo ?? ""} onChange={(e) => setEditForm(f => f && ({ ...f, siteRepo: e.target.value } as any))}
                  placeholder="ex: caslu-cmd/nome-do-site"
                  className="w-full rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Formato: usuario/repositorio — necessário para o Teo editar o site</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Instruções do time</label>
                <textarea value={editForm.teamInstructions} onChange={(e) => setEditForm(f => f && { ...f, teamInstructions: e.target.value })}
                  rows={3}
                  placeholder="Ex: Beatriz nunca usa a palavra 'potencializar'. Carolina sempre usa fundo escuro. Tom B2B sério e direto."
                  className="w-full rounded-xl px-3 py-2 text-sm resize-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Injetado automaticamente em todos os agentes. Escreva uma vez, vale para sempre.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEditClient(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Cancelar
              </button>
              <button onClick={handleSaveClient}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: client.color, color: "#07080A" }}>
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Panel */}
      {activeContact && (
        <ContactActivityPanel
          contact={activeContact}
          onClose={() => setActiveContact(null)}
        />
      )}

      {/* Generate Draft Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#0D0D1A", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {draftAgent ? `${draftAgent.name} vai criar um post` : "Solicitar post com IA"}
                </p>
                {draftAgent && <p className="text-[10px] mt-0.5" style={{ color: draftAgent.color }}>{draftAgent.role}</p>}
              </div>
              <button onClick={() => setShowDraftModal(false)} style={{ color: "rgba(255,255,255,0.4)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Platforms */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Plataformas *</label>
                <div className="flex gap-2 flex-wrap">
                  {["instagram", "facebook", "linkedin"].map(p => {
                    const sel = draftForm.platforms.includes(p);
                    const colors: Record<string, string> = { instagram: "#E1306C", facebook: "#1877F2", linkedin: "#0A66C2" };
                    return (
                      <button key={p} onClick={() => setDraftForm(f => ({ ...f, platforms: sel ? f.platforms.filter(x => x !== p) : [...f.platforms, p] }))}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all"
                        style={sel
                          ? { background: `${colors[p]}20`, color: colors[p], border: `1px solid ${colors[p]}40` }
                          : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Tema / Objetivo do post *</label>
                <textarea
                  value={draftForm.topic}
                  onChange={e => setDraftForm(f => ({ ...f, topic: e.target.value }))}
                  placeholder="Ex: Promover lançamento do produto X, destacar benefício Y, engajar com pergunta sobre Z..."
                  rows={3}
                  className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.8)" }}
                />
              </div>

              {/* Tone */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Tom</label>
                <div className="flex gap-2 flex-wrap">
                  {["profissional e envolvente", "descontraído e divertido", "urgente e persuasivo", "educativo e informativo"].map(t => (
                    <button key={t} onClick={() => setDraftForm(f => ({ ...f, tone: t }))}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                      style={draftForm.tone === t
                        ? { background: `${client.color}18`, color: client.color, border: `1px solid ${client.color}30` }
                        : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowDraftModal(false)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                Cancelar
              </button>
              <button
                onClick={handleGenerateDraft}
                disabled={generatingDraft || !draftForm.topic.trim() || !draftForm.platforms.length}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                style={{ background: client.color, color: "#07080A" }}>
                {generatingDraft
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando…</>
                  : <><Send className="w-4 h-4" /> Gerar e enviar para aprovação</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Integration Config Modal ─────────────────────────── */}
      {socialConfigModal && (() => {
        // look up in INTEGRATIONS_BASE (social) or CONNECTOR_DEFS (all others)
        const socialDef = INTEGRATIONS_BASE.find(i => i.id === socialConfigModal);
        const connDef   = CONNECTOR_DEFS.find(c => c.name === socialConfigModal);
        const name      = socialDef?.name ?? connDef?.name ?? socialConfigModal;
        const icon      = socialDef ? null : connDef?.icon;
        const color     = socialDef?.color ?? "#B9FF4B";
        const bg        = socialDef?.bg ?? "rgba(185,255,75,0.08)";
        const border    = socialDef?.border ?? "rgba(185,255,75,0.15)";
        const fields    = socialDef?.configFields ?? connDef?.configFields ?? [];
        const IconComp  = socialDef?.Icon ?? null;
        if (!socialDef && !connDef) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md rounded-2xl p-6 space-y-4"
              style={{ background: "#13131A", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: bg, border: `1px solid ${border}` }}>
                    {IconComp
                      ? <IconComp className="w-5 h-5" style={{ color }} />
                      : icon}
                  </div>
                  <div>
                    <h2 className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{name}</h2>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Configurações da integração</p>
                  </div>
                </div>
                <button onClick={() => setSocialConfigModal(null)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Credenciais configuradas via variáveis de ambiente no Supabase.
                </p>
              )}

              {fields.map(field => (
                <div key={field.key}>
                  <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{field.label}</label>
                  <input
                    type={field.type || "text"}
                    value={socialConfigValues[field.key] || ""}
                    onChange={e => setSocialConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={`Insira ${field.label.toLowerCase()}`}
                    className="w-full mt-1 rounded-xl py-2.5 px-3 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)" }}
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setSocialConfigModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Cancelar
                </button>
                <button onClick={saveSocialConfig} disabled={socialConfigSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ background: color, color: color === "#B9FF4B" ? "#07080A" : "#fff" }}>
                  {socialConfigSaving
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando…</>
                    : <><Save className="w-4 h-4" /> Salvar e Conectar</>}
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}
