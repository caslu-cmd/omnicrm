import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Plus, Trash2, Webhook, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://proldgiyterqhthludlp.supabase.co";

const PIPELINE_OPTIONS = [
  { id: "",           label: "Nenhum (apenas CRM)" },
  { id: "usineiros",  label: "Usineiros",  stages: [
    { id: "prospeccao", name: "Prospecção" }, { id: "contato", name: "Contato inicial" },
    { id: "visita", name: "Visita técnica" }, { id: "proposta", name: "Proposta" },
    { id: "negociacao", name: "Negociação" }, { id: "contrato", name: "Contrato" },
    { id: "onboarding", name: "Onboarding" },
  ]},
  { id: "associados", label: "Associados", stages: [
    { id: "lead", name: "Lead captado" }, { id: "simulacao", name: "Simulação feita" },
    { id: "cadastro", name: "Cadastro iniciado" }, { id: "documentacao", name: "Doc. pendente" },
    { id: "analise", name: "Análise" }, { id: "ativo", name: "Ativo" },
  ]},
];

interface Endpoint {
  id: string;
  name: string;
  course_name: string | null;
  pipeline_id: string | null;
  initial_stage_id: string | null;
  token: string;
  active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
  field_mappings: Record<string, string>;
  created_at: string;
}

interface Lead {
  id: string;
  created_at: string;
  raw_data: Record<string, unknown>;
  contact_id: string | null;
}

export default function WebhooksTab({ clientId }: { clientId: string }) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newPipelineId, setNewPipelineId] = useState("");
  const [newStageId, setNewStageId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Record<string, Lead[]>>({});
  const [leadsLoading, setLeadsLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("webhook_endpoints")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (data) setEndpoints(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [clientId]);

  const webhookUrl = (token: string) =>
    `${SUPABASE_URL}/functions/v1/webhook-receiver?token=${token}`;

  const copyUrl = (token: string) => {
    navigator.clipboard.writeText(webhookUrl(token));
    toast.success("URL copiada!");
  };

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setCreating(false); return; }
    const { error } = await (supabase as any).from("webhook_endpoints").insert({
      user_id: session.user.id,
      client_id: clientId,
      name: newName.trim(),
      course_name: newCourse.trim() || null,
      pipeline_id: newPipelineId || null,
      initial_stage_id: newStageId || null,
    });
    if (!error) {
      setNewName("");
      setNewCourse("");
      setNewPipelineId("");
      setNewStageId("");
      setShowForm(false);
      load();
      toast.success("Webhook criado!");
    } else {
      toast.error("Erro ao criar webhook");
    }
    setCreating(false);
  };

  const remove = async (id: string) => {
    await (supabase as any).from("webhook_endpoints").delete().eq("id", id);
    load();
    toast.success("Webhook removido");
  };

  const toggleActive = async (ep: Endpoint) => {
    await (supabase as any)
      .from("webhook_endpoints")
      .update({ active: !ep.active })
      .eq("id", ep.id);
    load();
  };

  const loadLeads = async (endpointId: string) => {
    if (leads[endpointId]) return;
    setLeadsLoading(endpointId);
    const { data } = await (supabase as any)
      .from("webhook_leads")
      .select("id, created_at, raw_data, contact_id")
      .eq("webhook_endpoint_id", endpointId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setLeads(prev => ({ ...prev, [endpointId]: data }));
    setLeadsLoading(null);
  };

  const toggle = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadLeads(id);
    }
  };

  const G = "rgba(185,255,75,";
  const accent = "#B9FF4B";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Webhooks</h2>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Conecte formulários do Forminator e receba leads direto no CRM
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{ background: accent, color: "#07080A" }}>
          <Plus className="w-4 h-4" /> Novo Webhook
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl p-5 space-y-4"
          style={{ background: "rgba(185,255,75,0.04)", border: `1px solid ${G}0.15)` }}>
          <p className="text-sm font-semibold" style={{ color: accent }}>Novo endpoint de webhook</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>
                Nome *
              </label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ex: Leads Curso Excel"
                className="w-full rounded-xl px-4 py-2.5 text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>
                Curso (opcional)
              </label>
              <input
                value={newCourse}
                onChange={e => setNewCourse(e.target.value)}
                placeholder="Ex: Excel Avançado"
                className="w-full rounded-xl px-4 py-2.5 text-sm"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }}
              />
            </div>
          </div>
          {/* Pipeline routing */}
          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>
              Funil de destino (opcional)
            </label>
            <div className="flex gap-2 flex-wrap">
              {PIPELINE_OPTIONS.map(p => (
                <button key={p.id} onClick={() => { setNewPipelineId(p.id); setNewStageId(""); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={newPipelineId === p.id
                    ? { background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }
                    : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {p.label}
                </button>
              ))}
            </div>
            {newPipelineId && (() => {
              const pipeline = PIPELINE_OPTIONS.find(p => p.id === newPipelineId);
              if (!pipeline || !("stages" in pipeline)) return null;
              return (
                <div className="mt-2">
                  <label className="text-[10px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Etapa inicial
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {pipeline.stages.map(s => (
                      <button key={s.id} onClick={() => setNewStageId(s.id)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                        style={newStageId === s.id
                          ? { background: "rgba(100,116,139,0.3)", color: "#94A3B8", border: "1px solid rgba(100,116,139,0.5)" }
                          : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
              Cancelar
            </button>
            <button onClick={create} disabled={creating || !newName.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
              style={{ background: accent, color: "#07080A" }}>
              {creating ? "Criando..." : "Criar webhook"}
            </button>
          </div>
        </div>
      )}

      {/* Endpoints list */}
      {loading ? (
        <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>
          <div className="h-6 w-6 rounded-full border-2 animate-spin mx-auto mb-3" style={{ borderColor: accent, borderTopColor: "transparent" }} />
          Carregando webhooks...
        </div>
      ) : endpoints.length === 0 ? (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <Webhook className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Nenhum webhook criado</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Crie um webhook e configure no Forminator</p>
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map(ep => (
            <div key={ep.id} className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>

              {/* Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{ep.name}</span>
                      {ep.course_name && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${G}0.1)`, color: accent }}>
                          {ep.course_name}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ep.active ? "" : "opacity-50"}`}
                        style={{ background: ep.active ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.06)", color: ep.active ? "#34D399" : "rgba(255,255,255,0.4)" }}>
                        {ep.active ? "Ativo" : "Pausado"}
                      </span>
                    </div>

                    {/* URL */}
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-[10px] px-3 py-1.5 rounded-lg flex-1 truncate font-mono"
                        style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        {webhookUrl(ep.token)}
                      </code>
                      <button onClick={() => copyUrl(ep.token)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all"
                        style={{ background: `${G}0.1)`, color: accent, border: `1px solid ${G}0.2)` }}>
                        <Copy className="w-3 h-3" /> Copiar
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {ep.trigger_count} leads recebidos
                      </span>
                      {ep.last_triggered_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Último: {new Date(ep.last_triggered_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(ep)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {ep.active ? "Pausar" : "Ativar"}
                    </button>
                    <button onClick={() => remove(ep.id)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#F87171")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggle(ep.id)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ color: "rgba(255,255,255,0.4)" }}>
                      {expandedId === ep.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Leads log */}
              {expandedId === ep.id && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="px-5 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Últimos leads recebidos
                    </p>
                    {leadsLoading === ep.id ? (
                      <div className="text-xs py-4 text-center" style={{ color: "rgba(255,255,255,0.3)" }}>Carregando...</div>
                    ) : !leads[ep.id]?.length ? (
                      <div className="text-xs py-4 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>Nenhum lead recebido ainda</div>
                    ) : (
                      <div className="space-y-2">
                        {leads[ep.id].map(lead => {
                          const raw = lead.raw_data as Record<string, unknown>;
                          const name = raw.nome ?? raw.name ?? raw.first_name ?? "–";
                          const email = raw.email ?? raw["e-mail"] ?? raw.email_address ?? "–";
                          const phone = raw.telefone ?? raw.phone ?? raw.celular ?? raw.whatsapp ?? "–";
                          return (
                            <div key={lead.id} className="flex items-center gap-4 px-3 py-2.5 rounded-xl text-xs"
                              style={{ background: "rgba(255,255,255,0.03)" }}>
                              <div className="flex-1 grid grid-cols-3 gap-3">
                                <span style={{ color: "rgba(255,255,255,0.7)" }}>{String(name)}</span>
                                <span style={{ color: "rgba(255,255,255,0.4)" }}>{String(email)}</span>
                                <span style={{ color: "rgba(255,255,255,0.4)" }}>{String(phone)}</span>
                              </div>
                              <span className="flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
                                {new Date(lead.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {lead.contact_id && (
                                <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full"
                                  style={{ background: `${G}0.1)`, color: accent }}>
                                  no CRM
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Forminator instructions */}
                  <div className="px-5 pb-5">
                    <div className="rounded-xl p-4 mt-2" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="text-[11px] font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Como configurar no Forminator</p>
                      <ol className="text-[11px] space-y-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                        <li>1. No WordPress, abra o formulário do curso no Forminator</li>
                        <li>2. Vá em <strong style={{ color: "rgba(255,255,255,0.55)" }}>Integrações → Webhook</strong></li>
                        <li>3. Cole a URL acima no campo de endpoint</li>
                        <li>4. Método: <strong style={{ color: "rgba(255,255,255,0.55)" }}>POST</strong> · Formato: <strong style={{ color: "rgba(255,255,255,0.55)" }}>JSON</strong></li>
                        <li>5. Salve — os leads chegam aqui automaticamente</li>
                      </ol>
                      <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                        Campos detectados automaticamente: nome, email, telefone, empresa
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
