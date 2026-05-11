import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

// ── Build system prompt from agent record ──────────────────────
function buildSystemPrompt(agent: Record<string, string>): string {
  return `Você é ${agent.name}, assistente de vendas especializado em ${agent.product_name}.

PRODUTO:
- Nome: ${agent.product_name}
- Descrição: ${agent.product_description || "—"}
- Preço: ${agent.product_price || "consulte"}
${agent.product_url ? `- Link de compra: ${agent.product_url}` : ""}

${agent.persona ? `PERFIL DO AGENTE:\n${agent.persona}\n` : ""}
REGRAS OBRIGATÓRIAS:
- Responda SEMPRE em português brasileiro
- Mensagens curtas e diretas (estilo WhatsApp, máximo 3 parágrafos)
- Seja acolhedor, empático e focado em ajudar o cliente a tomar a decisão
- Quando o cliente demonstrar interesse real, envie o link de compra
- Não invente informações sobre o produto — use apenas o que foi fornecido
- Nunca quebre o personagem
- Se perguntado sobre algo fora do produto, redirecione gentilmente ao foco`;
}

// ── Send message via Zapi ──────────────────────────────────────
async function zapiSend(instance: string, token: string, clientToken: string | null, phone: string, message: string) {
  const base = `https://api.z-api.io/instances/${instance}/token/${token}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (clientToken) headers["Client-Token"] = clientToken;
  const res = await fetch(`${base}/send-text`, {
    method: "POST",
    headers,
    body: JSON.stringify({ phone, message }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  const agentId = url.searchParams.get("id");

  if (!agentId) return json({ error: "missing ?id" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  // ── Load agent ─────────────────────────────────────────────
  const { data: agent, error: agentErr } = await sb
    .from("sales_agents")
    .select("*")
    .eq("id", agentId)
    .single();

  if (agentErr || !agent) return json({ error: "agent not found" }, 404);
  if (!agent.active) return json({ ok: false, reason: "agent inactive" });

  // ── Parse Zapi webhook ─────────────────────────────────────
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "invalid json" }, 400); }

  // Ignore messages sent by the bot itself
  if (body.fromMe === true) return json({ ok: true, skipped: "fromMe" });

  // Ignore group messages
  if (body.isGroup === true) return json({ ok: true, skipped: "group" });

  const phone = (body.phone as string)?.replace(/\D/g, "");
  const textContent = (body.text as { message?: string })?.message
    || (body.audio as { transcription?: string })?.transcription
    || "";

  if (!phone || !textContent.trim()) return json({ ok: true, skipped: "no text" });

  const customerName = (body.senderName as string) || null;

  // ── Save incoming message ───────────────────────────────────
  await sb.from("agent_conversations").insert({
    agent_id: agentId,
    phone,
    customer_name: customerName,
    role: "user",
    content: textContent.trim(),
  });

  // ── Load conversation history (last 20 turns) ────────────────
  const { data: history } = await sb
    .from("agent_conversations")
    .select("role, content")
    .eq("agent_id", agentId)
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(20);

  const messages = (history ?? [])
    .reverse()
    .map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // ── Call Claude ─────────────────────────────────────────────
  const systemPrompt = agent.system_prompt || buildSystemPrompt(agent);

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages,
    }),
  });

  if (!claudeRes.ok) {
    const err = await claudeRes.text();
    console.error("Claude error:", err);
    return json({ error: "claude failed" }, 500);
  }

  const claudeData = await claudeRes.json() as { content: { type: string; text: string }[] };
  const reply = claudeData.content?.find((b) => b.type === "text")?.text ?? "";

  if (!reply) return json({ error: "empty reply" }, 500);

  // ── Save assistant reply ────────────────────────────────────
  await sb.from("agent_conversations").insert({
    agent_id: agentId,
    phone,
    customer_name: customerName,
    role: "assistant",
    content: reply,
  });

  // ── Send via Zapi ───────────────────────────────────────────
  if (agent.zapi_instance && agent.zapi_token) {
    await zapiSend(agent.zapi_instance, agent.zapi_token, agent.zapi_client_token, phone, reply);
  }

  return json({ ok: true });
});
