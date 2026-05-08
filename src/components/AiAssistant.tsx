import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  Sparkles, X, Send, Minimize2, Maximize2, Bot, User,
  ThumbsUp, ThumbsDown, Copy, RotateCcw, Lightbulb,
  TrendingUp, MessageSquare, GripHorizontal, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePageContext } from "@/contexts/PageContext";
import { useAuth } from "@/hooks/useAuth";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard":    "Dashboard da agência",
  "/agency":       "Dashboard da agência — visão geral dos clientes",
  "/inbox":        "Caixa de entrada — mensagens, leads e conversas",
  "/contacts":     "Contatos — base de leads e clientes",
  "/pipelines":    "Pipelines de vendas — funil de negociação",
  "/automations":  "Automações — fluxos automáticos de marketing",
  "/campaigns":    "Campanhas — e-mail marketing e disparos",
  "/scheduling":   "Agendamento — calendário de publicações",
  "/whatsapp":     "WhatsApp — conversas e automações",
  "/groups":       "Grupos — gestão de grupos",
  "/voice":        "Voz — gravações e transcrições",
  "/sites":        "Sites — landing pages e páginas web",
  "/members":      "Membros — gestão da equipe",
  "/payments":     "Pagamentos — faturamento e cobranças",
  "/reports":      "Relatórios — métricas e resultados",
  "/integrations": "Integrações — conexões com plataformas externas",
  "/settings":     "Configurações da plataforma",
  "/notebook":     "Notebook — anotações e documentos",
  "/video-editor": "Editor de vídeo — Bobby IA",
};

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: "Olá! Sou a Calu IA, sua assistente de marketing e CRM.\n\nPosso ajudar com:\n\n• **Estratégia de conteúdo** para seus clientes\n• **Copy pronto** para posts, stories e campanhas\n• **Análise de clientes** e próximos passos\n• **Briefing e posicionamento** de marca\n\nComo posso ajudar?",
    timestamp: "Agora",
  },
];

const quickActions = [
  { label: "Criar copy para post", icon: MessageSquare },
  { label: "Analisar cliente", icon: TrendingUp },
  { label: "Sugerir pauta mensal", icon: Lightbulb },
];

const AiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convId, setConvId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const location = useLocation();
  const { pageContext } = usePageContext();
  const { session } = useAuth();

  const buildSystemPrompt = () => {
    const routeLabel = Object.entries(ROUTE_LABELS).find(([route]) =>
      location.pathname === route || location.pathname.startsWith(route + "/")
    )?.[1];
    const autoCtx = pageContext || (routeLabel ? `Página atual: ${routeLabel}.` : "");
    if (!autoCtx) return undefined;
    return `Você é a Caroline IA, assistente especializada em marketing digital e gestão de clientes para agências de publicidade brasileiras.\n\nVocê domina:\n- Estratégia de conteúdo para redes sociais (Instagram, Facebook, TikTok, LinkedIn)\n- Criação de copy para posts, stories, legendas, campanhas e landing pages\n- Gestão de tráfego pago (Facebook Ads, Google Ads)\n- Briefing e posicionamento de marca\n- Calendário editorial e planejamento de campanhas\n- Análise de métricas e resultados\n- Gestão de relacionamento com clientes (CRM)\n\nRegras de comportamento:\n- Responda sempre em português brasileiro, de forma profissional mas acolhedora\n- Seja direta e prática — dê respostas que a pessoa possa executar imediatamente\n- Quando sugerir copy ou textos, entregue prontos para uso\n- Formate respostas com markdown quando ajudar na leitura\n- Sugira próximos passos sempre que relevante\n\n=== CONTEXTO ATUAL ===\n${autoCtx}`;
  };

  // Load latest conversation from DB when panel opens
  useEffect(() => {
    if (!isOpen || !session) return;
    if (history.length > 0) return; // already loaded
    (async () => {
      const { data: convs } = await (supabase as any)
        .from("calu_ia_conversations")
        .select("id, messages")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (convs && convs.length > 0) {
        const saved = convs[0];
        setConvId(saved.id);
        const msgs: { role: "user" | "assistant"; content: string }[] = saved.messages ?? [];
        if (msgs.length > 0) {
          setHistory(msgs);
          setMessages([
            initialMessages[0],
            ...msgs.map((m, i) => ({
              id: i + 2,
              role: m.role,
              content: m.content,
              timestamp: "",
            })),
          ]);
        }
      }
    })();
  }, [isOpen, session]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistConversation = useCallback(async (updatedHistory: { role: "user" | "assistant"; content: string }[]) => {
    if (!session) return;
    if (convId) {
      await (supabase as any).from("calu_ia_conversations").update({ messages: updatedHistory, updated_at: new Date().toISOString() }).eq("id", convId);
    } else {
      const { data } = await (supabase as any).from("calu_ia_conversations").insert({ user_id: session.user.id, messages: updatedHistory }).select("id").single();
      if (data) setConvId(data.id);
    }
  }, [session, convId]);

  const startNewConversation = () => {
    setConvId(null);
    setMessages(initialMessages);
    setHistory([]);
    setError(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: text,
      timestamp: "Agora",
    };

    const updatedHistory = [...history, { role: "user" as const, content: text }];

    setMessages((prev) => [...prev, userMessage]);
    setHistory(updatedHistory);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      const systemPrompt = buildSystemPrompt();
      const { data, error: fnError } = await supabase.functions.invoke("chat-ai", {
        body: { messages: updatedHistory, ...(systemPrompt ? { systemPrompt } : {}) },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.content) throw new Error("Resposta inválida da IA");

      const assistantMessage: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: data.content,
        timestamp: "Agora",
      };

      const finalHistory = [...updatedHistory, { role: "assistant" as const, content: data.content }];
      setMessages((prev) => [...prev, assistantMessage]);
      setHistory(finalHistory);
      persistConversation(finalHistory);
    } catch (err) {
      setError(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleQuickAction = (label: string) => sendMessage(label);
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    // Full-viewport overlay — pointer-events: none so it never blocks clicks behind it
    <div
      ref={constraintsRef}
      style={{ position: "fixed", inset: 0, zIndex: 50, pointerEvents: "none" }}
    >
      {/* FAB button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            style={{
              position: "absolute", bottom: 24, right: 24,
              pointerEvents: "auto",
              width: 56, height: 56,
              borderRadius: "50%",
              background: "#B9FF4B",
              color: "#07080A",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 24px -4px rgba(185,255,75,0.55), 0 4px 16px rgba(0,0,0,0.4)",
              border: "none", cursor: "pointer",
            }}
          >
            <Sparkles style={{ width: 24, height: 24 }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel — draggable */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-panel"
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragConstraints={constraintsRef}
            dragElastic={0}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              width: isExpanded ? Math.min(560, window.innerWidth - 32) : 400,
              height: isExpanded ? window.innerHeight - 32 : 560,
              pointerEvents: "auto",
              display: "flex",
              flexDirection: "column",
              borderRadius: 16,
              overflow: "hidden",
              background: "#0C0D0F",
              border: "1px solid rgba(185,255,75,0.14)",
              boxShadow: "0 24px 64px -8px rgba(0,0,0,0.8)",
            }}
          >
            {/* Header — drag handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{
                cursor: "grab",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: "1px solid rgba(185,255,75,0.1)",
                background: "rgba(185,255,75,0.04)",
                userSelect: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#B9FF4B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Sparkles style={{ width: 16, height: 16, color: "#07080A" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#F0F0F0", margin: 0, lineHeight: 1.3 }}>Calu IA</p>
                  <p style={{ fontSize: 10, color: "#B9FF4B", opacity: 0.7, margin: 0 }}>Powered by Claude · Online</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <GripHorizontal style={{ width: 14, height: 14, color: "rgba(255,255,255,0.2)", marginRight: 6 }} />
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={startNewConversation}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                  style={{ cursor: "pointer" }}
                  title="Nova conversa"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                  style={{ cursor: "pointer" }}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                  style={{ cursor: "pointer" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              {messages.map((msg) => (
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
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      )}
                    >
                      {msg.content}
                    </div>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(msg.content)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground"
                          title="Copiar"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => sendMessage(messages[msg.id - 2]?.content ?? "")}
                          className="p-1 rounded hover:bg-muted text-muted-foreground"
                          title="Regenerar"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
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
                      {[0, 1, 2].map((i) => (
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

              {error && (
                <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex gap-2 flex-wrap">
                {quickActions.map((a) => (
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
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Pergunte algo à Calu IA..."
                  disabled={isTyping}
                  className="flex-1 rounded-xl border border-input bg-background py-2.5 px-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiAssistant;
