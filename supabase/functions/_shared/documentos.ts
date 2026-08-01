/**
 * Leitura de links de site para os agentes, compartilhada por todas as funções.
 *
 * Antes só a `run-orchestration` sabia abrir uma URL; a `aria-orchestrate` e a
 * `chat-ai` não sabiam. Quando a orquestradora passava a demanda para um agente
 * que dependia do site do cliente, ele não tinha como ler e a fila parava.
 *
 * Duas travas de propósito: prazo por URL e teto de tamanho. Sem elas um site
 * lento prende a função até o limite da plataforma e a orquestração inteira
 * morre esperando.
 */

const PRAZO_MS = 15_000;
const MAX_CHARS = 12_000;
const MAX_URLS = 5;

export interface UrlLida {
  url: string;
  conteudo: string;
  erro?: string;
}

/** Tira script, estilo e marcação; sobra o texto que interessa ao agente. */
export function textoDoHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    // Fecho de bloco vira quebra: sem isso o site chega como uma linha só.
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function lerUrl(url: string): Promise<UrlLida> {
  const controle = new AbortController();
  const t = setTimeout(() => controle.abort(), PRAZO_MS);
  try {
    const alvo = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const r = await fetch(alvo, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CaluAgencia-bot/1.0)",
        "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9",
      },
      redirect: "follow",
      signal: controle.signal,
    });
    if (!r.ok) return { url, conteudo: "", erro: `o site respondeu ${r.status}` };
    const tipo = r.headers.get("content-type") ?? "";
    if (!/text\/|json|xml/i.test(tipo)) {
      return { url, conteudo: "", erro: `o link não é uma página de texto (${tipo || "tipo desconhecido"})` };
    }
    const bruto = await r.text();
    let conteudo = /html/i.test(tipo) ? textoDoHtml(bruto) : bruto.trim();
    if (!conteudo) {
      // Página que só monta o conteúdo por JavaScript devolve casca vazia.
      return { url, conteudo: "", erro: "a página veio vazia (provavelmente o conteúdo só carrega por JavaScript)" };
    }
    if (conteudo.length > MAX_CHARS) conteudo = conteudo.slice(0, MAX_CHARS) + "\n[...página cortada por tamanho]";
    return { url, conteudo };
  } catch (e) {
    const msg = e instanceof Error && e.name === "AbortError"
      ? `o site não respondeu em ${PRAZO_MS / 1000}s`
      : e instanceof Error ? e.message : "falha ao acessar";
    return { url, conteudo: "", erro: msg };
  } finally {
    clearTimeout(t);
  }
}

/** Lê várias em paralelo. Uma falha nunca derruba as outras nem a orquestração. */
export async function lerUrls(urls: unknown): Promise<UrlLida[]> {
  const lista = (Array.isArray(urls) ? urls : [])
    .filter((u): u is string => typeof u === "string" && u.trim().length > 3)
    .slice(0, MAX_URLS);
  if (!lista.length) return [];
  return await Promise.all(lista.map(lerUrl));
}

interface DocEntrada { nome?: string; name?: string; conteudo?: string; content?: string; erro?: string }

/**
 * Monta o bloco de contexto que vai junto do pedido ao agente: documentos que o
 * app já extraiu + páginas lidas aqui. Declara o que falhou, para o agente pedir
 * outro formato em vez de inventar o que não leu.
 */
export function blocoDeContexto(documentos: unknown, urlsLidas: UrlLida[]): string {
  const partes: string[] = [];

  const docs = (Array.isArray(documentos) ? documentos : []) as DocEntrada[];
  const docsOk = docs.filter((d) => (d.conteudo ?? d.content ?? "").trim() && !d.erro);
  const docsFalhos = docs.filter((d) => d.erro || !(d.conteudo ?? d.content ?? "").trim());

  if (docsOk.length) {
    partes.push(
      "DOCUMENTOS ANEXADOS (leia antes de responder):\n\n" +
        docsOk.map((d) => `### ${d.nome ?? d.name ?? "documento"}\n${(d.conteudo ?? d.content ?? "").slice(0, 40_000)}`)
          .join("\n\n---\n\n"),
    );
  }

  const urlsOk = urlsLidas.filter((u) => !u.erro);
  if (urlsOk.length) {
    partes.push(
      "PÁGINAS LIDAS DOS LINKS INFORMADOS:\n\n" +
        urlsOk.map((u) => `### ${u.url}\n${u.conteudo}`).join("\n\n---\n\n"),
    );
  }

  const falhas = [
    ...docsFalhos.map((d) => `- anexo ${d.nome ?? d.name ?? "?"}: ${d.erro ?? "veio vazio"}`),
    ...urlsLidas.filter((u) => u.erro).map((u) => `- link ${u.url}: ${u.erro}`),
  ];
  if (falhas.length) {
    partes.push(
      "NÃO CONSEGUI LER ISTO — diga isso ao usuário e peça outro formato ou o texto colado. NUNCA invente o conteúdo:\n" +
        falhas.join("\n"),
    );
  }

  return partes.length ? `\n\n---\n${partes.join("\n\n")}\n---\n` : "";
}
