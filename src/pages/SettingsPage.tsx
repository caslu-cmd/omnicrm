import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings, Shield, Globe, Mail, Users, Lock, Key, Eye, EyeOff,
  CheckCircle2, AlertTriangle, Server, Thermometer, BarChart3,
  FileText, Download, Bell, Palette, Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const tabs = [
  { key: "org", label: "Organização", icon: Settings },
  { key: "security", label: "Segurança", icon: Shield },
  { key: "domains", label: "Domínios", icon: Globe },
  { key: "deliverability", label: "Entregabilidade", icon: Mail },
  { key: "compliance", label: "Compliance", icon: FileText },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const SettingsPage = () => {
  const [tab, setTab] = useState("org");

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 md:p-6 space-y-6 min-w-0 break-words">
      <motion.div variants={item}>
        <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Configurações</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">Gerencie sua organização, segurança e compliance</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar tabs — horizontal on mobile, vertical on desktop */}
        <motion.div variants={item} className="w-full md:w-52 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible scrollbar-thin">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={cn("shrink-0 md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left whitespace-nowrap", tab === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </motion.div>

        <div className="flex-1 space-y-6 min-w-0">
          {tab === "org" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold font-display text-foreground">Informações da Organização</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-muted-foreground">Nome</label><input defaultValue="Minha Empresa LTDA" className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">CNPJ</label><input defaultValue="12.345.678/0001-90" className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">E-mail</label><input defaultValue="admin@minhaempresa.com" className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Fuso Horário</label><select className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm"><option>America/Sao_Paulo (GMT-3)</option><option>America/New_York (GMT-5)</option></select></div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold font-display text-foreground">Notificações</h3>
                {["Novos leads", "Conversas não respondidas (>1h)", "Deals movidos no pipeline", "Alertas de entregabilidade", "Sentimento negativo detectado"].map(n => (
                  <div key={n} className="flex items-center justify-between py-2 flex-wrap gap-4">
                    <span className="text-sm text-foreground">{n}</span>
                    <button className="relative h-6 w-11 rounded-full bg-primary transition-colors">
                      <span className="absolute top-0.5 left-5 h-5 w-5 rounded-full bg-primary-foreground shadow-sm transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "security" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Autenticação</h3>
                {[
                  { label: "SSO (SAML/OAuth)", desc: "Single Sign-On corporativo", enabled: true },
                  { label: "2FA (Two-Factor)", desc: "Autenticação em dois fatores", enabled: true },
                  { label: "Login com Google", desc: "OAuth 2.0 com Google Workspace", enabled: true },
                  { label: "Login com Microsoft", desc: "Azure AD / Microsoft 365", enabled: false },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between p-3 rounded-lg border border-border flex-wrap gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.label}</p>
                      <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", s.enabled ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground")}>{s.enabled ? "Ativo" : "Inativo"}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2"><Key className="h-5 w-5 text-primary" /> Chaves API</h3>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border flex-wrap gap-4">
                  <div><p className="text-sm font-medium text-foreground">API Key Produção</p><p className="text-xs text-muted-foreground font-mono">sk-prod-****************************a8f2</p></div>
                  <div className="flex gap-1"><button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Eye className="h-4 w-4" /></button></div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border flex-wrap gap-4">
                  <div><p className="text-sm font-medium text-foreground">Webhook Secret</p><p className="text-xs text-muted-foreground font-mono">whsec-****************************3d1e</p></div>
                  <div className="flex gap-1"><button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Eye className="h-4 w-4" /></button></div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-3">
                <h3 className="text-base font-semibold font-display text-foreground">Logs de Auditoria</h3>
                <p className="text-xs text-muted-foreground">Últimos 90 dias · Exportável em CSV</p>
                {[
                  { action: "Login SSO", user: "admin@empresa.com", time: "Hoje 14:32", ip: "189.xxx.xxx.12" },
                  { action: "API Key rotacionada", user: "dev@empresa.com", time: "Ontem 09:15", ip: "177.xxx.xxx.45" },
                  { action: "Usuário criado", user: "admin@empresa.com", time: "28 Fev 16:00", ip: "189.xxx.xxx.12" },
                ].map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 text-xs border-b border-border last:border-0 flex-wrap gap-4">
                    <span className="font-medium text-foreground">{log.action}</span>
                    <span className="text-muted-foreground">{log.user}</span>
                    <span className="text-muted-foreground">{log.time}</span>
                    <span className="text-muted-foreground font-mono">{log.ip}</span>
                  </div>
                ))}
                <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1"><Download className="h-3 w-3" /> Exportar todos os logs</button>
              </div>
            </motion.div>
          )}

          {tab === "domains" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold font-display text-foreground">Domínios de E-mail</h3>
                {[
                  { domain: "marketing.empresa.com", status: "verified", spf: true, dkim: true, dmarc: true },
                  { domain: "noreply.empresa.com", status: "verified", spf: true, dkim: true, dmarc: false },
                  { domain: "suporte.empresa.com", status: "pending", spf: false, dkim: false, dmarc: false },
                ].map(d => (
                  <div key={d.domain} className="flex items-center justify-between p-4 rounded-lg border border-border flex-wrap gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.domain}</p>
                      <div className="flex gap-3 mt-1">
                        {[["SPF", d.spf], ["DKIM", d.dkim], ["DMARC", d.dmarc]].map(([label, ok]) => (
                          <span key={label as string} className={cn("text-[10px] font-medium flex items-center gap-0.5", ok ? "text-secondary" : "text-destructive")}>
                            {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />} {label as string}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", d.status === "verified" ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent-foreground")}>{d.status === "verified" ? "Verificado" : "Pendente"}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "deliverability" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2"><Server className="h-5 w-5 text-primary" /> IP Pools</h3>
                {[
                  { ip: "198.51.100.1", pool: "Marketing", reputation: 95, volume: "12k/dia", status: "Aquecido" },
                  { ip: "198.51.100.2", pool: "Transacional", reputation: 99, volume: "45k/dia", status: "Aquecido" },
                  { ip: "198.51.100.3", pool: "Novo", reputation: 42, volume: "500/dia", status: "Aquecendo" },
                ].map(ip => (
                  <div key={ip.ip} className="flex items-center justify-between p-4 rounded-lg border border-border flex-wrap gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground font-mono">{ip.ip}</p>
                      <p className="text-xs text-muted-foreground">Pool: {ip.pool} · {ip.volume}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className={cn("text-sm font-bold", ip.reputation > 80 ? "text-secondary" : ip.reputation > 50 ? "text-accent-foreground" : "text-destructive")}>{ip.reputation}</p>
                        <p className="text-[10px] text-muted-foreground">Reputação</p>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", ip.status === "Aquecido" ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent-foreground")}>{ip.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2"><Thermometer className="h-5 w-5 text-accent-foreground" /> Warm-up Wizard</h3>
                <p className="text-xs text-muted-foreground">Configure o aquecimento gradual de novos IPs dedicados</p>
                <div className="space-y-2">
                  {["Dia 1-3: 200 e-mails/dia", "Dia 4-7: 500 e-mails/dia", "Dia 8-14: 2.000 e-mails/dia", "Dia 15-21: 5.000 e-mails/dia", "Dia 22+: Volume total"].map((step, i) => (
                    <div key={step} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                      <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold", i < 3 ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground")}>{i + 1}</div>
                      <span className="text-sm text-foreground">{step}</span>
                      {i < 3 && <CheckCircle2 className="h-4 w-4 text-secondary ml-auto" />}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {tab === "compliance" && (
            <motion.div variants={item} className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold font-display text-foreground">Certificações & Compliance</h3>
                {[
                  { name: "SOC 2 Type II", status: "Em progresso", date: "Previsto Q3 2026" },
                  { name: "ISO 27001", status: "Planejado", date: "Previsto Q4 2026" },
                  { name: "LGPD", status: "Conforme", date: "Desde Jan 2026" },
                  { name: "GDPR", status: "Conforme", date: "Desde Jan 2026" },
                ].map(c => (
                  <div key={c.name} className="flex items-center justify-between p-3 rounded-lg border border-border flex-wrap gap-4">
                    <div><p className="text-sm font-medium text-foreground">{c.name}</p><p className="text-[10px] text-muted-foreground">{c.date}</p></div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", c.status === "Conforme" ? "bg-secondary/10 text-secondary" : c.status === "Em progresso" ? "bg-accent/10 text-accent-foreground" : "bg-muted text-muted-foreground")}>{c.status}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold font-display text-foreground">Consentimento & Opt-in</h3>
                <p className="text-xs text-muted-foreground">Gerencie políticas de consentimento e logs de opt-in para cada canal</p>
                {["WhatsApp Opt-in", "E-mail Marketing", "SMS", "Cookies & Tracking"].map(c => (
                  <div key={c} className="flex items-center justify-between p-3 rounded-lg border border-border flex-wrap gap-4">
                    <span className="text-sm text-foreground">{c}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Logs retidos: 2 anos</span>
                      <button className="relative h-5 w-9 rounded-full bg-primary"><span className="absolute top-0.5 left-4 h-4 w-4 rounded-full bg-primary-foreground shadow-sm" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
                <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Data Residency</h3>
                <p className="text-xs text-muted-foreground">Configure a região de armazenamento dos dados</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { region: "🇧🇷 São Paulo", active: true },
                    { region: "🇺🇸 Virginia", active: false },
                    { region: "🇪🇺 Frankfurt", active: false },
                  ].map(r => (
                    <button key={r.region} className={cn("p-3 rounded-lg border text-sm font-medium text-center transition-colors", r.active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}>
                      {r.region}
                    </button>
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

export default SettingsPage;
