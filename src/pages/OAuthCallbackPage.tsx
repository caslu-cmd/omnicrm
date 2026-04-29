import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [debugUrl, setDebugUrl] = useState("");

  useEffect(() => {
    setDebugUrl(window.location.href);

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorCode = searchParams.get("error_code");
    const errorMessage = searchParams.get("error_message");

    if (error || errorCode) {
      setStatus("error");
      setMessage(
        searchParams.get("error_description") ??
        errorMessage ??
        "Autorização negada."
      );
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setMessage(`Parâmetros inválidos. code=${code ? "✓" : "null"} state=${state ? "✓" : "null"} | URL: ${window.location.href}`);
      return;
    }

    const exchange = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
        const { data: { session } } = await supabase.auth.getSession();

        const res = await fetch(`${supabaseUrl}/functions/v1/smm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token ?? ""}`,
            "apikey": anonKey,
          },
          body: JSON.stringify({ action: "oauth-callback", code, state }),
        });

        const data = await res.json();

        if (!res.ok || data?.error) {
          const msg = data?.error ?? `HTTP ${res.status}`;
          setStatus("error");
          setMessage(msg);
          window.opener?.postMessage({ type: "meta-oauth-error", error: msg }, "*");
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
            <p className="text-xs mb-4 break-all" style={{ color: "rgba(255,255,255,0.5)" }}>{message}</p>
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
