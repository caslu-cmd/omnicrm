import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, CheckCircle, TrendingUp, Crown } from "lucide-react";

const EDGE_URL = "https://proldgiyterqhthludlp.supabase.co/functions/v1/accept-invite";

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string; desc: string }> = {
  comercial: { label: "Comercial", icon: TrendingUp, color: "#B9FF4B", desc: "Acesso a leads, contatos e pipeline" },
  financeiro: { label: "Financeiro", icon: Crown,     color: "#FBBF24", desc: "Acesso a dados financeiros e status de pagamento" },
};

interface InviteData {
  id: string;
  member_email: string;
  member_name: string | null;
  role: string;
  client_id: string;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invite, setInvite]   = useState<InviteData | null>(null);
  const [status, setStatus]   = useState<"loading" | "valid" | "invalid" | "done">("loading");
  const [mode, setMode]       = useState<"login" | "register">("register");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    fetch(EDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validate", token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStatus("invalid"); return; }
        setInvite(data);
        setEmail(data.member_email);
        setName(data.member_name ?? "");
        setStatus("valid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleSubmit = async () => {
    if (!invite || saving) return;
    setSaving(true);
    try {
      let userId: string;

      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (error) { toast.error(error.message); setSaving(false); return; }
        userId = data.user!.id;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error(error.message); setSaving(false); return; }
        userId = data.user.id;
      }

      const res = await fetch(EDGE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", token, user_id: userId }),
      });
      const result = await res.json();
      if (result.error) { toast.error(result.error); setSaving(false); return; }

      setStatus("done");
      setTimeout(() => navigate(`/team-portal/${invite.client_id}`), 1800);
    } catch {
      toast.error("Erro inesperado");
      setSaving(false);
    }
  };

  const accent = "#B9FF4B";
  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#F0F0F0",
    outline: "none",
  } as React.CSSProperties;

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#07080A" }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(185,255,75,.15)", borderTopColor: accent, borderRadius: "50%", animation: "spin .75s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (status === "invalid") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#07080A", gap: 12 }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15 }}>Convite inválido ou já utilizado.</p>
      <button onClick={() => navigate("/")} style={{ color: accent, fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
        Voltar ao início
      </button>
    </div>
  );

  if (status === "done") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#07080A", gap: 16 }}>
      <CheckCircle style={{ width: 48, height: 48, color: accent }} />
      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: 600 }}>Acesso ativado!</p>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Redirecionando para o portal...</p>
    </div>
  );

  const roleInfo = ROLE_CONFIG[invite!.role] ?? ROLE_CONFIG.comercial;
  const RoleIcon = roleInfo.icon;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#07080A", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap style={{ width: 20, height: 20, color: "#07080A" }} />
          </div>
          <span style={{ color: "#F0F0F0", fontWeight: 700, fontSize: 16 }}>Calu Agência</span>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Role badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, background: `${roleInfo.color}10`, border: `1px solid ${roleInfo.color}20` }}>
            <RoleIcon style={{ width: 18, height: 18, color: roleInfo.color }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: roleInfo.color }}>{roleInfo.label}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{roleInfo.desc}</div>
            </div>
          </div>

          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.9)", margin: 0 }}>
              Você foi convidado
            </h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
              {mode === "register" ? "Crie sua conta para acessar o portal" : "Entre com sua conta para continuar"}
            </p>
          </div>

          {/* Toggle */}
          <div style={{ display: "flex", gap: 8 }}>
            {(["register", "login"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: mode === m ? `${accent}15` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${mode === m ? accent + "40" : "rgba(255,255,255,0.08)"}`,
                  color: mode === m ? accent : "rgba(255,255,255,0.45)",
                }}>
                {m === "register" ? "Criar conta" : "Já tenho conta"}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                  Nome
                </label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome"
                  style={{ ...inputStyle, width: "100%", padding: "10px 14px", borderRadius: 12, fontSize: 13, boxSizing: "border-box" }} />
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                E-mail
              </label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="seu@email.com"
                style={{ ...inputStyle, width: "100%", padding: "10px 14px", borderRadius: 12, fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                Senha
              </label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••"
                style={{ ...inputStyle, width: "100%", padding: "10px 14px", borderRadius: 12, fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={saving || !email || !password}
            style={{
              padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              background: accent, color: "#07080A", border: "none", opacity: (saving || !email || !password) ? 0.5 : 1,
            }}>
            {saving ? "Aguarde..." : mode === "register" ? "Criar conta e entrar" : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
