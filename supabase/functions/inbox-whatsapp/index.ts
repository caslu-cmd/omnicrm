import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const ok = (d: unknown) => new Response(JSON.stringify(d), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (m: string, s = 400) => new Response(JSON.stringify({ error: m }), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

// Webhook de entrada do WhatsApp via Z-API.
// Configure no painel Z-API (ao receber mensagem): {SUPABASE_URL}/functions/v1/inbox-whatsapp?t=<webhook_token>
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return fail("Método não permitido", 405);

  const token = new URL(req.url).searchParams.get("t");
  if (!token) return fail("Token ausente");

  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { return fail("Body inválido"); }

  // Ignora mensagens enviadas pelo próprio número e grupos
  if (body.fromMe === true) return ok({ skipped: "fromMe" });
  if (body.isGroup === true) return ok({ skipped: "group" });

  const phone = String(body.phone ?? "").replace(/\D/g, "");
  const text =
    body?.text?.message ??
    body?.audio?.transcription ??
    body?.image?.caption ??
    body?.document?.caption ??
    "";
  const mediaUrl = body?.image?.imageUrl ?? body?.audio?.audioUrl ?? body?.document?.documentUrl ?? null;
  const mediaType = body?.image ? "image" : body?.audio ? "audio" : body?.document ? "document" : null;
  const name = body.senderName ?? body.chatName ?? null;

  if (!phone) return ok({ skipped: "no phone" });
  if (!text && !mediaUrl) return ok({ skipped: "empty" });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: conn } = await db.from("channel_connections")
    .select("id, client_id").eq("webhook_token", token).eq("active", true).maybeSingle();
  if (!conn) return fail("Conexão inválida ou inativa", 404);

  const preview = (text || "[mídia]").slice(0, 120);

  // Acha ou cria a conversa
  const { data: existing } = await db.from("inbox_conversations")
    .select("id, unread, contact_name")
    .eq("connection_id", conn.id).eq("external_id", phone).maybeSingle();

  let conversationId: string;
  if (existing) {
    conversationId = existing.id;
    await db.from("inbox_conversations").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: preview,
      unread: (existing.unread ?? 0) + 1,
      contact_name: existing.contact_name ?? name,
    }).eq("id", conversationId);
  } else {
    const { data: created, error: cErr } = await db.from("inbox_conversations").insert({
      client_id: conn.client_id,
      channel: "whatsapp_zapi",
      connection_id: conn.id,
      external_id: phone,
      contact_name: name,
      status: "open",
      unread: 1,
      last_message_preview: preview,
    }).select("id").single();
    if (cErr || !created) return fail("Erro ao criar conversa: " + (cErr?.message ?? ""), 500);
    conversationId = created.id;
  }

  await db.from("inbox_messages").insert({
    conversation_id: conversationId,
    client_id: conn.client_id,
    direction: "in",
    sender: "contact",
    sender_name: name,
    content: text || null,
    media_url: mediaUrl,
    media_type: mediaType,
    channel_message_id: body.messageId ?? null,
  });

  await db.from("channel_connections").update({ status: "connected", updated_at: new Date().toISOString() }).eq("id", conn.id);

  // dispara o bot (decide internamente se responde)
  try {
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/inbox-bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
      body: JSON.stringify({ conversation_id: conversationId }),
    });
  } catch (_) { /* não bloqueia a entrada */ }

  return ok({ success: true, conversation_id: conversationId });
});
