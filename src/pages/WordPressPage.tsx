import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Plus, Trash2, Send, Loader2, CheckCircle2,
  Bot, Sparkles, Settings, ChevronDown, FileText,
  Layout, Tag, Image, Search, Cpu, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API = "http://localhost:8500";

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

interface AgentRec {
  agent: string;
  reason: string;
  can_handle: boolean;
}

const AGENT_COLORS: Record<string, string> = {
  Pixel:  "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Ben:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  Bobby:  "bg-purple-500/10 text-purple-400 border-purple-500/30",
  Apolo:  "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

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

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

// ── Markdown simples ──────────────────────────────────────────────────────────
function renderMd(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code class='bg-muted px-1 rounded text-xs'>$1</code>")
    .replace(/^### (.+)$/gm, "<h3 class='text-sm font-semibold mt-3 mb-1'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-base font-bold mt-4 mb-2'>$1</h2>")
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/\n/g, "<br/>");
}

// ── Modal adicionar site ──────────────────────────────────────────────────────
function AddSiteModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: WPSite) => void }) {
  const [form, setForm] = useState({ id: "", name: "", url: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.id || !form.name || !form.url || !form.username || !form.password) {
      toast.error("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/sites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, url: form.url.replace(/\/$/, "") }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || "Erro ao adicionar site.");
      }
      onAdd({ ...form });
      toast.success(`Site "${form.name}" adicionado!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-elevated p-6 space-y-4">
        <h2 className="text-lg font-bold font-display">Conectar novo site WordPress</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {([
            ["id", "ID interno (ex: grupo-licita)", "text"],
            ["name", "Nome do cliente", "text"],
            ["url", "URL do site (ex: https://grupolicita.com.br)", "url"],
            ["username", "Usuário WordPress", "text"],
            ["password", "Senha do WordPress", "password"],
          ] as [keyof typeof form, string, string][]).map(([field, label, type]) => (
            <div key={field}>
              <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
              <input
                type={type}
                value={form[field]}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Conectar"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
const WordPressPage = () => {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<"agente" | "sites">("agente");
  const [sites, setSites] = useState<WPSite[]>([]);
  const [selectedSite, setSelectedSite] = useState<WPSite | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [currentTools, setCurrentTools] = useState<string[]>([]);

  const [taskInput, setTaskInput] = useState("");
  const [rec, setRec] = useState<AgentRec | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  useEffect(() => {
    fetch(`${API}/api/sites`)
      .then(r => r.json())
      .then(data => {
        setSites(data);
        const paramSite = searchParams.get("site");
        const target = paramSite ? data.find((s: WPSite) => s.id === paramSite) : data[0];
        if (target) setSelectedSite(target);
      })
      .catch(() => {});
  }, []);

  // quando a URL muda (clique no sidebar), sincroniza o site selecionado
  useEffect(() => {
    const paramSite = searchParams.get("site");
    if (!paramSite || sites.length === 0) return;
    const target = sites.find(s => s.id === paramSite);
    if (target) setSelectedSite(target);
  }, [searchParams, sites]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function getRecommendation() {
    if (!taskInput.trim()) return;
    setRecLoading(true);
    setRec(null);
    try {
      const r = await fetch(`${API}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskInput }),
      });
      const data = await r.json();
      setRec(data);
    } catch {
      toast.error("Erro ao analisar tarefa.");
    } finally {
      setRecLoading(false);
    }
  }

  const sendMessage = useCallback(async () => {
    const msg = input.trim();
    if (!msg || streaming) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setStreaming(true);
    setCurrentTools([]);

    const userHistory = [...historyRef.current, { role: "user", content: msg }];

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: historyRef.current,
          message: msg,
          site_id: selectedSite?.id || "",
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
        ...userHistory,
        { role: "assistant", content: assistantText },
      ];
    } catch {
      toast.error("Erro de conexão com o agente.");
      setMessages(prev => [...prev, { role: "assistant", content: "Erro ao conectar com o servidor." }]);
    } finally {
      setStreaming(false);
      setCurrentTools([]);
    }
  }, [input, streaming, selectedSite]);

  async function removeSite(id: string) {
    await fetch(`${API}/api/sites/${id}`, { method: "DELETE" });
    setSites(prev => prev.filter(s => s.id !== id));
    if (selectedSite?.id === id) setSelectedSite(null);
    toast.success("Site removido.");
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show"
      className="p-3 md:p-6 space-y-5 h-full flex flex-col min-w-0">

      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-display flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" /> WordPress IA
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sites.length} site{sites.length !== 1 ? "s" : ""} conectado{sites.length !== 1 ? "s" : ""} · Pixel gerencia seu conteúdo
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Conectar Site
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {[{ key: "agente", label: "Agente Pixel", icon: Bot },
          { key: "sites",  label: "Sites",        icon: Globe }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              tab === t.key ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground")}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </motion.div>

      {/* ── Tab: Agente ── */}
      {tab === "agente" && (
        <motion.div variants={item} className="flex-1 flex flex-col gap-4 min-h-0">

          {/* Recomendação de agente */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" /> Orquestrador — Qual agente usar?
            </p>
            <div className="flex gap-2">
              <input
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && getRecommendation()}
                placeholder="Descreva a tarefa... ex: criar post sobre licitações sustentáveis"
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button onClick={getRecommendation} disabled={recLoading || !taskInput.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
                {recLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Analisar
              </button>
            </div>

            <AnimatePresence>
              {rec && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className={cn("flex items-start gap-3 p-3 rounded-lg border", AGENT_COLORS[rec.agent] || "bg-muted border-border")}>
                  <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Agente recomendado: {rec.agent}</p>
                    <p className="text-xs opacity-80 mt-0.5">{rec.reason}</p>
                    {!rec.can_handle && (
                      <p className="text-xs mt-1 opacity-70 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Recomendo usar o {rec.agent} primeiro, depois trazer o resultado aqui para publicar.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Seletor de site + Chat */}
          <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden min-h-0">
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="relative flex-1 max-w-xs">
                <button onClick={() => setShowSiteDropdown(p => !p)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg border border-input bg-background text-sm hover:bg-muted">
                  {selectedSite ? (
                    <><span className="flex-1 text-left truncate">{selectedSite.name}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /></>
                  ) : (
                    <span className="text-muted-foreground">Selecionar site...</span>
                  )}
                </button>
                <AnimatePresence>
                  {showSiteDropdown && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="absolute top-full left-0 mt-1 w-full rounded-lg border border-border bg-card shadow-elevated z-20 py-1">
                      {sites.length === 0 && (
                        <p className="text-xs text-muted-foreground px-3 py-2">Nenhum site conectado.</p>
                      )}
                      {sites.map(s => (
                        <button key={s.id} onClick={() => { setSelectedSite(s); setShowSiteDropdown(false); }}
                          className={cn("w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors",
                            selectedSite?.id === s.id && "text-primary font-medium")}>
                          {s.name}
                          <span className="block text-[10px] text-muted-foreground truncate">{s.url}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[10px] text-muted-foreground hidden sm:block">Pixel</span>
                <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin min-h-0">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <Globe className="h-10 w-10 opacity-20" />
                  <p className="text-sm">Diga ao Pixel o que fazer no WordPress do cliente.</p>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-sm mt-2">
                    {[
                      { icon: FileText, text: "Criar post sobre [tema]" },
                      { icon: Layout, text: "Editar a página inicial" },
                      { icon: Tag, text: "Listar categorias" },
                      { icon: Image, text: "Ver posts publicados" },
                    ].map(s => (
                      <button key={s.text} onClick={() => setInput(s.text)}
                        className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border text-xs hover:border-primary/40 hover:text-primary transition-colors text-left">
                        <s.icon className="h-3.5 w-3.5 shrink-0" /> {s.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mr-2 mt-1">
                      <Globe className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm")}>
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {[...new Set(m.toolCalls)].map(t => (
                          <span key={t} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            {TOOL_LABELS[t] || t}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.role === "assistant" ? (
                      <div dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} />
                    ) : m.content}
                  </div>
                </div>
              ))}

              {streaming && currentTools.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {TOOL_LABELS[currentTools[currentTools.length - 1]] || "Processando..."}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={selectedSite ? `Diga ao Pixel o que fazer em ${selectedSite.name}...` : "Selecione um site acima..."}
                  disabled={streaming || !selectedSite}
                  className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                />
                <button onClick={sendMessage} disabled={streaming || !input.trim() || !selectedSite}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all">
                  {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Tab: Sites ── */}
      {tab === "sites" && (
        <motion.div variants={item} className="space-y-3">
          {sites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Globe className="h-12 w-12 opacity-20" />
              <p className="text-sm">Nenhum site WordPress conectado ainda.</p>
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                <Plus className="h-4 w-4" /> Conectar primeiro site
              </button>
            </div>
          )}

          {sites.map(s => (
            <div key={s.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card hover:shadow-elevated transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <Globe className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{s.name}</p>
                <p className="text-xs text-primary truncate">{s.url}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">ID: {s.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setSelectedSite(s); setTab("agente"); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20">
                  Usar
                </button>
                <button onClick={() => removeSite(s.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showAdd && (
          <AddSiteModal
            onClose={() => setShowAdd(false)}
            onAdd={s => setSites(prev => [...prev, s])}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WordPressPage;
