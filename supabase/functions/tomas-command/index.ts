import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { html, command, lp_context } = await req.json();
    if (!html || !command) throw new Error("html e command são obrigatórios");

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    const prompt = `Você é o Tomás, especialista em landing pages de alta conversão da Calu Agência.

CONTEXTO DA LANDING PAGE:
${lp_context || "Landing page comercial em português brasileiro"}

INSTRUÇÃO DO USUÁRIO:
${command}

HTML ATUAL DA LANDING PAGE:
${html}

Aplique a instrução acima na landing page e retorne o HTML COMPLETO atualizado.
Regras:
- Mantenha toda a estrutura, estilos e seções existentes — modifique apenas o necessário para cumprir a instrução
- Mantenha Tailwind CSS via CDN, Google Fonts e todo o JavaScript inline
- Retorne APENAS o código HTML completo, sem explicações e sem blocos de código markdown
- Mantenha o português brasileiro`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`Claude ${r.status}: ${errText}`);
    }

    const data = await r.json();
    let new_html = (data.content?.[0]?.text ?? "").trim();

    // Remove markdown code fences se presentes
    if (new_html.startsWith("```")) {
      const lines = new_html.split("\n");
      new_html = lines.slice(1).join("\n");
      if (new_html.endsWith("```")) new_html = new_html.slice(0, -3).trimEnd();
    }

    return new Response(JSON.stringify({ new_html }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? "Erro desconhecido" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
