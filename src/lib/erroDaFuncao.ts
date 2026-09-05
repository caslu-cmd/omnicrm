/**
 * O motivo real de uma edge function ter falhado.
 *
 * Quando a função responde não-2xx, o supabase-js entrega apenas
 * "Edge Function returned a non-2xx status code" — que não diz nada a quem
 * está na tela nem a quem vai depurar. O corpo da resposta, onde está o motivo
 * ("credit balance is too low", "(#200) permissions", "Instagram requer
 * imagem"), fica pendurado em `error.context`, que é a Response original.
 *
 * Isto já custou caro duas vezes no mesmo dia: um erro de saldo da Anthropic e
 * uma falha de conexão da Meta apareceram os dois como a mesma frase genérica.
 *
 * Use em TODO `functions.invoke` que mostre erro para a Carol.
 */
export async function erroDaFuncao(error: unknown, padrao = "Não consegui completar."): Promise<string> {
  const e = error as { message?: string; context?: Response };
  const generica = !e?.message || /non-2xx status code/i.test(e.message);

  const resposta = e?.context;
  if (resposta && typeof resposta === "object") {
    // A Response só pode ser lida uma vez; clonar deixa o chamador livre para
    // inspecionar de novo se quiser.
    try {
      const corpo = await (typeof resposta.clone === "function" ? resposta.clone() : resposta).text();
      if (corpo) {
        try {
          const j = JSON.parse(corpo) as { error?: unknown; message?: unknown };
          const msg = typeof j.error === "string" ? j.error
            : typeof j.message === "string" ? j.message
            : null;
          if (msg) return limpar(msg);
        } catch {
          // Corpo que não é JSON ainda serve: costuma ser o texto do erro.
          return limpar(corpo);
        }
      }
    } catch { /* corpo já consumido ou ilegível — cai no fallback */ }
  }

  if (!generica && e?.message) return limpar(e.message);
  return padrao;
}

/**
 * Deixa legível o que veio do provedor. Erros de API chegam embrulhados em
 * camadas ("Claude 400: {json}") e com quebras de linha do lado deles.
 */
function limpar(msg: string): string {
  let t = msg.trim();
  // Desembrulha um JSON aninhado no meio do texto, que é como Claude e Graph API
  // costumam voltar.
  const abre = t.indexOf("{");
  if (abre >= 0) {
    try {
      const j = JSON.parse(t.slice(abre));
      const interno = j?.error?.message ?? j?.error ?? j?.message;
      if (typeof interno === "string") t = `${t.slice(0, abre).trim()} ${interno}`.trim();
    } catch { /* não era JSON — segue com o texto original */ }
  }
  t = t.replace(/\s+/g, " ").trim();
  return t.length > 400 ? `${t.slice(0, 400)}…` : t;
}
