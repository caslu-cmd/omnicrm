import { useState, useRef, useEffect, useCallback } from "react";
import { AIInputField } from "@/components/AIInputField";
import { AITextareaField } from "@/components/AITextareaField";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, Trash2, FileText, Send, Bot, User, Copy, RotateCcw,
  Sparkles, ChevronRight, X, Eye, EyeOff, Lightbulb, List, HelpCircle,
  Megaphone, Loader2, CheckCheck, MoreVertical, PenLine, BookMarked,
  MessageSquare, Wand2, FileQuestion, ClipboardList, Newspaper
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────
interface Source {
  id: string;
  title: string;
  content: string;
  type: "text" | "note";
  active: boolean;
  createdAt: string;
  charCount: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

type GeneratorType = "summary" | "keypoints" | "faq" | "briefing" | "study";

interface GeneratedOutput {
  type: GeneratorType;
  content: string;
  generatedAt: string;
}

// ── Constants ─────────────────────────────────────────────────
const STORAGE_KEY = "notebook_sources";
const CHAT_STORAGE_KEY = "notebook_chat";

const GENERATOR_OPTIONS: { type: GeneratorType; label: string; description: string; icon: any; prompt: string }[] = [
  {
    type: "summary",
    label: "Resumo Executivo",
    description: "Síntese clara dos pontos principais",
    icon: Newspaper,
    prompt: "Com base nas fontes fornecidas, crie um resumo executivo claro e objetivo. Use markdown com títulos e bullet points. Máximo 400 palavras.",
  },
  {
    type: "keypoints",
    label: "Pontos-Chave",
    description: "Os insights mais importantes em bullets",
    icon: List,
    prompt: "Extraia os 7-10 pontos-chave mais importantes das fontes. Liste cada um com um título em negrito e uma explicação de 1-2 linhas.",
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Perguntas e respostas geradas automaticamente",
    icon: HelpCircle,
    prompt: "Crie um FAQ de 5-8 perguntas e respostas com base nas fontes. Formato: **P:** pergunta\\n**R:** resposta. Foco nas dúvidas mais prováveis de um leitor.",
  },
  {
    type: "briefing",
    label: "Briefing de Campanha",
    description: "Pronto para apresentar ao cliente",
    icon: Megaphone,
    prompt: "Com base nas fontes, crie um briefing de campanha de marketing completo com: Objetivo, Público-alvo, Tom de voz, Mensagem central, Canais recomendados, e KPIs sugeridos.",
  },
  {
    type: "study",
    label: "Guia de Estudo",
    description: "Estrutura de aprendizado organizada",
    icon: BookMarked,
    prompt: "Crie um guia de estudo estruturado a partir das fontes. Divida em módulos com títulos, conceitos principais, e perguntas de fixação para cada seção.",
  },
];

// ── Utilities ─────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const buildSystemPrompt = (sources: Source[]) => {
  const active = sources.filter((s) => s.active);
  if (!active.length) return undefined;
  const ctx = active.map((s, i) => `### Fonte ${i + 1}: ${s.title}\n\n${s.content}`).join("\n\n---\n\n");
  return `Você é a Calu IA, assistente de marketing da Calu Agência. O usuário carregou as seguintes fontes de conhecimento para esta sessão. Use-as como contexto principal para responder — cite fontes quando relevante.

## Fontes Carregadas

${ctx}

---

Responda sempre em português brasileiro. Seja prática e direta. Use markdown quando ajudar na leitura.`;
};

// ── Source Card ───────────────────────────────────────────────
const SourceCard = ({
  source,
  onToggle,
  onDelete,
}: {
  source: Source;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -12 }}
    className="group relative rounded-xl p-3 border transition-all cursor-default"
    style={{
      background: source.active ? "rgba(185,255,75,0.04)" : "rgba(255,255,255,0.02)",
      borderColor: source.active ? "rgba(185,255,75,0.2)" : "rgba(255,255,255,0.06)",
    }}
  >
    <div className="flex items-start gap-2.5">
      <div
        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: source.active ? "rgba(185,255,75,0.12)" : "rgba(255,255,255,0.05)",
        }}
      >
        <FileText className="h-3.5 w-3.5" style={{ color: source.active ? "#B9FF4B" : "rgba(255,255,255,0.3)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate" style={{ color: source.active ? "#F0F0F0" : "rgba(255,255,255,0.4)" }}>
          {source.title}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
          {source.charCount.toLocaleString()} caracteres
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onToggle(source.id)}
          className="p-1 rounded hover:bg-white/5 transition-colors"
          title={source.active ? "Desativar fonte" : "Ativar fonte"}
        >
          {source.active
            ? <Eye className="h-3.5 w-3.5" style={{ color: "#B9FF4B" }} />
            : <EyeOff className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />}
        </button>
        <button
          onClick={() => onDelete(source.id)}
          className="p-1 rounded hover:bg-red-500/10 transition-colors"
          title="Remover fonte"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500/60 hover:text-red-500" />
        </button>
      </div>
    </div>
  </motion.div>
);

// ── Add Source Modal ──────────────────────────────────────────
const AddSourceModal = ({
  onAdd,
  onClose,
}: {
  onAdd: (title: string, content: string) => void;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleAdd = () => {
    if (!content.trim()) return;
    onAdd(title.trim() || "Fonte sem título", content.trim());
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#0E0F11", border: "1px solid rgba(185,255,75,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "#B9FF4B" }}
            >
              <Plus className="h-4 w-4" style={{ color: "#07080A" }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>Adicionar Fonte</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>
              Título da fonte
            </label>
            <AIInputField
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Briefing do cliente GNX, Guidelines da marca..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#B9FF4B]/40 focus:ring-1 focus:ring-[#B9FF4B]/20 transition-all"
              fieldLabel="Título da fonte"
              fieldContext="Notebook da Calu Agência — adicionando fonte de conhecimento para o agente"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>
              Conteúdo
            </label>
            <AITextareaField
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cole aqui o texto, briefing, análise de concorrentes, guidelines da marca, pesquisa de mercado..."
              rows={10}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#B9FF4B]/40 focus:ring-1 focus:ring-[#B9FF4B]/20 transition-all resize-none"
              fieldLabel="Conteúdo da fonte"
              fieldContext={`Notebook da Calu Agência — fonte: "${title || "nova fonte"}"`}
            />
            <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
              {content.length.toLocaleString()} caracteres
            </p>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-3 px-5 py-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={!content.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "#B9FF4B", color: "#07080A" }}
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Generator Panel ───────────────────────────────────────────
const GeneratorPanel = ({
  sources,
  outputs,
  onGenerate,
  generating,
}: {
  sources: Source[];
  outputs: GeneratedOutput[];
  onGenerate: (type: GeneratorType) => void;
  generating: GeneratorType | null;
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const activeCount = sources.filter((s) => s.active).length;

  const copyOutput = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copiado!");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Generator buttons */}
      <div className="p-5 space-y-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="h-4 w-4" style={{ color: "#B9FF4B" }} />
          <h3 className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>Gerador Automático</h3>
        </div>
        {activeCount === 0 && (
          <div
            className="rounded-xl p-3 text-xs text-center"
            style={{ background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)", border: "1px dashed rgba(255,255,255,0.08)" }}
          >
            Adicione e ative pelo menos uma fonte para gerar conteúdo
          </div>
        )}
        <div className="grid grid-cols-1 gap-2">
          {GENERATOR_OPTIONS.map((opt) => {
            const isGenerating = generating === opt.type;
            const hasOutput = outputs.find((o) => o.type === opt.type);
            return (
              <button
                key={opt.type}
                onClick={() => onGenerate(opt.type)}
                disabled={activeCount === 0 || !!generating}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all group border disabled:opacity-40"
                style={{
                  background: isGenerating ? "rgba(185,255,75,0.08)" : "rgba(255,255,255,0.02)",
                  borderColor: isGenerating ? "rgba(185,255,75,0.3)" : hasOutput ? "rgba(185,255,75,0.12)" : "rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => {
                  if (!isGenerating && activeCount > 0) {
                    e.currentTarget.style.background = "rgba(185,255,75,0.05)";
                    e.currentTarget.style.borderColor = "rgba(185,255,75,0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGenerating) {
                    e.currentTarget.style.background = hasOutput ? "rgba(185,255,75,0.03)" : "rgba(255,255,255,0.02)";
                    e.currentTarget.style.borderColor = isGenerating ? "rgba(185,255,75,0.3)" : hasOutput ? "rgba(185,255,75,0.12)" : "rgba(255,255,255,0.06)";
                  }
                }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: isGenerating ? "#B9FF4B" : "rgba(185,255,75,0.08)" }}
                >
                  {isGenerating
                    ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#07080A" }} />
                    : <opt.icon className="h-4 w-4" style={{ color: "#B9FF4B" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: "#F0F0F0" }}>{opt.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{opt.description}</p>
                </div>
                {hasOutput && !isGenerating && (
                  <CheckCheck className="h-4 w-4 shrink-0" style={{ color: "#B9FF4B" }} />
                )}
                {!hasOutput && !isGenerating && (
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#B9FF4B" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Outputs */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <AnimatePresence mode="popLayout">
          {outputs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                style={{ background: "rgba(185,255,75,0.06)", border: "1px dashed rgba(185,255,75,0.15)" }}
              >
                <Sparkles className="h-6 w-6" style={{ color: "rgba(185,255,75,0.4)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                Os resultados gerados aparecerão aqui
              </p>
            </motion.div>
          )}
          {[...outputs].reverse().map((output) => {
            const opt = GENERATOR_OPTIONS.find((o) => o.type === output.type)!;
            return (
              <motion.div
                key={`${output.type}-${output.generatedAt}`}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl overflow-hidden"
                style={{ border: "1px solid rgba(185,255,75,0.12)", background: "rgba(185,255,75,0.02)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(185,255,75,0.08)" }}
                >
                  <div className="flex items-center gap-2">
                    <opt.icon className="h-4 w-4" style={{ color: "#B9FF4B" }} />
                    <span className="text-xs font-semibold" style={{ color: "#F0F0F0" }}>{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{output.generatedAt}</span>
                    <button
                      onClick={() => copyOutput(output.content, output.type)}
                      className="ml-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {copiedId === output.type
                        ? <CheckCheck className="h-3.5 w-3.5" style={{ color: "#B9FF4B" }} />
                        : <Copy className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />}
                    </button>
                    <button
                      onClick={() => onGenerate(output.type)}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      title="Regenerar"
                    >
                      <RotateCcw className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-4">
                  <pre
                    className="text-xs whitespace-pre-wrap font-sans leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {output.content}
                  </pre>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ── Chat Panel ────────────────────────────────────────────────
const ChatPanel = ({ sources }: { sources: Source[] }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content: "Olá! Sou a Calu IA no modo Notebook. Adicione suas fontes no painel ao lado e me faça perguntas sobre elas.\n\nPosso ajudar a:\n• **Responder perguntas** baseadas nas fontes\n• **Extrair insights** e conexões\n• **Criar conteúdo** a partir do material\n• **Comparar informações** entre fontes",
      timestamp: now(),
    },
  ]);
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = { id: uid(), role: "user", content: text, timestamp: now() };
    const updatedHistory = [...history, { role: "user" as const, content: text }];

    setMessages((prev) => [...prev, userMsg]);
    setHistory(updatedHistory);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      const systemPrompt = buildSystemPrompt(sources);
      const { data, error: fnError } = await supabase.functions.invoke("chat-ai", {
        body: {
          messages: updatedHistory,
          ...(systemPrompt ? { systemPrompt } : {}),
          maxTokens: 2048,
        },
      });
      if (fnError) throw new Error(fnError.message);
      if (!data?.content) throw new Error("Resposta inválida da IA");

      const aiMsg: ChatMessage = { id: uid(), role: "assistant", content: data.content, timestamp: now() };
      setMessages((prev) => [...prev, aiMsg]);
      setHistory((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (err) {
      setError(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: uid(),
      role: "assistant",
      content: "Conversa reiniciada. Como posso ajudar com suas fontes?",
      timestamp: now(),
    }]);
    setHistory([]);
    setError(null);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copiado!");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "rgba(185,255,75,0.12)" }}
          >
            <MessageSquare className="h-3.5 w-3.5" style={{ color: "#B9FF4B" }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>Chat com Fontes</span>
          {sources.filter((s) => s.active).length > 0 && (
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B" }}
            >
              {sources.filter((s) => s.active).length} fonte{sources.filter((s) => s.active).length > 1 ? "s" : ""} ativa{sources.filter((s) => s.active).length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpar
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "assistant" && (
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
                  style={{ background: "rgba(185,255,75,0.12)" }}
                >
                  <Bot className="h-3.5 w-3.5" style={{ color: "#B9FF4B" }} />
                </div>
              )}
              <div className={cn("max-w-[80%] space-y-1.5", msg.role === "user" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line",
                    msg.role === "user"
                      ? "rounded-br-md"
                      : "rounded-bl-md"
                  )}
                  style={
                    msg.role === "user"
                      ? { background: "#B9FF4B", color: "#07080A", fontWeight: 500 }
                      : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.06)" }
                  }
                >
                  {msg.content}
                </div>
                <div className={cn("flex items-center gap-1", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>{msg.timestamp}</span>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => copyMessage(msg.content)}
                      className="p-1 rounded hover:bg-white/5 transition-colors"
                    >
                      <Copy className="h-3 w-3" style={{ color: "rgba(255,255,255,0.25)" }} />
                    </button>
                  )}
                </div>
              </div>
              {msg.role === "user" && (
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
                  style={{ background: "#B9FF4B" }}
                >
                  <User className="h-3.5 w-3.5" style={{ color: "#07080A" }} />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "rgba(185,255,75,0.12)" }}
            >
              <Bot className="h-3.5 w-3.5" style={{ color: "#B9FF4B" }} />
            </div>
            <div
              className="rounded-2xl rounded-bl-md px-4 py-3"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full"
                    style={{ background: "#B9FF4B", opacity: 0.4 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <div
            className="text-xs rounded-xl px-4 py-3"
            style={{ background: "rgba(239,68,68,0.08)", color: "#F87171", border: "1px solid rgba(239,68,68,0.15)" }}
          >
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-4 shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="flex items-end gap-3 rounded-2xl p-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre as fontes carregadas... (Enter para enviar)"
            disabled={isTyping}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none disabled:opacity-50"
            style={{ maxHeight: 120, minHeight: 24 }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-30"
            style={{ background: "#B9FF4B", color: "#07080A" }}
          >
            {isTyping
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[10px] text-center mt-2" style={{ color: "rgba(255,255,255,0.15)" }}>
          Shift+Enter para nova linha · Enter para enviar
        </p>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const NotebookPage = () => {
  const [sources, setSources] = useState<Source[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      return [];
    }
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "generator">("chat");
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);
  const [generating, setGenerating] = useState<GeneratorType | null>(null);
  const [notebookTitle, setNotebookTitle] = useState("Meu Notebook");
  const [editingTitle, setEditingTitle] = useState(false);

  // Persist sources
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sources));
  }, [sources]);

  const addSource = (title: string, content: string) => {
    const newSource: Source = {
      id: uid(),
      title,
      content,
      type: "text",
      active: true,
      createdAt: new Date().toISOString(),
      charCount: content.length,
    };
    setSources((prev) => [...prev, newSource]);
    toast.success("Fonte adicionada!");
  };

  const toggleSource = (id: string) => {
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  };

  const deleteSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    toast.success("Fonte removida");
  };

  const generateOutput = useCallback(async (type: GeneratorType) => {
    const activeSources = sources.filter((s) => s.active);
    if (!activeSources.length) {
      toast.error("Ative pelo menos uma fonte para gerar conteúdo");
      return;
    }

    const opt = GENERATOR_OPTIONS.find((o) => o.type === type)!;
    setGenerating(type);
    if (activeTab !== "generator") setActiveTab("generator");

    try {
      const systemPrompt = buildSystemPrompt(sources);
      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: {
          messages: [{ role: "user", content: opt.prompt }],
          ...(systemPrompt ? { systemPrompt } : {}),
          maxTokens: 2048,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.content) throw new Error("Resposta inválida");

      setOutputs((prev) => {
        const filtered = prev.filter((o) => o.type !== type);
        return [...filtered, { type, content: data.content, generatedAt: now() }];
      });
      toast.success(`${opt.label} gerado!`);
    } catch (err) {
      toast.error(`Erro ao gerar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(null);
    }
  }, [sources, activeTab]);

  const activeCount = sources.filter((s) => s.active).length;
  const totalChars = sources.filter((s) => s.active).reduce((acc, s) => acc + s.charCount, 0);

  return (
    <div className="flex flex-col h-full" style={{ background: "#07080A" }}>
      {/* Page Header */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "#B9FF4B" }}
          >
            <BookOpen className="h-5 w-5" style={{ color: "#07080A" }} />
          </div>
          <div>
            {editingTitle ? (
              <input
                autoFocus
                value={notebookTitle}
                onChange={(e) => setNotebookTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                className="text-lg font-bold bg-transparent border-b border-[#B9FF4B]/40 focus:outline-none pb-0.5"
                style={{ color: "#F0F0F0", width: Math.max(200, notebookTitle.length * 11) + "px" }}
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="flex items-center gap-2 group"
              >
                <h1 className="text-lg font-bold" style={{ color: "#F0F0F0" }}>{notebookTitle}</h1>
                <PenLine className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(255,255,255,0.3)" }} />
              </button>
            )}
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              {sources.length} fonte{sources.length !== 1 ? "s" : ""} · {activeCount} ativa{activeCount !== 1 ? "s" : ""} · {(totalChars / 1000).toFixed(1)}k chars
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
            style={{ background: "rgba(185,255,75,0.06)", border: "1px solid rgba(185,255,75,0.12)", color: "#B9FF4B" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Powered by Claude</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sources Sidebar */}
        <div
          className="w-72 shrink-0 flex flex-col"
          style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Sources header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: "#B9FF4B" }} />
              <span className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>Fontes</span>
              {sources.length > 0 && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B" }}
                >
                  {sources.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
              style={{ background: "#B9FF4B", color: "#07080A" }}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </button>
          </div>

          {/* Sources list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
            <AnimatePresence mode="popLayout">
              {sources.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl mb-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)" }}
                  >
                    <FileText className="h-6 w-6" style={{ color: "rgba(255,255,255,0.15)" }} />
                  </div>
                  <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Nenhuma fonte adicionada
                  </p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.18)" }}>
                    Adicione briefings, guidelines, pesquisas ou qualquer texto
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: "rgba(185,255,75,0.1)", color: "#B9FF4B", border: "1px solid rgba(185,255,75,0.2)" }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar primeira fonte
                  </button>
                </motion.div>
              ) : (
                sources.map((source) => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    onToggle={toggleSource}
                    onDelete={deleteSource}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Sources footer */}
          {sources.length > 0 && (
            <div
              className="px-4 py-3 shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSources((prev) => prev.map((s) => ({ ...s, active: true })))}
                  className="text-[11px] font-medium transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#B9FF4B")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                >
                  Ativar todas
                </button>
                <button
                  onClick={() => setSources((prev) => prev.map((s) => ({ ...s, active: false })))}
                  className="text-[11px] font-medium transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                >
                  Desativar todas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div
            className="flex items-center gap-1 px-5 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              )}
              style={{
                background: activeTab === "chat" ? "rgba(185,255,75,0.1)" : "transparent",
                color: activeTab === "chat" ? "#B9FF4B" : "rgba(255,255,255,0.4)",
                border: activeTab === "chat" ? "1px solid rgba(185,255,75,0.2)" : "1px solid transparent",
              }}
            >
              <MessageSquare className="h-4 w-4" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab("generator")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              )}
              style={{
                background: activeTab === "generator" ? "rgba(185,255,75,0.1)" : "transparent",
                color: activeTab === "generator" ? "#B9FF4B" : "rgba(255,255,255,0.4)",
                border: activeTab === "generator" ? "1px solid rgba(185,255,75,0.2)" : "1px solid transparent",
              }}
            >
              <Wand2 className="h-4 w-4" />
              Gerador
              {generating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "chat" ? (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15 }}
                  className="h-full"
                >
                  <ChatPanel sources={sources} />
                </motion.div>
              ) : (
                <motion.div
                  key="generator"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.15 }}
                  className="h-full overflow-hidden"
                >
                  <GeneratorPanel
                    sources={sources}
                    outputs={outputs}
                    onGenerate={generateOutput}
                    generating={generating}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Add source modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddSourceModal onAdd={addSource} onClose={() => setShowAddModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotebookPage;
