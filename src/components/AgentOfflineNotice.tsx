import { AlertCircle } from "lucide-react";
import { AGENT_OFFLINE_MSG } from "@/lib/agentApis";

/**
 * Mostrado quando um agente que roda como serviço próprio não tem URL
 * configurada. Antes disso, a tela abria normalmente e cada ação falhava
 * calada, dando a impressão de que o agente estava no ar.
 */
export default function AgentOfflineNotice({
  agent, envVar,
}: { agent: string; envVar: string }) {
  return (
    <div className="flex items-center justify-center p-8 h-full" style={{ background: "#07080A" }}>
      <div className="max-w-md rounded-2xl p-6 text-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(251,191,36,0.25)" }}>
        <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: "#FBBF24" }} />
        <div className="text-sm font-semibold mb-2" style={{ color: "rgba(255,255,255,0.9)" }}>
          {agent} ainda não está publicado
        </div>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
          {AGENT_OFFLINE_MSG}
        </p>
        <code className="text-[11px] px-2 py-1 rounded"
          style={{ background: "rgba(255,255,255,0.06)", color: "#B9FF4B" }}>
          {envVar}
        </code>
      </div>
    </div>
  );
}
