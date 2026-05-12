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
import { AIInputField } from "@/components/AIInputField";
import { AITextareaField } from "@/components/AITextareaField";

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

  // WhatsApp
  const [waContact, setWaContact]   = useState<Contact | null>(null);
  const [waMessage, setWaMessage]   = useState("");
  const [waSending, setWaSending]   = useState(false);
  const [waMediaType, setWaMediaType] = useState<"text" | "image" | "video" | "audio">("text");
  const [waMediaData, setWaMediaData] = useState<string | null>(null);
  const [waMediaName, setWaMediaName] = useState("");
  const [waCaption, setWaCaption]   = useState("");

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

  const handleWaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWaMediaName(file.name);
    const reader = new FileReader();
    reader.onload = () => setWaMediaData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const sendWhatsApp = async () => {
    if (!waContact?.phone) { toast.error("Contato sem telefone cadastrado."); return; }
    const hasMedia = waMediaType !== "text" && !!waMediaData;
    if (!hasMedia && !waMessage.trim()) { toast.error("Digite uma mensagem."); return; }
    setWaSending(true);
    try {
      const body: Record<string, any> = { action: "send", phone: waContact.phone, message: waMessage.trim() };
      if (hasMedia) { body.mediaType = waMediaType; body.mediaData = waMediaData; body.caption = waCaption || waMessage.trim(); }
      const { data, error } = await supabase.functions.invoke("whatsapp", { body });
      if (error) throw new Error(error?.message ?? "Erro ao enviar");
      toast.success(`Mensagem enviada para ${waContact.name}!`);
      setWaContact(null);
      setWaMessage(""); setWaCaption(""); setWaMediaData(null); setWaMediaName(""); setWaMediaType("text");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao enviar mensagem.");
    } finally {
      setWaSending(false);
    }
  };

  const activeCount = contacts.filter(c => c.status === "Ativo").length;
  const hotCount    = contacts.filter(c => getHeat(c) === "hot").length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <motion.div variants={anim} initial="hidden" animate="show" className="p-3 md:p-6 space-y-6 min-w-0 break-words">

      {/* Header */}
      <motion.div variants={row} className="flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Contatos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {contacts.length} contatos · {activeCount} ativos · <span style={{ color: HEAT_CFG.hot.color }}>{hotCount} quentes 🔥</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Selecione um arquivo CSV")}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Exportando...")}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button variant="default" size="sm" className="gap-2" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Contato</span>
          </Button>
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

      {/* Mobile cards */}
      <motion.div variants={row} className="md:hidden space-y-2.5">
        {filtered.map((c) => {
          const heat = getHeat(c);
          const hcfg = HEAT_CFG[heat];
          const src = c.channel && SOURCES[c.channel] ? SOURCES[c.channel] : null;
          const SrcIcon = src?.Icon;
          return (
            <div key={c.id} className="rounded-xl border border-border bg-card p-3.5 shadow-card">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary flex-shrink-0">
                  {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <button onClick={() => setActiveContact(c)} className="block text-sm font-semibold text-foreground hover:underline text-left truncate w-full">
                    {c.name}
                  </button>
                  <p className="text-xs text-muted-foreground truncate">{c.email || c.phone || c.company || "—"}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: hcfg.bg, color: hcfg.color, border: `1px solid ${hcfg.border}` }}>
                      {hcfg.emoji} {hcfg.label}
                    </span>
                    {src && SrcIcon && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium" style={{ background: src.bg, color: src.color }}>
                        <SrcIcon className="h-3 w-3" />{src.label}
                      </span>
                    )}
                    {c.status && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium ${statusColor(c.status)}`}>{c.status}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                <button onClick={() => toast.info(`Enviando e-mail para ${c.name}…`)} className="flex-1 py-2 rounded-md hover:bg-muted text-muted-foreground flex items-center justify-center"><Mail className="h-4 w-4" /></button>
                <button onClick={() => toast.info(`Ligando para ${c.name}…`)} className="flex-1 py-2 rounded-md hover:bg-muted text-muted-foreground flex items-center justify-center"><Phone className="h-4 w-4" /></button>
                <button onClick={() => { setWaContact(c); setWaMessage(""); }} className="flex-1 py-2 rounded-md hover:bg-muted flex items-center justify-center" style={{ color: "#25D366" }}><MessageCircle className="h-4 w-4" /></button>
                <button onClick={() => openEdit(c)} className="flex-1 py-2 rounded-md hover:bg-muted text-muted-foreground flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(c.id)} className="flex-1 py-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">Nenhum contato encontrado</div>
        )}
      </motion.div>

      {/* Desktop Table */}
      <motion.div variants={row} className="hidden md:block rounded-xl border border-border bg-card shadow-card overflow-hidden">
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
                        <button
                          onClick={() => { setWaContact(c); setWaMessage(""); }}
                          className="p-1.5 rounded-md hover:bg-muted transition-colors"
                          title="Enviar WhatsApp"
                          style={{ color: "#25D366" }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
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

      {/* WhatsApp Modal */}
      {waContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(37,211,102,0.12)" }}>
                  <MessageCircle className="h-5 w-5" style={{ color: "#25D366" }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Enviar WhatsApp</h2>
                  <p className="text-xs text-muted-foreground">{waContact.name} · {waContact.phone || "sem telefone"}</p>
                </div>
              </div>
              <button onClick={() => setWaContact(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {!waContact.phone && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                Este contato não tem telefone cadastrado. Edite o contato para adicionar antes de enviar.
              </p>
            )}

            {/* Media type selector */}
            <div className="flex gap-2 flex-wrap">
              {(["text", "image", "video", "audio"] as const).map((t) => {
                const labels: Record<string, string> = { text: "💬 Texto", image: "🖼️ Imagem", video: "🎥 Vídeo", audio: "🎵 Áudio" };
                return (
                  <button key={t} onClick={() => { setWaMediaType(t); setWaMediaData(null); setWaMediaName(""); }}
                    className="px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all"
                    style={waMediaType === t
                      ? { background: "rgba(37,211,102,0.12)", color: "#25D366", borderColor: "rgba(37,211,102,0.35)" }
                      : { background: "transparent", color: "var(--muted-foreground)", borderColor: "var(--border)" }}>
                    {labels[t]}
                  </button>
                );
              })}
            </div>

            {/* File upload (non-text) */}
            {waMediaType !== "text" && (
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer border-2 border-dashed border-input bg-background/50">
                <input type="file" className="hidden"
                  accept={waMediaType === "image" ? "image/*" : waMediaType === "video" ? "video/*" : "audio/*"}
                  onChange={handleWaFile} />
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm" style={{ color: waMediaName ? "#25D366" : undefined }}>
                  {waMediaName || "Clique para selecionar arquivo"}
                </span>
              </label>
            )}

            {/* Caption for image/video */}
            {(waMediaType === "image" || waMediaType === "video") && (
              <AIInputField value={waCaption} onChange={e => setWaCaption(e.target.value)}
                placeholder="Legenda (opcional)..."
                className="w-full rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                fieldLabel="Legenda da mídia"
                fieldContext={`Mensagem WhatsApp para ${waContact.name}`} />
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {waMediaType === "text" ? "Mensagem" : "Texto adicional (opcional)"}
              </label>
              <AITextareaField
                value={waMessage}
                onChange={e => setWaMessage(e.target.value)}
                rows={waMediaType === "text" ? 4 : 2}
                placeholder={waMediaType === "text" ? `Olá ${waContact.name.split(" ")[0]}, tudo bem? Aqui é da Calu Agência...` : "Texto extra..."}
                className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                fieldLabel="Mensagem WhatsApp"
                fieldContext={`Mensagem para o contato ${waContact.name} da Calu Agência`}
              />
              {waMediaType === "text" && <p className="text-[11px] text-muted-foreground mt-1">{waMessage.length} caracteres</p>}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setWaContact(null); setWaMediaType("text"); setWaMediaData(null); setWaMediaName(""); setWaCaption(""); }}
                className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground">
                Cancelar
              </button>
              <button
                onClick={sendWhatsApp}
                disabled={waSending || !waContact.phone || (waMediaType === "text" ? !waMessage.trim() : !waMediaData)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: "#25D366", color: "#fff", opacity: waSending || !waContact.phone || (waMediaType === "text" ? !waMessage.trim() : !waMediaData) ? 0.6 : 1 }}
              >
                {waSending ? <><div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</> : <><MessageCircle className="h-4 w-4" /> Enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Contact Modal */}
      {showNew && (
        <Modal title="Novo Contato" onClose={() => setShowNew(false)}>
          <Field label="Nome *"><AIInputField value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} className={inputCls} fieldLabel="Nome do contato" fieldContext="Formulário de novo contato no CRM" /></Field>
          <Field label="E-mail"><AIInputField value={newForm.email} onChange={e => setNewForm(p => ({ ...p, email: e.target.value }))} className={inputCls} fieldLabel="E-mail" fieldContext="Formulário de novo contato no CRM" /></Field>
          <Field label="Telefone"><AIInputField value={newForm.phone} onChange={e => setNewForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} fieldLabel="Telefone" fieldContext="Formulário de novo contato no CRM" /></Field>
          <Field label="Empresa"><AIInputField value={newForm.company} onChange={e => setNewForm(p => ({ ...p, company: e.target.value }))} className={inputCls} fieldLabel="Empresa" fieldContext="Formulário de novo contato no CRM" /></Field>
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
          <Field label="Nome *"><AIInputField value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className={inputCls} fieldLabel="Nome do contato" fieldContext="Edição de contato no CRM" /></Field>
          <Field label="E-mail"><AIInputField value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className={inputCls} fieldLabel="E-mail" fieldContext="Edição de contato no CRM" /></Field>
          <Field label="Telefone"><AIInputField value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} fieldLabel="Telefone" fieldContext="Edição de contato no CRM" /></Field>
          <Field label="Empresa"><AIInputField value={editForm.company} onChange={e => setEditForm(p => ({ ...p, company: e.target.value }))} className={inputCls} fieldLabel="Empresa" fieldContext="Edição de contato no CRM" /></Field>
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
      <div className="flex items-center justify-between flex-wrap gap-4">
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
