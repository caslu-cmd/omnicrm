import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEO_SYSTEM = `Você é TEO, Especialista em Sites e WordPress da Calu Agência.

Você edita páginas e posts do WordPress de clientes da agência.

Quando receber uma solicitação:
1. Analise o conteúdo HTML atual da página
2. Aplique SOMENTE as mudanças pedidas — não altere o que não foi solicitado
3. Se for edição: retorne o HTML completo atualizado dentro de um bloco \`\`\`html ... \`\`\`
4. Explique de forma concisa (2-3 linhas) o que foi alterado

Se for pergunta ou análise (sem edição), responda diretamente sem bloco de código.
Sempre em português brasileiro.
Seja objetivo e direto.`;

function wpHeaders(user: string, password: string) {
  const cred = btoa(`${user}:${password}`);
  return {
    Authorization: `Basic ${cred}`,
    "Content-Type": "application/json",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    const { action, wp_url, wp_user, wp_password } = body;

    const base = wp_url?.replace(/\/$/, "");

    // ── Lista páginas ──────────────────────────────────────────────────────────
    if (action === "list_pages") {
      const r = await fetch(`${base}/wp-json/wp/v2/pages?per_page=50&status=any&_fields=id,title,slug,status,link,modified`, {
        headers: wpHeaders(wp_user, wp_password),
      });
      if (!r.ok) {
        const txt = await r.text();
        return Response.json({ error: `WP ${r.status}: ${txt.slice(0, 200)}` }, { status: 400, headers: cors });
      }
      const pages = await r.json();
      return Response.json(pages, { headers: cors });
    }

    // ── Lê conteúdo de uma página ──────────────────────────────────────────────
    if (action === "get_page") {
      const { page_id } = body;
      const r = await fetch(`${base}/wp-json/wp/v2/pages/${page_id}?_fields=id,title,content,slug,status,link`, {
        headers: wpHeaders(wp_user, wp_password),
      });
      if (!r.ok) {
        const txt = await r.text();
        return Response.json({ error: `WP ${r.status}: ${txt.slice(0, 200)}` }, { status: 400, headers: cors });
      }
      return Response.json(await r.json(), { headers: cors });
    }

    // ── Chat com Teo (AI) ──────────────────────────────────────────────────────
    if (action === "chat") {
      const { message, page_title, page_content, history = [], client_name } = body;
      const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
      if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY não configurada" }, { status: 500, headers: cors });

      const context = page_content
        ? `**Cliente:** ${client_name || "—"}\n**Página:** ${page_title || "—"}\n\n**Conteúdo atual:**\n\`\`\`html\n${page_content.slice(0, 6000)}\n\`\`\`\n\n**Solicitação:** ${message}`
        : `**Cliente:** ${client_name || "—"}\n\n**Solicitação:** ${message}`;

      const messages = [...history, { role: "user", content: context }];

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: TEO_SYSTEM,
          messages,
        }),
      });

      if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);
      const data = await r.json();
      const reply: string = data.content?.[0]?.text ?? "";

      const match = reply.match(/```(?:html?)?\n([\s\S]*?)```/);
      const new_html = match ? match[1].trim() : null;

      return Response.json({
        reply,
        new_html,
        history: [...messages, { role: "assistant", content: reply }],
      }, { headers: cors });
    }

    // ── Atualiza página no WP ──────────────────────────────────────────────────
    if (action === "update_page") {
      const { page_id, content, title } = body;
      const payload: Record<string, any> = { content, status: "publish" };
      if (title) payload.title = title;
      const r = await fetch(`${base}/wp-json/wp/v2/pages/${page_id}`, {
        method: "POST",
        headers: wpHeaders(wp_user, wp_password),
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const txt = await r.text();
        return Response.json({ error: `WP ${r.status}: ${txt.slice(0, 200)}` }, { status: 400, headers: cors });
      }
      const data = await r.json();
      return Response.json({ ok: true, url: data.link, id: data.id }, { headers: cors });
    }

    return Response.json({ error: "ação inválida" }, { status: 400, headers: cors });

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});
