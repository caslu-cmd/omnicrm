import { createContext, useContext, useState, ReactNode } from "react";
import { CLIENTS, Client, AgentTask } from "@/data/agencyData";

type ClientEdit = {
  name?: string;
  industry?: string;
  status?: "Ativo" | "Onboarding" | "Em pausa";
  revenue?: string;
  nextAction?: string;
  portalPin?: string;
  followers?: { instagram?: string; facebook?: string };
  siteUrl?: string;
  teamInstructions?: string;
  contacts?: Client["contacts"];
  pipeline?: Client["pipeline"];
  recentPosts?: Client["recentPosts"];
  activeCampaigns?: Client["activeCampaigns"];
  agentFeed?: Client["agentFeed"];
  outputs?: Client["outputs"];
  collabCampaigns?: Client["collabCampaigns"];
  courses?: Client["courses"];
  whatsappLeads?: Client["whatsappLeads"];
  metrics?: Client["metrics"];
  weeklyContent?: Client["weeklyContent"];
  orchestratorPlan?: Client["orchestratorPlan"];
  orchestratorStatus?: string;
  agentTasks?: Client["agentTasks"];
};

type AllEdits = Record<string, ClientEdit>;

interface ClientsContextType {
  clients: Client[];
  updateClient: (id: string, edits: ClientEdit) => void;
  addClient: (data: { name: string; industry: string; status: "Ativo" | "Onboarding" | "Em pausa"; revenue: string; color: string }) => string;
  deleteClient: (id: string) => void;
  clearClientData: (id: string) => void;
}

const ClientsContext = createContext<ClientsContextType | null>(null);

function slugify(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function randomPin(name: string) {
  return (name.slice(0, 2).toUpperCase() + Math.floor(1000 + Math.random() * 9000));
}

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [extraClients, setExtraClients] = useState<Client[]>(() => {
    try { return JSON.parse(localStorage.getItem("extra-clients") ?? "[]") as Client[]; }
    catch { return []; }
  });

  const staticIds = CLIENTS.map((c) => c.id);
  const [deletedIds, setDeletedIds] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("deleted-clients") ?? "[]") as string[];
      return saved.filter((id) => !staticIds.includes(id));
    }
    catch { return []; }
  });

  const [allEdits, setAllEdits] = useState<AllEdits>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("client-edits") ?? "{}") as AllEdits;
      CLIENTS.forEach((c) => {
        const old = localStorage.getItem(`client-${c.id}`);
        if (old && !saved[c.id]) {
          try { saved[c.id] = JSON.parse(old); } catch {}
        }
      });
      return saved;
    } catch { return {}; }
  });

  const addClient = (data: { name: string; industry: string; status: "Ativo" | "Onboarding" | "Em pausa"; revenue: string; color: string }): string => {
    const id = slugify(data.name) || `cliente-${Date.now()}`;

    const agentTaskTemplate = (role: string): AgentTask => ({
      current: `Aguardando briefing de ${data.name}`,
      status: "aguardando",
      recent: [`Workspace de ${data.name} criado`, `Aguardando instruções de ${role}`],
      progress: 0,
    });

    const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex"];
    const weekDates = ["01", "02", "03", "04", "05"];

    const newClient: Client = {
      id,
      name: data.name,
      industry: data.industry || "Não definido",
      color: data.color,
      initials: initials(data.name),
      status: data.status,
      agentActive: false,
      postsMonth: 0,
      campaigns: 0,
      lastActivity: "agora",
      revenue: data.revenue || "R$ 0",
      nextAction: "Coletar briefing e definir estratégia",
      followers: { instagram: "—", facebook: "—" },
      recentPosts: [],
      activeCampaigns: [],
      agentFeed: [
        { id: "1", action: "Workspace criado", detail: `Conta de ${data.name} configurada na plataforma`, time: "agora", type: "report" },
        { id: "2", action: "Time designado", detail: "Beatriz, Marina, Rafaela e Lucas prontos para começar", time: "agora", type: "content" },
      ],
      weeklyContent: weekDays.map((day, i) => ({
        day,
        date: weekDates[i],
        posts: [],
      })),
      metrics: [
        { label: "Alcance",      value: "—", change: "Conecte as redes", positive: true },
        { label: "Engajamento",  value: "—", change: "Conecte as redes", positive: true },
        { label: "Leads",        value: "0", change: "Nenhum ainda",      positive: true },
        { label: "Conversão",    value: "—", change: "Sem campanhas",     positive: true },
      ],
      contacts: [],
      pipeline: [],
      agentTasks: {
        copywriter: agentTaskTemplate("Copywriter"),
        traffic:    agentTaskTemplate("Tráfego"),
        analyst:    agentTaskTemplate("Analista"),
        social:     agentTaskTemplate("Social Media"),
        strategist: agentTaskTemplate("Estrategista"),
        sales:      agentTaskTemplate("Vendas"),
        designer:   agentTaskTemplate("Designer"),
        site:       agentTaskTemplate("Editor de Site"),
        briefing:   agentTaskTemplate("Diagnóstico"),
        revisor:    agentTaskTemplate("Revisora"),
      },
      orchestratorStatus: "idle",
      orchestratorPlan: [
        { step: "Coletar briefing completo do cliente",    done: false, active: true },
        { step: "Definir posicionamento e pauta editorial", done: false },
        { step: "Criar primeiros conteúdos",               done: false },
        { step: "Configurar campanhas de tráfego",         done: false },
        { step: "Conectar redes sociais e automatizar",    done: false },
        { step: "Entregar relatório do primeiro mês",      done: false },
      ],
      portalPin: randomPin(data.name),
      outputs: [],
    };
    const updated = [...extraClients, newClient];
    setExtraClients(updated);
    localStorage.setItem("extra-clients", JSON.stringify(updated));
    return id;
  };

  const deleteClient = (id: string) => {
    const updatedExtra = extraClients.filter((c) => c.id !== id);
    setExtraClients(updatedExtra);
    localStorage.setItem("extra-clients", JSON.stringify(updatedExtra));

    const newDeleted = [...deletedIds.filter((d) => d !== id), id];
    setDeletedIds(newDeleted);
    localStorage.setItem("deleted-clients", JSON.stringify(newDeleted));

    const newEdits = { ...allEdits };
    delete newEdits[id];
    setAllEdits(newEdits);
    localStorage.setItem("client-edits", JSON.stringify(newEdits));
  };

  const clearClientData = (id: string) => {
    const base = allEdits[id] ?? {};
    const cleared: ClientEdit = {
      ...base,
      contacts: [],
      pipeline: [],
      recentPosts: [],
      activeCampaigns: [],
      agentFeed: [],
      outputs: [],
      collabCampaigns: [],
      courses: undefined,
      whatsappLeads: undefined,
      metrics: [
        { label: "Alcance",      value: "—", change: "—", positive: true },
        { label: "Engajamento",  value: "—", change: "—", positive: true },
        { label: "Leads",        value: "—", change: "—", positive: true },
        { label: "Conversão",    value: "—", change: "—", positive: true },
      ],
      orchestratorPlan: [],
      orchestratorStatus: "",
      weeklyContent: [
        { day: "Seg", date: "", posts: [] },
        { day: "Ter", date: "", posts: [] },
        { day: "Qua", date: "", posts: [] },
        { day: "Qui", date: "", posts: [] },
        { day: "Sex", date: "", posts: [] },
        { day: "Sáb", date: "", posts: [] },
        { day: "Dom", date: "", posts: [] },
      ],
    };
    const newEdits = { ...allEdits, [id]: cleared };
    setAllEdits(newEdits);
    localStorage.setItem("client-edits", JSON.stringify(newEdits));
  };

  const allClients = [...CLIENTS, ...extraClients];

  const clients: Client[] = allClients
    .filter((c) => !deletedIds.includes(c.id))
    .map((c) => {
      const edit = allEdits[c.id];
      if (!edit) return c;
      return {
        ...c,
        ...edit,
        followers: {
          instagram: edit.followers?.instagram ?? c.followers.instagram,
          facebook: edit.followers?.facebook ?? c.followers.facebook,
        },
      };
    });

  const updateClient = (id: string, edits: ClientEdit) => {
    const newAllEdits: AllEdits = {
      ...allEdits,
      [id]: { ...(allEdits[id] ?? {}), ...edits },
    };
    setAllEdits(newAllEdits);
    localStorage.setItem("client-edits", JSON.stringify(newAllEdits));
  };

  return (
    <ClientsContext.Provider value={{ clients, updateClient, addClient, deleteClient, clearClientData }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within ClientsProvider");
  return ctx;
}
