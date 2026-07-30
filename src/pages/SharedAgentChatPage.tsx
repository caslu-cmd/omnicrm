import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Copy, Check, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SUBMIT_URL = "https://proldgiyterqhthludlp.supabase.co/functions/v1/agent-chat-public";

interface AgentLink {
  id: string;
  agent_name: string;
  agent_color: string;
  agent_role: string | null;
  client_name: string | null;
  welcome_msg: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Session {
  id: string;
  messages_count: number;
}

function renderMd(text: string): string {
  return text
    .replace(/^### (.+)$/gm, `<h3 style="font-size:0.95rem;font-weight:700;margin:1.2rem 0 0.4rem;color:#e8e8f0">$1</h3>`)
    .replace(/^## (.+)$/gm,  `<h2 style="font-size:1.05rem;font-weight:700;margin:1.5rem 0 0.5rem;color:#f0f0f8">$1</h2>`)
    .replace(/^# (.+)$/gm,   `<h1 style="font-size:1.2rem;font-weight:800;margin:0 0 0.8rem">$1</h1>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="color:#e8e8f0">$1</strong>`)
    .replace(/\*(.+?)\*/g,   `<em style="color:rgba(255,255,255,0.55)">$1</em>`)
    .replace(/^---+$/gm, `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:1rem 0"/>`)
    .replace(/^- (.+)$/gm, `<li style="color:rgba(255,255,255,0.75);margin:0.25rem 0;padding-left:0.25rem">$1</li>`)
    .replace(/(<li.*<\/li>\n?)+/gs, m => `<ul style="list-style:disc;padding-left:1.4rem;margin:0.4rem 0">${m}</ul>`)
    .replace(/`([^`]+)`/g, `<code style="background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:0.83em">$1</code>`)
    .replace(/\n{2,}/g, `<div style="height:0.5rem"></div>`)
    .replace(/\n/g, " ");
}

// ── Login Gate ───────────────────────────────────────────────────────────────

interface LoginGateProps {
  agentName: string;
  agentColor: string;
  agentRole: string | null;
  onAuth: () => void;
}

function LoginGate({ agentName, agentColor, agentRole, onAuth }: LoginGateProps) {
  const [mode, setMode]         = useState<"login" | "signup">("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw new Error(err.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : err.message);
      } else {
        const { error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        });
        if (err) throw new Error(err.message);
      }
      onAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.85)", fontSize: "0.85rem", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07080A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ width: "100%", maxWidth: 400 }}>

        {/* Agent badge */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32, gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 800, background: `${agentColor}20`, border: `2px solid ${agentColor}50`, color: agentColor }}>
            {agentName[0]}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{agentName}</div>
            {agentRole && <div style={{ fontSize: "0.72rem", color: agentColor, fontWeight: 600, marginTop: 2 }}>{agentRole}</div>}
          </div>
          <div style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
            Faça login para conversar com este agente
          </div>
        </div>

        {/* Card */}
        <div style={{ background: "#0E0E1C", border: `1px solid ${agentColor}25`, borderRadius: 20, padding: "28px 28px 24px", boxShadow: `0 0 60px -20px ${agentColor}25` }}>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginBottom: 22 }}>
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "7px 0", borderRadius: 7, fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: mode === m ? agentColor : "transparent",
                  color: mode === m ? "#07080A" : "rgba(255,255,255,0.4)" }}>
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "signup" && (
              <div>
                <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", marginBottom: 5 }}>Nome</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" required style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = `${agentColor}60`; }} onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }} />
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", marginBottom: 5 }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={inputStyle}
                onFocus={e => { e.target.style.borderColor = `${agentColor}60`; }} onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", marginBottom: 5 }}>Senha</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={e => { e.target.style.borderColor = `${agentColor}60`; }} onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex" }}>
                  {showPw ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: "0.78rem", color: "#F87171" }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading}
              style={{ marginTop: 6, padding: "11px 0", borderRadius: 10, fontSize: "0.88rem", fontWeight: 700, border: "none", cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, background: agentColor, color: "#07080A", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {loading
                ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Aguarde...</>
                : mode === "login"
                  ? <><LogIn style={{ width: 16, height: 16 }} /> Entrar</>
                  : <><UserPlus style={{ width: 16, height: 16 }} /> Criar conta e conversar</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: "0.65rem", marginTop: 20 }}>
          Powered by <strong style={{ color: "rgba(255,255,255,0.25)" }}>Calu Agência</strong>
        </p>
      </motion.div>
    </div>
  );
}

// ── Main Chat Page ───────────────────────────────────────────────────────────

export default function SharedAgentChatPage() {
  const { token } = useParams<{ token: string }>();
  const [link, setLink]         = useState<AgentLink | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [authUser, setAuthUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [session, setSession]   = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [sending, setSending]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Check auth on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const u = data.session.user;
        setAuthUser({
          id: u.id,
          email: u.email ?? "",
          name: (u.user_metadata?.full_name ?? u.email ?? "").toString(),
        });
      }
      setCheckingAuth(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      if (s?.user) {
        setAuthUser({ id: s.user.id, email: s.user.email ?? "", name: (s.user.user_metadata?.full_name ?? s.user.email ?? "").toString() });
      } else {
        setAuthUser(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Fetch link config
  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    (async () => {
      const { data, error } = await (supabase as any)
        .from("agent_links")
        .select("id,agent_name,agent_color,agent_role,client_name,welcome_msg")
        .eq("token", token).eq("active", true).maybeSingle();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setLink(data as AgentLink);
      if (data.welcome_msg) setMessages([{ role: "assistant", content: data.welcome_msg }]);
      setLoading(false);
    })();
  }, [token]);

  // Register session once authenticated + link loaded
  useEffect(() => {
    if (!authUser || !link) return;
    (async () => {
      // Upsert session (one per user per link)
      const { data } = await (supabase as any)
        .from("agent_link_sessions")
        .upsert({ link_id: link.id, user_id: authUser.id, user_email: authUser.email, user_name: authUser.name }, { onConflict: "link_id,user_id", ignoreDuplicates: false })
        .select("id,messages_count").maybeSingle();
      if (data) setSession(data);
    })();
  }, [authUser, link]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !token || !authUser) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      // A função confere a sessão: sem este cabeçalho o link vira porta aberta
      // para qualquer um gastar a conta de IA.
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const res  = await fetch(SUBMIT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authSession?.access_token ? { Authorization: `Bearer ${authSession.access_token}` } : {}),
        },
        body: JSON.stringify({ token, messages: history }),
      });
      const data = await res.json();
      const reply = data.content || "Desculpe, ocorreu um erro. Tente novamente.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);

      // Increment message count
      if (session) {
        const newCount = (session.messages_count ?? 0) + 2;
        await (supabase as any).from("agent_link_sessions")
          .update({ messages_count: newCount, last_message_at: new Date().toISOString() })
          .eq("id", session.id);
        setSession(s => s ? { ...s, messages_count: newCount } : s);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erro de conexão. Tente novamente." }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = () => supabase.auth.signOut();

  if (checkingAuth || loading) return (
    <div style={{ minHeight: "100vh", background: "#07080A", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#B9FF4B" }} />
    </div>
  );

  if (notFound || !link) return (
    <div style={{ minHeight: "100vh", background: "#07080A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
      <div style={{ fontSize: "3rem" }}>🔍</div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>Agente não encontrado ou link desativado.</p>
    </div>
  );

  // Not authenticated → show login gate
  if (!authUser) {
    return (
      <LoginGate
        agentName={link.agent_name}
        agentColor={link.agent_color}
        agentRole={link.agent_role}
        onAuth={() => {}} // auth state listener handles it
      />
    );
  }

  const ac = link.agent_color;

  return (
    <div style={{ minHeight: "100vh", background: "#07080A", display: "flex", flexDirection: "column", fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ─ Top bar ─ */}
      <div style={{ background: "#0A0A12", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "10px 20px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 800, background: `${ac}20`, border: `2px solid ${ac}50`, color: ac }}>
          {link.agent_name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{link.agent_name}</div>
          <div style={{ fontSize: "0.65rem", color: ac, fontWeight: 600 }}>
            {link.agent_role ?? "Agente IA"}
            {link.client_name && <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}> · {link.client_name}</span>}
          </div>
        </div>

        {/* Logged user badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${ac}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, color: ac }}>
              {authUser.name[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {authUser.name || authUser.email}
            </span>
          </div>
          <button onClick={handleSignOut} title="Sair"
            style={{ padding: "4px 8px", borderRadius: 7, fontSize: "0.65rem", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>
            Sair
          </button>
        </div>

        <button onClick={copyLink} style={{ padding: "5px 12px", borderRadius: "8px", fontSize: "0.68rem", fontWeight: 600, background: copied ? `${ac}15` : "rgba(255,255,255,0.05)", color: copied ? ac : "rgba(255,255,255,0.4)", border: `1px solid ${copied ? `${ac}30` : "rgba(255,255,255,0.09)"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
          {copied ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
          {copied ? "Copiado!" : "Copiar link"}
        </button>
      </div>

      {/* ─ Messages ─ */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: 760, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginTop: "60px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 800, background: `${ac}20`, border: `2px solid ${ac}40`, color: ac }}>
              {link.agent_name[0]}
            </div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
              Olá, <strong style={{ color: "rgba(255,255,255,0.65)" }}>{authUser.name.split(" ")[0]}</strong>! Sou <strong style={{ color: "rgba(255,255,255,0.7)" }}>{link.agent_name}</strong>
              {link.agent_role ? `, ${link.agent_role.toLowerCase()}` : ""}.
            </p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.78rem", marginTop: "6px" }}>Como posso te ajudar?</p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isAgent = msg.role === "assistant";
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                style={{ display: "flex", gap: "10px", flexDirection: isAgent ? "row" : "row-reverse", alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, background: isAgent ? `${ac}20` : "rgba(255,255,255,0.08)", border: isAgent ? `1px solid ${ac}40` : "1px solid rgba(255,255,255,0.12)", color: isAgent ? ac : "rgba(255,255,255,0.6)" }}>
                  {isAgent ? link.agent_name[0] : authUser.name[0]?.toUpperCase()}
                </div>
                <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: isAgent ? "4px 14px 14px 14px" : "14px 4px 14px 14px", background: isAgent ? "rgba(255,255,255,0.05)" : `${ac}18`, border: isAgent ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${ac}30`, fontSize: "0.85rem", lineHeight: 1.65, color: "rgba(255,255,255,0.82)" }}>
                  {isAgent
                    ? <div dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }} />
                    : <span>{msg.content}</span>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sending && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, background: `${ac}20`, border: `1px solid ${ac}40`, color: ac }}>
              {link.agent_name[0]}
            </div>
            <div style={{ padding: "12px 16px", borderRadius: "4px 14px 14px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "5px", alignItems: "center" }}>
              {[0, 0.15, 0.3].map((delay, i) => (
                <motion.div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: ac }} animate={{ y: [0, -6, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ─ Input ─ */}
      <div style={{ background: "#0A0A12", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "14px 20px", flexShrink: 0 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder={`Mensagem para ${link.agent_name}…`} rows={1}
            style={{ flex: 1, resize: "none", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "10px 14px", color: "rgba(255,255,255,0.85)", fontSize: "0.85rem", outline: "none", fontFamily: "inherit", lineHeight: 1.5, maxHeight: "120px", overflowY: "auto", boxSizing: "border-box" }}
            onFocus={e => { e.target.style.borderColor = `${ac}50`; }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
            onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }}
          />
          <button onClick={send} disabled={!input.trim() || sending}
            style={{ width: 40, height: 40, borderRadius: "12px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: (!input.trim() || sending) ? "rgba(255,255,255,0.06)" : ac, border: "none", cursor: (!input.trim() || sending) ? "default" : "pointer", transition: "all 0.2s" }}>
            {sending
              ? <Loader2 style={{ width: 16, height: 16, color: "rgba(255,255,255,0.3)", animation: "spin 1s linear infinite" }} />
              : <Send style={{ width: 16, height: 16, color: (!input.trim()) ? "rgba(255,255,255,0.25)" : "#07080A" }} />}
          </button>
        </div>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.12)", fontSize: "0.62rem", marginTop: "8px" }}>
          Powered by <strong style={{ color: "rgba(255,255,255,0.2)" }}>Calu Agência</strong> · {link.agent_name} pode cometer erros.
        </p>
      </div>
    </div>
  );
}
