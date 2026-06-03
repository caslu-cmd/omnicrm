// demand-inbox — recebe uma demanda de qualquer fonte (UI, WhatsApp, webhook)
// e chama aria-orchestrate com autoSchedule: true.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const BASE_URL = "https://proldgiyterqhthludlp.supabase.co/functions/v1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabaseUrl  = Deno.env.get("SUPABASE_URL")!;
    const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader   = req.headers.get("Authorization") ?? `Bearer ${serviceKey}`;

    const { client_id, demand, platforms, user_id } = await req.json();

    if (!client_id || !demand) {
      return new Response(
        JSON.stringify({ error: "client_id e demand são obrigatórios" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Busca perfil do cliente
    const { data: profile } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("client_id", client_id)
      .maybeSingle();

    // Busca plataformas conectadas se não informadas
    let effectivePlatforms = platforms;
    if (!effectivePlatforms || effectivePlatforms.length === 0) {
      const { data: connections } = await supabase
        .from("social_connections")
        .select("platform")
        .eq("client_id", client_id)
        .eq("connected", true);
      effectivePlatforms = connections?.map((c: any) => c.platform) ?? ["instagram"];
    }

    const clientContext = {
      id:         client_id,
      name:       profile?.name       ?? client_id,
      industry:   profile?.industry   ?? "",
      nicho:      profile?.nicho      ?? profile?.industry ?? "",
      brandColor: profile?.brand_color ?? "#B9FF4B",
      logoUrl:    profile?.logo_url    ?? "",
    };

    // Salva a demanda no log (opcional, para rastreabilidade)
    await supabase.from("demand_inbox").insert({
      client_id,
      user_id:    user_id ?? null,
      demand,
      platforms:  effectivePlatforms,
      status:     "processing",
    }).select().maybeSingle();

    // Chama aria-orchestrate com autoSchedule: true
    const res = await fetch(`${BASE_URL}/aria-orchestrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": authHeader },
      body: JSON.stringify({
        demand,
        clientContext,
        userId: user_id,
        autoSchedule: true,
        platforms: effectivePlatforms,
      }),
    });

    const data = res.ok ? await res.json() : { error: await res.text() };

    // Atualiza status da demanda
    if (data.scheduledCount !== undefined) {
      await supabase.from("demand_inbox")
        .update({ status: "done", scheduled_count: data.scheduledCount })
        .eq("client_id", client_id)
        .eq("status", "processing");
    }

    return new Response(
      JSON.stringify({
        ok: res.ok,
        scheduledCount: data.scheduledCount ?? 0,
        draftCount:     data.draftCount ?? 0,
        imageUrl:       data.imageUrl ?? null,
        plan:           data.plan ?? null,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );

  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message ?? "erro interno" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
