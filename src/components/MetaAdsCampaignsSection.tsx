import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2, RefreshCw, Pause, Play, AlertCircle,
  Sparkles, Plus, CheckCircle, X, Zap, BarChart2,
  Paperclip, FileText, ImageIcon, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdCampaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  reach: number;
}

interface CampaignDraft {
  name: string;
  objective: string;
  optimization_goal: string;
  daily_budget_brl: number;
  age_min: number;
  age_max: number;
  genders: "all" | "male" | "female";
  start_time: string;
  end_time: string;
  page_id: string;
  image_url: string;
  destination_url: string;
  headline: string;
  body_text: string;
  call_to_action: string;
}

const DEFAULT_DRAFT: CampaignDraft = {
  name: "", objective: "OUTCOME_TRAFFIC", optimization_goal: "LINK_CLICKS",
  daily_budget_brl: 30, age_min: 18, age_max: 65, genders: "all",
  start_time: "", end_time: "", page_id: "", image_url: "",
  destination_url: "", headline: "", body_text: "", call_to_action: "LEARN_MORE",
};

async function callFn(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await (supabase as any).functions.invoke("smm", {
    body,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

function fmtMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function useSecondsAgo(ts: number | null) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!ts) return;
    const tick = () => setSecs(Math.floor((Date.now() - ts) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [ts]);
  return secs;
}

const DATE_PRESETS = [
  { label: "7 dias",  value: "last_7d" },
  { label: "30 dias", value: "last_30d" },
  { label: "90 dias", value: "last_90d" },
];

const OBJECTIVES = [
  { value: "OUTCOME_TRAFFIC",    label: "Tráfego" },
  { value: "OUTCOME_LEADS",      label: "Leads" },
  { value: "OUTCOME_AWARENESS",  label: "Reconhecimento" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engajamento" },
  { value: "OUTCOME_SALES",      label: "Vendas" },
];

const OPT_GOALS = [
  { value: "LINK_CLICKS",         label: "Cliques no link" },
  { value: "LEAD_GENERATION",     label: "Geração de leads" },
  { value: "REACH",               label: "Alcance" },
  { value: "POST_ENGAGEMENT",     label: "Engajamento" },
  { value: "CONVERSATIONS",       label: "Conversas" },
  { value: "OFFSITE_CONVERSIONS", label: "Conversões" },
];

const CTAS = ["LEARN_MORE","SIGN_UP","CONTACT_US","GET_OFFER","BUY_NOW"];

// ── Campaign Creator Modal ────────────────────────────────────
function CampaignModal({
  clientId,
  clientColor,
  onClose,
  onCreated,
}: {
  clientId: string;
  clientColor: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<"briefing" | "configure" | "done">("briefing");
  const [briefing, setBriefing] = useState("");
  const [briefingFiles, setBriefingFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [draft, setDraft] = useState<CampaignDraft>(DEFAULT_DRAFT);
  const [activate, setActivate] = useState(false);
  const [creativeMode, setCreativeMode] = useState<"none" | "image_url" | "existing_post">("none");
  const [pagePosts, setPagePosts] = useState<{ id: string; message: string; image_url: string | null; created_time: string }[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ campaign_id: string; adset_id: string; has_creative: boolean; activated?: boolean } | null>(null);
  const s = (o: number) => `rgba(255,255,255,${o})`;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPagePosts = async (pageId: string) => {
    if (!pageId.trim()) { toast.error("Preencha o ID da Página do Facebook primeiro"); return; }
    setLoadingPosts(true);
    try {
      const data = await callFn({ action: "list-page-posts", client_id: clientId, page_id: pageId });
      setPagePosts(data.posts ?? []);
      if ((data.posts ?? []).length === 0) toast.info("Nenhuma publicação encontrada nessa página");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao buscar publicações");
    } finally {
      setLoadingPosts(false);
    }
  };

  const parseBriefing = async () => {
    if (!briefing.trim() && briefingFiles.length === 0) return;
    setParsing(true);
    try {
      // Read files
      const files: { name: string; base64: string; media_type: string }[] = [];
      await Promise.all(briefingFiles.map(file => new Promise<void>(resolve => {
        if (file.type === "text/plain" || file.type === "text/markdown") {
          // For plain text, append to briefing instead
          resolve();
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const b64 = (reader.result as string).split(",")[1];
          files.push({ name: file.name, base64: b64, media_type: file.type });
          resolve();
        };
        reader.readAsDataURL(file);
      })));

      const data = await callFn({ action: "parse-campaign-briefing", briefing, ...(files.length > 0 && { files }) });
      if (data.parsed) {
        setDraft((prev) => ({ ...prev, ...data.parsed }));
        setStep("configure");
      } else {
        toast.error(data.error ?? "Não foi possível interpretar o briefing");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao interpretar briefing");
    } finally {
      setParsing(false);
    }
  };

  const createCampaign = async () => {
    setCreating(true);
    try {
      const campaignData = {
        ...draft,
        activate,
        ...(creativeMode === "existing_post" && selectedPostId ? { post_id: selectedPostId } : {}),
        ...(creativeMode === "image_url" ? {} : creativeMode === "existing_post" ? {} : { image_url: "" }),
      };
      const data = await callFn({ action: "create-meta-campaign", client_id: clientId, campaign: campaignData });
      if (data.reconnect_required) {
        toast.error("Token sem permissão ads_management. Vá em Redes Sociais → Anúncios → Reconectar Meta Ads.");
        setCreating(false);
        return;
      }
      setResult({ campaign_id: data.campaign_id, adset_id: data.adset_id, has_creative: data.has_creative, activated: activate });
      setStep("done");
      onCreated();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar campanha");
    } finally {
      setCreating(false);
    }
  };

  const field = (label: string, children: React.ReactNode) => (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: s(0.4) }}>{label}</span>
      {children}
    </label>
  );

  const inputCls = "w-full rounded-lg px-3 py-2 text-xs outline-none";
  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: s(0.85) };

  const stepIndex = { briefing: 0, configure: 1, done: 2 };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 space-y-5"
        style={{ background: "#0d0d16", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: clientColor }} />
            <span className="text-sm font-semibold" style={{ color: s(0.9) }}>
              {step === "briefing" ? "Briefing da Campanha" : step === "configure" ? "Configurar Campanha" : "Campanha Criada!"}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
            <X className="w-3.5 h-3.5" style={{ color: s(0.5) }} />
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2">
          {(["briefing", "configure", "done"] as const).map((st, i) => (
            <div key={st} className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{
                  background: step === st ? clientColor : (stepIndex[step] > i ? "rgba(185,255,75,0.2)" : "rgba(255,255,255,0.08)"),
                  color: step === st ? "#000" : (stepIndex[step] > i ? clientColor : s(0.3)),
                }}
              >
                {stepIndex[step] > i ? "✓" : i + 1}
              </div>
              <span className="text-[10px]" style={{ color: step === st ? s(0.7) : s(0.3) }}>
                {st === "briefing" ? "Briefing" : st === "configure" ? "Configurar" : "Concluído"}
              </span>
              {i < 2 && <div className="w-6 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />}
            </div>
          ))}
        </div>

        {/* Briefing */}
        {step === "briefing" && (
          <div className="space-y-4">
            <p className="text-[11px]" style={{ color: s(0.45) }}>
              Descreva a campanha em linguagem natural. A IA vai interpretar o objetivo, orçamento, público e gerar os parâmetros automaticamente.
            </p>
            <textarea
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              placeholder="Ex: Campanha para captar leads de pessoas entre 25-40 anos interessadas em cursos de marketing. Orçamento de R$50/dia. Foco em mulheres de São Paulo."
              rows={4}
              className="w-full rounded-xl px-3 py-3 text-xs resize-none outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: s(0.8) }}
            />

            {/* File upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
              multiple
              className="hidden"
              onChange={(e) => {
                const newFiles = Array.from(e.target.files ?? []);
                setBriefingFiles(prev => [...prev, ...newFiles]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 rounded-xl text-[11px] flex items-center justify-center gap-2 transition-all"
              style={{ border: "1px dashed rgba(255,255,255,0.15)", color: s(0.4), background: "transparent" }}
            >
              <Paperclip className="w-3.5 h-3.5" />
              Anexar arquivo de referência (PDF, imagem, texto)
            </button>
            {briefingFiles.length > 0 && (
              <div className="space-y-1.5">
                {briefingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                    {f.type.startsWith("image/") ? (
                      <ImageIcon className="w-3 h-3 shrink-0" style={{ color: s(0.4) }} />
                    ) : (
                      <FileText className="w-3 h-3 shrink-0" style={{ color: s(0.4) }} />
                    )}
                    <span className="text-[10px] flex-1 truncate" style={{ color: s(0.6) }}>{f.name}</span>
                    <button onClick={() => setBriefingFiles(prev => prev.filter((_, j) => j !== i))} className="p-0.5">
                      <X className="w-3 h-3" style={{ color: s(0.3) }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={parseBriefing}
              disabled={(!briefing.trim() && briefingFiles.length === 0) || parsing}
              className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: (briefing.trim() || briefingFiles.length > 0) ? clientColor : "rgba(255,255,255,0.06)",
                color: (briefing.trim() || briefingFiles.length > 0) ? "#000" : s(0.3),
              }}
            >
              {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {parsing ? "Interpretando…" : "Interpretar com IA"}
            </button>
          </div>
        )}

        {/* Configure */}
        {step === "configure" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {field("Nome da Campanha",
                <input className={inputCls} style={inputStyle} value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              )}
              <div className="grid grid-cols-2 gap-3">
                {field("Objetivo",
                  <select className={inputCls} style={inputStyle} value={draft.objective}
                    onChange={(e) => setDraft({ ...draft, objective: e.target.value })}>
                    {OBJECTIVES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )}
                {field("Otimização",
                  <select className={inputCls} style={inputStyle} value={draft.optimization_goal}
                    onChange={(e) => setDraft({ ...draft, optimization_goal: e.target.value })}>
                    {OPT_GOALS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {field("Orçamento/dia (R$)",
                  <input type="number" className={inputCls} style={inputStyle} min={6} value={draft.daily_budget_brl}
                    onChange={(e) => setDraft({ ...draft, daily_budget_brl: +e.target.value })} />
                )}
                {field("Idade mín.",
                  <input type="number" className={inputCls} style={inputStyle} min={18} max={65} value={draft.age_min}
                    onChange={(e) => setDraft({ ...draft, age_min: +e.target.value })} />
                )}
                {field("Idade máx.",
                  <input type="number" className={inputCls} style={inputStyle} min={18} max={65} value={draft.age_max}
                    onChange={(e) => setDraft({ ...draft, age_max: +e.target.value })} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field("Gênero",
                  <select className={inputCls} style={inputStyle} value={draft.genders}
                    onChange={(e) => setDraft({ ...draft, genders: e.target.value as any })}>
                    <option value="all">Todos</option>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                  </select>
                )}
                {field("CTA",
                  <select className={inputCls} style={inputStyle} value={draft.call_to_action}
                    onChange={(e) => setDraft({ ...draft, call_to_action: e.target.value })}>
                    {CTAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>
              {field("Título do anúncio (opcional, máx 40 chars)",
                <input className={inputCls} style={inputStyle} maxLength={40} value={draft.headline}
                  onChange={(e) => setDraft({ ...draft, headline: e.target.value })} />
              )}
              {field("Texto do anúncio (opcional, máx 125 chars)",
                <textarea className={cn(inputCls, "resize-none")} style={inputStyle} maxLength={125} rows={2} value={draft.body_text}
                  onChange={(e) => setDraft({ ...draft, body_text: e.target.value })} />
              )}
              {field("URL de destino (opcional)",
                <input className={inputCls} style={inputStyle} value={draft.destination_url}
                  onChange={(e) => setDraft({ ...draft, destination_url: e.target.value })}
                  placeholder="https://..." />
              )}
              {field("ID da Página do Facebook (opcional — necessário para criar o anúncio)",
                <input className={inputCls} style={inputStyle} value={draft.page_id}
                  onChange={(e) => setDraft({ ...draft, page_id: e.target.value })}
                  placeholder="123456789" />
              )}
            </div>

            {/* Creative mode */}
            <div className="space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: s(0.4) }}>Criativo do anúncio</span>
              <div className="flex gap-2 flex-wrap">
                {([
                  { value: "none", label: "Sem imagem" },
                  { value: "image_url", label: "URL da imagem" },
                  { value: "existing_post", label: "Publicação existente" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setCreativeMode(opt.value); setSelectedPostId(null); }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                    style={{
                      background: creativeMode === opt.value ? clientColor : "rgba(255,255,255,0.06)",
                      color: creativeMode === opt.value ? "#000" : s(0.45),
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {creativeMode === "image_url" && (
                <div className="mt-2">
                  {field("URL da imagem",
                    <input className={inputCls} style={inputStyle} value={draft.image_url}
                      onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                      placeholder="https://..." />
                  )}
                </div>
              )}

              {creativeMode === "existing_post" && (
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => loadPagePosts(draft.page_id)}
                    disabled={loadingPosts}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                    style={{ background: "rgba(255,255,255,0.07)", color: s(0.6) }}
                  >
                    {loadingPosts ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    {loadingPosts ? "Buscando…" : "Carregar publicações da página"}
                  </button>
                  {pagePosts.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-xl p-1">
                      {pagePosts.map((post) => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => setSelectedPostId(post.id === selectedPostId ? null : post.id)}
                          className="text-left p-2 rounded-xl space-y-1.5 transition-all"
                          style={{
                            background: selectedPostId === post.id ? "rgba(185,255,75,0.1)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${selectedPostId === post.id ? "rgba(185,255,75,0.35)" : "rgba(255,255,255,0.07)"}`,
                          }}
                        >
                          {post.image_url && (
                            <img src={post.image_url} alt="" className="w-full h-14 object-cover rounded-lg" />
                          )}
                          <p className="text-[9px] line-clamp-2" style={{ color: s(0.55) }}>
                            {post.message || "(sem legenda)"}
                          </p>
                          <p className="text-[9px]" style={{ color: s(0.25) }}>
                            {new Date(post.created_time).toLocaleDateString("pt-BR")}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Publicar imediatamente */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                className="w-8 h-4 rounded-full relative transition-all shrink-0"
                style={{ background: activate ? clientColor : "rgba(255,255,255,0.12)" }}
                onClick={() => setActivate(v => !v)}
              >
                <div
                  className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                  style={{ background: "#fff", left: activate ? "calc(100% - 14px)" : "2px" }}
                />
              </div>
              <span className="text-[11px]" style={{ color: s(0.65) }}>
                Publicar imediatamente (status <strong style={{ color: activate ? "#34D399" : s(0.65) }}>ATIVA</strong>)
              </span>
            </label>

            {activate ? (
              <div className="rounded-xl p-3 text-[11px]"
                style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)", color: s(0.5) }}>
                A campanha será criada como <strong style={{ color: "#34D399" }}>ATIVA</strong> — o investimento começa imediatamente após a criação.
              </div>
            ) : (
              <div className="rounded-xl p-3 text-[11px]"
                style={{ background: "rgba(185,255,75,0.06)", border: "1px solid rgba(185,255,75,0.15)", color: s(0.5) }}>
                A campanha será criada como <strong style={{ color: s(0.7) }}>PAUSADA</strong> — revise no Meta Ads Manager antes de ativar.
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep("briefing")}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.05)", color: s(0.5) }}>
                Voltar
              </button>
              <button
                onClick={createCampaign}
                disabled={!draft.name.trim() || creating}
                className="flex-[2] py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: draft.name.trim() ? clientColor : "rgba(255,255,255,0.06)", color: draft.name.trim() ? "#000" : s(0.3) }}>
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {creating ? "Criando…" : "Criar Campanha"}
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === "done" && result && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12" style={{ color: clientColor }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: s(0.9) }}>Campanha criada com sucesso!</p>
            <div className="rounded-xl p-4 text-left space-y-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: s(0.4) }}>Campaign ID</span>
                <span className="font-mono text-[10px]" style={{ color: s(0.7) }}>{result.campaign_id}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: s(0.4) }}>Ad Set ID</span>
                <span className="font-mono text-[10px]" style={{ color: s(0.7) }}>{result.adset_id}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: s(0.4) }}>Criativo</span>
                <span style={{ color: result.has_creative ? "#34D399" : s(0.4) }}>
                  {result.has_creative ? "Criado" : "Não criado (sem page_id)"}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span style={{ color: s(0.4) }}>Status inicial</span>
                <span style={{ color: result.activated ? "#34D399" : "#FBBF24" }}>
                  {result.activated ? "ATIVA" : "PAUSADA"}
                </span>
              </div>
            </div>
            <p className="text-[11px]" style={{ color: s(0.4) }}>
              {result.activated
                ? "A campanha já está ativa. Acompanhe o desempenho no Meta Ads Manager."
                : "Acesse o Meta Ads Manager para revisar e ativar a campanha."}
            </p>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-semibold"
              style={{ background: clientColor, color: "#000" }}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MetaAdsCampaignsSection ───────────────────────────────────
export default function MetaAdsCampaignsSection({
  clientId,
  clientColor = "#B9FF4B",
}: {
  clientId: string;
  clientColor?: string;
}) {
  const [datePreset, setDatePreset] = useState("last_30d");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [accountName, setAccountName] = useState<string>("");
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [lastRefreshTs, setLastRefreshTs] = useState<number | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const s = (o: number) => `rgba(255,255,255,${o})`;
  const secondsAgo = useSecondsAgo(lastRefreshTs);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callFn({ action: "ads-campaigns", client_id: clientId, date_preset: datePreset });
      setCampaigns(data.campaigns ?? []);
      setLastRefreshTs(Date.now());
      setConnected(true);
    } catch (e: any) {
      if (e?.message?.includes("não conectad") || e?.message?.includes("connected: false")) {
        setConnected(false);
      } else {
        toast.error(e?.message ?? "Erro ao carregar campanhas");
      }
    } finally {
      setLoading(false);
    }
  }, [clientId, datePreset]);

  const checkConnection = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await (supabase as any)
        .from("social_connections")
        .select("account_name")
        .eq("user_id", session.user.id)
        .eq("client_id", clientId)
        .eq("platform", "meta_ads")
        .eq("connected", true)
        .maybeSingle();
      setConnected(!!data);
      if (data?.account_name) setAccountName(data.account_name);
    } catch { setConnected(false); }
  }, [clientId]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (connected) loadCampaigns();
  }, [connected, loadCampaigns]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (connected) {
      autoRefreshRef.current = setInterval(loadCampaigns, 30_000);
    } else {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [connected, loadCampaigns]);

  const toggleCampaign = async (campaign: AdCampaign) => {
    const newStatus = campaign.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setTogglingId(campaign.id);
    try {
      await callFn({ action: "toggle-campaign", campaign_id: campaign.id, status: newStatus, client_id: clientId });
      setCampaigns((prev) => prev.map((c) => c.id === campaign.id ? { ...c, status: newStatus as any } : c));
      toast.success(newStatus === "ACTIVE" ? "Campanha ativada" : "Campanha pausada");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao alterar status");
    } finally {
      setTogglingId(null);
    }
  };

  if (connected === null) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: clientColor }} />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="rounded-2xl p-10 text-center space-y-3"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
        <BarChart2 className="w-8 h-8 mx-auto" style={{ color: "rgba(255,255,255,0.15)" }} />
        <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Meta Ads não conectado</p>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          Vá em <strong style={{ color: "rgba(255,255,255,0.4)" }}>Redes Sociais → Anúncios</strong> e conecte o Meta Ads para gerenciar campanhas aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Campanhas Meta Ads</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              {accountName || "Conta conectada"}
            </span>
            {lastRefreshTs && (
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                · atualizado há {secondsAgo}s
              </span>
            )}
            {loading && <Loader2 className="w-3 h-3 animate-spin" style={{ color: "rgba(255,255,255,0.3)" }} />}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date preset */}
          <div className="flex items-center gap-1 p-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {DATE_PRESETS.map((p) => (
              <button key={p.value} onClick={() => setDatePreset(p.value)}
                className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-all"
                style={{ background: datePreset === p.value ? clientColor : "transparent", color: datePreset === p.value ? "#000" : s(0.45) }}>
                {p.label}
              </button>
            ))}
          </div>

          <button onClick={loadCampaigns} disabled={loading}
            className="p-2 rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} style={{ color: s(0.4) }} />
          </button>

          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: clientColor, color: "#000" }}>
            <Plus className="w-3.5 h-3.5" />
            Criar com IA
          </button>
        </div>
      </div>

      {/* Campaign list */}
      {!loading && campaigns.length === 0 && (
        <div className="rounded-2xl p-16 text-center space-y-3"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <Sparkles className="w-7 h-7 mx-auto" style={{ color: "rgba(255,255,255,0.15)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Nenhuma campanha encontrada no período</p>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            Use "Criar com IA" para lançar sua primeira campanha via briefing.
          </p>
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Table header */}
          <div className="grid grid-cols-[1fr,auto,auto,auto,auto,auto,auto] gap-4 px-5 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            {["Campanha", "Status", "Gasto", "Impressões", "Cliques", "CTR", ""].map((h, i) => (
              <span key={i} className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: s(0.3) }}>{h}</span>
            ))}
          </div>

          {campaigns.map((c, idx) => (
            <div key={c.id}
              className="grid grid-cols-[1fr,auto,auto,auto,auto,auto,auto] gap-4 items-center px-5 py-3.5"
              style={{ borderBottom: idx < campaigns.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>

              <div className="min-w-0 flex items-center gap-2">
                {c.status === "ACTIVE" && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: "#34D399" }} />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: s(0.85) }}>{c.name}</div>
                  <div className="text-[9px] mt-0.5 truncate" style={{ color: s(0.3) }}>{c.objective}</div>
                </div>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                style={{
                  background: c.status === "ACTIVE" ? "rgba(52,211,153,0.12)" : c.status === "PAUSED" ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.05)",
                  color: c.status === "ACTIVE" ? "#34D399" : c.status === "PAUSED" ? "#FBBF24" : s(0.3),
                }}>
                {c.status === "ACTIVE" ? "Ativa" : c.status === "PAUSED" ? "Pausada" : c.status}
              </span>

              <span className="text-xs font-medium tabular-nums whitespace-nowrap" style={{ color: s(0.7) }}>{fmtMoney(c.spend)}</span>
              <span className="text-xs tabular-nums" style={{ color: s(0.6) }}>{fmtNum(c.impressions)}</span>
              <span className="text-xs tabular-nums" style={{ color: s(0.6) }}>{fmtNum(c.clicks)}</span>
              <span className="text-xs tabular-nums" style={{ color: s(0.6) }}>{c.ctr.toFixed(2)}%</span>

              <button
                onClick={() => toggleCampaign(c)}
                disabled={!!togglingId || c.status === "ARCHIVED" || c.status === "DELETED"}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap"
                style={{
                  background: c.status === "ACTIVE" ? "rgba(251,191,36,0.1)" : c.status === "PAUSED" ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)",
                  color: c.status === "ACTIVE" ? "#FBBF24" : c.status === "PAUSED" ? "#34D399" : s(0.3),
                }}>
                {togglingId === c.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : c.status === "ACTIVE" ? (
                  <><Pause className="w-3 h-3" /> Pausar</>
                ) : c.status === "PAUSED" ? (
                  <><Play className="w-3 h-3" /> Ativar</>
                ) : (
                  <span>{c.status}</span>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reconnect hint */}
      <div className="flex items-start gap-2 px-1">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          Para criar campanhas é necessário ter o Meta Ads conectado com permissão <strong>ads_management</strong>. Se aparecer erro de permissão, reconecte em Redes Sociais → Anúncios.
        </p>
      </div>

      {showModal && (
        <CampaignModal
          clientId={clientId}
          clientColor={clientColor}
          onClose={() => setShowModal(false)}
          onCreated={loadCampaigns}
        />
      )}
    </div>
  );
}
