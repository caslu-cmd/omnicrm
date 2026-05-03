export interface Course {
  id: string;
  name: string;
  tagline: string;
  modality: "Online Ao Vivo" | "Gravado" | "Presencial" | "Híbrido";
  duration: string;
  price: string;
  installments: string;
  targetAudience: string;
  certificate: string;
  nextDate: string;
  spots: number;
  enrolled: number;
  instructor: string;
  topics: string[];
  includes: string[];
  whatsappGroupId?: string;
}

export interface WhatsAppLead {
  id: string;
  name: string;
  number: string;
  courseId: string;
  message: string;
  time: string;
  stage: "prospeccao" | "qualificacao" | "proposta" | "negociacao" | "ganho";
  addedToCrm: boolean;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  status: "Lead" | "Qualificado" | "Cliente" | "Inativo";
  lastContact: string;
  value?: string;
  tags: string[];
}

export interface Deal {
  id: string;
  title: string;
  contact: string;
  value: string;
  stage: "prospeccao" | "qualificacao" | "proposta" | "negociacao" | "ganho";
  probability: number;
  dueDate: string;
}

export interface AgentTask {
  current: string;
  status: "trabalhando" | "aguardando" | "concluído" | "idle";
  recent: string[];
  progress: number;
}

export interface GeneratedOutput {
  id: string;
  name: string;
  type: "copy" | "design" | "post" | "article" | "report" | "plan" | "email" | "ad";
  agent: string;
  createdAt: string;
  preview: string;
  platform?: string;
  status: "rascunho" | "revisão" | "aprovado" | "publicado";
}

export interface OrchestratorStep {
  step: string;
  done: boolean;
  active?: boolean;
}

export interface CampaignPhase {
  id: string;
  label: string;
  agentId: string;
  status: "done" | "active" | "pending";
  output?: string;
}

export interface RemarketingAudience {
  id: string;
  name: string;
  size: string;
  platform: string;
  type: "website" | "video" | "lookalike" | "email" | "custom";
  status: "ativa" | "pausada";
  cpa?: string;
  leadsThisWeek?: number;
}

export interface CollabCampaign {
  id: string;
  name: string;
  objective: string;
  status: "ativa" | "rascunho" | "pausada" | "concluída";
  platforms: string[];
  budget: string;
  spent: string;
  reach: string;
  leads: number;
  cpa: string;
  roas?: string;
  startDate: string;
  phases: CampaignPhase[];
  remarketing: RemarketingAudience[];
  crmLeads: number;
}

export interface Post {
  id: string;
  type: "Feed" | "Story" | "Reels";
  caption: string;
  platform: string;
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
  contacts: Contact[];
  pipeline: Deal[];
  agentTasks: Record<string, AgentTask>;
  orchestratorStatus: string;
  orchestratorPlan: OrchestratorStep[];
  portalPin: string;
  courses?: Course[];
  whatsappLeads?: WhatsAppLead[];
  outputs: GeneratedOutput[];
  collabCampaigns?: CollabCampaign[];
  siteUrl?: string;
  siteRepo?: string;
  teamInstructions?: string;
}

export const CLIENTS: Client[] = [
  // ── GRUPO LICITA ─────────────────────────────────────────────
  {
    id: "grupo-licita",
    name: "Grupo Licita",
    industry: "Consultoria & Licitações",
    color: "#B9FF4B",
    initials: "GL",
    status: "Ativo",
    agentActive: true,
    postsMonth: 22,
    campaigns: 3,
    lastActivity: "Hoje",
    revenue: "R$ 4.800",
    nextAction: "Publicar artigo LinkedIn sobre nova lei",
    followers: { instagram: "3.2k", facebook: "5.1k" },
    recentPosts: [
      { id: "gl-p1", type: "Feed", caption: "Entenda os principais impactos da nova lei de licitações para empresas que participam de pregões eletrônicos. Confira nosso guia completo ⬇️", platform: "Instagram", scheduledFor: "06/05 às 10h", status: "Rascunho" },
      { id: "gl-p2", type: "Reels", caption: "3 erros que eliminam sua proposta na fase de habilitação — e como evitá-los", platform: "Instagram", scheduledFor: "07/05 às 16h", status: "Rascunho" },
      { id: "gl-p3", type: "Feed", caption: "Case de sucesso: como ajudamos uma empresa a ganhar R$ 2,4M em contratos públicos em 2024", platform: "LinkedIn", scheduledFor: "08/05 às 9h", status: "Agendado", likes: 0, reach: 0 },
    ],
    activeCampaigns: [
      { id: "gl-c1", name: "Captação de Leads B2B", platform: "LinkedIn Ads", status: "Ativa", budget: "R$ 3.000", spent: "R$ 1.840", results: "67 leads", cpa: "R$ 27,46" },
      { id: "gl-c2", name: "Autoridade no Setor", platform: "Facebook Ads", status: "Ativa", budget: "R$ 1.500", spent: "R$ 980", results: "12.400 alcance", cpa: "R$ 0,08" },
    ],
    agentFeed: [
      { id: "gl-f1", action: "Artigo publicado no LinkedIn", detail: "Guia completo sobre habilitação em pregões — 847 visualizações em 24h", time: "2h atrás", type: "content" },
      { id: "gl-f2", action: "Campanha LinkedIn otimizada", detail: "CPA reduzido de R$ 34 para R$ 27 após ajuste de segmentação por cargo", time: "5h atrás", type: "campaign" },
      { id: "gl-f3", action: "3 leads qualificados adicionados ao CRM", detail: "Empresas de construção civil com faturamento acima de R$ 5M", time: "8h atrás", type: "analysis" },
      { id: "gl-f4", action: "Relatório semanal gerado", detail: "Semana 18: +34% de impressões orgânicas vs. semana anterior", time: "1 dia atrás", type: "report" },
      { id: "gl-f5", action: "Reels roteirizado e aprovado", detail: "Conteúdo sobre erros na habilitação — aprovado internamente, aguardando cliente", time: "1 dia atrás", type: "content" },
    ],
    weeklyContent: [
      { day: "Seg", date: "05", posts: [{ type: "Feed", platform: "Instagram", status: "Agendado" }] },
      { day: "Ter", date: "06", posts: [{ type: "Feed", platform: "Instagram", status: "Rascunho" }, { type: "Feed", platform: "LinkedIn", status: "Rascunho" }] },
      { day: "Qua", date: "07", posts: [{ type: "Reels", platform: "Instagram", status: "Rascunho" }] },
      { day: "Qui", date: "08", posts: [{ type: "Feed", platform: "LinkedIn", status: "Agendado" }] },
      { day: "Sex", date: "09", posts: [{ type: "Story", platform: "Instagram", status: "Agendado" }] },
      { day: "Sáb", date: "10", posts: [] },
      { day: "Dom", date: "11", posts: [] },
    ],
    metrics: [
      { label: "Alcance Orgânico", value: "18.4k", change: "+41%", positive: true },
      { label: "Leads gerados",    value: "67",    change: "+28%", positive: true },
      { label: "Engajamento",      value: "4,8%",  change: "+0,9p", positive: true },
      { label: "Custo/Lead",       value: "R$ 27", change: "-21%",  positive: true },
    ],
    contacts: [],
    pipeline: [],
    agentTasks: {
      copywriter: { current: "Escrevendo artigo 'Top 10 erros em licitações'", status: "trabalhando", recent: ["Guia de habilitação publicado", "3 legendas para campanha"], progress: 72 },
      traffic:    { current: "Otimizando segmentação LinkedIn Ads", status: "trabalhando", recent: ["CPA reduzido para R$ 27", "Novo público lookalike criado"], progress: 55 },
      analyst:    { current: "Compilando relatório mensal de abril", status: "trabalhando", recent: ["Análise semanal entregue", "Dashboard atualizado"], progress: 40 },
      social:     { current: "Agendando conteúdo da semana 19", status: "trabalhando", recent: ["8 posts publicados na semana 18", "Resposta a 23 comentários"], progress: 80 },
      strategist: { current: "Planejando pauta editorial de maio", status: "concluído", recent: ["Pauta de abril entregue", "Posicionamento B2B revisado"], progress: 100 },
      sales:      { current: "Qualificando 4 leads no WhatsApp", status: "trabalhando", recent: ["3 leads enviados para proposta", "Pipeline atualizado"], progress: 60 },
      designer:   { current: "Criando template de post para campanha", status: "trabalhando", recent: ["Identidade visual atualizada", "Banners LinkedIn criados"], progress: 45 },
      site:       { current: "Publicando artigo no blog", status: "trabalhando", recent: ["SEO otimizado para 3 páginas", "Blog atualizado"], progress: 65 },
      revisor:    { current: "Revisando artigo sobre habilitação", status: "concluído", recent: ["Guia B2B revisado", "Legendas corrigidas"], progress: 100 },
      briefing:   { current: "Diagnóstico inicial concluído", status: "concluído", recent: ["Briefing coletado", "Cenário de mercado analisado"], progress: 100 },
      calendario: { current: "Planejando calendário editorial de maio", status: "trabalhando", recent: ["Pilares de conteúdo definidos", "Mix 70-20-10 configurado"], progress: 60 },
      video:      { current: "Aguardando roteiros aprovados", status: "aguardando", recent: [], progress: 0 },
    },
    orchestratorStatus: "Coordenando publicação do artigo sobre nova lei e otimização das campanhas LinkedIn",
    orchestratorPlan: [
      { step: "Publicar artigo sobre nova lei de licitações no LinkedIn", done: false, active: true },
      { step: "Lançar campanha de e-mail para base de leads", done: false },
      { step: "Gravar Reels sobre erros na habilitação", done: false },
      { step: "Atualizar landing page com novos cases", done: false },
      { step: "Entregar relatório de abril para o cliente", done: false },
      { step: "Revisar estratégia para Q2 2025", done: false },
    ],
    portalPin: "GL4891",
    outputs: [
      { id: "gl-o1", name: "Artigo LinkedIn — Nova Lei de Licitações", type: "article", agent: "copywriter", createdAt: "03/05", preview: "A Lei nº 14.133/2021 trouxe mudanças estruturais para o mercado de licitações públicas. As empresas que ainda não se adaptaram enfrentam riscos reais de inabilitação. Neste artigo, detalhamos os 7 pontos críticos que todo fornecedor precisa conhecer...", platform: "LinkedIn", status: "revisão" },
      { id: "gl-o2", name: "Roteiro Reels — Erros na Habilitação", type: "copy", agent: "copywriter", createdAt: "02/05", preview: "CENA 1: 'Você sabia que 38% das empresas são eliminadas ainda na fase de habilitação?' CENA 2: Vou te mostrar os 3 erros mais comuns. ERRO 1: CND vencida na hora da abertura do envelope...", platform: "Instagram", status: "revisão" },
      { id: "gl-o3", name: "Relatório Semanal — Semana 18", type: "report", agent: "analyst", createdAt: "30/04", preview: "Semana 18 registrou crescimento de 34% nas impressões orgânicas. Alcance total: 18.400 pessoas. Destaques: artigo sobre pregão eletrônico atingiu 847 visualizações em 24h. LinkedIn Ads: 67 leads com CPA médio de R$ 27,46...", status: "aprovado" },
      { id: "gl-o4", name: "Sequência de E-mails — Nurturing B2B", type: "email", agent: "copywriter", createdAt: "29/04", preview: "E-mail 1 (Boas-vindas): Bem-vindo ao Grupo Licita. Nos próximos dias você vai receber conteúdo exclusivo sobre como ganhar mais contratos públicos. E-mail 2 (Educação): 5 documentos que nenhuma empresa pode esquecer...", status: "aprovado" },
      { id: "gl-o5", name: "Planejamento Editorial — Maio 2025", type: "plan", agent: "strategist", createdAt: "28/04", preview: "TEMA DO MÊS: Credenciamento e habilitação técnica. PILARES: (1) Educação sobre legislação, (2) Cases de sucesso, (3) Bastidores da consultoria. FREQUÊNCIA: 5x/semana Instagram + 3x/semana LinkedIn...", status: "publicado" },
    ],
    collabCampaigns: [
      {
        id: "gl-cc1", name: "Geração de Leads B2B — Maio", objective: "Captar empresas interessadas em consultoria de licitações", status: "ativa",
        platforms: ["LinkedIn Ads", "Meta Ads"],
        budget: "R$ 4.500", spent: "R$ 2.820", reach: "34.200", leads: 67, cpa: "R$ 42,09", roas: "—",
        startDate: "01/05/2025",
        phases: [
          { id: "p1", label: "Criação dos anúncios", agentId: "copywriter", status: "done", output: "3 variações de copy criadas e aprovadas" },
          { id: "p2", label: "Configuração das campanhas", agentId: "traffic", status: "done", output: "Campanhas ativas no LinkedIn e Meta" },
          { id: "p3", label: "Otimização de público", agentId: "traffic", status: "active", output: "Testando segmentação por cargo (Diretor/Gestor)" },
          { id: "p4", label: "Análise e relatório", agentId: "analyst", status: "pending" },
        ],
        remarketing: [
          { id: "r1", name: "Visitantes do site (30 dias)", size: "1.240", platform: "Meta", type: "website", status: "ativa", cpa: "R$ 18", leadsThisWeek: 8 },
          { id: "r2", name: "Lookalike — clientes atuais", size: "12.000", platform: "LinkedIn", type: "lookalike", status: "ativa", cpa: "R$ 35", leadsThisWeek: 5 },
        ],
        crmLeads: 67,
      },
    ],
  },
];

