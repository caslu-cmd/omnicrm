import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield, Users, CreditCard, Palette, Globe, Building, ChevronRight,
  Plus, CheckCircle2, Settings2, Eye, Copy, Download, BarChart3,
  Server, Crown, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const tabs = [
  { key: "users", label: "Usuários & Roles", icon: Users },
  { key: "billing", label: "Billing Enterprise", icon: CreditCard },
  { key: "whitelabel", label: "White-Label", icon: Palette },
  { key: "reseller", label: "Programa Reseller", icon: Building },
  { key: "multiregion", label: "Multi-Região", icon: Globe },
];

const users = [
  { name: "João Admin", email: "joao@empresa.com", role: "Admin", status: "Ativo", lastLogin: "Hoje 14:32" },
  { name: "Maria Vendas", email: "maria@empresa.com", role: "Vendedor", status: "Ativo", lastLogin: "Hoje 11:20" },
  { name: "Carlos Suporte", email: "carlos@empresa.com", role: "Suporte", status: "Ativo", lastLogin: "Ontem" },
  { name: "Ana Marketing", email: "ana@empresa.com", role: "Marketing", status: "Ativo", lastLogin: "Hoje 09:00" },
  { name: "Dev API", email: "dev@empresa.com", role: "Desenvolvedor", status: "Inativo", lastLogin: "5 dias atrás" },
];

const resellerClients = [
  { name: "Agência Alpha", users: 25, mrr: "R$ 4.500", status: "Ativo" },
  { name: "Consultoria Beta", users: 12, mrr: "R$ 2.200", status: "Ativo" },
  { name: "Studio Gamma", users: 8, mrr: "R$ 1.500", status: "Trial" },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const AdminPage = () => {
  const [tab, setTab] = useState("users");

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display text-foreground">Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão enterprise, white-label e programa de parceiros</p>
      </motion.div>

      <div className="flex gap-6">
        <motion.div variants={item} className="w-52 shrink-0 space-y-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left", tab === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </motion.div>

        <div className="flex-1 space-y-6">
          {tab === "users" && (
            <motion.div variants={item} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold font-display text-foreground">{users.length} Usuários</h3>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"><Plus className="h-4 w-4" /> Convidar</button>
              </div>
              <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                <table className="w-full">
                  <thead><tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Usuário</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Role</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Último Login</th>
                    <th className="px-5 py-3"></th>
                  </tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.email} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-3"><p className="text-sm font-medium text-foreground">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></td>
                        <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">{u.role}</span></td>
                        <td className="px-5 py-3"><span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", u.status === "Ativo" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground")}>{u.status}</span></td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{u.lastLogin}</td>
                        <td className="px-5 py-3"><button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Settings2 className="h-4 w-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Roles Customizáveis</h4>
                {["Admin", "Vendedor", "Suporte", "Marketing", "Desenvolvedor", "Viewer"].map(r => (
                  <div key={r} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                    <span className="text-sm text-foreground">{r}</span>
                    <button className="text-xs text-primary font-medium hover:underline">Editar permissões</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "billing" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="h-6 w-6 text-primary" />
                  <div><h3 className="text-lg font-bold font-display text-foreground">Plano Enterprise</h3><p className="text-xs text-muted-foreground">Faturamento anual · Próxima renovação: 1 Mar 2027</p></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Usuários", value: "Ilimitados" },
                    { label: "Contatos", value: "500.000" },
                    { label: "E-mails/mês", value: "1.000.000" },
                    { label: "Armazenamento", value: "500 GB" },
                  ].map(f => (
                    <div key={f.label} className="text-center"><p className="text-lg font-bold text-foreground">{f.value}</p><p className="text-xs text-muted-foreground">{f.label}</p></div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-3">
                <h3 className="text-base font-semibold text-foreground">Faturas Recentes</h3>
                {[
                  { date: "1 Mar 2026", amount: "R$ 2.997,00", status: "Pago" },
                  { date: "1 Fev 2026", amount: "R$ 2.997,00", status: "Pago" },
                  { date: "1 Jan 2026", amount: "R$ 2.997,00", status: "Pago" },
                ].map(inv => (
                  <div key={inv.date} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div><p className="text-sm font-medium text-foreground">{inv.amount}</p><p className="text-xs text-muted-foreground">{inv.date}</p></div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary/10 text-secondary">{inv.status}</span>
                      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Download className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "whitelabel" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
                <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Personalização da Marca</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-muted-foreground">Nome da Plataforma</label><input defaultValue="OmniCRM" className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Domínio Customizado</label><input defaultValue="app.meucrm.com.br" className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Logo</label>
                  <div className="mt-1 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">O</div>
                    <button className="px-3 py-2 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary">Upload Logo</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cores da Marca</label>
                  <div className="flex gap-3 mt-2">
                    {[
                      { label: "Primária", color: "#0B6E99" },
                      { label: "Secundária", color: "#16A085" },
                      { label: "Acento", color: "#F5A623" },
                    ].map(c => (
                      <div key={c.label} className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg border border-border" style={{ backgroundColor: c.color }} />
                        <div><p className="text-[10px] text-muted-foreground">{c.label}</p><p className="text-xs font-mono text-foreground">{c.color}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div><p className="text-sm font-medium text-foreground">Remover marca "Powered by OmniCRM"</p><p className="text-[10px] text-muted-foreground">Disponível no plano Enterprise</p></div>
                  <button className="relative h-5 w-9 rounded-full bg-primary"><span className="absolute top-0.5 left-4 h-4 w-4 rounded-full bg-primary-foreground shadow-sm" /></button>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold text-foreground">E-mails Customizados</h3>
                {["Template de boas-vindas", "Notificações", "Redefinição de senha", "Faturas"].map(t => (
                  <div key={t} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <span className="text-sm text-foreground">{t}</span>
                    <button className="text-xs text-primary font-medium hover:underline">Customizar</button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "reseller" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <Building className="h-6 w-6 text-primary" />
                  <div><h3 className="text-lg font-bold font-display text-foreground">Programa de Parceiros</h3><p className="text-xs text-muted-foreground">Revenda OmniCRM com sua marca para seus clientes</p></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Clientes Ativos", value: "3" },
                    { label: "MRR Total", value: "R$ 8.200" },
                    { label: "Comissão Mensal", value: "R$ 1.640" },
                    { label: "Taxa", value: "20%" },
                  ].map(s => (
                    <div key={s.label} className="text-center"><p className="text-lg font-bold text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Clientes Reseller</h3>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium"><Plus className="h-3.5 w-3.5" /> Novo Cliente</button>
                </div>
                {resellerClients.map(c => (
                  <div key={c.name} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div><p className="text-sm font-medium text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.users} usuários · {c.mrr}/mês</p></div>
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", c.status === "Ativo" ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent-foreground")}>{c.status}</span>
                      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Settings2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "multiregion" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2"><Server className="h-5 w-5 text-primary" /> Regiões Ativas</h3>
                {[
                  { region: "🇧🇷 São Paulo (sa-east-1)", status: "Primária", latency: "12ms", load: "45%" },
                  { region: "🇺🇸 Virginia (us-east-1)", status: "Failover", latency: "145ms", load: "0%" },
                  { region: "🇪🇺 Frankfurt (eu-central-1)", status: "Disponível", latency: "210ms", load: "0%" },
                ].map(r => (
                  <div key={r.region} className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.region}</p>
                      <p className="text-xs text-muted-foreground">Latência: {r.latency} · Load: {r.load}</p>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", r.status === "Primária" ? "bg-primary/10 text-primary" : r.status === "Failover" ? "bg-accent/10 text-accent-foreground" : "bg-muted text-muted-foreground")}>{r.status}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-3">
                <h3 className="text-base font-semibold text-foreground">SLA & Uptime</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Uptime 30d", value: "99.97%" },
                    { label: "SLA Contratado", value: "99.9%" },
                    { label: "Incidentes", value: "0" },
                  ].map(s => (
                    <div key={s.label} className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold text-secondary">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminPage;
