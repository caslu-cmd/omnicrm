import { useState } from "react";
import { motion } from "framer-motion";
import {
  Globe, Plus, Search, Eye, Pencil, Copy, Trash2, MoreVertical,
  Layout, Type, Image, FormInput, MessageSquare, Star, ArrowUpRight,
  Smartphone, Monitor, Tablet, ExternalLink, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Template {
  id: number;
  name: string;
  category: string;
  preview: string;
  uses: number;
}

interface Site {
  id: number;
  name: string;
  url: string;
  status: "published" | "draft";
  visits: number;
  conversions: number;
  lastEdited: string;
}

const templates: Template[] = [
  { id: 1, name: "SaaS Landing", category: "SaaS", preview: "🚀", uses: 2340 },
  { id: 2, name: "Captura de Leads", category: "Lead Gen", preview: "📧", uses: 1890 },
  { id: 3, name: "Webinar Signup", category: "Eventos", preview: "🎓", uses: 1230 },
  { id: 4, name: "E-commerce Promo", category: "E-commerce", preview: "🛍️", uses: 980 },
  { id: 5, name: "Consultoria", category: "Serviços", preview: "💼", uses: 756 },
  { id: 6, name: "App Mobile", category: "Tech", preview: "📱", uses: 654 },
];

const initialSites: Site[] = [
  { id: 1, name: "Campanha Black Friday", url: "black-friday.omnicrm.app", status: "published", visits: 4320, conversions: 234, lastEdited: "Hoje" },
  { id: 2, name: "Landing Webinar Março", url: "webinar-marco.omnicrm.app", status: "published", visits: 1890, conversions: 156, lastEdited: "Ontem" },
  { id: 3, name: "Novo Produto 2026", url: "—", status: "draft", visits: 0, conversions: 0, lastEdited: "28 Fev" },
];

const editorBlocks = [
  { icon: Layout, label: "Hero" },
  { icon: Type, label: "Texto" },
  { icon: Image, label: "Imagem" },
  { icon: FormInput, label: "Formulário" },
  { icon: MessageSquare, label: "Depoimentos" },
  { icon: Star, label: "Features" },
  { icon: BarChart3, label: "Números" },
  { icon: ArrowUpRight, label: "CTA" },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const SitesPage = () => {
  const [tab, setTab] = useState<"sites" | "templates" | "editor">("sites");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [sites, setSites] = useState(initialSites);

  const handleDuplicate = (id: number) => {
    const s = sites.find(x => x.id === id);
    if (!s) return;
    setSites(prev => [...prev, { ...s, id: Date.now(), name: `${s.name} (cópia)`, status: "draft", visits: 0, conversions: 0 }]);
    toast.success("Página duplicada");
  };

  const handleDelete = (id: number) => {
    setSites(prev => prev.filter(s => s.id !== id));
    toast.success("Página removida");
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 md:p-6 space-y-4 md:space-y-6 h-full flex flex-col">
      <motion.div variants={item} className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Sites & Landing Pages</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">{sites.length} páginas · {sites.reduce((a, b) => a + b.visits, 0).toLocaleString()} visitas</p>
        </div>
        <button onClick={() => setTab("templates")} className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-medium hover:bg-primary/90 flex-shrink-0">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova Página</span><span className="sm:hidden">Nova</span>
        </button>
      </motion.div>

      <motion.div variants={item} className="flex gap-1 bg-muted rounded-lg p-1 w-full sm:w-fit overflow-x-auto scrollbar-thin">
        {[{ key: "sites", label: "Minhas Páginas" }, { key: "templates", label: "Templates" }, { key: "editor", label: "Editor" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", tab === t.key ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </motion.div>

      {tab === "sites" && (
        <motion.div variants={item} className="space-y-3">
          {sites.map(s => (
            <div key={s.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow">
              <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-muted border border-border text-2xl">🌐</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                  <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", s.status === "published" ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground")}>
                    {s.status === "published" ? "Publicado" : "Rascunho"}
                  </span>
                </div>
                {s.status === "published" && (
                  <p className="text-xs text-primary flex items-center gap-1 mt-0.5 cursor-pointer hover:underline" onClick={() => toast.info(`Abrindo ${s.url}`)}>
                    {s.url} <ExternalLink className="h-3 w-3" />
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">Editado: {s.lastEdited}</p>
              </div>
              {s.status === "published" && (
                <div className="hidden md:flex items-center gap-6 text-center">
                  <div><p className="text-sm font-bold text-foreground">{s.visits.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Visitas</p></div>
                  <div><p className="text-sm font-bold text-foreground">{s.conversions}</p><p className="text-[10px] text-muted-foreground">Conversões</p></div>
                  <div><p className="text-sm font-bold text-secondary">{((s.conversions / s.visits) * 100).toFixed(1)}%</p><p className="text-[10px] text-muted-foreground">Conv. Rate</p></div>
                </div>
              )}
              <div className="flex items-center gap-1">
                <button onClick={() => setTab("editor")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => handleDuplicate(s.id)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><Copy className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {tab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => (
            <motion.div key={t.id} variants={item} whileHover={{ y: -2 }} className="rounded-xl border border-border bg-card shadow-card overflow-hidden cursor-pointer group hover:shadow-elevated transition-all">
              <div className="h-40 bg-muted flex items-center justify-center text-5xl">{t.preview}</div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                  <span className="text-[11px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{t.category}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t.uses.toLocaleString()} usos</p>
                <button onClick={() => { setTab("editor"); toast.success(`Template "${t.name}" carregado`); }} className="mt-3 w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Usar Template
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === "editor" && (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Blocks Panel */}
          <div className="w-full lg:w-56 rounded-xl border border-border bg-card shadow-card p-4 space-y-3 overflow-y-auto scrollbar-thin">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blocos</h3>
            <div className="grid grid-cols-2 gap-2">
              {editorBlocks.map(b => (
                <button key={b.label} onClick={() => toast.success(`Bloco "${b.label}" adicionado`)} className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                  <b.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 rounded-xl border border-border bg-card shadow-card overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <input defaultValue="Campanha Black Friday" className="text-sm font-semibold text-foreground bg-transparent border-none focus:outline-none" />
              <div className="flex items-center gap-2">
                <div className="flex bg-muted rounded-lg p-0.5">
                  {[{ key: "desktop", icon: Monitor }, { key: "tablet", icon: Tablet }, { key: "mobile", icon: Smartphone }].map(d => (
                    <button key={d.key} onClick={() => setDevice(d.key as typeof device)} className={cn("p-1.5 rounded-md", device === d.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>
                      <d.icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                <button onClick={() => toast.success("Página publicada com sucesso!")} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground">Publicar</button>
              </div>
            </div>
            <div className="flex-1 flex items-start justify-center p-8 overflow-auto bg-muted/20">
              <div className={cn("bg-card rounded-lg shadow-elevated border border-border transition-all overflow-hidden", device === "desktop" ? "w-full max-w-4xl" : device === "tablet" ? "w-full max-w-[768px]" : "w-full max-w-[375px]")}>
                {/* Simulated page */}
                <div className="bg-primary p-12 text-center">
                  <h2 className="text-2xl font-bold font-display text-primary-foreground mb-2">Black Friday 2026 🔥</h2>
                  <p className="text-primary-foreground/80 text-sm mb-6">Até 60% de desconto em todos os planos</p>
                  <button onClick={() => toast.success("CTA clicado!")} className="px-6 py-3 rounded-lg bg-accent text-accent-foreground font-semibold text-sm">Aproveitar Agora</button>
                </div>
                <div className="p-4 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {["✨ Inbox Ilimitado", "🚀 Automações Pro", "📊 Relatórios Full"].map(f => (
                      <div key={f} className="p-4 rounded-lg bg-muted text-center text-sm font-medium text-foreground">{f}</div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-border p-6 text-center">
                    <p className="text-sm font-medium text-foreground mb-3">Cadastre-se para receber a oferta</p>
                    <div className="flex gap-2 max-w-md mx-auto">
                      <input placeholder="Seu e-mail" className="flex-1 rounded-lg border border-input py-2 px-3 text-sm" />
                      <button onClick={() => toast.success("E-mail capturado!")} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Enviar</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SitesPage;
