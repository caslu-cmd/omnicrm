import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Simple XOR-based obfuscation with a server-side key (not meant as crypto-grade, but keeps secrets out of client/DB plaintext)
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return respond({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const encryptionKey = Deno.env.get("INTEGRATION_ENCRYPTION_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return respond({ error: "Unauthorized" }, 401);
  }
  const userId = claimsData.claims.sub as string;

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // GET config for a specific integration
    if (req.method === "GET" && action === "get-config") {
      const connectorName = url.searchParams.get("connector");
      if (!connectorName) return respond({ error: "connector param required" }, 400);

      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", userId)
        .eq("connector_name", connectorName)
        .maybeSingle();

      if (error) return respond({ error: error.message }, 500);

      if (data?.config && typeof data.config === "object") {
        const decrypted: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.config as Record<string, string>)) {
          try {
            decrypted[k] = deobfuscate(v, encryptionKey);
          } catch {
            decrypted[k] = v; // fallback for unencrypted values
          }
        }
        return respond({ ...data, config: decrypted });
      }

      return respond(data || null);
    }

    // POST save config
    if (req.method === "POST" && action === "save-config") {
      const body = await req.json();
      const { connector_name, config, connected, status } = body;

      if (!connector_name) return respond({ error: "connector_name required" }, 400);

      // Encrypt config values server-side
      const encrypted: Record<string, string> = {};
      if (config && typeof config === "object") {
        for (const [k, v] of Object.entries(config as Record<string, string>)) {
          encrypted[k] = v ? obfuscate(v, encryptionKey) : "";
        }
      }

      // Upsert integration
      const { data: existing } = await supabase
        .from("integrations")
        .select("id")
        .eq("user_id", userId)
        .eq("connector_name", connector_name)
        .maybeSingle();

      if (existing) {
        const updatePayload: Record<string, unknown> = { config: encrypted };
        if (connected !== undefined) updatePayload.connected = connected;
        if (status !== undefined) updatePayload.status = status;

        const { error } = await supabase
          .from("integrations")
          .update(updatePayload)
          .eq("id", existing.id);

        if (error) return respond({ error: error.message }, 500);
      } else {
        const { error } = await supabase
          .from("integrations")
          .insert({
            user_id: userId,
            connector_name,
            config: encrypted,
            connected: connected ?? false,
            status: status ?? "inactive",
          });

        if (error) return respond({ error: error.message }, 500);
      }

      return respond({ success: true });
    }

    // POST connect/disconnect
    if (req.method === "POST" && action === "toggle") {
      const body = await req.json();
      const { connector_name, connected } = body;

      const { data: existing } = await supabase
        .from("integrations")
        .select("id")
        .eq("user_id", userId)
        .eq("connector_name", connector_name)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("integrations")
          .update({ connected, status: connected ? "active" : "inactive" })
          .eq("id", existing.id);
        if (error) return respond({ error: error.message }, 500);
      } else {
        const { error } = await supabase
          .from("integrations")
          .insert({ user_id: userId, connector_name, connected, status: connected ? "active" : "inactive" });
        if (error) return respond({ error: error.message }, 500);
      }

      return respond({ success: true });
    }

    // POST sync
    if (req.method === "POST" && action === "sync") {
      const body = await req.json();
      const { connector_name } = body;

      const { error } = await supabase
        .from("integrations")
        .update({ last_sync: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("connector_name", connector_name);

      if (error) return respond({ error: error.message }, 500);
      return respond({ success: true });
    }

    // GET list all integrations for user
    if (req.method === "GET" && action === "list") {
      const { data, error } = await supabase
        .from("integrations")
        .select("connector_name, connected, status, last_sync")
        .eq("user_id", userId);

      if (error) return respond({ error: error.message }, 500);
      return respond(data || []);
    }

    return respond({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("manage-integrations error:", err);
    return respond({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
