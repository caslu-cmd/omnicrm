import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Plus, Send, Loader2, Bot, Sparkles,
  ChevronDown, FileText, Layout, Tag, Image, ExternalLink, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { PIXEL_API } from "@/lib/agentApis";

const API = PIXEL_API ?? "";

const GRUPO_LICITA = {
  id: "grupo-licita",
  name: "Grupo Licita",
  url: "https://grupolicita.com.br",
  username: "licita",
  password: "Glct@2025",
};

interface WPSite {
  id: string;
  name: string;
  url: string;
  username?: string;
  password?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCalls?: string[];
}

const TOOL_LABELS: Record<string, string> = {
  listar_posts:     "Buscando posts...",
  buscar_post:      "Lendo post...",
  criar_post:       "Criando post...",
  atualizar_post:   "Atualizando post...",
  deletar_post:     "Removendo post...",
  listar_paginas:   "Buscando páginas...",
  atualizar_pagina: "Atualizando página...",
  listar_categorias:"Buscando categorias...",
  criar_categoria:  "Criando categoria...",
  listar_tags:      "Buscando tags...",
  criar_tag:        "Criando tag...",
  atualizar_seo:    "Atualizando SEO...",
  listar_sites:     "Listando sites...",
};

function renderMd(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code class='bg-white/10 px-1 rounded text-xs font-mono'>$1</code>")
    .replace(/^### (.+)$/gm, "<h3 class='text-sm font-semibold mt-3 mb-1'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-base font-bold mt-4 mb-2'>$1</h2>")
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/\n/g, "<br/>");
}

interface Props {
  clientName: string;
}

export default function PixelSitePanel({ clientName }: Props) {
  const [sites, setSites] = useState<WPSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<WPSite | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ id: "", name: "", url: "", username: "", password: "" });
  const [addLoading, setAddLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [currentTools, setCurrentTools] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => {
    fetch(`${API}/api/sites`)
      .then(r => r.json())
      .then(async (data: WPSite[]) => {
        let list = data;
        if (list.length === 0) {
          try {
            await fetch(`${API}/api/sites`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(GRUPO_LICITA),
            });
            list = await fetch(`${API}/api/sites`).then(r => r.json());
          } catch { list = [GRUPO_LICITA]; }
        }
        setSites(list);
        const match = list.find(s =>
          s.name.toLowerCase().includes(clientName.toLowerCase()) ||
          clientName.toLowerCase().includes(s.name.toLowerCase())
        );
        setSelectedSite(match ?? list[0]);
      })
      .catch(() => {
        setSites([GRUPO_LICITA]);
        setSelectedSite(GRUPO_LICITA);
      });
  }, [clientName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const msg = input.trim();
    if (!msg || streaming || !selectedSite) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setStreaming(true);
    setCurrentTools([]);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: historyRef.current,
          message: msg,
          site_id: selectedSite.id,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      let tools: string[] = [];

      setMessages(prev => [...prev, { role: "assistant", content: "", toolCalls: [] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "text") {
              assistantText += ev.text;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantText, toolCalls: tools };
                return copy;
              });
            } else if (ev.type === "tool_call") {
              tools = [...tools, ev.name];
              setCurrentTools([...tools]);
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { ...copy[copy.length - 1], toolCalls: tools };
                return copy;
              });
            }
          } catch { /* skip */ }
        }
      }

      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: msg },
        { role: "assistant", content: assistantText },
      ];
    } catch {
      toast.error("Erro de conexão com o Pixel.");
      setMessages(prev => [...prev, { role: "assistant", content: "Erro ao conectar com o servidor." }]);
    } finally {
      setStreaming(false);
      setCurrentTools([]);
    }
  }, [input, streaming, selectedSite]);

  async function addSite(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.id || !addForm.name || !addForm.url || !addForm.username || !addForm.password) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setAddLoading(true);
    try {
      const r = await fetch(`${API}/api/sites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, url: addForm.url.replace(/\/$/, "") }),
      });
      if (!r.ok) throw new Error("Erro ao adicionar site.");
      const updated: WPSite[] = await fetch(`${API}/api/sites`).then(r => r.json());
      setSites(updated);
      const added = updated.find(s => s.id === addForm.id);
      if (added) setSelectedSite(added);
      setShowAdd(false);
      setAddForm({ id: "", name: "", url: "", username: "", password: "" });
      toast.success(`Site "${addForm.name}" conectado!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddLoading(false);
    }
  }

  async function removeSite(id: string) {
    await fetch(`${API}/api/sites/${id}`, { method: "DELETE" });
    const updated = sites.filter(s => s.id !== id);
    setSites(updated);
    if (selectedSite?.id === id) setSelectedSite(updated[0] ?? null);
    toast.success("Site removido.");
  }

  const PIXEL_COLOR = "#B9FF4B";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl"
      style={{ background: "#0A0A10", border: "1px solid rgba(255,255,255,0.07)" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(185,255,75,0.04)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${PIXEL_COLOR}18`, border: `1px solid ${PIXEL_COLOR}35` }}>
            <Globe className="w-4 h-4" style={{ color: PIXEL_COLOR }} />
          </div>
          <div>
            <div className="text-sm font-semibold flex items-center gap-2" style={{ color: "rgba(255,255,255,0.9)" }}>
              Pixel
              <span className="text-[10px] px-1.5 py-0.5 rounded font-normal"
                style={{ background: `${PIXEL_COLOR}15`, color: PIXEL_COLOR }}>
                WordPress IA
              </span>
            </div>
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Edita posts, páginas e SEO via IA
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedSite && (
            <a href={selectedSite.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-all"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <ExternalLink className="w-3 h-3" /> Ver site
            </a>
          )}
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{ background: `${PIXEL_COLOR}15`, color: PIXEL_COLOR, border: `1px solid ${PIXEL_COLOR}30` }}>
            <Plus className="w-3 h-3" /> Conectar
          </button>
        </div>
      </div>

      {/* ── Seletor de site ── */}
      <div className="px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="relative w-full max-w-xs">
          <button onClick={() => setShowDropdown(p => !p)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm transition-all text-left"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.8)" }}>
            {selectedSite ? (
              <>
                <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: PIXEL_COLOR }} />
                <span className="flex-1 truncate text-[13px]">{selectedSite.name}</span>
                <span className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {selectedSite.url.replace(/https?:\/\//, "")}
                </span>
              </>
            ) : (
              <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>Selecionar site...</span>
            )}
            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute top-full left-0 mt-1 w-full z-20 rounded-xl py-1 overflow-hidden"
                style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                {sites.length === 0 && (
                  <p className="text-[11px] px-3 py-2" style={{ color: "rgba(255,255,255,0.3)" }}>Nenhum site conectado.</p>
                )}
                {sites.map(s => (
                  <div key={s.id} className="flex items-center group">
                    <button onClick={() => { setSelectedSite(s); setShowDropdown(false); }}
                      className="flex-1 text-left px-3 py-2.5 text-[12px] transition-colors"
                      style={{ color: selectedSite?.id === s.id ? PIXEL_COLOR : "rgba(255,255,255,0.7)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      {s.name}
                      <span className="block text-[10px] opacity-40 truncate">{s.url}</span>
                    </button>
                    <button onClick={() => removeSite(s.id)}
                      className="p-2 mr-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                      style={{ color: "rgba(239,68,68,0.6)" }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Chat ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3"
            style={{ color: "rgba(255,255,255,0.2)" }}>
            <Bot className="w-10 h-10" />
            <p className="text-[13px] text-center">
              {selectedSite
                ? `Diga ao Pixel o que fazer no site do ${selectedSite.name}`
                : "Selecione um site acima para começar"}
            </p>
            {selectedSite && (
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm mt-1">
                {[
                  { icon: FileText, text: "Listar posts publicados" },
                  { icon: Layout,   text: "Editar a página inicial" },
                  { icon: Tag,      text: "Ver categorias" },
                  { icon: Sparkles, text: "Criar post sobre [tema]" },
                ].map(s => (
                  <button key={s.text} onClick={() => setInput(s.text)}
                    className="flex items-center gap-2 p-3 rounded-xl text-[11px] text-left transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${PIXEL_COLOR}40`; (e.currentTarget as HTMLElement).style.color = PIXEL_COLOR; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)"; }}>
                    <s.icon className="w-3.5 h-3.5 flex-shrink-0" /> {s.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className={cn("flex gap-2", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
            {m.role === "assistant" && (
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: `${PIXEL_COLOR}18`, color: PIXEL_COLOR }}>P</div>
            )}
            <div className="max-w-[85%] rounded-xl px-3 py-2.5"
              style={m.role === "user"
                ? { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }
                : { background: `${PIXEL_COLOR}0C`, border: `1px solid ${PIXEL_COLOR}20` }}>
              {m.toolCalls && m.toolCalls.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {[...new Set(m.toolCalls)].map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: `${PIXEL_COLOR}15`, color: PIXEL_COLOR }}>
                      {TOOL_LABELS[t] || t}
                    </span>
                  ))}
                </div>
              )}
              {m.role === "assistant"
                ? <div className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.82)" }}
                    dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} />
                : <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>{m.content}</p>}
            </div>
          </motion.div>
        ))}

        {streaming && currentTools.length > 0 && (
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: PIXEL_COLOR }} />
            {TOOL_LABELS[currentTools[currentTools.length - 1]] || "Processando..."}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="p-3 border-t flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex gap-2 items-end rounded-xl px-3 py-2"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={selectedSite ? `Diga ao Pixel o que fazer em ${selectedSite.name}...` : "Selecione um site acima..."}
            disabled={streaming || !selectedSite}
            rows={2}
            className="flex-1 bg-transparent resize-none outline-none text-[13px] placeholder:text-[rgba(255,255,255,0.2)] disabled:opacity-40"
            style={{ color: "rgba(255,255,255,0.85)" }}
          />
          <button onClick={sendMessage} disabled={streaming || !input.trim() || !selectedSite}
            className="rounded-lg p-1.5 flex-shrink-0 transition-all"
            style={{ background: streaming || !input.trim() || !selectedSite ? "rgba(255,255,255,0.06)" : PIXEL_COLOR,
              color: streaming || !input.trim() || !selectedSite ? "rgba(255,255,255,0.2)" : "#0A0A10" }}>
            {streaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[10px] mt-1.5 text-center" style={{ color: "rgba(255,255,255,0.15)" }}>
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>

      {/* ── Modal adicionar site ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
            <motion.div initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{ background: "#141420", border: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Conectar site WordPress</h3>
              <form onSubmit={addSite} className="space-y-3">
                {([
                  ["id", "ID interno (ex: meu-site)"],
                  ["name", "Nome do cliente"],
                  ["url", "URL (ex: https://meusite.com.br)"],
                  ["username", "Usuário WordPress"],
                  ["password", "Senha WordPress"],
                ] as [keyof typeof addForm, string][]).map(([field, label]) => (
                  <div key={field}>
                    <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</label>
                    <input
                      type={field === "password" ? "password" : "text"}
                      value={addForm[field]}
                      onChange={e => setAddForm(p => ({ ...p, [field]: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-[13px] focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0" }}
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="flex-1 py-2 rounded-xl text-sm"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={addLoading}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    style={{ background: PIXEL_COLOR, color: "#07080A" }}>
                    {addLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Conectar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
