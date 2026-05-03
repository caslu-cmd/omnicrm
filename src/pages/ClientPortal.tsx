import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import {
  CheckCircle2, Clock, Eye, Heart, TrendingUp,
  Image, Film, BookOpen, Star, Sparkles, Zap,
  Users, MessageCircle, ArrowUpRight,
  FileText, Megaphone, Bell, Shield, Award, Target,
  Mail, DollarSign, ArrowRight, Wallet, Check,
  ThumbsUp, Download, X, ChevronDown, ChevronUp,
  AlertCircle, Lock, RefreshCw,
} from "lucide-react";
import { CLIENTS } from "@/data/agencyData";

// ── Agent team displayed in portal ───────────────────────────
const PORTAL_TEAM = [
  { id: "luana",      name: "Luana",    role: "Orquestradora Geral",      initial: "Lu", color: "#B9FF4B" },
  { id: "strategist", name: "Carolina", role: "Estrategista de Marca",   initial: "C", color: "#FBBF24" },
  { id: "copywriter", name: "Beatriz",  role: "Copywriter",              initial: "B", color: "#A78BFA" },
  { id: "designer",   name: "Isadora",  role: "Designer Visual",         initial: "I", color: "#D946EF" },
  { id: "traffic",    name: "Rafaela",  role: "Gestora de Tráfego",      initial: "R", color: "#F97316" },
  { id: "social",     name: "Marina",   role: "Social Media Manager",    initial: "M", color: "#60A5FA" },
  { id: "calendario", name: "Pedro",    role: "Calendário Editorial",     initial: "P", color: "#2DD4BF" },
  { id: "analyst",    name: "Lucas",    role: "Analista de Dados",       initial: "L", color: "#34D399" },
  { id: "sales",      name: "Eduardo",  role: "Agente de Vendas",        initial: "E", color: "#F59E0B" },
  { id: "site",       name: "Teo",      role: "Editor de Site",          initial: "T", color: "#06B6D4" },
  { id: "revisor",    name: "Vitória",  role: "Revisora de Conteúdo",    initial: "V", color: "#EC4899" },
];

const TEAM_DESCS: Record<string, string> = {
  luana:      "Coordena todo o time e garante que a estratégia seja executada no prazo certo.",
  strategist: "Define seu posicionamento, pauta editorial e direção criativa.",
  copywriter: "Escreve cada texto, legenda, artigo e anúncio com foco em conversão.",
  designer:   "Cria todos os visuais alinhados ao manual de marca da sua empresa.",
  traffic:    "Gerencia campanhas pagas com foco em CPA baixo e ROAS alto.",
  social:     "Agenda, publica e monitora todo o conteúdo orgânico diariamente.",
  analyst:    "Monitora métricas e entrega relatórios com insights acionáveis.",
  sales:      "Qualifica leads via WhatsApp e alimenta seu CRM para fechar negócios.",
  site:       "Atualiza seu site, publica no blog e otimiza páginas para SEO.",
  calendario: "Planeja o calendário editorial, pilares de conteúdo e cronograma de campanhas do mês.",
  revisor:    "Revisa e corrige 100% do conteúdo antes de publicar.",
};

const marketRates: Record<string, { role: string; min: number; max: number }> = {
  strategist: { role: "Gerente de Marketing Sênior",    min: 8000,  max: 14000 },
  copywriter: { role: "Redator / Copywriter Sênior",    min: 5000,  max: 8000  },
  designer:   { role: "Designer Gráfico Sênior",        min: 5000,  max: 9000  },
  traffic:    { role: "Especialista em Tráfego Pago",   min: 5000,  max: 9000  },
  social:     { role: "Social Media Pleno/Sênior",      min: 3500,  max: 5500  },
  analyst:    { role: "Analista de Marketing Digital",  min: 4500,  max: 7000  },
  sales:      { role: "SDR / Pré-vendedor",             min: 3500,  max: 6000  },
  site:       { role: "Web Designer / WordPress Dev",   min: 4000,  max: 6500  },
  revisor:    { role: "Revisora / Editora de Texto",    min: 2500,  max: 4000  },
};

const MARKET_TOTAL_MIN = Object.values(marketRates).reduce((s, m) => s + m.min, 0);

const OUTPUT_TYPE: Record<string, { label: string; color: string }> = {
  copy:    { label: "Copy",      color: "#A78BFA" },
  design:  { label: "Design",    color: "#D946EF" },
  post:    { label: "Post",      color: "#F97316" },
  article: { label: "Artigo",    color: "#60A5FA" },
  report:  { label: "Relatório", color: "#34D399" },
  plan:    { label: "Plano",     color: "#FBBF24" },
  email:   { label: "E-mail",    color: "#F87171" },
  ad:      { label: "Anúncio",   color: "#FB923C" },
};
const OUTPUT_STATUS: Record<string, { label: string; bg: string; color: string }> = {
  rascunho:  { label: "Rascunho",    bg: "rgba(148,163,184,0.12)", color: "#94A3B8" },
  "revisão": { label: "Para revisar",bg: "rgba(245,158,11,0.12)",  color: "#D97706" },
  aprovado:  { label: "Aprovado",    bg: "rgba(59,130,246,0.1)",   color: "#3B82F6" },
  publicado: { label: "Publicado",   bg: "rgba(16,185,129,0.1)",   color: "#10B981" },
};

const POST_ICONS: Record<string, typeof Image> = { Feed: Image, Story: BookOpen, Reels: Film };
const SESSION_KEY = "portal_unlocked";

// ─────────────────────────────────────────────────────────────
// PIN LOGIN SCREEN
// ─────────────────────────────────────────────────────────────
function PinScreen({ client, onUnlock }: { client: typeof CLIENTS[0]; onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (pin.toUpperCase() === client.portalPin.toUpperCase()) {
      sessionStorage.setItem(SESSION_KEY, client.id);
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 600);
      setTimeout(() => setError(false), 3000);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0A0A10 0%, #141420 100%)" }}>

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${client.color} 0%, transparent 70%)`, filter: "blur(60px)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative w-full max-w-sm mx-4"
      >
        {/* Agency branding */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#B9FF4B" }}>
            <Zap className="w-5 h-5" style={{ color: "#07080A" }} />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Calu Agência</div>
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Portal exclusivo do cliente</div>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>

          {/* Client identity */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold mx-auto mb-3"
              style={{ background: `${client.color}22`, border: `1px solid ${client.color}40`, color: client.color }}>
              {client.initials}
            </div>
            <div className="text-base font-bold text-white mb-0.5">{client.name}</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              Digite o código de acesso enviado pela agência
            </div>
          </div>

          {/* PIN display — click to focus input */}
          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="flex justify-center gap-3 mb-6 cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-10 h-12 rounded-xl flex items-center justify-center text-lg font-bold relative"
                style={{
                  background: i < pin.length ? `${client.color}20` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${i < pin.length ? `${client.color}50` : "rgba(255,255,255,0.1)"}`,
                  color: client.color,
                }}>
                {pin[i] ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="block w-2.5 h-2.5 rounded-full"
                    style={{ background: client.color }} />
                ) : null}
                {i === pin.length && (
                  <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.9 }}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-0.5 h-4 rounded-full"
                    style={{ background: client.color }} />
                )}
              </div>
            ))}
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 text-xs mb-4"
                style={{ color: "#F87171" }}>
                <AlertCircle className="w-3.5 h-3.5" /> Código incorreto. Tente novamente.
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden input — captures keyboard/phone typing */}
          <input
            ref={inputRef}
            className="opacity-0 absolute pointer-events-none w-0 h-0"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6))}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {/* Click anywhere on dots area to focus input */}
          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="w-full mb-6 text-center text-[11px] cursor-default"
            style={{ color: "rgba(255,255,255,0.25)", background: "none", border: "none" }}>
            Clique nos espaços e digite o código
          </button>

          {/* Confirm button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={pin.length === 0}
            className="w-full h-12 rounded-2xl text-sm font-bold transition-all"
            style={{
              background: pin.length > 0 ? client.color : "rgba(255,255,255,0.06)",
              color: pin.length > 0 ? "#07080A" : "rgba(255,255,255,0.2)",
              border: pin.length > 0 ? `1px solid ${client.color}60` : "1px solid rgba(255,255,255,0.08)",
            }}>
            Entrar
          </motion.button>
        </div>

        {/* Help text */}
        <p className="text-center text-[11px] mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
          Não tem o código? Entre em contato com a agência.
        </p>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DEMANDS POPUP
// ─────────────────────────────────────────────────────────────
function DemandsModal({ client, onClose }: { client: typeof CLIENTS[0]; onClose: () => void }) {
  const [filter, setFilter] = useState<string>("todos");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState<string | null>(null);

  const outputs = client.outputs ?? [];
  const filtered = filter === "todos" ? outputs : outputs.filter(o => o.status === filter);

  const filters = [
    { id: "todos",     label: "Todos",          count: outputs.length },
    { id: "revisão",   label: "Para revisar",   count: outputs.filter(o => o.status === "revisão").length },
    { id: "aprovado",  label: "Aprovados",      count: outputs.filter(o => o.status === "aprovado").length },
    { id: "publicado", label: "Publicados",     count: outputs.filter(o => o.status === "publicado").length },
    { id: "rascunho",  label: "Rascunhos",      count: outputs.filter(o => o.status === "rascunho").length },
  ];

  const handleApprove = (id: string) => {
    setApproving(id);
    setTimeout(() => {
      setApproved(prev => new Set([...prev, id]));
      setApproving(null);
    }, 800);
  };

  const agentName = (agentId: string) =>
    PORTAL_TEAM.find(a => a.id === agentId)?.name ?? agentId;
  const agentColor = (agentId: string) =>
    PORTAL_TEAM.find(a => a.id === agentId)?.color ?? "#94A3B8";

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="w-full max-w-2xl max-h-[88vh] rounded-3xl overflow-hidden flex flex-col pointer-events-auto"
          style={{ background: "#fff", boxShadow: "0 32px 80px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.07)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <div>
              <h2 className="text-base font-bold" style={{ color: "#111" }}>Entregas do seu time</h2>
              <p className="text-xs mt-0.5" style={{ color: "#888" }}>
                {outputs.length} arquivos produzidos para {client.name}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl transition-colors"
              style={{ color: "#999" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F2F1EE")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 flex gap-2 flex-wrap flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF9" }}>
            {filters.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={filter === f.id
                  ? { background: client.color, color: "#111" }
                  : { background: "rgba(0,0,0,0.05)", color: "#555" }}>
                {f.label}
                {f.count > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: filter === f.id ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.08)" }}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: "#ddd" }} />
                <p className="text-sm" style={{ color: "#bbb" }}>Nenhum arquivo nesta categoria</p>
              </div>
            )}

            {filtered.map((output, i) => {
              const typeInfo = OUTPUT_TYPE[output.type] ?? { label: output.type, color: "#94A3B8" };
              const statusInfo = OUTPUT_STATUS[output.status] ?? OUTPUT_STATUS["rascunho"];
              const isExpanded = expanded === output.id;
              const isApprovedLocal = approved.has(output.id);
              const effectiveStatus = isApprovedLocal ? "aprovado" : output.status;
              const effectiveStatusInfo = OUTPUT_STATUS[effectiveStatus] ?? statusInfo;

              return (
                <motion.div key={output.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${effectiveStatus === "revisão" && !isApprovedLocal ? "rgba(245,158,11,0.25)" : "rgba(0,0,0,0.07)"}`, background: "#FAFAF9" }}>

                  {/* Row */}
                  <div className="flex items-start gap-3 p-4 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : output.id)}>
                    {/* Agent avatar */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: `${agentColor(output.agent)}15`, border: `1px solid ${agentColor(output.agent)}25`, color: agentColor(output.agent) }}>
                      {PORTAL_TEAM.find(a => a.id === output.agent)?.initial ?? "?"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold" style={{ color: "#111" }}>{output.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: `${typeInfo.color}15`, color: typeInfo.color }}>
                          {typeInfo.label}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: effectiveStatusInfo.bg, color: effectiveStatusInfo.color }}>
                          {isApprovedLocal ? "Aprovado" : effectiveStatusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]" style={{ color: "#aaa" }}>
                        <span>Por {agentName(output.agent)}</span>
                        {output.platform && <><span>·</span><span>{output.platform}</span></>}
                        <span>·</span><span>{output.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {(output.status === "aprovado" || output.status === "publicado" || isApprovedLocal) && (
                        <button onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: "#bbb" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = client.color)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#bbb")}>
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4" style={{ color: "#bbb" }} />
                        : <ChevronDown className="w-4 h-4" style={{ color: "#bbb" }} />}
                    </div>
                  </div>

                  {/* Expanded preview */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}>
                        <div className="px-4 pb-4">
                          {/* Preview text */}
                          <div className="rounded-xl p-4 mb-3"
                            style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)" }}>
                            <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#aaa" }}>
                              Prévia do conteúdo
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: "#444" }}>
                              {output.preview}
                            </p>
                          </div>

                          {/* Actions for "revisão" items */}
                          {output.status === "revisão" && !isApprovedLocal && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => setExpanded(null)}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                                style={{ background: "rgba(239,68,68,0.07)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                                Pedir ajuste
                              </button>
                              <button onClick={() => handleApprove(output.id)}
                                disabled={approving === output.id}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white transition-all"
                                style={{ background: "#10B981", opacity: approving === output.id ? 0.7 : 1 }}>
                                {approving === output.id
                                  ? <><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Aprovando...</>
                                  : <><ThumbsUp className="w-3.5 h-3.5" /> Aprovar este arquivo</>}
                              </button>
                            </div>
                          )}

                          {isApprovedLocal && (
                            <div className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold"
                              style={{ background: "rgba(16,185,129,0.08)", color: "#10B981" }}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado com sucesso!
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(0,0,0,0.06)", background: "#FAFAF9" }}>
            <span className="text-[11px]" style={{ color: "#bbb" }}>
              {outputs.filter(o => o.status === "revisão").length} aguardando sua revisão
            </span>
            <button onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "#F2F1EE", color: "#555" }}>
              Fechar
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PORTAL
// ─────────────────────────────────────────────────────────────
export default function ClientPortal() {
  const { clientId } = useParams<{ clientId?: string }>();
  const client = clientId
    ? (CLIENTS.find(c => c.id === clientId) ?? CLIENTS[0])
    : CLIENTS[0];

  const [unlocked, setUnlocked] = useState(false);
  const [showDemands, setShowDemands] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);
  const [approved, setApproved] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved === client.id) setUnlocked(true);
  }, [client.id]);

  const pendingApproval = client.recentPosts.filter(p => p.status === "Rascunho");
  const campaigns = client.collabCampaigns ?? [];
  const agencyFee = parseFloat(client.revenue.replace(/[^\d]/g, "")) || 0;
  const savingsMin = MARKET_TOTAL_MIN - agencyFee;

  const handleApprove = (id: string) => {
    setApproving(id);
    setTimeout(() => {
      setApproved(prev => new Set([...prev, id]));
      setApproving(null);
    }, 900);
  };

  if (!unlocked) {
    return <PinScreen client={client} onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "#F2F1EE", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Demands modal */}
      <AnimatePresence>
        {showDemands && (
          <DemandsModal client={client} onClose={() => setShowDemands(false)} />
        )}
      </AnimatePresence>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#B9FF4B" }}>
            <Zap className="w-4 h-4" style={{ color: "#07080A" }} />
          </div>
          <div className="text-sm font-bold" style={{ color: "#111" }}>Calu Agência</div>
          <div className="w-px h-4 mx-1" style={{ background: "#ddd" }} />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
              style={{ background: `${client.color}20`, color: client.color }}>
              {client.initials}
            </div>
            <span className="text-sm font-medium" style={{ color: "#444" }}>{client.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pendingApproval.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: "rgba(245,158,11,0.1)", color: "#D97706", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Bell className="w-3 h-3" /> {pendingApproval.length} aguardando aprovação
            </div>
          )}
          {/* Ver demandas button */}
          <button onClick={() => setShowDemands(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            style={{ background: client.color, color: "#111", boxShadow: `0 4px 12px ${client.color}40` }}>
            <FileText className="w-3.5 h-3.5" /> Ver demandas
          </button>
          <div className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: "rgba(185,255,75,0.15)", color: "#3a6e00", border: "1px solid rgba(185,255,75,0.4)" }}>
            Portal exclusivo
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* ── Hero ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <div className="rounded-3xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0A0A10 0%, #141420 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="px-10 py-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Abril 2025 · Relatório executivo
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: "#F0F0F0" }}>
                    Seu time está entregando resultados.
                  </h1>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {client.agentFeed.length * 3}+ horas dedicadas à {client.name} este mês, todos os dias.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  Time ativo agora
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {client.metrics.map((m, i) => (
                  <motion.div key={m.label}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                    className="rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>{m.label}</div>
                    <div className="text-2xl font-bold tracking-tight mb-1" style={{ color: "#F0F0F0" }}>{m.value}</div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold"
                      style={{ color: m.positive ? "#34D399" : "#F87171" }}>
                      <ArrowUpRight className="w-3 h-3" style={{ transform: m.positive ? "none" : "rotate(90deg)" }} />
                      {m.change}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stats bar */}
            <div className="px-10 py-4 flex items-center gap-6"
              style={{ background: `${client.color}1A`, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              {[
                { icon: FileText,  label: `${client.postsMonth} posts publicados` },
                { icon: Megaphone, label: `${client.campaigns} campanhas ativas` },
                { icon: Users,     label: `${client.followers.instagram} no Instagram` },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <div className="w-px h-3 mr-2" style={{ background: "rgba(255,255,255,0.1)" }} />}
                  <s.icon className="w-3.5 h-3.5" style={{ color: client.color }} />
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{s.label}</span>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-3">
                <button onClick={() => setShowDemands(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: `${client.color}30`, color: client.color, border: `1px solid ${client.color}40` }}>
                  <FileText className="w-3 h-3" /> Ver demandas ({client.outputs?.length ?? 0})
                </button>
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Atualizado {client.lastActivity}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Aprovações pendentes ─────────────────────────────── */}
        {pendingApproval.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <div className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(245,158,11,0.3)", background: "rgba(255,255,255,0.9)" }}>
              <div className="px-6 py-4 flex items-center gap-3"
                style={{ borderBottom: "1px solid rgba(245,158,11,0.12)", background: "rgba(245,158,11,0.04)" }}>
                <Bell className="w-4 h-4" style={{ color: "#D97706" }} />
                <span className="text-sm font-bold" style={{ color: "#111" }}>
                  {pendingApproval.length === 1 ? "1 conteúdo aguarda" : `${pendingApproval.length} conteúdos aguardam`} sua aprovação
                </span>
                <button onClick={() => setShowDemands(true)}
                  className="text-xs ml-auto font-medium underline"
                  style={{ color: client.color }}>
                  Ver todos os arquivos
                </button>
              </div>
              <div className="p-4 space-y-3">
                {pendingApproval.map((post) => {
                  const Icon = POST_ICONS[post.type] ?? Image;
                  const isApproved = approved.has(post.id);
                  return (
                    <div key={post.id} className="flex items-start gap-4 p-4 rounded-xl bg-white"
                      style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${client.color}12`, border: `1px solid ${client.color}20` }}>
                        <Icon className="w-4 h-4" style={{ color: client.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold mb-1" style={{ color: "#222" }}>{post.type} · {post.platform}</div>
                        <p className="text-xs leading-relaxed" style={{ color: "#555" }}>{post.caption}</p>
                        <div className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: "#aaa" }}>
                          <Clock className="w-2.5 h-2.5" /> Publicar: {post.scheduledFor}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isApproved ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado!
                          </div>
                        ) : (
                          <>
                            <button className="px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: "rgba(239,68,68,0.07)", color: "#EF4444" }}>
                              Pedir ajuste
                            </button>
                            <button onClick={() => handleApprove(post.id)} disabled={approving === post.id}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                              style={{ background: "#10B981", opacity: approving === post.id ? 0.7 : 1 }}>
                              {approving === post.id
                                ? <><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Aprovando...</>
                                : <><ThumbsUp className="w-3.5 h-3.5" /> Aprovar</>}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Campanhas ativas ─────────────────────────────────── */}
        {(campaigns.length > 0 || client.activeCampaigns.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <h2 className="text-base font-bold mb-0.5" style={{ color: "#111" }}>Campanhas ativas</h2>
                <p className="text-xs" style={{ color: "#888" }}>Investimento e resultados em tempo real</p>
              </div>
              {campaigns.length > 0 ? (
                <div className="p-5 space-y-4">
                  {campaigns.map((camp, ci) => {
                    const budgetNum = parseFloat(camp.budget.replace(/[^\d]/g, "")) || 1;
                    const spentNum = parseFloat(camp.spent.replace(/[^\d]/g, "")) || 0;
                    const pct = Math.min(Math.round((spentNum / budgetNum) * 100), 100);
                    return (
                      <motion.div key={camp.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 + ci * 0.08 }}
                        className="rounded-2xl p-5" style={{ background: "#F9F8F6", border: "1px solid rgba(0,0,0,0.06)" }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-sm font-bold mb-0.5" style={{ color: "#111" }}>{camp.name}</div>
                            <p className="text-[11px]" style={{ color: "#888" }}>{camp.objective}</p>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-3 flex-shrink-0"
                            style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
                            {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex gap-1.5 mb-4 flex-wrap">
                          {camp.platforms.map(p => (
                            <span key={p} className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                              style={{ background: "rgba(0,0,0,0.05)", color: "#666", border: "1px solid rgba(0,0,0,0.08)" }}>
                              {p}
                            </span>
                          ))}
                        </div>
                        <div className="grid grid-cols-5 gap-3 mb-4">
                          {[
                            { label: "Orçamento",  value: camp.budget,           highlight: false },
                            { label: "Investido",  value: camp.spent,            highlight: false },
                            { label: "Alcance",    value: camp.reach,            highlight: false },
                            { label: "Leads",      value: camp.leads.toString(), highlight: true  },
                            { label: "Custo/Lead", value: camp.cpa,              highlight: false },
                          ].map(m => (
                            <div key={m.label} className="rounded-xl p-3 text-center"
                              style={{ background: m.highlight ? `${client.color}12` : "rgba(255,255,255,0.8)", border: m.highlight ? `1px solid ${client.color}25` : "1px solid rgba(0,0,0,0.06)" }}>
                              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: m.highlight ? client.color : "#aaa" }}>{m.label}</div>
                              <div className="text-sm font-bold" style={{ color: m.highlight ? client.color : "#111" }}>{m.value}</div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="flex justify-between mb-1.5">
                            <span className="text-[10px]" style={{ color: "#aaa" }}>Orçamento utilizado</span>
                            <span className="text-[10px] font-semibold" style={{ color: "#555" }}>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E8E7E4" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: client.color }} />
                          </div>
                        </div>
                        {camp.remarketing.filter(r => r.status === "ativa").length > 0 && (
                          <div className="mt-4 flex items-center gap-2.5 px-3 py-2 rounded-xl"
                            style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)" }}>
                            <Target className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#F97316" }} />
                            <span className="text-[11px]" style={{ color: "#666" }}>
                              <span className="font-semibold" style={{ color: "#F97316" }}>
                                {camp.remarketing.filter(r => r.status === "ativa").length} audiências de remarketing ativas
                              </span>
                              {" "}— retargeting para reduzir o custo por lead.
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-5 grid grid-cols-2 gap-4">
                  {client.activeCampaigns.map((camp) => (
                    <div key={camp.id} className="rounded-2xl p-5" style={{ background: "#F9F8F6", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-sm font-semibold mb-0.5" style={{ color: "#111" }}>{camp.name}</div>
                          <div className="text-[11px]" style={{ color: "#888" }}>{camp.platform}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>{camp.status}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[{ label: "Investido", value: camp.spent }, { label: "Resultados", value: camp.results }, { label: "CPA", value: camp.cpa }].map(s => (
                          <div key={s.label}>
                            <div className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: "#aaa" }}>{s.label}</div>
                            <div className="text-sm font-bold" style={{ color: "#111" }}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Seu time de especialistas ────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <h2 className="text-base font-bold mb-0.5" style={{ color: "#111" }}>Seu time de especialistas</h2>
              <p className="text-xs" style={{ color: "#888" }}>
                {PORTAL_TEAM.length} profissionais dedicados exclusivamente à {client.name} todos os dias
              </p>
            </div>

            {/* ARIA destaque */}
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(185,255,75,0.04)" }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#B9FF4B", boxShadow: "0 0 20px -4px rgba(185,255,75,0.4)" }}>
                  <Zap className="w-6 h-6" style={{ color: "#07080A" }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold" style={{ color: "#111" }}>ARIA</span>
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
                  <p className="text-[11px] leading-relaxed mb-2" style={{ color: "#666" }}>
                    A inteligência central que coordena toda a equipe — garante que a estratégia certa seja executada, no tempo certo, com qualidade.
                  </p>
                  <div className="text-[11px] px-3 py-2 rounded-xl"
                    style={{ background: "rgba(185,255,75,0.08)", border: "1px solid rgba(185,255,75,0.2)" }}>
                    <span className="font-semibold" style={{ color: "#3a6e00" }}>Fazendo agora: </span>
                    <span style={{ color: "#555" }}>{client.orchestratorStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team grid */}
            <div className="grid grid-cols-3 gap-0">
              {PORTAL_TEAM.slice(1).map((member, i) => {
                const task = client.agentTasks[member.id];
                return (
                  <motion.div key={member.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 + i * 0.05 }}
                    className="p-5"
                    style={{
                      borderBottom: i < 6 ? "1px solid rgba(0,0,0,0.05)" : "none",
                      borderRight: (i % 3 !== 2) ? "1px solid rgba(0,0,0,0.05)" : "none",
                    }}>
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: `${member.color}20`, border: `1px solid ${member.color}35`, color: member.color }}>
                        {member.initial}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: "#111" }}>{member.name}</div>
                        <div className="text-[10px] truncate" style={{ color: member.color }}>{member.role}</div>
                      </div>
                      {task && (
                        <div className="ml-auto flex-shrink-0">
                          {task.status === "trabalhando" ? (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: member.color }} />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: member.color }} />
                            </span>
                          ) : (
                            <CheckCircle2 className="w-3 h-3" style={{ color: "#34D399" }} />
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] leading-relaxed mb-2" style={{ color: "#777" }}>{TEAM_DESCS[member.id]}</p>
                    {task && (
                      <div className="text-[10px] px-2 py-1.5 rounded-lg leading-snug"
                        style={{ background: `${member.color}08`, border: `1px solid ${member.color}15`, color: "#555" }}>
                        <span className="font-medium" style={{ color: member.color }}>
                          {task.status === "trabalhando" ? "Agora: " : "Concluiu: "}
                        </span>
                        {task.status === "trabalhando" ? task.current : (task.recent[0] ?? task.current)}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Quanto você está economizando ────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <h2 className="text-base font-bold mb-0.5" style={{ color: "#111" }}>Quanto você está economizando</h2>
              <p className="text-xs" style={{ color: "#888" }}>Custo real de contratar cada profissional vs. o que você investe</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-2 mb-3 text-[10px] uppercase tracking-widest font-semibold px-2"
                style={{ color: "#aaa" }}>
                <span>Profissional</span>
                <span className="text-center">Mercado (CLT/PJ)</span>
                <span className="text-right">Com a agência</span>
              </div>
              <div className="space-y-1 mb-5">
                {PORTAL_TEAM.slice(1).map((m, i) => {
                  const rate = marketRates[m.id];
                  if (!rate) return null;
                  return (
                    <motion.div key={m.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.04 }}
                      className="grid grid-cols-3 gap-2 items-center px-3 py-2.5 rounded-xl"
                      style={{ background: i % 2 === 0 ? "#F9F8F6" : "transparent" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                          style={{ background: `${m.color}20`, color: m.color }}>
                          {m.initial}
                        </div>
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
                          style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
                          Incluído
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="grid grid-cols-3">
                  <div className="p-5" style={{ background: "#FEF2F2", borderRight: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#ef4444" }}>
                      Contratar individualmente
                    </div>
                    <div className="text-2xl font-black mb-1" style={{ color: "#DC2626" }}>
                      R$ {MARKET_TOTAL_MIN.toLocaleString("pt-BR")}+
                    </div>
                    <div className="text-[11px]" style={{ color: "#999" }}>por mês, sem encargos</div>
                  </div>
                  <div className="p-5" style={{ background: "#F0FDF4", borderRight: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#10B981" }}>
                      Com a Calu Agência
                    </div>
                    <div className="text-2xl font-black mb-1" style={{ color: "#059669" }}>
                      {client.revenue}
                    </div>
                    <div className="text-[11px]" style={{ color: "#999" }}>tudo incluído</div>
                  </div>
                  <div className="p-5" style={{ background: `${client.color}12` }}>
                    <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: client.color }}>
                      Você economiza todo mês
                    </div>
                    <div className="text-2xl font-black mb-1" style={{ color: "#111" }}>
                      R$ {savingsMin.toLocaleString("pt-BR")}+
                    </div>
                    <div className="flex items-center gap-1 text-[11px]" style={{ color: "#10B981" }}>
                      <TrendingUp className="w-3 h-3" />
                      {Math.round((savingsMin / MARKET_TOTAL_MIN) * 100)}% de economia real
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3.5 flex items-center gap-3"
                  style={{ background: "#F9F8F6", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <Wallet className="w-4 h-4 flex-shrink-0" style={{ color: "#10B981" }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: "#666" }}>
                    Além da economia, você tem <strong>mais velocidade</strong> (IA trabalha 24h), <strong>mais consistência</strong> (sem férias ou turnover) e <strong>mais resultado</strong> (especialistas trabalhando em conjunto, não em silos).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── O que o time fez ────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}>
          <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold" style={{ color: "#111" }}>O que seu time fez por você</h2>
                <p className="text-xs mt-0.5" style={{ color: "#888" }}>Atividade das últimas 48h</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: "rgba(52,211,153,0.1)", color: "#10B981" }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10B981" }} /> Time ativo
              </div>
            </div>
            <div className="space-y-1">
              {client.agentFeed.map((item, i) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-start gap-4 p-3 rounded-xl transition-colors"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8F7F5")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${client.color}10`, border: `1px solid ${client.color}20` }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: client.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "#222" }}>{item.action}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#888" }}>{item.detail}</div>
                  </div>
                  <div className="text-[10px] flex-shrink-0 mt-1" style={{ color: "#bbb" }}>{item.time}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Próximos passos ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
          <div className="rounded-2xl overflow-hidden text-white"
            style={{ background: `linear-gradient(135deg, ${client.color}EE 0%, ${client.color}BB 100%)` }}>
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
              <h2 className="text-base font-bold">O que planejamos fazer por você</h2>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>Próximas ações do seu time</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              {client.orchestratorPlan.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: step.done ? "rgba(255,255,255,0.12)" : step.active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{ background: step.done || step.active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)", color: step.done || step.active ? client.color : "rgba(255,255,255,0.6)" }}>
                    {step.done ? <Check className="w-3 h-3" style={{ color: client.color }} /> : i + 1}
                  </div>
                  <span className="text-xs leading-relaxed"
                    style={{ color: step.done ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.9)", textDecoration: step.done ? "line-through" : "none" }}>
                    {step.step}
                  </span>
                  {step.active && (
                    <span className="ml-auto flex-shrink-0 mt-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                      </span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Fale com Caroline ───────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}>
          <div className="rounded-2xl p-8 flex items-center justify-between bg-white"
            style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #F5C842, #E8930A)" }}>
                <Star className="w-7 h-7 fill-white text-white" />
              </div>
              <div>
                <div className="text-base font-bold mb-0.5" style={{ color: "#111" }}>Fale diretamente com Caroline</div>
                <div className="text-sm" style={{ color: "#777" }}>Dúvidas, ideias, aprovações ou um alinhamento rápido — estou aqui.</div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <a href="mailto:carolinielucas.cl@gmail.com"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "#F2F1EE", color: "#444", border: "1px solid rgba(0,0,0,0.1)" }}>
                <Mail className="w-4 h-4" /> E-mail
              </a>
              <a href="https://wa.me/5511999999999" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: "#25D366", boxShadow: "0 4px 16px rgba(37,211,102,0.3)" }}>
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        </motion.div>

        <div className="text-center py-4">
          <p className="text-[11px]" style={{ color: "#bbb" }}>
            Portal exclusivo · Calu Agência · Todas as informações são confidenciais
          </p>
        </div>
      </div>
    </div>
  );
}
