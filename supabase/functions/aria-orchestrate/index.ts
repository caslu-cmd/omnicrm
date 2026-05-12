// aria-orchestrate v16 — multi-post support with Ben (trends) + Beatriz + Marcela
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://proldgiyterqhthludlp.supabase.co/functions/v1";

interface AgentResult {
  agent: string;
  content: string;
  imageData?: string;
  mimeType?: string;
  imageUrl?: string;
}

// ─── Analyze demand and decide which agents to call ──────────────────────────
async function analyzeDemand(
  demand: string,
  clientContext: Record<string, unknown>,
  anthropicKey: string,
): Promise<{ agents: string[]; needsImage: boolean; aspectRatio: string; summary: string }> {
  const systemPrompt = `Voce e ARIA, orquestradora da Calu Agencia. Analise a demanda e retorne JSON puro.

Agentes disponiveis: beatriz (copy/legenda), carolina (estrategia/posicionamento), marina (calendario editorial), rafaela (trafego pago), pedro (calendario), marcela (design/imagem).

Regras:
- imagem/post/design/criativo -> incluir beatriz E marcela, needsImage: true
- copy/legenda/texto -> incluir beatriz
- estrategia/posicionamento -> incluir carolina
- calendario/planejamento -> incluir marina ou pedro
- anuncio/trafego -> incluir rafaela e beatriz
- Sempre incluir ao menos um agente

aspectRatio: "3:4" feed portrait, "1:1" quadrado, "9:16" stories/reels, "16:9" banner.

Retorne APENAS JSON valido sem markdown:
{"agents":["beatriz","marcela"],"needsImage":true,"aspectRatio":"3:4","summary":"Post de feed com copy e imagem"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: `Demanda: "${demand}"\nCliente: ${String(clientContext.name ?? "nao informado")}, ${String(clientContext.industry ?? "")}`,
      }],
    }),
  });

  if (!res.ok) return { agents: ["beatriz"], needsImage: false, aspectRatio: "3:4", summary: demand };

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "{}";
  try {
    const fromBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]?.trim();
    const fromRaw   = text.match(/(\{[\s\S]*\})/)?.[1]?.trim();
    return JSON.parse(fromBlock ?? fromRaw ?? text);
  } catch {
    return { agents: ["beatriz"], needsImage: false, aspectRatio: "3:4", summary: demand };
  }
}

// ─── Call chat-ai for a specific agent ───────────────────────────────────────
async function callAgent(
  agentId: string,
  message: string,
  authHeader: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat-ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
    },
    body: JSON.stringify({ message, agentId, conversationHistory: [] }),
  });

  if (!res.ok) {
    const err = await res.text();
    return `[${agentId}: erro ${res.status} - ${err.slice(0, 150)}]`;
  }

  const data = await res.json();
  return data.response ?? data.message ?? JSON.stringify(data);
}

// ─── Call generate-image (Ideogram via Marcela) ───────────────────────────────
async function callGenerateImage(
  prompt: string,
  aspectRatio: string,
  clientContext: Record<string, unknown>,
  beatrizCopy: string,
  carolinaStrategy: string,
  authHeader: string,
): Promise<{ imageData?: string; mimeType?: string; imageUrl?: string; briefing?: string }> {
  const res = await fetch(`${BASE_URL}/generate-image`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
    },
    body: JSON.stringify({ prompt, aspectRatio, clientContext, beatrizCopy, carolinaStrategy }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { briefing: `Erro ao gerar imagem: ${err.slice(0, 200)}` };
  }

  return await res.json();
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const { demand, clientContext = {} } = await req.json();

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY nao configurada" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (!demand) {
      return new Response(JSON.stringify({ error: "demand obrigatorio" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Step 1: ARIA analyzes the demand and plans which agents to use
    const plan = await analyzeDemand(demand, clientContext, anthropicKey);

    const allResults: AgentResult[] = [];
    let copy = "";
    let strategy = "";
    let calendar = "";
    let trafficPlan = "";
    let imageData: string | undefined;
    let mimeType: string | undefined;
    let imageUrl: string | undefined;

    const ctx = clientContext as Record<string, unknown>;

    // Step 2: Call each agent in sequence, passing context forward
    for (const agentId of plan.agents) {
      if (agentId === "marcela") continue; // handled separately after copy

      let message = demand;

      if (agentId === "carolina") {
        message = `Desenvolva uma estrategia completa para: "${demand}"\nCliente: ${String(ctx.name ?? "")}, ${String(ctx.industry ?? "")}. Cor da marca: ${String(ctx.brandColor ?? "")}`;
      } else if (agentId === "beatriz") {
        const stratCtx = strategy ? `\nEstrategia da Carolina:\n${strategy.slice(0, 600)}` : "";
        message = `Escreva o copy para: "${demand}"\nCliente: ${String(ctx.name ?? "")}, ${String(ctx.industry ?? "")}${stratCtx}`;
      } else if (agentId === "marina" || agentId === "pedro") {
        const stratCtx = strategy ? `\nEstrategia:\n${strategy.slice(0, 400)}` : "";
        message = `Monte um calendario editorial para: "${demand}"\nCliente: ${String(ctx.name ?? "")}, ${String(ctx.industry ?? "")}${stratCtx}`;
      } else if (agentId === "rafaela") {
        const stratCtx = strategy ? `\nEstrategia:\n${strategy.slice(0, 400)}` : "";
        message = `Crie um plano de trafego pago para: "${demand}"\nCliente: ${String(ctx.name ?? "")}, ${String(ctx.industry ?? "")}${stratCtx}`;
      }

      const content = await callAgent(agentId, message, authHeader);

      if (agentId === "carolina") strategy = content;
      else if (agentId === "beatriz") copy = content;
      else if (agentId === "marina" || agentId === "pedro") calendar = content;
      else if (agentId === "rafaela") trafficPlan = content;

      allResults.push({ agent: agentId, content });
    }

    // Step 3: If image needed, call generate-image with copy + strategy context
    if (plan.needsImage || plan.agents.includes("marcela")) {
      const imgResult = await callGenerateImage(
        demand,
        plan.aspectRatio ?? "3:4",
        ctx,
        copy,
        strategy,
        authHeader,
      );

      imageData = imgResult.imageData;
      mimeType  = imgResult.mimeType;
      imageUrl  = imgResult.imageUrl;

      allResults.push({
        agent: "marcela",
        content: imgResult.imageUrl
          ? "Imagem gerada com sucesso pelo Ideogram!"
          : (imgResult.briefing ?? "Briefing de design criado."),
        imageData,
        mimeType,
        imageUrl,
      });
    }

    return new Response(
      JSON.stringify({
        plan: plan.summary,
        copy,
        strategy,
        calendar,
        trafficPlan,
        imageData,
        mimeType,
        imageUrl,
        aspectRatio: plan.aspectRatio,
        allResults,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
