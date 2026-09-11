import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/**
 * calu-api — a API oficial da Calu Agência para automação.
 *
 * Um ponto de entrada, autenticado por CHAVE (não por login de navegador),
 * para operar o CRM por fora da interface: listar/criar clientes, ligar os
 * agentes autônomos, gerenciar rotinas, criar e ler entregas do portal,
 * aprovar/recusar propostas e disparar o motor `rotina-agentes`.
 *
 * SEGURANÇA — "liberdade total" com porteiro:
 *  - Toda chamada exige `Authorization: Bearer <CALU_API_KEY>` (secret do
 *    Supabase, no mesmo espírito do CRON_SECRET). Sem a chave certa: 401.
 *  - A API age SEMPRE como a dona da agência (`CALU_API_OWNER_ID`), com a
 *    service role, e tudo é filtrado por `user_id = owner`. Ela nunca enxerga
 *    dados de outro usuário.
 *  - Sem `CALU_API_KEY`/`CALU_API_OWNER_ID` configurados, a função recusa com
 *    503 e uma mensagem de setup — em vez de abrir sem proteção.
 *
 * Protocolo: POST com JSON `{ "action": "...", ...params }`. Respostas JSON
 * `{ ok: true, ... }` ou `{ ok: false, error }`. `GET` devolve o manifesto de
 * ações (descoberta), sem tocar em dados.
 *
 * As rotinas padrão ligadas por `agents.activate` espelham
 * `src/lib/activateAgents.ts` (mesma cadência, mesmo modo fila-de-aprovação:
 * SEM `auto_aprovar`, então nada vai ao ar sem um OK).
 */

const VERSION = "1.0.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const ok = (extra: Record<string, unknown> = {}) => json({ ok: true, ...extra });
const fail = (error: string, status = 400) => json({ ok: false, error }, status);

/** Rotinas padrão — espelha src/lib/activateAgents.ts (modo fila de aprovação). */
const DEFAULT_ROUTINES: { rotina: string; dias_semana: number[]; hora: string }[] = [
  { rotina: "pauta", dias_semana: [1], hora: "09:00" },
  { rotina: "calendario", dias_semana: [1], hora: "09:30" },
  { rotina: "carrossel", dias_semana: [3], hora: "10:00" },
  { rotina: "relatorio", dias_semana: [5], hora: "17:00" },
];

/** Comparação sem vazar tamanho/posição por tempo. */
function chavesBatem(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Rotinas que faltam para o cliente (não sobrescreve o que já existe). */
function rotinasParaCriar(existentes: { rotina: string }[]) {
  const tem = new Set(existentes.map((r) => r.rotina));
  return DEFAULT_ROUTINES.filter((d) => !tem.has(d.rotina));
}

const dbStatus = (s?: string) => (s === "Ativo" || s === "active" ? "active" : "onboarding");

/** Garante a linha canônica em `clients` (por workspace_id, depois nome, depois cria). */
async function garantirCliente(
  sb: SupabaseClient, owner: string,
  c: { workspace_id: string; name: string; segment?: string | null; status?: string },
): Promise<string> {
  const { data: byWs } = await sb
    .from("clients").select("id, workspace_id")
    .eq("user_id", owner).eq("workspace_id", c.workspace_id)
    .order("created_at", { ascending: true });
  if (byWs && byWs.length > 0) return (byWs.find((r) => r.workspace_id) ?? byWs[0]).id as string;

  const { data: byName } = await sb
    .from("clients").select("id, workspace_id")
    .eq("user_id", owner).eq("name", c.name)
    .order("created_at", { ascending: true });
  if (byName && byName.length > 0) {
    const row = byName[0];
    if (!row.workspace_id) {
      await sb.from("clients").update({ workspace_id: c.workspace_id }).eq("id", row.id);
    }
    return row.id as string;
  }

  const { data: created, error } = await sb
    .from("clients")
    .insert({
      user_id: owner, name: c.name, segment: c.segment ?? null,
      status: dbStatus(c.status), workspace_id: c.workspace_id,
    })
    .select("id").single();
  if (error) throw new Error(error.message);
  return created!.id as string;
}

/** Liga as rotinas que faltam para um cliente. Devolve quantas criou. */
async function ativarCliente(
  sb: SupabaseClient, owner: string, workspaceId: string,
): Promise<number> {
  const { data: existentes } = await sb
    .from("client_routines").select("rotina")
    .eq("user_id", owner).eq("client_id", workspaceId);
  const criar = rotinasParaCriar((existentes ?? []) as { rotina: string }[]);
  if (criar.length === 0) return 0;
  const now = new Date().toISOString();
  const { error } = await sb.from("client_routines").upsert(
    criar.map((r) => ({
      user_id: owner, client_id: workspaceId, rotina: r.rotina,
      dias_semana: r.dias_semana, hora: r.hora, ativo: true, updated_at: now,
    })),
    { onConflict: "user_id,client_id,rotina" },
  );
  if (error) throw new Error(error.message);
  return criar.length;
}

/** Chama outra edge function com a service role (uso interno). */
async function chamarFuncao(base: string, key: string, slug: string, corpo: unknown) {
  const res = await fetch(`${base}/functions/v1/${slug}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const texto = await res.text();
  let dados: unknown;
  try { dados = JSON.parse(texto); } catch { dados = { texto }; }
  return { status: res.status, dados };
}

const MANIFESTO = {
  service: "calu-api",
  version: VERSION,
  auth: "Authorization: Bearer <CALU_API_KEY>",
  protocol: "POST JSON { action, ...params }",
  actions: {
    "health": "checagem — { ok, version, owner }",
    "clients.list": "lista os clientes { limit? } → clients[]",
    "clients.get": "um cliente por workspace_id { workspace_id }",
    "clients.upsert": "cria/atualiza cliente { workspace_id, name, segment?, status? }",
    "agents.activate": "liga as rotinas padrão { workspace_id } ou { all: true }",
    "routines.list": "rotinas do cliente { workspace_id }",
    "routines.set": "liga/ajusta rotina { workspace_id, rotina, dias_semana, hora, ativo }",
    "routine.run": "dispara o motor rotina-agentes { workspace_id?, rotina?, forcar? }",
    "deliverables.list": "entregas do portal { workspace_id, limit? }",
    "deliverables.create": "cria entrega no portal { workspace_id, category, title, description, visible_to_client? }",
    "proposals.list": "fila de aprovação { workspace_id?, status? }",
    "proposals.decide": "aprova/recusa { id, decision: 'approved'|'rejected' }",
  },
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  // GET = descoberta. Não toca em dados e não exige chave.
  if (req.method === "GET") return ok({ ...MANIFESTO });
  if (req.method !== "POST") return fail("Method not allowed", 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey = Deno.env.get("CALU_API_KEY") ?? "";
  const owner = Deno.env.get("CALU_API_OWNER_ID") ?? "";

  if (!apiKey || !owner) {
    return fail(
      "API não configurada. Defina os secrets CALU_API_KEY (a chave de acesso) " +
      "e CALU_API_OWNER_ID (o auth uid da dona da agência) no Supabase.",
      503,
    );
  }

  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!bearer || !chavesBatem(bearer, apiKey)) return fail("Unauthorized", 401);

  let corpo: Record<string, unknown> = {};
  try { corpo = await req.json(); } catch { return fail("Corpo JSON inválido", 400); }
  const action = String(corpo.action ?? "");
  if (!action) return fail("Informe 'action'. GET nesta URL lista as ações.", 400);

  const sb = createClient(supabaseUrl, serviceKey);
  const str = (v: unknown) => (v == null ? "" : String(v));

  try {
    switch (action) {
      case "health":
        return ok({ version: VERSION, owner, time: new Date().toISOString() });

      case "clients.list": {
        const limit = Math.min(Number(corpo.limit ?? 200) || 200, 500);
        const { data, error } = await sb
          .from("clients")
          .select("id, workspace_id, name, segment, status, portal_token, created_at")
          .eq("user_id", owner)
          .order("created_at", { ascending: true })
          .limit(limit);
        if (error) throw new Error(error.message);
        return ok({ clients: data ?? [], count: (data ?? []).length });
      }

      case "clients.get": {
        const workspace_id = str(corpo.workspace_id);
        if (!workspace_id) return fail("workspace_id obrigatório");
        const { data, error } = await sb
          .from("clients")
          .select("id, workspace_id, name, segment, status, portal_token, created_at")
          .eq("user_id", owner).eq("workspace_id", workspace_id)
          .order("created_at", { ascending: true }).maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return fail("Cliente não encontrado", 404);
        return ok({ client: data });
      }

      case "clients.upsert": {
        const workspace_id = str(corpo.workspace_id);
        const name = str(corpo.name);
        if (!workspace_id || !name) return fail("workspace_id e name obrigatórios");
        const id = await garantirCliente(sb, owner, {
          workspace_id, name,
          segment: corpo.segment == null ? null : str(corpo.segment),
          status: str(corpo.status),
        });
        return ok({ id, workspace_id });
      }

      case "agents.activate": {
        if (corpo.all === true) {
          const { data: clientes, error } = await sb
            .from("clients").select("workspace_id, name")
            .eq("user_id", owner).not("workspace_id", "is", null);
          if (error) throw new Error(error.message);
          const alvos = (clientes ?? []).filter((c) => c.workspace_id);
          const resultados: unknown[] = [];
          for (const c of alvos) {
            try {
              const criadas = await ativarCliente(sb, owner, c.workspace_id as string);
              resultados.push({ workspace_id: c.workspace_id, name: c.name, ok: true, criadas });
            } catch (e) {
              resultados.push({
                workspace_id: c.workspace_id, name: c.name, ok: false,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }
          return ok({ total: alvos.length, resultados });
        }
        const workspace_id = str(corpo.workspace_id);
        if (!workspace_id) return fail("workspace_id obrigatório (ou passe all:true)");
        // Se veio nome, garante a linha antes de ligar (cliente novo via API).
        if (corpo.name) {
          await garantirCliente(sb, owner, {
            workspace_id, name: str(corpo.name),
            segment: corpo.segment == null ? null : str(corpo.segment),
            status: str(corpo.status),
          });
        }
        const criadas = await ativarCliente(sb, owner, workspace_id);
        return ok({ workspace_id, criadas });
      }

      case "routines.list": {
        const workspace_id = str(corpo.workspace_id);
        if (!workspace_id) return fail("workspace_id obrigatório");
        const { data, error } = await sb
          .from("client_routines")
          .select("rotina, dias_semana, hora, ativo, config, last_run_at, last_status, last_error")
          .eq("user_id", owner).eq("client_id", workspace_id);
        if (error) throw new Error(error.message);
        return ok({ routines: data ?? [] });
      }

      case "routines.set": {
        const workspace_id = str(corpo.workspace_id);
        const rotina = str(corpo.rotina);
        if (!workspace_id || !rotina) return fail("workspace_id e rotina obrigatórios");
        const dias = Array.isArray(corpo.dias_semana) ? (corpo.dias_semana as number[]) : [1, 3, 5];
        const hora = /^\d{2}:\d{2}$/.test(str(corpo.hora)) ? str(corpo.hora) : "09:00";
        const ativo = corpo.ativo !== false;
        const { error } = await sb.from("client_routines").upsert({
          user_id: owner, client_id: workspace_id, rotina,
          dias_semana: dias, hora, ativo, updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,client_id,rotina" });
        if (error) throw new Error(error.message);
        return ok({ workspace_id, rotina, ativo, dias_semana: dias, hora });
      }

      case "routine.run": {
        const forcar = corpo.forcar === true;
        const body: Record<string, unknown> = { forcar };
        if (corpo.workspace_id) body.cliente = str(corpo.workspace_id);
        if (corpo.rotina) body.rotina = str(corpo.rotina);
        const r = await chamarFuncao(supabaseUrl, serviceKey, "rotina-agentes", body);
        if (r.status >= 400) return fail(`rotina-agentes ${r.status}: ${JSON.stringify(r.dados).slice(0, 300)}`, 502);
        return ok({ resultado: r.dados });
      }

      case "deliverables.list": {
        const workspace_id = str(corpo.workspace_id);
        if (!workspace_id) return fail("workspace_id obrigatório");
        const limit = Math.min(Number(corpo.limit ?? 50) || 50, 200);
        const { data, error } = await sb
          .from("client_deliverables")
          .select("id, category, title, description, status, done_at, visible_to_client, created_at")
          .eq("client_id", workspace_id)
          .order("created_at", { ascending: false }).limit(limit);
        if (error) throw new Error(error.message);
        return ok({ deliverables: data ?? [] });
      }

      case "deliverables.create": {
        const workspace_id = str(corpo.workspace_id);
        const title = str(corpo.title);
        if (!workspace_id || !title) return fail("workspace_id e title obrigatórios");
        const { data, error } = await sb.from("client_deliverables").insert({
          client_id: workspace_id,
          category: str(corpo.category) || "Geral",
          title,
          description: str(corpo.description).slice(0, 12000),
          status: "concluído",
          done_at: new Date().toISOString(),
          visible_to_client: corpo.visible_to_client !== false,
        }).select("id").single();
        if (error) throw new Error(error.message);
        return ok({ id: data!.id, workspace_id });
      }

      case "proposals.list": {
        let q = sb.from("agent_proposals")
          .select("id, client_id, agent_name, kind, title, titulo, descricao, scheduled_for, status, created_at")
          .eq("user_id", owner)
          .order("created_at", { ascending: false }).limit(200);
        if (corpo.workspace_id) q = q.eq("client_id", str(corpo.workspace_id));
        q = q.eq("status", corpo.status ? str(corpo.status) : "pending");
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return ok({ proposals: data ?? [] });
      }

      case "proposals.decide": {
        const id = str(corpo.id);
        const decision = str(corpo.decision);
        if (!id) return fail("id obrigatório");
        if (decision !== "approved" && decision !== "rejected") {
          return fail("decision deve ser 'approved' ou 'rejected'");
        }
        const { error } = await sb.from("agent_proposals")
          .update({ status: decision }).eq("id", id).eq("user_id", owner);
        if (error) throw new Error(error.message);
        return ok({ id, status: decision });
      }

      default:
        return fail(`Ação desconhecida: ${action}. GET nesta URL lista as ações.`, 400);
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e), 500);
  }
});
