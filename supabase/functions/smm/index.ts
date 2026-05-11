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

function normalizeMetaDatePreset(value: unknown): string {
  const preset = typeof value === "string" ? value : "last_30d";
  const aliases: Record<string, string> = {
    last_7_days: "last_7d",
    last_30_days: "last_30d",
    last_90_days: "last_90d",
  };
  return aliases[preset] ?? preset;
}

const META_SCOPE = [
  "pages_manage_posts",
  "pages_read_engagement",
  "pages_show_list",
  "business_management",
  "public_profile",
  "instagram_basic",
  "instagram_content_publish",
].join(",");

const LINKEDIN_SCOPE = "w_member_social";

function normalizeScheduledPostMediaType(mediaType: unknown, mediaUrl: unknown): "text" | "image" | "video" {
  const value = typeof mediaType === "string" ? mediaType.toLowerCase() : "";
  if (value === "video") return "video";
  if (value === "text" && !mediaUrl) return "text";
  if (mediaUrl) return "image";
  return "text";
}

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

      // Use the redirect_uri from the client (so it matches whatever domain the app is on)
      const callbackRedirectUri = (body.redirect_uri as string) || redirectUri;

      const tokenRes = await fetch(`${GRAPH}/oauth/access_token?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(callbackRedirectUri)}&client_secret=${metaAppSecret}&code=${code}`);
      const tokenData = await tokenRes.json();
      if (tokenData.error) return respond({ error: tokenData.error.message }, 400);

      const longRes = await fetch(`${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${tokenData.access_token}`);
      const longData = await longRes.json();
      if (longData.error) return respond({ error: longData.error.message }, 400);

      const longToken = longData.access_token;
      const expiresIn = longData.expires_in ?? 5184000;

      // Meta Ads: use user token to connect ad account
      if (platform === "meta_ads") {
        const adAccRes = await fetch(`${GRAPH}/me/adaccounts?fields=id,name,account_status,currency&access_token=${longToken}`);
        const adAccData = await adAccRes.json();
        if (adAccData.error) return respond({ error: adAccData.error.message }, 400);
        const accounts: Array<{ id: string; name: string; account_status: number }> = adAccData.data ?? [];
        const activeAccounts = accounts.filter((a) => a.account_status === 1);
        if (!activeAccounts.length) return respond({ error: "Nenhuma conta de anúncios ativa encontrada. Verifique o Meta Business Manager." }, 400);
        const adAcc = activeAccounts[0];
        const encToken = obfuscate(longToken, encKey);
        const { error: upsertErr } = await supabase.from("social_connections").upsert({
          user_id: userId, client_id: clientId, platform: "meta_ads",
          account_id: adAcc.id, account_name: adAcc.name,
          account_username: null, followers_count: 0,
          access_token: encToken, token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          connected: true, connected_at: new Date().toISOString(),
        }, { onConflict: "user_id,client_id,platform" });
        if (upsertErr) return respond({ error: upsertErr.message }, 500);
        return respond({ success: true, account_name: adAcc.name, accounts: activeAccounts });
      }

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

      const encryptedToken = obfuscate(pageToken, encKey);
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

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

        const { error: upsertError } = await supabase
          .from("social_connections")
          .upsert({
            user_id: userId, client_id: clientId, platform: "instagram",
            account_id: accountId, account_name: accountName,
            account_username: accountUsername, followers_count: followersCount,
            access_token: encryptedToken, token_expires_at: tokenExpiresAt,
            connected: true, connected_at: new Date().toISOString(),
          }, { onConflict: "user_id,client_id,platform" });
        if (upsertError) return respond({ error: upsertError.message }, 500);
        return respond({ success: true, account_name: accountName, account_username: accountUsername, followers_count: followersCount });
      }

      // Facebook: save Page connection, then auto-detect and save Instagram too
      const pageDetailsRes = await fetch(`${GRAPH}/${page.id}?fields=fan_count,followers_count&access_token=${pageToken}`);
      const pageDetails = await pageDetailsRes.json();
      followersCount = pageDetails.followers_count ?? pageDetails.fan_count ?? 0;

      const { error: upsertError } = await supabase
        .from("social_connections")
        .upsert({
          user_id: userId, client_id: clientId, platform: "facebook",
          account_id: accountId, account_name: accountName,
          account_username: accountUsername, followers_count: followersCount,
          access_token: encryptedToken, token_expires_at: tokenExpiresAt,
          connected: true, connected_at: new Date().toISOString(),
        }, { onConflict: "user_id,client_id,platform" });
      if (upsertError) return respond({ error: upsertError.message }, 500);

      // Auto-detect Instagram linked to this Facebook Page
      let igConnected = false;
      let igName: string | null = null;
      let igUsername: string | null = null;
      let igFollowers = 0;
      try {
        const igRes = await fetch(`${GRAPH}/${page.id}?fields=instagram_business_account&access_token=${pageToken}`);
        const igData = await igRes.json();
        const igId = igData.instagram_business_account?.id;
        if (igId) {
          const igDetailsRes = await fetch(`${GRAPH}/${igId}?fields=id,name,username,followers_count&access_token=${pageToken}`);
          const igDetails = await igDetailsRes.json();
          if (!igDetails.error) {
            igName = igDetails.name ?? page.name;
            igUsername = igDetails.username ? `@${igDetails.username}` : null;
            igFollowers = igDetails.followers_count ?? 0;
            await supabase.from("social_connections").upsert({
              user_id: userId, client_id: clientId, platform: "instagram",
              account_id: igId, account_name: igName,
              account_username: igUsername, followers_count: igFollowers,
              access_token: encryptedToken, token_expires_at: tokenExpiresAt,
              connected: true, connected_at: new Date().toISOString(),
            }, { onConflict: "user_id,client_id,platform" });
            igConnected = true;
          }
        }
      } catch { /* Instagram auto-detect failed silently */ }

      return respond({
        success: true,
        account_name: accountName,
        account_username: accountUsername,
        followers_count: followersCount,
        instagram_connected: igConnected,
        instagram_name: igName,
        instagram_username: igUsername,
      });
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

      const accountId = "linkedin_connected";
      const accountName = orgVanityName || "LinkedIn";

      const encryptedToken = obfuscate(accessToken, encKey);
      const { error: upsertError } = await supabase
        .from("social_connections")
        .upsert({
          user_id: userId, client_id: clientId, platform: "linkedin",
          account_id: accountId, account_name: accountName,
          account_username: orgVanityName ? `@${orgVanityName}` : null,
          followers_count: 0,
          access_token: encryptedToken,
          token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          connected: true, connected_at: new Date().toISOString(),
        }, { onConflict: "user_id,client_id,platform" });

      if (upsertError) return respond({ error: upsertError.message }, 500);
      return respond({ success: true, account_name: accountName, account_username: orgVanityName ? `@${orgVanityName}` : null, followers_count: 0 });
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
      const { client_id, platforms, caption, media_url, media_urls, media_type, scheduled_at, link_url } = body;
      if (!client_id || !platforms?.length) return respond({ error: "client_id e platforms obrigatórios" }, 400);

      const scheduledDate = scheduled_at ? new Date(scheduled_at) : null;
      const isScheduled   = scheduledDate && scheduledDate > new Date();
      const isStory       = media_type === "story";
      const isCarousel    = Array.isArray(media_urls) && media_urls.length >= 2;
      const dbMediaType   = isCarousel ? "carousel" : normalizeScheduledPostMediaType(media_type, media_url);

      // Save the post to DB first — this way it always appears in the UI regardless of API outcomes
      const { data: post, error: insertError } = await supabase.from("scheduled_posts").insert({
        user_id: userId, client_id, platforms, caption,
        media_url: media_url || null,
        media_urls: isCarousel ? media_urls : null,
        media_type: dbMediaType,
        scheduled_at: scheduled_at || null,
        published_at: null,
        status: isScheduled ? "scheduled" : "publishing",
        fb_post_id: null, ig_media_id: null, error_message: null,
      }).select().single();
      if (insertError) return respond({ error: insertError.message }, 500);

      // For scheduled posts we are done — they will be published at the right time
      if (isScheduled) {
        return respond({ success: true, post, error_message: null, linkedin_intent_url: null });
      }

      // For immediate publishing, call each platform API then update the row
      let status          = "publishing";
      let fbPostId: string | null = null;
      let igMediaId: string | null = null;
      let errorMessage: string | null = null;
      let linkedinIntentUrl: string | null = null;

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
            const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(postBody) });
            const result = await res.json();
            if (result.error) { errorMessage = result.error.message; status = "failed"; }
            else { fbPostId = result.post_id ?? result.id; status = "publishing"; }

          } else if (platform === "instagram") {
            if (!media_url) { errorMessage = "Instagram requer imagem"; status = "failed"; continue; }

            if (isCarousel) {
              // Step 1: create individual item containers
              const childIds: string[] = [];
              for (const imgUrl of media_urls as string[]) {
                const itemRes = await fetch(`${GRAPH}/${conn.account_id}/media`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ image_url: imgUrl, is_carousel_item: true, access_token: accessToken }),
                });
                const itemData = await itemRes.json();
                if (itemData.error) { errorMessage = `Erro no item do carrossel: ${itemData.error.message}`; break; }
                childIds.push(itemData.id);
              }
              if (errorMessage) { status = "failed"; continue; }

              // Step 2: create carousel album container
              const albumRes = await fetch(`${GRAPH}/${conn.account_id}/media`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ media_type: "CAROUSEL_ALBUM", caption: caption ?? "", children: childIds.join(","), access_token: accessToken }),
              });
              const albumData = await albumRes.json();
              if (albumData.error) { errorMessage = albumData.error.message; status = "failed"; continue; }

              // Step 3: publish
              const publishRes = await fetch(`${GRAPH}/${conn.account_id}/media_publish`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ creation_id: albumData.id, access_token: accessToken }),
              });
              const published = await publishRes.json();
              if (published.error) { errorMessage = published.error.message; status = "failed"; }
              else { igMediaId = published.id; status = "publishing"; }

            } else {
              const container: Record<string, unknown> = { image_url: media_url, access_token: accessToken };
              if (isStory) {
                container.media_type = "STORIES";
                if (link_url) container.link_url = link_url;
              } else {
                container.caption = caption ?? "";
              }
              const containerRes = await fetch(`${GRAPH}/${conn.account_id}/media`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(container) });
              const containerData = await containerRes.json();
              if (containerData.error) { errorMessage = containerData.error.message; status = "failed"; continue; }

              const publishRes = await fetch(`${GRAPH}/${conn.account_id}/media_publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }) });
              const published = await publishRes.json();
              if (published.error) { errorMessage = published.error.message; status = "failed"; }
              else { igMediaId = published.id; status = "publishing"; }
            }

          } else if (platform === "linkedin") {
            const text = media_url
              ? `${caption ?? ""}\n\n${media_url}`.trim()
              : (caption ?? "");
            linkedinIntentUrl = `https://www.linkedin.com/intent/post?text=${encodeURIComponent(text)}`;
          }
        } catch (e) { errorMessage = e instanceof Error ? e.message : "Erro ao publicar"; status = "failed"; }
      }

      if (status === "publishing") status = "published";

      // Update row with final publish outcome
      await supabase.from("scheduled_posts").update({
        status, fb_post_id: fbPostId, ig_media_id: igMediaId, error_message: errorMessage,
        published_at: status === "published" ? new Date().toISOString() : null,
      }).eq("id", post.id);

      return respond({ success: true, post: { ...post, status }, error_message: errorMessage, linkedin_intent_url: linkedinIntentUrl });
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

    // ── Approve post ─────────────────────────────────────────────
    if (action === "approve-post") {
      const { post_id } = body;
      if (!post_id) return respond({ error: "post_id obrigatório" }, 400);

      const { data: post, error: fetchErr } = await supabase
        .from("scheduled_posts").select("*").eq("id", post_id).eq("user_id", userId).single();
      if (fetchErr || !post) return respond({ error: "Post não encontrado" }, 404);

      // Mark approved
      await supabase.from("scheduled_posts").update({
        approved_by: userId,
        approved_at: new Date().toISOString(),
        status: "publishing",
      }).eq("id", post_id);

      // Publish to each platform
      let fbPostId: string | null = null;
      let igMediaId: string | null = null;
      let errorMessage: string | null = null;
      let linkedinIntentUrl: string | null = null;
      const { caption, media_url, media_urls, media_type, platforms, client_id, scheduled_at } = post;
      const isScheduled = scheduled_at ? new Date(scheduled_at) > new Date() : false;
      const isCarousel = Array.isArray(media_urls) && media_urls.length > 1;
      const allMediaUrls: string[] = isCarousel ? media_urls! : (media_url ? [media_url] : []);

      for (const platform of (platforms as string[])) {
        const { data: conn } = await supabase.from("social_connections")
          .select("account_id,access_token").eq("user_id", userId)
          .eq("client_id", client_id).eq("platform", platform).eq("connected", true).maybeSingle();
        if (!conn) continue;
        const accessToken = deobfuscate(conn.access_token, encKey);
        try {
          if (platform === "facebook") {
            if (isCarousel && allMediaUrls.length > 1) {
              // Facebook multi-photo post: upload each photo unpublished then attach
              const photoIds: string[] = [];
              let uploadError: string | null = null;
              for (const url of allMediaUrls) {
                const r = await fetch(`${GRAPH}/${conn.account_id}/photos`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url, published: false, access_token: accessToken }),
                });
                const rj = await r.json();
                if (rj.error) { uploadError = rj.error.message; break; }
                if (rj.id) photoIds.push(rj.id);
              }
              if (uploadError) { errorMessage = `Erro upload foto: ${uploadError}`; continue; }
              if (photoIds.length < 2) { errorMessage = `Apenas ${photoIds.length} foto(s) carregada(s), carrossel requer no mínimo 2`; continue; }
              const feedBody = {
                message: caption ?? "",
                attached_media: photoIds.map(id => ({ media_fbid: id })),
                access_token: accessToken,
              };
              const res = await fetch(`${GRAPH}/${conn.account_id}/feed`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(feedBody),
              });
              const result = await res.json();
              if (result.error) { errorMessage = result.error.message; } else { fbPostId = result.id; }
            } else {
              const singleUrl = allMediaUrls[0];
              const endpoint = singleUrl ? `${GRAPH}/${conn.account_id}/photos` : `${GRAPH}/${conn.account_id}/feed`;
              const postBody: Record<string, unknown> = singleUrl
                ? { url: singleUrl, caption: caption ?? "", access_token: accessToken }
                : { message: caption ?? "", access_token: accessToken };
              const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(postBody) });
              const result = await res.json();
              if (result.error) { errorMessage = result.error.message; } else { fbPostId = result.post_id ?? result.id; }
            }
          } else if (platform === "instagram") {
            if (allMediaUrls.length === 0) { errorMessage = "Instagram requer imagem"; continue; }
            if (isCarousel && allMediaUrls.length > 1) {
              // Step 1: create a container for each image
              const childIds: string[] = [];
              let igUploadError: string | null = null;
              for (const url of allMediaUrls) {
                const r = await fetch(`${GRAPH}/${conn.account_id}/media`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: accessToken }),
                });
                const rj = await r.json();
                if (rj.error) { igUploadError = rj.error.message; break; }
                if (rj.id) childIds.push(rj.id);
              }
              if (igUploadError) { errorMessage = `Erro no item do carrossel: ${igUploadError}`; continue; }
              if (childIds.length < 2) { errorMessage = `Apenas ${childIds.length} item(s) criado(s), carrossel requer no mínimo 2`; continue; }
              // Step 2: create carousel container
              const carouselRes = await fetch(`${GRAPH}/${conn.account_id}/media`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ media_type: "CAROUSEL", children: childIds.join(","), caption: caption ?? "", access_token: accessToken }),
              });
              const carouselData = await carouselRes.json();
              if (carouselData.error) { errorMessage = carouselData.error.message; continue; }
              // Step 3: publish carousel
              const publishRes = await fetch(`${GRAPH}/${conn.account_id}/media_publish`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ creation_id: carouselData.id, access_token: accessToken }),
              });
              const published = await publishRes.json();
              if (published.error) { errorMessage = published.error.message; } else { igMediaId = published.id; }
            } else {
              // Single image
              const containerRes = await fetch(`${GRAPH}/${conn.account_id}/media`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_url: allMediaUrls[0], caption: caption ?? "", access_token: accessToken }),
              });
              const containerData = await containerRes.json();
              if (containerData.error) { errorMessage = containerData.error.message; continue; }
              const publishRes = await fetch(`${GRAPH}/${conn.account_id}/media_publish`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }),
              });
              const published = await publishRes.json();
              if (published.error) { errorMessage = published.error.message; } else { igMediaId = published.id; }
            }
          } else if (platform === "linkedin") {
            const text = allMediaUrls[0] ? `${caption ?? ""}\n\n${allMediaUrls[0]}`.trim() : (caption ?? "");
            linkedinIntentUrl = `https://www.linkedin.com/intent/post?text=${encodeURIComponent(text)}`;
          }
        } catch (e) { errorMessage = e instanceof Error ? e.message : "Erro ao publicar"; }
      }

      const finalStatus = errorMessage ? "failed" : isScheduled ? "scheduled" : "published";
      await supabase.from("scheduled_posts").update({
        status: finalStatus,
        published_at: finalStatus === "published" ? new Date().toISOString() : null,
        fb_post_id: fbPostId,
        ig_media_id: igMediaId,
        error_message: errorMessage,
      }).eq("id", post_id);

      return respond({ success: true, status: finalStatus, error_message: errorMessage, linkedin_intent_url: linkedinIntentUrl });
    }

    // ── Reject post ──────────────────────────────────────────────
    if (action === "reject-post") {
      const { post_id, reason } = body;
      if (!post_id) return respond({ error: "post_id obrigatório" }, 400);
      const { error } = await supabase.from("scheduled_posts")
        .update({ status: "rejected", rejection_reason: reason ?? null })
        .eq("id", post_id).eq("user_id", userId);
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

    // ── Ads OAuth URL (Meta Ads with ads_read + ads_management) ──
    if (action === "ads-oauth-url") {
      if (!metaAppId) return respond({ error: "META_APP_ID não configurado" }, 503);
      const { client_id } = body;
      const state = btoa(JSON.stringify({ userId, clientId: client_id, platform: "meta_ads", ts: Date.now() }));
      const adsScope = META_SCOPE + ",ads_read,ads_management";
      const url =
        `https://www.facebook.com/v22.0/dialog/oauth` +
        `?client_id=${metaAppId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${adsScope}` +
        `&auth_type=rerequest` +
        `&state=${encodeURIComponent(state)}` +
        `&response_type=code`;
      return respond({ url });
    }

    // ── Ads Metrics (Meta Ads account-level insights) ─────────────
    if (action === "ads-metrics") {
      const { client_id } = body;
      const date_preset = normalizeMetaDatePreset(body.date_preset);
      if (!client_id) return respond({ error: "client_id obrigatório" }, 400);

      const { data: conn } = await supabase.from("social_connections")
        .select("account_id,access_token,account_name")
        .eq("user_id", userId).eq("client_id", client_id)
        .eq("platform", "meta_ads").eq("connected", true).maybeSingle();
      if (!conn) return respond({ connected: false });

      const token = deobfuscate(conn.access_token, encKey);
      const insRes = await fetch(
        `${GRAPH}/${conn.account_id}/insights?fields=spend,impressions,clicks,ctr,cpm,cpc,reach,actions&date_preset=${date_preset}&access_token=${token}`
      );
      const insData = await insRes.json();
      if (insData.error) return respond({ error: insData.error.message }, 400);

      const hasData = Array.isArray(insData.data) && insData.data.length > 0;
      const d = hasData ? insData.data[0] : {};
      const purchaseAction = (d.actions ?? []).find(
        (a: any) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
      );
      const purchaseValue = parseFloat(purchaseAction?.value ?? "0");
      const spend = parseFloat(d.spend ?? "0");

      return respond({
        connected: true,
        has_data: hasData,
        account_name: conn.account_name,
        account_id: conn.account_id,
        spend,
        impressions: parseInt(d.impressions ?? "0"),
        clicks: parseInt(d.clicks ?? "0"),
        ctr: parseFloat(d.ctr ?? "0"),
        cpm: parseFloat(d.cpm ?? "0"),
        cpc: parseFloat(d.cpc ?? "0"),
        reach: parseInt(d.reach ?? "0"),
        roas: spend > 0 ? purchaseValue / spend : 0,
        date_preset,
      });
    }

    // ── Ads Campaigns ─────────────────────────────────────────────
    if (action === "ads-campaigns") {
      const { client_id } = body;
      const date_preset = normalizeMetaDatePreset(body.date_preset);
      if (!client_id) return respond({ error: "client_id obrigatório" }, 400);

      const { data: conn } = await supabase.from("social_connections")
        .select("account_id,access_token")
        .eq("user_id", userId).eq("client_id", client_id)
        .eq("platform", "meta_ads").eq("connected", true).maybeSingle();
      if (!conn) return respond({ campaigns: [] });

      const token = deobfuscate(conn.access_token, encKey);

      const [campaignsRes, insRes] = await Promise.all([
        fetch(`${GRAPH}/${conn.account_id}/campaigns?fields=id,name,status,objective&limit=25&access_token=${token}`),
        fetch(`${GRAPH}/${conn.account_id}/insights?fields=campaign_id,spend,impressions,clicks,ctr,cpc,reach&level=campaign&date_preset=${date_preset}&access_token=${token}`),
      ]);

      const campaignsData = await campaignsRes.json();
      const insData = await insRes.json();

      if (campaignsData.error) return respond({ error: `Campanhas: ${campaignsData.error.message}` }, 400);

      const insMap: Record<string, any> = {};
      for (const item of insData.data ?? []) insMap[item.campaign_id] = item;

      const campaigns = (campaignsData.data ?? []).map((c: any) => {
        const ins = insMap[c.id] ?? {};
        return {
          id: c.id, name: c.name, status: c.status, objective: c.objective ?? "",
          spend: parseFloat(ins.spend ?? "0"),
          impressions: parseInt(ins.impressions ?? "0"),
          clicks: parseInt(ins.clicks ?? "0"),
          ctr: parseFloat(ins.ctr ?? "0"),
          cpc: parseFloat(ins.cpc ?? "0"),
          reach: parseInt(ins.reach ?? "0"),
        };
      });

      return respond({ campaigns });
    }

    // ── Toggle Campaign ───────────────────────────────────────────
    if (action === "toggle-campaign") {
      const { campaign_id, status, client_id } = body;
      if (!campaign_id || !status || !client_id) return respond({ error: "campaign_id, status e client_id obrigatórios" }, 400);

      const { data: conn } = await supabase.from("social_connections")
        .select("account_id,access_token")
        .eq("user_id", userId).eq("client_id", client_id)
        .eq("platform", "meta_ads").eq("connected", true).maybeSingle();
      if (!conn) return respond({ error: "Conta de anúncios não conectada" }, 404);

      const token = deobfuscate(conn.access_token, encKey);
      const res = await fetch(`${GRAPH}/${campaign_id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, access_token: token }),
      });
      const result = await res.json();
      if (result.error) return respond({ error: result.error.message }, 400);
      return respond({ success: true });
    }

    // ── Parse Campaign Briefing with Claude ──────────────────────
    if (action === "parse-campaign-briefing") {
      const { briefing } = body;
      if (!briefing) return respond({ error: "briefing obrigatório" }, 400);
      const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
      if (!anthropicKey) return respond({ parsed: null, error: "ANTHROPIC_API_KEY não configurado" });
      const prompt = `Você é especialista em Meta Ads. Analise o briefing e extraia parâmetros para criar uma campanha. Retorne APENAS JSON válido, sem explicações.

Briefing: ${briefing}

JSON esperado:
{
  "name": "nome sugerido para a campanha",
  "objective": "OUTCOME_TRAFFIC|OUTCOME_LEADS|OUTCOME_AWARENESS|OUTCOME_ENGAGEMENT|OUTCOME_SALES",
  "optimization_goal": "LINK_CLICKS|LEAD_GENERATION|REACH|POST_ENGAGEMENT|CONVERSATIONS|OFFSITE_CONVERSIONS",
  "daily_budget_brl": número (orçamento diário em reais, mínimo 6),
  "age_min": número (18-65),
  "age_max": número (18-65),
  "genders": "all|male|female",
  "headline": "título do anúncio (máx 40 chars)",
  "body_text": "texto do anúncio (máx 125 chars)",
  "call_to_action": "LEARN_MORE|SIGN_UP|CONTACT_US|GET_OFFER|BUY_NOW"
}`;
      const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1024, messages: [{ role: "user", content: prompt }] }),
      });
      const aiData = await aiRes.json();
      try {
        const text = aiData.content?.[0]?.text ?? "{}";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        return respond({ parsed });
      } catch {
        return respond({ parsed: null, error: "Falha ao interpretar resposta da IA" });
      }
    }

    // ── Create Meta Campaign (Campaign + Ad Set + optional Creative + Ad) ──
    if (action === "create-meta-campaign") {
      const { client_id, campaign: c } = body;
      if (!client_id || !c) return respond({ error: "client_id e campaign obrigatórios" }, 400);

      const { data: conn } = await supabase.from("social_connections")
        .select("account_id,access_token")
        .eq("user_id", userId).eq("client_id", client_id)
        .eq("platform", "meta_ads").eq("connected", true).maybeSingle();
      if (!conn) return respond({ error: "Meta Ads não conectado" }, 400);

      const token = deobfuscate(conn.access_token, encKey);
      const dailyBudget = Math.round((parseFloat(c.daily_budget_brl) || 30) * 100);

      // 1. Campaign
      const campRes = await fetch(`${GRAPH}/${conn.account_id}/campaigns`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: c.name || "Campanha criada pela IA",
          objective: c.objective || "OUTCOME_TRAFFIC",
          status: "PAUSED",
          special_ad_categories: [],
          access_token: token,
        }),
      });
      const campData = await campRes.json();
      if (campData.error) {
        const needsReconnect = [200, 10, 190, 102].includes(campData.error?.code);
        return respond({ error: campData.error.message, reconnect_required: needsReconnect }, 400);
      }

      // 2. Targeting
      const targeting: Record<string, unknown> = {
        age_min: c.age_min || 18, age_max: c.age_max || 65,
        geo_locations: { countries: ["BR"] },
      };
      if (c.genders === "male") targeting.genders = [1];
      else if (c.genders === "female") targeting.genders = [2];

      // 3. Ad Set
      const adsetBody: Record<string, unknown> = {
        name: `${c.name || "Ad Set"} — Conjunto`,
        campaign_id: campData.id,
        daily_budget: dailyBudget,
        billing_event: "IMPRESSIONS",
        optimization_goal: c.optimization_goal || "LINK_CLICKS",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        targeting,
        status: "PAUSED",
        access_token: token,
      };
      if (c.start_time) adsetBody.start_time = c.start_time;
      if (c.end_time) adsetBody.end_time = c.end_time;

      const adsetRes = await fetch(`${GRAPH}/${conn.account_id}/adsets`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adsetBody),
      });
      const adsetData = await adsetRes.json();
      if (adsetData.error) return respond({ error: adsetData.error.message, campaign_id: campData.id }, 400);

      // 4. Creative + Ad (optional — requires page_id)
      let creativeId: string | null = null;
      let adId: string | null = null;
      if (c.page_id && (c.image_url || c.destination_url)) {
        const linkData: Record<string, unknown> = {
          link: c.destination_url || "https://facebook.com",
          message: c.body_text || "",
          name: c.headline || c.name,
        };
        if (c.image_url) linkData.image_url = c.image_url;
        if (c.call_to_action) linkData.call_to_action = { type: c.call_to_action };

        const creativeRes = await fetch(`${GRAPH}/${conn.account_id}/adcreatives`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${c.name} — Criativo`,
            object_story_spec: { page_id: c.page_id, link_data: linkData },
            access_token: token,
          }),
        });
        const creativeData = await creativeRes.json();
        if (!creativeData.error) {
          creativeId = creativeData.id;
          const adRes = await fetch(`${GRAPH}/${conn.account_id}/ads`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `${c.name} — Anúncio`,
              adset_id: adsetData.id,
              creative: { creative_id: creativeId },
              status: "PAUSED",
              access_token: token,
            }),
          });
          const adData = await adRes.json();
          if (!adData.error) adId = adData.id;
        }
      }

      return respond({
        success: true,
        campaign_id: campData.id,
        adset_id: adsetData.id,
        creative_id: creativeId,
        ad_id: adId,
        has_creative: !!creativeId,
      });
    }

    // ── Ads Debug — raw Meta API responses for diagnosis ─────────
    if (action === "ads-debug") {
      const { client_id } = body;
      if (!client_id) return respond({ error: "client_id obrigatório" }, 400);

      const { data: conn } = await supabase.from("social_connections")
        .select("account_id,access_token,account_name")
        .eq("user_id", userId).eq("client_id", client_id)
        .eq("platform", "meta_ads").eq("connected", true).maybeSingle();
      if (!conn) return respond({ connected: false });

      const token = deobfuscate(conn.access_token, encKey);

      const [permRes, adAccRes, insRes, campRes] = await Promise.all([
        fetch(`${GRAPH}/me/permissions?access_token=${token}`),
        fetch(`${GRAPH}/me/adaccounts?fields=id,name,account_status,currency&access_token=${token}`),
        fetch(`${GRAPH}/${conn.account_id}/insights?fields=spend,impressions,clicks,reach&date_preset=last_30d&access_token=${token}`),
        fetch(`${GRAPH}/${conn.account_id}/campaigns?fields=id,name,status,objective&limit=10&access_token=${token}`),
      ]);

      const [permissions, adAccounts, insights, campaigns] = await Promise.all([
        permRes.json(), adAccRes.json(), insRes.json(), campRes.json(),
      ]);

      return respond({
        stored_account_id: conn.account_id,
        stored_account_name: conn.account_name,
        permissions,
        ad_accounts: adAccounts,
        insights_raw: insights,
        campaigns_raw: campaigns,
      });
    }

    // ── Google Ads OAuth URL ──────────────────────────────────────
    if (action === "google-ads-oauth-url") {
      const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
      const googleRedirectUri = Deno.env.get("GOOGLE_REDIRECT_URI") ?? "https://omnicrm.lovable.app/oauth/google";
      if (!googleClientId) return respond({ error: "GOOGLE_CLIENT_ID não configurado" }, 503);
      const { client_id } = body;
      const state = btoa(JSON.stringify({ userId, clientId: client_id, platform: "google_ads", ts: Date.now() }));
      const url =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${googleClientId}` +
        `&redirect_uri=${encodeURIComponent(googleRedirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent("https://www.googleapis.com/auth/adwords")}` +
        `&access_type=offline&prompt=consent` +
        `&state=${encodeURIComponent(state)}`;
      return respond({ url });
    }

    // ── Google Ads Callback ───────────────────────────────────────
    if (action === "google-ads-callback") {
      const { code, state } = body;
      if (!code || !state) return respond({ error: "code e state obrigatórios" }, 400);
      const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
      const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";
      const googleRedirectUri = Deno.env.get("GOOGLE_REDIRECT_URI") ?? "https://omnicrm.lovable.app/oauth/google";
      if (!googleClientId || !googleClientSecret) return respond({ error: "Credenciais Google não configuradas" }, 503);

      const b64 = state.replace(/-/g, "+").replace(/_/g, "/");
      const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
      let sd: { userId: string; clientId: string };
      try { sd = JSON.parse(atob(padded)); }
      catch { return respond({ error: "State inválido" }, 400); }
      const { clientId } = sd;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code, client_id: googleClientId, client_secret: googleClientSecret,
          redirect_uri: googleRedirectUri, grant_type: "authorization_code",
        }).toString(),
      });
      const tokenData = await tokenRes.json();
      if (tokenData.error) return respond({ error: tokenData.error_description ?? tokenData.error }, 400);

      const encryptedToken = obfuscate(tokenData.access_token, encKey);
      const { error: upsertError } = await supabase.from("social_connections").upsert({
        user_id: userId, client_id: clientId, platform: "google_ads",
        account_id: "google_ads", account_name: "Google Ads",
        account_username: null, followers_count: 0,
        access_token: encryptedToken,
        token_expires_at: new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000).toISOString(),
        connected: true, connected_at: new Date().toISOString(),
      }, { onConflict: "user_id,client_id,platform" });
      if (upsertError) return respond({ error: upsertError.message }, 500);
      return respond({ success: true, account_name: "Google Ads" });
    }

    // ── Google Ads Metrics ────────────────────────────────────────
    if (action === "google-ads-metrics") {
      const { client_id, customer_id } = body;
      if (!client_id) return respond({ error: "client_id obrigatório" }, 400);

      const { data: conn } = await supabase.from("social_connections")
        .select("access_token,account_name")
        .eq("user_id", userId).eq("client_id", client_id)
        .eq("platform", "google_ads").eq("connected", true).maybeSingle();
      if (!conn) return respond({ connected: false });

      const devToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN") ?? "";
      if (!devToken) return respond({ connected: true, error: "GOOGLE_ADS_DEVELOPER_TOKEN não configurado — configure nas variáveis de ambiente do Supabase" });

      const token = deobfuscate(conn.access_token, encKey);
      const cid = customer_id?.replace(/-/g, "") ?? "";
      if (!cid) return respond({ connected: true, error: "customer_id não informado" });

      const gaqlRes = await fetch(
        `https://googleads.googleapis.com/v18/customers/${cid}/googleAds:search`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "developer-token": devToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `SELECT metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc
                    FROM campaign
                    WHERE segments.date DURING LAST_30_DAYS`,
          }),
        }
      );
      const gaqlData = await gaqlRes.json();
      if (gaqlData.error) return respond({ connected: true, error: gaqlData.error.message ?? gaqlData.error.status }, 400);

      let spend = 0, impressions = 0, clicks = 0;
      for (const row of gaqlData.results ?? []) {
        spend += (row.metrics?.costMicros ?? 0) / 1_000_000;
        impressions += row.metrics?.impressions ?? 0;
        clicks += row.metrics?.clicks ?? 0;
      }
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;

      return respond({ connected: true, spend, impressions, clicks, ctr, cpc, cpm: 0, reach: 0, roas: 0 });
    }

    return respond({ error: "Ação inválida" }, 400);
  } catch (err) {
    console.error("social-media error:", err);
    return respond({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
