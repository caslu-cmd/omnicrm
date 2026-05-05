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
      tomas:      { current: "LP de captação de leads para cursos aguardando briefing", status: "aguardando", recent: [], progress: 0 },
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

  // ── ABCER ─────────────────────────────────────────────────────
  {
    id: "abcer",
    name: "Abcer",
    industry: "Construção & Engenharia",
    color: "#60A5FA",
    initials: "AB",
    status: "Ativo",
    agentActive: true,
    postsMonth: 18,
    campaigns: 2,
    lastActivity: "Hoje",
    revenue: "R$ 3.500",
    nextAction: "Publicar cases de obras entregues",
    followers: { instagram: "4.8k", facebook: "6.2k" },
    recentPosts: [
      { id: "ab-p1", type: "Feed", caption: "Entrega da obra do condomínio Reserva Verde — 48 apartamentos concluídos no prazo e com acabamento premium. Orgulho do nosso time!", platform: "Instagram", scheduledFor: "06/05 às 10h", status: "Rascunho" },
      { id: "ab-p2", type: "Reels", caption: "Timelapse completo: da fundação à entrega em 60 segundos — veja como foi a construção do Edifício Centenário", platform: "Instagram", scheduledFor: "08/05 às 16h", status: "Rascunho" },
      { id: "ab-p3", type: "Feed", caption: "5 detalhes que fazem a diferença no acabamento de alto padrão — por dentro das obras da Abcer", platform: "LinkedIn", scheduledFor: "09/05 às 9h", status: "Agendado", likes: 0, reach: 0 },
    ],
    activeCampaigns: [
      { id: "ab-c1", name: "Captação de Projetos B2B", platform: "LinkedIn Ads", status: "Ativa", budget: "R$ 2.500", spent: "R$ 1.420", results: "38 leads", cpa: "R$ 37,37" },
      { id: "ab-c2", name: "Awareness Institucional", platform: "Facebook Ads", status: "Ativa", budget: "R$ 1.000", spent: "R$ 640", results: "24.600 alcance", cpa: "R$ 0,03" },
    ],
    agentFeed: [
      { id: "ab-f1", action: "Post de entrega de obra roteirizado", detail: "Case Condomínio Reserva Verde — conteúdo com fotos antes/depois, aguardando aprovação", time: "2h atrás", type: "content" },
      { id: "ab-f2", action: "38 leads B2B captados no mês", detail: "Perfil: construtoras, incorporadoras e PMEs do setor de construção civil", time: "5h atrás", type: "analysis" },
      { id: "ab-f3", action: "Campanha LinkedIn otimizada", detail: "CPA caiu de R$ 52 para R$ 37 após refinamento de segmentação por cargo", time: "7h atrás", type: "campaign" },
      { id: "ab-f4", action: "Artigo publicado no blog", detail: "Tendências em construção civil para 2025 — 980 leituras em 48h", time: "1 dia atrás", type: "content" },
      { id: "ab-f5", action: "Relatório mensal entregue", detail: "Abril: +67% de alcance orgânico, 38 leads, 4 propostas comerciais abertas", time: "2 dias atrás", type: "report" },
    ],
    weeklyContent: [
      { day: "Seg", date: "05", posts: [{ type: "Feed", platform: "Instagram", status: "Agendado" }] },
      { day: "Ter", date: "06", posts: [{ type: "Feed", platform: "Instagram", status: "Rascunho" }] },
      { day: "Qua", date: "07", posts: [{ type: "Story", platform: "Instagram", status: "Agendado" }] },
      { day: "Qui", date: "08", posts: [{ type: "Reels", platform: "Instagram", status: "Rascunho" }] },
      { day: "Sex", date: "09", posts: [{ type: "Feed", platform: "LinkedIn", status: "Agendado" }] },
      { day: "Sáb", date: "10", posts: [] },
      { day: "Dom", date: "11", posts: [] },
    ],
    metrics: [
      { label: "Leads B2B",      value: "38",    change: "+52%",  positive: true },
      { label: "Alcance",        value: "31.4k", change: "+67%",  positive: true },
      { label: "Engajamento",    value: "3,9%",  change: "+1,1p", positive: true },
      { label: "Custo/Lead",     value: "R$ 37", change: "-29%",  positive: true },
    ],
    contacts: [],
    pipeline: [],
    agentTasks: {
      copywriter: { current: "Escrevendo série de cases de obras entregues", status: "trabalhando", recent: ["Artigo tendências 2025 publicado", "Copy campanha LinkedIn pronto"], progress: 60 },
      traffic:    { current: "Otimizando segmentação LinkedIn por cargo/setor", status: "trabalhando", recent: ["CPA reduzido para R$ 37", "Novo público: incorporadoras SP"], progress: 72 },
      analyst:    { current: "Compilando relatório de abril", status: "concluído", recent: ["Relatório de março entregue", "Análise de concorrentes feita"], progress: 100 },
      social:     { current: "Gerenciando comentários e DMs", status: "trabalhando", recent: ["32 interações respondidas", "4 orçamentos solicitados via DM"], progress: 80 },
      strategist: { current: "Planejando estratégia de conteúdo Q2", status: "concluído", recent: ["Pauta de maio aprovada", "Posicionamento premium definido"], progress: 100 },
      sales:      { current: "Acompanhando 4 propostas abertas no CRM", status: "trabalhando", recent: ["2 reuniões agendadas", "Follow-up enviado para 12 leads"], progress: 50 },
      designer:   { current: "Produzindo artes para os cases de obra", status: "trabalhando", recent: ["Templates institucionais criados", "Banners LinkedIn prontos"], progress: 45 },
      site:       { current: "Publicando cases no blog/portfólio", status: "trabalhando", recent: ["Artigo publicado", "SEO otimizado para 8 palavras-chave"], progress: 55 },
      revisor:    { current: "Revisando copy das campanhas de maio", status: "concluído", recent: ["Artigo revisado e aprovado", "Anúncios corrigidos"], progress: 100 },
      tomas:      { current: "Estruturando LP de captação para projetos residenciais", status: "aguardando", recent: [], progress: 0 },
    },
    orchestratorStatus: "Coordenando publicação dos cases de obra e otimização das campanhas B2B no LinkedIn",
    orchestratorPlan: [
      { step: "Publicar case Condomínio Reserva Verde com fotos antes/depois", done: false, active: true },
      { step: "Lançar campanha de captação de novos projetos para Q2", done: false },
      { step: "Produzir timelapse das obras em andamento", done: false },
      { step: "Criar landing page de portfólio de obras", done: false },
      { step: "Estruturar programa de indicações entre clientes", done: false },
      { step: "Entregar relatório de desempenho de maio", done: false },
    ],
    portalPin: "AB9639",
    outputs: [
      { id: "ab-o1", name: "Post Case — Condomínio Reserva Verde", type: "post", agent: "copywriter", createdAt: "03/05", preview: "Entrega da obra do condomínio Reserva Verde em São Paulo — 48 apartamentos concluídos no prazo e com acabamento premium. Estrutura em concreto de alta resistência, esquadrias de alumínio com tratamento térmico e revestimento externo com textura premium.", platform: "Instagram", status: "revisão" },
      { id: "ab-o2", name: "Roteiro Reels — Timelapse Edifício Centenário", type: "copy", agent: "copywriter", createdAt: "02/05", preview: "ABERTURA: Logo Abcer + letreiro 'Do zero à entrega em 60 segundos'. SEQUÊNCIA: Terraplanagem (mês 1) → Fundação e estrutura (meses 2-4) → Alvenaria (meses 5-7) → Revestimentos e acabamento (meses 8-10) → Entrega das chaves (mês 12). ENCERRAMENTO: Construindo com excelência desde 2008.", platform: "Instagram", status: "revisão" },
      { id: "ab-o3", name: "Relatório Abril — Abcer", type: "report", agent: "analyst", createdAt: "30/04", preview: "Abril registrou crescimento de 67% no alcance orgânico. 38 leads B2B captados via LinkedIn Ads com CPA de R$ 37,37. 4 propostas comerciais abertas, totalizando R$ 1,8M em potencial de contrato. Destaque: artigo sobre tendências 2025 com 980 leituras.", status: "aprovado" },
      { id: "ab-o4", name: "Artigo Blog — Tendências Construção Civil 2025", type: "article", agent: "copywriter", createdAt: "29/04", preview: "O setor de construção civil passa por uma transformação acelerada. Em 2025, as construtoras que não incorporarem tecnologia BIM, materiais sustentáveis e processos industrializados perderão competitividade. Neste artigo, mapeamos as 6 tendências que vão moldar o mercado.", platform: "Blog", status: "publicado" },
    ],
    collabCampaigns: [
      {
        id: "ab-cc1", name: "Captação de Projetos B2B — Q2", objective: "Gerar leads qualificados de incorporadoras e construtoras",
        status: "ativa", platforms: ["LinkedIn Ads", "Meta Ads"],
        budget: "R$ 3.500", spent: "R$ 2.060", reach: "31.400", leads: 38, cpa: "R$ 54,21",
        startDate: "01/04/2025",
        phases: [
          { id: "p1", label: "Estratégia e personas B2B", agentId: "strategist", status: "done", output: "3 personas: Diretor de incorporadora, Engenheiro, Construtora PME" },
          { id: "p2", label: "Produção dos anúncios", agentId: "copywriter", status: "done", output: "2 variações de copy + 3 criativos institucionais" },
          { id: "p3", label: "Otimização de campanhas", agentId: "traffic", status: "active", output: "CPA reduzido de R$ 52 para R$ 37" },
          { id: "p4", label: "Análise e relatório", agentId: "analyst", status: "pending" },
        ],
        remarketing: [
          { id: "r1", name: "Visitantes do site (30 dias)", size: "890", platform: "Meta", type: "website", status: "ativa", cpa: "R$ 22", leadsThisWeek: 5 },
          { id: "r2", name: "Engajamento LinkedIn", size: "3.200", platform: "LinkedIn", type: "custom", status: "ativa", cpa: "R$ 31", leadsThisWeek: 4 },
        ],
        crmLeads: 38,
      },
    ],
  },

  // ── GNX ───────────────────────────────────────────────────────
  {
    id: "gnx",
    name: "GNX",
    industry: "Tecnologia & Inovação",
    color: "#FBBF24",
    initials: "GN",
    status: "Ativo",
    agentActive: true,
    postsMonth: 20,
    campaigns: 2,
    lastActivity: "Hoje",
    revenue: "R$ 4.200",
    nextAction: "Lançar campanha de produto novo",
    followers: { instagram: "7.3k", facebook: "5.1k" },
    recentPosts: [
      { id: "gn-p1", type: "Feed", caption: "Tecnologia que resolve problemas reais: solução que já ajudou mais de 200 empresas a reduzirem custos operacionais em até 40%", platform: "Instagram", scheduledFor: "06/05 às 11h", status: "Rascunho" },
      { id: "gn-p2", type: "Reels", caption: "Demo ao vivo da nossa plataforma — veja em 60 segundos o que levaria horas para fazer manualmente", platform: "Instagram", scheduledFor: "08/05 às 14h", status: "Rascunho" },
      { id: "gn-p3", type: "Feed", caption: "Case de sucesso: como a GNX ajudou uma empresa a reduzir 40% do tempo operacional", platform: "LinkedIn", scheduledFor: "09/05 às 10h", status: "Agendado", likes: 0, reach: 0 },
    ],
    activeCampaigns: [
      { id: "gn-c1", name: "Captação de Clientes B2B", platform: "LinkedIn Ads", status: "Ativa", budget: "R$ 3.000", spent: "R$ 1.780", results: "54 leads", cpa: "R$ 32,96" },
      { id: "gn-c2", name: "Brand Awareness Tech", platform: "Facebook Ads", status: "Ativa", budget: "R$ 1.200", spent: "R$ 730", results: "28.400 alcance", cpa: "R$ 0,03" },
    ],
    agentFeed: [
      { id: "gn-f1", action: "Demo de produto roteirizado para Reels", detail: "Vídeo de 60s mostrando a plataforma em ação — edição pronta, aguardando aprovação", time: "1h atrás", type: "content" },
      { id: "gn-f2", action: "54 leads qualificados no mês", detail: "Perfil: gerentes e diretores de operações em empresas de médio porte", time: "4h atrás", type: "analysis" },
      { id: "gn-f3", action: "Campanha LinkedIn otimizada", detail: "CTR subiu de 0,8% para 1,9% após troca do criativo principal", time: "6h atrás", type: "campaign" },
      { id: "gn-f4", action: "Case de sucesso publicado no blog", detail: "Como a empresa X economizou R$ 180k com a GNX — 1.340 leituras", time: "1 dia atrás", type: "content" },
      { id: "gn-f5", action: "Relatório de abril entregue", detail: "+43% de alcance orgânico, 54 leads, 6 demos agendados, 2 contratos fechados", time: "2 dias atrás", type: "report" },
    ],
    weeklyContent: [
      { day: "Seg", date: "05", posts: [{ type: "Feed", platform: "Instagram", status: "Agendado" }] },
      { day: "Ter", date: "06", posts: [{ type: "Feed", platform: "Instagram", status: "Rascunho" }] },
      { day: "Qua", date: "07", posts: [{ type: "Story", platform: "Instagram", status: "Agendado" }] },
      { day: "Qui", date: "08", posts: [{ type: "Reels", platform: "Instagram", status: "Rascunho" }] },
      { day: "Sex", date: "09", posts: [{ type: "Feed", platform: "LinkedIn", status: "Agendado" }] },
      { day: "Sáb", date: "10", posts: [] },
      { day: "Dom", date: "11", posts: [] },
    ],
    metrics: [
      { label: "Leads gerados",   value: "54",    change: "+61%",  positive: true },
      { label: "Alcance",         value: "36.1k", change: "+43%",  positive: true },
      { label: "Demos agend.",    value: "6",     change: "+4",    positive: true },
      { label: "Custo/Lead",      value: "R$ 33", change: "-31%",  positive: true },
    ],
    contacts: [],
    pipeline: [],
    agentTasks: {
      copywriter: { current: "Escrevendo e-book guia de automação para PMEs", status: "trabalhando", recent: ["Case de sucesso publicado", "Copy campanha LinkedIn pronto"], progress: 52 },
      traffic:    { current: "Escalando campanha de leads B2B", status: "trabalhando", recent: ["CTR melhorado para 1,9%", "Novo público lookalike criado"], progress: 68 },
      analyst:    { current: "Mapeando funil de conversão lead para demo", status: "trabalhando", recent: ["Relatório de abril entregue", "Análise de cohort criada"], progress: 45 },
      social:     { current: "Respondendo perguntas técnicas nos comentários", status: "trabalhando", recent: ["28 comentários respondidos", "3 demos agendados via DM"], progress: 75 },
      strategist: { current: "Planejando lançamento da nova funcionalidade", status: "concluído", recent: ["Estratégia de conteúdo Q2 aprovada", "Posicionamento revisado"], progress: 100 },
      sales:      { current: "Qualificando 6 leads prontos para demo", status: "trabalhando", recent: ["2 contratos fechados no mês", "Pipeline de R$ 380k em aberto"], progress: 60 },
      designer:   { current: "Produzindo assets para lançamento do produto", status: "trabalhando", recent: ["UI screenshots editados", "Infográficos de ROI criados"], progress: 40 },
      site:       { current: "Otimizando landing page de conversão", status: "trabalhando", recent: ["Blog post publicado", "Taxa de conversão da LP: 8,4%"], progress: 65 },
      revisor:    { current: "Revisando e-book e conteúdo do lançamento", status: "trabalhando", recent: ["Case revisado e publicado", "Anúncios aprovados"], progress: 55 },
      tomas:      { current: "Criando LP de lançamento da nova funcionalidade", status: "trabalhando", recent: ["Estrutura de seções definida"], progress: 30 },
    },
    orchestratorStatus: "Preparando o lançamento da nova funcionalidade e escalando as campanhas de captação B2B",
    orchestratorPlan: [
      { step: "Publicar demo em Reels e distribuir no LinkedIn", done: false, active: true },
      { step: "Lançar campanha oficial do novo produto", done: false },
      { step: "Publicar e-book como isca para geração de leads", done: false },
      { step: "Configurar sequência de e-mails de nurturing para demos", done: false },
      { step: "Criar programa de cases com clientes atuais", done: false },
      { step: "Entregar relatório de performance do lançamento", done: false },
    ],
    portalPin: "GN5247",
    outputs: [
      { id: "gn-o1", name: "Roteiro Reels — Demo da Plataforma", type: "copy", agent: "copywriter", createdAt: "03/05", preview: "GANCHO: O que levava 4 horas agora leva 8 minutos. DEMONSTRAÇÃO: Tela da plataforma em tempo real — importação de dados, processamento automático, dashboard de resultados. SOCIAL PROOF: Mais de 200 empresas já usam. CALL TO ACTION: Link na bio para agendar sua demo gratuita.", platform: "Instagram", status: "revisão" },
      { id: "gn-o2", name: "Copy Campanha LinkedIn — Novo Produto", type: "ad", agent: "copywriter", createdAt: "02/05", preview: "HEADLINE: Sua equipe perdendo horas com processos manuais? CORPO: A GNX automatiza operações repetitivas e entrega resultados em minutos. Empresas já reduziram custos em 40% no primeiro mês. Sem necessidade de TI. Resultado em 30 dias. Agende sua demo gratuita.", platform: "LinkedIn Ads", status: "revisão" },
      { id: "gn-o3", name: "Relatório Abril — GNX", type: "report", agent: "analyst", createdAt: "30/04", preview: "Abril foi o melhor mês em geração de leads: 54 qualificados, CPA de R$ 32,96, 6 demos agendados, 2 contratos fechados (R$ 84k ARR). Alcance orgânico: +43%. Destaques: case de sucesso gerou 1.340 leituras e 8 leads inbound.", status: "aprovado" },
      { id: "gn-o4", name: "Case de Sucesso — Cliente e GNX", type: "article", agent: "copywriter", createdAt: "29/04", preview: "A empresa processava 800 pedidos por dia de forma manual, com equipe de 6 pessoas e taxa de erro de 12%. Após implementar a plataforma GNX, o processamento passou a ser automático, a equipe foi realocada para tarefas estratégicas e os erros caíram para 0,3%.", platform: "Blog", status: "publicado" },
    ],
    collabCampaigns: [
      {
        id: "gn-cc1", name: "Lançamento Nova Funcionalidade — Maio", objective: "Gerar demos e conversões para o novo módulo da plataforma",
        status: "ativa", platforms: ["LinkedIn Ads", "Meta Ads"],
        budget: "R$ 4.200", spent: "R$ 2.510", reach: "36.100", leads: 54, cpa: "R$ 46,48",
        startDate: "01/05/2025",
        phases: [
          { id: "p1", label: "Estratégia de lançamento", agentId: "strategist", status: "done", output: "Funil completo: anúncio, LP, demo, proposta" },
          { id: "p2", label: "Produção de conteúdo", agentId: "copywriter", status: "done", output: "Demo em vídeo + 3 casos de uso documentados" },
          { id: "p3", label: "Veiculação e otimização", agentId: "traffic", status: "active", output: "CTR 1,9% — acima da média do setor (0,9%)" },
          { id: "p4", label: "Análise pós-lançamento", agentId: "analyst", status: "pending" },
        ],
        remarketing: [
          { id: "r1", name: "Visitantes da página de produto", size: "1.420", platform: "Meta", type: "website", status: "ativa", cpa: "R$ 18", leadsThisWeek: 9 },
          { id: "r2", name: "Conexões do LinkedIn da empresa", size: "4.800", platform: "LinkedIn", type: "custom", status: "ativa", cpa: "R$ 28", leadsThisWeek: 6 },
        ],
        crmLeads: 54,
      },
    ],
  },

  // ── CALU AGÊNCIA ──────────────────────────────────────────────
  {
    id: "calu-agencia",
    name: "Calu Agência",
    industry: "Marketing Digital & IA",
    color: "#B9FF4B",
    initials: "CA",
    status: "Ativo",
    agentActive: true,
    postsMonth: 25,
    campaigns: 2,
    lastActivity: "Hoje",
    revenue: "—",
    nextAction: "Lançar campanha de captação de novos clientes",
    followers: { instagram: "5.6k", facebook: "3.8k" },
    recentPosts: [
      { id: "ca-p1", type: "Feed", caption: "Enquanto você lê esse post, nossos agentes de IA já publicaram 3 posts, responderam 18 comentários e otimizaram 2 campanhas para nossos clientes. Marketing que não para.", platform: "Instagram", scheduledFor: "06/05 às 9h", status: "Rascunho" },
      { id: "ca-p2", type: "Reels", caption: "Bastidores da Calu Agência: veja como funcionam os agentes de IA que trabalham 24h pelos nossos clientes", platform: "Instagram", scheduledFor: "07/05 às 14h", status: "Rascunho" },
      { id: "ca-p3", type: "Feed", caption: "Resultado real: cliente do setor de tecnologia triplicou os leads em 60 dias com nossa metodologia de marketing com IA", platform: "LinkedIn", scheduledFor: "08/05 às 10h", status: "Agendado", likes: 0, reach: 0 },
    ],
    activeCampaigns: [
      { id: "ca-c1", name: "Captação Novos Clientes", platform: "Facebook Ads", status: "Ativa", budget: "R$ 2.000", spent: "R$ 1.180", results: "47 leads", cpa: "R$ 25,11" },
      { id: "ca-c2", name: "Autoridade em IA para Negócios", platform: "LinkedIn Ads", status: "Ativa", budget: "R$ 1.500", spent: "R$ 820", results: "19.200 alcance", cpa: "R$ 0,04" },
    ],
    agentFeed: [
      { id: "ca-f1", action: "Conteúdo sobre bastidores da IA roteirizado", detail: "Reels mostrando os agentes trabalhando em tempo real — alto potencial de engajamento", time: "1h atrás", type: "content" },
      { id: "ca-f2", action: "47 leads captados para a agência no mês", detail: "Perfil: donos de PME e gestores de marketing interessados em IA", time: "3h atrás", type: "analysis" },
      { id: "ca-f3", action: "Campanha de captação otimizada", detail: "CPA caiu de R$ 38 para R$ 25 após ajuste de público e criativo", time: "5h atrás", type: "campaign" },
      { id: "ca-f4", action: "Case de cliente publicado no LinkedIn", detail: "Cliente triplicou leads em 60 dias — 2.100 impressões em 12h", time: "1 dia atrás", type: "content" },
      { id: "ca-f5", action: "Relatório de abril entregue", detail: "+58% de alcance orgânico, 47 leads, 8 propostas enviadas, 3 contratos fechados", time: "2 dias atrás", type: "report" },
    ],
    weeklyContent: [
      { day: "Seg", date: "05", posts: [{ type: "Feed", platform: "Instagram", status: "Agendado" }] },
      { day: "Ter", date: "06", posts: [{ type: "Feed", platform: "Instagram", status: "Rascunho" }] },
      { day: "Qua", date: "07", posts: [{ type: "Reels", platform: "Instagram", status: "Rascunho" }] },
      { day: "Qui", date: "08", posts: [{ type: "Feed", platform: "LinkedIn", status: "Agendado" }] },
      { day: "Sex", date: "09", posts: [{ type: "Story", platform: "Instagram", status: "Agendado" }, { type: "Feed", platform: "Instagram", status: "Agendado" }] },
      { day: "Sáb", date: "10", posts: [{ type: "Story", platform: "Instagram", status: "Agendado" }] },
      { day: "Dom", date: "11", posts: [] },
    ],
    metrics: [
      { label: "Leads agência",   value: "47",    change: "+73%",  positive: true },
      { label: "Alcance",         value: "24.8k", change: "+58%",  positive: true },
      { label: "Propostas env.",  value: "8",     change: "+5",    positive: true },
      { label: "Custo/Lead",      value: "R$ 25", change: "-34%",  positive: true },
    ],
    contacts: [],
    pipeline: [],
    agentTasks: {
      copywriter: { current: "Escrevendo série sobre IA no marketing", status: "trabalhando", recent: ["Case de cliente publicado", "3 posts sobre IA e resultados criados"], progress: 55 },
      traffic:    { current: "Otimizando campanhas de captação", status: "trabalhando", recent: ["CPA de R$ 25 atingido", "Público PME refinado"], progress: 70 },
      analyst:    { current: "Analisando funil de conversão lead para proposta", status: "trabalhando", recent: ["Relatório de abril entregue", "Taxa de conversão: 6,4%"], progress: 50 },
      social:     { current: "Engajando com potenciais clientes nas redes", status: "trabalhando", recent: ["38 interações respondidas", "5 leads via comentários"], progress: 80 },
      strategist: { current: "Estruturando estratégia de crescimento para Q2", status: "concluído", recent: ["Proposta de valor revisada", "ICP atualizado para 2025"], progress: 100 },
      sales:      { current: "Conduzindo 8 propostas em andamento", status: "trabalhando", recent: ["3 contratos fechados no mês", "R$ 12.500 em MRR gerado"], progress: 65 },
      designer:   { current: "Criando materiais de apresentação para clientes", status: "trabalhando", recent: ["Deck de vendas atualizado", "Portfólio de cases criado"], progress: 45 },
      site:       { current: "Atualizando cases e depoimentos no site", status: "trabalhando", recent: ["3 cases novos publicados", "SEO para agência de marketing com IA"], progress: 60 },
      revisor:    { current: "Revisando proposta comercial para novos clientes", status: "concluído", recent: ["Deck revisado e aprovado", "E-mails de nurturing revisados"], progress: 100 },
      tomas:      { current: "LP de captação pronta — aguardando aprovação", status: "concluído", recent: ["Copy escrito pela Beatriz", "Design spec definido", "HTML gerado e entregue"], progress: 100 },
    },
    orchestratorStatus: "Coordenando produção de conteúdo sobre IA e campanhas de captação de novos clientes para a agência",
    orchestratorPlan: [
      { step: "Publicar Reels mostrando os agentes de IA em ação", done: false, active: true },
      { step: "Lançar campanha de captação com foco em PMEs", done: false },
      { step: "Publicar 3 novos cases de clientes com resultados reais", done: false },
      { step: "Criar landing page para pacotes de serviço", done: false },
      { step: "Estruturar programa de indicação entre clientes", done: false },
      { step: "Atingir R$ 20k em MRR até o fim do mês", done: false },
    ],
    portalPin: "CA3851",
    outputs: [
      { id: "ca-o1", name: "Roteiro Reels — Bastidores dos Agentes IA", type: "copy", agent: "copywriter", createdAt: "03/05", preview: "GANCHO: São 3h da manhã. Enquanto você dorme, nossos agentes já publicaram 2 posts, responderam 12 DMs e otimizaram 3 campanhas para os nossos clientes. DESENVOLVIMENTO: Tela ao vivo de cada agente trabalhando. CALL TO ACTION: Quer um time assim? Link na bio.", platform: "Instagram", status: "revisão" },
      { id: "ca-o2", name: "Post LinkedIn — Case Cliente Triplicou Leads", type: "post", agent: "copywriter", createdAt: "02/05", preview: "Em 60 dias, um dos nossos clientes saiu de 18 leads/mês para 54 leads/mês. O que mudou? A estratégia de conteúdo + tráfego pago gerenciada pelos nossos agentes de IA. Vou detalhar o que foi feito em 5 passos.", platform: "LinkedIn", status: "revisão" },
      { id: "ca-o3", name: "Relatório Abril — Calu Agência", type: "report", agent: "analyst", createdAt: "30/04", preview: "Abril foi o melhor mês da agência: 47 leads captados, CPA de R$ 25,11, 8 propostas enviadas, 3 contratos fechados (R$ 12.500 em MRR). Alcance orgânico +58%.", status: "aprovado" },
      { id: "ca-o4", name: "Planejamento Editorial — Maio 2025", type: "plan", agent: "strategist", createdAt: "28/04", preview: "TEMA DO MÊS: Transparência e resultados reais. PILARES: (1) Bastidores da agência, (2) Cases com números reais, (3) Educação sobre IA no marketing. META: 60 leads, 10 propostas, 5 novos contratos.", status: "publicado" },
    ],
    collabCampaigns: [
      {
        id: "ca-cc1", name: "Captação de Clientes — Maio 2025", objective: "Atrair PMEs interessadas em marketing com inteligência artificial",
        status: "ativa", platforms: ["Meta Ads", "LinkedIn Ads"],
        budget: "R$ 3.500", spent: "R$ 2.000", reach: "44.000", leads: 47, cpa: "R$ 42,55",
        startDate: "01/05/2025",
        phases: [
          { id: "p1", label: "Definição de ICP e proposta de valor", agentId: "strategist", status: "done", output: "ICP 2025: PMEs com faturamento R$ 500k-5M que investem em marketing" },
          { id: "p2", label: "Produção de criativos e copy", agentId: "copywriter", status: "done", output: "3 anúncios com casos reais + vídeo de 30s" },
          { id: "p3", label: "Veiculação e otimização", agentId: "traffic", status: "active", output: "CPA reduzido de R$ 38 para R$ 25 em 10 dias" },
          { id: "p4", label: "Análise e escala", agentId: "analyst", status: "pending" },
        ],
        remarketing: [
          { id: "r1", name: "Visitantes do site caluagencia.com.br", size: "2.800", platform: "Meta", type: "website", status: "ativa", cpa: "R$ 14", leadsThisWeek: 11 },
          { id: "r2", name: "Seguidores que interagiram (90d)", size: "3.100", platform: "Meta", type: "custom", status: "ativa", cpa: "R$ 19", leadsThisWeek: 7 },
        ],
        crmLeads: 47,
      },
    ],
  },
];
