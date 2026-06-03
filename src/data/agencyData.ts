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
  phone?: string;
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
  whatsappUrl?: string;
  teamInstructions?: string;
}

const emptyWeeklyContent: WeekDay[] = [
  { day: "Seg", date: "—", posts: [] },
  { day: "Ter", date: "—", posts: [] },
  { day: "Qua", date: "—", posts: [] },
  { day: "Qui", date: "—", posts: [] },
  { day: "Sex", date: "—", posts: [] },
  { day: "Sáb", date: "—", posts: [] },
  { day: "Dom", date: "—", posts: [] },
];

const idleTask: AgentTask = { current: "", status: "idle", recent: [], progress: 0 };

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
    postsMonth: 0,
    campaigns: 0,
    lastActivity: "—",
    revenue: "—",
    nextAction: "—",
    followers: { instagram: "—", facebook: "—" },
    recentPosts: [],
    activeCampaigns: [],
    agentFeed: [],
    weeklyContent: emptyWeeklyContent,
    metrics: [],
    contacts: [],
    pipeline: [],
    agentTasks: {
      copywriter: { ...idleTask },
      traffic:    { ...idleTask },
      analyst:    { ...idleTask },
      social:     { ...idleTask },
      strategist: { ...idleTask },
      sales:      { ...idleTask },
      designer:   { ...idleTask },
      site:       { ...idleTask },
      revisor:    { ...idleTask },
      briefing:   { ...idleTask },
      calendario: { ...idleTask },
      video:      { ...idleTask },
      tomas:      { ...idleTask },
    },
    orchestratorStatus: "",
    orchestratorPlan: [],
    portalPin: "GL4891",
    outputs: [],
    collabCampaigns: [],
  },

  // ── ABCER ─────────────────────────────────────────────────────
  {
    id: "abcer",
    name: "Abcer",
    industry: "Construção & Engenharia",
    color: "#60A5FA",
    initials: "AB",
    status: "Ativo",
    siteRepo: "caslu-cmd/abcer",
    siteUrl: "https://abcer.lovable.app",
    agentActive: true,
    postsMonth: 0,
    campaigns: 0,
    lastActivity: "—",
    revenue: "—",
    nextAction: "—",
    followers: { instagram: "—", facebook: "—" },
    recentPosts: [],
    activeCampaigns: [],
    agentFeed: [],
    weeklyContent: emptyWeeklyContent,
    metrics: [],
    contacts: [],
    pipeline: [],
    agentTasks: {
      copywriter: { ...idleTask },
      traffic:    { ...idleTask },
      analyst:    { ...idleTask },
      social:     { ...idleTask },
      strategist: { ...idleTask },
      sales:      { ...idleTask },
      designer:   { ...idleTask },
      site:       { ...idleTask },
      revisor:    { ...idleTask },
      tomas:      { ...idleTask },
    },
    orchestratorStatus: "",
    orchestratorPlan: [],
    portalPin: "AB9639",
    outputs: [],
    collabCampaigns: [],
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
    postsMonth: 0,
    campaigns: 0,
    lastActivity: "—",
    revenue: "—",
    nextAction: "—",
    followers: { instagram: "—", facebook: "—" },
    recentPosts: [],
    activeCampaigns: [],
    agentFeed: [],
    weeklyContent: emptyWeeklyContent,
    metrics: [],
    contacts: [],
    pipeline: [],
    agentTasks: {
      copywriter: { ...idleTask },
      traffic:    { ...idleTask },
      analyst:    { ...idleTask },
      social:     { ...idleTask },
      strategist: { ...idleTask },
      sales:      { ...idleTask },
      designer:   { ...idleTask },
      site:       { ...idleTask },
      revisor:    { ...idleTask },
      tomas:      { ...idleTask },
    },
    orchestratorStatus: "",
    orchestratorPlan: [],
    portalPin: "GN5247",
    outputs: [],
    collabCampaigns: [],
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
    postsMonth: 0,
    campaigns: 0,
    lastActivity: "—",
    revenue: "—",
    nextAction: "—",
    followers: { instagram: "—", facebook: "—" },
    recentPosts: [],
    activeCampaigns: [],
    agentFeed: [],
    weeklyContent: emptyWeeklyContent,
    metrics: [],
    contacts: [],
    pipeline: [],
    agentTasks: {
      copywriter: { ...idleTask },
      traffic:    { ...idleTask },
      analyst:    { ...idleTask },
      social:     { ...idleTask },
      strategist: { ...idleTask },
      sales:      { ...idleTask },
      designer:   { ...idleTask },
      site:       { ...idleTask },
      revisor:    { ...idleTask },
      tomas:      { ...idleTask },
    },
    orchestratorStatus: "",
    orchestratorPlan: [],
    portalPin: "CA3851",
    outputs: [],
    collabCampaigns: [],
  },

  // ── FORPLACE ──────────────────────────────────────────────────
  {
    id: "forplace",
    name: "Forplace",
    industry: "Marketplace B2B Moda",
    color: "#7C3AED",
    initials: "FP",
    status: "Ativo",
    agentActive: true,
    postsMonth: 0,
    campaigns: 0,
    lastActivity: "—",
    revenue: "—",
    nextAction: "—",
    siteUrl: "https://forplace.com.br",
    siteRepo: "https://github.com/caslu-cmd/forplace",
    whatsappUrl: "https://wa.me/5585989370471",
    followers: { instagram: "—", facebook: "—" },
    teamInstructions: `# Briefing Completo — Forplace

## O que é
Marketplace B2B de moda que conecta fornecedores (fabricantes, distribuidores) com lojistas no Brasil. Plataforma SaaS própria construída em React + Supabase.

## Produto
- **URL:** forplace.com.br
- **Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase + Framer Motion
- **Supabase project:** ebaagrskohfanoffwogc
- **Repo:** github.com/caslu-cmd/forplace
- **Pagamentos:** Mercado Pago (mercadopago-checkout + mercadopago-webhook edge functions)

## Modelo de negócio
Plataforma freemium com assinaturas mensais para fornecedores:

| Plano | Preço | Créditos IA/mês | Publicidade |
|-------|-------|-----------------|-------------|
| Gratuito | R$0 | 30 créditos | Listagem padrão |
| Essencial | R$59,90 | 600 créditos | Destaque na busca + Seção em destaque na home |
| Pro | R$129,90 | 2.000 créditos | Tudo + Banner de Categoria + Vitrine Patrocinada |

**Sistema de créditos IA (custo por operação):**
- Mensagem IA consultiva: 1 crédito
- Geração de texto/SEO: 2 créditos
- Imagem IA profissional: 15 créditos

**Margens:** Essencial ~90% | Pro ~85%

## Funcionalidades principais
- **Vitrine do fornecedor:** perfil completo com fotos, descrição, WhatsApp, localização, MOQ
- **IA consultiva:** chat de dicas para o fornecedor melhorar a vitrine
- **Geração de imagens IA:** fotos profissionais de produto com Gemini (modo foto ou do zero)
- **SEO com IA:** geração de título, descrição e copy para a vitrine
- **Sistema de publicidade:**
  - Vitrine Patrocinada: topo da home, admin-gerenciada, Pro only
  - Banner de Categoria: topo das páginas de categoria, Pro only
  - Destaque na busca: Essencial+
- **Blog:** geração de posts com IA
- **Verificação de fornecedores:** fluxo de CNPJ + aprovação pelo admin

## Estrutura de publicidade (posições estratégicas)
1. **Vitrine Patrocinada (Spotlight):** carrossel no topo da home, gerenciado pelo admin, apenas fornecedores Pro elegíveis. Campos: is_spotlight + spotlight_position na tabela suppliers
2. **Banner de Categoria:** banner no topo de /categoria/:slug, aparece para o segmento do fornecedor. Campos: category_banner_url + banner_categories na tabela suppliers
3. **Seção 'Fornecedores em Destaque':** seção na home para Essencial+, automático
4. **Busca elevada:** SQL ordering por plano (Pro > Essencial > Free) na função search_suppliers

## Público-alvo
- **Fornecedores:** fabricantes e distribuidores de moda no Brasil (Brás, Bom Retiro, Cianorte, etc.)
- **Lojistas:** compradores B2B buscando atacado

## Segmentos cobertos
Moda Feminina, Moda Masculina, Moda Infantil, Jeans, Moda Praia, Fitness, Acessórios, Plus Size, Moda Íntima, Calçados

## Edge Functions (Supabase)
- ai-assistant: IA consultiva (streaming, 1 crédito/mensagem)
- ai-generate-content: SEO e copy (2 créditos/call, auth obrigatório)
- ai-generate-image: imagens com Gemini (15 créditos/imagem)
- recommend-suppliers: recomendações IA para lojistas (público)
- generate-blog-post: posts de blog
- mercadopago-checkout: cria preferência de pagamento
- mercadopago-webhook: ativa plano após pagamento aprovado

## Tom de voz
Profissional, direto, voltado ao mundo do atacado de moda. Linguagem de negócios B2B. Evitar termos muito técnicos com os fornecedores.

## Objetivos de marketing
1. Aquisição de fornecedores (topo de funil)
2. Conversão do plano gratuito para Essencial
3. Upsell Essencial → Pro (destaque a publicidade avançada)
4. Retenção via valor da IA (imagens, SEO, consultiva)`,

    contacts: [
      { id: "fp-c1", name: "Caroline Lucas", company: "Forplace / Calu Agência", role: "Fundadora & Product Owner", email: "carolinielucas.cl@gmail.com", status: "Cliente", lastContact: "Hoje", value: "R$ 3.200/mês", tags: ["Decisor", "Dev", "Marketing"], phone: "85989370471" },
    ],
    pipeline: [],
    recentPosts: [],
    activeCampaigns: [],
    agentFeed: [],
    weeklyContent: emptyWeeklyContent,
    metrics: [],
    agentTasks: {
      strategist: { ...idleTask },
      copywriter: { ...idleTask },
      designer:   { ...idleTask },
      analyst:    { ...idleTask },
      traffic:    { ...idleTask },
    },
    orchestratorStatus: "",
    orchestratorPlan: [],
    portalPin: "FP2026",
    outputs: [],
    collabCampaigns: [],
  },
];
