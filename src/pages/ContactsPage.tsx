import { motion } from "framer-motion";
import { Search, Filter, Download, Upload, Plus, MoreHorizontal, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const contacts = [
  { id: 1, name: "Maria Silva", email: "maria@techsolutions.com", company: "Tech Solutions", phone: "+55 11 99999-0000", channel: "WhatsApp", lastInteraction: "2 min", score: 92, status: "Ativo" },
  { id: 2, name: "João Pereira", email: "joao@innovationltd.com", company: "Innovation Ltd", phone: "+55 21 98888-1111", channel: "E-mail", lastInteraction: "15 min", score: 78, status: "Ativo" },
  { id: 3, name: "Ana Costa", email: "ana@designstudio.com", company: "Design Studio", phone: "+55 31 97777-2222", channel: "Instagram", lastInteraction: "1h", score: 65, status: "Novo" },
  { id: 4, name: "Carlos Mendes", email: "carlos@megacorp.com", company: "Mega Corp", phone: "+55 41 96666-3333", channel: "WhatsApp", lastInteraction: "2h", score: 85, status: "Ativo" },
  { id: 5, name: "Beatriz Lima", email: "bia@startupx.com", company: "Startup X", phone: "+55 51 95555-4444", channel: "Messenger", lastInteraction: "1 dia", score: 45, status: "Inativo" },
  { id: 6, name: "Roberto Santos", email: "roberto@globalsa.com", company: "Global SA", phone: "+55 61 94444-5555", channel: "E-mail", lastInteraction: "3 dias", score: 30, status: "Inativo" },
  { id: 7, name: "Fernanda Oliveira", email: "fer@agenciadigital.com", company: "Agência Digital", phone: "+55 71 93333-6666", channel: "WhatsApp", lastInteraction: "5h", score: 88, status: "Ativo" },
];

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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } },
};
const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 },
};

const ContactsPage = () => {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Contatos</h1>
          <p className="text-sm text-muted-foreground mt-1">{contacts.length} contatos · 5 ativos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2"><Upload className="h-4 w-4" /> Importar</Button>
          <Button variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" /> Exportar</Button>
          <Button variant="default" size="sm" className="gap-2"><Plus className="h-4 w-4" /> Novo Contato</Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar contatos..."
            className="w-full rounded-lg border border-input bg-card py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2"><Filter className="h-4 w-4" /> Filtros</Button>
      </motion.div>

      {/* Table */}
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
              {contacts.map((c) => (
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
                  <td className="px-5 py-3.5 text-sm text-foreground">{c.company}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.channel}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{c.lastInteraction}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${scoreColor(c.score)}`}>
                      {c.score}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Mail className="h-4 w-4" /></button>
                      <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><Phone className="h-4 w-4" /></button>
                      <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ContactsPage;
