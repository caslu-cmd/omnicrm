import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users, Megaphone, Calendar, TrendingUp,
  ArrowRight, MessageSquare, Plus, Zap, X, Trash2, AlertTriangle
} from "lucide-react";
import { useClients } from "@/contexts/ClientsContext";
import { toast } from "sonner";

const LIME = "#B9FF4B";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Ativo:       { bg: "rgba(185,255,75,0.1)",   text: "#B9FF4B", border: "rgba(185,255,75,0.22)" },
  Onboarding:  { bg: "rgba(96,165,250,0.1)",   text: "#60A5FA", border: "rgba(96,165,250,0.22)" },
  "Em pausa":  { bg: "rgba(100,116,139,0.1)",  text: "#64748B", border: "rgba(100,116,139,0.22)" },
};

const COLOR_OPTIONS = [
  "#B9FF4B", "#F97316", "#8B5CF6", "#E1306C", "#1877F2",
  "#34D399", "#FBBF24", "#60A5FA", "#F87171", "#A78BFA",
];

export default function AgencyDashboard() {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { clients: CLIENTS, addClient, deleteClient } = useClients();
  const [showNewClient, setShowNewClient] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [form, setForm] = useState({
    name: "", industry: "", status: "Onboarding" as "Ativo" | "Onboarding" | "Em pausa",
    revenue: "", color: "#B9FF4B",
  });
  const [saving, setSaving] = useState(false);

  const handleAddClient = async () => {
    if (!form.name.trim()) { toast.error("Nome do cliente é obrigatório."); return; }
    setSaving(true);
    const id = addClient(form);
    setSaving(false);
    setShowNewClient(false);
    setForm({ name: "", industry: "", status: "Onboarding", revenue: "", color: "#B9FF4B" });
    toast.success(`${form.name} adicionado!`);
    navigate(`/agency/clients/${id}`);
  };

  const activeClients = CLIENTS.filter((c) => c.status === "Ativo").length;
  const totalCampaigns = CLIENTS.reduce((s, c) => s + c.campaigns, 0);
  const totalRevenue = CLIENTS.reduce((s, c) => s + parseInt(c.revenue.replace(/\D/g, "")), 0);

  const stats = [
    { label: "Clientes Ativos",   value: activeClients,                               icon: Users },
    { label: "Campanhas Rodando", value: totalCampaigns,                              icon: Megaphone },
    { label: "Posts esta Semana", value: 31,                                          icon: Calendar },
    { label: "Receita Mensal",    value: `R$ ${(totalRevenue / 1000).toFixed(1)}k`,   icon: TrendingUp },
  ];

  return (
    <div
      className="min-h-full text-white"
      style={{ background: "#07080A" }}
    >
      {/* Ambient lime glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-24 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(185,255,75,0.05) 0%, transparent 65%)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(185,255,75,0.04) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:px-8 md:py-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6 md:mb-12"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: LIME, boxShadow: "0 0 16px -2px rgba(185,255,75,0.6)" }}>
                <Zap className="w-3.5 h-3.5" style={{ color: "#07080A" }} />
              </div>
              <span className="text-[11px] font-medium tracking-[0.22em] uppercase"
                style={{ color: "rgba(185,255,75,0.6)" }}>
                Super Admin · Calu Agência
              </span>
            </div>
            <h1
              className="text-3xl md:text-5xl tracking-tight leading-none mb-2"
              style={{ fontWeight: 700, letterSpacing: "-0.03em" }}
            >
              Calu{" "}
              <span style={{
                background: `linear-gradient(135deg, ${LIME} 0%, #8FD600 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 500,
              }}>
                Agência
              </span>
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Marketing digital de alta performance · São Paulo
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
              style={{ background: "rgba(185,255,75,0.08)", border: "1px solid rgba(185,255,75,0.22)", boxShadow: "0 0 20px -6px rgba(185,255,75,0.25)" }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: LIME }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: LIME }} />
              </span>
              <span className="text-xs" style={{ color: LIME }}>
                {CLIENTS.filter((c) => c.agentActive).length} agentes online
              </span>
            </div>
            <a href="/landing" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-75"
              style={{ background: LIME, color: "#07080A" }}>
              🌐 Ver site
            </a>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 md:mb-12"
        >
          {stats.map((stat, i) => (
            <div key={stat.label} className="rounded-2xl p-5 group transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(185,255,75,0.22)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 32px -8px rgba(185,255,75,0.18), inset 0 1px 0 rgba(185,255,75,0.08)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-medium tracking-wide uppercase"
                  style={{ color: "rgba(255,255,255,0.3)" }}>{stat.label}</span>
                <stat.icon className="w-3.5 h-3.5 transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(185,255,75,0.6)]"
                  style={{ color: "rgba(185,255,75,0.5)" }} />
              </div>
              <div className="text-2xl md:text-4xl leading-none font-bold tracking-tight"
                style={{ color: "#F0F0F0" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Section header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase"
              style={{ color: "rgba(255,255,255,0.35)" }}>Seus Clientes</h2>
            <div className="h-px w-20" style={{ background: "rgba(185,255,75,0.15)" }} />
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>{CLIENTS.length} clientes</span>
          </div>
          <button
            onClick={() => setShowNewClient(true)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: "rgba(185,255,75,0.5)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = LIME)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(185,255,75,0.5)")}>
            <Plus className="w-3 h-3" /> Novo cliente
          </button>
        </div>

        {/* ── Client Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CLIENTS.map((client, i) => {
            const isHovered = hoveredId === client.id;
            const s = STATUS_STYLES[client.status];

            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 + i * 0.07, duration: 0.45 }}
                onHoverStart={() => setHoveredId(client.id)}
                onHoverEnd={() => setHoveredId(null)}
                className="relative rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.022)",
                  border: `1px solid ${isHovered ? "rgba(185,255,75,0.28)" : "rgba(255,255,255,0.06)"}`,
                  boxShadow: isHovered
                    ? "0 0 0 1px rgba(185,255,75,0.08), 0 16px 48px -8px rgba(185,255,75,0.2), inset 0 1px 0 rgba(185,255,75,0.06)"
                    : "none",
                  transition: "border-color 0.3s, box-shadow 0.3s",
                }}
              >
                {/* Top strip — client brand color */}
                <div className="h-[3px] w-full"
                  style={{ background: `linear-gradient(90deg, ${client.color}, ${client.color}55)` }} />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: `${client.color}18`, border: `1px solid ${client.color}35`, color: client.color }}
                      >
                        {client.initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium leading-snug" style={{ color: "rgba(255,255,255,0.92)" }}>
                          {client.name}
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {client.industry}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                      {client.status}
                    </span>
                  </div>

                  {/* Agent indicator */}
                  {client.agentActive && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(185,255,75,0.06)", border: "1px solid rgba(185,255,75,0.14)" }}>
                      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ background: LIME }} />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: LIME }} />
                      </span>
                      <span className="text-[11px] truncate" style={{ color: "rgba(185,255,75,0.8)" }}>
                        {client.nextAction}
                      </span>
                    </div>
                  )}

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { label: "Posts/mês",  value: client.postsMonth },
                      { label: "Campanhas",  value: client.campaigns },
                      { label: "Última ativ.", value: client.lastActivity },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <div className="text-xl leading-none mb-1"
                          style={{ fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                          {m.value}
                        </div>
                        <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{m.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mb-4" style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/agency/clients/${client.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: isHovered ? "rgba(185,255,75,0.14)" : "rgba(185,255,75,0.07)",
                        border: `1px solid ${isHovered ? "rgba(185,255,75,0.4)" : "rgba(185,255,75,0.15)"}`,
                        color: LIME,
                        boxShadow: isHovered ? "0 0 16px -4px rgba(185,255,75,0.3)" : "none",
                        transition: "all 0.2s",
                      }}
                    >
                      Ver workspace <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: client.id, name: client.name }); }}
                      className="w-10 flex items-center justify-center rounded-xl transition-all"
                      style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(248,113,113,0.35)"; e.currentTarget.style.color = "#F87171"; e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "transparent"; }}
                      title="Excluir cliente">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Add new client */}
          <motion.div
            onClick={() => setShowNewClient(true)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + CLIENTS.length * 0.07 }}
            className="rounded-2xl flex items-center justify-center p-8 cursor-pointer transition-all"
            style={{ border: "1px dashed rgba(185,255,75,0.12)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(185,255,75,0.3)";
              e.currentTarget.style.background = "rgba(185,255,75,0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(185,255,75,0.12)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ border: "1px dashed rgba(185,255,75,0.2)" }}>
                <Plus className="w-4 h-4" style={{ color: "rgba(185,255,75,0.35)" }} />
              </div>
              <div className="text-sm" style={{ color: "rgba(185,255,75,0.3)" }}>Novo cliente</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Modal Confirmar Exclusão ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: "#0D0D1A", border: "1px solid rgba(248,113,113,0.2)" }}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: "#F87171" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Excluir cliente</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Esta ação não pode ser desfeita</p>
                  </div>
                </div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Tem certeza que deseja excluir <span className="font-semibold text-white">{confirmDelete.name}</span>? Todos os dados do cliente serão removidos.
                </p>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      deleteClient(confirmDelete.id);
                      setConfirmDelete(null);
                      toast.success(`${confirmDelete.name} excluído.`);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "#F87171", color: "#07080A" }}>
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Novo Cliente ── */}
      <AnimatePresence>
        {showNewClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowNewClient(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: "#0D0D1A", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <h2 className="text-sm font-semibold text-white">Novo Cliente</h2>
                <button onClick={() => setShowNewClient(false)} className="p-1 rounded-lg text-white/40 hover:text-white/70">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Nome do cliente *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Tech Solutions Ltda"
                    autoFocus
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.85)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Segmento</label>
                  <input
                    value={form.industry}
                    onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                    placeholder="Ex: SaaS B2B, E-commerce, Educação…"
                    className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.85)" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as typeof form.status }))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.85)", colorScheme: "dark" }}
                    >
                      <option value="Onboarding">Onboarding</option>
                      <option value="Ativo">Ativo</option>
                      <option value="Em pausa">Em pausa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Receita mensal</label>
                    <input
                      value={form.revenue}
                      onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))}
                      placeholder="Ex: R$ 3.500"
                      className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.85)" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Cor do cliente</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className="w-7 h-7 rounded-lg transition-all"
                        style={{
                          background: c,
                          outline: form.color === c ? `2px solid white` : "none",
                          outlineOffset: "2px",
                          boxShadow: form.color === c ? `0 0 10px ${c}80` : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setShowNewClient(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddClient}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
                  style={{ background: LIME, color: "#07080A" }}
                >
                  {saving ? "Salvando…" : "Criar cliente"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
