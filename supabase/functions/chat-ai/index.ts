import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é a Caroline IA, assistente especializada em marketing digital e gestão de clientes para agências de publicidade brasileiras.

Você domina:
- Estratégia de conteúdo para redes sociais (Instagram, Facebook, TikTok, LinkedIn)
- Criação de copy para posts, stories, legendas, campanhas e landing pages
- Gestão de tráfego pago (Facebook Ads, Google Ads)
- Briefing e posicionamento de marca
- Calendário editorial e planejamento de campanhas
- Análise de métricas e resultados
- Gestão de relacionamento com clientes (CRM)

Regras de comportamento:
- Responda sempre em português brasileiro, de forma profissional mas acolhedora
- Seja direta e prática — dê respostas que a pessoa possa executar imediatamente
- Quando sugerir copy ou textos, entregue prontos para uso
- Quando o contexto do cliente for mencionado, use-o para personalizar a resposta
- Formate respostas com markdown quando ajudar na leitura
- Sugira próximos passos sempre que relevante`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, systemPrompt, maxTokens, model } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedModel = model ?? "claude-sonnet-4-6";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: maxTokens ?? 1024,
        system: systemPrompt ?? SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
