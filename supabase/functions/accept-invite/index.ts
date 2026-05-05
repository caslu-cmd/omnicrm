import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const ok = (d: unknown) => new Response(JSON.stringify(d), { headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (msg: string, s = 400) => new Response(JSON.stringify({ error: msg }), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, serviceKey);

  const { action, token, user_id } = await req.json().catch(() => ({}));

  // Validate invite token (called from InvitePage before auth)
  if (action === "validate") {
    if (!token) return fail("Token ausente");
    const { data, error } = await db
      .from("client_members")
      .select("id, member_email, member_name, role, client_id, accepted")
      .eq("invite_token", token)
      .single();
    if (error || !data) return fail("Convite inválido ou expirado", 404);
    if (data.accepted) return fail("Convite já aceito", 409);
    return ok(data);
  }

  // Accept invite — link member_user_id after registration
  if (action === "accept") {
    if (!token || !user_id) return fail("Token e user_id são obrigatórios");
    const { data: invite, error: invErr } = await db
      .from("client_members")
      .select("id, accepted")
      .eq("invite_token", token)
      .single();
    if (invErr || !invite) return fail("Convite inválido", 404);
    if (invite.accepted) return fail("Convite já aceito", 409);

    // Verify user actually exists in auth.users before linking
    const { data: authUser, error: authErr } = await db.auth.admin.getUserById(user_id);
    if (authErr || !authUser?.user) return fail("Usuário não encontrado. Tente criar a conta novamente.", 400);

    const { error: updErr } = await db
      .from("client_members")
      .update({ member_user_id: user_id, accepted: true })
      .eq("id", invite.id);
    if (updErr) return fail("Erro ao aceitar convite: " + updErr.message, 500);
    return ok({ success: true });
  }

  return fail("Ação inválida");
});
