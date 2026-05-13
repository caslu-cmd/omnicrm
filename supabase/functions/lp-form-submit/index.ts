import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: cors });

  try {
    const { user_id, client_id, name, email, phone, message, source } = await req.json();

    if (!user_id || !name) {
      return Response.json({ error: "user_id e name são obrigatórios" }, { status: 400, headers: cors });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { error } = await supabase.from("contacts").insert({
      user_id,
      client_id: client_id || null,
      name: String(name).trim().slice(0, 200),
      email: email ? String(email).trim().slice(0, 200) : null,
      phone: phone ? String(phone).trim().slice(0, 50) : null,
      last_interaction: message ? String(message).trim().slice(0, 500) : null,
      source: source ? String(source).trim().slice(0, 200) : "landing_page",
      channel: "landing_page",
      status: "lead",
      score: 0,
    });

    if (error) throw new Error(error.message);

    return Response.json({ ok: true }, { headers: cors });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});
