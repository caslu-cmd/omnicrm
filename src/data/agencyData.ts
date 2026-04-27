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

export interface OrchestratorStep {
  step: string;
  done: boolean;
  active?: boolean;
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
}

export const CLIENTS: Client[] = [
  // ── GRUPO LICITA ─────────────────────────────────────────────
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
      { step: "Relatório de performance para Caroline Lucas", done: false },
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
    pipeline: [
      { id: "d1", title: "Assessoria Mensal Completa", contact: "Sandra Costa", value: "R$ 5.000/mês", stage: "ganho", probability: 100, dueDate: "01/05" },
      { id: "d2", title: "Consultoria em Licitação", contact: "Roberto Pereira", value: "R$ 8.000", stage: "negociacao", probability: 75, dueDate: "05/05" },
      { id: "d3", title: "Workshop Gestão de Contratos", contact: "Marcos Almeida", value: "R$ 12.000", stage: "proposta", probability: 55, dueDate: "10/05" },
      { id: "d4", title: "Curso Nova Lei de Licitações", contact: "Fernanda Lima", value: "R$ 3.500", stage: "qualificacao", probability: 30, dueDate: "15/05" },
      { id: "d5", title: "Plano Anual de Assessoria", contact: "Carlos Eduardo Matos", value: "R$ 48.000/ano", stage: "prospeccao", probability: 15, dueDate: "30/05" },
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
  },
];
