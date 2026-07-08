import { useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Zap } from "lucide-react";

const SUPABASE_URL = "https://proldgiyterqhthludlp.supabase.co";
const accent = "#B9FF4B";

const FIELDS = [
  { name: "nome",     label: "Seu nome",            type: "text",  required: true  },
  { name: "email",    label: "Seu e-mail",          type: "email", required: false },
  { name: "telefone", label: "WhatsApp / Telefone", type: "tel",   required: false },
  { name: "empresa",  label: "Empresa (opcional)",  type: "text",  required: false },
  { name: "mensagem", label: "Mensagem (opcional)", type: "textarea", required: false },
];

export default function PublicFormPage() {
  const { token } = useParams<{ token: string }>();
  const [values, setValues] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.nome?.trim()) return;
    setSending(true); setError(false);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/webhook-receiver?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, source: "formulario-web" }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "13px 15px",
    border: "1px solid #d9d9e3", borderRadius: 12, fontSize: 15,
    background: "#fff", color: "#111", outline: "none", fontFamily: "inherit",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, background: "linear-gradient(135deg,#0A0A10 0%,#141420 100%)", fontFamily: "system-ui,-apple-system,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: accent, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Zap style={{ width: 20, height: 20, color: "#07080A" }} />
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <CheckCircle2 style={{ width: 52, height: 52, color: "#16a34a", margin: "0 auto 14px" }} />
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: 0 }}>Recebido!</h1>
              <p style={{ fontSize: 14, color: "#666", marginTop: 8 }}>Obrigado pelo contato. Em breve retornaremos. 👋</p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <div style={{ marginBottom: 4 }}>
                <h1 style={{ fontSize: 19, fontWeight: 700, color: "#111", margin: 0 }}>Fale com a gente</h1>
                <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Preencha e retornaremos rapidinho.</p>
              </div>
              {FIELDS.map(f => f.type === "textarea" ? (
                <textarea key={f.name} placeholder={f.label} rows={3} required={f.required}
                  value={values[f.name] ?? ""} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
                  style={{ ...inputStyle, resize: "none" }} />
              ) : (
                <input key={f.name} type={f.type} placeholder={f.label} required={f.required}
                  value={values[f.name] ?? ""} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
                  style={inputStyle} />
              ))}
              {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>Erro ao enviar. Tente novamente.</p>}
              <button type="submit" disabled={sending || !values.nome?.trim()}
                style={{ padding: 14, border: 0, borderRadius: 12, background: accent, color: "#07080A",
                  fontWeight: 700, fontSize: 15, cursor: sending ? "default" : "pointer", opacity: sending ? 0.6 : 1 }}>
                {sending ? "Enviando…" : "Enviar"}
              </button>
            </form>
          )}
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 16 }}>
          powered by Calu Agência
        </p>
      </div>
    </div>
  );
}
