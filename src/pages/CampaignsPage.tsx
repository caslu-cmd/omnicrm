import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send, Mail, MessageSquare, Plus, Search, Filter, BarChart3,
  Eye, MousePointer, Clock, CheckCircle2, Users,
  Pencil, Copy, MoreVertical, TrendingUp,
  Upload, Loader2, Sparkles, ImageIcon, CheckCircle, X, Globe,
  Image as ImageLucide, Layout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AIInputField } from "@/components/AIInputField";
import { AITextareaField } from "@/components/AITextareaField";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://proldgiyterqhthludlp.supabase.co";

interface SavedLP { id: number; name: string; html: string; savedAt: string; }

interface PostCreative {
  id: string; caption: string | null; media_url: string | null;
  platforms: string[]; published_at: string | null; client_id: string;
}
type AnyCreative =
  | { source: "lp"; id: number; name: string; html: string; savedAt: string }
  | { source: "post"; id: string; name: string; mediaUrl: string; caption: string }
  | { source: "image"; id: string; name: string; mediaUrl: string };

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
  const [importing, setImporting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<AnyCreative | null>(null);
  const [savedPages, setSavedPages] = useState<SavedLP[]>([]);
  const [showCreativePicker, setShowCreativePicker] = useState(false);
  const [creativeTab, setCreativeTab] = useState<"lp" | "posts" | "upload">("lp");
  const [publishedPosts, setPublishedPosts] = useState<PostCreative[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ name: string; dataUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const briefFileRef = useRef<HTMLInputElement>(null);
  const uploadImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const pages = JSON.parse(localStorage.getItem("calu_pages") ?? "[]");
      setSavedPages(pages);
    } catch { /* nada */ }
  }, [tab]); // recarrega ao abrir o compose

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      let filesPayload: { name: string; base64: string; media_type: string }[] = [];
      let textContent = "";

      if (/\.(txt|csv|md)$/i.test(file.name)) {
        textContent = await new Promise<string>((res) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result as string);
          fr.readAsText(file, "utf-8");
        });
        textContent = `[${file.name}]\n${textContent}`;
      } else {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        const b64 = btoa(binary);
        const media = file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream";
        filesPayload.push({ name: file.name, base64: b64, media_type: media });
      }

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/extract-campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ files: filesPayload, text_content: textContent }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || `Erro ${resp.status}`);

      const extracted: Campaign[] = (result.campaigns ?? []).map((c: Partial<Campaign> & Record<string, unknown>, i: number) => ({
        id: Date.now() + i,
        name: String(c.name ?? "Campanha importada"),
        channel: (c.channel === "whatsapp" ? "whatsapp" : "email") as "email" | "whatsapp",
        status: (["sent", "scheduled", "draft"].includes(c.status as string) ? c.status : "draft") as Campaign["status"],
        audience: Number(c.audience) || 0,
        delivered: Number(c.delivered) || 0,
        opened: Number(c.opened) || 0,
        clicked: Number(c.clicked) || 0,
        replied: Number(c.replied) || 0,
        sentAt: String(c.sentAt ?? "—"),
      }));

      if (extracted.length === 0) {
        toast.warning("Nenhuma campanha encontrada no arquivo.");
      } else {
        setCampaigns(prev => [...extracted, ...prev]);
        toast.success(`${extracted.length} campanha${extracted.length > 1 ? "s" : ""} importada${extracted.length > 1 ? "s" : ""}!`);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erro ao importar campanhas");
    } finally {
      setImporting(false);
    }
  };

  const handleExtractBrief = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!briefFileRef.current) return;
    briefFileRef.current.value = "";
    if (!file) return;

    setExtracting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";

      let filesPayload: { name: string; base64: string; media_type: string }[] = [];
      let textContent = "";

      if (/\.(txt|csv|md)$/i.test(file.name)) {
        textContent = await new Promise<string>((res) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result as string);
          fr.readAsText(file, "utf-8");
        });
        textContent = `[${file.name}]\n${textContent}`;
      } else {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        const b64 = btoa(binary);
        const media = file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream";
        filesPayload.push({ name: file.name, base64: b64, media_type: media });
      }

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/extract-campaign-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ files: filesPayload, text_content: textContent }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || `Erro ${resp.status}`);

      if (result.nome) setCampaignName(result.nome);
      if (result.canal === "whatsapp" || result.canal === "email") setComposeChannel(result.canal);
      if (result.assunto) setCampaignSubject(result.assunto);
      if (result.conteudo) setCampaignContent(result.conteudo);
      toast.success("Campanha preenchida! Agora escolha o criativo da publicação.");
      setTimeout(() => {
        setShowCreativePicker(true);
        setCreativeTab("posts");
        loadPublishedPosts();
      }, 600);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Erro ao extrair briefing");
    } finally {
      setExtracting(false);
    }
  };

  const loadPublishedPosts = async () => {
    setPostsLoading(true);
    try {
      const { data, error } = await (supabase as any).from("scheduled_posts")
        .select("id, caption, media_url, platforms, published_at, client_id")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setPublishedPosts(data ?? []);
    } catch {
      toast.error("Erro ao carregar posts publicados");
    } finally {
      setPostsLoading(false);
    }
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!uploadImageRef.current) return;
    uploadImageRef.current.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedImage({ name: file.name, dataUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

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
    <motion.div variants={container} initial="hidden" animate="show" className="p-3 md:p-6 space-y-6 min-w-0 break-words">
      <motion.div variants={item} className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0"><h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Campanhas</h1><p className="text-xs md:text-sm text-muted-foreground mt-1 break-words">{campaigns.length} campanhas · {avgOpenRate}% abertura média</p></div>
        <div className="flex items-center gap-2 shrink-0">
          <input ref={fileInputRef} type="file" accept=".csv,.txt,.pdf,.md,.xlsx,.xls" className="hidden" onChange={handleImportFile} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-60"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="hidden sm:inline">{importing ? "Extraindo..." : "Importar arquivo"}</span>
          </button>
          <button onClick={() => setTab("compose")} className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova Campanha</span><span className="sm:hidden">Nova</span></button>
        </div>
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
                <div key={c.id} className="rounded-xl border border-border bg-card p-3 md:p-5 shadow-card hover:shadow-elevated transition-shadow">
                  <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl shrink-0", c.channel === "email" ? "bg-primary/10" : "bg-secondary/10")}><ChannelIcon className={cn("h-5 w-5", c.channel === "email" ? "text-primary" : "text-secondary")} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap"><h3 className="text-sm font-semibold text-foreground break-words">{c.name}</h3><span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium", status.color)}><StatusIcon className="h-3 w-3" /> {status.label}</span></div>
                      <p className="text-xs text-muted-foreground mt-0.5 break-words">{c.channel === "email" ? "E-mail" : "WhatsApp"} · {c.audience.toLocaleString()} dest · {c.sentAt}</p>
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
          {/* ── Coluna principal ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Criar com IA — upload de arquivo */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Criar com Briefing</p>
                <p className="text-xs text-muted-foreground mt-0.5">Envie um arquivo de briefing e a IA extrai os dados, monta a campanha e abre o seletor de criativo automaticamente.</p>
              </div>
              <input ref={briefFileRef} type="file" accept=".pdf,.txt,.csv,.md,.docx" className="hidden" onChange={handleExtractBrief} />
              <button
                onClick={() => briefFileRef.current?.click()}
                disabled={extracting}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {extracting ? "Extraindo..." : "Enviar briefing"}
              </button>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
              <h2 className="text-base font-semibold font-display text-foreground">Nova Campanha</h2>
              <div className="flex gap-2">
                {(["email", "whatsapp"] as const).map(ch => (
                  <button key={ch} onClick={() => setComposeChannel(ch)} className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors", composeChannel === ch ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}>
                    {ch === "email" ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}{ch === "email" ? "E-mail" : "WhatsApp"}
                  </button>
                ))}
              </div>
              <div><label className="text-xs font-medium text-muted-foreground">Nome da Campanha</label><AIInputField value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Ex: Newsletter Março 2026" className="w-full mt-1 rounded-lg border border-input bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" fieldLabel="Nome da campanha" fieldContext="Criação de campanha de email/WhatsApp marketing" /></div>
              {composeChannel === "email" && (
                <>
                  <div><label className="text-xs font-medium text-muted-foreground">Assunto</label><AIInputField value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)} placeholder="Linha de assunto do e-mail" className="w-full mt-1 rounded-lg border border-input bg-background py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" fieldLabel="Assunto do e-mail" fieldContext="Campanha de e-mail marketing" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Conteúdo</label><AITextareaField value={campaignContent} onChange={e => setCampaignContent(e.target.value)} rows={8} placeholder="Compose seu e-mail aqui..." className="w-full mt-1 rounded-xl border border-input bg-background py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none" fieldLabel="Conteúdo do e-mail" fieldContext={`Campanha de e-mail "${campaignName || "Nova campanha"}"`} /></div>
                </>
              )}
              {composeChannel === "whatsapp" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Mensagem</label>
                  <AITextareaField value={campaignContent} onChange={e => setCampaignContent(e.target.value)} rows={6} placeholder="Mensagem WhatsApp..." className="w-full mt-1 rounded-xl border border-input bg-background py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none" fieldLabel="Mensagem WhatsApp" fieldContext={`Campanha WhatsApp "${campaignName || "Nova campanha"}"`} />
                  {campaignContent && (
                    <div className="mt-3 rounded-lg bg-muted/50 p-4 border border-border">
                      <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                      <div className="bg-secondary/10 rounded-lg p-3 text-sm text-foreground whitespace-pre-wrap">{campaignContent}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTab("list")} className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground">Cancelar</button>
              <button onClick={() => { setCampaigns(prev => [...prev, { id: Date.now(), name: campaignName || "Rascunho", channel: composeChannel, status: "draft", audience: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, sentAt: "—" }]); setTab("list"); toast.success("Rascunho salvo"); }} className="px-4 py-2.5 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/80">Salvar Rascunho</button>
              <button onClick={handleSendCampaign} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2"><Send className="h-4 w-4" /> {scheduleMode === "now" ? "Enviar Agora" : "Agendar"}</button>
            </div>
          </div>

          {/* ── Sidebar ── */}
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

            {/* Criativo */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Criativo da Campanha</h3>
              {selectedCreative ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border-2 border-primary" style={{ height: 160 }}>
                    {selectedCreative.source === "lp" ? (
                      <iframe
                        srcDoc={selectedCreative.html}
                        sandbox="allow-same-origin"
                        scrolling="no"
                        style={{ width: 1280, height: 900, transform: "scale(0.195)", transformOrigin: "top left", pointerEvents: "none", border: "none" }}
                      />
                    ) : (
                      <img src={selectedCreative.mediaUrl} alt={selectedCreative.name} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                      <span className="text-white text-xs font-medium truncate">{selectedCreative.name}</span>
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    </div>
                    <button onClick={() => setSelectedCreative(null)} className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"><X className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => setShowCreativePicker(true)} className="w-full py-2 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary">Trocar criativo</button>
                </div>
              ) : (
                <div>
                  <button onClick={() => setShowCreativePicker(true)} className="w-full flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs font-medium">Escolher criativo</span>
                    <span className="text-[11px] opacity-70">Publicação, landing page ou imagem</span>
                  </button>
                </div>
              )}
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

      {/* ── Creative Picker Modal ── */}
      {showCreativePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreativePicker(false)}>
          <div className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold font-display">Escolher Criativo</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Selecione uma landing page, post publicado ou envie uma imagem</p>
              </div>
              <button onClick={() => setShowCreativePicker(false)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 px-5 pt-4 shrink-0">
              <button
                onClick={() => setCreativeTab("lp")}
                className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors", creativeTab === "lp" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
              >
                <Layout className="h-4 w-4" /> Landing Pages
              </button>
              <button
                onClick={() => { setCreativeTab("posts"); loadPublishedPosts(); }}
                className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors", creativeTab === "posts" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
              >
                <ImageLucide className="h-4 w-4" /> Publicações
              </button>
              <button
                onClick={() => setCreativeTab("upload")}
                className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors", creativeTab === "upload" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}
              >
                <Upload className="h-4 w-4" /> Upload Imagem
              </button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto p-5 flex-1">

              {/* ── Tab: Landing Pages ── */}
              {creativeTab === "lp" && (
                savedPages.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                    <Layout className="h-12 w-12 opacity-30" />
                    <p className="text-sm font-medium">Nenhuma landing page salva ainda</p>
                    <p className="text-xs opacity-70">Gere uma página no Tomás e ela aparecerá aqui automaticamente.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {savedPages.map(page => (
                      <button
                        key={page.id}
                        onClick={() => { setSelectedCreative({ source: "lp", id: page.id, name: page.name, html: page.html, savedAt: page.savedAt }); setShowCreativePicker(false); }}
                        className={cn("group relative rounded-xl overflow-hidden border-2 text-left transition-all hover:shadow-elevated", selectedCreative?.source === "lp" && selectedCreative.id === page.id ? "border-primary" : "border-border hover:border-primary/50")}
                      >
                        <div className="relative overflow-hidden bg-muted" style={{ height: 160 }}>
                          <iframe
                            srcDoc={page.html}
                            sandbox="allow-same-origin"
                            scrolling="no"
                            style={{ width: 1280, height: 900, transform: "scale(0.195)", transformOrigin: "top left", pointerEvents: "none", border: "none" }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          {selectedCreative?.source === "lp" && selectedCreative.id === page.id && (
                            <div className="absolute top-2 right-2 rounded-full bg-primary p-1"><CheckCircle className="h-3.5 w-3.5 text-white" /></div>
                          )}
                        </div>
                        <div className="p-3 bg-card">
                          <p className="text-xs font-semibold text-foreground truncate">{page.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(page.savedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}

              {/* ── Tab: Posts Publicados ── */}
              {creativeTab === "posts" && (
                postsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : publishedPosts.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                    <ImageLucide className="h-12 w-12 opacity-30" />
                    <p className="text-sm font-medium">Nenhuma publicação encontrada</p>
                    <p className="text-xs opacity-70">Publique conteúdos na seção de agendamento e eles aparecerão aqui como criativo.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {publishedPosts.map(post => {
                      const postName = post.caption?.slice(0, 40) || "Post publicado";
                      const isSelected = selectedCreative?.source === "post" && selectedCreative.id === post.id;
                      return (
                        <button
                          key={post.id}
                          onClick={() => { setSelectedCreative({ source: "post", id: post.id, name: postName, mediaUrl: post.media_url || "", caption: post.caption || "" }); setShowCreativePicker(false); }}
                          className={cn("group relative rounded-xl overflow-hidden border-2 text-left transition-all hover:shadow-elevated", isSelected ? "border-primary" : "border-border hover:border-primary/50")}
                        >
                          <div className="relative overflow-hidden bg-muted" style={{ height: 160 }}>
                            {post.media_url ? (
                              <img src={post.media_url} alt={postName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-muted-foreground"><ImageLucide className="h-10 w-10 opacity-30" /></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {isSelected && (
                              <div className="absolute top-2 right-2 rounded-full bg-primary p-1"><CheckCircle className="h-3.5 w-3.5 text-white" /></div>
                            )}
                          </div>
                          <div className="p-3 bg-card">
                            <p className="text-xs font-semibold text-foreground truncate">{postName}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{post.published_at ? new Date(post.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              )}

              {/* ── Tab: Upload Imagem ── */}
              {creativeTab === "upload" && (
                <div className="space-y-4">
                  <input ref={uploadImageRef} type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                  {uploadedImage ? (
                    <div className="space-y-4">
                      <div className="relative rounded-xl overflow-hidden border-2 border-primary mx-auto max-w-sm" style={{ height: 220 }}>
                        <img src={uploadedImage.dataUrl} alt={uploadedImage.name} className="w-full h-full object-contain bg-muted" />
                        <button onClick={() => setUploadedImage(null)} className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"><X className="h-4 w-4" /></button>
                      </div>
                      <p className="text-xs text-center text-muted-foreground truncate">{uploadedImage.name}</p>
                      <div className="flex gap-3 justify-center">
                        <button onClick={() => uploadImageRef.current?.click()} className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground">Trocar imagem</button>
                        <button
                          onClick={() => { setSelectedCreative({ source: "image", id: Date.now().toString(), name: uploadedImage.name, mediaUrl: uploadedImage.dataUrl }); setShowCreativePicker(false); }}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                        >
                          Usar esta imagem
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => uploadImageRef.current?.click()}
                      className="w-full flex flex-col items-center gap-3 py-16 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
                    >
                      <Upload className="h-10 w-10" />
                      <span className="text-sm font-medium">Clique para enviar imagem</span>
                      <span className="text-xs opacity-70">PNG, JPG, WebP, GIF</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CampaignsPage;
