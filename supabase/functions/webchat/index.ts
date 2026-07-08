import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const ok = (d: unknown) => new Response(JSON.stringify(d), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (m: string, s = 400) => new Response(JSON.stringify({ error: m }), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

// Widget de webchat: action=in (visitante manda) | action=poll (widget busca respostas)
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return fail("Método não permitido", 405);

  const action = new URL(req.url).searchParams.get("action") ?? "in";
  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { return fail("Body inválido"); }

  const token = String(body.token ?? "");
  const session = String(body.session ?? "");
  if (!token || !session) return fail("token e session são obrigatórios");

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: conn } = await db.from("channel_connections")
    .select("id, client_id").eq("webhook_token", token).eq("channel", "webchat").eq("active", true).maybeSingle();
  if (!conn) return fail("Widget inválido ou inativo", 404);

  // Acha a conversa desta sessão
  const { data: conv } = await db.from("inbox_conversations")
    .select("id, unread, contact_name").eq("connection_id", conn.id).eq("external_id", session).maybeSingle();

  if (action === "poll") {
    if (!conv) return ok({ messages: [] });
    let q = db.from("inbox_messages")
      .select("id, content, created_at").eq("conversation_id", conv.id).eq("direction", "out")
      .order("created_at", { ascending: true });
    if (body.after) q = q.gt("created_at", String(body.after));
    const { data: msgs } = await q;
    return ok({ messages: msgs ?? [] });
  }

  // action === "in"
  const text = String(body.text ?? "").trim();
  const name = body.name ? String(body.name).slice(0, 120) : null;
  if (!text) return fail("texto vazio");

  const preview = text.slice(0, 120);
  let conversationId: string;
  if (conv) {
    conversationId = conv.id;
    await db.from("inbox_conversations").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: preview,
      unread: (conv.unread ?? 0) + 1,
      contact_name: conv.contact_name ?? name,
    }).eq("id", conversationId);
  } else {
    const { data: created, error } = await db.from("inbox_conversations").insert({
      client_id: conn.client_id,
      channel: "webchat",
      connection_id: conn.id,
      external_id: session,
      contact_name: name ?? "Visitante do site",
      status: "open",
      unread: 1,
      last_message_preview: preview,
    }).select("id").single();
    if (error || !created) return fail("Erro ao criar conversa", 500);
    conversationId = created.id;
  }

  await db.from("inbox_messages").insert({
    conversation_id: conversationId,
    client_id: conn.client_id,
    direction: "in",
    sender: "contact",
    sender_name: name,
    content: text,
  });

  // dispara o bot (decide internamente se responde)
  try {
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/inbox-bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
      body: JSON.stringify({ conversation_id: conversationId }),
    });
  } catch (_) { /* não bloqueia a entrada */ }

  return ok({ success: true });
});
