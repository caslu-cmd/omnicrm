// auto-calendar-dispatch — lê eventos do calendário editorial de todos os clientes
// e chama aria-orchestrate com autoSchedule: true para cada evento do dia.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const BASE_URL = "https://proldgiyterqhthludlp.supabase.co/functions/v1";

Deno.serve(async (_req) => {
  const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
  const serviceKey     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey   = Deno.env.get("ANTHROPIC_API_KEY")!;

  const supabase = createClient(supabaseUrl, serviceKey);

  // Eventos de hoje e amanhã que ainda não foram processados
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const { data: events, error } = await supabase
    .from("client_calendar_events")
    .select("*")
    .eq("status", "scheduled")
    .lte("event_date", tomorrow.toISOString().split("T")[0])
    .gte("event_date", today.toISOString().split("T")[0]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!events || events.length === 0) {
    return new Response(JSON.stringify({ dispatched: 0, message: "Nenhum evento para hoje/amanhã." }));
  }

  let dispatched = 0;
  let failed = 0;
  const results: string[] = [];

  for (const event of events) {
    try {
      // Busca perfil do cliente no Supabase
      const { data: profile } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("client_id", event.client_id)
        .eq("user_id", event.user_id)
        .maybeSingle();

      // Busca plataformas conectadas do cliente
      const { data: connections } = await supabase
        .from("social_connections")
        .select("platform")
        .eq("client_id", event.client_id)
        .eq("user_id", event.user_id)
        .eq("connected", true);

      const platforms = connections?.map((c: any) => c.platform) ?? ["instagram"];

      const clientContext = {
        id:         event.client_id,
        name:       profile?.name       ?? event.client_id,
        industry:   profile?.industry   ?? "",
        nicho:      profile?.nicho      ?? profile?.industry ?? "",
        brandColor: profile?.brand_color ?? "#B9FF4B",
        logoUrl:    profile?.logo_url    ?? "",
      };

      // Monta a demanda a partir do evento
      const demand = [
        event.title,
        event.description ?? "",
        event.payload?.demand ?? "",
      ].filter(Boolean).join(" — ");

      // Chama aria-orchestrate com autoSchedule: true
      const res = await fetch(`${BASE_URL}/aria-orchestrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${anthropicKey}`,
          "apikey": serviceKey,
        },
        body: JSON.stringify({
          demand,
          clientContext,
          userId: event.user_id,
          autoSchedule: true,
          platforms,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        results.push(`❌ ${event.client_id} — ${event.title}: ${errText.slice(0, 100)}`);
        failed++;
        continue;
      }

      const data = await res.json();

      // Marca evento como concluído
      await supabase
        .from("client_calendar_events")
        .update({ status: "done" })
        .eq("id", event.id);

      results.push(
        `✅ ${clientContext.name} — "${event.title}": ${data.scheduledCount ?? 0} posts agendados`
      );
      dispatched++;

    } catch (e: any) {
      results.push(`❌ ${event.client_id}: ${e?.message ?? "erro desconhecido"}`);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ dispatched, failed, results }),
    { headers: { "Content-Type": "application/json" } },
  );
});
