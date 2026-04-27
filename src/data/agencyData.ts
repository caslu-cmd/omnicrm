export interface Client {
  id: string;
  name: string;
  industry: string;
  color: string;
  initials: string;
  status: "Ativo" | "Onboarding" | "Em pausa";
  agentActive: boolean;
  postsMonth: number;
  campaigns: number;
  lastActivity: string;
  revenue: string;
  nextAction: string;
  followers: { instagram: string; facebook: string };
  recentPosts: Post[];
  activeCampaigns: Campaign[];
  agentFeed: AgentActivity[];
  weeklyContent: WeekDay[];
  metrics: Metric[];
}

export interface Post {
  id: string;
  type: "Feed" | "Story" | "Reels";
  caption: string;
  platform: "Instagram" | "Facebook";
  scheduledFor: string;
  status: "Publicado" | "Agendado" | "Rascunho";
  likes?: number;
  reach?: number;
}

export interface Campaign {
  id: string;
  name: string;
  platform: "Facebook Ads" | "Google Ads";
  status: "Ativa" | "Pausada" | "Encerrada";
  budget: string;
  spent: string;
  results: string;
  cpa: string;
}

export interface AgentActivity {
  id: string;
  action: string;
  detail: string;
  time: string;
  type: "content" | "campaign" | "report" | "analysis";
}

export interface WeekDay {
  day: string;
  date: string;
  posts: { type: string; platform: string; status: string }[];
}

export interface Metric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

export const CLIENTS: Client[] = [
  {
    id: "1",
    name: "Clínica Derma Bella",
    industry: "Saúde & Estética",
    color: "#E8789A",
    initials: "DB",
    status: "Ativo",
    agentActive: true,
    postsMonth: 24,
    campaigns: 3,
    lastActivity: "há 2h",
    revenue: "R$ 3.200",
    followers: { instagram: "12,4k", facebook: "8,1k" },
    nextAction: "Criar carrossel promoção de verão",
    recentPosts: [
      { id: "p1", type: "Feed", caption: "Pele radiante para o verão ✨ Conheça nosso protocolo personalizado...", platform: "Instagram", scheduledFor: "Hoje 18h", status: "Agendado", likes: 0, reach: 0 },
      { id: "p2", type: "Story", caption: "Antes e depois — protocolo facial premium", platform: "Instagram", scheduledFor: "Ontem", status: "Publicado", likes: 423, reach: 2100 },
      { id: "p3", type: "Reels", caption: "3 erros que você comete na sua rotina de skincare", platform: "Instagram", scheduledFor: "23/04", status: "Publicado", likes: 891, reach: 5600 },
    ],
    activeCampaigns: [
      { id: "c1", name: "Protocolo Verão — Awareness", platform: "Facebook Ads", status: "Ativa", budget: "R$ 1.500/mês", spent: "R$ 890", results: "342 leads", cpa: "R$ 2,60" },
      { id: "c2", name: "Retargeting — Avaliação Grátis", platform: "Facebook Ads", status: "Ativa", budget: "R$ 800/mês", spent: "R$ 420", results: "87 agendamentos", cpa: "R$ 4,83" },
      { id: "c3", name: "Busca — Dermatologista SP", platform: "Google Ads", status: "Ativa", budget: "R$ 900/mês", spent: "R$ 610", results: "218 cliques", cpa: "R$ 2,80" },
    ],
    agentFeed: [
      { id: "a1", action: "Criou 3 legendas para Instagram", detail: "Carrossel sobre protocolo de verão — pronto para revisão", time: "há 15min", type: "content" },
      { id: "a2", action: "Agendou 5 stories", detail: "Programados para segunda a sexta — 9h e 19h", time: "há 1h", type: "content" },
      { id: "a3", action: "Gerou relatório de performance", detail: "Semana de 21/04 — alcance +18% vs semana anterior", time: "há 3h", type: "report" },
      { id: "a4", action: "Otimizou campanha Facebook", detail: "Pausou conjunto de anúncios com CPA acima de R$ 8", time: "ontem 16h", type: "campaign" },
      { id: "a5", action: "Analisou comentários", detail: "87 comentários positivos, 2 negativos respondidos", time: "ontem 12h", type: "analysis" },
    ],
    weeklyContent: [
      { day: "Seg", date: "28/04", posts: [{ type: "Feed", platform: "IG", status: "Agendado" }, { type: "Story", platform: "IG", status: "Agendado" }] },
      { day: "Ter", date: "29/04", posts: [{ type: "Story", platform: "IG", status: "Agendado" }] },
      { day: "Qua", date: "30/04", posts: [{ type: "Reels", platform: "IG", status: "Rascunho" }, { type: "Feed", platform: "FB", status: "Agendado" }] },
      { day: "Qui", date: "01/05", posts: [] },
      { day: "Sex", date: "02/05", posts: [{ type: "Feed", platform: "IG", status: "Agendado" }, { type: "Story", platform: "IG", status: "Agendado" }] },
      { day: "Sáb", date: "03/05", posts: [{ type: "Story", platform: "IG", status: "Rascunho" }] },
      { day: "Dom", date: "04/05", posts: [] },
    ],
    metrics: [
      { label: "Alcance", value: "48.2k", change: "+18%", positive: true },
      { label: "Engajamento", value: "4.8%", change: "+0.6pp", positive: true },
      { label: "Leads gerados", value: "342", change: "+24%", positive: true },
      { label: "Agendamentos", value: "87", change: "+12%", positive: true },
    ],
  },
  {
    id: "2",
    name: "Academia FitPrime",
    industry: "Fitness & Wellness",
    color: "#F97316",
    initials: "FP",
    status: "Ativo",
    agentActive: true,
    postsMonth: 18,
    campaigns: 2,
    lastActivity: "há 30min",
    revenue: "R$ 2.800",
    followers: { instagram: "9,2k", facebook: "5,8k" },
    nextAction: "Campanha Março: matrícula com desconto",
    recentPosts: [
      { id: "p1", type: "Reels", caption: "Transformação em 30 dias 🔥 Vem treinar com a gente!", platform: "Instagram", scheduledFor: "Hoje 19h", status: "Agendado" },
      { id: "p2", type: "Feed", caption: "5 exercícios para definir o abdômen em casa", platform: "Instagram", scheduledFor: "Ontem", status: "Publicado", likes: 567, reach: 3200 },
    ],
    activeCampaigns: [
      { id: "c1", name: "Matrícula Maio — Desconto 30%", platform: "Facebook Ads", status: "Ativa", budget: "R$ 1.200/mês", spent: "R$ 540", results: "156 leads", cpa: "R$ 3,46" },
      { id: "c2", name: "Personal Training — Busca", platform: "Google Ads", status: "Ativa", budget: "R$ 600/mês", spent: "R$ 280", results: "94 cliques", cpa: "R$ 2,98" },
    ],
    agentFeed: [
      { id: "a1", action: "Criou roteiro de Reels", detail: "Transformação em 30 dias — edição em andamento", time: "há 30min", type: "content" },
      { id: "a2", action: "Programou conteúdo da semana", detail: "8 posts agendados — Instagram e Facebook", time: "há 4h", type: "content" },
      { id: "a3", action: "Analisou performance dos Reels", detail: "Reels têm 3x mais alcance que feed nesta conta", time: "ontem", type: "analysis" },
    ],
    weeklyContent: [
      { day: "Seg", date: "28/04", posts: [{ type: "Reels", platform: "IG", status: "Agendado" }] },
      { day: "Ter", date: "29/04", posts: [{ type: "Story", platform: "IG", status: "Agendado" }, { type: "Story", platform: "IG", status: "Agendado" }] },
      { day: "Qua", date: "30/04", posts: [{ type: "Feed", platform: "IG", status: "Agendado" }] },
      { day: "Qui", date: "01/05", posts: [] },
      { day: "Sex", date: "02/05", posts: [{ type: "Reels", platform: "IG", status: "Rascunho" }] },
      { day: "Sáb", date: "03/05", posts: [{ type: "Feed", platform: "FB", status: "Agendado" }] },
      { day: "Dom", date: "04/05", posts: [] },
    ],
    metrics: [
      { label: "Alcance", value: "31.5k", change: "+22%", positive: true },
      { label: "Engajamento", value: "5.2%", change: "+1.1pp", positive: true },
      { label: "Leads gerados", value: "156", change: "+8%", positive: true },
      { label: "Matrículas", value: "23", change: "-3%", positive: false },
    ],
  },
  {
    id: "3",
    name: "Restaurante Sabor & Arte",
    industry: "Gastronomia",
    color: "#FBBF24",
    initials: "SA",
    status: "Ativo",
    agentActive: false,
    postsMonth: 12,
    campaigns: 1,
    lastActivity: "ontem",
    revenue: "R$ 1.900",
    followers: { instagram: "4,7k", facebook: "11,2k" },
    nextAction: "Stories do cardápio de almoço",
    recentPosts: [
      { id: "p1", type: "Feed", caption: "Nosso risoto de funghi está de volta ao cardápio 🍄", platform: "Instagram", scheduledFor: "Hoje 12h", status: "Publicado", likes: 234, reach: 1800 },
    ],
    activeCampaigns: [
      { id: "c1", name: "Almoço Executivo — Awareness", platform: "Facebook Ads", status: "Ativa", budget: "R$ 900/mês", spent: "R$ 510", results: "89 reservas", cpa: "R$ 5,73" },
    ],
    agentFeed: [
      { id: "a1", action: "Publicou foto do prato do dia", detail: "Risoto de funghi — 234 curtidas em 2h", time: "ontem 12h", type: "content" },
      { id: "a2", action: "Criou pauta para a semana", detail: "7 posts: pratos, bastidores e receita do chef", time: "ontem 9h", type: "content" },
    ],
    weeklyContent: [
      { day: "Seg", date: "28/04", posts: [{ type: "Story", platform: "IG", status: "Agendado" }] },
      { day: "Ter", date: "29/04", posts: [{ type: "Feed", platform: "IG", status: "Agendado" }] },
      { day: "Qua", date: "30/04", posts: [{ type: "Story", platform: "FB", status: "Agendado" }] },
      { day: "Qui", date: "01/05", posts: [] },
      { day: "Sex", date: "02/05", posts: [{ type: "Feed", platform: "IG", status: "Rascunho" }] },
      { day: "Sáb", date: "03/05", posts: [{ type: "Feed", platform: "IG", status: "Rascunho" }, { type: "Story", platform: "IG", status: "Rascunho" }] },
      { day: "Dom", date: "04/05", posts: [] },
    ],
    metrics: [
      { label: "Alcance", value: "18.9k", change: "+5%", positive: true },
      { label: "Engajamento", value: "3.9%", change: "-0.2pp", positive: false },
      { label: "Reservas via redes", value: "89", change: "+31%", positive: true },
      { label: "Avaliações", value: "4.8★", change: "+0.1", positive: true },
    ],
  },
  {
    id: "4",
    name: "Imobiliária Premium RJ",
    industry: "Imóveis",
    color: "#3B82F6",
    initials: "IP",
    status: "Onboarding",
    agentActive: false,
    postsMonth: 4,
    campaigns: 0,
    lastActivity: "há 3 dias",
    revenue: "R$ 4.500",
    followers: { instagram: "1,2k", facebook: "2,3k" },
    nextAction: "Configurar perfil e estratégia inicial",
    recentPosts: [],
    activeCampaigns: [],
    agentFeed: [
      { id: "a1", action: "Análise de concorrentes concluída", detail: "Top 5 imobiliárias RJ analisadas — relatório disponível", time: "há 3 dias", type: "analysis" },
      { id: "a2", action: "Estratégia inicial criada", detail: "Foco em Barra da Tijuca e Leblon — conteúdo aspiracional", time: "há 4 dias", type: "content" },
    ],
    weeklyContent: [
      { day: "Seg", date: "28/04", posts: [] },
      { day: "Ter", date: "29/04", posts: [{ type: "Feed", platform: "IG", status: "Rascunho" }] },
      { day: "Qua", date: "30/04", posts: [] },
      { day: "Qui", date: "01/05", posts: [] },
      { day: "Sex", date: "02/05", posts: [{ type: "Feed", platform: "IG", status: "Rascunho" }] },
      { day: "Sáb", date: "03/05", posts: [] },
      { day: "Dom", date: "04/05", posts: [] },
    ],
    metrics: [
      { label: "Alcance", value: "2.1k", change: "+100%", positive: true },
      { label: "Engajamento", value: "2.1%", change: "—", positive: true },
      { label: "Leads gerados", value: "0", change: "—", positive: true },
      { label: "Visitas perfil", value: "312", change: "+60%", positive: true },
    ],
  },
  {
    id: "5",
    name: "Studio Foto Mariana",
    industry: "Fotografia",
    color: "#14B8A6",
    initials: "SM",
    status: "Em pausa",
    agentActive: false,
    postsMonth: 0,
    campaigns: 0,
    lastActivity: "há 2 semanas",
    revenue: "R$ 1.200",
    followers: { instagram: "6,8k", facebook: "1,9k" },
    nextAction: "Retomar após retorno da cliente",
    recentPosts: [],
    activeCampaigns: [],
    agentFeed: [],
    weeklyContent: [
      { day: "Seg", date: "28/04", posts: [] },
      { day: "Ter", date: "29/04", posts: [] },
      { day: "Qua", date: "30/04", posts: [] },
      { day: "Qui", date: "01/05", posts: [] },
      { day: "Sex", date: "02/05", posts: [] },
      { day: "Sáb", date: "03/05", posts: [] },
      { day: "Dom", date: "04/05", posts: [] },
    ],
    metrics: [
      { label: "Alcance", value: "—", change: "—", positive: true },
      { label: "Engajamento", value: "—", change: "—", positive: true },
      { label: "Leads gerados", value: "—", change: "—", positive: true },
      { label: "Sessões agendadas", value: "—", change: "—", positive: true },
    ],
  },
];
