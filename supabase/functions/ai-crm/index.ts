import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.39.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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
    const anthropicKey   = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

    if (!anthropicKey) return respond({ error: "ANTHROPIC_API_KEY não configurada" }, 503);

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

      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = (message.content[0] as { type: string; text: string }).text.trim();

      // Parse JSON — strip any accidental markdown fences
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      let strategy: unknown;
      try { strategy = JSON.parse(cleaned); }
      catch { return respond({ error: "IA retornou formato inesperado.", raw }, 500); }

      return respond({ strategy });
    }

    return respond({ error: "Ação inválida" }, 400);
  } catch (err) {
    console.error("ai-crm error:", err);
    return respond({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
