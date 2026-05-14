import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TomasBot/1.0; +https://calu.app)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return `[Erro ${res.status} ao acessar ${url}]`;
    const html = await res.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s{2,}/g, " ")
      .trim();
    return text.slice(0, 10000);
  } catch (e) {
    return `[Não foi possível acessar ${url}: ${String(e)}]`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { html, command, lp_context, images, source_urls } = await req.json();
    if (!html || !command) throw new Error("html e command são obrigatórios");

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    // Fetch content from reference URLs
    let urlsContext = "";
    if (Array.isArray(source_urls) && source_urls.length > 0) {
      const contents = await Promise.all(source_urls.map(fetchUrlContent));
      urlsContext = "\n\nCONTEÚDO DAS PÁGINAS DE REFERÊNCIA (use estas informações na LP):\n" +
        source_urls.map((url: string, i: number) => `--- ${url} ---\n${contents[i]}`).join("\n\n");
    }

    const promptText = `Você é o Tomás, especialista em landing pages da Calu Agência.

CONTEXTO:
${lp_context || "Landing page comercial em português brasileiro"}${urlsContext}

⚠️ REGRA CRÍTICA — NUNCA INVENTE INFORMAÇÕES:
- Use EXCLUSIVAMENTE os dados do CONTEXTO, ARQUIVOS DE REFERÊNCIA e CONTEÚDO DAS PÁGINAS acima
- JAMAIS invente: preços, nomes, depoimentos, estatísticas, garantias, características, datas ou qualquer dado específico
- Se uma informação não estiver nos materiais fornecidos, use placeholder: [INSERIR PREÇO], [NOME DO CLIENTE], [DEPOIMENTO REAL], etc.
- Use TODAS as informações relevantes dos materiais — não omita conteúdo útil disponível

COMANDO:
${command}

HTML ATUAL:
${html}

Identifique quais seções/elementos precisam mudar para executar o comando.
Retorne SOMENTE um JSON array (sem markdown, sem explicação):
[
  { "selector": "section#beneficios", "outerHTML": "<section id=\\"beneficios\\">...HTML completo da seção...</section>" }
]

Seletores válidos: "nav", "header#hero", "section#beneficios", "section#depoimentos", "section#sobre", "section#oferta", "section#contato", "footer", "head style"
Para inserir nova seção: { "insertAfter": "section#oferta", "outerHTML": "...nova seção completa..." }
Para remover uma seção: { "selector": "section#xxx", "remove": true }
Para mudanças globais de cor ou tipografia: use "head style" com o <style> inteiro atualizado.
${images && images.length > 0 ? `\nIMPORTANTE: O usuário enviou ${images.length} imagem(ns) de referência. Use-as para guiar a substituição de logos, fotos ou identidade visual conforme o comando.` : ""}

Regras:
- Inclua APENAS os elementos que realmente mudam
- outerHTML deve ser HTML completo e válido do elemento
- Preserve o mesmo CSS, variáveis CSS e classes Tailwind
- Mantenha o português brasileiro
- Para trocar FONTE: no "head style" adicione @import do Google Fonts e atualize font-family no body/h1/h2/etc.
- Para trocar LOGO: substitua o elemento <img> com novo src mantendo todas as classes e atributos`;

    // Build multimodal message content if images present
    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

    const messageContent: ContentBlock[] = [];

    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (!img.base64 || !img.mimeType) continue;
        messageContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mimeType,
            data: img.base64,
          },
        });
      }
    }
    messageContent.push({ type: "text", text: promptText });

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 16000,
        messages: [{ role: "user", content: messageContent }],
      }),
    });

    if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);

    const data = await r.json();
    let raw = (data.content?.[0]?.text ?? "").trim();

    // Remove markdown code fences se presentes
    if (raw.startsWith("```")) {
      raw = raw.split("\n").slice(1).join("\n");
      if (raw.endsWith("```")) raw = raw.slice(0, -3).trimEnd();
    }

    // Tenta parsear como JSON de changes
    try {
      const changes = JSON.parse(raw);
      if (Array.isArray(changes)) {
        return new Response(JSON.stringify({ changes }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    } catch { /* continua pro fallback */ }

    // Fallback: modelo retornou HTML completo
    if (raw.includes("<!DOCTYPE") || raw.includes("<html")) {
      return new Response(JSON.stringify({ new_html: raw }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    throw new Error("Resposta inválida do modelo — tente novamente");
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? "Erro desconhecido" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
