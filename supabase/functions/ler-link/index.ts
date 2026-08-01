/**
 * Lê uma página e devolve o texto, para o link virar material do projeto.
 *
 * Existe porque o navegador não consegue: buscar site de terceiro no front
 * esbarra em CORS. E o texto é gravado no projeto no momento em que o link é
 * adicionado, de propósito — assim o agente lê o que a Carol viu, o site pode
 * cair depois, e nenhuma conversa paga o custo de rebuscar a página.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { lerUrl } from "../_shared/documentos.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { url } = await req.json();
    if (typeof url !== "string" || url.trim().length < 4) {
      return new Response(JSON.stringify({ error: "url obrigatória" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const lida = await lerUrl(url.trim());

    // Título da página ajuda a Carol a reconhecer o link na lista do projeto;
    // "https://sitedocliente.com.br/servicos/2024/x" não diz nada de relance.
    let titulo = "";
    if (!lida.erro) {
      const primeira = lida.conteudo.split("\n").map((l) => l.trim()).find((l) => l.length > 3);
      titulo = (primeira ?? "").slice(0, 80);
    }

    return new Response(JSON.stringify({ ...lida, titulo }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "falha ao ler o link" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
