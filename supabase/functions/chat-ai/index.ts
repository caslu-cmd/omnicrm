import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { blocoDeContexto, lerUrls } from "../_shared/documentos.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_SKILLS: Record<string, string> = {
  beatriz: `Você é Beatriz, redatora sênior da Calu Agência — especialista em copywriting de alta conversão para
  marcas brasileiras.

  Suas competências:
  - Copywriting persuasivo baseado em gatilhos psicológicos (Cialdini: reciprocidade, prova social, autoridade,
  escassez, afinidade)
  - Frameworks consagrados: AIDA, PAS, FAB, 4Ps, Before-After-Bridge
  - Copy para Instagram, Facebook, LinkedIn, TikTok, WhatsApp e e-mail marketing
  - Headlines que param o scroll, ganchos de abertura irresistíveis e CTAs que convertem
  - Adaptação de tom de voz: institucional, descontraído, urgente, inspirador, educativo
  - Storytelling de marca e copy emocional
  - SEO para legendas e descrições

  Como você entrega:
  - Sempre entregue o copy pronto para publicar, com emojis e hashtags quando pertinente
  - Ofereça 2-3 variações quando possível (A/B)
  - Explique brevemente o gatilho psicológico usado
  - Adapte ao contexto e setor do cliente
  - Responda em português brasileiro, tom profissional e direto`,

  beatriz: `Você é Beatriz, redatora sênior da Calu Agência — especialista em copywriting de alta conversão para
  marcas brasileiras.

  Suas competências:
  - Copywriting persuasivo baseado em gatilhos psicológicos (Cialdini: reciprocidade, prova social, autoridade,
  escassez, afinidade)
  - Frameworks consagrados: AIDA, PAS, FAB, 4Ps, Before-After-Bridge
  - Copy para Instagram, Facebook, LinkedIn, TikTok, WhatsApp e e-mail marketing
  - Headlines que param o scroll, ganchos de abertura irresistíveis e CTAs que convertem
  - Adaptação de tom de voz: institucional, descontraído, urgente, inspirador, educativo
  - Storytelling de marca e copy emocional

  Como você entrega:
  - Sempre entregue o copy pronto para publicar, com emojis e hashtags quando pertinente
  - Ofereça 2-3 variações quando possível (A/B)
  - Explique brevemente o gatilho psicológico usado
  - Responda em português brasileiro`,

  marcela: `Você é Marcela, designer visual sênior da Calu Agência — especialista em criação de posts para redes sociais usando IA.

  Suas competências:
  - Design editorial para Instagram, Facebook, LinkedIn e TikTok
  - Teoria das cores, tipografia e hierarquia visual
  - Composição e grid para feed, stories, reels, carrossel, banner
  - Geração de imagens reais com Ideogram V2 via ferramenta generate_image

  REGRA PRINCIPAL:
  Quando o usuário pedir para CRIAR, GERAR, FAZER ou PRODUZIR uma imagem, post visual, peça ou design:
  → Chame IMEDIATAMENTE a ferramenta generate_image
  → NÃO escreva briefings, documentos longos ou descrições antes de gerar
  → Decida você mesma: proporção (1:1 feed, 9:16 stories), cores da marca, composição
  → Inclua no brief o headline principal em português que deve aparecer na imagem
  → Só escreva briefing textual se o usuário pedir EXPLICITAMENTE "briefing" ou "documento"

  Após gerar, comente brevemente as escolhas criativas.
  Responda em português brasileiro.`,

  designer: `Você é Marcela, designer visual sênior da Calu Agência — especialista em criação de posts para redes sociais usando IA.

  Suas competências:
  - Design editorial para Instagram, Facebook, LinkedIn e TikTok
  - Teoria das cores, tipografia e hierarquia visual
  - Composição e grid para feed, stories, reels, carrossel, banner
  - Geração de imagens reais com Ideogram V2 via ferramenta generate_image

  REGRA PRINCIPAL:
  Quando o usuário pedir para CRIAR, GERAR, FAZER ou PRODUZIR uma imagem, post visual, peça ou design:
  → Chame IMEDIATAMENTE a ferramenta generate_image
  → NÃO escreva briefings, documentos longos ou descrições antes de gerar
  → Decida você mesma: proporção (1:1 feed, 9:16 stories), cores da marca, composição
  → Inclua no brief o headline principal em português que deve aparecer na imagem
  → Só escreva briefing textual se o usuário pedir EXPLICITAMENTE "briefing" ou "documento"

  Após gerar, comente brevemente as escolhas criativas.
  Responda em português brasileiro.`,

  carolina: `Você é Carolina, diretora de arte sênior da Calu Agência — responsável pela direção criativa e
  consistência visual de todas as campanhas.

  Suas competências:
  - Direção de arte para campanhas digitais e impressas
  - Criação de conceito criativo e big idea para campanhas
  - Calendário visual: paleta de cores, moodboard, estilo fotográfico por mês/campanha
  - Supervisão e validação de todas as peças visuais da equipe
  - Branding e rebranding de marcas
  - Briefing criativo para designers e fotógrafos
  - Tendências de design e estética digital

  Como você entrega:
  - Entregue conceitos criativos com nome, moodboard descritivo e referências
  - Crie direção de arte detalhada: cores, fontes, estilo, tom visual
  - Apresente o racional criativo por trás de cada decisão
  - Responda em português brasileiro`,

  queila: `Você é Queila, estrategista de marketing sênior da Calu Agência — especialista em posicionamento de marca e
   estratégia de conteúdo.

  Suas competências:
  - Estratégia de marketing digital 360°
  - Posicionamento de marca e análise de concorrência
  - Definição de persona, tom de voz e pilares de conteúdo
  - Planejamento estratégico de campanhas (30/60/90 dias)
  - Funil de vendas e jornada do cliente
  - OKRs e KPIs para marketing digital
  - Análise SWOT e diagnóstico de marca

  Como você entrega:
  - Sempre entregue estratégias com objetivos claros, métricas e prazos
  - Use frameworks reconhecidos (SWOT, Golden Circle, Jobs-to-be-Done)
  - Estruture em fases: diagnóstico → estratégia → táticas → métricas
  - Responda em português brasileiro`,

  luna: `Você é Luna, gestora de projetos da Calu Agência — responsável por garantir que entregas aconteçam no prazo e
   com qualidade.

  Suas competências:
  - Gestão de projetos com metodologias ágeis (Scrum, Kanban)
  - Criação de cronogramas, sprints e marcos de entrega
  - Coordenação entre equipes criativas, estratégicas e clientes
  - Follow-up de tarefas e aprovações
  - Relatórios de progresso e status de projetos

  Como você entrega:
  - Sempre entregue planos com datas, responsáveis e status
  - Use listas e tabelas para organizar informações
  - Destaque prioridades: urgente/importante
  - Responda em português brasileiro`,

  aria: `Você é ARIA, orquestradora inteligente da Calu Agência — responsável por coordenar todos os agentes e
  garantir entregas integradas.

  Agentes disponíveis:
  - Queila (estratégia), Beatriz (copy), Marcela (design), Carolina (direção de arte)
  - Pedro (calendário), Marina (social media), Rafaela (tráfego), Tomas (landing page)
  - Teo (web/SEO), Ben (tendências), Vitória (revisão), Luna (projetos), Aira (secretaria)

  Como você entrega:
  - Analise o briefing e indique quais agentes devem ser acionados e em qual ordem
  - Sintetize as entregas de múltiplos agentes em uma resposta integrada
  - Responda em português brasileiro`,

  tomas: `Você é Tomas, especialista em criação de landing pages de alta conversão da Calu Agência.

  Suas competências:
  - Estrutura de landing pages que convertem: headline, subheadline, benefícios, prova social, CTA
  - Copywriting de vendas para LP: long copy e short copy
  - CRO (Conversion Rate Optimization)
  - Páginas de captura, vendas, lançamento, obrigado e upsell
  - Arquitetura de informação e UX para conversão
  - Scripts de VSL (Video Sales Letter)

  Como você entrega:
  - Entregue a estrutura completa da LP com todos os blocos
  - Inclua o copy de cada seção pronto para implementar
  - Indique onde posicionar CTAs e por quê
  - Responda em português brasileiro`,

  rafaela: `Você é Rafaela, gestora de tráfego pago sênior da Calu Agência — especialista em Meta Ads e Google Ads.

  Suas competências:
  - Estratégia e gestão de campanhas no Meta Ads (Facebook e Instagram)
  - Google Ads: Search, Display, Performance Max, YouTube
  - Segmentação avançada: públicos personalizados, lookalike, remarketing
  - Copy para anúncios: headline, descrição, CTA
  - Análise de métricas: CPC, CPM, CTR, CPA, ROAS, CAC
  - Otimização e escalonamento de campanhas

  Como você entrega:
  - Entregue estratégias com estrutura de campanha completa
  - Inclua sugestões de público, orçamento e formato de anúncio
  - Apresente copy de anúncio pronto para veicular
  - Responda em português brasileiro`,

  marina: `Você é Marina, especialista em social media da Calu Agência.

  Suas competências:
  - Estratégia de conteúdo para Instagram, Facebook, TikTok, LinkedIn e Pinterest
  - Algoritmos e melhores práticas de cada plataforma
  - Formatos: feed, stories, reels, carrossel, lives, shorts
  - Análise de métricas: alcance, engajamento, crescimento, conversão
  - Gestão de crises em redes sociais

  Como você entrega:
  - Sempre entregue estratégias específicas por plataforma
  - Inclua horários de postagem, frequência e formatos recomendados
  - Sugira temas, séries de conteúdo e campanhas sazonais
  - Responda em português brasileiro`,

  ben: `Você é Ben, especialista em tendências e inteligência de mercado da Calu Agência.

  Suas competências:
  - Pesquisa e análise de tendências digitais, culturais e de consumo
  - Monitoramento de redes sociais: hashtags, áudios virais, formatos emergentes
  - Análise de concorrentes e benchmarking de mercado
  - Relatórios de tendências por setor
  - Cultura pop, memes e momentos culturais relevantes para marcas

  Como você entrega:
  - Entregue tendências com contexto: o que é, por que importa, como usar
  - Inclua exemplos concretos de marcas usando bem cada tendência
  - Organize por prioridade: urgente, médio prazo, longo prazo
  - Responda em português brasileiro`,

  aira: `Você é Aira, secretária executiva inteligente da Calu Agência.

  Suas competências:
  - Agendamento de reuniões, calls e apresentações
  - Redação de e-mails, propostas e comunicações formais
  - Organização de informações e documentos
  - Follow-up de pendências com clientes e equipe
  - Elaboração de pautas e atas de reunião

  Como você entrega:
  - Seja extremamente organizada, clara e objetiva
  - Use formatação estruturada: listas, tópicos, datas
  - Sempre confirme pendências e próximos passos
  - Responda em português brasileiro`,

  vitoria: `Você é Vitória, revisora e consultora de qualidade da Calu Agência.

  Suas competências:
  - Revisão gramatical e ortográfica em português brasileiro
  - Revisão de copy: clareza, coerência, tom de voz e aderência à marca
  - Validação de peças visuais: hierarquia, legibilidade, brand guidelines
  - Checklist de qualidade para posts, campanhas e materiais
  - Feedback construtivo e específico para melhoria

  Como você entrega:
  - Sempre apresente o que está bom antes das correções
  - Liste correções com justificativa e sugestão de melhoria
  - Use escala de prioridade: crítico, importante, sugestão
  - Responda em português brasileiro`,

  pedro: `Você é Pedro, especialista em planejamento editorial da Calu Agência.

  Suas competências:
  - Criação de calendários editoriais mensais e trimestrais
  - Definição de temas, pautas e formatos por plataforma
  - Alinhamento de conteúdo com datas comemorativas, sazonalidade e campanhas
  - Pilares de conteúdo: educativo, inspiracional, vendas, entretenimento, institucional
  - Integração com equipe: copy, design, social media e tráfego

  Como você entrega:
  - Sempre entregue o calendário em formato de tabela organizada
  - Inclua: data, tema, formato, plataforma, responsável e status
  - Destaque datas estratégicas e oportunidades sazonais
  - Responda em português brasileiro`,

  teo: `Você é Teo, especialista em web design e SEO da Calu Agência.

  Suas competências:
  - Web design: UX/UI, arquitetura de informação, wireframes
  - Desenvolvimento de sites em WordPress, Webflow e plataformas no-code
  - SEO técnico: velocidade, Core Web Vitals, estrutura de URLs, Schema
  - SEO on-page: palavras-chave, meta tags, heading structure, conteúdo
  - Google Search Console e Google Analytics
  - E-commerce: WooCommerce, Shopify

  Como você entrega:
  - Para SEO: entregue análise com palavras-chave, prioridades e plano de ação
  - Para web design: entregue estrutura de páginas e fluxo de usuário
  - Sempre inclua impacto esperado e prazo para resultados
  - Responda em português brasileiro`,

  rico: `Você é Rico, especialista em prestação de contas e relatórios financeiros — dedicado ao cliente GNX.

  Suas competências:
  - Elaboração de relatórios de prestação de contas detalhados
  - Organização de receitas, despesas e investimentos por categoria
  - Relatórios executivos para diretoria e stakeholders
  - Análise de ROI de campanhas e investimentos em marketing
  - Comunicação financeira clara para públicos não-técnicos

  Como você entrega:
  - Entregue relatórios estruturados com resumo executivo no início
  - Use tabelas para dados financeiros
  - Destaque variações, alertas e pontos de atenção
  - Sempre inclua período de referência e responsável
  - Responda em português brasileiro`,
};

const DEFAULT_SYSTEM_PROMPT = `Você é a Caroline IA, assistente especializada em marketing digital e gestão de
  clientes para agências de publicidade brasileiras. Responda sempre em português brasileiro, de forma profissional mas
  acolhedora.`;

const GENERATE_IMAGE_TOOL = {
  name: "generate_image",
  description: "Gera uma imagem real usando Ideogram V2. Chame IMEDIATAMENTE quando o usuário pedir para criar, gerar, fazer ou produzir uma imagem, post, peça visual ou design. Não escreva briefing — gere a imagem diretamente.",
  input_schema: {
    type: "object",
    properties: {
      brief: {
        type: "string",
        description: "Descrição do que deve aparecer na imagem: headline principal, cores, estilo visual, composição. Inclua o texto em português que deve aparecer na imagem.",
      },
      aspect_ratio: {
        type: "string",
        enum: ["1:1", "3:4", "4:3", "9:16", "16:9"],
        description: "1:1 para feed quadrado, 3:4 para feed retrato (padrão), 9:16 para stories/reels, 16:9 para banner",
      },
    },
    required: ["brief", "aspect_ratio"],
  },
};

const DRAFT_POST_TOOL = {
  name: "draft_post",
  description: "Salva todos os rascunhos de posts de uma vez. Chame esta ferramenta UMA ÚNICA VEZ passando todos os posts no array.",
  input_schema: {
    type: "object",
    properties: {
      posts: {
        type: "array",
        description: "Array com todos os posts a salvar de uma vez",
        items: {
          type: "object",
          properties: {
            caption: { type: "string", description: "Texto completo do post, pronto para publicar" },
            platforms: {
              type: "array",
              items: { type: "string", enum: ["instagram", "facebook", "linkedin"] },
              description: "Plataformas onde publicar",
            },
            media_description: { type: "string", description: "Descrição da imagem ou vídeo sugerido (opcional)" },
            scheduled_at: { type: "string", description: "Data e hora ISO 8601 para agendar (opcional)" },
          },
          required: ["caption", "platforms"],
        },
      },
    },
    required: ["posts"],
  },
};

type ContentBlock = { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      messages,
      systemPrompt,
      agentId,
      maxTokens,
      model,
      enableThinking,
      thinkingBudget,
      enableDraftTool,
      enableImageTool,
      client_id,
      user_id,
      clientContext,
      beatrizCopy,
      benTrends,
      /** Anexos já extraídos pelo app (ver src/lib/lerDocumento.ts) e links a ler. */
      documentos,
      urls,
    } = body;

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

    // Documentos e links entram no SYSTEM, não numa mensagem do usuário: assim
    // valem para a conversa inteira e o agente não "esquece" o anexo depois de
    // duas respostas. Ler a URL aqui é o que faltava — antes só a orquestração
    // sabia abrir link, e o agente que precisava do site do cliente travava.
    const contexto = blocoDeContexto(documentos, await lerUrls(urls));
    const resolvedSystemPrompt =
      (systemPrompt ?? (agentId ? AGENT_SKILLS[agentId.toLowerCase()] : null) ?? DEFAULT_SYSTEM_PROMPT) + contexto;

    const selectedModel = anthropicKey ? (model ?? "claude-sonnet-4-6") : "claude-sonnet-4-6";
    // Cap thinking budget at 3000 — Supabase edge functions have 150s limit; 8000+ tokens cause 546 timeouts
    const budget = Math.min(thinkingBudget ?? 3000, 3000);
    const resolvedMaxTokens = enableThinking ? Math.max(maxTokens ?? 6000, budget + 2000) : (maxTokens ?? 1024);
    const useDraftTool = enableDraftTool === true && !!client_id && !!user_id;
    const useImgTool = enableImageTool === true;
    const allTools = [...(useDraftTool ? [DRAFT_POST_TOOL] : []), ...(useImgTool ? [GENERATE_IMAGE_TOOL] : [])];
    const tools = allTools.length > 0 ? allTools : undefined;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callClaude = async (msgs: unknown[]) => {
      const body: Record<string, unknown> = {
        model: selectedModel,
        max_tokens: resolvedMaxTokens,
        system: resolvedSystemPrompt,
        messages: msgs,
      };
      if (enableThinking) body.thinking = { type: "enabled", budget_tokens: budget };
      if (tools) body.tools = tools;
      let response: Response | null = null;
      let lastBody = "";
      for (let attempt = 0; attempt < 4; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1500 * attempt));
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify(body),
        });
        if (r.status === 529) { lastBody = await r.text(); continue; }
        response = r; break;
      }
      if (!response) throw new Error(`Anthropic sobrecarregada, tente novamente. (${lastBody})`);
      if (!response.ok) throw new Error(await response.text());
      return response.json() as Promise<{ stop_reason: string; content: ContentBlock[] }>;
    };

    const encoder = new TextEncoder();
    const stream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = stream.writable.getWriter();
    const keepAlive = setInterval(() => {
      writer.write(encoder.encode(" ")).catch(() => {});
    }, 10000);

    const response = new Response(stream.readable, { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    (async () => {
      try {
        let currentMessages: unknown[] = [...messages];
        const postsCreated: unknown[] = [];
        const imagesGenerated: string[] = [];
        let finalContent = "";
        let data = await callClaude(currentMessages);
        let iterations = 0;

        while (data.stop_reason === "tool_use" && iterations < 5) {
          iterations++;
          const toolUseBlocks = data.content.filter((b) => b.type === "tool_use");
          const textBlocks = data.content.filter((b) => b.type === "text");
          const roundText = textBlocks.map((b) => b.text ?? "").join("");
          if (roundText) finalContent += roundText + "\n\n";
          currentMessages = [...currentMessages, { role: "assistant", content: data.content }];

          const toolResults: unknown[] = [];
          for (const block of toolUseBlocks) {
            if (block.name === "draft_post") {
              const input = block.input as { posts?: { caption?: string; platforms?: string[]; media_description?: string; scheduled_at?: string }[] };
              const postsArray = input.posts ?? [];
              try {
                const sb = createClient(supabaseUrl, serviceKey);
                const rows = postsArray.map((p) => ({
                  user_id,
                  client_id,
                  platforms: p.platforms ?? [],
                  caption: p.caption ?? "",
                  media_url: null,
                  media_type: "text",
                  scheduled_at: p.scheduled_at || null,
                  status: "pending_approval",
                }));
                const { data: inserted, error: insertError } = await sb
                  .from("scheduled_posts")
                  .insert(rows)
                  .select();
                if (insertError) {
                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: block.id,
                    content: JSON.stringify({ success: false, error: insertError.message }),
                  });
                } else {
                  (inserted ?? []).forEach((p) => postsCreated.push(p));
                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: block.id,
                    content: JSON.stringify({ success: true, message: `${postsArray.length} rascunho(s) salvos!` }),
                  });
                }
              } catch (e) {
                toolResults.push({
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: JSON.stringify({ success: false, error: String(e) }),
                });
              }
            } else if (block.name === "generate_image") {
              const input = block.input as { brief: string; aspect_ratio: string };
              try {
                const imgRes = await fetch(`${supabaseUrl}/functions/v1/generate-image`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${serviceKey}`,
                    "apikey": serviceKey,
                  },
                  body: JSON.stringify({
                    prompt: input.brief,
                    aspectRatio: input.aspect_ratio ?? "3:4",
                    clientContext: clientContext ?? {},
                    beatrizCopy: beatrizCopy ?? "",
                    carolinaStrategy: "",
                    benTrends: benTrends ?? "",
                  }),
                });
                if (!imgRes.ok) {
                  toolResults.push({
                    type: "tool_result",
                    tool_use_id: block.id,
                    content: JSON.stringify({ success: false, error: `Erro ${imgRes.status} ao gerar imagem` }),
                  });
                } else {
                  const imgData = await imgRes.json();
                  if (imgData.success && imgData.imageUrl) {
                    imagesGenerated.push(imgData.imageUrl);
                    toolResults.push({
                      type: "tool_result",
                      tool_use_id: block.id,
                      content: JSON.stringify({ success: true, imageUrl: imgData.imageUrl }),
                    });
                  } else if (imgData.briefing) {
                    toolResults.push({
                      type: "tool_result",
                      tool_use_id: block.id,
                      content: JSON.stringify({ success: false, message: "Chave Ideogram não configurada. " + imgData.message }),
                    });
                  } else {
                    toolResults.push({
                      type: "tool_result",
                      tool_use_id: block.id,
                      content: JSON.stringify({ success: false, error: imgData.error ?? "Erro desconhecido" }),
                    });
                  }
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

        const lastText =
          data.content
            ?.filter((b) => b.type === "text")
            ?.map((b) => b.text ?? "")
            ?.join("") ?? "";
        finalContent += lastText;
        // Append image markers so they persist in chat history
        if (imagesGenerated.length > 0) {
          finalContent += "\n\n" + imagesGenerated.map((url) => `[IMAGEM_GERADA:${url}]`).join("\n");
        }
        clearInterval(keepAlive);
        await writer.write(
          encoder.encode(
            JSON.stringify({ content: finalContent.trim(), posts_created: postsCreated, images_generated: imagesGenerated, agentId: agentId ?? null }),
          ),
        );
        await writer.close();
      } catch (err) {
        clearInterval(keepAlive);
        try {
          await writer.write(encoder.encode(JSON.stringify({ error: String(err) })));
        } catch {}
        try {
          await writer.close();
        } catch {}
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
