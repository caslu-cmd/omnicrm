import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { course_title, course_description, course_level, client_segment } = await req.json();

    if (!course_title) {
      return new Response(JSON.stringify({ error: "course_title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contextLines = [
      `Curso: ${course_title}`,
      course_description ? `Descrição: ${course_description}` : null,
      course_level ? `Nível: ${course_level}` : null,
      client_segment ? `Segmento do cliente: ${client_segment}` : null,
    ].filter(Boolean).join("\n");

    const prompt = `Você é especialista em educação corporativa e design instrucional.

${contextLines}

Gere um checklist prático para garantir que o aluno e a agência estejam alinhados na entrega e aproveitamento deste curso.

Retorne APENAS um JSON válido, sem texto extra, no formato:
{
  "items": [
    {
      "title": "Título curto da tarefa",
      "description": "Explicação de 1 linha do que precisa ser feito",
      "responsible": "agency" ou "student",
      "order_index": número começando em 0
    }
  ]
}

Regras:
- Entre 8 e 14 itens no total
- Misture responsabilidades: alguns para a agência (preparar material, gravar aulas, abrir acesso), outros para o aluno (assistir aula, completar exercício, entregar atividade)
- Cubra todo o ciclo: pré-curso → durante → pós-curso
- Seja direto e acionável
- Use português brasileiro`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText);
    }

    const claudeData = await response.json();
    const rawText = claudeData.content?.[0]?.text ?? "";

    // Extract JSON even if Claude adds surrounding text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Claude did not return valid JSON");

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
