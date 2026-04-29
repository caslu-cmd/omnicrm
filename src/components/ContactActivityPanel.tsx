import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, StickyNote, Phone, Mail, Users, CheckSquare,
  Instagram, Facebook, MessageCircle, ArrowRight, Check,
  Clock, Loader2, Sparkles,
} from "lucide-react";
import ContactAIStrategy from "@/components/ContactAIStrategy";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ── Types ────────────────────────────────────────────────────
interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  channel: string | null;
  score: number | null;
  status: string | null;
  last_interaction: string | null;
}

interface Activity {
  id: string;
  contact_id: string;
  user_id: string;
  type: string;
  content: string | null;
  metadata: Record<string, unknown>;
  task_due_at: string | null;
  task_done: boolean;
  task_done_at: string | null;
  created_at: string;
}

// ── Activity config ──────────────────────────────────────────
const ACT_CFG: Record<string, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  note:          { label: "Nota",        Icon: StickyNote,     color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  call:          { label: "Ligação",     Icon: Phone,          color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  email:         { label: "E-mail",      Icon: Mail,           color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  meeting:       { label: "Reunião",     Icon: Users,          color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  task:          { label: "Tarefa",      Icon: CheckSquare,    color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  whatsapp:      { label: "WhatsApp",    Icon: MessageCircle,  color: "#25D366", bg: "rgba(37,211,102,0.12)" },
  instagram:     { label: "Instagram",   Icon: Instagram,      color: "#E1306C", bg: "rgba(225,48,108,0.12)" },
  facebook:      { label: "Facebook",    Icon: Facebook,       color: "#1877F2", bg: "rgba(24,119,242,0.12)" },
  stage_change:  { label: "Etapa",       Icon: ArrowRight,     color: "#9CA3AF", bg: "rgba(156,163,175,0.12)" },
  status_change: { label: "Status",      Icon: ArrowRight,     color: "#9CA3AF", bg: "rgba(156,163,175,0.12)" },
};

const HEAT = {
  hot:  { label: "Quente", color: "#F97316", bg: "rgba(249,115,22,0.1)" },
  warm: { label: "Morno",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  cold: { label: "Frio",   color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
};

function getHeat(c: Contact): "hot" | "warm" | "cold" {
  const score = c.score ?? 0;
  const last  = c.last_interaction ? new Date(c.last_interaction) : null;
  const days  = last ? (Date.now() - last.getTime()) / 86_400_000 : 999;
  if (score >= 70 || days <= 7)  return "hot";
  if (score >= 40 || days <= 30) return "warm";
  return "cold";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ── Component ────────────────────────────────────────────────
interface Props {
  contact: Contact;
  onClose: () => void;
}

const QUICK_TYPES = ["note", "call", "email", "meeting", "task", "whatsapp", "instagram", "facebook"] as const;

export default function ContactActivityPanel({ contact, onClose }: Props) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [type, setType]             = useState<string>("note");
  const [content, setContent]       = useState("");
  const [dueAt, setDueAt]           = useState("");

  const heat = getHeat(contact);
  const hcfg = HEAT[heat];
  const [tab, setTab]               = useState<"timeline" | "strategy">("timeline");

  useEffect(() => {
    loadActivities();
  }, [contact.id]);

  const loadActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_activities")
      .select("*")
      .eq("contact_id", contact.id)
      .order("created_at", { ascending: false });
    if (!error) setActivities((data as Activity[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!content.trim() && type !== "call") { toast.error("Adicione um conteúdo."); return; }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("contact_activities").insert({
      contact_id: contact.id,
      user_id: user.id,
      type,
      content: content.trim() || null,
      task_due_at: type === "task" && dueAt ? new Date(dueAt).toISOString() : null,
    });
    if (error) { toast.error("Erro ao salvar."); setSaving(false); return; }
    setContent("");
    setDueAt("");
    toast.success("Atividade registrada!");
    setSaving(false);
    loadActivities();
  };

  const toggleTask = async (act: Activity) => {
    const done = !act.task_done;
    const { error } = await supabase.from("contact_activities").update({
      task_done: done,
      task_done_at: done ? new Date().toISOString() : null,
    }).eq("id", act.id);
    if (!error) loadActivities();
  };

  const cfg = ACT_CFG[type] ?? ACT_CFG.note;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="h-full w-full max-w-md flex flex-col"
          style={{ background: "#0D0D18", borderLeft: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold" style={{ background: "rgba(185,255,75,0.12)", color: "#B9FF4B" }}>
                {contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.9)" }}>{contact.name}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{contact.company || contact.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: hcfg.bg, color: hcfg.color }}>
                {heat === "hot" ? "🔥" : heat === "warm" ? "🟡" : "🔵"} {hcfg.label}
              </span>
              <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.4)" }}><X className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Score bar */}
          <div className="px-5 py-3 border-b flex items-center gap-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Score</span>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${contact.score ?? 0}%`, background: hcfg.color }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: hcfg.color }}>{contact.score ?? 0}</span>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            {([["timeline","Timeline",Clock],["strategy","Estratégia IA",Sparkles]] as const).map(([t, label, Icon]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all"
                style={tab === t
                  ? { color: "#B9FF4B", borderBottom: "2px solid #B9FF4B" }
                  : { color: "rgba(255,255,255,0.35)", borderBottom: "2px solid transparent" }}
              >
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>

          {/* Add activity */}
          {tab === "timeline" && <div className="p-4 border-b space-y-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            {/* Type selector */}
            <div className="flex gap-1.5 flex-wrap">
              {QUICK_TYPES.map(t => {
                const c = ACT_CFG[t];
                const Icon = c.Icon;
                const active = type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={active
                      ? { background: c.bg, color: c.color, border: `1px solid ${c.color}40` }
                      : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <Icon className="h-3 w-3" />{c.label}
                  </button>
                );
              })}
            </div>

            {/* Content input */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={type === "task" ? "Descreva a tarefa…" : type === "call" ? "Resumo da ligação… (opcional)" : `Registre a ${cfg.label.toLowerCase()}…`}
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.8)" }}
            />

            {/* Task due date */}
            {type === "task" && (
              <input
                type="datetime-local"
                value={dueAt}
                onChange={e => setDueAt(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.6)" }}
              />
            )}

            <button
              onClick={handleAdd}
              disabled={saving}
              className="w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ background: "#B9FF4B", color: "#080810" }}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? "Salvando…" : "Registrar"}
            </button>
          </div>}

          {/* Timeline */}
          {tab === "timeline" && <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex justify-center pt-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} /></div>
            ) : activities.length === 0 ? (
              <div className="text-center pt-8">
                <Clock className="h-8 w-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Nenhuma atividade ainda</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Registre a primeira interação acima</p>
              </div>
            ) : (
              activities.map((act) => {
                const acfg = ACT_CFG[act.type] ?? ACT_CFG.note;
                const Icon = acfg.Icon;
                const isTask = act.type === "task";
                return (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: acfg.bg }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: acfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium" style={{ color: acfg.color }}>{acfg.label}</span>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{timeAgo(act.created_at)}</span>
                      </div>
                      {act.content && (
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{act.content}</p>
                      )}
                      {isTask && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => toggleTask(act)}
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs transition-all"
                            style={act.task_done
                              ? { background: "rgba(16,185,129,0.15)", color: "#10B981" }
                              : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                          >
                            <Check className="h-3 w-3" />
                            {act.task_done ? "Concluída" : "Marcar como feita"}
                          </button>
                          {act.task_due_at && (
                            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                              Prazo: {new Date(act.task_due_at).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>}

          {/* AI Strategy tab */}
          {tab === "strategy" && (
            <div className="flex-1 overflow-y-auto p-4">
              <ContactAIStrategy contactId={contact.id} contactName={contact.name} />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
