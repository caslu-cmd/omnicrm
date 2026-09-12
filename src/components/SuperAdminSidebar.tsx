import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/contexts/ClientsContext";
import { ShieldCheck, CheckSquare, Activity, AlertTriangle, PackageCheck, CheckCircle2 } from "lucide-react";

/**
 * Painel lateral do super admin no /agency.
 *
 * Os cards de clientes (área principal) já servem para abrir os workspaces; este
 * sidebar responde à outra pergunta de quem toca a agência: "o que o time
 * autônomo está fazendo e o que depende de mim AGORA?". Tudo lido do banco,
 * sem número decorativo:
 *  - aprovações pendentes (o que espera o seu OK antes de ir ao ar);
 *  - saúde das rotinas automáticas (quantas ativas e quais falharam — ex.: cota
 *    de imagem estourada);
 *  - últimas entregas que o time produziu.
 */

type Proposta = { id: string; client_id: string; titulo: string | null; title: string | null };
type Rotina = { client_id: string; rotina: string; ativo: boolean; last_status: string | null; last_error: string | null };
type Entrega = { id: string; client_id: string; title: string; category: string | null; done_at: string | null };

export default function SuperAdminSidebar() {
  const { clients } = useClients();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [rotinas, setRotinas] = useState<Rotina[]>([]);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);

  const nomeDoCliente = (slug: string) =>
    clients.find((c) => c.id === slug)?.name ?? slug;

  useEffect(() => {
    let vivo = true;
    (async () => {
      const db = supabase as any;
      const [p, r, e] = await Promise.all([
        db.from("agent_proposals").select("id, client_id, titulo, title").eq("status", "pending").order("created_at", { ascending: false }),
        db.from("client_routines").select("client_id, rotina, ativo, last_status, last_error"),
        db.from("client_deliverables").select("id, client_id, title, category, done_at").order("done_at", { ascending: false }).limit(6),
      ]);
      if (!vivo) return;
      setPropostas((p.data ?? []) as Proposta[]);
      setRotinas((r.data ?? []) as Rotina[]);
      setEntregas((e.data ?? []) as Entrega[]);
      setCarregando(false);
    })().catch(() => vivo && setCarregando(false));
    return () => { vivo = false; };
  }, []);

  const rotinasAtivas = rotinas.filter((r) => r.ativo);
  const clientesComRotina = new Set(rotinasAtivas.map((r) => r.client_id)).size;
  const rotinasComErro = rotinas.filter((r) => r.last_status === "erro");

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.07)",
  };
  const tituloSecao = "text-[11px] font-medium tracking-[0.14em] uppercase";

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 px-1">
        <ShieldCheck className="w-4 h-4" style={{ color: "#B9FF4B" }} />
        <span className="text-xs font-semibold tracking-wide" style={{ color: "rgba(255,255,255,0.75)" }}>
          Painel do Super Admin
        </span>
      </div>

      {/* ── Aprovações pendentes ── */}
      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-3.5 h-3.5" style={{ color: "#FBBF24" }} />
            <span className={tituloSecao} style={{ color: "rgba(255,255,255,0.5)" }}>Aprovações pendentes</span>
          </div>
          <span className="text-sm font-bold" style={{ color: propostas.length ? "#FBBF24" : "#34D399" }}>
            {propostas.length}
          </span>
        </div>
        {carregando ? (
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Carregando…</div>
        ) : propostas.length === 0 ? (
          <div className="flex items-center gap-2 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#34D399" }} /> Nada esperando seu OK.
          </div>
        ) : (
          <div className="space-y-1.5">
            {propostas.slice(0, 5).map((p) => (
              <div key={p.id} className="text-[11px] leading-snug">
                <span style={{ color: "rgba(255,255,255,0.75)" }}>{p.titulo || p.title || "Proposta"}</span>
                <span style={{ color: "rgba(255,255,255,0.35)" }}> · {nomeDoCliente(p.client_id)}</span>
              </div>
            ))}
            {propostas.length > 5 && (
              <div className="text-[11px] pt-1" style={{ color: "rgba(185,255,75,0.55)" }}>
                +{propostas.length - 5} no workspace de cada cliente
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Rotinas automáticas ── */}
      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5" style={{ color: "#B9FF4B" }} />
          <span className={tituloSecao} style={{ color: "rgba(255,255,255,0.5)" }}>Rotinas automáticas</span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-2xl font-bold" style={{ color: "#F0F0F0" }}>{rotinasAtivas.length}</span>
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            ativas em {clientesComRotina} cliente{clientesComRotina === 1 ? "" : "s"}
          </span>
        </div>
        {rotinasComErro.length > 0 ? (
          <div className="space-y-1.5 mt-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#F87171" }}>
              <AlertTriangle className="w-3.5 h-3.5" /> {rotinasComErro.length} com erro
            </div>
            {rotinasComErro.slice(0, 3).map((r, i) => (
              <div key={`${r.client_id}-${r.rotina}-${i}`} className="rounded-lg p-2"
                style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)" }}>
                <div className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {nomeDoCliente(r.client_id)} · {r.rotina}
                </div>
                {r.last_error && (
                  <div className="text-[10px] leading-snug mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {r.last_error.slice(0, 120)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          !carregando && (
            <div className="flex items-center gap-2 text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#34D399" }} /> Rodando sem erros.
            </div>
          )
        )}
      </div>

      {/* ── Entregas recentes ── */}
      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-center gap-2 mb-3">
          <PackageCheck className="w-3.5 h-3.5" style={{ color: "#60A5FA" }} />
          <span className={tituloSecao} style={{ color: "rgba(255,255,255,0.5)" }}>Entregas recentes</span>
        </div>
        {carregando ? (
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Carregando…</div>
        ) : entregas.length === 0 ? (
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>Nenhuma entrega ainda.</div>
        ) : (
          <div className="space-y-2">
            {entregas.map((e) => (
              <div key={e.id} className="text-[11px] leading-snug">
                <div style={{ color: "rgba(255,255,255,0.75)" }}>{e.title}</div>
                <div style={{ color: "rgba(255,255,255,0.35)" }}>
                  {nomeDoCliente(e.client_id)}{e.category ? ` · ${e.category}` : ""}
                  {e.done_at ? ` · ${new Date(e.done_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
