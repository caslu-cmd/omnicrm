import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send, Mail, MessageSquare, Plus, Search, Filter, BarChart3,
  Eye, MousePointer, Clock, CheckCircle2, XCircle, Users,
  ChevronDown, Pencil, Copy, Trash2, MoreVertical, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Campaign {
  id: number; name: string; channel: "email" | "whatsapp"; status: "sent" | "scheduled" | "draft"; audience: number; delivered: number; opened: number; clicked: number; replied: number; sentAt: string;
}

const initialCampaigns: Campaign[] = [
  { id: 1, name: "Black Friday 2026", channel: "email", status: "sent", audience: 12450, delivered: 11820, opened: 6540, clicked: 2130, replied: 340, sentAt: "28 Fev" },
  { id: 2, name: "Lançamento Pro Plan", channel: "whatsapp", status: "sent", audience: 3200, delivered: 3180, opened: 2890, clicked: 1450, replied: 890, sentAt: "25 Fev" },
  { id: 3, name: "Newsletter Março", channel: "email", status: "scheduled", audience: 8900, delivered: 0, opened: 0, clicked: 0, replied: 0, sentAt: "5 Mar 09:00" },
  { id: 4, name: "Reativação Inativos", channel: "whatsapp", status: "draft", audience: 1560, delivered: 0, opened: 0, clicked: 0, replied: 0, sentAt: "—" },
  { id: 5, name: "Webinar Convite", channel: "email", status: "sent", audience: 5600, delivered: 5320, opened: 3100, clicked: 1800, replied: 210, sentAt: "20 Fev" },
];

const statusConfig = {
  sent: { label: "Enviada", color: "bg-secondary/10 text-secondary", icon: CheckCircle2 },
  scheduled: { label: "Agendada", color: "bg-primary/10 text-primary", icon: Clock },
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: Pencil },
};

const channelIcon = { email: Mail, whatsapp: MessageSquare };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const CampaignsPage = () => {
  const [tab, setTab] = useState<"list" | "compose">("list");
  const [composeChannel, setComposeChannel] = useState<"email" | "whatsapp">("email");
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [searchCamp, setSearchCamp] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignContent, setCampaignContent] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");

  const filtered = campaigns.filter(c => c.name.toLowerCase().includes(searchCamp.toLowerCase()));
  const totalSent = campaigns.filter(c => c.status === "sent").reduce((a, b) => a + b.delivered, 0);
  const totalOpened = campaigns.filter(c => c.status === "sent").reduce((a, b) => a + b.opened, 0);
  const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";

  const handleSendCampaign = () => {
    if (!campaignName.trim()) { toast.error("Nome da campanha é obrigatório"); return; }
    const newCamp: Campaign = { id: Date.now(), name: campaignName, channel: composeChannel, status: scheduleMode === "now" ? "sent" : "scheduled", audience: 12450, delivered: scheduleMode === "now" ? 11820 : 0, opened: 0, clicked: 0, replied: 0, sentAt: scheduleMode === "now" ? "Agora" : "Agendada" };
    setCampaigns(prev => [newCamp, ...prev]);
    setTab("list");
    setCampaignName(""); setCampaignSubject(""); setCampaignContent("");
    toast.success(scheduleMode === "now" ? `Campanha "${campaignName}" enviada!` : `Campanha "${campaignName}" agendada!`);
  };

  const handleDuplicate = (id: number) => {
    const c = campaigns.find(x => x.id === id);
    if (!c) return;
    setCampaigns(prev => [...prev, { ...c, id: Date.now(), name: `${c.name} (cópia)`, status: "draft", delivered: 0, opened: 0, clicked: 0, replied: 0 }]);
    toast.success(`Campanha duplicada`);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 md:p-6 space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold font-display text-foreground">Campanhas</h1><p className="text-sm text-muted-foreground mt-1">{campaigns.length} campanhas · {avgOpenRate}% taxa de abertura média</p></div>
        <button onClick={() => setTab("compose")} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"><Plus className="h-4 w-4" /> Nova Campanha</button>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Enviadas", value: totalSent.toLocaleString(), icon: Send, color: "primary" },
          { label: "Abertas", value: totalOpened.toLocaleString(), icon: Eye, color: "secondary" },
          { label: "Clicadas", value: campaigns.filter(c => c.status === "sent").reduce((a, b) => a + b.clicked, 0).toLocaleString(), icon: MousePointer, color: "accent" },
          { label: "Respondidas", value: campaigns.filter(c => c.status === "sent").reduce((a, b) => a + b.replied, 0).toLocaleString(), icon: MessageSquare, color: "primary" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", s.color === "primary" ? "bg-primary/10 text-primary" : s.color === "secondary" ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent-foreground")}><s.icon className="h-5 w-5" /></div>
            <div><p className="text-lg font-bold font-display text-foreground">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </div>
        ))}
      </motion.div>

      {tab === "list" && (
        <>
          <motion.div variants={item} className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={searchCamp} onChange={e => setSearchCamp(e.target.value)} placeholder="Buscar campanhas..." className="w-full rounded-lg border border-input bg-card py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <button onClick={() => toast.info("Filtros de campanha")} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-card text-sm font-medium text-muted-foreground hover:text-foreground"><Filter className="h-4 w-4" /> Filtros</button>
          </motion.div>

          <motion.div variants={item} className="space-y-3">
            {filtered.map(c => {
              const status = statusConfig[c.status]; const StatusIcon = status.icon; const ChannelIcon = channelIcon[c.channel];
              const openRate = c.delivered > 0 ? ((c.opened / c.delivered) * 100).toFixed(1) : "—";
              const clickRate = c.delivered > 0 ? ((c.clicked / c.delivered) * 100).toFixed(1) : "—";
              return (
                <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", c.channel === "email" ? "bg-primary/10" : "bg-secondary/10")}><ChannelIcon className={cn("h-5 w-5", c.channel === "email" ? "text-primary" : "text-secondary")} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><h3 className="text-sm font-semibold text-foreground">{c.name}</h3><span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium", status.color)}><StatusIcon className="h-3 w-3" /> {status.label}</span></div>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.channel === "email" ? "E-mail" : "WhatsApp"} · {c.audience.toLocaleString()} destinatários · {c.sentAt}</p>
                    </div>
                    {c.status === "sent" && (
                      <div className="hidden lg:flex items-center gap-6 text-center">
                        <div><p className="text-sm font-bold text-foreground">{c.delivered.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Entregues</p></div>
                        <div><p className="text-sm font-bold text-foreground">{openRate}%</p><p className="text-[10px] text-muted-foreground">Abertura</p></div>
                        <div><p className="text-sm font-bold text-foreground">{clickRate}%</p><p className="text-[10px] text-muted-foreground">Cliques</p></div>
                        <div><p className="text-sm font-bold text-foreground">{c.replied}</p><p className="text-[10px] text-muted-foreground">Respostas</p></div>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <button onClick={() => toast.info(`Relatório de "${c.name}"`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><BarChart3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDuplicate(c.id)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Copy className="h-4 w-4" /></button>
                      <button onClick={() => toast.info(`Opções de "${c.name}"`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><MoreVertical className="h-4 w-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </>
      )}

      {tab === "compose" && (
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
              <h2 className="text-base font-semibold font-display text-foreground">Nova Campanha</h2>
              <div className="flex gap-2">
                {(["email", "whatsapp"] as const).map(ch => (
                  <button key={ch} onClick={() => setComposeChannel(ch)} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors", composeChannel === ch ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}>
                    {ch === "email" ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}{ch === "email" ? "E-mail" : "WhatsApp"}
                  </button>
                ))}
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Nome da Campanha</label><input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Ex: Newsletter Março 2026" className="w-full mt-1 rounded-lg border border-input bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
              {composeChannel === "email" && (
                <>
                  <div><label className="text-xs font-medium text-muted-foreground">Assunto</label><input value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)} placeholder="Linha de assunto do e-mail" className="w-full mt-1 rounded-lg border border-input bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Conteúdo</label><textarea value={campaignContent} onChange={e => setCampaignContent(e.target.value)} rows={8} placeholder="Compose seu e-mail aqui..." className="w-full mt-1 rounded-xl border border-input bg-background py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none" /></div>
                </>
              )}
              {composeChannel === "whatsapp" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Template WhatsApp (aprovado)</label>
                  <select className="w-full mt-1 rounded-lg border border-input bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20">
                    <option>Selecionar template...</option><option>{"Boas-vindas - Olá {{nome}}, bem-vindo!"}</option><option>{"Follow-up - {{nome}}, vimos seu interesse em..."}</option><option>{"Promoção - Oferta especial para você, {{nome}}"}</option>
                  </select>
                  <div className="mt-3 rounded-lg bg-muted/50 p-4 border border-border">
                    <p className="text-xs text-muted-foreground mb-2">Preview do template:</p>
                    <div className="bg-secondary/10 rounded-lg p-3 text-sm text-foreground">Olá <span className="font-semibold text-primary">{'{{nome}}'}</span>, bem-vindo ao OmniCRM! 🎉<br />Estamos felizes em ter você conosco. Precisa de ajuda?</div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTab("list")} className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground">Cancelar</button>
              <button onClick={() => { setCampaigns(prev => [...prev, { id: Date.now(), name: campaignName || "Rascunho", channel: composeChannel, status: "draft", audience: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, sentAt: "—" }]); setTab("list"); toast.success("Rascunho salvo"); }} className="px-4 py-2.5 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/80">Salvar Rascunho</button>
              <button onClick={handleSendCampaign} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2"><Send className="h-4 w-4" /> {scheduleMode === "now" ? "Enviar Agora" : "Agendar"}</button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Audiência</h3>
              <select className="w-full rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"><option>Todos os contatos (12.450)</option><option>Leads Quentes (2.340)</option><option>Clientes Ativos (5.670)</option><option>Inativos 30+ dias (1.560)</option></select>
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total</span><span className="font-semibold text-foreground">12.450</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Opt-in válido</span><span className="font-semibold text-secondary">11.820</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Bounced</span><span className="font-semibold text-destructive">630</span></div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Agendamento</h3>
              <div className="flex gap-2">
                <button onClick={() => setScheduleMode("now")} className={cn("flex-1 px-3 py-2 rounded-lg border text-sm font-medium", scheduleMode === "now" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground")}>Agora</button>
                <button onClick={() => setScheduleMode("later")} className={cn("flex-1 px-3 py-2 rounded-lg border text-sm font-medium", scheduleMode === "later" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground")}>Agendar</button>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> A/B Testing</h3>
              <p className="text-xs text-muted-foreground">Teste variações de assunto ou conteúdo.</p>
              <button onClick={() => toast.info("Criando variação A/B...")} className="w-full py-2 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary">+ Criar Variação</button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CampaignsPage;
