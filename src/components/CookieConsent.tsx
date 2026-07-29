import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";
import { lerConsentimento, salvarConsentimento } from "@/lib/consent";

/**
 * Banner de consentimento (LGPD art. 8º): a escolha precisa ser livre,
 * informada e inequívoca — por isso "Só essenciais" tem o mesmo destaque de
 * "Aceitar tudo", e fechar no X não é tratado como aceite.
 */
export default function CookieConsent() {
  const [visivel, setVisivel] = useState(false);
  const [detalhes, setDetalhes] = useState(false);
  const [preferencias, setPreferencias] = useState(true);
  const [analise, setAnalise] = useState(false);

  useEffect(() => {
    if (!lerConsentimento()) setVisivel(true);
    const aoRevogar = () => setVisivel(!lerConsentimento());
    window.addEventListener("calu-consentimento", aoRevogar);
    return () => window.removeEventListener("calu-consentimento", aoRevogar);
  }, []);

  if (!visivel) return null;

  const decidir = (escolha: { preferencias: boolean; analise: boolean }) => {
    salvarConsentimento(escolha);
    setVisivel(false);
  };

  const botaoAceitar = (
    <button
      onClick={() => decidir({ preferencias: true, analise: true })}
      className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all"
      style={{ background: "#B9FF4B", color: "#07080A" }}
    >
      Aceitar
    </button>
  );

  const botaoEssenciais = (
    <button
      onClick={() => decidir({ preferencias: false, analise: false })}
      className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all"
      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}
    >
      Só essenciais
    </button>
  );

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[100] p-2 sm:p-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className={`mx-auto w-full ${detalhes ? "max-w-3xl rounded-2xl p-4" : "max-w-4xl rounded-xl px-3 py-2.5"} shadow-2xl`}
        style={{
          pointerEvents: "auto",
          background: "rgba(10,10,16,0.98)",
          border: "1px solid rgba(185,255,75,0.25)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Barra compacta — o padrão. Não cobre o conteúdo da página. */}
        {!detalhes && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <Cookie className="w-4 h-4 shrink-0 mt-px" style={{ color: "#B9FF4B" }} />
              <p className="min-w-0 text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.62)" }}>
                Cookies essenciais e, com sua permissão, de preferências. Sem rastreadores de publicidade.{" "}
                <Link to="/cookies" className="underline" style={{ color: "#B9FF4B" }}>Saiba mais</Link>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {botaoEssenciais}
              {botaoAceitar}
              <button
                onClick={() => setDetalhes(true)}
                className="text-[11px] underline whitespace-nowrap"
                style={{ color: "rgba(255,255,255,0.42)" }}
              >
                Escolher
              </button>
            </div>
          </div>
        )}

        {/* Painel detalhado — só quando a pessoa pede para escolher. */}
        {detalhes && (
          <div className="flex items-start gap-3">
            <Cookie className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#B9FF4B" }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.92)" }}>
                Este site usa cookies
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Usamos armazenamento essencial para manter você conectada e, com a sua permissão,
                preferências para lembrar ajustes das telas. Não usamos rastreadores de publicidade.
                Veja a{" "}
                <Link to="/cookies" className="underline" style={{ color: "#B9FF4B" }}>Política de Cookies</Link>
                {" "}e a{" "}
                <Link to="/privacy" className="underline" style={{ color: "#B9FF4B" }}>Política de Privacidade</Link>.
              </p>

              <div className="mt-3 space-y-2">
                <Categoria
                  titulo="Essenciais"
                  desc="Sessão de login e segurança. Sem eles a plataforma não funciona."
                  marcado
                  travado
                />
                <Categoria
                  titulo="Preferências"
                  desc="Lembram ajustes seus: cores do cliente, painéis abertos, rascunhos."
                  marcado={preferencias}
                  onChange={setPreferencias}
                />
                <Categoria
                  titulo="Análise de uso"
                  desc="Métricas anônimas de navegação. Hoje não há nenhuma ferramenta ativa."
                  marcado={analise}
                  onChange={setAnalise}
                />
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {botaoAceitar}
                {botaoEssenciais}
                <button
                  onClick={() => decidir({ preferencias, analise })}
                  className="px-3.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={{ background: "transparent", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  Salvar escolha
                </button>
              </div>
            </div>

            {/* Volta para a barra fina — fechar aqui não vale como aceite. */}
            <button
              onClick={() => setDetalhes(false)}
              aria-label="Voltar ao aviso resumido"
              className="shrink-0 p-1 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Categoria({
  titulo, desc, marcado, travado, onChange,
}: {
  titulo: string; desc: string; marcado: boolean; travado?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label
      className="flex items-start gap-3 rounded-xl p-2.5 cursor-pointer"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <input
        type="checkbox"
        checked={marcado}
        disabled={travado}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 accent-[#B9FF4B]"
      />
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
          {titulo} {travado && <span style={{ color: "rgba(255,255,255,0.3)" }}>(sempre ativo)</span>}
        </span>
        <span className="block text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{desc}</span>
      </span>
    </label>
  );
}
