import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2, Clock, Zap, AlertCircle, Star, MessageCircle,
  Mail, Users, FileText, Megaphone, TrendingUp, Wallet,
  ChevronDown, ChevronUp, ArrowUpRight, Circle, Loader2,
  ClipboardList, Building2, Key, Settings, FolderOpen,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
type ClientRow = {
  id: string;
  name: string;
  segment: string | null;
  status: string;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  workspace_id: string | null;
};
type BriefingRow = {
  completeness_score: number;
  missing_fields: string[];
  brand_name: string | null;
  segment: string | null;
  target_audience: string | null;
  brand_voice: string | null;
  goals: string[] | null;
  active_platforms: string[] | null;
  post_frequency: string | null;
  differentials: string | null;
};
type OnboardingItem = {
  id: string;
  category: "redes_sociais" | "acessos" | "configuracao" | "documentos" | "geral";
  title: string;
  description: string | null;
  responsible: "agency" | "client";
  status: "pending" | "in_progress" | "waiting" | "completed";
  order_index: number;
  notes: string | null;
  completed_at: string | null;
};
type DemandItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "waiting_client" | "completed";
  responsible: "agency" | "client";
  due_date: string | null;
  created_at: string;
};
type AgentProposal = {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_color: string;
  titulo: string;
  descricao: string;
  status: "pending" | "approved" | "in_progress" | "completed";
  created_at: string;
};
type PortalData = {
  client: ClientRow;
  briefing: BriefingRow | null;
  onboarding: OnboardingItem[];
  demands: DemandItem[];
};

// ── Static team ─────────────────────────────────────────────
const PORTAL_TEAM = [
  { id: "aria",       name: "Luna",    role: "Orquestradora Geral",    initial: "Lu", color: "#B9FF4B", desc: "Coordena todo o time e garante que a estratégia seja executada no prazo certo." },
  { id: "strategist", name: "Queila",  role: "Estrategista-Chefe",     initial: "Q",  color: "#FBBF24", desc: "Define seu posicionamento, pauta editorial e direção criativa de marca." },
  { id: "copywriter", name: "Beatriz", role: "Copywriter",             initial: "B",  color: "#A78BFA", desc: "Escreve cada texto, legenda, artigo e anúncio com foco em conversão." },
  { id: "designer",   name: "Marcela", role: "Designer",               initial: "M",  color: "#D946EF", desc: "Cria todos os visuais alinhados ao manual de marca da sua empresa." },
  { id: "traffic",    name: "Rafaela", role: "Gestora de Tráfego",     initial: "R",  color: "#F97316", desc: "Gerencia campanhas pagas com foco em CPA baixo e ROAS alto." },
  { id: "social",     name: "Marina",  role: "Social Media",           initial: "Ma", color: "#60A5FA", desc: "Agenda, publica e monitora todo o conteúdo orgânico diariamente." },
  { id: "calendario", name: "Pedro",   role: "Calendário Editorial",   initial: "P",  color: "#2DD4BF", desc: "Planeja o calendário editorial, pilares de conteúdo e cronograma do mês." },
  { id: "analyst",    name: "Lucas",   role: "Analista de Dados",      initial: "L",  color: "#34D399", desc: "Monitora métricas e entrega relatórios com insights acionáveis." },
  { id: "site",       name: "Teo",     role: "Editor de Site",         initial: "T",  color: "#06B6D4", desc: "Atualiza seu site, publica no blog e otimiza páginas para SEO." },
  { id: "revisor",    name: "Vitória", role: "Revisora",               initial: "V",  color: "#EC4899", desc: "Revisa e corrige 100% do conteúdo antes de publicar." },
  { id: "briefing",   name: "Lia",     role: "Agente de Diagnóstico",  initial: "Li", color: "#38BDF8", desc: "Coleta briefing, analisa o cenário e entrega diagnóstico personalizado." },
  { id: "video",      name: "Bobby",   role: "Editor de Vídeo",        initial: "Bo", color: "#B9FF4B", desc: "Edita vídeos com IA: cortes, efeitos cinematográficos, legendas e color grade." },
];

const marketRates: Record<string, { role: string; min: number; max: number }> = {
  strategist: { role: "Gerente de Marketing Sênior",  min: 8000,  max: 14000 },
  copywriter: { role: "Redator / Copywriter Sênior",  min: 5000,  max: 8000  },
  designer:   { role: "Designer Gráfico Sênior",      min: 5000,  max: 9000  },
  traffic:    { role: "Especialista em Tráfego Pago", min: 5000,  max: 9000  },
  social:     { role: "Social Media Pleno/Sênior",    min: 3500,  max: 5500  },
  analyst:    { role: "Analista de Marketing Digital",min: 4500,  max: 7000  },
  site:       { role: "Web Designer / WordPress Dev", min: 4000,  max: 6500  },
  revisor:    { role: "Revisora / Editora de Texto",  min: 2500,  max: 4000  },
  briefing:   { role: "Consultor de Onboarding",      min: 3000,  max: 5000  },
  video:      { role: "Editor de Vídeo Profissional", min: 4500,  max: 8000  },
  calendario: { role: "Coordenador Editorial",        min: 3500,  max: 5500  },
};
const MARKET_TOTAL_MIN = Object.values(marketRates).reduce((s, m) => s + m.min, 0);

// ── Helpers ─────────────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  redes_sociais: "Redes Sociais",
  acessos:       "Acessos & Senhas",
  configuracao:  "Configuração",
  documentos:    "Documentos",
  geral:         "Geral",
};
const CATEGORY_ICON: Record<string, typeof Building2> = {
  redes_sociais: Megaphone,
  acessos:       Key,
  configuracao:  Settings,
  documentos:    FolderOpen,
  geral:         ClipboardList,
};
const PRIORITY_COLOR: Record<string, string> = {
  low:    "#94A3B8",
  medium: "#60A5FA",
  high:   "#F97316",
  urgent: "#EF4444",
};
const PRIORITY_LABEL: Record<string, string> = {
  low:    "Baixa",
  medium: "Média",
  high:   "Alta",
  urgent: "Urgente",
};
const STATUS_DEMAND: Record<string, { label: string; color: string; bg: string }> = {
  pending:        { label: "Pendente",          color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  in_progress:    { label: "Em andamento",      color: "#B9FF4B", bg: "rgba(185,255,75,0.1)" },
  waiting_client: { label: "Aguardando você",   color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
  completed:      { label: "Concluído",         color: "#34D399", bg: "rgba(52,211,153,0.1)" },
};
const MISSING_LABEL: Record<string, string> = {
  brand_name:      "Nome da marca",
  segment:         "Segmento / nicho",
  target_audience: "Público-alvo",
  brand_voice:     "Tom de voz",
  goals:           "Objetivos",
  active_platforms:"Plataformas ativas",
  post_frequency:  "Frequência de posts",
  differentials:   "Diferenciais da marca",
};

function statusOnboarding(status: OnboardingItem["status"]) {
  if (status === "completed")  return { icon: CheckCircle2, color: "#34D399", label: "Concluído" };
  if (status === "in_progress") return { icon: Loader2,     color: "#B9FF4B", label: "Em andamento" };
  if (status === "waiting")    return { icon: AlertCircle,  color: "#FBBF24", label: "Aguardando" };
  return { icon: Clock, color: "#94A3B8", label: "Pendente" };
}

// ── Loading & Error screens ──────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0A0A10 0%, #141420 100%)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#B9FF4B" }}>
          <Zap className="w-5 h-5" style={{ color: "#07080A" }} />
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Carregando seu portal…</p>
      </div>
    </div>
  );
}

function NotFoundScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0A0A10 0%, #141420 100%)" }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#B9FF4B" }}>
          <Zap className="w-6 h-6" style={{ color: "#07080A" }} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Portal não encontrado</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          O link pode ter expirado ou estar incorreto.<br />Entre em contato com a agência.
        </p>
        <a href="mailto:carolinielucas.cl@gmail.com"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "#B9FF4B", color: "#07080A" }}>
          <Mail className="w-4 h-4" /> Falar com a Calu
        </a>
      </div>
    </div>
  );
}

// ── Main portal ──────────────────────────────────────────────
export default function ClientPortal() {
  const { token } = useParams<{ token?: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expandedDemand, setExpandedDemand] = useState<string | null>(null);
  const [proposals, setProposals] = useState<AgentProposal[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    // Auto-read password from URL hash (shared link with password)
    const hashPwd = window.location.hash ? decodeURIComponent(window.location.hash.slice(1)) : null;
    (supabase as any).rpc("get_portal_data", { p_token: token, p_password: hashPwd }).then(({ data: res, error }: any) => {
      if (error || !res) { setNotFound(true); setLoading(false); return; }
      if ((res as any).error === "wrong_password") {
        setPasswordRequired(true);
        setLoading(false);
        return;
      }
      if (hashPwd) window.history.replaceState(null, "", window.location.pathname);
      setData(res as PortalData);
      setLoading(false);
    });
  }, [token]);

  const handlePasswordSubmit = async () => {
    if (!token || !passwordInput.trim()) return;
    setCheckingPassword(true);
    setPasswordError(false);
    const { data: res, error } = await (supabase as any).rpc("get_portal_data", { p_token: token, p_password: passwordInput.trim() });
    setCheckingPassword(false);
    if (error || !res || (res as any).error === "wrong_password") {
      setPasswordError(true);
      return;
    }
    setPasswordRequired(false);
    setData(res as PortalData);
  };

  useEffect(() => {
    const wid = data?.client?.workspace_id;
    if (!wid) return;
    setProposalsLoading(true);
    (supabase as any).from("agent_proposals").select("*")
      .eq("client_id", wid).neq("status", "rejected")
      .order("created_at", { ascending: false })
      .then(({ data: rows }: any) => {
        if (rows) setProposals(rows);
        setProposalsLoading(false);
      });
  }, [data?.client?.workspace_id]);

  const [deliverables, setDeliverables] = useState<any[]>([]);
  useEffect(() => {
    const wid = data?.client?.workspace_id;
    if (!wid) return;
    (supabase as any).from("client_deliverables").select("*")
      .eq("client_id", wid).eq("visible_to_client", true)
      .order("done_at", { ascending: false })
      .then(({ data: rows }: any) => { if (rows) setDeliverables(rows); });
  }, [data?.client?.workspace_id]);

  if (loading) return <LoadingScreen />;
  if (notFound) return <NotFoundScreen />;

  if (passwordRequired && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#07080A" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-2xl font-black tracking-tight text-white">
              Calu<span style={{ color: "#B9FF4B" }}>.</span>
            </div>
            <div className="text-[10px] mt-1 uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
              Portal do Cliente
            </div>
          </div>
          <div className="rounded-2xl p-6 space-y-4" style={{ background: "#0F1116", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(185,255,75,0.1)", border: "1px solid rgba(185,255,75,0.2)" }}>
                <Key className="w-5 h-5" style={{ color: "#B9FF4B" }} />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Acesso protegido</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Digite a senha para continuar</div>
              </div>
            </div>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") handlePasswordSubmit(); }}
              placeholder="Senha de acesso"
              autoFocus
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${passwordError ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
                color: "#F0F0F0",
              }}
            />
            {passwordError && (
              <div className="text-xs" style={{ color: "#FCA5A5" }}>Senha incorreta. Tente novamente.</div>
            )}
            <button onClick={handlePasswordSubmit} disabled={checkingPassword || !passwordInput.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
              style={{ background: "#B9FF4B", color: "#07080A" }}>
              {checkingPassword ? "Verificando..." : "Entrar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return <NotFoundScreen />;

  const { client, briefing, onboarding, demands } = data;

  const briefingMissing = briefing
    ? briefing.missing_fields
    : ["brand_name","segment","target_audience","brand_voice","goals","active_platforms","post_frequency","differentials"];
  const briefingScore = briefing?.completeness_score ?? 0;

  const onboardingByCategory = onboarding.reduce<Record<string, OnboardingItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const totalOnboarding  = onboarding.length;
  const doneOnboarding   = onboarding.filter(i => i.status === "completed").length;
  const onboardingPct    = totalOnboarding > 0 ? Math.round((doneOnboarding / totalOnboarding) * 100) : 0;

  const openDemands      = demands.filter(d => d.status !== "completed");
  const waitingMe        = demands.filter(d => d.status === "waiting_client");

  return (
    <div className="min-h-screen" style={{ background: "#F2F1EE", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#B9FF4B" }}>
            <Zap className="w-4 h-4" style={{ color: "#07080A" }} />
          </div>
          <span className="text-sm font-bold" style={{ color: "#111" }}>Calu Agência</span>
          <div className="w-px h-4 mx-1" style={{ background: "#ddd" }} />
          <span className="text-sm font-medium" style={{ color: "#555" }}>{client.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {waitingMe.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: "rgba(251,191,36,0.12)", color: "#D97706", border: "1px solid rgba(251,191,36,0.25)" }}>
              <AlertCircle className="w-3 h-3" /> {waitingMe.length} aguardando você
            </div>
          )}
          <div className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: "rgba(185,255,75,0.15)", color: "#3a6e00", border: "1px solid rgba(185,255,75,0.4)" }}>
            Portal exclusivo
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-6">

        {/* ── Hero ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-3xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0A0A10 0%, #141420 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="px-8 py-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Bem-vindo ao seu portal
                  </div>
                  <h1 className="text-2xl font-bold mb-1" style={{ color: "#F0F0F0" }}>
                    Olá, {client.name} 👋
                  </h1>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {client.segment ? `${client.segment} · ` : ""}Acompanhe tudo que está sendo feito pela Calu Agência
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  Time ativo agora
                </div>
              </div>

              {/* Onboarding progress bar */}
              <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Progresso do onboarding
                  </span>
                  <span className="text-xs font-bold" style={{ color: "#B9FF4B" }}>{onboardingPct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${onboardingPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "#B9FF4B" }}
                  />
                </div>
                <div className="flex items-center gap-4 mt-2 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <span style={{ color: "#34D399" }}>✓ {doneOnboarding} concluídos</span>
                  <span>{totalOnboarding - doneOnboarding} pendentes</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Briefing da marca ────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>

            {/* Header */}
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-bold" style={{ color: "#111" }}>Sobre sua marca</h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{
                    background: briefingScore === 100 ? "rgba(52,211,153,0.12)" : briefingScore > 0 ? "rgba(185,255,75,0.15)" : "rgba(251,191,36,0.1)",
                    color: briefingScore === 100 ? "#059669" : briefingScore > 0 ? "#3a6e00" : "#D97706",
                  }}>
                  {briefingScore}% completo
                </span>
              </div>
              <p className="text-xs" style={{ color: "#888" }}>
                Informações que guiam todo o trabalho dos agentes para a sua marca
              </p>
              {briefingScore > 0 && briefingScore < 100 && (
                <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.06)" }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${briefingScore}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full" style={{ background: "#B9FF4B" }}
                  />
                </div>
              )}
            </div>

            {/* Grid de campos */}
            <div className="p-4 grid grid-cols-2 gap-2.5">
              {([
                { key: "brand_name",       label: "Nome da marca",       value: briefing?.brand_name,                            full: false },
                { key: "segment",          label: "Segmento / nicho",     value: briefing?.segment,                               full: false },
                { key: "brand_voice",      label: "Tom de voz",           value: briefing?.brand_voice,                           full: false },
                { key: "post_frequency",   label: "Frequência de posts",  value: briefing?.post_frequency,                        full: false },
                { key: "target_audience",  label: "Público-alvo",         value: briefing?.target_audience,                       full: true  },
                { key: "differentials",    label: "Diferenciais da marca",value: briefing?.differentials,                         full: true  },
                { key: "active_platforms", label: "Plataformas ativas",   value: briefing?.active_platforms?.join(" · ") ?? null, full: false },
                { key: "goals",            label: "Objetivos",            value: briefing?.goals?.join(" · ") ?? null,            full: true  },
              ] as { key: string; label: string; value: string | null | undefined; full: boolean }[]).map(({ key, label, value, full }) => {
                const filled = !!value && value.trim() !== "";
                return (
                  <div key={key}
                    className={`rounded-xl p-3 ${full ? "col-span-2" : ""}`}
                    style={{
                      background: filled ? "#FAFAF9" : "rgba(0,0,0,0.015)",
                      border: `1px solid ${filled ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.04)"}`,
                    }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {filled
                        ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                        : <Circle className="w-3 h-3 flex-shrink-0" style={{ color: "#ddd" }} />}
                      <span className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: filled ? "#888" : "#ccc" }}>
                        {label}
                      </span>
                    </div>
                    {filled
                      ? <p className="text-xs font-medium leading-relaxed pl-4.5" style={{ color: "#222", paddingLeft: "18px" }}>{value}</p>
                      : <p className="text-xs pl-4.5" style={{ color: "#ccc", paddingLeft: "18px" }}>Não informado</p>}
                  </div>
                );
              })}
            </div>

            {/* CTA quando vazio */}
            {briefingScore === 0 && (
              <div className="px-5 pb-5">
                <a href="mailto:carolinielucas.cl@gmail.com?subject=Briefing"
                  className="text-xs font-semibold underline" style={{ color: "#D97706" }}>
                  Enviar informações para a agência →
                </a>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Onboarding checklist ─────────────────────────── */}
        {onboarding.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <h2 className="text-base font-bold mb-0.5" style={{ color: "#111" }}>Checklist de onboarding</h2>
                <p className="text-xs" style={{ color: "#888" }}>
                  Tudo que precisa acontecer para começarmos a trabalhar — o que é seu e o que é nosso
                </p>
              </div>

              <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                {Object.entries(onboardingByCategory).map(([category, items]) => {
                  const Icon = CATEGORY_ICON[category] ?? ClipboardList;
                  const categoryDone = items.filter(i => i.status === "completed").length;
                  return (
                    <div key={category} className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="w-3.5 h-3.5" style={{ color: "#B9FF4B" }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#555" }}>
                          {CATEGORY_LABEL[category] ?? category}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto"
                          style={{ background: "rgba(0,0,0,0.05)", color: "#888" }}>
                          {categoryDone}/{items.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {items.map((item) => {
                          const s = statusOnboarding(item.status);
                          const Icon2 = s.icon;
                          const isClient = item.responsible === "client";
                          return (
                            <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl"
                              style={{
                                background: item.status === "completed" ? "rgba(52,211,153,0.04)" : "rgba(0,0,0,0.02)",
                                border: `1px solid ${item.status === "completed" ? "rgba(52,211,153,0.15)" : "rgba(0,0,0,0.05)"}`,
                                opacity: item.status === "completed" ? 0.75 : 1,
                              }}>
                              <Icon2
                                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.status === "in_progress" ? "animate-spin" : ""}`}
                                style={{ color: s.color }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                  <span className="text-xs font-semibold"
                                    style={{ color: "#222", textDecoration: item.status === "completed" ? "line-through" : "none" }}>
                                    {item.title}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                                    style={{
                                      background: isClient ? "rgba(185,255,75,0.15)" : "rgba(96,165,250,0.12)",
                                      color: isClient ? "#3a6e00" : "#2563EB",
                                      border: `1px solid ${isClient ? "rgba(185,255,75,0.3)" : "rgba(96,165,250,0.2)"}`,
                                    }}>
                                    {isClient ? "Você" : "Agência"}
                                  </span>
                                </div>
                                {item.description && (
                                  <p className="text-[11px] leading-relaxed" style={{ color: "#777" }}>
                                    {item.description}
                                  </p>
                                )}
                                {item.notes && (
                                  <div className="mt-2 rounded-xl p-3"
                                    style={{ background: "rgba(185,255,75,0.06)", border: "1px solid rgba(185,255,75,0.2)" }}>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#5BAD2F" }}>
                                      Resposta da agência
                                    </p>
                                    <p className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: "#444" }}>
                                      {item.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] flex-shrink-0 font-medium" style={{ color: s.color }}>
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Propostas & Ações dos Agentes ───────────────── */}
        {(proposalsLoading || proposals.length > 0) && (() => {
          const PROP_STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
            pending:     { label: "Aguardando",    color: "#D97706", bg: "rgba(251,191,36,0.08)",   border: "rgba(251,191,36,0.2)"   },
            approved:    { label: "Aprovado",      color: "#2563EB", bg: "rgba(37,99,235,0.07)",    border: "rgba(37,99,235,0.18)"   },
            in_progress: { label: "Em andamento",  color: "#059669", bg: "rgba(5,150,105,0.07)",    border: "rgba(5,150,105,0.18)"   },
            completed:   { label: "Concluído",     color: "#6B7280", bg: "rgba(107,114,128,0.06)",  border: "rgba(107,114,128,0.15)" },
          };
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <h2 className="text-base font-bold mb-0.5" style={{ color: "#111" }}>Propostas & Ações</h2>
                  <p className="text-xs" style={{ color: "#888" }}>
                    {proposals.length > 0 ? `${proposals.length} ação${proposals.length !== 1 ? "ões" : ""} dos agentes` : "Ações propostas pelos agentes"}
                  </p>
                </div>

                <div className="p-4 space-y-2">
                  {proposalsLoading && (
                    <div className="flex justify-center py-6">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin" />
                    </div>
                  )}

                  {!proposalsLoading && proposals.map((proposal) => {
                    const st = PROP_STATUS[proposal.status] ?? PROP_STATUS.approved;
                    return (
                      <div key={proposal.id} className="rounded-xl p-3.5 flex items-start gap-3"
                        style={{ background: "#FAFAF9", border: `1px solid ${st.border}` }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                          style={{ background: `${proposal.agent_color}15`, color: proposal.agent_color, border: `1px solid ${proposal.agent_color}25` }}>
                          {proposal.agent_name?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="text-xs font-semibold" style={{ color: "#111" }}>{proposal.titulo}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                              style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                              {proposal.status === "in_progress" && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle animate-pulse" style={{ background: st.color }} />
                              )}
                              {st.label}
                            </span>
                          </div>
                          <p className="text-[11px]" style={{ color: "#888" }}>
                            {proposal.agent_name} · {proposal.descricao?.slice(0, 90)}{(proposal.descricao?.length ?? 0) > 90 ? "…" : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ── Entregas ─────────────────────────────────────── */}
        {deliverables.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <h2 className="text-base font-bold mb-0.5" style={{ color: "#111" }}>O que fizemos por você</h2>
                <p className="text-xs" style={{ color: "#888" }}>{deliverables.length} entrega{deliverables.length !== 1 ? "s" : ""} registrada{deliverables.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                {deliverables.map((d) => (
                  <div key={d.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(185,255,75,0.12)" }}>
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#5BAD2F" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "#111" }}>{d.description}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                        {new Date(d.done_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Demandas ─────────────────────────────────────── */}
        {demands.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold mb-0.5" style={{ color: "#111" }}>Demandas em andamento</h2>
                    <p className="text-xs" style={{ color: "#888" }}>
                      {openDemands.length} abertas · {demands.filter(d => d.status === "completed").length} concluídas
                    </p>
                  </div>
                  {waitingMe.length > 0 && (
                    <div className="text-xs px-3 py-1.5 rounded-full font-semibold"
                      style={{ background: "rgba(251,191,36,0.1)", color: "#D97706", border: "1px solid rgba(251,191,36,0.25)" }}>
                      {waitingMe.length} aguardando você
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-2">
                {demands.map((d, i) => {
                  const st = STATUS_DEMAND[d.status] ?? STATUS_DEMAND.pending;
                  const isExpanded = expandedDemand === d.id;
                  const isOverdue = d.due_date && new Date(d.due_date) < new Date() && d.status !== "completed";
                  return (
                    <motion.div key={d.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 + i * 0.04 }}
                      className="rounded-xl overflow-hidden"
                      style={{
                        border: `1px solid ${d.status === "waiting_client" ? "rgba(251,191,36,0.3)" : "rgba(0,0,0,0.07)"}`,
                        background: d.status === "waiting_client" ? "rgba(251,191,36,0.03)" : "#FAFAF9",
                      }}>
                      <div className="flex items-start gap-3 p-3.5 cursor-pointer"
                        onClick={() => setExpandedDemand(isExpanded ? null : d.id)}>
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: PRIORITY_COLOR[d.priority] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-xs font-semibold" style={{ color: "#111" }}>{d.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                              style={{ background: st.bg, color: st.color }}>
                              {st.label}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                                style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
                                Atrasado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px]" style={{ color: "#aaa" }}>
                            <span>{PRIORITY_LABEL[d.priority]}</span>
                            <span>·</span>
                            <span>{d.responsible === "client" ? "Você precisa agir" : "Agência responsável"}</span>
                            {d.due_date && (
                              <><span>·</span>
                              <span style={{ color: isOverdue ? "#EF4444" : "#aaa" }}>
                                Prazo: {new Date(d.due_date).toLocaleDateString("pt-BR")}
                              </span></>
                            )}
                          </div>
                        </div>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "#bbb" }} />
                          : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "#bbb" }} />}
                      </div>
                      <AnimatePresence>
                        {isExpanded && d.description && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: "hidden" }}>
                            <div className="px-4 pb-4">
                              <p className="text-xs leading-relaxed p-3 rounded-xl"
                                style={{ background: "rgba(0,0,0,0.03)", color: "#555", border: "1px solid rgba(0,0,0,0.05)" }}>
                                {d.description}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quando ainda não há onboarding nem demandas */}
        {onboarding.length === 0 && demands.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="rounded-2xl p-8 text-center bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <ClipboardList className="w-8 h-8 mx-auto mb-3" style={{ color: "#ddd" }} />
              <p className="text-sm font-semibold mb-1" style={{ color: "#555" }}>Preparando tudo para você</p>
              <p className="text-xs" style={{ color: "#aaa" }}>
                O checklist e as demandas aparecerão aqui assim que a agência configurar sua conta.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Time de especialistas ────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <h2 className="text-base font-bold mb-0.5" style={{ color: "#111" }}>Seu time de especialistas</h2>
              <p className="text-xs" style={{ color: "#888" }}>
                {PORTAL_TEAM.length} profissionais dedicados à {client.name} todos os dias
              </p>
            </div>

            {/* Luna destaque */}
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(185,255,75,0.03)" }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#B9FF4B", boxShadow: "0 0 20px -4px rgba(185,255,75,0.4)" }}>
                  <Zap className="w-5 h-5" style={{ color: "#07080A" }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold" style={{ color: "#111" }}>Luna</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(185,255,75,0.2)", color: "#3a6e00" }}>
                      Orquestradora Geral
                    </span>
                    <span className="ml-auto text-[10px] flex items-center gap-1" style={{ color: "#10B981" }}>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                      Ativa agora
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "#666" }}>
                    A inteligência central que coordena toda a equipe — garante que a estratégia certa seja executada, no tempo certo, com qualidade.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-0">
              {PORTAL_TEAM.slice(1).map((member, i) => (
                <div key={member.id} className="p-4"
                  style={{
                    borderBottom: i < PORTAL_TEAM.length - 4 ? "1px solid rgba(0,0,0,0.05)" : "none",
                    borderRight: (i % 3 !== 2) ? "1px solid rgba(0,0,0,0.05)" : "none",
                  }}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: `${member.color}20`, border: `1px solid ${member.color}35`, color: member.color }}>
                      {member.initial}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate" style={{ color: "#111" }}>{member.name}</div>
                      <div className="text-[10px] truncate" style={{ color: member.color }}>{member.role}</div>
                    </div>
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: "#888" }}>{member.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Quanto você economiza ────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <h2 className="text-base font-bold mb-0.5" style={{ color: "#111" }}>O valor que você tem</h2>
              <p className="text-xs" style={{ color: "#888" }}>Custo real de contratar cada profissional individualmente</p>
            </div>
            <div className="p-5 space-y-1 mb-2">
              {PORTAL_TEAM.slice(1).map((m, i) => {
                const rate = marketRates[m.id];
                if (!rate) return null;
                return (
                  <div key={m.id} className="grid grid-cols-3 gap-2 items-center px-3 py-2.5 rounded-xl"
                    style={{ background: i % 2 === 0 ? "#F9F8F6" : "transparent" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                        style={{ background: `${m.color}20`, color: m.color }}>{m.initial}</div>
                      <div>
                        <div className="text-[11px] font-semibold" style={{ color: "#222" }}>{m.name}</div>
                        <div className="text-[9px]" style={{ color: "#999" }}>{rate.role}</div>
                      </div>
                    </div>
                    <div className="text-center text-xs font-semibold" style={{ color: "#555" }}>
                      R$ {rate.min.toLocaleString("pt-BR")}–{rate.max.toLocaleString("pt-BR")}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Incluído</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mx-5 mb-5 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
              <div className="grid grid-cols-2">
                <div className="p-4" style={{ background: "#FEF2F2", borderRight: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#ef4444" }}>Contratar individualmente</div>
                  <div className="text-xl font-black" style={{ color: "#DC2626" }}>R$ {MARKET_TOTAL_MIN.toLocaleString("pt-BR")}+</div>
                  <div className="text-[11px]" style={{ color: "#999" }}>por mês</div>
                </div>
                <div className="p-4" style={{ background: "#F0FDF4" }}>
                  <div className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#10B981" }}>Com a Calu Agência</div>
                  <div className="text-xl font-black" style={{ color: "#059669" }}>Tudo incluído</div>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: "#10B981" }}>
                    <TrendingUp className="w-3 h-3" /> Economia real
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 flex items-center gap-2" style={{ background: "#F9F8F6", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                <Wallet className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10B981" }} />
                <p className="text-[11px]" style={{ color: "#666" }}>
                  Mais velocidade (24h), mais consistência (sem turnover) e mais resultado.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Fale com Caroline ───────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="rounded-2xl p-6 flex items-center justify-between bg-white"
            style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #F5C842, #E8930A)" }}>
                <Star className="w-6 h-6 fill-white text-white" />
              </div>
              <div>
                <div className="text-sm font-bold mb-0.5" style={{ color: "#111" }}>Fale com Caroline</div>
                <div className="text-xs" style={{ color: "#777" }}>Dúvidas, ideias ou alinhamento rápido — estou aqui.</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a href="mailto:carolinielucas.cl@gmail.com"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: "#F2F1EE", color: "#444", border: "1px solid rgba(0,0,0,0.1)" }}>
                <Mail className="w-3.5 h-3.5" /> E-mail
              </a>
              <a href="https://wa.me/5585986408404" target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: "#25D366", boxShadow: "0 4px 12px rgba(37,211,102,0.3)" }}>
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-[11px] py-2" style={{ color: "#bbb" }}>
          Portal exclusivo · Calu Agência · Informações confidenciais
        </p>
      </div>
    </div>
  );
}
