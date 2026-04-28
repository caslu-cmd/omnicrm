import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { demand, clientContext } = await req.json();
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const ctx = clientContext ?? {};
    const systemPrompt = `Você é ARIA, a IA orquestradora da agência que atende ${ctx.name ?? "um cliente"} (${ctx.industry ?? "segmento não informado"}).

Você coordena um time de agentes especialistas:
- beatriz: Copywriter — textos, legendas, artigos, roteiros, CTAs
- isadora: Designer — peças visuais, imagens, banners (formatos: 1:1 feed, 9:16 stories/reels, 16:9 banner/capa, 4:3 slide, 3:4 retrato)
- rafaela: Gestora de Tráfego — campanhas pagas, Google Ads, Meta Ads
- lucas: Analista de Dados — métricas, relatórios, insights
- marina: Social Media — calendário, agendamento, engajamento
- carolina: Estrategista — posicionamento, pauta editorial, brand

Contexto do cliente:
- Nome: ${ctx.name ?? "não informado"}
- Segmento: ${ctx.industry ?? "não informado"}
- Cor da marca: ${ctx.brandColor ?? "não informada"}
- Campanhas ativas: ${(ctx.campaigns ?? []).join(", ") || "nenhuma"}
- Temas recentes: ${(ctx.recentThemes ?? []).join(" | ") || "nenhum"}
- Próxima ação: ${ctx.nextAction ?? "não definida"}

Analise a demanda e coordene o time. Gere mensagens específicas para cada agente envolvido. Quando precisar de uma peça visual, Aria pede para Isadora. Quando precisar de copy, pede para Beatriz. Os agentes também podem conversar entre si (ex: Beatriz pede para Isadora criar uma imagem para o copy dela).

RETORNE APENAS um JSON válido com esta estrutura exata:
{
  "plan": "análise em 2-3 frases do que será feito",
  "messages": [
    {
      "id": "msg_1",
      "from": "aria",
      "to": "beatriz",
      "content": "instrução específica em português",
      "action": "write_copy"
    },
    {
      "id": "msg_2",
      "from": "aria",
      "to": "isadora",
      "content": "descrição detalhada da peça visual",
      "action": "generate_image",
      "imageParams": { "aspectRatio": "1:1" }
    },
    {
      "id": "msg_3",
      "from": "beatriz",
      "to": "aria",
      "content": "resposta da Beatriz com o copy criado (simulado de forma realista)",
      "action": "respond"
    }
  ]
}

Valores válidos para action: write_copy, generate_image, analyze, plan, schedule, respond
Sempre inclua respostas simuladas dos agentes (exceto Isadora — ela responde com imagem gerada automaticamente).
Escreva tudo em português. Seja específico e profissional.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: `Demanda: "${demand}"` }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: response.status, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "{}";

    let result;
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
      result = JSON.parse(jsonMatch[1].trim());
    } catch {
      result = { plan: text, messages: [] };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
