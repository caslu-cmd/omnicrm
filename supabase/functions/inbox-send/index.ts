import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};
const ok = (d: unknown) => new Response(JSON.stringify(d), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (m: string, s = 400) => new Response(JSON.stringify({ error: m }), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

// Envia via Z-API
async function zapiSend(cfg: Record<string, string>, phone: string, message: string) {
  const { instance, token, client_token } = cfg;
  if (!instance || !token) return { okSent: false, err: "conexão sem credenciais Z-API" };
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (client_token) headers["Client-Token"] = client_token;
  const res = await fetch(`https://api.z-api.io/instances/${instance}/token/${token}/send-text`, {
    method: "POST", headers, body: JSON.stringify({ phone, message }),
  });
  return { okSent: res.ok, err: res.ok ? null : await res.text() };
}

// Envia uma mensagem numa conversa do inbox. Requer JWT do membro/agência.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return fail("Método não permitido", 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return fail("Não autenticado", 401);

  let payload: { conversation_id?: string; text?: string } = {};
  try { payload = await req.json(); } catch { return fail("Body inválido"); }
  const { conversation_id, text } = payload;
  if (!conversation_id || !text?.trim()) return fail("conversation_id e text são obrigatórios");

  const url = Deno.env.get("SUPABASE_URL")!;
  // Cliente com o JWT do usuário → a leitura respeita o RLS (autoriza o acesso à conversa)
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: conv } = await userClient.from("inbox_conversations")
    .select("id, client_id, connection_id, external_id, channel").eq("id", conversation_id).maybeSingle();
  if (!conv) return fail("Sem acesso a esta conversa", 403);

  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: conn } = await db.from("channel_connections")
    .select("config, channel").eq("id", conv.connection_id).maybeSingle();
  if (!conn) return fail("Conexão do canal não encontrada", 404);

  // Envio por canal (v1: WhatsApp Z-API)
  if (conv.channel === "whatsapp_zapi") {
    const r = await zapiSend(conn.config ?? {}, conv.external_id, text.trim());
    if (!r.okSent) return fail("Falha ao enviar pelo WhatsApp: " + r.err, 502);
  }
  // (outros canais entram aqui nas próximas fases)

  const { data: msg } = await db.from("inbox_messages").insert({
    conversation_id,
    client_id: conv.client_id,
    direction: "out",
    sender: "agent",
    content: text.trim(),
  }).select("id, created_at").single();

  await db.from("inbox_conversations").update({
    last_message_at: new Date().toISOString(),
    last_message_preview: text.trim().slice(0, 120),
    unread: 0,
  }).eq("id", conversation_id);

  return ok({ success: true, message: msg });
});
