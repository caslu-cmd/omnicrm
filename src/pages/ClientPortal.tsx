import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Clock, Eye, Heart, TrendingUp, Calendar,
  Image, Film, BookOpen, ChevronRight, Star, Sparkles,
  BarChart2, Users, Zap, MessageCircle, ArrowUpRight,
  FileText, Megaphone, Instagram, Facebook, Linkedin,
  ThumbsUp, Download, Bell, Shield, Award, Target,
  ChevronDown, Phone, Mail, ExternalLink, Play,
} from "lucide-react";
import { motion as m } from "framer-motion";
import { CLIENTS } from "@/data/agencyData";

const CLIENT = CLIENTS[0];

const POST_ICONS: Record<string, typeof Image> = { Feed: Image, Story: BookOpen, Reels: Film };
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  Publicado: { bg: "rgba(16,185,129,0.1)",  color: "#10B981", label: "Publicado"  },
  Agendado:  { bg: "rgba(59,130,246,0.1)",  color: "#3B82F6", label: "Agendado"   },
  Rascunho:  { bg: "rgba(245,158,11,0.1)",  color: "#F59E0B", label: "Aguard. aprovação" },
};

const VALUE_CARDS = [
  { icon: Shield,  title: "Proteção da marca",    desc: "Todo conteúdo é revisado e aprovado antes de publicar" },
  { icon: Target,  title: "Foco em resultado",    desc: "Cada ação é orientada a gerar leads e vendas para você" },
  { icon: Zap,     title: "Time dedicado 24/7",   desc: "9 especialistas de IA trabalhando exclusivamente para sua empresa" },
  { icon: Award,   title: "Relatórios completos", desc: "Transparência total sobre o que foi feito e os resultados" },
];

const TESTIMONIALS = [
  { name: "Sandra Costa", company: "Grupo XYZ", text: "Em 3 meses dobramos o número de leads qualificados. O time da Caroline entrega resultado.", stars: 5 },
  { name: "Roberto Pereira", company: "Construtora AP", text: "Ganhei um contrato de R$ 380k graças ao posicionamento que a agência construiu para nós.", stars: 5 },
];

export default function ClientPortal() {
  const [approving, setApproving] = useState<string | null>(null);
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const [contactOpen, setContactOpen] = useState(false);
  const client = CLIENT;

  const pendingApproval = client.recentPosts.filter((p) => p.status === "Rascunho");
  const scheduled = client.recentPosts.filter((p) => p.status === "Agendado");
  const published = client.recentPosts.filter((p) => p.status === "Publicado");

  const handleApprove = (id: string) => {
    setApproving(id);
    setTimeout(() => {
      setApproved((prev) => new Set([...prev, id]));
      setApproving(null);
    }, 900);
  };

  return (
    <div className="min-h-screen" style={{ background: "#F5F4F1", fontFamily: "system-ui, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{ background: client.color }}>{client.initials}</div>
          <div>
            <div className="text-sm font-bold" style={{ color: "#111" }}>{client.name}</div>
            <div className="text-[11px]" style={{ color: "#888" }}>Portal exclusivo · Agência Caroline Lucas</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pendingApproval.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: "rgba(245,158,11,0.12)", color: "#D97706", border: "1px solid rgba(245,158,11,0.25)" }}>
              <Bell className="w-3 h-3" />
              {pendingApproval.length} aguardando aprovação
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
            style={{ background: `${client.color}12`, color: client.color, border: `1px solid ${client.color}25` }}>
            <Sparkles className="w-3 h-3" /> Gerenciado pela Agência Caroline Lucas
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* ── Hero ───────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="rounded-3xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, #0D0D12 0%, #1a1a28 100%)`, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-10 pt-10 pb-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Abril 2025 · Resumo executivo
                  </div>
                  <h1 className="text-4xl font-bold mb-1 tracking-tight" style={{ color: "#F0F0F0" }}>
                    Tudo funcionando para você.
                  </h1>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Seu time de especialistas trabalhou {client.agentFeed.length * 3}+ horas este mês.
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#34D399" }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#34D399" }} />
                  </div>
                  <span className="text-xs" style={{ color: "#34D399" }}>Time ativo agora</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-8">
                {client.metrics.map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                    className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>{m.label}</div>
                    <div className="text-2xl font-bold tracking-tight mb-1" style={{ color: "#F0F0F0" }}>{m.value}</div>
                    <div className="text-[11px] font-medium flex items-center gap-1"
                      style={{ color: m.positive ? "#34D399" : "#F87171" }}>
                      <ArrowUpRight className="w-3 h-3" style={{ transform: m.positive ? "none" : "rotate(90deg)" }} />
                      {m.change}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ROI Banner */}
            <div className="px-10 py-4 flex items-center justify-between"
              style={{ background: `${client.color}22`, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: client.color }} />
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <span className="font-bold text-white">{client.postsMonth} posts</span> publicados este mês
                  </span>
                </div>
                <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.1)" }} />
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4" style={{ color: client.color }} />
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <span className="font-bold text-white">{client.campaigns} campanhas</span> ativas
                  </span>
                </div>
                <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.1)" }} />
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: client.color }} />
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <span className="font-bold text-white">{client.followers.instagram}</span> no Instagram
                  </span>
                </div>
              </div>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                Última atualização {client.lastActivity}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Aguardando aprovação ────────────────────────────── */}
        {pendingApproval.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.04)" }}>
              <div className="px-6 py-4 flex items-center gap-3"
                style={{ borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
                <Bell className="w-4 h-4" style={{ color: "#D97706" }} />
                <span className="text-sm font-semibold" style={{ color: "#111" }}>
                  {pendingApproval.length} {pendingApproval.length === 1 ? "conteúdo aguarda" : "conteúdos aguardam"} sua aprovação
                </span>
                <span className="text-xs ml-auto" style={{ color: "#999" }}>Aprove para publicar</span>
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold" style={{ color: "#222" }}>{post.type} · {post.platform}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#D97706" }}>
                            Aguardando aprovação
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "#555" }}>{post.caption}</p>
                        <div className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: "#aaa" }}>
                          <Clock className="w-2.5 h-2.5" /> Publicar em: {post.scheduledFor}
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
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>
                              Pedir ajuste
                            </button>
                            <button
                              onClick={() => handleApprove(post.id)}
                              disabled={approving === post.id}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: "#10B981", color: "white", opacity: approving === post.id ? 0.7 : 1 }}>
                              {approving === post.id ? (
                                <><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Aprovando...</>
                              ) : (
                                <><ThumbsUp className="w-3.5 h-3.5" /> Aprovar</>
                              )}
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

        {/* ── O que o time fez ────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold" style={{ color: "#111" }}>O que seu time fez por você</h2>
                <p className="text-xs mt-0.5" style={{ color: "#888" }}>Atividade das últimas 48h</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
                style={{ background: "rgba(52,211,153,0.1)", color: "#10B981" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Time ativo
              </div>
            </div>
            <div className="space-y-1">
              {client.agentFeed.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.06 }}
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

        {/* ── Conteúdo programado ─────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold" style={{ color: "#111" }}>Conteúdo desta semana</h2>
                <p className="text-xs mt-0.5" style={{ color: "#888" }}>
                  {scheduled.length} publicações agendadas · {published.length} já publicadas
                </p>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{ background: `${client.color}10`, color: client.color, border: `1px solid ${client.color}20` }}>
                Ver calendário completo <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {[...scheduled, ...published].map((post) => {
                const Icon = POST_ICONS[post.type] ?? Image;
                const ss = STATUS_STYLE[post.status];
                return (
                  <div key={post.id} className="flex items-start gap-4 p-4 rounded-xl"
                    style={{ background: "#F9F8F6", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${client.color}12`, border: `1px solid ${client.color}20` }}>
                      <Icon className="w-4 h-4" style={{ color: client.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold" style={{ color: "#222" }}>{post.type} · {post.platform}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: "#555" }}>{post.caption}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] flex items-center gap-1" style={{ color: "#aaa" }}>
                          <Clock className="w-2.5 h-2.5" /> {post.scheduledFor}
                        </span>
                        {post.likes !== undefined && (
                          <>
                            <span className="text-[10px] flex items-center gap-1" style={{ color: "#aaa" }}>
                              <Heart className="w-2.5 h-2.5" /> {post.likes.toLocaleString("pt-BR")} curtidas
                            </span>
                            <span className="text-[10px] flex items-center gap-1" style={{ color: "#aaa" }}>
                              <Eye className="w-2.5 h-2.5" /> {post.reach?.toLocaleString("pt-BR")} pessoas
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Campanhas ativa ─────────────────────────────────── */}
        {client.activeCampaigns.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <h2 className="text-base font-bold mb-1" style={{ color: "#111" }}>Campanhas de tráfego pago</h2>
              <p className="text-xs mb-5" style={{ color: "#888" }}>Performance em tempo real das suas campanhas ativas</p>
              <div className="grid grid-cols-2 gap-4">
                {client.activeCampaigns.map((camp) => (
                  <div key={camp.id} className="rounded-2xl p-5"
                    style={{ background: "#F9F8F6", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "#111" }}>{camp.name}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: "#888" }}>{camp.platform}</div>
                      </div>
                      <span className="text-[10px] px-2 py-1 rounded-full font-semibold"
                        style={{ background: camp.status === "Ativa" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: camp.status === "Ativa" ? "#10B981" : "#D97706" }}>
                        {camp.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Investido", value: camp.spent },
                        { label: "Resultados", value: camp.results },
                        { label: "CPA", value: camp.cpa },
                      ].map((s) => (
                        <div key={s.label}>
                          <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: "#aaa" }}>{s.label}</div>
                          <div className="text-sm font-bold" style={{ color: "#111" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Próximas ações ──────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-2xl p-6 text-white"
              style={{ background: `linear-gradient(135deg, ${client.color} 0%, ${client.color}cc 100%)` }}>
              <h2 className="text-sm font-bold mb-1">O que planejamos para você</h2>
              <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.65)" }}>Próximas ações do seu time</p>
              <div className="space-y-3">
                {client.orchestratorPlan.slice(0, 4).map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: step.done ? "rgba(255,255,255,0.9)" : step.active ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)", color: step.done ? client.color : "white" }}>
                      {step.done ? "✓" : i + 1}
                    </div>
                    <span className="text-xs" style={{ color: step.done ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.9)", textDecoration: step.done ? "line-through" : "none" }}>
                      {step.step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
              <h2 className="text-sm font-bold mb-1" style={{ color: "#111" }}>Arquivos entregues este mês</h2>
              <p className="text-xs mb-4" style={{ color: "#888" }}>Downloads disponíveis</p>
              <div className="space-y-2">
                {[
                  { name: "Relatório de Performance — Abril", type: "PDF", size: "2,4 MB" },
                  { name: "Pauta Editorial — Maio", type: "DOCX", size: "340 KB" },
                  { name: "Arte Stories — Semana 4", type: "ZIP", size: "18,2 MB" },
                  { name: "Copy de Posts — Maio", type: "DOCX", size: "210 KB" },
                ].map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "#F9F8F6", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: client.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "#222" }}>{file.name}</div>
                      <div className="text-[10px]" style={{ color: "#aaa" }}>{file.type} · {file.size}</div>
                    </div>
                    <button className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                      style={{ color: "#bbb" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = client.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#bbb")}>
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Por que a Agência Caroline Lucas ───────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="px-8 py-6 bg-white">
              <div className="text-center mb-8">
                <div className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "#aaa" }}>Por que confiar em nós</div>
                <h2 className="text-2xl font-bold tracking-tight" style={{ color: "#111" }}>
                  Tecnologia de ponta com toque humano
                </h2>
                <p className="text-sm mt-2 max-w-lg mx-auto" style={{ color: "#777" }}>
                  A Agência Caroline Lucas combina IA especializada com estratégia humana para entregar resultados reais — não métricas de vaidade.
                </p>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {VALUE_CARDS.map((card, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.07 }}
                    className="text-center p-5 rounded-2xl" style={{ background: "#F9F8F6", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: `${client.color}12`, border: `1px solid ${client.color}20` }}>
                      <card.icon className="w-5 h-5" style={{ color: client.color }} />
                    </div>
                    <div className="text-xs font-bold mb-1" style={{ color: "#111" }}>{card.title}</div>
                    <div className="text-[11px] leading-relaxed" style={{ color: "#777" }}>{card.desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Depoimentos */}
            <div className="px-8 py-6" style={{ background: "#F5F4F1", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: "#aaa" }}>O que dizem outros clientes</div>
              <div className="grid grid-cols-2 gap-4">
                {TESTIMONIALS.map((t, i) => (
                  <div key={i} className="rounded-2xl p-5 bg-white" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex mb-3">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 fill-amber-400" style={{ color: "#F59E0B" }} />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "#333" }}>"{t.text}"</p>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: "#111" }}>{t.name}</div>
                      <div className="text-[11px]" style={{ color: "#888" }}>{t.company}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Fale com Caroline ───────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <div className="rounded-2xl p-8 flex items-center justify-between bg-white"
            style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #F5C842, #E8930A)" }}>
                <Star className="w-7 h-7 text-white fill-white" />
              </div>
              <div>
                <div className="text-base font-bold mb-0.5" style={{ color: "#111" }}>Fale diretamente com Caroline</div>
                <div className="text-sm" style={{ color: "#777" }}>Dúvidas, ideias, aprovações ou um café virtual — estou aqui para você.</div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <a href="mailto:carolinielucas.cl@gmail.com"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "#F5F4F1", color: "#444", border: "1px solid rgba(0,0,0,0.1)" }}>
                <Mail className="w-4 h-4" /> E-mail
              </a>
              <a href="https://wa.me/5511999999999"
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all text-white"
                style={{ background: "#25D366", boxShadow: "0 4px 16px rgba(37,211,102,0.35)" }}>
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-[11px]" style={{ color: "#bbb" }}>
            Portal exclusivo Agência Caroline Lucas · Todas as informações são confidenciais
          </p>
        </div>

      </div>
    </div>
  );
}
