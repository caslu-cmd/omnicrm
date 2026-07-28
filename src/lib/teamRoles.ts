// Papéis de quem a agência convida para o portal de um cliente.
//
// Até aqui o papel era só um rótulo: "comercial" e "financeiro" enxergavam
// exatamente as mesmas telas. Esta matriz é a fonte única de verdade sobre o
// que cada pessoa convidada vê — usada tanto na tela de convite quanto no
// portal em si.

export type TeamTab = "funil" | "inbox" | "contatos" | "captacao";

export type TeamRole = {
  id: string;
  label: string;
  desc: string;
  color: string;
  tabs: TeamTab[];
};

export const TEAM_ROLES: TeamRole[] = [
  {
    id: "gestor",
    label: "Gestor",
    desc: "Vê e opera tudo do cliente: funil, conversas, contatos e captação",
    color: "#B9FF4B",
    tabs: ["funil", "inbox", "contatos", "captacao"],
  },
  {
    id: "comercial",
    label: "Comercial",
    desc: "Trabalha os leads: funil, contatos e conversas",
    color: "#60A5FA",
    tabs: ["funil", "contatos", "inbox"],
  },
  {
    id: "atendimento",
    label: "Atendimento",
    desc: "Só responde as conversas que chegam pelos canais",
    color: "#FBBF24",
    tabs: ["inbox", "contatos"],
  },
];

// Papéis antigos continuam funcionando: "financeiro" virou gestor.
const APELIDOS: Record<string, string> = { financeiro: "gestor" };

export function papelDoMembro(role: string | null | undefined): TeamRole {
  const id = APELIDOS[role ?? ""] ?? role ?? "";
  return TEAM_ROLES.find((r) => r.id === id) ?? TEAM_ROLES[1]; // comercial é o padrão
}

export function podeVer(role: string | null | undefined, tab: TeamTab): boolean {
  return papelDoMembro(role).tabs.includes(tab);
}
