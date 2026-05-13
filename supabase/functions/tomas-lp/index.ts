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

// Streaming com envio de chunks SSE em tempo real
async function streamClaude(
  apiKey: string,
  system: string,
  content: unknown[],
  maxTokens: number,
  model: string,
  ctrl: ReadableStreamDefaultController,
  etapa: string,
  statusMsg: string,
  chunkInterval = 300,
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
      stream: true,
      system,
      messages: [{ role: "user", content }],
    }),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);

  const reader = r.body!.getReader();
  const dec = new TextDecoder();
  let full = "";
  let buf = "";
  let lastSent = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.type === "error") throw new Error(`Anthropic: ${JSON.stringify(parsed.error)}`);
        if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
          full += parsed.delta.text;
          if (full.length - lastSent >= chunkInterval) {
            lastSent = full.length;
            sse(ctrl, { etapa, status: statusMsg, conteudo: full });
          }
        }
      } catch (innerErr) {
        if (String(innerErr).includes("Anthropic:")) throw innerErr;
      }
    }
  }

  return full;
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

const DESIGNER_SYSTEM = `Você é a DESIGNER VISUAL sênior da Calu Agência — referência em landing pages de alto padrão. Sua missão é criar uma especificação visual que pareça ter saído de uma agência premium internacional, não de um template genérico.

FILOSOFIA DE DESIGN: Pense como as grandes agências pensam. Cada página é uma peça única: tipografia expressiva, espaço negativo generoso, hierarquia visual poderosa, cor com intenção. Nada de paletas seguras e sem personalidade.

COMO ESCOLHER A PALETA:
- Para mercados premium/luxo: fundo escuro (near-black), cor primária vibrante (dourado, âmbar, rosa-ouro, verde-esmeralda), texto branco
- Para educação/cursos: gradiente profundo (azul-índigo ou roxo-escuro), acento vibrante (laranja elétrico, verde-limão, ciano)
- Para saúde/bem-estar: fundo off-white (#F8F5F0), primária terrosa/verde-sálvia, tipografia serifada elegante
- Para tech/B2B: dark mode (#0A0A0F), primária em azul-elétrico ou verde-neon, cards glassmorphism
- Para o público indicado pelo briefing: adapte com criatividade e personalidade, nunca use azul-genérico #007bff ou verde-padrão #28a745

PALETA — defina 8 cores com propósito claro:
- Primária: #XXXXXX — [CTA, títulos em destaque, elementos-âncora]
- Secundária: #XXXXXX — [badges, ícones, bordas decorativas, subdestaques]
- Acento: #XXXXXX — [gradient combo, hover states, linhas decorativas]
- Fundo-1: #XXXXXX — [seções principais]
- Fundo-2: #XXXXXX — [seções alternadas — contraste claro/escuro]
- Fundo-3: #XXXXXX — [cards, inputs, elementos internos]
- Texto-principal: #XXXXXX
- Texto-secundário: #XXXXXX
- Gradient-hero: linear-gradient(135deg, #XXXXXX 0%, #XXXXXX 50%, #XXXXXX 100%) [gradient rico, 3 stops]
- Gradient-CTA: linear-gradient(90deg, #XXXXXX, #XXXXXX) [para o botão principal]

TIPOGRAFIA — escolha um par expressivo do Google Fonts:
- Display/Headline (h1, h2): [fonte expressiva — ex: Playfair Display, Sora, Space Grotesk, Clash Display, Cabinet Grotesk] — weight 700-900
  - h1: clamp(48px, 6vw, 80px) — letter-spacing: -0.03em — line-height: 1.1
  - h2: clamp(32px, 4vw, 56px) — letter-spacing: -0.02em — line-height: 1.15
  - h3: clamp(20px, 2.5vw, 28px) — letter-spacing: -0.01em
- Corpo (p, li): [fonte legível — ex: Inter, DM Sans, Plus Jakarta Sans] — weight 400 — 17px — line-height: 1.8
- Label/Badge: weight 600-700 — uppercase — letter-spacing: 0.08em — 11-12px
- Destaque em texto: gradient-text usando background-clip: text (cor primária → acento)

ESTILO_VISUAL — descreva o mood e 3 técnicas visuais premium a usar:
[Ex: "Dark luxury tech — glassmorphism nos cards com backdrop-filter: blur(20px), gradient mesh no hero com 3 orbs coloridos CSS, tipografia display com gradient no h1"]

ESPECIFICAÇÃO DAS SEÇÕES:

1. HERO — layout de impacto máximo:
   - Fundo: [gradient hero + noise texture via SVG data:url ou orbs/blobs com CSS radial-gradient]
   - Pré-headline: badge pequeno com borda gradient (padding 6px 16px, border-radius 999px, borda 1px gradient)
   - h1: [fonte display, gradient-text primária→acento, clamp responsivo]
   - Subtítulo: max-width 600px, cor texto-secundário
   - CTA duplo: botão primário (gradient) + botão ghost (borda 1px, fundo transparente)
   - Elemento decorativo: [orbs CSS com radial-gradient + blur, grid pattern, formas geométricas SVG inline]
   - Social proof strip: logos/números flutuando abaixo do CTA ("+ de X clientes" ou "⭐ X.X/5")

2. BENEFICIOS — grid premium:
   - Layout: 3 colunas desktop, 1 mobile com gap generoso (32-40px)
   - Cards: fundo Fundo-3, border 1px sólida cor-borda, border-radius 20-24px
   - Hover effect: border-color muda para primária, sutil translateY(-4px), box-shadow colorido
   - Ícone: círculo 52x52px com gradient primária→acento + ícone Font Awesome branco
   - Número/stat em destaque acima do título se o copy tiver dados

3. PROVA_SOCIAL — depoimentos que convertem:
   - Fundo alternado (Fundo-2)
   - Cards com aspas gigantes decorativas (font-size: 120px, cor primária, opacity: 0.15, position: absolute)
   - Avatar: círculo 56px, gradient como placeholder
   - Stars: ⭐⭐⭐⭐⭐ em dourado/primária acima do texto
   - Borda-esquerda: 4px sólida primária para destaque

4. SOBRE/CREDENCIAIS:
   - Layout assimétrico: texto 55% + elemento visual 45% (grid ou stat box)
   - Stat boxes: 2-3 números grandes (ex: "847 clientes", "98% satisfação") em cards mini com gradient
   - Linha decorativa horizontal: 2px gradient primária→acento antes do título

5. OFERTA/PREÇO:
   - Card centralizado com bordas gradient (usar border-image ou outline + border-radius trick)
   - Badge "Mais popular" / "Oferta limitada" no topo com cor primária
   - Lista de itens incluídos com ícone check-circle em primária
   - Preço em destaque: fonte display 56px, cor primária
   - Urgência: fundo vermelho-suave ou amber com ícone clock

6. FORMULÁRIO CTA — seção de conversão:
   - Fundo: gradient hero ou cor primária com 10% opacity sobre fundo escuro
   - Campos: fundo Fundo-3, borda 1px Fundo-3 mais clara, focus: border primária + box-shadow 0 0 0 3px rgba(primária, 0.2)
   - Botão: 100% largura, gradient CTA, font-size 18px, padding 18px, border-radius 14px
   - Microcopy abaixo do botão: "🔒 Seus dados estão seguros" em texto-secundário

7. FOOTER:
   - Fundo near-black (#0A0A0F ou similar)
   - Logo/nome da empresa em primária
   - Links mínimos + linha separadora com gradient

EFEITOS CSS PREMIUM OBRIGATÓRIOS:
- Gradient text no h1: background: gradient; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
- Glassmorphism (se dark mode): background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1);
- Orbs decorativos no hero: divs absolutos com border-radius:50%, radial-gradient, filter:blur(60-100px), animation suave de float
- Hover em cards: transition: all 0.3s cubic-bezier(0.4,0,0.2,1); transform: translateY(-6px); box-shadow com cor primária
- Borda gradient nos cards especiais: outline com pseudo-elemento ::before ou border-image

## CTA_BUTTON_SPEC
- Background: gradient-CTA (linear-gradient dos dois tons)
- Cor do texto: #FFFFFF — weight 700 — font-size: 17px — letter-spacing: 0.02em
- Border-radius: 14px
- Padding: 18px 48px
- Box-shadow: 0 4px 24px rgba(cor-primária, 0.4)
- Hover: translateY(-3px) + box-shadow: 0 8px 40px rgba(cor-primária, 0.55) + brightness(1.1)
- Transition: all 0.25s cubic-bezier(0.4,0,0.2,1)

Retorne SOMENTE a especificação abaixo. Nenhum texto introdutório ou explicativo.`;


const TOMAS_SYSTEM = `Você é TOMÁS, desenvolvedor frontend sênior da Calu Agência. Seu padrão de entrega é igual ao das melhores agências do mundo: Awwwards, Dribbble Top Shots, Stripe, Linear, Vercel. Cada LP que você cria parece ter custado R$ 15.000.

STACK OBRIGATÓRIA:
1. Documento único <!DOCTYPE html>...</html>. CSS em <style> na <head>. Google Fonts + Font Awesome 6 via CDN.
2. CSS Custom Properties no :root para toda a paleta — use var(--cor) em todo o CSS.
3. Responsivo com clamp() para tipografia fluida. Breakpoints: 480px (mobile), 768px (tablet), 1024px (desktop).
4. Container: max-width: 1200px; margin: 0 auto; padding-inline: clamp(20px, 5vw, 80px).
5. Cores e fontes EXATAMENTE como na especificação do Designer.
6. Copy EXATAMENTE como a Beatriz escreveu — cada palavra conta.
7. Imagens: gradientes CSS premium como placeholder. Sem URLs externas.

HERO — IMPACTO MÁXIMO (implemente tudo):
- Fundo com orbs decorativos: 2-3 divs position:absolute com border-radius:50%, radial-gradient, filter:blur(80px), pointer-events:none, z-index:0 — cores da paleta com 40-60% opacity
- Badge pré-headline: display:inline-flex, border-radius:999px, padding:6px 16px, border:1px solid com gradient ou cor primária/30%, font-size:12px, font-weight:600, uppercase, letter-spacing:0.08em
- h1 com gradient-text: background: linear-gradient(135deg, cor-primária, cor-acento); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text
- CTA duplo: botão primário (gradient + sombra colorida) + botão ghost (border 1.5px, fundo transparente, hover: fundo sutil)
- Social proof abaixo dos botões: flex row, avatares empilhados (3 círculos com gradient sobrepostos -8px), texto "X+ clientes satisfeitos"

CARDS DE BENEFÍCIOS — design premium:
- border-radius: 20px; padding: 32px; background: var(--bg-card); border: 1px solid var(--border-color)
- Hover: transform: translateY(-6px); box-shadow: 0 20px 60px rgba(cor-primária, 0.15); border-color: var(--primary)/50%
- Ícone: div 52x52px, border-radius: 14px, background: gradient primária→acento, display:flex, align-items:center, justify-content:center; ícone Font Awesome branco 22px
- Transition: all 0.3s cubic-bezier(0.4,0,0.2,1)

DEPOIMENTOS — autoridade visual:
- Aspas gigantes decorativas: ::before com content:'"', font-size:120px, color:primária, opacity:0.12, position:absolute, top:-20px, left:20px, line-height:1, font-family:Georgia
- Stars: span com ★★★★★, color:cor-dourado-ou-primária, font-size:18px, margin-bottom:12px
- Borda esquerda: border-left: 4px solid var(--primary)

FORMULÁRIO — conversão máxima:
- Campos: background:var(--bg-input); border:1.5px solid var(--border-color); border-radius:12px; padding:14px 18px; font-size:16px; width:100%; transition:border-color 0.2s, box-shadow 0.2s
- Focus: border-color:var(--primary); box-shadow:0 0 0 3px rgba(primária, 0.15); outline:none
- Label: font-size:13px; font-weight:600; letter-spacing:0.04em; margin-bottom:6px; color:var(--text-secondary)
- Botão submit: width:100%; padding:18px; font-size:17px; font-weight:700; border-radius:14px; background:gradient; border:none; cursor:pointer; letter-spacing:0.02em; box-shadow:sombra colorida

NÚMEROS E STATS (se o copy tiver):
- Exibir em grid 3 colunas com número grande (clamp(36px,5vw,64px), font-weight:800, gradient-text) + label abaixo

ANIMAÇÕES — implementar tudo:
@keyframes fadeInUp { from { opacity:0.01; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn   { from { opacity:0.01; } to { opacity:1; } }
@keyframes float    { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-20px) } }
@keyframes pulse-glow { 0%,100% { box-shadow:0 0 20px rgba(primária,0.3) } 50% { box-shadow:0 0 40px rgba(primária,0.6) } }

- Aplique fadeInUp nos títulos e elementos-chave com animation-delay escalonado: 0s, 0.1s, 0.2s, 0.3s
- Orbs do hero: animation: float 8s ease-in-out infinite (delays diferentes para cada orb)
- PROIBIDO: opacity:0 como estado; PROIBIDO: IntersectionObserver ou scroll listeners

SEÇÃO SEPARADORA (entre seções principais):
- Use <div class="section-divider"> com SVG wave inline ou diagonal clip-path:polygon(0 0, 100% 0, 100% 85%, 0 100%)
- Ou border-top: 1px solid rgba(255,255,255,0.06) com gradiente sutil

DETALHES QUE FAZEM A DIFERENÇA:
- scroll-behavior: smooth no html
- ::selection { background: primária/30%; }
- Scrollbar estilizada: ::-webkit-scrollbar (width:6px), ::-webkit-scrollbar-thumb (background:primária, border-radius:3px)
- Botões e links: cursor:pointer em todos
- Imagem placeholder do hero: div com aspect-ratio, gradient premium + pattern decorativo (CSS repeating-linear-gradient para grid sutil)
- Microcopy abaixo do formulário: 🔒 "Seus dados estão 100% seguros. Sem spam."

SEMÂNTICA E ESTRUTURA:
- <header> para nav/hero, <main> com <section> para cada bloco, <footer>
- IDs descritivos: #hero, #beneficios, #depoimentos, #sobre, #oferta, #contato
- Nav sticky com backdrop-filter:blur(20px) + border-bottom:1px solid rgba(255,255,255,0.08)

Retorne SOMENTE o código HTML completo, sem markdown, sem explicações, sem code fences.
Comece com <!DOCTYPE html> e termine com </html>.`;

// ── Handler ────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    const { briefing, client_name, arquivos = [] } = body;
    // arquivos: Array<{ name: string; base64: string; media_type?: string }>

    // Skills de texto (txt/md) são injetadas como instruções extras no Designer e no Tomás
    const skillTexts: string[] = [];
    for (const arq of arquivos) {
      if (!arq.base64) continue;
      if (/\.(txt|md)$/i.test(arq.name ?? "")) {
        try { skillTexts.push(`[${arq.name}]\n${atob(arq.base64)}`); } catch { /* ignora */ }
      }
    }
    const skillContext = skillTexts.length > 0
      ? `\n\n--- Referências de estilo e técnicas adicionais (use como inspiração e guia) ---\n${skillTexts.join("\n\n")}`
      : "";

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY") ?? "";
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada no Supabase");

    const stream = new ReadableStream({
      async start(ctrl) {
        try {
          // ── BEATRIZ: copy (streaming em tempo real) ───────────────────────
          sse(ctrl, { etapa: "copy", status: "Beatriz escrevendo o copy..." });

          const beatrizContent: unknown[] = [
            {
              type: "text",
              text: `Cliente: ${client_name || "não informado"}\n\nBriefing:\n${briefing}\n\nCrie o copy completo da landing page seguindo a estrutura obrigatória.`,
            },
          ];

          // Injeta apenas PDFs como document blocks para Beatriz (TXT/MD são skill files — somente skillContext)
          for (const arq of arquivos) {
            if (!arq.base64) continue;
            if (arq.media_type === "application/pdf" || arq.name?.toLowerCase().endsWith(".pdf")) {
              beatrizContent.push({
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: arq.base64 },
                title: arq.name ?? "documento",
              });
            }
          }

          const copy = await streamClaude(
            apiKey, BEATRIZ_SYSTEM, beatrizContent, 2000,
            "claude-haiku-4-5-20251001", ctrl, "copy", "Beatriz escrevendo...", 300,
          );
          sse(ctrl, { etapa: "copy", status: "Copy finalizado ✓", conteudo: copy });

          // ── DESIGNER: identidade visual ────────────────────────────────────
          sse(ctrl, { etapa: "design", status: "Designer definindo a identidade visual..." });

          const designContent: unknown[] = [
            {
              type: "text",
              text: `Briefing do cliente:\n${briefing}\n\nCliente: ${client_name || "não informado"}\n\nCopy criado pela Beatriz:\n${copy}${skillContext}\n\nDefina a especificação visual completa da landing page.`,
            },
          ];

          const design = await callClaude(apiKey, DESIGNER_SYSTEM, designContent, 1800, "claude-haiku-4-5-20251001");
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
              messages: [{ role: "user", content: [{ type: "text", text: `Copy da Beatriz:\n${copy}\n\nEspecificação visual do Designer:\n${design}${skillContext}\n\nCrie o HTML completo da landing page agora.` }] }],
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
