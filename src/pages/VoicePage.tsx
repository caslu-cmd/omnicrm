import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone, PhoneCall, PhoneOff, Mic, MicOff, Play, Pause, Download,
  Users, Clock, BarChart3, Bot, Headphones, FileText, Settings2,
  Plus, Search, Filter, TrendingUp, Volume2, ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CallRecord {
  id: number;
  contact: string;
  avatar: string;
  direction: "inbound" | "outbound";
  duration: string;
  status: "completed" | "missed" | "voicemail" | "ai-handled";
  sentiment: "positive" | "neutral" | "negative";
  time: string;
  transcript?: string;
  aiSummary?: string;
}

const calls: CallRecord[] = [
  { id: 1, contact: "Maria Silva", avatar: "MS", direction: "inbound", duration: "4:32", status: "completed", sentiment: "positive", time: "14:32", transcript: "Discussão sobre plano Pro, cliente interessada em demo...", aiSummary: "Lead qualificado. Interesse no Pro para equipe de 5. Agendar demo." },
  { id: 2, contact: "João Pereira", avatar: "JP", direction: "outbound", duration: "2:15", status: "completed", sentiment: "neutral", time: "11:20", transcript: "Follow-up sobre proposta comercial...", aiSummary: "Aguardando aprovação interna. Retornar em 3 dias." },
  { id: 3, contact: "Ana Costa", avatar: "AC", direction: "inbound", duration: "0:00", status: "missed", sentiment: "neutral", time: "10:45" },
  { id: 4, contact: "Roberto Santos", avatar: "RS", direction: "inbound", duration: "6:12", status: "ai-handled", sentiment: "negative", time: "09:30", transcript: "Reclamação sobre cobrança indevida...", aiSummary: "Cliente insatisfeito com cobrança. IA resolveu: estorno de R$ 49,90. Satisfação restaurada." },
  { id: 5, contact: "Fernanda Oliveira", avatar: "FO", direction: "outbound", duration: "1:45", status: "voicemail", sentiment: "neutral", time: "09:00" },
  { id: 6, contact: "Carlos Mendes", avatar: "CM", direction: "inbound", duration: "8:20", status: "ai-handled", sentiment: "positive", time: "Ontem", transcript: "Perguntas sobre funcionalidades...", aiSummary: "IA respondeu FAQ sobre integrações e automações. Lead encaminhado para vendas." },
];

const nluPipeline = [
  { step: "STT", label: "Speech-to-Text", desc: "Twilio → Transcrição em tempo real", status: "active", latency: "120ms" },
  { step: "NLU", label: "Compreensão", desc: "Detecção de intenção e entidades", status: "active", latency: "85ms" },
  { step: "DM", label: "Gerenciador de Diálogo", desc: "Fluxo de conversa e contexto", status: "active", latency: "45ms" },
  { step: "NLG", label: "Geração de Resposta", desc: "IA gera resposta contextual", status: "active", latency: "200ms" },
  { step: "TTS", label: "Text-to-Speech", desc: "Síntese de voz natural", status: "active", latency: "150ms" },
];

const voiceStats = [
  { label: "Chamadas Hoje", value: "34", change: "+12%", icon: Phone },
  { label: "Resolvidas pela IA", value: "18", change: "+45%", icon: Bot },
  { label: "Tempo Médio", value: "3:42", change: "-8%", icon: Clock },
  { label: "Satisfação", value: "4.6/5", change: "+0.3", icon: TrendingUp },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  completed: { label: "Completa", color: "bg-secondary/10 text-secondary" },
  missed: { label: "Perdida", color: "bg-destructive/10 text-destructive" },
  voicemail: { label: "Voicemail", color: "bg-accent/10 text-accent-foreground" },
  "ai-handled": { label: "IA", color: "bg-primary/10 text-primary" },
};

const sentimentEmoji: Record<string, string> = { positive: "😊", neutral: "😐", negative: "😟" };

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const VoicePage = () => {
  const [selectedCall, setSelectedCall] = useState<number | null>(null);
  const [tab, setTab] = useState<"calls" | "pipeline" | "settings">("calls");

  const selected = calls.find(c => c.id === selectedCall);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Voz & Chamadas IA</h1>
          <p className="text-sm text-muted-foreground mt-1">NLU avançada · Transcrição automática · Chamadas com IA</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <PhoneCall className="h-4 w-4" /> Nova Chamada
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {voiceStats.map(s => (
          <motion.div key={s.label} variants={item} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><s.icon className="h-5 w-5" /></div>
            <div>
              <p className="text-lg font-bold font-display text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-secondary flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" />{s.change}</span>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {[{ key: "calls", label: "Chamadas" }, { key: "pipeline", label: "Pipeline NLU" }, { key: "settings", label: "Configuração" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", tab === t.key ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}>
            {t.label}
          </button>
        ))}
      </motion.div>

      {tab === "calls" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Call List */}
          <div className="lg:col-span-2 space-y-2">
            {calls.map(c => {
              const status = statusConfig[c.status];
              return (
                <motion.div
                  key={c.id}
                  variants={item}
                  onClick={() => setSelectedCall(c.id)}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card hover:shadow-elevated transition-all cursor-pointer",
                    selectedCall === c.id ? "border-primary/30" : "border-border"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">{c.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{c.contact}</h4>
                      <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium", status.color)}>{status.label}</span>
                      <span className="text-[11px]">{sentimentEmoji[c.sentiment]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.direction === "inbound" ? "↙ Recebida" : "↗ Realizada"} · {c.duration} · {c.time}
                    </p>
                  </div>
                  {c.status === "ai-handled" && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-medium text-primary">IA</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Call Detail */}
          <div className="rounded-xl border border-border bg-card shadow-card p-5 space-y-5 overflow-y-auto scrollbar-thin">
            {selected ? (
              <>
                <div className="text-center">
                  <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">{selected.avatar}</div>
                  <h3 className="text-base font-semibold text-foreground mt-2">{selected.contact}</h3>
                  <p className="text-xs text-muted-foreground">{selected.direction === "inbound" ? "Chamada recebida" : "Chamada realizada"} · {selected.time}</p>
                </div>

                {selected.aiSummary && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5 text-primary" /> Resumo IA
                    </h4>
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-sm text-foreground">{selected.aiSummary}</div>
                  </div>
                )}

                {selected.transcript && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Transcrição
                    </h4>
                    <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{selected.transcript}</div>
                  </div>
                )}

                {/* Audio Player Simulation */}
                <div className="rounded-lg border border-border p-3 flex items-center gap-3">
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Play className="h-3.5 w-3.5 ml-0.5" />
                  </button>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-1/3 rounded-full bg-primary" />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{selected.duration}</span>
                  <button className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Download className="h-3.5 w-3.5" /></button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sentimento</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{sentimentEmoji[selected.sentiment]}</span>
                    <span className="text-sm font-medium text-foreground capitalize">{selected.sentiment === "positive" ? "Positivo" : selected.sentiment === "negative" ? "Negativo" : "Neutro"}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <Headphones className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Selecione uma chamada para ver detalhes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "pipeline" && (
        <motion.div variants={item} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h3 className="text-base font-semibold font-display text-foreground mb-6">Pipeline de Processamento de Voz (NLU)</h3>
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              {nluPipeline.map((step, i) => (
                <div key={step.step} className="flex items-center gap-4">
                  <div className="flex flex-col items-center min-w-[140px]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/20 mb-2">
                      <span className="text-sm font-bold text-primary">{step.step}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{step.label}</p>
                    <p className="text-[10px] text-muted-foreground text-center mt-0.5">{step.desc}</p>
                    <span className="mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary/10 text-secondary">{step.latency}</span>
                  </div>
                  {i < nluPipeline.length - 1 && (
                    <div className="flex items-center text-muted-foreground/40 -mt-8">
                      <div className="w-8 h-0.5 bg-border" />
                      <span className="text-lg">→</span>
                      <div className="w-8 h-0.5 bg-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Modelos de Voz</h4>
              {[
                { name: "pt-BR Feminino", provider: "ElevenLabs", quality: "Alta", active: true },
                { name: "pt-BR Masculino", provider: "Google TTS", quality: "Média", active: false },
                { name: "en-US Feminino", provider: "ElevenLabs", quality: "Alta", active: true },
              ].map(v => (
                <div key={v.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{v.name}</p>
                      <p className="text-[10px] text-muted-foreground">{v.provider} · {v.quality}</p>
                    </div>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", v.active ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground")}>
                    {v.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Fluxos de Chamada IA</h4>
              {[
                { name: "Suporte Nível 1", calls: 156, resolution: "82%" },
                { name: "Qualificação de Lead", calls: 89, resolution: "91%" },
                { name: "Agendamento Automático", calls: 234, resolution: "96%" },
              ].map(f => (
                <div key={f.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">{f.calls} chamadas · {f.resolution} resolução</p>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Settings2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {tab === "settings" && (
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Provedor de Telefonia</h3>
            {["Twilio", "Plivo", "Vonage"].map((p, i) => (
              <div key={p} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <span className="text-sm font-medium text-foreground">{p}</span>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", i === 0 ? "bg-secondary/10 text-secondary" : "bg-muted text-muted-foreground")}>
                  {i === 0 ? "Conectado" : "Desconectado"}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-card space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Configurações de IA</h3>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Modelo NLU</label>
              <select className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm"><option>Gemini 3 Flash</option><option>GPT-5 Mini</option></select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tom de Voz</label>
              <select className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm"><option>Profissional e Amigável</option><option>Formal</option><option>Casual</option></select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Escalonamento</label>
              <select className="w-full mt-1 rounded-lg border border-input bg-background py-2 px-3 text-sm"><option>Transferir para humano após 2 falhas</option><option>Sempre IA</option><option>IA + Confirmação</option></select>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VoicePage;
