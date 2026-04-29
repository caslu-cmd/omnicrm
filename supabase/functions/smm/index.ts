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
const LINKEDIN_API = "https://api.linkedin.com/v2";

const META_SCOPE = [
  "pages_manage_posts",
  "pages_read_engagement",
  "pages_show_list",
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_insights",
].join(",");

const LINKEDIN_SCOPE = "w_organization_social r_organization_social";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return respond({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl        = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey    = Deno.env.get("SUPABASE_ANON_KEY")!;
    const encKey             = Deno.env.get("INTEGRATION_ENCRYPTION_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const metaAppId          = Deno.env.get("META_APP_ID") ?? "";
    const metaAppSecret      = Deno.env.get("META_APP_SECRET") ?? "";
    const redirectUri        = Deno.env.get("META_REDIRECT_URI") ?? "https://omnicrm.lovable.app/oauth/meta";
    const linkedinClientId   = Deno.env.get("LINKEDIN_CLIENT_ID") ?? "";
    const linkedinClientSecret = Deno.env.get("LINKEDIN_CLIENT_SECRET") ?? "";
    const linkedinRedirectUri = Deno.env.get("LINKEDIN_REDIRECT_URI") ?? "https://omnicrm.lovable.app/oauth/linkedin";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (!payload?.sub) return respond({ error: "Unauthorized" }, 401);
      userId = payload.sub;
    } catch {
      return respond({ error: "Unauthorized" }, 401);
    }

    const body = await req.json();
    const action: string = body.action ?? "";

    // ── Meta OAuth URL ───────────────────────────────────────────
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

    // ── Meta OAuth callback ──────────────────────────────────────
    if (action === "oauth-callback") {
      const { code, state } = body;
      if (!code || !state) return respond({ error: "code e state são obrigatórios" }, 400);
      if (!metaAppId || !metaAppSecret) return respond({ error: "Credenciais Meta não configuradas" }, 503);

      const b64 = state.replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
      let sd: { userId: string; clientId: string; platform: string };
      try { sd = JSON.parse(atob(padded)); }
      catch { return respond({ error: "State inválido" }, 400); }
      const { clientId, platform } = sd;

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
        const pageDetailsRes = await fetch(`${GRAPH}/${page.id}?fields=fan_count,followers_count&access_token=${pageToken}`);
        const pageDetails = await pageDetailsRes.json();
        followersCount = pageDetails.followers_count ?? pageDetails.fan_count ?? 0;
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

    // ── LinkedIn OAuth URL ───────────────────────────────────────
    if (action === "linkedin-oauth-url") {
      if (!linkedinClientId) return respond({ error: "LINKEDIN_CLIENT_ID não configurado" }, 503);
      const { client_id, org_vanity_name } = body;
      const state = btoa(JSON.stringify({
        userId, clientId: client_id, platform: "linkedin",
        orgVanityName: org_vanity_name ?? "", ts: Date.now(),
      })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      const url =
        `https://www.linkedin.com/oauth/v2/authorization` +
        `?response_type=code` +
        `&client_id=${linkedinClientId}` +
        `&redirect_uri=${encodeURIComponent(linkedinRedirectUri)}` +
        `&scope=${encodeURIComponent(LINKEDIN_SCOPE)}` +
        `&state=${state}`;
      return respond({ url });
    }

    // ── LinkedIn OAuth callback ──────────────────────────────────
    if (action === "linkedin-oauth-callback") {
      const { code, state } = body;
      if (!code || !state) return respond({ error: "code e state são obrigatórios" }, 400);
      if (!linkedinClientId || !linkedinClientSecret) return respond({ error: "Credenciais LinkedIn não configuradas" }, 503);

      const b64 = state.replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
      let sd: { userId: string; clientId: string; platform: string; orgVanityName: string };
      try { sd = JSON.parse(atob(padded)); }
      catch { return respond({ error: "State inválido" }, 400); }
      const { clientId, orgVanityName } = sd;

      // Exchange code for access token
      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: linkedinRedirectUri,
          client_id: linkedinClientId,
          client_secret: linkedinClientSecret,
        }).toString(),
      });
      const tokenData = await tokenRes.json();
      if (tokenData.error) return respond({ error: tokenData.error_description ?? tokenData.error }, 400);

      const accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in ?? 5183999;

      // Lookup org by vanity name to get numeric URN
      let accountId = orgVanityName;
      let accountName = orgVanityName;

      if (orgVanityName) {
        try {
          const orgRes = await fetch(
            `${LINKEDIN_API}/organizations?q=vanityName&vanityName=${encodeURIComponent(orgVanityName)}`,
            { headers: { Authorization: `Bearer ${accessToken}`, "X-Restli-Protocol-Version": "2.0.0" } }
          );
          const orgData = await orgRes.json();
          const org = orgData.elements?.[0];
          if (org?.id) {
            accountId = `urn:li:organization:${org.id}`;
            accountName = org.localizedName ?? orgVanityName;
          }
        } catch { /* fallback to vanity name */ }
      }

      const encryptedToken = obfuscate(accessToken, encKey);
      const { error: upsertError } = await supabase
        .from("social_connections")
        .upsert({
          user_id: userId, client_id: clientId, platform: "linkedin",
          account_id: accountId, account_name: accountName,
          account_username: `@${orgVanityName}`,
          followers_count: 0,
          access_token: encryptedToken,
          token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          connected: true, connected_at: new Date().toISOString(),
        }, { onConflict: "user_id,client_id,platform" });

      if (upsertError) return respond({ error: upsertError.message }, 500);
      return respond({ success: true, account_name: accountName, account_username: `@${orgVanityName}`, followers_count: 0 });
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
      const { client_id, platforms, caption, media_url, media_type, scheduled_at, link_url } = body;
      if (!client_id || !platforms?.length) return respond({ error: "client_id e platforms obrigatórios" }, 400);

      const scheduledDate = scheduled_at ? new Date(scheduled_at) : null;
      const isScheduled   = scheduledDate && scheduledDate > new Date();
      const isStory       = media_type === "story";
      let status          = "publishing";
      let fbPostId: string | null = null;
      let igMediaId: string | null = null;
      let errorMessage: string | null = null;

      for (const platform of platforms as string[]) {
        const { data: conn } = await supabase.from("social_connections")
          .select("account_id,access_token").eq("user_id", userId)
          .eq("client_id", client_id).eq("platform", platform).eq("connected", true).maybeSingle();
        if (!conn) continue;
        const accessToken = deobfuscate(conn.access_token, encKey);

        try {
          if (platform === "facebook") {
            const endpoint = media_url ? `${GRAPH}/${conn.account_id}/photos` : `${GRAPH}/${conn.account_id}/feed`;
            const postBody: Record<string, unknown> = media_url
              ? { url: media_url, caption: caption ?? "", access_token: accessToken }
              : { message: caption ?? "", access_token: accessToken };
            if (isScheduled) {
              postBody.scheduled_publish_time = Math.floor(scheduledDate!.getTime() / 1000);
              postBody.published = false;
            }
            const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(postBody) });
            const result = await res.json();
            if (result.error) { errorMessage = result.error.message; status = "failed"; }
            else { fbPostId = result.post_id ?? result.id; status = isScheduled ? "scheduled" : "publishing"; }

          } else if (platform === "instagram") {
            if (!media_url) { errorMessage = "Instagram requer imagem"; status = "failed"; continue; }

            const container: Record<string, unknown> = { image_url: media_url, access_token: accessToken };

            if (isStory) {
              container.media_type = "STORIES";
              if (link_url) container.link_url = link_url;
            } else {
              container.caption = caption ?? "";
            }

            if (isScheduled) {
              container.published  = false;
              container.publish_at = scheduledDate!.toISOString();
            }

            const containerRes = await fetch(`${GRAPH}/${conn.account_id}/media`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(container) });
            const containerData = await containerRes.json();
            if (containerData.error) { errorMessage = containerData.error.message; status = "failed"; continue; }

            const publishRes = await fetch(`${GRAPH}/${conn.account_id}/media_publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }) });
            const published = await publishRes.json();
            if (published.error) { errorMessage = published.error.message; status = "failed"; }
            else { igMediaId = published.id; status = isScheduled ? "scheduled" : "publishing"; }

          } else if (platform === "linkedin") {
            if (!conn.account_id.startsWith("urn:li:organization:")) {
              errorMessage = "ID da organização inválido. Reconecte o LinkedIn.";
              status = "failed";
              continue;
            }

            // LinkedIn UGC Posts — text only (image URL appended to caption)
            const text = media_url
              ? `${caption ?? ""}\n\n${media_url}`.trim()
              : (caption ?? "");

            const postBody = {
              author: conn.account_id,
              lifecycleState: "PUBLISHED",
              specificContent: {
                "com.linkedin.ugc.ShareContent": {
                  shareCommentary: { text },
                  shareMediaCategory: "NONE",
                },
              },
              visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
            };

            const res = await fetch(`${LINKEDIN_API}/ugcPosts`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                "X-Restli-Protocol-Version": "2.0.0",
              },
              body: JSON.stringify(postBody),
            });
            const result = await res.json();
            if (!res.ok || result.serviceErrorCode || result.message) {
              errorMessage = result.message ?? "Erro ao publicar no LinkedIn";
              status = "failed";
            } else {
              status = "publishing";
            }
          }
        } catch (e) { errorMessage = e instanceof Error ? e.message : "Erro ao publicar"; status = "failed"; }
      }

      if (status === "publishing") status = "published";

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
        if (conn.platform === "linkedin") {
          // LinkedIn metrics via organizationalEntityFollowerStatistics
          const accessToken = deobfuscate(conn.access_token, encKey);
          try {
            const statsRes = await fetch(
              `${LINKEDIN_API}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(conn.account_id)}`,
              { headers: { Authorization: `Bearer ${accessToken}`, "X-Restli-Protocol-Version": "2.0.0" } }
            );
            const stats = await statsRes.json();
            const total = stats.elements?.[0]?.followerCountsByAssociationType?.find(
              (x: { associationType: string }) => x.associationType === "MEMBER"
            )?.followerCounts?.organicFollowerCount ?? conn.followers_count ?? 0;
            metrics.push({ platform: "linkedin", account_name: conn.account_name, followers: total, impressions: 0, reach: 0, engagement: 0 });
          } catch {
            metrics.push({ platform: "linkedin", account_name: conn.account_name, followers: conn.followers_count ?? 0, impressions: 0, reach: 0, engagement: 0 });
          }
          continue;
        }

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
