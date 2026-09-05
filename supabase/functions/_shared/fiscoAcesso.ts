/**
 * Portão de entrada do Fisco: quem é a pessoa, e ela ainda pode gastar IA?
 *
 * As duas funções do Fisco eram abertas — `verify_jwt=false` e nenhuma
 * conferência de quem chamava. Como a chave publicável está no código do site,
 * qualquer pessoa podia gastar o crédito da Anthropic sem nem passar pelo
 * convite. Este módulo é o único lugar que decide isso, para as duas.
 *
 * Regra:
 * - com `token` de link  → precisa de sessão registrada naquele link e cota;
 * - sem `token`          → é uso interno da agência: exige admin ou dono de link.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

export interface Cota {
  plano?: string;
  plano_rotulo?: string;
  expira_em?: string | null;
  expirado?: boolean;
  chat_restante?: number | null;
  diag_restante?: number | null;
  diag_total_restante?: number | null;
  pode_chat?: boolean;
  pode_diag?: boolean;
  erro?: string;
}

export interface Acesso {
  userId: string;
  token: string | null;
  cota: Cota | null;
}

/** Mensagens que a pessoa lê na tela — sem jargão de banco. */
const RECUSA: Record<string, string> = {
  sem_usuario: "Faça login para continuar.",
  nao_encontrado: "Este link não existe mais ou foi desativado.",
  sem_acesso: "Seu acesso a este link ainda não foi liberado.",
  bloqueado: "Seu acesso a este link foi encerrado.",
};

async function rpc(nome: string, args: Record<string, unknown>) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nome}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`${nome}: ${r.status} ${await r.text()}`);
  return await r.json().catch(() => null);
}

/**
 * Confere sessão e cota. Devolve `{ acesso }` quando pode seguir, ou
 * `{ recusa }` com a resposta pronta para devolver ao cliente.
 */
export async function conferirAcesso(
  req: Request,
  token: string | null,
  tipo: "chat" | "diagnostico",
  cors: Record<string, string>,
): Promise<{ acesso?: Acesso; recusa?: Response }> {
  const json = (status: number, corpo: unknown) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  const auth = req.headers.get("Authorization") ?? "";
  const jwt = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  // A chave publicável também é um "Bearer", e é pública: aceitá-la seria o
  // mesmo que não ter portão nenhum.
  if (!jwt || jwt === ANON_KEY) {
    return { recusa: json(401, { error: "Faça login para usar o Fisco." }) };
  }

  const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${jwt}` },
  });
  if (!u.ok) return { recusa: json(401, { error: "Sessão expirada. Entre de novo." }) };
  const user = await u.json();
  const userId: string = user?.id;
  if (!userId) return { recusa: json(401, { error: "Sessão inválida." }) };

  // Uso interno da agência (a tela do Fisco dentro do workspace, sem link).
  if (!token) {
    const dono = await fetch(
      `${SUPABASE_URL}/rest/v1/agent_links?user_id=eq.${userId}&select=id&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    ).then((r) => r.json()).catch(() => []);
    const admin = await rpc("has_role", { _user_id: userId, _role: "admin" }).catch(() => false);
    if (admin === true || (Array.isArray(dono) && dono.length > 0)) {
      return { acesso: { userId, token: null, cota: null } };
    }
    return { recusa: json(403, { error: "Este acesso é da equipe da agência." }) };
  }

  const cota = (await rpc("fisco_cota", { p_token: token, p_user: userId })) as Cota;
  if (cota?.erro) {
    return { recusa: json(403, { error: RECUSA[cota.erro] ?? "Acesso não liberado." }) };
  }

  if (cota?.expirado) {
    return {
      recusa: json(402, {
        error:
          "Seu período de teste terminou. Fale com a Calu Agência para continuar usando o Fisco.",
        cota,
      }),
    };
  }

  const pode = tipo === "chat" ? cota?.pode_chat : cota?.pode_diag;
  if (!pode) {
    return {
      recusa: json(429, {
        error:
          tipo === "chat"
            ? "Você atingiu o limite de mensagens de hoje. Amanhã ele volta ao normal."
            : cota?.diag_total_restante === 0
              ? "Você usou todos os diagnósticos do seu período de teste. Fale com a Calu Agência para liberar mais."
              : "Você atingiu o limite de diagnósticos de hoje. Amanhã ele volta ao normal.",
        cota,
      }),
    };
  }

  return { acesso: { userId, token, cota } };
}

/** Grava o consumo. Nunca derruba a resposta: medir não pode quebrar o produto. */
export async function registrarUso(
  acesso: Acesso,
  tipo: "chat" | "diagnostico",
  modelo: string,
  tokensIn: number,
  tokensOut: number,
): Promise<void> {
  try {
    await rpc("fisco_registrar_uso", {
      p_user: acesso.userId,
      p_token: acesso.token,
      p_tipo: tipo,
      p_modelo: modelo,
      p_tokens_in: tokensIn,
      p_tokens_out: tokensOut,
    });
  } catch (e) {
    console.error("fisco: falhou ao registrar uso", String(e));
  }
}
