/**
 * Aviso para links de ferramentas descontinuadas.
 *
 * Fisco, Rico (prestação de contas) e Ana (triagem SEFAZ) saíram da Calu —
 * a agência foca em marca. Quem ainda tiver um link antigo (ex.: um
 * `/fisco/:token` compartilhado, ou um bookmark de `/conta-report`) cai aqui,
 * com uma mensagem clara, em vez de um "página não encontrada" seco.
 */
export default function DescontinuadoPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#07080A",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "40px 28px",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(185,255,75,0.1)",
            border: "1px solid rgba(185,255,75,0.25)",
            fontSize: 22,
          }}
        >
          👋
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
          Esta ferramenta foi descontinuada
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: "0 0 24px" }}>
          A Calu Agência agora foca em alavancar a marca dos clientes. Se você
          precisa falar com a gente ou acessar seu portal, é só entrar em
          contato — a equipe te direciona.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: 12,
            background: "#B9FF4B",
            color: "#07080A",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Ir para o início
        </a>
      </div>
    </div>
  );
}
