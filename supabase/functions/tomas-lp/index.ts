import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sse(ctrl: ReadableStreamDefaultController, obj: object) {
  ctrl.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`));
}

// Keeps SSE connection alive with a periodic ping (prevents 504 on long pipelines)
function startHeartbeat(ctrl: ReadableStreamDefaultController, etapa: string, msg: string): ReturnType<typeof setInterval> {
  return setInterval(() => {
    try { sse(ctrl, { etapa, status: msg }); } catch { /* stream closed */ }
  }, 8000);
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
[Frase de escassez ou urgência SE o briefing indicar prazo, vagas limitadas ou promoção — caso contrário, deixe esta linha em branco]

## MODULOS
[SE o material contiver módulos, aulas, etapas, capítulos ou temas — liste TODOS aqui no formato abaixo. Inclua TODOS os que estiverem no documento, sem omitir nenhum. Se não houver, deixe em branco.]
**Módulo 1 — [Título do módulo]:** [Aulas/tópicos: Aula 1.1 Título | Aula 1.2 Título | ...]
**Módulo 2 — [Título do módulo]:** [...]
[continue para todos os módulos]`;

const DESIGNER_SYSTEM = `Você é a DESIGNER VISUAL sênior da Calu Agência. Seu output alimenta diretamente um desenvolvedor que vai implementar o HTML — seja PRECISA, ESPECÍFICA e OUSADA. Nada de paletas seguras ou tipografia genérica.

LEITURA DO BRIEFING:
Analise o nicho, o público e o tom de voz antes de escolher qualquer cor ou fonte. A identidade visual deve ser uma extensão da promessa do produto.

ESCOLHA DA PALETA (adapte ao nicho):
- Luxo/premium: fundo #0A0A0A ou #0D0A06, primária dourada/âmbar (#D4A853, #E8B84B) ou esmeralda (#00C896), texto #F5F0E8
- Educação/cursos: fundo #0E0B1A, primária laranja-elétrico (#FF6B35) ou verde-limão (#A8FF3E) sobre roxo profundo
- Saúde/bem-estar: fundo #F7F4EF ou #0B1A14, primária verde-sálvia (#6B8F71) ou coral (#E8735A), tipografia serifada
- Tech/SaaS: fundo #050508, primária ciano-néon (#00D9FF) ou verde-matrix (#00FF88), glassmorphism agressivo
- Jurídico/corporativo: fundo #F8F6F1, primária azul-naval (#1B3A6B) ou bordô (#8B1A1A), serifa elegante
- NUNCA use: #007bff, #28a745, #dc3545, #6c757d (são as cores de Bootstrap — parecem template genérico)

PALETA — 10 valores exatos (hex real, não XXXXXX):
--color-primary: [hex]      /* CTA principal, h1 gradient, ícones, destaques */
--color-accent:  [hex]      /* segundo tom do gradient, hover states */
--color-secondary: [hex]    /* badges, bordas decorativas */
--bg-1: [hex]               /* fundo seções ímpares (hero, benefícios, oferta) */
--bg-2: [hex]               /* fundo seções pares (depoimentos, sobre) */
--bg-card: [hex]            /* cards, formulário inputs */
--bg-nav: [hex com opacity] /* ex: rgba(10,10,10,0.85) — nav blur */
--text-1: [hex]             /* texto principal */
--text-2: [hex]             /* texto secundário, labels */
--border: [rgba]            /* ex: rgba(255,255,255,0.08) ou rgba(0,0,0,0.1) */
--grad-hero: linear-gradient(135deg, [hex1] 0%, [hex2] 50%, [hex3] 100%)
--grad-cta: linear-gradient(135deg, [primary], [accent])
--primary-rgb: [R],[G],[B]  /* OBRIGATÓRIO: valores decimais da cor primária para rgba() — ex: se primária for #D4A853, aqui vai 212,168,83 */
--accent-rgb:  [R],[G],[B]  /* OBRIGATÓRIO: idem para a cor acento */

TIPOGRAFIA (Google Fonts — par expressivo):
- Display (h1, h2, h3): [nome exato da fonte] — pesos 700/800/900 — h1: clamp(44px,6vw,80px) ls:-0.03em lh:1.05
- Corpo (p, li, label): [nome exato da fonte] — peso 400/500 — 17px lh:1.85
- Badge/label: uppercase, ls:0.1em, peso 700, 11-12px
- Google Fonts URL: [URL completa com family= e weights]

MOOD E TÉCNICA (escolha 3 obrigatoriamente):
[ ] Glassmorphism agressivo: bg rgba(255,255,255,0.05) + backdrop-filter blur(24px) + border rgba(255,255,255,0.1)
[ ] Gradient mesh no hero: 3 orbs radiais com filter:blur(100px) animados com float
[ ] Dark luxury: seções em fundos quase-pretos alternados, tipografia ultra-bold com gradient-text
[ ] Neon glow: box-shadow colorido nos cards, text-shadow nos títulos, borders luminosas
[ ] Organic shapes: clip-path nas seções, SVG waves entre seções, formas assimétricas
[ ] Editorial bold: tipografia enorme ocupando toda a largura, espaço negativo generoso

ORB-1 (hero, posição top-right): tamanho [px]x[px], cor rgba([primary-rgb], [opacity]), blur [px]
ORB-2 (hero, posição bottom-left): tamanho [px]x[px], cor rgba([accent-rgb], [opacity]), blur [px]
ORB-3 (hero, posição center): tamanho [px]x[px], cor mista, blur [px]

SEÇÕES — especifique fundo, destaque visual e intenção:
1. NAV: bg var(--bg-nav) + backdrop-filter blur(20px), logo cor primária, links texto-2
2. HERO: fundo var(--grad-hero), h1 com gradient-text, badge pré-headline, CTA duplo, social proof com avatares
3. BENEFÍCIOS: fundo var(--bg-1) ou var(--bg-2), cards com icon-box gradient + hover sutil, emojis como ícones
4. COMO FUNCIONA: fundo alternado, steps numerados com círculos gradient, linha vertical conectando os números, max-width 680px centralizado
5. DEPOIMENTOS: fundo alternado, aspas decorativas, borda-esquerda primária, stars douradas
6. SOBRE: layout 55/45, stat boxes com números grandes em gradient-text
7. OFERTA: card centralizado max-width 560px, border gradient, lista check com ícone primária
8. CTA FORM: fundo com overlay do grad-hero em baixa opacidade, badge de urgência, formulário com inputs estilizados
9. FOOTER: fundo near-black, linha gradient, logo em primária

Retorne SOMENTE os valores acima preenchidos, sem texto extra.`;


const TOMAS_SYSTEM = `Você é TOMÁS, desenvolvedor frontend sênior da Calu Agência. Entrega páginas nível Awwwards — cada LP parece ter custado R$20.000. Use os templates CSS abaixo como base e adapte com os valores exatos da spec do Designer.

━━━ REGRAS ABSOLUTAS ━━━
- Copy: use CADA palavra da Beatriz — não resuma, não parafraseie
- Cores: use CADA valor hex da spec — não invente cores
- Fontes: importe do Google Fonts com a URL exata da spec
- Imagens: ZERO URLs externas — use gradientes CSS como placeholder
- JavaScript: ZERO IntersectionObserver, ZERO scroll listeners, ZERO opacity:0 inicial
- Estrutura: um único arquivo HTML completo, CSS inline em <style>

━━━ TEMPLATES CSS (adapte os valores, não mude a estrutura) ━━━

/* 1. CUSTOM PROPERTIES — substitua cada [VALOR] pelo hex/rgb da spec */
/* ATENÇÃO: --rgb vem do campo --primary-rgb do Designer (ex: "212,168,83") */
:root {
  --p: [hex primária];          /* cor primária */
  --a: [hex acento];            /* cor acento */
  --bg1: [hex fundo-1];         /* fundo principal */
  --bg2: [hex fundo-2];         /* fundo alternado */
  --bgc: [hex bg-card];         /* cards / inputs */
  --t1: [hex texto-1];          /* texto principal */
  --t2: [hex texto-2];          /* texto secundário */
  --bdr: [rgba border];         /* ex: rgba(255,255,255,0.08) */
  --rgb: [COPIE AQUI o valor de --primary-rgb da spec, ex: 212,168,83];
  --gh: [grad-hero completo];   /* linear-gradient(135deg,...) */
  --gc: linear-gradient(135deg, var(--p), var(--a));
  --sc: 0 4px 28px rgba(var(--rgb),.4);   /* sombra CTA */
  --sk: 0 4px 24px rgba(0,0,0,.15);       /* sombra card */
}

/* 2. RESET + BASE */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
html::-webkit-scrollbar{width:6px}
html::-webkit-scrollbar-thumb{background:var(--p);border-radius:3px}
::selection{background:rgba(var(--rgb),.25)}
body{background:var(--bg1);color:var(--t1);font-family:'[BODY_FONT]',sans-serif;font-size:17px;line-height:1.85;overflow-x:hidden}
h1,h2,h3{font-family:'[DISPLAY_FONT]',sans-serif;line-height:1.08;letter-spacing:-.03em}
h1{font-size:clamp(44px,6vw,82px)}
h2{font-size:clamp(32px,4vw,58px);letter-spacing:-.02em}
h3{font-size:clamp(20px,2.5vw,28px);letter-spacing:-.01em}
p{color:var(--t2)}
a{text-decoration:none;cursor:pointer}
img{max-width:100%;display:block}

/* 3. LAYOUT */
.wrap{max-width:1200px;margin-inline:auto;padding-inline:clamp(20px,5vw,80px)}
section{padding-block:clamp(80px,10vw,140px)}

/* 4. GRADIENT TEXT */
.gt{background:var(--gh);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;display:inline}

/* 5. BUTTONS */
.btn{display:inline-flex;align-items:center;gap:8px;padding:16px 40px;border-radius:14px;font-weight:700;font-size:16px;letter-spacing:.02em;cursor:pointer;text-decoration:none;border:none;transition:all .25s cubic-bezier(.4,0,.2,1);font-family:inherit}
.btn-p{background:var(--gc);color:#fff;box-shadow:var(--sc)}
.btn-p:hover{transform:translateY(-3px);filter:brightness(1.12);box-shadow:0 8px 40px rgba(var(--rgb),.55)}
.btn-g{background:transparent;color:var(--p);border:1.5px solid var(--p)}
.btn-g:hover{background:rgba(var(--rgb),.1)}

/* 6. NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:100;height:64px;display:flex;align-items:center;justify-content:space-between;padding-inline:clamp(20px,5vw,80px);background:[var(--bg-nav) da spec OU rgba(var(--rgb_bg1),0.88)];backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--bdr)}
.nav-logo{font-family:'[DISPLAY_FONT]',sans-serif;font-weight:800;font-size:20px;color:var(--p)}
.nav-links{display:flex;gap:32px;list-style:none}
.nav-links a{color:var(--t2);font-size:14px;font-weight:500;transition:color .2s}
.nav-links a:hover{color:var(--t1)}

/* 7. HERO */
.hero{min-height:100vh;display:flex;align-items:center;background:var(--gh);position:relative;overflow:hidden;padding-top:64px}
.hero-content{position:relative;z-index:1;max-width:720px}
.orb{position:absolute;border-radius:50%;pointer-events:none;z-index:0}
.orb-1{width:[W]px;height:[W]px;background:radial-gradient(circle,rgba(var(--rgb),.35) 0%,transparent 70%);filter:blur(90px);top:-120px;right:-80px;animation:float 9s ease-in-out infinite}
.orb-2{width:[W]px;height:[W]px;background:radial-gradient(circle,rgba([ACCENT_RGB],.25) 0%,transparent 70%);filter:blur(80px);bottom:-80px;left:-60px;animation:float 11s ease-in-out infinite .5s}
.orb-3{width:[W]px;height:[W]px;background:radial-gradient(circle,rgba([SECONDARY_RGB],.2) 0%,transparent 70%);filter:blur(120px);top:40%;left:40%;animation:float 13s ease-in-out infinite 1s}

/* BADGE */
.badge{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border:1px solid rgba(var(--rgb),.35);color:var(--p);background:rgba(var(--rgb),.1);margin-bottom:24px}

/* SOCIAL PROOF STRIP */
.sp-strip{display:flex;align-items:center;gap:12px;margin-top:32px}
.sp-avatars{display:flex}
.sp-av{width:36px;height:36px;border-radius:50%;border:2px solid var(--bg1);background:var(--gc);margin-left:-10px}
.sp-av:first-child{margin-left:0}
.sp-text{font-size:14px;color:var(--t2)}
.sp-text strong{color:var(--t1)}

/* 8. BENEFITS CARDS */
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.card{background:var(--bgc);border-radius:20px;padding:32px;border:1px solid var(--bdr);transition:all .3s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden}
.card:hover{transform:translateY(-6px);box-shadow:0 20px 60px rgba(var(--rgb),.18);border-color:rgba(var(--rgb),.45)}
.icon-box{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:var(--gc);box-shadow:0 4px 16px rgba(var(--rgb),.35);margin-bottom:20px;flex-shrink:0;font-size:26px;line-height:1}
/* Ícones: use EMOJI Unicode direto no HTML — ex: <span class="icon-box">🚀</span>. NUNCA use Font Awesome. */

/* GLASSMORPHISM variant (usar quando bg-card é escuro) */
.glass{background:rgba(255,255,255,.05);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1)}

/* 9. TESTIMONIALS */
.tcard{background:var(--bgc);border-radius:20px;padding:32px 32px 32px 36px;border-left:4px solid var(--p);position:relative;overflow:hidden}
.tcard::before{content:'"';position:absolute;top:-8px;left:16px;font-size:120px;line-height:1;font-family:Georgia,serif;color:var(--p);opacity:.1;pointer-events:none}
.stars{color:#F5C518;font-size:16px;letter-spacing:2px;margin-bottom:12px;display:block}
.t-author{display:flex;align-items:center;gap:12px;margin-top:20px}
.t-av{width:48px;height:48px;border-radius:50%;background:var(--gc);flex-shrink:0}
.t-name{font-weight:700;font-size:15px;color:var(--t1)}
.t-role{font-size:13px;color:var(--t2)}

/* 10. HOW IT WORKS (Como Funciona) */
.steps{display:flex;flex-direction:column;gap:0;max-width:680px;margin-inline:auto;position:relative}
.steps::before{content:'';position:absolute;left:25px;top:52px;bottom:52px;width:2px;background:linear-gradient(to bottom,var(--p),rgba(var(--rgb),.1));z-index:0}
.step{display:flex;gap:28px;align-items:flex-start;position:relative;z-index:1;padding-bottom:40px}
.step:last-child{padding-bottom:0}
.step-num{width:52px;height:52px;min-width:52px;border-radius:50%;background:var(--gc);color:#fff;font-weight:900;font-size:18px;display:flex;align-items:center;justify-content:center;box-shadow:var(--sc);font-family:'[DISPLAY_FONT]',sans-serif}
.step-body h3{margin-bottom:8px;color:var(--t1)}
.step-body p{color:var(--t2);font-size:16px;line-height:1.7}
/* Alternativa horizontal (3 passos em grid): */
.steps-h{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;text-align:center}
.steps-h .step{flex-direction:column;align-items:center;text-align:center;padding-bottom:0}
.steps-h .step-num{margin-inline:auto;margin-bottom:16px}

/* 10b. ABOUT / STATS */
.grid2{display:grid;grid-template-columns:55fr 45fr;gap:60px;align-items:center}
.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.stat-card{text-align:center;padding:24px 16px;background:rgba(var(--rgb),.08);border-radius:16px;border:1px solid rgba(var(--rgb),.2)}
.stat-n{font-size:clamp(28px,4vw,44px);font-weight:900;line-height:1;display:block}
.stat-l{font-size:13px;color:var(--t2);margin-top:6px;display:block}
.section-line{width:56px;height:3px;background:var(--gc);border-radius:2px;margin-bottom:20px}

/* 11. OFFER CARD */
.offer-card{max-width:580px;margin-inline:auto;background:var(--bgc);border-radius:24px;padding:48px;position:relative;box-shadow:0 24px 80px rgba(var(--rgb),.2);border:1px solid rgba(var(--rgb),.3)}
.offer-badge{display:inline-block;padding:6px 16px;border-radius:999px;background:var(--gc);color:#fff;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:24px}
.offer-price{font-size:clamp(48px,6vw,72px);font-weight:900;line-height:1;margin-block:16px}
.check-list{list-style:none;display:flex;flex-direction:column;gap:12px;margin-block:24px}
.check-list li{display:flex;align-items:center;gap:10px;font-size:16px;color:var(--t1)}
.check-list li i{color:var(--p);font-size:18px;flex-shrink:0}

/* 12. FORM */
.form-wrap{max-width:520px;margin-inline:auto}
.form-group{margin-bottom:20px}
.form-label{display:block;font-size:13px;font-weight:600;letter-spacing:.04em;color:var(--t2);margin-bottom:8px;text-transform:uppercase}
.form-field{width:100%;padding:14px 18px;background:var(--bgc);border:1.5px solid var(--bdr);border-radius:12px;color:var(--t1);font-size:16px;font-family:inherit;transition:border-color .2s,box-shadow .2s;outline:none}
.form-field:focus{border-color:var(--p);box-shadow:0 0 0 3px rgba(var(--rgb),.15)}
.form-field::placeholder{color:rgba(var(--rgb_t2),.5)}
.btn-submit{width:100%;padding:18px;font-size:17px;font-weight:700;border-radius:14px;background:var(--gc);color:#fff;border:none;cursor:pointer;box-shadow:var(--sc);transition:all .25s cubic-bezier(.4,0,.2,1);letter-spacing:.02em;font-family:inherit}
.btn-submit:hover{transform:translateY(-2px);filter:brightness(1.08)}
.form-micro{text-align:center;font-size:13px;color:var(--t2);margin-top:12px;opacity:.8}
/* FORM FIELDS HTML — sempre use estes name attrs para o CRM capturar corretamente:
<input class="form-field" type="text"  name="name"    placeholder="Seu nome completo">
<input class="form-field" type="email" name="email"   placeholder="Seu melhor e-mail">
<input class="form-field" type="tel"   name="phone"   placeholder="WhatsApp com DDD">
<textarea class="form-field"           name="message" rows="3" placeholder="Mensagem (opcional)"></textarea>
*/

/* 13. FORMINATOR OVERRIDE — form fields inherit LP design automatically */
.forminator-custom-form,.forminator-custom-form .forminator-ui{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important}
.forminator-custom-form .forminator-input,.forminator-custom-form .forminator-textarea,.forminator-custom-form .forminator-select-field select,.forminator-custom-form input[type="text"],.forminator-custom-form input[type="email"],.forminator-custom-form input[type="tel"],.forminator-custom-form input[type="number"],.forminator-custom-form textarea{width:100%!important;padding:14px 18px!important;background:var(--bgc)!important;border:1.5px solid var(--bdr)!important;border-radius:12px!important;color:var(--t1)!important;font-size:16px!important;font-family:inherit!important;transition:border-color .2s,box-shadow .2s!important;outline:none!important;box-sizing:border-box!important}
.forminator-custom-form .forminator-input:focus,.forminator-custom-form .forminator-textarea:focus,.forminator-custom-form input:focus,.forminator-custom-form textarea:focus{border-color:var(--p)!important;box-shadow:0 0 0 3px rgba(var(--rgb),.15)!important}
.forminator-custom-form .forminator-label,.forminator-custom-form label{color:var(--t2)!important;font-size:13px!important;font-weight:600!important;letter-spacing:.04em!important;text-transform:uppercase!important;margin-bottom:8px!important;display:block!important}
.forminator-custom-form .forminator-button,.forminator-custom-form button[type="submit"],.forminator-custom-form input[type="submit"]{width:100%!important;padding:18px!important;font-size:17px!important;font-weight:700!important;border-radius:14px!important;background:var(--gc)!important;color:#fff!important;border:none!important;cursor:pointer!important;box-shadow:var(--sc)!important;transition:all .25s cubic-bezier(.4,0,.2,1)!important;letter-spacing:.02em!important;font-family:inherit!important}
.forminator-custom-form .forminator-button:hover,.forminator-custom-form button[type="submit"]:hover{transform:translateY(-2px)!important;filter:brightness(1.08)!important}
.forminator-custom-form .forminator-row{margin-bottom:20px!important}
.forminator-custom-form .forminator-error-message,.forminator-custom-form .forminator-field-error{color:#ff4f4f!important;font-size:13px!important;margin-top:4px!important}
.forminator-custom-form .forminator-response-output{border-radius:12px!important;padding:16px!important;margin-top:16px!important}

/* 14. FOOTER */
footer{background:#050508;border-top:1px solid rgba(255,255,255,.06);padding-block:48px}
.footer-inner{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:24px}
.footer-logo{font-family:'[DISPLAY_FONT]',sans-serif;font-weight:800;font-size:20px;color:var(--p)}
.footer-links{display:flex;gap:24px}
.footer-links a{color:var(--t2);font-size:14px;transition:color .2s}
.footer-links a:hover{color:var(--t1)}
.footer-copy{font-size:13px;color:var(--t2);opacity:.6;margin-top:24px;text-align:center}

/* 15. ANIMATIONS */
@keyframes fadeInUp{from{opacity:.01;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:.01}to{opacity:1}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-22px)}}
.a1{animation:fadeInUp .65s ease both}
.a2{animation:fadeInUp .65s ease both .1s}
.a3{animation:fadeInUp .65s ease both .2s}
.a4{animation:fadeInUp .65s ease both .3s}
.a5{animation:fadeIn .65s ease both .4s}

/* 16. RESPONSIVE */
@media(max-width:1024px){.grid3{grid-template-columns:repeat(2,1fr)}.grid2{grid-template-columns:1fr;gap:40px}}
@media(max-width:640px){.grid3{grid-template-columns:1fr}.grid2{grid-template-columns:1fr}.stat-grid{grid-template-columns:repeat(2,1fr)}.nav-links{display:none}.btn{padding:14px 28px;font-size:15px}}

━━━ MAPEAMENTO DO COPY DA BEATRIZ → HTML ━━━
A Beatriz entrega o copy em seções com prefixo ##. Use CADA palavra, sem cortar:
## HEADLINE        → <h1 class="gt"> no hero
## SUBHEADLINE     → <p> subtítulo abaixo do h1 no hero
## HERO            → parágrafo descritivo no hero (opcional, antes dos CTAs)
## BENEFICIOS      → cada linha **Título:** Descrição → um .card (icon-box emoji + h3 + p)
## PROVA_SOCIAL    → cada depoimento **Nome, Cargo:** "texto" → um .tcard
## SOBRE           → texto na seção #sobre
## OFERTA          → conteúdo do .offer-card (check-list + price se houver)
## CTA_BOTAO       → texto do .btn-p (botão principal)
## URGENCIA        → badge/linha de urgência na seção #contato (se não vazio)

━━━ ESTRUTURA HTML OBRIGATÓRIA ━━━
Use exatamente essa sequência:
<nav> → logo (texto estilizado) + links + .btn-p CTA
<header id="hero"> → orbs + badge + h1.gt + subtítulo + hero text + .btn-p + .btn-g + .sp-strip
<section id="beneficios"> → h2 + grid de 3-4 .card com .icon-box (emoji) + h3 + p
<section id="como-funciona"> → h2 + .steps (3-4 .step com .step-num + .step-body)
[SE o copy da Beatriz contiver seção ## MODULOS com dados]:
<section id="conteudo-programatico"> → h2 "O que você vai aprender" + contador (X módulos · Y aulas) + acordeão <details>/<summary> para CADA módulo listado na seção ## MODULOS — inclua TODOS os módulos, sem omitir nenhum. Cada <details> mostra o título do módulo no <summary> e as aulas em <ul> dentro.
<section id="depoimentos"> → h2 + grid de 3 .tcard com stars + texto + .t-author
<section id="sobre"> → .grid2 com texto+stat-grid
<section id="oferta"> → .offer-card com badge + .check-list + .btn-submit
<section id="contato"> → badge urgência + .form-wrap com h2 + .form-group × 2-3 + .btn-submit
<footer> → .footer-inner + .footer-copy

━━━ QUALIDADE FINAL ━━━
Antes de finalizar o HTML mentalmente revise:
✓ --rgb definido com os valores R,G,B decimais do Designer (--primary-rgb)?
✓ Google Fonts com preconnect e URL completa da spec?
✓ Orbs presentes no hero com tamanhos e delays diferentes?
✓ h1 usa a classe .gt para gradient-text?
✓ Cards têm hover com transform + box-shadow colorido?
✓ Ícones nos icon-box são EMOJIS (não Font Awesome)?
✓ Seção #como-funciona com .steps numerados visualmente?
✓ Copy da Beatriz usado integralmente — sem resumir?
✓ Formulário tem focus-ring colorido e microcopy abaixo do botão?
✓ Footer near-black com cor distinta do restante?
✓ Mobile: nav-links ocultos, grid passa para 1 coluna?

Retorne SOMENTE o código HTML completo. Sem markdown, sem code fences, sem explicação.
Comece com <!DOCTYPE html> e termine com </html>.`;

// ── Handler ────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    const { briefing, client_name, arquivos = [], imagens = [] } = body;
    // imagens: Array<{ url: string; label: string }>
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
      ? `\n\n--- Materiais e conteúdo do cliente (use os dados reais presentes aqui no HTML) ---\n${skillTexts.join("\n\n")}`
      : "";

    // Imagens enviadas pelo cliente — URLs reais para usar no HTML
    const imagensContext = (imagens as { url: string; label: string }[]).length > 0
      ? `\n\n--- IMAGENS FORNECIDAS PELO CLIENTE ---\nUse OBRIGATORIAMENTE estas URLs nos <img src="..."> (não substitua por gradientes CSS):\n${(imagens as { url: string; label: string }[]).map(img => `- ${img.label}: ${img.url}`).join("\n")}`
      : "";

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY") ?? "";
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada no Supabase");

    // Trunca apenas briefings extremamente longos (>40 000 chars).
    // O Designer usa Haiku (mais rápido) para compensar inputs maiores.
    const MAX_BRIEFING = 40_000;
    const briefingTruncated = typeof briefing === "string" && briefing.length > MAX_BRIEFING
      ? briefing.slice(0, MAX_BRIEFING) + "\n\n[...texto truncado]"
      : briefing;

    const stream = new ReadableStream({
      async start(ctrl) {
        try {
          // ── BEATRIZ: copy (streaming em tempo real) ───────────────────────
          sse(ctrl, { etapa: "copy", status: "Beatriz escrevendo o copy..." });

          const beatrizContent: unknown[] = [
            {
              type: "text",
              text: `Cliente: ${client_name || "não informado"}\n\nBriefing:\n${briefingTruncated}\n\nCrie o copy completo da landing page seguindo a estrutura obrigatória.`,
            },
          ];

          // Injeta todos os arquivos para Beatriz: PDFs como document blocks, TXT/MD como texto
          for (const arq of arquivos) {
            if (!arq.base64) continue;
            if (arq.media_type === "application/pdf" || arq.name?.toLowerCase().endsWith(".pdf")) {
              beatrizContent.push({
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: arq.base64 },
                title: arq.name ?? "documento",
              });
            } else if (/\.(txt|md)$/i.test(arq.name ?? "")) {
              try {
                const decoded = atob(arq.base64);
                beatrizContent.push({
                  type: "text",
                  text: `\n\n--- Conteúdo do arquivo: ${arq.name} ---\n${decoded}`,
                });
              } catch { /* ignora erro de decode */ }
            }
          }

          const copy = await streamClaude(
            apiKey, BEATRIZ_SYSTEM, beatrizContent, 4000,
            "claude-haiku-4-5-20251001", ctrl, "copy", "Beatriz escrevendo...", 300,
          );
          sse(ctrl, { etapa: "copy", status: "Copy finalizado ✓", conteudo: copy });

          // ── DESIGNER: identidade visual ────────────────────────────────────
          sse(ctrl, { etapa: "design", status: "Designer definindo a identidade visual..." });

          const designContent: unknown[] = [
            {
              type: "text",
              text: `Briefing do cliente:\n${briefingTruncated}\n\nCliente: ${client_name || "não informado"}\n\nCopy criado pela Beatriz:\n${copy}${skillContext}\n\nDefina a especificação visual completa da landing page.`,
            },
          ];

          const designHb = startHeartbeat(ctrl, "design", "Designer pensando...");
          const design = await callClaude(apiKey, DESIGNER_SYSTEM, designContent, 2500, "claude-haiku-4-5-20251001");
          clearInterval(designHb);
          sse(ctrl, { etapa: "design", status: "Identidade visual definida ✓", conteudo: design });

          // ── TOMÁS: HTML (stream interno → evento único ao frontend) ──────────
          sse(ctrl, { etapa: "html", status: "Tomás montando a landing page..." });

          const tomasResp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-opus-4-7",
              max_tokens: 32000,
              stream: true,
              system: TOMAS_SYSTEM,
              messages: [{ role: "user", content: [{ type: "text", text: `Copy da Beatriz:\n${copy}\n\nEspecificação visual do Designer:\n${design}${skillContext}${imagensContext}\n\nCrie o HTML completo da landing page agora.` }] }],
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

          // Se o HTML foi truncado (sem </html>), fecha tags abertas para evitar CSS sem efeito
          if (!htmlFinal.includes("</html>")) {
            if (!htmlFinal.includes("</style>")) htmlFinal += "\n</style>";
            if (!htmlFinal.includes("</body>")) htmlFinal += "\n</body>";
            htmlFinal += "\n</html>";
          } else if (!htmlFinal.includes("</body>")) {
            // Tem </html> mas não </body> — insere </body> antes do fechamento
            const hi = htmlFinal.lastIndexOf("</html>");
            htmlFinal = htmlFinal.slice(0, hi) + "\n</body>\n</html>" + htmlFinal.slice(hi + 7);
          }

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
