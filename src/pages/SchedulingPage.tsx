import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Plus, ChevronLeft, ChevronRight, Clock, Video,
  MapPin, User, ExternalLink, Settings2, Copy, Bell, X, Trash2,
  Instagram, Facebook, Linkedin, Check, AlertCircle, RefreshCw,
  CheckCircle2, FileText, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AIInputField } from "@/components/AIInputField";

// ── Types ──────────────────────────────────────────────────────
interface ScheduledPost {
  id: string;
  client_id: string;
  platforms: string[];
  caption: string | null;
  media_url: string | null;
  scheduled_at: string | null;
  status: string;
  created_at: string;
  clientName?: string;
}

interface MeetingEvent {
  id: number; title: string; time: string; duration: string;
  type: "meeting" | "call" | "demo"; contact: string; avatar: string;
  location: string; day: number;
}

// ── Platform config ────────────────────────────────────────────
const PLAT: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
  instagram: { Icon: Instagram, color: "#E1306C", bg: "rgba(225,48,108,0.12)" },
  facebook:  { Icon: Facebook,  color: "#1877F2", bg: "rgba(24,119,242,0.12)" },
  linkedin:  { Icon: Linkedin,  color: "#0A66C2", bg: "rgba(10,102,194,0.12)" },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending_approval: { label: "Aguardando aprovação", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  draft:            { label: "Rascunho",              color: "#8888AA", bg: "rgba(136,136,170,0.1)" },
  scheduled:        { label: "Agendado",              color: "#B9FF4B", bg: "rgba(185,255,75,0.1)" },
  publishing:       { label: "Publicando…",           color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
  published:        { label: "Publicado",             color: "#34D399", bg: "rgba(52,211,153,0.1)" },
  failed:           { label: "Falhou",                color: "#F87171", bg: "rgba(248,113,113,0.1)" },
};

const initialMeetings: MeetingEvent[] = [
  { id: 1, title: "Demo Calu Agência", time: "09:00", duration: "30min", type: "demo", contact: "Lead", avatar: "L", location: "Zoom", day: 1 },
  { id: 2, title: "Follow-up Cliente", time: "10:30", duration: "15min", type: "call", contact: "Cliente", avatar: "C", location: "Telefone", day: 2 },
  { id: 3, title: "Revisão Editorial", time: "14:00", duration: "1h",    type: "meeting", contact: "Equipe", avatar: "E", location: "Google Meet", day: 3 },
];

const typeColors: Record<string, string> = {
  meeting: "border-l-primary bg-primary/5",
  call:    "border-l-secondary bg-secondary/5",
  demo:    "border-l-accent bg-accent/5",
};

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex"];
const weekDates = [1, 2, 3, 4, 5];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

// ── Helpers ────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ── Component ──────────────────────────────────────────────────
const SchedulingPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"editorial" | "reunioes">("editorial");

  // Posts
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  // Meetings (local)
  const [selectedDay, setSelectedDay] = useState(1);
  const [meetings, setMeetings] = useState(initialMeetings);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("09:00");

  const loadPosts = useCallback(async () => {
    if (!user) return;
    setLoadingPosts(true);
    try {
      // Busca posts e nomes dos clientes em paralelo
      const [{ data: postsData }, { data: clientsData }] = await Promise.all([
        supabase
          .from("scheduled_posts")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["pending_approval", "draft", "scheduled", "publishing"])
          .order("created_at", { ascending: false }),
        (supabase as any)
          .from("clients")
          .select("id, name")
          .eq("user_id", user.id),
      ]);

      const clientMap: Record<string, string> = {};
      (clientsData ?? []).forEach((c: { id: string; name: string }) => {
        clientMap[c.id] = c.name;
      });

      setPosts(
        (postsData ?? []).map((p: ScheduledPost) => ({
          ...p,
          clientName: clientMap[p.client_id] ?? "Cliente",
        }))
      );
    } catch {
      toast.error("Erro ao carregar posts");
    } finally {
      setLoadingPosts(false);
    }
  }, [user]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const handleApprove = async (post: ScheduledPost) => {
    setApproving(post.id);
    try {
      const newStatus = post.scheduled_at ? "scheduled" : "draft";
      const { error } = await supabase
        .from("scheduled_posts")
        .update({ status: newStatus })
        .eq("id", post.id);
      if (error) throw error;
      toast.success(`Post aprovado${newStatus === "scheduled" ? " e agendado!" : " como rascunho!"}`);
      loadPosts();
    } catch {
      toast.error("Erro ao aprovar post");
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (postId: string) => {
    if (!confirm("Excluir este post?")) return;
    try {
      const { error } = await supabase.from("scheduled_posts").delete().eq("id", postId);
      if (error) throw error;
      toast.success("Post excluído");
      loadPosts();
    } catch {
      toast.error("Erro ao excluir post");
    }
  };

  const handleCreateMeeting = () => {
    if (!newTitle.trim()) { toast.error("Título obrigatório"); return; }
    setMeetings(prev => [...prev, { id: Date.now(), title: newTitle, time: newTime, duration: "30min", type: "meeting", contact: "Novo", avatar: "N", location: "Google Meet", day: selectedDay }]);
    setShowNewEvent(false);
    setNewTitle("");
    toast.success(`Evento "${newTitle}" criado!`);
  };

  const pending  = posts.filter(p => p.status === "pending_approval");
  const approved = posts.filter(p => p.status !== "pending_approval");
  const todayMeetings = meetings.filter(e => e.day === selectedDay);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 md:p-6 space-y-6 min-w-0 break-words">

      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Calendário Editorial</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {pending.length > 0 && (
              <span className="mr-2 font-semibold" style={{ color: "#F59E0B" }}>
                {pending.length} aguardando aprovação ·{" "}
              </span>
            )}
            {approved.length} posts agendados
          </p>
        </div>
        <button onClick={loadPosts} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title="Atualizar">
          <RefreshCw className={cn("h-4 w-4", loadingPosts && "animate-spin")} />
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1 border-b border-border">
        {([["editorial", "Posts & Conteúdo"], ["reunioes", "Reuniões"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px", tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            {label}
            {id === "editorial" && pending.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* ── ABA EDITORIAL ── */}
      {tab === "editorial" && (
        <div className="space-y-6">

          {/* Pendentes de aprovação */}
          {pending.length > 0 && (
            <motion.div variants={item} className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" style={{ color: "#F59E0B" }} />
                <h2 className="text-sm font-semibold text-foreground">Aguardando sua aprovação</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
                  {pending.length}
                </span>
              </div>

              {pending.map(post => (
                <div key={post.id} className="rounded-xl border bg-card shadow-card p-4 space-y-3" style={{ borderColor: "rgba(245,158,11,0.25)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {/* Client */}
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {post.clientName}
                        </span>
                        {/* Platforms */}
                        {(post.platforms ?? []).map(p => {
                          const cfg = PLAT[p];
                          if (!cfg) return null;
                          const { Icon, color, bg } = cfg;
                          return (
                            <span key={p} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: bg, color }}>
                              <Icon className="h-3 w-3" /> {p}
                            </span>
                          );
                        })}
                        {/* Date */}
                        {post.scheduled_at && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {fmtDate(post.scheduled_at)} às {fmtTime(post.scheduled_at)}
                          </span>
                        )}
                      </div>
                      {/* Caption */}
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">
                        {post.caption ?? "(sem legenda)"}
                      </p>
                    </div>
                  </div>

                  {/* IA badge */}
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Sparkles className="h-3 w-3" style={{ color: "#B9FF4B" }} />
                    Criado pelo agente · {fmtDate(post.created_at)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-border">
                    <button
                      onClick={() => handleApprove(post)}
                      disabled={approving === post.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{ background: "#B9FF4B", color: "#07080A", opacity: approving === post.id ? 0.7 : 1 }}
                    >
                      {approving === post.id
                        ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        : <Check className="h-3.5 w-3.5" />}
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(post.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Rejeitar
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(post.caption ?? ""); toast.success("Copiado!"); }}
                      className="px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                      title="Copiar legenda"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Posts aprovados / agendados */}
          <motion.div variants={item} className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Posts aprovados</h2>
              <span className="text-xs text-muted-foreground">({approved.length})</span>
            </div>

            {loadingPosts ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : approved.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum post aprovado ainda.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Posts criados pelos agentes aparecem aqui para aprovação.
                </p>
              </div>
            ) : (
              approved.map(post => {
                const statusCfg = STATUS_CFG[post.status] ?? STATUS_CFG.draft;
                return (
                  <div key={post.id} className="rounded-xl border border-border bg-card shadow-card p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {post.clientName}
                          </span>
                          {(post.platforms ?? []).map(p => {
                            const cfg = PLAT[p];
                            if (!cfg) return null;
                            const { Icon, color, bg } = cfg;
                            return (
                              <span key={p} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: bg, color }}>
                                <Icon className="h-3 w-3" /> {p}
                              </span>
                            );
                          })}
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                            {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                          {post.caption ?? "(sem legenda)"}
                        </p>
                        {post.scheduled_at && (
                          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {fmtDate(post.scheduled_at)} às {fmtTime(post.scheduled_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { navigator.clipboard.writeText(post.caption ?? ""); toast.success("Copiado!"); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Copiar">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleReject(post.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Excluir">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>

          {/* Estado vazio total */}
          {!loadingPosts && posts.length === 0 && (
            <motion.div variants={item} className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Calendário editorial vazio</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Posts criados pelos agentes no workspace de cada cliente aparecerão aqui para sua aprovação antes de serem publicados.
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* ── ABA REUNIÕES ── */}
      {tab === "reunioes" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <motion.div variants={item} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => toast.info("Semana anterior")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><ChevronLeft className="h-5 w-5" /></button>
                <h2 className="text-base font-semibold font-display text-foreground">1 — 5 Maio, 2026</h2>
                <button onClick={() => toast.info("Próxima semana")} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><ChevronRight className="h-5 w-5" /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedDay(1)} className="px-3 py-1.5 rounded-lg bg-muted text-sm font-medium text-muted-foreground hover:text-foreground">Hoje</button>
                <button onClick={() => setShowNewEvent(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                  <Plus className="h-4 w-4" /> Evento
                </button>
              </div>
            </motion.div>

            <motion.div variants={item} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="grid grid-cols-5 border-b border-border">
                {weekDays.map((d, i) => (
                  <button key={d} onClick={() => setSelectedDay(weekDates[i])} className={cn("py-3 text-center border-r last:border-r-0 border-border transition-colors", selectedDay === weekDates[i] ? "bg-primary/5" : "hover:bg-muted/50")}>
                    <p className="text-xs text-muted-foreground">{d}</p>
                    <p className={cn("text-lg font-bold font-display mt-0.5", selectedDay === weekDates[i] ? "text-primary" : "text-foreground")}>{weekDates[i]}</p>
                    {meetings.filter(e => e.day === weekDates[i]).length > 0 && (
                      <div className="flex justify-center gap-1 mt-1">{meetings.filter(e => e.day === weekDates[i]).map(e => (<div key={e.id} className="h-1.5 w-1.5 rounded-full bg-primary" />))}</div>
                    )}
                  </button>
                ))}
              </div>
              <div className="p-4 space-y-2 min-h-[280px]">
                {todayMeetings.length > 0 ? todayMeetings.map(e => (
                  <div key={e.id} className={cn("flex items-start gap-3 p-3 md:p-4 rounded-lg border-l-4 min-w-0", typeColors[e.type])}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">{e.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground break-words">{e.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {e.time} · {e.duration}</span>
                        <span className="flex items-center gap-1 min-w-0"><User className="h-3 w-3 shrink-0" /> <span className="truncate">{e.contact}</span></span>
                        <span className="flex items-center gap-1 min-w-0"><MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{e.location}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => toast.info(`Abrindo ${e.location}...`)} className="p-2 rounded-lg hover:bg-muted text-primary"><Video className="h-4 w-4" /></button>
                      <button onClick={() => toast.success(`Lembrete definido`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hidden sm:inline-flex"><Bell className="h-4 w-4" /></button>
                      <button onClick={() => setMeetings(prev => prev.filter(m => m.id !== e.id))} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                    <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum evento neste dia</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="space-y-5">
            <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><ExternalLink className="h-4 w-4 text-primary" /> Links de Booking</h3>
              {[{ name: "Demo 30min", url: "caluagencia.com.br/demo" }, { name: "Consultoria 1h", url: "caluagencia.com.br/consultoria" }].map(l => (
                <div key={l.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div><p className="text-sm font-medium text-foreground">{l.name}</p><p className="text-[11px] text-primary">{l.url}</p></div>
                  <div className="flex gap-1">
                    <button onClick={() => { navigator.clipboard.writeText(l.url); toast.success("Link copiado!"); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Copy className="h-3.5 w-3.5" /></button>
                    <button onClick={() => toast.info(`Configurando ${l.name}`)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Settings2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      )}

      {/* Modal novo evento */}
      {showNewEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-foreground">Novo Evento</h2>
              <button onClick={() => setShowNewEvent(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Título *</label>
              <AIInputField value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" fieldLabel="Título do evento" fieldContext="Calendário de reuniões da Calu Agência" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Horário</label>
              <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewEvent(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground">Cancelar</button>
              <button onClick={handleCreateMeeting} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Criar</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SchedulingPage;
