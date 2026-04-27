import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, Eye, Heart, MessageSquare,
  TrendingUp, Calendar, Image, Film, BookOpen,
  ChevronRight, Star, Sparkles
} from "lucide-react";
import { CLIENTS } from "@/data/agencyData";

// Client portal always shows client ID "1" as demo — in production, identify by auth session
const CLIENT = CLIENTS[0];

const POST_TYPE_ICONS: Record<string, typeof Image> = {
  Feed: Image,
  Story: BookOpen,
  Reels: Film,
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  Publicado: { bg: "rgba(16,185,129,0.1)", text: "#34D399" },
  Agendado:  { bg: "rgba(59,130,246,0.1)", text: "#60A5FA" },
  Rascunho:  { bg: "rgba(245,158,11,0.1)", text: "#FBBF24" },
};

export default function ClientPortal() {
  const [contactOpen, setContactOpen] = useState(false);
  const client = CLIENT;

  return (
    <div
      className="min-h-screen"
      style={{ fontFamily: "'DM Sans', sans-serif", background: "#F8F7F5" }}
    >
      {/* ── Header ── */}
      <div
        className="px-8 py-5 flex items-center justify-between"
        style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{ background: client.color }}
          >
            {client.initials}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "#111" }}>{client.name}</div>
            <div className="text-[11px]" style={{ color: "#999" }}>Portal do Cliente</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
            style={{ background: `${client.color}12`, color: client.color, border: `1px solid ${client.color}25` }}
          >
            <Sparkles className="w-3 h-3" />
            Gerenciado pela Agência Caroline Lucas
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Welcome ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1
            className="text-4xl mb-1"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: "#111" }}
          >
            Olá, {client.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm" style={{ color: "#888" }}>
            Aqui está tudo que está sendo feito na sua empresa esta semana.
          </p>
        </motion.div>

        {/* ── Metrics ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-4 gap-4 mb-8"
        >
          {client.metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-2xl p-5 bg-white"
              style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="text-[10px] uppercase tracking-wide mb-3" style={{ color: "#999" }}>
                {m.label}
              </div>
              <div
                className="text-3xl leading-none mb-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: "#111" }}
              >
                {m.value}
              </div>
              <div
                className="text-[11px] font-medium"
                style={{ color: m.positive ? "#10B981" : "#EF4444" }}
              >
                {m.change} vs mês anterior
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Content awaiting approval ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="rounded-2xl bg-white p-6 mb-6"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold" style={{ color: "#111" }}>Conteúdo desta semana</h2>
              <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                {client.recentPosts.filter((p) => p.status === "Agendado").length} publicações agendadas
              </p>
            </div>
            <button
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: `${client.color}10`, color: client.color, border: `1px solid ${client.color}25` }}
            >
              Ver calendário completo <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {client.recentPosts.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "#bbb" }}>
              Nenhum conteúdo planejado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {client.recentPosts.map((post) => {
                const Icon = POST_TYPE_ICONS[post.type] ?? Image;
                const sc = STATUS_COLOR[post.status];
                return (
                  <div
                    key={post.id}
                    className="flex items-start gap-4 p-4 rounded-xl"
                    style={{ background: "#F9F8F6", border: "1px solid rgba(0,0,0,0.05)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${client.color}12`, border: `1px solid ${client.color}22` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: client.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium" style={{ color: "#333" }}>
                          {post.type} · {post.platform}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          {post.status}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "#666" }}>{post.caption}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] flex items-center gap-1" style={{ color: "#aaa" }}>
                          <Clock className="w-3 h-3" /> {post.scheduledFor}
                        </span>
                        {post.likes !== undefined && (
                          <>
                            <span className="text-[10px] flex items-center gap-1" style={{ color: "#aaa" }}>
                              <Heart className="w-3 h-3" /> {post.likes.toLocaleString("pt-BR")} curtidas
                            </span>
                            <span className="text-[10px] flex items-center gap-1" style={{ color: "#aaa" }}>
                              <Eye className="w-3 h-3" /> {post.reach?.toLocaleString("pt-BR")} pessoas
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {post.status === "Agendado" && (
                      <button
                        className="flex-shrink-0 flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── What's coming ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-5 mb-8"
        >
          {/* Agent activity */}
          <div
            className="rounded-2xl bg-white p-5"
            style={{ border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <h2 className="text-sm font-semibold mb-1" style={{ color: "#111" }}>O que estamos fazendo</h2>
            <p className="text-xs mb-4" style={{ color: "#999" }}>Atividade da IA nos últimos dias</p>
            <div className="space-y-3">
              {client.agentFeed.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: client.color }} />
                  <div>
                    <div className="text-xs font-medium" style={{ color: "#333" }}>{item.action}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#999" }}>{item.time}</div>
                  </div>
                </div>
              ))}
              {client.agentFeed.length === 0 && (
                <p className="text-xs" style={{ color: "#bbb" }}>Nenhuma atividade recente.</p>
              )}
            </div>
          </div>

          {/* Next steps */}
          <div
            className="rounded-2xl p-5"
            style={{ background: client.color, border: `1px solid ${client.color}` }}
          >
            <h2 className="text-sm font-semibold mb-1 text-white">Próximos passos</h2>
            <p className="text-xs mb-4 text-white/70">O que planejamos para você</p>
            <div className="space-y-3">
              {[
                "Criar carrossel para promoção de verão",
                "Relatório de performance mensal",
                "Revisar e ajustar campanhas de tráfego",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white"
                    style={{ background: "rgba(255,255,255,0.25)" }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs text-white/85">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Contact CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="rounded-2xl bg-white p-6 flex items-center justify-between"
          style={{ border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #F5C842, #E8930A)" }}
            >
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "#111" }}>Fale com Caroline</div>
              <div className="text-xs" style={{ color: "#999" }}>Dúvidas, ideias ou aprovações — estamos aqui</div>
            </div>
          </div>
          <button
            onClick={() => setContactOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "linear-gradient(135deg, #F5C842, #E8930A)" }}
          >
            <MessageSquare className="w-4 h-4" /> Enviar mensagem
          </button>
        </motion.div>
      </div>
    </div>
  );
}
