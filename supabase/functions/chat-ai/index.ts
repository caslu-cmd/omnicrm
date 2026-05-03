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
    const { messages, systemPrompt, maxTokens, model, enableThinking, thinkingBudget } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const apiKey = anthropicKey || lovableKey;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedModel = anthropicKey
      ? (model ?? "claude-sonnet-4-6")
      : "claude-sonnet-4-6";

    // Extended thinking requer tokens extras além do budget
    const budget = thinkingBudget ?? 8000;
    const resolvedMaxTokens = enableThinking
      ? Math.max(maxTokens ?? 8000, budget + 2000)
      : (maxTokens ?? 1024);

    const body: Record<string, unknown> = {
      model: selectedModel,
      max_tokens: resolvedMaxTokens,
      system: systemPrompt ?? SYSTEM_PROMPT,
      messages,
    };

    if (enableThinking) {
      body.thinking = { type: "enabled", budget_tokens: budget };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Extrai apenas o bloco de texto (ignora thinking blocks)
    const content = data.content
      ?.filter((b: { type: string }) => b.type === "text")
      ?.map((b: { text: string }) => b.text)
      ?.join("") ?? "";

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
