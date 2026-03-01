import { useState } from "react";
import { motion } from "framer-motion";
import {
  Puzzle, Search, CheckCircle2, Plus, ExternalLink, Settings2,
  RefreshCw, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Connector {
  id: number;
  name: string;
  category: string;
  description: string;
  icon: string;
  connected: boolean;
  status?: "active" | "error";
}

const initialConnectors: Connector[] = [
  { id: 1, name: "WhatsApp Business", category: "Mensageria", description: "Meta Business API para envio e recebimento de mensagens", icon: "💬", connected: true, status: "active" },
  { id: 2, name: "Google Calendar", category: "Produtividade", description: "Sincronize agendamentos e reuniões automaticamente", icon: "📅", connected: true, status: "active" },
  { id: 3, name: "Stripe", category: "Pagamentos", description: "Cobranças, assinaturas e gestão de pagamentos", icon: "💳", connected: true, status: "active" },
  { id: 4, name: "Google Ads", category: "Ads", description: "Importe dados de campanhas e conversões", icon: "📊", connected: true, status: "active" },
  { id: 5, name: "Facebook Ads", category: "Ads", description: "Relatórios de performance e conversões", icon: "📈", connected: false },
  { id: 6, name: "Instagram", category: "Social", description: "DMs, comentários e automações de resposta", icon: "📸", connected: true, status: "active" },
  { id: 7, name: "Mailgun", category: "E-mail", description: "Envio transacional com alta entregabilidade", icon: "📧", connected: true, status: "active" },
  { id: 8, name: "Twilio", category: "Voz & SMS", description: "Chamadas, SMS e verificação por telefone", icon: "📞", connected: false },
  { id: 9, name: "Zoom", category: "Produtividade", description: "Criação automática de reuniões e links", icon: "🎥", connected: false },
  { id: 10, name: "Zapier", category: "Automação", description: "Conecte com +5000 apps via workflows", icon: "⚡", connected: false },
  { id: 11, name: "Make (Integromat)", category: "Automação", description: "Automações visuais avançadas entre plataformas", icon: "🔄", connected: false },
  { id: 12, name: "PayPal", category: "Pagamentos", description: "Pagamentos internacionais e checkout", icon: "💰", connected: false },
  { id: 13, name: "Mercado Pago", category: "Pagamentos", description: "Pagamentos e cobranças no Brasil e LATAM", icon: "🇧🇷", connected: false },
  { id: 14, name: "HubSpot", category: "CRM", description: "Sincronize contatos e deals bi-direcionalmente", icon: "🔶", connected: false },
  { id: 15, name: "Slack", category: "Produtividade", description: "Notificações e alertas em canais de equipe", icon: "💬", connected: false },
  { id: 16, name: "Google Business Profile", category: "Reputação", description: "Monitore e responda reviews automaticamente com IA", icon: "⭐", connected: true, status: "active" },
  { id: 17, name: "Outlook Calendar", category: "Produtividade", description: "Sincronize com calendário Microsoft", icon: "📆", connected: false },
  { id: 18, name: "Pagar.me", category: "Pagamentos", description: "Gateway de pagamentos brasileiro", icon: "💵", connected: false },
  { id: 19, name: "SendGrid", category: "E-mail", description: "E-mail marketing e transacional em escala", icon: "✉️", connected: false },
  { id: 20, name: "n8n", category: "Automação", description: "Workflows de automação self-hosted", icon: "🔧", connected: false },
  { id: 21, name: "Calendly", category: "Produtividade", description: "Links de agendamento profissional", icon: "🗓️", connected: false },
  { id: 22, name: "Google Analytics", category: "Analytics", description: "Trafego e conversões do seu site", icon: "📉", connected: false },
  { id: 23, name: "Facebook Messenger", category: "Mensageria", description: "Inbox e automações via Messenger", icon: "💬", connected: true, status: "active" },
  { id: 24, name: "Salesforce", category: "CRM", description: "Integração bidirecional com Salesforce CRM", icon: "☁️", connected: false },
];

const categories = ["Todos", "Mensageria", "Pagamentos", "Ads", "Produtividade", "E-mail", "Automação", "Social", "CRM", "Reputação", "Analytics", "Voz & SMS"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const IntegrationsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [connectors, setConnectors] = useState(initialConnectors);

  const filtered = connectors.filter(c => {
    const matchesCategory = selectedCategory === "Todos" || c.category === selectedCategory;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = connectors.filter(c => c.connected).length;

  const handleConnect = (id: number) => {
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, connected: true, status: "active" as const } : c));
    const name = connectors.find(c => c.id === id)?.name;
    toast.success(`${name} conectado com sucesso!`);
  };

  const handleDisconnect = (id: number) => {
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, connected: false, status: undefined } : c));
    const name = connectors.find(c => c.id === id)?.name;
    toast.info(`${name} desconectado`);
  };

  const handleSync = (id: number) => {
    const name = connectors.find(c => c.id === id)?.name;
    toast.success(`Sincronizando ${name}...`);
  };

  const handleConfig = (id: number) => {
    const name = connectors.find(c => c.id === id)?.name;
    toast.info(`Abrindo configurações de ${name}`);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Integrações</h1>
          <p className="text-sm text-muted-foreground mt-1">{connectedCount} conectadas · {connectors.length} disponíveis</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar integrações..." className="w-full rounded-lg border border-input bg-card py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
        </div>
      </motion.div>

      <motion.div variants={item} className="flex gap-1.5 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setSelectedCategory(c)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", selectedCategory === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
            {c}
          </button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(c => (
          <motion.div key={c.id} variants={item} whileHover={{ y: -2 }} className={cn("rounded-xl border bg-card p-5 shadow-card hover:shadow-elevated transition-all", c.connected ? "border-secondary/30" : "border-border")}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                  <span className="text-[11px] font-medium text-muted-foreground">{c.category}</span>
                </div>
              </div>
              {c.connected && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary/10 text-secondary">
                  <CheckCircle2 className="h-3 w-3" /> Ativo
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">{c.description}</p>
            {c.connected ? (
              <div className="flex gap-2">
                <button onClick={() => handleConfig(c.id)} className="flex-1 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                  <Settings2 className="h-3 w-3" /> Config
                </button>
                <button onClick={() => handleSync(c.id)} className="flex-1 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Sync
                </button>
              </div>
            ) : (
              <button onClick={() => handleConnect(c.id)} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center justify-center gap-1">
                <Plus className="h-3 w-3" /> Conectar
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default IntegrationsPage;
