import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const ok = (d: unknown) => new Response(JSON.stringify(d), { status: 200, headers: { "Content-Type": "application/json" } });
const fail = (m: string, s = 400) => new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } });

const DEFAULT_PROMPT = `Você é um atendente virtual simpático e prestativo. Responda SEMPRE em português brasileiro, de forma curta e cordial (estilo chat, no máximo 2 parágrafos). Ajude o cliente com o que ele precisa. Se não souber algo específico ou o assunto for delicado, diga que vai chamar um atendente humano.`;

async function zapiSend(cfg: any, phone: string, message: string) {
  const { instance, token, client_token } = cfg ?? {};
  if (!instance || !token) return false;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (client_token) headers["Client-Token"] = client_token;
  const res = await fetch(`https://api.z-api.io/instances/${instance}/token/${token}/send-text`, {
    method: "POST", headers, body: JSON.stringify({ phone, message }),
  });
  return res.ok;
}
async function metaSend(cfg: any, psid: string, message: string) {
  if (!cfg?.page_token) return false;
  const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${cfg.page_token}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: psid }, message: { text: message }, messaging_type: "RESPONSE" }),
  });
  return res.ok;
}

// Normaliza histórico p/ Claude: alterna user/assistant, começa com user
function normalize(rows: { direction: string; content: string | null }[]) {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const r of rows) {
    const content = (r.content ?? "").trim();
    if (!content) continue;
    const role = r.direction === "in" ? "user" : "assistant";
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += "\n" + content;
    else out.push({ role, content });
  }
  while (out.length && out[0].role === "assistant") out.shift();
  return out;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return fail("Método não permitido", 405);
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (req.headers.get("Authorization") !== `Bearer ${service}`) return fail("Não autorizado", 401);

  let body: any = {};
  try { body = await req.json(); } catch { return fail("Body inválido"); }
  const conversationId = body.conversation_id;
  if (!conversationId) return fail("conversation_id obrigatório");

  const db = createClient(Deno.env.get("SUPABASE_URL")!, service);

  const { data: conv } = await db.from("inbox_conversations")
    .select("id, client_id, connection_id, external_id, channel, assignee").eq("id", conversationId).maybeSingle();
  if (!conv) return ok({ skip: "no conv" });
  if (conv.assignee) return ok({ skip: "assumida por humano" });

  const { data: conn } = await db.from("channel_connections").select("config").eq("id", conv.connection_id).maybeSingle();
  const bot = conn?.config?.bot;
  if (!bot?.enabled) return ok({ skip: "bot desligado" });

  const { data: rows } = await db.from("inbox_messages")
    .select("direction, content").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(20);
  const messages = normalize(rows ?? []);
  if (!messages.length || messages[messages.length - 1].role !== "user") return ok({ skip: "sem pergunta pendente" });

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 500, system: bot.prompt || DEFAULT_PROMPT, messages }),
  });
  if (!claudeRes.ok) return fail("Claude falhou: " + await claudeRes.text(), 502);
  const data = await claudeRes.json();
  const reply = (data.content ?? []).find((b: any) => b.type === "text")?.text?.trim() ?? "";
  if (!reply) return ok({ skip: "resposta vazia" });

  if (conv.channel === "whatsapp_zapi") await zapiSend(conn?.config, conv.external_id, reply);
  else if (conv.channel === "facebook" || conv.channel === "instagram") await metaSend(conn?.config, conv.external_id, reply);
  // webchat: só grava (widget puxa via poll)

  await db.from("inbox_messages").insert({
    conversation_id: conversationId, client_id: conv.client_id, direction: "out", sender: "bot", content: reply,
  });
  await db.from("inbox_conversations").update({
    last_message_at: new Date().toISOString(), last_message_preview: reply.slice(0, 120),
  }).eq("id", conversationId);

  return ok({ success: true, replied: true });
});
