import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronDown, FileText, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AGENT_ORDER = [
  "campanha",
  "calendario_editorial",
  "calendario_demandas",
  "posts_redes_sociais",
  "blogpost",
];

interface Run {
  id: string;
  briefing: string;
  report: string | null;
  status: string;
  completed_at: string | null;
  client_id: string;
}

interface Task {
  agent_key: string;
  agent_label: string;
  status: string;
  output: string | null;
}

export default function SharedOrchestrationPage() {
  const { token } = useParams<{ token: string }>();
  const [run, setRun] = useState<Run | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }

    (async () => {
      const { data: runData, error } = await supabase
        .from("orchestration_runs")
        .select("id, briefing, report, status, completed_at, client_id")
        .eq("share_token", token)
        .maybeSingle();

      if (error || !runData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setRun(runData as Run);

      const { data: taskData } = await supabase
        .from("orchestration_tasks")
        .select("agent_key, agent_label, status, output")
        .eq("run_id", runData.id)
        .eq("status", "done");

      const sorted = (taskData ?? []).sort((a: Task, b: Task) => {
        return (AGENT_ORDER.indexOf(a.agent_key) ?? 99) - (AGENT_ORDER.indexOf(b.agent_key) ?? 99);
      });

      setTasks(sorted as Task[]);
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#07080A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#B9FF4B" }} />
      </div>
    );
  }

  if (notFound || !run) {
    return (
      <div style={{ minHeight: "100vh", background: "#07080A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 mx-auto" style={{ color: "#F87171" }} />
          <p className="text-lg font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Relatório não encontrado</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Este link pode ter expirado ou não existe.</p>
        </div>
      </div>
    );
  }

  const EMOJI: Record<string, string> = {
    campanha: "🚀",
    calendario_editorial: "📅",
    calendario_demandas: "✅",
    posts_redes_sociais: "📱",
    blogpost: "✍️",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07080A", color: "rgba(255,255,255,0.85)" }}>
      {/* Top bar */}
      <div style={{ borderBottom: "1px solid rgba(185,255,75,0.12)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, background: "rgba(185,255,75,0.1)",
          border: "1px solid rgba(185,255,75,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>🤖</div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: "#B9FF4B" }}>ARIA — Relatório Compartilhado</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            Calu Agência • {run.completed_at ? new Date(run.completed_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : ""}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Briefing */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Briefing</p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", whiteSpace: "pre-wrap" }}>{run.briefing}</p>
        </div>

        {/* Executive report */}
        {run.report && (
          <div style={{ background: "rgba(185,255,75,0.04)", border: "1px solid rgba(185,255,75,0.2)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(185,255,75,0.12)", display: "flex", alignItems: "center", gap: 10 }}>
              <FileText style={{ width: 16, height: 16, color: "#B9FF4B" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#B9FF4B" }}>Relatório Executivo</span>
            </div>
            <div style={{ padding: "20px 24px", fontSize: 13, lineHeight: 1.8, color: "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap" }}>
              {run.report}
            </div>
          </div>
        )}

        {/* Agent outputs */}
        {tasks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Entregáveis dos Agentes</p>

            {tasks.map(task => {
              const isExp = expanded === task.agent_key;
              return (
                <motion.div
                  key={task.agent_key}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 16, overflow: "hidden" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", cursor: "pointer" }}
                    onClick={() => setExpanded(isExp ? null : task.agent_key)}>
                    <span style={{ fontSize: 20 }}>{EMOJI[task.agent_key] ?? "📄"}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{task.agent_label}</span>
                    <ChevronDown
                      style={{ width: 14, height: 14, color: "rgba(255,255,255,0.3)", transition: "transform .2s", transform: isExp ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </div>

                  <AnimatePresence>
                    {isExp && task.output && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}>
                        <div style={{ padding: "0 20px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <div style={{
                            marginTop: 12, fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.7)",
                            whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.3)", borderRadius: 12,
                            padding: 16, maxHeight: 480, overflowY: "auto",
                          }}>
                            {task.output}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", paddingTop: 8 }}>
          Gerado por ARIA · Calu Agência
        </p>
      </div>
    </div>
  );
}
