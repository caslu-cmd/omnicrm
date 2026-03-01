import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Send, Minimize2, Maximize2, Bot, User,
  ThumbsUp, ThumbsDown, Copy, RotateCcw, Lightbulb,
  TrendingUp, MessageSquare, Mic, MicOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sentiment?: "positive" | "neutral" | "negative";
  suggestions?: string[];
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: "Olá! 👋 Sou o assistente IA do OmniCRM. Posso ajudar com:\n\n• **Análise de conversas** e recomendação de respostas\n• **Resumos automáticos** de interações\n• **Análise de sentimento** dos seus clientes\n• **Sugestões** para melhorar suas métricas\n\nComo posso ajudar?",
    timestamp: "Agora",
  },
];

const quickActions = [
  { label: "Resumir conversas", icon: MessageSquare },
  { label: "Analisar sentimento", icon: TrendingUp },
  { label: "Sugerir resposta", icon: Lightbulb },
];

const AiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const simulateResponse = (userText: string) => {
    setIsTyping(true);
    const responses: Record<string, { content: string; sentiment?: "positive" | "neutral" | "negative"; suggestions?: string[] }> = {
      default: {
        content: "Analisei os dados disponíveis. Aqui estão alguns insights:\n\n📊 **Performance desta semana:**\n- Taxa de resposta: **94.2%** (↑ 3.1%)\n- Tempo médio de resposta: **4.2 min**\n- Satisfação do cliente: **4.7/5.0**\n\n💡 **Recomendações:**\n1. Leads com score >80 devem receber follow-up em até 2h\n2. Canal WhatsApp tem melhor taxa de conversão (34%)\n3. Considere automação para respostas frequentes sobre preços",
        sentiment: "positive",
        suggestions: ["Criar automação de preços", "Ver leads quentes", "Exportar relatório"],
      },
      resumir: {
        content: "📋 **Resumo das últimas 24h:**\n\n• **247 conversas ativas** — 12 aguardando resposta há >1h\n• **Maria Silva** (Lead Quente) quer demo do Plano Pro para equipe de 5\n• **Roberto Santos** solicitou cancelamento — sugiro oferecer desconto de retenção\n• **3 novos leads** via landing page Black Friday\n• **Campanha e-mail** \"Newsletter Março\" agendada para 5 Mar\n\n⚠️ **Atenção:** 2 conversas com sentimento negativo detectado",
        sentiment: "neutral",
        suggestions: ["Responder Maria", "Ver Roberto Santos", "Configurar retenção"],
      },
      sentimento: {
        content: "🎭 **Análise de Sentimento — Últimas 24h:**\n\n| Sentimento | Conversas | % |\n|---|---|---|\n| 😊 Positivo | 187 | 75.7% |\n| 😐 Neutro | 48 | 19.4% |\n| 😟 Negativo | 12 | 4.9% |\n\n**Tendência:** ↑ Melhoria de 2.3% vs semana anterior\n\n🔴 **Alertas de sentimento negativo:**\n- Roberto Santos — frustração com cobrança\n- Ana Lima — tempo de espera longo\n\n💡 Recomendo priorizar estas conversas e configurar alertas automáticos para sentimento negativo.",
        sentiment: "positive",
        suggestions: ["Criar alerta automático", "Priorizar negativos", "Ver tendências"],
      },
      resposta: {
        content: "✍️ **Sugestão de resposta para Maria Silva:**\n\n> \"Olá Maria! 😊 Fico feliz com seu interesse no Plano Pro!\n>\n> Para sua equipe de 5 vendedores, o Pro oferece:\n> • Inbox unificado ilimitado\n> • Automações avançadas com templates prontos\n> • Pipelines e relatórios completos\n>\n> Posso agendar uma demo personalizada para amanhã às 14h? Assim mostro tudo em ação para toda a equipe!\n>\n> Abraços, [Seu Nome]\"\n\n**Tom:** Profissional e acolhedor ✅\n**Probabilidade de conversão:** Alta (82%)",
        sentiment: "positive",
        suggestions: ["Enviar esta resposta", "Editar tom", "Agendar demo"],
      },
    };

    setTimeout(() => {
      const lower = userText.toLowerCase();
      let response = responses.default;
      if (lower.includes("resum")) response = responses.resumir;
      else if (lower.includes("sentimento") || lower.includes("sentiment")) response = responses.sentimento;
      else if (lower.includes("resposta") || lower.includes("suger")) response = responses.resposta;

      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: "assistant",
        content: response.content,
        timestamp: "Agora",
        sentiment: response.sentiment,
        suggestions: response.suggestions,
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: "Agora",
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    simulateResponse(input);
  };

  const handleQuickAction = (label: string) => {
    const userMsg: Message = {
      id: messages.length + 1,
      role: "user",
      content: label,
      timestamp: "Agora",
    };
    setMessages(prev => [...prev, userMsg]);
    simulateResponse(label);
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated hover:shadow-lg transition-shadow"
          >
            <Sparkles className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn(
              "fixed z-50 flex flex-col rounded-2xl border border-border bg-card shadow-elevated overflow-hidden",
              isExpanded
                ? "bottom-4 right-4 left-4 top-4 sm:left-auto sm:w-[560px] sm:top-4"
                : "bottom-6 right-6 w-[400px] h-[560px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Assistente IA</h3>
                  <p className="text-[10px] text-muted-foreground">Powered by Lovable AI · Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div className={cn("max-w-[85%] space-y-2", msg.role === "user" ? "items-end" : "items-start")}>
                    <div className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}>
                      {msg.content}
                    </div>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground"><ThumbsUp className="h-3 w-3" /></button>
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground"><ThumbsDown className="h-3 w-3" /></button>
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground"><Copy className="h-3 w-3" /></button>
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground"><RotateCcw className="h-3 w-3" /></button>
                      </div>
                    )}
                    {msg.suggestions && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestions.map(s => (
                          <button
                            key={s}
                            onClick={() => handleQuickAction(s)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-border bg-card text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary mt-0.5">
                      <User className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full bg-muted-foreground/40"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex gap-2">
                {quickActions.map(a => (
                  <button
                    key={a.label}
                    onClick={() => handleQuickAction(a.label)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    <a.icon className="h-3.5 w-3.5" /> {a.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Pergunte algo à IA..."
                  className="flex-1 rounded-xl border border-input bg-background py-2.5 px-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiAssistant;
