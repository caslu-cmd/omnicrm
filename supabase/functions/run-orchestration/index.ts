import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const AGENTS = [
  {
    key: "campanha",
    label: "Estratégia de Campanha",
    emoji: "🚀",
    wave: 1,
    system: `Você é estrategista de campanhas de marketing digital com foco em conversão.
Crie uma estratégia completa de campanha para o cliente com base no briefing.
Inclua: objetivo da campanha, público-alvo detalhado, canais (Meta Ads, Google, Orgânico),
mensagem central (headline + copy), peças necessárias, orçamento sugerido,
KPIs e meta de resultado esperado.
Retorne em Markdown com seções bem definidas.`,
  },
  {
    key: "calendario_editorial",
    label: "Calendário Editorial",
    emoji: "📅",
    wave: 2,
    system: `Você é especialista em planejamento editorial de marketing digital.
Crie um calendário editorial detalhado para 30 dias com base no briefing do cliente.
Estruture por semana, indicando: tema da semana, tipo de conteúdo (Reels, carrossel, stories, post feed),
plataforma (Instagram, Facebook, LinkedIn, TikTok), pauta/copy sugerida e melhor horário de publicação.
Retorne o calendário formatado em Markdown com tabelas semanais.`,
  },
  {
    key: "calendario_demandas",
    label: "Calendário de Demandas",
    emoji: "✅",
    wave: 2,
    system: `Você é especialista em gestão de projetos e demandas de agência de marketing.
Com base no briefing, crie um calendário de demandas operacionais para o próximo mês.
Liste cada demanda com: título, responsável (designer/copywriter/tráfego/social media),
prazo, prioridade (alta/média/baixa) e dependências.
Inclua marcos importantes (entregas, reuniões, datas de campanha).
Retorne formatado em Markdown com tabela e seção de marcos.`,
  },
  {
    key: "posts_redes_sociais",
    label: "Posts Redes Sociais",
    emoji: "📱",
    wave: 2,
    system: `Você é copywriter e estrategista de redes sociais especializado em marketing digital brasileiro.
Crie 5 posts prontos para publicação nas redes sociais do cliente.
Para cada post inclua: plataforma, formato (feed/reels/stories/carrossel),
legenda completa com emojis e hashtags, CTA, e briefing visual para o designer.
Escreva em português brasileiro com linguagem adequada ao segmento do cliente.
Retorne em Markdown com seção separada para cada post.`,
  },
  {
    key: "blogpost",
    label: "Artigo de Blog",
    emoji: "✍️",
    wave: 2,
    system: `Você é redator especializado em SEO e conteúdo de blog para marketing digital.
Escreva um artigo de blog completo e otimizado para SEO sobre um tema relevante para o cliente.
Inclua: título otimizado (com palavra-chave), meta description, introdução, 4-6 seções com H2/H3,
lista de palavras-chave secundárias, CTA final e sugestão de imagens.
Escreva em português brasileiro, tom educativo e envolvente. Mínimo 800 palavras.
Retorne em Markdown.`,
  },
];

interface AttachedFile {
  name: string;
  content: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function fetchUrl(url: string): Promise<string> {
  const resp = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ARIA-bot/1.0)" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ao buscar ${url}`);
  const ct = resp.headers.get("content-type") ?? "";
  const text = await resp.text();
  return ct.includes("html") ? stripHtml(text) : text;
}

async function callClaude(system: string, userMsg: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return data.content?.[0]?.text ?? "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const { briefing, client_name, client_industry, client_id, user_id, attached_files, urls } = await req.json();
  if (!briefing) return new Response(JSON.stringify({ error: "briefing obrigatório" }), { status: 400, headers: cors });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: run, error: runErr } = await supabase.from("orchestration_runs").insert({
    client_id: client_id ?? "unknown",
    user_id: user_id ?? null,
    briefing,
    status: "running",
  }).select().single();

  if (runErr || !run) {
    return new Response(JSON.stringify({ error: "Erro ao criar run" }), { status: 500, headers: cors });
  }

  const runId = run.id;

  for (const agent of AGENTS) {
    await supabase.from("orchestration_tasks").insert({
      run_id: runId,
      agent_key: agent.key,
      agent_label: agent.label,
      status: "pending",
    });
  }

  // Fetch URL contents server-side (no CORS issues)
  const urlContents: { url: string; content: string }[] = [];
  if (Array.isArray(urls) && urls.length) {
    await Promise.allSettled(
      (urls as string[]).map(async (url) => {
        try {
          const content = await fetchUrl(url);
          urlContents.push({ url, content: content.slice(0, 8000) });
        } catch (e: any) {
          urlContents.push({ url, content: `[Erro ao carregar: ${e.message}]` });
        }
      })
    );
  }

  // Build base user message
  const filesSection = (attached_files as AttachedFile[] | undefined)?.length
    ? "\n\n---\nARQUIVOS ANEXADOS:\n" +
      (attached_files as AttachedFile[]).map(f =>
        `### ${f.name}\n${f.content.slice(0, 8000)}`
      ).join("\n\n")
    : "";

  const urlsSection = urlContents.length
    ? "\n\n---\nCONTEÚDO DE URLs LIDAS:\n" +
      urlContents.map(u => `### ${u.url}\n${u.content}`).join("\n\n")
    : "";

  const baseUserMsg = `Cliente: ${client_name ?? "—"}
Segmento: ${client_industry ?? "—"}

BRIEFING:
${briefing}${filesSection}${urlsSection}

Gere o conteúdo solicitado com base nessas informações. Seja específico, criativo e prático.`;

  const stream = new ReadableStream({
    async start(controller) {
      const enc = (obj: object) =>
        new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);

      controller.enqueue(enc({ type: "run_id", run_id: runId }));

      // ── Wave 1: Campanha strategy (runs first so others can use it) ──
      const wave1 = AGENTS.filter(a => a.wave === 1);
      const wave2 = AGENTS.filter(a => a.wave === 2);

      for (const agent of wave1) {
        controller.enqueue(enc({ type: "agent_start", agent_key: agent.key, agent_label: agent.label }));
        await supabase.from("orchestration_tasks")
          .update({ status: "running", started_at: new Date().toISOString() })
          .eq("run_id", runId).eq("agent_key", agent.key);
      }

      const outputs: Record<string, string> = {};

      const wave1Results = await Promise.allSettled(
        wave1.map(agent => callClaude(agent.system, baseUserMsg).then(output => ({ agent, output })))
      );

      for (const result of wave1Results) {
        if (result.status === "fulfilled") {
          const { agent, output } = result.value;
          outputs[agent.key] = output;
          await supabase.from("orchestration_tasks")
            .update({ status: "done", output, completed_at: new Date().toISOString() })
            .eq("run_id", runId).eq("agent_key", agent.key);
          controller.enqueue(enc({ type: "agent_done", agent_key: agent.key, output }));
        } else {
          const agent = wave1[0];
          const errMsg = result.reason?.message ?? "Erro desconhecido";
          await supabase.from("orchestration_tasks")
            .update({ status: "error", error: errMsg, completed_at: new Date().toISOString() })
            .eq("run_id", runId).eq("agent_key", agent.key);
          controller.enqueue(enc({ type: "agent_error", agent_key: agent.key, error: errMsg }));
        }
      }

      // ── Wave 2: Remaining agents receive campanha strategy as context ──
      const estrategia = outputs["campanha"]
        ? `\n\n---\nESTRATÉGIA DE CAMPANHA (elaborada pelo agente de campanha):\n${outputs["campanha"].slice(0, 3000)}\n---\n\nUse esta estratégia como referência para alinhar seu entregável.`
        : "";

      const wave2UserMsg = baseUserMsg + estrategia;

      for (const agent of wave2) {
        controller.enqueue(enc({ type: "agent_start", agent_key: agent.key, agent_label: agent.label }));
        await supabase.from("orchestration_tasks")
          .update({ status: "running", started_at: new Date().toISOString() })
          .eq("run_id", runId).eq("agent_key", agent.key);
      }

      const wave2Results = await Promise.allSettled(
        wave2.map(agent => callClaude(agent.system, wave2UserMsg).then(output => ({ agent, output })))
      );

      for (const result of wave2Results) {
        const idx = wave2Results.indexOf(result);
        const agent = wave2[idx];
        if (result.status === "fulfilled") {
          const { output } = result.value;
          outputs[agent.key] = output;
          await supabase.from("orchestration_tasks")
            .update({ status: "done", output, completed_at: new Date().toISOString() })
            .eq("run_id", runId).eq("agent_key", agent.key);
          controller.enqueue(enc({ type: "agent_done", agent_key: agent.key, output }));
        } else {
          const errMsg = result.reason?.message ?? "Erro desconhecido";
          await supabase.from("orchestration_tasks")
            .update({ status: "error", error: errMsg, completed_at: new Date().toISOString() })
            .eq("run_id", runId).eq("agent_key", agent.key);
          controller.enqueue(enc({ type: "agent_error", agent_key: agent.key, error: errMsg }));
        }
      }

      // ── Final report ──
      controller.enqueue(enc({ type: "report_start" }));

      const allAgents = [...wave1, ...wave2];
      const reportCtx = allAgents.map(a =>
        `## ${a.emoji} ${a.label}\n${outputs[a.key] ? outputs[a.key].slice(0, 1500) + "..." : "[Falhou]"}`
      ).join("\n\n---\n\n");

      let report = "";
      try {
        report = await callClaude(
          `Você é ARIA, Diretora Estratégica da Calu Agência. Você acabou de coordenar seu time de especialistas.`,
          `Com base nos entregáveis abaixo, gere um RELATÓRIO EXECUTIVO em Markdown para o cliente.

O relatório deve ter:
1. **Resumo executivo** (2-3 parágrafos)
2. **O que foi criado** — liste cada entregável com emoji e 1 linha descritiva
3. **Próximos passos sugeridos** — 3-5 ações concretas
4. **Resultado esperado** — impacto projetado em 30 dias

---
${reportCtx}

Escreva em português brasileiro, tom profissional mas acolhedor.`
        );
      } catch {
        report = `# Relatório de Execução\n\nOrquestração concluída com sucesso. ${allAgents.length} agentes executaram suas tarefas.`;
      }

      // Generate share token and save
      const shareToken = crypto.randomUUID();
      await supabase.from("orchestration_runs").update({
        status: "done",
        report,
        share_token: shareToken,
        completed_at: new Date().toISOString(),
      }).eq("id", runId);

      controller.enqueue(enc({ type: "report", report }));
      controller.enqueue(enc({ type: "share_token", share_token: shareToken }));
      controller.enqueue(enc({ type: "concluido" }));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...cors,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});
