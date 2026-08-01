import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  siteRepo?: string;
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

  /**
   * O mesmo estado, agora também no banco.
   *
   * Isto vivia SÓ no localStorage: site do cliente, repositório, instruções
   * para o time, contatos, métricas, clientes criados por ela. Abrindo de outra
   * máquina, sumia — o mesmo problema que já mordeu no briefing e na cor da
   * marca. O localStorage continua sendo escrito porque é instantâneo e
   * funciona sem rede; o banco é a fonte durável.
   */
  const gravarNoBanco = (chave: string, valor: unknown) => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // deslogada: o localStorage sozinho já segura
      await (supabase as any).from("agencia_estado").upsert(
        { user_id: session.user.id, chave, valor, updated_at: new Date().toISOString() },
        { onConflict: "user_id,chave" },
      );
    })();
  };

  /**
   * Puxa o estado do banco uma vez por sessão. Se o banco estiver vazio e esta
   * máquina tiver dados, SOBE o que existe aqui — é a migração de quem já usava
   * antes, sem ela precisar refazer nada.
   */
  // Guarda em ref, não em estado: como o efeito ALTERA os estados que leria como
  // dependência, listá-los criaria um laço. Roda uma vez, e os valores iniciais
  // já são os do localStorage — que é exatamente o que queremos subir.
  const estadoCarregado = useRef(false);
  useEffect(() => {
    if (estadoCarregado.current) return;
    estadoCarregado.current = true;
    let vivo = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await (supabase as any)
        .from("agencia_estado").select("chave, valor").eq("user_id", session.user.id);
      if (!vivo) return;
      const doBanco = new Map(((data ?? []) as { chave: string; valor: unknown }[]).map((r) => [r.chave, r.valor]));

      const aplica = <T,>(chave: string, atual: T, set: (v: T) => void) => {
        const v = doBanco.get(chave) as T | undefined;
        const temAlgo = (x: unknown) => Array.isArray(x) ? x.length > 0 : !!x && Object.keys(x as object).length > 0;
        if (temAlgo(v)) set(v as T);
        else if (temAlgo(atual)) gravarNoBanco(chave, atual); // primeira subida
      };

      aplica("client-edits", allEdits, setAllEdits);
      aplica("extra-clients", extraClients, setExtraClients);
      aplica("deleted-clients", deletedIds, setDeletedIds);
    })();
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        calendario: agentTaskTemplate("Calendário Editorial"),
        video:      agentTaskTemplate("Editor de Vídeo"),
        tomas:      agentTaskTemplate("Criador de Landing Pages"),
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
    localStorage.setItem("extra-clients", JSON.stringify(updated)); gravarNoBanco("extra-clients", updated);
    return id;
  };

  const deleteClient = (id: string) => {
    const updatedExtra = extraClients.filter((c) => c.id !== id);
    setExtraClients(updatedExtra);
    localStorage.setItem("extra-clients", JSON.stringify(updatedExtra)); gravarNoBanco("extra-clients", updatedExtra);

    const newDeleted = [...deletedIds.filter((d) => d !== id), id];
    setDeletedIds(newDeleted);
    localStorage.setItem("deleted-clients", JSON.stringify(newDeleted)); gravarNoBanco("deleted-clients", newDeleted);

    const newEdits = { ...allEdits };
    delete newEdits[id];
    setAllEdits(newEdits);
    localStorage.setItem("client-edits", JSON.stringify(newEdits)); gravarNoBanco("client-edits", newEdits);
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
    localStorage.setItem("client-edits", JSON.stringify(newEdits)); gravarNoBanco("client-edits", newEdits);
  };

  const staticIdSet = new Set(CLIENTS.map((c) => c.id));
  const allClients = [...CLIENTS, ...extraClients.filter((c) => !staticIdSet.has(c.id))];

  const REQUIRED_AGENTS = ["calendario", "video", "briefing", "tomas"] as const;
  const DEFAULT_TASK: AgentTask = { current: "Aguardando instrução", status: "aguardando", recent: [], progress: 0 };

  const clients: Client[] = allClients
    .filter((c) => !deletedIds.includes(c.id))
    .map((c) => {
      const edit = allEdits[c.id];
      const merged = edit
        ? {
            ...c,
            ...edit,
            followers: {
              instagram: edit.followers?.instagram ?? c.followers.instagram,
              facebook: edit.followers?.facebook ?? c.followers.facebook,
            },
          }
        : c;
      const tasks = merged.agentTasks ?? {};
      const hasAllAgents = REQUIRED_AGENTS.every((a) => a in tasks);
      if (hasAllAgents) return merged;
      return {
        ...merged,
        agentTasks: {
          ...tasks,
          ...Object.fromEntries(
            REQUIRED_AGENTS
              .filter((a) => !(a in tasks))
              .map((a) => [a, DEFAULT_TASK])
          ),
        },
      };
    });

  const updateClient = (id: string, edits: ClientEdit) => {
    const newAllEdits: AllEdits = {
      ...allEdits,
      [id]: { ...(allEdits[id] ?? {}), ...edits },
    };
    setAllEdits(newAllEdits);
    localStorage.setItem("client-edits", JSON.stringify(newAllEdits)); gravarNoBanco("client-edits", newAllEdits);
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
