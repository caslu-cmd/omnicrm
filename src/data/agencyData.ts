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
  platform: "Facebook Ads" | "Google Ads" | "LinkedIn Ads";
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
    id: "grupo-licita",
    name: "Grupo Licita",
    industry: "Consultoria & Licitações",
    color: "#3B82F6",
    initials: "GL",
    status: "Ativo",
    agentActive: true,
    postsMonth: 20,
    campaigns: 2,
    lastActivity: "há 1h",
    revenue: "R$ 3.800",
    nextAction: "Publicar artigo sobre novas regras de licitação",
    followers: { instagram: "3,1k", facebook: "6,4k" },
    recentPosts: [
      { id: "p1", type: "Feed", caption: "Entenda as mudanças da Nova Lei de Licitações e como sua empresa pode se beneficiar...", platform: "LinkedIn", scheduledFor: "Hoje 10h", status: "Agendado" },
      { id: "p2", type: "Feed", caption: "5 erros que eliminam sua proposta antes mesmo da análise técnica", platform: "Instagram", scheduledFor: "Ontem", status: "Publicado", likes: 187, reach: 2800 },
      { id: "p3", type: "Story", caption: "Ganhou uma licitação? Veja os próximos passos", platform: "Instagram", scheduledFor: "25/04", status: "Publicado", likes: 94, reach: 1200 },
    ],
    activeCampaigns: [
      { id: "c1", name: "Captação de Leads — Empresas B2B", platform: "LinkedIn Ads", status: "Ativa", budget: "R$ 2.000/mês", spent: "R$ 1.150", results: "94 leads qualificados", cpa: "R$ 12,23" },
      { id: "c2", name: "Autoridade — Consultoria Licitações", platform: "Google Ads", status: "Ativa", budget: "R$ 1.200/mês", spent: "R$ 680", results: "312 cliques", cpa: "R$ 2,18" },
    ],
    agentFeed: [
      { id: "a1", action: "Criou artigo para LinkedIn", detail: "Nova Lei de Licitações: o que muda para PMEs — revisão pendente", time: "há 1h", type: "content" },
      { id: "a2", action: "Agendou 4 posts para a semana", detail: "Instagram e LinkedIn — foco em autoridade e captação", time: "há 3h", type: "content" },
      { id: "a3", action: "Gerou relatório de leads", detail: "Semana 21/04 — 94 leads via LinkedIn Ads, custo médio R$ 12,23", time: "ontem 17h", type: "report" },
      { id: "a4", action: "Otimizou segmentação LinkedIn", detail: "Refinamento por cargo: diretores e gerentes de compras", time: "ontem 11h", type: "campaign" },
      { id: "a5", action: "Analisou concorrência", detail: "3 concorrentes monitorados — nenhum com presença forte no LinkedIn", time: "há 3 dias", type: "analysis" },
    ],
    weeklyContent: [
      { day: "Seg", date: "28/04", posts: [{ type: "Feed", platform: "LI", status: "Agendado" }, { type: "Story", platform: "IG", status: "Agendado" }] },
      { day: "Ter", date: "29/04", posts: [{ type: "Feed", platform: "IG", status: "Agendado" }] },
      { day: "Qua", date: "30/04", posts: [{ type: "Feed", platform: "LI", status: "Rascunho" }] },
      { day: "Qui", date: "01/05", posts: [] },
      { day: "Sex", date: "02/05", posts: [{ type: "Feed", platform: "IG", status: "Agendado" }, { type: "Story", platform: "IG", status: "Agendado" }] },
      { day: "Sáb", date: "03/05", posts: [] },
      { day: "Dom", date: "04/05", posts: [] },
    ],
    metrics: [
      { label: "Alcance", value: "24.6k", change: "+31%", positive: true },
      { label: "Engajamento", value: "3.4%", change: "+0.8pp", positive: true },
      { label: "Leads gerados", value: "94", change: "+40%", positive: true },
      { label: "Custo por lead", value: "R$ 12,23", change: "-18%", positive: true },
    ],
  },
  {
    id: "abcer",
    name: "ABCER",
    industry: "Associação Empresarial",
    color: "#F97316",
    initials: "AB",
    status: "Ativo",
    agentActive: true,
    postsMonth: 16,
    campaigns: 2,
    lastActivity: "há 2h",
    revenue: "R$ 2.600",
    nextAction: "Divulgar evento de networking de maio",
    followers: { instagram: "5,8k", facebook: "9,3k" },
    recentPosts: [
      { id: "p1", type: "Feed", caption: "Participe do nosso Encontro de Líderes — vagas limitadas!", platform: "Instagram", scheduledFor: "Hoje 18h", status: "Agendado" },
      { id: "p2", type: "Reels", caption: "Veja como foi o último evento da ABCER 🎤", platform: "Instagram", scheduledFor: "Ontem", status: "Publicado", likes: 312, reach: 4200 },
      { id: "p3", type: "Feed", caption: "Associe-se e acesse benefícios exclusivos para sua empresa", platform: "Facebook", scheduledFor: "24/04", status: "Publicado", likes: 148, reach: 3100 },
    ],
    activeCampaigns: [
      { id: "c1", name: "Captação de Associados — Awareness", platform: "Facebook Ads", status: "Ativa", budget: "R$ 1.500/mês", spent: "R$ 820", results: "203 leads", cpa: "R$ 4,04" },
      { id: "c2", name: "Evento Networking Maio", platform: "Facebook Ads", status: "Ativa", budget: "R$ 800/mês", spent: "R$ 310", results: "67 inscrições", cpa: "R$ 4,63" },
    ],
    agentFeed: [
      { id: "a1", action: "Criou campanha para o evento", detail: "Encontro de Líderes — 3 anúncios criados para aprovação", time: "há 2h", type: "campaign" },
      { id: "a2", action: "Editou roteiro do Reels de cobertura", detail: "Resumo do último evento — 312 curtidas em 4h", time: "há 5h", type: "content" },
      { id: "a3", action: "Programou conteúdo da semana", detail: "6 posts no Instagram e Facebook", time: "ontem 14h", type: "content" },
      { id: "a4", action: "Relatório de associações", detail: "+14 novos associados via redes sociais em abril", time: "ontem 9h", type: "report" },
    ],
    weeklyContent: [
      { day: "Seg", date: "28/04", posts: [{ type: "Story", platform: "IG", status: "Agendado" }] },
      { day: "Ter", date: "29/04", posts: [{ type: "Feed", platform: "IG", status: "Agendado" }, { type: "Feed", platform: "FB", status: "Agendado" }] },
      { day: "Qua", date: "30/04", posts: [{ type: "Reels", platform: "IG", status: "Rascunho" }] },
      { day: "Qui", date: "01/05", posts: [] },
      { day: "Sex", date: "02/05", posts: [{ type: "Feed", platform: "IG", status: "Agendado" }, { type: "Story", platform: "IG", status: "Agendado" }] },
      { day: "Sáb", date: "03/05", posts: [{ type: "Feed", platform: "FB", status: "Rascunho" }] },
      { day: "Dom", date: "04/05", posts: [] },
    ],
    metrics: [
      { label: "Alcance", value: "38.4k", change: "+19%", positive: true },
      { label: "Engajamento", value: "4.6%", change: "+1.2pp", positive: true },
      { label: "Novos associados", value: "14", change: "+40%", positive: true },
      { label: "Inscrições evento", value: "67", change: "+67%", positive: true },
    ],
  },
  {
    id: "gnx",
    name: "GNX",
    industry: "Tecnologia & Negócios",
    color: "#8B5CF6",
    initials: "GN",
    status: "Ativo",
    agentActive: false,
    postsMonth: 12,
    campaigns: 1,
    lastActivity: "ontem",
    revenue: "R$ 3.200",
    nextAction: "Criar série de conteúdo sobre inovação",
    followers: { instagram: "2,4k", facebook: "4,1k" },
    recentPosts: [
      { id: "p1", type: "Feed", caption: "Como a automação está transformando pequenas empresas em 2025", platform: "Instagram", scheduledFor: "Ontem 17h", status: "Publicado", likes: 221, reach: 3600 },
      { id: "p2", type: "Story", caption: "Você sabia que 78% das PMEs ainda não usam IA?", platform: "Instagram", scheduledFor: "24/04", status: "Publicado", likes: 104, reach: 1900 },
    ],
    activeCampaigns: [
      { id: "c1", name: "Geração de Leads — B2B Tech", platform: "LinkedIn Ads", status: "Ativa", budget: "R$ 2.500/mês", spent: "R$ 1.400", results: "78 leads", cpa: "R$ 17,95" },
    ],
    agentFeed: [
      { id: "a1", action: "Publicou artigo no LinkedIn", detail: "Automação para PMEs — 221 curtidas, 18 compartilhamentos", time: "ontem 17h", type: "content" },
      { id: "a2", action: "Criou pauta para maio", detail: "Série: 4 conteúdos sobre IA e inovação nos negócios", time: "ontem 10h", type: "content" },
      { id: "a3", action: "Analisou funil de conversão", detail: "LinkedIn Ads → landing page → 78 leads com taxa de 5,4%", time: "há 3 dias", type: "analysis" },
    ],
    weeklyContent: [
      { day: "Seg", date: "28/04", posts: [{ type: "Feed", platform: "LI", status: "Rascunho" }] },
      { day: "Ter", date: "29/04", posts: [] },
      { day: "Qua", date: "30/04", posts: [{ type: "Feed", platform: "IG", status: "Agendado" }, { type: "Story", platform: "IG", status: "Agendado" }] },
      { day: "Qui", date: "01/05", posts: [] },
      { day: "Sex", date: "02/05", posts: [{ type: "Feed", platform: "LI", status: "Rascunho" }] },
      { day: "Sáb", date: "03/05", posts: [] },
      { day: "Dom", date: "04/05", posts: [] },
    ],
    metrics: [
      { label: "Alcance", value: "19.8k", change: "+28%", positive: true },
      { label: "Engajamento", value: "4.1%", change: "+0.9pp", positive: true },
      { label: "Leads gerados", value: "78", change: "+22%", positive: true },
      { label: "Custo por lead", value: "R$ 17,95", change: "-11%", positive: true },
    ],
  },
];
