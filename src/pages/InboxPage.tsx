import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import InboxTab from "@/components/InboxTab";

/**
 * Inbox — usa o mesmo componente do workspace do cliente (InboxTab), que já
 * lê inbox_conversations e inbox_messages de verdade. Duas implementações de
 * inbox seria uma para manter e outra para esquecer de manter.
 *
 * A caixa é por cliente, então esta página só escolhe de quem é a caixa.
 */

type Cliente = { id: string; nome: string };

const CLIENTE_SALVO = "inbox:ultimo-cliente";

const InboxPage = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [ativo, setAtivo] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("clients")
        .select("id,name,workspace_id,status")
        .order("name");

      const lista: Cliente[] = (data ?? [])
        .filter((c: any) => c.status !== "archived")
        .map((c: any) => ({
          id: c.workspace_id || c.id,
          nome: c.name,
        }))
        .filter((c: Cliente, i: number, arr: Cliente[]) => arr.findIndex((x) => x.id === c.id) === i);

      setClientes(lista);
      const salvo = localStorage.getItem(CLIENTE_SALVO);
      setAtivo(lista.find((c) => c.id === salvo)?.id ?? lista[0]?.id ?? null);
      setCarregando(false);
    })();
  }, []);

  const escolher = (id: string) => {
    setAtivo(id);
    try { localStorage.setItem(CLIENTE_SALVO, id); } catch { /* modo anônimo */ }
  };

  if (carregando) {
    return <div className="p-6"><div className="h-[60vh] rounded-xl bg-card border border-border animate-pulse" /></div>;
  }

  if (clientes.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-card border border-border p-10 text-center">
          <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-lg font-semibold font-display text-foreground">Nenhum cliente cadastrado</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            A caixa de entrada é por cliente. Cadastre um cliente no painel da agência e conecte
            um canal (WhatsApp, Instagram, Facebook ou o chat do site) para as conversas chegarem aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 md:p-6 space-y-4 min-w-0">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Inbox</h1>
        <p className="text-muted-foreground text-sm mt-1">Todos os canais do cliente em um lugar só.</p>
      </div>

      {clientes.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {clientes.map((c) => (
            <button
              key={c.id}
              onClick={() => escolher(c.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                ativo === c.id
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:bg-muted/50"
              }`}
            >
              {c.nome}
            </button>
          ))}
        </div>
      )}

      {ativo && <InboxTab clientId={ativo} />}
    </motion.div>
  );
};

export default InboxPage;
