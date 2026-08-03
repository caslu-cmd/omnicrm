import caluLogo from "@/assets/calu-logo.png";
import RodapeIdentidade from "@/components/RodapeIdentidade";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 10, padding: "12px 14px 12px 42px",
  fontSize: 14, color: "#F0EFE8", outline: "none",
};

const AuthPage = () => {
  const [isLogin, setIsLogin]     = useState(true);
  const [isForgot, setIsForgot]   = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName]           = useState("");
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso! Faça login.");
      setIsRecovery(false);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar senha");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Digite seu e-mail primeiro."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/entrar`,
      });
      if (error) throw error;
      toast.success("Link de redefinição enviado! Verifique seu e-mail.");
      setIsForgot(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar e-mail");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/entrar` },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  const title = isRecovery ? "Criar nova senha" : isForgot ? "Recuperar senha" : isLogin ? "Bem-vinda de volta" : "Criar conta";
  const subtitle = isRecovery ? "Digite sua nova senha abaixo" : isForgot ? "Enviaremos um link para seu e-mail" : isLogin ? "Entre para acessar a plataforma" : "Comece a usar a Calu Agência";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080808", padding: "24px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <img src={caluLogo} alt="Calu Agência" style={{ width: 32, height: 32, borderRadius: 9, objectFit: "cover" }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#F0EFE8", letterSpacing: "-0.02em" }}>Calu Agência</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#F0EFE8", letterSpacing: "-0.04em", marginBottom: 8 }}>{title}</h1>
          <p style={{ fontSize: 14, color: "rgba(240,239,232,.45)", lineHeight: 1.6 }}>{subtitle}</p>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 20, padding: "32px 28px", boxShadow: "0 24px 64px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.06)" }}>

          {/* ── Redefinir senha (vindo do link do e-mail) ── */}
          {isRecovery && (
            <form onSubmit={handleUpdatePassword}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(240,239,232,.5)", marginBottom: 6 }}>Nova senha</label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} color="rgba(240,239,232,.3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres" required minLength={6} style={inputStyle} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: loading ? "rgba(185,255,75,.6)" : "#B9FF4B", color: "#080808", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Salvando..." : "Salvar nova senha"}
                {!loading && <ArrowRight size={15} />}
              </button>
            </form>
          )}

          {/* ── Esqueci minha senha ── */}
          {!isRecovery && isForgot && (
            <form onSubmit={handleForgot}>
              <p style={{ fontSize: 13, color: "rgba(240,239,232,.5)", marginBottom: 20, lineHeight: 1.6 }}>
                Digite seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(240,239,232,.5)", marginBottom: 6 }}>E-mail</label>
                <div style={{ position: "relative" }}>
                  <Mail size={15} color="rgba(240,239,232,.3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" required style={inputStyle} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                style={{ width: "100%", background: loading ? "rgba(185,255,75,.6)" : "#B9FF4B", color: "#080808", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </button>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button onClick={() => setIsForgot(false)} type="button"
                  style={{ fontSize: 13, color: "#B9FF4B", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  ← Voltar ao login
                </button>
              </div>
            </form>
          )}

          {/* ── Login / Cadastro ── */}
          {!isRecovery && !isForgot && (
            <>
              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(240,239,232,.5)", marginBottom: 6 }}>Nome completo</label>
                    <div style={{ position: "relative" }}>
                      <User size={15} color="rgba(240,239,232,.3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" style={inputStyle} />
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(240,239,232,.5)", marginBottom: 6 }}>E-mail</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={15} color="rgba(240,239,232,.3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(240,239,232,.5)", marginBottom: 6 }}>Senha</label>
                  <div style={{ position: "relative" }}>
                    <Lock size={15} color="rgba(240,239,232,.3)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={inputStyle} />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: loading ? "rgba(185,255,75,.6)" : "#B9FF4B", color: "#080808", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 0 24px rgba(185,255,75,.25)", transition: "opacity .2s, box-shadow .2s" }}>
                  {loading ? "Entrando..." : isLogin ? "Entrar" : "Criar conta"}
                  {!loading && <ArrowRight size={15} />}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                {isLogin && (
                  <button onClick={() => setIsForgot(true)} type="button"
                    style={{ fontSize: 12, color: "rgba(240,239,232,.35)", background: "none", border: "none", cursor: "pointer" }}>
                    Esqueci minha senha
                  </button>
                )}
                <button onClick={() => setIsLogin(!isLogin)}
                  style={{ fontSize: 13, color: "rgba(240,239,232,.4)", background: "none", border: "none", cursor: "pointer" }}>
                  {isLogin ? "Não tem conta? " : "Já tem conta? "}
                  <span style={{ color: "#B9FF4B", fontWeight: 600 }}>{isLogin ? "Criar conta" : "Entrar"}</span>
                </button>
              </div>
            </>
          )}
        </div>

        <RodapeIdentidade contexto="Entrada da plataforma que a agência usa para atender os próprios clientes." />
      </div>
    </div>
  );
};

export default AuthPage;
