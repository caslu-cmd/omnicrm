import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { files = [], text_content = "" } = await req.json();

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
      return Response.json({ error: "Nenhum conteúdo enviado" }, { status: 400, headers: cors });
    }

    content.push({
      type: "text",
      text: `Com base no material acima, extraia as informações para criar uma campanha de marketing.

Retorne SOMENTE um JSON válido neste formato exato (sem markdown, sem explicações):
{
  "nome": "nome sugerido para a campanha (máx 50 chars)",
  "canal": "email" ou "whatsapp",
  "assunto": "linha de assunto do e-mail (máx 80 chars) — deixe vazio se canal for whatsapp",
  "conteudo": "corpo completo da mensagem pronto para envio — e-mail em HTML simples se canal for email, texto limpo se whatsapp",
  "audiencia": "descrição do público-alvo (1 linha)",
  "cta_url": "URL do link de destino se mencionado no material — deixe vazio se não houver"
}

Regras:
- Se o material parecer mais adequado para WhatsApp (mensagem curta, informal, conversacional), use "whatsapp"
- Se tiver HTML, assunto ou formato de e-mail, use "email"
- O conteudo deve ser completo e pronto para envio, não apenas um resumo
- Preserve o tom de voz do material original`,
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
    const raw = data.content?.[0]?.text ?? "{}";

    const match = raw.match(/\{[\s\S]*\}/);
    const extracted = match ? JSON.parse(match[0]) : {};

    return Response.json(extracted, { headers: cors });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});
