import { useState } from "react";
import { motion } from "framer-motion";
import {
  HelpCircle, BookOpen, Code, Zap, Download, ExternalLink, Search,
  Star, Users, GitBranch, Copy, Play, ChevronRight, Globe, Award,
  Package, FileCode, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const tabs = [
  { key: "templates", label: "Templates", icon: Zap },
  { key: "marketplace", label: "Marketplace", icon: Package },
  { key: "sdk", label: "SDK & API", icon: Code },
  { key: "partners", label: "Parceiros", icon: Users },
];

const workflowTemplates = [
  { id: 1, name: "Follow-up Inteligente 5 Dias", category: "Vendas", author: "OmniCRM", downloads: 3420, rating: 4.9, nodes: 8 },
  { id: 2, name: "Qualificação de Lead com IA", category: "IA", author: "OmniCRM", downloads: 2150, rating: 4.8, nodes: 6 },
  { id: 3, name: "Onboarding Omnichannel", category: "Onboarding", author: "Agência Alpha", downloads: 1230, rating: 4.7, nodes: 10 },
  { id: 4, name: "Recuperação de Carrinho WA", category: "E-commerce", author: "CommerceHub", downloads: 890, rating: 4.6, nodes: 7 },
  { id: 5, name: "Review Response Automático", category: "Reputação", author: "OmniCRM", downloads: 780, rating: 4.8, nodes: 4 },
  { id: 6, name: "Social Scheduling Pro", category: "Social", author: "SocialKit", downloads: 654, rating: 4.5, nodes: 9 },
];

const marketplaceItems = [
  { name: "CRM Analytics Pro", type: "Plugin", author: "DataViz Inc", price: "R$ 49/mês", installs: 1200, rating: 4.7 },
  { name: "WhatsApp Bulk Sender", type: "Extensão", author: "MsgFlow", price: "R$ 29/mês", installs: 3400, rating: 4.5 },
  { name: "AI Content Generator", type: "Plugin", author: "ContentAI", price: "Grátis", installs: 5600, rating: 4.8 },
  { name: "Custom Dashboard Builder", type: "Plugin", author: "DashKit", price: "R$ 19/mês", installs: 890, rating: 4.4 },
  { name: "Multi-Language Pack", type: "Extensão", author: "i18nPro", price: "Grátis", installs: 2300, rating: 4.6 },
  { name: "Advanced Reports Export", type: "Plugin", author: "ReportLab", price: "R$ 15/mês", installs: 1100, rating: 4.3 },
];

const sdkEndpoints = [
  { method: "GET", path: "/api/v1/contacts", desc: "Listar contatos com filtros" },
  { method: "POST", path: "/api/v1/contacts", desc: "Criar novo contato" },
  { method: "GET", path: "/api/v1/conversations", desc: "Listar conversas" },
  { method: "POST", path: "/api/v1/messages/send", desc: "Enviar mensagem" },
  { method: "GET", path: "/api/v1/pipelines", desc: "Listar pipelines e deals" },
  { method: "POST", path: "/api/v1/automations/trigger", desc: "Disparar automação" },
  { method: "GET", path: "/api/v1/reports", desc: "Obter relatórios" },
  { method: "POST", path: "/api/v1/webhooks", desc: "Registrar webhook" },
];

const methodColors: Record<string, string> = {
  GET: "bg-secondary/10 text-secondary",
  POST: "bg-primary/10 text-primary",
  PUT: "bg-accent/10 text-accent-foreground",
  DELETE: "bg-destructive/10 text-destructive",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const HelpPage = () => {
  const [tab, setTab] = useState("templates");

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 md:p-6 space-y-6 min-w-0 break-words">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold font-display text-foreground">Ajuda, SDK & Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-1">Templates validados, marketplace de plugins, SDK público e programa de parceiros</p>
      </motion.div>

      <motion.div variants={item} className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors", tab === t.key ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </motion.div>

      {tab === "templates" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder="Buscar templates..." className="w-full rounded-lg border border-input bg-card py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflowTemplates.map(t => (
              <motion.div key={t.id} variants={item} whileHover={{ y: -2 }} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Zap className="h-5 w-5 text-primary" /></div>
                  <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-accent-foreground fill-accent" /><span className="text-xs font-semibold text-foreground">{t.rating}</span></div>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">por {t.author} · {t.nodes} nodes</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">{t.category}</span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Download className="h-3 w-3" />{t.downloads.toLocaleString()}</span>
                </div>
                <button className="mt-3 w-full py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1"><Play className="h-3 w-3" /> Usar Template</button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {tab === "marketplace" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketplaceItems.map(m => (
            <motion.div key={m.name} variants={item} whileHover={{ y: -2 }} className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10"><Package className="h-5 w-5 text-secondary" /></div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{m.type}</span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">por {m.author}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-semibold text-foreground">{m.price}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-accent-foreground fill-accent" />{m.rating}</span>
                  <span>{m.installs.toLocaleString()} installs</span>
                </div>
              </div>
              <button className="mt-3 w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">Instalar</button>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "sdk" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { lang: "JavaScript/TS", code: "npm install @omnicrm/sdk", icon: "🟨" },
              { lang: "Python", code: "pip install omnicrm", icon: "🐍" },
              { lang: "PHP", code: "composer require omnicrm/sdk", icon: "🐘" },
            ].map(s => (
              <motion.div key={s.lang} variants={item} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center gap-2 mb-2"><span className="text-xl">{s.icon}</span><span className="text-sm font-semibold text-foreground">{s.lang}</span></div>
                <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
                  <code className="text-xs text-foreground font-mono flex-1">{s.code}</code>
                  <button className="p-1 rounded hover:bg-card text-muted-foreground"><Copy className="h-3.5 w-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div variants={item} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="px-5 py-3 bg-muted/30 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><FileCode className="h-4 w-4 text-primary" /> Endpoints da API REST</h3>
            </div>
            <div className="divide-y divide-border">
              {sdkEndpoints.map(e => (
                <div key={e.path} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30">
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold font-mono min-w-14 text-center", methodColors[e.method])}>{e.method}</span>
                  <code className="text-sm font-mono text-foreground flex-1">{e.path}</code>
                  <span className="text-xs text-muted-foreground">{e.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={item} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Webhooks</h3>
            <p className="text-xs text-muted-foreground mb-3">Receba notificações em tempo real sobre eventos no CRM</p>
            <div className="space-y-2">
              {["contact.created", "conversation.new_message", "deal.stage_changed", "campaign.sent", "payment.received"].map(e => (
                <div key={e} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                  <code className="text-xs font-mono text-foreground">{e}</code>
                  <button className="relative h-5 w-9 rounded-full bg-primary"><span className="absolute top-0.5 left-4 h-4 w-4 rounded-full bg-primary-foreground shadow-sm" /></button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {tab === "partners" && (
        <div className="space-y-6">
          <motion.div variants={item} className="rounded-xl border border-primary/20 bg-primary/5 p-8 shadow-card text-center">
            <Award className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold font-display text-foreground mb-2">Programa de Parceiros OmniCRM</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-6">Junte-se ao ecossistema de agências, integradores e MSPs que revendem e expandem o OmniCRM para seus clientes.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-md mx-auto mb-6">
              {[
                { label: "Comissão", value: "até 30%" },
                { label: "Parceiros", value: "120+" },
                { label: "Países", value: "12" },
              ].map(s => (
                <div key={s.label}><p className="text-lg font-bold text-primary">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              ))}
            </div>
            <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90">Aplicar como Parceiro</button>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { tier: "Silver", benefits: ["10% comissão", "Suporte standard", "Badge no perfil", "Treinamento básico"], color: "bg-muted" },
              { tier: "Gold", benefits: ["20% comissão", "Suporte prioritário", "Co-marketing", "White-label básico"], color: "bg-accent/10" },
              { tier: "Platinum", benefits: ["30% comissão", "Gerente dedicado", "White-label full", "SDK access", "SLA premium"], color: "bg-primary/10" },
            ].map(t => (
              <motion.div key={t.tier} variants={item} className={cn("rounded-xl border border-border p-5 shadow-card", t.color)}>
                <h3 className="text-base font-bold font-display text-foreground mb-3">{t.tier}</h3>
                <ul className="space-y-2">
                  {t.benefits.map(b => (
                    <li key={b} className="flex items-center gap-2 text-sm text-foreground"><ChevronRight className="h-3.5 w-3.5 text-primary" />{b}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HelpPage;
