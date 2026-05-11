import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;
  const verifyToken = Deno.env.get("WEBHOOK_VERIFY_TOKEN") ?? "calu_verify_2025";

  const adminSb = createClient(supabaseUrl, serviceKey);

  // Meta webhook verification (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === verifyToken) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // Meta webhook events (POST)
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const object = body.object; // "instagram" | "page"
  const entries = body.entry ?? [];

  for (const entry of entries) {
    const pageId = entry.id as string;

    // Load access token from social_connections for this page/account
    const { data: conn } = await adminSb
      .from("social_connections")
      .select("user_id, access_token, config")
      .or(`connector_name.eq.instagram,connector_name.eq.facebook`)
      .filter("config->>page_id", "eq", pageId)
      .maybeSingle();

    const accessToken = conn?.access_token ?? Deno.env.get("META_PAGE_ACCESS_TOKEN") ?? "";
    const userId = conn?.user_id ?? null;

    // --- DMs (messaging events) ---
    const messagingEvents = entry.messaging ?? [];
    for (const ev of messagingEvents) {
      const senderId = ev.sender?.id as string;
      const text = ev.message?.text as string | undefined;
      if (!text || senderId === pageId) continue; // ignore echo

      const aiReply = await generateReply(anthropicKey, text, "dm");
      if (aiReply && accessToken) {
        await sendDM(accessToken, senderId, aiReply);
      }

      await logInteraction(adminSb, {
        user_id: userId,
        platform: object === "instagram" ? "instagram" : "facebook",
        type: "dm",
        sender_id: senderId,
        incoming_text: text,
        reply_text: aiReply,
      });
    }

    // --- Comments (feed / Instagram comment events) ---
    const changes = entry.changes ?? [];
    for (const change of changes) {
      const field = change.field as string;
      const val = change.value as any;

      if (field === "feed" && val?.item === "comment" && val?.verb === "add") {
        const commentId = val.comment_id as string;
        const commentText = val.message as string | undefined;
        const senderId = val.from?.id as string;
        if (!commentText || senderId === pageId) continue;

        const aiReply = await generateReply(anthropicKey, commentText, "comment");
        if (aiReply && accessToken && commentId) {
          await replyToComment(accessToken, commentId, aiReply);
        }

        await logInteraction(adminSb, {
          user_id: userId,
          platform: "facebook",
          type: "comment",
          sender_id: senderId,
          incoming_text: commentText,
          reply_text: aiReply,
        });
      }

      // Instagram comment via webhooks
      if (field === "comments" && val?.text) {
        const commentId = val.id as string;
        const commentText = val.text as string;
        const senderId = val.from?.id as string;
        if (!commentText) continue;

        const aiReply = await generateReply(anthropicKey, commentText, "comment");
        if (aiReply && accessToken && commentId) {
          await replyToComment(accessToken, commentId, aiReply);
        }

        await logInteraction(adminSb, {
          user_id: userId,
          platform: "instagram",
          type: "comment",
          sender_id: senderId,
          incoming_text: commentText,
          reply_text: aiReply,
        });
      }
    }
  }

  return json({ ok: true });
});

async function generateReply(apiKey: string, incomingText: string, context: "dm" | "comment"): Promise<string> {
  const systemPrompt =
    context === "dm"
      ? `Você é um assistente da Calu Agência, especialista em cursos e capacitação profissional.
Responda de forma cordial, direta e útil às mensagens diretas recebidas no Instagram/Facebook.
Máximo 3 parágrafos curtos, sem markdown, emojis com moderação.
Responda APENAS com o texto da resposta.`
      : `Você é um assistente da Calu Agência respondendo comentários em redes sociais.
Seja cordial, breve e engajador. Máximo 2 frases.
Se for uma dúvida, convide para falar por DM. Responda APENAS com o texto.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: incomingText }],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.content?.[0]?.text?.trim() ?? "";
  } catch {
    return "";
  }
}

async function sendDM(accessToken: string, recipientId: string, text: string) {
  await fetch(`https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });
}

async function replyToComment(accessToken: string, commentId: string, text: string) {
  await fetch(`https://graph.facebook.com/v19.0/${commentId}/replies?access_token=${accessToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });
}

async function logInteraction(
  adminSb: ReturnType<typeof createClient>,
  data: {
    user_id: string | null;
    platform: string;
    type: string;
    sender_id: string;
    incoming_text: string;
    reply_text: string;
  }
) {
  await adminSb.from("agent_broadcast_logs").insert({
    user_id: data.user_id,
    channel: data.platform,
    message: data.reply_text,
    prompt: data.incoming_text,
    targets: [{ id: data.sender_id, type: data.type }],
    results: [{ target: data.sender_id, ok: !!data.reply_text }],
    status: data.reply_text ? "sent" : "failed",
  });
}
