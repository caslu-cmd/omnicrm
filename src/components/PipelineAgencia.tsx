import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Play, Square, RotateCcw, ChevronDown, Share2, CheckCircle2, AlertCircle, Users, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

/**
 * Produção do período com o time completo.
 *
 * Aciona a edge function `agencia-pipeline`, que roda o pipeline da agência
 * etapa por etapa (briefing → inteligência → estratégia → direção de arte →
 * calendário → produção → revisão → ajustes → fila de aprovação →
 * publicação/atendimento → medição → relatório). O painel acompanha o
 * andamento, mostra a conversa entre os agentes e as entregas de cada um.
 */

const LIME = "#B9FF4B";

interface Props {
  clientId: string;
  clientName: string;
  clientIndustry?: string;
  userId?: string;
}

interface Agente { id: string; nome: string; papel: string; cor: string; skills: string[] }
interface Etapa { id: string; titulo: string; agentes: string[]; critica: boolean }
interface Task {
  agent_key: string; agent_label: string; etapa: string; agente: string;
  status: "pending" | "running" | "done" | "error"; output: string | null;
  structured_output: { json?: unknown; nota?: string | null; imagens?: Array<{ url: string; tema?: string; headline?: string }> } | null;
  error: string | null; started_at: string | null; completed_at: string | null;
}
interface Mensagem { id: string; etapa: string; de: string; para: string; tipo: string; conteudo: string; created_at: string }
interface Run {
  id: string; status: string; etapa_atual: string | null; briefing: string; report: string | null;
  share_token: string | null; created_at: string; completed_at: string | null;
  config?: { periodo_dias?: number; qtd_pecas?: number; inicio?: string };
}
interface Status { run: Run; tasks: Task[]; mensagens: Mensagem[]; etapas: Etapa[]; time: Agente[] }

const TIPO_LABEL: Record<string, string> = {
  sistema: "Aira", handoff: "passou o bastão", feedback: "revisão", retrabalho: "ajuste entregue", aprovacao: "para o cliente",
};

async function chamar<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const r = await fetch(`${SUPABASE_URL}/functions/v1/agencia-pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_PUBLISHABLE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.error ?? `HTTP ${r.status}`);
  return body as T;
}

const chave = (clientId: string) => `agencia-run:${clientId}`;

export default function PipelineAgencia({ clientId, clientName, clientIndustry, userId }: Props) {
  const [runId, setRunId] = useState<string | null>(() => {
    try { return localStorage.getItem(chave(clientId)); } catch { return null; }
  });
  const [status, setStatus] = useState<Status | null>(null);
  const [anteriores, setAnteriores] = useState<Run[]>([]);
  const [briefing, setBriefing] = useState("");
  const [periodo, setPeriodo] = useState(30);
  const [pecas, setPecas] = useState(8);
  const [imagens, setImagens] = useState(true);
  const [iniciando, setIniciando] = useState(false);
  const [aba, setAba] = useState<"time" | "entregas" | "relatorio">("time");
  const [aberta, setAberta] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const rodando = status?.run.status === "running";

  // ── carregar status (polling enquanto roda) ──
  const atualizar = useCallback(async () => {
    if (!runId) return;
    try {
      const s = await chamar<Status>("status", { run_id: runId });
      setStatus(s);
      if (s.run.status === "done" && aba === "time" && !status) setAba("relatorio");
    } catch (e) {
      // run de outra conta ou apagado: solta o id guardado
      toast.error(e instanceof Error ? e.message : "Não consegui carregar a produção");
      setRunId(null);
      try { localStorage.removeItem(chave(clientId)); } catch { /* ignore */ }
    }
  }, [runId, clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { atualizar(); }, [atualizar]);
  useEffect(() => {
    if (!runId || !rodando) return;
    const t = setInterval(atualizar, 5000);
    return () => clearInterval(t);
  }, [runId, rodando, atualizar]);

  useEffect(() => {
    if (runId) return;
    chamar<{ runs: Run[] }>("listar", { client_id: clientId })
      .then((r) => setAnteriores(r.runs))
      .catch(() => setAnteriores([]));
  }, [runId, clientId]);

  useEffect(() => {
    if (aba === "time" && feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [status?.mensagens.length, aba]);

  // ── ações ──
  const iniciar = async () => {
    if (!briefing.trim()) { toast.error("Descreva o objetivo do período para o time"); return; }
    setIniciando(true);
    try {
      const r = await chamar<{ run_id: string }>("start", {
        client_id: clientId, user_id: userId, briefing: briefing.trim(),
        periodo_dias: periodo, qtd_pecas: pecas, gerar_imagens: imagens,
      });
      setRunId(r.run_id);
      setStatus(null);
      setAba("time");
      try { localStorage.setItem(chave(clientId), r.run_id); } catch { /* ignore */ }
      toast.success("Time acionado — a Lia começa pelo briefing");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui acionar o time");
    } finally { setIniciando(false); }
  };

  const cancelar = async () => {
    if (!runId) return;
    await chamar("cancelar", { run_id: runId }).catch(() => {});
    atualizar();
  };
  const retomar = async () => {
    if (!runId) return;
    await chamar("retomar", { run_id: runId }).catch((e) => toast.error(e.message));
    atualizar();
  };
  const novaProducao = () => {
    setRunId(null); setStatus(null); setBriefing("");
    try { localStorage.removeItem(chave(clientId)); } catch { /* ignore */ }
  };
  const abrirAnterior = (id: string) => {
    setRunId(id); setStatus(null); setAba("time");
    try { localStorage.setItem(chave(clientId), id); } catch { /* ignore */ }
  };

  // ── derivados ──
  const agentes = useMemo(() => {
    const m: Record<string, Agente> = {};
    (status?.time ?? []).forEach((a) => { m[a.id] = a; });
    return m;
  }, [status?.time]);
  const nomeDe = (id: string) => id === "time" ? "time" : id === "cliente" ? "cliente" : agentes[id]?.nome ?? id;
  const corDe = (id: string) => agentes[id]?.cor ?? "rgba(255,255,255,0.4)";

  const tasksPorEtapa = useMemo(() => {
    const m: Record<string, Task[]> = {};
    (status?.tasks ?? []).forEach((t) => { (m[t.etapa] ??= []).push(t); });
    return m;
  }, [status?.tasks]);

  const estadoDaEtapa = (e: Etapa): "pending" | "running" | "done" | "error" | "skipped" => {
    const ts = tasksPorEtapa[e.id] ?? [];
    if (!ts.length) {
      if (!status) return "pending";
      const idx = status.etapas.findIndex((x) => x.id === e.id);
      const atual = status.etapas.findIndex((x) => x.id === status.run.etapa_atual);
      if (status.run.status === "done" || (atual > idx && atual >= 0)) return "skipped";
      return "pending";
    }
    if (ts.some((t) => t.status === "running")) return "running";
    if (ts.every((t) => t.status === "done")) return "done";
    if (ts.every((t) => t.status === "done" || t.status === "error")) return ts.some((t) => t.status === "done") ? "done" : "error";
    return "pending";
  };

  const feitas = (status?.tasks ?? []).filter((t) => t.status === "done").length;
  const total = status?.tasks.length ?? 0;
  const linkRelatorio = status?.run.share_token ? `${window.location.origin}/shared/${status.run.share_token}` : null;

  const copiarLink = async () => {
    if (!linkRelatorio) return;
    await navigator.clipboard.writeText(linkRelatorio);
    setCopiado(true); setTimeout(() => setCopiado(false), 2000);
  };

  // ── render ──
  const painel = (children: React.ReactNode) => (
    <div className="rounded-2xl px-5 py-4 space-y-4"
      style={{ background: "rgba(185,255,75,0.035)", border: `1px solid rgba(185,255,75,0.18)` }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest flex items-center gap-2" style={{ color: LIME }}>
            <Users className="w-3.5 h-3.5" /> Produção do período — time completo
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Do briefing ao relatório: os agentes trabalham em sequência, conversam entre si e deixam tudo na fila de aprovação
          </p>
        </div>
        {status && (
          <div className="flex items-center gap-2 shrink-0">
            {rodando && (
              <button onClick={cancelar} className="text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
                <Square className="w-3 h-3" /> Parar
              </button>
            )}
            {(status.run.status === "error" || status.run.status === "cancelado") && (
              <button onClick={retomar} className="text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1"
                style={{ background: "rgba(185,255,75,0.12)", color: LIME }}>
                <RotateCcw className="w-3 h-3" /> Retomar
              </button>
            )}
            <button onClick={novaProducao} className="text-[11px] px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
              Nova produção
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  );

  if (!runId) {
    return painel(
      <>
        <textarea
          value={briefing}
          onChange={(e) => setBriefing(e.target.value)}
          rows={4}
          placeholder={`O que ${clientName || "o cliente"} precisa neste período? Ex.: lançar a nova linha, encher a agenda de setembro, ganhar autoridade no nicho de ${clientIndustry || "…"}. Quanto mais contexto, melhor o diagnóstico da Lia.`}
          className="w-full rounded-xl px-3.5 py-3 text-sm resize-none outline-none"
          style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.9)" }}
        />
        <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
          <label className="flex items-center gap-1.5">Período
            <select value={periodo} onChange={(e) => setPeriodo(Number(e.target.value))}
              className="rounded-md px-2 py-1 outline-none" style={{ background: "rgba(0,0,0,0.4)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>
              {[15, 30, 45].map((d) => <option key={d} value={d}>{d} dias</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5">Peças
            <select value={pecas} onChange={(e) => setPecas(Number(e.target.value))}
              className="rounded-md px-2 py-1 outline-none" style={{ background: "rgba(0,0,0,0.4)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}>
              {[4, 6, 8, 10, 12, 16].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={imagens} onChange={(e) => setImagens(e.target.checked)} /> Gerar artes de referência
          </label>
          <button onClick={iniciar} disabled={iniciando}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
            style={{ background: LIME, color: "#0a0a0a" }}>
            {iniciando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Acionar o time
          </button>
        </div>
        {anteriores.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Produções anteriores</p>
            {anteriores.map((r) => (
              <button key={r.id} onClick={() => abrirAnterior(r.id)}
                className="w-full text-left rounded-lg px-3 py-2 text-xs flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.status === "done" ? LIME : r.status === "running" ? "#FBBF24" : "#F87171" }} />
                <span className="truncate flex-1">{r.briefing}</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
              </button>
            ))}
          </div>
        )}
      </>,
    );
  }

  if (!status) {
    return painel(
      <div className="flex items-center gap-2 text-xs py-6 justify-center" style={{ color: "rgba(255,255,255,0.5)" }}>
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando a produção…
      </div>,
    );
  }

  return painel(
    <>
      {/* ── linha do tempo das etapas ── */}
      <div className="flex items-center justify-between text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
        <span className="truncate pr-3">{status.run.briefing}</span>
        <span className="shrink-0">
          {status.run.status === "running" && <><Loader2 className="inline w-3 h-3 animate-spin mr-1" />{feitas}/{total} entregas</>}
          {status.run.status === "done" && <span style={{ color: LIME }}><CheckCircle2 className="inline w-3 h-3 mr-1" />Concluída</span>}
          {status.run.status === "error" && <span style={{ color: "#F87171" }}><AlertCircle className="inline w-3 h-3 mr-1" />Interrompida</span>}
          {status.run.status === "cancelado" && <span style={{ color: "rgba(255,255,255,0.4)" }}>Parada</span>}
        </span>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {status.etapas.map((e) => {
          const st = estadoDaEtapa(e);
          const cor = st === "done" ? LIME : st === "running" ? "#FBBF24" : st === "error" ? "#F87171" : "rgba(255,255,255,0.15)";
          const ts = tasksPorEtapa[e.id] ?? [];
          return (
            <div key={e.id} className="min-w-[96px] flex-1 rounded-lg px-2 py-1.5"
              title={ts.map((t) => `${t.agent_label}: ${t.status}`).join("\n")}
              style={{ background: st === "running" ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.025)", border: `1px solid ${st === "pending" || st === "skipped" ? "rgba(255,255,255,0.06)" : cor + "55"}`, opacity: st === "skipped" ? 0.4 : 1 }}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cor }} />
                <span className="text-[10px] font-semibold truncate" style={{ color: st === "pending" ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)" }}>{e.titulo}</span>
              </div>
              <div className="flex gap-0.5 mt-1">
                {(ts.length ? ts.map((t) => t.agente) : e.agentes).map((id) => {
                  const t = ts.find((x) => x.agente === id);
                  return (
                    <span key={id} className="text-[9px] px-1 rounded"
                      style={{ background: corDe(id) + (t?.status === "done" ? "33" : "14"), color: t?.status === "pending" || !t ? "rgba(255,255,255,0.35)" : corDe(id) }}>
                      {nomeDe(id)}{t?.status === "running" ? "…" : t?.status === "error" ? " ✕" : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── abas ── */}
      <div className="flex gap-1 text-[11px]">
        {([["time", "Conversa do time"], ["entregas", "Entregas"], ["relatorio", "Relatório & aprovação"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setAba(k)} className="px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: aba === k ? "rgba(185,255,75,0.14)" : "rgba(255,255,255,0.04)", color: aba === k ? LIME : "rgba(255,255,255,0.5)" }}>
            {l}
          </button>
        ))}
      </div>

      {aba === "time" && (
        <div ref={feedRef} className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {status.mensagens.length === 0 && (
            <p className="text-xs py-4 text-center" style={{ color: "rgba(255,255,255,0.35)" }}>O time está se organizando…</p>
          )}
          {status.mensagens.map((m) => {
            const sistema = m.tipo === "sistema";
            return (
              <div key={m.id} className="flex gap-2.5 text-xs"
                style={{ opacity: sistema ? 0.75 : 1 }}>
                <span className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold"
                  style={{ background: corDe(m.de) + "22", color: corDe(m.de) }}>
                  {nomeDe(m.de).slice(0, 1)}
                </span>
                <div className="flex-1 rounded-xl px-3 py-2"
                  style={{ background: sistema ? "transparent" : m.tipo === "feedback" ? "rgba(236,72,153,0.08)" : m.tipo === "aprovacao" ? "rgba(185,255,75,0.08)" : "rgba(255,255,255,0.035)", border: sistema ? "1px dashed rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 mb-0.5 text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                    <span className="font-semibold" style={{ color: corDe(m.de) }}>{nomeDe(m.de)}</span>
                    <span>→ {m.para.split(",").map(nomeDe).join(", ")}</span>
                    <span className="px-1.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>{TIPO_LABEL[m.tipo] ?? m.tipo}</span>
                    <span className="ml-auto">{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{m.conteudo}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {aba === "entregas" && (
        <div className="space-y-1.5">
          {status.etapas.map((e) => (tasksPorEtapa[e.id] ?? []).map((t) => {
            const open = aberta === t.agent_key;
            const imgs = t.structured_output?.imagens ?? [];
            return (
              <div key={t.agent_key} className="rounded-xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => setAberta(open ? null : t.agent_key)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.status === "done" ? corDe(t.agente) : t.status === "running" ? "#FBBF24" : t.status === "error" ? "#F87171" : "rgba(255,255,255,0.15)" }} />
                  <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{t.agent_label}</span>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{e.titulo}</span>
                  <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {t.status === "running" && <Loader2 className="inline w-3 h-3 animate-spin" />}
                    {t.status === "error" && <span style={{ color: "#F87171" }}>{t.error?.slice(0, 60)}</span>}
                    {t.status === "done" && imgs.length > 0 && `${imgs.length} arte(s) · `}
                    {t.status === "done" && `${Math.round((t.output?.length ?? 0) / 1000)}k`}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ color: "rgba(255,255,255,0.3)", transform: open ? "rotate(180deg)" : "none" }} />
                </button>
                {open && t.output && (
                  <div className="px-4 pb-4 space-y-3">
                    {imgs.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {imgs.map((i, n) => (
                          <a key={n} href={i.url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                            <img src={i.url} alt={i.headline ?? i.tema ?? ""} className="w-full aspect-[4/5] object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="prose prose-invert prose-sm max-w-none text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{t.output.replace(/```json[\s\S]*?```\s*$/i, "")}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      )}

      {aba === "relatorio" && (
        <div className="space-y-3">
          {status.run.status !== "done" && (
            <p className="text-xs py-3 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              O relatório da Aira aparece aqui quando o time terminar.
            </p>
          )}
          {status.run.report && (
            <>
              <div className="flex flex-wrap gap-2">
                {linkRelatorio && (
                  <button onClick={copiarLink} className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-semibold"
                    style={{ background: "rgba(185,255,75,0.12)", color: LIME }}>
                    <Share2 className="w-3 h-3" /> {copiado ? "Link copiado" : "Copiar link do relatório"}
                  </button>
                )}
                <span className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}>
                  <ClipboardCheck className="w-3 h-3" /> As peças estão no calendário editorial, aguardando sua aprovação
                </span>
              </div>
              <div className="rounded-xl px-4 py-3 prose prose-invert prose-sm max-w-none text-xs"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)" }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{status.run.report}</ReactMarkdown>
              </div>
            </>
          )}
        </div>
      )}
    </>,
  );
}
