import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, Eye, Heart, TrendingUp,
  Image, Film, BookOpen, Star, Sparkles,
  BarChart2, Users, Zap, MessageCircle, ArrowUpRight,
  FileText, Megaphone, Instagram, Facebook, Linkedin,
  ThumbsUp, Download, Bell, Shield, Award, Target,
  Mail, DollarSign, ArrowRight,
  Wallet, Check,
} from "lucide-react";
import { CLIENTS } from "@/data/agencyData";

const CLIENT = CLIENTS[0];

// ── Agent team displayed in portal ───────────────────────────
const PORTAL_TEAM = [
  {
    id: "aria", name: "ARIA", role: "Orquestradora Geral", initial: "A",
    color: "#B9FF4B", textColor: "#07080A",
    desc: "Coordena todo o time e garante que sua estratégia seja executada no prazo e com qualidade.",
    marketRole: null,
  },
  {
    id: "strategist", name: "Carolina", role: "Estrategista de Marca", initial: "C",
    color: "#FBBF24", textColor: "#07080A",
    desc: "Define seu posicionamento, pauta editorial e a direção criativa da sua presença digital.",
    marketRole: "Gerente de Marketing Sênior",
    marketMin: 8000, marketMax: 14000,
  },
  {
    id: "copywriter", name: "Beatriz", role: "Copywriter", initial: "B",
    color: "#A78BFA", textColor: "#fff",
    desc: "Escreve cada texto, legenda, artigo e anúncio com foco em conversão e identidade de marca.",
    marketRole: "Redator / Copywriter Sênior",
    marketMin: 5000, marketMax: 8000,
  },
  {
    id: "designer", name: "Isadora", role: "Designer Visual", initial: "I",
    color: "#D946EF", textColor: "#fff",
    desc: "Cria todos os visuais — posts, stories, banners, apresentações — alinhados ao seu manual de marca.",
    marketRole: "Designer Gráfico Sênior",
    marketMin: 5000, marketMax: 9000,
  },
  {
    id: "traffic", name: "Rafaela", role: "Gestora de Tráfego", initial: "R",
    color: "#F97316", textColor: "#fff",
    desc: "Gerencia suas campanhas pagas (Facebook, Google, LinkedIn) com foco em CPA baixo e ROAS alto.",
    marketRole: "Especialista em Tráfego Pago",
    marketMin: 5000, marketMax: 9000,
  },
  {
    id: "social", name: "Marina", role: "Social Media Manager", initial: "M",
    color: "#60A5FA", textColor: "#fff",
    desc: "Agenda, publica e monitora todo o conteúdo orgânico das suas redes sociais diariamente.",
    marketRole: "Social Media Pleno/Sênior",
    marketMin: 3500, marketMax: 5500,
  },
  {
    id: "analyst", name: "Lucas", role: "Analista de Dados", initial: "L",
    color: "#34D399", textColor: "#07080A",
    desc: "Monitora métricas, identifica oportunidades e entrega relatórios com insights acionáveis.",
    marketRole: "Analista de Marketing Digital",
    marketMin: 4500, marketMax: 7000,
  },
  {
    id: "sales", name: "Eduardo", role: "Agente de Vendas", initial: "E",
    color: "#F59E0B", textColor: "#07080A",
    desc: "Qualifica leads via WhatsApp, alimenta seu CRM e acelera o fechamento de novos negócios.",
    marketRole: "SDR / Pré-vendedor",
    marketMin: 3500, marketMax: 6000,
  },
  {
    id: "site", name: "Teo", role: "Editor de Site", initial: "T",
    color: "#06B6D4", textColor: "#fff",
    desc: "Atualiza seu site, publica artigos no blog e otimiza páginas para SEO continuamente.",
    marketRole: "Web Designer / WordPress Dev",
    marketMin: 4000, marketMax: 6500,
  },
  {
    id: "revisor", name: "Vitória", role: "Revisora de Conteúdo", initial: "V",
    color: "#EC4899", textColor: "#fff",
    desc: "Revisa e corrige 100% do conteúdo produzido antes de publicar. Sua marca nunca erra.",
    marketRole: "Revisora / Editora de Texto",
    marketMin: 2500, marketMax: 4000,
  },
];

const marketTeam = PORTAL_TEAM.filter(m => m.marketRole !== null);
const MARKET_TOTAL_MIN = marketTeam.reduce((s, m) => s + (m.marketMin ?? 0), 0);
const MARKET_TOTAL_MAX = marketTeam.reduce((s, m) => s + (m.marketMax ?? 0), 0);

const POST_ICONS: Record<string, typeof Image> = { Feed: Image, Story: BookOpen, Reels: Film };

export default function ClientPortal() {
  const [approving, setApproving] = useState<string | null>(null);
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const client = CLIENT;

  const pendingApproval = client.recentPosts.filter((p) => p.status === "Rascunho");
  const campaigns = client.collabCampaigns ?? [];
  const agencyFee = parseFloat(client.revenue.replace(/[^\d]/g, "")) || 0;
  const savingsMin = MARKET_TOTAL_MIN - agencyFee;
  const savingsMax = MARKET_TOTAL_MAX - agencyFee;

  const handleApprove = (id: string) => {
    setApproving(id);
    setTimeout(() => {
      setApproved(prev => new Set([...prev, id]));
      setApproving(null);
    }, 900);
  };

  return (
    <div className="min-h-screen" style={{ background: "#F2F1EE", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#B9FF4B" }}>
            <Zap className="w-4 h-4" style={{ color: "#07080A" }} />
          </div>
          <div className="text-sm font-bold" style={{ color: "#111" }}>Agência Caroline Lucas</div>
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
                { icon: Facebook,  label: `${client.followers.facebook} no Facebook` },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <div className="w-px h-3 mr-2" style={{ background: "rgba(255,255,255,0.1)" }} />}
                  <s.icon className="w-3.5 h-3.5" style={{ color: client.color }} />
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{s.label}</span>
                </div>
              ))}
              <div className="ml-auto text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                Atualizado {client.lastActivity}
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
                <span className="text-xs ml-auto" style={{ color: "#999" }}>Aprove para publicarmos</span>
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
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="text-sm font-bold mb-0.5" style={{ color: "#111" }}>{camp.name}</div>
                            <p className="text-[11px] leading-relaxed" style={{ color: "#888" }}>{camp.objective}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
                              {camp.status.charAt(0).toUpperCase() + camp.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Platform badges */}
                        <div className="flex gap-1.5 mb-4 flex-wrap">
                          {camp.platforms.map(p => (
                            <span key={p} className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                              style={{ background: "rgba(0,0,0,0.05)", color: "#666", border: "1px solid rgba(0,0,0,0.08)" }}>
                              {p}
                            </span>
                          ))}
                        </div>

                        {/* Metrics grid */}
                        <div className="grid grid-cols-5 gap-3 mb-4">
                          {[
                            { label: "Orçamento",  value: camp.budget,  highlight: false },
                            { label: "Investido",   value: camp.spent,   highlight: false },
                            { label: "Alcance",    value: camp.reach,   highlight: false },
                            { label: "Leads",      value: camp.leads.toString(), highlight: true },
                            { label: "Custo/Lead", value: camp.cpa,     highlight: false },
                          ].map(m => (
                            <div key={m.label} className="rounded-xl p-3 text-center"
                              style={{ background: m.highlight ? `${client.color}12` : "rgba(255,255,255,0.8)", border: m.highlight ? `1px solid ${client.color}25` : "1px solid rgba(0,0,0,0.06)" }}>
                              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: m.highlight ? client.color : "#aaa" }}>{m.label}</div>
                              <div className="text-sm font-bold" style={{ color: m.highlight ? client.color : "#111" }}>{m.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Budget progress */}
                        <div>
                          <div className="flex justify-between mb-1.5">
                            <span className="text-[10px]" style={{ color: "#aaa" }}>Orçamento utilizado</span>
                            <span className="text-[10px] font-semibold" style={{ color: "#555" }}>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E8E7E4" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: client.color }} />
                          </div>
                        </div>

                        {/* Remarketing note */}
                        {camp.remarketing.filter(r => r.status === "ativa").length > 0 && (
                          <div className="mt-4 flex items-center gap-2.5 px-3 py-2 rounded-xl"
                            style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)" }}>
                            <Target className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#F97316" }} />
                            <span className="text-[11px]" style={{ color: "#666" }}>
                              <span className="font-semibold" style={{ color: "#F97316" }}>
                                {camp.remarketing.filter(r => r.status === "ativa").length} audiências de remarketing ativas
                              </span>
                              {" "}— retargeting de visitantes e engajados para reduzir o custo por lead.
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
                    A inteligência central que coordena toda a equipe. Ela garante que a estratégia certa seja executada, no tempo certo, com qualidade — sem que você precise gerenciar nada.
                  </p>
                  <div className="text-[11px] px-3 py-2 rounded-xl"
                    style={{ background: "rgba(185,255,75,0.08)", border: "1px solid rgba(185,255,75,0.2)" }}>
                    <span className="font-semibold" style={{ color: "#3a6e00" }}>Fazendo agora:</span>
                    <span style={{ color: "#555" }}> {client.orchestratorStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rest of team */}
            <div className="grid grid-cols-3 gap-0">
              {PORTAL_TEAM.slice(1).map((member, i) => {
                const task = client.agentTasks[member.id];
                return (
                  <motion.div key={member.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 + i * 0.05 }}
                    className="p-5"
                    style={{ borderBottom: i < 6 ? "1px solid rgba(0,0,0,0.05)" : "none", borderRight: (i % 3 !== 2) ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
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
                    <p className="text-[10px] leading-relaxed mb-2.5" style={{ color: "#777" }}>{member.desc}</p>
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
              <p className="text-xs" style={{ color: "#888" }}>
                Custo real de contratar cada profissional vs. o que você investe na agência
              </p>
            </div>

            <div className="p-6">
              {/* Comparison header */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-[10px] uppercase tracking-widest font-semibold px-2"
                style={{ color: "#aaa" }}>
                <span>Profissional</span>
                <span className="text-center">Mercado (CLT/PJ)</span>
                <span className="text-right">Com a agência</span>
              </div>

              <div className="space-y-1.5 mb-5">
                {marketTeam.map((m, i) => (
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
                        <div className="text-[9px]" style={{ color: "#999" }}>{m.marketRole}</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-semibold" style={{ color: "#555" }}>
                        R$ {m.marketMin!.toLocaleString("pt-BR")}–{m.marketMax!.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="text-right flex items-center justify-end gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
                        Incluído
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Totals comparison */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="grid grid-cols-3">
                  <div className="p-5" style={{ background: "#FEF2F2", borderRight: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#ef4444" }}>
                      Contratar individualmente
                    </div>
                    <div className="text-2xl font-black mb-1" style={{ color: "#DC2626" }}>
                      R$ {MARKET_TOTAL_MIN.toLocaleString("pt-BR")}+
                    </div>
                    <div className="text-[11px]" style={{ color: "#999" }}>por mês, sem incluir encargos</div>
                  </div>

                  <div className="p-5" style={{ background: "#F0FDF4", borderRight: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#10B981" }}>
                      Com a Agência Caroline Lucas
                    </div>
                    <div className="text-2xl font-black mb-1" style={{ color: "#059669" }}>
                      {client.revenue}
                    </div>
                    <div className="text-[11px]" style={{ color: "#999" }}>tudo incluído, sem surpresas</div>
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

                {/* Highlight note */}
                <div className="px-5 py-3.5 flex items-center gap-3"
                  style={{ background: "#F9F8F6", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <Wallet className="w-4 h-4 flex-shrink-0" style={{ color: "#10B981" }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: "#666" }}>
                    Além da economia, você tem <strong>mais velocidade</strong> (IA trabalha 24h), <strong>mais consistência</strong> (sem férias, atestados ou turnover) e <strong>mais resultado</strong> (time especializado em conjunto, não em silos).
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
                  className="flex items-start gap-4 p-3 rounded-xl transition-colors cursor-default"
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
                    style={{ background: step.done ? "rgba(255,255,255,0.9)" : step.active ? "white" : "rgba(255,255,255,0.2)", color: step.done || step.active ? client.color : "rgba(255,255,255,0.6)" }}>
                    {step.done ? <Check className="w-3 h-3" style={{ color: client.color }} /> : i + 1}
                  </div>
                  <span className="text-xs leading-relaxed"
                    style={{ color: step.done ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.9)", textDecoration: step.done ? "line-through" : "none" }}>
                    {step.step}
                  </span>
                  {step.active && (
                    <span className="ml-auto flex-shrink-0">
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
            Portal exclusivo · Agência Caroline Lucas · Todas as informações são confidenciais
          </p>
        </div>
      </div>
    </div>
  );
}
