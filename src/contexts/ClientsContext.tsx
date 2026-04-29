import { createContext, useContext, useState, ReactNode } from "react";
import { CLIENTS, Client } from "@/data/agencyData";

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
};

type AllEdits = Record<string, ClientEdit>;

interface ClientsContextType {
  clients: Client[];
  updateClient: (id: string, edits: ClientEdit) => void;
  addClient: (data: { name: string; industry: string; status: "Ativo" | "Onboarding" | "Em pausa"; revenue: string; color: string }) => string;
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

  const [allEdits, setAllEdits] = useState<AllEdits>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("client-edits") ?? "{}") as AllEdits;
      // migrate old per-client keys
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
    const newClient: Client = {
      id,
      name: data.name,
      industry: data.industry,
      color: data.color,
      initials: initials(data.name),
      status: data.status,
      agentActive: false,
      postsMonth: 0,
      campaigns: 0,
      lastActivity: "agora",
      revenue: data.revenue || "R$ 0",
      nextAction: "Definir estratégia inicial",
      followers: { instagram: "0", facebook: "0" },
      recentPosts: [],
      activeCampaigns: [],
      agentFeed: [],
      weeklyContent: [],
      metrics: [],
      contacts: [],
      pipeline: [],
      agentTasks: {},
      orchestratorStatus: "idle",
      orchestratorPlan: [],
      portalPin: randomPin(data.name),
      outputs: [],
    };
    const updated = [...extraClients, newClient];
    setExtraClients(updated);
    localStorage.setItem("extra-clients", JSON.stringify(updated));
    return id;
  };

  const allClients = [...CLIENTS, ...extraClients];

  const clients: Client[] = allClients.map((c) => {
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
    <ClientsContext.Provider value={{ clients, updateClient, addClient }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within ClientsProvider");
  return ctx;
}
