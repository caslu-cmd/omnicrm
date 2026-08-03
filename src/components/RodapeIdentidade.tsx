/**
 * Rodapé de identidade das páginas PÚBLICAS que pedem algum dado.
 *
 * Por que existe: em 03/08 o Google classificou o domínio inteiro como
 * "engenharia social" — a categoria de página que "convence o usuário a
 * revelar informações pessoais". Não havia conteúdo enganoso; o que havia
 * eram telas de senha e de formulário sem NENHUM sinal de quem as opera:
 * campo de senha, botão "Entrar", e nada mais. É exatamente o formato que o
 * classificador procura, ainda mais em domínio recém-migrado.
 *
 * O que carrega, e o motivo de cada linha:
 *  - quem opera a página, por extenso, com link para o site oficial;
 *  - política de privacidade, termos e cookies (também é dever de LGPD);
 *  - um e-mail de contato real, que é o que separa página de empresa de
 *    página descartável;
 *  - a promessa negativa ("nunca pedimos senha de banco, cartão ou código"),
 *    que é verdadeira aqui e é o texto que revisor humano procura.
 *
 * Usar em TODA página pública nova que peça qualquer dado.
 */

type Props = {
  /** Fundo da página onde ele será colocado. */
  tom?: "escuro" | "claro";
  /** Uma linha dizendo o que é aquela página, na voz de quem recebe. */
  contexto?: string;
};

const SITE = "https://www.caluagencia.com.br";
const CONTATO = "calu@caluagencia.com.br";

export default function RodapeIdentidade({ tom = "escuro", contexto }: Props) {
  const escuro = tom === "escuro";
  const cor = escuro ? "rgba(255,255,255,0.38)" : "rgba(17,17,17,0.55)";
  const corForte = escuro ? "rgba(255,255,255,0.6)" : "rgba(17,17,17,0.75)";
  const linkStyle: React.CSSProperties = { color: corForte, textDecoration: "underline", textUnderlineOffset: 2 };

  return (
    <footer style={{ marginTop: 22, textAlign: "center", fontSize: 11, lineHeight: 1.6, color: cor }}>
      {contexto ? <p style={{ margin: "0 0 6px" }}>{contexto}</p> : null}
      <p style={{ margin: "0 0 6px" }}>
        Página operada pela{" "}
        <a href={SITE} style={{ ...linkStyle, fontWeight: 700 }} rel="noopener">
          Calu Agência
        </a>{" "}
        — marketing e inteligência artificial para empresas.
      </p>
      <p style={{ margin: "0 0 6px" }}>
        <a href={`${SITE}/privacy`} style={linkStyle} rel="noopener">Privacidade</a>
        {" · "}
        <a href={`${SITE}/terms`} style={linkStyle} rel="noopener">Termos</a>
        {" · "}
        <a href={`${SITE}/cookies`} style={linkStyle} rel="noopener">Cookies</a>
        {" · "}
        <a href={`mailto:${CONTATO}`} style={linkStyle}>{CONTATO}</a>
      </p>
      <p style={{ margin: 0 }}>
        A Calu Agência nunca pede senha de banco, número de cartão ou código de verificação.
      </p>
    </footer>
  );
}
