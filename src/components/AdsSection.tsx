import { useState, useEffect, useCallback, useRef } from "react";
import {
  TrendingUp, DollarSign, MousePointer, Eye, Target,
  RefreshCw, Power, Pause, Play, AlertCircle, Loader2,
  ChevronDown, ChevronUp, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────────
interface MetaAdsMetrics {
  connected: boolean;
  account_name?: string;
  account_id?: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpm?: number;
  cpc?: number;
  reach?: number;
  roas?: number;
  error?: string;
}

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

const DATE_PRESETS = [
  { label: "7 dias",  value: "last_7d" },
  { label: "30 dias", value: "last_30d" },
  { label: "90 dias", value: "last_90d" },
];

// ── Component ──────────────────────────────────────────────────
export default function AdsSection({
  clientId,
  clientColor = "#B9FF4B",
}: {
  clientId: string;
  clientColor?: string;
}) {
  const [datePreset, setDatePreset] = useState("last_30d");
  const [metaMetrics, setMetaMetrics] = useState<MetaAdsMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [googleConn, setGoogleConn] = useState<boolean>(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [connectingMeta, setConnectingMeta] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showCampaigns, setShowCampaigns] = useState(true);
  const pendingStateRef = useRef("");

  const s = (o: number) => `rgba(255,255,255,${o})`;

  // ── Load Meta Ads metrics ──────────────────────────────────
  const loadMetaMetrics = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const data = await callFn({ action: "ads-metrics", client_id: clientId, date_preset: datePreset });
      setMetaMetrics(data);
    } catch (e: any) {
      setMetaMetrics({ connected: false });
    } finally {
      setLoadingMeta(false);
    }
  }, [clientId, datePreset]);

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const data = await callFn({ action: "ads-campaigns", client_id: clientId, date_preset: datePreset });
      setCampaigns(data.campaigns ?? []);
    } catch { /* ignore */ }
    finally { setLoadingCampaigns(false); }
  }, [clientId, datePreset]);

  // ── Check Google Ads connection ───────────────────────────
  const checkGoogleConn = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await (supabase as any)
      .from("social_connections")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("client_id", clientId)
      .eq("platform", "google_ads")
      .eq("connected", true)
      .maybeSingle();
    setGoogleConn(!!data);
  }, [clientId]);

  useEffect(() => {
    loadMetaMetrics();
    checkGoogleConn();
  }, [loadMetaMetrics, checkGoogleConn]);

  useEffect(() => {
    if (metaMetrics?.connected) loadCampaigns();
  }, [metaMetrics?.connected, loadCampaigns]);

  // ── Meta Ads OAuth popup ───────────────────────────────────
  const connectMetaAds = async () => {
    setConnectingMeta(true);
    try {
      const data = await callFn({ action: "ads-oauth-url", client_id: clientId });
      const popup = window.open(data.url, "meta-ads-oauth", "width=600,height=700,popup=1");

      const cleanup = (ti: ReturnType<typeof setTimeout>, si: ReturnType<typeof setInterval>) => {
        clearTimeout(ti);
        clearInterval(si);
        window.removeEventListener("message", handler);
      };

      // Timeout: reset after 2 minutes if nothing arrives
      const timeoutId = setTimeout(() => {
        cleanup(timeoutId, storageId);
        setConnectingMeta(false);
        toast.error("Tempo esgotado. Tente conectar novamente.");
      }, 120_000);

      // storageId declared below; forward-referenced via closure — hoisted with let
      let storageId: ReturnType<typeof setInterval>;

      const handler = async (e: MessageEvent) => {
        const isAds = e.data?.type === "meta-ads-oauth-exchange";
        // fallback: OAuthCallbackPage may send "meta-oauth-exchange" if state decode fails
        const isFallback = e.data?.type === "meta-oauth-exchange" && (() => {
          try {
            const b64 = (e.data.state ?? "").replace(/-/g, "+").replace(/_/g, "/");
            const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
            return JSON.parse(atob(padded)).platform === "meta_ads";
          } catch { return false; }
        })();

        if (isAds || isFallback) {
          cleanup(timeoutId, storageId);
          const { code, state } = e.data;
          try {
            const res = await callFn({
              action: "oauth-callback",
              code, state,
              redirect_uri: "https://caluagencia.com.br/oauth/meta",
            });
            if (res.success) {
              toast.success(`Meta Ads conectado: ${res.account_name}`);
              loadMetaMetrics();
            }
          } catch (err: any) {
            toast.error(err.message ?? "Erro ao conectar Meta Ads");
          } finally {
            setConnectingMeta(false);
            popup?.close();
          }
        }
        if (e.data?.type === "meta-ads-oauth-error") {
          cleanup(timeoutId, storageId);
          toast.error(e.data.error ?? "Erro ao conectar");
          setConnectingMeta(false);
        }
      };
      window.addEventListener("message", handler);

      // sessionStorage fallback (new-tab flow)
      storageId = setInterval(() => {
        const pending = sessionStorage.getItem("meta-ads-oauth-pending");
        if (pending) {
          sessionStorage.removeItem("meta-ads-oauth-pending");
          cleanup(timeoutId, storageId);
          const { code, state, redirect_uri } = JSON.parse(pending);
          callFn({ action: "oauth-callback", code, state, redirect_uri })
            .then((res) => {
              if (res.success) { toast.success(`Meta Ads conectado: ${res.account_name}`); loadMetaMetrics(); }
            })
            .catch((e) => toast.error(e.message))
            .finally(() => setConnectingMeta(false));
        }
      }, 800);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao iniciar conexão");
      setConnectingMeta(false);
    }
  };

  // ── Google Ads OAuth popup ────────────────────────────────
  const connectGoogleAds = async () => {
    setConnectingGoogle(true);
    try {
      const data = await callFn({ action: "google-ads-oauth-url", client_id: clientId });
      const popup = window.open(data.url, "google-ads-oauth", "width=600,height=700,popup=1");

      const handler = async (e: MessageEvent) => {
        if (e.data?.type === "google-ads-oauth-exchange") {
          window.removeEventListener("message", handler);
          const { code, state } = e.data;
          try {
            const res = await callFn({ action: "google-ads-callback", code, state });
            if (res.success) { toast.success("Google Ads conectado!"); setGoogleConn(true); }
          } catch (err: any) {
            toast.error(err.message ?? "Erro ao conectar Google Ads");
          } finally {
            setConnectingGoogle(false);
            popup?.close();
          }
        }
        if (e.data?.type === "google-ads-oauth-error") {
          window.removeEventListener("message", handler);
          toast.error(e.data.error ?? "Erro ao conectar");
          setConnectingGoogle(false);
        }
      };
      window.addEventListener("message", handler);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao iniciar conexão");
      setConnectingGoogle(false);
    }
  };

  // ── Toggle campaign ────────────────────────────────────────
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

  const metricCard = (label: string, value: string, icon: React.ReactNode) => (
    <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span style={{ color: s(0.35) }}>{icon}</span>
        <span className="text-[10px] font-medium" style={{ color: s(0.4) }}>{label}</span>
      </div>
      <div className="text-sm font-bold" style={{ color: s(0.9) }}>{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: s(0.9) }}>Anúncios</h3>
          <p className="text-[11px] mt-0.5" style={{ color: s(0.35) }}>Meta Ads · Google Ads · LinkedIn Ads</p>
        </div>
        {/* Date preset */}
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDatePreset(p.value)}
              className="px-2.5 py-1 rounded-md text-[10px] font-medium transition-all"
              style={{
                background: datePreset === p.value ? clientColor : "transparent",
                color: datePreset === p.value ? "#000" : s(0.45),
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Meta Ads ─────────────────────────────────────── */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(24,119,242,0.15)" }}>
              <BarChart2 className="w-4 h-4" style={{ color: "#1877F2" }} />
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: s(0.9) }}>Meta Ads</div>
              <div className="text-[10px]" style={{ color: s(0.35) }}>
                {metaMetrics?.connected ? metaMetrics.account_name ?? "Conectado" : "Facebook & Instagram Ads"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {metaMetrics?.connected && (
              <button
                onClick={loadMetaMetrics}
                disabled={loadingMeta}
                className="p-1.5 rounded-lg transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loadingMeta && "animate-spin")} style={{ color: s(0.4) }} />
              </button>
            )}
            <button
              onClick={connectMetaAds}
              disabled={connectingMeta || loadingMeta}
              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all"
              style={{
                background: metaMetrics?.connected ? "rgba(255,255,255,0.06)" : clientColor,
                color: metaMetrics?.connected ? s(0.6) : "#000",
                border: metaMetrics?.connected ? "1px solid rgba(255,255,255,0.1)" : "none",
              }}
            >
              {connectingMeta ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              {metaMetrics?.connected ? "Reconectar" : "Conectar"}
            </button>
          </div>
        </div>

        {loadingMeta && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: clientColor }} />
          </div>
        )}

        {!loadingMeta && metaMetrics?.connected && !metaMetrics.error && (
          <>
            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {metricCard("Gasto", fmtMoney(metaMetrics.spend ?? 0), <DollarSign className="w-3 h-3" />)}
              {metricCard("Impressões", fmtNum(metaMetrics.impressions ?? 0), <Eye className="w-3 h-3" />)}
              {metricCard("Cliques", fmtNum(metaMetrics.clicks ?? 0), <MousePointer className="w-3 h-3" />)}
              {metricCard("CTR", `${(metaMetrics.ctr ?? 0).toFixed(2)}%`, <TrendingUp className="w-3 h-3" />)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {metricCard("CPM", fmtMoney(metaMetrics.cpm ?? 0), <BarChart2 className="w-3 h-3" />)}
              {metricCard("CPC", fmtMoney(metaMetrics.cpc ?? 0), <Target className="w-3 h-3" />)}
              {metricCard("Alcance", fmtNum(metaMetrics.reach ?? 0), <Eye className="w-3 h-3" />)}
              {metricCard("ROAS", `${(metaMetrics.roas ?? 0).toFixed(2)}x`, <TrendingUp className="w-3 h-3" />)}
            </div>

            {/* Campaigns */}
            <div>
              <button
                onClick={() => { setShowCampaigns(!showCampaigns); if (!showCampaigns) loadCampaigns(); }}
                className="flex items-center gap-2 w-full text-left mb-3"
              >
                <span className="text-xs font-semibold" style={{ color: s(0.7) }}>Campanhas</span>
                {showCampaigns ? <ChevronUp className="w-3.5 h-3.5" style={{ color: s(0.4) }} /> : <ChevronDown className="w-3.5 h-3.5" style={{ color: s(0.4) }} />}
                {loadingCampaigns && <Loader2 className="w-3 h-3 animate-spin ml-1" style={{ color: s(0.4) }} />}
              </button>

              {showCampaigns && !loadingCampaigns && campaigns.length === 0 && (
                <p className="text-[11px]" style={{ color: s(0.3) }}>Nenhuma campanha encontrada no período.</p>
              )}

              {showCampaigns && campaigns.length > 0 && (
                <div className="space-y-1.5">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr,auto,auto,auto,auto,auto] gap-3 px-2 pb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Campanha", "Gasto", "Impressões", "Cliques", "CTR", ""].map((h) => (
                      <span key={h} className="text-[9px] font-semibold uppercase" style={{ color: s(0.3) }}>{h}</span>
                    ))}
                  </div>
                  {campaigns.map((c) => (
                    <div
                      key={c.id}
                      className="grid grid-cols-[1fr,auto,auto,auto,auto,auto] gap-3 items-center px-2 py-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.025)" }}
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium truncate" style={{ color: s(0.85) }}>{c.name}</div>
                        <div className="text-[9px] mt-0.5" style={{ color: s(0.3) }}>{c.objective}</div>
                      </div>
                      <span className="text-[11px] font-medium tabular-nums" style={{ color: s(0.7) }}>{fmtMoney(c.spend)}</span>
                      <span className="text-[11px] tabular-nums" style={{ color: s(0.6) }}>{fmtNum(c.impressions)}</span>
                      <span className="text-[11px] tabular-nums" style={{ color: s(0.6) }}>{fmtNum(c.clicks)}</span>
                      <span className="text-[11px] tabular-nums" style={{ color: s(0.6) }}>{c.ctr.toFixed(2)}%</span>
                      <button
                        onClick={() => toggleCampaign(c)}
                        disabled={!!togglingId || c.status === "ARCHIVED" || c.status === "DELETED"}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                        style={{
                          background: c.status === "ACTIVE"
                            ? "rgba(52,211,153,0.1)"
                            : c.status === "PAUSED"
                            ? "rgba(251,191,36,0.1)"
                            : "rgba(255,255,255,0.05)",
                          color: c.status === "ACTIVE" ? "#34D399"
                               : c.status === "PAUSED" ? "#FBBF24"
                               : s(0.3),
                        }}
                      >
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
            </div>
          </>
        )}

        {!loadingMeta && metaMetrics?.connected && metaMetrics.error && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#F87171" }} />
            <p className="text-[11px]" style={{ color: "#F87171" }}>{metaMetrics.error}</p>
          </div>
        )}

        {!loadingMeta && !metaMetrics?.connected && (
          <p className="text-[11px]" style={{ color: s(0.35) }}>
            Conecte sua conta Meta Ads para ver métricas de campanhas Facebook & Instagram diretamente aqui.
          </p>
        )}
      </div>

      {/* ── Google Ads ────────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(234,67,53,0.12)" }}>
              <Target className="w-4 h-4" style={{ color: "#EA4335" }} />
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: s(0.9) }}>Google Ads</div>
              <div className="text-[10px]" style={{ color: googleConn ? "#34D399" : s(0.35) }}>
                {googleConn ? "Conectado" : "Search, Display & YouTube"}
              </div>
            </div>
          </div>
          <button
            onClick={connectGoogleAds}
            disabled={connectingGoogle}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all"
            style={{
              background: googleConn ? "rgba(255,255,255,0.06)" : clientColor,
              color: googleConn ? s(0.6) : "#000",
              border: googleConn ? "1px solid rgba(255,255,255,0.1)" : "none",
            }}
          >
            {connectingGoogle ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {googleConn ? "Reconectar" : "Conectar"}
          </button>
        </div>
        {!googleConn && (
          <p className="text-[11px] mt-3" style={{ color: s(0.3) }}>
            Requer Google Ads configurado nas variáveis de ambiente do Supabase (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_ADS_DEVELOPER_TOKEN).
          </p>
        )}
        {googleConn && (
          <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-[11px]" style={{ color: s(0.4) }}>
              Para ver métricas, configure GOOGLE_ADS_DEVELOPER_TOKEN nas variáveis de ambiente do Supabase e informe o Customer ID.
            </p>
          </div>
        )}
      </div>

      {/* ── LinkedIn Ads ──────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(10,102,194,0.15)" }}>
            <TrendingUp className="w-4 h-4" style={{ color: "#0A66C2" }} />
          </div>
          <div>
            <div className="text-xs font-semibold" style={{ color: s(0.9) }}>LinkedIn Ads</div>
            <div className="text-[10px]" style={{ color: s(0.35) }}>Em breve — requer aprovação de escopo r_ads no LinkedIn</div>
          </div>
        </div>
      </div>
    </div>
  );
}
