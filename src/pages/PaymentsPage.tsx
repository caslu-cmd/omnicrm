import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Plus, Download, CheckCircle2, Clock, AlertTriangle,
  Settings2, ChevronRight, DollarSign, Users, TrendingUp, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const plans = [
  { id: 1, name: "Starter", price: "R$ 97/mês", users: 3, contacts: "1.000", status: "active", subscribers: 45 },
  { id: 2, name: "Pro", price: "R$ 297/mês", users: 10, contacts: "10.000", status: "active", subscribers: 128 },
  { id: 3, name: "Enterprise", price: "R$ 997/mês", users: "Ilimitado", contacts: "100.000", status: "active", subscribers: 34 },
];

const invoices = [
  { id: 1, client: "Tech Solutions", plan: "Pro", amount: "R$ 297,00", date: "1 Mar 2026", status: "Pago" },
  { id: 2, client: "Innovation Ltd", plan: "Enterprise", amount: "R$ 997,00", date: "1 Mar 2026", status: "Pago" },
  { id: 3, client: "Design Studio", plan: "Starter", amount: "R$ 97,00", date: "1 Mar 2026", status: "Pendente" },
  { id: 4, client: "Mega Corp", plan: "Enterprise", amount: "R$ 997,00", date: "28 Fev 2026", status: "Pago" },
  { id: 5, client: "Startup X", plan: "Pro", amount: "R$ 297,00", date: "28 Fev 2026", status: "Atrasado" },
];

const gateways = [
  { name: "Stripe", status: "Conectado", icon: "💳" },
  { name: "PayPal", status: "Conectado", icon: "💰" },
  { name: "Mercado Pago", status: "Desconectado", icon: "🇧🇷" },
  { name: "Pagar.me", status: "Desconectado", icon: "💵" },
];

const statusColors: Record<string, string> = {
  Pago: "bg-secondary/10 text-secondary",
  Pendente: "bg-accent/10 text-accent-foreground",
  Atrasado: "bg-destructive/10 text-destructive",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const PaymentsPage = () => {
  const [tab, setTab] = useState<"plans" | "invoices" | "gateways">("plans");
  const [gwState, setGwState] = useState(gateways);

  const totalMRR = plans.reduce((a, p) => a + p.subscribers * parseInt(p.price.replace(/[^\d]/g, "")), 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Pagamentos & Assinaturas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie planos, faturas e gateways de pagamento</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "MRR", value: `R$ ${(totalMRR / 1000).toFixed(0)}k`, icon: DollarSign, color: "primary" },
          { label: "Assinantes", value: plans.reduce((a, p) => a + p.subscribers, 0).toString(), icon: Users, color: "secondary" },
          { label: "Taxa Inadimplência", value: "2.3%", icon: AlertTriangle, color: "accent" },
          { label: "Crescimento", value: "+18%", icon: TrendingUp, color: "primary" },
        ].map(s => (
          <motion.div key={s.label} variants={item} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", s.color === "primary" ? "bg-primary/10 text-primary" : s.color === "secondary" ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent-foreground")}>
              <s.icon className="h-5 w-5" />
            </div>
            <div><p className="text-lg font-bold font-display text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item} className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {[{ key: "plans", label: "Planos" }, { key: "invoices", label: "Faturas" }, { key: "gateways", label: "Gateways" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", tab === t.key ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </motion.div>

      {tab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(p => (
            <motion.div key={p.id} variants={item} className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-display text-foreground">{p.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary/10 text-secondary">Ativo</span>
              </div>
              <p className="text-2xl font-bold text-primary">{p.price}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>👥 {p.users} usuários</p>
                <p>📇 {p.contacts} contatos</p>
                <p>📊 {p.subscribers} assinantes</p>
              </div>
              <button onClick={() => toast.info(`Editando plano ${p.name}`)} className="w-full py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Editar Plano
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "invoices" && (
        <motion.div variants={item} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">Faturas Recentes</h3>
            <button onClick={() => toast.success("Exportando faturas...")} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"><Download className="h-3 w-3" /> Exportar</button>
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Cliente</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Plano</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Valor</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Data</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 text-sm font-medium text-foreground">{inv.client}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{inv.plan}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-foreground">{inv.amount}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{inv.date}</td>
                  <td className="px-5 py-3"><span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", statusColors[inv.status])}>{inv.status}</span></td>
                  <td className="px-5 py-3">
                    <button onClick={() => toast.info(`Visualizando fatura de ${inv.client}`)} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Eye className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {tab === "gateways" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gwState.map((gw, i) => (
            <motion.div key={gw.name} variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{gw.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{gw.name}</h3>
                  <span className={cn("text-[11px] font-medium", gw.status === "Conectado" ? "text-secondary" : "text-muted-foreground")}>{gw.status}</span>
                </div>
              </div>
              {gw.status === "Conectado" ? (
                <div className="flex gap-2">
                  <button onClick={() => toast.info(`Configurações do ${gw.name}`)} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground"><Settings2 className="h-3 w-3 inline mr-1" />Config</button>
                  <button onClick={() => { setGwState(prev => prev.map((g, j) => j === i ? { ...g, status: "Desconectado" } : g)); toast.info(`${gw.name} desconectado`); }} className="px-3 py-1.5 rounded-lg border border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/10">Desconectar</button>
                </div>
              ) : (
                <button onClick={() => { setGwState(prev => prev.map((g, j) => j === i ? { ...g, status: "Conectado" } : g)); toast.success(`${gw.name} conectado!`); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">Conectar</button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default PaymentsPage;
