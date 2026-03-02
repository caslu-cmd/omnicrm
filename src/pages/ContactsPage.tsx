import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Download, Upload, Plus, MoreHorizontal, Mail, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Contact = Tables<"contacts">;

const scoreColor = (score: number) => {
  if (score >= 80) return "text-secondary bg-secondary/10";
  if (score >= 50) return "text-accent-foreground bg-accent/20";
  return "text-muted-foreground bg-muted";
};

const statusColor = (status: string) => {
  if (status === "Ativo") return "bg-secondary/10 text-secondary";
  if (status === "Novo") return "bg-primary/10 text-primary";
  return "bg-muted text-muted-foreground";
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

const ContactsPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [showNewContact, setShowNewContact] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");

  useEffect(() => {
    if (user) fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Erro ao carregar contatos"); return; }
    setContacts(data || []);
    setLoading(false);
  };

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || "").toLowerCase().includes(search.toLowerCase()) || (c.company || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "Todos" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount = contacts.filter(c => c.status === "Ativo").length;

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Nome é obrigatório"); return; }
    if (!user) return;
    const { error } = await supabase.from("contacts").insert({ user_id: user.id, name: newName, email: newEmail || null, company: newCompany || null });
    if (error) { toast.error("Erro ao criar contato"); return; }
    setShowNewContact(false);
    setNewName(""); setNewEmail(""); setNewCompany("");
    toast.success(`Contato "${newName}" criado!`);
    fetchContacts();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Contatos</h1>
          <p className="text-sm text-muted-foreground mt-1">{contacts.length} contatos · {activeCount} ativos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.info("Selecione um arquivo CSV para importar")}><Upload className="h-4 w-4" /> Importar</Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Exportando contatos para CSV...")}><Download className="h-4 w-4" /> Exportar</Button>
          <Button variant="default" size="sm" className="gap-2" onClick={() => setShowNewContact(true)}><Plus className="h-4 w-4" /> Novo Contato</Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar contatos..." className="w-full rounded-lg border border-input bg-card py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
        </div>
        <div className="relative">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilter(!showFilter)}><Filter className="h-4 w-4" /> Filtros</Button>
          {showFilter && (
            <div className="absolute top-10 left-0 z-50 w-40 rounded-lg border border-border bg-card shadow-elevated p-2 space-y-1">
              {["Todos", "Ativo", "Novo", "Inativo"].map(s => (
                <button key={s} onClick={() => { setFilterStatus(s); setShowFilter(false); }} className={`w-full text-left px-3 py-1.5 rounded-md text-sm ${filterStatus === s ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"}`}>{s}</button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={item} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Nome</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Empresa</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Canal</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Última Interação</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Score</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {c.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground">{c.company || "—"}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.channel}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.last_interaction}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${scoreColor(c.score ?? 0)}`}>{c.score}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusColor(c.status ?? "")}`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => toast.info(`Enviando e-mail para ${c.name}...`)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Mail className="h-4 w-4" /></button>
                      <button onClick={() => toast.info(`Ligando para ${c.name}...`)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Phone className="h-4 w-4" /></button>
                      <button onClick={() => toast.info(`Opções para ${c.name}`)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Nenhum contato encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {showNewContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-foreground">Novo Contato</h2>
              <button onClick={() => setShowNewContact(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Nome *</label><input value={newName} onChange={e => setNewName(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">E-mail</label><input value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Empresa</label><input value={newCompany} onChange={e => setNewCompany(e.target.value)} className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewContact(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground">Cancelar</button>
              <button onClick={handleCreate} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Criar</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ContactsPage;
