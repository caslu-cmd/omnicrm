import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const SUPABASE_URL = "https://proldgiyterqhthludlp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2xkZ2l5dGVycWh0aGx1ZGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNzQ4NjEsImV4cCI6MjA5Mjg1MDg2MX0.v8xcDbEbbyxv671SYhsWYHs9bbp9J-Q937SknjUiBIE";

export default function PropostaPage() {
  const { slug } = useParams<{ slug: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!slug) return;

    fetch(
      `${SUPABASE_URL}/rest/v1/propostas?slug=eq.${encodeURIComponent(slug)}&select=html_content&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    )
      .then((r) => r.json())
      .then((rows: { html_content: string }[]) => {
        if (!rows || rows.length === 0) setErro(true);
        else setHtml(rows[0].html_content);
      })
      .catch(() => setErro(true));
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
