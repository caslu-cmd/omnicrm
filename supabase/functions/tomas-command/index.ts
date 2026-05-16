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

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string }; title: string };

async function callClaude(
  apiKey: string,
  model: string,
  system: string,
  content: ContentBlock[],
  maxTokens: number,
  hasPdfs: boolean,
): Promise<string> {
  let r: Response | null = null;
  let lastErr = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(res => setTimeout(res, 800));
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        ...(hasPdfs ? { "anthropic-beta": "pdfs-2024-09-25" } : {}),
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content }],
      }),
    });
    if (res.status === 529) { lastErr = await res.text(); continue; }
    r = res; break;
  }
  if (!r) throw new Error(`Claude sobrecarregado, tente novamente. (${lastErr})`);
  if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return (data.content?.[0]?.text ?? "").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { html, command, lp_context, images, source_urls, section_html, files } = await req.json();
    if (!command) throw new Error("command é obrigatório");
    if (!html && !section_html) throw new Error("html ou section_html é obrigatório");

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada");

    // Fetch URL context
    let urlsContext = "";
    if (Array.isArray(source_urls) && source_urls.length > 0) {
      const contents = await Promise.all(source_urls.map(fetchUrlContent));
      urlsContext = "\n\nCONTEÚDO DAS PÁGINAS DE REFERÊNCIA (use estas informações na LP):\n" +
        source_urls.map((url: string, i: number) => `--- ${url} ---\n${contents[i]}`).join("\n\n");
    }

    // Build shared content blocks (PDFs + images first)
    const sharedBlocks: ContentBlock[] = [];
    if (Array.isArray(files)) {
      for (const file of files) {
        if (file.media_type === "application/pdf" && file.base64) {
          sharedBlocks.push({
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: file.base64 },
            title: file.name ?? "documento",
          });
        }
      }
    }
    if (Array.isArray(images)) {
      for (const img of images) {
        if (img.base64 && img.mimeType) {
          sharedBlocks.push({
            type: "image",
            source: { type: "base64", media_type: img.mimeType, data: img.base64 },
          });
        }
      }
    }
    const hasPdfs = sharedBlocks.some(b => b.type === "document");
    const hasFiles = sharedBlocks.length > 0;

    // ── MODO SEÇÃO: edita apenas uma seção e retorna o HTML dela ─────────────
    if (section_html) {
      const prompt = `Você é o Tomás, especialista em landing pages da Calu Agência.

CONTEXTO DA LP:
${lp_context || "Landing page comercial em português brasileiro"}${urlsContext}
${hasFiles ? "\nO usuário enviou arquivos/imagens de referência acima — use as informações deles no comando." : ""}

⚠️ REGRA CRÍTICA:
- Use EXCLUSIVAMENTE os dados do CONTEXTO e dos arquivos fornecidos
- Jamais invente preços, nomes, depoimentos, dados específicos — use [INSERIR DADO]

COMANDO: ${command}

HTML ATUAL DA SEÇÃO:
${section_html}

Retorne SOMENTE o HTML da seção modificada, sem explicações, sem markdown, sem code fences.
Preserve o CSS, variáveis e estrutura. Escreva em português brasileiro.`;

      const messageContent: ContentBlock[] = [...sharedBlocks, { type: "text", text: prompt }];
      let raw = await callClaude(
        apiKey,
        "claude-sonnet-4-6",
        "Você é um editor de HTML de landing pages. Retorne APENAS o HTML da seção modificada, sem texto extra, sem markdown, sem code fences.",
        messageContent,
        8000,
        hasPdfs,
      );
      // Remove code fences if present
      if (raw.startsWith("```")) {
        raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      }
      return new Response(JSON.stringify({ section_html: raw }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── MODO COMPLETO: retorna JSON array de changes ──────────────────────────
    const MAX_BODY = 20_000;
    let htmlTrimmed = html;
    if (html.length > 30_000) {
      const bodyStart = html.indexOf("<body");
      if (bodyStart > 0) {
        const head = html.slice(0, bodyStart);
        const body = html.slice(bodyStart);
        htmlTrimmed = head + (body.length > MAX_BODY ? body.slice(0, MAX_BODY) + "\n</body></html><!-- [truncado] -->" : body);
      } else {
        htmlTrimmed = html.slice(0, 30_000) + "\n<!-- [truncado] -->";
      }
    }

    const promptText = `Você é o Tomás, especialista em landing pages da Calu Agência.

CONTEXTO:
${lp_context || "Landing page comercial em português brasileiro"}${urlsContext}
${hasFiles ? "\nO usuário enviou arquivos/imagens de referência acima." : ""}

⚠️ REGRA CRÍTICA — NUNCA INVENTE INFORMAÇÕES:
- Use EXCLUSIVAMENTE os dados do CONTEXTO, ARQUIVOS DE REFERÊNCIA e CONTEÚDO DAS PÁGINAS acima
- JAMAIS invente: preços, nomes, depoimentos, estatísticas, garantias, características, datas ou qualquer dado específico
- Se uma informação não estiver nos materiais fornecidos, use placeholder: [INSERIR PREÇO], [NOME DO CLIENTE], [DEPOIMENTO REAL], etc.
- Use TODAS as informações relevantes dos materiais — não omita conteúdo útil disponível

COMANDO:
${command}

HTML ATUAL:
${htmlTrimmed}

Identifique quais seções/elementos precisam mudar para executar o comando.
Retorne SOMENTE um JSON array (sem markdown, sem explicação):
[
  { "selector": "section#beneficios", "outerHTML": "<section id=\\"beneficios\\">...HTML completo da seção...</section>" }
]

Seletores válidos: "nav", "header#hero", "section#beneficios", "section#depoimentos", "section#sobre", "section#oferta", "section#contato", "footer", "head style"
Para inserir nova seção: { "insertAfter": "section#oferta", "outerHTML": "...nova seção completa..." }
Para remover uma seção: { "selector": "section#xxx", "remove": true }
Para mudanças globais de cor ou tipografia: use "head style" com o <style> inteiro atualizado.

Regras:
- Inclua APENAS os elementos que realmente mudam
- outerHTML deve ser HTML completo e válido do elemento
- Preserve o mesmo CSS, variáveis CSS e classes Tailwind
- Mantenha o português brasileiro
- Para trocar FONTE: no "head style" adicione @import do Google Fonts e atualize font-family no body/h1/h2/etc.
- Para trocar LOGO: substitua o elemento <img> com novo src mantendo todas as classes e atributos`;

    const messageContent: ContentBlock[] = [...sharedBlocks, { type: "text", text: promptText }];
    let raw = await callClaude(
      apiKey,
      "claude-haiku-4-5-20251001",
      "Você é um editor de HTML de landing pages. RESPONDA APENAS com um JSON array válido, sem texto antes ou depois, sem markdown, sem code fences. Formato exato: [{\"selector\":\"...\",\"outerHTML\":\"...\"}]. Escape todas as aspas dentro de strings JSON com \\\".",
      messageContent,
      16000,
      hasPdfs,
    );

    // Remove markdown code fences
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    }

    const okChanges = (changes: unknown[]) =>
      new Response(JSON.stringify({ changes }), { headers: { ...cors, "Content-Type": "application/json" } });

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return okChanges(parsed);
      if (parsed && Array.isArray((parsed as any).changes)) return okChanges((parsed as any).changes);
    } catch { /* continua */ }

    const arrayMatch = raw.match(/(\[\s*\{[\s\S]*?\}\s*\])/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[1]);
        if (Array.isArray(parsed) && parsed.length > 0) return okChanges(parsed);
      } catch { /* continua */ }
    }

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
