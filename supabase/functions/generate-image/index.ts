import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Geração de imagem da Calu Agência. **Motor único: Gemini.**
 *
 * O Ideogram saiu a pedido da Carol, e a OpenAI saiu depois pelo mesmo motivo
 * (29/07): ela não quer usar. Não há fallback de propósito — se o Gemini falhar,
 * a função devolve o erro dele em vez de trocar de motor por trás.
 * `gemini-3.1-flash-image`, com queda para `gemini-2.5-flash-image`.
 * Precisa de GEMINI_API_KEY nas secrets.
 *
 * O Gemini aceita imagens de referência, e é isso que sustenta o carrossel: o
 * primeiro slide vira referência dos seguintes e a MESMA pessoa aparece na
 * série inteira.
 *
 * Modos de prompt:
 *  - `prompt` preenchido  → usa como veio (Estúdio de Carrossel: foto limpa,
 *    sem texto, porque o texto entra depois no canvas).
 *  - só `beatrizCopy`     → o Claude monta o briefing de arte antes de gerar.
 *  - `textoNaImagem`      → até 3 frases que devem aparecer DENTRO da cena
 *    (letreiro, placa, embalagem). Desliga o reforço anti-texto. Testado: o
 *    Gemini escreve português correto nesse formato.
 */

type Ratio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "4:5";

function normalizeRatio(r: string, prompt: string): Ratio {
  const v = String(r || "").trim();
  if (!v || v === "auto") {
    const d = prompt.toLowerCase();
    if (d.includes("stories") || d.includes("reels") || d.includes("tiktok")) return "9:16";
    if (d.includes("banner") || d.includes("youtube")) return "16:9";
    if (d.includes("quadrado") || d.includes("square")) return "1:1";
    return "3:4";
  }
  return (["1:1", "3:4", "4:3", "9:16", "16:9", "4:5"].includes(v) ? v : "3:4") as Ratio;
}

/**
 * Texto DENTRO da imagem. Serve para peça onde a letra faz parte da cena
 * (letreiro, placa, embalagem, cartaz escrito à mão) — no carrossel comum o
 * texto continua entrando no canvas, que é exato e editável de graça.
 */
function instrucaoDeTexto(textos: string[]): string {
  const lista = textos.map((t) => `"${t}"`).join(" and ");
  return ` The image must contain this exact text, spelled character by character: ${lista}.` +
    ` Render it as part of the scene (sign, poster, label, handwriting, screen), integrated in the` +
    ` real perspective and lighting — not as a flat graphic overlay. No other words anywhere in the image,` +
    ` no gibberish letters, no watermark. Spelling accuracy matters more than decoration.`;
}

async function briefingComClaude(
  userRequest: string,
  clientContext: Record<string, unknown>,
  beatrizCopy: string,
  carolinaStrategy: string,
  benTrends: string,
  anthropicKey: string,
): Promise<string> {
  const brandColor = String(clientContext.brandColor ?? "");
  const brandName = String(clientContext.name ?? "marca");
  const industry = String(clientContext.industry ?? "negócio");

  const systemMsg = `You are a senior art director at a Brazilian agency.
Write ONE image-generation prompt in English for a social media visual.

RULES:
1. Photographic and realistic. Real people, real scenes, natural skin texture. No 3D renders, no clip art, no stock-photo clichés.
2. Describe subject, expression, wardrobe, setting and lighting. Brazilian people when a person appears.
3. Composition must leave clear NEGATIVE SPACE for text overlay.
4. Brand accent color ${brandColor || "vibrant"} should appear in the scene (wardrobe, prop or light), never as a graphic overlay.
5. NO text, NO letters, NO logos, NO watermarks in the image.
6. End with: shot on 85mm, editorial photography, natural skin texture, cinematic lighting, shallow depth of field, negative space for text.

Context: ${brandName} | ${industry}`;

  const userMsg = [
    beatrizCopy ? `COPY:\n${beatrizCopy.slice(0, 900)}` : "",
    carolinaStrategy ? `ESTRATÉGIA:\n${carolinaStrategy.slice(0, 300)}` : "",
    benTrends ? `TENDÊNCIAS:\n${benTrends.slice(0, 250)}` : "",
    `PEDIDO: ${userRequest}`,
  ].filter(Boolean).join("\n\n---\n\n");

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 1200 * attempt));
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        system: systemMsg,
        messages: [{ role: "user", content: userMsg }],
      }),
    });
    if (r.status === 429 || r.status === 529 || r.status >= 500) continue;
    if (!r.ok) return userRequest;
    const data = await r.json();
    return data.content?.[0]?.text?.trim() ?? userRequest;
  }
  return userRequest;
}

/**
 * A API de interactions devolve a imagem dentro de `steps[].content[]`, no passo
 * de `model_output` — não num campo `output_image` na raiz. Como o formato ainda
 * muda de versão para versão, varremos a resposta inteira atrás do primeiro
 * pedaço com `data` base64 de imagem, e mantemos os formatos antigos como plano B.
 */
function acharImagemNaResposta(data: unknown): { data: string; mimeType: string } | null {
  const visitados = new Set<unknown>();

  const varrer = (no: unknown): { data: string; mimeType: string } | null => {
    if (!no || typeof no !== "object" || visitados.has(no)) return null;
    visitados.add(no);

    if (Array.isArray(no)) {
      for (const item of no) {
        const achado = varrer(item);
        if (achado) return achado;
      }
      return null;
    }

    const obj = no as Record<string, unknown>;
    const mime = typeof obj.mime_type === "string"
      ? obj.mime_type
      : typeof obj.mimeType === "string"
      ? obj.mimeType
      : "";
    const ehImagem = obj.type === "image" || mime.startsWith("image/");
    if (ehImagem && typeof obj.data === "string" && obj.data.length > 100) {
      return { data: obj.data, mimeType: mime || "image/jpeg" };
    }

    for (const valor of Object.values(obj)) {
      const achado = varrer(valor);
      if (achado) return achado;
    }
    return null;
  };

  return varrer(data);
}

/**
 * Gemini, o motor da casa. Aceita imagens de referência: o slide 1 vira
 * referência dos demais e o carrossel inteiro fica com a MESMA pessoa.
 */
async function gerarNoGemini(
  prompt: string,
  ratio: Ratio,
  geminiKey: string,
  referencias: Array<{ data: string; mediaType: string }>,
): Promise<{ imageData: string; mimeType: string; modelo: string }> {
  const modelos = ["gemini-3.1-flash-image", "gemini-2.5-flash-image"];
  let ultimoErro = "";

  const input: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
  for (const ref of referencias.slice(0, 3)) {
    input.push({ type: "image", mime_type: ref.mediaType, data: ref.data });
  }

  for (const modelo of modelos) {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": geminiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelo,
        input,
        response_format: {
          type: "image",
          mime_type: "image/jpeg",
          aspect_ratio: ratio === "4:5" ? "4:5" : ratio,
          image_size: "2K",
        },
      }),
    });

    if (!res.ok) {
      ultimoErro = `${modelo}: ${(await res.text()).slice(0, 300)}`;
      if (res.status === 400 || res.status === 404) continue;
      throw new Error(ultimoErro);
    }

    const data = await res.json();
    const achado = acharImagemNaResposta(data);
    if (!achado) {
      ultimoErro = `${modelo}: resposta sem imagem`;
      continue;
    }
    return { imageData: achado.data, mimeType: achado.mimeType, modelo };
  }

  throw new Error(ultimoErro || "Gemini não retornou imagem.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    const {
      prompt,
      aspectRatio = "3:4",
      clientContext = {},
      beatrizCopy = "",
      carolinaStrategy = "",
      benTrends = "",
    } = body;

    const geminiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_AI_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: "Configure GEMINI_API_KEY nas secrets do Supabase (Project Settings → Edge Functions → Secrets)." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }
    if (!prompt && !beatrizCopy) {
      return new Response(
        JSON.stringify({ error: "prompt ou beatrizCopy obrigatório" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    // Prompt explícito (Estúdio de Carrossel) vai direto; senão o Claude monta.
    let finalPrompt: string = String(prompt ?? "").trim();
    if (!finalPrompt) {
      if (!anthropicKey) {
        return new Response(
          JSON.stringify({ error: "ANTHROPIC_API_KEY não configurada." }),
          { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
        );
      }
      finalPrompt = await briefingComClaude(
        "criar imagem para post de redes sociais",
        clientContext, beatrizCopy, carolinaStrategy, benTrends, anthropicKey,
      );
    }

    // Texto na imagem é opt-in: quem pede manda `textoNaImagem`. Sem isso vale
    // a regra da casa — foto limpa, texto por cima no canvas.
    const textos: string[] = (Array.isArray(body.textoNaImagem)
      ? body.textoNaImagem
      : [body.textoNaImagem])
      .filter((t: unknown) => typeof t === "string" && t.trim())
      .map((t: string) => t.trim().slice(0, 120))
      .slice(0, 3);

    if (textos.length) {
      // Sem isso o reforço anti-texto abaixo brigaria com o pedido.
      finalPrompt = finalPrompt.replace(
        /\s*no text,?\s*(no letters,?\s*)?(no logos,?\s*)?(no watermarks[^.]*\.?)?/gi,
        " ",
      ).trim() + instrucaoDeTexto(textos);
    } else if (!/no text/i.test(finalPrompt)) {
      finalPrompt += " No text, no letters, no logos, no watermarks in the image.";
    }

    const ratio = normalizeRatio(aspectRatio, finalPrompt);

    // Referências (ex.: o primeiro slide do carrossel) para manter a mesma
    // pessoa e a mesma atmosfera nas peças seguintes.
    const referencias: Array<{ data: string; mediaType: string }> = Array.isArray(body.referencias)
      ? body.referencias
          .filter((r: { data?: string }) => r?.data)
          .map((r: { data: string; mediaType?: string }) => ({
            data: r.data,
            mediaType: r.mediaType ?? "image/jpeg",
          }))
      : [];

    // Sem fallback de motor: se o Gemini falhar, o erro dele sobe. Trocar de
    // motor por trás esconde cota estourada e chave errada, que é justamente o
    // que a gente precisa ver.
    const promptComRef = referencias.length
      ? `${finalPrompt} Keep the SAME person, wardrobe, color grading and lighting as the reference image, so the images work as one series.`
      : finalPrompt;
    const resultado = await gerarNoGemini(promptComRef, ratio, geminiKey, referencias);

    return new Response(
      JSON.stringify({
        success: true,
        imageData: resultado.imageData,
        mimeType: resultado.mimeType,
        promptUsed: finalPrompt,
        modelo: resultado.modelo,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
