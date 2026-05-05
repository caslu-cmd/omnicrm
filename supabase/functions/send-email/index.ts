import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_KEY  = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL  = Deno.env.get("FROM_EMAIL") ?? "Calu Agência <noreply@caluagencia.com.br>";

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    const { action, to, subject, html, text, targets } = body;

    // ── Envio único ────────────────────────────────────────────
    if (action === "send") {
      if (!to || !subject || (!html && !text)) {
        return Response.json({ error: "to, subject e html/text obrigatórios" }, { status: 400, headers: cors });
      }
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to: Array.isArray(to) ? to : [to], subject, html: html ?? `<p>${text}</p>` }),
      });
      const data = await r.json();
      if (!r.ok) return Response.json({ error: data }, { status: r.status, headers: cors });
      return Response.json({ ok: true, id: data.id }, { headers: cors });
    }

    // ── Disparo em massa ───────────────────────────────────────
    if (action === "blast") {
      if (!targets?.length || !subject || (!html && !text)) {
        return Response.json({ error: "targets, subject e html/text obrigatórios" }, { status: 400, headers: cors });
      }
      const results: { email: string; ok: boolean; id?: string }[] = [];
      for (const email of targets as string[]) {
        if (!email?.includes("@")) { results.push({ email, ok: false }); continue; }
        try {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: FROM_EMAIL, to: [email], subject, html: html ?? `<p>${text}</p>` }),
          });
          const data = await r.json();
          results.push({ email, ok: r.ok, id: data.id });
        } catch { results.push({ email, ok: false }); }
        await sleep(300);
      }
      const ok = results.filter(r => r.ok).length;
      return Response.json({ results, ok, total: targets.length }, { headers: cors });
    }

    return Response.json({ error: "action inválida" }, { status: 400, headers: cors });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});
