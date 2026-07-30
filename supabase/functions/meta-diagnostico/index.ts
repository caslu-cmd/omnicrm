import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/**
 * Diagnóstico de webhook do Meta, por conta conectada.
 *
 * Existe porque o token em `social_connections` está ofuscado e a chave que
 * desfaz isso vive nas secrets — ou seja, essa checagem não dá para fazer de
 * fora, nem por SQL. Aqui dentro dá.
 *
 * GET  → mostra, por conta: se o app está inscrito na conta (`subscribed_apps`)
 *        e em quais campos.
 * POST → inscreve a conta nos campos pedidos (`?assinar=comments,messages`).
 *
 * Não devolve token em nenhuma hipótese — só nome de conta, campos e erro.
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

function deobfuscate(encoded: string, key: string): string {
  try {
    const decoded = atob(encoded);
    const out: number[] = [];
    for (let i = 0; i < decoded.length; i++) {
      out.push(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return String.fromCharCode(...out);
  } catch {
    return encoded;
  }
}

const GRAPH = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const encKey = Deno.env.get("INTEGRATION_ENCRYPTION_KEY") || serviceKey;

  const url = new URL(req.url);
  const assinar = (url.searchParams.get("assinar") ?? "").trim();
  const soCliente = (url.searchParams.get("cliente") ?? "").trim();

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: conns } = await admin
    .from("social_connections")
    .select("client_id, platform, account_id, account_name, access_token")
    .eq("connected", true)
    .in("platform", ["instagram", "facebook"]);

  const saida: unknown[] = [];

  for (const c of conns ?? []) {
    if (soCliente && c.client_id !== soCliente) continue;

    const token = deobfuscate(String(c.access_token ?? ""), encKey);
    const linha: Record<string, unknown> = {
      cliente: c.client_id,
      plataforma: c.platform,
      conta: c.account_name,
      account_id: c.account_id,
      // Prova que o token foi decifrado sem mostrá-lo: token do Meta começa com EAA.
      token_parece_valido: token.startsWith("EAA"),
    };

    try {
      const r = await fetch(`${GRAPH}/${c.account_id}/subscribed_apps?access_token=${token}`);
      const d = await r.json();
      if (d.error) {
        linha.inscrito = "erro";
        linha.erro = `${d.error.code}: ${d.error.message}`;
      } else {
        const apps = d.data ?? [];
        linha.inscrito = apps.length > 0;
        linha.campos = apps.flatMap((a: { subscribed_fields?: string[] }) => a.subscribed_fields ?? []);
      }
    } catch (e) {
      linha.inscrito = "erro";
      linha.erro = String(e).slice(0, 200);
    }

    if (req.method === "POST" && assinar) {
      try {
        const r = await fetch(
          `${GRAPH}/${c.account_id}/subscribed_apps?subscribed_fields=${encodeURIComponent(assinar)}&access_token=${token}`,
          { method: "POST" },
        );
        const d = await r.json();
        linha.assinatura = d.error ? `erro ${d.error.code}: ${d.error.message}` : (d.success ? "ok" : d);
      } catch (e) {
        linha.assinatura = String(e).slice(0, 200);
      }
    }

    saida.push(linha);
  }

  return json({ contas: saida });
});
