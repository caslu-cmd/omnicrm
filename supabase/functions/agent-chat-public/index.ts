import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.3";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: cors });

  try {
    const { token, messages } = await req.json();

    if (!token || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "token e messages são obrigatórios" }, { status: 400, headers: cors });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: link, error: linkErr } = await supabase
      .from("agent_links")
      .select("system_prompt, agent_name, active")
      .eq("token", token)
      .maybeSingle();

    if (linkErr || !link) {
      return Response.json({ error: "Link não encontrado" }, { status: 404, headers: cors });
    }
    if (!link.active) {
      return Response.json({ error: "Este link foi desativado" }, { status: 403, headers: cors });
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "" });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: link.system_prompt,
      messages: messages.slice(-20), // limita histórico
    });

    const content = response.content[0]?.type === "text" ? response.content[0].text : "";
    return Response.json({ content }, { headers: cors });

  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});
