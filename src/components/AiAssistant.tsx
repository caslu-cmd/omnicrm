import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, X, Send, Minimize2, Maximize2, Bot, User,
  ThumbsUp, ThumbsDown, Copy, RotateCcw, Lightbulb,
  TrendingUp, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
    content: "Olá! Sou a Caroline IA, sua assistente de marketing e CRM.\n\nPosso ajudar com:\n\n• **Estratégia de conteúdo** para seus clientes\n• **Copy pronto** para posts, stories e campanhas\n• **Análise de clientes** e próximos passos\n• **Briefing e posicionamento** de marca\n\nComo posso ajudar?",
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const { data, error: fnError } = await supabase.functions.invoke("chat-ai", {
        body: { messages: updatedHistory },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.content) throw new Error("Resposta inválida da IA");

      const assistantMessage: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: data.content,
        timestamp: "Agora",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setHistory((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (err) {
      setError("Não consegui me conectar. Verifique a configuração da chave da API.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => sendMessage(input);
  const handleQuickAction = (label: string) => sendMessage(label);

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full transition-all"
            style={{ background: "#B9FF4B", color: "#07080A", boxShadow: "0 0 24px -4px rgba(185,255,75,0.55), 0 4px 16px rgba(0,0,0,0.4)" }}
          >
            <Sparkles className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className={cn(
              "fixed z-50 flex flex-col rounded-2xl overflow-hidden",
              isExpanded
                ? "bottom-4 right-4 left-4 top-4 sm:left-auto sm:w-[560px] sm:top-4"
                : "bottom-6 right-6 w-[400px] h-[560px]"
            )}
            style={{ background: "#0C0D0F", border: "1px solid rgba(185,255,75,0.14)", boxShadow: "0 24px 64px -8px rgba(0,0,0,0.8)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(185,255,75,0.1)", background: "rgba(185,255,75,0.04)" }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "#B9FF4B" }}>
                  <Sparkles className="h-4 w-4" style={{ color: "#07080A" }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>Caroline IA</h3>
                  <p className="text-[10px]" style={{ color: "#B9FF4B", opacity: 0.7 }}>Powered by Claude · Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
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
                  placeholder="Pergunte algo à Caroline IA..."
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
    </>
  );
};

export default AiAssistant;
