import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SKIP_TYPES = new Set([
  "submit", "page-break", "section-title", "html", "divider",
  "captcha", "hidden", "stripe", "paypal", "recaptcha",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { wp_url, wp_user, wp_password, form_id } = await req.json();
    if (!wp_url || !wp_user || !wp_password || !form_id) {
      throw new Error("wp_url, wp_user, wp_password e form_id são obrigatórios");
    }

    const base = String(wp_url).replace(/\/$/, "");
    const auth = btoa(`${wp_user}:${wp_password}`);

    const res = await fetch(`${base}/wp-json/forminator/v1/forms/${form_id}`, {
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`WP API ${res.status}: ${err.slice(0, 300)}`);
    }

    const data = await res.json();

    const fields: Array<{ label: string; type: string; required: boolean; placeholder: string }> = [];

    if (Array.isArray(data.wrappers)) {
      for (const wrapper of data.wrappers) {
        if (!Array.isArray(wrapper.fields)) continue;
        for (const f of wrapper.fields) {
          const type: string = f.type ?? "text";
          if (SKIP_TYPES.has(type)) continue;
          fields.push({
            label: f.field_label ?? f.placeholder ?? f.element_id ?? type,
            type,
            required: f.required === "true" || f.required === true,
            placeholder: f.placeholder ?? f.field_label ?? "",
          });
        }
      }
    }

    // Extract submit button text
    let submit_text = "Enviar";
    const sd = data.settings?.submitData;
    if (sd?.buttonText) submit_text = sd.buttonText;
    else if (sd?.button_text) submit_text = sd.button_text;

    return new Response(JSON.stringify({
      success: true,
      form_id: String(form_id),
      form_name: data.name ?? `Formulário #${form_id}`,
      fields,
      submit_text,
    }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e.message ?? e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
