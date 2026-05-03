import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY   = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const LOVABLE_API_KEY     = Deno.env.get("LOVABLE_API_KEY") ?? "";
const GROQ_API_KEY        = Deno.env.get("GROQ_API_KEY") ?? "";
const OPENAI_API_KEY      = Deno.env.get("OPENAI_API_KEY") ?? "";
const SUPABASE_URL        = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ZAPI_INSTANCE       = Deno.env.get("ZAPI_INSTANCE_ID")  ?? "3EBC0C423ACD4164F09A5A0F11A263D4";
const ZAPI_TOKEN          = Deno.env.get("ZAPI_TOKEN")        ?? "BA4478E497A2E1C9B499C950";
const ZAPI_CLIENT         = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "Fabcb22cf9022425ca4fe8f3a4c91a7e9S";
const CAROL_PHONE         = Deno.env.get("CAROL_PHONE")       ?? "5585986408404";

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return btoa(bin);
}

async function transcrever(audioPath: string): Promise<string> {
  const storageUrl = `${SUPABASE_URL}/storage/v1/object/aira-recordings/${audioPath}`;
  return transcreverUrl(storageUrl, { "Authorization": `Bearer ${SERVICE_ROLE_KEY}` });
}

async function transcreverUrl(audioUrl: string, headers: Record<string, string> = {}): Promise<string> {
  const fileRes = await fetch(audioUrl, { headers });
  if (!fileRes.ok) throw new Error(`Audio download ${fileRes.status}: ${await fileRes.text()}`);
  const blob = await fileRes.blob();
  const b64 = await blobToBase64(blob);
  return transcreverBase64(b64, blob.type || "audio/webm");
}

async function transcreverBase64(audioBase64: string, mimeType = "audio/webm"): Promise<string> {
  const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });

  // 1ª opção: Groq ou OpenAI Whisper (mais preciso)
  if (GROQ_API_KEY || OPENAI_API_KEY) {
    return transcreverWhisper(blob);
  }

  // 2ª opção: Lovable AI gateway — endpoint /audio/transcriptions
  if (LOVABLE_API_KEY) {
    console.log("Transcrevendo via Lovable AI STT, tamanho:", audioBase64.length);
    const form = new FormData();
    form.append("file", blob, "audio.webm");
    form.append("model", "whisper-1");
    form.append("language", "pt");
    const r = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}` },
      body: form,
    });
    if (r.ok) {
      const d = await r.json();
      const text = d.text ?? "";
      console.log("Transcript len (Lovable STT):", text.length);
      if (text.trim()) return text;
    }
    // Se STT falhar, tenta Gemini com base64 inline
    console.log("Lovable STT falhou, tentando Gemini inline...");
    const r2 = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Transcreva integralmente o áudio a seguir em português. Retorne APENAS a transcrição, sem comentários adicionais." },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${audioBase64}` } },
          ],
        }],
        max_tokens: 4096,
      }),
    });
    if (r2.ok) {
      const d2 = await r2.json();
      const text2 = d2.choices?.[0]?.message?.content ?? "";
      console.log("Transcript len (Gemini inline):", text2.length);
      if (text2.trim()) return text2;
    }
  }

  throw new Error("Nenhuma chave de transcrição configurada. Configure GROQ_API_KEY, OPENAI_API_KEY ou LOVABLE_API_KEY no Supabase.");
}

async function transcreverWhisper(audioBlob: Blob): Promise<string> {
  const key = GROQ_API_KEY || OPENAI_API_KEY;
  const url = GROQ_API_KEY
    ? "https://api.groq.com/openai/v1/audio/transcriptions"
    : "https://api.openai.com/v1/audio/transcriptions";
  const form = new FormData();
  form.append("file", audioBlob, "audio.webm");
  form.append("model", GROQ_API_KEY ? "whisper-large-v3" : "whisper-1");
  form.append("language", "pt");
  const r = await fetch(url, { method: "POST", headers: { "Authorization": `Bearer ${key}` }, body: form });
  if (!r.ok) throw new Error(`Whisper error ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return d.text ?? "";
}

async function resumirComClaude(transcript: string, clientName: string): Promise<string> {
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const systemPrompt = `Voce e a AIRA, secretaria executiva da Calu Agencia. Sua unica funcao e gerar resumos executivos de reunioes. NUNCA faca perguntas. NUNCA peca mais informacoes. Sempre gere o resumo com o que foi fornecido, mesmo que seja pouco. Use formatacao WhatsApp (*negrito*). A data de hoje e ${today}.`;

  const userContent = `Gere AGORA o resumo executivo desta reuniao${clientName ? ` com ${clientName}` : ""}. Use exatamente este formato:

*Resumo da Reuniao — ${today}*${clientName ? `\nCliente: ${clientName}` : ""}

*Decisoes tomadas*
[liste ou escreva "Nenhuma decisao clara identificada"]

*Tarefas definidas*
[liste ou escreva "Nenhuma tarefa definida"]

*Proximos passos*
[liste ou escreva "A definir"]

Transcricao:
${transcript}`;

  if (LOVABLE_API_KEY) {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 1024,
      }),
    });
    if (!r.ok) throw new Error(`Lovable AI error ${r.status}: ${await r.text()}`);
    const d = await r.json();
    return d.choices?.[0]?.message?.content ?? "";
  }

  if (!ANTHROPIC_API_KEY) throw new Error("LOVABLE_API_KEY nao configurada");

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!r.ok) throw new Error(`Claude error ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return d.content?.[0]?.text ?? "";
}

async function enviarWhatsApp(phone: string, mensagem: string) {
  const r = await fetch(
    `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "Client-Token": ZAPI_CLIENT },
      body: JSON.stringify({ phone, message: mensagem }),
    }
  );
  return { ok: r.ok, data: await r.json().catch(() => null) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { audioPath, audioUrl, audioBase64, audioMimeType, transcript: transcriptRaw, summary: summaryOverride, clientName, onlyLuana, groups, participants } = await req.json();

    // Se um resumo pronto foi fornecido, pula transcrição e sumarização
    let summary: string;
    let transcript = transcriptRaw ?? "";
    if (summaryOverride) {
      summary = summaryOverride;
    } else {
      if (!transcript && audioBase64) {
        transcript = await transcreverBase64(audioBase64, audioMimeType);
      } else if (!transcript && audioUrl) {
        transcript = await transcreverUrl(audioUrl);
      } else if (!transcript && audioPath) {
        transcript = await transcrever(audioPath);
      }
      if (!transcript?.trim()) {
        return Response.json({ error: "Nenhum audio ou transcricao fornecidos" }, { status: 400, headers: cors });
      }
      summary = await resumirComClaude(transcript, clientName ?? "");
    }

    if (onlyLuana) {
      return Response.json({ summary, transcript, whatsapp: null }, { headers: cors });
    }

    const mensagem = `Resumo da Reuniao - AIRA${clientName ? `\nCliente: ${clientName}` : ""}\n\n${summary}`;

    const targets: string[] = [];
    if (Array.isArray(groups) && groups.length > 0) targets.push(...groups);
    if (Array.isArray(participants) && participants.length > 0) {
      targets.push(...participants.map((p: any) => p.phone).filter(Boolean));
    }
    if (targets.length === 0) targets.push(CAROL_PHONE);

    const results = await Promise.all(targets.map((t) => enviarWhatsApp(t, mensagem)));

    return Response.json({ summary, transcript, whatsapp: results }, { headers: cors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("aira-meeting error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
