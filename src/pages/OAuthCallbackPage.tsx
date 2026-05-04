import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const META_REDIRECT_URI = "https://caluagencia.com.br/oauth/meta";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const isLinkedIn = window.location.pathname.includes("/oauth/linkedin");

    const code         = searchParams.get("code");
    const state        = searchParams.get("state");
    const error        = searchParams.get("error");
    const errorCode    = searchParams.get("error_code");
    const errorMessage = searchParams.get("error_message");

    if (error || errorCode) {
      const msg = searchParams.get("error_description") ?? errorMessage ?? "Autorização negada.";
      setStatus("error");
      setMessage(msg);
      window.opener?.postMessage({
        type: isLinkedIn ? "linkedin-oauth-error" : "meta-oauth-error",
        error: msg,
      }, "*");
      return;
    }

    if (!code) {
      const msg = "Código de autorização ausente.";
      setStatus("error");
      setMessage(msg);
      window.opener?.postMessage({
        type: isLinkedIn ? "linkedin-oauth-error" : "meta-oauth-error",
        error: msg,
      }, "*");
      return;
    }

    // If there's an opener (normal popup flow), delegate to it and close
    if (window.opener) {
      window.opener.postMessage({
        type: isLinkedIn ? "linkedin-oauth-exchange" : "meta-oauth-exchange",
        code,
        state: state ?? "",
      }, "*");
      setStatus("success");
      setMessage(isLinkedIn ? "Conectando LinkedIn…" : "Conectando conta Meta…");
      setTimeout(() => window.close(), 3000);
      return;
    }

    // No opener — page opened in a new tab. Complete the exchange directly.
    if (isLinkedIn) {
      setStatus("error");
      setMessage("Abra a conexão LinkedIn pelo workspace do cliente.");
      return;
    }

    (async () => {
      setMessage("Finalizando conexão…");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus("error");
          setMessage("Sessão expirada. Faça login novamente.");
          return;
        }
        const { data, error: fnErr } = await supabase.functions.invoke("smm", {
          body: { action: "oauth-callback", code, state: state ?? "", redirect_uri: META_REDIRECT_URI },
        });
        if (fnErr || data?.error) {
          const msg = data?.error ?? fnErr?.message ?? "Erro ao conectar.";
          setStatus("error");
          setMessage(msg);
          return;
        }
        setStatus("success");
        setMessage("Conta conectada com sucesso! Redirecionando…");
        // Navigate back to the client workspace
        try {
          const b64 = (state ?? "").replace(/-/g, "+").replace(/_/g, "/");
          const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
          const { clientId } = JSON.parse(atob(padded));
          setTimeout(() => { window.location.href = `/agency/clients/${clientId}`; }, 2000);
        } catch {
          setTimeout(() => { window.location.href = "/agency"; }, 2000);
        }
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Erro ao conectar.");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080810", fontFamily: "system-ui, sans-serif" }}>
      <div className="rounded-2xl p-8 text-center max-w-sm w-full mx-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {status === "loading" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#B9FF4B", borderTopColor: "transparent" }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.7)" }} className="text-sm">{message || "Aguardando…"}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mb-4 text-4xl">✅</div>
            <p className="text-base font-semibold mb-1" style={{ color: "#B9FF4B" }}>{message}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Esta janela será fechada automaticamente.</p>
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
