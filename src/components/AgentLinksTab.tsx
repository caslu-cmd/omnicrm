import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Copy, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Users, MessageSquare, ExternalLink } from "lucide-react";

interface AgentLink {
  id: string;
  token: string;
  agent_name: string;
  agent_color: string;
  agent_role: string | null;
  context_note: string | null;
  welcome_msg: string | null;
  active: boolean;
  created_at: string;
}

interface Session {
  id: string;
  user_email: string | null;
  user_name: string | null;
  messages_count: number;
  started_at: string;
  last_message_at: string;
}

const s = (o = 1) => `rgba(255,255,255,${o})`;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

interface Props { clientId: string; clientName: string; userId: string; }

export default function AgentLinksTab({ clientId, clientName, userId }: Props) {
  const [links, setLinks]             = useState<AgentLink[]>([]);
  const [loading, setLoading]         = useState(true);
  const [sessions, setSessions]       = useState<Record<string, Session[]>>({});
  const [expandedLink, setExpandedLink] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState<string | null>(null);
  const [deleting, setDeleting]       = useState<string | null>(null);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("agent_links")
      .select("id,token,agent_name,agent_color,agent_role,context_note,welcome_msg,active,created_at")
      .eq("user_id", userId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (!error && data) setLinks(data as AgentLink[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId, clientId]);

  const loadSessions = async (linkId: string) => {
    if (sessions[linkId]) { setExpandedLink(expandedLink === linkId ? null : linkId); return; }
    setLoadingSessions(linkId);
    const { data } = await (supabase as any)
      .from("agent_link_sessions")
      .select("id,user_email,user_name,messages_count,started_at,last_message_at")
      .eq("link_id", linkId)
      .order("last_message_at", { ascending: false });
    if (data) setSessions(prev => ({ ...prev, [linkId]: data as Session[] }));
    setExpandedLink(linkId);
    setLoadingSessions(null);
  };

  const toggleActive = async (link: AgentLink) => {
    await (supabase as any).from("agent_links").update({ active: !link.active }).eq("id", link.id);
    setLinks(prev => prev.map(l => l.id === link.id ? { ...l, active: !l.active } : l));
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/conversar/${token}`);
    toast.success("Link copiado!");
  };

  const deleteLink = async (link: AgentLink) => {
    if (!confirm(`Desativar e excluir o link da ${link.agent_name}?`)) return;
    setDeleting(link.id);
    await (supabase as any).from("agent_links").delete().eq("id", link.id);
    setLinks(prev => prev.filter(l => l.id !== link.id));
    setDeleting(null);
    toast.success("Link excluído.");
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#B9FF4B" }} />
    </div>
  );

  if (links.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(185,255,75,0.08)", border: "1px solid rgba(185,255,75,0.2)" }}>
        <Users className="w-7 h-7" style={{ color: "#B9FF4B" }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold" style={{ color: s(0.75) }}>Nenhum link compartilhado ainda</p>
        <p className="text-xs mt-1" style={{ color: s(0.35) }}>Abra a aba <strong style={{ color: s(0.55) }}>Agentes IA</strong> e clique em <strong style={{ color: s(0.55) }}>🔗 Compartilhar</strong> em qualquer agente</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-base font-semibold" style={{ color: s(0.85) }}>Links compartilhados</h2>
        <p className="text-xs mt-0.5" style={{ color: s(0.35) }}>
          {links.length} link{links.length !== 1 ? "s" : ""} · {clientName} · veja quem está usando cada agente
        </p>
      </div>

      <div className="space-y-3">
        {links.map(link => {
          const isExpanded = expandedLink === link.id;
          const linkSessions = sessions[link.id] ?? [];
          const totalMsgs = linkSessions.reduce((sum, s) => sum + (s.messages_count ?? 0), 0);

          return (
            <motion.div key={link.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#0E0E1C", border: link.active ? `1px solid ${link.agent_color}25` : "1px solid rgba(255,255,255,0.07)" }}>

              {/* Link header */}
              <div className="flex items-center gap-3 p-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: `${link.agent_color}20`, border: `1px solid ${link.agent_color}35`, color: link.agent_color }}>
                  {link.agent_name[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: s(0.88) }}>{link.agent_name}</span>
                    {link.agent_role && <span className="text-[10px] font-medium" style={{ color: link.agent_color }}>{link.agent_role}</span>}
                  </div>
                  {link.context_note && (
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: s(0.3) }}>{link.context_note}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-[10px]" style={{ color: s(0.25) }}>{timeAgo(link.created_at)}</span>
                    {linkSessions.length > 0 && (
                      <>
                        <span style={{ color: s(0.15) }}>·</span>
                        <span className="text-[10px] flex items-center gap-1" style={{ color: s(0.35) }}>
                          <Users className="w-3 h-3" /> {linkSessions.length} pessoa{linkSessions.length !== 1 ? "s" : ""}
                        </span>
                        <span style={{ color: s(0.15) }}>·</span>
                        <span className="text-[10px] flex items-center gap-1" style={{ color: s(0.35) }}>
                          <MessageSquare className="w-3 h-3" /> {totalMsgs} mensagens
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => toggleActive(link)} title={link.active ? "Desativar" : "Ativar"}>
                    {link.active
                      ? <ToggleRight className="w-5 h-5" style={{ color: "#B9FF4B" }} />
                      : <ToggleLeft className="w-5 h-5" style={{ color: s(0.25) }} />}
                  </button>
                  <button onClick={() => copyLink(link.token)} title="Copiar link"
                    className="p-1.5 rounded-lg transition-colors" style={{ color: s(0.3) }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#B9FF4B"; e.currentTarget.style.background = "rgba(185,255,75,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = s(0.3); e.currentTarget.style.background = "transparent"; }}>
                    <Copy className="w-4 h-4" />
                  </button>
                  <a href={`/conversar/${link.token}`} target="_blank" rel="noopener noreferrer" title="Abrir link"
                    className="p-1.5 rounded-lg transition-colors block" style={{ color: s(0.3) }}
                    onMouseEnter={e => { e.currentTarget.style.color = s(0.7); e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = s(0.3); e.currentTarget.style.background = "transparent"; }}>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => deleteLink(link)} disabled={deleting === link.id} title="Excluir"
                    className="p-1.5 rounded-lg transition-colors" style={{ color: s(0.25) }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#F87171"; e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = s(0.25); e.currentTarget.style.background = "transparent"; }}>
                    {deleting === link.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                  <button onClick={() => loadSessions(link.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: s(0.3) }}
                    onMouseEnter={e => { e.currentTarget.style.color = s(0.7); e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = s(0.3); e.currentTarget.style.background = "transparent"; }}>
                    {loadingSessions === link.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sessions panel */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                    <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] uppercase tracking-widest font-semibold mt-3 mb-2" style={{ color: s(0.25) }}>
                        Quem usou este link
                      </p>

                      {linkSessions.length === 0 ? (
                        <div className="rounded-xl py-6 flex flex-col items-center gap-2"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
                          <Users className="w-5 h-5" style={{ color: s(0.2) }} />
                          <p className="text-xs" style={{ color: s(0.3) }}>Ninguém usou este link ainda</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {linkSessions.map(session => (
                            <div key={session.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                              {/* Avatar */}
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: `${link.agent_color}15`, border: `1px solid ${link.agent_color}25`, color: link.agent_color }}>
                                {(session.user_name || session.user_email || "?")[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate" style={{ color: s(0.8) }}>
                                  {session.user_name || session.user_email || "Usuário"}
                                </div>
                                <div className="text-[10px] truncate" style={{ color: s(0.3) }}>
                                  {session.user_email}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="text-right">
                                  <div className="flex items-center gap-1 justify-end" style={{ color: s(0.5) }}>
                                    <MessageSquare className="w-3 h-3" />
                                    <span className="text-[11px] font-semibold">{session.messages_count}</span>
                                  </div>
                                  <div className="text-[9px]" style={{ color: s(0.22) }}>{timeAgo(session.last_message_at)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
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
    </div>
  );
}
