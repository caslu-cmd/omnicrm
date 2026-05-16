import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, CheckCircle2, X, Calendar as CalendarIcon, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";

type Proposal = {
  id: string;
  client_id: string;
  kind: string;
  title: string | null;
  titulo: string | null;
  descricao: string | null;
  payload: any;
  scheduled_for: string | null;
  status: string;
  agent_name: string | null;
  agent_color: string | null;
  created_at: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  event_date: string;
  event_time: string | null;
  status: string;
  payload: any;
};

const KIND_META: Record<string, { label: string; color: string; icon: string }> = {
  post:       { label: "Post",        color: "#60A5FA", icon: "📝" },
  whatsapp:   { label: "WhatsApp",    color: "#25D366", icon: "💬" },
  email:      { label: "E-mail",      color: "#A78BFA", icon: "📧" },
  task:       { label: "Tarefa",      color: "#FBBF24", icon: "✅" },
  campaign:   { label: "Campanha",    color: "#F97316", icon: "🚀" },
  ad:         { label: "Anúncio",     color: "#EC4899", icon: "📢" },
  editorial:  { label: "Conteúdo",    color: "#2DD4BF", icon: "🗓️" },
};

function meta(kind: string) {
  return KIND_META[kind] ?? { label: kind, color: "#94A3B8", icon: "•" };
}

interface Props {
  clientId: string;
  clientName: string;
  clientSegment?: string;
  accentColor?: string;
}

export default function EditorialCalendarPanel({
  clientId,
  clientName,
  clientSegment,
  accentColor = "#B9FF4B",
}: Props) {
  const [pending, setPending] = useState<Proposal[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [actingId, setActingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const [{ data: props }, { data: evs }] = await Promise.all([
      (supabase as any).from("agent_proposals").select("*")
        .eq("user_id", session.user.id).eq("client_id", clientId)
        .eq("kind", "editorial").eq("status", "pending")
        .order("scheduled_for", { ascending: true, nullsFirst: false }),
      (supabase as any).from("client_calendar_events").select("*")
        .eq("user_id", session.user.id).eq("client_id", clientId)
        .gte("event_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
        .order("event_date", { ascending: true }),
    ]);
    setPending(props ?? []);
    setEvents(evs ?? []);
    setLoading(false);
  };

  useEffect(() => { if (clientId) load(); }, [clientId]);

  const generate = async () => {
    setGenerating(true);
    const _pedroTid = toast.loading("Acionando agente Pedro…", { description: "Calendário Editorial — planejamento multicanal" });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const systemPrompt = `Você é o Pedro, coordenador de calendário editorial da agência Calu, especialista em planejar conteúdo multicanal para empresas.
Para o cliente "${clientName}"${clientSegment ? ` (segmento: ${clientSegment})` : ""}, gere um plano editorial cobrindo ${period === "week" ? "os próximos 7 dias" : "os próximos 30 dias"}.

${prompt ? `Diretriz adicional do gestor: ${prompt}` : ""}

Inclua uma mistura de:
- Posts de redes sociais (Instagram, LinkedIn, etc.)
- Disparos de WhatsApp para grupos/contatos
- Campanhas de ads (quando fizer sentido)
- E-mail marketing
- Tarefas internas para a equipe da agência

Responda APENAS com JSON válido no formato:
{"items":[{"kind":"post|whatsapp|email|task|campaign|ad","title":"...","description":"detalhe da execução","scheduled_date":"YYYY-MM-DD","scheduled_time":"HH:MM","platform":"instagram|linkedin|facebook|wpp|email|interno"}]}

Gere entre 8 e 15 itens. Distribua as datas de forma realista, sem amontoar tudo no mesmo dia.`;

      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: {
          messages: [{ role: "user", content: prompt || "Crie o plano editorial." }],
          systemPrompt,
          maxTokens: 2200,
        },
      });
      if (error) throw new Error(error.message);

      const raw = (data?.content ?? "").trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Agente não retornou JSON");
      const parsed = JSON.parse(jsonMatch[0]);
      const items: any[] = parsed.items ?? [];
      if (!items.length) throw new Error("Nenhum item gerado");

      const rows = items.map((it) => {
        const date = it.scheduled_date || new Date().toISOString().slice(0, 10);
        const time = it.scheduled_time || "10:00";
        const sched = new Date(`${date}T${time}:00`).toISOString();
        const m = meta(it.kind);
        return {
          user_id: session.user.id,
          client_id: clientId,
          kind: "editorial",
          title: it.title,
          titulo: it.title,
          descricao: it.description,
          payload: {
            inner_kind: it.kind,
            description: it.description,
            platform: it.platform,
            scheduled_date: date,
            scheduled_time: time,
          },
          scheduled_for: sched,
          status: "pending",
          agent_name: "Pedro",
          agent_color: m.color,
        };
      });

      const { error: insErr } = await (supabase as any).from("agent_proposals").insert(rows);
      if (insErr) throw insErr;

      toast.success(`${rows.length} itens gerados — aprove para liberar ao cliente`);
      setPrompt("");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao gerar calendário");
    }
    toast.dismiss(_pedroTid);
    setGenerating(false);
  };

  const approve = async (p: Proposal) => {
    setActingId(p.id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setActingId(null); return; }

    const date = p.payload?.scheduled_date || (p.scheduled_for?.slice(0, 10)) || new Date().toISOString().slice(0, 10);
    const time = p.payload?.scheduled_time || (p.scheduled_for?.slice(11, 16)) || null;

    const { error: e1 } = await (supabase as any).from("client_calendar_events").insert({
      user_id: session.user.id,
      client_id: p.client_id,
      source_proposal_id: p.id,
      kind: p.payload?.inner_kind || p.kind,
      title: p.titulo || p.title || "Sem título",
      description: p.descricao || p.payload?.description || null,
      event_date: date,
      event_time: time,
      payload: p.payload || {},
      status: "scheduled",
    });
    if (e1) { toast.error("Erro ao aprovar"); setActingId(null); return; }

    await (supabase as any).from("agent_proposals")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", p.id);

    toast.success("Aprovado e publicado no portal do cliente");
    setActingId(null);
    await load();
  };

  const reject = async (p: Proposal) => {
    setActingId(p.id);
    await (supabase as any).from("agent_proposals")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", p.id);
    setActingId(null);
    await load();
  };

  return (
    <div className="space-y-5">
      {/* Gerador */}
      <div className="rounded-2xl p-5 space-y-3"
        style={{ background: "rgba(45,212,191,0.04)", border: "1px solid rgba(45,212,191,0.2)" }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "#2DD4BF" }} />
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
            Gerar calendário editorial com agentes
          </p>
        </div>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
          Pedro vai propor posts, broadcasts, ads, e-mails e tarefas. Tudo fica em <strong>pendente</strong> até você aprovar — só então aparece no portal do cliente.
        </p>
        <div className="flex gap-2 flex-wrap">
          {(["week", "month"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={period === p
                ? { background: "#2DD4BF", color: "#07080A" }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {p === "week" ? "Próxima semana" : "Próximo mês"}
            </button>
          ))}
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={2}
          placeholder="Foco do período (opcional). Ex: lançamento do curso de licitações, foco em conversão..."
          className="w-full rounded-xl px-3 py-2 text-xs resize-none focus:outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F0F0" }}
        />
        <button onClick={generate} disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
          style={{ background: "#2DD4BF", color: "#07080A" }}>
          {generating
            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Pedro está planejando…</>
            : <><Sparkles className="w-3.5 h-3.5" /> Gerar plano</>}
        </button>
      </div>

      {/* Pendentes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: "rgba(251,191,36,0.85)" }}>
            Pendente de aprovação ({pending.length})
          </p>
          <button onClick={load} disabled={loading}
            className="p-1.5 rounded-lg disabled:opacity-40"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {pending.length === 0 && !loading && (
          <div className="rounded-2xl py-6 text-center text-xs"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>
            Nenhuma proposta aguardando. Gere um plano acima.
          </div>
        )}

        {pending.map(p => {
          const m = meta(p.payload?.inner_kind || p.kind);
          const isPreview = previewId === p.id;
          return (
            <div key={p.id} className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.2)" }}>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ background: `${m.color}18`, border: `1px solid ${m.color}30` }}>
                    {m.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: m.color }}>{m.label}</span>
                      {p.scheduled_for && (
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                          📅 {new Date(p.scheduled_for).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          {p.payload?.scheduled_time ? ` · ${p.payload.scheduled_time}` : ""}
                        </span>
                      )}
                      {p.payload?.platform && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                          {p.payload.platform}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold break-words"
                      style={{ color: "rgba(255,255,255,0.9)" }}>{p.titulo || p.title}</p>
                    {isPreview && p.descricao && (
                      <p className="text-xs mt-2 leading-relaxed break-words"
                        style={{ color: "rgba(255,255,255,0.55)" }}>{p.descricao}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => approve(p)} disabled={actingId === p.id}
                    className="flex-1 min-w-[120px] py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{ background: "#34D399", color: "#07080A" }}>
                    {actingId === p.id
                      ? <RefreshCw className="w-3 h-3 animate-spin" />
                      : <><CheckCircle2 className="w-3.5 h-3.5" /> Aprovar</>}
                  </button>
                  <button onClick={() => setPreviewId(isPreview ? null : p.id)}
                    className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Eye className="w-3.5 h-3.5" /> {isPreview ? "Ocultar" : "Ver"}
                  </button>
                  <button onClick={() => reject(p)} disabled={actingId === p.id}
                    className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1"
                    style={{ background: "rgba(248,113,113,0.08)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                    <X className="w-3.5 h-3.5" /> Rejeitar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Eventos aprovados (já no calendário do cliente) */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider font-semibold"
          style={{ color: "rgba(52,211,153,0.85)" }}>
          No calendário do cliente ({events.length})
        </p>
        {events.length === 0 && (
          <div className="rounded-2xl py-5 text-center text-xs"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>
            Itens aprovados aparecem aqui.
          </div>
        )}
        <div className="space-y-1.5">
          {events.map(ev => {
            const m = meta(ev.kind);
            return (
              <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl min-w-0"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ background: `${m.color}15`, border: `1px solid ${m.color}25` }}>
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold uppercase" style={{ color: m.color }}>{m.label}</span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {new Date(ev.event_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      {ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ""}
                    </span>
                  </div>
                  <p className="text-xs font-medium break-words mt-0.5"
                    style={{ color: "rgba(255,255,255,0.8)" }}>{ev.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
