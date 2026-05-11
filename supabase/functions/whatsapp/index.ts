import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Fallback global secrets (used when the client hasn't configured their own ZApi)
const ENV_INSTANCE     = Deno.env.get("ZAPI_INSTANCE_ID") ?? "";
const ENV_TOKEN        = Deno.env.get("ZAPI_TOKEN") ?? "";
const ENV_CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? "";

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
    const {
      action, phone, message, groups,
      // Per-client credentials (override global secrets when present)
      zapi_instance, zapi_token, zapi_client_token,
    } = body;

    const INSTANCE     = zapi_instance     || ENV_INSTANCE;
    const TOKEN        = zapi_token        || ENV_TOKEN;
    const CLIENT_TOKEN = zapi_client_token || ENV_CLIENT_TOKEN;
    const BASE         = `https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}`;
    const HEADERS: Record<string, string> = { "Content-Type": "application/json" };
    if (CLIENT_TOKEN) HEADERS["Client-Token"] = CLIENT_TOKEN;

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

    // ── Metadata em lote — busca /chats e filtra pelos IDs solicitados ──
    if (action === "groups-metadata") {
      const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
      if (ids.length === 0) return Response.json([], { headers: cors });

      const normalize = (s: string) => String(s).replace(/-group$/, "").replace(/^@g\.us$/, "");
      const toJid     = (s: string) => normalize(s).includes("@g.us") ? normalize(s) : `${normalize(s)}@g.us`;

      // Re-usa o /chats que já funciona para carregar a lista de grupos
      const r = await fetch(`${BASE}/chats`, { headers: HEADERS });
      const all: any[] = r.ok ? (await r.json().catch(() => [])) : [];

      const chatMap = new Map<string, any>();
      for (const c of (Array.isArray(all) ? all : [])) {
        chatMap.set(String(c.id), c);
        chatMap.set(normalize(String(c.id)), c);
      }

      const out = ids.map(rawId => {
        const jid = toJid(String(rawId));
        const c = chatMap.get(jid) ?? chatMap.get(normalize(String(rawId)));
        return {
          id: rawId,
          name: c?.name,
          participants: Number(c?.participants ?? 0),
        };
      });

      return Response.json(out, { headers: cors });
    }

    // ── Envio único (texto ou mídia) ───────────────────────────
    if (action === "send") {
      if (!phone) return Response.json({ error: "phone obrigatório" }, { status: 400, headers: cors });
      const { mediaType, mediaData, caption, type, mediaBase64 } = body;

      // Support legacy mediaBase64 + type fields
      const effectiveMediaType = mediaType ?? type;
      const effectiveMediaData = mediaData ?? mediaBase64;

      if (effectiveMediaType && effectiveMediaData) {
        const ep: Record<string, string> = { image: "send-image", video: "send-video", audio: "send-audio", document: "send-document" };
        const payloads: Record<string, object> = {
          image:    { phone, image:    b64(effectiveMediaData), caption: caption ?? message ?? "" },
          video:    { phone, video:    b64(effectiveMediaData), caption: caption ?? message ?? "" },
          audio:    { phone, audio:    b64(effectiveMediaData) },
          document: { phone, document: b64(effectiveMediaData), fileName: caption ?? "arquivo", caption: message ?? "" },
        };
        const mt = effectiveMediaType in ep ? effectiveMediaType : "image";
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
        } catch (_e) {
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
