import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function PropostaPage() {
  const { slug } = useParams<{ slug: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("propostas")
      .select("html_content")
      .eq("slug", slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setErro(true);
        else setHtml(data.html_content);
      });
  }, [slug]);

  if (erro) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#111", color: "#fff", fontFamily: "sans-serif", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 48 }}>404</div>
      <div style={{ color: "#888" }}>Proposta não encontrada.</div>
    </div>
  );

  if (!html) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(185,255,75,.15)", borderTopColor: "#B9FF4B", borderRadius: "50%", animation: "sp .75s linear infinite" }} />
    </div>
  );

  return (
    <iframe
      srcDoc={html}
      style={{ width: "100%", height: "100vh", border: "none", display: "block" }}
      title="Proposta"
    />
  );
}
