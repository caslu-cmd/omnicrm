import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, Filter, Download, Upload, Plus, MoreHorizontal,
  Mail, Phone, X, Pencil, Trash2, Instagram, Facebook,
  Globe, Users, Linkedin, MessageCircle, Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import ContactActivityPanel from "@/components/ContactActivityPanel";

type Contact = Tables<"contacts">;

// ── Source config ───────────────────────────────────────────
const SOURCES: Record<string, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  instagram:  { label: "Instagram",  Icon: Instagram,      color: "#E1306C", bg: "rgba(225,48,108,0.1)" },
  facebook:   { label: "Facebook",   Icon: Facebook,       color: "#1877F2", bg: "rgba(24,119,242,0.1)" },
  whatsapp:   { label: "WhatsApp",   Icon: MessageCircle,  color: "#25D366", bg: "rgba(37,211,102,0.1)" },
  website:    { label: "Website",    Icon: Globe,          color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  indicacao:  { label: "Indicação",  Icon: Users,          color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  linkedin:   { label: "LinkedIn",   Icon: Linkedin,       color: "#0A66C2", bg: "rgba(10,102,194,0.1)" },
  email:      { label: "E-mail",     Icon: Mail,           color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
  outro:      { label: "Outro",      Icon: Minus,          color: "#9CA3AF", bg: "rgba(156,163,175,0.1)" },
};

const SOURCE_OPTIONS = ["instagram", "facebook", "whatsapp", "website", "indicacao", "linkedin", "email", "outro"];

// ── Heat calculation ────────────────────────────────────────
function getHeat(c: Contact): "hot" | "warm" | "cold" {
  const score = c.score ?? 0;
  const last = c.last_interaction ? new Date(c.last_interaction) : null;
  const days = last ? (Date.now() - last.getTime()) / 86_400_000 : 999;
  if (score >= 70 || days <= 7)  return "hot";
  if (score >= 40 || days <= 30) return "warm";
  return "cold";
}

const HEAT_CFG = {
  hot:  { label: "Quente", emoji: "🔥", color: "#F97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.25)" },
  warm: { label: "Morno",  emoji: "🟡", color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)" },
  cold: { label: "Frio",   emoji: "🔵", color: "#60A5FA", bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.25)" },
};

// ── Helpers ─────────────────────────────────────────────────
const statusColor = (s: string) => {
  if (s === "Ativo")  return "bg-secondary/10 text-secondary";
  if (s === "Novo")   return "bg-primary/10 text-primary";
  return "bg-muted text-muted-foreground";
};

const anim = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const row  = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

// ── Reusable field ──────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);

const inputCls = "w-full rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20";

const ContactsPage = () => {
  const { user } = useAuth();
  const [contacts, setContacts]         = useState<Contact[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [showFilter, setShowFilter]     = useState(false);
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterSource, setFilterSource] = useState("Todos");
  const [filterHeat, setFilterHeat]     = useState("Todos");
  const [menuId, setMenuId]             = useState<string | null>(null);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  // New
  const [showNew, setShowNew]   = useState(false);
  const [newForm, setNewForm]   = useState({ name: "", email: "", phone: "", company: "", channel: "" });

  // Edit
  const [editing, setEditing]   = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", company: "", channel: "", status: "" });

  useEffect(() => { if (user) fetch(); }, [user]);

  const fetch = async () => {
    const pageSize = 1000;
    let all: Contact[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false }).range(from, from + pageSize - 1);
      if (error) { toast.error("Erro ao carregar contatos"); return; }
      all = all.concat(data || []);
      if (!data || data.length < pageSize) break;
      from += pageSize;
    }
    setContacts(all);
    setLoading(false);
  };

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "Todos" || c.status === filterStatus;
    const matchSource = filterSource === "Todos" || c.channel === filterSource;
    const matchHeat   = filterHeat === "Todos"   || getHeat(c) === filterHeat;
    return matchSearch && matchStatus && matchSource && matchHeat;
  });

  const handleCreate = async () => {
    if (!newForm.name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!user) return;
    const { error } = await supabase.from("contacts").insert({
      user_id: user.id, name: newForm.name,
      email: newForm.email || null, phone: newForm.phone || null,
      company: newForm.company || null, channel: newForm.channel || null,
    });
    if (error) { toast.error("Erro ao criar contato"); return; }
    setShowNew(false);
    setNewForm({ name: "", email: "", phone: "", company: "", channel: "" });
    toast.success(`Contato "${newForm.name}" criado!`);
    fetch();
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setEditForm({ name: c.name, email: c.email || "", phone: c.phone || "", company: c.company || "", channel: c.channel || "", status: c.status || "Novo" });
    setMenuId(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    const { error } = await supabase.from("contacts").update({
      name: editForm.name, email: editForm.email || null, phone: editForm.phone || null,
      company: editForm.company || null, channel: editForm.channel || null, status: editForm.status,
    }).eq("id", editing.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    setEditing(null);
    toast.success("Contato atualizado!");
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este contato?")) return;
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    setMenuId(null);
    toast.success("Contato excluído!");
    fetch();
  };

  const activeCount = contacts.filter(c => c.status === "Ativo").length;
  const hotCount    = contacts.filter(c => getHeat(c) === "hot").length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <motion.div variants={anim} initial="hidden" animate="show" className="p-6 space-y-6">

      {/* Header */}
      <motion.div variants={row} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Contatos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {contacts.length} contatos · {activeCount} ativos · <span style={{ color: HEAT_CFG.hot.color }}>{hotCount} quentes 🔥</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Selecione um arquivo CSV")}><Upload className="h-4 w-4" /> Importar</Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Exportando...")}><Download className="h-4 w-4" /> Exportar</Button>
          <Button variant="default" size="sm" className="gap-2" onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> Novo Contato</Button>
        </div>
      </motion.div>

      {/* Segment Selector (by source/channel) */}
      <motion.div variants={row} className="flex items-center gap-2 flex-wrap border-b border-border pb-3">
        <button
          onClick={() => setFilterSource("Todos")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterSource === "Todos"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/70"
          }`}
        >
          Todos <span className="ml-1 opacity-70">({contacts.length})</span>
        </button>
        {Array.from(new Set(contacts.map(c => c.channel).filter(Boolean) as string[]))
          .sort()
          .map(seg => {
            const cfg = SOURCES[seg];
            const label = cfg?.label ?? seg;
            const count = contacts.filter(c => c.channel === seg).length;
            const Icon = cfg?.Icon;
            const active = filterSource === seg;
            return (
              <button
                key={seg}
                onClick={() => setFilterSource(seg)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border inline-flex items-center gap-1.5"
                style={active
                  ? { background: cfg?.bg ?? "var(--muted)", color: cfg?.color ?? "var(--foreground)", borderColor: cfg?.color ?? "var(--border)" }
                  : { background: "transparent", color: "var(--muted-foreground)", borderColor: "var(--border)" }}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {label} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
      </motion.div>

      {/* Search + Filters */}
      <motion.div variants={row} className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar contatos..." className="w-full rounded-lg border border-input bg-card py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
        </div>
        <div className="relative">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilter(!showFilter)}>
            <Filter className="h-4 w-4" /> Filtros
            {(filterStatus !== "Todos" || filterSource !== "Todos" || filterHeat !== "Todos") && (
              <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
          {showFilter && (
            <div className="absolute top-10 left-0 z-50 w-56 rounded-xl border border-border bg-card shadow-elevated p-3 space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</p>
                <div className="flex flex-wrap gap-1">
                  {["Todos", "Ativo", "Novo", "Inativo"].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${filterStatus === s ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Temperatura</p>
                <div className="flex flex-wrap gap-1">
                  {[["Todos","Todos"],["hot","🔥 Quente"],["warm","🟡 Morno"],["cold","🔵 Frio"]].map(([v,l]) => (
                    <button key={v} onClick={() => setFilterHeat(v)} className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${filterHeat === v ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Origem</p>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setFilterSource("Todos")} className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${filterSource === "Todos" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>Todos</button>
                  {SOURCE_OPTIONS.map(s => (
                    <button key={s} onClick={() => setFilterSource(s)} className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${filterSource === s ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{SOURCES[s].label}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setFilterStatus("Todos"); setFilterSource("Todos"); setFilterHeat("Todos"); setShowFilter(false); }} className="w-full text-xs text-muted-foreground hover:text-foreground text-center pt-1">Limpar filtros</button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={row} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Nome</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Empresa</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Telefone</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Origem</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Temperatura</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Score</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const heat = getHeat(c);
                const hcfg = HEAT_CFG[heat];
                const src  = c.channel && SOURCES[c.channel] ? SOURCES[c.channel] : null;
                const SrcIcon = src?.Icon;
                return (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary flex-shrink-0">
                          {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <button onClick={() => setActiveContact(c)} className="text-sm font-medium text-foreground hover:underline text-left">{c.name}</button>
                          <p className="text-xs text-muted-foreground">{c.email || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-foreground">{c.company || "—"}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.phone || "—"}</td>
                    <td className="px-5 py-3.5">
                      {src && SrcIcon ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium" style={{ background: src.bg, color: src.color }}>
                          <SrcIcon className="h-3 w-3" />{src.label}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: hcfg.bg, color: hcfg.color, border: `1px solid ${hcfg.border}` }}>
                        {hcfg.emoji} {hcfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.score ?? 0}%`, background: heat === "hot" ? "#F97316" : heat === "warm" ? "#F59E0B" : "#60A5FA" }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{c.score ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusColor(c.status ?? "")}`}>{c.status || "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 relative">
                        <button onClick={() => toast.info(`Enviando e-mail para ${c.name}…`)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Mail className="h-4 w-4" /></button>
                        <button onClick={() => toast.info(`Ligando para ${c.name}…`)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Phone className="h-4 w-4" /></button>
                        <div className="relative">
                          <button onClick={() => setMenuId(menuId === c.id ? null : c.id)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></button>
                          {menuId === c.id && (
                            <div className="absolute right-0 top-8 z-50 w-36 rounded-lg border border-border bg-card shadow-elevated p-1">
                              <button onClick={() => openEdit(c)} className="w-full text-left px-3 py-1.5 rounded-md text-xs hover:bg-muted text-foreground flex items-center gap-1.5"><Pencil className="h-3 w-3" /> Editar</button>
                              <button onClick={() => handleDelete(c.id)} className="w-full text-left px-3 py-1.5 rounded-md text-xs hover:bg-destructive/10 text-destructive flex items-center gap-1.5"><Trash2 className="h-3 w-3" /> Excluir</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-sm text-muted-foreground">Nenhum contato encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* New Contact Modal */}
      {showNew && (
        <Modal title="Novo Contato" onClose={() => setShowNew(false)}>
          <Field label="Nome *"><input value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} className={inputCls} /></Field>
          <Field label="E-mail"><input value={newForm.email} onChange={e => setNewForm(p => ({ ...p, email: e.target.value }))} className={inputCls} /></Field>
          <Field label="Telefone"><input value={newForm.phone} onChange={e => setNewForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} /></Field>
          <Field label="Empresa"><input value={newForm.company} onChange={e => setNewForm(p => ({ ...p, company: e.target.value }))} className={inputCls} /></Field>
          <Field label="Origem do lead">
            <SourceSelect value={newForm.channel} onChange={v => setNewForm(p => ({ ...p, channel: v }))} />
          </Field>
          <ModalActions onCancel={() => setShowNew(false)} onConfirm={handleCreate} confirmLabel="Criar" />
        </Modal>
      )}

      {/* Activity Panel */}
      {activeContact && (
        <ContactActivityPanel
          contact={activeContact}
          onClose={() => setActiveContact(null)}
        />
      )}

      {/* Edit Contact Modal */}
      {editing && (
        <Modal title="Editar Contato" onClose={() => setEditing(null)}>
          <Field label="Nome *"><input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className={inputCls} /></Field>
          <Field label="E-mail"><input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className={inputCls} /></Field>
          <Field label="Telefone"><input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} /></Field>
          <Field label="Empresa"><input value={editForm.company} onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))} className={inputCls} /></Field>
          <Field label="Origem do lead">
            <SourceSelect value={editForm.channel} onChange={v => setEditForm(p => ({ ...p, channel: v }))} />
          </Field>
          <Field label="Status">
            <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
              {["Novo", "Ativo", "Inativo"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <ModalActions onCancel={() => setEditing(null)} onConfirm={handleSave} confirmLabel="Salvar" />
        </Modal>
      )}
    </motion.div>
  );
};

// ── Sub-components ──────────────────────────────────────────
const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold font-display text-foreground">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
      </div>
      {children}
    </div>
  </div>
);

const ModalActions = ({ onCancel, onConfirm, confirmLabel }: { onCancel: () => void; onConfirm: () => void; confirmLabel: string }) => (
  <div className="flex gap-3 pt-2">
    <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground">Cancelar</button>
    <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">{confirmLabel}</button>
  </div>
);

const SourceSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="grid grid-cols-4 gap-1.5">
    {SOURCE_OPTIONS.map(s => {
      const cfg = SOURCES[s];
      const Icon = cfg.Icon;
      const active = value === s;
      return (
        <button
          key={s}
          type="button"
          onClick={() => onChange(active ? "" : s)}
          className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] font-medium transition-all border"
          style={active
            ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color }
            : { background: "transparent", color: "var(--muted-foreground)", borderColor: "var(--border)" }}
        >
          <Icon className="h-4 w-4" />
          {cfg.label}
        </button>
      );
    })}
  </div>
);

export default ContactsPage;
