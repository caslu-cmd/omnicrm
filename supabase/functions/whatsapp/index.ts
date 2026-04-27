import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const INSTANCE = Deno.env.get("ZAPI_INSTANCE_ID")!;
const TOKEN    = Deno.env.get("ZAPI_TOKEN")!;
const BASE     = `https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}`;
const HEADERS  = { "Content-Type": "application/json", "Client-Token": TOKEN };

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
      return Response.json({ connected: data.connected ?? false, phone: data.phone }, { headers: cors });
    }

    // ── QR Code para conectar ──────────────────────────────────
    if (action === "qrcode") {
      const r = await fetch(`${BASE}/qr-code/image`, { headers: HEADERS });
      const data = await r.json();
      return Response.json({ qrcode: data.value }, { headers: cors });
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

    return Response.json({ error: "ação inválida" }, { status: 400, headers: cors });

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});
