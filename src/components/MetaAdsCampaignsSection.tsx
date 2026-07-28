import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2, RefreshCw, Pause, Play, AlertCircle,
  Sparkles, Plus, CheckCircle, X, Zap, BarChart2,
  Send, ExternalLink, Paperclip, FileText, ImageIcon,
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

// ── Rafaela Edit Modal ────────────────────────────────────────
type DisplayMsg = { role: "user" | "assistant"; content: string; files?: string[] };
type ApiBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string }; title: string };
type ApiMsg = { role: "user" | "assistant"; content: string | ApiBlock[] };

const WELCOME: DisplayMsg = { role: "assistant", content: "Olá! Sou a Rafaela. Tenho acesso direto à conta de anúncios da Calu Agência. O que você quer fazer? Posso listar campanhas, editar orçamentos, pausar/ativar campanhas, criar novas, verificar métricas… Você também pode me enviar imagens ou briefings em PDF!" };

function storageKey(clientId: string) { return `rafaela_chat_${clientId}`; }

function loadChat(clientId: string): { display: DisplayMsg[]; api: ApiMsg[] } {
  try {
    const raw = localStorage.getItem(storageKey(clientId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { display: [WELCOME], api: [] };
}

function saveChat(clientId: string, display: DisplayMsg[], api: ApiMsg[]) {
  try {
    // Strip image base64 from api history before saving (too large for localStorage)
    const apiClean = api.map((m) => {
      if (typeof m.content === "string") return m;
      const stripped = (m.content as ApiBlock[]).map((b) => {
        if (b.type === "image") return { type: "text" as const, text: "[imagem enviada anteriormente]" };
        if (b.type === "document") return { type: "text" as const, text: `[documento: ${(b as any).title ?? "arquivo"}]` };
        return b;
      });
      return { ...m, content: stripped };
    });
    localStorage.setItem(storageKey(clientId), JSON.stringify({ display, api: apiClean }));
  } catch { /* quota exceeded — ignore */ }
}

function RafaelaEditModal({
  clientId,
  clientColor,
  onClose,
}: {
  clientId: string;
  clientColor: string;
  onClose: () => void;
}) {
  const saved = loadChat(clientId);
  const [messages, setMessages] = useState<DisplayMsg[]>(saved.display);
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const apiMsgsRef = useRef<ApiMsg[]>(saved.api);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const s = (o: number) => `rgba(255,255,255,${o})`;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const clearChat = () => {
    localStorage.removeItem(storageKey(clientId));
    apiMsgsRef.current = [];
    setMessages([WELCOME]);
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && attachedFiles.length === 0) || loading) return;

    // Process files
    const blocks: ApiBlock[] = [];
    const textExtras: string[] = [];
    const fileNames = attachedFiles.map((f) => f.name);

    for (const file of attachedFiles) {
      if (file.type === "text/plain" || file.name.endsWith(".md")) {
        const txt = await file.text();
        textExtras.push(`--- ${file.name} ---\n${txt}`);
      } else {
        const b64 = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res((r.result as string).split(",")[1]);
          r.readAsDataURL(file);
        });
        if (file.type === "application/pdf") {
          blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 }, title: file.name });
        } else if (file.type.startsWith("image/")) {
          blocks.push({ type: "image", source: { type: "base64", media_type: file.type, data: b64 } });
          // Upload to Supabase Storage to get public URL for Meta Ads
          try {
            const path = `rafaela/${Date.now()}-${file.name}`;
            await supabase.storage.from("campaign-media").upload(path, file, { upsert: true });
            const { data: urlData } = supabase.storage.from("campaign-media").getPublicUrl(path);
            if (urlData?.publicUrl) {
              textExtras.push(`[URL pública da imagem para usar em image_url: ${urlData.publicUrl}]`);
            }
          } catch { /* upload failed — image still visible to Claude via base64 */ }
        }
      }
    }

    const fullText = [
      ...(textExtras.length > 0 ? [textExtras.join("\n")] : []),
      text || (attachedFiles.length > 0 ? "Analise os arquivos acima." : ""),
    ].join("\n\n").trim();

    const apiContent: string | ApiBlock[] = blocks.length > 0
      ? [...blocks, { type: "text" as const, text: fullText }]
      : fullText;

    const newApiMsgs: ApiMsg[] = [...apiMsgsRef.current, { role: "user", content: apiContent }];
    apiMsgsRef.current = newApiMsgs;

    const displayText = text || "📎 Arquivo enviado";
    setMessages((prev) => [...prev, { role: "user", content: displayText, files: fileNames }]);
    setInput("");
    setAttachedFiles([]);
    setLoading(true);
    const _tid = toast.loading("Acionando agente Rafaela…", { description: "Gestão de Tráfego — Meta Ads" });
    try {
      const data = await callFn({ action: "rafaela-agent", messages: newApiMsgs, client_id: clientId });
      const reply = data.message ?? "Pronto!";
      const updatedApi = [...newApiMsgs, { role: "assistant" as const, content: reply }];
      const updatedDisplay = [...messages, { role: "user" as const, content: displayText, files: fileNames }, { role: "assistant" as const, content: reply }];
      apiMsgsRef.current = updatedApi;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      saveChat(clientId, updatedDisplay, updatedApi);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao falar com Rafaela");
    } finally {
      toast.dismiss(_tid);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg flex flex-col rounded-2xl overflow-hidden"
        style={{ height: "600px", background: "#0d0d16", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: clientColor }}>
              <Sparkles className="w-4 h-4" style={{ color: "#000" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: s(0.9) }}>Rafaela</p>
              <p className="text-[10px]" style={{ color: s(0.35) }}>Gestora de Tráfego · Meta Ads</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.05)", color: s(0.4) }}
              title="Começar nova conversa"
            >
              <RefreshCw className="w-3 h-3" />
              Nova conversa
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
              <X className="w-3.5 h-3.5" style={{ color: s(0.5) }} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                  style={{ background: clientColor }}>
                  <Sparkles className="w-3 h-3" style={{ color: "#000" }} />
                </div>
              )}
              <div
                className="max-w-[82%] px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap space-y-1.5"
                style={{
                  background: msg.role === "user" ? clientColor : "rgba(255,255,255,0.07)",
                  color: msg.role === "user" ? "#000" : s(0.85),
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
                }}
              >
                <span>{msg.content}</span>
                {msg.files && msg.files.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {msg.files.map((name, j) => (
                      <div key={j} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium"
                        style={{ background: "rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.6)" }}>
                        {name.endsWith(".pdf") ? <FileText className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />}
                        {name.length > 18 ? name.slice(0, 16) + "…" : name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                style={{ background: clientColor }}>
                <Sparkles className="w-3 h-3" style={{ color: "#000" }} />
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "rgba(255,255,255,0.35)", animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "rgba(255,255,255,0.35)", animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "rgba(255,255,255,0.35)", animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* File chips */}
        {attachedFiles.length > 0 && (
          <div className="px-5 pb-2 flex flex-wrap gap-1.5">
            {attachedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px]"
                style={{ background: "rgba(255,255,255,0.07)", color: s(0.7) }}>
                {f.type.startsWith("image/") ? <ImageIcon className="w-3 h-3 shrink-0" /> : <FileText className="w-3 h-3 shrink-0" />}
                <span className="max-w-[120px] truncate">{f.name}</span>
                <button onClick={() => setAttachedFiles((p) => p.filter((_, j) => j !== i))}>
                  <X className="w-3 h-3" style={{ color: s(0.4) }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-5 py-4 flex gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
            multiple
            className="hidden"
            onChange={(e) => {
              setAttachedFiles((p) => [...p, ...Array.from(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="px-3 py-2.5 rounded-xl flex items-center justify-center shrink-0 transition-all"
            style={{ background: "rgba(255,255,255,0.06)", color: s(0.45) }}
            title="Anexar imagem ou PDF"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ex: pause a campanha X, aumente o orçamento de Y para R$50…"
            className="flex-1 rounded-xl px-3 py-2.5 text-xs outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: s(0.85) }}
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={(!input.trim() && attachedFiles.length === 0) || loading}
            className="px-3.5 py-2.5 rounded-xl flex items-center justify-center transition-all shrink-0"
            style={{
              background: (input.trim() || attachedFiles.length > 0) && !loading ? clientColor : "rgba(255,255,255,0.06)",
              color: (input.trim() || attachedFiles.length > 0) && !loading ? "#000" : s(0.25),
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string; files?: string[] }[]>([
    { role: "assistant", content: "Olá! Vou te ajudar a criar a campanha no Meta Ads. Pode me contar o que você vai anunciar ou anexar um arquivo de briefing." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);
  const apiMessagesRef = useRef<{ role: "user" | "assistant"; content: unknown }[]>([]);
  const [draft, setDraft] = useState<CampaignDraft>(DEFAULT_DRAFT);
  const [activate, setActivate] = useState(false);
  const [creativeMode, setCreativeMode] = useState<"none" | "image_url" | "existing_post">("none");
  const [pagePosts, setPagePosts] = useState<{ id: string; message: string; image_url: string | null; created_time: string }[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ campaign_id: string; adset_id: string; has_creative: boolean; activated?: boolean } | null>(null);
  const s = (o: number) => `rgba(255,255,255,${o})`;

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if ((!text && attachedFiles.length === 0) || chatLoading) return;

    // Read files into base64 blocks
    type Block =
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
      | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string }; title: string };

    const fileBlocks: Block[] = [];
    const textFileContents: string[] = [];
    for (const file of attachedFiles) {
      if (file.type === "text/plain" || file.type === "text/markdown" || file.name.endsWith(".md")) {
        const txt = await file.text();
        textFileContents.push(`--- ${file.name} ---\n${txt}`);
      } else {
        const b64 = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve((r.result as string).split(",")[1]);
          r.readAsDataURL(file);
        });
        if (file.type === "application/pdf") {
          fileBlocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 }, title: file.name });
        } else if (file.type.startsWith("image/")) {
          fileBlocks.push({ type: "image", source: { type: "base64", media_type: file.type, data: b64 } });
        }
      }
    }

    const fullText = [
      ...(textFileContents.length > 0 ? [textFileContents.join("\n\n")] : []),
      text || (attachedFiles.length > 0 ? "Analise os materiais acima e monte a campanha com base neles." : ""),
    ].join("\n\n").trim();

    // Build API content (multimodal if files present)
    const apiContent: unknown = fileBlocks.length > 0
      ? [...fileBlocks, { type: "text", text: fullText }]
      : fullText;

    // Update API messages history
    const newApiMessages = [...apiMessagesRef.current, { role: "user" as const, content: apiContent }];
    apiMessagesRef.current = newApiMessages;

    // Update display messages
    const displayText = text || "📎 Arquivo enviado para análise";
    const fileNames = attachedFiles.map((f) => f.name);
    setChatMessages((prev) => [...prev, { role: "user", content: displayText, files: fileNames }]);
    setChatInput("");
    setAttachedFiles([]);
    setChatLoading(true);

    const _caluTid = toast.loading("Acionando agente Rafaela…", { description: "Gestão de Tráfego — Meta Ads" });
    try {
      const data = await callFn({ action: "campaign-agent", messages: newApiMessages });
      if (data.done && data.parsed) {
        setDraft((prev) => ({ ...prev, ...data.parsed }));
        setStep("configure");
      } else if (data.message) {
        apiMessagesRef.current = [...newApiMessages, { role: "assistant" as const, content: data.message }];
        setChatMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Erro no agente");
    } finally {
      toast.dismiss(_caluTid);
      setChatLoading(false);
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
              {step === "briefing" ? "Agente de Campanhas" : step === "configure" ? "Configurar Campanha" : "Campanha Criada!"}
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
                {st === "briefing" ? "Agente IA" : st === "configure" ? "Configurar" : "Concluído"}
              </span>
              {i < 2 && <div className="w-6 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />}
            </div>
          ))}
        </div>

        {/* Agente conversacional */}
        {step === "briefing" && (
          <div className="flex flex-col gap-3">
            {/* Messages */}
            <div
              className="overflow-y-auto flex flex-col gap-2.5 pr-0.5"
              style={{ height: "320px" }}
            >
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                      style={{ background: clientColor }}>
                      <Sparkles className="w-2.5 h-2.5" style={{ color: "#000" }} />
                    </div>
                  )}
                  <div
                    className="max-w-[82%] px-3 py-2 text-xs leading-relaxed space-y-1.5"
                    style={{
                      background: msg.role === "user" ? clientColor : "rgba(255,255,255,0.07)",
                      color: msg.role === "user" ? "#000" : s(0.85),
                      borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "4px 14px 14px 14px",
                    }}
                  >
                    <span>{msg.content}</span>
                    {msg.files && msg.files.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {msg.files.map((name, j) => (
                          <div key={j} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium"
                            style={{ background: "rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.6)" }}>
                            {name.endsWith(".pdf") ? <FileText className="w-2.5 h-2.5" /> : <ImageIcon className="w-2.5 h-2.5" />}
                            {name.length > 18 ? name.slice(0, 16) + "…" : name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5"
                    style={{ background: clientColor }}>
                    <Sparkles className="w-2.5 h-2.5" style={{ color: "#000" }} />
                  </div>
                  <div className="px-3 py-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "rgba(255,255,255,0.35)", animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "rgba(255,255,255,0.35)", animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "rgba(255,255,255,0.35)", animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <input
              ref={chatFileRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
              multiple
              className="hidden"
              onChange={(e) => {
                const newFiles = Array.from(e.target.files ?? []);
                setAttachedFiles((prev) => [...prev, ...newFiles]);
                e.target.value = "";
              }}
            />
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attachedFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px]"
                    style={{ background: "rgba(255,255,255,0.07)", color: s(0.7) }}>
                    {f.type.startsWith("image/") ? <ImageIcon className="w-3 h-3 shrink-0" /> : <FileText className="w-3 h-3 shrink-0" />}
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button onClick={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))} className="ml-0.5">
                      <X className="w-3 h-3" style={{ color: s(0.4) }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => chatFileRef.current?.click()}
                disabled={chatLoading}
                className="px-3 py-2.5 rounded-xl flex items-center justify-center shrink-0 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: s(0.45) }}
                title="Anexar arquivo"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                placeholder={attachedFiles.length > 0 ? "Adicione uma mensagem (opcional)…" : "Digite sua resposta…"}
                className="flex-1 rounded-xl px-3 py-2.5 text-xs outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: s(0.85) }}
                disabled={chatLoading}
              />
              <button
                onClick={sendChatMessage}
                disabled={(!chatInput.trim() && attachedFiles.length === 0) || chatLoading}
                className="px-3.5 py-2.5 rounded-xl flex items-center justify-center transition-all shrink-0"
                style={{
                  background: (chatInput.trim() || attachedFiles.length > 0) && !chatLoading ? clientColor : "rgba(255,255,255,0.06)",
                  color: (chatInput.trim() || attachedFiles.length > 0) && !chatLoading ? "#000" : s(0.25),
                }}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
  const [showRafaela, setShowRafaela] = useState(false);
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

          <a
            href="https://www.facebook.com/adsmanager/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.05)", color: s(0.5) }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Meta Ads Manager
          </a>

          <button
            onClick={() => setShowRafaela(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "rgba(249,115,22,0.15)", color: "#F97316", border: "1px solid rgba(249,115,22,0.25)" }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Rafaela
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

      {showRafaela && (
        <RafaelaEditModal
          clientId={clientId}
          clientColor={clientColor}
          onClose={() => { setShowRafaela(false); loadCampaigns(); }}
        />
      )}

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
