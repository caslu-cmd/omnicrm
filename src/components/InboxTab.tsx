import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send, Plus, X, Copy, Link2, Hand, CheckCircle2, Smartphone, Globe, Code2 } from "lucide-react";
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

// ── Gera o snippet do widget de webchat pra colar no site ──────
function buildWidget(token: string, accent: string): string {
  const A = `${SUPABASE_URL}/functions/v1/webchat`;
  return `<!-- Chat Calu — cole antes de </body> -->
<script>
(function(){
  var T=${JSON.stringify(token)}, A=${JSON.stringify(A)}, C=${JSON.stringify(accent)};
  var sid=localStorage.getItem('calu_sid'); if(!sid){sid=Date.now().toString(36)+Math.random().toString(36).slice(2);localStorage.setItem('calu_sid',sid);}
  var last=null,open=false;
  var s=document.createElement('style');s.textContent='.cw{position:fixed;bottom:20px;right:20px;z-index:99999;font-family:system-ui,sans-serif}.cw-b{width:56px;height:56px;border-radius:50%;background:'+C+';border:0;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);font-size:24px}.cw-p{position:absolute;bottom:70px;right:0;width:340px;max-width:90vw;height:460px;max-height:70vh;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden}.cw-p.on{display:flex}.cw-h{background:#0A0A10;color:#fff;padding:14px 16px;font-weight:700;font-size:14px}.cw-bd{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#f6f6f4}.cw-m{max-width:80%;padding:9px 12px;border-radius:14px;font-size:13px;line-height:1.35;word-wrap:break-word}.cw-in{align-self:flex-start;background:#fff;color:#111;border:1px solid #eee}.cw-out{align-self:flex-end;background:'+C+';color:#07080A}.cw-f{display:flex;gap:6px;padding:10px;border-top:1px solid #eee}.cw-f input{flex:1;padding:10px;border:1px solid #ddd;border-radius:10px;font-size:13px;outline:none}.cw-f button{border:0;background:'+C+';color:#07080A;border-radius:10px;padding:0 14px;font-weight:700;cursor:pointer}';document.head.appendChild(s);
  var w=document.createElement('div');w.className='cw';
  w.innerHTML='<div class="cw-p"><div class="cw-h">Fale com a gente 👋</div><div class="cw-bd"></div><div class="cw-f"><input placeholder="Escreva sua mensagem..."/><button>➤</button></div></div><button class="cw-b">💬</button>';
  document.body.appendChild(w);
  var p=w.querySelector('.cw-p'),bd=w.querySelector('.cw-bd'),inp=w.querySelector('input'),bt=w.querySelector('.cw-b'),sn=w.querySelector('.cw-f button');
  function add(t,c){var d=document.createElement('div');d.className='cw-m '+c;d.textContent=t;bd.appendChild(d);bd.scrollTop=bd.scrollHeight;}
  bt.onclick=function(){open=!open;p.classList.toggle('on',open);};
  function send(){var t=inp.value.trim();if(!t)return;add(t,'cw-out');inp.value='';fetch(A+'?action=in',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:T,session:sid,text:t})});}
  sn.onclick=send;inp.addEventListener('keydown',function(e){if(e.key==='Enter')send();});
  function poll(){fetch(A+'?action=poll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:T,session:sid,after:last})}).then(function(r){return r.json()}).then(function(d){(d.messages||[]).forEach(function(m){add(m.content,'cw-in');last=m.created_at;});}).catch(function(){});}
  setInterval(poll,4000);poll();
})();
</script>`;
}

// ── Modal: conectar canal (WhatsApp Z-API ou Webchat) ──────────
function ConnectModal({ clientId, accent, onClose, onSaved }: { clientId: string; accent: string; onClose: () => void; onSaved: () => void }) {
  const [channel, setChannel] = useState<"whatsapp_zapi" | "webchat">("whatsapp_zapi");
  const [label, setLabel] = useState("");
  const [instance, setInstance] = useState("");
  const [token, setToken] = useState("");
  const [clientToken, setClientToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ webhook_token: string; channel: string } | null>(null);

  const save = async () => {
    if (channel === "whatsapp_zapi" && (!instance.trim() || !token.trim())) { toast.error("Informe instância e token da Z-API"); return; }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const config = channel === "whatsapp_zapi"
      ? { instance: instance.trim(), token: token.trim(), client_token: clientToken.trim() || null }
      : {};
    const { data, error } = await (supabase as any).from("channel_connections").insert({
      client_id: clientId,
      channel,
      label: label.trim() || (channel === "webchat" ? "Site" : "WhatsApp"),
      status: channel === "webchat" ? "connected" : "disconnected",
      created_by: session?.user.id ?? null,
      config,
    }).select("webhook_token, channel").single();
    setSaving(false);
    if (error) { toast.error("Erro ao salvar conexão"); return; }
    setCreated(data);
    onSaved();
    toast.success("Canal conectado!");
  };

  const webhookUrl = created ? `${SUPABASE_URL}/functions/v1/inbox-whatsapp?t=${created.webhook_token}` : "";
  const widget = created ? buildWidget(created.webhook_token, accent) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ background: "#0D0D1A", border: `1px solid ${accent}30` }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Conectar canal</p>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.3)" }}><X className="w-4 h-4" /></button>
        </div>

        {!created ? (
          <>
            {/* Channel picker */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "whatsapp_zapi", label: "WhatsApp", icon: Smartphone, color: "#25D366" },
                { id: "webchat", label: "Chat no site", icon: Globe, color: "#8B5CF6" },
              ] as const).map(c => {
                const on = channel === c.id; const Icon = c.icon;
                return (
                  <button key={c.id} onClick={() => setChannel(c.id)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={on ? { background: `${c.color}20`, color: c.color, border: `1px solid ${c.color}50` }
                             : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Icon className="w-4 h-4" /> {c.label}
                  </button>
                );
              })}
            </div>

            <input value={label} onChange={e => setLabel(e.target.value)} placeholder={channel === "webchat" ? "Nome (ex: Chat do site)" : "Nome (ex: WhatsApp Comercial)"}
              className="w-full rounded-xl px-4 py-2.5 text-sm"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />

            {channel === "whatsapp_zapi" ? (
              <>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Na Z-API: crie uma instância, escaneie o QR do WhatsApp e copie a <b>instância</b> e o <b>token</b>.
                </p>
                {[
                  { v: instance, set: setInstance, ph: "ID da instância *" },
                  { v: token, set: setToken, ph: "Token da instância *" },
                  { v: clientToken, set: setClientToken, ph: "Client-Token (opcional)" },
                ].map((f, i) => (
                  <input key={i} value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    className="w-full rounded-xl px-4 py-2.5 text-sm"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
                ))}
              </>
            ) : (
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                Sem configuração: ao salvar, você recebe um <b>código</b> pra colar no site. Um botão de chat aparece no canto e as mensagens caem aqui no inbox.
              </p>
            )}

            <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40" style={{ background: accent, color: "#07080A" }}>
              {saving ? "Salvando…" : "Conectar"}
            </button>
          </>
        ) : created.channel === "webchat" ? (
          <>
            <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#34D399" }} />
              <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.7)" }}>Widget criado! Cole o código abaixo no site (antes de <code>&lt;/body&gt;</code>).</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                <Code2 className="w-3 h-3" /> Código do widget
              </p>
              <pre className="text-[9px] p-3 rounded-lg overflow-x-auto font-mono leading-relaxed"
                style={{ background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.55)", maxHeight: 200 }}>{widget}</pre>
              <button onClick={() => { navigator.clipboard.writeText(widget); toast.success("Código copiado!"); }}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold" style={{ background: accent, color: "#07080A" }}>
                <Copy className="w-4 h-4" /> Copiar código do widget
              </button>
            </div>
            <button onClick={onClose} className="w-full py-2 rounded-xl text-sm font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>Concluir</button>
          </>
        ) : (
          <>
            <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#34D399" }} />
              <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.7)" }}>Conexão salva! Falta 1 passo: colar a URL no webhook da Z-API.</p>
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
                No painel Z-API → <b>Webhooks</b> → cole em <b>"Ao receber"</b>.
              </p>
            </div>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-bold" style={{ background: accent, color: "#07080A" }}>Concluir</button>
          </>
        )}
      </div>
    </div>
  );
}
