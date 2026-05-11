import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

  // Auth
  const authHeader = req.headers.get("Authorization") ?? "";
  const userSb = createClient(supabaseUrl, authHeader.replace("Bearer ", "") ? serviceKey : serviceKey);
  const adminSb = createClient(supabaseUrl, serviceKey);

  const body = await req.json();
  const { user_id, client_id, channel, prompt, groups, emails, subject, system_context, auto_send } = body;

  if (!prompt || !channel) return json({ error: "prompt e channel obrigatórios" }, 400);

  // 1. Generate message with Claude
  const systemPrompt = system_context ?? `Você é um assistente de comunicação especializado em cursos e capacitação profissional.
Escreva mensagens diretas e cordiais para WhatsApp ou e-mail.
Para WhatsApp: sem markdown, emojis com moderação, máximo 3 parágrafos curtos.
Para e-mail: pode usar formatação básica HTML.
Responda APENAS com o texto da mensagem, sem introduções ou explicações.`;

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!aiRes.ok) return json({ error: "Claude error" }, 500);
  const aiData = await aiRes.json();
  const message = aiData.content?.[0]?.text?.trim() ?? "";
  if (!message) return json({ error: "Claude retornou mensagem vazia" }, 500);

  // 2. Load Z-API config from integrations (for WhatsApp)
  let zapiInstance = "", zapiToken = "", zapiClientToken = "";
  if (channel === "whatsapp") {
    const { data: intRow } = await adminSb.from("integrations")
      .select("config").eq("user_id", user_id).eq("connector_name", "zapi").single();
    if (intRow?.config) {
      zapiInstance    = intRow.config.instance    ?? "";
      zapiToken       = intRow.config.token       ?? "";
      zapiClientToken = intRow.config.clientToken ?? "";
    }
  }

  // 3. Send (if auto_send)
  const results: { target: string; ok: boolean; error?: string }[] = [];

  if (auto_send) {
    if (channel === "whatsapp" && groups?.length) {
      const base = `https://api.z-api.io/instances/${zapiInstance}/token/${zapiToken}`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (zapiClientToken) headers["Client-Token"] = zapiClientToken;

      for (const group of groups as { id: string; name: string }[]) {
        try {
          const r = await fetch(`${base}/send-text`, {
            method: "POST", headers,
            body: JSON.stringify({ phone: group.id, message }),
          });
          results.push({ target: group.name, ok: r.ok });
        } catch (e) {
          results.push({ target: group.name, ok: false, error: String(e) });
        }
        await sleep(600);
      }
    }

    if (channel === "email" && emails?.length && subject) {
      const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
      const fromEmail = Deno.env.get("FROM_EMAIL") ?? "Calu Agência <noreply@caluagencia.com.br>";
      for (const email of emails as string[]) {
        try {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: fromEmail, to: [email], subject, html: `<p>${message.replace(/\n/g, "<br>")}</p>` }),
          });
          results.push({ target: email, ok: r.ok });
        } catch (e) {
          results.push({ target: email, ok: false, error: String(e) });
        }
        await sleep(300);
      }
    }
  }

  // 4. Log
  const ok = results.filter(r => r.ok).length;
  const status = !auto_send ? "sent" : ok === results.length ? "sent" : ok > 0 ? "partial" : "failed";

  await adminSb.from("agent_broadcast_logs").insert({
    user_id, client_id, channel, message, prompt,
    targets: (channel === "whatsapp" ? groups : emails) ?? [],
    results, status,
  });

  return json({ message, results, ok, total: results.length, status });
});
