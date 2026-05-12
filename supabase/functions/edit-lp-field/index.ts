import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { field_label, current_text, instruction, lp_context } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    const userPrompt = `Você é um copywriter especialista em landing pages de alta conversão para o mercado brasileiro.

CONTEXTO DA LANDING PAGE:
${lp_context || "Landing page comercial em português brasileiro"}

CAMPO: ${field_label}
TEXTO ATUAL: "${current_text}"
INSTRUÇÃO: ${instruction}

Reescreva SOMENTE o texto do campo conforme a instrução acima.
- Mantenha o português brasileiro
- Mantenha o comprimento aproximado do original, a menos que a instrução peça diferente
- Retorne APENAS o novo texto, sem aspas, sem explicação, sem formatação extra`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`Claude ${r.status}: ${errText}`);
    }

    const data = await r.json();
    const new_text = (data.content?.[0]?.text ?? "").trim();

    return new Response(JSON.stringify({ new_text }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? "Erro desconhecido" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
