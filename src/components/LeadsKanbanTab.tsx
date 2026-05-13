import { useState, useEffect } from "react";
import { Plus, X, User, Mail, Phone, DollarSign, Trash2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────

interface LeadCard {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  stage: string;        // maps to stage_id in DB
  pipelineId: string;   // maps to pipeline_id in DB
  value?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  source: string;
  // Usineiro
  cnpj?: string;
  potenciaKw?: string;
  distribuidora?: string;
  // Associado
  uc?: string;
  consumoMedio?: string;
  metodo?: string;
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
}

// ── Stage definitions ──────────────────────────────────────────

const ABCER_PIPELINES: Pipeline[] = [
  {
    id: "usineiros",
    name: "Usineiros",
    description: "Donos de usinas — B2B, alto valor",
    stages: [
      { id: "prospeccao",  name: "Prospecção",      color: "#64748B" },
      { id: "contato",     name: "Contato inicial",  color: "#3B82F6" },
      { id: "visita",      name: "Visita técnica",   color: "#8B5CF6" },
      { id: "proposta",    name: "Proposta",         color: "#F59E0B" },
      { id: "negociacao",  name: "Negociação",       color: "#F97316" },
      { id: "contrato",    name: "Contrato",         color: "#10B981" },
      { id: "onboarding",  name: "Onboarding",       color: "#B9FF4B" },
    ],
  },
  {
    id: "associados",
    name: "Associados",
    description: "Usuários finais — B2C, alto volume",
    stages: [
      { id: "lead",          name: "Lead captado",       color: "#64748B" },
      { id: "simulacao",     name: "Simulação feita",    color: "#3B82F6" },
      { id: "cadastro",      name: "Cadastro iniciado",  color: "#8B5CF6" },
      { id: "documentacao",  name: "Doc. pendente",      color: "#F59E0B" },
      { id: "analise",       name: "Análise",            color: "#F97316" },
      { id: "ativo",         name: "Ativo",              color: "#10B981" },
    ],
  },
];

const GENERIC_PIPELINE: Pipeline[] = [
  {
    id: "leads",
    name: "Funil de Leads",
    description: "Leads e oportunidades",
    stages: [
      { id: "novo",       name: "Novo",       color: "#64748B" },
      { id: "contato",    name: "Em contato", color: "#3B82F6" },
      { id: "proposta",   name: "Proposta",   color: "#F59E0B" },
      { id: "negociacao", name: "Negociação", color: "#F97316" },
      { id: "cliente",    name: "Cliente",    color: "#10B981" },
    ],
  },
];

// ── DB row → LeadCard ──────────────────────────────────────────

function rowToLead(r: Record<string, unknown>): LeadCard {
  return {
    id:           String(r.id),
    name:         String(r.name ?? ""),
    company:      r.company  ? String(r.company)  : undefined,
    email:        r.email    ? String(r.email)    : undefined,
    phone:        r.phone    ? String(r.phone)    : undefined,
    stage:        String(r.stage_id ?? ""),
    pipelineId:   String(r.pipeline_id ?? ""),
    value:        r.value    ? String(r.value)    : undefined,
    notes:        r.notes    ? String(r.notes)    : undefined,
    tags:         Array.isArray(r.tags) ? r.tags as string[] : [],
    cnpj:         r.cnpj          ? String(r.cnpj)          : undefined,
    potenciaKw:   r.potencia_kw   ? String(r.potencia_kw)   : undefined,
    distribuidora:r.distribuidora ? String(r.distribuidora) : undefined,
    uc:           r.uc            ? String(r.uc)            : undefined,
    consumoMedio: r.consumo_medio ? String(r.consumo_medio) : undefined,
    metodo:       r.metodo        ? String(r.metodo)        : undefined,
    source:       String(r.source ?? "manual"),
    createdAt:    r.created_at
      ? new Date(String(r.created_at)).toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR"),
  };
}

// ── Component ──────────────────────────────────────────────────

interface Props {
  clientId: string;
  clientColor: string;
}

export default function LeadsKanbanTab({ clientId, clientColor }: Props) {
  const pipelines = clientId === "abcer" ? ABCER_PIPELINES : GENERIC_PIPELINE;

  const [activePipeline, setActivePipeline] = useState(pipelines[0]?.id ?? "");
  const [leads, setLeads]     = useState<LeadCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNewLead, setShowNewLead] = useState<string | null>(null); // stageId
  const [selectedLead, setSelectedLead] = useState<LeadCard | null>(null);
  const [form, setForm] = useState<Partial<LeadCard>>({});
  const [saving, setSaving] = useState(false);

  const pipeline = pipelines.find(p => p.id === activePipeline)!;
  const isUsineiro  = activePipeline === "usineiros";
  const isAssociado = activePipeline === "associados";

  // ── Load leads ───────────────────────────────────────────────

  const loadLeads = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("client_leads")
      .select("*")
      .eq("client_id", clientId)
      .eq("pipeline_id", activePipeline)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar leads");
    if (data) setLeads((data as Record<string, unknown>[]).map(rowToLead));
    setLoading(false);
  };

  useEffect(() => { loadLeads(); }, [clientId, activePipeline]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save new lead ────────────────────────────────────────────

  const saveLead = async () => {
    if (!form.name?.trim() || !showNewLead) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    const { data, error } = await (supabase as any).from("client_leads").insert({
      user_id:       session.user.id,
      client_id:     clientId,
      pipeline_id:   activePipeline,
      stage_id:      showNewLead,
      name:          form.name.trim(),
      company:       form.company?.trim()      || null,
      email:         form.email?.trim()        || null,
      phone:         form.phone?.trim()        || null,
      value:         form.value?.trim()        || null,
      notes:         form.notes?.trim()        || null,
      cnpj:          form.cnpj?.trim()         || null,
      potencia_kw:   form.potenciaKw?.trim()   || null,
      distribuidora: form.distribuidora?.trim() || null,
      uc:            form.uc?.trim()           || null,
      consumo_medio: form.consumoMedio?.trim() || null,
      metodo:        form.metodo?.trim()       || null,
      source:        "manual",
    }).select().single();

    if (error) { toast.error("Erro ao salvar lead"); }
    else {
      setLeads(prev => [rowToLead(data as Record<string, unknown>), ...prev]);
      toast.success("Lead adicionado!");
    }
    setForm({});
    setShowNewLead(null);
    setSaving(false);
  };

  // ── Move lead ────────────────────────────────────────────────

  const moveLead = async (leadId: string, targetStageId: string) => {
    const { error } = await (supabase as any)
      .from("client_leads")
      .update({ stage_id: targetStageId })
      .eq("id", leadId);
    if (error) { toast.error("Erro ao mover lead"); return; }
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: targetStageId } : l));
    setSelectedLead(prev => prev?.id === leadId ? { ...prev, stage: targetStageId } : prev);
  };

  // ── Delete lead ──────────────────────────────────────────────

  const deleteLead = async (leadId: string) => {
    const { error } = await (supabase as any).from("client_leads").delete().eq("id", leadId);
    if (error) { toast.error("Erro ao excluir lead"); return; }
    setLeads(prev => prev.filter(l => l.id !== leadId));
    setSelectedLead(null);
    toast.success("Lead removido");
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Funil de Leads</h2>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{pipeline.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadLeads} className="p-2 rounded-lg transition-all"
            style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: `${clientColor}15`, color: clientColor, border: `1px solid ${clientColor}30` }}>
            {leads.length} leads
          </span>
          <button onClick={() => { setShowNewLead(pipeline.stages[0]?.id ?? null); setForm({}); }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: clientColor, color: "#07080A" }}>
            <Plus className="w-3.5 h-3.5" /> Novo Lead
          </button>
        </div>
      </div>

      {/* Pipeline tabs */}
      {pipelines.length > 1 && (
        <div className="flex gap-1.5">
          {pipelines.map(p => {
            const count = leads.filter(l => l.pipelineId === p.id).length;
            const active = p.id === activePipeline;
            return (
              <button key={p.id} onClick={() => setActivePipeline(p.id)}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={active
                  ? { background: `${clientColor}20`, color: clientColor, border: `1px solid ${clientColor}40` }
                  : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {p.name}
                <span className="ml-2 opacity-60 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {pipeline.stages.map(stage => {
          const count = leads.filter(l => l.stage === stage.id).length;
          return (
            <div key={stage.id} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
              <span className="text-[10px] whitespace-nowrap" style={{ color: "rgba(255,255,255,0.4)" }}>{stage.name}</span>
              <span className="text-[10px] font-semibold" style={{ color: count > 0 ? stage.color : "rgba(255,255,255,0.2)" }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.2)" }} />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
          {pipeline.stages.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage.id);
            return (
              <div key={stage.id} className="flex-shrink-0 w-56 space-y-2">

                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                    <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${stage.color}20`, color: stage.color }}>
                      {stageLeads.length}
                    </span>
                    <button onClick={() => { setShowNewLead(stage.id); setForm({}); }}
                      className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                      onMouseEnter={e => { e.currentTarget.style.color = clientColor; e.currentTarget.style.background = `${clientColor}15`; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "transparent"; }}>
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {stageLeads.map(lead => (
                    <motion.div key={lead.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSelectedLead(lead)}
                      className="rounded-xl p-3 cursor-pointer transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${stage.color}40`; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
                      <p className="text-xs font-semibold leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>{lead.name}</p>
                      {(lead.company || lead.uc) && (
                        <p className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {lead.company ?? `UC: ${lead.uc}`}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        {lead.value ? (
                          <span className="text-[10px] font-semibold" style={{ color: "#10B981" }}>R$ {lead.value}</span>
                        ) : lead.potenciaKw ? (
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{lead.potenciaKw} kW</span>
                        ) : lead.consumoMedio ? (
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{lead.consumoMedio} kWh/mês</span>
                        ) : <span />}
                        <div className="flex items-center gap-1">
                          {lead.source === "webhook" && (
                            <span className="text-[9px] px-1 py-0.5 rounded font-medium"
                              style={{ background: `${clientColor}15`, color: clientColor }}>auto</span>
                          )}
                          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{lead.createdAt}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Empty column */}
                  {stageLeads.length === 0 && (
                    <button onClick={() => { setShowNewLead(stage.id); setForm({}); }}
                      className="w-full rounded-xl py-5 flex flex-col items-center gap-1.5 transition-all"
                      style={{ border: "1px dashed rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.2)" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${stage.color}40`; e.currentTarget.style.color = stage.color; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.2)"; }}>
                      <Plus className="w-4 h-4" />
                      <span className="text-[10px]">Adicionar lead</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Novo Lead ──────────────────────────────────── */}
      <AnimatePresence>
        {showNewLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) { setShowNewLead(null); setForm({}); } }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl p-6 space-y-4 overflow-y-auto max-h-[90vh]"
              style={{ background: "#0D0D1A", border: `1px solid ${clientColor}30` }}>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Novo Lead</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {pipeline.stages.find(s => s.id === showNewLead)?.name} · {pipeline.name}
                  </p>
                </div>
                <button onClick={() => { setShowNewLead(null); setForm({}); }} style={{ color: "rgba(255,255,255,0.3)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stage selector */}
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Etapa</label>
                <div className="flex gap-1.5 flex-wrap">
                  {pipeline.stages.map(s => (
                    <button key={s.id} onClick={() => setShowNewLead(s.id)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                      style={showNewLead === s.id
                        ? { background: `${s.color}25`, color: s.color, border: `1px solid ${s.color}50` }
                        : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Common fields */}
              <div className="space-y-2.5">
                {([
                  { key: "name",  label: "Nome *",     icon: User },
                  { key: "email", label: "E-mail",     icon: Mail },
                  { key: "phone", label: "Telefone",   icon: Phone },
                  { key: "value", label: "Valor (R$)", icon: DollarSign },
                ] as { key: keyof LeadCard; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
                  <div key={key}>
                    <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
                      <input value={(form as Record<string, string>)[key] ?? ""}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                    </div>
                  </div>
                ))}

                {/* Usineiro fields */}
                {isUsineiro && (
                  <>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Empresa / Usina</label>
                      <input value={form.company ?? ""} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Potência (kW)</label>
                        <input value={form.potenciaKw ?? ""} onChange={e => setForm(f => ({ ...f, potenciaKw: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl text-sm"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Distribuidora</label>
                        <input value={form.distribuidora ?? ""} onChange={e => setForm(f => ({ ...f, distribuidora: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl text-sm"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>CNPJ</label>
                      <input value={form.cnpj ?? ""} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-sm"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                    </div>
                  </>
                )}

                {/* Associado fields */}
                {isAssociado && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>UC</label>
                        <input value={form.uc ?? ""} onChange={e => setForm(f => ({ ...f, uc: e.target.value }))}
                          placeholder="Unidade consumidora"
                          className="w-full px-3 py-2.5 rounded-xl text-sm"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Consumo médio (kWh)</label>
                        <input value={form.consumoMedio ?? ""} onChange={e => setForm(f => ({ ...f, consumoMedio: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl text-sm"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Pagamento preferido</label>
                      <div className="flex gap-1.5">
                        {["PIX", "Boleto", "Cartão"].map(m => (
                          <button key={m} onClick={() => setForm(f => ({ ...f, metodo: m }))}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                            style={form.metodo === m
                              ? { background: `${clientColor}20`, color: clientColor, border: `1px solid ${clientColor}40` }
                              : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Notas</label>
                  <textarea value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#F0F0F0" }} />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => { setShowNewLead(null); setForm({}); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  Cancelar
                </button>
                <button onClick={saveLead} disabled={!form.name?.trim() || saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                  style={{ background: clientColor, color: "#07080A" }}>
                  {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando…</> : "Adicionar lead"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lead detail panel ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedLead(null); }}>
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-5 overflow-y-auto max-h-[90vh]"
              style={{ background: "#0D0D1A", border: "1px solid rgba(255,255,255,0.1)" }}>

              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">{selectedLead.name}</h3>
                  {selectedLead.company && (
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{selectedLead.company}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: `${pipeline.stages.find(s => s.id === selectedLead.stage)?.color ?? "#64748B"}20`,
                        color: pipeline.stages.find(s => s.id === selectedLead.stage)?.color ?? "#64748B",
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: pipeline.stages.find(s => s.id === selectedLead.stage)?.color }} />
                      {pipeline.stages.find(s => s.id === selectedLead.stage)?.name}
                    </span>
                    {selectedLead.source === "webhook" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{ background: `${clientColor}15`, color: clientColor }}>via webhook</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => deleteLead(selectedLead.id)}
                    className="p-1.5 rounded-lg transition-all" style={{ color: "rgba(255,255,255,0.3)" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#F87171"; e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "transparent"; }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSelectedLead(null)} style={{ color: "rgba(255,255,255,0.3)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1.5">
                {[
                  { label: "E-mail",        value: selectedLead.email },
                  { label: "Telefone",      value: selectedLead.phone },
                  { label: "Valor",         value: selectedLead.value ? `R$ ${selectedLead.value}` : undefined },
                  { label: "CNPJ",          value: selectedLead.cnpj },
                  { label: "Potência",      value: selectedLead.potenciaKw ? `${selectedLead.potenciaKw} kW` : undefined },
                  { label: "Distribuidora", value: selectedLead.distribuidora },
                  { label: "UC",            value: selectedLead.uc },
                  { label: "Consumo médio", value: selectedLead.consumoMedio ? `${selectedLead.consumoMedio} kWh/mês` : undefined },
                  { label: "Pagamento",     value: selectedLead.metodo },
                  { label: "Adicionado",    value: selectedLead.createdAt },
                ].filter(f => f.value).map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
                    <span className="text-xs text-right max-w-[60%]" style={{ color: "rgba(255,255,255,0.7)" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Notas</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{selectedLead.notes}</p>
                </div>
              )}

              {/* Move stage */}
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Mover para etapa</p>
                <div className="flex gap-1.5 flex-wrap">
                  {pipeline.stages.map(s => (
                    <button key={s.id} onClick={() => moveLead(selectedLead.id, s.id)}
                      disabled={s.id === selectedLead.stage}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all disabled:opacity-30"
                      style={s.id === selectedLead.stage
                        ? { background: `${s.color}25`, color: s.color, border: `1px solid ${s.color}50` }
                        : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
