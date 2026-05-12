import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BEN_SYSTEM = `Você é BEN, Especialista em Tendências Digitais da Calu Agência.

Você tem acesso a busca na web em tempo real. Use-a para pesquisar DADOS REAIS de tendências.

PESQUISE OBRIGATORIAMENTE:
1. Google Trends Brasil para o nicho informado (busque queries como "[nicho] tendências 2025 brasil", "google trends [nicho]")
2. Tendências do Instagram e TikTok no nicho (busque "#[nicho] trending", "conteúdo viral [nicho] instagram 2025")
3. Twitter/X trending topics relacionados ao nicho
4. O que influenciadores do nicho estão postando agora

ENTREGUE o relatório neste formato exato:

### 🔥 TENDÊNCIAS DO MOMENTO
Liste 6-8 tendências com dados reais encontrados. Para cada: nome, fonte, por que está em alta, urgência (alta/média/baixa).

### 💡 IDEIAS DE CONTEÚDO
8-10 ideias específicas baseadas no que você encontrou. Para cada: título, formato (reel/carrossel/story), gancho e por que vai performar AGORA.

### #️⃣ HASHTAGS & ESTRATÉGIA
15-20 hashtags reais com volume atual + melhores horários de publicação por plataforma.

### ⚡ QUICK WINS — POSTE ESTA SEMANA
3 ideias com alto potencial baseadas em tendências ativas que você encontrou.

Cite as fontes encontradas. Português brasileiro. Esta pesquisa alimenta Beatriz (copy) e Marcela (visual).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { nicho, plataforma, tipo_conteudo, client_name } = await req.json();

    if (!nicho) {
      return new Response(JSON.stringify({ error: "nicho obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plataformaCtx = plataforma && plataforma !== "todas" ? ` com foco em ${plataforma}` : " (Instagram, TikTok, LinkedIn)";
    const tipoCtx = tipo_conteudo ? ` para ${tipo_conteudo}` : "";
    const clientCtx = client_name ? ` para o cliente ${client_name}` : "";
    const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

    const userMessage = `Data de hoje: ${hoje}.

Pesquise as tendências mais quentes AGORA (${hoje}) no nicho: **${nicho}**${plataformaCtx}${tipoCtx}${clientCtx}.

Busque dados reais e atuais no Google Trends Brasil, Instagram, TikTok e Twitter. Entregue o relatório completo com informações da semana atual.`;

    const body = {
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: BEN_SYSTEM,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 8,
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    };

    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify(body),
    });

    if (!anthropicResp.ok) {
      const errText = await anthropicResp.text();
      return new Response(JSON.stringify({ error: errText }), {
        status: anthropicResp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicResp.json();

    // Extrai o texto final (pode haver blocos de tool_result + text)
    const content: string = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text?: string }) => b.text ?? "")
      .join("\n\n")
      .trim();

    return new Response(
      JSON.stringify({ content, stop_reason: data.stop_reason }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
