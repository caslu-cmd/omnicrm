import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const META_REDIRECT_URI = "https://caluagencia.com.br/oauth/meta";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processando…");

  useEffect(() => {
    const path = window.location.pathname;
    const isLinkedIn = path.includes("/oauth/linkedin");
    const isGoogle   = path.includes("/oauth/google");

    const code         = searchParams.get("code");
    const state        = searchParams.get("state");
    const error        = searchParams.get("error");
    const errorCode    = searchParams.get("error_code");
    const errorMessage = searchParams.get("error_message");

    // Decode platform from state
    let platform = "";
    try {
      const b64 = (state ?? "").replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
      platform = JSON.parse(atob(padded)).platform ?? "";
    } catch { /* ignore */ }

    const isMetaAds  = platform === "meta_ads";
    const isGoogleAds = isGoogle || platform === "google_ads";

    const msgType = isLinkedIn  ? "linkedin-oauth-exchange"
                  : isMetaAds   ? "meta-ads-oauth-exchange"
                  : isGoogleAds ? "google-ads-oauth-exchange"
                  :               "meta-oauth-exchange";

    const errType = isLinkedIn  ? "linkedin-oauth-error"
                  : isMetaAds   ? "meta-ads-oauth-error"
                  : isGoogleAds ? "google-ads-oauth-error"
                  :               "meta-oauth-error";

    if (error || errorCode) {
      const msg = searchParams.get("error_description") ?? errorMessage ?? "Autorização negada.";
      setStatus("error");
      setMessage(msg);
      window.opener?.postMessage({ type: errType, error: msg }, "*");
      return;
    }

    if (!code) {
      const msg = "Código de autorização ausente.";
      setStatus("error");
      setMessage(msg);
      window.opener?.postMessage({ type: errType, error: msg }, "*");
      return;
    }

    // Normal popup flow — delegate to opener and close
    if (window.opener) {
      window.opener.postMessage({ type: msgType, code, state: state ?? "" }, "*");
      setStatus("success");
      setMessage(
        isLinkedIn  ? "Conectando LinkedIn…"   :
        isMetaAds   ? "Conectando Meta Ads…"   :
        isGoogleAds ? "Conectando Google Ads…" :
                      "Conectando conta Meta…"
      );
      setTimeout(() => window.close(), 3000);
      return;
    }

    // No opener (new tab) — store data and redirect back to workspace
    if (!isLinkedIn) {
      const storageKey = isMetaAds   ? "meta-ads-oauth-pending"
                       : isGoogleAds ? "google-ads-oauth-pending"
                       :               "meta-oauth-pending";
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({
          code, state: state ?? "", redirect_uri: META_REDIRECT_URI,
        }));
      } catch { /* ignore */ }

      setStatus("success");
      setMessage("Conectando… redirecionando");

      let redirectTo = "/agency";
      try {
        const b64 = (state ?? "").replace(/-/g, "+").replace(/_/g, "/");
        const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
        const { clientId } = JSON.parse(atob(padded));
        if (clientId) redirectTo = `/agency/clients/${clientId}`;
      } catch { /* use default */ }

      setTimeout(() => { window.location.href = redirectTo; }, 1200);
      return;
    }

    setStatus("error");
    setMessage("Abra a conexão LinkedIn pelo workspace do cliente.");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080810", fontFamily: "system-ui, sans-serif" }}>
      <div className="rounded-2xl p-8 text-center max-w-sm w-full mx-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {status === "loading" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="h-10 w-10 rounded-full border-4 animate-spin" style={{ borderColor: "#B9FF4B", borderTopColor: "transparent" }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.7)" }} className="text-sm">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="h-10 w-10 rounded-full border-4 animate-spin" style={{ borderColor: "#B9FF4B", borderTopColor: "transparent" }} />
            </div>
            <p className="text-base font-semibold mb-1" style={{ color: "#B9FF4B" }}>{message}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Aguarde…</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mb-4 text-4xl">❌</div>
            <p className="text-base font-semibold mb-1" style={{ color: "#F87171" }}>Erro ao conectar</p>
            <p className="text-xs mb-4 break-all" style={{ color: "rgba(255,255,255,0.5)" }}>{message}</p>
            <button onClick={() => window.close()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}>
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
