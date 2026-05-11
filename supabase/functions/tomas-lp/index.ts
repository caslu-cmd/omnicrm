import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sse(ctrl: ReadableStreamDefaultController, obj: object) {
  ctrl.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`));
}

async function callClaude(
  apiKey: string,
  system: string,
  content: unknown[],
  maxTokens = 8000,
): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "pdfs-2024-09-25",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content }],
    }),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return data.content?.[0]?.text ?? "";
}

// ── Prompts ────────────────────────────────────────────────────────────────────

const BEATRIZ_SYSTEM = `Você é BEATRIZ, Copywriter Senior especialista em Landing Pages de alta conversão da Calu Agência.

Seu trabalho é criar o copy completo (todos os textos) de uma landing page com base no briefing recebido.

Estrutura obrigatória do copy:
1. **HEADLINE** — frase principal impactante (máx 10 palavras)
2. **SUBHEADLINE** — complemento da headline (1-2 linhas)
3. **HERO** — parágrafo introdutório (3-4 linhas)
4. **BENEFÍCIOS** — lista de 4-6 benefícios com título e descrição curta
5. **PROVA SOCIAL** — 2-3 depoimentos fictícios mas realistas e específicos
6. **SOBRE** — texto sobre a empresa/produto (3-5 linhas)
7. **OFERTA / CTA** — o que o usuário recebe e próximo passo (1-2 parágrafos)
8. **CTA BOTÃO** — texto do botão de conversão (máx 6 palavras)
9. **URGÊNCIA** — frase de urgência ou escassez (opcional, se fizer sentido)

Use a linguagem e o tom indicados no briefing.
Se houver materiais de referência (PDFs, documentos), USE o conteúdo deles para enriquecer o copy.
Seja específico — use números reais, nomes, detalhes concretos do briefing.
Responda apenas com o copy estruturado, sem explicações adicionais.`;

const DESIGNER_SYSTEM = `Você é a DESIGNER VISUAL da Calu Agência, responsável por criar a especificação visual de landing pages.

Com base no copy recebido e no briefing, defina:

1. **PALETA DE CORES** — primária, secundária, fundo, texto, CTA (com códigos hex)
2. **TIPOGRAFIA** — fonte para headlines e para corpo de texto (use Google Fonts)
3. **ESTILO VISUAL** — descrição do mood geral (moderno/sério/jovem/corporativo etc.)
4. **SEÇÕES DA LP** — lista de todas as seções com descrição visual de cada uma
5. **ELEMENTOS ESPECIAIS** — ícones, gradientes, sombras, imagens sugeridas
6. **CTA** — cor, tamanho, estilo do botão principal

Seja específico com os valores (hexadecimais, nomes de fontes exatos).
Responda apenas com a especificação visual estruturada.`;

const TOMAS_SYSTEM = `Você é TOMÁS, desenvolvedor frontend especialista em Landing Pages da Calu Agência.

Você recebe o copy e a especificação visual e cria o HTML COMPLETO da landing page.

REGRAS OBRIGATÓRIAS:
- HTML único e completo (<!DOCTYPE html>...</html>), sem dependências externas exceto Google Fonts e Font Awesome via CDN
- CSS inline no <style> — não use frameworks CSS externos
- Design responsivo (mobile-first)
- Seções: header/nav, hero, benefícios, prova social, sobre, oferta, CTA, footer
- Formulário de captação simples (nome, email, telefone + botão)
- Animações sutis via CSS (fade-in ao scroll usando IntersectionObserver simples)
- Cores e fontes EXATAMENTE como especificado pelo Designer
- Imagens: use gradientes ou cores sólidas como placeholder (sem URLs de imagens externas quebradas)
- Código limpo e semântico
- Botões com efeito hover
- NUNCA use Lorem Ipsum — use apenas o copy real da Beatriz

Retorne SOMENTE o código HTML completo, sem explicações antes ou depois.`;

// ── Handler ────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    const { briefing, client_name, arquivos = [] } = body;
    // arquivos: Array<{ name: string; base64: string; media_type?: string }>

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY") ?? "";
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada no Supabase");

    const stream = new ReadableStream({
      async start(ctrl) {
        try {
          // ── BEATRIZ: copy ──────────────────────────────────────────────────
          sse(ctrl, { etapa: "copy", status: "Beatriz escrevendo o copy..." });

          const beatrizContent: unknown[] = [
            {
              type: "text",
              text: `Cliente: ${client_name || "não informado"}\n\nBriefing:\n${briefing}\n\nCrie o copy completo da landing page seguindo a estrutura obrigatória.`,
            },
          ];

          // Injeta documentos PDF/DOCX como content blocks (Claude lê nativamente)
          for (const arq of arquivos) {
            if (!arq.base64) continue;
            const mimeType = arq.media_type ?? (arq.name?.toLowerCase().endsWith(".pdf") ? "application/pdf" : "text/plain");
            if (mimeType === "application/pdf") {
              beatrizContent.push({
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: arq.base64 },
                title: arq.name ?? "documento",
              });
            } else {
              // txt, md — decodifica e injeta como texto
              try {
                const decoded = atob(arq.base64);
                beatrizContent.push({
                  type: "text",
                  text: `\n\n[Material de referência: ${arq.name}]\n${decoded}`,
                });
              } catch { /* ignora */ }
            }
          }

          const copy = await callClaude(apiKey, BEATRIZ_SYSTEM, beatrizContent, 4000);
          sse(ctrl, { etapa: "copy", status: "Copy finalizado ✓", conteudo: copy });

          // ── DESIGNER: identidade visual ────────────────────────────────────
          sse(ctrl, { etapa: "design", status: "Designer definindo a identidade visual..." });

          const designContent: unknown[] = [
            {
              type: "text",
              text: `Briefing do cliente:\n${briefing}\n\nCliente: ${client_name || "não informado"}\n\nCopy criado pela Beatriz:\n${copy}\n\nDefina a especificação visual completa da landing page.`,
            },
          ];

          const design = await callClaude(apiKey, DESIGNER_SYSTEM, designContent, 2000);
          sse(ctrl, { etapa: "design", status: "Identidade visual definida ✓", conteudo: design });

          // ── TOMÁS: HTML ────────────────────────────────────────────────────
          sse(ctrl, { etapa: "html", status: "Tomás montando a landing page..." });

          const tomasContent: unknown[] = [
            {
              type: "text",
              text: `Copy da Beatriz:\n${copy}\n\nEspecificação visual do Designer:\n${design}\n\nCrie o HTML completo da landing page agora.`,
            },
          ];

          const html = await callClaude(apiKey, TOMAS_SYSTEM, tomasContent, 8000);

          // Extrai HTML: primeiro tenta code fence, depois DOCTYPE/html tag
          let htmlFinal = html;
          const fenceMatch = html.match(/```(?:html?)?\n?([\s\S]*?)```/i);
          if (fenceMatch) {
            htmlFinal = fenceMatch[1].trim();
          } else {
            const tagMatch = html.match(/<!DOCTYPE[\s\S]*<\/html>/i) ?? html.match(/<html[\s\S]*<\/html>/i);
            if (tagMatch) htmlFinal = tagMatch[0].trim();
          }

          sse(ctrl, { etapa: "html", status: "HTML pronto ✓", conteudo: htmlFinal });

          sse(ctrl, { etapa: "concluido" });
        } catch (err) {
          sse(ctrl, { etapa: "erro", mensagem: String(err) });
        } finally {
          ctrl.close();
        }
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
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});
