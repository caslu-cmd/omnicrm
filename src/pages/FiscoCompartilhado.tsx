import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Receipt, Lock, Eye, EyeOff, Loader2, ChevronRight, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FiscoTela, { perfilDoTexto, type PerfilId } from "@/components/FiscoTela";

/**
 * Fisco compartilhado — a tela do agente e mais nada.
 *
 * Quem recebe o link não é da agência: não vê barra lateral, não vê CRM.
 *
 * **Cada pessoa tem a própria conta.** A senha do link não é "a senha de todo
 * mundo": ela é o CONVITE, pedido só na hora de criar o acesso. Depois cada um
 * entra com o e-mail e a senha dele, tem os próprios clientes salvos, e a Carol
 * pode revogar um sem derrubar os outros.
 */

const GOLD = "#F59E0B";
const GOLD_DIM = "#F59E0B22";
const GOLD_BORDER = "#F59E0B44";

const ERROS: Record<string, string> = {
  nao_encontrado: "Este link não existe mais ou foi desativado pela agência.",
  convite_invalido: "Código de convite incorreto. Ele vem junto com o link, na mensagem da agência.",
  muitas_tentativas: "Muitas tentativas seguidas. Espere 15 minutos e tente de novo.",
  bloqueado: "Seu acesso a este link foi encerrado pela agência.",
  sem_sessao: "Faça login para continuar.",
};

const campo: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 12,
  background: "#141420", border: "1px solid #2A2A3A",
  color: "#E0E0F0", fontSize: "0.85rem", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};

const rotulo: React.CSSProperties = {
  display: "block", fontSize: "0.62rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.08em",
  color: "#55556A", marginBottom: 5,
};

/** Escolha do público — só no link único, onde ele não vem definido. */
const PUBLICOS: { id: PerfilId; titulo: string; desc: string; exemplos: string }[] = [
  {
    id: "pessoa",
    titulo: "Sou pessoa física",
    desc: "Não tenho empresa, ou tenho dúvida sobre a minha vida pessoal",
    exemplos: "Imposto de Renda, autônomo, INSS, venda de imóvel ou carro",
  },
  {
    id: "empresa",
    titulo: "Tenho uma empresa",
    desc: "Sou dono ou responsável, mas não sou da área contábil",
    exemplos: "Regime tributário, quanto pago por mês, notas, obrigações, pró-labore",
  },
  {
    id: "contabilidade",
    titulo: "Sou da contabilidade",
    desc: "Trabalho na área e quero resposta técnica, com base legal",
    exemplos: "Enquadramento, Fator R, LALUR, retenções, malha, Reforma Tributária",
  },
];

function EscolhaDePublico({ onEscolher }: { onEscolher: (p: PerfilId) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#07080A" }}>
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center gap-3 mb-7">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
            <Receipt className="w-7 h-7" style={{ color: GOLD }} />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold" style={{ color: "#F0F0F0" }}>Fisco</h1>
            <p className="text-sm mt-1" style={{ color: "#77778A" }}>
              Antes de começar: com quem eu estou falando?
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {PUBLICOS.map((p) => (
            <button
              key={p.id}
              onClick={() => onEscolher(p.id)}
              className="text-left px-5 py-4 rounded-2xl transition-all"
              style={{ background: "#0D0D14", border: "1px solid #1E1E2E" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = "#12121A"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1E1E2E"; e.currentTarget.style.background = "#0D0D14"; }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold" style={{ color: "#E0E0F0" }}>{p.titulo}</span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
              </div>
              <p className="text-xs mt-1" style={{ color: "#8888A0" }}>{p.desc}</p>
              <p className="text-[11px] mt-1.5" style={{ color: "#55556A" }}>{p.exemplos}</p>
            </button>
          ))}
        </div>

        <p className="text-[11px] text-center mt-5" style={{ color: "#3A3A50" }}>
          Você pode trocar depois, na coluna da esquerda.
        </p>
      </div>
    </div>
  );
}

export default function FiscoCompartilhado() {
  const { token = "" } = useParams();

  const [temSessao, setTemSessao] = useState<boolean | null>(null);
  const [liberado, setLiberado] = useState(false);
  const [contextNote, setContextNote] = useState<string | null>(null);
  const [quemSou, setQuemSou] = useState<PerfilId | null>(null);

  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [convite, setConvite] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [resetEnviado, setResetEnviado] = useState("");

  /** Confere se esta conta tem acesso a este link (e registra, se for a 1ª vez). */
  const validarAcesso = useCallback(async (codigoConvite?: string) => {
    const { data, error } = await (supabase as any).rpc("registrar_acesso_fisco", {
      p_token: token,
      p_convite: codigoConvite ?? null,
    });
    if (error) { setErro("Não consegui validar seu acesso."); return false; }
    if (data?.erro) {
      // Sem convite na mão, a conta existe mas ainda não tem acesso: pede o código.
      if (data.erro === "convite_invalido" && !codigoConvite) { setModo("criar"); return false; }
      setErro(ERROS[data.erro] ?? "Não consegui liberar o acesso.");
      return false;
    }
    setContextNote(data?.context_note ?? null);
    setLiberado(true);
    return true;
  }, [token]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setTemSessao(true);
        await validarAcesso();
      } else {
        setTemSessao(false);
      }
    })();
  }, [validarAcesso]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setOcupado(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) {
          throw new Error(error.message === "Invalid login credentials"
            ? "E-mail ou senha incorretos."
            : error.message);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password: senha, options: { data: { full_name: nome } },
        });
        if (error) throw new Error(error.message);
        // E-mail que JÁ TEM CONTA: o Supabase não avisa e não manda e-mail
        // nenhum (senão qualquer um descobriria quem tem cadastro) — devolve um
        // usuário de mentira com `identities` vazio. Sem tratar isso, a tela
        // dizia "mandei uma mensagem" para um e-mail que nunca receberia nada.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setModo("entrar");
          setErro("Este e-mail já tem acesso. Entre em \"Já tenho acesso\" — se não lembrar a senha, use \"Esqueci minha senha\".");
          return;
        }
        // Com confirmação de e-mail ligada, o cadastro não devolve sessão:
        // sem avisar, a pessoa fica olhando para um erro de login sem entender.
        if (!data.session) {
          setConfirmar(email);
          return;
        }
      }
      setTemSessao(true);
      await validarAcesso(convite.trim() || undefined);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao entrar.");
    } finally {
      setOcupado(false);
    }
  };

  /**
   * Esqueci minha senha. O link do e-mail leva para `/entrar`, que é a única
   * tela que sabe receber a sessão de recuperação e trocar a senha; depois a
   * pessoa volta para o link do Fisco e entra normalmente.
   */
  const esqueciSenha = async () => {
    if (!email.trim()) { setErro("Digite seu e-mail acima para eu mandar o link."); return; }
    setErro("");
    setOcupado(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/entrar`,
      });
      if (error) throw error;
      setResetEnviado(email.trim());
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não consegui enviar o e-mail.");
    } finally {
      setOcupado(false);
    }
  };

  const sair = async () => {
    await supabase.auth.signOut();
    setTemSessao(false);
    setLiberado(false);
    setErro("");
  };

  if (temSessao === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07080A" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (liberado) {
    const perfilDoLink = perfilDoTexto(contextNote);
    if (perfilDoLink) return <FiscoTela perfilFixo={perfilDoLink} aoSair={sair} />;
    if (!quemSou) return <EscolhaDePublico onEscolher={setQuemSou} />;
    return <FiscoTela perfilInicial={quemSou} aoSair={sair} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#07080A" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-7">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
              <Receipt className="w-8 h-8" style={{ color: GOLD }} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#0D0D14", border: "1px solid #1E1E2E" }}>
              <Lock className="w-2.5 h-2.5" style={{ color: GOLD }} />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold" style={{ color: "#F0F0F0" }}>Fisco</h1>
            <p className="text-sm mt-0.5" style={{ color: "#77778A" }}>
              Consultor contábil e fiscal
            </p>
            <p className="text-[11px] mt-2 leading-relaxed" style={{ color: "#55556A" }}>
              Cada pessoa tem o próprio acesso, com os próprios clientes salvos.
            </p>
          </div>
        </div>

        {confirmar ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: "#0D0D14", border: "1px solid #1E1E2E" }}>
            <p className="text-sm font-bold mb-2" style={{ color: "#E0E0F0" }}>Confirme seu e-mail</p>
            <p className="text-xs leading-relaxed" style={{ color: "#8888A0" }}>
              Mandei uma mensagem para <strong style={{ color: "#C0C0D0" }}>{confirmar}</strong>.
              Abra o link que está nela e depois volte aqui para entrar.
            </p>
            <button
              onClick={() => { setConfirmar(""); setModo("entrar"); setSenha(""); }}
              className="w-full mt-5 py-2.5 rounded-xl text-xs font-bold"
              style={{ background: GOLD, color: "#07080A" }}
            >
              Já confirmei — entrar
            </button>
          </div>
        ) : (
        <div className="rounded-2xl p-6" style={{ background: "#0D0D14", border: "1px solid #1E1E2E" }}>
          <div className="flex gap-1 rounded-xl p-1 mb-5" style={{ background: "#141420" }}>
            {(["entrar", "criar"] as const).map((m) => (
              <button key={m} onClick={() => { setModo(m); setErro(""); }}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: modo === m ? GOLD : "transparent",
                  color: modo === m ? "#07080A" : "#77778A",
                }}>
                {m === "entrar" ? "Já tenho acesso" : "Criar meu acesso"}
              </button>
            ))}
          </div>

          <form onSubmit={enviar} className="flex flex-col gap-3">
            {modo === "criar" && (
              <div>
                <label style={rotulo}>Seu nome</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo" required style={campo} />
              </div>
            )}
            <div>
              <label style={rotulo}>E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" required style={campo} />
            </div>
            <div>
              <label style={rotulo}>Senha</label>
              <div style={{ position: "relative" }}>
                <input type={verSenha ? "text" : "password"} value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  style={{ ...campo, paddingRight: 40 }} />
                <button type="button" onClick={() => setVerSenha((v) => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#55556A", display: "flex" }}>
                  {verSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {modo === "criar" && (
                <p className="text-[10px] mt-1" style={{ color: "#3A3A50" }}>Mínimo de 6 caracteres.</p>
              )}
            </div>

            {modo === "criar" && (
              <div>
                <label style={rotulo}>Código de convite</label>
                <input value={convite} onChange={(e) => setConvite(e.target.value)}
                  placeholder="Veio junto com o link" style={campo} />
                <p className="text-[10px] mt-1" style={{ color: "#3A3A50" }}>
                  Pedido só uma vez, para criar o acesso.
                </p>
              </div>
            )}

            {erro && (
              <p className="text-xs leading-relaxed" style={{ color: "#F87171" }}>{erro}</p>
            )}

            <button type="submit" disabled={ocupado}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: GOLD, color: "#07080A" }}>
              {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : (modo === "entrar" ? "Entrar" : "Criar acesso")}
            </button>

            {modo === "entrar" && (
              resetEnviado ? (
                <p className="text-[11px] text-center leading-relaxed" style={{ color: "#8888A0" }}>
                  Link de nova senha enviado para <strong style={{ color: "#C0C0D0" }}>{resetEnviado}</strong>.
                  Abra o link, defina a senha nova e volte aqui para entrar.
                </p>
              ) : (
                <button type="button" onClick={esqueciSenha} disabled={ocupado}
                  className="w-full py-1 text-[11px] disabled:opacity-40"
                  style={{ background: "transparent", color: "#77778A", textDecoration: "underline" }}>
                  Esqueci minha senha
                </button>
              )
            )}

            {temSessao && !liberado && (
              <button type="button" onClick={sair}
                className="w-full py-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5"
                style={{ background: "transparent", color: "#55556A" }}>
                <LogOut className="w-3 h-3" /> Sair desta conta
              </button>
            )}
          </form>
        </div>
        )}
      </div>
    </div>
  );
}
