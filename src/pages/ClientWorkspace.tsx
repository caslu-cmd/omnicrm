import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Instagram, Facebook, Zap, FileText, Megaphone, Globe, BarChart2,
  CheckCircle2, Clock, TrendingUp, Eye, Heart, Users, ExternalLink,
  Calendar, Image, Film, BookOpen, Bot, Activity, Link2, ListTodo,
  Plus, Linkedin, MessageCircle, CheckSquare, Circle, AlertCircle,
  Wifi, WifiOff
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { CLIENTS } from "@/data/agencyData";

const ACTIVITY_ICONS: Record<string, typeof Zap> = {
  content: FileText,
  campaign: Megaphone,
  report: BarChart2,
  analysis: TrendingUp,
};

const ACTIVITY_COLORS: Record<string, string> = {
  content: "#A78BFA",
  campaign: "#F97316",
  report: "#34D399",
  analysis: "#60A5FA",
};

const POST_TYPE_ICONS: Record<string, typeof Image> = {
  Feed: Image,
  Story: BookOpen,
  Reels: Film,
};

const reachData = [
  { name: "Sem 1", instagram: 8200, facebook: 3100 },
  { name: "Sem 2", instagram: 11400, facebook: 4200 },
  { name: "Sem 3", instagram: 9800, facebook: 3800 },
  { name: "Sem 4", instagram: 14600, facebook: 5200 },
];

const engagementData = [
  { name: "Feed", valor: 4.2 },
  { name: "Stories", valor: 6.8 },
  { name: "Reels", valor: 9.1 },
  { name: "Facebook", valor: 2.4 },
];

const INTEGRATIONS = [
  {
    id: "instagram",
    name: "Instagram",
    description: "Posts, Stories, Reels e métricas",
    Icon: Instagram,
    color: "#E1306C",
    bg: "rgba(225,48,108,0.1)",
    border: "rgba(225,48,108,0.2)",
    connected: true,
    account: "@clinicadermabella",
    followers: "12,4k seguidores",
    features: ["Publicar posts e stories", "Agendar conteúdo", "Métricas de alcance", "Responder comentários"],
  },
  {
    id: "facebook",
    name: "Facebook",
    description: "Página, Grupos e Facebook Ads",
    Icon: Facebook,
    color: "#1877F2",
    bg: "rgba(24,119,242,0.1)",
    border: "rgba(24,119,242,0.2)",
    connected: true,
    account: "Clínica Derma Bella",
    followers: "8,1k curtidas",
    features: ["Publicar na Página", "Gerenciar Facebook Ads", "Métricas da Página", "Responder mensagens"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Página empresarial e conteúdo B2B",
    Icon: Linkedin,
    color: "#0A66C2",
    bg: "rgba(10,102,194,0.1)",
    border: "rgba(10,102,194,0.2)",
    connected: false,
    account: null,
    followers: null,
    features: ["Publicar na Página da empresa", "Artigos e newsletters", "Métricas de engajamento", "Geração de leads B2B"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Mensagens, automações e atendimento",
    Icon: MessageCircle,
    color: "#25D366",
    bg: "rgba(37,211,102,0.1)",
    border: "rgba(37,211,102,0.2)",
    connected: false,
    account: null,
    followers: null,
    features: ["Enviar mensagens em massa", "Chatbot de atendimento", "Templates aprovados", "Relatório de entrega"],
  },
];

const MOCK_TASKS = [
  { id: "1", text: "Criar carrossel para promoção de verão", priority: "alta", done: false, due: "Hoje" },
  { id: "2", text: "Revisar copy da campanha de retargeting", priority: "alta", done: false, due: "Amanhã" },
  { id: "3", text: "Agendar stories da semana (Seg–Sex)", priority: "media", done: true, due: "Hoje" },
  { id: "4", text: "Gerar relatório mensal de performance", priority: "media", done: false, due: "30/04" },
  { id: "5", text: "Conectar LinkedIn da clínica", priority: "baixa", done: false, due: "02/05" },
  { id: "6", text: "Ajustar orçamento do conjunto de anúncios 2", priority: "alta", done: false, due: "Hoje" },
];

const MOCK_AGENTS = [
  {
    id: "1",
    name: "Agente de Conteúdo",
    description: "Cria legendas, carrosséis e roteiros de vídeo",
    status: "Ativo",
    lastRun: "há 15min",
    tasksToday: 4,
    color: "#A78BFA",
  },
  {
    id: "2",
    name: "Agente de Campanhas",
    description: "Monitora e otimiza campanhas no Facebook Ads e Google Ads",
    status: "Ativo",
    lastRun: "há 1h",
    tasksToday: 2,
    color: "#F97316",
  },
  {
    id: "3",
    name: "Agente de Relatórios",
    description: "Gera relatórios semanais e analisa métricas",
    status: "Pausado",
    lastRun: "ontem",
    tasksToday: 0,
    color: "#34D399",
  },
  {
    id: "4",
    name: "Agente de Atendimento",
    description: "Responde comentários e mensagens no Instagram e WhatsApp",
    status: "Configurando",
    lastRun: "—",
    tasksToday: 0,
    color: "#60A5FA",
  },
];

const PRIORITY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  alta:  { color: "#F87171", bg: "rgba(248,113,113,0.1)", label: "Alta" },
  media: { color: "#FBBF24", bg: "rgba(251,191,36,0.1)", label: "Média" },
  baixa: { color: "#34D399", bg: "rgba(52,211,153,0.1)", label: "Baixa" },
};

export default function ClientWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "";
  const [tasks, setTasks] = useState(MOCK_TASKS);

  const client = CLIENTS.find((c) => c.id === id);

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-full bg-[#080810] text-white">
        Cliente não encontrado.{" "}
        <button onClick={() => navigate("/agency")} className="ml-2 underline">Voltar</button>
      </div>
    );
  }

  const toggleTask = (taskId: string) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, done: !t.done } : t));
  };

  return (
    <div
      className="min-h-full flex flex-col text-white"
      style={{ background: "#080810" }}
    >
      {/* ── Top info bar ── */}
      <div
        className="flex items-center gap-4 px-8 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,8,16,0.95)" }}
      >
        <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          <div className="flex items-center gap-1.5">
            <Instagram className="w-3.5 h-3.5" /> {client.followers.instagram}
          </div>
          <div className="flex items-center gap-1.5">
            <Facebook className="w-3.5 h-3.5" /> {client.followers.facebook}
          </div>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => navigate("/portal")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: `${client.color}18`, color: client.color, border: `1px solid ${client.color}30` }}
          >
            <ExternalLink className="w-3 h-3" /> Ver portal do cliente
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >

            {/* ── VISÃO GERAL ── */}
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

                  {/* Activity feed */}
                  <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Atividade Recente</h3>
                      {client.agentActive && (
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                          </span>
                          <span className="text-[11px]" style={{ color: "#34D399" }}>Agente trabalhando</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      {client.agentFeed.slice(0, 5).map((item, i) => {
                        const Icon = ACTIVITY_ICONS[item.type] ?? Zap;
                        const color = ACTIVITY_COLORS[item.type];
                        return (
                          <div key={item.id} className="flex gap-3 p-3 rounded-xl"
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
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
                      {client.agentFeed.length === 0 && (
                        <p className="text-sm text-center py-6" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhuma atividade ainda.</p>
                      )}
                    </div>
                  </div>

                  {/* Recent posts */}
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
                      {client.recentPosts.length === 0 && (
                        <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhum post ainda.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right col */}
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

            {/* ── CRM ── */}
            {activeTab === "crm" && (
              <div className="rounded-2xl p-10 text-center"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Users className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>CRM deste cliente</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Contatos, pipeline de vendas e histórico em breve.</p>
              </div>
            )}

            {/* ── AGENTES IA ── */}
            {activeTab === "agents" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Agentes IA</h2>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Agentes que trabalham automaticamente para este cliente
                    </p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium"
                    style={{ background: `${client.color}18`, color: client.color, border: `1px solid ${client.color}30` }}>
                    <Plus className="w-3.5 h-3.5" /> Novo agente
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {MOCK_AGENTS.map((agent) => (
                    <motion.div key={agent.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-5"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}30` }}>
                            <Bot className="w-5 h-5" style={{ color: agent.color }} />
                          </div>
                          <div>
                            <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{agent.name}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{agent.description}</div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                          style={{
                            background: agent.status === "Ativo" ? "rgba(16,185,129,0.12)" : agent.status === "Pausado" ? "rgba(100,116,139,0.12)" : "rgba(245,200,66,0.12)",
                            color: agent.status === "Ativo" ? "#34D399" : agent.status === "Pausado" ? "#94A3B8" : "#FBBF24",
                          }}>
                          {agent.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 rounded-xl text-center"
                          style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Última execução</div>
                          <div className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{agent.lastRun}</div>
                        </div>
                        <div className="p-2.5 rounded-xl text-center"
                          style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Tarefas hoje</div>
                          <div className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{agent.tasksToday}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                          style={{ background: `${agent.color}12`, color: agent.color, border: `1px solid ${agent.color}25` }}>
                          {agent.status === "Ativo" ? "Pausar" : "Ativar"}
                        </button>
                        <button className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          Configurar
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ATIVIDADES ── */}
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
                          <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="flex gap-4 p-4 rounded-xl"
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
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

            {/* ── O QUE FAZER ── */}
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
                        onClick={() => toggleTask(task.id)}
                      >
                        <div className="flex-shrink-0">
                          {task.done
                            ? <CheckCircle2 className="w-5 h-5" style={{ color: "#34D399" }} />
                            : <Circle className="w-5 h-5" style={{ color: "rgba(255,255,255,0.2)" }} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm" style={{
                            color: task.done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)",
                            textDecoration: task.done ? "line-through" : "none"
                          }}>
                            {task.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: p.bg, color: p.color }}>{p.label}</span>
                          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{task.due}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── INTEGRAÇÕES ── */}
            {activeTab === "integrations" && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold mb-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>Integrações</h2>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Conecte as redes sociais e plataformas deste cliente
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  {INTEGRATIONS.map((integ) => (
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
                          {integ.connected
                            ? <Wifi className="w-3.5 h-3.5" style={{ color: "#34D399" }} />
                            : <WifiOff className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.2)" }} />
                          }
                          <span className="text-[10px] font-medium"
                            style={{ color: integ.connected ? "#34D399" : "rgba(255,255,255,0.3)" }}>
                            {integ.connected ? "Conectado" : "Desconectado"}
                          </span>
                        </div>
                      </div>

                      {integ.connected && integ.account && (
                        <div className="mb-4 px-3 py-2.5 rounded-xl"
                          style={{ background: `${integ.color}10`, border: `1px solid ${integ.color}20` }}>
                          <div className="text-xs font-medium" style={{ color: integ.color }}>{integ.account}</div>
                          {integ.followers && (
                            <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{integ.followers}</div>
                          )}
                        </div>
                      )}

                      <div className="mb-4 space-y-1.5">
                        {integ.features.map((f) => (
                          <div key={f} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0"
                              style={{ color: integ.connected ? "#34D399" : "rgba(255,255,255,0.2)" }} />
                            <span className="text-[11px]" style={{ color: integ.connected ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)" }}>
                              {f}
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        className="w-full py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={integ.connected
                          ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" }
                          : { background: integ.bg, color: integ.color, border: `1px solid ${integ.border}` }
                        }
                      >
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
