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

    // Texto de arquivos .txt/.md
    if (text_content.trim()) {
      content.push({ type: "text", text: text_content });
    }

    // PDFs como document blocks (leitura nativa pelo Claude)
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
      text: `Com base nos materiais acima, extraia as informações necessárias para criar uma landing page de alta conversão.

Retorne SOMENTE um JSON válido neste formato exato (sem markdown, sem explicações):
{
  "produto": "descrição clara do produto ou serviço (1-2 frases)",
  "publico": "descrição do público-alvo: perfil, idade, dores, contexto (1-2 frases)",
  "objetivo": "um dos: Capturar leads | Vender direto | Divulgar evento | Apresentar empresa | Lançar produto | Agendar consulta",
  "tom": "um dos: Direto e persuasivo | Inspirador | Profissional | Amigável | Luxo e exclusivo",
  "cores": "cores da marca mencionadas (hex ou nome) — deixe vazio se não houver",
  "extras": "informações adicionais úteis: diferenciais únicos, preço, garantia, urgência, provas sociais, depoimentos, dados de resultado — tudo que não cabe nos campos acima"
}`,
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
        max_tokens: 1200,
        messages: [{ role: "user", content }],
      }),
    });

    if (!resp.ok) throw new Error(`Claude ${resp.status}: ${await resp.text()}`);
    const data = await resp.json();
    const raw = data.content?.[0]?.text ?? "{}";

    // Extrai o JSON da resposta (remove possível texto ao redor)
    const match = raw.match(/\{[\s\S]*\}/);
    const extracted = match ? JSON.parse(match[0]) : {};

    return Response.json(extracted, { headers: cors });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});
