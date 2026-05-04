import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const GRAPH   = "https://graph.facebook.com/v22.0";
const APP_URL = "https://caluagencia.com.br";
const SELF_URL = "https://proldgiyterqhthludlp.supabase.co/functions/v1/meta-callback";

function obfuscate(text: string, key: string): string {
  const result: number[] = [];
  for (let i = 0; i < text.length; i++)
    result.push(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return btoa(String.fromCharCode(...result));
}

function redirect(to: string) {
  return new Response(null, { status: 302, headers: { Location: to } });
}

Deno.serve(async (req) => {
  // Allow CORS preflight
  if (req.method === "OPTIONS")
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });

  const url      = new URL(req.url);
  const code     = url.searchParams.get("code");
  const state    = url.searchParams.get("state");
  const errCode  = url.searchParams.get("error_code") ?? url.searchParams.get("error");
  const errMsg   = url.searchParams.get("error_message") ?? url.searchParams.get("error_description");

  // Meta returned an error
  if (errCode || errMsg) {
    const msg = encodeURIComponent(errMsg ?? errCode ?? "Autorização negada");
    return redirect(`${APP_URL}/agency?meta_error=${msg}`);
  }

  if (!code || !state) {
    return redirect(`${APP_URL}/agency?meta_error=${encodeURIComponent("Parâmetros ausentes")}`);
  }

  // Decode state
  let clientId: string;
  let platform: string;
  let userId: string;
  try {
    const b64    = state.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
    const sd     = JSON.parse(atob(padded)) as { userId: string; clientId: string; platform: string };
    userId   = sd.userId;
    clientId = sd.clientId;
    platform = sd.platform ?? "facebook";
  } catch {
    return redirect(`${APP_URL}/agency?meta_error=${encodeURIComponent("State inválido")}`);
  }

  const metaAppId     = Deno.env.get("META_APP_ID")     ?? "";
  const metaAppSecret = Deno.env.get("META_APP_SECRET") ?? "";
  const encKey        = Deno.env.get("INTEGRATION_ENCRYPTION_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl   = Deno.env.get("SUPABASE_URL")!;
  const serviceKey    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!metaAppId || !metaAppSecret)
    return redirect(`${APP_URL}/agency/clients/${clientId}?meta_error=${encodeURIComponent("Credenciais Meta não configuradas no servidor")}`);

  const fail = (msg: string) =>
    redirect(`${APP_URL}/agency/clients/${clientId}?meta_error=${encodeURIComponent(msg)}`);

  try {
    // 1. Exchange code → short-lived token
    const tokenRes  = await fetch(`${GRAPH}/oauth/access_token?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(SELF_URL)}&client_secret=${metaAppSecret}&code=${code}`);
    const tokenData = await tokenRes.json();
    if (tokenData.error) return fail(tokenData.error.message);

    // 2. Exchange → long-lived token (~60 days)
    const longRes  = await fetch(`${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${tokenData.access_token}`);
    const longData = await longRes.json();
    if (longData.error) return fail(longData.error.message);

    const longToken = longData.access_token;
    const expiresIn = longData.expires_in ?? 5184000;

    // 3. Get Facebook Pages
    const pagesRes  = await fetch(`${GRAPH}/me/accounts?access_token=${longToken}`);
    const pagesData = await pagesRes.json();
    if (pagesData.error) return fail(pagesData.error.message);
    if (!pagesData.data?.length) return fail("Nenhuma Página do Facebook encontrada. Crie uma Página primeiro.");

    const page      = pagesData.data[0];
    const pageToken = page.access_token;
    let accountId       = page.id;
    let accountName     = page.name;
    let accountUsername: string | null = null;
    let followersCount  = 0;

    if (platform === "instagram") {
      const igRes  = await fetch(`${GRAPH}/${page.id}?fields=instagram_business_account&access_token=${pageToken}`);
      const igData = await igRes.json();
      const igId   = igData.instagram_business_account?.id;
      if (!igId) return fail("Nenhuma conta Instagram Profissional vinculada a esta Página.");
      const igDet  = await (await fetch(`${GRAPH}/${igId}?fields=id,name,username,followers_count&access_token=${pageToken}`)).json();
      accountId       = igId;
      accountName     = igDet.name ?? page.name;
      accountUsername = igDet.username ? `@${igDet.username}` : null;
      followersCount  = igDet.followers_count ?? 0;
    } else {
      const det = await (await fetch(`${GRAPH}/${page.id}?fields=fan_count,followers_count&access_token=${pageToken}`)).json();
      followersCount = det.followers_count ?? det.fan_count ?? 0;
    }

    // 4. Store connection (service role bypasses RLS)
    const db = createClient(supabaseUrl, serviceKey);
    const { error: upsertErr } = await db.from("social_connections").upsert({
      user_id: userId, client_id: clientId, platform,
      account_id: accountId, account_name: accountName,
      account_username: accountUsername, followers_count: followersCount,
      access_token: obfuscate(pageToken, encKey),
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      connected: true, connected_at: new Date().toISOString(),
    }, { onConflict: "user_id,client_id,platform" });

    if (upsertErr) return fail(upsertErr.message);

    // 5. Redirect back to workspace with success flag
    return redirect(`${APP_URL}/agency/clients/${clientId}?meta_connected=1`);

  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro inesperado");
  }
});
