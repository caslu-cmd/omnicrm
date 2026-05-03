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
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const systemPrompt = `Voce e a AIRA, secretaria executiva da Calu Agencia. Gere resumos de reuniao claros, objetivos e acionaveis em portugues brasileiro. Use formatacao WhatsApp (*negrito*). A data de hoje e ${today}.`;

  const userContent = `Reuniao${clientName ? ` com cliente: ${clientName}` : ""}.

Transcricao:
${transcript}

Gere um resumo executivo com:
* Decisoes tomadas
* Tarefas definidas (quem faz o que)
* Proximos passos

Use a data de hoje (${today}) em qualquer referencia de data. Seja direto.`;

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
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
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
    const { transcript, clientName, onlyLuana, groups, participants } = await req.json();
    if (!transcript?.trim()) {
      return Response.json({ error: "transcript obrigatorio" }, { status: 400, headers: cors });
    }

    const summary = await resumirComClaude(transcript, clientName ?? "");

    if (onlyLuana) {
      return Response.json({ summary, whatsapp: null }, { headers: cors });
    }

    const mensagem = `Resumo da Reuniao - AIRA${clientName ? `\nCliente: ${clientName}` : ""}\n\n${summary}`;

    const targets: string[] = [];
    if (Array.isArray(groups) && groups.length > 0) targets.push(...groups);
    if (Array.isArray(participants) && participants.length > 0) {
      targets.push(...participants.map((p: any) => p.phone).filter(Boolean));
    }
    if (targets.length === 0) targets.push(CAROL_PHONE);

    const results = await Promise.all(targets.map((t) => enviarWhatsApp(t, mensagem)));

    return Response.json({ summary, whatsapp: results }, { headers: cors });
  } catch (e) {
    console.error("aira-meeting error:", e);
    return Response.json({ error: String(e) }, { status: 500, headers: cors });
  }
});
