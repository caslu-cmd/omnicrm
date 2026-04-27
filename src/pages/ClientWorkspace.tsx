import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Instagram, Facebook, Zap, FileText, Megaphone, BarChart2,
  CheckCircle2, Clock, TrendingUp, Eye, Heart, Users, ExternalLink,
  Calendar, Image, Film, BookOpen, Bot, Activity, Link2, ListTodo,
  Plus, Linkedin, MessageCircle, Circle, Send,
  Wifi, WifiOff, Search, ChevronRight, Mail, DollarSign,
  Globe, FileEdit, FileCheck, ChevronDown, AlertTriangle, RefreshCw,
  ExternalLink as ExternalLinkIcon, Pencil, ShieldCheck,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { CLIENTS } from "@/data/agencyData";

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
    name: "Carolina",
    role: "Estrategista",
    initial: "C",
    skill: "Posicionamento · Pauta · Brand",
    color: "#FBBF24",
    description: "Define o posicionamento e a pauta editorial do cliente",
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
    id: "revisor",
    name: "Vitória",
    role: "Revisora",
    initial: "V",
    skill: "Ortografia · Gramática · Estrutura",
    color: "#EC4899",
    description: "Revisa e corrige todos os arquivos antes de publicar",
  },
];

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

const MOCK_TASKS_BY_CLIENT: Record<string, typeof MOCK_TASKS_TEMPLATE> = {};
const MOCK_TASKS_TEMPLATE = [
  { id: "1", text: "Revisar artigo antes de publicar", priority: "alta",  done: false, due: "Hoje" },
  { id: "2", text: "Aprovar criativos das campanhas",  priority: "alta",  done: false, due: "Amanhã" },
  { id: "3", text: "Enviar relatório mensal ao cliente", priority: "media", done: true,  due: "Hoje" },
  { id: "4", text: "Conectar LinkedIn da empresa",     priority: "baixa", done: false, due: "02/05" },
  { id: "5", text: "Definir pauta editorial de junho", priority: "media", done: false, due: "05/05" },
];

// ── Mock site pages per client ─────────────────────────────────
const SITE_PAGES: Record<string, { page: string; url: string; lastEdit: string; status: "publicado" | "rascunho" | "editando"; changes: number }[]> = {
  "grupo-licita": [
    { page: "Home", url: "/", lastEdit: "há 2 dias", status: "publicado", changes: 3 },
    { page: "Serviços", url: "/servicos", lastEdit: "há 1h", status: "editando", changes: 5 },
    { page: "Blog — Nova Lei 14.133", url: "/blog/nova-lei", lastEdit: "há 3h", status: "publicado", changes: 12 },
    { page: "Contato", url: "/contato", lastEdit: "há 1 sem", status: "publicado", changes: 1 },
    { page: "Quem Somos", url: "/sobre", lastEdit: "há 2 sem", status: "rascunho", changes: 0 },
  ],
  "abcer": [
    { page: "Home", url: "/", lastEdit: "há 5h", status: "editando", changes: 8 },
    { page: "Eventos — Encontro de Líderes", url: "/eventos/encontro", lastEdit: "há 2h", status: "publicado", changes: 14 },
    { page: "Inscrição Evento", url: "/inscricao", lastEdit: "há 1h", status: "publicado", changes: 6 },
    { page: "Galeria", url: "/galeria", lastEdit: "ontem", status: "publicado", changes: 4 },
    { page: "Associe-se", url: "/associe-se", lastEdit: "há 3 dias", status: "publicado", changes: 2 },
  ],
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
  "abcer": [
    {
      id: "rf1", name: "E-mail Boas-vindas — Novos Associados", type: "E-mail", errors: 3, fixed: 3,
      diffs: [
        { before: "Seja muito bem vindo a ABCER", after: "Seja bem-vindo à ABCER", type: "typo" },
        { before: "todos os beneficios que você terá acesso", after: "todos os benefícios aos quais você terá acesso", type: "structure" },
        { before: "O nosso time está a sua disposição", after: "Nossa equipe está à sua disposição", type: "style" },
      ],
    },
    {
      id: "rf2", name: "Copy Facebook Ads — Evento Networking", type: "Anúncio", errors: 2, fixed: 2,
      diffs: [
        { before: "Participe do maior evento de networking!", after: "Participe do maior encontro de networking!", type: "style" },
        { before: "Vagas limitadas, não perca!", after: "Vagas limitadas — não perca.", type: "typo" },
      ],
    },
  ],
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
    connected: true, account: "@grupolicita", followers: "3,1k seguidores",
    features: ["Publicar posts e stories", "Agendar conteúdo", "Métricas de alcance", "Responder comentários"],
  },
  {
    id: "facebook", name: "Facebook", description: "Página, Grupos e Facebook Ads",
    Icon: Facebook, color: "#1877F2", bg: "rgba(24,119,242,0.1)", border: "rgba(24,119,242,0.2)",
    connected: true, account: "Grupo Licita", followers: "6,4k curtidas",
    features: ["Publicar na Página", "Gerenciar Facebook Ads", "Métricas da Página", "Responder mensagens"],
  },
  {
    id: "linkedin", name: "LinkedIn", description: "Página empresarial e conteúdo B2B",
    Icon: Linkedin, color: "#0A66C2", bg: "rgba(10,102,194,0.1)", border: "rgba(10,102,194,0.2)",
    connected: false, account: null, followers: null,
    features: ["Publicar na Página", "Artigos e newsletters", "Métricas de engajamento", "Geração de leads B2B"],
  },
  {
    id: "whatsapp", name: "WhatsApp Business", description: "Mensagens, automações e atendimento",
    Icon: MessageCircle, color: "#25D366", bg: "rgba(37,211,102,0.1)", border: "rgba(37,211,102,0.2)",
    connected: false, account: null, followers: null,
    features: ["Enviar mensagens em massa", "Chatbot de atendimento", "Templates aprovados", "Relatório de entrega"],
  },
];

// ── Component ─────────────────────────────────────────────────
export default function ClientWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "";
  const [tasks, setTasks] = useState(MOCK_TASKS_TEMPLATE);
  const [crmView, setCrmView] = useState<"contacts" | "pipeline">("contacts");
  const [contactSearch, setContactSearch] = useState("");
  const [agentCommand, setAgentCommand] = useState("");
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<string | null>(null);

  const client = CLIENTS.find((c) => c.id === id);

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-full text-white" style={{ background: "#080810" }}>
        Cliente não encontrado.{" "}
        <button onClick={() => navigate("/agency")} className="ml-2 underline">Voltar</button>
      </div>
    );
  }

  const toggleTask = (taskId: string) =>
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, done: !t.done } : t));

  const filteredContacts = client.contacts.filter((c) =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.company.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const pipelineValue = client.pipeline.reduce((sum, d) => {
    const n = parseFloat(d.value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    return sum + n;
  }, 0);

  const wonDeals = client.pipeline.filter((d) => d.stage === "ganho").length;
  const winRate = client.pipeline.length > 0
    ? Math.round((wonDeals / client.pipeline.length) * 100)
    : 0;

  return (
    <div className="min-h-full flex flex-col text-white" style={{ background: "#080810" }}>

      {/* ── Top info bar ── */}
      <div className="flex items-center gap-4 px-8 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,8,16,0.95)" }}>
        <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          <div className="flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5" /> {client.followers.instagram}</div>
          <div className="flex items-center gap-1.5"><Facebook className="w-3.5 h-3.5" /> {client.followers.facebook}</div>
        </div>
        <div className="ml-auto">
          <button onClick={() => navigate("/portal")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: `${client.color}18`, color: client.color, border: `1px solid ${client.color}30` }}>
            <ExternalLink className="w-3 h-3" /> Ver portal do cliente
          </button>
        </div>
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
            {activeTab === "" && (
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-5">
                  <div className="grid grid-cols-4 gap-3">
                    {client.metrics.map((m) => (
                      <div key={m.label} className="rounded-xl p-4"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="text-[10px] mb-2 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
                        <div className="text-2xl mb-1 font-bold tracking-tight">{m.value}</div>
                        <div className="text-[11px] font-medium" style={{ color: m.positive ? "#34D399" : "#F87171" }}>{m.change}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Atividade do Time</h3>
                      {client.agentActive && (
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                          </span>
                          <span className="text-[11px]" style={{ color: "#34D399" }}>Time trabalhando</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      {client.agentFeed.slice(0, 5).map((item) => {
                        const Icon = ACTIVITY_ICONS[item.type] ?? Zap;
                        const color = ACTIVITY_COLORS[item.type];
                        return (
                          <div key={item.id} className="flex gap-3 p-3 rounded-xl transition-colors"
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
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
                              <p className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{item.detail}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <h3 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Posts Recentes</h3>
                    <div className="space-y-3">
                      {client.recentPosts.map((post) => {
                        const Icon = POST_TYPE_ICONS[post.type] ?? Image;
                        return (
                          <div key={post.id} className="flex items-start gap-3 p-3 rounded-xl"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: `${client.color}15`, border: `1px solid ${client.color}25` }}>
                              <Icon className="w-4 h-4" style={{ color: client.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[11px] font-medium" style={{ color: client.color }}>{post.type} · {post.platform}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                  style={{ background: post.status === "Publicado" ? "rgba(16,185,129,0.12)" : "rgba(245,200,66,0.12)", color: post.status === "Publicado" ? "#34D399" : "#F5C842" }}>
                                  {post.status}
                                </span>
                              </div>
                              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>{post.caption}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}><Clock className="w-2.5 h-2.5 inline mr-1" />{post.scheduledFor}</span>
                                {post.likes !== undefined && <>
                                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}><Heart className="w-2.5 h-2.5 inline mr-1" />{post.likes.toLocaleString("pt-BR")}</span>
                                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}><Eye className="w-2.5 h-2.5 inline mr-1" />{post.reach?.toLocaleString("pt-BR")}</span>
                                </>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <h3 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Esta Semana</h3>
                    <div className="space-y-1.5">
                      {client.weeklyContent.map((day) => (
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
                    <h3 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Campanhas Ativas</h3>
                    {client.activeCampaigns.length === 0
                      ? <p className="text-xs text-center py-3" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhuma campanha ativa.</p>
                      : <div className="space-y-2">{client.activeCampaigns.map((camp) => (
                        <div key={camp.id} className="p-3 rounded-xl"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <div className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>{camp.name}</div>
                          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{camp.platform} · {camp.results} · CPA {camp.cpa}</div>
                        </div>
                      ))}</div>
                    }
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                CRM
            ══════════════════════════════════════════════════════ */}
            {activeTab === "crm" && (
              <div className="space-y-5">

                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Contatos",       value: client.contacts.length,                                         icon: Users },
                    { label: "Negócios ativos", value: client.pipeline.filter(d => d.stage !== "ganho").length,        icon: TrendingUp },
                    { label: "Pipeline total",  value: `R$ ${(pipelineValue).toLocaleString("pt-BR")}`,               icon: DollarSign },
                    { label: "Taxa de ganhos",  value: `${winRate}%`,                                                  icon: CheckCircle2 },
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
                  {(["contacts", "pipeline"] as const).map((v) => (
                    <button key={v} onClick={() => setCrmView(v)}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={crmView === v
                        ? { background: `${client.color}22`, color: client.color, border: `1px solid ${client.color}30` }
                        : { color: "rgba(255,255,255,0.4)" }}>
                      {v === "contacts" ? "Contatos" : "Pipeline"}
                    </button>
                  ))}
                </div>

                {/* ── CONTATOS ── */}
                {crmView === "contacts" && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
                      <input
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder="Buscar por nome ou empresa..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F0F0" }}
                      />
                    </div>

                    <div className="rounded-2xl overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {/* Header */}
                      <div className="grid px-5 py-2.5 text-[10px] uppercase tracking-wider font-medium"
                        style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 80px", color: "rgba(255,255,255,0.25)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span>Contato</span><span>Empresa</span><span>E-mail</span>
                        <span>Status</span><span>Último contato</span><span></span>
                      </div>

                      {filteredContacts.map((contact, i) => {
                        const st = STATUS_CONTACT_STYLE[contact.status];
                        return (
                          <motion.div key={contact.id}
                            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="grid px-5 py-3.5 items-center transition-colors cursor-pointer"
                            style={{ gridTemplateColumns: "2fr 1.5fr 1.5fr 1fr 1fr 80px", borderBottom: i < filteredContacts.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                                style={{ background: `${client.color}20`, color: client.color }}>
                                {contact.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                              </div>
                              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{contact.name}</span>
                            </div>
                            <div>
                              <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{contact.company}</div>
                              <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{contact.role}</div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{contact.email}</span>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full w-fit"
                              style={{ background: st.bg, color: st.color }}>{contact.status}</span>
                            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{contact.lastContact}</span>
                            <div className="flex justify-end">
                              <button className="p-1.5 rounded-lg transition-colors"
                                style={{ color: "rgba(255,255,255,0.25)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = client.color)}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
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
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                AGENTES IA — TIME DE MARKETING
            ══════════════════════════════════════════════════════ */}
            {activeTab === "agents" && (
              <div className="space-y-5">

                {/* ── ARIA — Orquestradora ── */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: "rgba(185,255,75,0.04)",
                    border: "1px solid rgba(185,255,75,0.2)",
                    boxShadow: "0 0 48px -16px rgba(185,255,75,0.15)",
                  }}>
                  <div className="flex items-start gap-5">

                    {/* Identity */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: "#B9FF4B", boxShadow: "0 0 24px -4px rgba(185,255,75,0.55)" }}>
                        <Zap className="w-7 h-7" style={{ color: "#07080A" }} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold" style={{ color: "#F0F0F0" }}>ARIA</h3>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold"
                          style={{ background: "rgba(185,255,75,0.12)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.25)" }}>
                          Orquestradora
                        </span>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#B9FF4B" }} />
                          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#B9FF4B" }} />
                        </span>
                        <span className="text-xs" style={{ color: "rgba(185,255,75,0.7)" }}>Coordenando o time</span>
                      </div>
                      <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {client.orchestratorStatus}
                      </p>

                      {/* Plan steps */}
                      <div className="grid grid-cols-3 gap-2">
                        {client.orchestratorPlan.map((step, i) => (
                          <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl"
                            style={{
                              background: step.done ? "rgba(52,211,153,0.07)" : step.active ? "rgba(185,255,75,0.08)" : "rgba(255,255,255,0.03)",
                              border: `1px solid ${step.done ? "rgba(52,211,153,0.2)" : step.active ? "rgba(185,255,75,0.2)" : "rgba(255,255,255,0.06)"}`,
                            }}>
                            {step.done
                              ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#34D399" }} />
                              : step.active
                              ? <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#B9FF4B" }} />
                              : <Circle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "rgba(255,255,255,0.15)" }} />
                            }
                            <span className="text-[11px] leading-relaxed"
                              style={{ color: step.done ? "rgba(52,211,153,0.8)" : step.active ? "#B9FF4B" : "rgba(255,255,255,0.3)" }}>
                              {step.step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Command input */}
                    <div className="flex-shrink-0 w-60">
                      <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Dar instrução ao time</div>
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={agentCommand}
                          onChange={(e) => setAgentCommand(e.target.value)}
                          placeholder="Ex: Crie 3 posts sobre a nova lei..."
                          rows={3}
                          className="w-full rounded-xl px-3 py-2 text-xs resize-none"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(185,255,75,0.15)", color: "#F0F0F0" }}
                        />
                        <button
                          onClick={() => setAgentCommand("")}
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold w-full transition-all"
                          style={{ background: "#B9FF4B", color: "#07080A", boxShadow: agentCommand ? "0 0 16px -4px rgba(185,255,75,0.5)" : "none" }}>
                          <Send className="w-3 h-3" /> Enviar para ARIA
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ── Time de Especialistas ── */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Time de Especialistas
                    </h3>
                    <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>5 agentes</span>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {MARKETING_TEAM.map((agent, i) => {
                      const task = client.agentTasks[agent.id];
                      const isWorking = task?.status === "trabalhando";
                      const isDone = task?.status === "concluído";

                      return (
                        <motion.div key={agent.id}
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="rounded-2xl p-4 flex flex-col"
                          style={{
                            background: "rgba(255,255,255,0.025)",
                            border: `1px solid ${isWorking ? `${agent.color}28` : "rgba(255,255,255,0.07)"}`,
                            boxShadow: isWorking ? `0 0 28px -10px ${agent.color}30` : "none",
                          }}>

                          {/* Avatar + name */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                                style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}30`, color: agent.color }}>
                                {agent.initial}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold leading-tight" style={{ color: "rgba(255,255,255,0.9)" }}>{agent.name}</div>
                                <div className="text-[10px] leading-tight" style={{ color: agent.color }}>{agent.role}</div>
                              </div>
                            </div>
                            {isWorking && (
                              <span className="relative flex h-1.5 w-1.5 flex-shrink-0 mt-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: agent.color }} />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: agent.color }} />
                              </span>
                            )}
                            {isDone && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: "#34D399" }} />}
                          </div>

                          {/* Skill */}
                          <div className="text-[10px] mb-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.22)" }}>
                            {agent.skill}
                          </div>

                          {/* Current task */}
                          {task && (
                            <>
                              <div className="mb-2.5">
                                <div className="text-[9px] uppercase tracking-wider mb-1 font-medium"
                                  style={{ color: isWorking ? agent.color : isDone ? "#34D399" : "rgba(255,255,255,0.2)" }}>
                                  {isWorking ? "● Fazendo agora" : isDone ? "✓ Concluído" : "○ Aguardando"}
                                </div>
                                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}
                                  style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>
                                  {task.current}
                                </p>
                              </div>

                              {/* Progress bar */}
                              {isWorking && task.progress > 0 && (
                                <div className="mb-3">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>Progresso</span>
                                    <span className="text-[9px]" style={{ color: agent.color }}>{task.progress}%</span>
                                  </div>
                                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                                    <motion.div className="h-full rounded-full"
                                      style={{ background: agent.color }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${task.progress}%` }}
                                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 + i * 0.1 }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Recent */}
                              {task.recent.length > 0 && (
                                <div className="space-y-1.5 mb-3 flex-1">
                                  {task.recent.slice(0, 2).map((r, j) => (
                                    <div key={j} className="flex items-start gap-1.5">
                                      <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: `${agent.color}60` }} />
                                      <span className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>{r}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}

                          <button className="mt-auto w-full py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                            style={{ background: `${agent.color}10`, color: agent.color, border: `1px solid ${agent.color}22` }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = `${agent.color}20`)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = `${agent.color}10`)}>
                            Dar instrução
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Painel do Site (Teo) ── */}
                {(() => {
                  const pages = SITE_PAGES[client.id] ?? [];
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
                        <div className="grid px-5 py-2.5 text-[10px] uppercase tracking-wider"
                          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", color: "rgba(255,255,255,0.25)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <span>Página</span><span>URL</span><span>Última edição</span><span>Status</span><span></span>
                        </div>
                        {pages.map((p, i) => {
                          const statusColor = p.status === "publicado" ? "#34D399" : p.status === "editando" ? "#06B6D4" : "#94A3B8";
                          const statusBg   = p.status === "publicado" ? "rgba(52,211,153,0.1)" : p.status === "editando" ? "rgba(6,182,212,0.1)" : "rgba(148,163,184,0.1)";
                          const isEditing  = editingPage === p.page;
                          return (
                            <div key={p.page}>
                              <div className="grid px-5 py-3 items-center transition-colors"
                                style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 100px", borderBottom: i < pages.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                <div className="flex items-center gap-2">
                                  <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(6,182,212,0.5)" }} />
                                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{p.page}</span>
                                  {p.changes > 0 && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                                      style={{ background: "rgba(6,182,212,0.12)", color: "#06B6D4" }}>
                                      {p.changes} edições
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{p.url}</span>
                                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{p.lastEdit}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full w-fit font-medium"
                                  style={{ background: statusBg, color: statusColor }}>
                                  {p.status}
                                </span>
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingPage(isEditing ? null : p.page)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                                    style={{ background: isEditing ? "rgba(6,182,212,0.2)" : "rgba(6,182,212,0.08)", color: "#06B6D4", border: "1px solid rgba(6,182,212,0.2)" }}>
                                    <Pencil className="w-2.5 h-2.5" />
                                    {isEditing ? "Fechar" : "Editar"}
                                  </button>
                                </div>
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
                                        Editor — {p.page}
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

                <div className="rounded-2xl overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {tasks.map((task, i) => {
                    const p = PRIORITY_STYLE[task.priority];
                    return (
                      <div key={task.id}
                        className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
                        style={{ borderBottom: i < tasks.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        onClick={() => toggleTask(task.id)}>
                        <div className="flex-shrink-0">
                          {task.done
                            ? <CheckCircle2 className="w-5 h-5" style={{ color: "#34D399" }} />
                            : <Circle className="w-5 h-5" style={{ color: "rgba(255,255,255,0.2)" }} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm" style={{ color: task.done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)", textDecoration: task.done ? "line-through" : "none" }}>
                            {task.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: p.bg, color: p.color }}>{p.label}</span>
                          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{task.due}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════
                INTEGRAÇÕES
            ══════════════════════════════════════════════════════ */}
            {activeTab === "integrations" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>Integrações</h2>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Conecte as redes sociais e plataformas deste cliente</p>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  {INTEGRATIONS_BASE.map((integ) => (
                    <motion.div key={integ.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-5"
                      style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${integ.connected ? integ.border : "rgba(255,255,255,0.07)"}` }}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                            style={{ background: integ.bg, border: `1px solid ${integ.border}` }}>
                            <integ.Icon className="w-5 h-5" style={{ color: integ.color }} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{integ.name}</div>
                            <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{integ.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {integ.connected ? <Wifi className="w-3.5 h-3.5" style={{ color: "#34D399" }} /> : <WifiOff className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.2)" }} />}
                          <span className="text-[10px] font-medium" style={{ color: integ.connected ? "#34D399" : "rgba(255,255,255,0.3)" }}>
                            {integ.connected ? "Conectado" : "Desconectado"}
                          </span>
                        </div>
                      </div>
                      {integ.connected && integ.account && (
                        <div className="mb-4 px-3 py-2.5 rounded-xl" style={{ background: `${integ.color}10`, border: `1px solid ${integ.color}20` }}>
                          <div className="text-xs font-medium" style={{ color: integ.color }}>{integ.account}</div>
                          {integ.followers && <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{integ.followers}</div>}
                        </div>
                      )}
                      <div className="mb-4 space-y-1.5">
                        {integ.features.map((f) => (
                          <div key={f} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: integ.connected ? "#34D399" : "rgba(255,255,255,0.2)" }} />
                            <span className="text-[11px]" style={{ color: integ.connected ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)" }}>{f}</span>
                          </div>
                        ))}
                      </div>
                      <button className="w-full py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={integ.connected
                          ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" }
                          : { background: integ.bg, color: integ.color, border: `1px solid ${integ.border}` }}>
                        {integ.connected ? "Gerenciar conexão" : `Conectar ${integ.name}`}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
