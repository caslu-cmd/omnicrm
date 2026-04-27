import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Instagram, Facebook, Zap, FileText,
  Megaphone, Globe, BarChart2, Settings, CheckCircle2,
  Clock, TrendingUp, Eye, Heart, Users, ExternalLink,
  Calendar, Image, Film, BookOpen
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

export default function ClientWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") ?? "";

  const client = CLIENTS.find((c) => c.id === id);

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-full bg-[#080810] text-white">
        Cliente não encontrado.{" "}
        <button onClick={() => navigate("/agency")} className="ml-2 underline">Voltar</button>
      </div>
    );
  }

  return (
    <div
      className="min-h-full flex flex-col text-white"
      style={{ fontFamily: "'DM Sans', sans-serif", background: "#080810" }}
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
            {/* VISÃO GERAL */}
            {activeTab === "" && (
              <div className="grid grid-cols-3 gap-6">
                {/* Agent activity feed — col span 2 */}
                <div className="col-span-2 space-y-5">
                  {/* Metrics row */}
                  <div className="grid grid-cols-4 gap-3">
                    {client.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="rounded-xl p-4"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <div className="text-[10px] mb-2 uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {m.label}
                        </div>
                        <div className="text-2xl mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
                          {m.value}
                        </div>
                        <div className={`text-[11px] font-medium`} style={{ color: m.positive ? "#34D399" : "#F87171" }}>
                          {m.change}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Agent feed */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                        Atividade do Agente IA
                      </h3>
                      {client.agentActive && (
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                          </span>
                          <span className="text-[11px]" style={{ color: "#34D399" }}>Trabalhando agora</span>
                        </div>
                      )}
                    </div>
                    {client.agentFeed.length === 0 ? (
                      <p className="text-sm text-center py-6" style={{ color: "rgba(255,255,255,0.2)" }}>
                        Agente pausado. Nenhuma atividade recente.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {client.agentFeed.map((item, i) => {
                          const Icon = ACTIVITY_ICONS[item.type] ?? Zap;
                          const color = ACTIVITY_COLORS[item.type];
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06 }}
                              className="flex gap-3 p-3 rounded-xl transition-colors"
                              style={{}}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                              >
                                <Icon className="w-3.5 h-3.5" style={{ color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
                                    {item.action}
                                  </span>
                                  <span className="text-[11px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
                                    {item.time}
                                  </span>
                                </div>
                                <p className="text-[11px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                                  {item.detail}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Recent posts */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <h3 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
                      Posts Recentes
                    </h3>
                    {client.recentPosts.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.2)" }}>
                        Nenhum post ainda.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {client.recentPosts.map((post) => {
                          const Icon = POST_TYPE_ICONS[post.type] ?? Image;
                          return (
                            <div
                              key={post.id}
                              className="flex items-start gap-3 p-3 rounded-xl"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: `${client.color}15`, border: `1px solid ${client.color}25` }}
                              >
                                <Icon className="w-4 h-4" style={{ color: client.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[11px] font-medium" style={{ color: client.color }}>
                                    {post.type} · {post.platform}
                                  </span>
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                                    style={{
                                      background: post.status === "Publicado" ? "rgba(16,185,129,0.12)" : "rgba(245,200,66,0.12)",
                                      color: post.status === "Publicado" ? "#34D399" : "#F5C842",
                                    }}
                                  >
                                    {post.status}
                                  </span>
                                </div>
                                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                                  {post.caption}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                                    <Clock className="w-2.5 h-2.5 inline mr-1" />{post.scheduledFor}
                                  </span>
                                  {post.likes !== undefined && (
                                    <>
                                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                                        <Heart className="w-2.5 h-2.5 inline mr-1" />{post.likes.toLocaleString("pt-BR")}
                                      </span>
                                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                                        <Eye className="w-2.5 h-2.5 inline mr-1" />{post.reach?.toLocaleString("pt-BR")}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column — calendar + campaigns */}
                <div className="space-y-5">
                  {/* Weekly calendar */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <h3 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
                      Esta Semana
                    </h3>
                    <div className="space-y-1.5">
                      {client.weeklyContent.map((day) => (
                        <div
                          key={day.day}
                          className="flex items-center gap-3 p-2.5 rounded-lg"
                          style={{ background: day.posts.length > 0 ? "rgba(255,255,255,0.04)" : "transparent" }}
                        >
                          <div className="w-8 text-center flex-shrink-0">
                            <div className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>{day.day}</div>
                            <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{day.date.split("/")[0]}</div>
                          </div>
                          {day.posts.length === 0 ? (
                            <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>Sem publicações</div>
                          ) : (
                            <div className="flex gap-1 flex-wrap">
                              {day.posts.map((p, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 rounded-md"
                                  style={{
                                    background: `${client.color}15`,
                                    color: client.color,
                                    border: `1px solid ${client.color}25`,
                                  }}
                                >
                                  {p.type} · {p.platform}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active campaigns */}
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <h3 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
                      Campanhas Ativas
                    </h3>
                    {client.activeCampaigns.length === 0 ? (
                      <p className="text-xs text-center py-3" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhuma campanha ativa.</p>
                    ) : (
                      <div className="space-y-2">
                        {client.activeCampaigns.map((camp) => (
                          <div
                            key={camp.id}
                            className="p-3 rounded-xl"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span className="text-xs font-medium leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>
                                {camp.name}
                              </span>
                              <span className="text-[10px] ml-2 flex-shrink-0" style={{ color: "#34D399" }}>{camp.status}</span>
                            </div>
                            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                              {camp.platform} · {camp.results} · CPA {camp.cpa}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CRM */}
            {activeTab === "crm" && (
              <div
                className="rounded-2xl p-10 text-center"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <Users className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>CRM deste cliente</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Contatos, pipeline de vendas e histórico de relacionamento em breve.
                </p>
              </div>
            )}

            {/* CONTEÚDO */}
            {activeTab === "content" && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <h3 className="text-sm font-medium mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Calendário de Conteúdo
                </h3>
                <div className="grid grid-cols-7 gap-3">
                  {client.weeklyContent.map((day) => (
                    <div key={day.day}>
                      <div className="text-center mb-2">
                        <div className="text-[10px] font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{day.day}</div>
                        <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{day.date.split("/")[0]}</div>
                      </div>
                      <div className="space-y-1.5 min-h-[80px]">
                        {day.posts.map((p, i) => {
                          const Icon = POST_TYPE_ICONS[p.type] ?? Image;
                          return (
                            <div
                              key={i}
                              className="p-2 rounded-lg cursor-pointer transition-all"
                              style={{
                                background: `${client.color}12`,
                                border: `1px solid ${client.color}25`,
                              }}
                            >
                              <Icon className="w-3 h-3 mb-1" style={{ color: client.color }} />
                              <div className="text-[10px] leading-tight" style={{ color: "rgba(255,255,255,0.55)" }}>
                                {p.type}
                              </div>
                              <div className="text-[9px] mt-0.5" style={{ color: p.status === "Agendado" ? "#34D399" : "rgba(255,255,255,0.3)" }}>
                                {p.status}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CAMPANHAS */}
            {activeTab === "campaigns" && (
              <div className="space-y-4">
                {client.activeCampaigns.length === 0 ? (
                  <div
                    className="rounded-2xl p-10 text-center"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <Megaphone className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Nenhuma campanha ativa. Configure a estratégia de tráfego pago para este cliente.
                    </p>
                  </div>
                ) : (
                  client.activeCampaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="rounded-2xl p-6"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>
                            {camp.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{camp.platform}</span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(16,185,129,0.12)", color: "#34D399" }}
                            >
                              {camp.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Investido</div>
                          <div className="text-lg" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
                            {camp.spent}
                          </div>
                          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>de {camp.budget}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: "Resultados", value: camp.results },
                          { label: "CPA", value: camp.cpa },
                          { label: "Orçamento", value: camp.budget },
                        ].map((m) => (
                          <div
                            key={m.label}
                            className="p-3 rounded-xl text-center"
                            style={{ background: "rgba(255,255,255,0.03)" }}
                          >
                            <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{m.label}</div>
                            <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SITE */}
            {activeTab === "site" && (
              <div
                className="rounded-2xl p-10 text-center"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <Globe className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Integração WordPress em breve
                </p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Atualize páginas, publique posts e gerencie o site diretamente por aqui.
                </p>
              </div>
            )}

            {/* RELATÓRIOS */}
            {activeTab === "reports" && (
              <div className="grid grid-cols-2 gap-6">
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <h3 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Alcance Mensal
                  </h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={reachData}>
                      <defs>
                        <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={client.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={client.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number) => [v.toLocaleString("pt-BR"), ""]}
                      />
                      <Area type="monotone" dataKey="instagram" stroke={client.color} strokeWidth={2} fill="url(#ig)" />
                      <Area type="monotone" dataKey="facebook" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} fill="none" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <h3 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
                    Engajamento por Formato
                  </h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={engagementData} barSize={28}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number) => [`${v}%`, "Engajamento"]}
                      />
                      <Bar dataKey="valor" fill={client.color} radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="col-span-2 grid grid-cols-4 gap-4">
                  {client.metrics.map((m) => (
                    <div
                      key={m.label}
                      className="rounded-2xl p-5 text-center"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <div className="text-[10px] uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {m.label}
                      </div>
                      <div className="text-3xl mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
                        {m.value}
                      </div>
                      <div className="text-xs font-medium" style={{ color: m.positive ? "#34D399" : "#F87171" }}>
                        {m.change}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONFIGURAÇÕES */}
            {activeTab === "settings" && (
              <div
                className="rounded-2xl p-6 max-w-lg"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <h3 className="text-sm font-medium mb-5" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Configurações do Cliente
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Nome do cliente", value: client.name },
                    { label: "Segmento", value: client.industry },
                    { label: "Cor da marca", value: client.color },
                    { label: "Receita mensal", value: client.revenue },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="text-[11px] block mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {field.label}
                      </label>
                      <div
                        className="w-full px-3 py-2.5 rounded-xl text-sm"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(255,255,255,0.7)",
                        }}
                      >
                        {field.value}
                      </div>
                    </div>
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
