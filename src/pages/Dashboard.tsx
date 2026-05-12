import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, Users, GitBranch, TrendingUp, Mail, Calendar,
  ArrowUpRight, ArrowDownRight, Clock, Zap
} from "lucide-react";
import { toast } from "sonner";

const stats = [
  { label: "Conversas Ativas", value: "247", change: "+12%", up: true, icon: MessageSquare, color: "primary" },
  { label: "Novos Contatos", value: "89", change: "+23%", up: true, icon: Users, color: "secondary" },
  { label: "Deals no Pipeline", value: "R$ 184k", change: "+8%", up: true, icon: GitBranch, color: "primary" },
  { label: "Taxa de Conversão", value: "34.2%", change: "-2.1%", up: false, icon: TrendingUp, color: "accent" },
];

const recentActivity = [
  { id: 1, type: "message", text: "Maria Silva enviou mensagem via WhatsApp", time: "2 min", avatar: "MS" },
  { id: 2, type: "deal", text: "Deal 'Projeto Alpha' movido para Proposta", time: "15 min", avatar: "JP" },
  { id: 3, type: "email", text: "Campanha 'Black Friday' entregue - 94.2% deliverability", time: "1h", avatar: "📧" },
  { id: 4, type: "contact", text: "Novo contato via landing page: Carlos Mendes", time: "2h", avatar: "CM" },
  { id: 5, type: "automation", text: "Follow-up automático enviado para 12 leads", time: "3h", avatar: "⚡" },
];

const topDeals = [
  { name: "Projeto Alpha", company: "Tech Corp", value: "R$ 45.000", stage: "Proposta", probability: 70 },
  { name: "Consultoria Beta", company: "Innovation Ltd", value: "R$ 32.000", stage: "Negociação", probability: 55 },
  { name: "Licença Enterprise", company: "Mega SA", value: "R$ 78.000", stage: "Qualificação", probability: 30 },
];

const upcomingMeetings = [
  { title: "Demo com Tech Corp", time: "14:00", date: "Hoje" },
  { title: "Follow-up Innovation", time: "10:30", date: "Amanhã" },
  { title: "Onboarding Mega SA", time: "15:00", date: "Qui" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

const colorMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent-foreground",
};

const Dashboard = () => {
  const navigate = useNavigate();

  const ctaActions: Record<string, () => void> = {
    "Novo Lead": () => navigate("/contacts"),
    "Nova Automação": () => navigate("/automations"),
    "Novo Broadcast": () => navigate("/campaigns"),
  };

  const activityRoutes: Record<string, string> = {
    message: "/inbox",
    deal: "/pipelines",
    email: "/campaigns",
    contact: "/contacts",
    automation: "/automations",
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 md:p-6 space-y-6 min-w-0 break-words">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do seu CRM — Hoje, 1 Mar 2026</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={item} onClick={() => {
            if (s.label === "Conversas Ativas") navigate("/inbox");
            else if (s.label === "Novos Contatos") navigate("/contacts");
            else if (s.label === "Deals no Pipeline") navigate("/pipelines");
            else navigate("/reports");
          }} className="rounded-xl bg-card border border-border p-5 shadow-card hover:shadow-elevated transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[s.color]}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-semibold ${s.up ? "text-secondary" : "text-destructive"}`}>
                {s.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {s.change}
              </span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <motion.div variants={item} className="lg:col-span-2 rounded-xl bg-card border border-border p-5 shadow-card">
          <h2 className="text-base font-semibold font-display text-foreground mb-4">Atividade Recente</h2>
          <div className="space-y-3">
            {recentActivity.map((a) => (
              <div key={a.id} onClick={() => navigate(activityRoutes[a.type] || "/")} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {a.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {a.time} atrás
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Deals + Meetings */}
        <div className="space-y-6">
          <motion.div variants={item} className="rounded-xl bg-card border border-border p-5 shadow-card">
            <h2 className="text-base font-semibold font-display text-foreground mb-4">Top Deals</h2>
            <div className="space-y-3">
              {topDeals.map((d) => (
                <div key={d.name} onClick={() => navigate("/pipelines")} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors flex-wrap gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.company} · {d.stage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{d.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-secondary" style={{ width: `${d.probability}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{d.probability}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="rounded-xl bg-card border border-border p-5 shadow-card">
            <h2 className="text-base font-semibold font-display text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Próximas Reuniões
            </h2>
            <div className="space-y-2.5">
              {upcomingMeetings.map((m) => (
                <div key={m.title} onClick={() => navigate("/scheduling")} className="flex items-center justify-between p-2.5 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors flex-wrap gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground">{m.time}</p>
                  </div>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">{m.date}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Novo Lead", desc: "Criar contato e adicionar ao pipeline", color: "primary" },
          { icon: Zap, label: "Nova Automação", desc: "Escolher template ou criar do zero", color: "secondary" },
          { icon: Mail, label: "Novo Broadcast", desc: "Enviar campanha por e-mail ou WhatsApp", color: "accent" },
        ].map((cta) => (
          <button
            key={cta.label}
            onClick={() => ctaActions[cta.label]()}
            className="flex items-center gap-4 rounded-xl bg-card border border-border p-5 shadow-card hover:shadow-elevated hover:border-primary/30 transition-all text-left group"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorMap[cta.color]} group-hover:scale-105 transition-transform`}>
              <cta.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{cta.label}</p>
              <p className="text-xs text-muted-foreground">{cta.desc}</p>
            </div>
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
