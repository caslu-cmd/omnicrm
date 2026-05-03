import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const ZAPI_INSTANCE    = Deno.env.get("ZAPI_INSTANCE_ID")  ?? "3EBC0C423ACD4164F09A5A0F11A263D4";
const ZAPI_TOKEN       = Deno.env.get("ZAPI_TOKEN")        ?? "BA4478E497A2E1C9B499C950";
const ZAPI_CLIENT      = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "Fabcb22cf9022425ca4fe8f3a4c91a7e9S";
const CAROL_PHONE      = Deno.env.get("CAROL_PHONE")       ?? "5585986408404";

async function resumirComClaude(transcript: string, clientName: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: "Você é a AIRA, secretária executiva da Calu Agência. Gere resumos de reunião claros, objetivos e acionáveis em português brasileiro. Use formatação WhatsApp (*negrito*).",
      messages: [{
        role: "user",
        content: `Reunião${clientName ? ` com cliente: ${clientName}` : ""}.\n\nTranscrição:\n${transcript}\n\nGere um resumo executivo com:\n📌 *Decisões tomadas*\n✅ *Tarefas definidas* (quem faz o quê)\n🚀 *Próximos passos*\n\nSeja direto e use emojis com moderação.`,
      }],
    }),
  });
  if (!r.ok) throw new Error(`Claude error ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return d.content?.[0]?.text ?? "";
}

async function enviarWhatsApp(phone: string, mensagem: string) {
  const r = await fetch(
    `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Client-Token": ZAPI_CLIENT },
      body: JSON.stringify({ phone, message: mensagem }),
    }
  );
  return { ok: r.ok, data: await r.json().catch(() => null) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { transcript, clientName } = await req.json();
    if (!transcript?.trim()) {
      return Response.json({ error: "transcript obrigatório" }, { status: 400, headers: cors });
    }

    const summary = await resumirComClaude(transcript, clientName ?? "");
    const mensagem = `🎙️ *Resumo da Reunião — AIRA*${clientName ? `\nCliente: ${clientName}` : ""}\n\n${summary}`;
    const zap = await enviarWhatsApp(CAROL_PHONE, mensagem);

    return Response.json({ summary, whatsapp: zap }, { headers: cors });
  } catch (e) {
    console.error("aira-meeting error:", e);
    return Response.json({ error: String(e) }, { status: 500, headers: cors });
  }
});
