import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Webhook único (nível do app Meta) para Messenger + Instagram Direct.
// GET  = verificação do webhook (hub.challenge)
// POST = mensagens recebidas → roteia por page_id/ig_id → inbox
const VERIFY = Deno.env.get("META_VERIFY_TOKEN") ?? "calu-meta-verify-2026";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const ok = (d: unknown) => new Response(JSON.stringify(d), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const url = new URL(req.url);

  // ── Verificação do webhook ──
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === VERIFY) return new Response(challenge ?? "", { status: 200 });
    return new Response("forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  let body: Record<string, any> = {};
  try { body = await req.json(); } catch { return ok({ ignored: true }); }

  const channel = body.object === "instagram" ? "instagram" : "facebook";
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Conexões ativas desse canal (poucas) — casa por page_id/ig_id
  const { data: conns } = await db.from("channel_connections")
    .select("id, client_id, config").eq("channel", channel).eq("active", true);

  for (const entry of body.entry ?? []) {
    const routeId = String(entry.id ?? "");
    const conn = (conns ?? []).find((c: any) => c.config?.page_id === routeId || c.config?.ig_id === routeId);
    if (!conn) continue;

    for (const ev of entry.messaging ?? []) {
      if (ev.message?.is_echo) continue;
      const senderId = ev.sender?.id ? String(ev.sender.id) : "";
      const text = ev.message?.text ?? "";
      const attach = ev.message?.attachments?.[0]?.payload?.url ?? null;
      if (!senderId || (!text && !attach)) continue;

      const preview = (text || "[anexo]").slice(0, 120);
      const { data: conv } = await db.from("inbox_conversations")
        .select("id, unread").eq("connection_id", conn.id).eq("external_id", senderId).maybeSingle();

      let conversationId: string;
      if (conv) {
        conversationId = conv.id;
        await db.from("inbox_conversations").update({
          last_message_at: new Date().toISOString(), last_message_preview: preview, unread: (conv.unread ?? 0) + 1,
        }).eq("id", conversationId);
      } else {
        const { data: created } = await db.from("inbox_conversations").insert({
          client_id: conn.client_id, channel, connection_id: conn.id, external_id: senderId,
          contact_name: null, status: "open", unread: 1, last_message_preview: preview,
        }).select("id").single();
        if (!created) continue;
        conversationId = created.id;
      }

      await db.from("inbox_messages").insert({
        conversation_id: conversationId, client_id: conn.client_id, direction: "in", sender: "contact",
        content: text || null, media_url: attach, media_type: attach ? "attachment" : null,
        channel_message_id: ev.message?.mid ?? null,
      });

      // dispara o bot (decide internamente se responde)
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/inbox-bot`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
          body: JSON.stringify({ conversation_id: conversationId }),
        });
      } catch (_) { /* não bloqueia */ }
    }
  }

  return ok({ received: true });
});
