import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram, Facebook, Linkedin, Plus, Trash2, X,
  CheckCircle2, AlertCircle, Clock, Users, Eye,
  TrendingUp, RefreshCw, ExternalLink, Image as ImageIcon,
  Calendar, Send, Wifi, Upload, Loader2,
  Heart, MessageCircle, Bookmark, MoreHorizontal,
  ChevronLeft, ChevronRight, List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────────
interface SocialConnection {
  id: string;
  platform: "instagram" | "facebook" | "linkedin";
  account_id: string;
  account_name: string;
  account_username: string | null;
  followers_count: number;
  connected: boolean;
  connected_at: string | null;
  token_expires_at: string | null;
}

interface ScheduledPost {
  id: string;
  platforms: string[];
  caption: string | null;
  media_url: string | null;
  media_type: string;
  scheduled_at: string | null;
  published_at: string | null;
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  fb_post_id: string | null;
  ig_media_id: string | null;
  error_message: string | null;
  created_at: string;
}

interface Metric {
  platform: string;
  account_name: string;
  followers: number;
  impressions: number;
  reach: number;
  engagement: number;
}

// ── Meta OAuth ─────────────────────────────────────────────────
const META_APP_ID = "1718744112773878";
const META_SCOPE = "pages_show_list,pages_read_engagement,pages_manage_posts,business_management,public_profile";
// Redirect goes through Supabase edge function (trusted domain — avoids browser security warnings)
const META_REDIRECT_URI = "https://caluagencia.com.br/oauth/meta";

// ── Config ─────────────────────────────────────────────────────
const PLATFORM_CFG = {
  instagram: {
    name: "Instagram",
    Icon: Instagram,
    color: "#E1306C",
    bg: "rgba(225,48,108,0.1)",
    border: "rgba(225,48,108,0.2)",
    desc: "Posts, Stories, Reels e métricas",
  },
  facebook: {
    name: "Facebook",
    Icon: Facebook,
    color: "#1877F2",
    bg: "rgba(24,119,242,0.1)",
    border: "rgba(24,119,242,0.2)",
    desc: "Página, Feed e Facebook Insights",
  },
  linkedin: {
    name: "LinkedIn",
    Icon: Linkedin,
    color: "#0A66C2",
    bg: "rgba(10,102,194,0.1)",
    border: "rgba(10,102,194,0.2)",
    desc: "Abre compose — escolha página ou perfil",
  },
} as const;

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  draft:      { label: "Rascunho",   color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.06)" },
  scheduled:  { label: "Agendado",   color: "#FBBF24",               bg: "rgba(251,191,36,0.1)"  },
  publishing: { label: "Publicando", color: "#60A5FA",               bg: "rgba(96,165,250,0.1)"  },
  published:  { label: "Publicado",  color: "#34D399",               bg: "rgba(52,211,153,0.1)"  },
  failed:     { label: "Falhou",     color: "#F87171",               bg: "rgba(248,113,113,0.1)" },
};

// ── Helpers ─────────────────────────────────────────────────────
function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

async function callFn(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke("smm", {
    body,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

const db = supabase as any;

// ── Component ──────────────────────────────────────────────────
export default function SocialMediaTab({
  clientId,
  clientColor = "#B9FF4B",
}: {
  clientId: string;
  clientColor?: string;
}) {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [postFilter, setPostFilter] = useState<"all" | "scheduled" | "published" | "draft">("all");
  const [showComposer, setShowComposer] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localMediaFile, setLocalMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarDate, setCalendarDate] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; });
  const [previewType, setPreviewType] = useState<"feed" | "story">("feed");
  const [dragOver, setDragOver] = useState(false);
  const [linkedinStep, setLinkedinStep] = useState<null | "enter-url" | "oauth">(null);
  const [linkedinOrgUrl, setLinkedinOrgUrl] = useState("");
  const pendingOAuthStateRef = useRef<string>("");
  const userIdRef = useRef<string>("");

  const [composer, setComposer] = useState({
    platforms: [] as string[],
    caption: "",
    media_url: "",
    media_type: "post" as "post" | "story",
    link_url: "",
    post_now: true,
    scheduled_at: "",
  });

  // ── Load ───────────────────────────────────────────────────
  const loadConnections = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await db
        .from("social_connections")
        .select("id,platform,account_id,account_name,account_username,followers_count,connected,connected_at,token_expires_at")
        .eq("user_id", session.user.id)
        .eq("client_id", clientId);
      if (!error && data) setConnections(data as SocialConnection[]);
    } catch { /* silently ignore */ }
  }, [clientId]);

  const loadPosts = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data, error } = await db
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) setPosts(data as ScheduledPost[]);
    } catch { /* silently ignore */ }
  }, [clientId]);

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const data = await callFn({ action: "metrics", client_id: clientId });
      if (data?.metrics) setMetrics(data.metrics);
    } catch { /* silently ignore */ }
    setMetricsLoading(false);
  }, [clientId]);

  // Pre-fetch userId so handleConnect can be fully synchronous
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) userIdRef.current = session.user.id;
    });
  }, []);

  // Detect meta_connected / meta_error params on return from Supabase callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("meta_connected");
    const metaError = params.get("meta_error");
    if (connected === "1") {
      toast.success("Facebook conectado!");
      loadConnections();
      loadMetrics();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (metaError) {
      toast.error(decodeURIComponent(metaError));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Complete pending OAuth exchange stored by OAuthCallbackPage (new-tab flow)
  useEffect(() => {
    const raw = sessionStorage.getItem("meta-oauth-pending");
    if (!raw) return;
    try {
      const { code, state, redirect_uri } = JSON.parse(raw) as { code: string; state: string; redirect_uri: string };
      const b64 = state.replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
      const { clientId: pendingClientId } = JSON.parse(atob(padded));
      if (pendingClientId !== clientId) return;
      sessionStorage.removeItem("meta-oauth-pending");
      supabase.functions.invoke("smm", {
        body: { action: "oauth-callback", code, state, redirect_uri },
      }).then(({ data, error }) => {
        if (error || data?.error) {
          toast.error(data?.error ?? error?.message ?? "Erro ao conectar Facebook.");
        } else {
          toast.success("Facebook conectado!");
          loadConnections();
          loadMetrics();
        }
      }).catch((e) => toast.error(e instanceof Error ? e.message : "Erro ao conectar."));
    } catch { /* ignore parse errors */ }
  }, [clientId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.allSettled([loadConnections(), loadPosts()]);
      setLoading(false);
    };
    init();
  }, [clientId]);

  // ── OAuth connect ──────────────────────────────────────────
  const handleConnect = (platform: "instagram" | "facebook") => {
    if (!userIdRef.current) {
      toast.error("Sessão expirada. Recarregue a página.");
      return;
    }
    setConnecting(platform);
    // Fully synchronous — no await — preserves user-gesture context for window.open
    const state = btoa(JSON.stringify({ userId: userIdRef.current, clientId, platform, ts: Date.now() }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    pendingOAuthStateRef.current = state;
    const oauthUrl =
      `https://www.facebook.com/v22.0/dialog/oauth` +
      `?client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(META_SCOPE)}` +
      `&state=${encodeURIComponent(state)}` +
      `&response_type=code`;

    try {
      const popup = window.open(oauthUrl, "meta-oauth", "width=620,height=720,left=200,top=100");

      const onMessage = async (event: MessageEvent) => {
        if (event.data?.type === "meta-oauth-exchange") {
          window.removeEventListener("message", onMessage);
          clearInterval(timer);
          const { code, state: receivedState } = event.data as { code: string; state: string };
          const resolvedState = receivedState || pendingOAuthStateRef.current;
          const usedRedirectUri = META_REDIRECT_URI;
          pendingOAuthStateRef.current = "";
          try {
            const { data, error } = await supabase.functions.invoke("smm", {
              body: { action: "oauth-callback", code, state: resolvedState, redirect_uri: usedRedirectUri },
            });
            let msg = "Erro ao conectar.";
            if (error) {
              try { const b = await (error as any).context?.json?.(); msg = b?.error ?? error.message ?? msg; }
              catch { msg = error.message ?? msg; }
            } else if (data?.error) {
              msg = data.error;
            }
            if (error || data?.error) {
              toast.error(msg);
            } else {
              if (platform === "facebook" && data?.instagram_connected) {
                toast.success("Facebook e Instagram conectados!");
              } else {
                toast.success(`${PLATFORM_CFG[platform].name} conectado!`);
              }
              loadConnections();
              loadMetrics();
            }
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao conectar.");
          } finally {
            setConnecting(null);
          }
        } else if (event.data?.type === "meta-oauth-error") {
          window.removeEventListener("message", onMessage);
          clearInterval(timer);
          toast.error(event.data.error ?? "Erro ao conectar.");
          setConnecting(null);
        }
      };
      window.addEventListener("message", onMessage);

      const timer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(timer);
          window.removeEventListener("message", onMessage);
          setConnecting(null);
        }
      }, 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao iniciar OAuth.");
      setConnecting(null);
    }
  };

  const handleConnectLinkedIn = async () => {
    const vanityName = linkedinOrgUrl
      ? (linkedinOrgUrl.match(/linkedin\.com\/company\/([^/?#\s]+)/i)?.[1]?.replace(/\/$/, "") ?? "")
      : "";
    setLinkedinStep("oauth");
    setConnecting("linkedin");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada."); setLinkedinStep("enter-url"); setConnecting(null); return; }

      const { data: urlData, error: urlError } = await supabase.functions.invoke("smm", {
        body: { action: "linkedin-oauth-url", client_id: clientId, org_vanity_name: vanityName },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (urlError || urlData?.error) {
        toast.error(urlData?.error ?? "Erro ao gerar URL OAuth.");
        setLinkedinStep("enter-url");
        setConnecting(null);
        return;
      }

      const popup = window.open(urlData.url, "linkedin-oauth", "width=620,height=720,left=200,top=100");

      const onMessage = async (event: MessageEvent) => {
        if (event.data?.type === "linkedin-oauth-exchange") {
          window.removeEventListener("message", onMessage);
          clearInterval(timer);
          try {
            const { data, error } = await supabase.functions.invoke("smm", {
              body: { action: "linkedin-oauth-callback", code: event.data.code, state: event.data.state },
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (error || data?.error) {
              toast.error(data?.error ?? "Erro ao conectar LinkedIn.");
            } else {
              toast.success("LinkedIn conectado!");
              setLinkedinStep(null);
              setLinkedinOrgUrl("");
              loadConnections();
            }
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao conectar.");
          } finally {
            setConnecting(null);
          }
        } else if (event.data?.type === "linkedin-oauth-error") {
          window.removeEventListener("message", onMessage);
          clearInterval(timer);
          toast.error(event.data.error ?? "Erro ao conectar LinkedIn.");
          setConnecting(null);
          setLinkedinStep("enter-url");
        }
      };
      window.addEventListener("message", onMessage);

      const timer = setInterval(() => {
        if (popup?.closed) {
          clearInterval(timer);
          window.removeEventListener("message", onMessage);
          setConnecting(null);
          setLinkedinStep("enter-url");
        }
      }, 800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro.");
      setConnecting(null);
      setLinkedinStep("enter-url");
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Desconectar ${PLATFORM_CFG[platform as keyof typeof PLATFORM_CFG]?.name ?? platform}?`)) return;
    setDisconnecting(platform);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada."); return; }
      const { error } = await db
        .from("social_connections")
        .delete()
        .eq("user_id", session.user.id)
        .eq("client_id", clientId)
        .eq("platform", platform);
      if (!error) {
        toast.info("Conta desconectada.");
        setConnections((prev) => prev.filter((c) => c.platform !== platform));
        setMetrics((prev) => prev.filter((m) => m.platform !== platform));
      } else {
        toast.error(error.message ?? "Erro ao desconectar.");
      }
    } finally {
      setDisconnecting(null);
    }
  };

  // ── Upload media ───────────────────────────────────────────
  const handleFileUpload = (file: File) => {
    // Preview imediato via blob URL — sem depender do Supabase
    const localUrl = URL.createObjectURL(file);
    setLocalMediaFile(file);
    setComposer((p) => ({ ...p, media_url: localUrl }));
    toast.success(file.type.startsWith("video/") ? "Vídeo carregado!" : "Imagem carregada!");
  };

  const uploadMediaToSupabase = async (file: File): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const ext = file.name.split(".").pop();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("post-media").upload(path, file, { upsert: true });
      if (error) { toast.error(`Erro no upload: ${error.message}`); return null; }
      const { data: { publicUrl } } = supabase.storage.from("post-media").getPublicUrl(path);
      return publicUrl;
    } catch {
      return null;
    }
  };

  // ── Create post ────────────────────────────────────────────
  const handleSubmitPost = async () => {
    if (!composer.platforms.length) { toast.error("Selecione ao menos uma plataforma."); return; }
    if (composer.media_type === "story" && !composer.media_url.trim()) { toast.error("Story requer imagem."); return; }
    if (composer.media_type === "post" && !composer.caption.trim() && !composer.media_url.trim()) { toast.error("Adicione uma legenda ou imagem."); return; }
    if (!composer.post_now && !composer.scheduled_at) { toast.error("Selecione a data de agendamento."); return; }

    setSubmitting(true);
    try {
      // Se tem arquivo local, sobe pro Supabase agora para gerar URL pública
      let finalMediaUrl = composer.media_url || null;
      if (localMediaFile && composer.media_url.startsWith("blob:")) {
        const uploaded = await uploadMediaToSupabase(localMediaFile);
        if (uploaded) finalMediaUrl = uploaded;
        // se falhou, tenta com blob mesmo (plataformas reais vão rejeitar, mas não trava o fluxo)
      }

      const data = await callFn({
        action: "create-post",
        client_id: clientId,
        platforms: composer.platforms,
        caption: composer.media_type === "story" ? null : (composer.caption || null),
        media_url: finalMediaUrl,
        media_type: composer.media_type === "story" ? "story" : (composer.media_url ? "image" : "text"),
        link_url: composer.media_type === "story" ? (composer.link_url || null) : null,
        scheduled_at: composer.post_now ? null : composer.scheduled_at,
      });

      if (data.error) { toast.error(data.error); return; }
      if (data.linkedin_intent_url) {
        window.open(data.linkedin_intent_url, "_blank");
        toast.success("LinkedIn aberto — escolha a Página de Empresa e publique!");
      }
      if (data.error_message) toast.warning(`Publicado com aviso: ${data.error_message}`);
      else if (!composer.post_now) toast.success(composer.media_type === "story" ? "Story agendado!" : "Post agendado!");
      else toast.success(composer.media_type === "story" ? "Story publicado!" : "Post publicado!");

      setShowComposer(false);
      setComposer({ platforms: [], caption: "", media_url: "", media_type: "post", link_url: "", post_now: true, scheduled_at: "" });
      setLocalMediaFile(null);
      loadPosts();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    setDeletingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada."); return; }
      const { error } = await db
        .from("scheduled_posts")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id);
      if (!error) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Post removido.");
      } else {
        toast.error(error.message ?? "Erro ao remover.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const connectedPlatforms = connections.filter((c) => c.connected);
  const filteredPosts = posts.filter((p) => postFilter === "all" || p.status === postFilter);
  const igConn = connections.find((c) => c.platform === "instagram" && c.connected);

  // Calendar helpers
  const postsByDate = posts.reduce((acc, p) => {
    if (!p.scheduled_at) return acc;
    const d = new Date(p.scheduled_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, ScheduledPost[]>);
  const calFirstDay = new Date(calendarDate.year, calendarDate.month, 1).getDay();
  const calDaysInMonth = new Date(calendarDate.year, calendarDate.month + 1, 0).getDate();
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < calFirstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= calDaysInMonth; i++) calendarDays.push(i);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);
  const prevMonth = () => setCalendarDate((d) => d.month === 0 ? { year: d.year - 1, month: 11 } : { ...d, month: d.month - 1 });
  const nextMonth = () => setCalendarDate((d) => d.month === 11 ? { year: d.year + 1, month: 0 } : { ...d, month: d.month + 1 });

  const s = (opacity = 1, value = "255,255,255") => `rgba(${value},${opacity})`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-7 w-7 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: clientColor, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: s(0.85) }}>Redes Sociais</h2>
          <p className="text-xs mt-0.5" style={{ color: s(0.35) }}>
            {connectedPlatforms.length === 0
              ? "Conecte as redes deste cliente para publicar e ver métricas"
              : `${connectedPlatforms.length} plataforma${connectedPlatforms.length > 1 ? "s" : ""} conectada${connectedPlatforms.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {connectedPlatforms.length > 0 && (
          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: clientColor, color: "#07080A" }}
          >
            <Plus className="w-4 h-4" /> Novo Post
          </button>
        )}
      </div>

      {/* ── Connections ─────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: s(0.3) }}>Conexões</h3>
        <div className="grid grid-cols-3 gap-4">
          {(["instagram", "facebook", "linkedin"] as const).map((platform) => {
            const cfg = PLATFORM_CFG[platform];
            const conn = connections.find((c) => c.platform === platform);
            const isConnected = conn?.connected ?? false;
            const isConnecting = connecting === platform;
            const isDisconnecting = disconnecting === platform;
            const isLinkedIn = platform === "linkedin";

            return (
              <motion.div
                key={platform}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5"
                style={{
                  background: isConnected ? cfg.bg : "rgba(255,255,255,0.025)",
                  border: `1px solid ${isConnected ? cfg.border : "rgba(255,255,255,0.07)"}`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                      <cfg.Icon className="w-5 h-5" style={{ color: cfg.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: s(0.9) }}>{cfg.name}</div>
                      <div className="text-[10px]" style={{ color: s(0.3) }}>{cfg.desc}</div>
                    </div>
                  </div>
                  {isConnected && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#34D399" }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "#34D399" }} />
                    </span>
                  )}
                </div>

                {isConnected && conn && (
                  <div
                    className="mb-3 px-3 py-2 rounded-lg"
                    style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}20` }}
                  >
                    <div className="text-[11px] font-semibold" style={{ color: cfg.color }}>
                      {conn.account_username ?? conn.account_name}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: s(0.35) }}>
                      {isLinkedIn ? conn.account_name : `${fmtNum(conn.followers_count)} seguidores`}
                    </div>
                  </div>
                )}

                {/* LinkedIn step: optional page URL */}
                {isLinkedIn && !isConnected && linkedinStep === "enter-url" && (
                  <div className="mb-3 space-y-2">
                    <p className="text-[10px]" style={{ color: s(0.4) }}>
                      URL da Página (opcional):
                    </p>
                    <input
                      value={linkedinOrgUrl}
                      onChange={(e) => setLinkedinOrgUrl(e.target.value)}
                      placeholder="linkedin.com/company/sua-empresa"
                      className="w-full rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(10,102,194,0.3)", color: s(0.8) }}
                    />
                    <p className="text-[9px]" style={{ color: s(0.25) }}>Ao publicar, o LinkedIn abrirá para você escolher a Página de Empresa.</p>
                  </div>
                )}

                <div className="space-y-1.5 mb-4">
                  {["Publicar posts", "Agendar conteúdo", "Ver métricas", "Analisar engajamento"].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: isConnected ? "#34D399" : s(0.15) }} />
                      <span className="text-[10px]" style={{ color: isConnected ? s(0.5) : s(0.2) }}>{f}</span>
                    </div>
                  ))}
                </div>

                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(platform)}
                    disabled={isDisconnecting}
                    className="w-full py-2 rounded-xl text-[11px] font-medium transition-all disabled:opacity-50"
                    style={{ background: "rgba(248,113,113,0.06)", color: "#F87171", border: "1px solid rgba(248,113,113,0.15)" }}
                  >
                    {isDisconnecting ? "Desconectando…" : "Desconectar"}
                  </button>
                ) : isLinkedIn ? (
                  linkedinStep === "enter-url" ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setLinkedinStep(null); setLinkedinOrgUrl(""); }}
                        className="flex-1 py-2 rounded-xl text-[11px] font-medium transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", color: s(0.35), border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConnectLinkedIn}
                        className="flex-1 py-2 rounded-xl text-[11px] font-medium transition-all"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                      >
                        Continuar
                      </button>
                    </div>
                  ) : linkedinStep === "oauth" || isConnecting ? (
                    <div className="w-full py-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      <RefreshCw className="w-3 h-3 animate-spin" /> Aguardando…
                    </div>
                  ) : (
                    <button
                      onClick={() => setLinkedinStep("enter-url")}
                      className="w-full py-2 rounded-xl text-[11px] font-medium transition-all"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                    >
                      Conectar LinkedIn
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => handleConnect(platform as "instagram" | "facebook")}
                    disabled={isConnecting}
                    className="w-full py-2 rounded-xl text-[11px] font-medium transition-all disabled:opacity-50"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                  >
                    {isConnecting ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Abrindo…
                      </span>
                    ) : `Conectar ${cfg.name}`}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Metrics ─────────────────────────────────────────── */}
      {connectedPlatforms.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: s(0.3) }}>Métricas da semana</h3>
            <button
              onClick={loadMetrics}
              disabled={metricsLoading}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] transition-all disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.04)", color: s(0.4), border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <RefreshCw className={cn("w-3 h-3", metricsLoading && "animate-spin")} />
              Atualizar
            </button>
          </div>

          {metrics.length === 0 && !metricsLoading && (
            <div
              className="rounded-xl p-5 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <TrendingUp className="w-4 h-4" style={{ color: s(0.2) }} />
              <p className="text-xs" style={{ color: s(0.3) }}>
                Clique em <strong style={{ color: s(0.5) }}>Atualizar</strong> para carregar as métricas das contas conectadas.
              </p>
            </div>
          )}

          {metrics.length > 0 && (
            <div className="space-y-3">
              {metrics.map((m) => {
                const cfg = PLATFORM_CFG[m.platform as keyof typeof PLATFORM_CFG];
                if (!cfg) return null;
                return (
                  <div
                    key={m.platform}
                    className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${cfg.border}` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <cfg.Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                      <span className="text-xs font-medium" style={{ color: cfg.color }}>{m.account_name}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "Seguidores", value: fmtNum(m.followers), Icon: Users },
                        { label: "Alcance",     value: fmtNum(m.reach),     Icon: Wifi },
                        { label: "Impressões",  value: fmtNum(m.impressions), Icon: Eye },
                        { label: "Engajamento", value: fmtNum(m.engagement), Icon: TrendingUp },
                      ].map(({ label, value, Icon }) => (
                        <div key={label} className="text-center">
                          <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: s(0.3) }} />
                          <div className="text-base font-bold" style={{ color: s(0.9) }}>{value}</div>
                          <div className="text-[10px]" style={{ color: s(0.3) }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────── */}
      {posts.length > 0 && (() => {
        const today = new Date().toDateString();
        const stats = [
          { label: "Publicados", value: posts.filter(p => p.status === "published").length, color: "#34D399" },
          { label: "Stories", value: posts.filter(p => p.media_type === "story" && p.status === "published").length, color: "#F472B6" },
          { label: "Agendados", value: posts.filter(p => p.status === "scheduled").length, color: "#FBBF24" },
          { label: "Hoje", value: posts.filter(p => p.scheduled_at && new Date(p.scheduled_at).toDateString() === today).length, color: clientColor },
        ];
        return (
          <div className="grid grid-cols-4 gap-2">
            {stats.map(({ label, value, color }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xl font-bold" style={{ color }}>{value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: s(0.35) }}>{label}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Posts ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: s(0.3) }}>Posts</h3>
          <div className="flex items-center gap-1">
            {/* View toggle */}
            <button onClick={() => setViewMode("list")} className="p-1.5 rounded-lg transition-all" style={viewMode === "list" ? { background: `${clientColor}18`, color: clientColor } : { color: s(0.3) }}><List className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode("calendar")} className="p-1.5 rounded-lg transition-all" style={viewMode === "calendar" ? { background: `${clientColor}18`, color: clientColor } : { color: s(0.3) }}><Calendar className="w-3.5 h-3.5" /></button>
            <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />
            {(["all", "scheduled", "published", "draft"] as const).map((f) => {
              const labels = { all: "Todos", scheduled: "Agendados", published: "Publicados", draft: "Rascunhos" };
              return (
                <button key={f} onClick={() => setPostFilter(f)} className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                  style={postFilter === f ? { background: `${clientColor}18`, color: clientColor, border: `1px solid ${clientColor}30` } : { background: "rgba(255,255,255,0.03)", color: s(0.3), border: "1px solid rgba(255,255,255,0.06)" }}>
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="rounded-xl overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={prevMonth} className="p-1 rounded-lg transition-all hover:bg-white/5" style={{ color: s(0.4) }}><ChevronLeft className="w-4 h-4" /></button>
              <p className="text-sm font-semibold capitalize" style={{ color: s(0.8) }}>
                {new Date(calendarDate.year, calendarDate.month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </p>
              <button onClick={nextMonth} className="p-1 rounded-lg transition-all hover:bg-white/5" style={{ color: s(0.4) }}><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 text-center py-2 px-2">
              {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d) => (
                <div key={d} className="text-[9px] uppercase tracking-wider py-1" style={{ color: s(0.25) }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 p-2">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={i} />;
                const key = `${calendarDate.year}-${String(calendarDate.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayPosts = postsByDate[key] ?? [];
                const now = new Date();
                const isToday = day === now.getDate() && calendarDate.month === now.getMonth() && calendarDate.year === now.getFullYear();
                return (
                  <div key={i} className="rounded-lg p-1 min-h-[44px] flex flex-col items-center gap-0.5 transition-all" style={dayPosts.length > 0 ? { background: "rgba(255,255,255,0.03)", cursor: "pointer" } : {}}>
                    <span className="text-[11px] font-medium w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={isToday ? { background: clientColor, color: "#07080A", fontWeight: 700 } : { color: s(0.5) }}>
                      {day}
                    </span>
                    {dayPosts.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {dayPosts.slice(0, 4).map((p, pi) => (
                          <div key={pi} className="w-1.5 h-1.5 rounded-full" style={{
                            background: p.platforms.includes("instagram") ? "#E1306C" : p.platforms.includes("facebook") ? "#1877F2" : "#0A66C2"
                          }} />
                        ))}
                        {dayPosts.length > 4 && <span className="text-[8px]" style={{ color: s(0.3) }}>+{dayPosts.length - 4}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 px-4 py-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              {[{ color: "#E1306C", label: "Instagram" }, { color: "#1877F2", label: "Facebook" }, { color: "#0A66C2", label: "LinkedIn" }].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-[10px]" style={{ color: s(0.35) }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredPosts.length === 0 ? (
          <div
            className="rounded-xl py-10 flex flex-col items-center gap-2"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}
          >
            <Calendar className="w-7 h-7" style={{ color: s(0.12) }} />
            <p className="text-xs" style={{ color: s(0.25) }}>
              {postFilter === "all" ? "Nenhum post ainda." : `Nenhum post ${STATUS_STYLE[postFilter]?.label.toLowerCase() ?? ""}.`}
            </p>
            {connectedPlatforms.length > 0 && (
              <button
                onClick={() => setShowComposer(true)}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium"
                style={{ background: `${clientColor}14`, color: clientColor, border: `1px solid ${clientColor}25` }}
              >
                <Plus className="w-3 h-3" /> Criar primeiro post
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPosts.map((post) => {
              const style = STATUS_STYLE[post.status] ?? STATUS_STYLE.draft;
              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-4 rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {post.media_url ? (
                    <div
                      className="w-12 h-12 rounded-lg flex-shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${post.media_url})` }}
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      <ImageIcon className="w-5 h-5" style={{ color: s(0.2) }} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {post.platforms.map((p) => {
                        const pcfg = PLATFORM_CFG[p as keyof typeof PLATFORM_CFG];
                        if (!pcfg) return null;
                        return (
                          <span
                            key={p}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
                            style={{ background: pcfg.bg, color: pcfg.color, border: `1px solid ${pcfg.border}` }}
                          >
                            <pcfg.Icon className="w-2.5 h-2.5" />
                            {pcfg.name}
                          </span>
                        );
                      })}
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: s(0.6) }}>
                      {post.caption ?? <span style={{ color: s(0.25) }}>Sem legenda</span>}
                    </p>
                    {post.error_message && (
                      <p className="text-[10px] mt-1" style={{ color: "#F87171" }}>{post.error_message}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      {post.scheduled_at && (
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: s(0.3) }}>
                          <Clock className="w-2.5 h-2.5" /> {fmt(post.scheduled_at)}
                        </span>
                      )}
                      {post.published_at && (
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: "#34D399" }}>
                          <CheckCircle2 className="w-2.5 h-2.5" /> {fmt(post.published_at)}
                        </span>
                      )}
                      {!post.scheduled_at && !post.published_at && (
                        <span className="text-[10px]" style={{ color: s(0.25) }}>Criado {fmt(post.created_at)}</span>
                      )}
                    </div>
                  </div>

                  {(post.status === "draft" || post.status === "scheduled" || post.status === "failed") && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deletingId === post.id}
                      className="p-1.5 rounded-lg transition-all flex-shrink-0 disabled:opacity-40"
                      style={{ color: s(0.25) }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#F87171"; e.currentTarget.style.background = "rgba(248,113,113,0.07)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = s(0.25); e.currentTarget.style.background = "transparent"; }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Composer Modal ──────────────────────────────────── */}
      <AnimatePresence>
        {showComposer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowComposer(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              className="w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col"
              style={{ background: "#0D0D1A", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <h2 className="text-sm font-semibold" style={{ color: s(0.9) }}>Novo Post</h2>
                <button onClick={() => setShowComposer(false)} className="p-1 rounded-lg" style={{ color: s(0.4) }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex overflow-hidden flex-1 min-h-0">
              {/* Left: Form */}
              <div className="flex-1 flex flex-col min-h-0" style={{ minWidth: 0 }}>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Platform selector */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: s(0.4) }}>Plataformas</label>
                  <div className="flex gap-2">
                    {connectedPlatforms.map((conn) => {
                      const cfg = PLATFORM_CFG[conn.platform as keyof typeof PLATFORM_CFG];
                      if (!cfg) return null;
                      const selected = composer.platforms.includes(conn.platform);
                      return (
                        <button
                          key={conn.platform}
                          onClick={() => setComposer((p) => ({
                            ...p,
                            platforms: selected
                              ? p.platforms.filter((x) => x !== conn.platform)
                              : [...p.platforms, conn.platform],
                          }))}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                          style={selected
                            ? { background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }
                            : { background: "rgba(255,255,255,0.04)", color: s(0.4), border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                          <cfg.Icon className="w-3.5 h-3.5" />
                          {cfg.name}
                          {selected && <CheckCircle2 className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Post type */}
                <div className="flex gap-2">
                  {(["post", "story"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setComposer((p) => ({ ...p, media_type: t }))}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={composer.media_type === t
                        ? { background: clientColor, color: "#07080A" }
                        : { background: "rgba(255,255,255,0.05)", color: s(0.4), border: "1px solid rgba(255,255,255,0.09)" }}
                    >
                      {t === "post" ? "📝 Post" : "📱 Story"}
                    </button>
                  ))}
                </div>

                {/* Caption — hidden for stories */}
                {composer.media_type === "post" && <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: s(0.4) }}>Legenda</label>
                  <textarea
                    value={composer.caption}
                    onChange={(e) => setComposer((p) => ({ ...p, caption: e.target.value }))}
                    rows={4}
                    placeholder="Escreva a legenda do post…"
                    className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: s(0.8) }}
                  />
                  <p className="text-[10px] mt-1 text-right" style={{ color: s(0.2) }}>{composer.caption.length}/2200</p>
                </div>}

                {/* Media upload */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: s(0.4) }}>Imagem / Vídeo (opcional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                  />
                  {composer.media_url ? (
                    <div className="relative">
                      {localMediaFile?.type.startsWith("video/") ? (
                        <video
                          src={composer.media_url}
                          className="w-full max-h-48 rounded-xl object-cover"
                          controls
                          muted
                        />
                      ) : (
                        <img
                          src={composer.media_url}
                          alt=""
                          className="w-full max-h-48 rounded-xl object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                      <button
                        onClick={() => { setComposer((p) => ({ ...p, media_url: "" })); setLocalMediaFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute top-2 right-2 rounded-full p-1"
                        style={{ background: "rgba(0,0,0,0.6)" }}
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      {composer.media_type === "story" && composer.link_url && (
                        <div
                          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                          style={{ background: "rgba(255,255,255,0.92)", color: "#000", boxShadow: "0 2px 10px rgba(0,0,0,0.35)" }}
                        >
                          <ExternalLink className="w-3 h-3" />
                          {(() => { try { return new URL(composer.link_url).hostname.replace("www.", ""); } catch { return "Ver link"; } })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="w-full py-8 rounded-xl flex flex-col items-center gap-2 transition-all cursor-pointer select-none"
                      style={{
                        background: dragOver ? "rgba(185,255,75,0.06)" : "rgba(255,255,255,0.03)",
                        border: `1px dashed ${dragOver ? clientColor : "rgba(255,255,255,0.12)"}`,
                      }}
                    >
                      {uploading
                        ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: s(0.4) }} />
                        : <Upload className="w-5 h-5" style={{ color: dragOver ? clientColor : s(0.3) }} />}
                      <span className="text-xs font-medium" style={{ color: dragOver ? clientColor : s(0.35) }}>
                        {uploading ? "Enviando…" : dragOver ? "Solte para enviar" : "Arraste ou clique para enviar"}
                      </span>
                      <span className="text-[10px]" style={{ color: s(0.2) }}>JPG, PNG, GIF, WEBP, MP4 — até 50 MB</span>
                    </div>
                  )}
                </div>

                {/* Link URL — only for stories */}
                {composer.media_type === "story" && (
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: s(0.4) }}>Link do Story (opcional)</label>
                    <input
                      value={composer.link_url}
                      onChange={(e) => setComposer((p) => ({ ...p, link_url: e.target.value }))}
                      placeholder="https://seusite.com.br/pagina"
                      className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: s(0.8) }}
                    />
                    <p className="text-[10px] mt-1" style={{ color: s(0.25) }}>Aparece como sticker de link no Story do Instagram.</p>
                  </div>
                )}

                {/* Schedule */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: s(0.4) }}>Publicação</label>
                  <div className="flex gap-2 mb-3">
                    {[{ v: true, label: "Publicar agora" }, { v: false, label: "Agendar" }].map(({ v, label }) => (
                      <button
                        key={label}
                        onClick={() => setComposer((p) => ({ ...p, post_now: v }))}
                        className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                        style={composer.post_now === v
                          ? { background: `${clientColor}18`, color: clientColor, border: `1px solid ${clientColor}30` }
                          : { background: "rgba(255,255,255,0.04)", color: s(0.4), border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {!composer.post_now && (
                    <input
                      type="datetime-local"
                      value={composer.scheduled_at}
                      onChange={(e) => setComposer((p) => ({ ...p, scheduled_at: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: s(0.8), colorScheme: "dark" }}
                    />
                  )}
                </div>
              </div>{/* end scrollable form */}
              {/* Footer */}
              <div className="flex gap-3 px-6 pb-6 pt-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <button onClick={() => setShowComposer(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(255,255,255,0.05)", color: s(0.5), border: "1px solid rgba(255,255,255,0.08)" }}>
                  Cancelar
                </button>
                <button onClick={handleSubmitPost} disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
                  style={{ background: clientColor, color: "#07080A" }}>
                  {submitting
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> {composer.post_now ? "Publicando…" : "Agendando…"}</>
                    : <><Send className="w-4 h-4" /> {composer.post_now ? "Publicar" : "Agendar"}</>}
                </button>
              </div>
              </div>{/* end left col wrapper */}

              {/* Right: Preview */}
              <div className="w-72 flex-shrink-0 flex flex-col overflow-y-auto" style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.2)" }}>
                <div className="p-4 space-y-4 flex-1">
                  {/* Preview type toggle */}
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: s(0.25) }}>Pré-visualização</p>
                    <div className="flex gap-1">
                      {(["feed","story"] as const).map((t) => (
                        <button key={t} onClick={() => setPreviewType(t)}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                          style={previewType === t ? { background: clientColor, color: "#07080A" } : { background: "rgba(255,255,255,0.05)", color: s(0.4) }}>
                          {t === "feed" ? "📱 Feed" : "▯ Story"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Platform info */}
                  {igConn && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
                        <span className="text-white text-[9px] font-bold">{(igConn.account_username ?? igConn.account_name ?? "@")[0].replace("@","").toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold truncate" style={{ color: s(0.8) }}>{igConn.account_username ?? igConn.account_name}</p>
                        <p className="text-[9px]" style={{ color: s(0.35) }}>{igConn.followers_count ? `${fmtNum(igConn.followers_count)} seguidores` : "Instagram"}</p>
                      </div>
                    </div>
                  )}

                  {/* Feed Preview */}
                  {previewType === "feed" && (
                    <div className="rounded-xl overflow-hidden shadow-lg" style={{ background: "#fff" }}>
                      {/* Profile header */}
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f09433,#bc1888)" }}>
                          <span className="text-white text-[10px] font-bold">
                            {(igConn?.account_username ?? igConn?.account_name ?? "@e").replace("@","")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-black truncate">{igConn?.account_username ?? igConn?.account_name ?? "@empresa"}</p>
                          <p className="text-[9px] text-gray-400">Patrocinado</p>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                      {/* Image */}
                      {composer.media_url ? (
                        <img src={composer.media_url} alt="" className="w-full aspect-square object-cover" />
                      ) : (
                        <div className="w-full aspect-square flex flex-col items-center justify-center gap-2" style={{ background: "#f5f5f5" }}>
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                          <p className="text-[10px] text-gray-400">Sem imagem</p>
                        </div>
                      )}
                      {/* Actions */}
                      <div className="px-3 py-2 space-y-1.5">
                        <div className="flex items-center gap-3">
                          <Heart className="w-5 h-5 text-black" />
                          <MessageCircle className="w-5 h-5 text-black" />
                          <Send className="w-5 h-5 text-black" />
                          <Bookmark className="w-5 h-5 text-black ml-auto" />
                        </div>
                        <p className="text-[11px] font-semibold text-black">1.234 curtidas</p>
                        {composer.caption ? (
                          <p className="text-[10px] text-black leading-relaxed">
                            <span className="font-semibold">{igConn?.account_username ?? "@empresa"}</span>{" "}
                            {composer.caption.length > 100 ? composer.caption.slice(0,100) : composer.caption}
                            {composer.caption.length > 100 && <span className="text-gray-400"> … mais</span>}
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-300 italic">Sem legenda</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Story Preview */}
                  {previewType === "story" && (
                    <div className="relative rounded-2xl overflow-hidden mx-auto" style={{ width: 180, height: 320, background: "#111" }}>
                      {composer.media_url ? (
                        <img src={composer.media_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" }} />
                      )}
                      {/* Progress bars */}
                      <div className="absolute top-2 left-2 right-2 flex gap-0.5">
                        {[1,2,3].map((i) => (
                          <div key={i} className="flex-1 h-0.5 rounded-full" style={{ background: i === 1 ? "white" : "rgba(255,255,255,0.35)" }} />
                        ))}
                      </div>
                      {/* Profile */}
                      <div className="absolute top-5 left-2 right-8 flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f09433,#bc1888)" }}>
                          <span className="text-white text-[8px] font-bold">{(igConn?.account_username ?? "@e").replace("@","")[0].toUpperCase()}</span>
                        </div>
                        <span className="text-white text-[9px] font-semibold truncate">{igConn?.account_username ?? "@empresa"}</span>
                        <span className="text-white/50 text-[8px] flex-shrink-0">agora</span>
                      </div>
                      {/* Link sticker */}
                      {composer.link_url && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full whitespace-nowrap" style={{ background: "rgba(255,255,255,0.92)" }}>
                          <ExternalLink className="w-2.5 h-2.5 text-black flex-shrink-0" />
                          <span className="text-[9px] font-semibold text-black">
                            {(() => { try { return new URL(composer.link_url).hostname.replace("www.",""); } catch { return "Ver link"; } })()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scheduled badge */}
                  {!composer.post_now && composer.scheduled_at && (
                    <div className="p-2.5 rounded-xl" style={{ background: `${clientColor}10`, border: `1px solid ${clientColor}25` }}>
                      <p className="text-[10px] font-semibold" style={{ color: clientColor }}>
                        ⏰ {new Date(composer.scheduled_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              </div>{/* end two-col flex */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
