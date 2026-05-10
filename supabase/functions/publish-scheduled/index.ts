import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const GRAPH = "https://graph.facebook.com/v22.0";

function deobfuscate(encoded: string, key: string): string {
  const decoded = atob(encoded);
  const result: number[] = [];
  for (let i = 0; i < decoded.length; i++) {
    result.push(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return String.fromCharCode(...result);
}

Deno.serve(async (_req) => {
  const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const encKey          = Deno.env.get("INTEGRATION_ENCRYPTION_KEY") || serviceRoleKey;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Find posts due to publish
  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString());

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  if (!posts || posts.length === 0) return new Response(JSON.stringify({ published: 0 }));

  let published = 0;
  let failed = 0;

  for (const post of posts) {
    // Mark as publishing immediately to prevent double-publish
    await supabase.from("scheduled_posts").update({ status: "publishing" }).eq("id", post.id).eq("status", "scheduled");

    const { caption, media_url, media_urls, platforms, client_id, user_id } = post;
    // Carousel: check media_urls array (media_type may be stored as "image" in older posts)
    const isCarousel = Array.isArray(media_urls) && media_urls.length > 1;
    const allMediaUrls: string[] = isCarousel ? media_urls : (media_url ? [media_url] : []);

    let errorMessage: string | null = null;

    for (const platform of (platforms as string[])) {
      const { data: conn } = await supabase
        .from("social_connections")
        .select("account_id, access_token")
        .eq("user_id", user_id)
        .eq("client_id", client_id)
        .eq("platform", platform)
        .eq("connected", true)
        .maybeSingle();

      if (!conn) { errorMessage = `Sem conexão ativa para ${platform}`; continue; }

      const accessToken = deobfuscate(conn.access_token, encKey);

      try {
        if (platform === "facebook") {
          if (isCarousel && allMediaUrls.length > 1) {
            // Upload each photo unpublished, then post feed with attached_media
            const photoIds: string[] = [];
            for (const url of allMediaUrls) {
              const r = await fetch(`${GRAPH}/${conn.account_id}/photos`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, published: false, access_token: accessToken }),
              });
              const rj = await r.json();
              if (rj.id) photoIds.push(rj.id);
            }
            if (photoIds.length === 0) { errorMessage = "Nenhuma foto carregada para carrossel Facebook"; continue; }
            const feedRes = await fetch(`${GRAPH}/${conn.account_id}/feed`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: caption ?? "",
                attached_media: photoIds.map((id) => ({ media_fbid: id })),
                access_token: accessToken,
              }),
            });
            const feedData = await feedRes.json();
            if (feedData.error) errorMessage = feedData.error.message;
          } else if (allMediaUrls.length === 1) {
            const r = await fetch(`${GRAPH}/${conn.account_id}/photos`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: allMediaUrls[0], caption: caption ?? "", access_token: accessToken }),
            });
            const rj = await r.json();
            if (rj.error) errorMessage = rj.error.message;
          } else {
            const r = await fetch(`${GRAPH}/${conn.account_id}/feed`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: caption ?? "", access_token: accessToken }),
            });
            const rj = await r.json();
            if (rj.error) errorMessage = rj.error.message;
          }
        } else if (platform === "instagram") {
          if (allMediaUrls.length === 0) { errorMessage = "Instagram requer imagem"; continue; }
          if (isCarousel && allMediaUrls.length > 1) {
            // Step 1: create item containers
            const childIds: string[] = [];
            for (const url of allMediaUrls) {
              const r = await fetch(`${GRAPH}/${conn.account_id}/media`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: accessToken }),
              });
              const rj = await r.json();
              if (rj.id) childIds.push(rj.id);
            }
            if (childIds.length === 0) { errorMessage = "Nenhum item do carrossel criado"; continue; }
            // Step 2: create carousel container
            const albumRes = await fetch(`${GRAPH}/${conn.account_id}/media`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ media_type: "CAROUSEL", children: childIds.join(","), caption: caption ?? "", access_token: accessToken }),
            });
            const albumData = await albumRes.json();
            if (albumData.error) { errorMessage = albumData.error.message; continue; }
            // Step 3: publish
            const pubRes = await fetch(`${GRAPH}/${conn.account_id}/media_publish`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ creation_id: albumData.id, access_token: accessToken }),
            });
            const pubData = await pubRes.json();
            if (pubData.error) errorMessage = pubData.error.message;
          } else {
            // Single image
            const mediaRes = await fetch(`${GRAPH}/${conn.account_id}/media`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image_url: allMediaUrls[0], caption: caption ?? "", access_token: accessToken }),
            });
            const mediaData = await mediaRes.json();
            if (mediaData.error) { errorMessage = mediaData.error.message; continue; }
            const pubRes = await fetch(`${GRAPH}/${conn.account_id}/media_publish`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ creation_id: mediaData.id, access_token: accessToken }),
            });
            const pubData = await pubRes.json();
            if (pubData.error) errorMessage = pubData.error.message;
          }
        }
      } catch (e: any) {
        errorMessage = e?.message ?? "Erro desconhecido";
      }
    }

    if (errorMessage) {
      await supabase.from("scheduled_posts").update({ status: "failed", error_message: errorMessage }).eq("id", post.id);
      failed++;
    } else {
      await supabase.from("scheduled_posts").update({ status: "published", published_at: new Date().toISOString(), error_message: null }).eq("id", post.id);
      published++;
    }
  }

  return new Response(JSON.stringify({ published, failed }), { headers: { "Content-Type": "application/json" } });
});
