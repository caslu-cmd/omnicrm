import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, KeyRound, SendHorizontal, MessageSquare, ClipboardList, CheckCircle2 } from "lucide-react";

/**
 * "Precisa da sua atenção" — o nível da agência.
 *
 * O painel mostrava números decorativos; o que falta a quem toca a agência é
 * saber onde a operação está travada AGORA. Tudo aqui é lido do banco, sem
 * número inventado: conexão vencida derruba publicação, post falho é entrega
 * que não saiu, demanda parada é cliente esperando.
 */

type Alerta = {
  id: string;
  icone: typeof AlertTriangle;
  titulo: string;
  detalhe: string;
  cor: string;
  acao?: () => void;
  rotulo?: string;
};

export default function AgencyAlerts() {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let vivo = true;

    const carregar = async () => {
      const db = supabase as any;
      const lista: Alerta[] = [];

      const [conexoes, posts, demandas, conversas] = await Promise.all([
        db.from("social_connections").select("client_id, platform, token_expires_at, connected").eq("connected", true),
        db.from("scheduled_posts").select("id, client_id, error_message").eq("status", "failed"),
        db.from("client_demands").select("id, client_id, status, due_date").in("status", ["pending", "in_progress"]),
        db.from("inbox_conversations").select("id, client_id, unread").gt("unread", 0),
      ]);

      // 1) Tokens da Meta — sem eles nada é publicado nem medido
      const agora = Date.now();
      const vencidas = (conexoes.data ?? []).filter((c: any) =>
        c.token_expires_at && new Date(c.token_expires_at).getTime() < agora);
      const vencendo = (conexoes.data ?? []).filter((c: any) => {
        if (!c.token_expires_at) return false;
        const dias = (new Date(c.token_expires_at).getTime() - agora) / 86400000;
        return dias >= 0 && dias <= 10;
      });
      if (vencidas.length) {
        const quais = [...new Set(vencidas.map((c: any) => c.client_id))].join(", ");
        lista.push({
          id: "tokens-vencidos",
          icone: KeyRound,
          cor: "#F87171",
          titulo: `${vencidas.length} conexão(ões) vencida(s)`,
          detalhe: `Sem publicar nem medir em: ${quais}. Reconecte pela aba Redes Sociais.`,
        });
      } else if (vencendo.length) {
        lista.push({
          id: "tokens-vencendo",
          icone: KeyRound,
          cor: "#FBBF24",
          titulo: `${vencendo.length} conexão(ões) vencendo`,
          detalhe: "A renovação automática roda de madrugada; se falhar, aparece aqui como vencida.",
        });
      }

      // 2) Posts que não saíram
      if ((posts.data ?? []).length) {
        const porCliente = new Map<string, number>();
        for (const p of posts.data) porCliente.set(p.client_id, (porCliente.get(p.client_id) ?? 0) + 1);
        const resumo = [...porCliente.entries()].map(([c, n]) => `${c} (${n})`).join(", ");
        lista.push({
          id: "posts-falhos",
          icone: SendHorizontal,
          cor: "#F87171",
          titulo: `${posts.data.length} post(s) não publicado(s)`,
          detalhe: `Falharam em: ${resumo}. Abra Redes Sociais e use "Postar agora".`,
        });
      }

      // 3) Demandas de cliente atrasadas
      const hoje = new Date().toISOString().slice(0, 10);
      const atrasadas = (demandas.data ?? []).filter((d: any) => d.due_date && d.due_date < hoje);
      if (atrasadas.length) {
        lista.push({
          id: "demandas-atrasadas",
          icone: ClipboardList,
          cor: "#FBBF24",
          titulo: `${atrasadas.length} demanda(s) com prazo vencido`,
          detalhe: "Pedidos que o cliente registrou no portal e passaram da data combinada.",
        });
      }

      // 4) Conversas esperando resposta
      const naoLidas = (conversas.data ?? []).reduce((s: number, c: any) => s + (c.unread ?? 0), 0);
      if (naoLidas > 0) {
        lista.push({
          id: "inbox",
          icone: MessageSquare,
          cor: "#60A5FA",
          titulo: `${naoLidas} mensagem(ns) sem resposta`,
          detalhe: `Em ${new Set((conversas.data ?? []).map((c: any) => c.client_id)).size} cliente(s).`,
        });
      }

      if (vivo) { setAlertas(lista); setCarregando(false); }
    };

    carregar().catch(() => vivo && setCarregando(false));
    return () => { vivo = false; };
  }, [navigate]);

  if (carregando) return null;

  return (
    <div className="rounded-2xl p-5 mb-6"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4" style={{ color: alertas.length ? "#FBBF24" : "#34D399" }} />
        <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
          Precisa da sua atenção
        </h2>
      </div>

      {alertas.length === 0 ? (
        <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#34D399" }} />
          Nenhuma pendência: conexões válidas, posts publicados, demandas em dia e inbox respondido.
        </div>
      ) : (
        <div className="space-y-2">
          {alertas.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-xl p-3"
              style={{ background: `${a.cor}0D`, border: `1px solid ${a.cor}25` }}>
              <a.icone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: a.cor }} />
              <div className="min-w-0">
                <div className="text-xs font-semibold" style={{ color: a.cor }}>{a.titulo}</div>
                <div className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {a.detalhe}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
