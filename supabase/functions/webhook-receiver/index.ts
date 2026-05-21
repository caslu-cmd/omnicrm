import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
function fail(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Auto-map form field names to CRM fields
function autoMap(raw: Record<string, unknown>, mappings: Record<string, string>) {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== "string" && typeof value !== "number") continue;
    const str = String(value).trim();
    if (!str) continue;

    // Custom mapping takes priority
    const mapped = mappings[key];
    if (mapped) {
      result[mapped] = str;
      continue;
    }

    // Auto-detect by field name
    const k = key.toLowerCase();
    if (!result.name && /nome|name|first.?name/.test(k)) result.name = str;
    else if (!result.email && /e.?mail/.test(k)) result.email = str;
    else if (!result.phone && /fone|phone|celular|whatsapp|tel/.test(k)) result.phone = str;
    else if (!result.company && /empresa|company|negócio|negocio/.test(k)) result.company = str;
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: CORS });

  if (req.method !== "POST")
    return fail("Método não permitido", 405);

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return fail("Token ausente");

  let body: Record<string, unknown> = {};
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      for (const pair of text.split("&")) {
        const [k, v] = pair.split("=").map(decodeURIComponent);
        if (k) body[k] = v ?? "";
      }
    }
  } catch {
    return fail("Body inválido");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, serviceKey);

  // Find the webhook endpoint
  const { data: endpoint, error: epErr } = await db
    .from("webhook_endpoints")
    .select("*")
    .eq("token", token)
    .eq("active", true)
    .single();

  if (epErr || !endpoint) return fail("Token inválido ou webhook inativo", 404);

  // Map fields
  const mapped = autoMap(body as Record<string, unknown>, endpoint.field_mappings ?? {});

  if (!mapped.email && !mapped.name && !mapped.phone)
    return fail("Nenhum campo reconhecido (email, nome ou telefone necessário)");

  // Upsert contact
  const contactData = {
    user_id: endpoint.user_id,
    client_id: endpoint.client_id,
    name: mapped.name ?? mapped.email ?? "Lead sem nome",
    email: mapped.email ?? null,
    phone: mapped.phone ?? null,
    company: mapped.company ?? null,
    channel: "Website",
    status: "new",
    score: 10,
  };

  let contactId: string | null = null;

  if (mapped.email) {
    const { data: existing } = await db
      .from("contacts")
      .select("id")
      .eq("client_id", endpoint.client_id)
      .eq("email", mapped.email)
      .maybeSingle();

    if (existing) {
      contactId = existing.id;
    }
  }

  if (!contactId) {
    const { data: created, error: cErr } = await db
      .from("contacts")
      .insert(contactData)
      .select("id")
      .single();

    if (cErr) return fail("Erro ao criar contato: " + cErr.message, 500);
    contactId = created.id;
  }

  // Add activity note
  const courseName = endpoint.course_name ? ` — Curso: ${endpoint.course_name}` : "";
  await db.from("contact_activities").insert({
    contact_id: contactId,
    user_id: endpoint.user_id,
    type: "note",
    content: `Lead recebido via formulário${courseName}`,
    metadata: { source: "webhook", webhook_name: endpoint.name, raw: body },
  });

  // Log webhook lead
  await db.from("webhook_leads").insert({
    webhook_endpoint_id: endpoint.id,
    client_id: endpoint.client_id,
    contact_id: contactId,
    raw_data: body,
  });

  // Create lead in kanban pipeline (if endpoint has pipeline routing configured)
  let leadId: string | null = null;
  if (endpoint.pipeline_id) {
    const raw = body as Record<string, unknown>;
    const leadData: Record<string, unknown> = {
      user_id:             endpoint.user_id,
      client_id:           endpoint.client_id,
      pipeline_id:         endpoint.pipeline_id,
      stage_id:            endpoint.initial_stage_id ?? "lead",
      name:                mapped.name ?? mapped.email ?? "Lead sem nome",
      email:               mapped.email ?? null,
      phone:               mapped.phone ?? null,
      company:             mapped.company ?? null,
      source:              "webhook",
      webhook_endpoint_id: endpoint.id,
      // ABCER usineiro fields
      cnpj:         raw["cnpj"]         ? String(raw["cnpj"])         : null,
      potencia_kw:  raw["potencia_kw"]  ?? raw["potencia"] ?? raw["kw"] ? String(raw["potencia_kw"] ?? raw["potencia"] ?? raw["kw"]) : null,
      distribuidora:raw["distribuidora"] ? String(raw["distribuidora"]) : null,
      // ABCER associado fields
      uc:           raw["uc"]            ? String(raw["uc"])            : null,
      consumo_medio:raw["consumo_medio"] ?? raw["consumo"] ? String(raw["consumo_medio"] ?? raw["consumo"]) : null,
      metodo:       raw["metodo"]        ?? raw["payment_method"] ? String(raw["metodo"] ?? raw["payment_method"]) : null,
    };
    const { data: lead } = await db.from("client_leads").insert(leadData).select("id").single();
    if (lead) leadId = lead.id;
  }

  // If webhook is linked to a course, auto-enroll the student
  let enrollmentId: string | null = null;
  if (endpoint.course_id && (mapped.name || mapped.email)) {
    let alreadyEnrolled = false;
    if (mapped.email) {
      const { data: ex } = await db
        .from("course_enrollments")
        .select("id")
        .eq("course_id", endpoint.course_id)
        .eq("student_email", mapped.email)
        .maybeSingle();
      if (ex) { alreadyEnrolled = true; enrollmentId = ex.id; }
    }
    if (!alreadyEnrolled) {
      const { data: enr } = await db.from("course_enrollments").insert({
        course_id: endpoint.course_id,
        user_id: endpoint.user_id,
        student_name: mapped.name ?? mapped.email ?? "Inscrito",
        student_email: mapped.email ?? null,
        student_phone: mapped.phone ?? null,
      }).select("id").single();
      if (enr) enrollmentId = enr.id;
    }
  }

  // Update trigger stats
  await db.from("webhook_endpoints")
    .update({ trigger_count: (endpoint.trigger_count ?? 0) + 1, last_triggered_at: new Date().toISOString() })
    .eq("id", endpoint.id);

  return ok({ success: true, contact_id: contactId, lead_id: leadId, enrollment_id: enrollmentId });
});
