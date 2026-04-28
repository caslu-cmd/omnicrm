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
    postsMonth: 20,
    campaigns: 2,
    lastActivity: "há 1h",
    revenue: "R$ 3.800",
    portalPin: "GL2025",
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
    orchestratorStatus: "Coordenando produção de conteúdo autoridade + otimização das campanhas B2B desta semana",
    orchestratorPlan: [
      { step: "Análise de métricas da semana anterior", done: true },
      { step: "Briefing do artigo LinkedIn para Beatriz", done: true },
      { step: "Revisão da segmentação das campanhas com Rafaela", done: true },
      { step: "Publicação do artigo e agendamento da semana", done: false, active: true },
      { step: "Relatório de performance para Calu Agência", done: false },
      { step: "Pauta editorial de maio com Carolina", done: false },
    ],
    agentTasks: {
      copywriter: {
        current: "Rascunhando artigo LinkedIn: 'Nova Lei de Licitações: 5 pontos que toda empresa precisa saber'",
        status: "trabalhando",
        recent: ["3 legendas para Instagram (autoridade)", "Copy do anúncio LinkedIn Ads — versão B"],
        progress: 68,
      },
      traffic: {
        current: "Otimizando CPA da campanha LinkedIn — ajustando lances por segmento de cargo",
        status: "trabalhando",
        recent: ["Pausou conjunto de anúncios com CPA > R$ 20", "Subiu orçamento da campanha Google em 15%"],
        progress: 45,
      },
      analyst: {
        current: "Compilando relatório semanal: alcance, leads e custo por conversão",
        status: "concluído",
        recent: ["Relatório semanal 21/04 entregue", "Dashboard de métricas atualizado"],
        progress: 100,
      },
      social: {
        current: "Agendando os 5 posts da semana no Instagram e LinkedIn",
        status: "trabalhando",
        recent: ["Stories seg–sex programados (9h e 19h)", "Respondeu 12 comentários no LinkedIn"],
        progress: 80,
      },
      strategist: {
        current: "Definindo pauta editorial de maio com foco em sazonalidade de licitações",
        status: "aguardando",
        recent: ["Análise de concorrentes Q2 concluída", "Repositório de brand voice atualizado"],
        progress: 0,
      },
      sales: {
        current: "Respondendo 3 leads no WhatsApp interessados no curso Nova Lei 14.133 — qualificando perfil",
        status: "trabalhando",
        recent: ["Converteu Ana Beatriz (curso Nova Lei) → adicionada ao CRM como Qualificada", "Enviou proposta de parcelamento para Grupo ABC"],
        progress: 60,
      },
      designer: {
        current: "Criando carrossel visual para o artigo 'Nova Lei de Licitações' — 6 slides no formato 1080×1080",
        status: "trabalhando",
        recent: ["Template de Stories (9×16) com identidade do Grupo Licita", "Banner LinkedIn para campanha B2B — 2 versões"],
        progress: 72,
      },
      site: {
        current: "Atualizando página 'Serviços' com novos textos sobre a Nova Lei 14.133",
        status: "trabalhando",
        recent: ["Corrigiu links quebrados na página Sobre", "Adicionou seção de depoimentos na Home"],
        progress: 55,
      },
      revisor: {
        current: "Revisando artigo LinkedIn antes da publicação — verificando ortografia e estrutura",
        status: "trabalhando",
        recent: ["Corrigiu 4 erros no copy do anúncio LinkedIn", "Reestruturou 2 legendas de baixo engajamento"],
        progress: 82,
      },
    },
    contacts: [
      { id: "ct1", name: "Marcos Almeida", company: "ABC Construções", role: "Gerente de Compras", email: "marcos@abcconstrucoes.com.br", status: "Lead", lastContact: "hoje", tags: ["quente", "licitação"] },
      { id: "ct2", name: "Sandra Costa", company: "Grupo XYZ", role: "Diretora Administrativa", email: "sandra@grupoxyz.com.br", status: "Cliente", lastContact: "há 2 dias", tags: ["recorrente"] },
      { id: "ct3", name: "Roberto Pereira", company: "Construtora Pereira", role: "Sócio-Fundador", email: "roberto@construtorap.com.br", status: "Qualificado", lastContact: "há 4 dias", tags: ["proposta enviada"] },
      { id: "ct4", name: "Fernanda Lima", company: "Prefeitura de Jundiaí", role: "Coord. de Licitações", email: "fernanda.lima@jundiai.sp.gov.br", status: "Lead", lastContact: "há 1 sem", tags: ["público", "frio"] },
      { id: "ct5", name: "Carlos Eduardo Matos", company: "CE Tecnologia", role: "CEO", email: "ce@cetecnologia.com.br", status: "Qualificado", lastContact: "há 3 dias", tags: ["tech", "B2B"] },
      { id: "ct6", name: "Daniela Ramos", company: "Ramos & Associados", role: "Sócia", email: "daniela@ramosadv.com.br", status: "Cliente", lastContact: "há 1 sem", tags: ["jurídico", "recorrente"] },
    ],
    courses: [
      {
        id: "curso-lei-14133",
        name: "Nova Lei de Licitações 14.133",
        tagline: "Domine a legislação que mudou o jogo das compras públicas",
        modality: "Online Ao Vivo",
        duration: "8 horas (2 encontros de 4h)",
        price: "R$ 497",
        installments: "até 6× de R$ 82,83",
        targetAudience: "Gestores públicos, fornecedores, advogados e equipes de compras",
        certificate: "Certificado de conclusão (8h) + declaração de participação",
        nextDate: "10/05/2025",
        spots: 40,
        enrolled: 27,
        instructor: "Dr. Marcos Licita — 15 anos em licitações públicas",
        topics: [
          "Principais mudanças em relação à Lei 8.666",
          "Novas modalidades: diálogo competitivo e credenciamento",
          "Gestão de contratos e penalidades",
          "Critérios de desempate e sustentabilidade",
          "Prazos e fluxos do processo licitatório",
          "Casos práticos e jurisprudência",
        ],
        includes: ["Material em PDF", "Gravação das aulas por 6 meses", "Grupo exclusivo de alunos", "Certificado digital"],
        whatsappGroupId: "120363001@g.us",
      },
      {
        id: "curso-gestao-contratos",
        name: "Gestão de Contratos Públicos",
        tagline: "Do contrato assinado à execução sem riscos",
        modality: "Online Ao Vivo",
        duration: "12 horas (3 encontros de 4h)",
        price: "R$ 697",
        installments: "até 6× de R$ 116,17",
        targetAudience: "Fiscais de contrato, gestores e equipes jurídicas",
        certificate: "Certificado de 12h reconhecido por órgãos públicos",
        nextDate: "17/05/2025",
        spots: 30,
        enrolled: 18,
        instructor: "Dra. Sandra Gestão — Especialista em contratos administrativos",
        topics: [
          "Formalização e apostilamento de contratos",
          "Responsabilidades do fiscal de contrato",
          "Reequilíbrio econômico-financeiro",
          "Aditivos e prorrogações",
          "Rescisão contratual e penalidades",
          "Relatórios e prestação de contas",
        ],
        includes: ["Templates de documentos editáveis", "Checklist do fiscal de contratos", "Acesso vitalício ao material", "Certificado digital"],
        whatsappGroupId: "120363002@g.us",
      },
      {
        id: "curso-elaboracao-editais",
        name: "Elaboração de Editais",
        tagline: "Crie editais blindados contra recursos e impugnações",
        modality: "Gravado",
        duration: "6 horas (acesso imediato)",
        price: "R$ 297",
        installments: "até 3× de R$ 99",
        targetAudience: "Agentes de contratação, pregoeiros e assessores jurídicos",
        certificate: "Certificado de conclusão digital",
        nextDate: "Disponível agora",
        spots: 999,
        enrolled: 143,
        instructor: "Dr. Paulo Edital — Pregoeiro com 12 anos de experiência",
        topics: [
          "Estrutura obrigatória do edital pela Lei 14.133",
          "Definição do objeto e especificações técnicas",
          "Critérios de habilitação e qualificação",
          "Impugnações e recursos: como blindar o edital",
          "Condições de pagamento e garantias",
          "Revisão de editais reais comentados",
        ],
        includes: ["Modelos de editais editáveis (Word)", "Checklist de elaboração", "Acesso vitalício", "Certificado digital"],
      },
      {
        id: "curso-recursos-impugnacoes",
        name: "Recursos e Impugnações",
        tagline: "Defenda sua empresa e não perca mais licitações por tecnicidade",
        modality: "Online Ao Vivo",
        duration: "4 horas (1 encontro intensivo)",
        price: "R$ 197",
        installments: "à vista",
        targetAudience: "Fornecedores, empresas participantes de licitações e advogados",
        certificate: "Declaração de participação",
        nextDate: "24/05/2025",
        spots: 50,
        enrolled: 31,
        instructor: "Dr. Marcos Licita",
        topics: [
          "Quando e como impugnar um edital",
          "Fundamentos jurídicos dos recursos",
          "Prazos e formalidades obrigatórios",
          "Recursos contra classificação e habilitação",
          "Casos reais vencidos e perdidos",
        ],
        includes: ["Modelos de recursos e impugnações", "Gravação por 3 meses", "Declaração de participação"],
        whatsappGroupId: "120363003@g.us",
      },
      {
        id: "curso-me-epp",
        name: "Licitações para ME e EPP",
        tagline: "Use todos os benefícios da LC 123 para vencer mais licitações",
        modality: "Gravado",
        duration: "4 horas (acesso imediato)",
        price: "R$ 197",
        installments: "à vista",
        targetAudience: "Micro e pequenas empresas que participam ou querem participar de licitações",
        certificate: "Certificado de conclusão digital",
        nextDate: "Disponível agora",
        spots: 999,
        enrolled: 89,
        instructor: "Dra. Fernanda ME — Consultora de benefícios para PMEs",
        topics: [
          "Benefícios exclusivos da LC 123/06",
          "Tratamento diferenciado nas licitações",
          "Empate ficto e direito de cobertura",
          "Subcontratação e cota reservada",
          "Regularização fiscal para participar",
        ],
        includes: ["Material didático em PDF", "Acesso vitalício", "Certificado digital"],
      },
    ],
    whatsappLeads: [
      {
        id: "wl1",
        name: "Ana Beatriz Santos",
        number: "+55 11 98765-4321",
        courseId: "curso-lei-14133",
        message: "Oi! Vi o post sobre o curso da nova lei. Quando começa a próxima turma e tem parcelamento?",
        time: "há 5min",
        stage: "qualificacao",
        addedToCrm: true,
      },
      {
        id: "wl2",
        name: "Roberto Alves",
        number: "+55 21 97654-3210",
        courseId: "curso-gestao-contratos",
        message: "Sou fiscal de contrato há 2 anos, esse curso serve pra mim? Tem certificado válido?",
        time: "há 23min",
        stage: "prospeccao",
        addedToCrm: false,
      },
      {
        id: "wl3",
        name: "Construtora Pinheiro",
        number: "+55 31 96543-2109",
        courseId: "curso-recursos-impugnacoes",
        message: "Perdemos uma licitação por recurso da concorrência. Preciso entender como defender. Quando é o próximo?",
        time: "há 1h",
        stage: "negociacao",
        addedToCrm: true,
      },
      {
        id: "wl4",
        name: "Maria Fernanda Costa",
        number: "+55 11 95432-1098",
        courseId: "curso-me-epp",
        message: "Tenho uma MEI e quero começar a licitar. Por onde começo? O curso de ME serve?",
        time: "há 2h",
        stage: "prospeccao",
        addedToCrm: false,
      },
    ],
    pipeline: [
      { id: "d1", title: "Assessoria Mensal Completa", contact: "Sandra Costa", value: "R$ 5.000/mês", stage: "ganho", probability: 100, dueDate: "01/05" },
      { id: "d2", title: "Consultoria em Licitação", contact: "Roberto Pereira", value: "R$ 8.000", stage: "negociacao", probability: 75, dueDate: "05/05" },
      { id: "d3", title: "Workshop Gestão de Contratos", contact: "Marcos Almeida", value: "R$ 12.000", stage: "proposta", probability: 55, dueDate: "10/05" },
      { id: "d4", title: "Curso Nova Lei de Licitações", contact: "Fernanda Lima", value: "R$ 3.500", stage: "qualificacao", probability: 30, dueDate: "15/05" },
      { id: "d5", title: "Plano Anual de Assessoria", contact: "Carlos Eduardo Matos", value: "R$ 48.000/ano", stage: "prospeccao", probability: 15, dueDate: "30/05" },
    ],
    outputs: [
      { id: "gl-o1", agent: "copywriter", name: "Artigo LinkedIn — Nova Lei de Licitações", type: "article", createdAt: "hoje, 14h", platform: "LinkedIn", status: "revisão", preview: "A Nova Lei de Licitações (14.133/21) trouxe mudanças estruturais que toda empresa fornecedora precisa conhecer. Neste artigo, vamos explorar os 5 pontos mais críticos que impactam diretamente o processo de habilitação e julgamento de propostas..." },
      { id: "gl-o2", agent: "copywriter", name: "Legenda Instagram — Post Autoridade", type: "post", createdAt: "hoje, 10h", platform: "Instagram", status: "aprovado", preview: "Você sabia que a maioria das empresas perde licitações por erros evitáveis na documentação? 🔎 Separamos os 3 erros mais comuns e como você pode corrigi-los agora..." },
      { id: "gl-o3", agent: "copywriter", name: "Copy LinkedIn Ads — Versão B", type: "ad", createdAt: "ontem", platform: "LinkedIn Ads", status: "aprovado", preview: "Sua empresa já perdeu contratos por desconhecer a Nova Lei 14.133? Nossa consultoria especializada transforma sua equipe em especialistas em licitações públicas. Saiba mais." },
      { id: "gl-o4", agent: "designer", name: "Carrossel — Nova Lei de Licitações (6 slides)", type: "design", createdAt: "hoje, 11h", platform: "Instagram", status: "revisão", preview: "Carrossel visual 1080×1080px com identidade Grupo Licita. Slides: Capa / 5 erros comuns / Lei 14.133 em 3 pontos / Benefícios da assessoria / CTA." },
      { id: "gl-o5", agent: "designer", name: "Banner LinkedIn Ads — 2 variações", type: "design", createdAt: "ontem", platform: "LinkedIn Ads", status: "publicado", preview: "Banner 1200×628px em duas versões (azul escuro e branco). Ambas aprovadas pelo cliente e ativas nas campanhas B2B." },
      { id: "gl-o6", agent: "analyst", name: "Relatório Semanal 21/04 — Métricas", type: "report", createdAt: "21/04", status: "publicado", preview: "Alcance total: 28.400 impressões (+12%). Engajamento: 4,8% (benchmark: 3,2%). Leads gerados: 14 via LinkedIn. CPA médio: R$ 18,60. Campanha Google: ROAS 3,8×." },
      { id: "gl-o7", agent: "strategist", name: "Pauta Editorial — Maio/2025", type: "plan", createdAt: "ontem", status: "aprovado", preview: "Semana 1: Sazonalidade de licitações em maio. Semana 2: Habilitação jurídica pós Nova Lei. Semana 3: Case de sucesso — cliente ganhou contrato de R$ 380k. Semana 4: Dicas para ME/EPP." },
      { id: "gl-o8", agent: "social", name: "Calendário de Posts — Semana 28/04", type: "plan", createdAt: "hoje, 9h", platform: "Instagram / LinkedIn", status: "aprovado", preview: "Seg: Carrossel nova lei. Ter: Story bastidores. Qua: Reels dica rápida. Qui: Post autoridade. Sex: Story enquete. 5 publicações agendadas via plataforma." },
      { id: "gl-o9", agent: "sales", name: "Mensagem de Follow-up — Leads WhatsApp", type: "copy", createdAt: "hoje, 15h", platform: "WhatsApp", status: "aprovado", preview: "Olá [nome]! 👋 Aqui é o Eduardo do Grupo Licita. Vi que você se interessou pelo Curso Nova Lei 14.133. Tenho uma oferta especial para fechar ainda esta semana — posso te contar mais?" },
      { id: "gl-o10", agent: "site", name: "Texto — Página Serviços (revisado)", type: "copy", createdAt: "hoje, 13h", status: "revisão", preview: "Oferecemos assessoria completa em licitações públicas, desde a análise de editais até a gestão de contratos. Nossa metodologia exclusiva elevou a taxa de vitória dos nossos clientes em até 340% no último ano." },
    ],
    collabCampaigns: [
      {
        id: "cc1", name: "Autoridade B2B — Licitações Públicas",
        objective: "Gerar leads qualificados (diretores e gestores de compras) e posicionar Grupo Licita como referência no setor",
        status: "ativa", platforms: ["LinkedIn Ads", "Google Ads", "Instagram"],
        budget: "R$ 3.200/mês", spent: "R$ 1.830", reach: "48.200", leads: 94, cpa: "R$ 12,23", roas: "4,8×",
        startDate: "01/04/2025", crmLeads: 28,
        phases: [
          { id: "p1", label: "Estratégia & Posicionamento", agentId: "strategist", status: "done", output: "Pauta editorial + posicionamento de marca aprovado pelo cliente" },
          { id: "p2", label: "Copy & Roteiros", agentId: "copywriter", status: "done", output: "3 versões de anúncio LinkedIn, landing page copy, artigo autoridade" },
          { id: "p3", label: "Criação Visual", agentId: "designer", status: "done", output: "Banner LinkedIn 1200×628px (2 variações), carrossel Instagram 6 slides" },
          { id: "p4", label: "Configuração de Anúncios", agentId: "traffic", status: "active", output: "Campanhas LinkedIn + Google ativas — otimizando segmentação por cargo" },
          { id: "p5", label: "Publicação Orgânica", agentId: "social", status: "active", output: "3 posts por semana no Instagram + 2 artigos por mês no LinkedIn" },
          { id: "p6", label: "Remarketing & Retargeting", agentId: "traffic", status: "pending", output: null },
          { id: "p7", label: "Nutrição CRM — WhatsApp", agentId: "sales", status: "pending", output: null },
        ],
        remarketing: [
          { id: "r1", name: "Visitantes do Site (últimos 30 dias)", size: "1.240 pessoas", platform: "Google Ads", type: "website", status: "ativa", cpa: "R$ 8,40", leadsThisWeek: 6 },
          { id: "r2", name: "Engajados com Posts LinkedIn", size: "3.800 pessoas", platform: "LinkedIn Ads", type: "custom", status: "ativa", cpa: "R$ 14,20", leadsThisWeek: 9 },
          { id: "r3", name: "Lookalike — Clientes Atuais", size: "22.000 pessoas", platform: "LinkedIn Ads", type: "lookalike", status: "ativa", cpa: "R$ 11,80", leadsThisWeek: 12 },
          { id: "r4", name: "Visualizadores do Vídeo 75%+", size: "680 pessoas", platform: "Instagram", type: "video", status: "pausada" },
        ],
      },
    ],
  },

  // ── ABCER ────────────────────────────────────────────────────
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
    portalPin: "AB2025",
    nextAction: "Divulgar evento de networking de maio",
    followers: { instagram: "5,8k", facebook: "9,3k" },
    recentPosts: [
      { id: "p1", type: "Feed", caption: "Participe do nosso Encontro de Líderes — vagas limitadas!", platform: "Instagram", scheduledFor: "Hoje 18h", status: "Agendado" },
      { id: "p2", type: "Reels", caption: "Veja como foi o último evento da ABCER 🎤", platform: "Instagram", scheduledFor: "Ontem", status: "Publicado", likes: 312, reach: 4200 },
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
    orchestratorStatus: "Priorizando divulgação do Encontro de Líderes (maio) e captação de novos associados",
    orchestratorPlan: [
      { step: "Briefing do evento Encontro de Líderes", done: true },
      { step: "Criação dos 3 criativos para Facebook Ads", done: true },
      { step: "Copy de convite e email marketing", done: true },
      { step: "Campanha de remarketing para ex-associados", done: false, active: true },
      { step: "Cobertura ao vivo do evento (01/05)", done: false },
      { step: "Relatório de captação pós-evento", done: false },
    ],
    agentTasks: {
      copywriter: {
        current: "Escrevendo copy do convite oficial para o Encontro de Líderes de Maio",
        status: "trabalhando",
        recent: ["3 variações de copy para Facebook Ads", "E-mail de boas-vindas para novos associados"],
        progress: 55,
      },
      traffic: {
        current: "Configurando campanha de remarketing para lista de ex-associados",
        status: "trabalhando",
        recent: ["Criou lookalike audience a partir de associados ativos", "Aumentou budget do ad de inscrição em R$ 200"],
        progress: 38,
      },
      analyst: {
        current: "Aguardando dados de inscrição para compilar relatório do evento",
        status: "aguardando",
        recent: ["Relatório de abril: +14 novos associados via social", "Análise de funil de captação Q1 2025"],
        progress: 0,
      },
      social: {
        current: "Montando calendário de contagem regressiva para o evento (7 dias)",
        status: "trabalhando",
        recent: ["Reels de cobertura do último evento publicado (312 curtidas)", "Programou 6 posts da semana"],
        progress: 72,
      },
      strategist: {
        current: "Desenvolvendo estratégia de pós-evento para reter novos associados",
        status: "trabalhando",
        recent: ["Mapeou jornada do novo associado (onboarding)", "Definiu posicionamento da ABCER para H2 2025"],
        progress: 30,
      },
      sales: {
        current: "Aguardando setup do WhatsApp Business para iniciar captação de associados",
        status: "aguardando",
        recent: ["Roteiro de abordagem para novos associados via WhatsApp criado", "Script de follow-up pós-evento mapeado"],
        progress: 0,
      },
      designer: {
        current: "Desenvolvendo kit visual completo do Encontro de Líderes: banner, stories e crachás",
        status: "trabalhando",
        recent: ["Arte do convite digital (formato PDF e PNG)", "Pack de stories contagem regressiva — 7 peças"],
        progress: 88,
      },
      site: {
        current: "Atualizando banner principal do site com arte do Encontro de Líderes",
        status: "trabalhando",
        recent: ["Criou página de inscrição para o evento (conversão otimizada)", "Atualizou galeria de fotos do último evento"],
        progress: 70,
      },
      revisor: {
        current: "Revisando copy dos 3 anúncios do Facebook antes de subir para aprovação",
        status: "trabalhando",
        recent: ["Corrigiu tom informal demais no e-mail de boas-vindas", "Padronizou uso de maiúsculas nos títulos de 6 posts"],
        progress: 60,
      },
    },
    contacts: [
      { id: "ct1", name: "Ana Silva", company: "Silva & Associados", role: "Diretora", email: "ana@silvaassociados.com.br", status: "Cliente", lastContact: "hoje", tags: ["associada", "VIP"] },
      { id: "ct2", name: "João Martins", company: "Martins Distribuidora", role: "Gerente Comercial", email: "joao@martinsdist.com.br", status: "Lead", lastContact: "há 3 dias", tags: ["evento", "quente"] },
      { id: "ct3", name: "Patrícia Souza", company: "Sindicato do Comércio Local", role: "Presidente", email: "patricia@sindicatolocal.org.br", status: "Qualificado", lastContact: "há 5 dias", tags: ["parceira", "influente"] },
      { id: "ct4", name: "Ricardo Nunes", company: "Nunes Engenharia", role: "Sócio", email: "ricardo@nuneseng.com.br", status: "Lead", lastContact: "há 1 sem", tags: ["construção", "frio"] },
      { id: "ct5", name: "Camila Ramos", company: "Ramos Digital", role: "CEO", email: "camila@ramosdigital.com.br", status: "Qualificado", lastContact: "há 2 dias", tags: ["tech", "evento"] },
      { id: "ct6", name: "Fernando Carvalho", company: "Grupo FC", role: "Diretor Executivo", email: "f.carvalho@grupofc.com.br", status: "Cliente", lastContact: "há 1 sem", tags: ["patrocinador"] },
    ],
    pipeline: [
      { id: "d1", title: "Associação Premium Anual", contact: "Fernando Carvalho", value: "R$ 4.800/ano", stage: "ganho", probability: 100, dueDate: "01/05" },
      { id: "d2", title: "Patrocínio Encontro de Líderes", contact: "João Martins", value: "R$ 5.000", stage: "negociacao", probability: 80, dueDate: "28/04" },
      { id: "d3", title: "Parceria Institucional 2025", contact: "Patrícia Souza", value: "R$ 7.200/ano", stage: "proposta", probability: 60, dueDate: "10/05" },
      { id: "d4", title: "Associação Empresarial", contact: "Camila Ramos", value: "R$ 2.400/ano", stage: "qualificacao", probability: 40, dueDate: "15/05" },
      { id: "d5", title: "Cota de Patrocínio Silver", contact: "Ricardo Nunes", value: "R$ 3.000", stage: "prospeccao", probability: 20, dueDate: "30/05" },
    ],
    outputs: [
      { id: "ab-o1", agent: "copywriter", name: "Copy Convite — Encontro de Líderes de Maio", type: "copy", createdAt: "hoje, 13h", platform: "E-mail / WhatsApp", status: "aprovado", preview: "Prezado(a) [nome], É com grande satisfação que convidamos você para o Encontro de Líderes Empresariais — edição Maio 2025. Um espaço exclusivo para conexões estratégicas e troca de experiências entre os principais nomes do setor." },
      { id: "ab-o2", agent: "copywriter", name: "Legenda Facebook — Post Evento", type: "post", createdAt: "ontem", platform: "Facebook", status: "publicado", preview: "O maior encontro de líderes empresariais do estado está chegando! 🤝 Reserve sua vaga e venha fazer parte de uma rede que transforma negócios. Inscrições abertas — link na bio." },
      { id: "ab-o3", agent: "designer", name: "Arte Evento — Encontro de Líderes (3 formatos)", type: "design", createdAt: "ontem", platform: "Facebook / Instagram / Stories", status: "publicado", preview: "Peças em 3 formatos: Feed quadrado 1080×1080, Stories 1080×1920, capa de evento Facebook 820×312. Cores institucionais ABCER. Aprovadas e publicadas." },
      { id: "ab-o4", agent: "analyst", name: "Relatório Captação Pré-Evento", type: "report", createdAt: "hoje, 10h", status: "revisão", preview: "Inscrições recebidas: 89 (meta: 120). Canal Facebook Ads: 41 inscrições (CPA R$ 12). E-mail marketing: 28 inscrições (taxa de abertura 38%). WhatsApp orgânico: 20 inscrições." },
      { id: "ab-o5", agent: "strategist", name: "Plano de Comunicação — Evento Maio", type: "plan", createdAt: "há 3 dias", status: "aprovado", preview: "Semana 1: Lançamento com urgência (vagas limitadas). Semana 2: Destaques dos palestrantes. Semana 3: Testemunhos de edições anteriores. Semana 4: Chamada final + encerramento de inscrições." },
      { id: "ab-o6", agent: "copywriter", name: "E-mail Boas-vindas — Novos Associados", type: "email", createdAt: "há 2 dias", status: "publicado", preview: "Seja bem-vindo à ABCER! Você agora faz parte de uma comunidade com mais de 400 empresas associadas. Neste e-mail você encontra todos os seus benefícios e como aproveitá-los ao máximo." },
      { id: "ab-o7", agent: "social", name: "Calendário de Conteúdo — Semana do Evento", type: "plan", createdAt: "hoje, 9h", platform: "Facebook / Instagram", status: "aprovado", preview: "Seg: Contagem regressiva (10 dias). Ter: Perfil de palestrante #1. Qua: Story interativo (enquete). Qui: Perfil de palestrante #2. Sex: Urgência — últimas vagas." },
    ],
    collabCampaigns: [
      {
        id: "cc1", name: "Captação de Associados — Awareness 2025",
        objective: "Aumentar base de associados e reforçar posicionamento da ABCER como hub de negócios regional",
        status: "ativa", platforms: ["Facebook Ads", "Instagram", "E-mail Marketing"],
        budget: "R$ 1.500/mês", spent: "R$ 820", reach: "31.600", leads: 203, cpa: "R$ 4,04",
        startDate: "10/04/2025", crmLeads: 47,
        phases: [
          { id: "p1", label: "Estratégia & Público-alvo", agentId: "strategist", status: "done", output: "Persona definida: empresários locais 35-55 anos, faturamento R$ 500k-5M" },
          { id: "p2", label: "Copy & Roteiros", agentId: "copywriter", status: "done", output: "4 variações de anúncio, e-mail de boas-vindas, SMS de confirmação" },
          { id: "p3", label: "Criação Visual", agentId: "designer", status: "done", output: "Arte evento 3 formatos, banner awareness associação, capa Facebook" },
          { id: "p4", label: "Anúncios Facebook/Instagram", agentId: "traffic", status: "active", output: "2 campanhas ativas — awareness associação + evento líderes" },
          { id: "p5", label: "E-mail Marketing", agentId: "copywriter", status: "active", output: "Sequência de 3 e-mails para leads que visitaram a landing page" },
          { id: "p6", label: "Remarketing Dinâmico", agentId: "traffic", status: "active", output: "Retargeting para visitantes não convertidos nos últimos 14 dias" },
          { id: "p7", label: "Follow-up CRM", agentId: "sales", status: "pending", output: null },
        ],
        remarketing: [
          { id: "r1", name: "Abandonaram LP sem preencher", size: "890 pessoas", platform: "Facebook Ads", type: "website", status: "ativa", cpa: "R$ 3,20", leadsThisWeek: 14 },
          { id: "r2", name: "Curtidas na Página Facebook (90 dias)", size: "9.300 pessoas", platform: "Facebook Ads", type: "custom", status: "ativa", cpa: "R$ 2,80", leadsThisWeek: 22 },
          { id: "r3", name: "Lookalike Associados Atuais 2%", size: "45.000 pessoas", platform: "Facebook Ads", type: "lookalike", status: "ativa", cpa: "R$ 5,10", leadsThisWeek: 8 },
          { id: "r4", name: "Assistiram Reels 50%+", size: "1.420 pessoas", platform: "Instagram", type: "video", status: "ativa", cpa: "R$ 6,30", leadsThisWeek: 5 },
        ],
      },
      {
        id: "cc2", name: "Encontro de Líderes — Maio 2025",
        objective: "Atingir 120 inscrições para o evento presencial de networking com custo por inscrição abaixo de R$ 15",
        status: "ativa", platforms: ["Facebook Ads", "WhatsApp", "E-mail"],
        budget: "R$ 800/mês", spent: "R$ 310", reach: "12.400", leads: 89, cpa: "R$ 3,48",
        startDate: "22/04/2025", crmLeads: 19,
        phases: [
          { id: "p1", label: "Planejamento do Evento", agentId: "strategist", status: "done", output: "Timeline de comunicação de 3 semanas + personas para segmentação" },
          { id: "p2", label: "Material de Divulgação", agentId: "copywriter", status: "done", output: "Copy convite, script WhatsApp, landing page de inscrição" },
          { id: "p3", label: "Identidade Visual Evento", agentId: "designer", status: "done", output: "Kit visual completo: banner, stories, e-mail header, material impresso" },
          { id: "p4", label: "Anúncios Patrocinados", agentId: "traffic", status: "active", output: "1 campanha Facebook com 3 conjuntos de anúncio — segmentação por setor" },
          { id: "p5", label: "Disparo WhatsApp", agentId: "sales", status: "active", output: "Convites enviados para 340 contatos da base — 67 confirmados" },
          { id: "p6", label: "Remarketing Pré-evento", agentId: "traffic", status: "pending", output: null },
          { id: "p7", label: "Pós-evento CRM", agentId: "sales", status: "pending", output: null },
        ],
        remarketing: [
          { id: "r1", name: "Visitaram LP e não inscreveram", size: "340 pessoas", platform: "Facebook Ads", type: "website", status: "ativa", cpa: "R$ 4,10", leadsThisWeek: 7 },
          { id: "r2", name: "Engajados com posts do evento", size: "2.100 pessoas", platform: "Instagram", type: "custom", status: "ativa", cpa: "R$ 5,80", leadsThisWeek: 4 },
        ],
      },
    ],
  },

  // ── GNX ──────────────────────────────────────────────────────
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
    portalPin: "GN2025",
    nextAction: "Criar série de conteúdo sobre automação e IA",
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
    orchestratorStatus: "Construindo autoridade em IA e automação para PMEs + otimizando funil de leads B2B",
    orchestratorPlan: [
      { step: "Definir série de conteúdo 'IA para PMEs' com a estrategista", done: true },
      { step: "Briefing dos 4 artigos para Beatriz (copywriter)", done: true },
      { step: "Artigo 1 publicado e impulsionado via LinkedIn Ads", done: false, active: true },
      { step: "Case study com cliente atual", done: false },
      { step: "Webinar de posicionamento — convites", done: false },
      { step: "Relatório de leads e pipeline do mês", done: false },
    ],
    agentTasks: {
      copywriter: {
        current: "Produzindo artigo 2 da série: 'Como implementar IA no atendimento sem saber programar'",
        status: "trabalhando",
        recent: ["Artigo 1 da série: 'Automação para PMEs' publicado", "3 legendas de destaque para Instagram"],
        progress: 42,
      },
      traffic: {
        current: "Rodando testes A/B no anúncio do LinkedIn — comparando títulos com e sem dado estatístico",
        status: "trabalhando",
        recent: ["Reduziu CPA de R$ 21 para R$ 17,95 em 2 semanas", "Criou público semelhante a partir de leads convertidos"],
        progress: 60,
      },
      analyst: {
        current: "Mapeando a jornada dos leads: do anúncio até o contato comercial",
        status: "trabalhando",
        recent: ["Relatório quinzenal de leads entregue", "Análise: Reels têm 2,4x mais alcance que feed nesta conta"],
        progress: 55,
      },
      social: {
        current: "Construindo calendário editorial de maio com a série de IA + datas comemorativas",
        status: "concluído",
        recent: ["Posts da semana 28/04 agendados (4 conteúdos)", "Respondeu 8 DMs e comentários no Instagram"],
        progress: 100,
      },
      strategist: {
        current: "Desenhando proposta de webinar de posicionamento para o mês de junho",
        status: "aguardando",
        recent: ["Definiu linha editorial: autoridade em automação para negócios", "Repositório de provas sociais e cases atualizado"],
        progress: 0,
      },
      sales: {
        current: "Qualificando leads de tech via LinkedIn DM — identificando budget e urgência",
        status: "trabalhando",
        recent: ["Adicionou Diego Santos ao pipeline (demo agendada)", "Enviou proposta de automação para Bruna Ferreira"],
        progress: 45,
      },
      designer: {
        current: "Criando série de cards visuais para a campanha 'IA para PMEs' — estilo tech minimalista",
        status: "trabalhando",
        recent: ["Identidade visual da landing page de captação de leads", "3 variações de criativo para teste A/B no LinkedIn Ads"],
        progress: 50,
      },
      site: {
        current: "Otimizando landing page de captação de leads — aumentando velocidade e CTA",
        status: "trabalhando",
        recent: ["Publicou artigo 1 da série no blog: 'Automação para PMEs'", "Corrigiu formulário de contato que não enviava"],
        progress: 48,
      },
      revisor: {
        current: "Revisando artigo 2 da série antes de entregar para a Beatriz publicar",
        status: "trabalhando",
        recent: ["Detectou e corrigiu anglicismo no artigo 1 ('performance' → 'desempenho')", "Reestruturou introdução do artigo para melhor progressão lógica"],
        progress: 75,
      },
    },
    contacts: [
      { id: "ct1", name: "Paulo Silveira", company: "TechCorp Brasil", role: "CTO", email: "paulo@techcorp.com.br", status: "Cliente", lastContact: "há 2 dias", tags: ["tech", "alto valor"] },
      { id: "ct2", name: "Bruna Ferreira", company: "Mega Retail", role: "Diretora de TI", email: "bruna.ferreira@megaretail.com.br", status: "Lead", lastContact: "hoje", tags: ["varejo", "quente"] },
      { id: "ct3", name: "Diego Santos", company: "Startup DS", role: "CEO", email: "diego@startupds.com.br", status: "Qualificado", lastContact: "há 3 dias", tags: ["startup", "IA"] },
      { id: "ct4", name: "Amanda Cruz", company: "Grupo Industrial CR", role: "Gerente de Inovação", email: "amanda.cruz@grupocr.com.br", status: "Qualificado", lastContact: "há 1 sem", tags: ["indústria", "transformação digital"] },
      { id: "ct5", name: "Rafael Monteiro", company: "FinTech RM", role: "Fundador", email: "rafael@fintechrm.com.br", status: "Lead", lastContact: "há 4 dias", tags: ["fintech", "frio"] },
      { id: "ct6", name: "Larissa Andrade", company: "Andrade Educação", role: "Diretora", email: "larissa@andradeedu.com.br", status: "Cliente", lastContact: "há 5 dias", tags: "edutech" as any },
    ],
    pipeline: [
      { id: "d1", title: "Implantação Automação de Atendimento", contact: "Paulo Silveira", value: "R$ 18.000", stage: "ganho", probability: 100, dueDate: "30/04" },
      { id: "d2", title: "Consultoria Transformação Digital", contact: "Diego Santos", value: "R$ 25.000", stage: "negociacao", probability: 70, dueDate: "08/05" },
      { id: "d3", title: "Dashboard Analytics Personalizado", contact: "Amanda Cruz", value: "R$ 12.000", stage: "proposta", probability: 50, dueDate: "15/05" },
      { id: "d4", title: "Automação de Marketing", contact: "Bruna Ferreira", value: "R$ 9.500", stage: "qualificacao", probability: 35, dueDate: "20/05" },
      { id: "d5", title: "Plano Anual Tech + Conteúdo", contact: "Rafael Monteiro", value: "R$ 36.000/ano", stage: "prospeccao", probability: 10, dueDate: "30/05" },
    ],
    outputs: [
      { id: "gn-o1", agent: "copywriter", name: "Artigo 2 — Como Implementar IA no Atendimento", type: "article", createdAt: "hoje, 15h", platform: "Blog / LinkedIn", status: "revisão", preview: "A inteligência artificial deixou de ser um diferencial e se tornou uma necessidade competitiva. Neste artigo, mostramos um passo a passo para PMEs que querem automatizar o atendimento sem precisar de equipe técnica especializada..." },
      { id: "gn-o2", agent: "copywriter", name: "Headlines Landing Page — Automação B2B", type: "copy", createdAt: "hoje, 11h", platform: "Site", status: "revisão", preview: "H1: Automatize seu negócio em 30 dias — sem código, sem complicação. H2: Mais de 50 empresas já transformaram seu atendimento com a GNX. CTA: Agende uma conversa gratuita." },
      { id: "gn-o3", agent: "copywriter", name: "Copy Google Ads — Campanha Automação", type: "ad", createdAt: "ontem", platform: "Google Ads", status: "publicado", preview: "Título 1: Automação para PMEs | Título 2: Atendimento 24h Sem Equipe | Título 3: Teste Grátis 14 Dias. Descrição: A GNX conecta IA ao seu negócio em poucos dias. Veja como funciona." },
      { id: "gn-o4", agent: "designer", name: "Identidade Visual Landing Page — 8 peças", type: "design", createdAt: "há 2 dias", platform: "Site", status: "aprovado", preview: "Header hero, 3 seções de benefícios, seção de depoimentos, CTA banner e footer. Paleta azul tech + gradiente roxo. Mockups mobile e desktop entregues." },
      { id: "gn-o5", agent: "analyst", name: "Dashboard de Leads — Abril 2025", type: "report", createdAt: "hoje, 10h", status: "rascunho", preview: "Leads totais: 47 (meta: 60). Google Ads: 22 leads (CPA R$ 85). LinkedIn: 8 leads (CPA R$ 210). Orgânico: 17 leads. Taxa de conversão Lead→Demo: 34%. Pipeline gerado: R$ 94.000." },
      { id: "gn-o6", agent: "strategist", name: "Posicionamento de Marca — GNX 2025", type: "plan", createdAt: "há 3 dias", status: "aprovado", preview: "Proposta de valor central: A GNX transforma PMEs tradicionais em empresas digitais em até 30 dias, sem necessidade de equipe de TI. Tom: Confiante, técnico mas acessível, orientado a resultado." },
      { id: "gn-o7", agent: "site", name: "Blog — Automação para PMEs (revisado)", type: "article", createdAt: "ontem", platform: "Blog", status: "aprovado", preview: "Texto completo revisado e publicado. 1.240 palavras. SEO: palavra-chave principal automação empresarial PME, densidade 2,1%. Meta description atualizada. Slug: /blog/automacao-pme." },
      { id: "gn-o8", agent: "social", name: "Calendário Conteúdo — Semana 28/04", type: "plan", createdAt: "hoje, 8h", platform: "LinkedIn / Instagram", status: "aprovado", preview: "Seg: Artigo automação (LinkedIn). Ter: Bastidores cliente (Instagram). Qua: Dado de impacto (LinkedIn). Qui: Reels dica rápida (Instagram). Sex: Case de sucesso (ambos)." },
    ],
    collabCampaigns: [
      {
        id: "cc1", name: "Automação B2B — Geração de Demos",
        objective: "Gerar demonstrações qualificadas com tomadores de decisão de PMEs que faturam acima de R$ 2M/ano",
        status: "ativa", platforms: ["LinkedIn Ads", "Google Ads", "Site/Blog"],
        budget: "R$ 2.500/mês", spent: "R$ 1.400", reach: "22.800", leads: 78, cpa: "R$ 17,95", roas: "3,2×",
        startDate: "05/04/2025", crmLeads: 21,
        phases: [
          { id: "p1", label: "Posicionamento & ICP", agentId: "strategist", status: "done", output: "ICP definido: diretores de operações, PMEs tech, ticket médio R$ 15k+" },
          { id: "p2", label: "Copy Anúncios & Landing Page", agentId: "copywriter", status: "done", output: "3 variações de headline, copy LinkedIn, landing page com 3 CTAs testados" },
          { id: "p3", label: "Criação Visual Campanhas", agentId: "designer", status: "done", output: "Landing page visual, banners LinkedIn/Google, infográfico processo GNX" },
          { id: "p4", label: "SEO & Blog", agentId: "site", status: "done", output: "2 artigos publicados, palavras-chave rankeando, meta descriptions otimizadas" },
          { id: "p5", label: "Campanhas Pagas", agentId: "traffic", status: "active", output: "LinkedIn Ads + Google Search ativos — testando 3 variações de anúncio" },
          { id: "p6", label: "Remarketing Inteligente", agentId: "traffic", status: "active", output: "Retargeting visitantes LP + engajados LinkedIn — 48h de janela" },
          { id: "p7", label: "Sequência de Vendas", agentId: "sales", status: "pending", output: null },
        ],
        remarketing: [
          { id: "r1", name: "Visitaram LP Demo (não agendaram)", size: "560 pessoas", platform: "Google Ads", type: "website", status: "ativa", cpa: "R$ 12,40", leadsThisWeek: 5 },
          { id: "r2", name: "Leram Artigos do Blog 2+ min", size: "2.100 pessoas", platform: "Google Ads", type: "website", status: "ativa", cpa: "R$ 9,80", leadsThisWeek: 8 },
          { id: "r3", name: "Engajaram com Posts LinkedIn", size: "4.200 pessoas", platform: "LinkedIn Ads", type: "custom", status: "ativa", cpa: "R$ 22,10", leadsThisWeek: 6 },
          { id: "r4", name: "Lookalike Clientes Atuais 1%", size: "18.000 pessoas", platform: "LinkedIn Ads", type: "lookalike", status: "ativa", cpa: "R$ 19,30", leadsThisWeek: 9 },
        ],
      },
    ],
  },
];
