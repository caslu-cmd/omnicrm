import { supabase } from "@/integrations/supabase/client";

/**
 * Liga os agentes autônomos para os clientes da agência, em lote.
 *
 * O painel (`/agency`) lista clientes que vivem no navegador + estado geral.
 * Quem faz o time trabalhar sozinho é a edge function `rotina-agentes` (cron
 * a cada 15 min), que só age em clientes com:
 *   1) uma linha em `clients` com `workspace_id` = slug do cliente (para achar
 *      nome/segmento e ter portal), e
 *   2) rotinas ligadas em `client_routines`.
 *
 * Até aqui isso era feito cliente por cliente, dentro do workspace. Este módulo
 * faz o mesmo para TODOS de uma vez, reaproveitando exatamente as mesmas
 * colunas e o mesmo `onConflict` do workspace — nada de schema novo.
 *
 * Modo de operação: **fila de aprovação**. As rotinas entram SEM `auto_aprovar`,
 * então o calendário cai em `agent_proposals` (a Carol libera o que vai ao ar)
 * e as demais só geram entregas visíveis no portal. Nada é publicado nas redes
 * sem um OK.
 */

export type AgencyClientLike = {
  /** slug do workspace (Client.id no painel) */
  id: string;
  name: string;
  industry: string;
  status: "Ativo" | "Onboarding" | "Em pausa";
};

export type RoutineDefault = {
  rotina: string;
  /** 0 = domingo … 6 = sábado */
  dias_semana: number[];
  /** "HH:MM", horário de Fortaleza (o cron converte) */
  hora: string;
};

/**
 * Conjunto padrão que "liga o time". Horários espalhados na semana para não
 * disparar tudo no mesmo minuto e para caber no orçamento de IA.
 */
export const DEFAULT_ROUTINES: RoutineDefault[] = [
  { rotina: "pauta",      dias_semana: [1], hora: "09:00" }, // seg — ideias da semana
  { rotina: "calendario", dias_semana: [1], hora: "09:30" }, // seg — plano da semana (vai p/ aprovação)
  { rotina: "carrossel",  dias_semana: [3], hora: "10:00" }, // qua — rascunho de conteúdo na biblioteca
  { rotina: "relatorio",  dias_semana: [5], hora: "17:00" }, // sex — números reais do período
];

/**
 * Puro e testável: dadas as rotinas que o cliente JÁ tem, devolve só as que
 * faltam. Preserva qualquer rotina que a Carol já configurou à mão — este lote
 * nunca sobrescreve dias/hora/estado de uma rotina existente.
 */
export function routinesToCreate(
  existing: { rotina: string }[],
  defaults: RoutineDefault[] = DEFAULT_ROUTINES,
): RoutineDefault[] {
  const have = new Set(existing.map((r) => r.rotina));
  return defaults.filter((d) => !have.has(d.rotina));
}

/** Mesma tradução de status usada no resto do app (Ativo → active, senão onboarding). */
export function dbStatusFor(status: AgencyClientLike["status"]): string {
  return status === "Ativo" ? "active" : "onboarding";
}

/**
 * Garante a linha canônica em `clients` para este workspace. Mesma estratégia
 * do workspace e do sidebar: acha por `workspace_id`; senão por nome (linhas
 * antigas sem `workspace_id`, faz o backfill); senão cria.
 */
async function ensureClientRow(userId: string, client: AgencyClientLike): Promise<void> {
  const sb = supabase as any;

  const { data: byWs } = await sb
    .from("clients")
    .select("id, workspace_id")
    .eq("user_id", userId)
    .eq("workspace_id", client.id)
    .order("created_at", { ascending: true });
  if (byWs && byWs.length > 0) return;

  const { data: byName } = await sb
    .from("clients")
    .select("id, workspace_id")
    .eq("user_id", userId)
    .eq("name", client.name)
    .order("created_at", { ascending: true });
  if (byName && byName.length > 0) {
    const row = byName[0];
    if (!row.workspace_id) {
      await sb.from("clients").update({ workspace_id: client.id }).eq("id", row.id);
    }
    return;
  }

  const { error } = await sb.from("clients").insert({
    user_id: userId,
    name: client.name,
    segment: client.industry ?? null,
    status: dbStatusFor(client.status),
    workspace_id: client.id,
  });
  if (error) throw new Error(error.message);
}

export type ActivateResult = {
  clientId: string;
  name: string;
  ok: boolean;
  /** quantas rotinas novas foram ligadas (0 = já estava tudo ligado) */
  created: number;
  error?: string;
};

/** Liga os agentes para um cliente: garante a linha no banco + rotinas que faltam. */
export async function activateAgentsForClient(
  userId: string,
  client: AgencyClientLike,
): Promise<ActivateResult> {
  try {
    await ensureClientRow(userId, client);

    const sb = supabase as any;
    const { data: existing } = await sb
      .from("client_routines")
      .select("rotina")
      .eq("user_id", userId)
      .eq("client_id", client.id);

    const toCreate = routinesToCreate((existing ?? []) as { rotina: string }[]);

    if (toCreate.length > 0) {
      const now = new Date().toISOString();
      const { error } = await sb.from("client_routines").upsert(
        toCreate.map((r) => ({
          user_id: userId,
          client_id: client.id,
          rotina: r.rotina,
          dias_semana: r.dias_semana,
          hora: r.hora,
          ativo: true,
          updated_at: now,
        })),
        { onConflict: "user_id,client_id,rotina" },
      );
      if (error) throw new Error(error.message);
    }

    return { clientId: client.id, name: client.name, ok: true, created: toCreate.length };
  } catch (e) {
    return {
      clientId: client.id,
      name: client.name,
      ok: false,
      created: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Liga os agentes para todos os clientes, um a um, reportando o progresso. */
export async function activateAgentsForAllClients(
  userId: string,
  clients: AgencyClientLike[],
  onProgress?: (done: number, total: number, result: ActivateResult) => void,
): Promise<ActivateResult[]> {
  const results: ActivateResult[] = [];
  for (const c of clients) {
    const r = await activateAgentsForClient(userId, c);
    results.push(r);
    onProgress?.(results.length, clients.length, r);
  }
  return results;
}
