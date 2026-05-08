import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function obfuscate(text: string, key: string): string {
  const result: number[] = [];
  for (let i = 0; i < text.length; i++) {
    result.push(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(String.fromCharCode(...result));
}

function deobfuscate(encoded: string, key: string): string {
  const decoded = atob(encoded);
  const result: number[] = [];
  for (let i = 0; i < decoded.length; i++) {
    result.push(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return String.fromCharCode(...result);
}

const GRAPH = "https://graph.facebook.com/v22.0";

const META_SCOPE = [
  "pages_manage_posts",
  "pages_read_engagement",
  "pages_show_list",
  "public_profile",
].join(",");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return respond({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const encKey = Deno.env.get("INTEGRATION_ENCRYPTION_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const metaAppId = Deno.env.get("META_APP_ID") ?? "";
    const metaAppSecret = Deno.env.get("META_APP_SECRET") ?? "";
    const redirectUri = Deno.env.get("META_REDIRECT_URI") ?? "https://omnicrm.lovable.app/oauth/meta";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return respond({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub as string;

    const body = await req.json();
    const action: string = body.action ?? "";

    // ── Get OAuth URL ────────────────────────────────────────────
    if (action === "oauth-url") {
      if (!metaAppId) return respond({ error: "META_APP_ID não configurado" }, 503);
      const clientId: string = body.client_id ?? "";
      const platform: string = body.platform ?? "facebook";
      const state = btoa(JSON.stringify({ userId, clientId, platform, ts: Date.now() }));
      const oauthUrl =
        `https://www.facebook.com/v22.0/dialog/oauth` +
        `?client_id=${metaAppId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${META_SCOPE}` +
        `&state=${encodeURIComponent(state)}` +
        `&response_type=code`;
      return respond({ url: oauthUrl });
    }

    // ── OAuth callback ───────────────────────────────────────────
    if (action === "oauth-callback") {
      const { code, state } = body;
      if (!code || !state) return respond({ error: "code e state são obrigatórios" }, 400);
      if (!metaAppId || !metaAppSecret) return respond({ error: "Credenciais Meta não configuradas" }, 503);

      let stateData: { userId: string; clientId: string; platform: string };
      try { stateData = JSON.parse(atob(state)); }
      catch { return respond({ error: "State inválido" }, 400); }
      const { clientId, platform } = stateData;

      const tokenRes = await fetch(`${GRAPH}/oauth/access_token?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${metaAppSecret}&code=${code}`);
      const tokenData = await tokenRes.json();
      if (tokenData.error) return respond({ error: tokenData.error.message }, 400);

      const longRes = await fetch(`${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${tokenData.access_token}`);
      const longData = await longRes.json();
      if (longData.error) return respond({ error: longData.error.message }, 400);

      const longToken = longData.access_token;
      const expiresIn = longData.expires_in ?? 5184000;

      const pagesRes = await fetch(`${GRAPH}/me/accounts?access_token=${longToken}`);
      const pagesData = await pagesRes.json();
      if (pagesData.error) return respond({ error: pagesData.error.message }, 400);
      const pages: Array<{ id: string; name: string; access_token: string }> = pagesData.data ?? [];
      if (!pages.length) return respond({ error: "Nenhuma Página do Facebook encontrada." }, 400);

      const page = pages[0];
      const pageToken = page.access_token;
      let accountId = page.id;
      let accountName = page.name;
      let accountUsername: string | null = null;
      let followersCount = 0;

      if (platform === "instagram") {
        const igRes = await fetch(`${GRAPH}/${page.id}?fields=instagram_business_account&access_token=${pageToken}`);
        const igData = await igRes.json();
        const igId = igData.instagram_business_account?.id;
        if (!igId) return respond({ error: "Nenhuma conta Instagram Profissional vinculada a esta Página." }, 400);
        const igDetailsRes = await fetch(`${GRAPH}/${igId}?fields=id,name,username,followers_count&access_token=${pageToken}`);
        const igDetails = await igDetailsRes.json();
        accountId = igId;
        accountName = igDetails.name ?? page.name;
        accountUsername = igDetails.username ? `@${igDetails.username}` : null;
        followersCount = igDetails.followers_count ?? 0;
      } else {
        const pageDetailsRes = await fetch(`${GRAPH}/${page.id}?fields=fan_count&access_token=${pageToken}`);
        const pageDetails = await pageDetailsRes.json();
        followersCount = pageDetails.fan_count ?? 0;
      }

      const encryptedToken = obfuscate(pageToken, encKey);
      const { error: upsertError } = await supabase
        .from("social_connections")
        .upsert({
          user_id: userId, client_id: clientId, platform,
          account_id: accountId, account_name: accountName,
          account_username: accountUsername, followers_count: followersCount,
          access_token: encryptedToken,
          token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          connected: true, connected_at: new Date().toISOString(),
        }, { onConflict: "user_id,client_id,platform" });

      if (upsertError) return respond({ error: upsertError.message }, 500);
      return respond({ success: true, account_name: accountName, account_username: accountUsername, followers_count: followersCount });
    }

    // ── List connections ─────────────────────────────────────────
    if (action === "connections") {
      const { client_id } = body;
      if (!client_id) return respond({ error: "client_id obrigatório" }, 400);
      const { data, error } = await supabase
        .from("social_connections")
        .select("id,platform,account_id,account_name,account_username,followers_count,connected,connected_at,token_expires_at")
        .eq("user_id", userId).eq("client_id", client_id);
      if (error) return respond({ error: error.message }, 500);
      return respond(data ?? []);
    }

    // ── Disconnect ───────────────────────────────────────────────
    if (action === "disconnect") {
      const { client_id, platform } = body;
      if (!client_id || !platform) return respond({ error: "client_id e platform obrigatórios" }, 400);
      const { error } = await supabase.from("social_connections").delete()
        .eq("user_id", userId).eq("client_id", client_id).eq("platform", platform);
      if (error) return respond({ error: error.message }, 500);
      return respond({ success: true });
    }

    // ── Create / schedule post ───────────────────────────────────
    if (action === "create-post") {
      const { client_id, platforms, caption, media_url, media_type, link_url, scheduled_at } = body;
      if (!client_id || !platforms?.length) return respond({ error: "client_id e platforms obrigatórios" }, 400);

      const isStory = media_type === "story";
      const isScheduled = scheduled_at && new Date(scheduled_at) > new Date();
      let status = isScheduled ? "scheduled" : "publishing";
      let fbPostId: string | null = null;
      let igMediaId: string | null = null;
      let errorMessage: string | null = null;

      if (!isScheduled) {
        for (const platform of platforms as string[]) {
          const { data: conn } = await supabase.from("social_connections")
            .select("account_id,access_token").eq("user_id", userId)
            .eq("client_id", client_id).eq("platform", platform).eq("connected", true).maybeSingle();
          if (!conn) continue;
          const accessToken = deobfuscate(conn.access_token, encKey);
          try {
            if (platform === "facebook") {
              const endpoint = media_url ? `${GRAPH}/${conn.account_id}/photos` : `${GRAPH}/${conn.account_id}/feed`;
              const postBody = media_url
                ? { url: media_url, caption: caption ?? "", access_token: accessToken }
                : { message: caption ?? "", access_token: accessToken };
              const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(postBody) });
              const result = await res.json();
              if (result.error) { errorMessage = result.error.message; status = "failed"; }
              else fbPostId = result.post_id ?? result.id;
            } else if (platform === "instagram") {
              if (!media_url) { errorMessage = "Instagram requer imagem"; status = "failed"; continue; }

              if (isStory) {
                // Story: media_type=STORIES, sem caption, com link sticker opcional
                const containerPayload: Record<string, string> = {
                  image_url: media_url,
                  media_type: "STORIES",
                  access_token: accessToken,
                };
                if (link_url) {
                  containerPayload.story_sticker_ids = "link";
                  containerPayload.link_attachment = link_url;
                }
                const containerRes = await fetch(`${GRAPH}/${conn.account_id}/media`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(containerPayload),
                });
                const container = await containerRes.json();
                if (container.error) { errorMessage = container.error.message; status = "failed"; continue; }
                const publishRes = await fetch(`${GRAPH}/${conn.account_id}/media_publish`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
                });
                const published = await publishRes.json();
                if (published.error) { errorMessage = published.error.message; status = "failed"; }
                else igMediaId = published.id;
              } else {
                // Feed post normal
                const containerRes = await fetch(`${GRAPH}/${conn.account_id}/media`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ image_url: media_url, caption: caption ?? "", access_token: accessToken }),
                });
                const container = await containerRes.json();
                if (container.error) { errorMessage = container.error.message; status = "failed"; continue; }
                const publishRes = await fetch(`${GRAPH}/${conn.account_id}/media_publish`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ creation_id: container.id, access_token: accessToken }),
                });
                const published = await publishRes.json();
                if (published.error) { errorMessage = published.error.message; status = "failed"; }
                else igMediaId = published.id;
              }
            }
          } catch (e) { errorMessage = e instanceof Error ? e.message : "Erro ao publicar"; status = "failed"; }
        }
        if (status === "publishing") status = "published";
      }

      const { data: post, error: insertError } = await supabase.from("scheduled_posts").insert({
        user_id: userId, client_id, platforms, caption,
        media_url: media_url || null, media_type: media_type ?? "text",
        scheduled_at: scheduled_at || null,
        published_at: status === "published" ? new Date().toISOString() : null,
        status, fb_post_id: fbPostId, ig_media_id: igMediaId, error_message: errorMessage,
      }).select().single();
      if (insertError) return respond({ error: insertError.message }, 500);
      return respond({ success: true, post, error_message: errorMessage });
    }

    // ── List posts ───────────────────────────────────────────────
    if (action === "posts") {
      const { client_id } = body;
      if (!client_id) return respond({ error: "client_id obrigatório" }, 400);
      const { data, error } = await supabase.from("scheduled_posts").select("*")
        .eq("user_id", userId).eq("client_id", client_id).order("created_at", { ascending: false }).limit(50);
      if (error) return respond({ error: error.message }, 500);
      return respond(data ?? []);
    }

    // ── Delete post ──────────────────────────────────────────────
    if (action === "delete-post") {
      const { id } = body;
      if (!id) return respond({ error: "id obrigatório" }, 400);
      const { error } = await supabase.from("scheduled_posts").delete().eq("id", id).eq("user_id", userId);
      if (error) return respond({ error: error.message }, 500);
      return respond({ success: true });
    }

    // ── Metrics ──────────────────────────────────────────────────
    if (action === "metrics") {
      const { client_id } = body;
      if (!client_id) return respond({ error: "client_id obrigatório" }, 400);
      const { data: connections } = await supabase.from("social_connections")
        .select("platform,account_id,access_token,account_name,followers_count")
        .eq("user_id", userId).eq("client_id", client_id).eq("connected", true);
      if (!connections?.length) return respond({ metrics: [] });

      const metrics = [];
      for (const conn of connections) {
        const accessToken = deobfuscate(conn.access_token, encKey);
        try {
          let impressions = 0, reach = 0, engagement = 0;
          if (conn.platform === "facebook") {
            const res = await fetch(`${GRAPH}/${conn.account_id}/insights?metric=page_impressions,page_reach,page_engaged_users&period=week&access_token=${accessToken}`);
            const d = await res.json();
            for (const item of d.data ?? []) {
              const v = item.values?.[item.values.length - 1]?.value ?? 0;
              if (item.name === "page_impressions") impressions = v;
              if (item.name === "page_reach") reach = v;
              if (item.name === "page_engaged_users") engagement = v;
            }
          } else if (conn.platform === "instagram") {
            const res = await fetch(`${GRAPH}/${conn.account_id}/insights?metric=impressions,reach,profile_views&period=week&access_token=${accessToken}`);
            const d = await res.json();
            for (const item of d.data ?? []) {
              const v = item.values?.[item.values.length - 1]?.value ?? 0;
              if (item.name === "impressions") impressions = v;
              if (item.name === "reach") reach = v;
              if (item.name === "profile_views") engagement = v;
            }
          }
          metrics.push({ platform: conn.platform, account_name: conn.account_name, followers: conn.followers_count ?? 0, impressions, reach, engagement });
        } catch { /* skip */ }
      }
      return respond({ metrics });
    }

    return respond({ error: "Ação inválida" }, 400);
  } catch (err) {
    console.error("social-media error:", err);
    return respond({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
