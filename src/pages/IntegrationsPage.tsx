import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search, CheckCircle2, Plus, Settings2,
  RefreshCw, X, Save, Wifi, WifiOff, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ConnectorDef {
  name: string;
  category: string;
  description: string;
  icon: string;
  configFields?: { key: string; label: string; type?: string }[];
}

const connectorDefs: ConnectorDef[] = [
  { name: "Zapi — WhatsApp", category: "Mensageria", description: "Envie mensagens WhatsApp para leads diretamente do CRM via número conectado", icon: "🟢", configFields: [] },
  { name: "WhatsApp Business", category: "Mensageria", description: "Meta Business API para envio e recebimento de mensagens", icon: "💬", configFields: [{ key: "phone_id", label: "Phone Number ID" }, { key: "token", label: "Access Token", type: "password" }] },
  { name: "Google Calendar", category: "Produtividade", description: "Sincronize agendamentos e reuniões automaticamente", icon: "📅", configFields: [{ key: "calendar_id", label: "Calendar ID" }] },
  { name: "Stripe", category: "Pagamentos", description: "Cobranças, assinaturas e gestão de pagamentos", icon: "💳", configFields: [{ key: "api_key", label: "API Key", type: "password" }, { key: "webhook_secret", label: "Webhook Secret", type: "password" }] },
  { name: "Google Ads", category: "Ads", description: "Importe dados de campanhas e conversões", icon: "📊", configFields: [{ key: "customer_id", label: "Customer ID" }] },
  { name: "Facebook Ads", category: "Ads", description: "Relatórios de performance e conversões", icon: "📈", configFields: [{ key: "ad_account_id", label: "Ad Account ID" }, { key: "token", label: "Access Token", type: "password" }] },
  { name: "Instagram", category: "Social", description: "DMs, comentários e automações de resposta", icon: "📸", configFields: [{ key: "page_id", label: "Page ID" }, { key: "token", label: "Access Token", type: "password" }] },
  { name: "Mailgun", category: "E-mail", description: "Envio transacional com alta entregabilidade", icon: "📧", configFields: [{ key: "domain", label: "Domain" }, { key: "api_key", label: "API Key", type: "password" }] },
  { name: "Twilio", category: "Voz & SMS", description: "Chamadas, SMS e verificação por telefone", icon: "📞", configFields: [{ key: "account_sid", label: "Account SID" }, { key: "auth_token", label: "Auth Token", type: "password" }] },
  { name: "Zoom", category: "Produtividade", description: "Criação automática de reuniões e links", icon: "🎥", configFields: [{ key: "client_id", label: "Client ID" }, { key: "client_secret", label: "Client Secret", type: "password" }] },
  { name: "Zapier", category: "Automação", description: "Conecte com +5000 apps via workflows", icon: "⚡", configFields: [{ key: "webhook_url", label: "Webhook URL" }] },
  { name: "Make (Integromat)", category: "Automação", description: "Automações visuais avançadas entre plataformas", icon: "🔄", configFields: [{ key: "webhook_url", label: "Webhook URL" }] },
  { name: "PayPal", category: "Pagamentos", description: "Pagamentos internacionais e checkout", icon: "💰", configFields: [{ key: "client_id", label: "Client ID" }, { key: "secret", label: "Secret", type: "password" }] },
  { name: "Mercado Pago", category: "Pagamentos", description: "Pagamentos e cobranças no Brasil e LATAM", icon: "🇧🇷", configFields: [{ key: "access_token", label: "Access Token", type: "password" }] },
  { name: "HubSpot", category: "CRM", description: "Sincronize contatos e deals bi-direcionalmente", icon: "🔶", configFields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { name: "Slack", category: "Produtividade", description: "Notificações e alertas em canais de equipe", icon: "💬", configFields: [{ key: "webhook_url", label: "Webhook URL" }, { key: "channel", label: "Channel" }] },
  { name: "Google Business Profile", category: "Reputação", description: "Monitore e responda reviews automaticamente com IA", icon: "⭐", configFields: [{ key: "location_id", label: "Location ID" }] },
  { name: "Outlook Calendar", category: "Produtividade", description: "Sincronize com calendário Microsoft", icon: "📆", configFields: [{ key: "tenant_id", label: "Tenant ID" }] },
  { name: "Pagar.me", category: "Pagamentos", description: "Gateway de pagamentos brasileiro", icon: "💵", configFields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { name: "SendGrid", category: "E-mail", description: "E-mail marketing e transacional em escala", icon: "✉️", configFields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { name: "n8n", category: "Automação", description: "Workflows de automação self-hosted", icon: "🔧", configFields: [{ key: "base_url", label: "Instance URL" }, { key: "api_key", label: "API Key", type: "password" }] },
  { name: "Calendly", category: "Produtividade", description: "Links de agendamento profissional", icon: "🗓️", configFields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { name: "Google Analytics", category: "Analytics", description: "Trafego e conversões do seu site", icon: "📉", configFields: [{ key: "measurement_id", label: "Measurement ID" }] },
  { name: "Facebook Messenger", category: "Mensageria", description: "Inbox e automações via Messenger", icon: "💬", configFields: [{ key: "page_id", label: "Page ID" }, { key: "token", label: "Access Token", type: "password" }] },
  { name: "Salesforce", category: "CRM", description: "Integração bidirecional com Salesforce CRM", icon: "☁️", configFields: [{ key: "instance_url", label: "Instance URL" }, { key: "token", label: "Access Token", type: "password" }] },
];

const categories = ["Todos", "Mensageria", "Pagamentos", "Ads", "Produtividade", "E-mail", "Automação", "Social", "CRM", "Reputação", "Analytics", "Voz & SMS"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

interface IntegrationRow {
  id: string;
  connector_name: string;
  connected: boolean;
  status: string;
  config: Record<string, string>;
  last_sync: string | null;
}

const IntegrationsPage = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [configModal, setConfigModal] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [zapiStatus, setZapiStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [zapiDetail, setZapiDetail] = useState("");
  const [zapiConnected, setZapiConnected] = useState(false);
  const [zapiQr, setZapiQr] = useState<string | null>(null);
  const [zapiQrLoading, setZapiQrLoading] = useState(false);

  const invoke = async (action: string, method: "GET" | "POST" = "GET", body?: unknown) => {
    const baseUrl = `${SUPABASE_URL}/functions/v1/manage-integrations`;
    const session = (await supabase.auth.getSession()).data.session;
    const url = `${baseUrl}?action=${action}`;
    const res = await fetch(url, {
      method,
      headers: {
        "Authorization": `Bearer ${session?.access_token}`,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Request failed");
    }
    return res.json();
  };

  useEffect(() => {
    if (user) fetchIntegrations();
  }, [user]);

  const fetchIntegrations = async () => {
    try {
      const data = await invoke("list");
      setIntegrations((data || []) as IntegrationRow[]);
    } catch { toast.error("Erro ao carregar integrações"); }
    setLoading(false);
  };

  const getIntegration = (name: string) => integrations.find(i => i.connector_name === name);

  const filtered = connectorDefs.filter(c => {
    const matchesCategory = selectedCategory === "Todos" || c.category === selectedCategory;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = connectorDefs.filter(c => getIntegration(c.name)?.connected).length;

  const handleConnect = async (name: string) => {
    if (!user) return;
    try {
      await invoke("toggle", "POST", { connector_name: name, connected: true });
      toast.success(`${name} conectado com sucesso!`);
      fetchIntegrations();
    } catch { toast.error("Erro ao conectar"); }
  };

  const handleDisconnect = async (name: string) => {
    try {
      await invoke("toggle", "POST", { connector_name: name, connected: false });
      toast.info(`${name} desconectado`);
      fetchIntegrations();
    } catch { toast.error("Erro ao desconectar"); }
  };

  const handleSync = async (name: string) => {
    try {
      await invoke("sync", "POST", { connector_name: name });
      toast.success(`Sincronizando ${name}...`);
      fetchIntegrations();
    } catch { toast.error("Erro ao sincronizar"); }
  };

  const openConfig = async (name: string) => {
    try {
      const data = await invoke("get-config&connector=" + encodeURIComponent(name));
      setConfigValues(data?.config || {});
    } catch {
      setConfigValues({});
    }
    setConfigModal(name);
  };

  const saveConfig = async () => {
    if (!configModal || !user) return;
    try {
      const integration = getIntegration(configModal);
      await invoke("save-config", "POST", {
        connector_name: configModal,
        config: configValues,
        connected: integration?.connected ?? false,
        status: integration?.status ?? "inactive",
      });
      toast.success("Configurações salvas com segurança!");
      setConfigModal(null);
      fetchIntegrations();
    } catch { toast.error("Erro ao salvar configurações"); }
  };

  const checkZapi = async () => {
    setZapiStatus("checking");
    setZapiDetail("");
    setZapiQr(null);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp", { body: { action: "status" } });
      if (error) throw new Error(error.message);
      setZapiStatus("ok");
      setZapiConnected(!!data?.connected);
      if (data?.connected) {
        setZapiDetail(`Número conectado ✓${data.phone ? ` — ${data.phone}` : ""}`);
      } else {
        setZapiDetail("Instância ativa. Escaneie o QR code para vincular seu número.");
        fetchZapiQr();
      }
    } catch (e: any) {
      setZapiStatus("error");
      setZapiDetail(e?.message ?? "Erro ao verificar conexão.");
    }
  };

  const fetchZapiQr = async () => {
    setZapiQrLoading(true);
    try {
      const { data } = await supabase.functions.invoke("whatsapp", { body: { action: "qrcode" } });
      setZapiQr(data?.qrcode ?? null);
    } catch { setZapiQr(null); }
    setZapiQrLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 md:p-6 space-y-6 min-w-0 break-words">
      <motion.div variants={item} className="flex flex-wrap items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold font-display text-foreground break-words">Integrações</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">{connectedCount} conectadas · {connectorDefs.length} disponíveis</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar integrações..." className="w-full rounded-lg border border-input bg-card py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
        </div>
      </motion.div>

      <motion.div variants={item} className="flex gap-1.5 flex-wrap overflow-x-auto scrollbar-thin -mx-3 px-3 md:mx-0 md:px-0">
        {categories.map(c => (
          <button key={c} onClick={() => setSelectedCategory(c)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", selectedCategory === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
            {c}
          </button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(c => {
          const integration = getIntegration(c.name);
          const isConnected = integration?.connected;

          // Card especial do Zapi
          if (c.name === "Zapi — WhatsApp") {
            const isOk = zapiStatus === "ok";
            const isConnectedPhone = isOk && zapiConnected;
            return (
              <motion.div key={c.name} variants={item}
                className={cn("rounded-xl border bg-card p-5 shadow-card transition-all col-span-1", isConnectedPhone ? "border-green-500/40" : isOk ? "border-yellow-500/30" : "border-border")}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                      <span className="text-[11px] font-medium text-muted-foreground">{c.category}</span>
                    </div>
                  </div>
                  {isConnectedPhone && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-500">
                      <Wifi className="h-3 w-3" /> Conectado
                    </span>
                  )}
                  {isOk && !zapiConnected && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/10 text-yellow-400">
                      <WifiOff className="h-3 w-3" /> Sem número
                    </span>
                  )}
                  {zapiStatus === "error" && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400">
                      <WifiOff className="h-3 w-3" /> Erro
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">{c.description}</p>
                {zapiDetail && (
                  <p className={cn("text-[11px] mb-3 font-medium", isConnectedPhone ? "text-green-500" : isOk ? "text-yellow-400" : "text-red-400")}>{zapiDetail}</p>
                )}

                {/* QR Code inline para vincular número */}
                {isOk && !zapiConnected && (
                  <div className="mb-3">
                    {zapiQrLoading && (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {zapiQr && !zapiQrLoading && (
                      <div className="flex flex-col items-center gap-2">
                        <img src={zapiQr} alt="QR Code WhatsApp" className="w-40 h-40 rounded-lg border border-border" />
                        <p className="text-[10px] text-muted-foreground text-center">Abra o WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
                        <button onClick={fetchZapiQr} className="text-[10px] text-muted-foreground underline">Gerar novo QR</button>
                      </div>
                    )}
                    {!zapiQr && !zapiQrLoading && (
                      <div className="space-y-2">
                        <button onClick={fetchZapiQr} className="w-full py-2 rounded-lg border border-yellow-500/30 text-yellow-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                          📱 Carregar QR Code
                        </button>
                        <a
                          href="https://app.z-api.io"
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2 rounded-lg border border-border text-muted-foreground text-xs font-medium flex items-center justify-center gap-1.5 hover:text-foreground transition-colors"
                        >
                          🌐 Abrir painel Z-API
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={checkZapi}
                    disabled={zapiStatus === "checking"}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    style={{ background: isConnectedPhone ? "rgba(34,197,94,0.12)" : "rgba(185,255,75,0.15)", color: isConnectedPhone ? "#22c55e" : "#B9FF4B", border: `1px solid ${isConnectedPhone ? "rgba(34,197,94,0.3)" : "rgba(185,255,75,0.3)"}` }}
                  >
                    {zapiStatus === "checking"
                      ? <><Loader2 className="h-3 w-3 animate-spin" /> Verificando...</>
                      : <><Wifi className="h-3 w-3" /> {isConnectedPhone ? "Verificar" : "Verificar conexão"}</>}
                  </button>
                  {isConnectedPhone && (
                    <button onClick={() => { setZapiStatus("idle"); setZapiConnected(false); setZapiDetail(""); setZapiQr(null); }} className="py-2 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div key={c.name} variants={item} whileHover={{ y: -2 }} className={cn("rounded-xl border bg-card p-5 shadow-card hover:shadow-elevated transition-all", isConnected ? "border-secondary/30" : "border-border")}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                    <span className="text-[11px] font-medium text-muted-foreground">{c.category}</span>
                  </div>
                </div>
                {isConnected && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary/10 text-secondary">
                    <CheckCircle2 className="h-3 w-3" /> Ativo
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">{c.description}</p>
              {isConnected ? (
                <div className="flex gap-2">
                  <button onClick={() => openConfig(c.name)} className="flex-1 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                    <Settings2 className="h-3 w-3" /> Config
                  </button>
                  <button onClick={() => handleSync(c.name)} className="flex-1 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Sync
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => handleConnect(c.name)} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 flex items-center justify-center gap-1">
                    <Plus className="h-3 w-3" /> Conectar
                  </button>
                  <button onClick={() => openConfig(c.name)} className="py-2 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center">
                    <Settings2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {configModal && (() => {
        const def = connectorDefs.find(c => c.name === configModal);
        const integration = getIntegration(configModal);
        if (!def) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{def.icon}</span>
                  <div>
                    <h2 className="text-lg font-bold font-display text-foreground">{def.name}</h2>
                    <p className="text-xs text-muted-foreground">Configurações da integração</p>
                  </div>
                </div>
                <button onClick={() => setConfigModal(null)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>

              {def.configFields?.map(field => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                  <input
                    type={field.type || "text"}
                    value={configValues[field.key] || ""}
                    onChange={e => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={`Insira ${field.label.toLowerCase()}`}
                    className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              ))}

              {integration?.last_sync && (
                <p className="text-xs text-muted-foreground">Última sincronização: {new Date(integration.last_sync).toLocaleString("pt-BR")}</p>
              )}

              <div className="flex gap-3 pt-2">
                {integration?.connected ? (
                  <button onClick={() => { handleDisconnect(configModal); setConfigModal(null); }} className="flex-1 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10">Desconectar</button>
                ) : (
                  <button onClick={() => setConfigModal(null)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground">Cancelar</button>
                )}
                <button onClick={saveConfig} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1">
                  <Save className="h-4 w-4" /> Salvar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </motion.div>
  );
};

export default IntegrationsPage;
