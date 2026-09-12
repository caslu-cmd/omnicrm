import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, CheckSquare, Activity, Radio, PackageCheck, AlertTriangle } from "lucide-react";

/**
 * Panorama do cliente — a "visão ampla" no topo da aba Visão Geral.
 *
 * A aba já mostra os posts (pipeline de conteúdo). Isto responde à outra
 * pergunta de quem gerencia a conta: como está a operação inteira deste cliente
 * AGORA? Tudo lido do banco pelo slug do workspace (mesmo filtro que o resto da
 * tela usa), sem número decorativo:
 *  - alcance (seguidores somados das redes conectadas);
 *  - relacionamento (contatos/leads na base);
 *  - o que depende de você (propostas aguardando aprovação);
 *  - automação (rotinas ativas e as que falharam — ex.: cota de imagem);
 *  - entrega (peças concluídas no mês).
 */

type Rotina = { rotina: string; ativo: boolean; last_status: string | null; last_error: string | null };

export default function ClientPanorama({ clientId }: { clientId: string }) {
  const [seguidores, setSeguidores] = useState(0);
  const [redes, setRedes] = useState(0);
  const [contatos, setContatos] = useState(0);
  const [aprovacoes, setAprovacoes] = useState(0);
  const [rotinas, setRotinas] = useState<Rotina[]>([]);
  const [entregasMes, setEntregasMes] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    let vivo = true;
    (async () => {
      setCarregando(true);
      const db = supabase as any;
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const [conex, cont, props, rot, entr] = await Promise.all([
        db.from("social_connections").select("platform, followers_count").eq("client_id", clientId).eq("connected", true),
        db.from("contacts").select("id").eq("client_id", clientId),
        db.from("agent_proposals").select("id").eq("client_id", clientId).eq("status", "pending"),
        db.from("client_routines").select("rotina, ativo, last_status, last_error").eq("client_id", clientId),
        db.from("client_deliverables").select("id, done_at").eq("client_id", clientId).gte("done_at", inicioMes.toISOString()),
      ]);
      if (!vivo) return;
      const conns = (conex.data ?? []) as { followers_count: number | null }[];
      setSeguidores(conns.reduce((s, c) => s + (c.followers_count ?? 0), 0));
      setRedes(conns.length);
      setContatos((cont.data ?? []).length);
      setAprovacoes((props.data ?? []).length);
      setRotinas((rot.data ?? []) as Rotina[]);
      setEntregasMes((entr.data ?? []).length);
      setCarregando(false);
    })().catch(() => vivo && setCarregando(false));
    return () => { vivo = false; };
  }, [clientId]);

  const rotinasAtivas = rotinas.filter((r) => r.ativo).length;
  const rotinasComErro = rotinas.filter((r) => r.last_status === "erro");

  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  const tiles = [
    { label: "Seguidores", value: fmt(seguidores), sub: `${redes} rede${redes === 1 ? "" : "s"}`, icon: Radio, cor: "#60A5FA" },
    { label: "Contatos", value: fmt(contatos), sub: "na base", icon: Users, cor: "#A78BFA" },
    { label: "Aguardando você", value: aprovacoes, sub: "aprovações", icon: CheckSquare, cor: aprovacoes ? "#FBBF24" : "#34D399" },
    { label: "Rotinas ativas", value: rotinasAtivas, sub: rotinasComErro.length ? `${rotinasComErro.length} com erro` : "automação", icon: Activity, cor: rotinasComErro.length ? "#F87171" : "#B9FF4B" },
    { label: "Entregas no mês", value: entregasMes, sub: "concluídas", icon: PackageCheck, cor: "#34D399" },
  ];

  return (
    <div className="rounded-2xl p-5 mb-6"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <h3 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Panorama do cliente</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <t.icon className="w-3 h-3" style={{ color: t.cor }} />
              <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.35)" }}>{t.label}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight leading-none mb-1"
              style={{ color: carregando ? "rgba(255,255,255,0.25)" : "#F0F0F0" }}>
              {carregando ? "—" : t.value}
            </div>
            <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{t.sub}</div>
          </div>
        ))}
      </div>

      {rotinasComErro.length > 0 && (
        <div className="mt-3 rounded-xl p-3"
          style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)" }}>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-1" style={{ color: "#F87171" }}>
            <AlertTriangle className="w-3.5 h-3.5" /> Automação com erro
          </div>
          {rotinasComErro.slice(0, 2).map((r, i) => (
            <div key={`${r.rotina}-${i}`} className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.55)" }}>
              <span className="font-medium capitalize">{r.rotina}</span>
              {r.last_error ? ` — ${r.last_error.slice(0, 90)}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
