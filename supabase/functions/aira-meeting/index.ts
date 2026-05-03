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

async function transcrever(audioPath: string): Promise<string> {
  const storageUrl = `${SUPABASE_URL}/storage/v1/object/aira-recordings/${audioPath}`;
  return transcreverUrl(storageUrl, { "Authorization": `Bearer ${SERVICE_ROLE_KEY}` });
}

async function transcreverUrl(audioUrl: string, headers: Record<string, string> = {}): Promise<string> {
  const key = GROQ_API_KEY || OPENAI_API_KEY;
  if (!key) throw new Error("Configure GROQ_API_KEY nas secrets do Supabase");

  const fileRes = await fetch(audioUrl, { headers });
  if (!fileRes.ok) throw new Error(`Storage error ${fileRes.status}: ${await fileRes.text()}`);
  const audioBlob = await fileRes.blob();

  console.log("Audio baixado, tamanho:", audioBlob.size, "bytes");

  const url = GROQ_API_KEY
    ? "https://api.groq.com/openai/v1/audio/transcriptions"
    : "https://api.openai.com/v1/audio/transcriptions";

  const form = new FormData();
  form.append("file", audioBlob, "audio.webm");
  form.append("model", GROQ_API_KEY ? "whisper-large-v3" : "whisper-1");
  form.append("language", "pt");

  const r = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}` },
    body: form,
  });
  if (!r.ok) throw new Error(`Whisper error ${r.status}: ${await r.text()}`);
  const d = await r.json();
  console.log("Transcript:", d.text);
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
    const { audioPath, audioUrl, transcript: transcriptRaw, clientName, onlyLuana, groups, participants } = await req.json();

    let transcript = transcriptRaw ?? "";
    if (!transcript && audioUrl) {
      transcript = await transcreverUrl(audioUrl);
    } else if (!transcript && audioPath) {
      transcript = await transcrever(audioPath);
    }
    if (!transcript?.trim()) {
      return Response.json({ error: "Nenhum audio ou transcricao fornecidos" }, { status: 400, headers: cors });
    }

    const summary = await resumirComClaude(transcript, clientName ?? "");

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
    console.error("aira-meeting error:", e);
    return Response.json({ error: String(e) }, { status: 500, headers: cors });
  }
});
