// Renova os tokens da Meta antes de vencerem.
//
// Sem isto, todo token de longa duração morre em ~60 dias e a agência para de
// publicar, ler métricas e gerenciar anúncios sem nenhum aviso.
//
// Chamada pelo pg_cron (diária) ou manualmente. Autoriza por CRON_SECRET ou
// pela service role key.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// mesma ofuscação usada em social-media/smm
function obfuscate(text: string, key: string): string {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) out.push(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return btoa(String.fromCharCode(...out));
}
function deobfuscate(encoded: string, key: string): string {
  const decoded = atob(encoded);
  const out: number[] = [];
  for (let i = 0; i < decoded.length; i++) out.push(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  return String.fromCharCode(...out);
}

const GRAPH = "https://graph.facebook.com/v22.0";

// Renova com folga: 10 dias antes de vencer.
const RENEW_WINDOW_DAYS = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const encKey = Deno.env.get("INTEGRATION_ENCRYPTION_KEY") || serviceKey;
  const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
  const appId = Deno.env.get("META_APP_ID") ?? "";
  const appSecret = Deno.env.get("META_APP_SECRET") ?? "";

  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.replace("Bearer ", "").trim();

  const supabase = createClient(supabaseUrl, serviceKey);

  let authorized = Boolean(bearer) && (bearer === serviceKey || (cronSecret && bearer === cronSecret));
  if (!authorized && bearer) {
    // Chave do job interno (pg_cron), guardada com hash em internal_cron_keys.
    const { data: ok } = await supabase.rpc("verify_cron_key", {
      p_name: "meta-token-refresh",
      p_key: bearer,
    });
    authorized = ok === true;
  }
  if (!authorized) return respond({ error: "Unauthorized" }, 401);

  if (!appId || !appSecret) return respond({ error: "META_APP_ID/META_APP_SECRET não configurados" }, 503);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* chamada sem corpo */ }
  const force = body.force === true;
  // Só atualizar seguidores, sem mexer em token.
  const onlyStats = body.only_stats === true;

  const cutoff = new Date(Date.now() + RENEW_WINDOW_DAYS * 86400_000).toISOString();

  let query = supabase
    .from("social_connections")
    .select("id, client_id, platform, account_id, access_token, user_access_token, token_expires_at")
    .eq("connected", true);
  if (!force && !onlyStats) query = query.or(`token_expires_at.lte.${cutoff},token_expires_at.is.null`);

  const { data: rows, error } = await query;
  if (error) return respond({ error: error.message }, 500);

  const results: Array<Record<string, unknown>> = [];

  // Seguidores eram gravados só no momento da conexão e congelavam ali. Página
  // e Instagram usam campos diferentes — e `fan_count` (curtidas) não é o
  // mesmo que seguidores, que é o número que a agência mostra ao cliente.
  const atualizarSeguidores = async (row: Record<string, unknown>, pageToken: string) => {
    const id = row.account_id as string;
    if (!id) return null;
    const fields = row.platform === "instagram"
      ? "followers_count,username"
      : "followers_count,fan_count,name";
    const res = await fetch(`${GRAPH}/${id}?fields=${fields}&access_token=${encodeURIComponent(pageToken)}`);
    const d = await res.json();
    if (d.error) throw new Error(d.error.message);

    const seguidores = d.followers_count ?? d.fan_count ?? null;
    if (seguidores === null) return null;

    const patch: Record<string, unknown> = { followers_count: seguidores };
    if (row.platform === "instagram" && d.username) patch.account_username = `@${d.username}`;
    await supabase.from("social_connections").update(patch).eq("id", row.id as string);
    return seguidores as number;
  };

  for (const row of rows ?? []) {
    const label = `${row.client_id}/${row.platform}`;

    if (onlyStats) {
      // Meta Ads não tem seguidores.
      if (row.platform === "meta_ads") { results.push({ conexao: label, status: "ignorado" }); continue; }
      try {
        const seguidores = await atualizarSeguidores(row, deobfuscate(row.access_token as string, encKey));
        results.push({ conexao: label, status: "atualizado", seguidores });
      } catch (e) {
        results.push({ conexao: label, status: "erro", erro: e instanceof Error ? e.message : String(e) });
      }
      continue;
    }

    /**
     * SEM `user_access_token`, NÃO RENOVA — e isso é a correção mais importante
     * desta função.
     *
     * A versão anterior usava o próprio page token como moeda de troca no
     * `fb_exchange_token`, na premissa de que "o que volta já É o page token
     * renovado". Não é: o token que volta perde o vínculo com a Página, e toda
     * chamada de Página passa a responder
     * `190 — Any of the pages_read_engagement… must be granted before
     * impersonating a user's page`. Como a função gravava esse token por cima
     * do bom e ainda carimbava +60 dias de validade, a conexão ficava com cara
     * de saudável e não publicava mais nada.
     *
     * Foi o que derrubou os posts agendados do ABCER em junho e o que impediu
     * a inscrição do webhook do Grupo Licita hoje. Page token derivado de um
     * user token de longa duração já não expira sozinho, então o certo aqui é
     * NÃO TOCAR e pedir reconexão — melhor um token velho que funciona do que
     * um novo que não serve.
     */
    const seed = row.user_access_token as string | null;
    if (!seed) {
      await supabase.from("social_connections")
        .update({
          refresh_error: "sem user_access_token — reconectar pela aba Redes Sociais (o token da Página foi preservado)",
          last_refresh_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      results.push({ conexao: label, status: "precisa_reconectar" });
      continue;
    }

    try {
      const userToken = deobfuscate(seed, encKey);

      // 1) troca o token de usuário por outro de 60 dias
      const exRes = await fetch(
        `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}` +
        `&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(userToken)}`,
      );
      const exData = await exRes.json();
      if (exData.error) throw new Error(exData.error.message);

      const newToken: string = exData.access_token;
      let expiresIn: number = exData.expires_in ?? 5184000;
      let newPageToken = newToken;

      // 2) Redescobre a Página pelo token de usuário renovado e pega dela um
      //    page token novo. Este é o ÚNICO caminho que devolve token com poder
      //    de Página — daí a exigência do `user_access_token` lá em cima.
      {
        const pagesRes = await fetch(`${GRAPH}/me/accounts?access_token=${newToken}`);
        const pagesData = await pagesRes.json();
        if (pagesData.error) throw new Error(pagesData.error.message);

        const pages: Array<{ id: string; name: string; access_token: string }> = pagesData.data ?? [];
        if (!pages.length) throw new Error("nenhuma Página retornada pela Meta");

        // Instagram guarda o id da conta IG, não o da Página: casamos pela Página
        // que hospeda aquela conta; nos demais casos, pelo próprio id.
        let page = pages.find((p) => p.id === row.account_id);
        if (!page && row.platform === "instagram") {
          for (const p of pages) {
            const igRes = await fetch(`${GRAPH}/${p.id}?fields=instagram_business_account&access_token=${p.access_token}`);
            const igData = await igRes.json();
            if (igData?.instagram_business_account?.id === row.account_id) { page = p; break; }
          }
        }
        newPageToken = (page ?? pages[0]).access_token;
      }

      // 3) validade real segundo a própria Meta (expires_at = 0 → não expira)
      const dbgRes = await fetch(
        `${GRAPH}/debug_token?input_token=${encodeURIComponent(newPageToken)}` +
        `&access_token=${appId}|${appSecret}`,
      );
      const dbg = await dbgRes.json();
      const info = dbg?.data;
      if (info && info.is_valid === false) {
        throw new Error(info.error?.message ?? "token inválido segundo a Meta");
      }
      if (info?.expires_at === 0 && info?.data_access_expires_at) {
        // Token sem expiração, mas o acesso aos dados caduca: é o prazo que vale.
        expiresIn = Math.max(0, info.data_access_expires_at - Math.floor(Date.now() / 1000));
      } else if (info?.expires_at) {
        expiresIn = Math.max(0, info.expires_at - Math.floor(Date.now() / 1000));
      }

      await supabase.from("social_connections").update({
        access_token: obfuscate(newPageToken, encKey),
        user_access_token: obfuscate(newToken, encKey),
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        last_refresh_at: new Date().toISOString(),
        refresh_error: null,
      }).eq("id", row.id);

      // aproveita o token novo para atualizar os seguidores
      let seguidores: number | null = null;
      if (row.platform !== "meta_ads") {
        try { seguidores = await atualizarSeguidores(row, newPageToken); } catch { /* não impede a renovação */ }
      }

      results.push({ conexao: label, status: "renovado", vence_em_dias: Math.round(expiresIn / 86400), seguidores });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from("social_connections")
        .update({ refresh_error: msg.slice(0, 300), last_refresh_at: new Date().toISOString() })
        .eq("id", row.id);
      results.push({ conexao: label, status: "erro", erro: msg });
    }
  }

  return respond({
    verificadas: rows?.length ?? 0,
    renovadas: results.filter((r) => r.status === "renovado").length,
    resultados: results,
  });
});
