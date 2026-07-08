import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Copy, Code2, Trash2, Link2, Eye, X, CheckCircle2, FileInput } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = "https://proldgiyterqhthludlp.supabase.co";
const APP_URL = "https://www.caluagencia.com.br";

// Pipelines disponíveis por workspace (espelha WebhooksTab/LeadsKanbanTab)
const GENERIC = [
  { id: "leads", label: "Funil de Leads", stages: [
    { id: "novo", name: "Novo" }, { id: "contato", name: "Em contato" },
    { id: "proposta", name: "Proposta" }, { id: "negociacao", name: "Negociação" },
    { id: "cliente", name: "Cliente" },
  ]},
];
const ABCER = [
  { id: "usineiros", label: "Usineiros", stages: [
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
const pipelinesFor = (clientId: string) => (clientId === "abcer" ? ABCER : GENERIC);

interface FormEndpoint {
  id: string;
  name: string;
  token: string;
  pipeline_id: string | null;
  initial_stage_id: string | null;
  active: boolean;
  trigger_count: number;
  created_at: string;
}

// ── Campos padrão que o webhook-receiver reconhece automaticamente ──
const FORM_FIELDS = [
  { name: "nome",     label: "Seu nome",           type: "text",     required: true  },
  { name: "email",    label: "Seu e-mail",         type: "email",    required: false },
  { name: "telefone", label: "WhatsApp / Telefone", type: "tel",      required: false },
  { name: "empresa",  label: "Empresa (opcional)", type: "text",     required: false },
  { name: "mensagem", label: "Mensagem (opcional)", type: "textarea", required: false },
];

const webhookUrl = (token: string) => `${SUPABASE_URL}/functions/v1/webhook-receiver?token=${token}`;
const hostedUrl  = (token: string) => `${APP_URL}/f/${token}`;

// ── Gera o snippet HTML self-contained pra colar na landing page ──
function buildSnippet(ep: FormEndpoint, accent: string): string {
  const inputs = FORM_FIELDS.map(f => {
    const base = `name="${f.name}" placeholder="${f.label}"${f.required ? " required" : ""} style="width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #d9d9e3;border-radius:10px;font-size:15px;font-family:inherit;background:#fff;color:#111"`;
    return f.type === "textarea"
      ? `    <textarea ${base} rows="3"></textarea>`
      : `    <input type="${f.type}" ${base} />`;
  }).join("\n");

  return `<!-- Formulário Calu — captação para o CRM · ${ep.name} -->
<form id="calu-form" style="max-width:440px;margin:0 auto;display:flex;flex-direction:column;gap:12px;font-family:system-ui,-apple-system,sans-serif">
${inputs}
    <input type="hidden" name="source" value="${ep.name.replace(/"/g, "'")}" />
    <button type="submit" style="padding:14px;border:0;border-radius:10px;background:${accent};color:#07080A;font-weight:700;font-size:15px;cursor:pointer">Enviar</button>
    <p id="calu-ok" style="display:none;text-align:center;color:#16a34a;font-weight:600;font-size:14px;margin:4px 0 0">Recebido! Em breve entraremos em contato. ✅</p>
</form>
<script>
(function(){
  var f=document.getElementById('calu-form');
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var b={};new FormData(f).forEach(function(v,k){b[k]=v});
    var btn=f.querySelector('button');btn.disabled=true;var t=btn.textContent;btn.textContent='Enviando...';
    fetch('${webhookUrl(ep.token)}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)})
      .then(function(r){return r.json()})
      .then(function(){f.querySelectorAll('input,textarea,button').forEach(function(el){el.style.display='none'});document.getElementById('calu-ok').style.display='block';})
      .catch(function(){btn.disabled=false;btn.textContent=t;alert('Erro ao enviar. Tente novamente.');});
  });
})();
</script>`;
}

interface Props { clientId: string; accent?: string }

export default function FormGenerator({ clientId, accent = "#B9FF4B" }: Props) {
  const pipelines = pipelinesFor(clientId);
  const [endpoints, setEndpoints] = useState<FormEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [pipelineId, setPipelineId] = useState(pipelines[0]?.id ?? "");
  const [stageId, setStageId] = useState(pipelines[0]?.stages[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [embedOf, setEmbedOf] = useState<FormEndpoint | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("webhook_endpoints")
      .select("id, name, token, pipeline_id, initial_stage_id, active, trigger_count, created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (data) setEndpoints(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }
    const { error } = await (supabase as any).from("webhook_endpoints").insert({
      user_id: session.user.id,
      client_id: clientId,
      name: name.trim(),
      pipeline_id: pipelineId || null,
      initial_stage_id: stageId || null,
    });
    if (error) { toast.error("Erro ao criar formulário"); }
    else {
      toast.success("Formulário criado!");
      setName(""); setShowNew(false);
      load();
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    await (supabase as any).from("webhook_endpoints").delete().eq("id", id);
    setEndpoints(prev => prev.filter(e => e.id !== id));
    toast.success("Formulário removido");
  };

  const copy = (text: string, msg: string) => { navigator.clipboard.writeText(text); toast.success(msg); };

  const card = "rgba(255,255,255,0.025)";
  const border = "rgba(255,255,255,0.07)";
  const activePipe = pipelines.find(p => p.id === pipelineId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Captação — Formulários</h2>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Gere formulários pra colar nas suas landing pages — cada envio vira um lead no funil
          </p>
        </div>
        <button onClick={() => setShowNew(v => !v)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold"
          style={{ background: accent, color: "#07080A" }}>
          <Plus className="w-3.5 h-3.5" /> Novo formulário
        </button>
      </div>

      {/* New form */}
      {showNew && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: `${accent}08`, border: `1px solid ${accent}25` }}>
          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>Nome do formulário *</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              placeholder="Ex: LP Black Friday, Formulário do site…"
              className="w-full rounded-xl px-4 py-2.5 text-sm"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F0F0F0", outline: "none" }} />
          </div>
          {/* Pipeline + stage */}
          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.4)" }}>Funil de destino</label>
            <div className="flex gap-2 flex-wrap">
              {pipelines.map(p => (
                <button key={p.id} onClick={() => { setPipelineId(p.id); setStageId(p.stages[0]?.id ?? ""); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={pipelineId === p.id
                    ? { background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }
                    : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {p.label}
                </button>
              ))}
            </div>
            {activePipe && (
              <div className="mt-2.5">
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.3)" }}>Etapa de entrada</label>
                <div className="flex gap-1.5 flex-wrap">
                  {activePipe.stages.map(s => (
                    <button key={s.id} onClick={() => setStageId(s.id)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                      style={stageId === s.id
                        ? { background: "rgba(100,116,139,0.3)", color: "#94A3B8", border: "1px solid rgba(100,116,139,0.5)" }
                        : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>Cancelar</button>
            <button onClick={create} disabled={saving || !name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40" style={{ background: accent, color: "#07080A" }}>
              {saving ? "Criando…" : "Criar formulário"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>Carregando…</div>
      ) : endpoints.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <FileInput className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Nenhum formulário ainda</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>Crie um pra captar leads das suas landing pages</p>
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map(ep => (
            <div key={ep.id} className="rounded-2xl p-4" style={{ background: card, border: `1px solid ${border}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{ep.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: ep.active ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.06)", color: ep.active ? "#34D399" : "rgba(255,255,255,0.4)" }}>
                      {ep.active ? "Ativo" : "Pausado"}
                    </span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{ep.trigger_count} leads</span>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {ep.pipeline_id ? `Funil: ${ep.pipeline_id} · etapa ${ep.initial_stage_id ?? "—"}` : "Sem funil (só contatos)"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setEmbedOf(ep)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
                    <Code2 className="w-3.5 h-3.5" /> Gerar formulário
                  </button>
                  <button onClick={() => remove(ep.id)} className="p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.3)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#F87171")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embed modal */}
      {embedOf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={e => { if (e.target === e.currentTarget) setEmbedOf(null); }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 space-y-5 overflow-y-auto max-h-[90vh]"
            style={{ background: "#0D0D1A", border: `1px solid ${accent}30` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Formulário: {embedOf.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Cada envio cria um lead no funil</p>
              </div>
              <button onClick={() => setEmbedOf(null)} style={{ color: "rgba(255,255,255,0.3)" }}><X className="w-4 h-4" /></button>
            </div>

            {/* Preview */}
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                <Eye className="w-3 h-3" /> Prévia
              </p>
              <div className="rounded-xl p-4" style={{ background: "#F2F1EE" }}>
                <div style={{ maxWidth: 380, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
                  {FORM_FIELDS.map(f => f.type === "textarea" ? (
                    <textarea key={f.name} placeholder={f.label} rows={2} disabled
                      style={{ padding: "10px 12px", border: "1px solid #d9d9e3", borderRadius: 10, fontSize: 14, background: "#fff", color: "#333" }} />
                  ) : (
                    <input key={f.name} placeholder={f.label} disabled
                      style={{ padding: "10px 12px", border: "1px solid #d9d9e3", borderRadius: 10, fontSize: 14, background: "#fff", color: "#333" }} />
                  ))}
                  <div style={{ padding: 12, borderRadius: 10, background: accent, color: "#07080A", fontWeight: 700, fontSize: 14, textAlign: "center" }}>Enviar</div>
                </div>
              </div>
            </div>

            {/* Hosted link */}
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                <Link2 className="w-3 h-3" /> Link direto (página hospedada)
              </p>
              <div className="flex items-center gap-2">
                <code className="text-[11px] px-3 py-2 rounded-lg flex-1 truncate font-mono"
                  style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.06)" }}>{hostedUrl(embedOf.token)}</code>
                <button onClick={() => copy(hostedUrl(embedOf.token), "Link copiado!")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold flex-shrink-0"
                  style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}><Copy className="w-3 h-3" /> Copiar</button>
              </div>
            </div>

            {/* Embed code */}
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                <Code2 className="w-3 h-3" /> Código pra colar na landing page
              </p>
              <pre className="text-[10px] p-3 rounded-lg overflow-x-auto font-mono leading-relaxed"
                style={{ background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.06)", maxHeight: 220 }}>{buildSnippet(embedOf, accent)}</pre>
              <button onClick={() => copy(buildSnippet(embedOf, accent), "Código copiado! Cole na sua landing page.")}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: accent, color: "#07080A" }}><Copy className="w-4 h-4" /> Copiar código do formulário</button>
              <p className="text-[10px] mt-2 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                <CheckCircle2 className="w-3 h-3" style={{ color: "#34D399" }} /> Funciona em qualquer site: WordPress, Wix, HTML, etc.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
