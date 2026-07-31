import { supabase } from "@/integrations/supabase/client";

/**
 * Clientes salvos do Fisco.
 *
 * Sem isso, quem usa o Fisco redigita regime, faturamento, folha e município a
 * cada conversa. Aqui o conjunto de respostas vira um "cliente" com nome, que
 * pode ser escolhido de novo e serve de contexto tanto no diagnóstico quanto no
 * chat.
 *
 * **É por usuário.** Com sessão, fica na tabela `fisco_clientes` (RLS por
 * `user_id`), então a lista acompanha a pessoa em qualquer aparelho e ninguém
 * vê a lista de ninguém. Sem sessão, cai no navegador — é o caso de quem abre a
 * tela da agência sem estar logado.
 */

export type PerfilCliente = "pessoa" | "empresa" | "contabilidade";

export interface ClienteFisco {
  id: string;
  nome: string;
  perfil: PerfilCliente;
  respostas: Record<string, string>;
  atualizado_em: string;
}

const CHAVE = "fisco-clientes";

// ── Navegador (usado sem sessão, e como espelho local) ───────────────────────

function lerLocal(): ClienteFisco[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const lista = JSON.parse(bruto) as ClienteFisco[];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function gravarLocal(lista: ClienteFisco[]) {
  localStorage.setItem(CHAVE, JSON.stringify(lista));
}

/** Leitura síncrona para a primeira pintura da tela. */
export function listarClientesLocal(): ClienteFisco[] {
  return lerLocal();
}

// ── Banco (por usuário) ──────────────────────────────────────────────────────

async function temSessao(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

function daLinha(l: Record<string, unknown>): ClienteFisco {
  return {
    id: String(l.id),
    nome: String(l.nome),
    perfil: l.perfil as PerfilCliente,
    respostas: (l.respostas ?? {}) as Record<string, string>,
    atualizado_em: String(l.atualizado_em),
  };
}

export async function listarClientes(): Promise<ClienteFisco[]> {
  if (!(await temSessao())) return lerLocal();

  const { data, error } = await (supabase as any)
    .from("fisco_clientes")
    .select("id, nome, perfil, respostas, atualizado_em")
    .order("atualizado_em", { ascending: false });

  if (error || !data) return lerLocal();

  const lista = (data as Record<string, unknown>[]).map(daLinha);

  // Primeira vez com conta: o que estava no navegador sobe, para não sumir.
  const local = lerLocal();
  if (local.length && !lista.length) {
    for (const c of local) await salvarCliente(c.nome, c.perfil, c.respostas);
    localStorage.removeItem(CHAVE);
    return listarClientes();
  }

  gravarLocal(lista);
  return lista;
}

/** Mesmo nome e mesmo perfil sobrescreve, em vez de duplicar o cliente. */
export async function salvarCliente(
  nome: string,
  perfil: PerfilCliente,
  respostas: Record<string, string>,
): Promise<ClienteFisco[]> {
  const limpo = nome.trim();
  if (!limpo) return listarClientes();

  if (await temSessao()) {
    const { data: sessao } = await supabase.auth.getSession();
    await (supabase as any)
      .from("fisco_clientes")
      .upsert(
        {
          user_id: sessao.session?.user.id,
          nome: limpo,
          perfil,
          respostas,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "user_id,nome,perfil" },
      );
    return listarClientes();
  }

  const lista = lerLocal();
  const existente = lista.find(
    (c) => c.nome.toLowerCase() === limpo.toLowerCase() && c.perfil === perfil,
  );
  const registro: ClienteFisco = {
    id: existente?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nome: limpo,
    perfil,
    respostas,
    atualizado_em: new Date().toISOString(),
  };
  const nova = existente
    ? lista.map((c) => (c.id === existente.id ? registro : c))
    : [registro, ...lista];
  gravarLocal(nova);
  return nova;
}

export async function removerCliente(id: string): Promise<ClienteFisco[]> {
  if (await temSessao()) {
    await (supabase as any).from("fisco_clientes").delete().eq("id", id);
    return listarClientes();
  }
  const nova = lerLocal().filter((c) => c.id !== id);
  gravarLocal(nova);
  return nova;
}

/**
 * O que o agente precisa saber sobre o cliente, em texto corrido — vai para o
 * system prompt do chat. Pergunta sem resposta não entra.
 */
export function contextoDoCliente(c: ClienteFisco, rotulos: Record<string, string>): string {
  const linhas = Object.entries(c.respostas)
    .filter(([, v]) => String(v ?? "").trim())
    .map(([k, v]) => `- ${rotulos[k] ?? k}: ${v}`);
  if (!linhas.length) return `Cliente: ${c.nome}.`;
  return `Cliente: ${c.nome}\n${linhas.join("\n")}`;
}
