// AIRA — transcreve áudio + gera resumo + envia para WhatsApp (Z-API)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const ZAPI_INSTANCE = Deno.env.get("ZAPI_INSTANCE_ID");
const ZAPI_TOKEN = Deno.env.get("ZAPI_TOKEN");

async function callAI(messages: any[], model = "google/gemini-2.5-flash") {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages }),
  });
  if (!r.ok) throw new Error(`AI ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return d.choices?.[0]?.message?.content ?? "";
}

async function sendWhatsApp(phone: string, message: string) {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN) return { ok: false, error: "Z-API não configurada" };
  const r = await fetch(`https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Client-Token": ZAPI_TOKEN },
    body: JSON.stringify({ phone, message }),
  });
  return { ok: r.ok, data: await r.json().catch(() => null) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { audioBase64, audioMime, clientName, participants, luana, meetingTitle } = await req.json();
    if (!audioBase64) return Response.json({ error: "audioBase64 obrigatório" }, { status: 400, headers: cors });

    // 1) Transcrever via Gemini multimodal
    const transcript = await callAI([
      {
        role: "user",
        content: [
          { type: "text", text: "Transcreva integralmente este áudio de reunião em português brasileiro. Retorne apenas a transcrição, sem comentários, identificando falantes como 'Pessoa 1', 'Pessoa 2' etc. quando possível." },
          { type: "image_url", image_url: { url: `data:${audioMime || "audio/webm"};base64,${audioBase64}` } },
        ],
      },
    ], "google/gemini-2.5-flash");

    // 2) Resumir
    const summary = await callAI([
      { role: "system", content: "Você é a AIRA, secretária executiva. Gere resumos de reunião claros, objetivos e acionáveis em pt-BR." },
      {
        role: "user",
        content: `Reunião: ${meetingTitle || "Reunião"}${clientName ? ` — Cliente: ${clientName}` : ""}\nParticipantes: ${(participants || []).map((p: any) => p.name).join(", ") || "não informado"}\n\nTranscrição:\n${transcript}\n\nGere um resumo em formato WhatsApp com:\n📅 *Resumo da Reunião*\n\n*Pontos principais:*\n• ...\n\n*Decisões:*\n• ...\n\n*Próximos passos / Ações:* (com responsável quando mencionado)\n• ...\n\nSeja conciso. Use emojis com moderação. Markdown do WhatsApp (*negrito*).`,
      },
    ]);

    // 3) Enviar WhatsApp
    const recipients: { name: string; phone: string; role: string }[] = [];
    if (luana?.phone) recipients.push({ name: luana.name || "Luana", phone: luana.phone, role: "orquestradora" });
    for (const p of (participants || [])) if (p.phone) recipients.push({ name: p.name, phone: p.phone, role: "participante" });

    const sends = [];
    for (const r of recipients) {
      const greeting = r.role === "orquestradora"
        ? `Olá ${r.name}! 👋\nSegue o resumo da reunião${clientName ? ` com ${clientName}` : ""} para você orquestrar os agentes:\n\n`
        : `Olá ${r.name}! 👋\nSegue o resumo da nossa reunião:\n\n`;
      const res = await sendWhatsApp(r.phone, greeting + summary);
      sends.push({ to: r.name, phone: r.phone, ok: res.ok });
      await new Promise((res) => setTimeout(res, 800));
    }

    return Response.json({ transcript, summary, sends }, { headers: cors });
  } catch (e) {
    console.error("aira-meeting error:", e);
    return Response.json({ error: String(e) }, { status: 500, headers: cors });
  }
});
