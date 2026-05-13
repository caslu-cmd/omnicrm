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
  model = "claude-sonnet-4-6",
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
      model,
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

const BEATRIZ_SYSTEM = `Você é BEATRIZ, Copywriter Sênior da Calu Agência, especialista em landing pages de alta conversão.

Seu trabalho: transformar o briefing em copy que conecta emocionalmente e converte.
Se houver materiais de referência, extraia dados reais (números, resultados, diferenciais únicos).
Nunca invente dados que não estão no briefing — crie depoimentos plausíveis e específicos para o nicho.

Retorne SOMENTE o copy estruturado abaixo. Nenhum texto introdutório ou explicativo.

## HEADLINE
[Frase principal — máx 10 palavras. Verbo de ação + resultado claro para o público. Sem clichês.]

## SUBHEADLINE
[1-2 linhas que ampliam a headline com o principal diferencial. Concreto e específico.]

## HERO
[3-4 linhas: ative a dor ou desejo do público → apresente a solução → prometa a transformação. Emocional e específico.]

## BENEFICIOS
**[Título — benefício, não feature, máx 5 palavras]:** [Descrição em 1 linha com resultado mensurável ou dado concreto]
**[Título]:** [Descrição]
**[Título]:** [Descrição]
**[Título]:** [Descrição]
**[Título]:** [Descrição]
[adicione 5º e 6º apenas se o briefing justificar]

## PROVA_SOCIAL
**[Nome Completo, Cargo ou Contexto realista]:** "[Situação antes → ação → resultado concreto e específico. 2-3 linhas.]"
**[Nome, Cargo]:** "[...]"
**[Nome, Cargo]:** "[...]"

## SOBRE
[3-5 linhas: quem é a empresa/produto, credenciais reais do briefing, missão, por que confiar. Tom humano, não corporativo.]

## OFERTA
[1-2 parágrafos: o que exatamente o visitante ganha ao agir agora. Bônus, garantia, facilidade de acesso. Elimine as principais objeções.]

## CTA_BOTAO
[Texto do botão — máx 6 palavras. Verbo imperativo no presente: "Quero", "Acesse", "Garanta", "Comece". Específico ao produto.]

## URGENCIA
[Frase de escassez ou urgência SE o briefing indicar prazo, vagas limitadas ou promoção — caso contrário, deixe esta linha em branco]`;

const DESIGNER_SYSTEM = `Você é a DESIGNER VISUAL da Calu Agência. Com base no copy e no briefing, crie a especificação visual completa.

Escolha cores que combinam com o tom e o público. Se o briefing mencionar cores da marca, use-as como ponto de partida.
Prefira fontes do Google Fonts amplamente disponíveis.

Retorne SOMENTE a especificação abaixo. Nenhum texto introdutório ou explicativo.

## PALETA
- Primária: #XXXXXX — [uso principal: botões CTA, títulos coloridos, destaques]
- Secundária: #XXXXXX — [uso de suporte: ícones, badges, bordas decorativas]
- Fundo principal: #XXXXXX
- Fundo alternado: #XXXXXX — [seções que alternam cor de fundo]
- Texto principal: #XXXXXX
- Texto secundário: #XXXXXX — [subtítulos, descrições]
- CTA Background: #XXXXXX | CTA Texto: #XXXXXX

## TIPOGRAFIA
- Headline (h1, h2, h3): [Nome Exato Google Fonts] — weight 700-800
  - h1: 64px desktop / 38px mobile
  - h2: 44px desktop / 28px mobile
  - h3: 28px desktop / 22px mobile
- Corpo (p, li): [Nome Exato Google Fonts] — weight 400 — 17px — line-height: 1.75
- Destaque/CTA: weight 700 — 18px

## ESTILO_VISUAL
[2-3 linhas descrevendo o mood geral: sério/jovem/luxo/vibrante/tech/natural etc. — e como isso se reflete nos elementos visuais]

## SECOES
1. **HERO** — [fundo: gradient específico ou cor sólida com overlay; alinhamento de texto; elemento decorativo: formas geométricas, imagem placeholder com gradient]
2. **BENEFICIOS** — [layout: grid 3 colunas desktop / 1 coluna mobile; cards com fundo e borda? ícones Font Awesome? cor dos cards]
3. **PROVA_SOCIAL** — [cards de depoimento: fundo, aspas decorativas, foto placeholder circular com gradient]
4. **SOBRE** — [fundo alternado; layout: texto + elemento visual ao lado?]
5. **OFERTA** — [caixa destacada: cor de fundo, borda, badge "Oferta Especial" se aplicável]
6. **FORMULARIO_CTA** — [fundo de seção; campos do formulário: estilo; botão submit: tamanho e cor]
7. **FOOTER** — [cor de fundo escura; conteúdo: copyright, links mínimos]

## ELEMENTOS_ESPECIAIS
- Gradient hero: [ex: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)]
- Card shadow: [ex: box-shadow: 0 4px 24px rgba(0,0,0,0.10)]
- Border-radius: [ex: cards 16px, botões 12px, pills 999px]
- Ícones: Font Awesome 6 — [estilo: fas / far / fab conforme o tom]
- Separador de seções: [ex: wave SVG, diagonal cut, borda gradiente, nenhum]

## CTA_BUTTON_SPEC
- Background: #XXXXXX
- Cor do texto: #XXXXXX — weight 700 — 18px
- Border-radius: Xpx
- Padding: 18px 48px
- Hover: background levemente mais claro/escuro + transform: translateY(-3px)
- Box-shadow no hover: [ex: 0 8px 32px rgba(cor-primária, 0.35)]`;


const TOMAS_SYSTEM = `Você é TOMÁS, desenvolvedor frontend sênior da Calu Agência. Crie o HTML completo da landing page.

REGRAS TÉCNICAS — siga todas sem exceção:

1. Documento único <!DOCTYPE html>...</html>. CSS em <style> na <head>. Sem frameworks CSS externos.
2. Google Fonts via <link> CDN (use as fontes exatas da especificação visual). Font Awesome 6 via CDN para ícones.
3. Responsivo mobile-first. Breakpoint: 768px. Use @media (min-width: 768px) para desktop.
4. Container: max-width: 1180px; margin: 0 auto; padding: 0 32px; (padding: 0 20px no mobile)
5. Seções: padding: 100px 0 (desktop), 60px 0 (mobile).
6. Formulário obrigatório: campos Nome, E-mail, Telefone + botão submit estilizado.
7. Cores e fontes EXATAMENTE como na especificação do Designer — nenhuma improvisação.
8. Use o copy EXATAMENTE como a Beatriz escreveu — cada palavra conta para a conversão.
9. Imagens/fotos: use gradientes CSS como placeholder (background: linear-gradient(...)). Sem URLs externas.

ANIMAÇÕES — regras rígidas:
- Defina: @keyframes fadeInUp { from { opacity: 0.01; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
- Defina: @keyframes fadeIn { from { opacity: 0.01; } to { opacity: 1; } }
- Aplique nos elementos principais: animation: fadeInUp 0.65s ease both; com delays de 0s, 0.1s, 0.2s, 0.3s (máx 0.4s)
- PROIBIDO: opacity: 0 como valor de qualquer propriedade em qualquer estado
- PROIBIDO: IntersectionObserver, scroll listeners, qualquer JS que controle visibilidade

QUALIDADE DE PRODUÇÃO:
- Botões com transição suave no hover: transition: all 0.25s ease; transform e box-shadow
- Formulário com campos bem estilizados: borda sutil, foco destacado na cor primária
- Cards de benefícios e depoimentos com border-radius, sombra e espaçamento generoso
- Seções com fundo alternado para criar ritmo visual
- Footer com copyright e links mínimos (Política de Privacidade, Termos)
- Código semântico (section, header, main, footer, nav, article)

Retorne SOMENTE o código HTML, sem markdown, sem explicações, sem code fences.
Comece com <!DOCTYPE html> e termine com </html>.`;

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

          const design = await callClaude(apiKey, DESIGNER_SYSTEM, designContent, 2000, "claude-haiku-4-5-20251001");
          sse(ctrl, { etapa: "design", status: "Identidade visual definida ✓", conteudo: design });

          // ── TOMÁS: HTML (stream interno → evento único ao frontend) ──────────
          sse(ctrl, { etapa: "html", status: "Tomás montando a landing page..." });

          const tomasResp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "anthropic-beta": "output-128k-2025-02-19",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-6",
              max_tokens: 12000,
              stream: true,
              system: TOMAS_SYSTEM,
              messages: [{ role: "user", content: [{ type: "text", text: `Copy da Beatriz:\n${copy}\n\nEspecificação visual do Designer:\n${design}\n\nCrie o HTML completo da landing page agora.` }] }],
            }),
          });

          if (!tomasResp.ok) throw new Error(`Claude Tomás ${tomasResp.status}: ${await tomasResp.text()}`);

          // Lê o stream e envia chunks parciais ao frontend para preview progressivo
          const tomasReader = tomasResp.body!.getReader();
          const dec = new TextDecoder();
          let htmlFull = "";
          let sseBuffer = "";
          let lastChunkSent = 0;
          const CHUNK_INTERVAL = 1200; // envia preview a cada ~1200 chars novos

          while (true) {
            const { value, done } = await tomasReader.read();
            if (done) break;
            sseBuffer += dec.decode(value, { stream: true });
            const lines = sseBuffer.split("\n");
            sseBuffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              if (raw === "[DONE]") continue;
              try {
                const parsed = JSON.parse(raw);
                if (parsed.type === "error") throw new Error(`Anthropic: ${JSON.stringify(parsed.error)}`);
                if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                  htmlFull += parsed.delta.text;
                  // Envia preview parcial ao frontend enquanto gera
                  if (htmlFull.length - lastChunkSent >= CHUNK_INTERVAL) {
                    lastChunkSent = htmlFull.length;
                    sse(ctrl, { etapa: "html", status: "Tomás montando a página...", conteudo: htmlFull });
                  }
                }
              } catch (innerErr) {
                if (String(innerErr).includes("Anthropic:")) throw innerErr;
              }
            }
          }

          if (!htmlFull.trim()) throw new Error("Tomás não gerou conteúdo — tente novamente");

          // Extrai HTML puro (remove code fences e texto introdutório se presentes)
          let htmlFinal = htmlFull.trim();
          if (htmlFinal.startsWith("```")) {
            const lines = htmlFinal.split("\n");
            lines.shift();
            if (lines.length > 0 && lines[lines.length - 1].trimEnd() === "```") lines.pop();
            htmlFinal = lines.join("\n").trim();
          }
          if (!htmlFinal.startsWith("<")) {
            const docIdx = htmlFinal.indexOf("<!DOCTYPE");
            const htmlIdx = htmlFinal.indexOf("<html");
            const start = docIdx >= 0 ? docIdx : htmlIdx >= 0 ? htmlIdx : -1;
            if (start >= 0) htmlFinal = htmlFinal.slice(start).trim();
          }

          if (!htmlFinal.startsWith("<")) throw new Error("HTML gerado inválido — tente novamente");

          // Injeta override do IntersectionObserver para garantir que animações
          // scroll-reveal (opacity:0 + IO) disparem imediatamente ao carregar.
          // Garante preview correto no iframe E no arquivo HTML baixado.
          const ioFix = `<script>(function(){var IO=window.IntersectionObserver;if(IO){window.IntersectionObserver=function(cb,opt){var io=new IO(cb,opt),orig=io.observe.bind(io);io.observe=function(t){orig(t);setTimeout(function(){try{cb([{isIntersecting:true,intersectionRatio:1,target:t,boundingClientRect:t.getBoundingClientRect(),intersectionRect:t.getBoundingClientRect(),rootBounds:null,time:0}],io);}catch(e){}},60);};return io;};window.IntersectionObserver.prototype=IO.prototype;}window.addEventListener('load',function(){setTimeout(function(){window.dispatchEvent(new Event('scroll'));},150);});})();<\/script>`;
          htmlFinal = htmlFinal.includes("</head>")
            ? htmlFinal.replace("</head>", ioFix + "</head>")
            : ioFix + htmlFinal;

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
