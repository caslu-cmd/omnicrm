import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Lovable AI Gateway (OpenAI-compatible). Returns text content.
async function callAI(apiKey: string, prompt: string, maxTokens = 1024): Promise<string> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw new Error(`AI Gateway ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp",
  website: "Website", indicacao: "Indicação", linkedin: "LinkedIn",
  email: "E-mail", outro: "Outro",
};

const ACT_LABELS: Record<string, string> = {
  note: "Nota", call: "Ligação", email: "E-mail enviado", meeting: "Reunião",
  task: "Tarefa", whatsapp: "WhatsApp", instagram: "Instagram DM",
  facebook: "Facebook", stage_change: "Mudança de etapa", status_change: "Mudança de status",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return respond({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    // Decode JWT
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (!payload?.sub) return respond({ error: "Unauthorized" }, 401);
      userId = payload.sub;
    } catch {
      return respond({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon   = Deno.env.get("SUPABASE_ANON_KEY")!;
    const aiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";

    if (!aiKey) return respond({ error: "LOVABLE_API_KEY não configurada" }, 503);

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const body   = await req.json();
    const action = body.action ?? "";

    // ── Generate lead strategy ────────────────────────────────
    if (action === "generate-strategy") {
      const { contact_id } = body;
      if (!contact_id) return respond({ error: "contact_id obrigatório" }, 400);

      // Fetch contact
      const { data: contact, error: cErr } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contact_id)
        .eq("user_id", userId)
        .single();
      if (cErr || !contact) return respond({ error: "Contato não encontrado" }, 404);

      // Fetch last 15 activities
      const { data: activities } = await supabase
        .from("contact_activities")
        .select("type,content,created_at,task_done")
        .eq("contact_id", contact_id)
        .order("created_at", { ascending: false })
        .limit(15);

      // Calculate heat
      const score = contact.score ?? 0;
      const last  = contact.last_interaction ? new Date(contact.last_interaction) : null;
      const days  = last ? (Date.now() - last.getTime()) / 86_400_000 : 999;
      const heat  = score >= 70 || days <= 7 ? "Quente 🔥"
                  : score >= 40 || days <= 30 ? "Morno 🟡" : "Frio 🔵";

      // Build context
      const actSummary = (activities ?? []).map(a =>
        `- [${new Date(a.created_at).toLocaleDateString("pt-BR")}] ${ACT_LABELS[a.type] ?? a.type}${a.content ? `: "${a.content}"` : ""}${a.task_done ? " ✅" : ""}`
      ).join("\n") || "Nenhuma atividade registrada ainda.";

      const prompt = `Você é um especialista em estratégias de vendas e marketing para agências digitais.

## Dados do Lead

- **Nome**: ${contact.name}
- **Empresa**: ${contact.company || "Não informado"}
- **E-mail**: ${contact.email || "Não informado"}
- **Telefone**: ${contact.phone || "Não informado"}
- **Origem**: ${SOURCE_LABELS[contact.channel ?? ""] ?? contact.channel ?? "Não informado"}
- **Status**: ${contact.status || "Novo"}
- **Score**: ${score}/100
- **Temperatura**: ${heat}
- **Última interação**: ${last ? `${Math.floor(days)} dias atrás (${last.toLocaleDateString("pt-BR")})` : "Nunca"}

## Histórico de Interações
${actSummary}

## Sua tarefa

Com base nesses dados, gere uma estratégia de vendas personalizada e objetiva. Responda SOMENTE com um JSON válido no seguinte formato (sem markdown, sem texto fora do JSON):

{
  "perfil": "Análise breve do perfil deste lead em 2-3 frases. Qual o momento dele e o que isso indica.",
  "abordagem": "Como abordar este lead de forma personalizada. Tom, canal ideal, momento certo.",
  "pontos_chave": ["ponto 1", "ponto 2", "ponto 3"],
  "proxima_acao": "Uma ação específica e concreta para fazer AGORA com este lead.",
  "alertas": ["alerta ou risco 1 se houver", "alerta 2 se houver"],
  "score_justificativa": "Por que este lead tem score ${score} e o que fazer para aumentá-lo."
}`;

      const raw = (await callAI(aiKey, prompt, 1024)).trim();

      // Parse JSON — strip any accidental markdown fences
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      let strategy: unknown;
      try { strategy = JSON.parse(cleaned); }
      catch { return respond({ error: "IA retornou formato inesperado.", raw }, 500); }

      return respond({ strategy });
    }

    // ── Generate post draft ───────────────────────────────────────
    if (action === "generate-draft") {
      const { client_id, client_name, platforms, tone, topic, agent_id, agent_name } = body;
      if (!client_id || !platforms?.length || !topic) return respond({ error: "client_id, platforms e topic são obrigatórios" }, 400);

      const prompt = `Você é ${agent_name ?? "um especialista em marketing digital"} criando um post para o cliente "${client_name ?? "cliente"}".

## Briefing
- **Plataformas**: ${(platforms as string[]).join(", ")}
- **Tom**: ${tone ?? "profissional e envolvente"}
- **Tema/objetivo**: ${topic}

## Sua tarefa
Crie um post excelente e otimizado para as plataformas indicadas. Responda SOMENTE com JSON válido:

{
  "caption": "Legenda completa do post com emojis e hashtags. Máx 2200 caracteres. Adapte o tom para as plataformas.",
  "hashtags": ["hashtag1", "hashtag2"],
  "best_time": "Melhor horário para publicar (ex: 19:00 de terça)",
  "rationale": "Por que esse conteúdo vai funcionar — em 1 frase."
}`;

      const raw = (await callAI(aiKey, prompt, 1024)).trim();
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      let draft: { caption: string; hashtags: string[]; best_time: string; rationale: string };
      try { draft = JSON.parse(cleaned); }
      catch { return respond({ error: "IA retornou formato inesperado." }, 500); }

      // Save as pending_approval post
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      const { data: post, error: insertErr } = await supabase.from("scheduled_posts").insert({
        user_id: userId,
        client_id,
        platforms,
        caption: draft.caption,
        media_url: null,
        media_type: "text",
        status: "pending_approval",
        agent_id: agent_id ?? null,
      }).select().single();
      if (insertErr) return respond({ error: insertErr.message }, 500);

      return respond({ success: true, post, draft });
    }

    // ── Generate full campaign (multiple posts) ───────────────────
    if (action === "generate-campaign") {
      const { client_id, client_name, agent_id, agent_name, goal, platforms, tone, num_posts } = body;
      if (!client_id || !goal || !platforms?.length) return respond({ error: "client_id, goal e platforms são obrigatórios" }, 400);

      const count = Math.min(Math.max(parseInt(num_posts ?? "5", 10), 2), 7);

      const prompt = `Você é ${agent_name ?? "Marina, especialista em Social Media"} planejando uma campanha completa para o cliente "${client_name ?? "cliente"}".

## Briefing da Campanha
- **Objetivo**: ${goal}
- **Plataformas**: ${(platforms as string[]).join(", ")}
- **Tom**: ${tone ?? "profissional e envolvente"}
- **Quantidade de posts**: ${count}

## Sua tarefa
Crie ${count} posts distintos para formar uma campanha coesa e eficaz. Cada post deve ter um ângulo diferente (ex: educativo, prova social, bastidores, oferta, pergunta para engajamento). Responda SOMENTE com JSON válido:

{
  "campaign_name": "Nome criativo e curto para a campanha",
  "campaign_goal": "Objetivo resumido em 1 frase",
  "posts": [
    {
      "day": 1,
      "angle": "Tipo do post (educativo/prova social/etc)",
      "caption": "Legenda completa com emojis e hashtags",
      "hashtags": ["tag1", "tag2"],
      "best_time": "Ex: segunda às 19h",
      "rationale": "Por que esse post vai funcionar — 1 frase"
    }
  ]
}`;

      const raw = (await callAI(aiKey, prompt, 3000)).trim();
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      let campaign: { campaign_name: string; campaign_goal: string; posts: Array<{ day: number; angle: string; caption: string; hashtags: string[]; best_time: string; rationale: string }> };
      try { campaign = JSON.parse(cleaned); }
      catch { return respond({ error: "IA retornou formato inesperado." }, 500); }

      // Insert all posts as pending_approval
      const inserts = campaign.posts.map(p => ({
        user_id: userId,
        client_id,
        platforms,
        caption: p.caption,
        media_url: null,
        media_type: "text",
        status: "pending_approval",
        agent_id: agent_id ?? null,
        performance_note: `Campanha: ${campaign.campaign_name} | Dia ${p.day} — ${p.angle}`,
      }));

      const { data: posts, error: insertErr } = await supabase.from("scheduled_posts").insert(inserts).select();
      if (insertErr) return respond({ error: insertErr.message }, 500);

      return respond({ success: true, campaign_name: campaign.campaign_name, campaign_goal: campaign.campaign_goal, posts_created: posts?.length ?? 0, campaign });
    }

    // ── Analyze post performance ──────────────────────────────────
    if (action === "analyze-performance") {
      const { client_id } = body;
      if (!client_id) return respond({ error: "client_id obrigatório" }, 400);

      const { data: posts } = await supabase.from("scheduled_posts")
        .select("id,platforms,caption,status,published_at,error_message,performance_note")
        .eq("user_id", userId).eq("client_id", client_id)
        .eq("status", "published").order("published_at", { ascending: false }).limit(10);

      if (!posts?.length) return respond({ insights: [], message: "Nenhum post publicado ainda." });

      const summary = posts.map((p, i) =>
        `Post ${i + 1} [${(p.platforms as string[]).join("+")}] publicado em ${p.published_at ? new Date(p.published_at).toLocaleDateString("pt-BR") : "?"}:\n"${(p.caption ?? "").slice(0, 100)}..."`
      ).join("\n\n");

      const prompt = `Você é um analista de marketing digital analisando os últimos posts publicados para um cliente.

## Posts recentes
${summary}

## Sua tarefa
Analise os padrões e gere insights acionáveis. Responda SOMENTE com JSON:

{
  "insights": [
    {
      "tipo": "melhoria | padrão | alerta",
      "titulo": "Título curto do insight",
      "descricao": "O que observou e o que fazer — 2 frases no máximo.",
      "acao": "Ação específica para o próximo post."
    }
  ],
  "proxima_sugestao": "Sugestão concreta para o próximo post baseada nos dados."
}`;

      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = (message.content[0] as { type: string; text: string }).text.trim();
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      let result: unknown;
      try { result = JSON.parse(cleaned); }
      catch { return respond({ error: "IA retornou formato inesperado." }, 500); }

      return respond(result);
    }

    return respond({ error: "Ação inválida" }, 400);
  } catch (err) {
    console.error("ai-crm error:", err);
    return respond({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
