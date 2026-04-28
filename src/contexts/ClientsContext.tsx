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
};

type AllEdits = Record<string, ClientEdit>;

interface ClientsContextType {
  clients: Client[];
  updateClient: (id: string, edits: ClientEdit) => void;
}

const ClientsContext = createContext<ClientsContextType | null>(null);

export function ClientsProvider({ children }: { children: ReactNode }) {
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

  const clients: Client[] = CLIENTS.map((c) => {
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
    <ClientsContext.Provider value={{ clients, updateClient }}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const ctx = useContext(ClientsContext);
  if (!ctx) throw new Error("useClients must be used within ClientsProvider");
  return ctx;
}
