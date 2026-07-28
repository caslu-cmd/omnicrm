import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, RefreshCw } from "lucide-react";

// Origem de cada mensagem (canal por onde o lead falou)
const ORIGINS: Record<string, { label: string; color: string; icon: string }> = {
  whatsapp_zapi:    { label: "WhatsApp",  color: "#25D366", icon: "🟢" },
  whatsapp_oficial: { label: "WhatsApp",  color: "#25D366", icon: "🟢" },
  instagram:        { label: "Instagram", color: "#E1306C", icon: "📸" },
  facebook:         { label: "Facebook",  color: "#1877F2", icon: "💬" },
  webchat:          { label: "Site",      color: "#8B5CF6", icon: "🌐" },
};
const fallbackOrigin = { label: "Outro", color: "#6B7280", icon: "✉️" };

interface Conversation {
  id: string;
  channel: string;
  external_id: string;
  contact_name: string | null;
  unread: number;
  last_message_preview: string | null;
  last_message_at: string;
}

interface Props {
  clientId: string;
  accent?: string;
  onOpen?: (conv: Conversation) => void;
  /** rail = coluna de altura cheia colada depois do sidebar; senão = card embutido */
  rail?: boolean;
}

export default function InboxFeedColumn({ clientId, accent = "#B9FF4B", onOpen, rail = false }: Props) {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("inbox_conversations")
      .select("id, channel, external_id, contact_name, unread, last_message_preview, last_message_at")
      .eq("client_id", clientId)
      .order("last_message_at", { ascending: false })
      .limit(40);
    setConvs(data ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  // Realtime: nova mensagem ou conversa atualizada → recarrega o feed
  useEffect(() => {
    const ch = supabase.channel(`crm-feed-${clientId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "inbox_conversations", filter: `client_id=eq.${clientId}` }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "inbox_messages", filter: `client_id=eq.${clientId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clientId, load]);

  const timeAgo = (s: string) => {
    const diff = (Date.now() - new Date(s).getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const totalUnread = convs.reduce((n, c) => n + (c.unread || 0), 0);

  return (
    <div className={`flex flex-col overflow-hidden ${rail ? "h-full" : "rounded-2xl"}`}
      style={rail
        ? { width: 300, flexShrink: 0, background: "#0B0B14", borderRight: "1px solid rgba(255,255,255,0.07)" }
        : { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "70vh" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: `${accent}08` }}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4" style={{ color: accent }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
            Mensagens recebidas
          </span>
          {totalUnread > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: accent, color: "#07080A" }}>
              {totalUnread}
            </span>
          )}
        </div>
        <button onClick={load} title="Atualizar" className="p-1 rounded-lg transition-all" style={{ color: "rgba(255,255,255,0.3)" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading && convs.length === 0 ? (
          <div className="py-10 text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Carregando…</div>
        ) : convs.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <MessageCircle className="w-7 h-7 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Nenhuma mensagem ainda.</p>
            <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.18)" }}>
              As mensagens dos leads (WhatsApp, Instagram, Site…) aparecem aqui.
            </p>
          </div>
        ) : convs.map(c => {
          const origin = ORIGINS[c.channel] ?? fallbackOrigin;
          const unread = c.unread > 0;
          return (
            <button key={c.id} onClick={() => onOpen?.(c)}
              className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: unread ? `${accent}0A` : "transparent" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.035)")}
              onMouseLeave={e => (e.currentTarget.style.background = unread ? `${accent}0A` : "transparent")}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${origin.color}18` }}>{origin.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                    {c.contact_name ?? c.external_id}
                  </span>
                  <span className="text-[9px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>{timeAgo(c.last_message_at)}</span>
                </div>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: unread ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }}>
                  {c.last_message_preview ?? "—"}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${origin.color}15`, color: origin.color, border: `1px solid ${origin.color}30` }}>
                    {origin.label}
                  </span>
                  {unread && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent }} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
