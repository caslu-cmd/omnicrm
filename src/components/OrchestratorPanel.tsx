import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronDown, CheckCircle2, AlertCircle, Sparkles, Send, FileText, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AGENTS = [
  { key: "calendario_editorial", label: "Calendário Editorial", emoji: "📅", desc: "Pauta de 30 dias por canal e formato" },
  { key: "calendario_demandas",  label: "Calendário de Demandas", emoji: "✅", desc: "Tarefas, prazos e responsáveis" },
  { key: "posts_redes_sociais",  label: "Posts Redes Sociais", emoji: "📱", desc: "5 posts prontos com copy e briefing visual" },
  { key: "blogpost",             label: "Artigo de Blog", emoji: "✍️", desc: "Artigo SEO completo para o blog" },
  { key: "campanha",             label: "Estratégia de Campanha", emoji: "🚀", desc: "Campanha com canais, copy e KPIs" },
];

type AgentStatus = "idle" | "running" | "done" | "error";

interface AgentState {
  status: AgentStatus;
  output?: string;
  error?: string;
}

interface Props {
  clientId: string;
  clientName: string;
  clientIndustry?: string;
  userId?: string;
}

export default function OrchestratorPanel({ clientId, clientName, clientIndustry, userId }: Props) {
  const [briefing, setBriefing] = useState("");
  const [running, setRunning] = useState(false);
  const [agents, setAgents] = useState<Record<string, AgentState>>({});
  const [report, setReport] = useState<string | null>(null);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const resetPanel = () => {
    setAgents({});
    setReport(null);
    setRunning(false);
    setReportGenerating(false);
    setExpanded(null);
    setRunId(null);
  };

  const startOrchestration = async () => {
    if (!briefing.trim() || running) return;
    resetPanel();
    setRunning(true);

    AGENTS.forEach(a => setAgents(prev => ({ ...prev, [a.key]: { status: "idle" } })));

    const ab = new AbortController();
    abortRef.current = ab;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-orchestration`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            briefing: briefing.trim(),
            client_name: clientName,
            client_industry: clientIndustry ?? "",
            client_id: clientId,
            user_id: userId ?? null,
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
            } else if (ev.type === "concluido") {
              setRunning(false);
              toast.success("Orquestração concluída!");
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

  const copyOutput = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copiado!"));
  };

  const doneCount = AGENTS.filter(a => agents[a.key]?.status === "done").length;
  const hasAnyResult = Object.values(agents).some(a => a.status === "done" || a.status === "error");

  return (
    <div className="space-y-4">
      {/* Header */}
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
              Descreva o que você precisa e ARIA aciona todos os especialistas em paralelo.
              Ao final, você recebe um relatório completo com todos os entregáveis.
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

        <div className="flex items-center gap-3 mt-3">
          {!running ? (
            <button
              onClick={startOrchestration}
              disabled={!briefing.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: "#B9FF4B", color: "#07080A" }}>
              <Sparkles className="w-4 h-4" />
              Acionar Todos os Agentes
            </button>
          ) : (
            <button
              onClick={stopOrchestration}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(248,113,113,0.15)", color: "#F87171", border: "1px solid rgba(248,113,113,0.3)" }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              Cancelar ({doneCount}/{AGENTS.length} concluídos)
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
            <div className="flex items-center gap-3 px-5 py-4 border-b"
              style={{ borderColor: "rgba(185,255,75,0.12)" }}>
              <FileText className="w-4 h-4" style={{ color: "#B9FF4B" }} />
              <span className="text-sm font-bold" style={{ color: "#B9FF4B" }}>Relatório Executivo</span>
              {reportGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto" style={{ color: "#B9FF4B" }} />}
              {report && (
                <button
                  onClick={() => copyOutput(report)}
                  className="ml-auto text-[11px] px-3 py-1 rounded-lg transition-all"
                  style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(185,255,75,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(185,255,75,0.1)"; }}>
                  Copiar relatório
                </button>
              )}
            </div>
            {report && (
              <div className="px-5 py-4 text-xs whitespace-pre-wrap max-h-[600px] overflow-y-auto"
                style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.8 }}>
                {report}
              </div>
            )}
            {reportGenerating && !report && (
              <div className="px-5 py-6 text-center">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  ARIA está compilando o relatório executivo...
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
