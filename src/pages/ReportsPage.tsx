import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Users, Mail, MessageSquare, DollarSign,
  Download, Calendar, Filter, Eye, MousePointer, ArrowUpRight,
  ArrowDownRight, Target, Layers, Zap, Plus, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const revenueData = [
  { month: "Set", value: 42000 }, { month: "Out", value: 48000 }, { month: "Nov", value: 55000 },
  { month: "Dez", value: 72000 }, { month: "Jan", value: 61000 }, { month: "Fev", value: 68000 },
];

const campaignData = [
  { name: "Email BF", sent: 12450, opened: 6540, clicked: 2130 },
  { name: "WA Pro", sent: 3200, opened: 2890, clicked: 1450 },
  { name: "Newsletter", sent: 8900, opened: 4200, clicked: 1600 },
  { name: "Webinar", sent: 5600, opened: 3100, clicked: 1800 },
];

const channelData = [
  { name: "WhatsApp", value: 42, color: "hsl(168, 75%, 36%)" },
  { name: "E-mail", value: 31, color: "hsl(196, 87%, 32%)" },
  { name: "Instagram", value: 18, color: "hsl(37, 91%, 55%)" },
  { name: "Messenger", value: 9, color: "hsl(220, 9%, 46%)" },
];

const pipelineData = [
  { stage: "Lead", count: 45, value: 180000 },
  { stage: "Qualif.", count: 28, value: 320000 },
  { stage: "Proposta", count: 15, value: 450000 },
  { stage: "Negociação", count: 8, value: 280000 },
  { stage: "Fechado", count: 12, value: 520000 },
];

const deliverabilityData = [
  { day: "24", delivered: 98.2, bounced: 1.8 },
  { day: "25", delivered: 97.8, bounced: 2.2 },
  { day: "26", delivered: 98.5, bounced: 1.5 },
  { day: "27", delivered: 99.1, bounced: 0.9 },
  { day: "28", delivered: 98.8, bounced: 1.2 },
  { day: "01", delivered: 99.2, bounced: 0.8 },
];

const kpis = [
  { label: "Receita Mensal", value: "R$ 68k", change: "+11.4%", up: true, icon: DollarSign },
  { label: "Novos Leads", value: "342", change: "+23%", up: true, icon: Users },
  { label: "Taxa de Conversão", value: "34.2%", change: "-2.1%", up: false, icon: TrendingUp },
  { label: "Msgs Enviadas", value: "18.4k", change: "+8%", up: true, icon: MessageSquare },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const ReportsPage = () => {
  const [period, setPeriod] = useState("30d");
  const [reportTab, setReportTab] = useState<"analytics" | "cdp">("analytics");

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">Analytics consolidados do seu CRM</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            {["7d", "30d", "90d", "1y"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-card text-sm font-medium text-muted-foreground hover:text-foreground">
            <Download className="h-4 w-4" /> Exportar
          </button>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <motion.div key={k.label} variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><k.icon className="h-5 w-5" /></div>
              <span className={cn("flex items-center gap-1 text-xs font-semibold", k.up ? "text-secondary" : "text-destructive")}>
                {k.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />} {k.change}
              </span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{k.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{k.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-base font-semibold font-display text-foreground mb-4">Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(196, 87%, 32%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(196, 87%, 32%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} tickFormatter={v => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString()}`, "Receita"]} />
              <Area type="monotone" dataKey="value" stroke="hsl(196, 87%, 32%)" strokeWidth={2} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Campaign Performance */}
        <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-base font-semibold font-display text-foreground mb-4">Performance de Campanhas</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={campaignData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sent" name="Enviados" fill="hsl(196, 87%, 32%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="opened" name="Abertos" fill="hsl(168, 75%, 36%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clicked" name="Clicados" fill="hsl(37, 91%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Channel Distribution */}
        <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-base font-semibold font-display text-foreground mb-4">Conversas por Canal</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={channelData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={4}>
                  {channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {channelData.map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm text-foreground font-medium">{c.name}</span>
                  <span className="text-sm text-muted-foreground ml-auto">{c.value}%</span>
                </div>
              ))}
        </div>
        <div className="flex bg-muted rounded-lg p-0.5 ml-3">
          {[{ key: "analytics", label: "Analytics" }, { key: "cdp", label: "CDP & Audiências" }].map(t => (
            <button key={t.key} onClick={() => setReportTab(t.key as typeof reportTab)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", reportTab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
        </motion.div>

        {/* Pipeline Funnel */}
        <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-base font-semibold font-display text-foreground mb-4">Funil de Pipeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipelineData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fill: "hsl(220, 9%, 46%)" }} width={70} />
              <Tooltip formatter={(v: number) => [`${v} deals`, ""]} />
              <Bar dataKey="count" fill="hsl(196, 87%, 32%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Deliverability */}
      <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-base font-semibold font-display text-foreground mb-4">Entregabilidade de E-mail</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={deliverabilityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} />
            <YAxis domain={[95, 100]} tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} tickFormatter={v => `${v}%`} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="delivered" name="Entregue %" stroke="hsl(168, 75%, 36%)" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="bounced" name="Bounce %" stroke="hsl(0, 70%, 62%)" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* CDP & Audience Builder */}
      {reportTab === "cdp" && (
        <div className="space-y-6">
          {/* Audience Segments */}
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "Leads Quentes", size: 2340, conversion: "34%", icon: Target, color: "primary" },
              { name: "Clientes Recorrentes", size: 5670, conversion: "78%", icon: Users, color: "secondary" },
              { name: "Risco de Churn", size: 456, conversion: "12%", icon: TrendingUp, color: "destructive" },
            ].map(seg => (
              <div key={seg.name} className="rounded-xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", seg.color === "primary" ? "bg-primary/10 text-primary" : seg.color === "secondary" ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive")}>
                    <seg.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{seg.name}</p>
                    <p className="text-xs text-muted-foreground">{seg.size.toLocaleString()} contatos</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Taxa conversão: <span className="font-semibold text-foreground">{seg.conversion}</span></span>
                  <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1"><Zap className="h-3 w-3" /> Ativar</button>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Audience Builder */}
          <motion.div variants={item} className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> Construtor de Audiência (CDP)</h3>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium"><Plus className="h-3.5 w-3.5" /> Nova Audiência</button>
            </div>
            <p className="text-xs text-muted-foreground">Combine critérios para criar segmentos avançados e ativar em campanhas omnichannel</p>

            <div className="space-y-3">
              <div className="rounded-lg border border-border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Regras do Segmento</p>
                {[
                  { field: "Último contato", op: "menor que", value: "7 dias" },
                  { field: "Score", op: "maior que", value: "70" },
                  { field: "Canal preferido", op: "é", value: "WhatsApp" },
                ].map((rule, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">E</span>}
                    <select className="rounded-lg border border-input bg-background py-1.5 px-2.5 text-xs" defaultValue={rule.field}>
                      <option>{rule.field}</option>
                    </select>
                    <select className="rounded-lg border border-input bg-background py-1.5 px-2.5 text-xs" defaultValue={rule.op}>
                      <option>{rule.op}</option>
                    </select>
                    <input defaultValue={rule.value} className="rounded-lg border border-input bg-background py-1.5 px-2.5 text-xs w-24" />
                  </div>
                ))}
                <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1"><Plus className="h-3 w-3" /> Adicionar regra</button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-foreground">Resultado: <span className="font-bold text-primary">1.847 contatos</span> correspondem</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground">Salvar Segmento</button>
                  <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1"><Zap className="h-3 w-3" /> Ativar em Campanha</button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Saved Audiences */}
          <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Audiências Salvas</h3>
            {[
              { name: "Leads Quentes WA", size: 2340, lastSync: "5 min", campaigns: 3 },
              { name: "Clientes Enterprise", size: 156, lastSync: "1h", campaigns: 1 },
              { name: "Inativos 30d+", size: 1560, lastSync: "2h", campaigns: 2 },
              { name: "Alto Valor (>R$10k)", size: 89, lastSync: "30 min", campaigns: 4 },
            ].map(a => (
              <div key={a.name} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-secondary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground">{a.size.toLocaleString()} contatos · Sync: {a.lastSync} atrás · {a.campaigns} campanhas</p>
                  </div>
                </div>
                <button className="text-xs text-primary font-medium hover:underline">Editar</button>
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ReportsPage;
