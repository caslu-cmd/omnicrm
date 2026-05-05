import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const INSTANCE     = Deno.env.get("ZAPI_INSTANCE_ID")!;
const TOKEN        = Deno.env.get("ZAPI_TOKEN")!;
const CLIENT_TOKEN = Deno.env.get("ZAPI_CLIENT_TOKEN") ?? TOKEN;
const BASE         = `https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}`;
const HEADERS      = { "Content-Type": "application/json", "Client-Token": CLIENT_TOKEN };

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { action, phone, message, groups } = await req.json();

    // ── Status de conexão ──────────────────────────────────────
    if (action === "status") {
      const r = await fetch(`${BASE}/status`, { headers: HEADERS });
      const data = await r.json();
      console.log("ZAPI status response:", JSON.stringify(data));
      if (!r.ok) {
        return Response.json({ connected: false, error: data?.error ?? `Z-API retornou ${r.status}` }, { headers: cors });
      }
      return Response.json({ connected: data.connected ?? false, phone: data.phone }, { headers: cors });
    }

    // ── QR Code para conectar ──────────────────────────────────
    if (action === "qrcode") {
      const r = await fetch(`${BASE}/qr-code/image`, { headers: HEADERS });
      const text = await r.text();
      console.log("ZAPI qrcode raw:", text.slice(0, 300));

      let qrcode: string | null = null;
      try {
        const data = JSON.parse(text);
        // Z-API retorna { value: "data:image/png;base64,..." } ou { value: "base64..." }
        const raw = data.value ?? data.qrcode ?? data.base64 ?? null;
        if (raw) {
          qrcode = raw.startsWith("data:image") ? raw : `data:image/png;base64,${raw}`;
        }
      } catch {
        // Resposta não é JSON — pode ser base64 direta ou URL
        const t = text.trim();
        if (t.startsWith("data:image")) qrcode = t;
        else if (t.length > 100) qrcode = `data:image/png;base64,${t}`;
      }

      return Response.json({ qrcode }, { headers: cors });
    }

    // ── Lista de grupos ────────────────────────────────────────
    if (action === "groups") {
      const r = await fetch(`${BASE}/chats`, { headers: HEADERS });
      const all = await r.json();
      const grps = (Array.isArray(all) ? all : [])
        .filter((c: any) => String(c.id).endsWith("@g.us"))
        .map((c: any) => ({ id: c.id, name: c.name, participants: c.participants ?? 0 }));
      return Response.json(grps, { headers: cors });
    }

    // ── Disparo para um número ou grupo ───────────────────────
    if (action === "send") {
      if (!phone || !message) {
        return Response.json({ error: "phone e message são obrigatórios" }, { status: 400, headers: cors });
      }
      const r = await fetch(`${BASE}/send-text`, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ phone, message }),
      });
      return Response.json(await r.json(), { headers: cors });
    }

    // ── Disparo em massa para múltiplos grupos ─────────────────
    if (action === "blast") {
      if (!groups?.length || !message) {
        return Response.json({ error: "groups e message são obrigatórios" }, { status: 400, headers: cors });
      }
      const results = [];
      for (const gid of groups) {
        const r = await fetch(`${BASE}/send-text`, {
          method: "POST",
          headers: HEADERS,
          body: JSON.stringify({ phone: gid, message }),
        });
        results.push({ group: gid, ok: r.ok });
        // Pausa entre disparos para evitar bloqueio
        await new Promise((res) => setTimeout(res, 1500));
      }
      return Response.json({ results }, { headers: cors });
    }

    // ── Debug: retorna response bruta da Z-API ────────────────
    if (action === "debug") {
      const statusR = await fetch(`${BASE}/status`, { headers: HEADERS });
      const statusText = await statusR.text();
      const qrR = await fetch(`${BASE}/qr-code/image`, { headers: HEADERS });
      const qrText = await qrR.text();
      return Response.json({
        base: BASE,
        instance: INSTANCE,
        has_client_token: !!CLIENT_TOKEN,
        status_http: statusR.status,
        status_body: statusText.slice(0, 500),
        qr_http: qrR.status,
        qr_body: qrText.slice(0, 500),
      }, { headers: cors });
    }

    return Response.json({ error: "ação inválida" }, { status: 400, headers: cors });

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});
