import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { pdfUrl, clientContext = {}, numPosts = 5 } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");
    if (!pdfUrl) throw new Error("pdfUrl obrigatório");

    // Download the PDF from Supabase Storage
    const pdfRes = await fetch(pdfUrl);
    if (!pdfRes.ok) throw new Error(`Erro ao baixar PDF: ${pdfRes.status}`);

    const pdfBase64 = toBase64(await pdfRes.arrayBuffer());

    const clientName = String(clientContext.name ?? "cliente");
    const industry = String(clientContext.industry ?? "");

    const systemPrompt = `Você é BEATRIZ, Copywriter Sênior da Calu Agência, especialista em transformar apresentações e materiais institucionais em conteúdo viral para redes sociais.

Ao analisar a apresentação, extraia os principais temas, dados, insights e mensagens-chave. Transforme cada um em um post completo e autêntico, fiel ao conteúdo real da apresentação.

Para cada post entregue:
### Post [número] — [Plataforma recomendada]
**Pilar:** [tema/assunto central]
**Gancho:** [primeira frase chamativa, máx 15 palavras]
**Legenda completa:**
[texto completo do post, pronto para publicar]
**Hashtags:** #hashtag1 #hashtag2 #hashtag3 (10-15 hashtags)
**Formato sugerido:** Reel / Carrossel / Feed / Stories

Varie os formatos, plataformas (Instagram, LinkedIn) e ângulos. Cada post deve ser único. Português brasileiro impecável.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 6000,
        system: systemPrompt,
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              type: "text",
              text: `Analise esta apresentação do cliente "${clientName}"${industry ? ` (${industry})` : ""} e crie ${numPosts} posts completos e variados para redes sociais, baseados nos principais temas e insights dos slides. Cada post deve explorar um ângulo diferente do conteúdo da apresentação.`,
            },
          ],
        }],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Erro na API: ${err.slice(0, 300)}`);
    }

    const data = await resp.json();
    const content = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text?: string }) => b.text ?? "")
      .join("\n\n")
      .trim();

    return new Response(
      JSON.stringify({ content, stop_reason: data.stop_reason }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
