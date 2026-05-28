import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ChevronDown, CheckCircle2, AlertCircle, Sparkles,
  FileText, RotateCcw, Paperclip, X, Share2, Check, Link, Plus,
  Pencil, Save, UserPlus, Trash2, CalendarClock, Instagram, Facebook,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

const AGENTS = [
  { key: "campanha",             label: "Estratégia de Campanha", emoji: "🚀", desc: "Campanha com canais, copy e KPIs — executada primeiro" },
  { key: "calendario_editorial", label: "Calendário Editorial",   emoji: "📅", desc: "Pauta de 30 dias por canal e formato" },
  { key: "calendario_demandas",  label: "Calendário de Demandas", emoji: "✅", desc: "Tarefas, prazos e responsáveis" },
  { key: "posts_redes_sociais",  label: "Posts Redes Sociais",    emoji: "📱", desc: "5 posts prontos com copy e briefing visual" },
  { key: "blogpost",             label: "Artigo de Blog",         emoji: "✍️", desc: "Artigo SEO completo para o blog" },
];

type AgentStatus = "idle" | "running" | "done" | "error";

interface AgentState {
  status: AgentStatus;
  output?: string;
  error?: string;
}

type ResponsibleRole   = "visualizar" | "editar" | "executar";
type ResponsibleStatus = "pendente" | "em_andamento" | "concluido";

interface Responsible {
  id: string;
  name: string;
  role: ResponsibleRole;
  status: ResponsibleStatus;
}

const ROLE_LABELS: Record<ResponsibleRole, string> = {
  visualizar: "Visualizar",
  editar:     "Editar",
  executar:   "Executar",
};
const ROLE_COLORS: Record<ResponsibleRole, string> = {
  visualizar: "rgba(99,179,237,0.15)",
  editar:     "rgba(251,191,36,0.15)",
  executar:   "rgba(185,255,75,0.12)",
};
const ROLE_TEXT: Record<ResponsibleRole, string> = {
  visualizar: "#63B3ED",
  editar:     "#FBBF24",
  executar:   "#B9FF4B",
};

const STATUS_LABELS: Record<ResponsibleStatus, string> = {
  pendente:     "Pendente",
  em_andamento: "Em andamento",
  concluido:    "Concluído",
};
const STATUS_COLORS: Record<ResponsibleStatus, string> = {
  pendente:     "rgba(255,255,255,0.18)",
  em_andamento: "#FBBF24",
  concluido:    "#34D399",
};

interface Props {
  clientId: string;
  clientName: string;
  clientIndustry?: string;
  userId?: string;
}

async function extractFileText(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
    const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
    // Use unpkg CDN worker matching the installed version
    const mod = await import("pdfjs-dist");
    const ver = (mod as any).version ?? "5.7.284";
    GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${ver}/build/pdf.worker.min.mjs`;
    const arrayBuf = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuf }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      parts.push(tc.items.map((item: any) => item.str).join(" "));
    }
    return parts.join("\n");
  }
  // Text-based files
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsText(file, "utf-8");
  });
}

export default function OrchestratorPanel({ clientId, clientName, clientIndustry, userId }: Props) {
  const [briefing, setBriefing] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [running, setRunning] = useState(false);
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [report, setReport] = useState<string | null>(null);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [fetchingUrls, setFetchingUrls] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [newResponsible, setNewResponsible] = useState("");
  const [newRole, setNewRole] = useState<ResponsibleRole>("executar");
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [schedulePlatforms, setSchedulePlatforms] = useState<string[]>(["instagram", "facebook"]);
  const [scheduling, setScheduling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetPanel = () => {
    setAgents({});
    setReport(null);
    setRunning(false);
    setReportGenerating(false);
    setExpanded(null);
    setRunId(null);
    setShareToken(null);
    setShareCopied(false);
    setAttachedFiles([]);
    setFetchingUrls(false);
    setUrls([]);
    setUrlInput("");
    setEditMode(false);
    setEditText("");
    setResponsibles([]);
    setNewResponsible("");
    setNewRole("executar");
    setScheduling(false);
  };

  const enterEdit = () => {
    setEditText(report ?? "");
    setEditMode(true);
  };

  const saveReport = async () => {
    if (!runId) return;
    setSaving(true);
    try {
      await supabase.from("orchestration_runs")
        .update({ report: editText, responsibles: responsibles as any })
        .eq("id", runId);
      setReport(editText);
      setEditMode(false);
      toast.success("Relatório salvo!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const saveResponsibles = async (updated: Responsible[]) => {
    if (!runId) return;
    await supabase.from("orchestration_runs")
      .update({ responsibles: updated as any })
      .eq("id", runId);
  };

  const addResponsible = () => {
    const name = newResponsible.trim();
    if (!name) return;
    const item: Responsible = { id: crypto.randomUUID(), name, role: newRole, status: "pendente" };
    const updated = [...responsibles, item];
    setResponsibles(updated);
    setNewResponsible("");
    saveResponsibles(updated);
  };

  const cycleStatus = (id: string) => {
    const order: ResponsibleStatus[] = ["pendente", "em_andamento", "concluido"];
    const updated = responsibles.map(r => {
      if (r.id !== id) return r;
      const next = order[(order.indexOf(r.status) + 1) % order.length];
      return { ...r, status: next };
    });
    setResponsibles(updated);
    saveResponsibles(updated);
  };

  const changeRole = (id: string, role: ResponsibleRole) => {
    const updated = responsibles.map(r => r.id === id ? { ...r, role } : r);
    setResponsibles(updated);
    saveResponsibles(updated);
  };

  const removeResponsible = (id: string) => {
    const updated = responsibles.filter(r => r.id !== id);
    setResponsibles(updated);
    saveResponsibles(updated);
  };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    const normalized = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    if (!urls.includes(normalized)) setUrls(prev => [...prev, normalized]);
    setUrlInput("");
  };

  const removeFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setAttachedFiles(prev => [...prev, ...picked]);
    e.target.value = "";
  };

  const copyShareLink = () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setShareCopied(false), 2500);
    });
  };

  const startOrchestration = async () => {
    if (!briefing.trim() || running) return;
    resetPanel();
    setRunning(true);

    AGENTS.forEach(a => setAgents(prev => ({ ...prev, [a.key]: { status: "idle" } })));

    const ab = new AbortController();
    abortRef.current = ab;

    try {
      // Extract text from all attached files
      const attached_files: { name: string; content: string }[] = [];
      for (const file of attachedFiles) {
        try {
          const content = await extractFileText(file);
          attached_files.push({ name: file.name, content });
        } catch {
          toast.error(`Não foi possível ler: ${file.name}`);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await fetch(
        `${SUPABASE_URL}/functions/v1/run-orchestration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            apikey: SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            briefing: briefing.trim(),
            client_name: clientName,
            client_industry: clientIndustry ?? "",
            client_id: clientId,
            user_id: userId ?? null,
            attached_files: attached_files.length ? attached_files : undefined,
            urls: urls.length ? urls : undefined,
          }),
          signal: ab.signal,
        }
      );

      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "run_id") {
              setRunId(ev.run_id);
            } else if (ev.type === "url_fetching") {
              setFetchingUrls(true);
            } else if (ev.type === "url_done") {
              setFetchingUrls(false);
            } else if (ev.type === "agent_start") {
              setAgents(prev => ({ ...prev, [ev.agent_key]: { status: "running" } }));
            } else if (ev.type === "agent_done") {
              setAgents(prev => ({ ...prev, [ev.agent_key]: { status: "done", output: ev.output } }));
            } else if (ev.type === "agent_error") {
              setAgents(prev => ({ ...prev, [ev.agent_key]: { status: "error", error: ev.error } }));
            } else if (ev.type === "report_start") {
              setReportGenerating(true);
            } else if (ev.type === "report") {
              setReport(ev.report);
              setReportGenerating(false);
            } else if (ev.type === "share_token") {
              setShareToken(ev.share_token);
            } else if (ev.type === "concluido") {
              setRunning(false);
              toast.success("Orquestração concluída!");
              if (autoSchedule) triggerAutoSchedule();
            }
          } catch { /* skip malformed line */ }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error("Erro na orquestração: " + (e.message ?? "desconhecido"));
      }
      setRunning(false);
      setReportGenerating(false);
    }
  };

  const stopOrchestration = () => {
    abortRef.current?.abort();
    setRunning(false);
    setReportGenerating(false);
    toast("Orquestração cancelada");
  };

  const triggerAutoSchedule = async () => {
    if (!briefing.trim() || !userId || !clientId) return;
    setScheduling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/aria-orchestrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          apikey: SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          demand: briefing.trim(),
          clientContext: { id: clientId, name: clientName, industry: clientIndustry },
          userId,
          autoSchedule: true,
          platforms: schedulePlatforms,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const total = (data.scheduledCount ?? 0) + (data.draftCount ?? 0);
      if (total > 0) {
        toast.success(
          `✅ ${data.scheduledCount} post${data.scheduledCount !== 1 ? "s" : ""} agendado${data.scheduledCount !== 1 ? "s" : ""}` +
          (data.draftCount > 0 ? ` · ${data.draftCount} rascunho${data.draftCount !== 1 ? "s" : ""} (adicione imagem)` : "")
        );
      } else {
        toast("Posts gerados — nenhum agendado automaticamente.");
      }
    } catch (e: any) {
      toast.error("Erro ao agendar: " + (e.message ?? "desconhecido"));
    } finally {
      setScheduling(false);
    }
  };

  const copyOutput = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copiado!"));
  };

  const doneCount = AGENTS.filter(a => agents[a.key]?.status === "done").length;
  const hasAnyResult = Object.values(agents).some(a => a.status === "done" || a.status === "error");

  return (
    <div className="space-y-4">
      {/* Header / Input */}
      <div className="rounded-2xl px-5 py-4"
        style={{ background: "rgba(185,255,75,0.04)", border: "1px solid rgba(185,255,75,0.15)" }}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: "rgba(185,255,75,0.1)", border: "1px solid rgba(185,255,75,0.25)" }}>
            🤖
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#B9FF4B" }}>ARIA — Orquestração Multi-Agente</p>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              Descreva o que você precisa e ARIA aciona todos os especialistas.
              A estratégia de campanha é gerada primeiro e compartilhada com os demais agentes.
            </p>
          </div>
        </div>

        <textarea
          value={briefing}
          onChange={e => setBriefing(e.target.value)}
          rows={4}
          placeholder={`Ex: Quero lançar um novo produto de emagrecimento em junho. Preciso de calendário editorial, posts, um artigo de blog e estratégia de campanha paga para Instagram e Google.`}
          className="w-full text-sm rounded-xl px-4 py-3 resize-none outline-none"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.6,
          }}
          disabled={running}
        />

        {/* File chips */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attachedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px]"
                style={{ background: "rgba(185,255,75,0.08)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)" }}>
                <FileText className="w-3 h-3" />
                <span className="max-w-[120px] truncate">{f.name}</span>
                {!running && (
                  <button onClick={() => removeFile(i)} className="ml-0.5 opacity-60 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* URL input */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <Link className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
              placeholder="Cole uma URL para a ARIA ler (ex: site do cliente)"
              disabled={running}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "rgba(255,255,255,0.8)", minWidth: 0 }}
            />
          </div>
          <button
            onClick={addUrl}
            disabled={!urlInput.trim() || running}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)", whiteSpace: "nowrap" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(185,255,75,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(185,255,75,0.1)"; }}>
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        </div>

        {/* URL chips */}
        {urls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {urls.map((u, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px]"
                style={{ background: "rgba(99,179,237,0.08)", color: "#63B3ED", border: "1px solid rgba(99,179,237,0.2)" }}>
                <Link className="w-3 h-3" />
                <span className="max-w-[200px] truncate">{u.replace(/^https?:\/\//, "")}</span>
                {!running && (
                  <button onClick={() => setUrls(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 opacity-60 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Auto-schedule toggle */}
        <div className="mt-3 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
          style={{ background: autoSchedule ? "rgba(185,255,75,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${autoSchedule ? "rgba(185,255,75,0.2)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.2s" }}>
          <button
            onClick={() => setAutoSchedule(v => !v)}
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: autoSchedule ? "#B9FF4B" : "rgba(255,255,255,0.45)" }}>
            <div className="w-8 h-4 rounded-full relative transition-colors flex-shrink-0"
              style={{ background: autoSchedule ? "#B9FF4B" : "rgba(255,255,255,0.15)" }}>
              <div className="w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ left: autoSchedule ? "17px" : "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
            </div>
            <CalendarClock className="w-3.5 h-3.5" />
            Publicar automaticamente nas redes
          </button>

          {autoSchedule && (
            <div className="flex items-center gap-2 ml-1">
              {[
                { id: "instagram", Icon: Instagram, label: "Instagram" },
                { id: "facebook",  Icon: Facebook,  label: "Facebook"  },
              ].map(({ id, Icon, label }) => {
                const active = schedulePlatforms.includes(id);
                return (
                  <button key={id}
                    onClick={() => setSchedulePlatforms(prev =>
                      active ? prev.filter(p => p !== id) : [...prev, id]
                    )}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                    style={{
                      background: active ? "rgba(185,255,75,0.12)" : "rgba(255,255,255,0.05)",
                      color: active ? "#B9FF4B" : "rgba(255,255,255,0.3)",
                      border: `1px solid ${active ? "rgba(185,255,75,0.3)" : "rgba(255,255,255,0.08)"}`,
                    }}>
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {scheduling && (
            <div className="flex items-center gap-1.5 text-[11px] ml-auto" style={{ color: "#B9FF4B" }}>
              <Loader2 className="w-3 h-3 animate-spin" />
              Agendando posts...
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {!running ? (
            <>
              <button
                onClick={startOrchestration}
                disabled={!briefing.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: "#B9FF4B", color: "#07080A" }}>
                <Sparkles className="w-4 h-4" />
                Acionar Todos os Agentes
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.csv,.docx"
                className="hidden"
                onChange={onFilePick}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#B9FF4B"; e.currentTarget.style.borderColor = "rgba(185,255,75,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                <Paperclip className="w-3.5 h-3.5" />
                Anexar arquivos
              </button>
            </>
          ) : (
            <button
              onClick={stopOrchestration}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(248,113,113,0.15)", color: "#F87171", border: "1px solid rgba(248,113,113,0.3)" }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              {fetchingUrls
                ? "Lendo URLs..."
                : `Cancelar (${doneCount}/${AGENTS.length} concluídos)`}
            </button>
          )}

          {hasAnyResult && !running && (
            <button
              onClick={resetPanel}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}>
              <RotateCcw className="w-3.5 h-3.5" /> Nova orquestração
            </button>
          )}
        </div>
      </div>

      {/* Agent Status Cards */}
      {Object.keys(agents).length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {AGENTS.map(agent => {
            const state = agents[agent.key] ?? { status: "idle" };
            const isExpanded = expanded === agent.key;

            const statusColor = state.status === "done" ? "#34D399"
              : state.status === "error" ? "#F87171"
              : state.status === "running" ? "#B9FF4B"
              : "rgba(255,255,255,0.2)";
            const statusBg = state.status === "done" ? "rgba(52,211,153,0.06)"
              : state.status === "error" ? "rgba(248,113,113,0.06)"
              : state.status === "running" ? "rgba(185,255,75,0.06)"
              : "rgba(255,255,255,0.02)";

            return (
              <motion.div
                key={agent.key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: statusBg, border: `1px solid ${statusColor}25` }}>

                <div
                  className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none"
                  onClick={() => state.status === "done" && setExpanded(isExpanded ? null : agent.key)}>
                  <span className="text-xl">{agent.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{agent.label}</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{agent.desc}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {state.status === "running" && (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#B9FF4B" }} />
                        <span className="text-[11px] font-medium" style={{ color: "#B9FF4B" }}>Executando...</span>
                      </div>
                    )}
                    {state.status === "done" && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#34D399" }} />
                        <span className="text-[11px] font-medium" style={{ color: "#34D399" }}>Concluído</span>
                        <ChevronDown
                          className="w-3.5 h-3.5 transition-transform"
                          style={{ color: "rgba(255,255,255,0.3)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
                      </div>
                    )}
                    {state.status === "error" && (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" style={{ color: "#F87171" }} />
                        <span className="text-[11px] font-medium" style={{ color: "#F87171" }}>Erro</span>
                      </div>
                    )}
                    {state.status === "idle" && (
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>Aguardando...</span>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && state.output && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}>
                      <div className="px-5 pb-4 border-t"
                        style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center justify-between py-3">
                          <span className="text-[11px] font-semibold uppercase tracking-widest"
                            style={{ color: "rgba(255,255,255,0.3)" }}>Resultado</span>
                          <button
                            onClick={e => { e.stopPropagation(); copyOutput(state.output!); }}
                            className="text-[11px] px-3 py-1 rounded-lg transition-all"
                            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#B9FF4B"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}>
                            Copiar
                          </button>
                        </div>
                        <div
                          className="text-xs rounded-xl p-4 whitespace-pre-wrap max-h-96 overflow-y-auto"
                          style={{
                            background: "rgba(0,0,0,0.3)",
                            color: "rgba(255,255,255,0.7)",
                            lineHeight: 1.7,
                            fontFamily: "inherit",
                          }}>
                          {state.output}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {state.status === "error" && state.error && (
                  <div className="px-5 pb-4">
                    <p className="text-[11px] rounded-lg px-3 py-2"
                      style={{ background: "rgba(248,113,113,0.08)", color: "#F87171" }}>
                      {state.error}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Report */}
      <AnimatePresence>
        {(reportGenerating || report) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(185,255,75,0.04)", border: "1px solid rgba(185,255,75,0.2)" }}>

            {/* Report header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 flex-shrink-0" style={{ color: "#B9FF4B" }} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
                      style={{ color: "rgba(185,255,75,0.6)" }}>ARIA · Calu Agência</p>
                    <h2 className="text-base font-bold" style={{ color: "#fff" }}>
                      Relatório de Estratégia de Marketing
                    </h2>
                  </div>
                </div>

                {reportGenerating && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 mt-1" style={{ color: "#B9FF4B" }} />}

                {report && !editMode && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={enterEdit}
                      className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#B9FF4B"; e.currentTarget.style.borderColor = "rgba(185,255,75,0.3)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                    {shareToken && (
                      <button
                        onClick={copyShareLink}
                        className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", color: shareCopied ? "#34D399" : "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
                        onMouseEnter={e => { if (!shareCopied) e.currentTarget.style.color = "#B9FF4B"; }}
                        onMouseLeave={e => { if (!shareCopied) e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
                        {shareCopied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                        {shareCopied ? "Copiado!" : "Compartilhar"}
                      </button>
                    )}
                    <button
                      onClick={() => copyOutput(report)}
                      className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(185,255,75,0.2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(185,255,75,0.1)"; }}>
                      Copiar
                    </button>
                  </div>
                )}

                {editMode && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditMode(false)}
                      className="text-[11px] px-3 py-1.5 rounded-lg"
                      style={{ color: "rgba(255,255,255,0.4)" }}>
                      Cancelar
                    </button>
                    <button
                      onClick={saveReport}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-[11px] px-4 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-50"
                      style={{ background: "#B9FF4B", color: "#07080A" }}>
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                      Salvar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t mx-5" style={{ borderColor: "rgba(185,255,75,0.1)" }} />

            {/* Report content */}
            {report && !editMode && (
              <div className="px-5 py-4 max-h-[600px] overflow-y-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-5 first:mt-0" style={{ color: "#fff" }}>{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-bold mb-2 mt-5 first:mt-0 pb-1" style={{ color: "#B9FF4B", borderBottom: "1px solid rgba(185,255,75,0.15)" }}>{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mb-1.5 mt-4" style={{ color: "rgba(255,255,255,0.9)" }}>{children}</h3>,
                    p: ({ children }) => <p className="text-sm mb-3 leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold" style={{ color: "#fff" }}>{children}</strong>,
                    em: ({ children }) => <em style={{ color: "rgba(255,255,255,0.6)" }}>{children}</em>,
                    ul: ({ children }) => <ul className="mb-3 space-y-1 pl-4" style={{ listStyleType: "disc", color: "rgba(255,255,255,0.72)" }}>{children}</ul>,
                    ol: ({ children }) => <ol className="mb-3 space-y-1 pl-4" style={{ listStyleType: "decimal", color: "rgba(255,255,255,0.72)" }}>{children}</ol>,
                    li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                    hr: () => <hr className="my-4" style={{ borderColor: "rgba(255,255,255,0.08)" }} />,
                    blockquote: ({ children }) => (
                      <blockquote className="pl-3 my-3 italic text-sm" style={{ borderLeft: "2px solid #B9FF4B", color: "rgba(255,255,255,0.55)" }}>
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "#B9FF4B" }}>
                        {children}
                      </code>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-3">
                        <table className="w-full text-xs border-collapse">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => <th className="text-left px-3 py-2 text-xs font-semibold" style={{ background: "rgba(185,255,75,0.08)", color: "#B9FF4B", borderBottom: "1px solid rgba(185,255,75,0.2)" }}>{children}</th>,
                    td: ({ children }) => <td className="px-3 py-2 text-xs" style={{ color: "rgba(255,255,255,0.65)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{children}</td>,
                  }}>
                  {report}
                </ReactMarkdown>
              </div>
            )}

            {editMode && (
              <div className="px-5 py-4">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={20}
                  className="w-full text-sm rounded-xl px-4 py-3 resize-none outline-none font-mono"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(185,255,75,0.2)",
                    color: "rgba(255,255,255,0.8)",
                    lineHeight: 1.7,
                  }}
                />
                <p className="text-[11px] mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Edite o texto em Markdown. Clique em Salvar para persistir as alterações.
                </p>
              </div>
            )}

            {reportGenerating && !report && (
              <div className="px-5 py-8 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" style={{ color: "#B9FF4B" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  ARIA está compilando o relatório executivo...
                </p>
              </div>
            )}

            {/* Responsáveis */}
            {report && (
              <div className="px-5 pb-5 pt-2">
                <div className="border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Responsáveis
                  </p>

                  {/* Add responsible */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2 min-w-[160px]"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <UserPlus className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }} />
                      <input
                        type="text"
                        value={newResponsible}
                        onChange={e => setNewResponsible(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addResponsible(); } }}
                        placeholder="Nome do responsável"
                        className="flex-1 bg-transparent outline-none text-sm"
                        style={{ color: "rgba(255,255,255,0.8)", minWidth: 0 }}
                      />
                    </div>
                    <select
                      value={newRole}
                      onChange={e => setNewRole(e.target.value as ResponsibleRole)}
                      className="text-xs rounded-xl px-3 py-2 outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: ROLE_TEXT[newRole], cursor: "pointer" }}>
                      <option value="executar"   style={{ background: "#1a1a1a" }}>Executar</option>
                      <option value="editar"     style={{ background: "#1a1a1a" }}>Editar</option>
                      <option value="visualizar" style={{ background: "#1a1a1a" }}>Visualizar</option>
                    </select>
                    <button
                      onClick={addResponsible}
                      disabled={!newResponsible.trim()}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                      style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(185,255,75,0.2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(185,255,75,0.1)"; }}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Responsible list */}
                  {responsibles.length > 0 && (
                    <div className="space-y-2">
                      {responsibles.map(r => (
                        <div key={r.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl group"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {/* Status dot */}
                          <button
                            onClick={() => cycleStatus(r.id)}
                            title="Clique para avançar status"
                            className="flex-shrink-0 w-2.5 h-2.5 rounded-full transition-all"
                            style={{ background: STATUS_COLORS[r.status], boxShadow: `0 0 6px ${STATUS_COLORS[r.status]}80` }}
                          />
                          {/* Name */}
                          <span className="flex-1 text-sm truncate" style={{
                            color: r.status === "concluido" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.78)",
                            textDecoration: r.status === "concluido" ? "line-through" : "none",
                          }}>
                            {r.name}
                          </span>
                          {/* Status badge */}
                          <button
                            onClick={() => cycleStatus(r.id)}
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                            style={{ background: `${STATUS_COLORS[r.status]}18`, color: STATUS_COLORS[r.status], border: `1px solid ${STATUS_COLORS[r.status]}35` }}>
                            {STATUS_LABELS[r.status]}
                          </button>
                          {/* Role selector */}
                          <select
                            value={r.role}
                            onChange={e => changeRole(r.id, e.target.value as ResponsibleRole)}
                            className="text-[10px] rounded-lg px-2 py-0.5 outline-none flex-shrink-0"
                            style={{ background: ROLE_COLORS[r.role], border: `1px solid ${ROLE_TEXT[r.role]}30`, color: ROLE_TEXT[r.role], cursor: "pointer" }}>
                            <option value="executar"   style={{ background: "#1a1a1a" }}>Executar</option>
                            <option value="editar"     style={{ background: "#1a1a1a" }}>Editar</option>
                            <option value="visualizar" style={{ background: "#1a1a1a" }}>Visualizar</option>
                          </select>
                          {/* Remove */}
                          <button
                            onClick={() => removeResponsible(r.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            style={{ color: "rgba(255,255,255,0.25)" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#F87171"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {responsibles.length === 0 && (
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                      Adicione os responsáveis e defina o nível de acesso de cada um.
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
