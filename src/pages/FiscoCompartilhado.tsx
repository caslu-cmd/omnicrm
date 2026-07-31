import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Receipt, Lock, Eye, EyeOff, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import FiscoTela, { perfilDoTexto, type PerfilId } from "@/components/FiscoTela";

/**
 * Fisco compartilhado — a tela do agente e mais nada.
 *
 * Quem recebe o link não é da agência: não vê barra lateral, não vê CRM, não
 * escolhe o perfil (quem define é o link). O acesso é por senha, como o Rico:
 * a senha é conferida no banco pela função `abrir_link_agente`, que guarda só
 * o hash e trava depois de 8 tentativas erradas em 15 minutos.
 */

const GOLD = "#F59E0B";
const GOLD_DIM = "#F59E0B22";
const GOLD_BORDER = "#F59E0B44";

interface Link {
  agent_name: string;
  context_note: string | null;
  client_name: string | null;
}

const ERROS: Record<string, string> = {
  nao_encontrado: "Este link não existe mais ou foi desativado pela agência.",
  senha_incorreta: "Senha incorreta.",
  muitas_tentativas: "Muitas tentativas seguidas. Espere 15 minutos e tente de novo.",
};

/**
 * Link único: antes de abrir a tela, a pessoa diz quem é. Isso muda o que o
 * Fisco assume que ela já sabe e o questionário do diagnóstico — e sem
 * perguntar, o padrão erraria em dois de cada três casos.
 */
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
              className="text-left px-5 py-4 rounded-2xl transition-all group"
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
  const chaveLocal = `fisco-link-${token}`;
  const [quemSou, setQuemSou] = useState<PerfilId | null>(null);

  const [link, setLink] = useState<Link | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");
  const [tremer, setTremer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const abrir = useCallback(async (comSenha: string | null) => {
    const { data, error } = await (supabase as any).rpc("abrir_link_agente", {
      p_token: token,
      p_senha: comSenha,
    });
    if (error) return { erro: "nao_encontrado" };
    return data as Record<string, string>;
  }, [token]);

  // Primeira carga: sem senha salva, tenta abrir direto — links sem senha
  // continuam funcionando, e o resultado diz se precisa pedir senha.
  useEffect(() => {
    (async () => {
      const guardada = sessionStorage.getItem(chaveLocal);
      const r = await abrir(guardada);
      if (!r?.erro) {
        setLink({
          agent_name: r.agent_name ?? "Fisco",
          context_note: r.context_note ?? null,
          client_name: r.client_name ?? null,
        });
      } else if (r.erro === "nao_encontrado") {
        setErro(ERROS.nao_encontrado);
      } else if (guardada) {
        // Senha guardada não vale mais.
        sessionStorage.removeItem(chaveLocal);
      }
      setCarregando(false);
    })();
  }, [abrir, chaveLocal]);

  useEffect(() => { if (!link && !carregando) inputRef.current?.focus(); }, [link, carregando]);

  const entrar = async () => {
    if (!senha.trim() || entrando) return;
    setEntrando(true);
    setErro("");
    const r = await abrir(senha.trim());
    if (r?.erro) {
      setErro(ERROS[r.erro] ?? "Não consegui abrir o link.");
      setTremer(true);
      setSenha("");
      setTimeout(() => setTremer(false), 500);
    } else {
      sessionStorage.setItem(chaveLocal, senha.trim());
      setLink({
        agent_name: r.agent_name ?? "Fisco",
        context_note: r.context_note ?? null,
        client_name: r.client_name ?? null,
      });
    }
    setEntrando(false);
  };

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#07080A" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (link) {
    const perfilDoLink = perfilDoTexto(link.context_note);
    // Link dedicado a um público: entra direto, sem escolha.
    if (perfilDoLink) return <FiscoTela perfilFixo={perfilDoLink} />;
    // Link único: a pessoa diz quem é, e depois pode trocar na barra lateral.
    if (!quemSou) return <EscolhaDePublico onEscolher={setQuemSou} />;
    return <FiscoTela perfilInicial={quemSou} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#07080A" }}>
      <style>{`
        @keyframes tremer {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)}
        }
      `}</style>
      <div
        className={cn("w-full max-w-sm rounded-2xl p-8 space-y-6", tremer && "animate-[tremer_0.4s_ease-in-out]")}
        style={{ background: "#0D0D14", border: "1px solid #1E1E2E" }}
      >
        <div className="flex flex-col items-center gap-3">
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
              Consultor contábil e fiscal · acesso restrito
            </p>
          </div>
        </div>

        {erro === ERROS.nao_encontrado ? (
          <p className="text-center text-sm" style={{ color: "#F87171" }}>{erro}</p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#55556A" }}>
                Senha de acesso
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type={verSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") entrar(); }}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 pr-10 text-sm outline-none"
                  style={{ background: "#141420", border: "1px solid #2A2A3A", color: "#E0E0F0" }}
                />
                <button type="button" onClick={() => setVerSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#55556A" }}>
                  {verSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {erro && <p className="text-xs" style={{ color: "#F87171" }}>{erro}</p>}
            </div>

            <button
              onClick={entrar}
              disabled={!senha.trim() || entrando}
              className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: GOLD, color: "#07080A" }}
            >
              {entrando ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
            </button>

            <p className="text-[11px] text-center leading-relaxed" style={{ color: "#3A3A50" }}>
              A senha foi enviada junto com este link pela Calu Agência.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
