import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram, Facebook, Linkedin, Plus, Trash2, X,
  CheckCircle2, AlertCircle, Clock, Users, Eye,
  TrendingUp, RefreshCw, ExternalLink, Image as ImageIcon,
  Calendar, Send, Wifi, Upload, Loader2,
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
const META_APP_ID = "1480117656994046";
const META_REDIRECT_URI = "https://omnicrm.lovable.app/oauth/meta";
const META_SCOPE = "pages_show_list,pages_read_engagement,pages_manage_posts,public_profile";

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
    desc: "Página empresarial e conteúdo B2B",
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkedinStep, setLinkedinStep] = useState<null | "enter-url" | "oauth">(null);
  const [linkedinOrgUrl, setLinkedinOrgUrl] = useState("");

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

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.allSettled([loadConnections(), loadPosts()]);
      setLoading(false);
    };
    init();
  }, [clientId]);

  // ── OAuth connect ──────────────────────────────────────────
  const handleConnect = async (platform: "instagram" | "facebook") => {
    setConnecting(platform);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada. Faça login novamente."); return; }

      const state = btoa(JSON.stringify({ userId: session.user.id, clientId, platform, ts: Date.now() }))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      const oauthUrl =
        `https://www.facebook.com/v22.0/dialog/oauth` +
        `?client_id=${META_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(META_REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(META_SCOPE)}` +
        `&state=${encodeURIComponent(state)}` +
        `&response_type=code`;

      const popup = window.open(oauthUrl, "meta-oauth", "width=620,height=720,left=200,top=100");

      const onMessage = async (event: MessageEvent) => {
        if (event.data?.type === "meta-oauth-exchange") {
          window.removeEventListener("message", onMessage);
          clearInterval(timer);
          const { code, state: receivedState } = event.data as { code: string; state: string };
          try {
            const { data, error } = await supabase.functions.invoke("smm", {
              body: { action: "oauth-callback", code, state: receivedState },
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
              toast.success(`${PLATFORM_CFG[platform].name} conectado!`);
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
    const match = linkedinOrgUrl.match(/linkedin\.com\/company\/([^/?#\s]+)/i);
    if (!match) {
      toast.error("URL inválida. Use: linkedin.com/company/nome-da-empresa");
      return;
    }
    const vanityName = match[1].replace(/\/$/, "");
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
          if (connecting === "linkedin") {
            setConnecting(null);
            setLinkedinStep("enter-url");
          }
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
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada."); return; }
      const ext = file.name.split(".").pop();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("post-media").upload(path, file, { upsert: true });
      if (error) { toast.error(`Erro no upload: ${error.message}`); return; }
      const { data: { publicUrl } } = supabase.storage.from("post-media").getPublicUrl(path);
      setComposer((p) => ({ ...p, media_url: publicUrl }));
      toast.success("Imagem enviada!");
    } finally {
      setUploading(false);
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
      const data = await callFn({
        action: "create-post",
        client_id: clientId,
        platforms: composer.platforms,
        caption: composer.media_type === "story" ? null : (composer.caption || null),
        media_url: composer.media_url || null,
        media_type: composer.media_type === "story" ? "story" : (composer.media_url ? "image" : "text"),
        link_url: composer.media_type === "story" ? (composer.link_url || null) : null,
        scheduled_at: composer.post_now ? null : composer.scheduled_at,
      });

      if (data.error) { toast.error(data.error); return; }
      if (data.error_message) toast.warning(`Publicado com aviso: ${data.error_message}`);
      else if (!composer.post_now) toast.success(composer.media_type === "story" ? "Story agendado!" : "Post agendado!");
      else toast.success(composer.media_type === "story" ? "Story publicado!" : "Post publicado!");

      setShowComposer(false);
      setComposer({ platforms: [], caption: "", media_url: "", media_type: "post", link_url: "", post_now: true, scheduled_at: "" });
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

                {/* LinkedIn step: enter org URL */}
                {isLinkedIn && !isConnected && linkedinStep === "enter-url" && (
                  <div className="mb-3 space-y-2">
                    <p className="text-[10px]" style={{ color: s(0.4) }}>
                      Cole a URL da Página de Empresa:
                    </p>
                    <input
                      value={linkedinOrgUrl}
                      onChange={(e) => setLinkedinOrgUrl(e.target.value)}
                      placeholder="linkedin.com/company/sua-empresa"
                      className="w-full rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(10,102,194,0.3)", color: s(0.8) }}
                    />
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
                        disabled={!linkedinOrgUrl.trim()}
                        className="flex-1 py-2 rounded-xl text-[11px] font-medium transition-all disabled:opacity-40"
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

      {/* ── Posts ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: s(0.3) }}>Posts</h3>
          <div className="flex gap-1">
            {(["all", "scheduled", "published", "draft"] as const).map((f) => {
              const labels = { all: "Todos", scheduled: "Agendados", published: "Publicados", draft: "Rascunhos" };
              return (
                <button
                  key={f}
                  onClick={() => setPostFilter(f)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
                  style={postFilter === f
                    ? { background: `${clientColor}18`, color: clientColor, border: `1px solid ${clientColor}30` }
                    : { background: "rgba(255,255,255,0.03)", color: s(0.3), border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>

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
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: "#0D0D1A", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <h2 className="text-sm font-semibold" style={{ color: s(0.9) }}>Novo Post</h2>
                <button onClick={() => setShowComposer(false)} className="p-1 rounded-lg" style={{ color: s(0.4) }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
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
                      <img
                        src={composer.media_url}
                        alt=""
                        className="w-full max-h-48 rounded-xl object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <button
                        onClick={() => { setComposer((p) => ({ ...p, media_url: "" })); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute top-2 right-2 rounded-full p-1"
                        style={{ background: "rgba(0,0,0,0.6)" }}
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-6 rounded-xl flex flex-col items-center gap-2 transition-all"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)" }}
                    >
                      {uploading
                        ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: s(0.4) }} />
                        : <Upload className="w-5 h-5" style={{ color: s(0.3) }} />}
                      <span className="text-xs" style={{ color: s(0.35) }}>
                        {uploading ? "Enviando…" : "Clique para enviar arquivo"}
                      </span>
                      <span className="text-[10px]" style={{ color: s(0.2) }}>JPG, PNG, GIF, WEBP, MP4 — até 50 MB</span>
                    </button>
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
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setShowComposer(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(255,255,255,0.05)", color: s(0.5), border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitPost}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all"
                  style={{ background: clientColor, color: "#07080A" }}
                >
                  {submitting ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> {composer.post_now ? "Publicando…" : "Agendando…"}</>
                  ) : (
                    <><Send className="w-4 h-4" /> {composer.post_now ? "Publicar" : "Agendar"}</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
