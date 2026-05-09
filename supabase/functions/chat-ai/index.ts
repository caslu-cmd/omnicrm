import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

const DRAFT_POST_TOOL = {
  name: "draft_post",
  description: "Salva um rascunho de post para revisão e publicação nas redes sociais do cliente. Use esta ferramenta para cada post completo criado — caption pronto para publicar, informando as plataformas desejadas.",
  input_schema: {
    type: "object",
    properties: {
      caption: {
        type: "string",
        description: "Texto/legenda completo do post, pronto para publicar (com emojis, hashtags e CTA se aplicável)",
      },
      platforms: {
        type: "array",
        items: { type: "string", enum: ["instagram", "facebook", "linkedin"] },
        description: "Plataformas onde publicar: instagram, facebook, linkedin",
      },
      media_description: {
        type: "string",
        description: "Descrição da imagem ou vídeo sugerido para acompanhar este post (opcional)",
      },
      scheduled_at: {
        type: "string",
        description: "Data e hora ISO 8601 para agendar o post (opcional — deixe em branco para rascunho sem data)",
      },
    },
    required: ["caption", "platforms"],
  },
};

type ContentBlock = { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      messages,
      systemPrompt,
      maxTokens,
      model,
      enableThinking,
      thinkingBudget,
      enableDraftTool,
      client_id,
      user_id,
    } = await req.json();

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

    const selectedModel = anthropicKey ? (model ?? "claude-sonnet-4-6") : "claude-sonnet-4-6";

    const budget = thinkingBudget ?? 8000;
    const resolvedMaxTokens = enableThinking
      ? Math.max(maxTokens ?? 8000, budget + 2000)
      : (maxTokens ?? 1024);

    const useToolUse = enableDraftTool === true && !!client_id && !!user_id;
    const tools = useToolUse ? [DRAFT_POST_TOOL] : undefined;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callClaude = async (msgs: unknown[]) => {
      const body: Record<string, unknown> = {
        model: selectedModel,
        max_tokens: resolvedMaxTokens,
        system: systemPrompt ?? SYSTEM_PROMPT,
        messages: msgs,
      };
      if (enableThinking) {
        body.thinking = { type: "enabled", budget_tokens: budget };
      }
      if (tools) {
        body.tools = tools;
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
        const errText = await response.text();
        throw new Error(errText);
      }
      return response.json() as Promise<{ stop_reason: string; content: ContentBlock[] }>;
    };

    // Stream whitespace as keep-alive to avoid edge function 150s IDLE_TIMEOUT.
    // JSON.parse ignores leading whitespace, so the client's res.json() still works.
    const encoder = new TextEncoder();
    const stream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = stream.writable.getWriter();
    const keepAlive = setInterval(() => {
      writer.write(encoder.encode(" ")).catch(() => {});
    }, 10000);

    const response = new Response(stream.readable, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    (async () => {
      try {
        let currentMessages: unknown[] = [...messages];
        const postsCreated: unknown[] = [];
        let finalContent = "";

        let data = await callClaude(currentMessages);
        let iterations = 0;

    while (data.stop_reason === "tool_use" && iterations < 5) {
      iterations++;

      const toolUseBlocks = data.content.filter((b) => b.type === "tool_use");
      const textBlocks    = data.content.filter((b) => b.type === "text");
      const roundText     = textBlocks.map((b) => b.text ?? "").join("");
      if (roundText) finalContent += roundText + "\n\n";

      currentMessages = [...currentMessages, { role: "assistant", content: data.content }];

      const toolResults: unknown[] = [];
      for (const block of toolUseBlocks) {
        if (block.name === "draft_post") {
          const input = block.input as { caption?: string; platforms?: string[]; scheduled_at?: string };
          try {
            const sb = createClient(supabaseUrl, serviceKey);
            const { data: post, error: insertError } = await sb
              .from("scheduled_posts")
              .insert({
                user_id,
                client_id,
                platforms: input.platforms ?? [],
                caption:   input.caption ?? "",
                media_url: null,
                media_type: "text",
                scheduled_at: input.scheduled_at || null,
                status: "pending_approval",
              })
              .select()
              .single();

            if (insertError) {
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify({ success: false, error: insertError.message }),
              });
            } else {
              postsCreated.push(post);
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify({ success: true, message: "Rascunho salvo! Será exibido na aba Social para aprovação." }),
              });
            }
          } catch (e) {
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify({ success: false, error: String(e) }),
            });
          }
        } else {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify({ success: false, error: "Ferramenta não reconhecida" }),
          });
        }
      }

      currentMessages = [...currentMessages, { role: "user", content: toolResults }];
      data = await callClaude(currentMessages);
    }

    const lastText = data.content
      ?.filter((b) => b.type === "text")
      ?.map((b) => b.text ?? "")
      ?.join("") ?? "";

    finalContent += lastText;

        clearInterval(keepAlive);
        await writer.write(encoder.encode(
          JSON.stringify({ content: finalContent.trim(), posts_created: postsCreated })
        ));
        await writer.close();
      } catch (err) {
        clearInterval(keepAlive);
        try {
          await writer.write(encoder.encode(JSON.stringify({ error: String(err) })));
        } catch {}
        try { await writer.close(); } catch {}
      }
    })();

    return response;
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
