/**
 * Clientes salvos do Fisco.
 *
 * Sem isso, quem usa o Fisco redigita regime, faturamento, folha e município a
 * cada conversa. Aqui o conjunto de respostas vira um "cliente" com nome, que
 * pode ser escolhido de novo e serve de contexto tanto no diagnóstico quanto no
 * chat.
 *
 * Fica no NAVEGADOR de propósito: são dados fiscais de terceiros e o link é
 * usado por quem não tem conta na plataforma. Nada disso sobe para o servidor.
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

export function listarClientes(): ClienteFisco[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const lista = JSON.parse(bruto) as ClienteFisco[];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function gravar(lista: ClienteFisco[]) {
  localStorage.setItem(CHAVE, JSON.stringify(lista));
}

/** Mesmo nome e mesmo perfil sobrescreve, em vez de duplicar o cliente. */
export function salvarCliente(
  nome: string,
  perfil: PerfilCliente,
  respostas: Record<string, string>,
): ClienteFisco[] {
  const limpo = nome.trim();
  if (!limpo) return listarClientes();

  const lista = listarClientes();
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
  gravar(nova);
  return nova;
}

export function removerCliente(id: string): ClienteFisco[] {
  const nova = listarClientes().filter((c) => c.id !== id);
  gravar(nova);
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
