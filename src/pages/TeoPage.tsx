import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Send, Loader2, CheckCircle2, AlertCircle,
  RefreshCw, ChevronDown, Copy, ExternalLink, Settings,
  FileText, Edit3, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://proldgiyterqhthludlp.supabase.co";

interface WPPage { id: number; title: { rendered: string }; slug: string; status: string; link: string; modified: string; }
interface Msg { role: "user" | "teo"; content: string; new_html?: string | null; }

function copyToClipboard(t: string) { navigator.clipboard.writeText(t); toast.success("Copiado!"); }

function renderMd(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code style='background:#1E1E2E;padding:1px 5px;border-radius:4px;font-size:11px'>$1</code>")
    .replace(/^### (.+)$/gm, "<div style='font-weight:700;margin-top:10px;margin-bottom:4px;color:#B9FF4B'>$1</div>")
    .replace(/^## (.+)$/gm, "<div style='font-weight:700;font-size:13px;margin-top:12px;margin-bottom:4px;color:#B9FF4B'>$1</div>")
    .replace(/^- (.+)$/gm, "<div style='margin-left:12px'>• $1</div>")
    .replace(/\n/g, "<br/>");
}

export default function TeoPage() {
  const [searchParams] = useSearchParams();
  const clientId   = searchParams.get("clientId") ?? "";
  const clientName = searchParams.get("clientName") ?? "";

  // WP credentials
  const [wpUrl, setWpUrl]           = useState("");
  const [wpUser, setWpUser]         = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [wpCredsLoaded, setWpCredsLoaded] = useState(false);
  const [showCreds, setShowCreds]   = useState(false);

  // Pages
  const [pages, setPages]           = useState<WPPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectedPage, setSelectedPage] = useState<WPPage | null>(null);
  const [pageContent, setPageContent]   = useState<string>("");
  const [loadingPage, setLoadingPage]   = useState(false);

  // Chat
  const [messages, setMessages]     = useState<Msg[]>([]);
  const [input, setInput]           = useState("");
  const [sending, setSending]       = useState(false);
  const [history, setHistory]       = useState<any[]>([]);

  // Apply
  const [applying, setApplying]     = useState(false);
  const [pendingHtml, setPendingHtml] = useState<string | null>(null);
  const [appliedUrl, setAppliedUrl]   = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll para última mensagem
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Carrega creds do Supabase
  useEffect(() => {
    if (!clientId || wpCredsLoaded) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await (supabase as any).from("integrations")
        .select("config").eq("user_id", session.user.id)
        .eq("connector_name", `wordpress_${clientId}`).maybeSingle();
      if (data?.config) {
        if (data.config.wp_url)      setWpUrl(data.config.wp_url);
        if (data.config.wp_user)     setWpUser(data.config.wp_user);
        if (data.config.wp_password) setWpPassword(data.config.wp_password);
      }
      setWpCredsLoaded(true);
    })();
  }, [clientId, wpCredsLoaded]);

  // Carrega páginas assim que tiver creds
  useEffect(() => {
    if (wpCredsLoaded && wpUrl && wpUser && wpPassword) fetchPages();
  }, [wpCredsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPages = useCallback(async () => {
    if (!wpUrl || !wpUser || !wpPassword) { toast.error("Preencha as credenciais WordPress primeiro."); setShowCreds(true); return; }
    setLoadingPages(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const r = await fetch(`${SUPABASE_URL}/functions/v1/teo-wp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ action: "list_pages", wp_url: wpUrl, wp_user: wpUser, wp_password: wpPassword }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `Erro ${r.status}`);
      setPages(Array.isArray(data) ? data : []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingPages(false); }
  }, [wpUrl, wpUser, wpPassword]);

  const selectPage = useCallback(async (page: WPPage) => {
    setSelectedPage(page);
    setAppliedUrl(null);
    setPendingHtml(null);
    setLoadingPage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const r = await fetch(`${SUPABASE_URL}/functions/v1/teo-wp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ action: "get_page", wp_url: wpUrl, wp_user: wpUser, wp_password: wpPassword, page_id: page.id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `Erro ${r.status}`);
      setPageContent(data.content?.rendered ?? "");
      setMessages([{
        role: "teo",
        content: `Página **${page.title.rendered}** carregada. Me diga o que deseja alterar — textos, seções, CTAs, cores ou qualquer outra coisa.`,
      }]);
      setHistory([]);
    } catch (e: any) { toast.error(e.message); setPageContent(""); }
    finally { setLoadingPage(false); }
  }, [wpUrl, wpUser, wpPassword]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const r = await fetch(`${SUPABASE_URL}/functions/v1/teo-wp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          action: "chat",
          wp_url: wpUrl, wp_user: wpUser, wp_password: wpPassword,
          message: userMsg,
          page_title: selectedPage?.title.rendered ?? "",
          page_content: pageContent,
          history,
          client_name: clientName,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `Erro ${r.status}`);
      setHistory(data.history ?? []);
      if (data.new_html) setPendingHtml(data.new_html);
      setMessages(prev => [...prev, { role: "teo", content: data.reply, new_html: data.new_html }]);
    } catch (e: any) { toast.error(e.message); setMessages(prev => [...prev, { role: "teo", content: `Erro: ${e.message}` }]); }
    finally { setSending(false); }
  }, [input, sending, history, pageContent, selectedPage, wpUrl, wpUser, wpPassword, clientName]);

  const applyChanges = useCallback(async (html: string) => {
    if (!selectedPage) return;
    setApplying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const r = await fetch(`${SUPABASE_URL}/functions/v1/teo-wp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          action: "update_page",
          wp_url: wpUrl, wp_user: wpUser, wp_password: wpPassword,
          page_id: selectedPage.id, content: html,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `Erro ${r.status}`);
      setAppliedUrl(data.url);
      setPageContent(html);
      setPendingHtml(null);
      toast.success("Alterações publicadas no site!");
    } catch (e: any) { toast.error(e.message); }
    finally { setApplying(false); }
  }, [selectedPage, wpUrl, wpUser, wpPassword]);

  const hasCreds = wpUrl && wpUser && wpPassword;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#07080A" }}>

      {/* ── Painel esquerdo ─────────────────────────────────────────────────── */}
      <div className="flex flex-col border-r" style={{ width: 300, minWidth: 260, borderColor: "#1E1E2E", background: "#0A0A10" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#1E1E2E" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "#06B6D422", border: "1px solid #06B6D444" }}>🌐</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm" style={{ color: "#F0F0F0" }}>Teo</div>
            <div className="text-[11px] truncate" style={{ color: "#06B6D4", opacity: 0.8 }}>
              {clientName ? `Site de ${clientName}` : "Editor de Sites WordPress"}
            </div>
          </div>
          <button onClick={() => setShowCreds(v => !v)} title="Credenciais WordPress"
            className="p-1.5 rounded-lg transition-all"
            style={{ background: showCreds ? "#06B6D422" : "transparent", color: showCreds ? "#06B6D4" : "#444466" }}>
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Credenciais */}
        <AnimatePresence>
          {showCreds && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden border-b" style={{ borderColor: "#1E1E2E" }}>
              <div className="px-4 py-3 flex flex-col gap-2">
                <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#444466" }}>WordPress</p>
                {[
                  { label: "URL", val: wpUrl, set: setWpUrl, ph: "https://site.com.br", type: "url" },
                  { label: "Usuário", val: wpUser, set: setWpUser, ph: "admin", type: "text" },
                  { label: "Senha de Aplicação", val: wpPassword, set: setWpPassword, ph: "xxxx xxxx xxxx", type: "password" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-[9px] uppercase tracking-wider" style={{ color: "#444466" }}>{f.label}</label>
                    <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      className="w-full mt-0.5 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                      style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "#06B6D444")}
                      onBlur={e => (e.currentTarget.style.borderColor = "#2A2A3A")} />
                  </div>
                ))}
                <button onClick={() => { fetchPages(); setShowCreds(false); }}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold mt-1"
                  style={{ background: "#06B6D4", color: "#000" }}>
                  <Globe className="w-3 h-3" /> Conectar e carregar páginas
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de páginas */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "#1E1E2E" }}>
            <p className="text-[10px] uppercase tracking-widest font-semibold flex-1" style={{ color: "#444466" }}>Páginas do site</p>
            <button onClick={fetchPages} disabled={loadingPages || !hasCreds}
              className="p-1 rounded-lg transition-all" style={{ color: "#444466" }}>
              <RefreshCw className={`w-3 h-3 ${loadingPages ? "animate-spin" : ""}`} />
            </button>
          </div>

          {!hasCreds && (
            <div className="px-4 py-8 text-center">
              <Globe className="w-8 h-8 mx-auto mb-2" style={{ color: "#1E1E2E" }} />
              <p className="text-xs" style={{ color: "#333355" }}>Configure as credenciais WordPress para ver as páginas</p>
              <button onClick={() => setShowCreds(true)} className="mt-3 text-xs underline" style={{ color: "#06B6D4" }}>
                Abrir configurações
              </button>
            </div>
          )}

          {loadingPages && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#06B6D4" }} />
            </div>
          )}

          {!loadingPages && hasCreds && pages.length === 0 && (
            <div className="px-4 py-6 text-center text-xs" style={{ color: "#333355" }}>
              Nenhuma página encontrada.
            </div>
          )}

          {pages.map(page => (
            <button key={page.id} onClick={() => selectPage(page)}
              className="w-full flex flex-col gap-0.5 px-4 py-3 text-left transition-all border-b"
              style={{
                borderColor: "#0E0E18",
                background: selectedPage?.id === page.id ? "#06B6D411" : "transparent",
                borderLeft: selectedPage?.id === page.id ? "2px solid #06B6D4" : "2px solid transparent",
              }}>
              <span className="text-xs font-medium truncate" style={{ color: selectedPage?.id === page.id ? "#06B6D4" : "rgba(255,255,255,0.7)" }}>
                {page.title.rendered || "(sem título)"}
              </span>
              <span className="text-[10px]" style={{ color: "#444466" }}>/{page.slug}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Painel direito (chat) ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header página selecionada */}
        {selectedPage && (
          <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "#1E1E2E", background: "#0A0A10" }}>
            <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "#06B6D4" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#F0F0F0" }}>{selectedPage.title.rendered}</p>
              <p className="text-[11px]" style={{ color: "#444466" }}>/{selectedPage.slug}</p>
            </div>
            {appliedUrl && (
              <a href={appliedUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "#06B6D422", color: "#06B6D4", border: "1px solid #06B6D433" }}>
                <ExternalLink className="w-3 h-3" /> Ver no site
              </a>
            )}
            {pendingHtml && (
              <button onClick={() => applyChanges(pendingHtml)} disabled={applying}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "#B9FF4B", color: "#07080A" }}>
                {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                {applying ? "Publicando..." : "Aplicar alterações"}
              </button>
            )}
            <a href={selectedPage.link} target="_blank" rel="noreferrer"
              className="p-1.5 rounded-lg" style={{ color: "#444466" }}>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Estado vazio */}
        {!selectedPage && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ color: "#333355" }}>
            <div style={{ fontSize: 64 }}>🌐</div>
            <div className="text-center">
              <p className="text-lg font-semibold mb-1" style={{ color: "#555577" }}>Teo — Editor de Sites</p>
              <p className="text-sm" style={{ color: "#333355" }}>Selecione uma página para começar a editar</p>
            </div>
          </div>
        )}

        {/* Loading da página */}
        {loadingPage && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#06B6D4" }} />
              <p className="text-sm" style={{ color: "#555577" }}>Carregando página...</p>
            </div>
          </div>
        )}

        {/* Chat */}
        {selectedPage && !loadingPage && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.role === "teo" && (
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: "#06B6D422", border: "1px solid #06B6D433" }}>🌐</div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
                    <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={{
                        background: msg.role === "user" ? "#06B6D422" : "#141420",
                        border: `1px solid ${msg.role === "user" ? "#06B6D433" : "#2A2A3A"}`,
                        color: "#E0E0F0",
                      }}
                      dangerouslySetInnerHTML={{ __html: renderMd(msg.content) }}
                    />
                    {msg.new_html && (
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(msg.new_html!)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                          style={{ background: "#1E1E2E", color: "#8888AA", border: "1px solid #2A2A3A" }}>
                          <Copy className="w-2.5 h-2.5" /> Copiar HTML
                        </button>
                        <button onClick={() => applyChanges(msg.new_html!)} disabled={applying}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold"
                          style={{ background: "#B9FF4B22", color: "#B9FF4B", border: "1px solid #B9FF4B44" }}>
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {applying ? "Publicando..." : "Aplicar no site"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: "#06B6D422", border: "1px solid #06B6D433" }}>🌐</div>
                  <div className="rounded-2xl px-4 py-3" style={{ background: "#141420", border: "1px solid #2A2A3A" }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#06B6D4" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-5 pb-5 pt-2">
              <div className="flex gap-2 rounded-2xl p-2"
                style={{ background: "#141420", border: "1px solid #2A2A3A" }}>
                <textarea
                  className="flex-1 resize-none bg-transparent outline-none text-sm py-2 px-2"
                  style={{ color: "#E0E0F0", maxHeight: 120, minHeight: 40, fontFamily: "inherit" }}
                  placeholder="Descreva a alteração desejada..."
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={sending}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <button onClick={sendMessage} disabled={sending || !input.trim()}
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center self-end transition-all"
                  style={{ background: input.trim() && !sending ? "#06B6D4" : "#1E1E2E", color: input.trim() && !sending ? "#000" : "#444466" }}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] mt-1.5 text-center" style={{ color: "#333355" }}>Enter para enviar · Shift+Enter para nova linha</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
