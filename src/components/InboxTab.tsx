import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send, Plus, X, Copy, Link2, Hand, CheckCircle2, Smartphone } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://proldgiyterqhthludlp.supabase.co";

const CHANNELS: Record<string, { label: string; color: string; icon: string }> = {
  whatsapp_zapi:     { label: "WhatsApp", color: "#25D366", icon: "🟢" },
  whatsapp_oficial:  { label: "WhatsApp", color: "#25D366", icon: "🟢" },
  instagram:         { label: "Instagram", color: "#E1306C", icon: "📸" },
  facebook:          { label: "Facebook", color: "#1877F2", icon: "💬" },
  webchat:           { label: "Site", color: "#8B5CF6", icon: "🌐" },
};

interface Connection { id: string; channel: string; label: string | null; status: string; webhook_token: string; }
interface Conversation {
  id: string; channel: string; external_id: string; contact_name: string | null;
  assignee: string | null; status: string; unread: number;
  last_message_preview: string | null; last_message_at: string;
}
interface Message {
  id: string; direction: string; sender: string; sender_name: string | null;
  content: string | null; media_url: string | null; media_type: string | null; created_at: string;
}

interface Props { clientId: string; accent?: string }

export default function InboxTab({ clientId, accent = "#B9FF4B" }: Props) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Conversation | null>(null);
  activeRef.current = active;

  const loadConnections = useCallback(async () => {
    const { data } = await (supabase as any).from("channel_connections")
      .select("id, channel, label, status, webhook_token").eq("client_id", clientId);
    setConnections(data ?? []);
  }, [clientId]);

  const loadConvs = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("inbox_conversations")
      .select("id, channel, external_id, contact_name, assignee, status, unread, last_message_preview, last_message_at")
      .eq("client_id", clientId).order("last_message_at", { ascending: false }).limit(100);
    setConvs(data ?? []);
    setLoading(false);
  }, [clientId]);

  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await (supabase as any).from("inbox_messages")
      .select("id, direction, sender, sender_name, content, media_url, media_type, created_at")
      .eq("conversation_id", convId).order("created_at", { ascending: true }).limit(500);
    setMessages(data ?? []);
    // zera não-lidas
    await (supabase as any).from("inbox_conversations").update({ unread: 0 }).eq("id", convId);
    setConvs(prev => prev.map(c => c.id === convId ? { ...c, unread: 0 } : c));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUid(session?.user.id ?? null));
    loadConnections();
    loadConvs();
  }, [loadConnections, loadConvs]);

  // Realtime
  useEffect(() => {
    const ch = supabase.channel(`inbox-${clientId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "inbox_messages", filter: `client_id=eq.${clientId}` },
        (payload: any) => {
          const m = payload.new as Message & { conversation_id: string };
          if (activeRef.current && m.conversation_id === activeRef.current.id) {
            setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
          }
          loadConvs();
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "inbox_conversations", filter: `client_id=eq.${clientId}` },
        () => loadConvs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clientId, loadConvs]);

  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; }, [messages]);

  const openConv = (c: Conversation) => { setActive(c); loadMessages(c.id); };

  const assumir = async () => {
    if (!active || !uid) return;
    await (supabase as any).from("inbox_conversations")
      .update({ assignee: uid, bot_enabled: false, status: "open" }).eq("id", active.id);
    setActive({ ...active, assignee: uid });
    setConvs(prev => prev.map(c => c.id === active.id ? { ...c, assignee: uid } : c));
    toast.success("Você assumiu esta conversa");
  };

  const send = async () => {
    if (!active || !reply.trim()) return;
    setSending(true);
    const text = reply.trim();
    const { error } = await supabase.functions.invoke("inbox-send", { body: { conversation_id: active.id, text } });
    if (error) { toast.error("Erro ao enviar"); }
    else { setReply(""); loadMessages(active.id); }
    setSending(false);
  };

  const time = (s: string) => new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const card = "rgba(255,255,255,0.03)"; const border = "rgba(255,255,255,0.07)";

  // Sem canal conectado → onboarding
  if (!loading && connections.length === 0 && !showConnect) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
        <MessageCircle className="w-10 h-10 mx-auto mb-3" style={{ color: accent }} />
        <p className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Central de mensagens</p>
        <p className="text-xs mt-1 mb-5 max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
          Conecte o WhatsApp pra receber e responder as mensagens dos seus clientes aqui, sabendo de onde veio cada lead.
        </p>
        <button onClick={() => setShowConnect(true)} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: accent, color: "#07080A" }}>
          <Plus className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Conectar WhatsApp
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {connections.map(c => {
            const cfg = CHANNELS[c.channel] ?? CHANNELS.webchat;
            return (
              <span key={c.id} className="text-[11px] px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"
                style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.status === "connected" ? "#34D399" : "#94A3B8" }} />
                {c.label ?? cfg.label}
              </span>
            );
          })}
        </div>
        <button onClick={() => setShowConnect(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
          style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}>
          <Plus className="w-3.5 h-3.5" /> Conectar canal
        </button>
      </div>

      {/* Split: lista + thread */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "320px 1fr", height: "62vh" }}>
        {/* Lista */}
        <div className="rounded-2xl overflow-y-auto" style={{ background: card, border: `1px solid ${border}` }}>
          {loading ? (
            <div className="p-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Carregando…</div>
          ) : convs.length === 0 ? (
            <div className="p-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Nenhuma conversa ainda.<br />Elas aparecem aqui quando chega mensagem.</div>
          ) : convs.map(c => {
            const cfg = CHANNELS[c.channel] ?? CHANNELS.webchat;
            const on = active?.id === c.id;
            return (
              <button key={c.id} onClick={() => openConv(c)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 transition-all"
                style={{ background: on ? "rgba(255,255,255,0.05)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)", borderLeft: on ? `2px solid ${accent}` : "2px solid transparent" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${cfg.color}18` }}>{cfg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate" style={{ color: "rgba(255,255,255,0.85)" }}>{c.contact_name ?? c.external_id}</span>
                    <span className="text-[9px] flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>{time(c.last_message_at)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{c.last_message_preview ?? ""}</span>
                    {c.unread > 0 && <span className="text-[9px] font-bold px-1.5 rounded-full flex-shrink-0" style={{ background: accent, color: "#07080A" }}>{c.unread}</span>}
                  </div>
                  <span className="text-[9px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Thread */}
        <div className="rounded-2xl flex flex-col" style={{ background: card, border: `1px solid ${border}` }}>
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Selecione uma conversa
            </div>
          ) : (
            <>
              {/* Header da conversa */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{active.contact_name ?? active.external_id}</div>
                  <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{(CHANNELS[active.channel] ?? CHANNELS.webchat).label} · {active.external_id}</div>
                </div>
                {active.assignee === uid ? (
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-medium flex items-center gap-1" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399" }}>
                    <CheckCircle2 className="w-3 h-3" /> Você assumiu
                  </span>
                ) : (
                  <button onClick={assumir} className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: accent, color: "#07080A" }}>
                    <Hand className="w-3.5 h-3.5" /> Assumir
                  </button>
                )}
              </div>

              {/* Mensagens */}
              <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {messages.map(m => {
                  const out = m.direction === "out";
                  return (
                    <div key={m.id} className={`flex ${out ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[75%] rounded-2xl px-3.5 py-2"
                        style={out
                          ? { background: accent, color: "#07080A", borderBottomRightRadius: 4 }
                          : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.9)", borderBottomLeftRadius: 4 }}>
                        {m.media_url && <a href={m.media_url} target="_blank" rel="noreferrer" className="text-[11px] underline block mb-1">[{m.media_type ?? "mídia"}]</a>}
                        {m.content && <p className="text-[13px] leading-snug whitespace-pre-wrap break-words">{m.content}</p>}
                        <p className="text-[9px] mt-1 text-right" style={{ opacity: 0.6 }}>{time(m.created_at)}{m.sender === "bot" ? " · bot" : ""}</p>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && <div className="text-center text-xs py-8" style={{ color: "rgba(255,255,255,0.25)" }}>Sem mensagens.</div>}
              </div>

              {/* Caixa de resposta */}
              <div className="p-3 flex items-center gap-2" style={{ borderTop: `1px solid ${border}` }}>
                <input value={reply} onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Escreva uma resposta…"
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                <button onClick={send} disabled={sending || !reply.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40" style={{ background: accent, color: "#07080A" }}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showConnect && <ConnectModal clientId={clientId} accent={accent} onClose={() => setShowConnect(false)} onSaved={() => { loadConnections(); }} />}
    </div>
  );
}

// ── Modal: conectar WhatsApp (Z-API) ───────────────────────────
function ConnectModal({ clientId, accent, onClose, onSaved }: { clientId: string; accent: string; onClose: () => void; onSaved: () => void }) {
  const [label, setLabel] = useState("");
  const [instance, setInstance] = useState("");
  const [token, setToken] = useState("");
  const [clientToken, setClientToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ webhook_token: string } | null>(null);

  const save = async () => {
    if (!instance.trim() || !token.trim()) { toast.error("Informe instância e token da Z-API"); return; }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await (supabase as any).from("channel_connections").insert({
      client_id: clientId,
      channel: "whatsapp_zapi",
      label: label.trim() || "WhatsApp",
      status: "disconnected",
      created_by: session?.user.id ?? null,
      config: { instance: instance.trim(), token: token.trim(), client_token: clientToken.trim() || null },
    }).select("webhook_token").single();
    setSaving(false);
    if (error) { toast.error("Erro ao salvar conexão"); return; }
    setCreated(data);
    onSaved();
    toast.success("WhatsApp conectado!");
  };

  const webhookUrl = created ? `${SUPABASE_URL}/functions/v1/inbox-whatsapp?t=${created.webhook_token}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: "#0D0D1A", border: `1px solid ${accent}30` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" style={{ color: "#25D366" }} />
            <p className="text-sm font-semibold text-white">Conectar WhatsApp (Z-API)</p>
          </div>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.3)" }}><X className="w-4 h-4" /></button>
        </div>

        {!created ? (
          <>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              No painel da Z-API, crie uma instância, escaneie o QR do WhatsApp e copie a <b>instância</b> e o <b>token</b>.
            </p>
            {[
              { v: label, set: setLabel, ph: "Nome (ex: WhatsApp Comercial)", req: false },
              { v: instance, set: setInstance, ph: "ID da instância *", req: true },
              { v: token, set: setToken, ph: "Token da instância *", req: true },
              { v: clientToken, set: setClientToken, ph: "Client-Token (segurança da conta, opcional)", req: false },
            ].map((f, i) => (
              <input key={i} value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                className="w-full rounded-xl px-4 py-2.5 text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
            ))}
            <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40" style={{ background: accent, color: "#07080A" }}>
              {saving ? "Salvando…" : "Conectar"}
            </button>
          </>
        ) : (
          <>
            <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#34D399" }} />
              <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.7)" }}>Conexão salva! Falta 1 passo: colar a URL abaixo no webhook da Z-API.</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                <Link2 className="w-3 h-3" /> URL do webhook (Z-API → "Ao receber")
              </p>
              <div className="flex items-center gap-2">
                <code className="text-[10px] px-3 py-2 rounded-lg flex-1 truncate font-mono" style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.55)" }}>{webhookUrl}</code>
                <button onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("URL copiada!"); }}
                  className="px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0" style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                No painel Z-API → <b>Webhooks</b> → cole essa URL em <b>"Ao receber"</b>. Pronto: as mensagens chegam aqui.
              </p>
            </div>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-bold" style={{ background: accent, color: "#07080A" }}>Concluir</button>
          </>
        )}
      </div>
    </div>
  );
}
