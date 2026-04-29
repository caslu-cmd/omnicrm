import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(searchParams.get("error_description") ?? "Autorização negada.");
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setMessage("Parâmetros inválidos.");
      return;
    }

    const exchange = async () => {
      try {
        const projectId =
          import.meta.env.VITE_SUPABASE_URL?.replace("https://", "").replace(".supabase.co", "") ?? "";
        const fnUrl = `https://${projectId}.supabase.co/functions/v1/social-media?action=oauth-callback`;
        const session = (await supabase.auth.getSession()).data.session;

        const res = await fetch(fnUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ code, state }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          setStatus("error");
          setMessage(data.error ?? "Erro ao conectar conta.");
          window.opener?.postMessage({ type: "meta-oauth-error", error: data.error }, "*");
          return;
        }

        setStatus("success");
        setMessage(`${data.account_name ?? "Conta"} conectada com sucesso!`);
        window.opener?.postMessage({ type: "meta-oauth-success" }, "*");

        setTimeout(() => window.close(), 2000);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro inesperado.";
        setStatus("error");
        setMessage(msg);
        window.opener?.postMessage({ type: "meta-oauth-error", error: msg }, "*");
      }
    };

    exchange();
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#080810", fontFamily: "system-ui, sans-serif" }}
    >
      <div
        className="rounded-2xl p-8 text-center max-w-sm w-full mx-4"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {status === "loading" && (
          <>
            <div className="mb-4 flex justify-center">
              <div className="h-10 w-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "#B9FF4B", borderTopColor: "transparent" }} />
            </div>
            <p style={{ color: "rgba(255,255,255,0.7)" }} className="text-sm">Conectando conta Meta…</p>
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
            <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>{message}</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
