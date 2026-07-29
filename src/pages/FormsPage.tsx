import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Copy, Trash2, Pencil, X, Check, FormInput,
  Code2, Users, ToggleLeft, ToggleRight, Loader2, RefreshCw,
  ArrowUp, ArrowDown, Type, AlignLeft, Mail, Phone, List,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormField {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  required: boolean;
  placeholder: string;
  enabled: boolean;
  custom?: boolean;
  options?: string[];
}

interface FormSettings {
  title: string;
  button_text: string;
  success_message: string;
  source: string;
}

interface CRMForm {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  fields: FormField[];
  settings: FormSettings;
  active: boolean;
  submissions_count: number;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://proldgiyterqhthludlp.supabase.co";
const SUBMIT_FN = `${SUPABASE_URL}/functions/v1/lp-form-submit`;
const ACCENT = "#B9FF4B";
const s = (o = 1) => `rgba(255,255,255,${o})`;

const DEFAULT_FIELDS: FormField[] = [
  { key: "name",    label: "Nome",     type: "text",     required: true,  placeholder: "Seu nome completo", enabled: true },
  { key: "email",   label: "E-mail",   type: "email",    required: false, placeholder: "seu@email.com",    enabled: true },
  { key: "phone",   label: "Telefone", type: "tel",      required: false, placeholder: "(00) 00000-0000",  enabled: true },
  { key: "company", label: "Empresa",  type: "text",     required: false, placeholder: "Nome da empresa",  enabled: false },
  { key: "message", label: "Mensagem", type: "textarea", required: false, placeholder: "Como podemos ajudar?", enabled: false },
];

const DEFAULT_SETTINGS: FormSettings = {
  title: "",
  button_text: "Enviar",
  success_message: "Obrigado! Entraremos em contato em breve.",
  source: "formulario",
};

// ── Embed generator ──────────────────────────────────────────────────────────

function generateEmbed(form: CRMForm, userId: string): string {
  const activeFields = form.fields.filter((f) => f.enabled);
  const cfg = {
    uid: userId,
    cid: form.client_id ?? "",
    fid: form.id,
    fields: activeFields.map((f) => ({
      key: f.key, label: f.label, type: f.type,
      ph: f.placeholder, req: f.required,
      ...(f.type === "select" && f.options ? { opts: f.options } : {}),
    })),
    btn: form.settings.button_text || "Enviar",
    ok: form.settings.success_message || "Obrigado!",
    src: form.settings.source || "formulario",
  };

  const script = `(function(){
var cfg=${JSON.stringify(cfg)};
var E="${SUBMIT_FN}";
var w=document.getElementById("calu-form-"+cfg.fid);if(!w)return;
var f=document.createElement("form"),b=document.createElement("button");
b.type="submit";b.textContent=cfg.btn;
cfg.fields.forEach(function(x){
  var g=document.createElement("div");
  var l=document.createElement("label");l.textContent=x.label+(x.req?" *":"");
  var i;
  if(x.type==="textarea"){i=document.createElement("textarea");}
  else if(x.type==="select"){
    i=document.createElement("select");i.name=x.key;
    (x.opts||[]).forEach(function(o){var op=document.createElement("option");op.value=o;op.textContent=o;i.appendChild(op);});
    g.appendChild(l);g.appendChild(i);f.appendChild(g);return;
  } else {i=document.createElement("input");i.type=x.type;}
  i.name=x.key;i.placeholder=x.ph||x.label;if(x.req)i.required=true;
  g.appendChild(l);g.appendChild(i);f.appendChild(g);
});
f.appendChild(b);
var m=document.createElement("p");m.style.display="none";m.textContent=cfg.ok;
f.onsubmit=function(e){
  e.preventDefault();b.disabled=true;b.textContent="Enviando...";
  var d={user_id:cfg.uid,client_id:cfg.cid||null,source:cfg.src,form_id:cfg.fid};
  cfg.fields.forEach(function(x){var el=f.elements[x.key];if(el)d[x.key]=el.value;});
  fetch(E,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)})
    .then(function(r){return r.json();})
    .then(function(r){if(r.ok){f.style.display="none";m.style.display="block";}else{b.disabled=false;b.textContent=cfg.btn;alert("Erro: "+(r.error||"Tente novamente."));}})
    .catch(function(){b.disabled=false;b.textContent=cfg.btn;alert("Erro de conexão. Tente novamente.");});
};
w.appendChild(f);w.appendChild(m);
})();`;

  return `<!-- Formulário: ${form.name} -->\n<div id="calu-form-${form.id}"></div>\n<script>\n${script}\n</script>`;
}

// ── Form Builder ─────────────────────────────────────────────────────────────

interface BuilderProps {
  initial?: CRMForm | null;
  onSave: (data: Partial<CRMForm>) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function FormBuilder({ initial, onSave, onClose, saving }: BuilderProps) {
  const [name, setName]             = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [clientId, setClientId]     = useState(initial?.client_id ?? "");
  const [fields, setFields]         = useState<FormField[]>(initial?.fields ?? DEFAULT_FIELDS);
  const [settings, setSettings]     = useState<FormSettings>(initial?.settings ?? DEFAULT_SETTINGS);
  const [tab, setTab]               = useState<"fields" | "settings">("fields");
  const [addingField, setAddingField] = useState(false);
  const [newLabel, setNewLabel]     = useState("");
  const [newType, setNewType]       = useState<FormField["type"]>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newPlaceholder, setNewPlaceholder] = useState("");
  const [newOptions, setNewOptions] = useState("");

  const toggleField = (key: string) =>
    setFields(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));

  const setFieldProp = (key: string, prop: keyof FormField, val: string | boolean | string[]) =>
    setFields(prev => prev.map(f => f.key === key ? { ...f, [prop]: val } : f));

  const moveField = (key: string, dir: -1 | 1) => {
    setFields(prev => {
      const idx = prev.findIndex(f => f.key === key);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  const removeCustomField = (key: string) =>
    setFields(prev => prev.filter(f => f.key !== key));

  const slugify = (str: string) =>
    "custom_" + str.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").slice(0, 30) + "_" + Date.now();

  const confirmAddField = () => {
    if (!newLabel.trim()) return;
    const opts = newType === "select" ? newOptions.split(",").map(o => o.trim()).filter(Boolean) : undefined;
    setFields(prev => [...prev, {
      key: slugify(newLabel),
      label: newLabel.trim(),
      type: newType,
      required: newRequired,
      placeholder: newPlaceholder.trim() || newLabel.trim(),
      enabled: true,
      custom: true,
      ...(opts ? { options: opts } : {}),
    }]);
    setNewLabel(""); setNewType("text"); setNewRequired(false);
    setNewPlaceholder(""); setNewOptions(""); setAddingField(false);
  };

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: s(0.85) };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }}
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{ maxWidth: 640, maxHeight: "90vh", background: "#0A0A14", border: `1px solid ${ACCENT}25`, boxShadow: `0 0 80px -20px ${ACCENT}30` }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}35` }}>
            <FormInput className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: s(0.9) }}>{initial ? "Editar Formulário" : "Novo Formulário"}</div>
            <div className="text-[10px]" style={{ color: s(0.3) }}>O embed herda automaticamente o CSS do site</div>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg" style={{ color: s(0.25) }}
            onMouseEnter={e => { e.currentTarget.style.color = s(0.6); }} onMouseLeave={e => { e.currentTarget.style.color = s(0.25); }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scroll area */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">
          <div className="space-y-3">
            {[
              { val: name, set: setName, label: "Nome do formulário *", ph: "Ex: Captação de Leads — Site Principal" },
              { val: description, set: setDescription, label: "Descrição (interna)", ph: "Para que serve este formulário?" },
              { val: clientId, set: setClientId, label: "Cliente (opcional)", ph: "ID ou nome do cliente" },
            ].map(({ val, set, label, ph }) => (
              <div key={label}>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: s(0.3) }}>{label}</label>
                <input value={val} onChange={e => set(e.target.value)} placeholder={ph} className={inputCls} style={inputStyle} />
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.04)" }}>
            {(["fields", "settings"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={tab === t ? { background: ACCENT, color: "#07080A" } : { color: s(0.4) }}>
                {t === "fields" ? "Campos" : "Configurações"}
              </button>
            ))}
          </div>

          {/* Tab: Campos */}
          {tab === "fields" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px]" style={{ color: s(0.3) }}>Ative campos padrão ou crie campos customizados.</p>
                <button onClick={() => setAddingField(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                  style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}>
                  <Plus className="w-3 h-3" /> Novo campo
                </button>
              </div>

              <AnimatePresence>
                {addingField && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="rounded-xl p-4 space-y-3" style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}30` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Novo campo personalizado</p>

                    <div>
                      <label className="block text-[9px] uppercase tracking-widest mb-1.5" style={{ color: s(0.3) }}>Tipo</label>
                      <div className="flex flex-wrap gap-1.5">
                        {([
                          { id: "text", icon: Type, label: "Texto" },
                          { id: "textarea", icon: AlignLeft, label: "Área de texto" },
                          { id: "email", icon: Mail, label: "E-mail" },
                          { id: "tel", icon: Phone, label: "Telefone" },
                          { id: "select", icon: List, label: "Seleção" },
                        ] as const).map(({ id, icon: Icon, label: lbl }) => (
                          <button key={id} onClick={() => setNewType(id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium"
                            style={newType === id ? { background: ACCENT, color: "#07080A" } : { background: "rgba(255,255,255,0.06)", color: s(0.5), border: "1px solid rgba(255,255,255,0.09)" }}>
                            <Icon className="w-3 h-3" /> {lbl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest mb-1" style={{ color: s(0.25) }}>Rótulo *</label>
                        <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Ex: Cidade, Orçamento…"
                          className="w-full rounded-lg px-2.5 py-2 text-[11px] focus:outline-none"
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: s(0.85) }} />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest mb-1" style={{ color: s(0.25) }}>Placeholder</label>
                        <input value={newPlaceholder} onChange={e => setNewPlaceholder(e.target.value)} placeholder="Texto de ajuda…"
                          className="w-full rounded-lg px-2.5 py-2 text-[11px] focus:outline-none"
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: s(0.85) }} />
                      </div>
                    </div>

                    {newType === "select" && (
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest mb-1" style={{ color: s(0.25) }}>Opções (separadas por vírgula)</label>
                        <input value={newOptions} onChange={e => setNewOptions(e.target.value)} placeholder="Opção 1, Opção 2, Opção 3"
                          className="w-full rounded-lg px-2.5 py-2 text-[11px] focus:outline-none"
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: s(0.85) }} />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <button onClick={() => setNewRequired(r => !r)} className="flex items-center gap-1.5 text-[11px]" style={{ color: newRequired ? "#F87171" : s(0.4) }}>
                        {newRequired ? <ToggleRight className="w-4 h-4" style={{ color: "#F87171" }} /> : <ToggleLeft className="w-4 h-4" style={{ color: s(0.25) }} />}
                        {newRequired ? "Obrigatório" : "Opcional"}
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => { setAddingField(false); setNewLabel(""); setNewType("text"); setNewRequired(false); setNewPlaceholder(""); setNewOptions(""); }}
                          className="px-3 py-1.5 rounded-lg text-[11px]"
                          style={{ background: "rgba(255,255,255,0.05)", color: s(0.4), border: "1px solid rgba(255,255,255,0.08)" }}>
                          Cancelar
                        </button>
                        <button onClick={confirmAddField} disabled={!newLabel.trim()}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40"
                          style={{ background: ACCENT, color: "#07080A" }}>
                          <Check className="w-3 h-3" /> Adicionar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {fields.map((field, idx) => (
                <div key={field.key} className="rounded-xl p-3 transition-all"
                  style={{ background: field.enabled ? (field.custom ? "rgba(139,92,246,0.08)" : `${ACCENT}08`) : "rgba(255,255,255,0.025)", border: field.enabled ? (field.custom ? "1px solid rgba(139,92,246,0.3)" : `1px solid ${ACCENT}25`) : "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => moveField(field.key, -1)} disabled={idx === 0} className="p-0.5 rounded disabled:opacity-20" style={{ color: s(0.25) }}
                        onMouseEnter={e => { e.currentTarget.style.color = s(0.6); }} onMouseLeave={e => { e.currentTarget.style.color = s(0.25); }}>
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveField(field.key, 1)} disabled={idx === fields.length - 1} className="p-0.5 rounded disabled:opacity-20" style={{ color: s(0.25) }}
                        onMouseEnter={e => { e.currentTarget.style.color = s(0.6); }} onMouseLeave={e => { e.currentTarget.style.color = s(0.25); }}>
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>
                    {!field.custom && (
                      <button onClick={() => field.key !== "name" && toggleField(field.key)} className="flex-shrink-0"
                        style={{ opacity: field.key === "name" ? 0.35 : 1, cursor: field.key === "name" ? "default" : "pointer" }}>
                        {field.enabled ? <ToggleRight className="w-5 h-5" style={{ color: ACCENT }} /> : <ToggleLeft className="w-5 h-5" style={{ color: s(0.25) }} />}
                      </button>
                    )}
                    {field.custom && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
                        style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.25)" }}>custom</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold" style={{ color: field.enabled ? s(0.85) : s(0.4) }}>{field.label}</span>
                      <span className="ml-1.5 text-[9px]" style={{ color: s(0.22) }}>{field.type}</span>
                    </div>
                    {field.enabled && field.key !== "name" && (
                      <button onClick={() => setFieldProp(field.key, "required", !field.required)}
                        className="text-[10px] px-2 py-1 rounded-lg font-medium flex-shrink-0"
                        style={field.required ? { background: "rgba(248,113,113,0.1)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" } : { background: "rgba(255,255,255,0.05)", color: s(0.35), border: "1px solid rgba(255,255,255,0.08)" }}>
                        {field.required ? "Obrigatório" : "Opcional"}
                      </button>
                    )}
                    {field.custom && (
                      <button onClick={() => removeCustomField(field.key)} className="p-1.5 rounded-lg flex-shrink-0" style={{ color: s(0.2) }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#F87171"; e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = s(0.2); e.currentTarget.style.background = "transparent"; }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {field.enabled && (
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest mb-1" style={{ color: s(0.2) }}>Rótulo</label>
                        <input value={field.label} onChange={e => setFieldProp(field.key, "label", e.target.value)}
                          className="w-full rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: s(0.8) }} />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest mb-1" style={{ color: s(0.2) }}>Placeholder</label>
                        <input value={field.placeholder} onChange={e => setFieldProp(field.key, "placeholder", e.target.value)}
                          className="w-full rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: s(0.8) }} />
                      </div>
                      {field.type === "select" && field.options && (
                        <div className="col-span-2">
                          <label className="block text-[9px] uppercase tracking-widest mb-1" style={{ color: s(0.2) }}>Opções (vírgula)</label>
                          <input value={field.options.join(", ")} onChange={e => setFieldProp(field.key, "options", e.target.value.split(",").map(o => o.trim()).filter(Boolean))}
                            className="w-full rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", color: s(0.8) }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab: Configurações */}
          {tab === "settings" && (
            <div className="space-y-4">
              {([
                { key: "title",           label: "Título do formulário",   ph: "Ex: Fale conosco" },
                { key: "button_text",     label: "Texto do botão",         ph: "Enviar" },
                { key: "success_message", label: "Mensagem de sucesso",    ph: "Obrigado! Entraremos em contato." },
                { key: "source",          label: "Tag de origem (no CRM)", ph: "formulario" },
              ] as { key: keyof FormSettings; label: string; ph: string }[]).map(({ key, label, ph }) => (
                <div key={key}>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: s(0.3) }}>{label}</label>
                  <input value={settings[key]} onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={ph} className={inputCls} style={inputStyle} />
                </div>
              ))}
              <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: "rgba(185,255,75,0.06)", border: "1px solid rgba(185,255,75,0.15)", color: s(0.5) }}>
                <strong style={{ color: ACCENT }}>Como funciona o embed:</strong> O script gera elementos HTML puros (<code style={{ color: ACCENT }}>input</code>, <code style={{ color: ACCENT }}>button</code>) sem CSS próprio — o design é herdado automaticamente do site.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.05)", color: s(0.4), border: "1px solid rgba(255,255,255,0.08)" }}>Cancelar</button>
          <button onClick={() => onSave({ name, description, client_id: clientId || null, fields, settings })}
            disabled={saving || !name.trim()} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ background: ACCENT, color: "#07080A" }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Check className="w-4 h-4" /> Salvar formulário</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Embed Modal ──────────────────────────────────────────────────────────────

function EmbedModal({ form, userId, onClose }: { form: CRMForm; userId: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const code = generateEmbed(form, userId);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }}
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{ maxWidth: 680, maxHeight: "88vh", background: "#0A0A14", border: `1px solid ${ACCENT}25`, boxShadow: `0 0 60px -20px ${ACCENT}30` }}>
        <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Code2 className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
          <div>
            <div className="text-sm font-bold" style={{ color: s(0.9) }}>Código de incorporação</div>
            <div className="text-[10px]" style={{ color: s(0.3) }}>{form.name}</div>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg" style={{ color: s(0.25) }}
            onMouseEnter={e => { e.currentTarget.style.color = s(0.6); }} onMouseLeave={e => { e.currentTarget.style.color = s(0.25); }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
          <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: "rgba(185,255,75,0.06)", border: "1px solid rgba(185,255,75,0.15)", color: s(0.5) }}>
            Cole o código abaixo na landing page onde o formulário deve aparecer. Os campos herdam o CSS do site — <strong style={{ color: ACCENT }}>sem estilos extras, sem iframe</strong>.
          </div>
          <div className="relative rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <pre className="text-[11px] leading-relaxed p-4 overflow-x-auto" style={{ color: s(0.65), fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {code}
            </pre>
          </div>
          <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: s(0.4) }}>
            <p><strong style={{ color: s(0.6) }}>Onde colar:</strong> Dentro do <code style={{ color: ACCENT }}>&lt;body&gt;</code>, no local onde o formulário deve aparecer.</p>
            <p><strong style={{ color: s(0.6) }}>Leads gerados:</strong> Salvos em <strong style={{ color: s(0.6) }}>Contatos → CRM</strong> com source <em style={{ color: ACCENT }}>{form.settings.source || "formulario"}</em>.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.05)", color: s(0.4), border: "1px solid rgba(255,255,255,0.08)" }}>Fechar</button>
          <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background: copied ? "rgba(185,255,75,0.2)" : ACCENT, color: copied ? ACCENT : "#07080A", border: copied ? `1px solid ${ACCENT}50` : "none" }}>
            {copied ? <><Check className="w-4 h-4" /> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar código</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function FormsPage() {
  const { user } = useAuth();
  const [forms, setForms]         = useState<CRMForm[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<CRMForm | null>(null);
  const [embedForm, setEmbedForm] = useState<CRMForm | null>(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any).from("forms").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (!error && data) setForms(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const handleSave = async (data: Partial<CRMForm>) => {
    if (!user) return;
    setSaving(true);
    try {
      if (editingForm) {
        const { error } = await (supabase as any).from("forms").update({ ...data, updated_at: new Date().toISOString() }).eq("id", editingForm.id);
        if (error) throw error;
        toast.success("Formulário atualizado!");
      } else {
        const { error } = await (supabase as any).from("forms").insert({ ...data, user_id: user.id });
        if (error) throw error;
        toast.success("Formulário criado!");
      }
      setShowBuilder(false); setEditingForm(null); load();
    } catch { toast.error("Erro ao salvar formulário."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Excluir "${name}"?`)) return;
    setDeleting(id);
    const { error } = await (supabase as any).from("forms").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); setDeleting(null); return; }
    setForms(prev => prev.filter(f => f.id !== id));
    toast.success("Excluído");
    setDeleting(null);
  };

  const handleToggleActive = async (form: CRMForm) => {
    await (supabase as any).from("forms").update({ active: !form.active }).eq("id", form.id);
    setForms(prev => prev.map(f => f.id === form.id ? { ...f, active: !f.active } : f));
  };

  const cv = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const iv = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <>
      <motion.div variants={cv} initial="hidden" animate="show" className="p-4 md:p-6 space-y-6">
        <motion.div variants={iv} className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Formulários</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {loading ? "Carregando..." : `${forms.length} formulário${forms.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"><RefreshCw className="h-4 w-4" /></button>
            <button onClick={() => { setEditingForm(null); setShowBuilder(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ background: ACCENT, color: "#07080A" }}>
              <Plus className="h-4 w-4" /> Novo Formulário
            </button>
          </div>
        </motion.div>

        <motion.div variants={iv} className="rounded-xl p-4 text-sm" style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20` }}>
          <p style={{ color: "rgba(255,255,255,0.55)" }}>
            <strong style={{ color: ACCENT }}>Como funciona:</strong> Crie um formulário, configure os campos e copie o código de incorporação para a LP do cliente. Cada preenchimento é salvo direto em <strong style={{ color: "rgba(255,255,255,0.75)" }}>Contatos → CRM</strong>.
          </p>
        </motion.div>

        {loading && <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCENT }} /></div>}

        {!loading && forms.length === 0 && (
          <motion.div variants={iv} className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}25` }}>
              <FormInput className="w-7 h-7" style={{ color: ACCENT }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Nenhum formulário criado</p>
              <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro formulário para capturar leads nas landing pages</p>
            </div>
            <button onClick={() => setShowBuilder(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: ACCENT, color: "#07080A" }}>
              <Plus className="w-4 h-4" /> Criar formulário
            </button>
          </motion.div>
        )}

        {!loading && forms.length > 0 && (
          <motion.div variants={cv} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map(form => {
              const activeFields = form.fields?.filter(f => f.enabled) ?? [];
              return (
                <motion.div key={form.id} variants={iv} className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: "#0E0E1C", border: form.active ? `1px solid ${ACCENT}20` : "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: form.active ? `${ACCENT}15` : "rgba(255,255,255,0.05)", border: form.active ? `1px solid ${ACCENT}30` : "1px solid rgba(255,255,255,0.08)" }}>
                      <FormInput className="w-4 h-4" style={{ color: form.active ? ACCENT : "rgba(255,255,255,0.3)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: "rgba(255,255,255,0.88)" }}>{form.name}</div>
                      {form.description && <div className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{form.description}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <Users className="w-3 h-3" style={{ color: "rgba(255,255,255,0.35)" }} />
                      <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>{form.submissions_count ?? 0} leads</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.6)" }}>{activeFields.length} campos</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {activeFields.map(f => (
                      <span key={f.key} className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        {f.label}{f.required && <span style={{ color: "#F87171" }}> *</span>}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <button onClick={() => handleToggleActive(form)} className="text-[10px] px-2 py-1 rounded-lg font-medium"
                      style={form.active ? { background: "rgba(185,255,75,0.08)", color: ACCENT, border: `1px solid ${ACCENT}25` } : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {form.active ? "Ativo" : "Inativo"}
                    </button>
                    <div className="flex items-center gap-1 ml-auto">
                      <button onClick={() => setEmbedForm(form)} className="p-2 rounded-lg" title="Ver código" style={{ color: "rgba(255,255,255,0.3)" }}
                        onMouseEnter={e => { e.currentTarget.style.color = ACCENT; e.currentTarget.style.background = `${ACCENT}10`; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "transparent"; }}>
                        <Code2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingForm(form); setShowBuilder(true); }} className="p-2 rounded-lg" title="Editar" style={{ color: "rgba(255,255,255,0.3)" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "transparent"; }}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(form.id, form.name)} disabled={deleting === form.id} className="p-2 rounded-lg" title="Excluir" style={{ color: "rgba(255,255,255,0.3)" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#F87171"; e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "transparent"; }}>
                        {deleting === form.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showBuilder && <FormBuilder initial={editingForm} onSave={handleSave} onClose={() => { setShowBuilder(false); setEditingForm(null); }} saving={saving} />}
        {embedForm && user && <EmbedModal form={embedForm} userId={user.id} onClose={() => setEmbedForm(null)} />}
      </AnimatePresence>
    </>
  );
}
