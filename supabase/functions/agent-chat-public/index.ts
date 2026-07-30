import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/**
 * Conversa dos links de agente compartilhado (`/conversar/:token`).
 *
 * Este arquivo existia no disco desde maio e NUNCA FOI PUBLICADO: a tela
 * `SharedAgentChatPage` chama `agent-chat-public` e levava 404 em toda
 * mensagem — o link abria, a pessoa criava conta e nada respondia.
 * Compartilhar agente nunca funcionou de verdade.
 *
 * O que mudou além de publicar:
 *  - a sessão é CONFERIDA aqui (a tela já pedia login, mas o portão era só
 *    visual: com o token na mão qualquer um gastava a conta da Carol);
 *  - teto de mensagens por pessoa por link;
 *  - agente que tem função própria (o Fisco tem a dele, com a persona contábil
 *    e o conhecimento de Fortaleza) é CHAMADO, em vez de recriado a partir de
 *    uma cópia do prompt que envelhece sozinha.
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

interface Msg {
  role: "user" | "assistant";
  content: string;
}

/**
 * Agentes com edge function própria: o link usa o agente de verdade.
 * O `contexto` vem do `context_note` do link — é assim que um link do Fisco
 * criado para uma empresa de contabilidade já chega no perfil certo, sem quem
 * abriu ter que dizer quem é.
 */
const FUNCAO_PROPRIA: Record<
  string,
  (msgs: Msg[], contexto: string) => Record<string, unknown>
> = {
  fisco: (msgs, contexto) => ({
    mensagem: msgs[msgs.length - 1]?.content ?? "",
    historico: msgs.slice(0, -1),
    perfil: /contabil/i.test(contexto)
      ? "contabilidade"
      : /empresa|cnpj|pj/i.test(contexto)
      ? "empresa"
      : /pessoa|física|fisica|pf/i.test(contexto)
      ? "pessoa"
      : "geral",
  }),
};

/** Teto de mensagens por pessoa por link (a coluna conta pergunta + resposta). */
const TETO_TROCAS = 200;

/** Junta um stream SSE `{tipo:"texto", conteudo}` num texto só. */
async function juntarStream(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let texto = "";
  let erro = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const linhas = buffer.split("\n");
    buffer = linhas.pop() ?? "";
    for (const linha of linhas) {
      const l = linha.trim();
      if (!l.startsWith("data:")) continue;
      try {
        const evt = JSON.parse(l.slice(5).trim());
        if (evt.tipo === "texto" && typeof evt.conteudo === "string") texto += evt.conteudo;
        if (evt.tipo === "erro") erro = String(evt.mensagem ?? "erro no agente");
      } catch {
        // linha partida entre chunks: o buffer pega na próxima volta
      }
    }
  }

  if (!texto && erro) throw new Error(erro);
  return texto.trim();
}

async function responderComClaude(
  apiKey: string,
  systemPrompt: string,
  messages: Msg[],
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-opus-5",
      // No Opus 5 o pensamento cabe DENTRO do max_tokens, então sobra folga de
      // propósito; effort baixo porque isto é conversa, não análise longa.
      max_tokens: 8000,
      output_config: { effort: "low" },
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const data = await res.json();
  if (data.stop_reason === "refusal") {
    return "Não consigo responder isso. Pode reformular?";
  }
  return (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) return json({ error: "ANTHROPIC_API_KEY não configurada." }, 500);

    const { token, messages } = await req.json();
    if (!token || !Array.isArray(messages) || !messages.length) {
      return json({ error: "token e messages são obrigatórios" }, 400);
    }

    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!jwt) return json({ error: "Faça login para conversar com o agente." }, 401);

    const sbUsuario = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user }, error: erroUser } = await sbUsuario.auth.getUser();
    if (erroUser || !user) return json({ error: "Sessão expirada. Entre de novo." }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: link } = await admin
      .from("agent_links")
      .select("id, agent_id, agent_name, system_prompt, context_note, active")
      .eq("token", token).maybeSingle();
    if (!link) return json({ error: "Link não encontrado" }, 404);
    if (!link.active) return json({ error: "Este link foi desativado" }, 403);

    const { data: sessao } = await admin
      .from("agent_link_sessions")
      .select("messages_count")
      .eq("link_id", link.id).eq("user_id", user.id).maybeSingle();
    if ((sessao?.messages_count ?? 0) >= TETO_TROCAS * 2) {
      return json({
        error: "Você atingiu o limite de mensagens deste link. Fale com quem compartilhou.",
      }, 429);
    }

    // Só o que o modelo precisa: papéis válidos, texto, e as últimas 20 trocas.
    const historico: Msg[] = messages
      .filter((m: Msg) =>
        (m?.role === "user" || m?.role === "assistant") &&
        typeof m?.content === "string" && m.content.trim()
      )
      .map((m: Msg) => ({ role: m.role, content: m.content.slice(0, 8000) }))
      .slice(-20);
    if (!historico.length || historico[historico.length - 1].role !== "user") {
      return json({ error: "Nenhuma pergunta para responder." }, 400);
    }

    const montarCorpo = FUNCAO_PROPRIA[String(link.agent_id ?? "")];
    let content: string;

    if (montarCorpo) {
      const res = await fetch(`${supabaseUrl}/functions/v1/${link.agent_id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(montarCorpo(historico, String(link.context_note ?? ""))),
      });
      if (!res.ok) throw new Error(`${link.agent_id} ${res.status}`);
      content = await juntarStream(res);
    } else {
      const persona = (link.system_prompt ?? "").trim() ||
        `Você é ${link.agent_name ?? "um agente"} da Calu Agência. Responda em português brasileiro.`;
      content = await responderComClaude(anthropicKey, persona, historico);
    }

    return json({ content: content || "Não consegui responder agora. Tente de novo." });
  } catch (e) {
    console.error("agent-chat-public:", e);
    return json({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
