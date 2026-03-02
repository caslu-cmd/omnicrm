import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Download, Settings2, DollarSign, Eye, Calendar, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const statusColors: Record<string, string> = {
  Pago: "bg-secondary/10 text-secondary",
  Pendente: "bg-accent/10 text-accent-foreground",
  Atrasado: "bg-destructive/10 text-destructive",
};

const PaymentsPage = () => {
  const [tab, setTab] = useState<"plan" | "invoices" | "gateway">("plan");
  const [profile, setProfile] = useState<any>(null);
  const [wlSettings, setWlSettings] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      const { data: wl } = await supabase.from("white_label_settings").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(p);
      setWlSettings(wl);
    };
    load();
  }, []);

  const currentPlan = wlSettings?.remove_branding ? "Enterprise" : "Pro";
  const planPrice = currentPlan === "Enterprise" ? "R$ 997,00" : "R$ 297,00";

  const myInvoices = [
    { id: 1, description: "Assinatura mensal", amount: planPrice, date: "1 Mar 2026", status: "Pago" },
    { id: 2, description: "Assinatura mensal", amount: planPrice, date: "1 Fev 2026", status: "Pago" },
    { id: 3, description: "Assinatura mensal", amount: planPrice, date: "1 Jan 2026", status: "Pago" },
    { id: 4, description: "Assinatura mensal", amount: planPrice, date: "1 Dez 2025", status: "Pago" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display text-foreground">Minha Assinatura</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seu plano, faturas e método de pagamento</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Plano Atual", value: currentPlan, icon: CreditCard, color: "primary" },
          { label: "Valor Mensal", value: planPrice, icon: DollarSign, color: "secondary" },
          { label: "Próxima Cobrança", value: "1 Abr 2026", icon: Calendar, color: "accent" },
        ].map(s => (
          <motion.div key={s.label} variants={item} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", s.color === "primary" ? "bg-primary/10 text-primary" : s.color === "secondary" ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent-foreground")}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold font-display text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {[{ key: "plan", label: "Meu Plano" }, { key: "invoices", label: "Faturas" }, { key: "gateway", label: "Pagamento" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", tab === t.key ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Plan tab */}
      {tab === "plan" && (
        <motion.div variants={item} className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5 max-w-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-display text-foreground">{currentPlan}</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary/10 text-secondary">Ativo</span>
          </div>
          <p className="text-2xl font-bold text-primary">{planPrice}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✅ White-Label personalizado</p>
            <p>✅ {currentPlan === "Enterprise" ? "Usuários ilimitados" : "10 usuários"}</p>
            <p>✅ {currentPlan === "Enterprise" ? "100.000 contatos" : "10.000 contatos"}</p>
            <p>✅ {currentPlan === "Enterprise" ? "Branding removido" : "Branding customizado"}</p>
            {wlSettings?.custom_domain && <p>✅ Domínio: {wlSettings.custom_domain}</p>}
          </div>
          <button onClick={() => toast.info("Fale com o suporte para mudar de plano")} className="w-full py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            Alterar Plano
          </button>
        </motion.div>
      )}

      {/* Invoices tab */}
      {tab === "invoices" && (
        <motion.div variants={item} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground">Minhas Faturas</h3>
            <button onClick={() => toast.success("Exportando faturas...")} className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"><Download className="h-3 w-3" /> Exportar</button>
          </div>
          <table className="w-full">
            <thead><tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Descrição</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Valor</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Data</th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase px-5 py-3">Status</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody>
              {myInvoices.map(inv => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 text-sm font-medium text-foreground flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{inv.description}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-foreground">{inv.amount}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{inv.date}</td>
                  <td className="px-5 py-3"><span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", statusColors[inv.status])}>{inv.status}</span></td>
                  <td className="px-5 py-3">
                    <button onClick={() => toast.info("Baixando fatura...")} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Eye className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Payment method tab */}
      {tab === "gateway" && (
        <motion.div variants={item} className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5 max-w-lg">
          <h3 className="text-sm font-semibold text-foreground">Método de Pagamento</h3>
          <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
            <span className="text-2xl">💳</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">•••• •••• •••• 4242</p>
              <p className="text-xs text-muted-foreground">Visa · Expira 12/2028</p>
            </div>
            <button onClick={() => toast.info("Abrindo configurações de pagamento...")} className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground"><Settings2 className="h-3 w-3 inline mr-1" />Alterar</button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>🔒 Pagamentos processados de forma segura</p>
            <p>📧 Recibos enviados para {profile?.display_name || "seu e-mail"}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PaymentsPage;
