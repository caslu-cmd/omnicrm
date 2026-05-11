import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, FileCode, Send, RefreshCw, Check, X,
  ChevronRight, ExternalLink, GitCommit, Loader2, Globe, Bot,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TEO_COLOR = "#06B6D4";

const SUPABASE_URL = "https://proldgiyterqhthludlp.supabase.co/functions/v1/teo-site";

async function callTeo(action: string, payload: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const r = await fetch(SUPABASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(err.error ?? r.statusText);
  }
  return r.json();
}

interface GitFile {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
}

interface TeoMsg {
  id: string;
  from: "user" | "teo";
  content: string;
  newContent?: string;
  timestamp: string;
}

interface Props {
  clientId: string;
  siteUrl: string;
  siteRepo: string;
}

export default function SiteEditorPanel({ clientId, siteUrl, siteRepo }: Props) {
  const [files, setFiles] = useState<GitFile[]>([]);
  const [openDirs, setOpenDirs] = useState<Set<string>>(new Set());
  const [dirContents, setDirContents] = useState<Record<string, GitFile[]>>({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState("");
  const [fileSha, setFileSha] = useState("");
  const [pendingContent, setPendingContent] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitDone, setCommitDone] = useState(false);

  const [msgs, setMsgs] = useState<TeoMsg[]>([]);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchDir(""); }, [siteRepo]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function fetchDir(path: string) {
    try {
      const data = await callTeo("list_files", { path, repo: siteRepo || undefined });
      const list: GitFile[] = (data.files ?? []).filter((f: GitFile) =>
        !["node_modules", ".git", "dist", "bun.lockb", "package-lock.json"].includes(f.name)
      );
      if (path === "") setFiles(list);
      else setDirContents((p) => ({ ...p, [path]: list }));
    } catch { /* silently ignore */ }
  }

  async function openFile(path: string) {
    setSelectedFile(path);
    setPendingContent(null);
    setCommitDone(false);
    setLoadingFile(true);
    try {
      const data = await callTeo("read_file", { path, repo: siteRepo || undefined });
      setFileContent(data.content ?? "");
      setFileSha(data.sha ?? "");
    } catch {
      setFileContent("Erro ao carregar arquivo.");
    }
    setLoadingFile(false);
  }

  function toggleDir(path: string) {
    setOpenDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) { next.delete(path); }
      else { next.add(path); if (!dirContents[path]) fetchDir(path); }
      return next;
    });
  }

  async function sendMessage() {
    const msg = input.trim();
    if (!msg || sending) return;
    if (!selectedFile) {
      setMsgs((p) => [...p, { id: `i-${Date.now()}`, from: "teo", content: "Selecione um arquivo na árvore para eu poder editá-lo.", timestamp: now() }]);
      return;
    }
    setInput("");
    setSending(true);
    setMsgs((p) => [...p, { id: `u-${Date.now()}`, from: "user", content: msg, timestamp: now() }]);
    try {
      const data = await callTeo("chat", {
        message: msg,
        file_path: selectedFile,
        file_content: fileContent,
        history,
      });
      setMsgs((p) => [...p, {
        id: `t-${Date.now()}`, from: "teo",
        content: data.reply ?? "Sem resposta.",
        newContent: data.new_content ?? undefined,
        timestamp: now(),
      }]);
      if (data.history) setHistory(data.history);
      if (data.new_content) { setPendingContent(data.new_content); setCommitDone(false); }
    } catch (e: any) {
      setMsgs((p) => [...p, { id: `e-${Date.now()}`, from: "teo", content: `Erro: ${e.message}`, timestamp: now() }]);
    }
    setSending(false);
  }

  async function commitChanges() {
    if (!pendingContent || !selectedFile || !fileSha) return;
    setCommitting(true);
    try {
      const lastUserMsg = msgs.filter((m) => m.from === "user").pop();
      const commitMsg = `Teo: ${lastUserMsg?.content.slice(0, 72) ?? "atualiza " + selectedFile}`;
      await callTeo("commit", { path: selectedFile, content: pendingContent, sha: fileSha, message: commitMsg, repo });
      // Update last_edited_at in site_pages
      supabase.from("site_pages").update({ last_edited_at: new Date().toISOString() }).eq("client_id", clientId).eq("file_path", selectedFile).then(() => {});
      setFileContent(pendingContent);
      setPendingContent(null);
      setCommitDone(true);
      setMsgs((p) => [...p, {
        id: `ok-${Date.now()}`, from: "teo",
        content: `Commit feito. O Lovable já está fazendo o deploy de \`${selectedFile}\`.`,
        timestamp: now(),
      }]);
      openFile(selectedFile);
    } catch (e: any) {
      setMsgs((p) => [...p, { id: `ce-${Date.now()}`, from: "teo", content: `Erro ao commitar: ${e.message}`, timestamp: now() }]);
    }
    setCommitting(false);
  }

  function now() {
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function renderTree(items: GitFile[], depth = 0): React.ReactNode {
    const sorted = [...items].sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return sorted.map((f) => {
      const isOpen = openDirs.has(f.path);
      const isSelected = selectedFile === f.path;
      const pl = 8 + depth * 12;
      if (f.type === "dir") {
        return (
          <div key={f.path}>
            <button onClick={() => toggleDir(f.path)} className="w-full flex items-center gap-1.5 px-2 py-1 text-[12px] rounded transition-colors text-left"
              style={{ paddingLeft: pl, color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <ChevronRight className="w-3 h-3 shrink-0 transition-transform" style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
              <FolderOpen className="w-3.5 h-3.5 shrink-0" style={{ color: "#FBBF24" }} />
              <span className="truncate">{f.name}</span>
            </button>
            {isOpen && dirContents[f.path] && renderTree(dirContents[f.path], depth + 1)}
          </div>
        );
      }
      return (
        <button key={f.path} onClick={() => openFile(f.path)} className="w-full flex items-center gap-1.5 px-2 py-1 text-[12px] rounded transition-colors text-left"
          style={{ paddingLeft: pl + 12, color: isSelected ? TEO_COLOR : "rgba(255,255,255,0.45)", background: isSelected ? `${TEO_COLOR}12` : "transparent" }}
          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
        >
          <FileCode className="w-3.5 h-3.5 shrink-0" style={{ color: isSelected ? TEO_COLOR : "rgba(255,255,255,0.3)" }} />
          <span className="truncate">{f.name}</span>
        </button>
      );
    });
  }

  function renderMsgContent(content: string) {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return (
      <div className="space-y-2 text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
        {parts.map((part, i) => {
          const codeMatch = part.match(/```(?:\w+)?\n?([\s\S]*?)```/);
          if (codeMatch) {
            return (
              <pre key={i} className="mt-2 p-3 rounded-lg text-[11px] overflow-auto"
                style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)", color: "#B9FF4B" }}>
                <code>{codeMatch[1]}</code>
              </pre>
            );
          }
          return part ? <span key={i} style={{ whiteSpace: "pre-wrap" }}>{part}</span> : null;
        })}
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden rounded-xl" style={{ background: "#0A0A10", border: "1px solid rgba(255,255,255,0.07)" }}>

      {/* ── Árvore de arquivos ── */}
      <div className="w-52 flex-shrink-0 flex flex-col border-r" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="px-3 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <Globe className="w-3.5 h-3.5" style={{ color: TEO_COLOR }} />
          <span className="text-[11px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.6)" }}>abcer.lovable.com</span>
          <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="ml-auto">
            <ExternalLink className="w-3 h-3" style={{ color: "rgba(255,255,255,0.25)" }} />
          </a>
        </div>
        <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5 px-1">
          {files.length === 0
            ? <div className="px-3 py-4 text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>Carregando arquivos...</div>
            : renderTree(files)}
        </div>
      </div>

      {/* ── Visualizador de código ── */}
      <div className="flex-1 flex flex-col min-w-0 border-r" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          {selectedFile ? (
            <>
              <FileCode className="w-3.5 h-3.5 flex-shrink-0" style={{ color: TEO_COLOR }} />
              <span className="text-[12px] font-mono truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{selectedFile}</span>
              {pendingContent && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(251,191,36,0.12)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.2)" }}>
                  Alterações pendentes
                </span>
              )}
              {commitDone && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                  style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <Check className="w-3 h-3" /> Commitado
                </span>
              )}
            </>
          ) : (
            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>Selecione um arquivo</span>
          )}
        </div>

        <AnimatePresence>
          {pendingContent && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 flex items-center gap-2 border-b overflow-hidden"
              style={{ borderColor: "rgba(251,191,36,0.2)", background: "rgba(251,191,36,0.06)" }}>
              <GitCommit className="w-3.5 h-3.5" style={{ color: "#FBBF24" }} />
              <span className="text-[11px] flex-1" style={{ color: "#FBBF24" }}>Teo gerou alterações — revise e aplique</span>
              <button onClick={() => setPendingContent(null)} className="text-[11px] px-2 py-1 rounded flex items-center gap-1 transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
                <X className="w-3 h-3" /> Descartar
              </button>
              <button onClick={commitChanges} disabled={committing} className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{ background: TEO_COLOR, color: "#0A0A10" }}>
                {committing ? <><Loader2 className="w-3 h-3 animate-spin" /> Aplicando...</> : <><Check className="w-3 h-3" /> Aplicar ao site</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-auto p-4">
          {loadingFile ? (
            <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              <Loader2 className="w-4 h-4 animate-spin" /><span className="text-[12px]">Carregando...</span>
            </div>
          ) : selectedFile ? (
            <pre className="text-[12px] font-mono leading-relaxed"
              style={{ color: pendingContent ? "#B9FF4B" : "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {(pendingContent ?? fileContent) || <span style={{ color: "rgba(255,255,255,0.2)" }}>(arquivo vazio)</span>}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: "rgba(255,255,255,0.15)" }}>
              <FileCode className="w-10 h-10" />
              <span className="text-[13px]">Selecione um arquivo na árvore</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat com Teo ── */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        <div className="px-4 py-2.5 border-b flex items-center gap-2.5" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ background: `${TEO_COLOR}22`, border: `1px solid ${TEO_COLOR}40`, color: TEO_COLOR }}>T</div>
          <div>
            <div className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>Teo</div>
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Editor de Site · Calu Agência</div>
          </div>
          <div className="ml-auto">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: TEO_COLOR }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: TEO_COLOR }} />
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {msgs.length === 0 && (
            <div className="p-3 rounded-xl text-[12px]" style={{ background: `${TEO_COLOR}10`, border: `1px solid ${TEO_COLOR}20`, color: "rgba(255,255,255,0.5)" }}>
              <Bot className="w-4 h-4 mb-1.5" style={{ color: TEO_COLOR }} />
              Olá! Sou o <strong style={{ color: TEO_COLOR }}>Teo</strong>, editor de site da Calu Agência.<br /><br />
              Selecione um arquivo à esquerda e me diga o que quer alterar. Vou editar e commitar direto no Lovable.
            </div>
          )}
          {msgs.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${msg.from === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.from === "teo" && (
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                  style={{ background: `${TEO_COLOR}22`, color: TEO_COLOR }}>T</div>
              )}
              <div className="max-w-[85%] rounded-xl px-3 py-2"
                style={msg.from === "user"
                  ? { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }
                  : { background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
                {msg.from === "teo"
                  ? renderMsgContent(msg.content)
                  : <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>{msg.content}</p>}
                <div className="text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>{msg.timestamp}</div>
              </div>
            </motion.div>
          ))}
          {sending && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                style={{ background: `${TEO_COLOR}22`, color: TEO_COLOR }}>T</div>
              <div className="px-3 py-2 rounded-xl flex items-center gap-2"
                style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
                <RefreshCw className="w-3 h-3 animate-spin" style={{ color: TEO_COLOR }} />
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>Editando...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-end gap-2 rounded-xl px-3 py-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={selectedFile ? "Diga ao Teo o que alterar..." : "Selecione um arquivo primeiro"}
              rows={2} className="flex-1 bg-transparent resize-none outline-none text-[13px] placeholder:text-[rgba(255,255,255,0.2)]"
              style={{ color: "rgba(255,255,255,0.85)" }} />
            <button onClick={sendMessage} disabled={sending || !input.trim()} className="rounded-lg p-1.5 transition-all flex-shrink-0"
              style={{ background: sending || !input.trim() ? "rgba(255,255,255,0.06)" : TEO_COLOR, color: sending || !input.trim() ? "rgba(255,255,255,0.2)" : "#0A0A10" }}>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[10px] mt-1.5 text-center" style={{ color: "rgba(255,255,255,0.15)" }}>
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
