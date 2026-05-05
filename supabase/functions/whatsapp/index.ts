import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const INSTANCE     = Deno.env.get("ZAPI_INSTANCE_ID")!;
const TOKEN        = Deno.env.get("ZAPI_TOKEN")!;
const CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "";
const BASE         = `https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}`;
const HEADERS      = { "Content-Type": "application/json", "Client-Token": CLIENT_TOKEN };

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const b64   = (s: string)  => s.startsWith("data:") ? s.split(",")[1] : s;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();
    const { action, phone, message, groups } = body;

    // ── Status ─────────────────────────────────────────────────
    if (action === "status") {
      const r    = await fetch(`${BASE}/status`, { headers: HEADERS });
      const data = await r.json();
      if (!r.ok) return Response.json({ connected: false, error: data?.error }, { headers: cors });
      return Response.json({ connected: data.connected ?? false, phone: data.phone }, { headers: cors });
    }

    // ── QR Code ────────────────────────────────────────────────
    if (action === "qrcode") {
      const r    = await fetch(`${BASE}/qr-code/image`, { headers: HEADERS });
      const text = await r.text();
      let qrcode: string | null = null;
      try {
        const data = JSON.parse(text);
        const raw  = data.value ?? data.qrcode ?? data.base64 ?? null;
        if (raw) qrcode = raw.startsWith("data:image") ? raw : `data:image/png;base64,${raw}`;
      } catch {
        const t = text.trim();
        if (t.startsWith("data:image")) qrcode = t;
        else if (t.length > 100) qrcode = `data:image/png;base64,${t}`;
      }
      return Response.json({ qrcode }, { headers: cors });
    }

    // ── Lista de grupos ────────────────────────────────────────
    if (action === "groups") {
      const r   = await fetch(`${BASE}/chats`, { headers: HEADERS });
      const all = await r.json();
      const grps = (Array.isArray(all) ? all : [])
        .filter((c: any) => String(c.id).endsWith("@g.us"))
        .map((c: any) => ({ id: c.id, name: c.name, participants: c.participants ?? 0 }));
      return Response.json(grps, { headers: cors });
    }

    // ── Envio único (texto ou mídia) ───────────────────────────
    if (action === "send") {
      if (!phone) return Response.json({ error: "phone obrigatório" }, { status: 400, headers: cors });
      const { mediaType, mediaData, caption } = body;

      if (mediaType && mediaData) {
        const ep: Record<string, string> = { image: "send-image", video: "send-video", audio: "send-audio", document: "send-document" };
        const payloads: Record<string, object> = {
          image:    { phone, image:    b64(mediaData), caption: caption ?? message ?? "" },
          video:    { phone, video:    b64(mediaData), caption: caption ?? message ?? "" },
          audio:    { phone, audio:    b64(mediaData) },
          document: { phone, document: b64(mediaData), fileName: caption ?? "arquivo", caption: message ?? "" },
        };
        const mt = mediaType in ep ? mediaType : "image";
        const r  = await fetch(`${BASE}/${ep[mt]}`, { method: "POST", headers: HEADERS, body: JSON.stringify(payloads[mt]) });
        return Response.json(await r.json(), { headers: cors });
      }

      if (!message) return Response.json({ error: "message obrigatório" }, { status: 400, headers: cors });
      const r = await fetch(`${BASE}/send-text`, { method: "POST", headers: HEADERS, body: JSON.stringify({ phone, message }) });
      return Response.json(await r.json(), { headers: cors });
    }

    // ── Disparo em massa (grupos + contatos, texto ou mídia) ───
    if (action === "blast") {
      const { targets, mediaType, mediaData, caption } = body;
      const allTargets: string[] = targets?.length ? targets : (groups ?? []);
      if (!allTargets.length) return Response.json({ error: "targets obrigatório" }, { status: 400, headers: cors });

      const hasMedia = !!(mediaType && mediaData);
      if (!hasMedia && !message) return Response.json({ error: "message obrigatório para texto" }, { status: 400, headers: cors });

      const ep: Record<string, string> = { image: "send-image", video: "send-video", audio: "send-audio", document: "send-document" };
      const results: { target: string; ok: boolean; status?: number }[] = [];

      for (const target of allTargets) {
        try {
          let r: Response;
          if (hasMedia) {
            const mt  = mediaType in ep ? mediaType : "image";
            const payloads: Record<string, object> = {
              image:    { phone: target, image:    b64(mediaData), caption: caption ?? message ?? "" },
              video:    { phone: target, video:    b64(mediaData), caption: caption ?? message ?? "" },
              audio:    { phone: target, audio:    b64(mediaData) },
              document: { phone: target, document: b64(mediaData), fileName: caption ?? "arquivo", caption: message ?? "" },
            };
            r = await fetch(`${BASE}/${ep[mt]}`, { method: "POST", headers: HEADERS, body: JSON.stringify(payloads[mt]) });
          } else {
            r = await fetch(`${BASE}/send-text`, { method: "POST", headers: HEADERS, body: JSON.stringify({ phone: target, message }) });
          }
          results.push({ target, ok: r.ok, status: r.status });
        } catch (e) {
          results.push({ target, ok: false });
        }
        await sleep(1200);
      }

      const okCount = results.filter((r) => r.ok).length;
      return Response.json({ results, ok: okCount, total: allTargets.length }, { headers: cors });
    }

    // ── Debug ──────────────────────────────────────────────────
    if (action === "debug") {
      const statusR  = await fetch(`${BASE}/status`, { headers: HEADERS });
      const statusTx = await statusR.text();
      const qrR      = await fetch(`${BASE}/qr-code/image`, { headers: HEADERS });
      const qrTx     = await qrR.text();
      return Response.json({
        base: BASE, instance: INSTANCE, has_client_token: !!CLIENT_TOKEN,
        status_http: statusR.status, status_body: statusTx.slice(0, 500),
        qr_http: qrR.status,        qr_body:     qrTx.slice(0, 500),
      }, { headers: cors });
    }

    return Response.json({ error: "ação inválida" }, { status: 400, headers: cors });

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});
