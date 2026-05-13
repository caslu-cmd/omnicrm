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

    const prompt = `Você é o Tomás, especialista em landing pages da Calu Agência.

CONTEXTO:
${lp_context || "Landing page comercial em português brasileiro"}

COMANDO:
${command}

HTML ATUAL:
${html}

Identifique quais seções/elementos precisam mudar para executar o comando.
Retorne SOMENTE um JSON array (sem markdown, sem explicação):
[
  { "selector": "section#beneficios", "outerHTML": "<section id=\\"beneficios\\">...HTML completo da seção...</section>" }
]

Seletores válidos: "nav", "header#hero", "section#beneficios", "section#depoimentos", "section#sobre", "section#oferta", "section#contato", "footer", "head style"
Para inserir nova seção: { "insertAfter": "section#oferta", "outerHTML": "...nova seção completa..." }
Para mudanças globais de cor ou tipografia: use "head style" com o <style> inteiro atualizado.

Regras:
- Inclua APENAS os elementos que realmente mudam
- outerHTML deve ser HTML completo e válido do elemento
- Preserve o mesmo CSS, variáveis CSS e classes Tailwind
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

    if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);

    const data = await r.json();
    let raw = (data.content?.[0]?.text ?? "").trim();

    // Remove markdown code fences se presentes
    if (raw.startsWith("```")) {
      raw = raw.split("\n").slice(1).join("\n");
      if (raw.endsWith("```")) raw = raw.slice(0, -3).trimEnd();
    }

    // Tenta parsear como JSON de changes
    try {
      const changes = JSON.parse(raw);
      if (Array.isArray(changes)) {
        return new Response(JSON.stringify({ changes }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    } catch { /* continua pro fallback */ }

    // Fallback: modelo retornou HTML completo
    if (raw.includes("<!DOCTYPE") || raw.includes("<html")) {
      return new Response(JSON.stringify({ new_html: raw }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    throw new Error("Resposta inválida do modelo — tente novamente");
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? "Erro desconhecido" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
