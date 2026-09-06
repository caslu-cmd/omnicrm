import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Phone, Plug, ArrowRight } from "lucide-react";

/**
 * Voz — ainda não existe.
 *
 * Esta página mostrava chamadas, transcrições, sentimento e latência de um
 * pipeline de voz que nunca foi ligado. Nenhum daqueles números vinha de
 * lugar nenhum. Enquanto não houver telefonia conectada e uma tabela de
 * chamadas, a página diz o que falta em vez de encenar uma operação.
 */

const FALTA = [
  {
    titulo: "Um provedor de telefonia",
    texto: "Twilio, Z-API voz ou equivalente, com número e webhook apontando para uma edge function.",
  },
  {
    titulo: "Onde guardar as chamadas",
    texto: "Uma tabela de chamadas com direção, duração, status, gravação e transcrição, ligada ao contato do CRM.",
  },
  {
    titulo: "Transcrição e resumo",
    texto: "Transcrever a gravação e gerar o resumo. Aí o Eduardo registra a chamada como interação no CRM sozinho.",
  },
];

const VoicePage = () => {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-3 md:p-6 space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Voz</h1>
        <p className="text-muted-foreground text-sm mt-1">Atendimento por telefone com transcrição e resumo automático.</p>
      </div>

      <div className="rounded-xl bg-card border border-border p-8 md:p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mx-auto mb-4">
          <Phone className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold font-display text-foreground">Nenhuma telefonia conectada</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
          Não há chamadas para mostrar porque ainda não existe canal de voz ligado nesta conta.
          Enquanto isso, WhatsApp, Instagram, Facebook e o chat do site já funcionam no Inbox.
        </p>
        <div className="flex gap-2 justify-center mt-5 flex-wrap">
          <button onClick={() => navigate("/integrations")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors">
            <Plug className="h-4 w-4" /> Ver integrações
          </button>
          <button onClick={() => navigate("/inbox")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
            Ir para o Inbox <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FALTA.map((f, i) => (
          <div key={f.titulo} className="rounded-xl bg-card border border-border p-5">
            <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
            <p className="text-sm font-semibold text-foreground mt-2">{f.titulo}</p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{f.texto}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default VoicePage;
