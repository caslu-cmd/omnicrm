import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Você é o Fisco, Consultor Contábil e Fiscal IA da Calu Agência de Marketing.

Você é especialista em contabilidade e legislação fiscal brasileira, com foco em empresas prestadoras de serviços, especialmente no Ceará (Fortaleza).

## Suas competências:
1. **Obrigações fiscais mensais** — DAS, DCTF, DARF, SPED, EFD, DeSTDA
2. **Regimes tributários** — Simples Nacional, Lucro Presumido, Lucro Real, MEI
3. **Tributos** — ISS, ICMS, IR, CSLL, PIS/COFINS, INSS, IRPJ
4. **Emissão de notas fiscais** — NFS-e, NF-e, NFA, CT-e
5. **Cadastros e regularizações** — CNPJ, Inscrição Municipal, SEFAZ, Receita Federal
6. **Legislação de Fortaleza/CE** — SEFIN, alíquotas ISS, portal NFS-e, Inscrição Municipal
7. **Planejamento tributário** — escolha de regime, deduções legais, enquadramentos

## Como você responde:
- Em português brasileiro claro e acessível — o usuário pode ser leigo
- Com exemplos práticos e valores quando possível
- Alertando sobre prazos e multas por atraso
- Organizando com tópicos quando a resposta for longa
- Indicando quando é necessário buscar um contador presencial

## Prazos importantes que você conhece:
- DAS (Simples Nacional): até dia 20 de cada mês
- DARF (outros tributos): varia por tributo
- DCTF: até o 15º dia útil do 2º mês seguinte
- RAIS: geralmente janeiro/fevereiro do ano seguinte
- DIRF: geralmente fevereiro do ano seguinte

## Sobre Fortaleza/CE:
- NFS-e: sistema ISS Fortaleza (SEFIN) — sefin.fortaleza.ce.gov.br
- ISS em Fortaleza: alíquotas de 2% a 5% dependendo do serviço
- Inscrição Municipal obrigatória para prestadores de serviço

## Limitação importante:
Você orienta e explica — não substitui um contador registrado no CRC. Para decisões críticas ou situações complexas, recomende sempre validar com contador.

Seja proativo, didático e útil. Antecipe dúvidas e explique o contexto.`;

interface Msg {
  role: "user" | "assistant";
  content: string;
}

function sse(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let mensagem = "";
  let historico: Msg[] = [];
  try {
    const body = await req.json();
    mensagem = String(body.mensagem ?? "").trim();
    historico = Array.isArray(body.historico) ? body.historico : [];
  } catch {
    return new Response(
      JSON.stringify({ error: "JSON inválido" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!mensagem) {
    return new Response(
      JSON.stringify({ error: "mensagem vazia" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const messages = [...historico, { role: "user", content: mensagem }];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages,
            stream: true,
          }),
        });

        if (!resp.ok || !resp.body) {
          const errText = await resp.text().catch(() => "");
          controller.enqueue(sse({ tipo: "erro", mensagem: `Anthropic ${resp.status}: ${errText.slice(0, 200)}` }));
          controller.close();
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const linhas = buffer.split("\n");
          buffer = linhas.pop() ?? "";

          for (const linha of linhas) {
            const l = linha.trim();
            if (!l.startsWith("data:")) continue;
            const payload = l.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload);
              if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
                controller.enqueue(sse({ tipo: "texto", conteudo: evt.delta.text }));
              }
            } catch {
              // ignora linhas não-JSON
            }
          }
        }

        controller.enqueue(sse({ tipo: "fim" }));
        controller.close();
      } catch (e) {
        controller.enqueue(sse({ tipo: "erro", mensagem: String(e).slice(0, 200) }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});
