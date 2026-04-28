import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Instagram, Facebook, Zap, FileText, Megaphone, BarChart2,
  CheckCircle2, Clock, TrendingUp, Eye, Heart, Users, ExternalLink,
  Calendar, Image, Film, BookOpen, Bot, Activity, Link2, ListTodo,
  Plus, Linkedin, MessageCircle, Circle, Send,
  Wifi, WifiOff, Search, ChevronRight, Mail, DollarSign,
  Globe, FileEdit, FileCheck, ChevronDown, AlertTriangle, RefreshCw,
  Pencil, ShieldCheck, GraduationCap, Smartphone, QrCode,
  UserCheck, PhoneCall, MessageSquare as MsgSq, BadgeCheck,
  Paperclip, X, Palette, PenLine, BarChart3, Layout, Table2, AtSign,
  Target, ArrowRight, Repeat2, MousePointerClick, Filter,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { CLIENTS } from "@/data/agencyData";
import { supabase } from "@/integrations/supabase/client";

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
    name: "Isadora",
    role: "Designer",
    initial: "I",
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
  const [wpStatus, setWpStatus] = useState<"idle" | "loading" | "connected" | "disconnected">("idle");
  const [wpPhone, setWpPhone] = useState<string | null>(null);
  const [wpQr, setWpQr] = useState<string | null>(null);
  const [wpGroups, setWpGroups] = useState<{ id: string; name: string; participants: number }[]>([]);
  const [wpSelectedGroups, setWpSelectedGroups] = useState<string[]>([]);
  const [wpMessage, setWpMessage] = useState("");
  const [wpBlasting, setWpBlasting] = useState(false);
  const [wpBlastResult, setWpBlastResult] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Array<{id: string, imageData: string, mimeType: string, prompt: string, createdAt: string}>>([]);
  const [isadoraLoading, setIsadoraLoading] = useState(false);
  const [isadoraError, setIsadoraError] = useState<string | null>(null);
  const [designAspectRatio, setDesignAspectRatio] = useState<"1:1" | "9:16" | "16:9">("1:1");
  const [designerTask, setDesignerTask] = useState<{prompt: string; progress: number; startedAt: number; estimatedSeconds: number} | null>(null);
  const [designerRecentWork, setDesignerRecentWork] = useState<string[]>([]);
  const designerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const client = CLIENTS.find((c) => c.id === id);

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-full text-white" style={{ background: "#080810" }}>
        Cliente não encontrado.{" "}
        <button onClick={() => navigate("/agency")} className="ml-2 underline">Voltar</button>
      </div>
    );
  }

  const checkWpStatus = async () => {
    setWpStatus("loading");
    setWpQr(null);
    try {
      const { data } = await supabase.functions.invoke("whatsapp", { body: { action: "status" } });
      if (data?.connected) {
        setWpStatus("connected");
        setWpPhone(data.phone ?? null);
        const { data: grps } = await supabase.functions.invoke("whatsapp", { body: { action: "groups" } });
        setWpGroups(Array.isArray(grps) ? grps : []);
      } else {
        setWpStatus("disconnected");
      }
    } catch {
      setWpStatus("disconnected");
    }
  };

  const fetchWpQr = async () => {
    setWpQr(null);
    const { data } = await supabase.functions.invoke("whatsapp", { body: { action: "qrcode" } });
    setWpQr(data?.qrcode ?? null);
  };

  const refreshWpGroups = async () => {
    const { data } = await supabase.functions.invoke("whatsapp", { body: { action: "groups" } });
    setWpGroups(Array.isArray(data) ? data : []);
  };

  const doWpBlast = async () => {
    if (!wpSelectedGroups.length || !wpMessage.trim()) return;
    setWpBlasting(true);
    setWpBlastResult(null);
    try {
      const { data } = await supabase.functions.invoke("whatsapp", {
        body: { action: "blast", groups: wpSelectedGroups, message: wpMessage },
      });
      const ok = (data?.results ?? []).filter((r: { ok: boolean }) => r.ok).length;
      setWpBlastResult(`${ok} de ${wpSelectedGroups.length} grupos receberam a mensagem`);
    } catch {
      setWpBlastResult("Erro ao enviar. Verifique a conexão Z-API.");
    }
    setWpBlasting(false);
  };

  const toggleGroup = (gid: string) =>
    setWpSelectedGroups((prev) => prev.includes(gid) ? prev.filter((g) => g !== gid) : [...prev, gid]);

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
    const prompt = agentInstruction.trim();
    if (!prompt) return;
    setAgentInstruction("");
    setIsadoraLoading(true);
    setIsadoraError(null);
    const ESTIMATED = 28;
    const startedAt = Date.now();
    const supabaseUrl = (supabase as any).supabaseUrl ?? (supabase as any).storageUrl ?? "desconhecida";
    setDesignerTask({ prompt: `[${supabaseUrl}] ${prompt}`, progress: 0, startedAt, estimatedSeconds: ESTIMATED });
    if (designerIntervalRef.current) clearInterval(designerIntervalRef.current);
    designerIntervalRef.current = setInterval(() => {
      setDesignerTask((prev) => {
        if (!prev) return null;
        const elapsed = (Date.now() - prev.startedAt) / 1000;
        const p = Math.min(90, Math.round((elapsed / prev.estimatedSeconds) * 100));
        return { ...prev, progress: p };
      });
    }, 600);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt, aspectRatio: designAspectRatio },
      });
      if (designerIntervalRef.current) clearInterval(designerIntervalRef.current);
      if (error) throw new Error(`${error.message} (${error.name})`);
      if (!data?.imageData) throw new Error(data?.error ? String(data.error).slice(0, 200) : "Sem imageData na resposta");
      setDesignerTask((prev) => prev ? { ...prev, progress: 100 } : null);
      setDesignerRecentWork((prev) => [prompt, ...prev.slice(0, 4)]);
      setTimeout(() => setDesignerTask(null), 2500);
      const blob = new Blob(
        [Uint8Array.from(atob(data.imageData), (c) => c.charCodeAt(0))],
        { type: data.mimeType ?? "image/png" }
      );
      const blobUrl = URL.createObjectURL(blob);
      setGeneratedImages((prev) => [
        { id: Date.now().toString(), imageData: blobUrl, mimeType: data.mimeType ?? "image/png", prompt, createdAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
        ...prev,
      ]);
    } catch (err) {
      if (designerIntervalRef.current) clearInterval(designerIntervalRef.current);
      setDesignerTask(null);
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : JSON.stringify(err);
      setIsadoraError(msg);
    } finally {
      setIsadoraLoading(false);
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
                CAMPANHAS — COLABORAÇÃO DE AGENTES
            ══════════════════════════════════════════════════════ */}
            {activeTab === "campaigns" && (
                <div className="space-y-6">
                  {/* ── Summary bar ── */}
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: "Campanhas ativas",  value: campList.filter(c => c.status === "ativa").length.toString(), icon: Megaphone, color: client.color },
                      { label: "Leads gerados",      value: campList.reduce((s, c) => s + c.leads, 0).toString(), icon: Target, color: "#34D399" },
                      { label: "No CRM",             value: campList.reduce((s, c) => s + c.crmLeads, 0).toString(), icon: Users, color: "#A78BFA" },
                      { label: "Alcance total",      value: campList.reduce((s, c) => s + parseInt(c.reach.replace(/\D/g, ""), 10), 0).toLocaleString("pt-BR"), icon: Eye, color: "#60A5FA" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl p-4 flex items-center gap-3"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                          <s.icon className="w-4 h-4" style={{ color: s.color }} />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</div>
                          <div className="text-xl font-bold" style={{ color: "#F0F0F0" }}>{s.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {campList.length === 0 && (
                    <div className="rounded-2xl p-16 text-center"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
                      <Megaphone className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Nenhuma campanha configurada</p>
                    </div>
                  )}

                  {campList.map((camp) => {
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
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(185,255,75,0.04)",
                    border: "1px solid rgba(185,255,75,0.2)",
                    boxShadow: "0 0 48px -16px rgba(185,255,75,0.15)",
                  }}>

                  {/* Status row */}
                  <div className="flex items-start gap-5 p-6 pb-5">
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
                  </div>

                  {/* ── Instrução à ARIA — full-width bottom ── */}
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

                    {/* hidden file input for ARIA */}
                    <input ref={fileInputRef} type="file"
                      accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.csv,.xlsx"
                      className="hidden"
                      onChange={handleAriaFileChange} />

                    {/* File preview */}
                    {attachedFile && renderFilePreview(attachedFile, attachedFileUrl, attachedFileText, "#B9FF4B")}

                    <div className="flex items-center gap-3 mt-3">
                      {attachedFile ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
                          style={{ background: "rgba(185,255,75,0.08)", border: "1px solid rgba(185,255,75,0.2)" }}>
                          {attachedFile.type.startsWith("image/")
                            ? <Image className="w-3 h-3 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                            : <FileText className="w-3 h-3 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                          }
                          <span className="text-[11px] font-medium max-w-[160px] truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
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
                        <button onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0"
                          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px dashed rgba(255,255,255,0.14)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(185,255,75,0.35)"; e.currentTarget.style.color = "rgba(185,255,75,0.75)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
                          <Paperclip className="w-3 h-3" /> Anexar referência
                        </button>
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => { setAgentCommand(""); clearAriaFile(); }}
                        disabled={!agentCommand.trim() && !attachedFile}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                        style={{ background: "#B9FF4B", color: "#07080A", boxShadow: (agentCommand || attachedFile) ? "0 0 20px -4px rgba(185,255,75,0.5)" : "none" }}>
                        <Send className="w-3.5 h-3.5" /> Enviar para ARIA
                      </button>
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
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>{MARKETING_TEAM.length} agentes</span>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {MARKETING_TEAM.map((agent, i) => {
                      const task = client.agentTasks[agent.id];
                      const isWorking = task?.status === "trabalhando";
                      const isDone = task?.status === "concluído";
                      const isSelected = selectedAgentId === agent.id;
                      const isViewing = viewingAgentId === agent.id;
                      const isActive = isSelected || isViewing;

                      return (
                        <motion.div key={agent.id}
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="rounded-2xl p-4 flex flex-col cursor-default"
                          style={{
                            background: isActive ? `${agent.color}0d` : "rgba(255,255,255,0.025)",
                            border: `1px solid ${isActive ? `${agent.color}40` : isWorking ? `${agent.color}28` : "rgba(255,255,255,0.07)"}`,
                            boxShadow: isActive ? `0 0 32px -10px ${agent.color}40` : isWorking ? `0 0 28px -10px ${agent.color}30` : "none",
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
                            {isDone && !isWorking && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: "#34D399" }} />}
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
                                <p className="text-[11px] leading-relaxed line-clamp-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                                  {task.current}
                                </p>
                              </div>

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

                          <div className="mt-auto flex gap-1.5">
                            <button
                              onClick={() => {
                                setViewingAgentId(isViewing ? null : agent.id);
                                if (!isViewing) setSelectedAgentId(null);
                              }}
                              className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                              style={{
                                background: isViewing ? `${agent.color}22` : `${agent.color}08`,
                                color: agent.color,
                                border: `1px solid ${isViewing ? `${agent.color}45` : `${agent.color}20`}`,
                              }}>
                              {isViewing ? "▲ Fechar" : "Ver"}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAgentId(isSelected ? null : agent.id);
                                setViewingAgentId(null);
                                setAgentInstruction("");
                                clearAgentFile();
                              }}
                              className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                              style={{
                                background: isSelected ? `${agent.color}22` : `${agent.color}08`,
                                color: agent.color,
                                border: `1px solid ${isSelected ? `${agent.color}45` : `${agent.color}20`}`,
                              }}>
                              {isSelected ? "▲ Fechar" : "Dar instrução"}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* ── Painel de instrução individual ── */}
                  <AnimatePresence>
                    {selectedAgent && (
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
                                  Instrução para {selectedAgent.name}
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

                            {/* Textarea */}
                            <textarea
                              value={agentInstruction}
                              onChange={(e) => setAgentInstruction(e.target.value)}
                              placeholder={`O que você quer que ${selectedAgent.name} faça? Seja específico...`}
                              rows={3}
                              autoFocus
                              className="w-full rounded-xl px-4 py-3 text-sm resize-none mb-3"
                              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${selectedAgent.color}28`, color: "#F0F0F0", outline: "none" }}
                            />

                            {/* Attach + Send row */}
                            <div className="flex items-center gap-3">
                              {agentFile ? (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
                                  style={{ background: `${selectedAgent.color}12`, border: `1px solid ${selectedAgent.color}28` }}>
                                  {agentFile.type.startsWith("image/")
                                    ? <Image className="w-3 h-3 flex-shrink-0" style={{ color: selectedAgent.color }} />
                                    : <FileText className="w-3 h-3 flex-shrink-0" style={{ color: selectedAgent.color }} />
                                  }
                                  <span className="text-[11px] font-medium max-w-[180px] truncate" style={{ color: "rgba(255,255,255,0.7)" }}>
                                    {agentFile.name}
                                  </span>
                                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                                    {(agentFile.size / 1024).toFixed(0)} KB
                                  </span>
                                  <button onClick={clearAgentFile}
                                    style={{ color: "rgba(255,255,255,0.3)" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#F87171")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => agentFileRef.current?.click()}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-shrink-0"
                                  style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px dashed rgba(255,255,255,0.14)" }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${selectedAgent.color}50`; e.currentTarget.style.color = selectedAgent.color; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}>
                                  <Paperclip className="w-3 h-3" /> Anexar referência
                                </button>
                              )}

                              <div className="flex-1" />

                              <button
                                onClick={() => { setAgentInstruction(""); clearAgentFile(); setSelectedAgentId(null); }}
                                disabled={!agentInstruction.trim() && !agentFile}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                                style={{ background: selectedAgent.color, color: "#07080A", boxShadow: (agentInstruction || agentFile) ? `0 0 20px -4px ${selectedAgent.color}60` : "none" }}>
                                <Send className="w-3.5 h-3.5" /> Enviar para {selectedAgent.name}
                              </button>
                            </div>

                            {agentFile && renderFilePreview(agentFile, agentFileUrl, agentFileText, selectedAgent.color)}
                          </div>
                        </motion.div>
                      )}
                  </AnimatePresence>
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
                CURSOS
            ══════════════════════════════════════════════════════ */}
            {activeTab === "courses" && (
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
                  {INTEGRATIONS_BASE.filter((i) => i.id !== "whatsapp").map((integ) => (
                    <motion.div key={integ.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-5"
                      style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${integ.connected ? integ.border : "rgba(255,255,255,0.07)"}` }}>
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
                      </div>
                      {integ.connected && integ.account && (
                        <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: `${integ.color}10`, border: `1px solid ${integ.color}20` }}>
                          <div className="text-[11px] font-medium" style={{ color: integ.color }}>{integ.account}</div>
                          {integ.followers && <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{integ.followers}</div>}
                        </div>
                      )}
                      <div className="mb-3 space-y-1.5">
                        {integ.features.slice(0, 3).map((f) => (
                          <div key={f} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: integ.connected ? "#34D399" : "rgba(255,255,255,0.15)" }} />
                            <span className="text-[10px]" style={{ color: integ.connected ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}>{f}</span>
                          </div>
                        ))}
                      </div>
                      <button className="w-full py-2 rounded-xl text-[11px] font-medium transition-all"
                        style={integ.connected
                          ? { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }
                          : { background: integ.bg, color: integ.color, border: `1px solid ${integ.border}` }}>
                        {integ.connected ? "Gerenciar" : `Conectar`}
                      </button>
                    </motion.div>
                  ))}
                </div>

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
                        {/* Groups selector */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                              Grupos disponíveis ({wpGroups.length})
                            </h3>
                            <button onClick={refreshWpGroups}
                              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all"
                              style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <RefreshCw className="w-3 h-3" /> Atualizar
                            </button>
                          </div>
                          {wpGroups.length === 0 ? (
                            <div className="py-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                              Nenhum grupo encontrado. Clique em Atualizar.
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {wpGroups.map((g) => {
                                const selected = wpSelectedGroups.includes(g.id);
                                return (
                                  <button key={g.id} onClick={() => toggleGroup(g.id)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                                    style={{
                                      background: selected ? "rgba(37,211,102,0.1)" : "rgba(255,255,255,0.03)",
                                      border: selected ? "1px solid rgba(37,211,102,0.3)" : "1px solid rgba(255,255,255,0.07)",
                                    }}>
                                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                                      style={{ background: selected ? "#25D366" : "rgba(255,255,255,0.08)" }}>
                                      {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[11px] font-medium truncate" style={{ color: selected ? "#25D366" : "rgba(255,255,255,0.65)" }}>{g.name}</div>
                                      <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{g.participants} membros</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Message composer */}
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                            Mensagem para disparar
                          </h3>
                          <textarea
                            value={wpMessage}
                            onChange={(e) => setWpMessage(e.target.value)}
                            rows={4}
                            placeholder="Digite a mensagem que será enviada para os grupos selecionados..."
                            className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                            style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "rgba(255,255,255,0.8)",
                              outline: "none",
                            }}
                          />
                        </div>

                        {/* Blast button + result */}
                        <div className="flex items-center gap-4">
                          <button
                            onClick={doWpBlast}
                            disabled={wpBlasting || !wpSelectedGroups.length || !wpMessage.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                            style={{ background: "#25D366", color: "#fff", boxShadow: wpBlasting ? "none" : "0 0 20px -4px rgba(37,211,102,0.4)" }}>
                            {wpBlasting ? (
                              <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando…</>
                            ) : (
                              <><Send className="w-4 h-4" /> Disparar para {wpSelectedGroups.length || "—"} grupo{wpSelectedGroups.length !== 1 ? "s" : ""}</>
                            )}
                          </button>
                          {wpBlastResult && (
                            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                              style={{ background: "rgba(52,211,153,0.1)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> {wpBlastResult}
                            </div>
                          )}
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
                                download={`isadora-${img.id}.png`}
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
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>Formato</span>
                        {(["1:1", "9:16", "16:9"] as const).map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setDesignAspectRatio(ratio)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                            style={{
                              background: designAspectRatio === ratio ? `${viewedAgent.color}20` : "rgba(255,255,255,0.05)",
                              border: `1px solid ${designAspectRatio === ratio ? `${viewedAgent.color}50` : "rgba(255,255,255,0.1)"}`,
                              color: designAspectRatio === ratio ? viewedAgent.color : "rgba(255,255,255,0.4)",
                            }}>
                            {ratio}
                          </button>
                        ))}
                      </div>
                    )}
                    <textarea
                      value={agentInstruction}
                      onChange={(e) => setAgentInstruction(e.target.value)}
                      placeholder={viewedAgent.id === "designer" ? "Descreva a peça visual que a Isadora deve criar..." : `O que você quer que ${viewedAgent.name} faça?`}
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${viewedAgent.color}25`, color: "#F0F0F0", outline: "none" }}
                    />
                    {agentFile && <div className="mt-2">{renderFilePreview(agentFile, agentFileUrl, agentFileText, viewedAgent.color)}</div>}
                    {isadoraError && viewedAgent.id === "designer" && (
                      <div className="mt-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
                        Erro: {isadoraError}
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
                        disabled={(!agentInstruction.trim() && !agentFile) || isadoraLoading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                        style={{ background: viewedAgent.color, color: "#07080A", boxShadow: (agentInstruction || agentFile) ? `0 0 20px -4px ${viewedAgent.color}70` : "none" }}>
                        {isadoraLoading && viewedAgent.id === "designer" ? (
                          <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                        ) : (
                          <><Send className="w-3.5 h-3.5" /> Enviar para {viewedAgent.name}</>
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

    </div>
  );
}
