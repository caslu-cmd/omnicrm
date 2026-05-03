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
  {
    id: "grupo-licita",
    name: "Grupo Licita",
    industry: "Consultoria & Licitações",
    color: "#B9FF4B",
    initials: "GL",
    status: "Ativo",
    agentActive: true,
    postsMonth: 0,
    campaigns: 0,
    lastActivity: "Hoje",
    revenue: "—",
    nextAction: "Configurar campanhas",
    followers: { instagram: "—", facebook: "—" },
    recentPosts: [],
    activeCampaigns: [],
    agentFeed: [],
    weeklyContent: [],
    metrics: [],
    contacts: [],
    pipeline: [],
    agentTasks: {},
    orchestratorStatus: "aguardando",
    orchestratorPlan: [],
    portalPin: "1234",
    outputs: [],
  },
];
