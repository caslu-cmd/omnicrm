import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, AlertTriangle, Target, Zap, MessageSquare, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Strategy {
  perfil: string;
  abordagem: string;
  pontos_chave: string[];
  proxima_acao: string;
  alertas: string[];
  score_justificativa: string;
}

interface Props {
  contactId: string;
  contactName: string;
}

export default function ContactAIStrategy({ contactId, contactName }: Props) {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading]   = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sessão expirada."); return; }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey     = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/ai-crm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": anonKey,
        },
        body: JSON.stringify({ action: "generate-strategy", contact_id: contactId }),
      });

      const data = await res.json();
      if (!res.ok || data?.error) {
        toast.error(data?.error ?? "Erro ao gerar estratégia.");
        return;
      }

      setStrategy(data.strategy as Strategy);
      setGenerated(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const s = (o: number) => `rgba(255,255,255,${o})`;

  if (!generated && !loading) {
    return (
      <button
        onClick={generate}
        className="w-full py-4 rounded-xl flex flex-col items-center gap-2 transition-all hover:scale-[1.01]"
        style={{ background: "rgba(185,255,75,0.06)", border: "1px dashed rgba(185,255,75,0.3)" }}
      >
        <Sparkles className="h-5 w-5" style={{ color: "#B9FF4B" }} />
        <span className="text-sm font-semibold" style={{ color: "#B9FF4B" }}>Gerar estratégia com IA</span>
        <span className="text-xs" style={{ color: s(0.35) }}>Claude analisa {contactName} e sugere a melhor abordagem</span>
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#B9FF4B" }} />
        <p className="text-sm" style={{ color: s(0.5) }}>Analisando lead e gerando estratégia…</p>
      </div>
    );
  }

  if (!strategy) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "#B9FF4B" }} />
            <span className="text-xs font-semibold" style={{ color: "#B9FF4B" }}>Estratégia gerada por IA</span>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all"
            style={{ background: "rgba(255,255,255,0.05)", color: s(0.4) }}
          >
            <RefreshCw className="h-3 w-3" /> Regenerar
          </button>
        </div>

        {/* Perfil */}
        <Card icon={<Target className="h-3.5 w-3.5" />} title="Perfil do lead" color="#8B5CF6">
          <p className="text-xs leading-relaxed" style={{ color: s(0.7) }}>{strategy.perfil}</p>
        </Card>

        {/* Abordagem */}
        <Card icon={<MessageSquare className="h-3.5 w-3.5" />} title="Como abordar" color="#3B82F6">
          <p className="text-xs leading-relaxed" style={{ color: s(0.7) }}>{strategy.abordagem}</p>
        </Card>

        {/* Pontos-chave */}
        <Card icon={<Zap className="h-3.5 w-3.5" />} title="Pontos-chave" color="#F59E0B">
          <ul className="space-y-1">
            {strategy.pontos_chave.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: s(0.7) }}>
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "#F59E0B" }} />
                {p}
              </li>
            ))}
          </ul>
        </Card>

        {/* Próxima ação */}
        <div
          className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: "rgba(185,255,75,0.08)", border: "1px solid rgba(185,255,75,0.2)" }}
        >
          <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "#B9FF4B" }} />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#B9FF4B" }}>Próxima ação agora</p>
            <p className="text-xs leading-relaxed" style={{ color: s(0.8) }}>{strategy.proxima_acao}</p>
          </div>
        </div>

        {/* Score justificativa */}
        <Card icon={<TrendingUp className="h-3.5 w-3.5" />} title="Score e como melhorá-lo" color="#10B981">
          <p className="text-xs leading-relaxed" style={{ color: s(0.7) }}>{strategy.score_justificativa}</p>
        </Card>

        {/* Alertas */}
        {strategy.alertas?.length > 0 && (
          <Card icon={<AlertTriangle className="h-3.5 w-3.5" />} title="Atenção" color="#F87171">
            <ul className="space-y-1">
              {strategy.alertas.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: s(0.65) }}>
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "#F87171" }} />
                  {a}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function Card({ icon, title, color, children }: {
  icon: React.ReactNode; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}
