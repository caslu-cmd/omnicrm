import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { files = [], text_content = "" } = await req.json();
    // files: Array<{ name: string; base64: string; media_type: string }>

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    const content: unknown[] = [];

    if (text_content.trim()) {
      content.push({ type: "text", text: text_content });
    }

    for (const file of files) {
      if (!file.base64) continue;
      if (file.media_type === "application/pdf") {
        content.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: file.base64 },
          title: file.name ?? "documento",
        });
      }
    }

    if (content.length === 0) {
      return Response.json({ error: "Nenhum conteúdo para extrair" }, { status: 400, headers: cors });
    }

    content.push({
      type: "text",
      text: `Analise os dados acima e extraia todas as campanhas de marketing encontradas.

Retorne SOMENTE um JSON válido no formato abaixo (array, sem markdown, sem explicações):
[
  {
    "name": "nome da campanha",
    "channel": "email" ou "whatsapp",
    "status": "sent" ou "scheduled" ou "draft",
    "audience": número inteiro (destinatários totais — 0 se não informado),
    "delivered": número inteiro (entregues — 0 se não informado),
    "opened": número inteiro (abertos/visualizados — 0 se não informado),
    "clicked": número inteiro (cliques — 0 se não informado),
    "replied": número inteiro (respostas — 0 se não informado),
    "sentAt": "data de envio como string legível, ex: '10 Mai' ou 'Agendada' ou '—'"
  }
]

Regras:
- Se não souber o canal, use "email"
- Se não souber o status, deduza: se tem métricas de entrega → "sent"; se tem data futura → "scheduled"; caso contrário → "draft"
- Converta porcentagens em valores absolutos se o total da audiência estiver disponível
- Inclua TODAS as campanhas encontradas no arquivo
- Se não encontrar nenhuma campanha, retorne []`,
    });

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{ role: "user", content }],
      }),
    });

    if (!resp.ok) throw new Error(`Claude ${resp.status}: ${await resp.text()}`);
    const data = await resp.json();
    const raw = data.content?.[0]?.text ?? "[]";

    const match = raw.match(/\[[\s\S]*\]/);
    const campaigns = match ? JSON.parse(match[0]) : [];

    return Response.json({ campaigns }, { headers: cors });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});
