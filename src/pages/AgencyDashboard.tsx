import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users, Megaphone, Calendar, TrendingUp,
  ArrowRight, MessageSquare, ChevronRight, Star, Plus
} from "lucide-react";
import { CLIENTS } from "@/data/agencyData";

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Ativo:       { bg: "rgba(16,185,129,0.12)", text: "#34D399", border: "rgba(16,185,129,0.25)" },
  Onboarding:  { bg: "rgba(59,130,246,0.12)", text: "#60A5FA", border: "rgba(59,130,246,0.25)" },
  "Em pausa":  { bg: "rgba(100,116,139,0.12)", text: "#94A3B8", border: "rgba(100,116,139,0.25)" },
};

export default function AgencyDashboard() {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeClients = CLIENTS.filter((c) => c.status === "Ativo").length;
  const totalCampaigns = CLIENTS.reduce((s, c) => s + c.campaigns, 0);
  const totalRevenue = CLIENTS.reduce((s, c) => {
    return s + parseInt(c.revenue.replace(/\D/g, ""));
  }, 0);

  const stats = [
    { label: "Clientes Ativos", value: activeClients, icon: Users },
    { label: "Campanhas Rodando", value: totalCampaigns, icon: Megaphone },
    { label: "Posts esta Semana", value: 31, icon: Calendar },
    { label: "Receita Mensal", value: `R$ ${(totalRevenue / 1000).toFixed(1)}k`, icon: TrendingUp },
  ];

  return (
    <div
      className="min-h-full text-white"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "linear-gradient(160deg, #080810 0%, #0d0d1a 50%, #09090f 100%)",
      }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(232,147,10,0.1) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-start justify-between mb-12"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #F5C842, #E8930A)" }}>
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="text-[11px] font-medium tracking-[0.22em] uppercase"
                style={{ color: "rgba(245,200,66,0.7)" }}>
                Super Admin · Calu Agência
              </span>
            </div>
            <h1
              className="text-5xl tracking-tight leading-none mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
            >
              Agência{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #F5C842 20%, #E8930A 80%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 500,
                }}
              >
                Caroline Lucas
              </span>
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              Marketing digital de alta performance · São Paulo
            </p>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <span className="text-xs" style={{ color: "#34D399" }}>
                {CLIENTS.filter((c) => c.agentActive).length} agentes online
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="grid grid-cols-4 gap-4 mb-12"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-medium tracking-wide uppercase"
                  style={{ color: "rgba(255,255,255,0.35)" }}>
                  {stat.label}
                </span>
                <stat.icon className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.18)" }} />
              </div>
              <div
                className="text-4xl leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Section header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-[11px] font-medium tracking-[0.2em] uppercase"
              style={{ color: "rgba(255,255,255,0.4)" }}>
              Seus Clientes
            </h2>
            <div className="h-px w-20" style={{ background: "rgba(255,255,255,0.08)" }} />
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              {CLIENTS.length} clientes
            </span>
          </div>
          <button className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: "rgba(245,200,66,0.6)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(245,200,66,1)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,200,66,0.6)")}>
            <Plus className="w-3 h-3" /> Novo cliente
          </button>
        </div>

        {/* ── Client Grid ── */}
        <div className="grid grid-cols-3 gap-5">
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
                  border: `1px solid ${isHovered ? client.color + "35" : "rgba(255,255,255,0.06)"}`,
                  boxShadow: isHovered ? `0 12px 48px -8px ${client.color}35` : "none",
                  transition: "border-color 0.3s, box-shadow 0.3s",
                }}
              >
                {/* Brand color strip */}
                <div
                  className="h-[3px] w-full"
                  style={{ background: `linear-gradient(90deg, ${client.color}, ${client.color}55)` }}
                />

                <div className="p-5">
                  {/* Client header row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          background: `${client.color}18`,
                          border: `1px solid ${client.color}35`,
                          color: client.color,
                        }}
                      >
                        {client.initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium leading-snug" style={{ color: "rgba(255,255,255,0.92)" }}>
                          {client.name}
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {client.industry}
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
                    >
                      {client.status}
                    </span>
                  </div>

                  {/* AI agent indicator */}
                  {client.agentActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
                      style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.14)" }}
                    >
                      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                      </span>
                      <span className="text-[11px] truncate" style={{ color: "rgba(52,211,153,0.85)" }}>
                        {client.nextAction}
                      </span>
                    </motion.div>
                  )}

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { label: "Posts/mês", value: client.postsMonth },
                      { label: "Campanhas", value: client.campaigns },
                      { label: "Última ativ.", value: client.lastActivity },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <div
                          className="text-xl leading-none mb-1"
                          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, color: "rgba(255,255,255,0.85)" }}
                        >
                          {m.value}
                        </div>
                        <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="mb-4" style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/agency/clients/${client.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: isHovered ? `${client.color}22` : `${client.color}12`,
                        border: `1px solid ${isHovered ? client.color + "50" : client.color + "28"}`,
                        color: client.color,
                        transition: "all 0.2s",
                      }}
                    >
                      Ver workspace <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      className="w-10 flex items-center justify-center rounded-xl transition-colors"
                      style={{
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Add new client */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + CLIENTS.length * 0.07 }}
            className="rounded-2xl flex items-center justify-center p-8 cursor-pointer group transition-all"
            style={{ border: "1px dashed rgba(255,255,255,0.09)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(245,200,66,0.3)";
              e.currentTarget.style.background = "rgba(245,200,66,0.04)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div className="text-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-all"
                style={{ border: "1px dashed rgba(255,255,255,0.15)" }}
              >
                <Plus className="w-4 h-4" style={{ color: "rgba(255,255,255,0.25)" }} />
              </div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Novo cliente</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
