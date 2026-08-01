// aria-orchestrate v17 — Ben trends integration + auto-schedule to scheduled_posts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

interface PostDraft {
  caption: string;
  platforms: string[];
  scheduled_at: string | null;
  media_type: string;
  media_url?: string;
}

// ─── Ben: trend research ──────────────────────────────────────────────────────
async function callBen(
  nicho: string,
  clientName: string,
  authHeader: string,
): Promise<string> {
  try {
    const res = await fetch(`${BASE_URL}/ben-trends`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": authHeader },
      body: JSON.stringify({ nicho, plataforma: "todas", client_name: clientName }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return String(data.content ?? "");
  } catch {
    return "";
  }
}

// ─── Analyze demand and decide which agents to call ──────────────────────────
async function analyzeDemand(
  demand: string,
  clientContext: Record<string, unknown>,
  anthropicKey: string,
  /** Só os NOMES do material anexado: o plano muda se há briefing para ler. */
  material: string[] = [],
): Promise<{ agents: string[]; needsImage: boolean; aspectRatio: string; summary: string }> {
  const systemPrompt = `Voce e Aira, orquestradora da Calu Agencia. Analise a demanda e retorne JSON puro.

Agentes disponiveis: beatriz (copy/legenda), carolina (estrategia/posicionamento), marina (calendario editorial), rafaela (trafego pago), pedro (calendario), marcela (design/imagem).

Regras:
- imagem/post/design/criativo -> incluir beatriz E marcela, needsImage: true
- copy/legenda/texto -> incluir beatriz
- estrategia/posicionamento -> incluir carolina
- calendario/planejamento -> incluir marina ou pedro
- anuncio/trafego -> incluir rafaela e beatriz
- plano de marketing completo -> incluir carolina, beatriz, marina E marcela
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
        content: `Demanda: "${demand}"\nCliente: ${String(clientContext.name ?? "nao informado")}, ${String(clientContext.industry ?? "")}`
          + (material.length ? `\nMaterial anexado que os agentes vao receber: ${material.join(", ")}` : ""),
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
/**
 * Chama um agente pela `chat-ai`.
 *
 * Estava quebrada de duas formas ao mesmo tempo, e por isso a orquestração do
 * time nunca produziu nada de útil:
 *  1. mandava `{ message, conversationHistory }`, mas a `chat-ai` exige
 *     `messages: [...]` e responde **400 "messages array required"**. Ou seja:
 *     TODO agente devolvia uma string de erro no lugar do trabalho.
 *  2. lia `data.response`/`data.message`, e a `chat-ai` devolve `data.content` —
 *     então, mesmo com o corpo certo, viria o JSON cru como se fosse a resposta.
 *
 * Agora também repassa documentos e links: era o que faltava para o agente que
 * depende de um arquivo ou do site do cliente conseguir trabalhar.
 */
async function callAgent(
  agentId: string,
  message: string,
  authHeader: string,
  extras: { clientContext?: Record<string, unknown>; documentos?: unknown; urls?: unknown } = {},
): Promise<string> {
  // Um agente lento não pode prender a fila inteira: a função tem teto de
  // tempo na plataforma e a orquestração morreria esperando.
  const controle = new AbortController();
  const t = setTimeout(() => controle.abort(), 110_000);
  try {
    const res = await fetch(`${BASE_URL}/chat-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": authHeader },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
        agentId,
        clientContext: extras.clientContext,
        documentos: extras.documentos,
        urls: extras.urls,
        maxTokens: 4000,
      }),
      signal: controle.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      return `[${agentId}: erro ${res.status} - ${err.slice(0, 200)}]`;
    }

    const data = await res.json();
    const texto = data.content ?? data.response ?? data.message;
    return typeof texto === "string" && texto.trim()
      ? texto
      : `[${agentId}: respondeu vazio]`;
  } catch (e) {
    const motivo = e instanceof Error && e.name === "AbortError"
      ? "demorou demais e foi interrompido"
      : e instanceof Error ? e.message : "falha desconhecida";
    return `[${agentId}: ${motivo}]`;
  } finally {
    clearTimeout(t);
  }
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
    headers: { "Content-Type": "application/json", "Authorization": authHeader },
    body: JSON.stringify({ prompt, aspectRatio, clientContext, beatrizCopy, carolinaStrategy }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { briefing: `Erro ao gerar imagem: ${err.slice(0, 200)}` };
  }

  return await res.json();
}

// ─── Parse copy + calendar into structured posts with schedules ───────────────
async function structurePosts(
  copy: string,
  calendar: string,
  strategy: string,
  trends: string,
  platforms: string[],
  imageUrl: string | undefined,
  anthropicKey: string,
): Promise<PostDraft[]> {
  const today = new Date();
  // Start scheduling from tomorrow
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 1);
  const startStr = startDate.toISOString().split("T")[0];

  const prompt = `Analise o copy e calendário gerados e extraia posts individuais estruturados para agendar.

COPY GERADO:
${copy.slice(0, 2000)}

CALENDÁRIO EDITORIAL:
${calendar.slice(0, 600)}

ESTRATÉGIA:
${strategy.slice(0, 300)}

TENDÊNCIAS (Ben):
${trends.slice(0, 300)}

Retorne SOMENTE um array JSON com 5 a 10 posts individuais. Cada objeto:
{
  "caption": "legenda completa com emojis e hashtags",
  "platforms": ["instagram"],
  "scheduled_at": "2026-06-03T19:00:00-03:00",
  "media_type": "image"
}

Regras obrigatórias:
- Data de início: ${startStr}
- Distribua ao longo de 4 semanas a partir desta data
- Plataformas disponíveis: ${platforms.join(", ")}
- Melhores horários Instagram: 12h (Ter/Qui) e 19h (Seg/Qua/Sex)
- Melhores horários Facebook: 13h (Ter/Qui) e 10h (Seg/Qua)
- Alterne plataformas quando houver mais de uma disponível
- Sem posts aos domingos
- media_type: "image" para posts visuais, "text" para somente texto (Facebook)
- APENAS o array JSON, sem markdown, sem explicação alguma`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const text: string = data.content?.[0]?.text ?? "[]";

  let posts: PostDraft[] = [];
  try {
    const fromBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]?.trim();
    const fromRaw   = text.match(/(\[[\s\S]*\])/)?.[1]?.trim();
    posts = JSON.parse(fromBlock ?? fromRaw ?? "[]");
  } catch {
    return [];
  }

  if (!Array.isArray(posts)) return [];

  // If an image was generated, attach it to image posts
  return posts.map(p => ({
    caption:      String(p.caption ?? ""),
    platforms:    Array.isArray(p.platforms) ? p.platforms : platforms.slice(0, 1),
    scheduled_at: p.scheduled_at ?? null,
    media_type:   String(p.media_type ?? "image"),
    media_url:    p.media_type !== "text" && imageUrl ? imageUrl : undefined,
  }));
}

// ─── Save structured posts to scheduled_posts ─────────────────────────────────
async function saveScheduledPosts(
  posts: PostDraft[],
  userId: string,
  clientId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<{ scheduled: number; drafts: number }> {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const rows = posts.map(p => {
    // Posts with media or text-only Facebook posts are ready to schedule
    // Instagram posts without media go as draft (require image to publish)
    const needsMedia = p.platforms.some(pl => pl === "instagram") && !p.media_url;
    return {
      user_id:      userId,
      client_id:    clientId,
      caption:      p.caption,
      platforms:    p.platforms,
      media_type:   p.media_type,
      media_url:    p.media_url ?? null,
      scheduled_at: p.scheduled_at,
      status:       needsMedia ? "draft" : "scheduled",
    };
  });

  const { error } = await supabase.from("scheduled_posts").insert(rows);
  if (error) {
    console.error("Error saving scheduled_posts:", error.message);
    return { scheduled: 0, drafts: 0 };
  }

  const scheduled = rows.filter(r => r.status === "scheduled").length;
  const drafts    = rows.filter(r => r.status === "draft").length;
  return { scheduled, drafts };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const {
      demand,
      clientContext = {},
      userId,
      autoSchedule = false,
      platforms,
      /** Anexos já extraídos pelo app e links a ler; repassados a cada agente. */
      documentos,
      urls,
    } = await req.json();

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

    const ctx = clientContext as Record<string, unknown>;
    const clientId = String(ctx.id ?? "");
    const effectivePlatforms: string[] = Array.isArray(platforms) && platforms.length > 0
      ? platforms
      : ["instagram"];

    // Step 1: Aira analyzes the demand and plans which agents to use
    const nomesDoMaterial = [
      ...(Array.isArray(documentos) ? documentos : [])
        .map((d) => String((d as { nome?: string; name?: string })?.nome ?? (d as { name?: string })?.name ?? ""))
        .filter(Boolean),
      ...(Array.isArray(urls) ? urls : []).map(String),
    ];
    const plan = await analyzeDemand(demand, ctx, anthropicKey, nomesDoMaterial);

    // Step 1.5: Ben researches current trends for this niche
    const nicho = String(ctx.industry ?? ctx.nicho ?? "");
    const clientName = String(ctx.name ?? "");
    let trends = "";
    if (nicho || clientName) {
      console.log("Ben pesquisando tendências para:", nicho || clientName);
      trends = await callBen(nicho || clientName, clientName, authHeader);
    }

    const allResults: AgentResult[] = [];
    if (trends) {
      allResults.push({ agent: "ben", content: trends });
    }

    let copy        = "";
    let strategy    = "";
    let calendar    = "";
    let trafficPlan = "";
    let imageData: string | undefined;
    let mimeType:  string | undefined;
    let imageUrl:  string | undefined;

    // Step 2: Call each agent in sequence, injecting Ben's trends where relevant
    for (const agentId of plan.agents) {
      if (agentId === "marcela") continue; // handled after copy

      let message = demand;
      const trendsSnippet = trends
        ? `\n\nTendências atuais (pesquisa Ben):\n${trends.slice(0, 500)}`
        : "";

      if (agentId === "carolina") {
        message = `Desenvolva uma estrategia completa para: "${demand}"\nCliente: ${clientName}, ${String(ctx.industry ?? "")}. Cor da marca: ${String(ctx.brandColor ?? "")}${trendsSnippet}`;
      } else if (agentId === "beatriz") {
        const stratCtx = strategy ? `\nEstrategia da Carolina:\n${strategy.slice(0, 600)}` : "";
        message = `Escreva o copy para: "${demand}"\nCliente: ${clientName}, ${String(ctx.industry ?? "")}${stratCtx}${trendsSnippet}`;
      } else if (agentId === "marina" || agentId === "pedro") {
        const stratCtx = strategy ? `\nEstrategia:\n${strategy.slice(0, 400)}` : "";
        message = `Monte um calendario editorial para: "${demand}"\nCliente: ${clientName}, ${String(ctx.industry ?? "")}${stratCtx}${trendsSnippet}`;
      } else if (agentId === "rafaela") {
        const stratCtx = strategy ? `\nEstrategia:\n${strategy.slice(0, 400)}` : "";
        message = `Crie um plano de trafego pago para: "${demand}"\nCliente: ${clientName}, ${String(ctx.industry ?? "")}${stratCtx}`;
      }

      const content = await callAgent(agentId, message, authHeader, {
        clientContext: ctx,
        documentos,
        urls,
      });

      if (agentId === "carolina")                   strategy    = content;
      else if (agentId === "beatriz")               copy        = content;
      else if (agentId === "marina" || agentId === "pedro") calendar = content;
      else if (agentId === "rafaela")               trafficPlan = content;

      allResults.push({ agent: agentId, content });
    }

    // Step 3: Generate image if needed
    if (plan.needsImage || plan.agents.includes("marcela")) {
      const imgResult = await callGenerateImage(
        demand, plan.aspectRatio ?? "3:4", ctx, copy, strategy, authHeader,
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

    // Step 4: Auto-schedule — structure posts and save to scheduled_posts
    let scheduledCount = 0;
    let draftCount     = 0;

    if (autoSchedule && userId && clientId) {
      const supabaseUrl    = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && serviceRoleKey) {
        console.log("Estruturando posts para agendamento...");
        const posts = await structurePosts(
          copy, calendar, strategy, trends, effectivePlatforms, imageUrl, anthropicKey,
        );

        if (posts.length > 0) {
          const counts = await saveScheduledPosts(
            posts, userId, clientId, supabaseUrl, serviceRoleKey,
          );
          scheduledCount = counts.scheduled;
          draftCount     = counts.drafts;
          console.log(`Agendados: ${scheduledCount}, Rascunhos: ${draftCount}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        plan:          plan.summary,
        copy,
        strategy,
        calendar,
        trafficPlan,
        trendsReport:  trends,
        imageData,
        mimeType,
        imageUrl,
        aspectRatio:   plan.aspectRatio,
        allResults,
        scheduledCount,
        draftCount,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
